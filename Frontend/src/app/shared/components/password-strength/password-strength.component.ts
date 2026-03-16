import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { matchingPasswords, passwordPrerequisites, validatePassword, PasswordsPrerequisites } from '../../validators/password.validator';
import { showErrorForInputs } from '../../validators/form-group.validators';

@Component({
    selector: 'app-password-strength',
    imports: [
        CommonModule,
        SharedModule
    ],
    templateUrl: './password-strength.component.html',
    styleUrl: './password-strength.component.scss'
})
export class PasswordStrengthComponent {

    @Input() public darkMode: boolean = false;
    @Output() public onFunctionCalled: EventEmitter<FormGroup> = new EventEmitter<FormGroup>();
    public showPassword: boolean = false;
    public showConfirmPassword: boolean = false;
    public prerequisites: PasswordsPrerequisites = {
        hasMinChars: false,
        noHasLowerCase: false,
        noHasUpperCase: false,
        noHasNumbers: false,
        noHasSpecialChars: false
    };

    public formPassword: FormGroup<IFormPassword> = new FormGroup<IFormPassword>({
        password: new FormControl('', { validators: [Validators.required, Validators.minLength(8), Validators.maxLength(20), passwordPrerequisites] }),
        confirmPassword: new FormControl('', { validators: [Validators.required, Validators.minLength(8), Validators.maxLength(20)] }),
    }, [
        matchingPasswords('password', 'confirmPassword')
    ]);

    constructor() {
        this.formPassword.get('password')?.valueChanges.subscribe((value: string | null) => {
            this.prerequisites = validatePassword(value ?? '').prerequisites;
            this.emitFunction();
        });
    }

    public showError(formName: string, form: FormGroup): boolean {
        return showErrorForInputs(formName, form);
    }

    public emitFunction(): void {
        this.onFunctionCalled.emit(this.formPassword);
    }
}

export interface IFormPassword {
    password: FormControl<string | null>;
    confirmPassword: FormControl<string | null>;
}