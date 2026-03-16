import { Assets } from "./IAssets.model";
import { ICustomerNFTs } from "./ICustomerNFTs";

export enum UNIT_OF_TIME{
    D = 'D',
    M = 'M'
}

export interface NFTStakingConfig{
    id: string;
    title: string;
    staking_length: number;
    unit_of_time: UNIT_OF_TIME;
    quantity_reward: number;
    quantity_user_has: number;
    enabled: boolean;
    nft_pools?: NFTStakingPool[];
    estimated_end_date?: Date;
    user_has?: boolean;
}

export class NFTStakingConfigSearch{
    public userId?: string;
    public assetId?: string;
    constructor (object?: NFTStakingConfigSearch){
        if (object){
            Object.assign(this, object);
        }
    }
}

export interface NFTStakingPool{
    id: string;
    config_id: string;
    asset_id: string;
    enabled: boolean;
    configs: NFTStakingConfig;
    asset_detail: Assets;
}

export interface NFTStakingPoolSearch{
    config_id: string;
    asset_id?: string;
}

export class StakedNFT{
    public application!: NFTStakingApplication;
    public config!: NFTStakingConfig;
    public progress!: number;
    constructor(object?: NFTStakingApplication){
        if (object){
            Object.assign(this, object);
        }
    }
}

export class NFTStakingApplication{
    public id!: string;
    public nft_id!: string;
    public config_id!: string;
    public customer_id!: string;
    public start_date!: Date;
    public end_date!: Date;
    public early_leave!: boolean;
    public leave_date?: Date;
    public reward_provided!: boolean;
    public nft_details?: ICustomerNFTs;
    public config?: NFTStakingConfig
    constructor (object?: NFTStakingApplication){
        if (object){
            Object.assign(this, object);
        }
    }
}

export class NFTStakingApplicationCreate{
    public nft_id!: string;
    public config_id!: string;
    public customer_id!: string;
    public start_date!: Date;
    public end_date!: Date;
    constructor(object: NFTStakingApplicationCreate){
        Object.assign(this, object);
    }
}

export class NFTStakingApplicationRemove{
    public application_id!: string;
    public customer_id!: string;
    constructor(object: NFTStakingApplicationRemove){
        Object.assign(this, object);
    }
}

export interface NFTStakingSummary{
    stakedNFTs: number;
    availablesForStaking: number;
}

export interface AvailableNFTsReport{
    nft_details:ICustomerNFTs;
    campaing_details: NFTStakingConfig[];
}

export interface NFTStakingApplicationRewards{
    id: string;
    appl_id: string;
    nft_id: string;
    paid_at: Date;
}

export interface FinalizedStakingApplication {
    campaign_name: string;
    staking_length: number;
    unit_of_time: UNIT_OF_TIME;
    end_date: Date;
}