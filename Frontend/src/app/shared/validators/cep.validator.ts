import { AbstractControl, ValidationErrors } from '@angular/forms';

const CEP_VALIDATOR_LENGTH_ERROR: ValidationErrors = { minLengthError: 'CEP must have 8 characters' };
const CEP_LENGTH: number = 8;

export function cepValidatorLength(control: AbstractControl): ValidationErrors | null {
    return control.value?.replace(/\D/g, '')?.length === CEP_LENGTH ? null : CEP_VALIDATOR_LENGTH_ERROR;
}