import { Photo } from './photo.model';
import { BigNumber } from 'bignumber.js';
import { Collections } from './collections';
import { Address } from './IAddress.model';
import { Modes } from './modes.enum';
import { IAssetsTokens } from './IAssetsTokens.model';
import { NFTStakingApplicationRewards } from './INFTStaking';
import { AuctionModel } from './auction.model';


export interface PaymentTypes {
    unitOfMoney: string;
    percentage: number;
}

export class Assets {
    public id!: string;
    public address!: Address;
    public name!: string;
    public allow_split?: boolean;
    public short_name?: string; // When its a NFT Package
    public description!: string;
    public mode!: Modes;
    public quantity?: number;
    public status!: Statuses;
    public category_id?: string;
    public block_liquidity_option?: boolean;
    public is_distribuition_fiat?: boolean;
    public disabled!: Date;
    public mobiled!: boolean;
    public vacancies!: number;
    public type?: string = 'NFT';
    public contract!: string;
    public bedrooms!: number;
    public block_resell?: boolean;
    public enabled?: boolean;
    public bathrooms!: number;
    public area!: number;
    public acceptBnb?: boolean;
    public bnbPrice?: BigNumber;
    public acceptCoin?: boolean;
    public coinPrice?: BigNumber;
    public minimumToBuy?: number;
    public maxToBuy?: number;
    public bothMandatory?: boolean;
    public constructedArea!: number;
    public photos!: Array<Photo>;
    public url?: string;
    public when!: Date;
    public generatedTokens!: BigNumber;
    public characteristics?: Array<ProductCharacteristics> = [];
    public category?: any;
    public price!: BigNumber;
    public external_link?: string;
    public skipPrice?: boolean;
    public nft_package_type?: string;
    public payment_types?: PaymentTypes[] = [];
    public only_package?: boolean;
    public token?: IAssetsTokens;
    public wallets_commission: Array<{id: string, commission: number}> = [];
    public resale?: AssetResaleData;
    public nftId?: string;
    public blockchainId?: string;
    public liquidity_token?: string;
    public reward_details?: NFTStakingApplicationRewards;
    public on_staking?: boolean;
    public is_reward_prize?: boolean;
    public collection!: Collections;
    public onAuction?: boolean;
    public collection_id?: string;
    public availableTokens!: BigNumber;
    public auction?: AuctionModel;
    public auctionTimeExpiration?: string; // Used in frontend to display the time expiration.
    public onResell?: boolean;
    public originalPrice?: BigNumber;
    public taxType?: string;
    public transactionTax?: number;
    public projectUrl?: string;
    public projectDescription?: string;
    public projectCustomHtml?: string;

    public getCorrectPrice(): number{
        if (this.resale?.onResale){
            return new BigNumber(this.resale.resaleValue).toNumber();
        }
        return new BigNumber(this.price).toNumber();
    }

    constructor (object?: Assets){
        if (object){
            Object.assign(this, object);
        }
    }
}
export interface ResellAsset {
    nftId: string;
    only_for_customer: string;
    resellValue: BigNumber;
}

export interface AssetResaleData {
    onResale: boolean;
    on_resell?: boolean;
    resaleValue: BigNumber;
    resale_value?: BigNumber;
    sellerName?: string;
    sellerId?: string;
    publicWalletKey?: string;
    onlyForCustomer?: boolean;
}

export interface ProductCharacteristics {
    key: string;
    value: string;
    isEditing?: boolean; // Used only in Frontend
}

export enum Statuses {
    READY,
    BUILDING,
    PLANNED
}