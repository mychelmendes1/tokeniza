import BigNumber from "bignumber.js";

export class PlatformBalance
{
    /**
    * The customer Id of the request.
    */
    customerId!: string;

    /**
    * The user platform balance.
    */
    amount!: BigNumber;
    unitOfMoney!: string;
    balance?: BigNumber;
    reserved?: BigNumber;
    fiatLock?: number;
}