import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatRadioChange } from '@angular/material/radio';
import { fadeIn } from '../../services/util/animations.service';
import { SimpleModalComponent } from '../simple-modal/simple-modal.component';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { showErrorForInputs } from '../../validators/form-group.validators';
import { emailValidator } from '../../validators/email-validator';
import { TokensService } from '../../services/tokens/token.service';
import { Token } from '../../models/tokens';
import { forkJoin } from 'rxjs';
import { AccountService } from '../../services/account/account.service';
import { ConfigReaderService } from '../../services/util/config.reader.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { TranslationConstants } from '../../services/util/translation.service';
import { CustomSnackbarComponent, SnackBarTheme } from '../../custom-snackbar/custom-snackbar.component';
import { User } from '../../models/IUser';
import BigNumber from 'bignumber.js';
import { FinancialService } from '../../services/financial/financial';
import { AmountConvertedResult } from '../../models/amount-converted-result';
import { PlatformBalance } from '../../models/wallet.balance';
import { IFiatCurrency } from '../../models/IFiatCurrency';
import { UnitOfMoney } from '../../models/finance.constants';

@Component({
    selector: 'app-charge-modal',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    templateUrl: './charge-modal.component.html',
    styleUrl: './charge-modal.component.scss',
    animations: [fadeIn]
})
export class ChargeModalComponent implements OnInit {
    public reloadChargeList: EventEmitter<boolean> = new EventEmitter();
    public loading: boolean = false;
    public selectedCharge: string = '';
    public eChargeType: typeof EChargeType = EChargeType;
    public amountValue: string = '';
    public allTokens: Array<Token> = [];
    public formExternal: FormGroup<IFormExternal> = new FormGroup<IFormExternal>({
        amountValue: new FormControl<string>('', { validators: [Validators.required] }),
    });
    public formInternal: FormGroup<IFormInternal> = new FormGroup<IFormInternal>({
        email: new FormControl<string>('', { validators: [Validators.required, emailValidator] }),
        amountValue: new FormControl<string>('', { validators: [Validators.required] }),
        methodReceipt: new FormControl<any | null>('', { validators: [Validators.required] }),
        description: new FormControl<string>('', { validators: [Validators.minLength(20), Validators.maxLength(140)] }),
        name: new FormControl<string>('', {}),
        document: new FormControl<string>('', {})
    });
    public loggedUserWallet: string = '';
    public loggedUserName: string = '';
    public baseUrl: string = '';
    public isValidWallet: boolean = false;
    public searchTime!: ReturnType<typeof setTimeout>; // Used in filter
    public userDetailsByWallet!: User;
    public noUserFoundError: boolean = false;
    public coinQuoteInFiat!: BigNumber;
    public money?: Number = undefined;
    public tokenQuotation: BigNumber = new BigNumber(0);
    public allQuotations: AmountConvertedResult[] = [];
    public allBalance: PlatformBalance[] = [];
    public fiatCurrency!: IFiatCurrency;

    constructor(
        public dialogRef: MatDialogRef<ChargeModalComponent>,
        private readonly dialog: MatDialog,
        private readonly tokensService: TokensService,
        private readonly accountService: AccountService,
        private readonly configReaderService: ConfigReaderService,
        private readonly clipboard: Clipboard,
        private readonly financialService: FinancialService,
        private readonly translationConstants: TranslationConstants,
        private readonly customSnackbar: CustomSnackbarComponent
    ) { }

    public ngOnInit(): void {
        this.dialogRef.disableClose = true;
        this.dialogRef.addPanelClass(['custom-modal', 'charge-modal']);
        this.fiatCurrency = this.accountService.getFiatCurrency();
        this.initData();
    }

    public initData(): void {
        this.loading = true;
        forkJoin([
            this.tokensService.getTokens(),
            this.accountService.getLoggedUserDetails(),
            this.configReaderService.getAllExternalLinks(),
            this.financialService.balance(''),
            this.accountService.allQuotations(),
        ]).subscribe(([tokensReps, userDetail, externalLinks, balance, allQuotations]) => {
            this.allTokens = tokensReps;
            this.allTokens = this.allTokens.filter(tkn => tkn.enabled);
            this.loggedUserWallet = userDetail?.walletPublicData || '';
            this.loggedUserName = userDetail?.name;
            this.baseUrl = externalLinks?.linkToExternalDeposit + userDetail?.id;
            this.allQuotations = allQuotations;
            this.allBalance = balance;
        }).add(() => {
            this.insertAllQuotationsInPropRate();
            this.loading = false;
        });
    }

    public close(): void {
        this.dialogRef.close();
    }

    public onRadioGroupChange(event: MatRadioChange): void {
        this.selectedCharge = event?.value;
    }

    public enableButton(): boolean {
        if (this.selectedCharge === EChargeType.EXTERNAL) {
            if (this.formExternal.valid) {
                return true;
            }
        } else {
            if (this.formInternal.valid) {
                return true;
            }
        }

        return false;
    }

    public showError(formName: string, form: FormGroup): boolean {
        return showErrorForInputs(formName, form);
    }

    public copy(): void {
        let url = this.baseUrl;
        if (this.formExternal.value.amountValue) {
            url = url + '/' + Number(Number(this.formExternal.value.amountValue) * 100).toFixed(0)
        }
        this.clipboard.copy(url);
        const dialogRef: MatDialogRef<SimpleModalComponent> = this.dialog.open(SimpleModalComponent, {
            data: {
                title: this.translationConstants.translate('chargeModal.linkCopied'),
                subtitle: this.translationConstants.translate('chargeModal.linkCopiedSubtitle'),
            }
        });

        this.close();
    }

    public verifyWalletExist(): void {
        if (this.formInternal.get('email')?.invalid) {
            return;
        };

        this.isValidWallet = true;
        clearTimeout(this.searchTime);
        this.searchTime = setTimeout(() => {
            if (this.formInternal?.value.email?.toLocaleLowerCase() !== this.loggedUserWallet?.toLocaleLowerCase() &&
                this.formInternal?.value?.email !== ''
            ) {
                this.loading = true;
                this.accountService.getUserByEmailWallet(this.formInternal?.value?.email as string).subscribe(userWalletDetails => {
                    this.userDetailsByWallet = userWalletDetails;
                    if (!this.userDetailsByWallet) {
                        this.noUserFoundError = true;
                        const emailControl = this.formInternal.get('email');
                        const errors = emailControl?.errors;
                        if (errors) {
                            delete errors['forcedInvalid'];
                            emailControl?.updateValueAndValidity();
                        }
                    } else {
                        this.noUserFoundError = false;
                        const emailControl = this.formInternal.get('email');
                        emailControl?.setErrors({ forcedInvalid: true });
                        emailControl?.markAsTouched();
                        emailControl?.updateValueAndValidity();
                    }
                }).add(() => {
                    this.loading = false;
                    this.isValidWallet = false;
                });
            }
        }, 1000);
    }

    /**
     * This method will take the entered fiduciary value and divide it by the currency quotation,
     * to calculate the receivable fractions.
     * Eg:. Input: ($) 100,00.
     * Currency quote on the day. Eg:. EFC - ($) 30,00.
     * Divide 100,00 / 30,00.
     * Output: Result = EFC - (3,333333) to receive.
     */
    public calculateAmountValueSourceCurrency(): number {
        if (this.formInternal?.value?.amountValue) {
            const calcTotalSouceCurrencyValue: number = new BigNumber(this.formInternal.value.amountValue).dividedBy(new BigNumber(this.coinQuoteInFiat)).toNumber();
            return Number(calcTotalSouceCurrencyValue);
        } else {
            return Number(new BigNumber(0));
        }
    }

    /**
     * This method adds up the fee methods to calculate the total amount of fees paid in fractions on the token.
     */
    public calculateTotalAmoutValueToSend(): number {
        return this.calculateAmountValueSourceCurrency();
    }

    public calculateAmountValueReturnCoin(rate: string): number {
        if (this.formInternal.value.amountValue) {
            const calcTotalReturnCoinValue: number = new BigNumber(this.formInternal.value.amountValue).dividedBy(new BigNumber(rate)).toNumber();
            return Number(calcTotalReturnCoinValue);
        } else {
            return Number(new BigNumber(0));
        }
    }
    public sendInvoice(): void {
        this.loading = true;
        this.accountService.sendInvoice({
            expirationDate: new Date(Date.now() + (1000 * 60 * 60 * 24 * Number.parseFloat('7'))),
            creationDate: new Date(),
            requestMessage: this.formInternal.value.description as string,
            requestedMoneyQuote: Number(this.formInternal.value.methodReceipt?.rate),
            amountRequested: this.calculateAmountValueReturnCoin(this.formInternal.value.methodReceipt?.rate),
            unitOfMoneyRequested: this.formInternal.value.methodReceipt?.id,
            fiduciaryAmount: Number(this.formInternal.value.amountValue),
            userIdTo: this.userDetailsByWallet?.id as string,
            email: this.formInternal.value.email as string,
            name: this.formInternal.value.name as string,
            document: this.formInternal.value.document as string
        }).subscribe(success => {
            setTimeout(() => {
                this.reloadChargeList.emit(true);
            }, 100);
            this.close();
            const dialogRef: MatDialogRef<SimpleModalComponent> = this.dialog.open(SimpleModalComponent, {
                data: {
                    title: this.translationConstants.translate('chargeModal.chargeSend'),
                    subtitle: this.translationConstants.translate('chargeModal.chargeSendSubtitle'),
                }
            });

            dialogRef.afterClosed().subscribe((closed: boolean) => {
                if (closed) {
                    this.close();
                }
            });
        }, error => {
            this.customSnackbar.open(error?.error?.message?.message, SnackBarTheme.error, 4000);
        }).add(() => {
            this.loading = false;
        });
    }

    public paste(): void {
        navigator.clipboard.readText().then(cliptext => {
            this.formInternal?.get('email')?.setValue(cliptext);
            this.verifyWalletExist();
        });
    }

    public tokenSelectedChanged(): void {
        for (const balance of this.allBalance) {
            if (balance?.unitOfMoney === this.formInternal.value.methodReceipt?.id) {
                this.tokenQuotation = new BigNumber(balance?.balance || 0);

                if (this.tokenQuotation) {
                    if (this.fiatCurrency.currency === UnitOfMoney.USD) {
                        this.coinQuoteInFiat = this.allQuotations?.find(qt => qt?.currency === balance?.unitOfMoney)?.amountUsd || new BigNumber(0);
                    } else {
                        this.coinQuoteInFiat = this.allQuotations?.find(qt => qt?.currency === balance?.unitOfMoney)?.amount || new BigNumber(0);
                    }
                    this.money = balance?.fiatLock || 0 > 0 ? balance?.fiatLock : Number(new BigNumber(this.tokenQuotation).multipliedBy(this.coinQuoteInFiat));
                }
            }
        }
    }

    public insertAllQuotationsInPropRate(): void {
        if (this.allQuotations && this.allTokens) {
            this.allTokens.forEach(token => {
                const matchingQuotation: AmountConvertedResult = this.allQuotations?.find(quote => quote?.currency === token?.id) as AmountConvertedResult;
                if (matchingQuotation) {
                    token.rate = matchingQuotation.rate.toString();
                }
            });
        }
    }
}

export enum EChargeType {
    INTERNAL = 'internal',
    EXTERNAL = 'external'
}

interface IFormExternal {
    amountValue: FormControl<string | null>;
}

interface IFormInternal {
    email: FormControl<string | null>;
    amountValue: FormControl<string | null>;
    methodReceipt: FormControl<any | null>;
    description: FormControl<string | null>;
    name: FormControl<string | null>;
    document: FormControl<string | null>;
}