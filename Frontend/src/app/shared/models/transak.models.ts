// --- Configuration Enum and Classes ---

/**
 * Transak environment types.
 */
export enum TransakEnvironmentEnum {
    STAGING = "STAGING",
    PRODUCTION = "PRODUCTION"
}

/**
 * Interface for Transak API configuration parameters.
 */
export interface TransakParameters {
    apiKey?: string; // Transak API Key
    apiSecret?: string; // Transak API Secret
    apiUrl?: string; // Base API URL
    environment?: TransakEnvironmentEnum // Transak environment (STAGING/PRODUCTION)
}

/**
 * Interface for user address details for Transak.
 */
export interface TransakAddress {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postCode: string;
}

/**
 * Interface for user data for Transak.
 */
export interface TransakUserData {
    firstName: string;
    lastName: string;
    email: string;
    mobileNumber: string;
    dob: string;
    address?: TransakAddress;
}

/**
 * Model class for On-Ramp transactions (Buy Crypto).
 */
export class TransakOnRampModel {
    public apiKey?: string; // Required API Key
    public environment?: TransakEnvironmentEnum;
    public widgetHeight?: string;
    public productsAvailed?: string;
    public exchangeScreenTitle?: string;
    public fiatAmount?: number;
    public fiatCurrency?: string;
    public network?: string;
    public cryptoCurrencyCode?: string;
    public hideExchangeScreen?: boolean;
    public walletAddress?: string;
    public disableWalletAddressForm?: boolean;
    public email?: string;
    public isAutoFillUserData?: boolean;
    public themeColor?: string;
    public hideMenu?: boolean;
    public partnerCustomerId?: string;
    public partnerOrderId?: string;
    public userData?: TransakUserData;
}

// --- Auxiliary Data Interfaces (Common) ---

/**
 * Interface for partner details.
 */
export interface Partner {
    name?: string;
    isCardPayment?: boolean;
    isBankTransfer?: boolean;
    currencyCode?: string;
}

/**
 * Interface for state/province details within a country.
 */
export interface State {
    code?: string;
    name?: string;
    isAllowed?: boolean;
}

/**
 * Interface for country details and allowed status.
 */
export interface Country {
    alpha2?: string; // E.g., "BR"
    alpha3?: string; // E.g., "BRA"
    isAllowed?: boolean;
    isLightKycAllowed?: boolean;
    name?: string;
    supportedDocuments?: string[];
    currencyCode?: string;
    states?: State[];
    partners?: Partner[];
}

/**
 * Response structure for fetching supported countries.
 */
export interface CountriesResponse {
    response?: Country[];
}

/**
 * Response structure for fetching an access token.
 */
export interface AcessToken {
    accessToken?: string;
    expiresAt?: number;
}

// --- Currencies and Payments Interfaces ---

/**
 * Interface for payment options supported by Transak.
 */
export interface PaymentOptions {
    name?: string; // Display name of the payment method. E.g., "Instant Transfer"
    id?: string; // Unique identifier for the payment method. E.g., "gbp_bank_transfer"
    displayText?: boolean; // Whether the method should be shown in UI
    processingTime?: string; // Estimated time for processing transactions
    icon?: string; // Icon/logo representing the payment method
    limitCurrency?: string; // Currency in which limits are denominated
    maxAmount?: number; // Maximum transaction amount (in limitCurrency)
    minAmount?: number; // Minimum transaction amount (in limitCurrency)
    isActive?: boolean; // Whether the method is active/available
    defaultAmount?: number; // Suggested default amount for transactions
    isConverted?: boolean; // Whether amount is converted across currencies
    isPayOutAllowed?: boolean; // Whether payouts are allowed via this method
    minAmountForPayOut?: number; // Minimum payout amount
    maxAmountForPayOut?: number; // Maximum payout amount
    defaultAmountForPayOut?: number; // Suggested default payout amount
    roundOff?: number; // Rounds off currency amounts
}

/**
 * Interface for fiat currency details.
 */
export interface FiatCurrencyResponse {
    symbol?: string; // Fiat Currency Symbol E.g., "GBP"
    supportingCountries?: string[]; // The primary countries associated with a particular fiat currency
    logoSymbol?: string; // logo symbol of county. E.g., "GB"
    name?: string; // Name of Fiat Currency E.g., "British pound"
    isPopular?: boolean;
    isAllowed?: boolean; // Allowed to be purchased (Buy Flow)
    paymentOptions?: PaymentOptions[];
    defaultCountryForNFT?: string; // Specific default country supporting NFT. E.g., "GB"
    icon?: string; // URL of icon representing the fiat currency
}

/**
 * Response structure for fetching supported fiat currencies.
 */
export interface FiatCurrenciesResponse {
    response?: FiatCurrencyResponse[];
}

/**
 * Interface for different resolutions of an asset image.
 */
export interface AssetImage {
    large?: string; // Large resolution image of asset
    small?: string; // Small resolution image of asset
    thumb?: string; // Thumbnail image
}

/**
 * Interface for blockchain network details.
 */
export interface AssetNetwork {
    name?: string; // Network Name. E.g., "ethereum"
    fiatCurrenciesNotSupported?: string[];
    chainId?: string;
}

/**
 * Interface for crypto currency (asset) details.
 */
export interface CryptoCurrencyResponse {
    _id?: string; // Unique identifier
    coinId?: string; // Coin’s internal identifier. E.g., "ethereum"
    address?: string; // Currency contract address
    addressAdditionalData?: boolean; // Extra address details
    createdAt?: string; // Creation timestamp (UTC)
    decimals?: number; // Number of decimal places for token precision
    image?: AssetImage; // Asset image object
    image_bk?: AssetImage; // Backup or secondary image set
    isAllowed?: boolean; // Cryptocurrency allowed to be purchased (Buy Flow)
    isPopular?: boolean;
    isStable?: boolean; // Whether asset is a stablecoin
    name?: string; // Currency name. E.g., "Bitcoin"
    roundOff?: number; // Number of decimals for rounding off crypto amount
    symbol?: string; // Currency symbol. E.g., "BTC"
    isIgnorePriceVerification?: boolean;
    kycCountriesNotSupported?: string[]; // Countries where this currency is not supported for KYC
    fiatCurrenciesNotSupported?: string[]; // Fiat currencies not supported for this asset
    network?: AssetNetwork; // Network information
    chainId?: string; // Blockchain network Chain ID. E.g., "1"
    uniqueId?: string; // Unique ID based on the network and currency. E.g., "ETHbase"
    tokenType?: string; // Indicates whether the currency token is a general token
    tokenIdentifier?: string; // Token-specific identifier
    isPayInAllowed?: boolean; // Whether the cryptocurrency is supported for sell
    minAmountForPayIn?: number; // Minimum pay-in amount
    maxAmountForPayIn?: number; // Maximum pay-in amount
}

/**
 * Response structure for fetching supported crypto currencies.
 */
export interface CryptoCurrenciesResponse {
    response?: CryptoCurrencyResponse[];
}

// --- Order Event Interfaces (Unified and Complete) ---

/**
 * Interface for an item in the order's status history log.
 */
export interface IStatusHistory {
    status?: string;
    createdAt?: string; // Date of status change (ISO 8601)
    message?: string;
    isEmailSentToUser?: boolean;
    partnerEventId?: string;
    timestamp?: string; // Alternative date field found in 'CREATED'
}

/**
 * Interface for Payment Gateway (PG) redirection data within card payment.
 */
export interface ICardPaymentPgData {
    redirectionRequired?: boolean;
    redirectionRequestData?: {
        method?: "GET" | "POST" | string;
        header?: Record<string, any>;
        redirectUrl?: string;
        body?: Record<string, any>;
    };
}

/**
 * Interface for card payment specific data.
 */
export interface ICardPaymentData {
    orderId?: string;
    paymentId?: string;
    paymentMethodId?: string | null;
    pgData?: ICardPaymentPgData;
    liquidityProvider?: string;
    updatedAt?: string;
    // Fields specific to SUCCESSFUL/PROCESSING
    status?: string;
    statusReason?: string;
    processedOn?: string;
}

/**
 * Interface representing the full status object of a Transak order.
 * This unifies all fields found in both CREATED and SUCCESSFUL events.
 */
export interface ITransakOrderStatus {
    id?: string;
    userId?: string;
    isBuyOrSell?: "BUY" | "SELL";
    partnerOrderId?: string;
    partnerCustomerId?: string;
    ipAddress?: string;
    fiatCurrency?: string;
    cryptoCurrency?: string;
    fiatAmount?: number;
    status?: string;
    amountPaid?: number;
    paymentOptionId?: string;
    quoteId?: string;
    orderProcessingType?: string;
    deviceSessionId?: string;
    addressAdditionalData?: boolean;
    network?: string;
    conversionPrice?: number;
    cryptoAmount?: number;
    totalFeeInFiat?: number;
    fiatAmountInUsd?: number;
    paymentOptions?: any[];
    countryCode?: string;
    stateCode?: string;
    orderChannelType?: string;
    tokenContractAddress?: string;
    campaignAmount?: number;
    campaignAmountInUsd?: number;
    tfPerOff?: number;
    aTtlFees?: number;
    aTskFees?: number;
    walletAddress?: string;
    walletLink?: string;
    autoExpiresAt?: string;
    userKycType?: string;
    statusHistories?: IStatusHistory[];
    createdAt?: string;
    cardPaymentData?: ICardPaymentData;
    lastNotifiedAt?: string;
    statusReason?: string;
    transakFeeAmount?: number;
    updatedAt?: string;
}

/**
 * Interface for the TRANSAK_ORDER_CREATED webhook event payload.
 */
export interface ITransakOrderCreated {
    status?: ITransakOrderStatus;
    eventName?: "TRANSAK_ORDER_CREATED";
}

/**
 * Interface for the TRANSAK_ORDER_SUCCESSFUL webhook event payload.
 */
export interface ITransakOrderSuccessful {
    status?: ITransakOrderStatus;
    eventName?: "TRANSAK_ORDER_SUCCESSFUL";
}

export interface ITransakRefreshTokenResp {
    data: {
        accessToken: string;
        expiresAt: number;
    }
}