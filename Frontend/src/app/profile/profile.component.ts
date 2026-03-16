import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { completeFullNameValidator } from '../shared/validators/fullname.validator';
import { formInputTouched, showErrorForInputs } from '../shared/validators/form-group.validators';
import { fadeIn } from '../shared/services/util/animations.service';
import { FileService } from '../shared/services/file/file.service';
import { AccountService } from '../shared/services/account/account.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PasswordModalComponent } from '../shared/modals/password-modal/password-modal.component';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MenuButtonMobileComponent } from '../shared/components/menu-button-mobile/menu-button-mobile.component';
import { IUserGenericDocuments, UserLoggedModel, UserStatus } from '../shared/models/user.logged.model';
import { BankingAccount } from '../shared/models/banking-account';
import { TranslationConstants } from '../shared/services/util/translation.service';
import { CustomSnackbarComponent, SnackBarTheme } from '../shared/custom-snackbar/custom-snackbar.component';
import { ImageService } from '../shared/services/util/image.service';
import { Image } from '../shared/models/image.model';
import { MfaConfigModalComponent } from '../shared/modals/mfa-config-modal/mfa-config-modal.component';
import { ScreenInitOptions } from '../shared/models/scree-init-options.model';
import { ErrorPageComponent } from '../shared/components/error-page/error-page.component';
import { Subscription } from 'rxjs';
import { AppService } from '../app.service';
import { RemoveAccountModalComponent } from '../shared/modals/remove-account-modal/remove-account-modal.component';
import { FILE_TYPES_TO_UPLOAD } from '../constants/file-types-accepted.constants';
import { FileStorageConfidentiality, FileStorageDocumentType } from '../shared/models/file.model';
import { v4 as uuid4 } from 'uuid';
import { PERSONAL_DOCUMENTS_FILTER } from '../shared/models/IUserDocuments';

@Component({
    selector: 'app-profile',
    imports: [
        CommonModule,
        SharedModule,
        MenuButtonMobileComponent,
        ErrorPageComponent
    ],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.scss',
    animations: [fadeIn]
})
export class ProfileComponent implements OnInit {

    @ViewChild('avatarInput') public avatarInput!: ElementRef<HTMLInputElement>;
    public loadImage: boolean = true;
    public isHovered: boolean = false;
    public avatarUrl: string | null = '';
    public loading: boolean = true;
    public loadingRequest: boolean = false;
    public editMode: boolean = false;
    public userDetails: UserLoggedModel = Object() as UserLoggedModel;
    public bankingAccount: BankingAccount = Object() as BankingAccount;
    public publicWallet: string = "";
    public verifyMFAStatus: boolean = false;
    public formProfile: FormGroup<IFormProfile> = new FormGroup<IFormProfile>({
        fullName: new FormControl('', { validators: [Validators.required, completeFullNameValidator()] }),
        userName: new FormControl('', { validators: [Validators.required] }),
        email: new FormControl(''),
        phoneNumber: new FormControl('', { validators: [Validators.required] }),
        indication: new FormControl(''),
        nickname: new FormControl(''),
        document: new FormControl(''),
        id: new FormControl(''),
        dateOfBirth: new FormControl(''),
    });
    public withdrawalMfa: boolean = false;
    public showErrorPage: boolean = false;
    public isMobileSubscription!: Subscription;
    public isMobile: boolean = false;
    public loadingDocuments: boolean = false;
    public filesSize: number = 0;
    public maxSize = 10000000; // 10MB
    public documentTypeError: boolean = false;
    public filesSizeErrorForDocument: boolean = false;
    public userDocuments: IUserGenericDocuments[] = [];
    public documentFront: string = '';
    public documentBack: string = '';
    public documentSelfie: string = '';

    constructor(
        private readonly fileService: FileService,
        private readonly accountService: AccountService,
        private readonly dialog: MatDialog,
        private readonly router: Router,
        private readonly translationConstants: TranslationConstants,
        private readonly customSnackbar: CustomSnackbarComponent,
        private readonly imageService: ImageService,
        private readonly activatedRoute: ActivatedRoute,
        private readonly appService: AppService
    ) {
        this.isMobileSubscription = this.appService.getIsMobile().subscribe(isMobile => {
            this.isMobile = isMobile;
        });
    }

    public ngOnInit(): void {
        this.getExtractedUrlParams();
        this.disableForm();
        this.loadUserData({ initialLoading: true });
        this.loadUserDocuments();
    }

    public ngOnDestroy(): void {
        this.isMobileSubscription.unsubscribe();
    }

    public getExtractedUrlParams(): void {
        this.activatedRoute.queryParams.subscribe((param: Params) => {
            this.withdrawalMfa = param['withdrawMfa'] === 'true';
        });
    }

    public loadUserData(screenInitOptions: ScreenInitOptions): void {
        const isInitialLoading: boolean = screenInitOptions.initialLoading || false;

        if (isInitialLoading) {
            this.loading = true;
        } else {
            this.loadingRequest = true;
        }

        this.accountService.getLoggedUserDetails().subscribe(user => {
            this.userDetails = user;
            this.publicWallet = user?.walletPublicData as string;
            this.bankingAccount = user?.bankingAccount as BankingAccount;
        }, error => {
            this.showErrorPage = true;
        }).add(() => {
            this.mountProfileForm();
        });

        this.accountService.verifyMFAStatus().subscribe(enabled => {
            if (enabled?.status) {
                this.verifyMFAStatus = true;
            }

        }, error => {
            if (error) {
                this.showErrorPage = true;
            }
        }).add(() => {
            this.loading = false;
            this.loadingRequest = false;

            if (this.withdrawalMfa && !this.loading) {
                this.openMfaConfigModal();
            }
        });
    }

    public updateProfile(): void {
        let userName: string = this.formProfile.value.userName || '';
        if (userName[0] !== '@' && userName) {
            userName = '@' + userName;
        }

        let userNameValidated: boolean = false;

        if (userName !== this.userDetails.externalSourceId) {
            this.loadingRequest = true;
            this.accountService.validateUsername(userName).subscribe(documentFound => {
                if (documentFound["value"]) {
                    this.customSnackbar.open(this.translationConstants.translate('account.signUp.error.existingUsername'), SnackBarTheme.error, 8000);
                } else {
                    userNameValidated = true;
                }

            }, error => {
                userNameValidated = false;
                this.customSnackbar.open(this.translationConstants.translate('personalInfoModal.snackbar.updateError'), SnackBarTheme.error, 3000);
            }).add(() => {
                this.loadingRequest = false;
                if (userNameValidated) {
                    this.updateData(userName);
                }
            });
        } else {
            this.updateData(userName);
        }
    }

    public updateData(userName: string): void {
        this.loadingRequest = true;
        this.accountService.updateBasicInfos(
            this.formProfile?.value.fullName as string,
            this.formProfile?.value.nickname as string,
            this.formProfile?.value.phoneNumber as string,
            undefined,
            userName as string,
            this.avatarUrl as string,
            (this.formProfile.value.dateOfBirth as Date) ?? null,
            undefined,
            undefined
        ).subscribe(() => {
            this.customSnackbar.open(this.translationConstants.translate('personalInfoModal.snackbar.updateSuccess'), SnackBarTheme.success, 3000);
            this.removeUrlParams();
        }, error => {
            this.customSnackbar.open(this.translationConstants.translate('personalInfoModal.snackbar.updateError'), SnackBarTheme.error, 3000);
        }).add(() => {
            this.loadingRequest = false;
            this.editMode = false;
            this.disableForm();
            this.loadUserData({ initialLoading: false });
        });
    }

    public removeUrlParams(): void {
        this.router.navigate([], {
            relativeTo: this.activatedRoute,
            queryParams: {},
            replaceUrl: true
        });
    }

    public mountProfileForm(): void {
        this.formProfile.patchValue({
            fullName: this.userDetails.name,
            phoneNumber: this.userDetails.phone,
            indication: this.userDetails.externalSourceIndication,
            document: this.userDetails.cpf,
            email: this.userDetails.email,
            userName: this.userDetails.externalSourceId,
            nickname: this.userDetails.nickname,
            id: this.userDetails.id,
            dateOfBirth: this.userDetails.dateOfBirth
        });

        this.avatarUrl = this.userDetails?.selfieImage as string;
    }

    public dateFilter = (date: Date | null): boolean => {
        const today: Date = new Date();
        today.setHours(0, 0, 0, 0);
        return date ? date <= today : false;
    }

    public showError(formName: string, form: FormGroup): boolean {
        return showErrorForInputs(formName, form);
    }

    public formInputTouched(formName: string, form: FormGroup): boolean {
        return formInputTouched(formName, form)
    }

    public disableForm(): void {
        this.formProfile.disable();
    }

    private enableForm(): void {
        const nonEditableFields: (keyof IFormProfile)[] = ['indication', 'document', 'email', 'id'];
        (Object.keys(this.formProfile.controls) as (keyof IFormProfile)[]).forEach((controlName) => {
            if (nonEditableFields.includes(controlName)) {
                this.formProfile.controls[controlName].disable();
            } else {
                this.formProfile.controls[controlName].enable();
            }
        });
    }

    public editProfile(): void {
        this.editMode = true;

        if (this.editMode) {
            this.enableForm();
        }
    }

    public cancelEdit(): void {
        this.editMode = false;
        this.disableForm();
        this.mountProfileForm(); // To return the user current data.
    }

    public async inputImg(event: Event): Promise<void> {
        const input: HTMLInputElement = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) {
            return;
        }

        const file: File = input.files[0];
        const validation: boolean = this.fileService.validateFile(file, false, true);

        if (!validation) {
            this.customSnackbar.open(this.translationConstants.translate('snackbar.error'), SnackBarTheme.error, 4000);
            return;
        }

        this.loadImage = false;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64String: string = reader.result as string;

            const imagePayload: Image = {
                name: `Image${crypto.randomUUID()}`,
                image: base64String,
            };

            this.imageService.uploadImage(imagePayload).subscribe(resp => {
                // WIll only upload the image to backend. It will not change the image in the user's data.
                // With the response, we will get the new image url.
                this.avatarUrl = resp?.value;
            }, (err) => {
                this.customSnackbar.open(this.translationConstants.translate('personalInfoModal.snackbar.avatarError'), SnackBarTheme.error, 4000);
            }).add(() => {
                this.loadImage = true;
            });
        };

        reader.onerror = (error) => {
            if (error) {
                this.loadImage = true;
                this.customSnackbar.open(this.translationConstants.translate('snackbar.error'), SnackBarTheme.error, 4000);
            }
        };
    }

    public openPasswordModal(): void {
        const dialogRef: MatDialogRef<PasswordModalComponent> = this.dialog.open(PasswordModalComponent, {});
    }


    public openRemoveAccountModal(): void {
        const dialogRef: MatDialogRef<RemoveAccountModalComponent> = this.dialog.open(RemoveAccountModalComponent, {});
    }

    public goToWallet(): void {
        this.router.navigate(['/wallet']);
    }

    public selfieNotChanged(): boolean {
        return this.userDetails?.selfieImage === this.avatarUrl;
    }

    public openMfaConfigModal(): void {
        if (!this.verifyMFAStatus) {
            const dialogRef: MatDialogRef<MfaConfigModalComponent> = this.dialog.open(MfaConfigModalComponent, {});

            dialogRef.afterClosed().subscribe((action: boolean) => {
                if (action) {
                    this.loadUserData({ initialLoading: false });
                }
            });
        }
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
                this.formProfile.get(controlName)?.setValue(date);
            }

        }
    }

    public loadUserDocuments(): void {
        this.accountService.getMyKYCDocuments(PERSONAL_DOCUMENTS_FILTER.KYC).subscribe((documents: any[]) => {
            // response shape from /getMyDocuments has "document_type" and "document_url"
            this.userDocuments = documents as IUserGenericDocuments[];

            documents.forEach((doc: any) => {
                if (doc.document_type === 'COMPLETE_DOCUMENT_FRONT') {
                    this.documentFront = doc.document_url;
                } else if (doc.document_type === 'COMPLETE_DOCUMENT_BACK') {
                    this.documentBack = doc.document_url;
                } else if (doc.document_type === 'COMPLETE_DOCUMENT_SELFIE') {
                    this.documentSelfie = doc.document_url;
                }
            });
        }, error => {
            // If documents don't exist yet, that's okay
            console.log('No documents found or error loading documents', error);
        });
    }

    public getFileTypes(): string {
        return FILE_TYPES_TO_UPLOAD.join(', ');
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

    public mapDocuments(files: FileList, document_type: string): void {
        this.loadingDocuments = true;
        for (let i = 0; i < files.length; i++) {
            this.filesSize = files[i].size;
            const file: File = files[i];
            const documentType: string = file.type;
            this.filesSizeErrorForDocument = this.filesSize > this.maxSize;
            this.documentTypeError = !this.acceptDocumentType(documentType);

            if (this.filesSizeErrorForDocument || this.documentTypeError) {
                this.loadingDocuments = false;

                if (this.filesSizeErrorForDocument) {
                    const maxSizeInMB: number = Math.round(this.maxSize / 1_000_000);
                    this.customSnackbar.open(`${this.translationConstants.translate('fileSize.error')} ${maxSizeInMB} MB.`, SnackBarTheme.error, 4000);
                }

                if (document_type === 'documentFront') {
                    this.documentFront = '';
                }

                if (document_type === 'documentBack') {
                    this.documentBack = '';
                }

                if (document_type === 'documentSelfie') {
                    this.documentSelfie = '';
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
                        this.documentFront = data?.value;
                    }

                    if (document_type === 'documentBack') {
                        this.documentBack = data?.value;
                    }

                    if (document_type === 'documentSelfie') {
                        this.documentSelfie = data?.value;
                    }
                }, error => {
                    this.customSnackbar.open(this.translationConstants.translate('default.docUploadError'), SnackBarTheme.error, 4000);
                }).add(() => {
                    this.loadingDocuments = false;
                });
            };
        }
    }

    public updateDocuments(): void {
        if (!this.documentFront && !this.documentBack && !this.documentSelfie) {
            this.customSnackbar.open(this.translationConstants.translate('snackbar.error'), SnackBarTheme.error, 4000);
            return;
        }

        this.loadingRequest = true;
        const genericDocuments: IUserGenericDocuments[] = [];

        if (this.documentFront) {
            const existingDoc = this.userDocuments.find(doc => doc.document_description === 'COMPLETE_DOCUMENT_FRONT');
            genericDocuments.push({
                id: existingDoc?.id || uuid4(),
                created_at: existingDoc?.created_at || new Date(),
                last_update: new Date(),
                document_description: 'COMPLETE_DOCUMENT_FRONT',
                document_url: this.documentFront,
                user_id: undefined
            });
        }

        if (this.documentBack) {
            const existingDoc = this.userDocuments.find(doc => doc.document_description === 'COMPLETE_DOCUMENT_BACK');
            genericDocuments.push({
                id: existingDoc?.id || uuid4(),
                created_at: existingDoc?.created_at || new Date(),
                last_update: new Date(),
                document_description: 'COMPLETE_DOCUMENT_BACK',
                document_url: this.documentBack,
                user_id: undefined
            });
        }

        if (this.documentSelfie) {
            const existingDoc = this.userDocuments.find(doc => doc.document_description === 'COMPLETE_DOCUMENT_SELFIE');
            genericDocuments.push({
                id: existingDoc?.id || uuid4(),
                created_at: existingDoc?.created_at || new Date(),
                last_update: new Date(),
                document_description: 'COMPLETE_DOCUMENT_SELFIE',
                document_url: this.documentSelfie,
                user_id: undefined
            });
        }

        this.accountService.uploadGenericDocuments(genericDocuments).subscribe((res) => {
            if (res) {
                this.customSnackbar.open(this.translationConstants.translate('personalInfoModal.snackbar.updateSuccess'), SnackBarTheme.success, 3000);
                this.loadUserDocuments();
            }
        }, error => {
            this.customSnackbar.open(this.translationConstants.translate('snackbar.error'), SnackBarTheme.error, 4000);
        }).add(() => {
            this.loadingRequest = false;
        });
    }

    public isKycApproved(): boolean {
        return this.userDetails?.status === UserStatus.APPROVED;
    }
}

interface IFormProfile {
    fullName: FormControl<string | null>;
    userName: FormControl<string | null>;
    nickname: FormControl<string | null>;
    id: FormControl<string | null>;
    email: FormControl<string | null>;
    phoneNumber: FormControl<string | null>;
    indication: FormControl<string | null>;
    document: FormControl<string | null>;
    dateOfBirth: FormControl<Date | string | null>
}