export class File {
    public name!: string;
    public file!: string | ArrayBuffer;
    public confidentiality?: FileStorageConfidentiality;
    public documentType?: FileStorageDocumentType;
}

export enum FileStorageConfidentiality {
    PUBLIC = "PUBLIC",
    SECURED = "SECURED"
}

export enum FileStorageDocumentType {
    PERSONAL_DOCUMENT = "PERSONAL_DOCUMENT",
    TRANSACTION_RECEIPT = "TRANSACTION_RECEIPT",
    CREDIT_LETTER = "CREDIT_LETTER"
}

export interface StorageObject {
    value: {
        image: string
    }
}

export interface StorageObjectContent {
    Body: {
        data: ArrayBuffer;
    },
    ContentType: string;
}