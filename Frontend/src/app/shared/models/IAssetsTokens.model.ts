import { Assets } from './IAssets.model';
import { BigNumber } from 'bignumber.js';

export interface IAssetsTokens {
    asset: Assets;
    availableTokens: BigNumber;
    initialValue: BigNumber;
}