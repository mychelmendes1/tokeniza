import { IAccountInfo, IAccountInfoLegalPerson } from "./account-info.model";

export interface IAccountInfoRequest {
    accountId: string;
    documentNumber: string;
}

export interface IAccountInfoResponse extends IAccountInfo {}

export interface IAccountInfoLegalPersonResponse extends IAccountInfoLegalPerson {}