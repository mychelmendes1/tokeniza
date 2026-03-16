import BigNumber from "bignumber.js";

export interface IBridgeTransaction {

    // Axia fees (0.2%)
    ourTax: { 
        percentage: number, 
        amountTokens: number, 
        amountInCurrency: number 
    };
    // Fees for deposit() in smart contract
    gasCost: { 
        amountTokens: number, 
        amountInCurrency: number 
    };
    // Fees for Across
    bridgeCost: { 
        amountTokens: number, 
        amountInCurrency: number 
    };
    totalCost: {
        amountTokens: number,
        amountInCurrency: number
    }
    
}

export class IBridgeCriptoToken {
    public id?: string;
    public name?: string;
    public userBalance: BigNumber;
    public img: string;

    /**
     * The address of the token contract on the blockchain.
     * Ex: "0x6B175474E89094C44Da98b954EedeAC495271d0F" for DAI on Ethereum.
     */
    public address?: string;

    /**
     * The transaction tax percentage for this token (if applicable).
     * Ex: 0.3 for 0.3%
     */
    public transactionTax?: number;

    /**
     * The bridge fee percentage for this token (if applicable).
     * Ex: 0.3 for 0.3%
     */
    public bridgeFee?: number;

    public blockchainFee?: number;

    public decimals?: number;

    constructor() {
        this.userBalance = new BigNumber(0);
        this.img = '';
    }
}