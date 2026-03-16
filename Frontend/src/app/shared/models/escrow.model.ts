export class IEscrowResponse {
    public id?: string;
    public reserveId?: string;
    public userIdFrom?: string;
    public userIdTo?: string;
    public userEmailFrom?: string;
    public userEmailTo?: string;
    public fiduciaryAmount?: number;
    public unitOfMoneySent?: string;
    public amountSent?: number;
    public sentMoneyQuote?: number;
    public unitOfMoneyRequested?: string;
    public amountRequested?: number;
    public requestedMoneyQuote?: number;
    public networkTax?: number;
    public operationTax?: number;
    public requestMessage?: string;
    public refusalMessage?: string;
    public creationDate?: Date;
    public approvalDate?: Date;
    public status?: EscrowStatus;
    public updatedAt?: Date;
}

export class IEscrowsRequest {
    public userId?: string;
    public limit?: number;
    public offset?: number;
    public startDate?: Date;
    public filter?: EscrowFilter;
    public status?: EscrowStatus;
}

export class IEscrowsCreationRequest {
    public userIdTo?: string;
    public fiduciaryAmount?: number;
    public unitOfMoneySent?: string;
    public amountSent?: number;
    public sentMoneyQuote?: number;
    public unitOfMoneyRequested?: string;
    public amountRequested?: number;
    public requestedMoneyQuote?: number;
    public networkTax?: number;
    public operationTax?: number;
    public requestMessage?: string;
    public creationDate?: Date;
    public expirationDate?: Date;
}

export enum EscrowFilter {
    RECEIVED = 'RECEIVED',
    SENT = 'SENT'
}

export enum EscrowStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    DISAPPROVED = 'DISAPPROVED',
    EXPIRED = 'EXPIRED',
    CANCELLED = 'CANCELLED',
}

export class EscrowsUpdateRequest {
    public traceId?: string;
    public id?: string;
    public userId?: string;
    public status?: EscrowStatus;
}
