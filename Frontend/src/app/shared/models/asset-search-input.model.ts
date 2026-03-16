import { BigNumber } from 'bignumber.js';
import { Collections } from './collections';
import { AssetResaleData, Assets } from './IAssets.model';
import { SortFilterEnum } from './sort-filter.enum';

export class AssetsSearchInput {
    public name?: string;
    public sortRule?: SortFilterEnum;
    public collectionId?: string;
    public categoryId?: string;
    public isHome?: any;
    public isAdmin?: boolean;
    public isCollectionProfile?: boolean;
    public limit?: number;
    public offset?: number;
    public categoriesToFilter?: Array<string>;
}

export class AssetSearchResult {
    public id: string;
    public price: BigNumber;
    public name?: string;
    public photos?: any;
    public url?: string;
    public description?: string;
    public availableTokens: BigNumber;
    public initialTokens: BigNumber;
    public nftId?: string;
    public characteristics: any;
    public auctionTimeExpiration?: string; // Used in frontend to display the time expiration.
    public only_package?: boolean;
    public resale?: AssetResaleData;
    public disabled!: Date;
    public enabled?: boolean;
    public category_id?: string;
    public collection?: Collections;
    public collection_id?: string;
    public auction?: any;
    public onResell?: boolean;
    public originalPrice?: BigNumber;
    public blockchainId?: string;
    public status?: ENFTsAllocations;

    constructor(object: Assets)
    {
        this.id = object.id;
        this.price = new BigNumber(object.price);
        this.name = object.name;
        this.photos = object.photos;
        this.description = object.description;
        this.availableTokens = new BigNumber(0);
        this.nftId = object?.nftId;
        this.initialTokens = new BigNumber(0);
        this.characteristics = object.characteristics;
        this.only_package = object.only_package;
        this.resale = object.resale;
        this.collection = object.collection;
    }
}

export class AssetsSearchReport {
    public entries!: Array<AssetSearchResult>;
}

export class CategoryFilter {
    public id!: string;
    public name!: string;
    public url!: string;
    public isSelected?: boolean;
    public allow_product_creation?: boolean;
}

export enum ENFTsAllocations {
    WAITING = 'waiting',
    FINISHED = 'finished',
    DISTRIBUITING = 'distribuiting'
}