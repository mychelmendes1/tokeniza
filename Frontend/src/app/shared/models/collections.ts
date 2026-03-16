import BigNumber from "bignumber.js";
import { Photo } from "./photo.model";

export interface Collections {
    id: string;
    name: string;
    description: string;
    price?: BigNumber;
    disabled: Date;
    contract_address: string;
    whitepaper_url?: string;
    document_url?: string;
    contract_url?: string;
    network_id: string;
    photo: string;
    wasCreatedOnBC?: boolean;
    when: Date;
    priceCurrency?: string;
    items?: number;
    resales?: number;
    photos?: Array<Photo>;
    cover_photo?: string;
    creator_institution?: string;
    user_responsible?: string;
}

export interface CollectionSearchInput {
    name?: string;
    networkId?: string;
    limit?: number;
    offset?: number;
}

export interface CollectionsSummaryResponse {
    collections: Array<Collections>;
    qtyCollections: number; // All collections registered
    qtyFilteredCollections: number; // Quantity of collections filtered
}