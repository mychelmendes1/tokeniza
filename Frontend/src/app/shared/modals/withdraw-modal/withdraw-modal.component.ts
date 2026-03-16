import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { usefulSettings } from '../../models/useful-settings.model';
import { AccountService } from '../../services/account/account.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { completeFullNameValidator } from '../../validators/fullname.validator';
import { formInputTouched, showErrorForInputs } from '../../validators/form-group.validators';
import { SharedModule } from '../../shared.module';
import { Router, RouterModule } from '@angular/router';
import { MatSelectChange } from '@angular/material/select';
import { CpfCnpjValidator } from '../../validators/cpf-cnpj.validator.function';
import { SimpleModalComponent } from '../simple-modal/simple-modal.component';
import { UserLoggedModel } from '../../models/user.logged.model';
import { combineLatest } from 'rxjs';
import { PlatformBalance } from '../../models/wallet.balance';
import { AmountConvertedResult } from '../../models/amount-converted-result';
import { WithdrawalIdentifier, WithdrawalModel, WithdrawalType } from '../../models/withdrawal.model';
import BigNumber from 'bignumber.js';
import { LocalStorageService } from 'angular-web-storage';
import { LocalStorageKeys } from '../../services/util/local.storage.keys';
import { DepositsService } from '../../services/account/deposits.service';
import { Banks } from '../../models/banks.model';
import { FeaturesStatusService } from '../../services/util/features-status.service';
import { FeatureNames } from '../../models/feature-names.enum';
import { BaaSAccountStatus, BankingAccount } from '../../models/banking-account';
import { environment } from '../../../../environments/environments';
import { CNPJ_LENGTH } from '../../../constants/documents.constants';
import { TranslationConstants } from '../../services/util/translation.service';
import { BankAccountType } from '../../models/IDigitalBankingConfigs';
import { CustomSnackbarComponent, SnackBarTheme } from '../../custom-snackbar/custom-snackbar.component';
import { BankingService } from '../../services/account/banking.services';
import { IAccountInfoLegalPersonResponse, IAccountInfoResponse } from '../../models/account.info.request';
import { TokensService } from '../../services/tokens/token.service';
import { Token } from '../../models/tokens';
import { TaxItemType } from '../../models/tax-item-type.enum';
import { WithdrawalRequestsFavorites } from '../../models/withdrawal-requests-favorites';
import { fadeIn } from '../../services/util/animations.service';

@Component({
    selector: 'app-withdraw-modal',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule,
    ],
    templateUrl: './withdraw-modal.component.html',
    styleUrl: './withdraw-modal.component.scss',
    animations: [fadeIn]
})
export class WithdrawModalComponent {

    @Output() public reloadBalance: EventEmitter<boolean> = new EventEmitter(false);
    public usefulSettings: usefulSettings = new usefulSettings();
    public formWithdraw: FormGroup<IFormWithdraw> = new FormGroup<IFormWithdraw>({
        fullName: new FormControl<string>('', { validators: [Validators.required, completeFullNameValidator()] }),
        bankAccountType: new FormControl<BankAccountType | null>(null, { validators: [Validators.required] }),
        document: new FormControl<string>('', { validators: [Validators.required, CpfCnpjValidator.validatorFn()] }),
        value: new FormControl<any>(undefined, { validators: [Validators.required] }),
        saveAccount: new FormControl<boolean>(false),
        accountCode: new FormControl<string>('', { validators: [Validators.required] }),
        digitCode: new FormControl<string>('', { validators: [Validators.required] }),
        branchCode: new FormControl<string>('', { validators: [Validators.required] }),
        pix: new FormControl<string>('', { validators: [Validators.required] }),
        institutionName: new FormControl<string>(''),
        institutionCode: new FormControl<any>(undefined, { validators: [Validators.required] }),
        institution: new FormControl<any>('', { validators: [Validators.required] }), // Used to can get the bank code and the bank ISPB
        forYourself: new FormControl<any>(undefined),
        institutionIspb: new FormControl<string>(''),
    });
    public loading: boolean = false;
    public fiat: string = '';
    public loggedUser: UserLoggedModel = new UserLoggedModel();
    public balances: PlatformBalance[] = [];
    public quotes: AmountConvertedResult[] = [];
    public request: WithdrawalModel = new WithdrawalModel();
    public unitOfMoney: string = '';
    public fiatQuotation: BigNumber = new BigNumber(0);
    public money: BigNumber = new BigNumber(0);
    public bankList: Array<Banks> = [];
    public filteredBankList: Array<Banks> = [];
    public bankingAccount: BankingAccount = Object() as BankingAccount;
    public isCompanyAccount: boolean = false;
    public accountTypeList: Array<BankAccountType> = [];
    public eBankAccountType: typeof BankAccountType = BankAccountType;
    public isInternalTransfer: boolean | undefined = undefined;
    public allowBranchEdit: boolean = true;
    public uniqueBranch: string = '';
    public hasAccountDigit: boolean = true;
    public searchTime!: ReturnType<typeof setTimeout>; // Used in filter
    public SEARCH_TIME_VALUE: number = 1000; // In milliseconds
    public requestAmount: string = '';
    public tokens: Token[] = [];
    public token: Token | undefined = undefined;
    public tax!: BigNumber;
    public total!: BigNumber;
    public requestAmountFiduciary: BigNumber = new BigNumber(0);
    public cpfCnpjMask: string | undefined = '';
    public insufficientBalance: boolean = false;
    public favorites: WithdrawalRequestsFavorites[] = [];
    public usedFavorite: boolean = false;

    constructor(
        public dialogRef: MatDialogRef<WithdrawModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { unitOfMoney: string },
        private readonly accountService: AccountService,
        private readonly dialog: MatDialog,
        private readonly router: Router,
        private readonly localStorage: LocalStorageService,
        private readonly depositsService: DepositsService,
        private readonly featuresStatusService: FeaturesStatusService,
        private readonly translationConstants: TranslationConstants,
        private readonly customSnackbarComponent: CustomSnackbarComponent,
        private readonly bankingService: BankingService,
        public readonly tokensService: TokensService,
    ) { }

    public ngOnInit(): void {
        this.dialogRef.disableClose = true;
        this.dialogRef.addPanelClass(['custom-modal', 'withdraw-modal']);

        this.usefulSettings = {
            fiatCurrency: this.accountService.getFiatCurrency()
        }
        this.initData();

        this.formWithdraw.get('value')?.valueChanges.subscribe((value) => {
            this.convertRequestAmount();
            this.insufficientBalance = value > this.money;
        });
    }

    public getUserWithdrawalFavorites(): void {
        this.loading = true;
        this.depositsService.getUserWithdrawalFavorites().subscribe(withdrawalFavorites => {
            if(withdrawalFavorites) {
                this.favorites = withdrawalFavorites;
            }

        });
    }

    public async initData(): Promise<void> {
        this.formWithdraw.disable();
        this.unitOfMoney = this.data.unitOfMoney ? this.data.unitOfMoney : await this.localStorage.get(LocalStorageKeys.UNIT_OF_MONEY);
        this.loading = true;
        this.tokensService.getTokens().subscribe(tokens => {
            this.tokens = tokens.filter(token => token.usedToPay);
            this.token = tokens.find(token => token.id === this.unitOfMoney);

        });
        this.depositsService.getListOfBanks().subscribe(banks => {
            this.bankList = banks;
            this.filteredBankList = this.bankList;
            this.featuresStatusService.getFeatureStatus(FeatureNames.WITHDRAWAL_HANDLING).subscribe(data => {
                if (!data) {
                    this.router.navigate(['/wallet']);
                }
            });
            this.getUserInfo();
            this.featuresStatusService.getFeatureStatus(FeatureNames.DIGITAL_BANKING).subscribe(data => {
                this.accountService.getLoggedUserDetails().subscribe(details => {
                    if (details.bankingAccount?.bankStatus === BaaSAccountStatus.ATIVO || details.bankingAccount?.bankStatus === 'confirmed') {
                        this.isCompanyAccount = details?.bankingAccount?.documentNumber?.length === CNPJ_LENGTH;
                        this.bankingAccount = details?.bankingAccount;

                        this.bankList.unshift(Object.assign({
                            name: this.translationConstants.translate('DIGITAL_BANKING') + ' ' + environment.companyName
                        }));
                    }
                });
            });
        }).add(() => {
            this.getUserWithdrawalFavorites();
            this.getUserMoney();
        });
    }

    public selectedFavorites(favorite: WithdrawalRequestsFavorites): void {
        let bank: Banks | undefined = this.bankList.find(bnk => bnk.name === favorite?.bank);

        if(!bank) {
            return;
        }

        this.changeBank(bank);

        let segregated: string[] = favorite?.account?.split(' ');

        if(!segregated || !segregated[0] || !segregated[1]) {
            return;
        }

        this.formWithdraw.patchValue({
            fullName: favorite?.name,
            institutionName: favorite?.bank,
            branchCode: favorite?.agency,
            bankAccountType: segregated[0] as any,
            forYourself: true,
            accountCode: segregated[1]?.slice(0, segregated[1]?.length - 1),
            digitCode: segregated[1][segregated[1]?.length - 1],
            document: favorite?.identifier,
            pix: favorite?.pix_key
        });

        this.request.requestId = undefined;
        this.request.amount = this.formWithdraw.value.value,
        this.request.tax = this.tax;
        this.request.name = this.formWithdraw.value.fullName as string;
        this.request.bank = this.formWithdraw.value.institutionName as string;
        this.request.agency = this.formWithdraw.value.branchCode as string,
        this.request.account = this.formWithdraw.value.bankAccountType + ' ' + this.formWithdraw.value.accountCode + this.formWithdraw.value.digitCode;
        this.request.identifier = this.formWithdraw.value.document as any;
        this.request.pix_key = this.formWithdraw.value.pix as string;
        this.request.createTemplate = this.formWithdraw.value.saveAccount as boolean;
        this.usedFavorite = true;

        this.updateCpfCnpjMask();
    }

    public getUserMoney(): void {
        this.fiat = this.usefulSettings.fiatCurrency.currency;
        this.accountService.isAuthenticated().subscribe(() => {
            this.accountService.getLoggedUserDetails().subscribe(user => {
                if (user) {
                    this.loggedUser = user;
                    combineLatest([
                        this.accountService.allQuotations(),
                        this.accountService.allBalances()
                    ]).subscribe(async ([quotation, balances]) => {
                        this.balances = balances;
                        this.request.unit_of_money = this.unitOfMoney;
                        this.quotes = quotation;

                        this.defineQuotation(this.quotes?.find(quote => quote.currency === this.unitOfMoney) as AmountConvertedResult, this.balances);
                    }).add(() => {
                        this.formWithdraw.enable();
                        this.loading = false;
                    });
                } else {
                    this.router.navigate(['/account/login'], { queryParams: { redirectUrl: '/wallet', withdrawal: true } });
                }
            });
        });
    }

    public getUserInfo(): void {
        if (!this.loggedUser?.bankingAccount) {
            return;
        }

        const userBank: Banks | undefined = this.bankList.find(
            bank => bank.code === this.loggedUser!.bankingAccount!.bankCode
        );

        this.loggedUser.bankingAccount.bankName = userBank?.name;

        if (userBank?.uniqueBranch) {
            this.uniqueBranch = userBank.uniqueBranch;
            this.allowBranchEdit = false;
        }
    }

    public defineQuotation(quote: AmountConvertedResult, balances: PlatformBalance[]): void {
        const balance: PlatformBalance | undefined = balances.find(blc => blc.unitOfMoney === this.request.unit_of_money);
        if (new BigNumber((balance?.fiatLock as any)).isGreaterThan(new BigNumber(0))) {
            /**
             * In this case the individual quotation will be considered to calculate the respective value
             */
            this.fiatQuotation = new BigNumber((balance?.fiatLock as any)).dividedBy(new BigNumber((balance?.balance as any))) || new BigNumber(0);
        } else {
            this.fiatQuotation = this.usefulSettings.fiatCurrency.currency === 'BRL' ? quote?.amount || new BigNumber(0) : quote?.amountUsd || new BigNumber(0);
        }
        this.money = new BigNumber((this.balances.find(blc => blc?.unitOfMoney === this.unitOfMoney) as any).balance || 0);
        this.request.unit_of_money = this.unitOfMoney;
        this.request.quote = this.fiatQuotation;
    }

    public getTotalAmountInFiduciary(): number {
        return new BigNumber(this.money).multipliedBy(this.fiatQuotation).toNumber();
    }

    public toNumber(value: BigNumber): number {
        return new BigNumber(value || 0).toNumber();
    }

    public close(dismiss: boolean = false): void {
        this.dialogRef.close(dismiss);
    }

    public showError(formName: string, form: FormGroup): boolean {
        return showErrorForInputs(formName, form);
    }

    public formInputTouched(formName: string, form: FormGroup): boolean {
        return formInputTouched(formName, form)
    }

    public searchBank(value: string): Banks[] {
        if (!value) {
            return this.filteredBankList;
        }

        let filter: string = value?.toLocaleLowerCase();
        return this.filteredBankList = this.bankList.filter(option => option?.name?.toLocaleLowerCase()?.includes(filter?.toLocaleLowerCase()) || option?.code?.toLocaleLowerCase()?.includes(filter?.toLocaleLowerCase()));
    }

    public onSelectChange(event: MatSelectChange): void {
        if (event) {
            this.formWithdraw.patchValue({
                document: null,
            });

            this.formWithdraw.controls.document.updateValueAndValidity();
        }
    }

    public confirm(): void {
        const dialogRef: MatDialogRef<SimpleModalComponent> = this.dialog.open(SimpleModalComponent, {
            data: {
                title: 'withdraw.modal.success.title',
                subtitle: 'withdraw.modal.success.subtitle',
                icon: 'assets/images/check-container.svg',
                autoClosingTime: 8000
            }
        });
    }

    public changeBank(institution: Banks): void {

        this.formWithdraw.patchValue({
            institution: institution
        });
        this.request.type = WithdrawalType.FIAT;

        if(!institution.code && !institution.ispb) {

            this.formWithdraw.patchValue({
                institutionIspb: institution?.ispb || '',
                institutionCode: this.bankingAccount.bankCode,
                institutionName: institution?.name,
                document: this.bankingAccount.documentNumber,
                fullName: this.loggedUser?.name,
                branchCode: this.bankingAccount?.branch,
                accountCode: ''
            });
            this.accountTypeList = [BankAccountType.CC];
            this.formWithdraw.patchValue({
                forYourself: true,
                accountCode: this.bankingAccount.account?.slice(0, -1),
                digitCode: this.bankingAccount.account?.length ? this.bankingAccount.account.slice(-1) : '',
                bankAccountType: BankAccountType.CC
            });
            this.request.type = WithdrawalType.INTERNAL_FIAT;
            this.isInternalTransfer = false;
        } else {

            this.formWithdraw.patchValue({
                institutionIspb: institution?.ispb || '',
                institutionCode: institution?.code,
                institutionName: institution?.name,
                accountCode: ''
            });
    
            if (this.formWithdraw.value.institution?.hasAccountDigit) {
                this.hasAccountDigit = true;
                this.formWithdraw.patchValue({
                    digitCode: ''
                });
            } else {
                this.hasAccountDigit = false;
                this.formWithdraw.patchValue({
                    digitCode: '0'
                });
            }
    
            if (this.formWithdraw.value.institution?.uniqueBranch) {
                this.allowBranchEdit = false;
                this.formWithdraw.patchValue({
                    branchCode: this.formWithdraw.value.institution.uniqueBranch
                });
            } else {
                this.allowBranchEdit = true;
                this.formWithdraw.patchValue({
                    branchCode: ''
                });
            }
    
            if (this.formWithdraw.value.institution?.hasSavingAccount) {
                this.accountTypeList = [BankAccountType.CC, BankAccountType.CP];
                this.formWithdraw.patchValue({
                    bankAccountType: undefined
                });
            } else {
                this.accountTypeList = [BankAccountType.CC];
                this.formWithdraw.patchValue({
                    bankAccountType: this.accountTypeList[0]
                });
            }
    
            if (this.formWithdraw.value.institutionCode === this.loggedUser?.bankingAccount?.bankCode) {
                this.isInternalTransfer = true;
                this.formWithdraw.patchValue({
                    forYourself: false
                });
            } else {
                this.isInternalTransfer = false;
    
                this.formWithdraw.patchValue({
                    forYourself: undefined
                });
            }
    
            this.changeTransferDestiny();
        }
    }

    public changeTransferDestiny(): void {
        const forYourself: boolean | null | undefined = this.formWithdraw.value.forYourself;

        if (forYourself === true) {
            this.formWithdraw.patchValue({
                fullName: `${this.loggedUser?.firstName ?? ''} ${this.loggedUser?.lastName ?? ''}`.trim(),
                document: this.loggedUser?.bankingAccount?.documentNumber ?? ''
            });
        }
    }

    public maxBalance(): void {
        let balance: BigNumber = this.money;
        this.formWithdraw.patchValue({value: balance});
        this.convertRequestAmount();
    }

    public convertRequestAmount(): void {
        this.formWithdraw.value.value = Number(String(this.formWithdraw.value.value).replace(',', '.')).toString();
        this.requestAmount = Number(String(this.formWithdraw.value.value).replace(',', '.')).toString();
        if (this.requestAmount) {
            this.request.amount = new BigNumber(this.formWithdraw.value.value);
            if (this.request.type === WithdrawalType.INTERNAL_FIAT) {
                if ((this.token?.user_banking_withdrawal_tax ?? 0) > 0) {
                    this.tax = this.calculateTaxValue(this.request.amount, new BigNumber((this.token?.user_banking_withdrawal_tax as any)), this.token?.tax_type as string);
                    this.total = this.request.amount.minus(this.tax);
                } else {
                    this.tax = new BigNumber(0);
                    this.total = this.request.amount;
                }
            } else {
                if ((this.token?.user_withdrawal_tax ?? 0) > 0) {
                    this.tax = this.calculateTaxValue(this.request.amount, new BigNumber((this.token?.user_withdrawal_tax as any)), this.token?.tax_type as string);
                    this.total = this.request.amount.minus(this.tax);
                } else {
                    this.tax = new BigNumber(0);
                    this.total = this.request.amount;
                }
            }
            this.request.tax = this.tax;
            this.requestAmountFiduciary = this.total.multipliedBy(this.fiatQuotation);
        } else {
            this.request.amount = new BigNumber(0);
            this.requestAmountFiduciary = new BigNumber(0);
        }
    }

    public calculateTaxValue(requestedValueToTransfer: BigNumber, taxAmount: BigNumber, taxType: string): BigNumber {
        if (taxType === TaxItemType.Percentage) {
            const taxPercentage: BigNumber = new BigNumber(taxAmount);
            return new BigNumber(requestedValueToTransfer).multipliedBy(taxPercentage);
        }

        const selectedQuote: AmountConvertedResult | undefined = this.quotes?.find(quote => quote?.currency === this.unitOfMoney);

        const dollarQuote: BigNumber = selectedQuote?.amountUsd ? new BigNumber(selectedQuote.amountUsd) : new BigNumber(0);

        /**
         * If the type isn't 'Percentage', it needs be 'Absolute'.
         * It's necessary to return a tax value in token.
         */
        if (taxType === TaxItemType.Absolute && dollarQuote.isGreaterThan(0)) {
            return new BigNumber(taxAmount).dividedBy(dollarQuote);
        }

        return new BigNumber(0);
    }

    public getInternalAccountInfo(fromSearch: boolean = false): void {
        clearTimeout(this.searchTime);

        this.searchTime = setTimeout(() => {
            if (this.isInternalTransfer && this.formWithdraw.controls.accountCode.valid) {
                if (this.checkSameAccount()) {
                    return;
                }

                if (this.formWithdraw.controls.document.valid) {
                    //resets form
                    this.formWithdraw.patchValue({
                        fullName: '',
                    });

                    //natural person account
                    if (this.formWithdraw?.value?.document?.length === 11) {
                        this.getAccountInfoWithCPF()
                    }
                    //business account
                    if (this.formWithdraw?.value?.document?.length === 14) {
                        this.getAccountInfoWithCNPJ();
                    }
                }
            }
        }, fromSearch ? this.SEARCH_TIME_VALUE : 0);
    }

    public checkSameAccount(): boolean {
        if (this.isInternalTransfer && this.loggedUser?.bankingAccount?.accountId === this.formWithdraw.value.accountCode) {
            this.customSnackbarComponent.open(this.translationConstants.translate(`banking.transfers.error.CBE998`), SnackBarTheme.error, 4000);
            return true;
        } else {
            return false;
        }
    }

    public getAccountInfoWithCPF(): void {
        this.loading = true;

        this.bankingService.getAccountInfoNaturalPerson({
            documentNumber: this.formWithdraw.value.document as string,
            accountId: this.formWithdraw.value.accountCode as string
        }).subscribe((accountInfoResponse: IAccountInfoResponse) => {
            if (accountInfoResponse?.statusAccount === BaaSAccountStatus.BLOQUEADO) {
                this.customSnackbarComponent.open(this.translationConstants.translate('banking.transfers.error.CBE997'), SnackBarTheme.error, 4000);
            } else {
                this.formWithdraw.patchValue({
                    fullName: accountInfoResponse?.fullName,
                });
            }
        }, error => {
            if (error?.error?.message?.errorCode?.includes('CBE')) {
                let msgText: string = this.translationConstants.translate(`banking.transfers.error.${error?.error?.message?.errorCode}`);
                /** 
                 * Tries to recover the text from translate service, if it fails the service will return the search string by default
                 * It will hapen if someday new codes are returned from BaaS
                 * Here we are comparing if it this case, then we are showing the standard message
                */
                if (msgText === `banking.transfers.error.${error?.error?.message?.errorCode}`) {
                    msgText = this.translationConstants.translate('snackbar.errors.processingDefault')
                }
                this.customSnackbarComponent.open(msgText, SnackBarTheme.error, 4000);
            } else if (error?.error?.message?.errorCode?.includes('CIE999')) {
                this.customSnackbarComponent.open(this.translationConstants.translate('banking.transfers.error.CIE999'), SnackBarTheme.error, 4000);
            } else {
                this.customSnackbarComponent.open(this.translationConstants.translate(error?.message?.error?.message || 'snackbar.errors.processingDefault'), SnackBarTheme.error, 4000);
            };
        }).add(() => {
            this.loading = false;
        });
    }

    public getAccountInfoWithCNPJ(): void {
        this.loading = true;

        this.bankingService.getAccountInfoLegalPerson({
            documentNumber: this.formWithdraw.value.document as string,
            accountId: this.formWithdraw.value.accountCode as string
        }).subscribe((accountInfoLegalPersonResponse: IAccountInfoLegalPersonResponse) => {
            if (accountInfoLegalPersonResponse?.statusAccount === BaaSAccountStatus.BLOQUEADO) {
                this.customSnackbarComponent.open(this.translationConstants.translate('banking.transfers.error.CBE997'), SnackBarTheme.error, 4000);
            } else {
                this.formWithdraw.patchValue({
                    fullName: accountInfoLegalPersonResponse?.businessName,
                });
            }
        }, error => {
            if (error?.error?.message?.errorCode?.includes('CBE')) {
                let msgText: string = this.translationConstants.translate(`banking.transfers.error.${error?.error?.message?.errorCode}`);
                /** 
                 * Tries to recover the text from translate service, if it fails the service will return the search string by default
                 * It will hapen if someday new codes are returned from BaaS
                 * Here we are comparing if it this case, then we are showing the standard message
                */
                if (msgText === `banking.transfers.error.${error?.error?.message?.errorCode}`) {
                    msgText = this.translationConstants.translate('snackbar.errors.processingDefault')
                }
                this.customSnackbarComponent.open(msgText, SnackBarTheme.error, 4000);
            } else if (error?.error?.message?.errorCode?.includes('CIE999')) {
                this.customSnackbarComponent.open(this.translationConstants.translate('banking.transfers.error.CIE999'), SnackBarTheme.error, 4000);
            } else {
                this.customSnackbarComponent.open(this.translationConstants.translate('snackbar.errors.processingDefault'), SnackBarTheme.error, 4000);
            };
        }).add(() => {
            this.loading = false;
        });
    }

    public resetCpfCnpjMask(): void {
        this.cpfCnpjMask = '';
    }

    public setCpfCnpjMask(): void {
        if ((this.formWithdraw?.value?.document?.length ?? 0) > 11) {
            this.cpfCnpjMask = '00.000.000/0000-00';
        } else {
            this.cpfCnpjMask = '000.000.000-00 || 00.000.000/0000-00';
        }
    }

    public sendWithdrawalRequest(): void {
        this.loading = true;
        this.request.account = this.translationConstants.translate('withdrawal.' + this.formWithdraw.value.bankAccountType) + ' ' + this.request.account;

        this.request.requestId = undefined;
        this.request.amount = this.formWithdraw.value.value,
        this.request.tax = this.tax;
        this.request.name = this.formWithdraw.value.fullName as string;
        this.request.bank = this.formWithdraw.value.institutionName as string;
        this.request.agency = this.formWithdraw.value.branchCode as string,
        this.request.account = this.formWithdraw.value.bankAccountType + ' ' + this.formWithdraw.value.accountCode + this.formWithdraw.value.digitCode;
        this.request.identifier = this.formWithdraw.value.document as WithdrawalIdentifier;
        this.request.pix_key = this.formWithdraw.value.pix as string;
        this.request.createTemplate = this.formWithdraw.value.saveAccount as boolean;

        this.depositsService.createWithdrawal(this.request).subscribe(() => {
            this.close();
            this.confirm();
            setTimeout(() => {
                this.reloadBalance.emit(true);
            }, 100);
        }, error => {
            // Tratamento específico para erro 412 - User is not approved
            if (error?.status === 412 || error?.error?.message === 'User is not approved') {
                this.customSnackbarComponent.open(
                    this.translationConstants.translate('withdrawal.error.userNotApproved'),
                    SnackBarTheme.error,
                    4000
                );
            } else if(error?.message) {
                this.customSnackbarComponent.open(error?.message, SnackBarTheme.error, 4000);
            } else {
                this.customSnackbarComponent.open(this.translationConstants.translate(`withdrawal.error.${error.code}`), SnackBarTheme.error, 4000);
            }
        }).add(() => {
            this.loading = false;
        });
    }

    public updateCpfCnpjMask(): void {
        this.cpfCnpjMask = undefined;

        this.formWithdraw.patchValue({
            document: this.formWithdraw.value.document,
        });

        if (this.formWithdraw.value.document?.length === 11) {
            this.cpfCnpjMask = '000.000.000-00'
        }
        else if (this.formWithdraw.value.document?.length === 14) {
            this.cpfCnpjMask = '00.000.000/0000-00'
        }
    }
}

interface IFormWithdraw {
    fullName: FormControl<string | null>;
    institutionName: FormControl<string | null>;
    institution: FormControl<Banks | null>;
    bankAccountType: FormControl<BankAccountType | null>;
    document: FormControl<string | null>;
    value: FormControl<any>;
    saveAccount: FormControl<boolean | null>;
    accountCode: FormControl<string | null>;
    digitCode: FormControl<string | null>;
    branchCode: FormControl<string | null>;
    pix: FormControl<string | null>;
    forYourself: FormControl<boolean | null>;
    institutionIspb: FormControl<string | null>;
    institutionCode: FormControl<string | null>;
}