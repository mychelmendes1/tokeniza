import BigNumber from "bignumber.js";

export class PaymentTypeOption {
    public name!: string;
    public value!: number | undefined;
    public allowed!: boolean;
    public showMissingBalance?: boolean;
    public isMandatory!: boolean;
    public isSplitted?: boolean;
    public quote?: any;
    public showTax?: boolean;
    public taxValue?: string;
    public limitToBuy?: BigNumber;
    public taxType?: string;
}