# Tokeniza Smart Contracts Documentation

This repository contains the core smart contracts used by **Tokeniza** in the tokenization of Real World Assets (RWA) on the Moonbeam Network.

This hub also provides documentation on our architecture and processes to give developers and investors a clear understanding of our ecosystem.

---

## Ecosystem Overview & Documentation

To understand how these contracts are used by our platform, please see the following documents:

* **[PROCESS.md](./PROCESS.md):** **(Start Here)** Explains *how* funding, minting, and trading work. It details the off-chain logic that connects to these on-chain contracts.
* **[ARCHITECTURE.md](./ARCHITECTURE.md):** Provides a detailed breakdown of our "schema" and system architecture, from the front-end to the "Token Controller" and the blockchain.
* **[SECURITY.md](./SECURITY.md):** Details our security-first approach, including on-chain access control and off-chain data protection.

---

## Our Tech Stack

Our platform is built on modern, secure, and scalable technologies.

* **Front-End:** Angular.js, Zoe.js, Webpack
* **Back-End:** .NET, Node.js, Nginx
* **Blockchain:** Moonbeam (Polkadot), Solidity
* **Infrastructure:** AWS, Docker (implied)

---

## Core Smart Contracts

Below is the documentation describing the **purpose** and **functions** of each contract.

### 1. MyToken.sol (ERC-20)

* **Purpose:** The **MyToken** contract implements a **fungible token (ERC-20)**. It represents digital value within the Tokeniza ecosystem and is used as the base unit for transactions, liquidity, and governance.
* **Usage:** Base token for RWA transactions, medium of payment, and staking.
* **Key Functions:** `transfer`, `approve`, `transferFrom`, `mint` (Owner-only), `burn`.

### 2. NFT.sol (ERC-721)

* **Purpose:** The **NFT** contract implements a **non-fungible token (ERC-721)**. It represents **unique tokenized assets**, such as real estate fractions, precatórios, or agricultural projects.
* **Usage:** Represents unique assets, provides digital proof of ownership, and enables fractionalized investment.
* **Key Functions:** `mint` (Minter-only), `tokenURI`, `transferFrom`, `ownerOf`.

---

## Roadmap (High-Level)

* **Q4 2025:** Launch of V2 Marketplace with enhanced trading features.
* **Q1 2026:** Integration with Polkadot ecosystem for cross-chain assets.
* **Q2 2026:** Introduction of governance features via `MyToken`.
* **Q3 2026:** Expansion into new asset classes.

---

## Frequently Asked Questions (FAQ)

**Q: Why are my `mint` transactions failing on Moonscan?**
A: This is intentional. As described in our **[SECURITY.md](./SECURITY.md)** and **[PROCESS.md](./PROCESS.md)** files, minting is restricted to our backend "Token Controller" service. This ensures that every token created is backed by a verified asset and a completed off-chain funding transaction.

**Q: How do I get tokens?**
A: Tokens are distributed to your wallet by the Tokeniza platform after you successfully participate in a crowdfunding offering or purchase an asset on our marketplace.

**Q: Are these contracts audited?**
A: Our contracts are built on heavily audited OpenZeppelin libraries. We are committed to performing regular external audits as our platform evolves.

---

## License
This repository is licensed under MIT.
