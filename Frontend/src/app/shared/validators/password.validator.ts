import { FormGroup, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { PasswordMinLength } from '../../constants/shared-constants';

export function matchingPasswords(passwordKey: string, confirmPasswordKey: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
        if (!(group instanceof FormGroup)) {
            return null;
        }

        const password = group.get(passwordKey);
        const confirmPassword = group.get(confirmPasswordKey);

        if (!password || !confirmPassword) {
            return null;
        }

        if (confirmPassword.value === '') {
            return null;
        }

        if (password.value !== confirmPassword.value) {
            return { mismatchedPasswords: true };
        }

        return null;
    };
}

export function validatePassword(password: string): PasswordsPrerequisitesResponse {
    let isValid: boolean = false;
    const passwordPrerequisites: PasswordsPrerequisites = {
        hasMinChars: false,
        noHasLowerCase: false,
        noHasUpperCase: false,
        noHasNumbers: false,
        noHasSpecialChars: false
    };

    if (password.length >= PasswordMinLength) {
        passwordPrerequisites.hasMinChars = true;
    }

    const lowerCaseLetters: RegExp = /[a-z]/g;
    if (password.match(lowerCaseLetters)) {
        passwordPrerequisites.noHasLowerCase = true;
    }

    const upperCaseLetters: RegExp = /[A-Z]/g;
    if (password.match(upperCaseLetters)) {
        passwordPrerequisites.noHasUpperCase = true;
    }

    const numbers: RegExp = /\d/g;
    if (password.match(numbers)) {
        passwordPrerequisites.noHasNumbers = true;
    }

    const specialChars: RegExp = /[!@#$%^&*(),.?":{}|<>]/g;
    if (password.match(specialChars)) {
        passwordPrerequisites.noHasSpecialChars = true;
    }

    const aux: Array<[string, boolean]> = Object.entries(passwordPrerequisites);

    isValid = aux.filter(item => item[1] === false).length === 0;

    return {
        isValid,
        prerequisites: passwordPrerequisites
    };
}

export function passwordPrerequisites(control: AbstractControl): { [key: string]: boolean } | null {
    const passwordValidation: PasswordsPrerequisitesResponse = validatePassword(control?.value);
    const errors: { [key: string]: boolean } = {};

    if (!passwordValidation?.prerequisites?.noHasLowerCase) {
        errors['noHasLowerCase'] = true;
    }

    if (!passwordValidation?.prerequisites?.noHasUpperCase) {
        errors['noHasUpperCase'] = true;
    }

    if (!passwordValidation.prerequisites.hasMinChars) {
        errors['minLength'] = true;
    }

    if (!passwordValidation.prerequisites.noHasNumbers) {
        errors['noHasNumbers'] = true;
    }

    if (!passwordValidation.prerequisites.noHasSpecialChars) {
        errors['noHasSpecialChars'] = true;
    }

    return Object.keys(errors).length ? errors : null;
}

export interface PasswordsPrerequisites {
    hasMinChars: boolean;
    noHasUpperCase: boolean;
    noHasLowerCase: boolean;
    noHasNumbers: boolean;
    noHasSpecialChars: boolean;
}

export interface PasswordsPrerequisitesResponse {
    isValid: boolean;
    prerequisites: PasswordsPrerequisites;
}