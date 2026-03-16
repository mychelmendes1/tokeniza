import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { Router, RouterModule } from '@angular/router';
import { MatStepper } from '@angular/material/stepper';
import { HoverIconClassService } from '../../shared/services/util/hover-icon-class.service';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { showErrorForInputs } from '../../shared/validators/form-group.validators';
import { employments } from '../../constants/employment-list.constants';
import { removeAccents } from '../../shared/services/util/remove-accents';
import { INationality, NationalityService } from '../../shared/services/util/nationality.service';
import { environment } from '../../../environments/environments';
import { cepValidatorLength } from '../../shared/validators/cep.validator';
import { ICep } from '../../shared/models/cep.model';
import { CepService } from '../../shared/services/util/cep.service';
import { AccountService } from '../../shared/services/account/account.service';
import { usefulSettings } from '../../shared/models/useful-settings.model';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { FILE_TYPES_TO_UPLOAD, getFileTypesForHtml } from '../../constants/file-types-accepted.constants';
import { TranslationConstants } from '../../shared/services/util/translation.service';
import { CustomSnackbarComponent, SnackBarTheme } from '../../shared/custom-snackbar/custom-snackbar.component';
import { FileService } from '../../shared/services/file/file.service';
import { FileStorageConfidentiality, FileStorageDocumentType } from '../../shared/models/file.model';
import { IUserAdditionalInformation } from '../../shared/models/IUserAdditionalInformation';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SimpleModalComponent } from '../../shared/modals/simple-modal/simple-modal.component';
import { v4 as uuid4 } from 'uuid';
import { IUserGenericDocuments } from '../../shared/models/user.logged.model';

const declarationFormValidator: ValidatorFn = (control: AbstractControl) => {
    const isVinculatedToCompany: string = control.get('vinculatedToCompany')?.value;
    const isUsPerson: string = control.get('usPerson')?.value;
    const isPep: string = control.get('pep')?.value;
    const noAlternative: string = control.get('noAlternative')?.value;

    return isVinculatedToCompany || isUsPerson || isPep || noAlternative ? null : { valid: true };
};

const investorProfilingFormValidator: ValidatorFn = (control: AbstractControl): { [key: string]: any } | null => {
    const isSelected: boolean = Object.values(control.value).some(value => value === true);
    return isSelected ? null : { 'isValid': true };
};

@Component({
    selector: 'app-complete-your-registration',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    templateUrl: './complete-your-registration.component.html',
    styleUrl: './complete-your-registration.component.scss'
})
export class CompleteYourRegistrationComponent implements OnInit, AfterViewInit {

    @ViewChild('stepper', { static: false }) public stepper!: MatStepper;
    public progressBarWidth: number = 0;
    public currentStepperIndex: number = 0;
    public loading: boolean = false;
    public employmentTypeList: Array<string> = [];
    public employmentOriginalList: Array<string> = [];
    public filteredNationalityList: Array<INationality> = [];
    public nationalityList: Array<INationality> = [];
    private searchTime!: ReturnType<typeof setTimeout>;
    public searchResults: { [key: string]: boolean } = {};
    public usefulSettings: usefulSettings = new usefulSettings();
    public loadingDocuments: boolean = false;
    public filesSize: number = 0;
    public maxSize = 10000000; // 10MB;
    public documentTypeError: boolean = false;
    public filesSizeErrorForDocument: boolean = false;
    public lastCurrentStepperIndex: boolean = false;

    public identificationForm: FormGroup<IFormIdentification> = new FormGroup<IFormIdentification>({
        gender: new FormControl('', { validators: [Validators.required] }),
        employmentType: new FormControl('', { validators: [Validators.required] }),
        marritalStatus: new FormControl('', { validators: [Validators.required] }),
        country: new FormControl('', { validators: [Validators.required] }),
    });

    public declarationForm: FormGroup<IFormDeclaration> = new FormGroup<IFormDeclaration>({
        vinculatedToCompany: new FormControl(null, {}),
        usPerson: new FormControl(null, {}),
        pep: new FormControl(null, {}),
        noAlternative: new FormControl(null, {}),
    }, { validators: declarationFormValidator });

    public addressForm: FormGroup<IFormAddress> = new FormGroup<IFormAddress>({
        country: new FormControl(null, { validators: [Validators.required] }),
        cep: new FormControl(null, { validators: [Validators.required, cepValidatorLength] }),
        publicPlace: new FormControl(null, { validators: [Validators.required] }), // Street, avenue...
        number: new FormControl(null, {}),
        noNumber: new FormControl(false, {}),
        complement: new FormControl(null, {}),
        neighborhood: new FormControl(null, { validators: [Validators.required] }),
        state: new FormControl(null, { validators: [Validators.required] }),
        city: new FormControl(null, { validators: [Validators.required] }),
    });

    public investmentForm: FormGroup<IFormInvestment> = new FormGroup<IFormInvestment>({
        monthlyIncome: new FormControl(''),
        realEstate: new FormControl(''),
        realActives: new FormControl(''),
        financialApplications: new FormControl(''),
        movableProperties: new FormControl(''),
        others: new FormControl(''),
    });

    public investorProfilingForm: FormGroup<IFormProfiling> = new FormGroup<IFormProfiling>({
        qualified: new FormControl(false),
        hugeInvestments: new FormControl(false),
        crowdfundingInvestmentsLessThanMaximum: new FormControl(false),
    }, { validators: investorProfilingFormValidator });

    public fraudAndSecurityForm: FormGroup<IFormFraudAndSecurity> = new FormGroup<IFormFraudAndSecurity>({
        documentFront: new FormControl('', { validators: [Validators.required] }),
        documentBack: new FormControl('', { validators: [Validators.required] }),
        documentSelfie: new FormControl('', { validators: [Validators.required] }),
    });

    public genderList: Array<DefaultListValues> = [
        {
            text: "completeYourRegistration.male",
            code: "m"
        },
        {
            text: "completeYourRegistration.female",
            code: "f"
        },
        {
            text: "completeYourRegistration.notPrefer",
            code: "none"
        }
    ];
    public marritalStatus: Array<DefaultListValues> = [
        {
            text: "completeYourRegistration.widowed",
            code: "widowed"
        },
        {
            text: "completeYourRegistration.divorced",
            code: "divorced"
        },
        {
            text: "completeYourRegistration.married",
            code: "married"
        },
        {
            text: "completeYourRegistration.single",
            code: "single"
        },
        {
            text: "completeYourRegistration.separate",
            code: "separate"
        },
        {
            text: "completeYourRegistration.commonMarriage",
            code: "common_marriage"
        }
    ];

    public investorProfiling: Array<DefaultListValues> = [
        {
            text: 'completeYourRegistration.qualified',
            code: 'qualified',
            selected: false
        },
        {
            text: 'completeYourRegistration.hugeInvestments',
            code: 'huge_investments',
            selected: false
        },
        {
            text: 'completeYourRegistration.crowdfundingInvestmentsLessThanMaximum',
            code: 'crowdfunding_investments_less_than_maximum',
            selected: false
        },
    ];

    constructor(
        public hoverIconClassService: HoverIconClassService,
        private readonly nationalityService: NationalityService,
        private readonly cepService: CepService,
        private readonly accountService: AccountService,
        private readonly customSnackbarComponent: CustomSnackbarComponent,
        private readonly translationConstants: TranslationConstants,
        private readonly fileService: FileService,
        private readonly dialog: MatDialog,
        private readonly router: Router

    ) {
        this.nationalityList = this.nationalityService.getAllNationality();
        this.filteredNationalityList = [...this.nationalityList];
        this.employmentOriginalList = this.translationConstants.translateList('employmentTypeList');
        this.employmentTypeList = this.translationConstants.translateList('employmentTypeList');

        this.employmentOriginalList = this.employmentOriginalList.sort();
        this.employmentTypeList = this.employmentTypeList.sort();
        this.formValueChanges();
    }

    public ngOnInit(): void {
        this.usefulSettings = {
            fiatCurrency: this.accountService.getFiatCurrency(),
        }
    }

    public ngAfterViewInit(): void {
        this.stepper.selectionChange.subscribe(stepper => {
            this.currentStepperIndex = stepper.selectedIndex;
            this.lastCurrentStepperIndex = this.currentStepperIndex === this.stepper.steps.length - 1;
            const matStepLength: number = this.stepper.steps.length;
            this.progressBarWidth = (stepper.selectedIndex * 100) / (matStepLength - 1);
        });
    }

    public formValueChanges(): void {
        this.identificationForm.controls.country.valueChanges.subscribe(value => {
            this.searchNationality((value as string));
        });

        this.identificationForm.controls.employmentType.valueChanges.subscribe(value => {
            this.onEmploymentKey((value as string));
        });
    }

    public translateHeaderText(): { title: string, subtitle: string } {
        if (this.currentStepperIndex === 0) {
            return {
                title: 'completeYourRegistration.identification',
                subtitle: 'completeYourRegistration.aboutYou'
            }
        } else if (this.currentStepperIndex === 1) {
            return {
                title: 'completeYourRegistration.declaration',
                subtitle: 'completeYourRegistration.resolutionICVM'
            }
        } else if (this.currentStepperIndex === 2) {
            return {
                title: 'completeYourRegistration.residentialData',
                subtitle: 'completeYourRegistration.importantResidencialData'
            }
        } else if (this.currentStepperIndex === 3) {
            return {
                title: 'completeYourRegistration.patrimonialData',
                subtitle: 'completeYourRegistration.idealInvestment'
            }
        } else if (this.currentStepperIndex === 4) {
            return {
                title: 'completeYourRegistration.investorProfiling',
                subtitle: 'completeYourRegistration.resolutionICVM'
            }
        } else if (this.currentStepperIndex === 5) {
            return {
                title: 'completeYourRegistration.fraudAndSecurity',
                subtitle: 'completeYourRegistration.mandatoryPhotos'
            }
        } else {
            return {
                title: '',
                subtitle: ''
            }
        }
    }

    public advanceButton(): void {
        if (this.currentStepperIndex === 2 && this.addressForm.valid) {
            this.loading = true;
            this.accountService.createAddress({
                userId: undefined,
                street_address: this.addressForm.value.publicPlace + ' ' + this.addressForm.value.number + ' ' + this.addressForm.value.neighborhood,
                city: this.addressForm.value.city as string,
                state: this.addressForm.value.state as string,
                country: this.addressForm.value.country as string,
                postal_code: this.addressForm.value.cep as string,
                isDefault: false
            }).subscribe({
                next: (res) => {
                    if (res) {
                        this.nextStepper();
                    }
                },
                error: (err) => {
                    if (err) {
                        this.customSnackbarComponent.open(this.translationConstants.translate('snackbar.error'), SnackBarTheme.error, 4000);
                    }
                }
            }).add(() => {
                this.loading = false;
            });
        }

        if ((this.currentStepperIndex !== 2 && this.currentStepperIndex !== 4) && !this.lastCurrentStepperIndex) {
            this.nextStepper();
        }

        if (this.currentStepperIndex >= 0 && this.identificationForm.value.country) {
            this.mountCountryAddressForm();
        }

        if (this.currentStepperIndex === 4 && this.investorProfilingForm.valid) {
            this.saveAdditional();
        }

        if (this.lastCurrentStepperIndex) {
            this.finishStep();
        }
    }

    public nextStepper(): void {
        this.stepper.next();
    }

    public previousStepper(): void {
        this.stepper.previous();
    }

    public showError(formName: string, form: FormGroup): boolean {
        return showErrorForInputs(formName, form);
    }

    public onEmploymentSelected(option: string): void {
        this.identificationForm.get('employmentType')?.setValue(this.capitalizeFirstLetter(option));
    }

    public capitalizeFirstLetter(string: string): string {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    public onEmploymentKey(value: string): void {
        this.searchResults['employmentType'] = true;
        clearTimeout(this.searchTime);

        this.searchTime = setTimeout(() => {
            this.employmentTypeList = this.searchEmploymentList(value);
            const controlEmploymentType = this.identificationForm.get('employmentType');
            const findEmployment: string | undefined = this.employmentTypeList.find(
                employment => this.capitalizeFirstLetter(employment) === value
            );

            if (!value && !findEmployment) {
                controlEmploymentType?.setErrors(null);
                controlEmploymentType?.setValue(null, { emitEvent: false });
            } else if (findEmployment) {
                const capitalized = this.capitalizeFirstLetter(findEmployment);
                if (controlEmploymentType?.value !== capitalized) {
                    controlEmploymentType?.setValue(capitalized, { emitEvent: false });
                }
                controlEmploymentType?.setErrors(null);
            } else {
                controlEmploymentType?.setErrors({ incorrectEmployment: true });
            }
            this.searchResults['employmentType'] = false;
        }, 200);
    }

    public searchEmploymentList(value: string): Array<string> {
        if (!value) {
            return this.employmentOriginalList;
        }

        let filter: string = value?.toLocaleLowerCase();
        return this.employmentOriginalList.filter(option => removeAccents(option)?.toLocaleLowerCase()?.includes(removeAccents(filter)?.toLocaleLowerCase()));
    }

    public onSelectNationality(value: string): void {
        const nationality = this.nationalityList.find(nat => nat.name === value);
        this.identificationForm.controls['country'].setValue(nationality?.name || '');
    }

    public searchNationality(value: string): void {
        this.searchResults['country'] = true;
        clearTimeout(this.searchTime);

        this.searchTime = setTimeout(() => {
            const controlCountry = this.identificationForm.get('country');
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

            this.searchResults['country'] = false;
        }, 200);
    }

    public disabledContinueButton(): boolean {
        const isSearchResults: boolean = Object.values(this.searchResults).some(status => status === true);
        if (this.currentStepperIndex === 0) {
            if (!this.identificationForm.valid) {
                return true;
            }
        }

        if (this.currentStepperIndex === 1) {
            if (!this.declarationForm.valid) {
                return true;
            }
        }

        if (this.currentStepperIndex === 2) {
            if (!this.addressForm.valid) {
                return true;
            }
        }

        if (this.currentStepperIndex === 3) {
            if (!this.investmentForm.valid) {
                return true;
            }
        }

        if (this.currentStepperIndex === 4) {
            if (!this.investorProfilingForm.valid) {
                return true;
            }
        }

        if (this.currentStepperIndex === 5) {
            if (!this.fraudAndSecurityForm.valid) {
                return true;
            }
        }

        return isSearchResults || false;
    }

    public clearDeclarationFormBoxes(noAlternativeBox: boolean = false): void {
        if (noAlternativeBox) {
            this.declarationForm.patchValue({
                vinculatedToCompany: null,
                usPerson: null,
                pep: null
            });
        } else {
            this.declarationForm.patchValue({
                noAlternative: null
            });
        }
    }

    public getCompanyName(): string {
        return environment.companyName;
    }

    public findCep(zipcode: string | undefined): void {
        clearTimeout(this.searchTime);
        this.searchTime = setTimeout(() => {
            let fieldName: AbstractControl = this.addressForm?.controls?.['cep'];
            fieldName?.setErrors(null); // Remove the erros for a new validation.
            // Regex for Brazilian ZIP code in 00000-000 format.
            // However, since we will not be using an input mask, we remove the hyphen.
            // From /^[0-9]{5}-[0-9]{3}$/ to /^[0-9]{5}[0-9]{3}$/
            const cepPattern = /^[0-9]{5}[0-9]{3}$/;
            if (
                this.identificationForm?.value?.country?.toLowerCase() === String('brazil').toLowerCase() &&
                zipcode &&
                cepPattern.test(zipcode)
            ) {
                this.loading = true;
                this.clearFormAdress();
                this.markAddressFormUntouchedAndPristine();

                this.cepService.findCep(zipcode).subscribe({
                    next: (response: ICep) => {
                        if (response) {
                            this.mountAddressForm(response);
                        }
                    },
                    error: () => {
                        fieldName?.setErrors({ responseZipcodeError: true });
                        this.clearFormAdress();
                    },
                    complete: () => {
                        this.loading = false;
                    }
                });
            }
        }, 500);
    }

    public mountAddressForm(res: ICep): void {
        this.addressForm.patchValue({
            publicPlace: res.logradouro,
            neighborhood: res.bairro,
            state: res.uf,
            city: res.localidade
        });
    }

    public mountCountryAddressForm(): void {
        this.addressForm.patchValue({
            country: this.identificationForm?.value?.country ?? null
        });
    }

    public clearFormAdress(): void {
        this.addressForm.patchValue({
            publicPlace: '',
            neighborhood: '',
            number: '',
            city: '',
            state: '',
            complement: '',
        });
    }

    public markAddressFormUntouchedAndPristine(): void {
        this.addressForm?.controls?.['publicPlace']?.markAsUntouched();
        this.addressForm?.controls?.['publicPlace']?.markAsPristine();
        this.addressForm?.controls?.['neighborhood']?.markAsUntouched();
        this.addressForm?.controls?.['neighborhood']?.markAsPristine();
        this.addressForm?.controls?.['number']?.markAsUntouched();
        this.addressForm?.controls?.['number']?.markAsPristine();
        this.addressForm?.controls?.['city']?.markAsUntouched();
        this.addressForm?.controls?.['city']?.markAsPristine();
        this.addressForm?.controls?.['state']?.markAsUntouched();
        this.addressForm?.controls?.['state']?.markAsPristine();
        this.addressForm?.controls?.['complement']?.markAsUntouched();
        this.addressForm?.controls?.['complement']?.markAsPristine();
    }

    public clearNumber(): void {
        this.addressForm.patchValue({ number: '' });
    }

    public isEmpty(): void {
        if (this.addressForm.value.number === '') {
            this.addressForm.patchValue({ noNumber: true });
        }
    }

    public onProfilingCheckboxChange(event: MatCheckboxChange, item: DefaultListValues): void {
        if (event?.checked) {
            this.investorProfiling.forEach(element => {
                if (element?.text === item?.text) {
                    element.selected = true;
                    switch (element?.code) {
                        case 'qualified':
                            this.investorProfilingForm.get('qualified')?.setValue(true);
                            break;
                        case 'huge_investments':
                            this.investorProfilingForm.get('hugeInvestments')?.setValue(true);
                            break;
                        case 'crowdfunding_investments_less_than_maximum':
                            this.investorProfilingForm.get('crowdfundingInvestmentsLessThanMaximum')?.setValue(true);
                            break;
                        default:
                            break;
                    }
                } else {
                    element.selected = false;
                    switch (element?.code) {
                        case 'qualified':
                            this.investorProfilingForm.get('qualified')?.setValue(null);
                            break;
                        case 'huge_investments':
                            this.investorProfilingForm.get('hugeInvestments')?.setValue(null);
                            break;
                        case 'crowdfunding_investments_less_than_maximum':
                            this.investorProfilingForm.get('crowdfundingInvestmentsLessThanMaximum')?.setValue(null);
                            break;
                        default:
                            break;
                    }
                }
            });
        } else {
            this.investorProfilingForm.get('qualified')?.setValue(null);
            this.investorProfilingForm.get('hugeInvestments')?.setValue(null);
            this.investorProfilingForm.get('crowdfundingInvestmentsLessThanMaximum')?.setValue(null);
        }

        this.investorProfilingForm.get('qualified')?.updateValueAndValidity();
        this.investorProfilingForm.get('hugeInvestments')?.updateValueAndValidity();
        this.investorProfilingForm.get('crowdfundingInvestmentsLessThanMaximum')?.updateValueAndValidity();
    }

    public getFileTypes(): string {
        return getFileTypesForHtml();
    }

    public acceptDocumentType(documentType: string): boolean {
        return FILE_TYPES_TO_UPLOAD.includes(documentType);
    }

    public addNewFile(event: Event, document_type: string): void {
        const input: HTMLInputElement = event.target as HTMLInputElement;
        if (input.files?.length) {
            this.mapDocuments(input.files, document_type);
        }
    }

    // Check type of "documents"
    public mapDocuments(files: FileList, document_type: string): void {
        this.loadingDocuments = true;
        for (let i = 0; i < files.length; i++) {
            this.filesSize = files[i].size;
            const file: File = files[i];
            const documentType: string = file.type;
            this.filesSizeErrorForDocument = this.filesSize > this.maxSize; // in MB
            this.documentTypeError = !this.acceptDocumentType(documentType);

            // It should not proceed if there is an error with the size or type of document
            if (this.filesSizeErrorForDocument || this.documentTypeError) {
                this.loadingDocuments = false;

                if (this.filesSizeErrorForDocument) {
                    const maxSizeInMB: number = Math.round(this.maxSize / 1_000_000);
                    this.customSnackbarComponent.open(`${this.translationConstants.translate('fileSize.error')} ${maxSizeInMB} MB.`, SnackBarTheme.error, 4000);
                }

                if (document_type === 'documentFront') {
                    this.fraudAndSecurityForm.patchValue({
                        documentFront: ''
                    });
                }

                if (document_type === 'documentBack') {
                    this.fraudAndSecurityForm.patchValue({
                        documentBack: ''
                    });
                }

                if (document_type === 'documentSelfie') {
                    this.fraudAndSecurityForm.patchValue({
                        documentSelfie: ''
                    });
                }

                return;
            }

            const reader: FileReader = new FileReader();
            const normFileName: string = this.fileService.normalizeFileName(file.name);
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                this.fileService.uploadFile({
                    file: (event.target)?.result as string,
                    name: normFileName,
                    confidentiality: FileStorageConfidentiality.SECURED,
                    documentType: FileStorageDocumentType.PERSONAL_DOCUMENT
                }).subscribe((data: { value: string }) => {

                    if (document_type === 'documentFront') {
                        this.fraudAndSecurityForm.patchValue({
                            documentFront: data?.value
                        });
                    }

                    if (document_type === 'documentBack') {
                        this.fraudAndSecurityForm.patchValue({
                            documentBack: data?.value
                        });
                    }

                    if (document_type === 'documentSelfie') {
                        this.fraudAndSecurityForm.patchValue({
                            documentSelfie: data?.value
                        });
                    }
                }, error => {
                    this.customSnackbarComponent.open(this.translationConstants.translate('default.docUploadError'), SnackBarTheme.error, 4000);
                }).add(() => {
                    this.loadingDocuments = false;
                });
            };
        }
    }

    public saveAdditional(): void {
        const data: IUserAdditionalInformation = {
            gender: this.identificationForm?.value?.gender as string,
            employment_type: this.identificationForm?.value?.employmentType as string,
            marrital_status: this.identificationForm?.value?.marritalStatus as string,
            country_origin: this.identificationForm?.value?.country as string,
            vinculated_to_company: this.declarationForm?.value?.vinculatedToCompany as boolean,
            us_person: this.declarationForm?.value?.usPerson as boolean,
            pep: this.declarationForm?.value?.pep as boolean,
            monthly_income: Number(this.investmentForm?.value?.monthlyIncome),
            real_actives: Number(this.investmentForm?.value?.realActives),
            financial_applications: Number(this.investmentForm?.value?.financialApplications),
            real_estate: Number(this.investmentForm?.value?.realEstate),
            movable_properties: Number(this.investmentForm?.value?.movableProperties),
            others: Number(this.investmentForm?.value?.others),
            qualified: this.investorProfilingForm?.value?.qualified as boolean,
            huge_investments: this.investorProfilingForm?.value?.hugeInvestments as boolean,
            crowdfunding_invesments_less_than_maximum: this.investorProfilingForm?.value?.crowdfundingInvestmentsLessThanMaximum as boolean,
            when: new Date(),
        }

        this.loading = true;
        this.accountService.createAdditionalInformation(data).subscribe((res) => {
            if (res) {
                this.nextStepper();
            }
        }, error => {
            if (error) {
                this.customSnackbarComponent.open(this.translationConstants.translate('snackbar.error'), SnackBarTheme.error, 4000);
            }
        }).add(() => {
            this.loading = false;
        });
    }

    public openSimpleModal(): void {
        const dialogRef: MatDialogRef<SimpleModalComponent> = this.dialog.open(SimpleModalComponent, {
            data: {
                title: 'completeYourRegistration.success.title',
                subtitle: 'completeYourRegistration.success.subtitle',
                icon: 'assets/images/check-container.svg',
                autoClosingTime: 8000
            }
        });

        dialogRef.afterClosed().subscribe((action: boolean) => {
            this.loading = true;
            this.router.navigate(['/crowdfunding']);
        });
    }

    public finishStep(): void {
        this.loading = true;
        const genericDocuments: IUserGenericDocuments[] = [];

        genericDocuments.push({
            id: uuid4(),
            created_at: new Date(),
            last_update: new Date(),
            document_description: 'COMPLETE_DOCUMENT_FRONT',
            document_url: this.fraudAndSecurityForm.value.documentFront as string,
            user_id: undefined
        });

        genericDocuments.push({
            id: uuid4(),
            created_at: new Date(),
            last_update: new Date(),
            document_description: 'COMPLETE_DOCUMENT_BACK',
            document_url: this.fraudAndSecurityForm.value.documentBack as string,
            user_id: undefined
        });

        genericDocuments.push({
            id: uuid4(),
            created_at: new Date(),
            last_update: new Date(),
            document_description: 'COMPLETE_DOCUMENT_SELFIE',
            document_url: this.fraudAndSecurityForm.value.documentSelfie as string,
            user_id: undefined
        });

        this.accountService.uploadGenericDocuments(genericDocuments).subscribe((res) => {
            if (res) {
                this.openSimpleModal();
            }
        }, error => {
            this.customSnackbarComponent.open(this.translationConstants.translate(`snackbar.error`), SnackBarTheme.error, 4000);
        }).add(() => {
            this.loading = false;
        });
    }
}

interface IFormIdentification {
    gender: FormControl<string | null>;
    employmentType: FormControl<string | null>;
    marritalStatus: FormControl<string | null>;
    country: FormControl<string | null>;
}

interface IFormDeclaration {
    vinculatedToCompany: FormControl<boolean | null>;
    usPerson: FormControl<boolean | null>;
    pep: FormControl<boolean | null>;
    noAlternative: FormControl<boolean | null>;
}

interface IFormAddress {
    country: FormControl<string | null>;
    cep: FormControl<string | null>;
    publicPlace: FormControl<string | null>; // Street, avenue...
    number: FormControl<string | null>;
    noNumber: FormControl<boolean | null>;
    complement: FormControl<string | null>;
    neighborhood: FormControl<string | null>;
    city: FormControl<string | null>;
    state: FormControl<string | null>;
}

interface IFormInvestment {
    monthlyIncome: FormControl<string | null>;
    realEstate: FormControl<string | null>;
    realActives: FormControl<string | null>;
    financialApplications: FormControl<string | null>;
    movableProperties: FormControl<string | null>;
    others: FormControl<string | null>;
}

interface IFormProfiling {
    qualified: FormControl<boolean | null>;
    hugeInvestments: FormControl<boolean | null>;
    crowdfundingInvestmentsLessThanMaximum: FormControl<boolean | null>;
}

interface IFormFraudAndSecurity {
    documentFront: FormControl<string | null>;
    documentBack: FormControl<string | null>;
    documentSelfie: FormControl<string | null>;
}

class DefaultListValues {
    public text?: string;
    public code?: string;
    public selected?: boolean;
}