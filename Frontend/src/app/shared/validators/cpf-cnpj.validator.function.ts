import { Validator, AbstractControl, ValidatorFn } from '@angular/forms';
import { ValidationErrors } from '@angular/forms';

export class CpfCnpjValidator implements Validator {

    public static cpfLength: number = 11;
    public static cnpjLength: number = 14;

    /**
     *  Calculates the CPF or CNPJ check digit.
     */
    public static buildDigit(arr: Array<number>): number {

        const isCpf: boolean = arr.length < CpfCnpjValidator.cpfLength;
        const digit: number = arr
            .map((val, idx) => val * ((!isCpf ? idx % 8 : idx) + 2))
            .reduce((total, current) => total + current) % CpfCnpjValidator.cpfLength
        ;

        return digit < 2 ? 0 : CpfCnpjValidator.cpfLength - digit;
    }

    public static validate(c: AbstractControl): ValidationErrors | null {

        if (!c.value) {
            return null;
        }

        const cpfCnpj = c.value.replace(/\D/g, '');

        if ([CpfCnpjValidator.cpfLength, CpfCnpjValidator.cnpjLength].indexOf(cpfCnpj.length) < 0) {
            return { length: true };
        }

        if (/^([0-9])\1*$/.test(cpfCnpj)) {
            return { equalDigits: true };
        }

        const cpfCnpjArr: Array<number> = cpfCnpj.split('').reverse().slice(2);

        cpfCnpjArr.unshift(CpfCnpjValidator.buildDigit(cpfCnpjArr));
        cpfCnpjArr.unshift(CpfCnpjValidator.buildDigit(cpfCnpjArr));

        if (cpfCnpj !== cpfCnpjArr.reverse().join('')) {
            return { digit: true };
        }

        return null;
    }

    public validate(c: AbstractControl): ValidationErrors | null {
        return CpfCnpjValidator.validate(c);
    }

    //For using with property 'setValidators' because accept only the return ValidatorFn.
    public static validatorFn(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            return CpfCnpjValidator.validate(control);
        };
    }
}