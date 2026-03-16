export enum E_PERSONAL_DOCUMENT_TYPE {
    SELFIE = 'SELFIE',
    IDENTIFICATION = 'IDENTIFICATION',
    ADDRESS = 'ADDRESS',
    BANK_SELFIE = 'BANK_SELFIE',
    BANK_IDENTIFICATION = 'BANK_IDENTIFICATION',
    BANK_ADDRESS = 'BANK_ADDRESS',
    BANK_COMPANY_ADDRESS = 'BANK_COMPANY_ADDRESS',
    BANK_LETTER_OF_ATTORNEY = 'BANK_LETTER_OF_ATTORNEY',
    COMPANY_SOCIAL_CONTRACT = 'COMPANY_SOCIAL_CONTRACT'
}

// Document list item returned by KYC documents endpoints
export interface IUserDocuments {
    document_type: E_PERSONAL_DOCUMENT_TYPE;
    document_url: string;
    created_at?: string | Date;
    last_update?: string | Date;
    status?: string;
}

// Payload used when updating documents in some banking flows
export class IUserDocumentsUpdate {
    public documents!: {
        document_type: E_PERSONAL_DOCUMENT_TYPE;
        document_url: string;
    }[];
}

export enum PERSONAL_DOCUMENTS_FILTER {
    KYC = 'KYC',
    BANK = 'BANK'
}
