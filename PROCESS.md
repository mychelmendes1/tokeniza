# Tokeniza Transaction and Process Documentation

This document clarifies the relationship between the Tokeniza off-chain platform and the on-chain smart contracts (`MyToken.sol`, `NFT.sol`).

It is essential to understand that the smart contracts are the final layer of ownership registration. Most business logic, funding, and validation occur on our backend platform *before* any transaction is executed on-chain.

---

## 1. Access Control (Why mints are failing)

Investors observing the contracts on Moonscan may see "failing token mints." This is intentional and a core security feature of our system.

Public minting is disabled to protect the integrity of the assets.

* **MyToken.sol (ERC-20):** The `mint` function is protected by `onlyOwner`. Only the Tokeniza backend system (which is the contract 'Owner') can mint new tokens.
* **NFT.sol (ERC-721):** The `mintWithTokenURI` function is protected by `onlyMinter`. Only the Tokeniza backend system (which holds the 'Minter' role) can create new NFTs.

The "failing" transactions are proof that these access controls are working correctly, preventing unauthorized asset creation.

---

## 2. Transaction Flows (How Funding Works)

Investors do not see "funding" transactions on-chain because funding (e.g., USD, BRL) is processed off-chain. The on-chain transaction is the *result* of a successful off-chain funding process.

### Flow 1: Asset Tokenization (Funding & NFT Mint)

This flow explains how an investor buys a fraction of a Real World Asset (RWA) and receives an NFT representing their ownership.

1.  **Platform (Off-chain):** An investor selects an asset on the Tokeniza platform and initiates the investment.
2.  **Platform (Off-chain):** The investor completes payment (funding) via traditional methods (e.g., wire transfer, credit card). Our "Payment Processor" (see architecture diagram) confirms receipt.
3.  **Backend (Off-chain):** After successful payment and compliance checks (KYC/AML), the Tokeniza "Token Controller" is triggered.
4.  **Blockchain (On-chain):** The "Token Controller" (acting as the `Minter`) calls the `mintWithTokenURI` function on the `NFT.sol` contract.
5.  **Result:** The NFT is minted directly into the investor's Moonbeam wallet, with the `tokenURI` pointing to metadata that describes the purchased asset and investment terms.

### Flow 2: Acquiring or Using MyToken (ERC-20)

This flow explains how the fungible `MyToken` is used or distributed.

1.  **Platform (Off-chain):** `MyToken` is used as a utility token within the ecosystem (e.g., for fees, rewards, or as a medium of exchange).
2.  **Platform (Off-chain):** A user initiates a transaction that requires them to receive `MyToken` (e.g., purchase, earning rewards).
3.  **Backend (Off-chain):** The Tokeniza system validates this action.
4.  **Blockchain (On-chain):** The Tokeniza backend (as the contract `Owner`) calls the appropriate function:
    * `mint`: To issue new tokens to the user's wallet.
    * `transfer`: To send existing tokens from a treasury wallet to the user's wallet.

---

## 3. Sequence Diagram: Asset Tokenization

This diagram shows the flow described in "Flow 1" above.

```mermaid
sequenceDiagram
    participant Investor
    participant Tokeniza Platform (Front-end)
    participant Tokeniza Backend (Control Layer)
    participant NFT Smart Contract (on-chain)

    Investor->>Tokeniza Platform (Front-end): 1. Initiate Investment
    Tokeniza Platform (Front-end)->>Tokeniza Backend (Control Layer): 2. Submit data (funding, KYC)
    Tokeniza Backend (Control Layer)-->>Tokeniza Backend (Control Layer): 3. Process Payment (off-chain)
    Tokeniza Backend (Control Layer)-->>Tokeniza Backend (Control Layer): 4. Verify Compliance
    alt Transaction Approved
        Tokeniza Backend (Control Layer)->>NFT Smart Contract (on-chain): 5. Call mintWithTokenURI(investorWallet, tokenId, tokenURI)
        NFT Smart Contract (on-chain)-->>Investor: 6. NFT is minted to wallet
    end