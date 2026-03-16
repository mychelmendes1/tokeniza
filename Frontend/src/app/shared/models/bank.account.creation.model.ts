import { IUserDocumentsUpdate } from "./IUserDocuments";
import { UserIdentifierEnum } from "./user.logged.model";

export class AccountCreationRequest {
    public transactionPassword!: string;
    public person?: Person;
    public legalPerson?: LegalPerson;
    public bankDocuments!: IUserDocumentsUpdate;
    public walletDocuments?: CreateWalletData;
}

export class LegalPerson {
    public documentNumber!: string;
    public contactNumber!: string;
    public businessEmail!: string;
    public businessName!: string;
    public tradingName!: string;
    public owner!: Person[];
    public businessAddress!: Address;
    public letterOfAttorneyLink?: string;
    public socialContractLink?: string;
    public establishmentDate?: Date;
    public lastYearAverageRevenue?: number;
    public cnaeCode?: string;
    public juridicalNature?: string;
}

export class Person {
    public documentNumber!: string;
    public phoneNumber!: string;
    public email!: string;
    public motherName!: string;
    public fullName!: string;
    public socialName!: string;
    public birthDate!: string;
    public address!: Address;
    public isPoliticallyExposedPerson!: boolean;
    public documentLink!: string
    public selfieLink?: string;

    public rg?: string;
    public rgIssueDate?: Date;
    public rgIssuingOrgan?: string;
    public placeOfBirth?: string;
    public gender?: string;
    public monthlyIncome?: number;
    public maritalStatus?: string;
    public occupation?: string;
    public isPhoneVerified?: boolean;
}

export class Address {
    public postalCode!: string;
    public street!: string;
    public number!: number;
    public addressComplement!: string;
    public neighborhood!: string;
    public city!: string;
    public state!: string;
    public longitude?: number;
    public latitude?: number;
    public documentLink?: string;
}

export class CreateWalletData {
    public email!: string;
    public password!: string;
    public firstName!: string;
    public lastName!: string;
    public document!: string;
    public indicationToken: string | undefined;
    public documentType!: UserIdentifierEnum | typeof UserIdentifierEnum;
    public documentToken: string | undefined;
}