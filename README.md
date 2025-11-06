# Tokeniza Smart Contracts Documentation

This repository contains the core smart contracts used by **Tokeniza** in the tokenization of Real World Assets (RWA) on the Moonbeam Network.

This hub also provides our complete ecosystem documentation to give developers and investors a clear understanding of our platform architecture, business processes, and compliance.

---

## CVM Authorized Platform

Tokeniza is an officially authorized platform by the **Comissão de Valores Mobiliários (CVM)** of Brazil, operating under CVM Resolution 187 (formerly Instruction 88).

**For full details, see our [COMPLIANCE.md](./COMPLIANCE.md) file.**

---

## Ecosystem Documentation (Investor Data Room)

To understand our full platform, please review the following documents.

### Business & Process (The "How")
* **[DATA_FLOWS.md](./DATA_FLOWS.md):** **(Start Here)** Visual diagrams showing the "funding" process (PIX-to-Mint), NFT marketplace trades, and KYC. This answers how transactions work.
* **[AUTOMATION_AND_SCHEDULERS.md](./AUTOMATION_AND_SCHEDULERS.md):** Details on the 63+ automated backend processes (Schedulers) that run our platform, handling payments, commissions, and reconciliation.
* **[COMPLIANCE.md](./COMPLIANCE.md):** Full details on our official CVM authorization and security audits.

### Tokenomics (The "Value")
* **[TOKENOMICS.md](./TOKENOMICS.md):** The complete TKNZ token allocation (1B supply), distribution model, and initial circulating supply.
* **[TOKEN_LIFECYCLE.md](./TOKEN_LIFECYCLE.md):** Our sustainability plan, detailing the token **Vesting** (release schedule) and **Burn** (buyback) mechanisms.

### Technical Schema (The "Schema")
* **[METADATA_STANDARD.md](./METADATA_STANDARD.md):** The official "schema" for our RWA NFTs, showing the JSON structure and attributes.
* **[TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md):** (Conteúdo do antigo `ARCHITECTURE.md`) A breakdown of our microservice architecture.
* **[SECURITY.md](./SECURITY.md):** (Conteúdo do antigo `SECURITY.md`) Details on access control and data protection.

---

## Our Tech Stack

Our platform is built on a robust, enterprise-grade microservice architecture.

* **Front-End:** Angular 19, TypeScript
* **Mobile:** Ionic / Capacitor 7.4.2 (for iOS & Android)
* **Back-End:** Node.js/TypeScript
* **Architecture:** 21+ Microservices using an Event-Driven Architecture (EDA) and API Gateways.
* **Blockchain:** Solidity on Moonbeam (Polkadot)
* **Infrastructure:** AWS, Docker

---

## Core Smart Contracts

Below is the documentation describing the **purpose** and **functions** of each contract.

### 1. MyToken.sol (ERC-20)


* **Purpose:** The **MyToken** contract implements a **fungible token (ERC-20)**. It represents digital value within the Tokeniza ecosystem and is used as the base unit for transactions, liquidity, and governance.
* **Usage:** Base token for RWA transactions, medium of payment, and staking.
* **Key Functions:** `transfer`, `approve`, `transferFrom`, `mint` (Owner-only), `burn`.

### 2. NFT.sol (ERC-721)


* **Purpose:** The **NFT** contract implements a **non-fungible token (ERC-721)**. It represents **unique tokenized assets**, such as real estate fractions or other RWA projects.
* **Usage:** Represents unique assets, provides digital proof of ownership, and enables fractionalized investment.
* **Key Functions:** `mintWithTokenURI` (Minter-only), `tokenURI`, `transferFrom`, `ownerOf`.

---

## Roadmap (2025 Detailed View)

Our current roadmap is focused on financial compliance and expanding DeFi features.

* **Feb 2025:**
    * Automated Tax Reporting (IN 1888, GCAP)
    * On-chain transaction hash visibility in history
    * Backoffice Exchange Management

* **Apr 2025:**
    * Launch of Investment Pools
    * 1-Click Automatic PIX-to-DeFi Pool (Uniswap/PancakeSwap)
    * Multi-currency payment aggregation
    * Automated NFT generation on offering closure

* **Jun 2025:**
    * Direct integration with PancakeSwap liquidity
    * Automated PIX/Crypto deposit conversion
    * Transaction anomaly analysis tool
    * Blockchain Integration Backoffice (manual sync, etc.)

---

## Frequently Asked Questions (FAQ)

**Q: Why are my `mint` transactions failing on Moonscan?**
A: This is intentional. As described in our **[SECURITY.md](./SECURITY.md)** and **[DATA_FLOWS.md](./DATA_FLOWS.md)** files, minting is restricted to our backend "Token Controller" service. This ensures that every token created is backed by a verified asset and a completed off-chain funding transaction.

**Q: How do I get tokens?**
A: Tokens are distributed to your wallet by the Tokeniza platform after you successfully participate in a crowdfunding offering or purchase an asset on our marketplace, as shown in the **[DATA_FLOWS.md](./DATA_FLOWS.md)** file.

**Q: Are these contracts audited?**
A: Yes. Our platform is subject to constant legal and digital security audits. The contracts are built on heavily audited OpenZeppelin libraries.

---

## License
This repository is licensed under MIT.
