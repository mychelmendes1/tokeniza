import { CurrencyPipe, getNumberOfCurrencyDigits } from '@angular/common';
import { Inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';
import BigNumber from 'bignumber.js';

@Pipe({
    name: 'floorCurrency',
    standalone: true
})
export class FloorCurrencyPipe implements PipeTransform {
    constructor(@Inject(LOCALE_ID) private readonly locale: string) {}

    public transform(
        value: number | string | BigNumber | null | undefined,
        currencyCode?: string,
        display?: 'code' | 'symbol' | 'symbol-narrow' | string | boolean,
        digitsInfo?: string,
        locale?: string
    ): string | null {
        if (value === null || value === undefined) {
            return null;
        }

        const effectiveLocale = locale || this.locale;
        const maxFractionDigits = this.getMaxFractionDigits(currencyCode, digitsInfo, effectiveLocale);
        const flooredValue = this.floorTo(value, maxFractionDigits);

        return new CurrencyPipe(effectiveLocale).transform(
            flooredValue,
            currencyCode,
            display,
            digitsInfo,
            effectiveLocale
        );
    }

    private getMaxFractionDigits(
        currencyCode?: string,
        digitsInfo?: string,
        locale?: string
    ): number {
        if (digitsInfo) {
            const match = digitsInfo.match(/^\d+\.(\d+)-(\d+)$/);
            if (match) {
                return Number(match[2]);
            }
        }

        if (currencyCode) {
            return getNumberOfCurrencyDigits(currencyCode);
        }

        return 2;
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
