import BigNumber from 'bignumber.js';
import { TransactionStatus } from './transaction.status.enum';

export enum EDepositPaymentType {
    NONE = 'NONE',
    TED = 'TED',
    PIX = 'PIX',
    NETELLER = 'NETELLER',
    ALL_TYPES = 'ALL_TYPES'
}

export enum EDepositPaymentTypeNumeric {
    NONE = 0,
    TED = 1,
    PIX = 2,
    NETELLER = 3,
    ALL_TYPES = 4
}

export class DepositModel {
    public id!: string;
    public amount!: BigNumber;
    public when!: Date;
    public status!: TransactionStatus;
    public depositType?: EDepositPaymentType;
}

export class CreateDepositModel {
    public amount!: BigNumber;
    public coin_amount!: number;
    public unitOfMoney!: string;
    public transferProofFile!: string;
    public external_id?: string;
    public depositType!: EDepositPaymentType;
    public isNftBuy?: boolean;
    public userEmail?: string;
    public assetId?: string;
    public nftId?: string;
    public packageId?: string;
}