import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { RouterModule } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { passwordPrerequisites } from '../../validators/password.validator';
import { formInputTouched, showErrorForInputs } from '../../validators/form-group.validators';
import { MatStepper } from '@angular/material/stepper';
import { HoverIconClassService } from '../../services/util/hover-icon-class.service';
import { AccountService } from '../../services/account/account.service';
import { TranslationConstants } from '../../services/util/translation.service';
import { CustomSnackbarComponent, SnackBarTheme } from '../../custom-snackbar/custom-snackbar.component';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
    selector: 'app-mfa-config-modal',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    templateUrl: './mfa-config-modal.component.html',
    styleUrl: './mfa-config-modal.component.scss'
})
export class MfaConfigModalComponent {

    @ViewChild('stepper', { static: false }) public stepper!: MatStepper;
    public showPassword: boolean = false;
    public showConfirmPassword: boolean = false;
    public currentStepperIndex: number = 0;
    public form: FormGroup<IForm> = new FormGroup<IForm>({
        password: new FormControl<string>('', { validators: [Validators.required, Validators.minLength(8), Validators.maxLength(20), passwordPrerequisites] }),
    });
    public loading: boolean = false;
    public userEmail: string = '';
    public internal: boolean = true;
    public validationKey: string = '';

    constructor(
        public dialogRef: MatDialogRef<MfaConfigModalComponent>,
        public hoverIconClassService: HoverIconClassService,
        private readonly accountService: AccountService,
        private readonly translationConstants: TranslationConstants,
        private readonly customSnackbar: CustomSnackbarComponent,
        private readonly clipboard: Clipboard,
    ) { }

    public ngOnInit(): void {
        this.dialogRef.disableClose = true;
        this.dialogRef.addPanelClass(['custom-modal', 'mfa-config-modal']);

        this.accountService.getRsaPublicKey().subscribe();
        this.accountService.getLoggedUserDetails().subscribe(data => {
            this.userEmail = data?.email;
        }).add(() => this.loading = false);
    }

    public startConfig(internal: boolean): void {
        this.internal = internal;

        this.nextStepper();
    }

    public ngAfterViewInit(): void {
        this.stepper.selectionChange.subscribe(stepper => {
            this.currentStepperIndex = stepper.selectedIndex;

            if ((this.internal && this.currentStepperIndex === 2) || (!this.internal && this.currentStepperIndex === 3)) {
                this.form.addControl('code', new FormControl<string | null>(null, { 
                    validators: [Validators.required, Validators.minLength(6), Validators.maxLength(6)] 
                }));
            } else {
                this.form.removeControl('code');
            }
        });
    }

    public showError(formName: string, form: FormGroup): boolean {
        return showErrorForInputs(formName, form);
    }

    public nextStepper(): void {
        this.stepper.next();
    }

    public previousStepper(): void {
        this.stepper.previous();
    }

    public translateHeaderText(): { title: string, subtitle: string } {
        if (this.currentStepperIndex === 0) {
            return {
                title: 'mfa.config.modal.title1',
                subtitle: 'mfa.config.modal.subtitle1'
            }
        } else if (this.currentStepperIndex === 1) {
            return {
                title: 'mfa.config.modal.title2',
                subtitle: 'mfa.config.modal.subtitle2'
            }
        } else if (this.currentStepperIndex === 2) {
            return {
                title: 'mfa.config.modal.title2',
                subtitle: !this.internal ? 'mfa.config.modal.subtitle3.opt1' : 'mfa.config.modal.subtitle3.opt2'
            }
        } else if (this.currentStepperIndex === 3) {
            return {
                title: 'mfa.config.modal.title2',
                subtitle: !this.internal ? 'mfa.config.modal.subtitle4.app' : 'mfa.config.modal.subtitle4.internal'
            }
        }

        return {
            title: '',
            subtitle: ''
        }
    }

    public hasPasswordPrerequisiteError(): boolean {
        const passwordErrors: ValidationErrors | null | undefined = this.form.get('password')?.errors;
        if (!passwordErrors) {
            return false;
        }

        const keys: string[] = ['noHasLowerCase', 'noHasUpperCase', 'minLength', 'noHasNumbers', 'noHasSpecialChars'];
        return keys.some(key => passwordErrors[key]);
    }

    // Methods for MFA config steps below
    public startMFAProcess(): void {
        this.loading = true;
        this.accountService.startMFAProcess(this.userEmail, this.form.value.password as string, '', this.internal).subscribe(data => {
            if (data) {
                this.validationKey = data.Key;
                this.nextStepper();
            }
        }, error => {
            if (!error.includes('user has MFA enabled')) {
                this.customSnackbar.open(this.translationConstants.translate('snackbar.errorStartMFAConfig'), SnackBarTheme.error, 3000);
            } else {
                this.customSnackbar.open(this.translationConstants.translate('snackbar.errorUserHasMFA'), SnackBarTheme.error, 3000);
            }
        }).add(() => {
            this.loading = false;
        });
    }

    public finalizeMFAProcess(): void {
        this.loading = true;
        this.accountService.finalizeMFAProcess(this.userEmail, this.form.value.password as string, this.form.value.code as string, this.internal).subscribe(data => {
            this.close(true);
        }, error => { 
            this.customSnackbar.open(this.translationConstants.translate('snackbar.errorFinishMFAConfig'), SnackBarTheme.error, 3000);
        }).add(() => {
            this.loading = false;
        });
    }

    public formInputTouched(formName: string): boolean {
        return formInputTouched(formName, this.form)
    }

    public close(dismiss: boolean = false): void {
        this.dialogRef.close(dismiss);
    }

    public copyValidationKey(): void {
        this.clipboard.copy(this.validationKey);
        this.customSnackbar.open(this.translationConstants.translate('snackbar.keyCopied'), SnackBarTheme.success, 3000);
    }

    public openAppInStore(appStore: string): void {
        let url: string | undefined = '';
        if (appStore === 'Apple') {
            url = 'https://apps.apple.com/us/app/authy/id494168017';
        } else {
            url = 'https://play.google.com/store/apps/details?id=com.authy.authy';
        }

        window?.open(url, '_blank')?.focus();
    }
}

interface IForm {
    password: FormControl<string | null>;
    code?: FormControl<string | null>;
}