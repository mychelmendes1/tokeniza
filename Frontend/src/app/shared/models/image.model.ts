import { FileStorageConfidentiality, FileStorageDocumentType } from "./file.model";

export class Image {
    public name!: string;
    public image!: string | ArrayBuffer;
    public contentType?: string;
    public confidentiality?: FileStorageConfidentiality;
    public documentType?: FileStorageDocumentType;
}