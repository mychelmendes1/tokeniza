import BigNumber from "bignumber.js";

export class Token {
    public id!: string;
    public name!: string;
    public description!: string;
    public details?: string;
    public ecosystem?: string;
    public others?: string;
    public network_id!: string;
    public exchange_lock?: boolean;
    public favorites?: any;
    public claim?: boolean;
    public cmc_name!: string;
    public contract_address!: string;
    public pdf_documentation!: string;
    public legal_documentation?: string;
    public supply!: number;
    public minimumToTransfer?: number;
    public minimumToBuy?: number;
    public display_on_tokenization?: boolean;
    public balance?: number;
    public transakEnabled?: boolean

    /**
     * All the taxes in the system
     */
    public transaction_tax!: number;
    public withdrawaw_tax!: number;
    public user_withdrawal_tax!: number;
    public product_buy_tax!: number;
    public token_buy_with_digital_banking!: number;
    public user_banking_withdrawal_tax!: number;
    public nft_buy_tax!: number;
    public tokens_buy_tax!: number;
    public token_buy_with_cielo_tax!: number;
    public token_buy_with_pagseguro_tax!: number;
    public token_buy_with_coinpayments_tax!: number;
    public repurchase_mechanism!: string;
    public tax_type!: string;
    public rate?: string;
    public disabled?: Date;
    public paymentPrice?: number;
    public checked?: boolean;
    public operate_exchange?: boolean;
    public brasil_bitcoin_integration?: boolean;
    public checkout_text?: string;
    public integrate_book?: boolean;
    public integrate_trading_view?: boolean;
    public pair?: string;
    public image_symbol!: string;
    public enabled!: boolean;
    public isMain!: boolean;
    public usedToPay!: boolean;
    public allow_metamask!: boolean;
    public buyable!: boolean;
    public withdrawable!: boolean;
    public network_fee?: number;
    public transferable!: boolean;
    public stakable!: boolean;
    public allow_dividends!: boolean;
    public photos?: Array<any>;
    public price?: any; // Used only in frontend
    public available_for_sale?: number; // Used only in frontend
    public blockchain_link?: string; // Used only in frontend
    public website?: string;
    public statistics?: TokenStatistics;
    public creation_date?: Date;
    public cover_photo?: string;
    public issuer_name?: string;
    public multiply?: boolean;
    public onlyInteger?: boolean;
    public automatic_holding!: boolean;
    public indicationRewards?: Array<TokenIndicationRewards>;
    public operation_fee?: number;
    public isAutomaticSwap?: boolean;
    public isMainFiatToken?: boolean;
    public brlaIntegration?: boolean;

    public userBalance?: BigNumber; // Created for frontend.

    constructor (object?: Token){
        if (object){
            Object.assign(this, object);
        }
    }
}

export enum TokenIndicationRewardsPayType {
    P = 'P', //Percentual
    A = 'A'  //Absolute
}

export enum TokenIndicationRewardsType {
    BUY = 'buy',
    SIGN_UP = 'signUp'
}

export class TokenIndicationRewards {
    public id: string;
    public token_id: string;
    public payment_type: TokenIndicationRewardsPayType;
    public amount: number;
    public max_threshold?: number;
    public indication_type: TokenIndicationRewardsType;

    constructor (tokenId: string, indType: TokenIndicationRewardsType, configs: TokenIndicationRewards){
        this.id = configs?.id;
        this.token_id = tokenId;
        this.indication_type = indType;
        this.payment_type = configs?.payment_type;
        this.max_threshold = isNaN(Number(configs?.max_threshold)) ? 0 : Number(configs?.max_threshold);
        this.amount = isNaN(configs?.amount) ? 0 : Number(configs?.amount);
    }
}

export class TokenStatistics {
    public coin: string;
    public qty_buyers: number;
    public qty_issued: number;
    public qty_available: number;
    public qty_with_issuer: number;
    public exchangeStatistics: ExchangeStatistics;

    constructor(object?: Partial<TokenStatistics>) {
        this.coin = object?.coin ?? '';
        this.qty_buyers = Number(object?.qty_buyers) || 0;
        this.qty_issued = Number(object?.qty_issued) || 0;
        this.qty_available = Number(object?.qty_available) || 0;
        this.qty_with_issuer = Number(object?.qty_with_issuer) || 0;
        this.exchangeStatistics = object?.exchangeStatistics ?? {} as ExchangeStatistics;
    }
}

export class ExchangeStatistics {
    public price!: number;
    public originalPrice?: number;
    public priceInUsd?: number;
    public pricePair?: number;
    public volume_24h?: number;
    public variation?: number;
    public lastPrice?: number;
    public volume_change_24h?: number;
    public variation_1h?: number;
    public variation_24h?: number;
    public variation_7d?: number;
    public variation_30d?: number;
    public variation_60d?: number;
    public max24h?: number;
    public min24?: number;
    public min24h?: number;
    public variation_90d?: number;
    public market_cap?: number;
    public market_cap_change?: number;
    public circulating_supply?: number;
    public circulating_supply_token?: number;
}