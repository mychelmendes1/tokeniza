export class ICrowfundingBankingAccount {
    public id!: string;
    public project_id!: string;
    public agency!: string;
    public account!: string;
    public digit!: string;
    public type!: string;
    public name!: string;
    public identifier!: string;
    public identifier_type!: string;
    public pix_key?: string;
    public bank!: string;
    public created_at!: Date;
    public last_update!: Date;
}