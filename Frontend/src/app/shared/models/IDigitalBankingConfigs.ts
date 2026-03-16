import { BankingAccountFeatures } from "./banking-account";

export interface IDigitalBankingConfigs {
    links: IDigitalBankingLinks;
    helpdesk: IHelpdesk;
    merchant: IMerchantData;
	accountTypeList: Array<BankAccountType>;
}

export interface IDigitalBankingLinks {
    benefits: string;
    termOfAcceptanceForCPF: string;
    termOfAcceptanceForCNPJ: string;
}

export interface IHelpdesk {
    chat?: string;
}

export interface IMerchantData {
    postalCode: string;
    city: string;
    merchantCategoryCode?: number;
    name: string;
    cnpj?: string;
    extendedName?: string;
}

export interface IBankingFeaturesControlResponse {
    isAvailable: boolean;
    featureConfig?: IBankingFeatureConfig
}

export interface IBankingFeatureConfig {
    evaluations?: BankingFeatureConfigEvaluations[];
    availableTime?: {
        hourIni?: string;
        hourEnd?: string;
    },
    featureName?: BankingAccountFeatures;
}

export enum BankingFeatureConfigEvaluations {
    TIME = 'time',
    WEEKEND = 'weekend',
    HOLIDAY= 'holiday',
}

export enum BankAccountType {
    CC = 'CC',
    CP = 'CP',
}