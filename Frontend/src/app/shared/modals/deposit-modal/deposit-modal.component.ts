import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import {
    MAT_DIALOG_DATA,
    MatDialog,
    MatDialogRef,
} from '@angular/material/dialog';
import { SharedModule } from '../../shared.module';
import { RouterModule } from '@angular/router';
import { MatRadioChange } from '@angular/material/radio';
import { fadeIn } from '../../services/util/animations.service';
import {
    CustomSnackbarComponent,
    SnackBarTheme,
} from '../../custom-snackbar/custom-snackbar.component';
import { TranslationConstants } from '../../services/util/translation.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { Token } from '../../models/tokens';
import { LocalStorageService } from 'angular-web-storage';
import { LocalStorageKeys } from '../../services/util/local.storage.keys';
import { AccountService } from '../../services/account/account.service';
import { ShareLinkService } from '../../services/util/share-link.service';
import { catchError, combineLatest, Observable, of } from 'rxjs';
import { BrlaKycHistoryModel } from '../../models/brla-kyc-history.model';
import { FeaturesStatusService } from '../../services/util/features-status.service';
import { FeatureNames } from '../../models/feature-names.enum';
import BigNumber from 'bignumber.js';
import { IOrderEvent } from '../../models/order.event';
import { PaymentTypesEnum } from '../../models/payment-type.enum';
import { usefulSettings } from '../../models/useful-settings.model';
import { ClearLedgerModalComponent } from '../clearledger-modal/clearledger-modal.component';
import { PaymentTypeOption } from '../../models/payment-type-option.model';
import {
    CheckoutObject,
    PaymentTypes,
} from '../../models/payment-checkout.model';
import { UnitOfMoney } from '../../models/finance.constants';
import { CheckoutService } from '../../services/checkout/checkout.service';
import { TokensService } from '../../services/tokens/token.service';
import { ConfigReaderService } from '../../services/util/config.reader.service';
import { BaaSAccountStatus } from '../../models/banking-account';
import { AmountConvertedResult } from '../../models/amount-converted-result';
import { UserLoggedModel } from '../../models/user.logged.model';
import { PlatformBalance } from '../../models/wallet.balance';
import { IMetaMaskParameters } from '../../models/IMetaMaskParameters';
import { environment } from '../../../../environments/environments';
import { TaxItemType } from '../../models/tax-item-type.enum';
import { ValueConverterService } from '../../services/util/value-converter.service';
import { OnkeypressService } from '../../services/util/onkeypress.service.ts.service';

@Component({
    selector: 'app-deposit-modal',
    imports: [CommonModule, SharedModule, RouterModule],
    templateUrl: './deposit-modal.component.html',
    styleUrl: './deposit-modal.component.scss',
    animations: [fadeIn],
})
export class DepositModalComponent {
    public selectedDeposit: string = '';
    public selectedToken: Token = Object() as Token;
    public amountValue: string = '';
    public eDepositType: typeof EDepositType = EDepositType;
    public generatePaymentByPix: boolean = false;
    public publicWallet: string = '';
    public loading: boolean = false;
    public allowCielo: boolean | null = false;
    public isMainFiatToken: Token = Object() as Token;
    public usefulSettings: usefulSettings = new usefulSettings();
    public checkoutObject: CheckoutObject = new CheckoutObject();
    public tokenQuoteInFiat!: BigNumber;
    public tokenPriceDecimalsPlacesStrategy: string = '1.2-2';
    public amountToPayDecimalsPlacesStrategy: number = 2;
    public paymentTypes: PaymentTypes[] = [];
    public notAuthenticated: boolean = false;
    public usdQuotation: AmountConvertedResult =
        Object() as AmountConvertedResult;
    public userAuthenticationData: UserLoggedModel = new UserLoggedModel();
    public allowDigitalBanking: boolean = false;
    public brlaAccountApproved: boolean = false;
    public brlaBuyLimit: BigNumber = new BigNumber(0);
    public merchantExtendedName: string = '';
    public allowPagSeguro: boolean | null = false;
    public allowFiat: boolean = false;
    public allowClearLedger: boolean | null = false;
    public allowBrasilCash: boolean | null = false;
    public allowTransfera: boolean | null = false;
    public allowFiatDeposits: boolean | null = false;
    public allowDeposits: boolean | null = false;
    public allowBRLAPayments: boolean = false;
    public allowCelcoinIntegrationPayments: boolean = false;
    public allowOnlyDeposits: boolean | null = false;
    public allowOnlySpecific: boolean = false;
    public minToBuy: number | undefined = undefined;
    private quotes: Array<AmountConvertedResult> = [];
    private balances: Array<PlatformBalance> = [];
    public product!: Token;
    public metaParameters: {
        accounts: any;
        hasEthereum: boolean | undefined;
        hash: string | undefined;
        parameters?: IMetaMaskParameters;
    } = {
        accounts: undefined,
        hasEthereum: undefined,
        hash: undefined,
        parameters: undefined,
    };
    public unitOfMoney: string = '';
    public options: Array<PaymentTypeOption> = [];
    public payTypeCielo: string = PaymentTypesEnum.CIELO;
    public payTypePagSeguro: string = PaymentTypesEnum.PAGSEGURO;
    public payTypeMulticurrency: string = PaymentTypesEnum.MULTICURRENCY;
    public payTypeDeposits: string = PaymentTypesEnum.DEPOSITS;
    public payTypeClearLedger: string = PaymentTypesEnum.CLEAR_LEDGER;
    public payTypeBrasilCash: string = PaymentTypesEnum.BRASIL_CASH;
    public payTypeTransfera: string = PaymentTypesEnum.TRANSFERA;
    public payTypeDigitalBanking: string = PaymentTypesEnum.DIGITAL_BANKING;
    public payTypeBRLA: string = PaymentTypesEnum.BRLA;
    public payTypeCelcoinIntegration: string =
        PaymentTypesEnum.CELCOIN_INTEGRATION;
    public enoughBalance: boolean = true;
    public nftTransactionTaxFiat: BigNumber = new BigNumber(0);
    public option: string = '';
    public tokens: any[] = [];
    public blockNumber: number = 0;

    constructor(
        public dialogRef: MatDialogRef<DepositModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: EDepositData,
        private readonly customSnackbar: CustomSnackbarComponent,
        private readonly translationConstants: TranslationConstants,
        private readonly clipboard: Clipboard,
        private readonly localStorage: LocalStorageService,
        private readonly accountService: AccountService,
        private readonly shareLinkService: ShareLinkService,
        private readonly featuresStatusService: FeaturesStatusService,
        private readonly dialog: MatDialog,
        private readonly checkoutService: CheckoutService,
        private readonly tokensService: TokensService,
        private readonly configReaderService: ConfigReaderService,
        public readonly valueConverterService: ValueConverterService,
        private readonly keypressService: OnkeypressService
    ) {}

    public ngOnInit(): void {
        if (!this.data) {
            this.dialogRef.close();
        }
        this.tokens = this.data.tokens.filter((tkn) => tkn.id != 'tBRL');
        this.dialogRef.disableClose = true;
        this.dialogRef.addPanelClass(['custom-modal', 'deposit-modal']);

        this.usefulSettings = {
            fiatCurrency: this.accountService.getFiatCurrency(),
        };
    }

    public getDataForToken(tokenId: string): void {
        this.loading = true;

        const featuresAndNonMandatoryRequests =
            this.getFeaturesAndNonMandatoryRequests();

        // Mandatory requests.
        combineLatest({
            tokenDetail: this.tokensService?.getTokenById(tokenId),
            quote: this.accountService.quotations(tokenId),
            decimals: this.accountService.loadDecimalsPlaces(),
            allTokens: this.tokensService.getTokens(),
            usdtQuotation: this.accountService.quotations(UnitOfMoney.USD),
            authentication: this.accountService.isAuthenticated(false, false),
            bankConfig: this.configReaderService.getDigitalBankingConfigs(),
            ...featuresAndNonMandatoryRequests,
        })
            .subscribe(
                (response) => {
                    this.isMainFiatToken = response?.tokenDetail;

                    if (
                        this.usefulSettings.fiatCurrency?.currency ===
                        UnitOfMoney.USD
                    ) {
                        this.tokenQuoteInFiat =
                            response?.quote?.amountUsd || new BigNumber(0);
                    } else {
                        this.tokenQuoteInFiat =
                            response?.quote?.amount || new BigNumber(0);
                    }

                    if (response?.decimals) {
                        this.tokenPriceDecimalsPlacesStrategy =
                            response?.decimals?.tokenPriceDecimals || '1.2-2';
                        this.amountToPayDecimalsPlacesStrategy =
                            response?.decimals?.amountToPayDecimals || 2;
                    }

                    if (response?.allTokens) {
                        this.data.tokens = response?.allTokens || [];
                        let paymentTypes: Array<PaymentTypes> = [];
                        if (response?.allTokens?.length > 0) {
                            const tokensAvailable: Array<Token> =
                                response?.allTokens?.filter(
                                    (tkn) =>
                                        tkn?.usedToPay && tkn?.id !== tokenId
                                );
                            tokensAvailable.forEach((tkn) => {
                                paymentTypes.push({
                                    unitOfMoney: tkn?.id,
                                    percentage: 0,
                                });
                            });
                            this.paymentTypes = paymentTypes;
                        }
                    }

                    this.usdQuotation = response?.usdtQuotation;
                    this.userAuthenticationData = response?.authentication;

                    if (
                        this.userAuthenticationData?.bankingAccount
                            ?.bankStatus === BaaSAccountStatus.ATIVO ||
                        this.userAuthenticationData?.bankingAccount
                            ?.bankStatus === BaaSAccountStatus.CONFIRMED
                    ) {
                        this.allowDigitalBanking =
                            response?.allowDigitalBanking as boolean;
                    }

                    if (
                        response?.allowBRLAPayments &&
                        response?.brlaKycStatus &&
                        response?.brlaKycStatus?.history &&
                        response?.brlaKycStatus?.history?.length > 0
                    ) {
                        for (let hist of response?.brlaKycStatus?.history) {
                            if (
                                hist.status === 'APPROVED' &&
                                hist.level === 2
                            ) {
                                this.brlaAccountApproved = true;
                            }

                            if (hist?.limits) {
                                if (hist?.limits?.limitSwapBuy) {
                                    this.brlaBuyLimit = new BigNumber(
                                        hist?.limits?.limitSwapBuy
                                    ).dividedBy(100);
                                }
                            }

                            if (this.brlaAccountApproved) {
                                break;
                            }
                        }
                    }

                    this.merchantExtendedName = response?.bankConfig?.merchant
                        ?.extendedName as string;

                    this.allowCielo =
                        response?.allowCielo &&
                        (!this.allowOnlyDeposits as boolean);
                    this.allowBRLAPayments =
                        response?.allowBRLAPayments as boolean;
                    this.allowCelcoinIntegrationPayments =
                        response?.allowCelcoinIntegrationPayments as boolean;
                    this.allowPagSeguro =
                        response?.allowPagSeguro &&
                        (!this.allowOnlyDeposits as boolean);
                    this.allowFiat = response?.allowFiat as boolean;
                    this.allowFiatDeposits =
                        response?.allowFiatDeposits &&
                        (!this.allowOnlySpecific as boolean);
                    this.allowClearLedger =
                        response?.allowClearLedger &&
                        (!this.allowOnlySpecific as boolean);
                    this.allowBrasilCash =
                        response?.allowBrasilCash &&
                        (!this.allowOnlySpecific as boolean);
                    this.allowTransfera =
                        response?.allowTransfera &&
                        (!this.allowOnlySpecific as boolean);
                    this.allowDeposits =
                        response?.allowDeposits &&
                        (!this.allowOnlyDeposits as boolean);

                    this.checkoutObject.data = this.isMainFiatToken;
                    this.checkoutObject.quantity = new BigNumber(0);
                    this.checkoutObject.paymentTypes = [];
                    this.checkoutObject.price = this.tokenQuoteInFiat;

                    this.minToBuy =
                        this.isMainFiatToken?.minimumToBuy || undefined;
                },
                (error) => {}
            )
            .add(() => {
                if (!this.checkoutObject?.data || !this.checkoutObject.type) {
                    this.loading = false;
                    return;
                }

                this.defineVariablesByCheckoutObjectData();

                if (this.userAuthenticationData) {
                    combineLatest([
                        this.accountService.allQuotations(),
                        this.accountService.allBalances(),
                    ])
                        .subscribe(
                            async ([allQuotesResp, balancesResp]) => {
                                this.quotes = allQuotesResp || ([] as any);
                                this.balances = balancesResp || ([] as any);

                                this.definePaymentMethod(
                                    this.quotes,
                                    this.balances
                                );
                            },
                            (error) => {}
                        )
                        .add(() => {
                            this.notAuthenticated = true;
                            this.loading = false;
                        });
                } else {
                    this.definePaymentMethod(this.quotes, this.balances);
                    this.loading = false;
                }
            });
    }

    /**
     * Get features status and non-mandatory requests the page will not block if one of them returns false on error.
     * It will just disable some options.
     */
    public getFeaturesAndNonMandatoryRequests(): FeaturesAndNonMandatoryRequests {
        const featureStatusRequests = {
            allowCielo: this.featuresStatusService
                .getFeatureStatus(FeatureNames.PAYMENT_WITH_CIELO, true)
                .pipe(catchError(() => of(null))),
            allowBRLAPayments: this.featuresStatusService
                .getFeatureStatus(FeatureNames.BRLA, true)
                .pipe(catchError(() => of(null))),
            allowCelcoinIntegrationPayments: this.featuresStatusService
                .getFeatureStatus(FeatureNames.CELCOIN_INTEGRATION, true)
                .pipe(catchError(() => of(null))),
            allowPagSeguro: this.featuresStatusService
                .getFeatureStatus(FeatureNames.PAG_SEGURO, true)
                .pipe(catchError(() => of(null))),
            allowFiat: this.featuresStatusService
                .getFeatureStatus(FeatureNames.FIAT_PAYMENTS, false)
                .pipe(catchError(() => of(null))),
            allowFiatDeposits: this.featuresStatusService
                .getFeatureStatus(FeatureNames.FIAT_DEPOSITS, false)
                .pipe(catchError(() => of(null))),
            allowClearLedger: this.featuresStatusService
                .getFeatureStatus(FeatureNames.CLEAR_LEDGER, false)
                .pipe(catchError(() => of(null))),
            allowBrasilCash: this.featuresStatusService
                .getFeatureStatus(FeatureNames.BRASIL_CASH, false)
                .pipe(catchError(() => of(null))),
            allowTransfera: this.featuresStatusService
                .getFeatureStatus(FeatureNames.TRANSFERA, false)
                .pipe(catchError(() => of(null))),
            allowDeposits: this.featuresStatusService
                .getFeatureStatus(FeatureNames.DEPOSITS_HANDLING, false)
                .pipe(catchError(() => of(null))),
            allowDigitalBanking: this.featuresStatusService
                .getFeatureStatus(FeatureNames.DIGITAL_BANKING, false)
                .pipe(catchError(() => of(null))),
            brlaKycStatus: this.accountService
                .getBRLAKYCStatus()
                .pipe(catchError(() => of(null))),
        };
        return featureStatusRequests;
    }

    public close(): void {
        this.dialogRef.close(true);
    }

    public onRadioGroupChange(event: MatRadioChange): void {
        this.selectedDeposit = event?.value;

        if (this.selectedDeposit === this.eDepositType.BRL) {
            this.isMainFiatToken = this.data.tokens?.find(
                (tkn) => tkn.isMainFiatToken
            ) as Token;

            this.checkoutObject = {
                data: null,
                paymentTypes: [],
                price: new BigNumber(0),
                quantity: new BigNumber(0),
                type: 'token',
            };

            this.getDataForToken(this.isMainFiatToken.id);
        }
    }

    public selectAsHelp(): void {
        this.selectedDeposit = EDepositType.HELP;
    }

    public copy(code: string): void {
        const copied: boolean = this.clipboard.copy(
            code === 'wallet' ? this.publicWallet : ''
        );
        if (copied) {
            this.customSnackbar.open(
                this.translationConstants.translate('snackbar.keyCopied'),
                SnackBarTheme.success
            );
        }
    }

    public generatePaymentPix(): void {
        this.generatePaymentByPix = !this.generatePaymentByPix;

        if (!this.generatePaymentByPix) {
            this.amountValue = '';
        }
    }

    public onSelectedToken(): void {
        this.localStorage.set(
            LocalStorageKeys.UNIT_OF_MONEY,
            this.selectedToken?.id as string
        );

        if (this.selectedToken?.id === 'BTC') {
            this.accountService
                .getLoggedUserDetails()
                .subscribe((user) => {
                    this.publicWallet = user?.btc_wallet as string;
                })
                .add(() => {
                    this.loading = false;
                });
        } else {
            this.accountService
                .getLoggedUserDetails()
                .subscribe((user) => {
                    this.publicWallet = user?.walletPublicData as string;
                })
                .add(() => {
                    this.loading = false;
                });
        }
    }

    public sharePublicWalletWhatsapp(): void {
        this.shareLinkService.shareWhatsapp(
            this.translationConstants
                .translate('indications.shareDigitalWallet')
                .replace('###code###', this.publicWallet)
        );
    }

    private preparePaymentData(
        paymentType: PaymentTypeOption
    ): IOrderEvent | undefined {
        if (this.product instanceof Token) {
            return this.preparePaymentTokenData(paymentType, this.product);
        }
        return undefined;
    }

    public depositCelcoinIntegration(
        paymentTypeChoosen: PaymentTypeOption
    ): void {
        let totalAmountCalc: BigNumber = new BigNumber(0);
        if (paymentTypeChoosen.value) {
            totalAmountCalc = new BigNumber(paymentTypeChoosen.value);
        } else {
            totalAmountCalc = new BigNumber(
                this.checkoutObject.price
            ).multipliedBy(this.checkoutObject.quantity);
        }

        if (this.usefulSettings.fiatCurrency.currency === UnitOfMoney.USD) {
            totalAmountCalc = totalAmountCalc.multipliedBy(
                this.usdQuotation.amount
            );
        }

        this.loading = true;
        this.checkoutService
            .createCheckout(
                this.preparePaymentData(paymentTypeChoosen) as IOrderEvent
            )
            .subscribe((checkoutData: IOrderEvent) => {
                if (checkoutData.transactionId) {
                    this.dialog.open(ClearLedgerModalComponent, {
                        panelClass: 'custom-modal',
                        data: {
                            info: {
                                pixQrcode: checkoutData.transactionId,
                                id: checkoutData.id,
                                amount: totalAmountCalc,
                            },
                            method: 'CELCOIN_INTEGRATION',
                        },
                    });
                } else {
                    this.checkoutErrorRedirect('paymentModal.error.generic');
                }
            })
            .add(() => {
                this.loading = false;
            });
    }

    public checkout(): void {
        let opt = this.options.find(
            (opt) => opt.name === this.payTypeCelcoinIntegration
        );

        if (opt) {
            if (!opt.allowed) {
                this.customSnackbar.open(
                    this.translationConstants.translate(
                        'paymentModal.balanceError'
                    ),
                    SnackBarTheme.error
                );
                this.loading = false;
                return;
            }
        } else if (
            this.payTypeMulticurrency === PaymentTypesEnum.MULTICURRENCY
        ) {
            opt = {
                name: PaymentTypesEnum.MULTICURRENCY,
                allowed: true,
                isMandatory: false,
                value: undefined,
            };
        }

        if (opt) {
            this.depositCelcoinIntegration(opt);
        } else {
            this.internalCheckout();
        }
    }

    public internalCheckout(): void {
        this.loading = true;
        if (this.product instanceof Token) {
            this.internalTokenCheckout(this.product);
        }
    }

    private internalTokenCheckout(data: Token): void {
        this.loading = true;
        const selectedOption: PaymentTypeOption | undefined = this.options.find(
            (opt) => opt?.name === this.option
        );

        this.checkoutService
            .createCheckout(
                this.preparePaymentTokenData(
                    selectedOption as PaymentTypeOption,
                    data
                )
            )
            .subscribe(
                (checkoutData: IOrderEvent) => {
                    this.customSnackbar.open(
                        this.translationConstants.translate(
                            'deposit.modal.message.success'
                        ),
                        SnackBarTheme.success
                    );
                },
                (err) => {
                    if (
                        err?.error?.message.includes('You cannot buy more than')
                    ) {
                        this.checkoutErrorRedirect(
                            'tokenProfile.paymentModal.dailyLimitExceeded'
                        );
                    } else if (err.error?.message?.includes('CBE098')) {
                        //balance is not enough
                        this.checkoutErrorRedirect(
                            'banking.transfers.error.CBE098'
                        );
                    } else {
                        this.checkoutErrorRedirect(
                            'paymentModal.error.generic'
                        );
                    }
                }
            );
    }

    private checkoutErrorRedirect(errorCode: string): void {
        this.customSnackbar.open(
            this.translationConstants.translate(errorCode),
            SnackBarTheme.error,
            4000
        );
    }

    private preparePaymentTokenData(
        paymentTypeChoosen: PaymentTypeOption,
        token: Token
    ): IOrderEvent {
        let totalAmountCalc: BigNumber = new BigNumber(0);
        const paymentType: string = paymentTypeChoosen.name;
        if (this.amountValue) {
            totalAmountCalc = new BigNumber(this.amountValue);

            if (paymentTypeChoosen?.taxValue) {
                totalAmountCalc = totalAmountCalc.minus(
                    new BigNumber(paymentTypeChoosen?.taxValue)
                ); /** Lets not charge twice */
            }
        } else {
            totalAmountCalc = new BigNumber(
                this.checkoutObject.price
            ).multipliedBy(this.checkoutObject.quantity);
        }

        if (
            (paymentType === PaymentTypesEnum.CIELO ||
                paymentType === PaymentTypesEnum.PAGSEGURO ||
                paymentType === PaymentTypesEnum.DIGITAL_BANKING) &&
            this.usefulSettings.fiatCurrency.currency === UnitOfMoney.USD
        ) {
            totalAmountCalc = totalAmountCalc.multipliedBy(
                this.usdQuotation.amount
            );
        }

        let taxAmount = new BigNumber(paymentTypeChoosen?.taxValue || 0);
        if (
            paymentType === PaymentTypesEnum.CIELO &&
            this.isMainFiatToken?.token_buy_with_cielo_tax > 0
        ) {
            const taxPercentage: BigNumber = new BigNumber(
                this.isMainFiatToken?.token_buy_with_cielo_tax
            ).dividedBy(100);
            taxAmount = new BigNumber(totalAmountCalc).multipliedBy(
                taxPercentage
            );
        }

        if (
            paymentType === PaymentTypesEnum.COIN_PAYMENTS &&
            this.isMainFiatToken?.token_buy_with_coinpayments_tax > 0
        ) {
            const taxPercentage: BigNumber = new BigNumber(
                this.isMainFiatToken?.token_buy_with_coinpayments_tax
            ).dividedBy(100);
            taxAmount = new BigNumber(totalAmountCalc).multipliedBy(
                taxPercentage
            );
        }

        if (
            paymentType === PaymentTypesEnum.PAGSEGURO &&
            this.isMainFiatToken?.token_buy_with_pagseguro_tax > 0
        ) {
            const taxPercentage: BigNumber = new BigNumber(
                this.isMainFiatToken?.token_buy_with_pagseguro_tax
            ).dividedBy(100);
            taxAmount = new BigNumber(totalAmountCalc).multipliedBy(
                taxPercentage
            );
        }

        if (
            paymentType === PaymentTypesEnum.DIGITAL_BANKING &&
            this.isMainFiatToken?.token_buy_with_digital_banking > 0
        ) {
            const taxPercentage: BigNumber = new BigNumber(
                this.isMainFiatToken?.token_buy_with_digital_banking
            ).dividedBy(100);
            taxAmount = new BigNumber(totalAmountCalc).multipliedBy(
                taxPercentage
            );
        }

        const orderEvent: IOrderEvent = {
            id: undefined,
            status: 'CREATED',
            shippingAmount: new BigNumber(0),
            totalAmount: this.checkoutObject.quantity || 0,
            taxAmount: taxAmount,
            paymentMethod: this.getCorrectPaymentMethodForCheckout(paymentType),
            expirationDate: undefined,
            userId: undefined,
            userEmail: this.notAuthenticated
                ? this.checkoutObject?.email
                : undefined,
            shoppingCartId: undefined,
            storeId: 'TEMP',
            isTokenBuy: true,
            hash: this.metaParameters.hash,
            isNftBuy: false,
            assetId: undefined,
            packageId: undefined,
            nftId: undefined,
            tokensAmount: this.checkoutObject.quantity || 0,
            createdAt: new Date(),
            updatedAt: undefined,
            hmac: undefined,
            transactionId: undefined,
            address_id: undefined,
            items: undefined,
            unitOfMoney:
                paymentType !== PaymentTypesEnum.CIELO &&
                paymentType !== PaymentTypesEnum.CELCOIN_INTEGRATION &&
                paymentType !== PaymentTypesEnum.DIGITAL_BANKING &&
                paymentType !== PaymentTypesEnum.COIN_PAYMENTS &&
                paymentType !== PaymentTypesEnum.PAGSEGURO
                    ? paymentType
                    : this.product.id, // Option selected (coin used to pay)
            unit_purchased: token.id, // Coin that is being purchased
        } as IOrderEvent;

        return orderEvent;
    }

    public getCorrectPaymentMethodForCheckout(paymentType: string): string {
        if (
            paymentType !== PaymentTypesEnum.BRASIL_CASH &&
            paymentType !== PaymentTypesEnum.TRANSFERA &&
            paymentType !== PaymentTypesEnum.CELCOIN_INTEGRATION &&
            paymentType !== PaymentTypesEnum.DIGITAL_BANKING &&
            paymentType !== PaymentTypesEnum.CIELO &&
            paymentType !== PaymentTypesEnum.COIN_PAYMENTS &&
            paymentType !== PaymentTypesEnum.CLEAR_LEDGER &&
            paymentType !== PaymentTypesEnum.PAGSEGURO
        ) {
            return 'TOKEN';
        } else {
            return paymentType;
        }
    }

    public defineVariablesByCheckoutObjectData(): void {
        if (this.checkoutObject.data['transaction_tax']) {
            this.product = new Token(this.checkoutObject.data);
            this.minToBuy = this.product?.minimumToBuy || undefined;
        }

        this.unitOfMoney = this.product?.id;
    }

    public definePaymentMethod(
        quotes: AmountConvertedResult[],
        balances: PlatformBalance[]
    ): void {
        this.loading = true;
        if (this.product?.id !== 'tBRL') {
            for (let payment of this.paymentTypes) {
                const quote = quotes?.find(
                    (quote) => payment.unitOfMoney === quote.currency
                );
                const balance = balances?.find(
                    (blc) => blc.unitOfMoney === payment.unitOfMoney
                );
                let quotationFiat: BigNumber | undefined =
                    this.usefulSettings.fiatCurrency.currency ===
                    UnitOfMoney.USD
                        ? quote?.amountUsd
                        : quote?.amount;
                let purchasePrice: BigNumber = new BigNumber(0);
                let maxPaymentValue: BigNumber = new BigNumber(0);
                let enoughBalance: boolean = false;
                const hasSomeBalance: boolean = Number(balance?.balance) > 0;
                const splitPayment: boolean = payment.percentage > 0;

                let unitValue: number = 0;

                /**
                 * Check if there is any exchange lock
                 */
                if (
                    new BigNumber(balance?.fiatLock as any).isGreaterThan(
                        new BigNumber(0)
                    )
                ) {
                    let unitQuote: BigNumber = new BigNumber(
                        balance?.fiatLock as any
                    ).dividedBy(new BigNumber(balance?.balance as any));
                    unitValue = new BigNumber(this.checkoutObject.price)
                        .dividedBy(
                            new BigNumber(unitQuote).decimalPlaces(
                                environment.decimalsPlacesBought,
                                BigNumber.ROUND_FLOOR
                            )
                        )
                        .toNumber();
                } else if (splitPayment) {
                    unitValue = this.checkoutObject.price
                        .multipliedBy(payment.percentage)
                        .dividedBy(100)
                        .dividedBy(
                            new BigNumber(quotationFiat as any).decimalPlaces(
                                environment.decimalsPlacesBought,
                                BigNumber.ROUND_FLOOR
                            )
                        )
                        .toNumber();
                } else {
                    if (this.allowOnlySpecific) {
                        unitValue = new BigNumber(
                            this.checkoutObject.price
                        ).toNumber();
                    } else {
                        unitValue = new BigNumber(this.checkoutObject.price)
                            .dividedBy(
                                new BigNumber(
                                    quotationFiat as any
                                ).decimalPlaces(
                                    environment.decimalsPlacesBought,
                                    BigNumber.ROUND_FLOOR
                                )
                            )
                            .toNumber();
                    }
                }

                if (hasSomeBalance) {
                    purchasePrice = this.checkoutObject.quantity.multipliedBy(
                        this.checkoutObject.price
                    );
                    maxPaymentValue = new BigNumber(
                        quotationFiat as any
                    ).multipliedBy(balance?.balance as any);
                    if (this.allowOnlySpecific) {
                        if (
                            new BigNumber(
                                balance?.balance as any
                            ).isGreaterThanOrEqualTo(this.checkoutObject.price)
                        ) {
                            enoughBalance = true;
                        } else {
                            enoughBalance = false;
                        }
                    } else {
                        if (
                            maxPaymentValue.isGreaterThanOrEqualTo(
                                purchasePrice
                            )
                        ) {
                            enoughBalance = true;
                        } else {
                            enoughBalance = false;
                        }
                    }
                }

                let tax;
                const token = this.data.tokens.find(
                    (tkn) => tkn.id === payment.unitOfMoney
                );

                if ((token?.tokens_buy_tax ?? 0) > 0) {
                    tax = this.calculateTaxValue(
                        new BigNumber(unitValue),
                        new BigNumber(token?.tokens_buy_tax as any),
                        token?.tax_type as string,
                        new BigNumber(quote?.amountUsd as any)
                    )?.toNumber();
                    if (new BigNumber(tax).isGreaterThan(new BigNumber(0))) {
                        unitValue = new BigNumber(unitValue)
                            .plus(tax)
                            .toNumber();
                    }
                }

                if (this.allowOnlySpecific || hasSomeBalance || splitPayment) {
                    this.checkPaymentMethod(
                        payment.unitOfMoney,
                        true,
                        unitValue,
                        enoughBalance,
                        true,
                        false,
                        payment.percentage > 0,
                        tax as number,
                        new BigNumber(0),
                        token?.tax_type
                    );
                }
            }
        }

        let productPrice: number = Number(this.checkoutObject.price);
        let userBalance: BigNumber | undefined = balances?.find(
            (blc) =>
                blc.unitOfMoney === this.usefulSettings.fiatCurrency.currency
        )?.balance;
        let userBalanceNumber: number = Number(userBalance);

        if (this.allowFiat === true) {
            this.checkPaymentMethod(
                this.usefulSettings.fiatCurrency.currency,
                true,
                productPrice,
                productPrice <= userBalanceNumber,
                true,
                false,
                false,
                new BigNumber(this.nftTransactionTaxFiat || 0).toNumber(),
                new BigNumber(0),
                this.isMainFiatToken ? this.isMainFiatToken?.tax_type : ''
            );
        }

        if (this.allowFiatDeposits === true) {
            this.checkPaymentMethod(
                this.payTypeDeposits,
                true,
                undefined,
                true,
                false,
                false,
                false,
                this.nftTransactionTaxFiat.toNumber(),
                new BigNumber(0),
                this.isMainFiatToken ? this.isMainFiatToken?.tax_type : ''
            );
        }

        if (this.allowCielo === true) {
            this.checkPaymentMethod(
                this.payTypeCielo,
                true,
                undefined,
                true,
                false,
                false,
                false,
                new BigNumber(
                    this.isMainFiatToken?.token_buy_with_cielo_tax || 0
                )
                    .plus(new BigNumber(this.nftTransactionTaxFiat || 0))
                    .toNumber(),
                new BigNumber(0),
                this.isMainFiatToken ? this.isMainFiatToken?.tax_type : ''
            );
        }

        if (this.allowBRLAPayments === true) {
            this.checkPaymentMethod(
                this.payTypeBRLA,
                this.isBrlaAccept(),
                undefined,
                true,
                false,
                false,
                false,
                new BigNumber(
                    this.isMainFiatToken?.token_buy_with_cielo_tax || 0
                )
                    .plus(new BigNumber(this.nftTransactionTaxFiat || 0))
                    .toNumber(),
                new BigNumber(this.brlaBuyLimit),
                this.isMainFiatToken ? this.isMainFiatToken?.tax_type : ''
            );
        }

        if (this.allowCelcoinIntegrationPayments === true) {
            this.checkPaymentMethod(
                this.payTypeCelcoinIntegration,
                true,
                undefined,
                true,
                false,
                false,
                false,
                new BigNumber(
                    this.isMainFiatToken?.token_buy_with_cielo_tax || 0
                )
                    .plus(new BigNumber(this.nftTransactionTaxFiat || 0))
                    .toNumber(),
                new BigNumber(0),
                this.isMainFiatToken ? this.isMainFiatToken?.tax_type : ''
            );
        }

        if (this.allowPagSeguro === true) {
            this.checkPaymentMethod(
                this.payTypePagSeguro,
                true,
                undefined,
                true,
                false,
                false,
                false,
                new BigNumber(
                    this.isMainFiatToken?.token_buy_with_pagseguro_tax || 0
                )
                    .plus(new BigNumber(this.nftTransactionTaxFiat || 0))
                    .toNumber(),
                new BigNumber(0),
                this.isMainFiatToken ? this.isMainFiatToken?.tax_type : ''
            );
        }

        //Deposits are only implemented to cover Token buy situation
        if (this.allowClearLedger === true) {
            this.checkPaymentMethod(
                this.payTypeClearLedger,
                true,
                undefined,
                true,
                false,
                false,
                false,
                new BigNumber(this.nftTransactionTaxFiat || 0).toNumber(),
                new BigNumber(0),
                this.isMainFiatToken ? this.isMainFiatToken?.tax_type : ''
            );
        }

        //Deposits are only implemented to cover Token buy situation
        if (this.allowBrasilCash === true) {
            this.checkPaymentMethod(
                this.payTypeBrasilCash,
                true,
                undefined,
                true,
                false,
                false,
                false,
                new BigNumber(this.nftTransactionTaxFiat || 0).toNumber(),
                new BigNumber(0),
                this.isMainFiatToken ? this.isMainFiatToken?.tax_type : ''
            );
        }

        if (this.allowTransfera === true) {
            this.checkPaymentMethod(
                this.payTypeTransfera,
                true,
                undefined,
                true,
                false,
                false,
                false,
                new BigNumber(this.nftTransactionTaxFiat || 0).toNumber(),
                new BigNumber(0),
                this.isMainFiatToken ? this.isMainFiatToken?.tax_type : ''
            );
        }

        if (this.allowDigitalBanking === true) {
            this.checkPaymentMethod(
                this.payTypeDigitalBanking,
                true,
                undefined,
                true,
                false,
                false,
                false,
                new BigNumber(this.nftTransactionTaxFiat || 0).toNumber(),
                new BigNumber(0),
                this.isMainFiatToken ? this.isMainFiatToken?.tax_type : ''
            );
        }

        this.loading = false;
    }

    public isTraditional(name: string): boolean {
        return (
            name === this.payTypeCielo ||
            name === this.payTypeCelcoinIntegration ||
            name === this.payTypeBRLA ||
            name === this.usefulSettings.fiatCurrency?.currency ||
            name === this.payTypeTransfera ||
            name === this.payTypeBrasilCash ||
            name === this.payTypeClearLedger ||
            name === this.payTypePagSeguro ||
            name === this.payTypeDeposits ||
            name === this.payTypeDigitalBanking
        );
    }

    public convertFiduciaryToToken(value: string | number): void {
        const newValew: BigNumber = new BigNumber(value);

        const totalAmountInToken: BigNumber = newValew.dividedBy(
            new BigNumber(this.tokenQuoteInFiat)
        );
        this.checkoutObject.quantity = totalAmountInToken;

        this.definePaymentMethod(this.quotes, this.balances);
    }

    public allowOnlyNumbers(event: KeyboardEvent): void {
        this.keypressService.onlyAllowNumbers(event, false, 20);
    }

    public isBrlaAccept(): boolean {
        return (
            this.allowBRLAPayments && this.checkoutObject?.data?.brlaIntegration
        ); // To identify if a token have the BRLA integration available.
    }

    public checkPaymentMethod(
        name: string,
        accept: boolean,
        value: number | undefined,
        enoughBalance: boolean,
        showMissingBalance: boolean,
        isMandatory: boolean,
        isSplitted: boolean,
        tax: number,
        limitToBuy: BigNumber = new BigNumber(0),
        taxType: string = ''
    ): void {
        /**
         * If we dont have the deposit feature, the missing balance flag should not appear
         */
        if (showMissingBalance) {
            showMissingBalance = this.allowDeposits as boolean;
        }

        if (accept) {
            if (isMandatory && !enoughBalance) {
                this.enoughBalance = false;
            }

            this.options.push({
                name: name,
                value: new BigNumber(value as any)
                    .multipliedBy(this.checkoutObject.quantity)
                    .toNumber(), // If is tokens, we need multiply
                allowed: enoughBalance,
                // To show missing balance message if user doesn't have balance for this type of payment
                showMissingBalance: !enoughBalance,
                isMandatory: isMandatory,
                isSplitted: isSplitted,
                showTax: tax > 0,
                taxValue: tax as any,
                limitToBuy: limitToBuy ? limitToBuy : new BigNumber(0),
                taxType: taxType,
            });
        }
    }

    public calculateTaxValue(
        requestedValueToTransfer: BigNumber,
        taxAmount: BigNumber,
        taxType: string,
        dollarQuote: BigNumber
    ): BigNumber {
        if (taxType === TaxItemType.Percentage) {
            const taxPercentage: BigNumber = new BigNumber(taxAmount).dividedBy(
                100
            );
            return new BigNumber(requestedValueToTransfer).multipliedBy(
                taxPercentage
            );
        }

        /**
         * If the type isn't 'Percentage', it needs be 'Absolute'.
         * It's necessary to return a tax value in token.
         */
        if (taxType === TaxItemType.Absolute && dollarQuote.isGreaterThan(0)) {
            return new BigNumber(taxAmount).dividedBy(dollarQuote);
        }

        return new BigNumber(0);
    }

    public checkBlock(): void {
        this.accountService
            .reprocessBlock(this.blockNumber, this.selectedToken?.network_id)
            .subscribe((entry) => {
                this.customSnackbar.open(
                    this.translationConstants.translate('orientations.success'),
                    SnackBarTheme.success
                );

                setTimeout(() => {
                    this.close();
                }, 3000);
            });
    }
}

export enum EDepositType {
    CRYPTO = 'crypto',
    BRL = 'brl',
    HELP = 'help',
}

export interface EDepositData {
    tokens: Array<Token>;
}

// This interface is for the current component.
interface FeaturesAndNonMandatoryRequests {
    allowCielo: Observable<boolean | null>;
    allowBRLAPayments: Observable<boolean | null>;
    allowCelcoinIntegrationPayments: Observable<boolean | null>;
    allowPagSeguro: Observable<boolean | null>;
    allowFiat: Observable<boolean | null>;
    allowFiatDeposits: Observable<boolean | null>;
    allowClearLedger: Observable<boolean | null>;
    allowBrasilCash: Observable<boolean | null>;
    allowTransfera: Observable<boolean | null>;
    allowDeposits: Observable<boolean | null>;
    allowDigitalBanking: Observable<boolean | null>;
    brlaKycStatus: Observable<BrlaKycHistoryModel | null>;
}
