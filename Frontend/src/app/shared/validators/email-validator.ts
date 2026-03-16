import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validates if the e-mail has a valid format
 */
export const emailValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const EMAIL_REGEX: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/g;

    if (!control?.value) {
        return null;
    }

    return EMAIL_REGEX.test(control?.value) ? null : { emailError: 'only valid email' };
};
