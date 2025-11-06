# Security at Tokeniza

Tokeniza is committed to the highest standards of security for our users, their data, and their assets. Our security model combines on-chain smart contract safeguards with robust off-chain platform security.

## 1. On-Chain (Smart Contract) Security

Our primary on-chain security principle is **restricting privileged actions** to our trusted backend system. This prevents unauthorized asset creation or manipulation.

* **Access Control:** We use OpenZeppelin's widely-audited access control patterns.
* **ERC-20 (`MyToken.sol`):** The `mint` function is designated `onlyOwner`. This means only the single, secure address controlled by our "Token Controller" service can create new tokens.
* **ERC-721 (`NFT.sol`):** The `mintWithTokenURI` function uses `onlyMinter`. This allows for a more flexible (but still secure) system where the minting role can be assigned to our specific backend service, separate from contract ownership.

**This is why public attempts to mint tokens will fail.** This is a feature, not a bug, ensuring that every token corresponds to a verified off-chain asset or funding.

## 2. Off-Chain (Platform) Security

* **User Data:** All sensitive user data is encrypted at rest and in transit. We follow strict data privacy protocols for all PII (Personally Identifiable Information).
* **Compliance:** Our platform enforces mandatory KYC (Know Your Customer) and AML (Anti-Money Laundering) checks before any user can participate in funding or trading, ensuring a compliant and secure environment.
* **Authentication:** We implement multi-factor authentication (MFA) and secure session management to protect user accounts from unauthorized access.

## 3. Infrastructure Security

* **Cloud Infrastructure:** Our platform is hosted on secure, industry-leading cloud infrastructure (e.g., AWS), leveraging services like private networks (VPCs), firewalls, and DDoS protection.
* **Service Isolation:** Our microservice architecture (see `ARCHITECTURE.md`) ensures that components are isolated, limiting the potential impact of any single component failure.

## 4. Audits & Best Practices

Our smart contracts are written using battle-tested libraries (OpenZeppelin) and are designed to be fully auditable. We are committed to regular security audits to ensure the ongoing safety of the Tokeniza ecosystem.