```markdown
# Tokeniza System Architecture

This document provides a high-level overview of the Tokeniza platform architecture, corresponding to the components in our `system-architecture-flowchart.jpg` file.

Our architecture is a hybrid system, combining a robust off-chain platform for user management and business logic with on-chain smart contracts for asset registration and settlement.

![System Architecture Flowchart](system-architecture-flowchart.jpg)

## Component Layers

### 1. Presentation Layer (Client View)
This is the user-facing interface, accessible via **Mobile** and **Desktop Browser**. It provides the user with access to the platform's features, including:
* Digital Wallet
* Crowdfunding Offerings
* Marketplace (Secondary Trading)
* Exchange

### 2. Front-End
The client-side application built with modern web technologies, including:
* Angular.js
* Zoe.js
* Jubelier
* Webpack
* Gasket
* Chart.js

### 3. Back-End
The server-side technologies that power our API Layer and services:
* Node.js
* .NET
* io.js
* Lodash
* Nginx
* Solidity (for contract development)

### 4. API Layer (API Gateway)
A single, secure entry point (API Gateway) that manages all requests from the Front-End to the various microservices in the Application Layer.

### 5. Application Layer
A suite of microservices that handle all core business logic off-chain:
* **Core Services:** Audit, Bank Management, Chat, Payment, User Management.
* **Business Logic:** Crowdfunding Service, Customer Profile Service, Finance Management Service.
* **Blockchain-Facing:** Blockchain Integration Service, Token Management Service.

### 6. Communication & Blockchain Integration Layer
This layer acts as the bridge between the off-chain Application Layer and the on-chain State Layer.
* **Communication Gateway:** Manages real-time updates (e.g., Websockets).
* **Blockchain Integration:** Handles the construction, signing, and sending of transactions to the blockchain.
* **Blockchain Handler:** A service responsible for monitoring on-chain events.

### 7. Control Layer
This is the "brain" of the platform-to-blockchain interaction and directly addresses how transactions are processed.
* **Token Controller:** The service authorized to call protected functions on the smart contracts (like `mint`). It is the "Owner" or "Minter" of the contracts.
* **Payment Processor:** Manages and validates off-chain funding *before* instructing the Token Controller to execute an on-chain transaction.
* **Payment BackOffice:** Handles reconciliation and settlement.

### 8. State Layer (Blockchain)
The final, immutable ledger for asset ownership. We maintain a multi-chain presence for maximum interoperability.
* **Moonbeam (Primary):** Our core platform for RWA tokenization, leveraging Polkadot's interoperability.
* **Other Chains:** ETH, Polygon, BTC, etc., for asset and value bridging.
* **AWS (Off-chain Storage):** Securely stores metadata and private user documents.