import BigNumber from 'bignumber.js';
import { Assets } from './IAssets.model';
import { Photo } from './photo.model';
import { AuctionModel } from './auction.model';

export class NFTPackageToBuy {
    public package_id!: string;
    public buyer_id!: string;
}

export class NFTPackageBought {
    public package_info!: NFTPackage;
    public nfts!: Assets[]
}

export enum PACKAGE_TYPE{
    BRONZE="BRONZE",
    SILVER="SILVER",
    GOLD="GOLD",
    DIMOND="DIMOND",
    PLATINUM="PLATINUM"
}

export class NFTPackageCreate{
    public short_name!: string;
    public description!: string;
    public url!: string; // package_image
    public quantity!: number;
    public package_size!: number;
    public packages!: Array<{
        package_type: PACKAGE_TYPE,
        quantity: number,
    }>;
    public category?: string;
    public enabled!: boolean;
}

export class NFTPackage{
    public id!: string;
    public short_name!: string;
    public description!: string;
    public url!: string; // package_image
    public quantity!: number;
    public photos?: Array<Photo>;
    public category?: string;
    public collection?: string;
    public collection_id?: string;
    public category_id?: string;
    public categoryAux?: any;
    public price?: BigNumber;
    public enabled: boolean = true;
    public acceptBnb?: boolean;
    public bnbPrice?: BigNumber;
    public acceptCoin?: boolean;
    public coinPrice?: BigNumber;
    public bothMandatory?: boolean;
    public package_size!: number;
    public payment_types?: any;
    public wallets_commission: Array<{id: string, commission: number}> = [];
    public taxType?: string;
    public minimumToBuy?: string;
    public maxToBuy?: string;
    public transactionTax?: number;
    public packages: Array<{
        package_type: PACKAGE_TYPE,
        quantity: number,
    }> = [];

    constructor (object?: NFTPackage){
        if (object){
            Object.assign(this, object);
        }
    }
    public auction?: AuctionModel;
}

export class NFTSearch{
    public id!: string;
    public short_name!: string;
    public description!: string;
    public package_size!: number;
    public url!: string;
    public enabled!: boolean;
    public package_type!: PACKAGE_TYPE;
    public quantity!: number;
}

export class NFTPackageValidate{
    public package_type!: PACKAGE_TYPE;
    public package_size!: number;
    public quantity!: number;
}