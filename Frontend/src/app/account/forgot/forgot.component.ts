import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { Router, RouterModule } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { formInputTouched, showErrorForInputs } from '../../shared/validators/form-group.validators';
import { emailValidator } from '../../shared/validators/email-validator';
import { MatStepper } from '@angular/material/stepper';
import { AccountService } from '../../shared/services/account/account.service';
import { TranslationConstants } from '../../shared/services/util/translation.service';
import { CustomSnackbarComponent, SnackBarTheme } from '../../shared/custom-snackbar/custom-snackbar.component';
import { PasswordStrengthComponent } from '../../shared/components/password-strength/password-strength.component';
import { HoverIconClassService } from '../../shared/services/util/hover-icon-class.service';

@Component({
    selector: 'app-forgot',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule,
        PasswordStrengthComponent
    ],
    templateUrl: './forgot.component.html',
    styleUrl: './forgot.component.scss'
})
export class ForgotComponent implements OnInit, AfterViewInit {

    @ViewChild('stepper', { static: false }) public stepper!: MatStepper;
    public formForgot: FormGroup<IFormForgot> = new FormGroup<IFormForgot>({
        userEmail: new FormControl<string>('', { validators: [Validators.required, emailValidator] }),
    });
    public formPassword!: FormGroup;
    public loading: boolean = false;
    public currentStepperIndex: number = 0;

    constructor(
        private readonly router: Router,
        private readonly accountService: AccountService,
        private readonly translationConstants: TranslationConstants,
        private readonly customSnackbar: CustomSnackbarComponent,
        public hoverIconClassService: HoverIconClassService
    ) {}

    public ngOnInit(): void {
        this.accountService.getRsaPublicKey().subscribe();
    }

    public ngAfterViewInit(): void {
        this.stepper.selectionChange.subscribe(stepper => {
            this.currentStepperIndex = stepper.selectedIndex;

            if (this.currentStepperIndex === 1) {
                this.formForgot.addControl('code', new FormControl<string | null>(null, { 
                    validators: [Validators.required, Validators.minLength(6), Validators.maxLength(6)] 
                }));
            }
        });
    }

    public showError(formName: string): boolean {
        return showErrorForInputs(formName, this.formForgot);
    }

    public nextStepper(): void {
        this.stepper.next();
    }

    public previousStepper(): void {
        this.stepper.previous();
    }

    public goToLogin(): void {
        this.router.navigate(['/account']);
    }

    public send(): void {
        this.loading = true;
        this.accountService.sendCode((this.formForgot.value.userEmail as string)?.toLocaleLowerCase()).subscribe(success => {
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
                secretCode: this.formForgot.value.code as string,
                newPassword: this.formPassword.value.password,
                email: this.formForgot.value.userEmail as string
            }).subscribe(success => {
                this.customSnackbar.open(this.translationConstants.translate('forgot.reset.success'), SnackBarTheme.success);
                this.goToLogin();
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

    public formInputTouched(formName: string): boolean {
        return formInputTouched(formName, this.formForgot)
    }

    public updatePasswordForm(form: FormGroup): void {
        this.formPassword = form;
    }
}

interface IFormForgot {
    userEmail: FormControl<string | null>;
    code?: FormControl<string | null>;
}