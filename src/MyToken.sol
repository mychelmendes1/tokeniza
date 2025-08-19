pragma solidity 0.5.1;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Pausable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";

/**
 * @title MyToken
 *
 * @dev Implementation of the main MyToken Smart Contract.
 */
contract MyToken is ERC20Pausable, ERC20Burnable, ERC20Detailed, Ownable, ERC20Mintable
{
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply_
    )
        ERC20Detailed(name_, symbol_, 18)
    {
        _mint(msg.sender, initialSupply_);
    }

    /**
     * @dev Overrides the OpenZeppelin default transfer
     *
     * @param to The address to transfer to.
     * @param value The amount to be transferred.
     * @return If the operation was successful
     */
    function transfer(address to, uint256 value) public whenNotPaused returns (bool)
    {
        return _fullTransfer(msg.sender, to, value);
    }

    /**
     *
     * @param from address The address which you want to send tokens from
     * @param to address The address which you want to transfer to
     * @param value uint256 the amount of tokens to be transferred
     * @return If the operation was successful
     */
    function transferFrom(address from, address to, uint256 value) public whenNotPaused returns (bool)
    {
        // Transfer user's tokens
        super.transferFrom(from, to, value);

        return true;
    }

    /**
     * @dev Batch token transfer (maxium 100 transfers)
     *
     * @param recipients The recipients for transfer to
     * @param values The values
     * @param from Spender address
     * @return If the operation was successful
     */
    function sendBatch(address[] memory recipients, uint256[] memory values, address from) public whenNotPaused returns (bool)
    {
        /*
         * The maximum batch send should be 100 transactions.
         * Each transaction we recommend 65000 of GAS limit and the maximum block size is 6700000.
         * 6700000 / 65000 = ~103.0769 ∴ 100 transacitons (safe rounded).
         */
        uint maxTransactionCount = 100;
        uint transactionCount = recipients.length;

        require(transactionCount <= maxTransactionCount, "Max transaction count violated");
        require(transactionCount == values.length, "Wrong data");

        if (msg.sender == from)
        {
            return _sendBatchSelf(recipients, values, transactionCount);
        }

        return _sendBatchFrom(recipients, values, from, transactionCount);
    }

    /**
     * @dev Batch token transfer from MSG sender
     *
     * @param recipients The recipients for transfer to
     * @param values The values
     * @param transactionCount Total transaction count
     * @return If the operation was successful
     */
    function _sendBatchSelf(address[] memory recipients, uint256[] memory values, uint transactionCount) private returns (bool)
    {
        for (uint i = 0; i < transactionCount; i++)
        {
            _fullTransfer(msg.sender, recipients[i], values[i]);
        }

        return true;
    }

    /**
     * @dev Batch token transfer from other sender
     *
     * @param recipients The recipients for transfer to
     * @param values The values
     * @param from Spender address
     * @param transactionCount Total transaction count
     * @return If the operation was successful
     */
    function _sendBatchFrom(address[] memory recipients, uint256[] memory values, address from, uint transactionCount) private returns (bool)
    {
        for (uint i = 0; i < transactionCount; i++)
        {
            transferFrom(from, recipients[i], values[i]);
        }

        return true;
    }

    /**
     * @dev Special Axia transfer token for a specified address.
     *
     * @param from The address of the spender
     * @param to The address to transfer to.
     * @param value The amount to be transferred.
     * @return If the operation was successful
     */
    function _fullTransfer(address from, address to, uint256 value) private returns (bool)
    {
        // Transfer user's tokens
        _transfer(from, to, value);

        return true;
    }

    /**
     * @dev Burn tokens (Only owner)
     */
    function burnFromByOwner(address account, uint256 amount) public onlyOwner {
        _burn(account, amount);
    }

    /**
     * @dev Mint tokens (only owner)
     */
    function mint(address account, uint256 amount) public onlyOwner {
        _mint(account, amount);
    }
}