export class IPolicies{
    cancellation?: string;
    delivery?: string;
    exchangesAndReturns?: string;
    privacy?: string;
}

export class ISocialMidias{
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    telegram?: string;
    whatsapp?: string;
    linkedin?: string;
}

export class IExternalFiles{
    termsOfUse?: string;
    termsOfIndication?: string;
}

export class IExternalLinks {
    public aboutUs?: string;
    public contact?: string;
    public policies?: IPolicies;
    public socialMidias?: ISocialMidias;
    public faq?: string;
    public externalFiles?: IExternalFiles;
    public whitepaper?: string;
    public linkToMidas?: string;
    public linkToExternalDeposit?: string;
    public linkToEniato?: string;
    public loginLink?: string;
    public midasWebRedirects?: {
        midasWebBuy: string
    };
}