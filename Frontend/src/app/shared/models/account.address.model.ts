export interface IAddress {
    postalCode: string;
    street: string;
    number?: number;
    addressComplement?: string;
    neighborhood: string;
    city: string;
    state: string;
    longitude?: number;
    latitude?: number;
}