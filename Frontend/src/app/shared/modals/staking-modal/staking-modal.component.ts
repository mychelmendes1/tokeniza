import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { WarningModalComponent } from '../warning-modal/warning-modal.component';
import { SimpleModalComponent } from '../simple-modal/simple-modal.component';
import { Token } from '../../models/tokens';
import { TokensService } from '../../services/tokens/token.service';
import { forkJoin, Subscription, interval } from 'rxjs';
import { AccountService } from '../../services/account/account.service';
import { PlatformBalance } from '../../models/wallet.balance';
import { AmountConvertedResult } from '../../models/amount-converted-result';
import { FinancialService } from '../../services/financial/financial';
import { StakingConfig } from '../../models/staking.config';
import cloneDeep from 'lodash/cloneDeep';
import { OnkeypressService } from '../../services/util/onkeypress.service.ts.service';
import { ValueConverterService } from '../../services/util/value-converter.service';
import BigNumber from 'bignumber.js';
import { StakingMethodEnum } from '../../models/staking-method.enum';
import { IFiatCurrency } from '../../models/IFiatCurrency';
import { FeatureNames } from '../../models/feature-names.enum';
import { FeaturesStatusService } from '../../services/util/features-status.service';
import { CustomSnackbarComponent, SnackBarTheme } from '../../custom-snackbar/custom-snackbar.component';
import { TranslationConstants } from '../../services/util/translation.service';
import { TaxItemType } from '../../models/tax-item-type.enum';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { BottomSheetComponent } from '../../bottom-sheet/bottom-sheet.component';
import { StakingBalanceHistory } from '../../models/staking.balance.history';
import { StakingPeriodType } from '../../models/staking-period-type.enum';

@Component({
    selector: 'app-staking-modal',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    templateUrl: './staking-modal.component.html',
    styleUrl: './staking-modal.component.scss'
})
export class StakingModalComponent {

    @Output() public reloadBalance: EventEmitter<boolean> = new EventEmitter();
    public loading: boolean = false;
    public tokens: Token[] = [];
    public selectedToken: Token | null = null;
    public userBalances: Array<PlatformBalance> = [];
    public quotations: AmountConvertedResult[] = [];
    public originalStakeConfigs: StakingConfig[] = [];
    public stakeConfigs: StakingConfig[] = [];
    public stakeSelected: StakingConfig | null = null;
    public stakeValue: string = '';
    public total: BigNumber = new BigNumber(0);
    public stakeValueFiat: number = 0;
    public fiatQuote: BigNumber = new BigNumber(0);
    public fiatCurrency: IFiatCurrency = new IFiatCurrency();
    public tokenBalance: BigNumber = new BigNumber(0);
    public thresholdToApply: number = 0;
    public isStakingSignmentEnabled: boolean = false;
    public signed: boolean = false;
    public document_sign_key: string | undefined = undefined;
    public subscription!: Subscription;
    public errorMessage: string = '';
    public error: boolean = false;
    public accepted: boolean = true;
    public userStakes: StakingBalanceHistory[] = [];

    constructor(
        public dialogRef: MatDialogRef<StakingModalComponent>,
        private readonly dialog: MatDialog,
        private readonly tokensService: TokensService,
        private readonly accountService: AccountService,
        private readonly financialService: FinancialService,
        private readonly keypressService: OnkeypressService,
        public readonly valueConverterService: ValueConverterService,
        private readonly featureStatusService: FeaturesStatusService,
        private readonly customSnackbar: CustomSnackbarComponent,
        private readonly translationConstants: TranslationConstants,
        private readonly bottomSheet: MatBottomSheet
    ) { }

    public ngOnInit(): void {
        this.dialogRef.disableClose = true;
        this.dialogRef.addPanelClass(['custom-modal', 'staking-modal']);
        this.fiatCurrency = this.accountService.getFiatCurrency();

        this.loading = true;
        forkJoin([
            this.tokensService.getTokens(),
            this.accountService.allBalances(),
            this.accountService.allQuotations(),
            this.financialService.getStakingConfig(''),
            this.featureStatusService.getFeatureStatus(FeatureNames.STAKING_SIGNMENT),
            this.financialService.getUserStakes('')
        ]).subscribe(([tokensResp, balance, quotations, stakeConfigs, isStakingSignmentEnabled, userStakes]) => {
            this.tokens = tokensResp || [];
            this.userBalances = balance || [];
            this.quotations = quotations || [];

            if (stakeConfigs) {
                for (let config of stakeConfigs) {
                    if (config.periodType === StakingPeriodType.MONTH && config.monthlyPayments) {
                        config.totalToApply = config.valueToApply * config.stakingLength;
                    }
                }
            }

            this.originalStakeConfigs = stakeConfigs || [];
            this.stakeConfigs = cloneDeep(this.originalStakeConfigs) || [];
            this.isStakingSignmentEnabled = isStakingSignmentEnabled;
            this.userStakes = userStakes
        }, error => {

        }).add(() => {
            this.loading = false;
        });
    }

    // Every time a token is selected, it must filter and reset the user's next options.
    public tokenSelectedChanged(): void {
        if (this.selectedToken) {
            this.stakeSelected = null;
            this.stakeValue = '';
            this.stakeConfigs = this.originalStakeConfigs?.filter(config => config?.unit_of_money === this.selectedToken?.id);
            this.tokenBalance = new BigNumber(this.userBalances.find(balance => balance?.unitOfMoney === this.selectedToken?.id)?.balance || 0);
            this.defineQuotation(this.quotations.find(qt => qt?.currency === this.selectedToken?.id) as AmountConvertedResult, this.userBalances.filter(balance => balance?.unitOfMoney === this.selectedToken?.id));
        }
    }

    public close(): void {
        this.dialogRef.close();
    }

    public openWarningModal(): void {
        const dialogRef: MatDialogRef<WarningModalComponent> = this.dialog.open(WarningModalComponent, {
            data: {
                title: 'stakeModal.confirm.title',
                subtitle: 'stakeModal.confirm.subtitle',
                confirmBtn: 'stakeModal.confirm.confirmBtn'
            }
        });

        this.close();

        dialogRef.afterClosed().subscribe((action: boolean) => {
            if (action) {
                this.openSimpleModal();
            }
        });
    }

    public openSimpleModal(): void {
        const dialogRef: MatDialogRef<SimpleModalComponent> = this.dialog.open(SimpleModalComponent, {
            data: {
                title: 'stakeModal.success.title',
                subtitle: 'stakeModal.success.subtitle',
            }
        });
    }

    public allowOnlyNumbers(event: KeyboardEvent): void {
        this.keypressService.onlyAllowNumbers(event, false, 20);
    }

    public convertBigNumberToNumber(value: BigNumber): string {
        return this.valueConverterService.toStringFormat(value, 6);
    }

    public changedAmount(): void {
        if (!this.stakeValue || this.valueConverterService.fromStringFormatToBigNumber(this.stakeValue).isLessThanOrEqualTo(0)) {
            this.clearValues();
        } else {
            this.calculateAmount();
        }
    }

    public clearValues(): void {
        this.stakeValue = this.valueConverterService.toStringFormat(0, 6);
        this.total = new BigNumber(0);
        this.stakeValueFiat = 0;
    }

    public calculateAmount(): boolean {
        if (!this.stakeValue) {
            return false;
        }

        const requestedPrincipalAmount: BigNumber = this.valueConverterService.fromStringFormatToBigNumber(this.stakeValue);
        this.stakeValueFiat = Number(requestedPrincipalAmount.multipliedBy(this.fiatQuote));

        if (this.stakeValue && requestedPrincipalAmount.isGreaterThan(0) && this.stakeSelected) {
            if (this.stakeSelected.method === StakingMethodEnum.Percentage) {
                const gain: BigNumber = new BigNumber(requestedPrincipalAmount)
                    .multipliedBy(Number(this.stakeSelected.totalToApply ? this.stakeSelected.totalToApply : this.stakeSelected.valueToApply))
                    .dividedBy(100);

                this.total = gain;
            } else if (this.stakeSelected.method === StakingMethodEnum.Absolute) {
                this.total = new BigNumber(this.stakeSelected.totalToApply ? this.stakeSelected.totalToApply : this.stakeSelected.valueToApply);
            }
            return true;
        }

        return false;
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

    public async changedDays(): Promise<void> {
        this.thresholdToApply = new BigNumber(this.stakeSelected?.thresholdToApply || 0).toNumber();

        if (this.stakeValue) {
            const requestedPrincipalAmount: BigNumber = this.valueConverterService.fromStringFormatToBigNumber(this.stakeValue);

            if (this.stakeSelected?.method === StakingMethodEnum.Percentage) {
                const gain: BigNumber = new BigNumber(requestedPrincipalAmount)
                    .multipliedBy(Number(this.stakeSelected.totalToApply ? this.stakeSelected.totalToApply : this.stakeSelected.valueToApply))
                    .dividedBy(100);

                this.total = gain;
            } else if (this.stakeSelected?.method === StakingMethodEnum.Absolute) {
                this.total = new BigNumber(this.stakeSelected?.totalToApply ? this.stakeSelected.totalToApply : this.stakeSelected.valueToApply);
            }
        }
    }

    public hasValidStakeValue(): boolean {
        if (!this.stakeValue) {
            return false;
        }
        const stakeValueBN: BigNumber = this.valueConverterService.fromStringFormatToBigNumber(this.stakeValue);
        return stakeValueBN.isGreaterThan(0) && this.checkEnoughBalance() && this.checkBiggerThanThreshold();
    }

    public checkEnoughBalance(): boolean {
        const stakeValueBN: BigNumber = this.valueConverterService.fromStringFormatToBigNumber(this.stakeValue);
        return stakeValueBN.isLessThanOrEqualTo(this.tokenBalance);
    }

    public checkBiggerThanThreshold(): boolean {
        if (this.stakeSelected) {
            const stakeValueBN: BigNumber = this.valueConverterService.fromStringFormatToBigNumber(this.stakeValue);
            return stakeValueBN.isGreaterThanOrEqualTo(this.stakeSelected.thresholdToApply);
        } else {
            //Do not raise any error in case any staking was selected
            return true;
        }
    }

    public sendToSign(): void {
        this.loading = true;
        const requestedPrincipalAmount: BigNumber = this.valueConverterService.fromStringFormatToBigNumber(this.stakeValue);

        this.accountService.createSignRequest({
            amount: requestedPrincipalAmount,
            stakeName: this.stakeSelected?.name,
            unitOfMoney: this.selectedToken?.id
        }).subscribe(success => {
            if (success && success["document"]) {
                this.document_sign_key = success["document"]["key"];
                this.startScan();
            }
        }, err => {
            this.customSnackbar.open(this.translationConstants.translate('transferValue.tryAgain'), SnackBarTheme.error, 3000);
        }).add(() => {
            this.loading = false;
            this.stakeValue = this.valueConverterService.toStringFormat(requestedPrincipalAmount, 6);
        });
    }
    
    public startScan(): void {
        this.subscription = interval(5000).subscribe(x => { // will execute every 5 seconds
            this.onCheckStatus();
        });
    }

    public onCheckStatus(): void {
        this.accountService.checkDocumentStatus(this.document_sign_key as string).subscribe(dt => {
            if (dt && String(dt).includes('"status":"closed"')) {
                this.signed = true;
                this.subscription?.unsubscribe();
            }
        });
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
        if (type === TaxItemType.Absolute && this.fiatQuote.isGreaterThan(0)) {
            return new BigNumber(taxAmount).dividedBy(this.fiatQuote);
        }
        this.errorMessage = 'transferValue.taxErrorMessage';
        this.error = true;

        return new BigNumber(0);
    }

    public askToExecuteStaking(): void {
        if (this.userStakes?.length > 0 && this.userStakes.find(stk => !stk.applied && !stk.earlyLeave)) {
            const sheetRef: any = this.bottomSheet.open(BottomSheetComponent, {
                data: {
                    text: this.translationConstants.translate('stakeModal.removeActivesStakings'),
                    declineOption: this.translationConstants.translate('stakeModal.keepButton'),
                    confirmOption: this.translationConstants.translate('stakeModal.removeButton'),
                    close: true
                }
            });
            sheetRef.afterDismissed().subscribe((removeOldStake: boolean) => {
                this.executeStake(removeOldStake);
            });
        } else {
            this.executeStake(false);
        }
    }

    public executeStake(removeOldStake: boolean): void {
        this.loading = true;
        const requestedPrincipalAmount: BigNumber = this.valueConverterService.fromStringFormatToBigNumber(this.stakeValue);

        this.accountService.createUserStake({
            amountToApply: requestedPrincipalAmount.toNumber(),
            removeOldStake: removeOldStake,
            stakeId: this.stakeSelected?.id,
            unitOfMoney: this.selectedToken?.id,
            document_sign_key: this.document_sign_key
        }).subscribe(success => {
            if (success) {
                this.close();
                this.openSimpleModal();
                setTimeout(() => {
                    this.reloadBalance.emit(true);
                }, 100);
            }
        }, err => {
            if (err.error.message.includes('Code not validated')) {
                this.customSnackbar.open(this.translationConstants.translate('transferValue.codeMismatch'), SnackBarTheme.error, 3000);
            } else {
                this.customSnackbar.open(this.translationConstants.translate('transferValue.tryAgain'), SnackBarTheme.error, 3000);
            }
        }).add(() => {
            this.loading = false;
        });
    }

    public openTerms(): void {
        if (this.stakeSelected?.unit_of_money !== 'tBRL') {
            window.open('https://axia-tokeniza-us-east-2-s3-bucket.s3.us-east-2.amazonaws.com/f1db7510-e031-703f-7b27-d5d8ee24a18c_Termos%20de%20Uso%20de%20Staking_Tokeniza_%20(revisado)_1748975342030.pdf', '_blank');
        } else {
            window.open(this.stakeSelected?.terms, '_blank');
        }
    }
}