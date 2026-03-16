export class IUserEmailResponse 
{
    public id?: string;
    public name?: string;
    public email?: string;
    public walletPublicData?: string;
    public selfieImage?: string;
    public tron_wallet?: string;
    public btc_wallet?: string;
    public bankingAccount?: { account: string };
}