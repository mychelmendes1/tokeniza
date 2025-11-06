```markdown
# Backend Automation (Schedulers)

A core part of the Tokeniza "schema" that is not visible on-chain is our extensive backend automation system. The platform runs **63 automated processes (Schedulers)** distributed across 15 microservices to manage the platform's efficiency, compliance, and financial operations.

This automation layer is what handles tasks that investors might expect to see, such as "funding" reconciliation and commission payouts.

The majority of these schedulers are focused on financial operations (26 schedulers) and trading (4 schedulers), demonstrating a robust, enterprise-grade architecture.

## Key Automated Processes

Our automation services are responsible for, but not limited to, the following tasks:

### Financial & Payment Schedulers
* **Bank Reconciliation:** Automatically checking and confirming bank deposits and withdrawals.
* **Gateway Integration:** Processing payments and fallbacks for multiple gateways (e.g., Cielo, CoinPayments).
* **Price Quotes:** Regularly updating price quotes for cryptocurrencies and USD.
* **Settlement:** Automatically settling PIX payments.

### Business Logic Schedulers
* **Commission Payouts:** Automatically calculating and paying multi-level commissions for referrals.
* **Invoice Generation:** Automatically issuing electronic invoices (NFe).
* **Contract Management:** Verifying digital contract signatures.
* **Wallet Management:** Asynchronously creating and managing user wallets.

### Trading & Exchange Schedulers
* **Trade Execution:** Running schedulers to execute trades.
* **Trade Journaling:** Automatically journaling all trade activities for auditing.
* **Order Book & NFT:** Processing NFT-related orders and order book validations.

This high level of automation ensures our platform is scalable, resilient (with schedulers for fallbacks and re-validation), and compliant, forming a critical part of our system architecture.