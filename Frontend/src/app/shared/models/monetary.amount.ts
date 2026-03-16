import { BigNumber } from 'bignumber.js';

BigNumber.config({ EXPONENTIAL_AT: 1e+9, DECIMAL_PLACES: 1e+9 }); // This will avoid exponential notation.
const ZERO = new BigNumber(0);
/**
 * The representation for a Monetary value, that may include value and Unit of Money.
 */
export class MonetaryAmount
{
    /**
     * The number representation of a Monetary amount principal.
     */
    public principalAmount?: BigNumber;

    /**
     * The current value of the aquisition
     */
    public currentValue?: BigNumber;
    public taxAmount?: BigNumber;

    public unitOfMoney?: string;

    constructor(object: Partial<MonetaryAmount | null>)
    {
        if (!object)
        {
            this.principalAmount = ZERO;
            this.currentValue = ZERO;
            this.taxAmount = ZERO;
            this.unitOfMoney = '';
            return;
        }
        this.principalAmount = new BigNumber(object.principalAmount || 0);
        this.currentValue = new BigNumber(object.currentValue || 0);
        this.taxAmount = new BigNumber(object.taxAmount || 0);
        this.unitOfMoney = object.unitOfMoney;
    }

}