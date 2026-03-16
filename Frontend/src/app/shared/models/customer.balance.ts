import { Assets } from './IAssets.model';
import { BigNumber } from 'bignumber.js';

export class CustomerBalance {
    /**
     * The customer Id of the request.
     */
    public customerId!: string;

    /**
     * The amounts of each system.
     */
    public balances!: Array<CustomerAssetDetail>;

    constructor(object: CustomerBalance)
    {
        Object.assign(this, object);
    }
}

export class CustomerAssetDetail {
    balance!: BigNumber;
    asset?: Assets;
}