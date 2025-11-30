# EVM Vanity Generator

> A high-performance, multi-threaded vanity address generator for Ethereum and EVM-compatible chains.

## 🚀 Features

- **⚡ Multi-threaded Performance** - Leverages all CPU cores for maximum speed
- **🎯 Flexible Matching** - Support for prefix, suffix, or combined patterns
- **🔤 Case Sensitivity** - Optional case-sensitive matching for more precise results
- **📊 Real-time Stats** - Live speed monitoring and probability tracking
- **🎨 Beautiful CLI** - Clean, colorful terminal output with progress indicators
- **📦 Minimal Dependencies** - Only uses `viem` for cryptographic operations
- **🛠️ Simple Setup** - Works with npx, no installation required

## 📥 Installation

### Option 1: Direct Usage (No Installation)

```bash
npx evm-vanity-gen -p cafe
```

### Option 2: Global Installation

```bash
npm install -g evm-vanity-gen
```

Then use with either command:

```bash
evm-vanity -p cafe
evmgen -p abc
```

### Option 3: Local Development

```bash
git clone https://github.com/yourusername/evm-vanity-gen.git
cd evm-vanity-gen
pnpm install
node index.js -p 888
```

## 💻 Usage

### Basic Examples

```bash
# Generate address starting with "0xcafe..."
npx evm-vanity-gen -p cafe

# Generate address ending with "...888"
npx evm-vanity-gen -s 888

# Generate address like "0xabc...999" (prefix + suffix)
npx evm-vanity-gen -p abc -s 999

# Case-sensitive matching (slower but exact)
npx evm-vanity-gen -p CaFe -c

# Use specific number of threads
npx evm-vanity-gen -p ace -t 4
```

## 🔧 CLI Options

| Option | Alias | Description | Example |
|--------|-------|-------------|---------|
| `--prefix <str>` | `-p` | Address prefix (hex, without 0x) | `-p cafe` |
| `--suffix <str>` | `-s` | Address suffix (hex) | `-s abc` |
| `--case-sensitive` | `-c` | Match case exactly (slower) | `-c` |
| `--threads <num>` | `-t` | Number of worker threads | `-t 8` |
| `--help` | `-h` | Display help message | `-h` |

## 📊 Performance

Performance varies based on:
- **Pattern Length**: Each additional hex character increases difficulty by 16x
- **CPU Cores**: More threads = faster generation
- **Case Sensitivity**: Case-insensitive matching is ~16x faster per character

### Approximate Generation Times

| Pattern | Difficulty | Avg. Time (8 cores) |
|---------|-----------|---------------------|
| 3 chars | 1 in 4K | < 1 second |
| 4 chars | 1 in 65K | ~5-10 seconds |
| 5 chars | 1 in 1M | ~1-2 minutes |
| 6 chars | 1 in 16M | ~15-30 minutes |
| 7 chars | 1 in 268M | ~4-8 hours |

*Times are approximate and depend on hardware*

## 🔒 Security Warning

⚠️ **IMPORTANT**: This tool generates cryptographically secure private keys using Node.js crypto APIs via the `viem` library.

**Security Best Practices:**
- Always verify the generated private key controls the displayed address
- Never share your private key with anyone
- Store private keys securely (hardware wallet, encrypted storage)
- Test with small amounts before using in production
- Consider using a hardware wallet for high-value accounts

## 🎨 Output Example

```
╭──────────────────────────────────────────────╮
│ EVM Vanity Generator                         │
├──────────────────────────────────────────────┤
│ Target       :  0xcafe...                    │
│ Difficulty   :  1 in 65.5k                   │
│ Case Match   :  NO                           │
│ Threads      :  8 (Auto)                     │
╰──────────────────────────────────────────────╯

 >>> Speed: 15.2k/s  | Scanned: 52.3k  | Probability: 99.12%

╭──────────────────────────────────────────────────────────────────────────────────╮
│ SUCCESS! Found in 4.25s                                                          │
│ Scanned: 52.3k keys                                                              │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Address     : 0xcafe1234567890abcdef1234567890abcdef1234                         │
│ Private Key : 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef │
╰──────────────────────────────────────────────────────────────────────────────────╯
```

## 🛠️ Technical Details

- **Language**: JavaScript (ES Modules)
- **Runtime**: Node.js v18+ (uses Worker Threads API)
- **Crypto Library**: [viem](https://viem.sh/) for Ethereum account generation
- **Architecture**: Main thread coordinates multiple worker threads, each generating keys independently

## 📝 License

MIT © [Kadxy](https://github.com/kadxy)

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## ⭐ Support

If you find this tool useful, please consider giving it a star on GitHub!

---

**Disclaimer**: This tool is provided as-is for educational and personal use. Always exercise caution when handling private keys and cryptocurrency.
