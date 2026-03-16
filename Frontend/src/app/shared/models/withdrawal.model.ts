import BigNumber from 'bignumber.js';
import { TransactionStatus } from './transaction.status.enum';

export enum WithdrawalType {
    FIAT = "FIAT",
    COIN = "COIN",
    BTC = "BTC",
    ETH = "ETH",
    INTERNAL_FIAT = "INTERNAL_FIAT"
}

export enum WithdrawalIdentifier {
    BITCOIN = "BITCOIN",
    ETHEREUM = "ETHEREUM"
}

export class WithdrawalModel {
    public requestId!: string | undefined;
    public amount!: BigNumber;
    public bank!: string;
    public agency!: string;
    public checked!: boolean;
    public account!: string;
    public identifier!: WithdrawalIdentifier;
    public person?: boolean;
    public entity?: boolean;
    public name!: string;
    public type!: WithdrawalType;
    public unit_of_money!: string;
    public createTemplate?: boolean;
    public pix_key?: string;
    public userId!: string;
    public when?: Date;
    public status?: TransactionStatus;
    public unit_to_change!: string;
    public quote!: BigNumber;
    public tax?: BigNumber;
}

export class WithdrawalResponseModel {
    public amount!: BigNumber;
    public when?: Date;
    public status?: TransactionStatus
}

export class WithdrawalRequestModel {
    public amount!: BigNumber;
    public name!: string;
    public identifier!: string;
    public person?: boolean;
    public bank!: string;
    public agency!: number;
    public account!: number;
    public type!: WithdrawalType;
    public unit_of_money!: string;
}