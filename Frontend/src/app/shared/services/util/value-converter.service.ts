import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import BigNumber from 'bignumber.js';
import { IFiatCurrency } from '../../models/IFiatCurrency';
import { AccountService } from '../account/account.service';

interface BigNumberFormat {
    prefix?: string,
    decimalSeparator: string,
    groupSeparator: string,
    groupSize?: number,
    secondaryGroupSize?: number,
    fractionGroupSeparator?: string,
    fractionGroupSize?: number,
    suffix?: string,
}
@Injectable({
    providedIn: 'root'
})
export class ValueConverterService {

    public isInEnglish: boolean = false;
    public customFormat: BigNumberFormat;
    public decimalSeparator: string = ',';
    public groupSeparator: string = '.'; // Thousand divider, billiards, etc...
    public fiatCurrency: IFiatCurrency;

    constructor(
        private readonly translate: TranslateService,
        private readonly accountService: AccountService,
    ) {
        this.fiatCurrency = this.accountService.getFiatCurrency();

        const userLanguage: string = this.translate.getBrowserLang() as string;
        this.isInEnglish = userLanguage?.includes('en');
        this.decimalSeparator = this.isInEnglish ? '.' : ',';
        this.groupSeparator = this.isInEnglish ? ',' : '.';
        this.customFormat = {
            decimalSeparator: this.decimalSeparator,
            groupSeparator: this.groupSeparator,
            groupSize: 3
        };
        BigNumber.config({ FORMAT: this.customFormat });
    }

    /**
     * Formats the given value in the device's default language (English or Portuguese).
     * @param value The value to be converted.
     * @param decimalPlaces Number of decimal places. Default is 2.
     * @returns Formatted value in string. E.g: 1154064 will return 11.540,64 (pt-br) or 11,540.64 (en).
     */
    public toStringFormat(
        value: number | BigNumber | string = 0,
        decimalPlaces: number = 2,
    ): string {
        if (!value) {
            return new BigNumber(0).toFormat(decimalPlaces);
        }
        if (typeof value === 'string') {
            let newVal = value.replace(/\D/g, '');
            let decimalPlace: string = '';
            let integerValue: string = '';
            if (newVal.length > decimalPlaces) {
                decimalPlace = newVal.slice(newVal.length - decimalPlaces, newVal.length);
                integerValue = newVal.slice(0, newVal.length - decimalPlaces);
            } else {
                decimalPlace = newVal;
                integerValue = '0';
            }
            let tmpDecimalPlace: BigNumber = new BigNumber(decimalPlace).dividedBy(10 ** decimalPlaces);
            const valueToReturn: BigNumber = new BigNumber(integerValue).plus(tmpDecimalPlace);
            return new BigNumber(valueToReturn).toFormat(decimalPlaces);
        } else {
            return new BigNumber(value).toFormat(decimalPlaces);
        }
    }

    /**
     *  Reverses the formatting used in the toStringFormat method.
     * @param value The formatted value in string (based on user language).
     * @returns The value in BigNumber without formatting. E.g: 11.540,64 (pt-br) or 11,540.64 (en) will return new BigNumber(11540.64)
     */
    public fromStringFormatToBigNumber(value: string, decimalPlaces: number = 6): BigNumber {
        if (!value) {
            return new BigNumber(0);
        }
        let newVal = String(value).replace(/\D/g, '');
        let decimalPlace: string = '';
        let integerValue: string = '';
        if (newVal.length > decimalPlaces) {
            decimalPlace = newVal.slice(newVal.length - decimalPlaces, newVal.length);
            integerValue = newVal.slice(0, newVal.length - decimalPlaces);
        } else {
            decimalPlace = newVal;
            integerValue = '0';
        }
        let tmpDecimalPlace: BigNumber = new BigNumber(decimalPlace).dividedBy(10 ** decimalPlaces);
        const valueToReturn: BigNumber = new BigNumber(integerValue).plus(tmpDecimalPlace);
        return new BigNumber(valueToReturn);
    }

    /**
     * This method calculate how many days are left for expiration based on current date.
     * @param expirationDate It's the expiration date
     *
     * @returns Returns the remaining days relative to today.
     */
    public getDifferenceInDays(expirationDate: Date): string {
        const expiration = expirationDate.getTime();
        const today = new Date().getTime();
        const leftDay = (expiration - today) / (24 * 3600000); // in days
        const newDate = new Date(leftDay)
        return leftDay.toFixed(0) || "0";
    }

    /**
     * This method calculate how many hours are left for expiration based on current date.
     * @param expirationDate It's the expiration date
     *
     * @returns Returns the remaining days relative to the current time.
     */
    public getDifferenceInHours(expirationDate: Date): string {
        const expiration = expirationDate.getTime();
        const today = new Date().getTime();
        const leftHours = (expiration - today) / 3600000; //  total in hours
        const onlyHours = leftHours % 24;
        return onlyHours.toFixed(0) || "0";
    }

    /**
     * Method created to handle the monetary amount formatted by mask-currency.directive
     *
     * @param value string value handled by mask-currency.directive
     * format expected: $ 5.423,99
     * @returns String provided converted in BigNumber: 5423,99
     */
    public handlingMonetaryAmount(value: string): BigNumber {
        let convertedValue: BigNumber = new BigNumber(0);

        if (value) {
            let newVal: string = value.replace(/[^\d.,]/g, '');
            
            convertedValue = new BigNumber(newVal);
        }

        return convertedValue;
    }

    /**
     * Method created to handle the monetary amount formatted by mask-currency.directive
     *
     * @param value string value handled by mask-currency.directive
     * format expected: $ 5.423,990201
     * @returns String provided converted in BigNumber: 5423,990201
     */
    public handlingTokenAmount(value: string): BigNumber {
        let convertedValue = new BigNumber(0);
        if (value) {
            //Remove non-digits, for instance: 5423,990201 becames 5423990201
            let newVal: string = value.replace(/\D/g, '');

            let cents: string;
            let tempCents: BigNumber;
            let integerValue: string = '0';
            //Split the cents from integers
            //for instance, given the known example 5423990201
            //cents became 990201 and integerValue becames 5423
            cents = newVal.slice(newVal.length - 6, newVal.length);
            integerValue = newVal.slice(0, newVal.length - 6)

            //Divide by 1000000 to transform in decimal, the example 990201 becamse to 0,990201
            tempCents = new BigNumber(cents).dividedBy(1000000);
            //Add again to integerValue, which becames 5423,990201 formated as BigNumber
            convertedValue = new BigNumber(integerValue).plus(tempCents);
        }
        return convertedValue;
    }
    
    //Method to format the input monetary data
    //Given a input data 523400, such method will format to 5.234,00
    public formatMonetaryInput(originalValue: string, withCurrency$: boolean = true): string | void {
        //Remove all non-digit characters
        let newVal = originalValue.replace(/\D/g, '');
        if (newVal[0] === '0') {
            let i = 0;
            for (; i < newVal.length && newVal[i] === '0'; i++) {
                //Do nothing indeed, just go to latest 0 in the string in order to remove it afterwards
                //for instance, given a string 0012, it must to go to index 2, indicating that from
                //index 0 to index 1 it must to be removed
            }
            newVal = newVal.substring(i, newVal.length);
        }

        if (newVal.length === 0) {
            newVal = '';
        } else if (newVal.length <= 1) {
            //Very first digit is a cent,
            //for instance, if the user typed 5, it becames 0,05
            newVal = newVal.replace(/^(\d{1})/, `0${this.decimalSeparator}0$1`);
            // newVal = newVal.replace(/^(\d{1})/, '0,0$1');
        } else if (newVal.length <= 2) {
            //Second digit is a cent,
            //for instance, if after the 5 the user types 2, it becames 0,52
            newVal = newVal.replace(/^(\d{2})/, '0,$1');
        } else if (newVal.length <= 3) {
            //Then in case the user types a 3, it becames 5,23
            newVal = newVal.replace(/^(\d{0,1})(\d{0,2})/, `$1${this.decimalSeparator}$2`);
        } else if (newVal.length <= 4) {
            newVal = newVal.replace(/^(\d{0,2})(\d{0,2})/, `$1${this.decimalSeparator}$2`);
        } else if (newVal.length <= 5) {
            newVal = newVal.replace(/^(\d{0,3})(\d{0,2})/, `$1${this.decimalSeparator}$2`);
        } else if (newVal.length <= 6) {
            //Deal with thousands: 5.234,00
            newVal = newVal.replace(/^(\d{0,1})(\d{0,3})(\d{0,2})/, `$1${this.groupSeparator}$2${this.decimalSeparator}$3`);
        } else if (newVal.length <= 7) {
            newVal = newVal.replace(/^(\d{0,2})(\d{0,3})(\d{0,2})/, `$1${this.groupSeparator}$2${this.decimalSeparator}$3`);
        } else if (newVal.length <= 8) {
            newVal = newVal.replace(/^(\d{0,3})(\d{0,3})(\d{0,2})/, `$1${this.groupSeparator}$2${this.decimalSeparator}$3`);
        } else if (newVal.length <= 9) {
            //Deal with millions: 5.234.001,58
            newVal = newVal.replace(/^(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,2})/, `$1${this.groupSeparator}$2${this.groupSeparator}$3${this.decimalSeparator}$4`);
        } else if (newVal.length <= 10) {
            newVal = newVal.replace(/^(\d{0,2})(\d{0,3})(\d{0,3})(\d{0,2})/, `$1${this.groupSeparator}$2${this.groupSeparator}$3${this.decimalSeparator}$4`);
        } else if (newVal.length <= 11) {
            newVal = newVal.replace(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})/, `$1${this.groupSeparator}$2${this.groupSeparator}$3${this.decimalSeparator}$4`);
        } else {
            //10 places before comma + 2 places for cents are the max value handled.
            newVal = newVal.substring(0, 12);
            newVal = newVal.replace(/^(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})/, `$1${this.groupSeparator}$2${this.groupSeparator}$3${this.groupSeparator}$4${this.decimalSeparator}$5`);
        }
        if (newVal) {
            return `${withCurrency$ ? '$' : ''}` + newVal;
        }
        return;
    }
}