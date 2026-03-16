import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class DocumentValidationService {

    constructor() { }

    /**
     * this method validate the cpf values, 
     * checking if it is a fake cpf or not
     * @param cpf cpf string
     * @returns valid verification boolean value
     */
    public cpfValidation(cpf: string = ""): boolean {
        // Blacklist common values.
        const BLACKLIST: Array<string> = [
            '00000000000',
            '11111111111',
            '22222222222',
            '33333333333',
            '44444444444',
            '55555555555',
            '66666666666',
            '77777777777',
            '88888888888',
            '99999999999',
            '12345678909',
        ];

        const verifierDigit = (digits: string): number => {
            const numbers: Array<number> = digits.split('').map(number => {
                return parseInt(number, 10);
            });

            const modulus: number = numbers.length + 1;
            // Here there is a multiplication of the digits of the cpf, because it is necessary to check the verifier Digit to validate the cpf, which are found by this calculation.
            // input 72486023020
            // 7 * (10 - 0) = 70
            // 2 * (10 - 1) = 18
            // 4 * (10 - 2) = 32
            // 8 * (10 - 3) = 56
            // 6 * (10 - 4) = 36
            // 0 * (10 - 5) = 0
            // 2 * (10 - 6) = 8
            // 3 * (10 - 7) = 9
            // 0 * (10 - 8) = 0
            // (70 + 12 + 32 + 56 + 36 + 0 + 8 + 9 + 0) % 11 = 3
            // 3 - 1 = 2
            // First verifier digit equal 2
            // 7 * (11 - 0) = 77
            // 2 * (11 - 1) = 20
            // 4 * (11 - 2) = 36
            // 8 * (11 - 3) = 64
            // 6 * (11 - 4) = 42
            // 0 * (11 - 5) = 0
            // 2 * (11 - 6) = 10
            // 3 * (11 - 7) = 12
            // 0 * (11 - 8) = 0
            // 2 * (11 - 9) = 4
            // (77 + 20 + 36 + 64 + 42 + 0 + 10 + 12 + 0 + 4) % 11 = 1
            // 1 - 1 = 0
            // Second verifier digit equal 0
            const multiplied: Array<number> = numbers.map(
                (number, index) => number * (modulus - index),
            );
            const mod: number =
                multiplied.reduce((buffer, number) => buffer + number) % 11;

            return mod < 2 ? 0 : 11 - mod;
        };

        const isValid = (number: string): boolean => {
            const stripped: string = number.replace(/[^\d]/g, '')
            // CPF must be defined
            if (!stripped) {
                return false;
            }

            // CPF must have 11 chars
            if (stripped.length !== 11) {
                return false;
            }

            // CPF can't be blacklisted
            if (BLACKLIST.includes(stripped)) {
                return false;
            }

            let numbers: string = stripped.substr(0, 9);
            // The method is called twice, because it is necessary to check that the two check digits are correct
            numbers += verifierDigit(numbers);
            numbers += verifierDigit(numbers);

            if (numbers.substr(-2) === stripped.substr(-2)){
                return true;
            }

            return false;
        };
        let valid: boolean = isValid (cpf);
        return valid;
    }

    /**
     * this method validate the cnpj values, 
     * checking if it is a fake cnpj or not
     * @param cnpj cpf string
     * @returns verification boolean value
     */
    public cnpjValidator(cnpj : string = ""): boolean {
 
        cnpj = cnpj.replace(/[^\d]+/g,'');
     
        if(cnpj === '') return false;
         
        if (cnpj.length != 14)
            return false;
     
        // Blacklist common values.
        if (cnpj === "00000000000000" || 
            cnpj === "11111111111111" || 
            cnpj === "22222222222222" || 
            cnpj === "33333333333333" || 
            cnpj === "44444444444444" || 
            cnpj === "55555555555555" || 
            cnpj === "66666666666666" || 
            cnpj === "77777777777777" || 
            cnpj === "88888888888888" || 
            cnpj === "99999999999999")
            return false;
             
        // Valid DVs
        let size: number = cnpj?.length - 2
        let numbers: string = cnpj.substring(0,size);
        let digits: string = cnpj.substring(size);
        let sum: number = 0;
        let pos: number = size - 7;
        // Here a for loop is used to perform the multiplication of the CNPJ digits minus the value of the loop index, because it is necessary to find the first checker digit and analyze if they are correct.
        for (let i = size; i >= 1; i--) {
          sum += Number(numbers.charAt(size - i)) * pos--;
          if (pos < 2){
            pos = 9;
          }
        }
        let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
        // This if compares the first checker digit found by the calculation, with the first typed by the user.
        if (result != Number(digits.charAt(0))){
            return false;
        }
        size = size + 1;
        numbers = cnpj.substring(0,size);
        sum = 0;
        pos = size - 7;
       // Here a for loop is used to perform the multiplication of the CNPJ digits minus the value of the loop index, because it is necessary to find the second checker digit and analyze if they are correct.
        for (let i = size; i >= 1; i--) {
          sum += Number(numbers.charAt(size - i)) * pos--;
          if (pos < 2){
            pos = 9;
          }
        }
        result = sum % 11 < 2 ? 0 : 11 - sum % 11;
        // This if compares the secong checker digit found by the calculation, with the second typed by the user.
        if (result != Number(digits.charAt(1))){
            return false;
        }
        return true;
    }
}