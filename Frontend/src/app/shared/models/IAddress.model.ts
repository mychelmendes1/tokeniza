import { Assets } from './IAssets.model';

export interface Address {
    city: string;
    state: string;
    zipcode: string;
    country: string;
    addressNumber: number;
    neighborhood: string;
    complement: string;
    tower?: string;
    flow?: number;
    asset?: Assets;
}