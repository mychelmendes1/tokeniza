/**
 * Some common definitions for Finance.
 */

/**
 * The Financial Transaction Type.
 * Based on the transaction type, a specific business logic may be applied while processing.
 * Database is limmiting this Enum as a custom database type.
 */
export enum TransactionType {
    CREDIT_FROM_EXCHANGE = 'creditfromexchange',
    PAYMENT_PROCESSOR = 'paymentprocessor',
    DEBIT_FOR_DIRECT_TRANSFER = 'debitfordirecttransfer',
    DEBIT_FOR_EXTERNAL_WALLET = 'debitforexternalwallet',

    BLOCKCHAIN_GROUPING = 'blockchaingrouping',
    CREDIT_FROM_DIRECT_TRANSFER = "creditfromdirecttransfer",
    CREDIT_FROM_TAX_REFUND = 'creditfromtaxrefund',
    CREDIT_FROM_TAX = 'creditfromtax',
    CREDIT_FOR_REMBOURSEMENT= 'remboursement',
    CREDIT_FOR_DIGITAL_ENGAGEMENT = "creditfordigitalengagement",
    CREDIT_FROM_PURCHASE = "creditfrompurchase",
    DEBIT_FOR_EXCHANGE = 'debitforexchange',
    DEBIT_FROM_DIGITAL_ENGAGEMENT = "debitfromdigitalengagement",
    DEBIT_FOR_PURCHASE = "debitforpurchase",
    PARTIAL_RESERVE_CONFIRMATION = "partialreserveconfirmation",
    RESERVE_CREATION = "reservecreation",
    RESERVE_CONFIRMATION = "reserveconfirmation",
    RESERVE_CANCELLATION = "reservecancellation",
    RESERVE_FOR_DIGITAL_ENGAGEMENT = 'reservefordigitalengagement',
    REFUND = 'refund',
    DIVIDENDS_PAYMENT = 'dividendspayment',
    DTE_REWARD = 'dotoearnreward',
    INDICATION_REWARD_SIGNUP = 'indicationrewardsignup',
    INDICATION_REWARD_PURCHASE = 'indicationrewardpurchase',
}

/**
 * Inform if this Transaction is a Debit or a Credit charge.
 * Database is limmiting this Enum as a custom database type.
 */
export enum TransactionFlow {
    ALL = 'all', // For Frontend
    CREDIT = 'credit',
    DEBIT = 'debit'
}

export enum MarketFlow {
    SELL = 'SELL',
    BUY = 'BUY'
}

/**
 * Unit of measures of time for a duration.
 */
export enum UnitOfTime {
    Year = 'year',
    Month = 'month',
    Week = 'week',
    Day = 'day',
    Hour = 'hour',
    Minute = 'minute',
    Second = 'second',
    Milisecond = 'milisecond'
}

/**
 * All acceptable unit of money.
 */
export enum UnitOfMoney {
    BRL = 'BRL',
    USD = 'USD'
}

/**
 * The result of a Financial Request (General or Reserve).
 */
export enum RequestResult {
    SUCCESS = 'success',
    ERROR = 'error',
    INSUFFICIENT_CREDITS = 'insufficientcredits',
    CANCELLATION_SUCCEED = 'cancellationsucceed'
}

/**
 * Status of a reserve confirmation.
 */
export enum ReserveConfirmationStatus {
    CONFIRMED = 'confirmed',
    CANCELLED = 'cancelled',
    RESERVED = 'reserved',
    PARTIAL_CONFIRMED = 'partialconfirmed'
}