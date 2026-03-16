import { BigNumber } from 'bignumber.js';

/**
 * This interface represents the amount converted to a target currency.
 */
export interface AmountConvertedResult
{
    /**
     * The amount converted
     */
    amount: BigNumber;

    amountUsd: BigNumber;

    /**
     * The currency of the amount converted
     */
    currency: string;

    reference_currency?: string;

    /**
     * The rate used in the calculation
     */
    rate: BigNumber;

    rateUsd: BigNumber;

    /**
     * The tax used in the calculation
     */
    tax: BigNumber;
}