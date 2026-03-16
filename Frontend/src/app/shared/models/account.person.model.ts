import { IAddress } from "./account.address.model";

export interface IPerson {
    documentNumber: string;
    phoneNumber: string;
    email: string;
    motherName: string;
    fullName: string;
    socialName?: string;
    birthDate: string;
    address: IAddress;
    isPoliticallyExposedPerson: boolean;
    documentLink?: string
    selfieLink?: string;
}

export class Person implements IPerson {
    public documentNumber!: string;
    public phoneNumber!: string;
    public email!: string;
    public motherName!: string;
    public fullName!: string;
    public socialName?: string;
    public birthDate!: string;
    public address!: IAddress;
    public isPoliticallyExposedPerson!: boolean;
    public documentLink?: string
    public selfieLink?: string;
}

export interface ILegalPerson {
    documentNumber: string;
    businessPhoneNumber: string;
    businessEmail: string;
    businessName: string;
    tradingName: string;
    owners: Person[];
    businessAddress: IAddress;
    letterOfAttorneyLink?: string
}

export class LegalPerson implements ILegalPerson {
    public documentNumber!: string;
    public businessPhoneNumber!: string;
    public businessEmail!: string;
    public businessName!: string;
    public tradingName!: string;
    public owners!: Person[];
    public businessAddress!: IAddress;
    public letterOfAttorneyLink?: string
}