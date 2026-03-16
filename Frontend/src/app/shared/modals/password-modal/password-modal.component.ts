import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { RouterModule } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { PasswordStrengthComponent } from '../../components/password-strength/password-strength.component';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { emailValidator } from '../../validators/email-validator';
import { formInputTouched, showErrorForInputs } from '../../validators/form-group.validators';
import { TranslationConstants } from '../../services/util/translation.service';
import { CustomSnackbarComponent, SnackBarTheme } from '../../custom-snackbar/custom-snackbar.component';
import { AccountService } from '../../services/account/account.service';
import { MatStepper } from '@angular/material/stepper';

@Component({
    selector: 'app-password-modal',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule,
        PasswordStrengthComponent
    ],
    templateUrl: './password-modal.component.html',
    styleUrl: './password-modal.component.scss'
})
export class PasswordModalComponent implements OnInit, AfterViewInit {

    @ViewChild('stepper', { static: false }) public stepper!: MatStepper;
    public loading: boolean = false;
    public currentStepperIndex: number = 0;
    public formPassword: FormGroup | null = null;
    public form: FormGroup<IForm> = new FormGroup<IForm>({
        email: new FormControl<string>('', { validators: [Validators.required, emailValidator] }),
    });

    constructor(
        public dialogRef: MatDialogRef<PasswordModalComponent>,
        private readonly translationConstants: TranslationConstants,
        private readonly customSnackbar: CustomSnackbarComponent,
        private readonly accountService: AccountService,
    ) { }

    public ngOnInit(): void {
        this.dialogRef.disableClose = true;
        this.dialogRef.addPanelClass(['custom-modal', 'password-modal']);
        this.accountService.getRsaPublicKey().subscribe();
    }

    public ngAfterViewInit(): void {
        this.stepper.selectionChange.subscribe(stepper => {
            this.currentStepperIndex = stepper.selectedIndex;

            if (this.currentStepperIndex === 1) {
                this.form.addControl('code', new FormControl<string | null>(null, { 
                    validators: [Validators.required, Validators.minLength(6), Validators.maxLength(6)] 
                }));
            }
        });
    }

    public updatePasswordForm(form: FormGroup): void {
        this.formPassword = form;
    }

    public showError(formName: string): boolean {
        return showErrorForInputs(formName, this.form);
    }

    public formInputTouched(formName: string): boolean {
        return formInputTouched(formName, this.form)
    }

    public nextStepper(): void {
        this.stepper.next();
    }

    public send(): void {
        this.loading = true;
        this.accountService.sendCode((this.form.value.email as string)?.toLocaleLowerCase()).subscribe(success => {
            this.customSnackbar.open(this.translationConstants.translate('account.forgot.success'), SnackBarTheme.success, 4000);
            this.nextStepper();
        }, error => {
            if (error) {
                this.customSnackbar.open(this.translationConstants.translate(`account.forgot.error.${error.code}`), SnackBarTheme.error, 4000);
            }
        }).add(() => {
            this.loading = false;
        });
    }

    public reset(): void {
        this.loading = true;
        this.accountService.resetPassword(
            {
                secretCode: this.form.value.code as string,
                newPassword: this.formPassword?.value.password,
                email: this.form.value.email as string
            }).subscribe(success => {
                this.customSnackbar.open(this.translationConstants.translate('forgot.reset.success'), SnackBarTheme.success);
                this.dialogRef.close();
            }, err => {
                let errorMessage: string = 'generic';
                if (!err?.error || !err?.error.message) {
                    errorMessage = 'generic';
                } else if (err.error.message.includes('There is no code for the given user')) {
                    errorMessage = 'noCodeForUser'
                } else if (err.error.message.includes('The code is no longer valid')) {
                    errorMessage = 'noLogerValid'
                } else if (err.error.message.includes('The code is not matching')) {
                    errorMessage = 'mismatching'
                }
                this.customSnackbar.open(this.translationConstants.translate(`forgot.reset.error.${errorMessage}`), SnackBarTheme.error, 4000);
            }).add(() => {
                this.loading = false;
            }
        );
    }
}

interface IForm {
    email: FormControl<string | null>;
    code?: FormControl<string | null>;
}