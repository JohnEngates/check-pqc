# PQC Checker

A command-line tool to check websites for Post-Quantum Cryptography (PQC) implementation by analyzing their TLS configurations.

## Features

- Check single or multiple URLs for PQC implementation
- Detailed TLS/security configuration analysis including server identification
- Support for both direct URL input and file-based URL lists
- Automatic logging of results
- QUIC protocol detection
- Server header detection and reporting

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

The following dependency will be installed automatically via npm:
- puppeteer (v21.0.0 or higher): Required for browser automation and security analysis

## Installation

1. Clone or download this repository:
```bash
git clone https://github.com/yourusername/check-pqc.git
```

2. Navigate to the project directory:
```bash
cd check-pqc
```

3. Verify package.json exists in the directory:
```bash
ls package.json
```
This file contains the list of dependencies (including puppeteer) that npm needs to install.

4. Install dependencies:
```bash
npm install
```

The installation process will read package.json and automatically install:
- `puppeteer` (v21.0.0): Required for browser automation and security analysis

If package.json is missing, the installation will fail. Make sure you've cloned or downloaded the complete repository.

## Usage

### Check a Single URL

```bash
node check-pqc.js https://example.com
```

### Check Multiple URLs from a File

1. Create a text file with one URL per line, for example `urls.txt`:
```
https://example.com
https://example.org
https://example.net
```

2. Run the script with the file:
```bash
node check-pqc.js urls.txt
```

## Output

The script provides:
- Real-time console output with detailed security information
- Results saved to `pqc_results.log` in the current directory

Example output:
```
🔍 Checking: https://example.com
----------------------------------------
🔒 Security State: SECURE
🖥️ Server: cloudflare
🌐 Transport Protocol: TLS 1.3
🔑 Key Exchange: ECDHE
🔄 Key Exchange Group: X25519
🔐 Cipher Suite: TLS_AES_128_GCM_SHA256
📜 Certificate Subject: example.com
🏛️ Issuer: DigiCert TLS RSA SHA256 2020 CA1
📅 Valid From: 2024-01-01T00:00:00.000Z
📅 Valid To: 2025-01-01T23:59:59.000Z
----------------------------------------
❌ This site is NOT using Post-Quantum Encryption.
```

## Understanding Results

For detailed information about how PQC detection works, please see [PQC-DETECTION.md](PQC-DETECTION.md).

## Troubleshooting

If you encounter any issues:

1. Ensure you have the latest version of Node.js installed
2. Check that the URL is accessible in a regular browser
3. Verify the URL includes the protocol (http:// or https://)
4. For file input, ensure the file exists and contains valid URLs

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
