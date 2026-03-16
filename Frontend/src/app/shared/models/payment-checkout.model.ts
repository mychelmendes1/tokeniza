import BigNumber from "bignumber.js";

export class CheckoutObject {
    public paymentTypes!: Array<PaymentTypes>;
    public data: any;
    public price!: BigNumber;
    public quantity!: BigNumber;
    public external_id?: string;
    public email?: string;
    public type?: string;
}

export class PaymentTypes {
    public unitOfMoney!: string;
    public percentage!: number;
}