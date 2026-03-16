import JSEncrypt from 'jsencrypt';
import { AccountCreationRequest } from './bank.account.creation.model';
import { UserIdentifierEnum } from './user.logged.model';
import * as forge from 'node-forge';

// tslint: disable-next-line: max-classes-per-file
class EncryptedBase
{
    private static PRIVATE_KEY: string;

    constructor(rsaKey: string)
    {
        EncryptedBase.PRIVATE_KEY = rsaKey;
    }

    protected encrypt(msg: string): any
    {
        // Convert PEM key to forge public key
        const publicKey = forge.pki.publicKeyFromPem(EncryptedBase.PRIVATE_KEY);

        // Encrypt using RSA-OAEP with SHA-256
        const encrypted = publicKey.encrypt(msg, 'RSA-OAEP', {
            md: forge.md.sha256.create(),
            mgf1: {
                md: forge.md.sha256.create()
            }
        });

        // Convert to base64
        return forge.util.encode64(encrypted);
    }
}

export class SignupEncrypt extends EncryptedBase
{
    public email: string;
    public username: string;
    public firstName: string;
    public lastName: string;
    public passport: string;
    public password: string;
    public cpf: string;
    public cnpj: string;
    public indicationToken?: string;
    public documentToken?: string;
    public diditToken?: string;
    public token_id?: string;
    public accountCreationRequest?: AccountCreationRequest;
    public account_type?: string;
    public nft_token?: string;
    public externalSourceIndication?: string;
    public phone?: string;
    public externalSourceId?: string;
    public dateOfBirth?: string;
    public openingDate?: string;
    public identityCompanyManager?: string;
    public isPhoneVerified?: boolean;

    constructor(
        email: string,
        password: string,
        username: string,
        firstName: string,
        lastName: string,
        documentId: string,
        indicationToken: string,
        rsaKey: string,
        documentType: UserIdentifierEnum | typeof UserIdentifierEnum,
        documentToken: string,
        diditToken: string,
        token_id: string,
        accountCreationRequest: AccountCreationRequest,
        account_type: string,
        externalSourceIndication: string,
        nft_token: string,
        phone: string,
        externalSourceId: string,
        dateOfBirth: string,
        openingDate: string,
        identityCompanyManager: string,
        isPhoneVerified: boolean
        )
    {
        super(rsaKey);
        this.email = email;
        this.username = username;
        this.password = this.encrypt(password);
        this.firstName = firstName;
        this.lastName = lastName;
        this.cpf = '';
        this.cnpj = '';
        this.passport = '';
        this.indicationToken = indicationToken;
        this.documentToken = documentToken;
        this.diditToken = diditToken;
        this.nft_token = nft_token;
        this.account_type = account_type;
        this.token_id = token_id;
        this.accountCreationRequest = accountCreationRequest;
        this.externalSourceIndication = externalSourceIndication;
        this.phone = phone;
        this.externalSourceId = externalSourceId;
        this.dateOfBirth = dateOfBirth ?? null;
        this.openingDate = openingDate ?? null;
        this.identityCompanyManager = identityCompanyManager ?? null;
        this.isPhoneVerified = isPhoneVerified;

        if (documentType === UserIdentifierEnum.External) {
            this.passport = documentId;
        } else if (documentType === UserIdentifierEnum.CNPJ) {
            this.cnpj = documentId;
        } else if (documentType === UserIdentifierEnum.CPF) {
            this.cpf = documentId
        }
    }
}