import BigNumber from 'bignumber.js';

export interface TransferValueModel {
    amount: BigNumber;
    walletIdTo: string;
    walletIdFrom: string;
    transactionDescription: string;
    secretcode: string;
    unitOfMoney?: string;
}
