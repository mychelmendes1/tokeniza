export class BankingAccount {
    public id?: string;
    public bankStatus?: BaaSAccountStatus;
    public fintechStatus?: FintechAccountStatus;
    public accountId?: string;
    public branch?: string;
    public account?: string;
    public documentNumber?: string;
    public onBoardingId?: string;
    public clientCode?: string;
    public requestDate?: Date;
    public fintechApprovalDisapprovalDate?: Date;
    public disapprovalReason?: string;
    public suspensionReason?: string;
    public suspensionDate?: Date;
    public bankCode?: string;

    /*virtual fields, provided during runtime only*/
    public bankName?: string;
    public balance?: number;
}

export enum BaaSAccountStatus {
    //once the account is requested
    PROCESSING = 'processing',
    //once the account is approved on BaaS
    CONFIRMED = 'confirmed',
    ERROR = 'error',
    //in case of blockings requested by Fintech
    BLOQUEADO = 'BLOQUEADO',
    //ready for use
    ATIVO = 'ATIVO',
}

export enum FintechAccountStatus {
    PROCESSING = 'processing',
    APPROVED = 'approved',
    DISAPPROVED = 'disapproved',
    SUSPENDED = 'suspended'
}

export enum BankingAccountFeatures {
    //bill payments
    BILL = 'bill',
    //external transfer
    TED = 'ted'
}