#!/usr/bin/env node

import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

const INFO_BOX_WIDTH = 48;
const SUCCESS_BOX_WIDTH = 84;

const HELP_TEXT = `
Usage: npx evm-vanity-gen [options]

Description:
  A lightweight, multi-threaded vanity address generator for EVM chains.

Options:
  -p, --prefix <str>      Address prefix (hex, without 0x)
  -s, --suffix <str>      Address suffix (hex)
  -c, --case-sensitive    Match case exactly (slower)
  -t, --threads <num>     Number of worker threads (default: auto)
  -h, --help              Display this help message

Examples:
  npx evm-vanity-gen -p cafe
  npx evm-vanity-gen -s 888
  npx evm-vanity-gen -p abc -s 999
`;

const style = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    cyan: "\x1b[36m",
    box: "\x1b[90m",
};

function formatNum(num) {
    if (num > 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
    if (num > 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num > 1_000) return (num / 1_000).toFixed(1) + 'k';
    return num.toString();
}

function stripAnsi(str) {
    return str.replace(/\x1b\[[0-9;]*m/g, '');
}

function pad(content, width) {
    const visibleLength = stripAnsi(content).length;
    const padding = Math.max(0, width - 4 - visibleLength);
    return content + " ".repeat(padding);
}

function drawLine(start, end, width, char = '─') {
    return style.box + start + char.repeat(width - 2) + end + style.reset;
}

function drawRow(content, width) {
    return style.box + "│ " + style.reset + pad(content, width) + style.box + " │" + style.reset;
}

function parseArgs() {
    const args = process.argv.slice(2);
    const params = {
        prefix: '',
        suffix: '',
        caseSensitive: false,
        threads: os.cpus().length,
        isAutoThreads: true,
        showHelp: false
    };

    if (args.length === 0) return { ...params, showHelp: true };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--prefix':
            case '-p': params.prefix = args[++i] || ''; break;
            case '--suffix':
            case '-s': params.suffix = args[++i] || ''; break;
            case '--case-sensitive':
            case '-c': params.caseSensitive = true; break;
            case '--threads':
            case '-t':
                const t = parseInt(args[++i]);
                if (!isNaN(t) && t > 0) {
                    params.threads = t;
                    params.isAutoThreads = false;
                }
                break;
            case '--help':
            case '-h': params.showHelp = true; break;
        }
    }
    return params;
}

if (isMainThread) {
    const config = parseArgs();

    if (config.showHelp) {
        console.log(HELP_TEXT);
        process.exit(0);
    }

    const fullPattern = config.prefix + config.suffix;

    if (!fullPattern) {
        console.error(`${style.red}Error: Provide -p <prefix> or -s <suffix>${style.reset}`);
        process.exit(1);
    }
    if (!/^[0-9a-fA-F]+$/.test(fullPattern)) {
        console.error(`${style.red}Error: Invalid hex (0-9, a-f only)${style.reset}`);
        process.exit(1);
    }

    const targetPrefix = config.caseSensitive ? config.prefix : config.prefix.toLowerCase();
    const targetSuffix = config.caseSensitive ? config.suffix : config.suffix.toLowerCase();
    const cleanPrefix = targetPrefix.startsWith('0x') ? targetPrefix.slice(2) : targetPrefix;

    const totalHexChars = cleanPrefix.length + targetSuffix.length;
    const difficulty = Math.pow(16, totalHexChars);

    console.clear();
    console.log(drawLine("╭", "╮", INFO_BOX_WIDTH));
    console.log(drawRow(style.bold + "EVM Vanity Generator" + style.reset, INFO_BOX_WIDTH));
    console.log(drawLine("├", "┤", INFO_BOX_WIDTH));
    console.log(drawRow(`${style.dim}Target       :${style.reset}  0x${style.bold}${cleanPrefix}${style.reset}...${style.bold}${targetSuffix}${style.reset}`, INFO_BOX_WIDTH));
    console.log(drawRow(`${style.dim}Difficulty   :${style.reset}  1 in ${formatNum(difficulty)}`, INFO_BOX_WIDTH));
    console.log(drawRow(`${style.dim}Case Match   :${style.reset}  ${config.caseSensitive ? style.red + 'YES' : style.dim + 'NO'}`, INFO_BOX_WIDTH));
    console.log(drawRow(`${style.dim}Threads      :${style.reset}  ${config.threads} ${config.isAutoThreads ? style.dim + '(Auto)' : ''}`, INFO_BOX_WIDTH));
    console.log(drawLine("╰", "╯", INFO_BOX_WIDTH));
    console.log("");

    let totalCount = 0;
    const startTime = Date.now();
    const workers = [];
    let lastLog = 0;

    for (let i = 0; i < config.threads; i++) {
        const worker = new Worker(__filename, {
            workerData: {
                prefix: cleanPrefix,
                suffix: targetSuffix,
                isCaseSensitive: config.caseSensitive
            }
        });
        workers.push(worker);

        worker.on('message', (msg) => {
            if (msg.type === 'found') {
                const timeSpent = (Date.now() - startTime) / 1000;
                totalCount += msg.attempts;

                process.stdout.clearLine(0);
                process.stdout.cursorTo(0);

                console.log(drawLine("╭", "╮", SUCCESS_BOX_WIDTH));
                console.log(drawRow(`${style.green}SUCCESS! Found in ${timeSpent.toFixed(2)}s${style.reset}`, SUCCESS_BOX_WIDTH));
                console.log(drawRow(`${style.dim}Scanned: ${formatNum(totalCount)} keys${style.reset}`, SUCCESS_BOX_WIDTH));
                console.log(drawLine("├", "┤", SUCCESS_BOX_WIDTH));
                console.log(drawRow(`${style.dim}Address     :${style.reset} ${style.bold}${msg.address}${style.reset}`, SUCCESS_BOX_WIDTH));
                console.log(drawRow(`${style.dim}Private Key :${style.reset} ${style.dim}${msg.pk}${style.reset}`, SUCCESS_BOX_WIDTH));
                console.log(drawLine("╰", "╯", SUCCESS_BOX_WIDTH));

                workers.forEach(w => w.terminate());
                process.exit(0);

            } else if (msg.type === 'tick') {
                totalCount += msg.count;

                const now = Date.now();
                if (now - lastLog > 100) {
                    const elapsed = (now - startTime) / 1000;
                    const speed = totalCount / elapsed;

                    let prob = 1 - Math.exp(-totalCount / difficulty);
                    if (prob > 0.9999) prob = 0.9999;

                    const probStr = prob > 0.999
                        ? '>99.99%'
                        : (prob * 100).toFixed(2) + '%';

                    let speedStr;
                    if (speed > 1000) {
                        speedStr = (speed / 1000).toFixed(1) + 'k/s';
                    } else {
                        speedStr = Math.floor(speed) + '/s';
                    }

                    process.stdout.clearLine(0);
                    process.stdout.cursorTo(0);
                    process.stdout.write(
                        ` ${style.cyan}>>>${style.reset} Speed: ${speedStr.padEnd(9)}` +
                        ` | Scanned: ${formatNum(totalCount).padEnd(7)}` +
                        ` | ${style.bold}Probability: ${probStr}${style.reset}`
                    );
                    lastLog = now;
                }
            }
        });
    }

} else {
    const { prefix, suffix, isCaseSensitive } = workerData;
    const BATCH_SIZE = 2000;
    let localCount = 0;

    while (true) {
        const pk = generatePrivateKey();
        const account = privateKeyToAccount(pk);
        const addr = isCaseSensitive ? account.address : account.address.toLowerCase();

        const isPrefixMatch = !prefix || addr.startsWith('0x' + prefix);
        const isSuffixMatch = !suffix || addr.endsWith(suffix);

        localCount++;

        if (isPrefixMatch && isSuffixMatch) {
            parentPort.postMessage({
                type: 'found',
                address: account.address,
                pk,
                attempts: localCount
            });
        }

        if (localCount % BATCH_SIZE === 0) {
            parentPort.postMessage({ type: 'tick', count: BATCH_SIZE });
            localCount = 0;
        }
    }
}