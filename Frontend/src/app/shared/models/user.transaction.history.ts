import { BigNumber } from 'bignumber.js';
import { TransactionFlow, TransactionType } from './finance.constants';
import { TokenIndicationRewardsType } from './tokens';
import { MonetaryAmount } from './monetary.amount';
import { StakingConfig } from './staking.config';

export class TokenBuyDetails {
    public paymentMethod?: string;
}

export class TokenIndicationRewardsDetails {
    public type?: TokenIndicationRewardsType;
    public userInvitedName?: string;
}

export class UserTransactionHistory {
    public transactionId?: string;
    public externalId?: string;
    public customerToName?: string;
    public customerToEmail?: string;
    public customerFromName?: string;
    public customerFromEmail?: string;
    public totalAmount?: BigNumber;
    public transactionFlow?: TransactionFlow;
    public transactionType?: TransactionType;
    public walletPublicKeyToTransferTo?: string;
    public monetaryamount?: MonetaryAmount;
    public fiatAmount?: MonetaryAmount;
    public when?: Date;
    public transactionDate?: Date;
    public transactionDescription?: string;
    public isStaking?: boolean;
    public stakingDetails?: StakingConfig
    public isTokenBuy?: boolean;
    public tokenBuyDetails?: TokenBuyDetails;
    public isTokenIndicationRewards?: boolean;
    public tokenIndicationRewardsDetails?: TokenIndicationRewardsDetails;
    public transactionHash?: string;

    constructor(object?: UserTransactionHistory) {
        if (!object) {
            return this;
        }

        this.transactionId = object.transactionId;
        this.externalId = object.externalId;
        this.customerToName = object.customerToName;
        this.customerToEmail = object.customerToEmail;
        this.customerFromName = object.customerFromName;
        this.customerFromEmail = object.customerFromEmail;
        this.totalAmount = object.totalAmount;
        this.transactionFlow = object.transactionFlow;
        this.transactionType = object.transactionType;
        this.walletPublicKeyToTransferTo = object.walletPublicKeyToTransferTo;
        this.monetaryamount = new MonetaryAmount(object?.monetaryamount || null);
        this.when = object.when;
        this.transactionDate = object.transactionDate;
        this.transactionDescription = object.transactionDescription;
        this.transactionHash = object.transactionHash;
    }
}