export class TokensPairs {
    public id!: string;
    public name!: string;
    public imageSymbol!: string;
    public pairs?: TokenPairsConfig[];
}

export class TokenPairsConfig {
    public id?: string;
    public name?: string;
    public imageSymbol?: string;
}