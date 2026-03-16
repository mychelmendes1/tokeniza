export class IInvoiceResponse {
    public id!: string;
    public reserveId?: string;
    public userIdFrom!: string;
    public userIdTo!: string;
    public userEmailFrom!: string;
    public userEmailTo!: string;
    public fiduciaryAmount!: number;
    public unitOfMoneySent!: string;
    public amountSent!: number;
    public sentMoneyQuote!: number;
    public unitOfMoneyRequested!: string;
    public amountRequested!: number;
    public requestedMoneyQuote!: number;
    public networkTax!: number;
    public operationTax!: number;
    public requestMessage!: string;
    public refusalMessage?: string;
    public creationDate!: Date;
    public approvalDate?: Date;
    public status?: InvoiceStatus;
    public updatedAt?: Date;
}

export class IInvoicesRequest {
    public userId?: string;
    public limit!: number;
    public offset!: number;
    public startDate?: Date;
    public filter?: InvoiceFilter;
    public status?: InvoiceStatus;
}

export class IInvoicesCreationRequest {
    public userIdTo!: string;
    public email?: string;
    public name?: string;
    public document?: string;
    public fiduciaryAmount!: number;
    public unitOfMoneyRequested!: string;
    public amountRequested!: number;
    public requestedMoneyQuote!: number;
    public requestMessage?: string;
    public creationDate!: Date;
    public expirationDate!: Date;
}

export enum InvoiceFilter {
    RECEIVED = 'RECEIVED',
    SENT = 'SENT'
}

export enum InvoiceStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    DISAPPROVED = 'DISAPPROVED',
    EXPIRED = 'EXPIRED',
    CANCELLED = 'CANCELLED',
}


export class InvoicesUpdateRequest {
    public traceId!: string;
    public id!: string;
    public userId!: string;
    public status!: InvoiceStatus;
}

export class ExternalInvoiceModel {
    public userId?: string;
    public fiatAmount?: number;
    public id?: string;
    public tokensAmount?: number;
    public depositMethod?: string;
    public depositAddress?: string;
    public name?: string;
    public identity?: string;
    public email?: string;
    public status?: string;
    public when?: Date;
}