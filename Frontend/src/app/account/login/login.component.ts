import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { formInputTouched, showErrorForInputs } from '../../shared/validators/form-group.validators';
import { AvailableResult, NativeBiometric } from "capacitor-native-biometric";
import { emailValidator } from '../../shared/validators/email-validator';
import { AccountService } from '../../shared/services/account/account.service';
import { LocalStorageService, SessionStorageService } from 'angular-web-storage';
import { LocalStorageKeys } from '../../shared/services/util/local.storage.keys';
import { environment } from '../../../environments/environments';
import { FeaturesStatusService } from '../../shared/services/util/features-status.service';
import { FeatureNames } from '../../shared/models/feature-names.enum';
import { TranslationConstants } from '../../shared/services/util/translation.service';
import { ConfigReaderService } from '../../shared/services/util/config.reader.service';
import { UserLoggedModel } from '../../shared/models/user.logged.model';
import { CustomSnackbarComponent, SnackBarTheme } from '../../shared/custom-snackbar/custom-snackbar.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AuthCodeModalComponent } from '../../shared/modals/auth-code-modal/auth-code-modal.component';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { BottomSheetComponent } from '../../shared/bottom-sheet/bottom-sheet.component';
import { SessionStorageKeys } from '../../shared/services/util/session.storage.keys';

@Component({
    selector: 'app-login',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {

    public loading: boolean = false;
    public showPassword: boolean = false;
    public redirectUrl: string = '';
    public usedIdentity: boolean = false;
    public linkAfterLogin: string | undefined = '';
    public formLogin: FormGroup<IFormLogin> = new FormGroup<IFormLogin>({
        userEmail: new FormControl<string>('', { validators: [Validators.required, emailValidator] }),
        password: new FormControl<string>('', { validators: [Validators.required, Validators.minLength(8), Validators.maxLength(20)] }),
        remindMe: new FormControl<boolean>(false)
    });
    public code: string = ''
    public showResendCode: boolean = false;
    public email: boolean = false;

    constructor(
        private readonly router: Router,
        private readonly accountService: AccountService,
        private readonly localStorageService: LocalStorageService,
        private readonly activatedRoute: ActivatedRoute,
        private readonly featureStatusService: FeaturesStatusService,
        private readonly translationConstants: TranslationConstants,
        private readonly configurationService: ConfigReaderService,
        private readonly customSnackbar: CustomSnackbarComponent,
        private readonly dialog: MatDialog,
        private readonly bottomSheet: MatBottomSheet,
        private readonly sessionStorage: SessionStorageService,
    ) {}

    public async ngOnInit(): Promise<void> {
        this.loading = true;
        this.accountService.getRsaPublicKey().subscribe();
        this.configurationService.getAllExternalLinks().subscribe(links => {
            this.linkAfterLogin = links.loginLink;
        });

        await this.performBiometricVerificatin();

        this.accountService.verifyAuthentication().subscribe((authenticated) => {
            if (authenticated) {
                this.router.navigate([environment.firstRoute]);
            } else {
                this.accountService.getRsaPublicKey().subscribe();
                this.formLogin.patchValue({
                    userEmail: this.localStorageService.get(LocalStorageKeys.USER_EMAIL_ENTRY),
                    remindMe: true
                });
            }

            this.formLogin.value.remindMe = this.formLogin.value.userEmail ? true : false;
        }).add(() => this.loading = false);
    }

    public async login(): Promise<void> {
        this.loading = true;
        this.accountService.loginUser((this.formLogin.value.userEmail as string).toLocaleLowerCase(), (this.formLogin.value.password as string), (this.code as string)).then(async (user: UserLoggedModel) => {
            if (this.formLogin.value.remindMe) {
                this.localStorageService.set(LocalStorageKeys.USER_EMAIL_ENTRY, this.formLogin.value.userEmail);
            }
            this.localStorageService.set(LocalStorageKeys.CREATED_BANKING, false);

            if (user["cpf"] || user["cnpj"] || user["externalDoc"]) {
                this.redirectUrl = environment.firstRoute;
            }
            await this.verifyIfHasRedirectUrl();

            if (!this.usedIdentity) {
                try {
                    const result: AvailableResult = await NativeBiometric.isAvailable();

                    if (result?.isAvailable) {
                        await NativeBiometric.setCredentials({
                            username: (this.formLogin.value.userEmail as string).toLocaleLowerCase(),
                            password: (this.formLogin.value.password as string),
                            server: environment.baseUrl,
                        }).catch(() => {});
                    }
                } catch(error) {

                }
            }

            this.featureStatusService.getFeatureStatus(FeatureNames.REGISTRATION_KYC).subscribe(featureStatus => {
                if(featureStatus) {
                    this.loading = true;
                    this.accountService.getUserAdditionalinformation().subscribe(dt => {
                        if(!dt || dt?.length === 0) {
                            const sheetRef: MatBottomSheetRef = this.bottomSheet.open(BottomSheetComponent, {
                                data: {
                                    text: this.translationConstants.translate('login.completeYourRegistration'),
                                    declineOption: this.translationConstants.translate('snackbar.no'),
                                    confirmOption: this.translationConstants.translate('snackbar.ok'),
                                }
                            });
                            sheetRef.afterDismissed().subscribe(action => {
                                if (action) {
                                    //We use the "Trusted Navigation" flag, due to RouteGuard in "complete-your-registration",
                                    // which prevents the user from accessing the route manually via the URL.
                                    this.sessionStorage.set(SessionStorageKeys.TRUSTED_NAVIGATION, true);
                                    window.location.href = '/account/complete-your-registration';
                                } else {
                                    window.open(this.redirectUrl, '_self');
                                }
                            });
                        } else {
                            window.open(this.redirectUrl, '_self');
                        }
                    }).add(() => {
                        this.loading = false;
                    });
                } else {
                    window.open(this.redirectUrl, '_self');
                }
            })

        }, error => {
            if (error) {
                this.loading = false;
                if (error?.message?.includes('UserNotConfirmedException')) {
                    this.showResendCode = true;
                    this.openAuthModal();
                } else if (error?.message?.includes('This user has MFA enabled, and secret code has not been sent')) {
                    if(error?.message?.includes('email')) {
                        this.email = true;
                    }
                    this.openAuthModal();
                } else if (error?.message?.includes('Invalid code received for user')) {
                    if(error?.message?.includes('email')) {
                        this.email = true;
                    }
                    this.openAuthModal();
                } else if (error?.message?.includes('incorrect code')) {
                    this.email = true;
                    this.openAuthModal();
                } else if (error?.message?.includes('Incorrect username or password.')) {
                    this.customSnackbar.open(this.translationConstants.translate('login.wrongInformations'), SnackBarTheme.error, 8000);
                } else {
                    this.customSnackbar.open(this.translationConstants.translate('login.loginErrorGeneric'), SnackBarTheme.error, 8000);
                }
            }
        });
    }

    public resendCode(): void {
        this.loading = true;
        this.accountService.resendCode((this.formLogin.value.userEmail as string)).subscribe(data => {
            if (data) {
                this.customSnackbar.open(this.translationConstants.translate('login.successCode'), SnackBarTheme.success, 8000);
                this.openAuthModal();
            }
        }, (error: any) => {
            if (error) {
                this.customSnackbar.open(this.translationConstants.translate('login.errorCode'), SnackBarTheme.error, 8000);
            }
        }).add(() => {
            this.loading = false;
        });
    }

    public openAuthModal(): void {
        const dialogRef: MatDialogRef<AuthCodeModalComponent> = this.dialog.open(AuthCodeModalComponent, {
            data: this.email
        });

        dialogRef.afterClosed().subscribe((code: string) => {
            if (code) {
                this.code = code;
                this.login();
            }
        });
    }

    public async verifyIfHasRedirectUrl(): Promise<void> {
        this.activatedRoute.queryParams.subscribe(
            (params: Params) => {
                if(params['redirectUrl']) {
                    this.redirectUrl = params['redirectUrl'];
                }
            }
        );
    }

    public showError(formName: string): boolean {
        return showErrorForInputs(formName, this.formLogin);
    }

    public formInputTouched(formName: string): boolean {
        return formInputTouched(formName, this.formLogin)
    }

    public goToForgot(): void {
        this.router.navigate(['/account/forgot']);
    }

    public goToSignUp(): void {
        this.router.navigate(['/account/sign-up']);
    }

    public async performBiometricVerificatin() {
        try {
            const result: AvailableResult = await NativeBiometric.isAvailable();

            if (!result?.isAvailable) {
                return;
            }

            const credentials = await NativeBiometric.getCredentials({
                server: environment.baseUrl,
            }).then((credentials) => {
                return credentials
            }).catch(() => {
                return undefined;
            })
    
            if (credentials?.username) {
                const verified = await NativeBiometric.verifyIdentity({
                    reason: "automatic login",
                    title: this.translationConstants.translate('authentication.title'),
                    subtitle: this.translationConstants.translate('authentication.subtitle'),
                    description: this.translationConstants.translate('authentication.description'),
                })
                    .then(() => true)
                    .catch(() => false);
    
                if (!verified) return;
    
                this.formLogin.value.userEmail = credentials.username;
                this.formLogin.value.password = credentials.password;
                this.usedIdentity = true;
                this.accountService.getRsaPublicKey().subscribe(success => {
                    this.login();
                });
            }
        } catch(error) {

        }
    }
}

interface IFormLogin {
    userEmail: FormControl<string | null>;
    password: FormControl<string | null>;
    remindMe: FormControl<boolean | null>;
}