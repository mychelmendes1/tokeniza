# Tokeniza Data Flows (Transaction Processes)

This document details the high-level data flows for the most critical operations in the Tokeniza ecosystem. These flows illustrate how our off-chain microservices architecture orchestrates secure, compliant, and auditable transactions that are settled on-chain.

## Flow 1: Crowdfunding Investment (with PIX)

This flow directly explains the "funding" process. It shows how an off-chain fiat payment (PIX) results in an on-chain token issuance.

```mermaid
sequenceDiagram
    participant User as User (Frontend)
    participant Proxy as ProxyService (API Gateway)
    participant CS as Crowdfunding Service
    participant PMS as PaymentManagementService
    participant Broker as Message Broker (Async)
    participant TMS as Token ManagementService
    participant BI as Blockchain Integration
    participant FS as Finance Management Service
    participant Audit as AuditService
    participant Comm as CommunicationGateway

    User->>Proxy: 1. POST /createCrowdfundingCheckoutOrder
    Proxy->>CS: 2. Route request
    CS->>Broker: 3. Publish "OrderCreated"
    CS-->>Proxy: 4. Return orderId
    Proxy-->>User: 5. Return orderId
    
    Broker->>PMS: 6. Consume "OrderCreated"
    PMS->>PMS: 7. Generate PIX QR Code
    PMS->>Broker: 8. Publish "PaymentPending"
    
    Note right of PMS: User pays PIX. Platform waits for external gateway webhook.
    
    GatewayExterno->>Proxy: 9. Webhook: Payment Confirmed
    Proxy->>PMS: 10. Route webhook
    PMS->>Broker: 11. Publish "PaymentConfirmed"
    
    Broker->>CS: 12. Consume "PaymentConfirmed"
    CS->>Broker: 13. Publish "InvestmentCompleted"
    
    Broker->>TMS: 14. Consume "InvestmentCompleted"
    TMS->>Broker: 15. Publish "TokensIssued"
    
    Broker->>BI: 16. Consume "TokensIssued"
    BI->>BI: 17. **MINT: Record tokens on-chain (Moonbeam)**
    BI->>Broker: 18. Publish "TokensOnChain"
    
    Broker->>FS: 19. Consume "TokensOnChain"
    FS->>FS: 20. Update investor's internal balance
    
    Broker->>Audit: 21. Log successful transaction
    Broker->>Comm: 22. Send confirmation email

## Flow 2: NFT Marketplace Purchase

This flow explains the secondary market trading process, involving an internal escrow of funds and the on-chain transfer of the NFT.

```mermaid
sequenceDiagram
    participant User as User (Frontend)
    participant Proxy as ProxyService
    participant TMS as Token ManagementService
    participant FS as Finance Management Service
    participant Broker as Message Broker (Async)
    participant OCS as OrderBookControlService
    participant BI as Blockchain Integration
    participant Audit as AuditService
    participant Comm as CommunicationGateway

    User->>Proxy: 1. POST /buyNFT
    Proxy->>TMS: 2. Route request
    TMS->>Broker: 3. Publish "NFTPurchaseInitiated"
    
    Broker->>FS: 4. Consume "NFTPurchaseInitiated"
    FS->>FS: 5. Verify and reserve buyer's funds (Escrow)
    FS->>Broker: 6. Publish "FundsReserved"
    
    Broker->>OCS: 7. Consume "FundsReserved"
    OCS->>OCS: 8. Execute the trade order
    OCS->>Broker: 9. Publish "OrderExecuted"
    
    Broker->>BI: 10. Consume "OrderExecuted"
    BI->>BI: 11. **TRANSFER: Execute NFT transfer on-chain**
    BI->>Broker: 12. Publish "NFTTransferred"
    
    Broker->>TMS: 13. Consume "NFTTransferred"
    TMS->>TMS: 14. Update NFT ownership in database
    TMS->>Broker: 15. Publish "NFTOwnershipChanged"
    
    Broker->>FS: 16. Consume "NFTOwnershipChanged"
    FS->>FS: 17. Debit buyer, Credit seller, Collect fees
    FS->>Broker: 18. Publish "TransactionCompleted"
    
    Broker->>Audit: 19. Log transaction for all parties
    Broker->>Comm: 20. Send email notifications

## Flow 3: KYC (Know Your Customer) Process

This flow demonstrates our compliance-first approach, showing how user verification is a prerequisite for platform activity.

```mermaid
sequenceDiagram
    participant User as User (Frontend)
    participant Proxy as ProxyService
    participant CPS as CustomerProfileService
    participant Broker as Message Broker (Async)
    participant Compliance as Compliance Team (Manual)
    participant Config as ConfigurationManagementService
    participant Comm as CommunicationGateway

    User->>Proxy: 1. POST /UpdateMyGenericKYCDocuments
    Proxy->>CPS: 2. Route request
    CPS->>CPS: 3. Store documents, set status to "Pending Review"
    CPS->>Broker: 4. Publish "KYCDocumentsSubmitted"
    
    Note right of CPS: Awaiting manual analysis by compliance team
    
    Compliance->>CPS: 5. Approve KYC via Admin Backoffice
    CPS->>Broker: 6. Publish "KYCApproved"
    
    Broker->>Config: 7. Consume "KYCApproved", update user feature flags
    Broker->>Comm: 8. Consume "KYCApproved", send welcome email

---