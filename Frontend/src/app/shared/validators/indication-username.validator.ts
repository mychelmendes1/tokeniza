import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validates if the indication username starts with "@"
 */
export const indicationUsernameValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (!control?.value) {
        return null;
    }

    const value = control.value.trim();
    if (value && !value.startsWith('@')) {
        return { indicationUsernameError: true };
    }

    return null;
};
