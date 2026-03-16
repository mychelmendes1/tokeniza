import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { formInputTouched, showErrorForInputs } from '../../shared/validators/form-group.validators';
import { INationality, NationalityService } from '../../shared/services/util/nationality.service';
import { completeFullNameValidator } from '../../shared/validators/fullname.validator';
import { HoverIconClassService } from '../../shared/services/util/hover-icon-class.service';
import { OnkeypressService } from '../../shared/services/util/onkeypress.service.ts.service';
import { fadeIn } from '../../shared/services/util/animations.service';
import { MatRadioChange } from '@angular/material/radio';
import { CpfCnpjValidator } from '../../shared/validators/cpf-cnpj.validator.function';
import { emailValidator } from '../../shared/validators/email-validator';
import { SimpleModalComponent } from '../../shared/modals/simple-modal/simple-modal.component';
import { emailExistsValidator } from '../../shared/validators/email-exists.validator';
import { indicationUsernameValidator } from '../../shared/validators/indication-username.validator';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ComponentsModule } from '../../shared/components/components.module';
import { PasswordStrengthComponent } from '../../shared/components/password-strength/password-strength.component';
import { environment } from '../../../environments/environments';
import { TranslationConstants } from '../../shared/services/util/translation.service';
import { DateAdapter } from '@angular/material/core';
import { FeaturesStatusService } from '../../shared/services/util/features-status.service';
import { FeatureNames } from '../../shared/models/feature-names.enum';
import { LocalStorageKeys } from '../../shared/services/util/local.storage.keys';
import { LanguagesEnum } from '../../shared/models/languages.enum';
import { TranslateService } from '@ngx-translate/core';
import { SessionStorageService } from 'angular-web-storage';
import { ConfigReaderService } from '../../shared/services/util/config.reader.service';
import { AccountService } from '../../shared/services/account/account.service';
import { CustomSnackbarComponent, SnackBarTheme } from '../../shared/custom-snackbar/custom-snackbar.component';
import { internacionalValidPhone } from '../../shared/validators/internacional-phone-number.validator';
import { UserIdentifierEnum } from '../../shared/models/user.logged.model';
import { PixelService } from '../../shared/services/util/pixel.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DiditSessionRequest } from '../../shared/models/didit-session.model';

interface IFormPersonalInfo {
    typeSale: FormControl<string | null>;
    nationality: FormControl<string | null>;
    fullName: FormControl<string | null>;
    userName: FormControl<string | null>;
    indication: FormControl<string | null>;
    documentToken: FormControl<string | null>;
}

interface IFormAccountType {
    accountType: FormControl<string | null>;
    identity: FormControl<string | null>;
    dateOfBirth: FormControl<string | null>;
    openingDate: FormControl<string | null>;
    managerIdentity: FormControl<string | null>;
    documentType: FormControl<string | null>;
}

interface IFormContactAndSecurity {
    email: FormControl<string | null>;
    phoneNumber: FormControl<string | null>;
    terms: FormControl<boolean | null>;
}

@Component({
    selector: 'app-sign-up',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule,
        ComponentsModule,
        PasswordStrengthComponent,
    ],
    templateUrl: './sign-up.component.html',
    styleUrl: './sign-up.component.scss',
    animations: [fadeIn],
})
export class SignUpComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('stepper', { static: false }) public stepper!: MatStepper;
    public progressBarWidth: number = 0;
    public currentStepperIndex: number = 0;
    public nationalityList: Array<INationality> = [];
    public isBrazilian: boolean = false;
    public phonePrefix: string = '';
    public filteredNationalityList: Array<INationality> = [];
    public formPassword!: FormGroup;
    public isIdwallSdkEnabled: boolean = false;
    public isDiditSdkEnabled: boolean = false;
    public isTwilioEnabled: boolean = false;
    public documentType: Array<string> = [];
    public termsOfUseURL: string = '';
    public loading: boolean = false;
    public cameFromLink: boolean = false;
    public enablePixel: boolean = false;
    public showIdwall: boolean = false;
    public showDidit: boolean = false;
    public isIndicationFromUrl: boolean = false;
    public diditVerificationUrl: string = '';

    public diditVerificationUrlSafe!: SafeResourceUrl;
    public diditSessionId: string = '';
    public tokenId: string = '';
    public nftToken?: string = '';
    private searchTime!: ReturnType<typeof setTimeout>;
    public searchResults: { [key: string]: boolean } = {};
    public formPersonalInfo: FormGroup<IFormPersonalInfo> = new FormGroup<IFormPersonalInfo>({
        typeSale: new FormControl<string>('', { validators: [Validators.required] }),
        nationality: new FormControl<string>('', { validators: [Validators.required] }),
        fullName: new FormControl<string>('', { validators: [Validators.required, completeFullNameValidator()] }),
        userName: new FormControl<string>('', { validators: [Validators.required] }),
        indication: new FormControl<string>('', { validators: [indicationUsernameValidator], updateOn: 'change' }),
        documentToken: new FormControl<string>(''),
    });

    public formAccountType: FormGroup<IFormAccountType> = new FormGroup<IFormAccountType>({
        accountType: new FormControl<string>('', { validators: [Validators.required] }),
        identity: new FormControl<string>(''),
        dateOfBirth: new FormControl<string>(''),
        openingDate: new FormControl<string>(''),
        managerIdentity: new FormControl<string>(''),
        documentType: new FormControl<string>('')
    });

    public formContactAndSecurity: FormGroup<IFormContactAndSecurity> = new FormGroup<IFormContactAndSecurity>({
        email: new FormControl('', { validators: [Validators.required, emailValidator] }),
        phoneNumber: new FormControl('', { validators: [Validators.required] }),
        terms: new FormControl(false, { validators: [Validators.requiredTrue] }),
    });

    constructor(
        private readonly nationalityService: NationalityService,
        private readonly router: Router,
        public hoverIconClassService: HoverIconClassService,
        private readonly onkeypressService: OnkeypressService,
        private readonly dialog: MatDialog,
        private readonly translationConstants: TranslationConstants,
        private dateAdapter: DateAdapter<any>,
        private readonly featureStatusService: FeaturesStatusService,
        private readonly translate: TranslateService,
        private readonly sessionStorage: SessionStorageService,
        private readonly configReaderService: ConfigReaderService,
        private readonly pixel: PixelService,
        private readonly accountService: AccountService,
        private readonly customSnackbar: CustomSnackbarComponent,
        private readonly activatedRoute: ActivatedRoute,
        private changeDetectorRef: ChangeDetectorRef,
        private readonly sanitizer: DomSanitizer,
    ) {
        this.nationalityList = this.nationalityService.getAllNationality();
        this.filteredNationalityList = [...this.nationalityList];


        this.formValueChanges();
    }

    public formValueChanges(): void {
        this.formPersonalInfo.controls.nationality.valueChanges.subscribe(value => {
            this.searchNationality((value as string));
        });

        this.formPersonalInfo.controls.typeSale.valueChanges.subscribe((value) => {
            const locale = value === LanguagesEnum.ENGLISH ? 'en-US' :
                value === LanguagesEnum.SPANISH ? 'es-ES' : 'pt-BR';

            const lang = value === LanguagesEnum.ENGLISH ? LanguagesEnum.ENGLISH :
                value === LanguagesEnum.SPANISH ? LanguagesEnum.SPANISH :
                    LanguagesEnum.PORTUGUESE;

            this.dateAdapter.setLocale(locale);
            this.sessionStorage.set(LocalStorageKeys.LANGUAGE_LIST, lang);
            this.translate.use(lang);
        });
    }

    public ngOnInit(): void {
        this.activatedRoute.queryParams.subscribe(params => {
            if (params?.['indication_token']) {
                this.formPersonalInfo.patchValue({ indication: params?.['indication_token'] });
                this.cameFromLink = true;
                this.isIndicationFromUrl = true;
                // Desabilita o campo quando o token vem da URL
                this.formPersonalInfo.controls.indication.disable();
            } else {
                // Garante que o campo está habilitado se não vier da URL
                this.isIndicationFromUrl = false;
                this.formPersonalInfo.controls.indication.enable();
            }

            if (params?.['token_id']) {
                this.tokenId = params?.['token_id'];
            }

            if (params?.['nft_token']) {
                this.nftToken = params?.['nft_token'];
            }
        });

        // Add async validator to check if email already exists
        const emailControl = this.formContactAndSecurity.get('email');
        emailControl?.setAsyncValidators([emailExistsValidator(this.accountService)]);
        emailControl?.updateValueAndValidity();

        this.accountService.getRsaPublicKey().subscribe();
        this.configReaderService.getAllExternalLinks().subscribe(data => {
            if (data?.externalFiles?.termsOfUse) {
                this.termsOfUseURL = data?.externalFiles?.termsOfUse;
            }
        });

        this.featureStatusService.getFeatureStatus(FeatureNames.ID_WALL_SDK).subscribe(isIdwallSdkEnabled => {
            this.isIdwallSdkEnabled = isIdwallSdkEnabled;
        });

        this.featureStatusService.getFeatureStatus(FeatureNames.DIDIT_SDK).subscribe(isDiditSdkEnabled => {
            this.isDiditSdkEnabled = isDiditSdkEnabled;
        });

        this.featureStatusService.getFeatureStatus(FeatureNames.TWILIO).subscribe(isTwilioEnabled => {
            this.isTwilioEnabled = isTwilioEnabled;
        });
    }

    public ngAfterViewInit(): void {
        this.stepper.selectionChange.subscribe(stepper => {
            this.currentStepperIndex = stepper.selectedIndex;
            const matStepLength: number = this.stepper.steps.length;
            this.progressBarWidth = (stepper.selectedIndex * 100) / (matStepLength - 1);
        });
    }

    public nextStepper(): void {
        this.stepper.next();
    }

    public dateFilter = (date: Date | null): boolean => {
        const today: Date = new Date();
        today.setHours(0, 0, 0, 0);
        return date ? date <= today : false;
    }

    public onRadioGroupChange(event: MatRadioChange): void {
        if (event?.value === '0') {
            this.formAccountType.controls.identity.addValidators([Validators.required, CpfCnpjValidator.validatorFn()]);
            this.formAccountType.controls.openingDate.clearValidators();
            this.formAccountType.controls.openingDate.reset();
            this.formAccountType.controls.dateOfBirth?.setValidators([Validators.required]);
        } else {
            this.formAccountType.controls.identity.addValidators([Validators.required, CpfCnpjValidator.validatorFn()]);
            this.formAccountType.controls.managerIdentity.addValidators([Validators.required, CpfCnpjValidator.validatorFn()]);

            this.formAccountType.controls.dateOfBirth.clearValidators();
            this.formAccountType.controls.dateOfBirth.reset();
            this.formAccountType.controls.openingDate?.setValidators([Validators.required]);
        }

        this.formAccountType.patchValue({
            identity: null,
            openingDate: null,
            dateOfBirth: null,
            managerIdentity: null
        });

        this.formAccountType.controls.identity.updateValueAndValidity();
        this.formAccountType.controls.openingDate.updateValueAndValidity();
        this.formAccountType.controls.dateOfBirth.updateValueAndValidity();
        this.formAccountType.controls.managerIdentity.updateValueAndValidity();

        if (this.isBrazilian) {
            this.formAccountType.patchValue({ documentType: event?.value === '0' ? 'cpf' : 'cnpj' }); // 0 cpf 1 cnpj
        } else {
            this.formAccountType.controls.identity.clearValidators();
            this.formAccountType.controls.identity.reset();
            this.formAccountType.controls.managerIdentity.clearValidators();
            this.formAccountType.controls.managerIdentity.reset();
        }
    }

    public previousStepper(): void {
        this.stepper.previous();
    }

    public translateHeaderText(): { title: string, subtitle: string } {
        if (this.currentStepperIndex === 0) {
            return {
                title: 'account.signUp.personalInfo',
                subtitle: 'account.signUp.aboutYou'
            }
        } else if (this.currentStepperIndex === 1) {
            return {
                title: 'account.signUp.accountType',
                subtitle: 'account.signUp.accountUse'
            }
        } else {
            return {
                title: 'account.signUp.contactAndSecurity',
                subtitle: 'account.signUp.garanteeSecurity'
            }
        }
    }

    public showError(formName: string, form: FormGroup): boolean {
        return showErrorForInputs(formName, form);
    }

    public formInputTouched(formName: string, form: FormGroup): boolean {
        return formInputTouched(formName, form)
    }

    public showIndicationError(): boolean {
        const indicationControl = this.formPersonalInfo.get('indication');
        if (this.isIndicationFromUrl || !indicationControl) {
            return false;
        }
        const value = indicationControl.value;
        return !!(value && value.trim() && !value.trim().startsWith('@'));
    }

    public searchNationality(value: string): void {
        this.searchResults['nationality'] = true;
        clearTimeout(this.searchTime);

        this.searchTime = setTimeout(() => {
            const controlCountry = this.formPersonalInfo.get('nationality');
            const filter: string = value.toLowerCase();

            this.filteredNationalityList = this.nationalityList.filter(nationality =>
                nationality.name.toLowerCase().includes(filter)
            );

            const match = this.nationalityList.find(n =>
                n.name.toLowerCase() === filter
            );

            if (!value && !match) {
                controlCountry?.setErrors(null);
                controlCountry?.setValue(null, { emitEvent: false });
            } else if (match) {
                const capitalized = this.capitalizeFirstLetter(match.name);
                if (controlCountry?.value !== capitalized) {
                    controlCountry?.setValue(capitalized, { emitEvent: false });
                }
                controlCountry?.setErrors(null);
            } else {
                controlCountry?.setErrors({ incorrectCountry: true });
            }

            this.searchResults['nationality'] = false;
        }, 200);
    }

    public capitalizeFirstLetter(string: string): string {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    public goToLogin(): void {
        this.router.navigate(['/account/login']);
    }

    public disabledContinueButton(): boolean {
        const isSearchResults: boolean = Object.values(this.searchResults).some(status => status === true);
        if (this.currentStepperIndex === 0) {
            if (!this.formPersonalInfo.valid) {
                return true;
            }
        }

        if (this.currentStepperIndex === 1) {
            if (!this.formAccountType.valid) {
                return true;
            }
        }

        if (this.currentStepperIndex === 2) {
            if (!this.formContactAndSecurity.valid || !this.formPassword || !this.formPassword.valid) {
                return true;
            }
        }

        return isSearchResults || false;
    }

    public updatePasswordForm(form: FormGroup): void {
        this.formPassword = form;
    }

    public blockSpecialCharacters(event: KeyboardEvent, allowSpace: boolean = false): void {
        return this.onkeypressService.blockSpecialCharacters(event, allowSpace);
    }

    public onSelectNationality(value: string): void {
        this.isBrazilian = value === 'Brazil';
        const nationality = this.nationalityList.find(nat => nat.name === value);
        this.formPersonalInfo.controls['nationality'].setValue(nationality?.name || '');
        this.phonePrefix = nationality?.idd;
        this.setDocumentTypes();

        if (this.isBrazilian) {
            this.formAccountType.patchValue({ documentType: this.formAccountType.controls.accountType.value === '0' ? 'cpf' : 'cnpj' }); // 0 cpf 1 cnpj
            this.formAccountType.controls.documentType.disable();
        } else {
            this.formAccountType.controls.documentType.enable();
        }
    }

    public openSimpleModal(): void {
        const dialogRef: MatDialogRef<SimpleModalComponent> = this.dialog.open(SimpleModalComponent, {
            data: {
                title: 'account.signUp.success.title',
                subtitle: 'account.signUp.success.subtitle',
                icon: 'assets/images/check-container.svg',
                autoClosingTime: 8000
            }
        });

        dialogRef.afterClosed().subscribe((action: boolean) => {
            if (action) {
                this.goToLogin();
            }
        });
    }

    public advanceButton(): void {
        if (this.currentStepperIndex === 0) {
            this.checkUsername();
        } else if (this.currentStepperIndex === 1) {
            this.verifyDocument();
        } else if (this.currentStepperIndex === 2) {
            if (this.isDiditSdkEnabled && !this.showDidit) {
                this.initiateDiditVerification();
            } else {
                this.signUp();
            }
        } else {
            this.nextStepper();
        }
    }

    public setDocumentTypes() {
        if (this.isBrazilian) {
            this.documentType = ["cpf", "cnpj"];
        } else {
            this.documentType = [
                "ssn",
                "nif",
                "cif",
                "sin",
                "nino",
                "utr",
                "ein",
                "bn",
                "steuerId",
                "nir",
                "siret",
                "codiceFiscalePartitaIVA",
                "tfn",
                "abn",
                "corporateNumber",
                "geshuihao",
                "pan",
                "other"
            ];
        }
    }

    public openTerms(): void {
        if (this.termsOfUseURL) {
            window.open(this.termsOfUseURL, '_blank');
        }
    }

    public checkUsername(): void {
        this.loading = true;
        this.accountService.validateUsername(this.formPersonalInfo.value.userName as string).subscribe(documentFound => {
            if (documentFound["value"]) {
                this.customSnackbar.open(this.translationConstants.translate('account.signUp.error.existingUsername'), SnackBarTheme.error, 8000);
            } else if (this.formPersonalInfo.getRawValue().indication) {
                this.accountService.validateUsername(this.formPersonalInfo.getRawValue().indication || '').subscribe(documentFound => {
                    if (!documentFound["value"] && !this.cameFromLink) {
                        this.customSnackbar.open(this.translationConstants.translate('account.signUp.error.wrongUsernameIndication'), SnackBarTheme.error, 8000);
                    } else {
                        this.stepper.next();
                    }
                }).add(() => {
                    this.loading = false;
                });
            } else {
                this.stepper.next();
                this.loading = false;
            }
        }).add(() => {
            this.loading = false;
        });
    }

    public verifyDocument(): void {
        this.loading = true;
        if (this.formAccountType.value.identity) {
            if (!this.isBrazilian) {
                this.stepper.next();
                this.loading = false;
            } else {
                const cpf: string = (this.formAccountType.value.identity.length === 11 ? this.formAccountType.value.identity : undefined) as string;
                const cnpj: string = (this.formAccountType.value.identity.length === 14 ? this.formAccountType.value.identity : undefined) as string;

                this.accountService.verifyDocument(cpf, cnpj).subscribe(documentFound => {
                    if (documentFound["value"]) {
                        this.customSnackbar.open(this.translationConstants.translate('account.signUp.error.existingDocument'), SnackBarTheme.error, 8000);
                    } else {
                        if (this.isIdwallSdkEnabled) {
                            this.showIdwall = true;
                            this.stepper.next();

                            setTimeout(() => {
                                (window as any).idwSDKWeb({
                                    token: environment.tokenIdWall,
                                    onRender: () => {
                                    },
                                    onComplete: ({ token }: { token: string }) => {
                                        this.formPersonalInfo.patchValue({ documentToken: token });
                                        this.showIdwall = false;
                                        this.changeDetectorRef.detectChanges();
                                    },
                                    onError: (error: any) => {
                                        alert(error);
                                        this.showIdwall = false;
                                        this.changeDetectorRef.detectChanges();
                                    }
                                })
                            });
                        } else {
                            this.stepper.next();
                        }
                    }
                }, error => {
                    if (error) {
                        this.loading = false;
                    }
                }).add(() => {
                    this.loading = false;
                });
            }
        }
    }

    public signUp(): void {
        this.loading = true;
        const firstName: string = (this.formPersonalInfo.value.fullName as string).split(' ')[0];
        const auxLastName: string[] = (this.formPersonalInfo.value.fullName as string).split(' ');
        let lastName: string = '';
        auxLastName.forEach((name: string, index: number) => {
            if (index === 1) {
                lastName += `${name}`;
            } else if (index > 1) {
                lastName += ` ${name}`;
            }
        });

        const phone: string = `${this.phonePrefix}${this.formContactAndSecurity.value.phoneNumber}`;
        const phoneValid: boolean = internacionalValidPhone(phone);

        if (!phoneValid) {
            this.loading = false;
            return this.customSnackbar.open(this.translationConstants.translate('account.signUp.error.phoneNumber'), SnackBarTheme.error, 8000);
        }

        let userName: string = this.formPersonalInfo.value.userName || '';
        if (userName[0] !== '@') {
            userName = '@' + userName;
        }

        this.accountService.createUser(
            this.formContactAndSecurity.value.email as string,
            this.formPassword.value.password,
            firstName,
            lastName,
            this.formAccountType.value.identity as string,
            this.formPersonalInfo.getRawValue().indication as string,
            this.defineDocumentType() as UserIdentifierEnum,
            this.formPersonalInfo.value.documentToken as string,
            this.diditSessionId || '',
            this.tokenId,
            this.formAccountType.value.accountType as string,
            undefined,
            this.nftToken,
            undefined,
            phone,
            this.formContactAndSecurity.value.email as string,
            (this.formAccountType.value.dateOfBirth as string) ?? null,
            (this.formAccountType.value.openingDate as string) ?? null,
            (this.formAccountType.value.managerIdentity as string) ?? null,
            false
        ).subscribe(() => {
            // Hide Didit iframe if it was shown
            if (this.showDidit) {
                this.showDidit = false;
                this.changeDetectorRef.detectChanges();
            }
            setTimeout(() => {
                this.openSimpleModal();
            }, 2);

            this.pixel.trackLead({ contentName: this.formContactAndSecurity.value.email as string });
        }, (error: any) => {
            if (error?.error?.message?.includes('User already exists')) {
                this.customSnackbar.open(this.translationConstants.translate('account.signUp.error.existingAccount'), SnackBarTheme.error, 8000);
            } else if (error?.error?.message?.includes('Document already exists')) {
                this.customSnackbar.open(this.translationConstants.translate('account.signUp.error.existingInternationalDocument'), SnackBarTheme.error, 8000);
            } else if (error?.error?.message?.includes('Indication code not valid')) {
                this.customSnackbar.open(this.translationConstants.translate('account.signUp.error.indicationNotValid'), SnackBarTheme.error, 8000);
            } else {
                this.customSnackbar.open(this.translationConstants.translate('account.signUp.error.undefined'), SnackBarTheme.error, 8000);
            }
        }).add(() => {
            this.loading = false;
        });
    }

    private defineDocumentType(): UserIdentifierEnum | undefined {
        if (!this.isBrazilian) {
            return UserIdentifierEnum.External;
        } else if ((this.formAccountType.value.identity as string).length === 11) {
            return UserIdentifierEnum.CPF;
        } else if ((this.formAccountType.value.identity as string).length === 14) {
            return UserIdentifierEnum.CNPJ;
        }

        return undefined;
    }

    public onDateInput(event: any, controlName: string): void {

        const input = event.target as HTMLInputElement;
        let value = input.value.replace(/\D/g, ''); // Remove all the non-digits and symbols

        if (value.length <= 4 && value.length >= 2) {
            value = `${value.substring(0, 2)}/${value.substring(2, 4)}`; // Add the "/" between the day and month
        } else if (value.length >= 4) {
            value = `${value.substring(0, 2)}/${value.substring(2, 4)}/${value.substring(4, 8)}`; // Add the "/" between the month and year
        }

        // Update the input value displayed to the user
        input.value = value;

        // Update the form control if the input matches the pattern of a full date
        if (value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            const [day, month, year] = value.split('/').map(Number); // Converts the string into an array of strings separated by "/"
            const date = new Date(year, month - 1, day);

            // Check to see if the date is valid and the same as the one entered by the user, not something like 31/02/2023
            if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
                this.formAccountType.get(controlName)?.setValue(date);
            }

        }
    }

    // DIDIT Integration Methods
    private initiateDiditVerification(): void {
        this.loading = true;

        // Prepare user data for DIDIT session
        const userData: DiditSessionRequest = {
            email: this.formContactAndSecurity.value.email as string,
            fullname: this.formPersonalInfo.value.fullName as string,
        };

        // Add document based on type
        const identity = this.formAccountType.value.identity;
        if (identity) {
            if (this.isBrazilian) {
                if (identity.length === 11) {
                    userData.cpf = identity;
                } else if (identity.length === 14) {
                    userData.cnpj = identity;
                }
            } else {
                userData.passport = identity;
            }
        }

        // Create DIDIT session
        this.accountService.createDiditSession(userData).subscribe({
            next: (response: any) => {
                // Case 1: Email already registered (user exists in database)
                if (response?.emailAlreadyRegistered) {
                    this.loading = false;

                    // Case 1a: User has existing Didit session
                    if (response?.existingSession && response?.session_id) {
                        this.diditSessionId = response.session_id;
                        this.customSnackbar.open(
                            this.translationConstants.translate('account.signUp.error.existingAccount'),
                            SnackBarTheme.error,
                            8000
                        );
                        return;
                    }

                    // Case 1b: User exists but has no Didit session - show email already registered error
                    this.customSnackbar.open(
                        this.translationConstants.translate('account.signUp.error.existingAccount'),
                        SnackBarTheme.error,
                        8000
                    );
                    return;
                }

                // Case 2: New user - show Didit iframe
                if (response?.verification_url && response?.session_id) {
                    // Store session info and show iframe
                    this.diditVerificationUrl = response.verification_url;
                    this.diditVerificationUrlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(response.verification_url);
                    this.diditSessionId = response.session_id;
                    this.showDidit = true;

                    // Show verification step
                    this.changeDetectorRef.detectChanges();
                    this.stepper.next();

                    // Create account immediately with pending KYC status
                    // Backend webhook will update KYC status when verification completes
                    setTimeout(() => {
                        this.signUp();
                    }, 1000);
                } else {
                    this.customSnackbar.open(
                        this.translationConstants.translate('account.signUp.error.undefined'),
                        SnackBarTheme.error,
                        5000
                    );
                }
                this.loading = false;
            },
            error: (error) => {
                console.error('[Signup] Error creating Didit session:', error);
                this.customSnackbar.open(
                    this.translationConstants.translate('account.signUp.error.undefined'),
                    SnackBarTheme.error,
                    5000
                );
                this.loading = false;
            }
        });
    }


    public ngOnDestroy(): void {
        // Cleanup when component is destroyed
    }
}

