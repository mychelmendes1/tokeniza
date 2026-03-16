export class DistributionRequestsModel {
    public id!: string;
    public userId!: string;
    public token_id!: string;
    public nft_id!: string;
    public token_to_distribute!: string;
    public percentage_to_network?: number;
    public percentage_to_distribute?: number;
    public request_date?: Date;
    public total_to_distribute!: number;
    public status!: string;
}