import BigNumber from "bignumber.js";

export class ExternalPaymentModel {
    public userId?: string;
    public fiatAmount?: BigNumber;
    public name?: string;
    public email?: string;
    public identify?: string;
    public depositMethod?: DepositMethodsEnum | string;
}

export enum DepositMethodsEnum {
    CREDTI_CARD = 'creditCard',
    PIX = 'PIX',
    TICKET = 'ticket',
    TOKEN = 'token'
}

export class ExternalDepositResponseModel {
    public id?: string;
    public userId?: string;
    public fiatAmount?: BigNumber;
    public tokensAmount?: string;
    public depositMethod?: string;
    public depositAddress?: string;
    public name?: string;
    public identity?: string;
    public email?: string;
    public status?: string;
}