import { DecimalPipe } from '@angular/common';
import { Inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';
import BigNumber from 'bignumber.js';

@Pipe({
    name: 'floorNumber',
    standalone: true
})
export class FloorNumberPipe implements PipeTransform {
    constructor(@Inject(LOCALE_ID) private readonly locale: string) {}

    public transform(
        value: number | string | BigNumber | null | undefined,
        maxFractionDigits: number = 2,
        minFractionDigits: number = maxFractionDigits,
        locale?: string
    ): string | null {
        if (value === null || value === undefined) {
            return null;
        }

        const effectiveLocale = locale || this.locale;
        const flooredValue = this.floorTo(value, maxFractionDigits);
        const digitsInfo = `1.${minFractionDigits}-${maxFractionDigits}`;

        return new DecimalPipe(effectiveLocale).transform(
            flooredValue,
            digitsInfo,
            effectiveLocale
        );
    }

    private floorTo(value: number | string | BigNumber, decimals: number): number {
        const bn = new BigNumber(value || 0);
        if (!bn.isFinite()) {
            return 0;
        }

        if (decimals <= 0) {
            return bn.integerValue(BigNumber.ROUND_FLOOR).toNumber();
        }

        const factor = new BigNumber(10).pow(decimals);
        return bn.multipliedBy(factor).integerValue(BigNumber.ROUND_FLOOR).dividedBy(factor).toNumber();
    }
}
