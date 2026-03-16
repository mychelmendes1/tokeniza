export class IUserAdditionalInformation {
    public id?: string;
    public user_id?: string;
    public gender!: string;
    public employment_type!: string;
    public marrital_status!: string;
    public country_origin!: string;
    public vinculated_to_company!: boolean;
    public us_person!: boolean;
    public pep!: boolean;
    public monthly_income!: number;
    public real_actives!: number;
    public financial_applications!: number;
    public real_estate!: number;
    public movable_properties!: number;
    public others!: number;
    public qualified!: boolean;
    public huge_investments!: boolean;
    public crowdfunding_invesments_less_than_maximum!: boolean;
    public when!: Date;
    public document_type?: string;
    public document_number?: string;
    public issuance_place?: string;
    public date_create?: string;
    public date_expiration?: string;
    public mothers_name?: string;
    public fathers_name?: string;
}