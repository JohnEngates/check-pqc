/**
 * check-pqc.js
 * 
 * A tool to analyze websites for Post-Quantum Cryptography (PQC) implementation
 * by inspecting their TLS configurations and security states using Puppeteer.
 * 
 * The script can check a single URL or multiple URLs from a file, and generates
 * detailed reports about the security configuration including:
 * - Transport Protocol (TLS/QUIC)
 * - Key Exchange Methods
 * - Cipher Suites
 * - Certificate Details
 * - PQC Implementation Status
 * 
 * Usage:
 *   Single URL:     node check-pqc.js https://example.com
 *   Multiple URLs:  node check-pqc.js urls.txt
 * 
 * Results are displayed in the console and saved to pqc_results.log
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

/**
 * Converts Unix timestamps to ISO formatted date strings
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {string} Formatted date string or "N/A" if timestamp is invalid
 */
const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp * 1000);
    return date.toISOString();
};

/**
 * Checks a single URL for PQC implementation and security configuration
 * Uses Chrome DevTools Protocol (CDP) to gather detailed security information
 * 
 * @param {string} url - The URL to check
 * @param {WriteStream} logStream - Stream to write results to log file
 */
const checkTLS = async (url, logStream) => {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--disable-gpu',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--ignore-certificate-errors',
            '--ignore-certificate-errors-spki-list'
        ]
    });

    let result = `\n🔍 Checking: ${url}\n`;

    try {
        const page = await browser.newPage();
        
        // Set additional security headers
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        });

        // Configure page timeouts
        await page.setDefaultNavigationTimeout(30000);
        await page.setDefaultTimeout(30000);
        
        // Create CDP session for accessing security details
        const client = await page.target().createCDPSession();
        await client.send('Security.enable');

        // Capture the server header for later reporting
        let serverHeader = 'N/A';

        // Listen for security state changes and collect detailed information
        client.on('Security.visibleSecurityStateChanged', (event) => {
            const securityState = event.visibleSecurityState;
            const certState = securityState.certificateSecurityState || {};

            // Extract and normalize protocol information
            const protocol = certState.protocol || "Unknown";
            const tlsVersion = protocol.startsWith("TLS") ? protocol.replace("TLS ", "TLS ") : protocol;
            const isQUIC = protocol.includes("QUIC");
            
            // Extract security configuration details
            const keyExchange = certState.keyExchange || (isQUIC ? "Handled by QUIC" : "N/A");
            const keyExchangeGroup = certState.keyExchangeGroup || "N/A";
            const cipher = certState.cipher || "N/A";
            const subjectName = certState.subjectName || "N/A";
            const issuer = certState.issuer || "N/A";
            const validFrom = formatTimestamp(certState.validFrom);
            const validTo = formatTimestamp(certState.validTo);
            
            // Check for MLKEM-based key exchange (indicates PQC)
            const pqcDetected = keyExchangeGroup.includes("MLKEM");

            // Format the results
            result += `----------------------------------------\n`;
            result += `🔒 Security State: ${securityState.securityState.toUpperCase()}\n`;
            result += `🖥️ Server: ${serverHeader}\n`;
            result += `🌐 Transport Protocol: ${isQUIC ? "QUIC (Uses TLS 1.3 Encryption)" : tlsVersion}\n`;
            result += `🔑 Key Exchange: ${keyExchange}\n`;
            result += `🔄 Key Exchange Group: ${keyExchangeGroup}\n`;
            result += `🔐 Cipher Suite: ${cipher}\n`;
            result += `📜 Certificate Subject: ${subjectName}\n`;
            result += `🏛️ Issuer: ${issuer}\n`;
            result += `📅 Valid From: ${validFrom}\n`;
            result += `📅 Valid To: ${validTo}\n`;
            result += `----------------------------------------\n`;

            result += pqcDetected
                ? `✅ This site is using Post-Quantum Encryption (PQC)! 🎉\n`
                : `❌ This site is NOT using Post-Quantum Encryption.\n`;

            console.log(result);
            logStream.write(result + "\n");
        });

        // Navigate to the URL and capture response headers
        page.on('response', response => {
            const headers = response.headers();
            // Capture server header from any response, prioritizing the last one
            if (headers['server']) {
                serverHeader = headers['server'];
            }
        });

        // Navigate with additional options for better error handling
        await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Wait for security information to be collected
        await new Promise(resolve => setTimeout(resolve, 5000));

    } catch (error) {
        let errorMessage = error.message;
        if (error.message.includes('net::ERR_HTTP2_PROTOCOL_ERROR')) {
            errorMessage = 'HTTP/2 protocol error - This might be due to the site\'s security policies. Try accessing the site directly in a browser first.';
        }
        console.error(`❌ Error checking ${url}:`, errorMessage);
        logStream.write(`❌ Error checking ${url}: ${errorMessage}\n`);
    } finally {
        await browser.close();
    }
};

/**
 * Main function that processes input (either single URL or file with URLs)
 * and initiates the security checks
 */
const main = async () => {
    const logStream = fs.createWriteStream("pqc_results.log", { flags: 'a' });
    // Get URLs from command line arguments (skip node and script name)
    const urls = process.argv.slice(2);

    // Check if the first argument is a file path
    if (urls.length === 1 && fs.existsSync(urls[0])) {
        // Read URLs from file, split by newlines, and filter out empty lines
        const fileContent = fs.readFileSync(urls[0], 'utf-8');
        urls.length = 0;
        urls.push(...fileContent.split(/\r?\n/).filter(line => line.trim() !== ''));
    }

    if (urls.length === 0) {
        console.error("Usage: node check-pqc.js <URL> or <file-with-URLs>");
        process.exit(1);
    }

    console.log(`\n🔍 Checking ${urls.length} site(s)...\n`);
    for (const url of urls) {
        await checkTLS(url, logStream);
    }

    logStream.end();
    console.log("\n✅ All results saved to pqc_results.log\n");
};

main();
