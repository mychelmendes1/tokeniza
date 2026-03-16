import { BigNumber } from 'bignumber.js';
import { Assets } from './IAssets.model';
import { NFTStakingApplicationRewards } from './INFTStaking';

export interface ICustomerNFTs {
    id: string;
    customer_id: string;
    asset_id: string;
    blockchain_token_id: string;
    price_resell: BigNumber;
    price_paid?: BigNumber;
    on_resell: boolean;
    asset_detail?: Assets;
    is_reward?: boolean;
    reward_details?: NFTStakingApplicationRewards;
}