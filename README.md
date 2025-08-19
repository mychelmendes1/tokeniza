# Tokeniza Smart Contracts Documentation

This repository contains the core smart contracts used by **Tokeniza** in the tokenization of Real World Assets (RWA).  
Below is the documentation describing the **purpose** and **functions** of each contract.

---

## 1. MyToken.sol

### Purpose
The **MyToken** contract implements a **fungible token (ERC-20)**.  
It represents digital value within the Tokeniza ecosystem and is used as the base unit for transactions, liquidity, and governance.

### Key Functions
| Function        | Description |
|-----------------|-------------|
| `constructor`   | Initializes the contract with name, symbol, initial supply, and assigns all tokens to the deployer. |
| `transfer`      | Allows users to send tokens to another address. |
| `approve`       | Authorizes a spender to move tokens on behalf of the owner. |
| `transferFrom`  | Executes transfers on behalf of another user, respecting allowance limits. |
| `mint` (optional) | Creates new tokens, increasing total supply. |
| `burn` (optional) | Destroys tokens, reducing total supply. |

### Usage in Tokeniza
- Base token for RWA transactions.
- Medium of payment and liquidity.
- Staking and governance participation within Tokeniza.
- Backbone for on-chain settlement of tokenized assets.

---

## 2. NFT.sol

### Purpose
The **NFT** contract implements a **non-fungible token (ERC-721)**.  
It represents **unique tokenized assets**, such as real estate fractions, precatórios, or agricultural projects.

### Key Functions
| Function           | Description |
|--------------------|-------------|
| `constructor`      | Defines collection name and symbol. |
| `mint`             | Creates a new NFT and assigns it to a specific wallet. |
| `tokenURI`         | Returns metadata of the NFT (JSON with description, image, attributes). |
| `transferFrom`     | Transfers ownership of an NFT between users. |
| `safeTransferFrom` | Transfers an NFT with safety checks. |
| `ownerOf`          | Returns the current owner of a token. |
| `balanceOf`        | Returns how many NFTs are owned by an address. |

### Usage in Tokeniza
- Represents unique assets or specific investment allocations.
- Provides digital proof of ownership and traceability.
- Enables fractionalized investment in tokenized assets.
- Integrates with Tokeniza Invest for transparent user dashboards.

---

## Benefits for Moonbeam
- Enhances **transparency** by publishing verified contracts on Moonscan.  
- Establishes **auditable standards** for RWA tokenization.  
- Facilitates integration with **DeFi pools** and liquidity protocols.  
- Strengthens Moonbeam’s position as a **global hub for regulated tokenization**.

---

## Repository Structure
```

/src
├── MyToken.sol
├── NFT.sol
/
└── README.md (this file)

```

---

## License
This repository is licensed under MIT.

