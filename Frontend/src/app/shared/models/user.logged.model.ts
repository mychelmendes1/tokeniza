import { BankingAccount } from "./banking-account";

export enum UserStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}

export class UserLoggedModel {
    public trusteeshipProfile!: boolean;
    public cpf?: string;
    public cnpj?: string;
    public id!: string;
    public email!: string;
    public firstName!: string;
    public cellphone?: string;
    public name!: string;
    public invitedBy?: string;
    public lastName!: string;
    public status?: UserStatus;
    public creationDate!: Date;
    public isAdmin!: boolean;
    public btc_wallet?: string;
    public tron_wallet?: string;
    public applicationId?: string;
    public jwtAccessToken?: string;
    public jwtSessionRefreshToken?: string;
    public jwtUserToken?: string;
    public storeId?: string;
    public documentType!: UserIdentifierEnum;
    public walletPublicData?: string;
    public bankingAccount?: BankingAccount;
    public hasInternal2fa?: boolean;
    public phone?: string;
    public nickname?: string;
    public username?: string;
    public selfieImage?: string;
    public externalSourceIndication?: string;
    public externalSourceId?: string;
    public sentBrlaLvlOne?: boolean;
    public sentBrlaLvlTwo?: boolean;
    public dateOfBirth?: Date;
    public openingDate?: Date;
    public identityCompanyManager?: string;
    public isPhoneVerified?: boolean;
    public externalDoc?: string;
}

export class IUserGenericDocuments{
    public id!: string;
    public user_id!: string | undefined;
    public document_description!: string;
    public document_url!: string;
    public created_at!: Date;
    public last_update!: Date;
}

export enum UserIdentifierEnum {
    CPF = 'cpf',
    CNPJ = 'cnpj',
    External = 'externalDoc'
}