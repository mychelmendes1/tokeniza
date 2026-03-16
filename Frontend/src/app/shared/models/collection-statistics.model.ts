import { Collections } from "./collections";
import { Network } from "./network.model";

export interface CollectionStatistics {
    id: string;
    owners: number;
    visits: number;
    boughts: number;
    price_of_collection: number;
    price_of_collectionBRL: number;
    average_of_collection: number;
    circulating_value?: number;
    circulating_valueBRL?: number;
    collectionDetails?: Collections; // Used only in frontend
    networkDetails?: Network; // Used only in frontend
}

export enum SortCollectionsStatistics {
    MORE_BOUGHTS = 'MORE_BOUGHTS',
    MORE_OWNERS = 'MORE_OWNERS',
    BIGGEST_MARKET_PRICE = 'BIGGEST_MARKET_PRICE',
    MORE_VISITS = 'MORE_VISITS'
}