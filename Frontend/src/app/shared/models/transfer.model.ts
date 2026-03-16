import { TaxItemType } from './tax-item-type.enum';

export interface VerifyTransferInput {
    amount: any;
    walletIdTo: string;
    walletIdFrom: string;
    unitOfMoney: string;
}

export interface VerifyTransferOutput {
    tax: Array<TaxItem>;
    calculatedTax: string;
    willBeApproved: boolean;
    walletFrom: WalletFrom;
    walletTo: WalletTo;
    message: string;

    // UI calculated field = calculatedTax + amount
    transactionTotalAmount?: number;
}

export interface TaxItem {
    description: string;
    amount: string;
    type: TaxItemType;
}

interface WalletFrom {
    customerId: string;
    plataformWallet: boolean;
    protectedWallet: boolean;
    publicKey: string;
}
interface WalletTo {
    customerId: string;
    plataformWallet: boolean;
    protectedWallet: boolean;
    publicKey: string;
}

export interface TransferInput extends VerifyTransferInput {
    secretcode: string;
}

export interface TransferChallengeInput extends VerifyTransferInput {
    username?: string;
    challengeAnswer: string;
    sessionId: string;
    applicationName: string;
}

export interface TransferOutput {
    walletVerificationResponse: VerifyTransferOutput;
    financialTransactionId: Array<string>;
    status: string;
}
