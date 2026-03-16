import { StakingConfig } from './staking.config';

export interface StakingBalanceHistory {
    id?: string;

    userId: string;

    startDate?: Date;

    endDate?: Date;

    amountStaked?: number;

    amountToApply?: number;

    earlyLeave: boolean;

    leaveDate?: Date;

    applied: boolean;

    config: StakingConfig;

    value_paid?: number;
}
