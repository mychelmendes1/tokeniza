import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class OnkeypressService {

    constructor() { }

        /**
     * Used to restrict entering numbers only
     * @param event keypress
     * @param maxLength Max length to prevent event. Default is 14
     */
    public onlyAllowNumbers(event: any, allowDecimal: boolean = true, maxLength: number = 14): void {
        if(!allowDecimal) {
            // Allow Only Numbers
            if ((event?.target?.value?.length >= maxLength) || !(event.charCode >= 48 && event.charCode <= 57)) {
                event.preventDefault();
            }
        } else {
            if (event?.target?.value?.match(/\./g)?.length === 1 && event.charCode === 46) {
                event.preventDefault();
            }

            //Allow Numbers, dot and comma.
            if ((event?.target?.value?.length >= maxLength) || !(event.charCode >= 48 && event.charCode <= 57 || event.charCode === 44 || event.charCode === 46)) {
                event.preventDefault();
            }
        }
    }

    /**
     * Used to allow currency transaction type characters, containing numbers, lowercase letters, and dash. ( a-z, 0-9, - )
     * @param event keypress
     */
    public allowNumbersLettersAndTrace(event: any): void {
        if (!(event.charCode >= 48 && event.charCode <= 57 || event.charCode >= 97 && event.charCode <= 122 || event.charCode === 45)) {
            event.preventDefault();
        }
    }

    /**
     * Used to restrict entering numbers only, lowercase letters and uppercase letters
     * @param event keypress
     */
    public blockSpecialCharacters(event: KeyboardEvent, allowSpace: boolean = false): void {
        const noSpecialChars: RegExp = allowSpace ? /^[A-Za-z0-9\s]$/ : /^[A-Za-z0-9]$/;
        if (!noSpecialChars.test(event.key)) {
            event.preventDefault();
        }
    }
}