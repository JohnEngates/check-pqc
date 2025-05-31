# Post-Quantum Cryptography Detection

This document explains how the `check-pqc.js` script determines if a website is using Post-Quantum Cryptography (PQC).

## Detection Method

The script detects PQC implementation by examining the key exchange group used in the TLS connection. Specifically, it looks for the presence of "MLKEM" in the key exchange group identifier:

```javascript
const pqcDetected = keyExchangeGroup.includes("MLKEM");
```

### What is MLKEM?

MLKEM (Module Learning with Errors, Kyber version) is a lattice-based key encapsulation mechanism that is considered quantum-resistant. It was selected by NIST as the first standardized post-quantum key establishment algorithm.

### How it Works

1. The script establishes a connection to the target website using Puppeteer
2. It creates a Chrome DevTools Protocol (CDP) session to access security information
3. Through the CDP's Security API, it retrieves the certificate security state
4. From the security state, it extracts the `keyExchangeGroup` property
5. If the key exchange group contains "MLKEM", it indicates the site is using post-quantum cryptography

### Example Key Exchange Groups

- Classical (non-PQC): `"X25519"`, `"P-256"`, `"P-384"`
- Post-Quantum: `"MLKEM768"`, `"X25519_MLKEM768"`

## Limitations

- The detection only works for MLKEM-based post-quantum implementations
- Other post-quantum algorithms might be in use but not detected by this method
- The site must support TLS 1.3 for accurate key exchange group information

## Further Reading

- [NIST PQC Standardization](https://csrc.nist.gov/Projects/post-quantum-cryptography)
- [MLKEM/Kyber Specification](https://pq-crystals.org/kyber/)
