import BigNumber from "bignumber.js";

export interface AuctionModel {
    id: string;
    auctioneerId: string;
    nftId: string;
    minimumPrice: BigNumber;
    deadline: Date;
    status: AuctionStatusEnum;
    customerWinnerId?: string;
    when: Date;
    expired?: boolean; //Used only in Front
}

export enum AuctionStatusEnum {
    CREATED = 'CREATED',
    WAITING = 'WAITING',
    FINISHED = 'FINISHED',
    CANCELED = 'CANCELED'
}