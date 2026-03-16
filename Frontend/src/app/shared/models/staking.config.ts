import { StakingMethodEnum } from "./staking-method.enum";
import { StakingPeriodType } from "./staking-period-type.enum";
import { StakingBalanceHistory } from "./staking.balance.history";


export interface StakingConfig {
    id?: string;

    stakingLength: number; // time to generate staking gain

    name?: string;

    periodType: StakingPeriodType; // Can be in days or months ('D' or 'M')

    thresholdToApply: number; // Minimum to apply

    valueToApply: number; // Value applied by user

    method: StakingMethodEnum; // Gain can be percentage or absolute ('P' or 'A')

    allowEarlyWithdraw: boolean; // Whether it is possible to withdraw before the deadline

    history: Array<StakingBalanceHistory>;

    monthlyPayments: boolean;

    totalToApply?: number;

    exit_fee?: number;

    terms?: string;

    unit_of_money?: string;
}