import { BigNumber } from 'bignumber.js';

/**
 * Order event information
 */
export interface IOrderEvent {

    id?: string;

    callbackURL?: string;

    transactionId?: string;

    isTicketBuy?: boolean;

    /**
     * This will be used by PDV and SHOULD NEVER GO TO PROD.
     */
    bypass?: boolean;

    /**
     * The user identifier that placed the order
     */
    userId?: string;

    userEmail: string;

    storeId:string;

    status:string;

    address_id?: string;

    paymentMethod: string;

    hmac?: string;

    createdAt: Date;

    expirationDate?: Date;

    hash?: string;

    updatedAt?: Date;

    apiKey?: string;

    totalAmount: BigNumber | null;

    taxAmount?: BigNumber | null;

    tokensAmount?: any;

    shippingAmount: BigNumber | null;
    
    items?: IOrderEventItems[];

    event?: any;
}

export interface IOrderEventItems
{
    /**
     * The item id
     */
    itemId: string;

    /**
     * The item name
     */
    itemName: string;

    /**
     * Quantity of products requested
     */
    quantityRequested: BigNumber;


    /**
     * Value of the product requested
     */
    itemValue: BigNumber;

    event?: any;
}

/**
 * The possibles payment flow
 */
export enum EPaymentFlow
{
    PAYPAL = "PAYPAL",
    PICPAY = "PICPAY",
    CIELO = "CIELO",
    PAGSEGURO = "PAGSEGURO",
    CASH = "CASH",
    WIBOO = "WIBOO"
}

/**
 * The interface to have the withdrawal request
 */
export interface OrderWithdrawalInput
{
    userId?: string;

    orderId: string;
}