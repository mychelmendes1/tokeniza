export interface ApplyStake
{
    stakeId?: string;

    amountToApply?: number;

    removeOldStake?: boolean;

    document_sign_key?: string;

    unitOfMoney?: string;
}


export class CancelStake
{
    public stakeId?: string;

    /**
     * Needs to be optional in the Frontend as it will be only used in API-GTW.
     * It will be here only to reference.
     */
    public userId?: string;
}