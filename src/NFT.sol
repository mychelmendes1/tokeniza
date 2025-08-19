// SPDX-License-Identifier: MIT
pragma solidity 0.5.1;

// OpenZeppelin 2.x
import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721Metadata.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721Mintable.sol";

contract ERC721MetadataMintable is ERC721, ERC721Metadata, MinterRole {
    function mintWithTokenURI(
        address to,
        uint256 tokenId,
        string memory tokenURI
    ) public onlyMinter returns (bool) {
        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        return true;
    }
}

/**
 * @title NFT
 */
contract NFT is ERC721MetadataMintable {
    constructor(string memory name, string memory symbol)
        public
        ERC721Metadata(name, symbol)
    {
    }
}
