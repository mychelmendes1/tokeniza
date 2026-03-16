import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SharedModule } from '../../shared.module';
import { RouterModule } from '@angular/router';
import { fadeIn } from '../../services/util/animations.service';
import { CustomSnackbarComponent, SnackBarTheme } from '../../custom-snackbar/custom-snackbar.component';
import { TranslationConstants } from '../../services/util/translation.service';
import { Token } from '../../models/tokens';
import { AccountService } from '../../services/account/account.service';
import { forkJoin } from 'rxjs';
import BigNumber from 'bignumber.js';
import { TokensService } from '../../services/tokens/token.service';
import { AmountConvertedResult } from '../../models/amount-converted-result';
import { PlatformBalance } from '../../models/wallet.balance';
import { TaxItemType } from '../../models/tax-item-type.enum';
import { ValueConverterService } from '../../services/util/value-converter.service';
import { OnkeypressService } from '../../services/util/onkeypress.service.ts.service';
import { MatStepper } from '@angular/material/stepper';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { HoverIconClassService } from '../../services/util/hover-icon-class.service';
import { TaxItem } from '../../models/transfer.model';
import { IFiatCurrency } from '../../models/IFiatCurrency';
import { AuthCodeModalComponent } from '../auth-code-modal/auth-code-modal.component';
import { WalletUtilsService } from '../../services/util/wallet.utils';

@Component({
    selector: 'app-transfer-modal',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    templateUrl: './transfer-modal.component.html',
    styleUrl: './transfer-modal.component.scss',
    animations: [fadeIn]
})
export class TransferModalComponent implements OnInit {
    @ViewChild('stepper', { static: false }) public stepper!: MatStepper;

    public formTokenSelected: FormGroup<IFormSelectedToken> = new FormGroup<IFormSelectedToken>({
        selectedToken: new FormControl<Token | null>(null, { validators: [Validators.required] }),
    });

    public formIsInternal: FormGroup<IFormIsInternal> = new FormGroup<IFormIsInternal>({
        isInternal: new FormControl<boolean | null>(null, { validators: [Validators.required] }),
    });

    public formWalletToTransfer: FormGroup<IFormWalletToTransfer> = new FormGroup<IFormWalletToTransfer>({
        emailToTransfer: new FormControl<string | null>(null, { validators: [Validators.required] }),
        walletToTransfer: new FormControl<string | null>(null, { validators: [Validators.required] })
    });

    public formTransferValue: FormGroup<IFormTransferValue> = new FormGroup<IFormTransferValue>({
        transferValue: new FormControl<string | null>(null, { validators: [Validators.required] }),
    });

    public loading: boolean = false;
    public tokens: Token[] = [];
    public userBalances: Array<PlatformBalance> = [];
    public quotations: AmountConvertedResult[] = [];
    public selectedToken: Token | null = null;
    public tokenBalance: BigNumber = new BigNumber(0);
    public errorMessage: string = '';
    public userWallet: string = '';
    public taxes: Array<TaxItem> = [];
    public error: boolean = false;
    public dollarQuote: BigNumber = new BigNumber(0);
    public fiatQuote: BigNumber = new BigNumber(0);
    public fiatCurrency: IFiatCurrency = new IFiatCurrency();
    public tax: BigNumber = new BigNumber(0);
    public total: BigNumber = new BigNumber(0);
    public totalInFiat: Number = 0;
    public minAmount: number | null = null;
    public MFA_KEY_SIZE: number = 6;
    public mfaKey: string = '';
    public haveMfa: boolean = false;
    public mfaType?: string = '';

    constructor(
        public dialogRef: MatDialogRef<TransferModalComponent>,
        private readonly customSnackbar: CustomSnackbarComponent,
        private readonly translationConstants: TranslationConstants,
        private readonly accountService: AccountService,
        private readonly dialog: MatDialog,
        private readonly tokensService: TokensService,
        private readonly valueConverterService: ValueConverterService,
        public hoverIconClassService: HoverIconClassService,
        private readonly onKeyPressService: OnkeypressService,
        private readonly walletUtilsService: WalletUtilsService
    ) { }

    public ngOnInit(): void {
        this.dialogRef.disableClose = true;
        this.dialogRef.addPanelClass(['custom-modal', 'transfer-modal']);

        this.accountService.getLoggedUserDetails().subscribe(user => {
            this.userWallet = user?.walletPublicData as string;
        });
        this.fiatCurrency = this.accountService.getFiatCurrency();

        this.loading = true;
        forkJoin([
            this.tokensService.getTokens(),
            this.accountService.allBalances(),
            this.accountService.allQuotations(),
            this.accountService.getRsaPublicKey(),
            this.accountService.verifyMFAStatus()
        ]).subscribe(([tokensResp, balance, quotations, rsaResp, mfaStatus]) => {
            this.tokens = tokensResp?.filter(tk => tk?.transferable) || [];
            this.userBalances = balance || [];
            this.quotations = quotations || [];

            for (const token of this.tokens) {
                const balance = this.userBalances.find(blc => blc?.unitOfMoney === token?.id);
                token.userBalance = new BigNumber(balance?.balance || 0);
            }

            this.haveMfa = mfaStatus?.status;
            this.mfaType = mfaStatus?.type;
        }, error => {

        }).add(() => {
            this.loading = false;
        });
    }

    public tokenSelectedChanged(): void {
        const selectedToken = this.formTokenSelected?.controls?.selectedToken?.value;
        if (selectedToken) {
            this.tokenBalance = new BigNumber(this.userBalances.find(balance => balance?.unitOfMoney === selectedToken?.id)?.balance || 0);
            this.defineQuotation(this.quotations.find(qt => qt?.currency === selectedToken?.id) as AmountConvertedResult, this.userBalances.filter(balance => balance?.unitOfMoney === selectedToken?.id));
            this.dollarQuote = new BigNumber(this.quotations.find(qt => qt?.currency === selectedToken?.id)?.amountUsd || 0);
            this.minAmount = selectedToken?.minimumToTransfer || 0;
        }

        this.formIsInternal.reset();
        this.formWalletToTransfer.reset();
        this.formTransferValue.reset();
        this.error = false;
        this.errorMessage = '';
    }

    public defineQuotation(quote: AmountConvertedResult, balances: PlatformBalance[]): void {
        const balance: PlatformBalance | undefined = balances?.find(blc => blc.unitOfMoney === this.selectedToken?.id);
        if (new BigNumber(balance?.fiatLock || 0).isGreaterThan(new BigNumber(0))) {
            /**
             * In this case the individual quotation will be considered to calculate the respective value
             */
            this.fiatQuote = new BigNumber(balance?.fiatLock || 0).dividedBy(new BigNumber(balance?.balance || 0)) || new BigNumber(0);
        } else {
            this.fiatQuote = this.fiatCurrency.currency === 'BRL' ? quote?.amount || new BigNumber(0) : quote?.amountUsd || new BigNumber(0);
        }
    }

    public convertBigNumberToNumber(value: BigNumber): string {
        return this.valueConverterService.toStringFormat(value, 6);
    }

    public goForward(): void {
        this.stepper.next();
    }

    public isZeroOrInvalidBalance(): boolean {
        return !this.tokenBalance || this.tokenBalance.isNaN() || this.tokenBalance.isZero();
    }

    public goToTransferValue(walletToGo?: string, friendName?: string): void {
        this.formTransferValue.reset();

        if (this.formIsInternal?.controls?.isInternal?.value) {
            this.loading = true;
            this.accountService.getUserByEmailWallet(this.formWalletToTransfer?.controls?.emailToTransfer?.value as string).subscribe(dt => {
                if (dt?.walletPublicData) {
                    this.formWalletToTransfer?.controls?.walletToTransfer.patchValue(dt.walletPublicData as string);

                    if (this.formTokenSelected?.controls?.selectedToken?.value?.network_id === 'TRON') {
                        this.formWalletToTransfer?.controls?.walletToTransfer.patchValue(dt.tron_wallet as string);
                    }

                    if (this.formTokenSelected?.controls?.selectedToken?.value?.network_id === 'BITCOIN') {
                        this.formWalletToTransfer?.controls?.walletToTransfer.patchValue(dt.btc_wallet as string);
                    }

                    this.loading = false;
                    this.transferOperation(walletToGo, friendName);
                } else {
                    this.customSnackbar.open(this.translationConstants.translate('transferModal.userNotFound'), SnackBarTheme.error, 3000);
                    this.loading = false;
                }
            });
        } else {
            this.loading = false;
            this.transferOperation(walletToGo, friendName);
        }
    }

    public transferOperation(walletToGo?: string, friendName?: string): void {
        if (!this.validateWallet(walletToGo ? walletToGo : this.formWalletToTransfer?.controls?.walletToTransfer?.value as string, this.formTokenSelected?.controls?.selectedToken?.value?.network_id as string)) {
            if (this.formTokenSelected?.controls?.selectedToken?.value?.network_id === 'BITCOIN') {
                this.errorMessage = 'transferModal.wrongBTCWalletFormat';
            } else if (this.formTokenSelected?.controls?.selectedToken?.value?.network_id === 'TRON') {
                this.errorMessage = 'transferModal.wrongTRXWalletFormat';
            } else {
                this.errorMessage = 'transferModal.wrongETHWalletFormat';
            }
            this.error = true;
            this.customSnackbar.open(this.translationConstants.translate(this.errorMessage), SnackBarTheme.error, 3000);
            return;
        } else {
            this.errorMessage = '';
            this.error = false;
        }

        this.formTransferValue.reset();

        this.formWalletToTransfer?.controls?.walletToTransfer.patchValue(walletToGo ? walletToGo : this.formWalletToTransfer?.controls?.walletToTransfer?.value as string);

        this.loading = true;
        this.accountService.verifyTransaction({
            amount: '0.00000001',
            walletIdFrom: this.userWallet,
            walletIdTo: this.formWalletToTransfer?.controls?.walletToTransfer?.value as string,
            unitOfMoney: this.formTokenSelected?.controls?.selectedToken?.value?.id as string,
        }).subscribe(result => {
            this.taxes = result?.tax || [];
            if (!result.willBeApproved) {
                this.error = true;
                this.errorMessage = 'transferModal.notApproved';
            } else {
                this.stepper.next();
            }
        }, errorTransaction => {
            if (String(errorTransaction.message).includes('User cannot reserve because of missing balance')) {
                this.errorMessage = 'transferModal.insufficientBalance';
            } else {
                this.errorMessage = 'transferModal.taxErrorMessage';
            }
            this.error = true;
        }).add(() => {
            this.loading = false;
        });
    }

    public validateWallet(wallet: string, network: string): boolean {
        if (network === 'BITCOIN') {
            return this.walletUtilsService.checkAddress(wallet, 'btc')
        } else if (network === 'TRON') {
            return this.walletUtilsService.checkAddress(wallet, 'tron')
        } else {
            return this.walletUtilsService.checkAddress(wallet, 'eth');
        }
    }

    public blockSpecialCharacters(event: any): void {
        this.onKeyPressService.blockSpecialCharacters(event);
    }

    public allowOnlyNumbers(event: any, maxSize: number = 22) {
        this.onKeyPressService.onlyAllowNumbers(event, false, maxSize);
    }

    public changedAmount(): void {
        if (!this.formTransferValue?.controls?.transferValue?.value) {
            this.clearValues();
        } else {
            this.calculateAmount();
        }
    }

    public clearValues(): void {
        this.formTransferValue?.controls?.transferValue.patchValue(this.valueConverterService.toStringFormat(0, 6));

        this.tax = new BigNumber(0);
        this.total = new BigNumber(0);
        this.totalInFiat = 0;
    }

    public calculateAmount(): boolean {
        this.error = false;
        this.errorMessage = '';
        this.dollarQuote = new BigNumber(this.dollarQuote);
        this.fiatQuote = new BigNumber(this.fiatQuote);

        if (!this.formTransferValue?.controls?.transferValue?.value || this.formTransferValue?.controls?.transferValue?.value === '0,00000') {
            this.error = true;
            this.errorMessage = 'transferModal.missingValue';
            return false;
        }

        const requestedPrincipalAmount: BigNumber = this.valueConverterService.fromStringFormatToBigNumber(this.formTransferValue?.controls?.transferValue?.value);

        let calculatedTaxValue: BigNumber = new BigNumber(0);
        this.taxes.forEach(taxItem => {
            const newTaxValue: BigNumber = calculatedTaxValue.plus(this.calculateTaxValue(requestedPrincipalAmount, new BigNumber(taxItem?.amount || 0), taxItem.type));
            calculatedTaxValue = newTaxValue;
        });

        const totalRequestAmountAux: BigNumber = requestedPrincipalAmount.plus(calculatedTaxValue);
        this.total = requestedPrincipalAmount.plus(calculatedTaxValue);
        this.tax = calculatedTaxValue;
        this.totalInFiat = Number(this.total.multipliedBy(this.fiatQuote));

        // If the user have less token than the total of transaction (transferred value + taxes)
        if (totalRequestAmountAux.isGreaterThan(new BigNumber(this.tokenBalance || 0))) {
            this.error = true;
            this.errorMessage = 'transferModal.insufficientBalance';
            return false;
        }

        // If the value is less than minimum value
        if (this.minAmount && this.minAmount > 0 && requestedPrincipalAmount.isLessThan(this.minAmount)) {
            this.error = true;
            this.errorMessage = 'transferModal.valueLow';
            return false;
        }

        this.formTransferValue?.controls?.transferValue.patchValue(this.valueConverterService.toStringFormat(requestedPrincipalAmount, 6));
        return true;
    }

    public calculateTaxValue(requestedValueToTransfer: BigNumber, taxAmount: BigNumber, type: TaxItemType): BigNumber {
        if (type === TaxItemType.Percentage) {
            const taxPercentage: BigNumber = new BigNumber(taxAmount).dividedBy(100);
            return new BigNumber(requestedValueToTransfer).multipliedBy(taxPercentage);
        }

        /**
         * If the type isn't 'Percentage', it needs be 'Absolute'.
         * It's necessary to return a tax value in token.
         */
        if (type === TaxItemType.Absolute && this.dollarQuote.isGreaterThan(0)) {
            return new BigNumber(taxAmount).dividedBy(this.dollarQuote);
        }
        this.errorMessage = 'transferModal.taxErrorMessage';
        this.error = true;

        return new BigNumber(0);
    }

    public async handleTransferValue(): Promise<void> {
        if (await this.calculateAmount()) {
            this.accountService.getLoggedUserDetails().subscribe(user => {
                if (user.hasInternal2fa) {
                    this.accountService.sendMFACode().subscribe();
                }
                this.openAuthModal();
            });
        }
    }

    public verifyExecuteTransfer(): void {
        if (String(this.mfaKey || '').length === this.MFA_KEY_SIZE) {
            this.changedKey();
        }
    }

    public changedKey(): void {
        const mfaKey: string = String(this.mfaKey || '');
        if (mfaKey.length === this.MFA_KEY_SIZE && !this.loading) {
            this.executeTransfer(mfaKey);
        }
    }

    public executeTransfer(secretCode: string): void {
        this.loading = true;
        const requestedPrincipalAmount: BigNumber = this.valueConverterService.fromStringFormatToBigNumber(this.formTransferValue?.controls?.transferValue?.value as string);

        this.accountService.transfer({
            amount: requestedPrincipalAmount,
            walletIdTo: this.formWalletToTransfer?.controls?.walletToTransfer?.value as string,
            walletIdFrom: this.userWallet,
            transactionDescription: '',
            secretcode: secretCode,
            unitOfMoney: this.formTokenSelected?.controls?.selectedToken?.value?.id
        }).subscribe(success => {
            if (success) {
                this.customSnackbar.open(this.translationConstants.translate('transferModal.transferSuccess'), SnackBarTheme.success, 3000);
                this.dialogRef.close(true);
            }
        }, err => {
            if (err?.error?.message?.includes('Device not authorized for this request!')) {
                // const dialogRef = this.dialog.open(DeviceWarningModalComponent, {
                //     panelClass: ['device-warning-modal', 'custom-modal'],
                //     maxWidth: '600px'
                // });
            } else if (err?.error?.message?.includes('Code not validated')) {
                this.customSnackbar.open(
                    this.translationConstants.translate('transferModal.codeMismatch'),
                    SnackBarTheme.error,
                    3000
                );
            } else if (err?.error?.message?.includes('Transaction exceeds limit')) {
                this.customSnackbar.open(
                    this.translationConstants.translate('transferModal.limitError'),
                    SnackBarTheme.error,
                    3000
                );
            } else if (err?.error?.message?.includes('Transaction exceeds daily limit')) {
                this.customSnackbar.open(
                    this.translationConstants.translate('transferModal.dailyLimitError'),
                    SnackBarTheme.error,
                    3000
                );
            } else {
                this.customSnackbar.open(
                    this.translationConstants.translate('transferModal.tryAgain'),
                    SnackBarTheme.error,
                    3000
                );
            }
        }).add(() => {
            this.clearAuthKeys();
            this.loading = false;
        });
    }

    public clearAuthKeys(): void {
        this.mfaKey = '';
    }

    public convertValueToDisplay(value: BigNumber): string {
        return this.valueConverterService.toStringFormat(value, 6);
    }

    public openAuthModal(): void {
        const dialogRef: MatDialogRef<AuthCodeModalComponent> = this.dialog.open(AuthCodeModalComponent, {});

        dialogRef.afterClosed().subscribe((code: string) => {
            if (code) {
                this.mfaKey = code;
                this.verifyExecuteTransfer();
            }
        });
    }

    public isInternalChanged(): void {
        this.formWalletToTransfer.reset();
        this.formTransferValue.reset();
    }
}

interface IFormSelectedToken {
    selectedToken: FormControl<Token | null>;
}

interface IFormIsInternal {
    isInternal: FormControl<boolean | null>;
}

interface IFormWalletToTransfer {
    emailToTransfer: FormControl<string | null>;
    walletToTransfer: FormControl<string | null>;
}

interface IFormTransferValue {
    transferValue: FormControl<string | null>;
}