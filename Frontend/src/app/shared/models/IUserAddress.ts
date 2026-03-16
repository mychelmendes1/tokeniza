export class IUserAddress {
    public id?: string | undefined;
    public userId!: string | undefined;
    public street_address!: string;
    public city!: string;
    public state!: string;
    public country!: string;
    public postal_code!: string;
    public isDefault!: boolean;
    public when?: Date;
    public disabled?: Date;
    public has_kyc?: boolean;

    constructor(object?: IUserAddress) {
        if (!object?.country) this.country =  "Brasil";
    }
}