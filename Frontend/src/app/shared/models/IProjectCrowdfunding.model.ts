import { IMidias } from "../components/photos-slide/photos-slide.component";
import { FilterAssetClass } from "./filter-asset-class.enum";
import { MediaType } from "./media-type.enum";

export enum TypeOfRiskCrowdFunding {
    MINIMUM = 'minimum',
    MEDIUM = 'medium',
    HIGH = 'high'
}

export interface IScenarioInfoProjectCrowdfunding {
    optmistic: ScenarioInfoProjectCrowdfundingModel,
    base: ScenarioInfoProjectCrowdfundingModel,
    pessimistic: ScenarioInfoProjectCrowdfundingModel
}

export interface ScenarioInfoProjectCrowdfundingModel {
    maximumExposure: number;
    profitabilityCDI: number;
    deadline: number;
    profitabilityTIR: number;
    multiple: number;
}

// ****** OBS *******
   // minimumCapturePercentage => I calculate it in the component's onInit ((this.project?.moneyReceived / this.project?.minimumCapture) * 100) || 0;
   // targetAmountPercentage =>  I calculate it in the component's onInit ((this.project?.moneyReceived / this.project?.targetCapture) * 100) || 0;
   // daysRemaining => I calculate it in the component's onInit the remaining days with the 'finalDate' key
   export interface IProjectCrowdfunding {
    id: string,
    img: string,
    startDate: string,
    finalDate: string,
    name: string,
    deadline: string,
    profitability: number,
    duration_days: number,
    isDolar?: boolean;
    secondary_transactions?: boolean;
    type: FilterAssetClass,
    typeOfRisk: TypeOfRiskCrowdFunding,
    targetCapture: string,
    moneyReceived: string,
    status: string;
    contract?: string;
    comments?: any;
    company: string;
    companyWebsite: string;
    minimumCapture?: number,
    user_responsible?: string;
    minimumCapturePercentage?: number,
    targetAmountPercentage?: number,
    daysRemaining?: number | undefined,
    show_faq: boolean;
    show_disclaimer: boolean;
    minimumContribution: number,
    acceptedCurrency: string,
    benefits: {name: string, description: string}[];
    documents?: Array<{url: string, name: string}>,
    scenarioInfo?: IScenarioInfoProjectCrowdfunding,
    enabled?: boolean,
    when?: Date,
    payment_methods?: {name: string}[],
    transfero_integration?: boolean,
    dillianz_integration?: boolean,
    fixed_value?: boolean;
    tokenValue?: number,
    midias?: IMidias[];
    description?: string;
    ted?: boolean;
    pix?: boolean;
    crypto?: boolean;
    quantityOfUser?: number;
    corporate_form?: string;
    company_address?: string;
    company_cnpj?: string;
    company_industry?: string;
    company_activities?: Array<any>;
    company_history?: string;
    company_total_employees?: number;
    company_net_worth?: number;
    company_capital_stock?: number;
    company_groos_revenue_last_year?: number;
    main_executive_person?: string;
    main_executive_person_cpf?: string;
    main_executive_person_office?: string;
    main_executive_person_curriculum?: string;
    controlling_person?: string;
    controlling_person_cpf?: string;
    controlling_person_voting_capital?: number;
    controlling_person_total_capital?: number;
}

export interface CrowdfundingMidiasModel {
    id: string;
    name: string;
    url: string;
    type: MediaType;
}

export enum ECrowdfundingStatus {
    ACTIVE = 'active',
    FINISHED = 'finished'
}

export interface ICrowdfundingOrders {
    id: string;
    project_id: string;
    user_id: string | undefined;
    amount: number;
    status: string;
    was_paid: boolean;
    created_at?: Date;
    last_update?: Date;
}

export enum ECrowdfundingOrders {
    CREATED = 'CREATED',
    FINISHED = 'FINISHED'
}

export interface ICrowdfundingOrdersCard extends ICrowdfundingOrders, IProjectCrowdfunding {}

export interface ICrowdfundingCategories {
    id: string;
    name: string;
    description: string;
    url: string;
}

export interface ICrowdfundingBanners {
    url: string;
    name: string;
    urlResponsive?: string;
    urlEnglish?: string;
    companyName?: string;
    urlEnglishResponsive?: string;
    link?: {
        newTab: boolean,
        url: string
    };
}

export interface ScenarioInfoProjectCrowdfundingModel {
    maximumExposure: number;
    profitabilityCDI: number;
    deadline: number;
    profitabilityTIR: number;
    multiple: number;
}

export interface CrowdfundingCompanyDetails {
    id: string;
    crowdfunding_id: string;
    companyAddress?: string;
    name: string;
    cnpj: string;
    email: string;
    social_type: string;
    telephone: string;
    history: string;
    area: string;
    target: string;
    region: string;
    goals: string;
    purpose_of_offer: string;
    main_products_and_services: string;
    employees: number;
    patrimony: number;
    social_capital: number;
    last_year_result: number;
    destination: string;
    sindicate: string;
    return_expectation: string;
    court_lawsuits: string;
    conflicts: string;
    platform_rewards: string;
    warning: string;
    taxes_applieds: string;
    can_have_additional: string;
    has_done_before: string;
    has_another_offer: string;
    address: {
        address: string,
        number: number,
        zipcode: string,
        city: string,
        state: string,
        neighborhood: string,
        complement: string
    };
    executives: {
        name: string,
        cpf: string,
        position: string,
        description: string
    }[];
    controllers: {
        name: string,
        cpf: string,
        percentage_capital: number,
        percentage_total: number
    }[];
    avaliation_method: {
        name: string,
        value: number
    }[];
    rights: {
        contract: string,
        free: string,
        tagAlong: string,
        dragAlong: string
    };
    destination_matrix: {
        category: string,
        minimum: number,
        maximum: number
    }[];
    lawyers: {
        name: string,
        cpf: string,
        description: string
    }[];
    risks: {
        name: string,
        description: string
    }[];
    information_after_period: {
        name: string, frequency: string
    }[];
    when?: Date;
}

export class ICrowdfundingTermsAccepted {
    public id!: string;
    public project_id!: string;
    public user_id!: string | undefined;
    public accepted_when!: string;
    public term_accepted!: string;
    public ip!: string;
    public latitude!: number;
    public longitude!: number;
    public created_at?: Date;
    public last_update?: Date;
}