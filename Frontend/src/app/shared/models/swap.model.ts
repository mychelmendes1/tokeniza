import BigNumber from "bignumber.js";
import { TokenPairsConfig } from "./tokens.pairs";

export interface ISwapCriptoTransaction {
    ourTax: { percentage: number | undefined, amountTokens: number | undefined, amountInCurrency: number | undefined };
    gasCoast: { amountTokens: number | undefined, amountInCurrency: number | undefined };
}

export class ISwapCriptoToken {
    public id?: string;
    public name?: string;
    public userBalance!: BigNumber;
    public img!: string;
    public address?: string;
    public pairs?: TokenPairsConfig[];
    public transactionTax?: number;
    public blockchainFee?: number;
    public isAutomaticSwap?: boolean;
    public brasil_bitcoin_integration?: boolean;
}