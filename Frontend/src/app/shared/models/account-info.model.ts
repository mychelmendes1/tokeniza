import { ILegalPerson, IPerson } from "./account.person.model";

export interface IAccount {
    branch: string;
    account: string;
}

export interface IAccountInfo extends IPerson {
    statusAccount: string;
    clientCode: string;
    account: IAccount;
    createDate: Date;
}

export interface IAccountInfoLegalPerson extends ILegalPerson {
    statusAccount: string;
    clientCode: string;
    businessAccount: IAccount;
    createDate: Date;
}

export class UpdateAccountInfoRequest {
    public businessEmail?: string;
    public businessPhoneNumber?: string;
}