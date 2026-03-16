export const CNPJ_LENGTH: number = 14;
export const CPF_LENGTH: number = 11;

export function hasCNPJLength(document: string): boolean {
    return document?.replace(/[^\d]/g, '')?.length === CNPJ_LENGTH;
}

export function hasCPFLength(document: string): boolean {
    return document?.replace(/[^\d]/g, '')?.length === CPF_LENGTH;
}