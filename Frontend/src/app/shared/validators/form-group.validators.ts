import { AbstractControl, FormGroup } from "@angular/forms";

export function showErrorForInputs(formName: string, form: FormGroup): boolean {
    const control: AbstractControl<any, any> | null = form.get(formName);
    if (control) {
        // A control is dirty if the user has changed the value in the UI.
        // So, if the user has somehow interacted with the input and the input is invalid, an error must be returned.
       return (control.dirty || control.touched) && control.invalid;
    }
    return false;
}

export function formInputTouched(formName: string, form: FormGroup): boolean {
    const control: AbstractControl<any, any> | null = form.get(formName);
    if (control) {
        // A control is dirty if the user has changed the value in the UI.
        // Returns true if the user has somehow interacted with the input
       return (control.dirty || control.touched);
    }
    return false;
}