# NFT Metadata Standard

This document defines the metadata "schema" for Non-Fungible Tokens (NFTs) issued on the Tokeniza platform, corresponding to the `NFT.sol` contract.

Each NFT represents a unique, tokenized real-world asset (RWA) or a fraction of an investment. The `tokenURI` function in the contract points to a JSON file that follows the ERC-721 Metadata standard, structured as follows.

## Example JSON Schema

```json
{
  "name": "TCAR - Tcar no Pobre Show",
  "description": "This NFT represents a fractionalized investment share in the TCAR - Tcar no Pobre Show project, offered via the Tokeniza crowdfunding platform.",
  "image": "[https://plataforma.tokeniza.com.br/path/to/image_tcar.png](https://plataforma.tokeniza.com.br/path/to/image_tcar.png)",
  "external_url": "[https://plataforma.tokeniza.com.br/opportunity/tcar](https://plataforma.tokeniza.com.br/opportunity/tcar)",
  "attributes": [
    {
      "trait_type": "Asset Type",
      "value": "Real World Asset (RWA)"
    },
    {
      "trait_type": "Project Name",
      "value": "Tcar no Pobre Show"
    },
    {
      "trait_type": "Investment Type",
      "value": "Equity Crowdfunding"
    },
    {
      "trait_type": "Allocation Value",
      "value": "5000.00 BRL"
    },
    {
      "trait_type": "Issuance Date",
      "value": "2025-01-20"
    },
    {
      "trait_type": "Legal Document Hash",
      "value": "0xa1b2c3d4...[hash_of_legal_contract]...e5f6"
    }
  ]
}

## Attribute Definitions
- name: The display name of the NFT, often the project name.

- description: A detailed description of the asset or investment the NFT represents.

- image: A URL to an image representing the asset.

- external_url: A link to the asset's page on the Tokeniza platform.

- attributes: An array of objects that define the specific "traits" or properties of the asset.

- Asset Type: Defines the class of asset (e.g., RWA, Real Estate, Startup Equity).

- Allocation Value: The initial value of the investment this NFT represented at minting.

- Legal Document Hash: (Optional) A hash of the off-chain legal agreement, allowing for on-chain verification of the document's integrity.

---