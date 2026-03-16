import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { Router, RouterModule } from '@angular/router';
import { CheckoutObject } from '../../models/payment-checkout.model';
import { PaymentTypesEnum } from '../../models/payment-type.enum';
import { PaymentTypeOption } from '../../models/payment-type-option.model';
import { Assets } from '../../models/IAssets.model';
import { NFTPackage, NFTPackageBought } from '../../models/INFTPackage';
import { Token } from '../../models/tokens';
import { IFiatCurrency } from '../../models/IFiatCurrency';
import { AmountConvertedResult } from '../../models/amount-converted-result';
import { Network } from '../../models/network.model';
import { PlatformBalance } from '../../models/wallet.balance';
import BigNumber from 'bignumber.js';
import { AccountService } from '../../services/account/account.service';
import { AssetService } from '../../services/asset/asset.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FeaturesStatusService } from '../../services/util/features-status.service';
import { CustomSnackbarComponent, SnackBarTheme } from '../../custom-snackbar/custom-snackbar.component';
import { TokensService } from '../../services/tokens/token.service';
import { TranslateService } from '@ngx-translate/core';
import { ConfigReaderService } from '../../services/util/config.reader.service';
import { TranslationConstants } from '../../services/util/translation.service';
import { CheckoutService } from '../../services/checkout/checkout.service';
import { environment } from '../../../../environments/environments';
import { UnitOfMoney } from '../../models/finance.constants';
import { catchError, combineLatest, of } from 'rxjs';
import { FeatureNames } from '../../models/feature-names.enum';
import { BaaSAccountStatus } from '../../models/banking-account';
import { IOrderEvent } from '../../models/order.event';
import { TaxItemType } from '../../models/tax-item-type.enum';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { EViewMode } from '../../models/view-mode.enum';
import { FiatDepositModalComponent } from '../../modals/fiat-deposit-modal/fiat-deposit-modal.component';
import { ClearLedgerModalComponent } from '../../modals/clearledger-modal/clearledger-modal.component';
import { PagseguroModalComponent } from '../../modals/pagseguro-modal/pagseguro-modal.component';
import { PixelService } from '../../services/util/pixel.service';

@Component({
    selector: 'app-payment-checkout',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    templateUrl: './payment-checkout.component.html',
    styleUrl: './payment-checkout.component.scss'
})
export class PaymentCheckoutComponent {

    @Input() public checkoutObject: CheckoutObject = Object() as CheckoutObject;
    @Output() public finishOperation: EventEmitter<boolean> = new EventEmitter();
    @Input() public listenChanges: number = 0; // Used to force the component execute ngOnChanges()
    @Output() public errorOnLoading: EventEmitter<boolean> = new EventEmitter();
    @Output() public waitingMetaMaskOutput: EventEmitter<boolean> = new EventEmitter();

    /**
     * Metamask parameters
     */
    public metaParameters: { accounts: any, hasEthereum: boolean | undefined, hash: string | undefined, parameters?: any } = {
        accounts: undefined,
        hasEthereum: undefined,
        hash: undefined,
        parameters: undefined
    };
    public allowBRLAPayments: boolean = false;
    public allowCelcoinIntegrationPayments: boolean = false;
    public waitingMetaMask: boolean = false;
    public loading: boolean = false;
    public loadingFeatureStatus: boolean = false;
    public payTypeBRLA: string = PaymentTypesEnum.BRLA;
    public payTypeCelcoinIntegration: string = PaymentTypesEnum.CELCOIN_INTEGRATION;
    public loadingTokens: boolean = false;
    public loadingMetamask: boolean = false;
    public isMetamaskAllowed: boolean = false;
    public showCriticalError: boolean = false;
    public showMetamaskErrorMessage: boolean = false;
    public allowOnlySpecific: boolean = false;
    public isResellAllowed: boolean = false;
    public selectedTab: number = 0;
    public options: Array<PaymentTypeOption> = [];
    public cryptoOptions: Array<PaymentTypeOption> = []; // Used in tab === 1
    public traditionalOptions: Array<PaymentTypeOption> = []; // Used in tab === 2
    public product!: any;
    public enoughBalance: boolean = true;
    public option: string = '';
    public resale: boolean = true;
    public fiatCurrency: IFiatCurrency = new IFiatCurrency();
    public payTypeCielo: string = PaymentTypesEnum.CIELO;
    public payTypePagSeguro: string = PaymentTypesEnum.PAGSEGURO;
    public payTypeMulticurrency: string = PaymentTypesEnum.MULTICURRENCY;
    public payTypeFiatBalance: string = 'BALANCE';
    public allowCielo = false;
    public allowPagSeguro = false;
    public usdQuotation: AmountConvertedResult | undefined = undefined;
    public nftSuccessClose: boolean = true;
    public nftPackageResponse: NFTPackageBought = new NFTPackageBought();
    public browserLanguage: string = '';
    public showInstallMetamask: boolean = false;
    public METAMASK_LINK_EN: string = 'https://academy.binance.com/en/articles/connecting-metamask-to-binance-smart-chain';
    public METAMASK_LINK_PT: string = 'https://academy.binance.com/pt/articles/connecting-metamask-to-binance-smart-chain';
    public linkToInstallMetamask: string = '';
    public abiFile: any = undefined;
    public hasCryptoInPaymentList: boolean = false;
    public enablePaymentButton: boolean = false;
    public tokens: Token[] = [];
    public token: Token = new Token();
    public networks: Array<Network> = [];
    private quotes: Array<AmountConvertedResult> = [];
    private balances: Array<PlatformBalance> = [];
    public allowFiat: boolean = false;
    public payTypeDeposits: string = PaymentTypesEnum.DEPOSITS;
    public payTypeClearLedger: string = PaymentTypesEnum.CLEAR_LEDGER;
    public payTypeBrasilCash: string = PaymentTypesEnum.BRASIL_CASH;
    public payTypeTransfera: string = PaymentTypesEnum.TRANSFERA;
    public allowClearLedger: boolean = false;
    public allowBrasilCash: boolean = false;
    public allowTransfera: boolean = false;
    public isNft: boolean = false;
    public allowFiatDeposits: boolean = false;
    public allowDeposits: boolean = false;
    public unitOfMoney: string = '';
    public notAuthenticated: boolean = false;
    public minToBuy: number = 0;
    public maxToBuy: number = 0;
    public decimalPlaces: string = '';
    public allowDigitalBanking: boolean = false;
    public payTypeDigitalBanking: string = PaymentTypesEnum.DIGITAL_BANKING;
    public merchantExtendedName: string = '';
    public nftTransactionTaxFiat: BigNumber = new BigNumber(0);
    public nftTransactionTaxToken: BigNumber = new BigNumber(0);
    public isAuthenticated: boolean = false;
    @Input() public brlaBuyLimit: BigNumber = new BigNumber(0);
    @Input() public brlaAccountApproved: boolean = false;

    constructor(
        private readonly accountService: AccountService,
        private readonly assetsService: AssetService,
        private readonly checkoutService: CheckoutService,
        private readonly dialog: MatDialog,
        private readonly featuresStatusService: FeaturesStatusService,
        private readonly customSnackbar: CustomSnackbarComponent,
        private readonly tokensService: TokensService,
        private readonly translate: TranslateService,
        private readonly configReaderService: ConfigReaderService,
        private readonly pixel: PixelService,
        private readonly translationConstants: TranslationConstants,
        private readonly router: Router
    ) {
        this.browserLanguage = this.translate.getBrowserLang() as string;
    }

    public ngOnInit(): void {
        this.getData();
        this.decimalPlaces = environment.decimalPlaces;

        this.configReaderService.getDigitalBankingConfigs().subscribe(bankConfig => {
            this.merchantExtendedName = bankConfig?.merchant.extendedName as string;
        });
    }

    public ngOnChanges(): void {
        if (this.product && (this.product instanceof Token || this.isNft && !this.product["collection"]["price"] || this.allowOnlySpecific)) {
            this.options = [];
            this.definePaymentMethod(this.quotes, this.balances);
        }
    }

    public getData(): void {
        if (this.checkoutObject?.data) {
            if (this.checkoutObject.data["collection"]) {
                this.product = new Assets(this.checkoutObject.data);
                this.minToBuy = this.product.minimumToBuy || undefined;
                this.maxToBuy = this.product.maxToBuy || undefined;
                this.isNft = true;
            } else if (this.checkoutObject.data["package_size"]) {
                this.product = new NFTPackage(this.checkoutObject.data);
                this.isNft = true;
            } else if (this.checkoutObject.data["transaction_tax"]) {
                this.product = new Token(this.checkoutObject.data);
                this.minToBuy = this.product?.minimumToBuy || undefined;
            }
        } else {
            this.finishOperation.emit(true);
            return;
        }

        this.unitOfMoney = this.product?.id;
        this.loadingTokens = true;
        this.loadingMetamask = true;
        this.loading = true;
        this.loadingFeatureStatus = true;
        this.fiatCurrency = this.accountService.getFiatCurrency();

        let allowOnlyDeposits: boolean = false;
        let allowOnlySpecific: boolean = false;
        if (this.product["collection"]) {
            allowOnlyDeposits = this.isNft && this.product["collection"]["price"];
        }

        if (this.product["collection"] && this.product["collection"]["priceCurrency"]) {
            allowOnlyDeposits = true;
            this.allowOnlySpecific = true;
            allowOnlySpecific = true;
        }

        if (this.product["collection"] && this.product["collection"]["user_responsible"]) {
            this.allowOnlySpecific = true;
        }

        // Start of observables to fill the forkjoin
        const quotations = this.accountService.quotations(UnitOfMoney.USD).pipe(
            catchError(error => {
                return of(null);
            })
        );

        const authentication = this.accountService.isAuthenticated(false, false).pipe(
            catchError(error => {
                return of(null);
            })
        );

        const featureStatusRequests = [
            this.featuresStatusService.getFeatureStatus(FeatureNames.PAYMENT_WITH_CIELO, true).pipe(
                catchError(error => {
                    return of(null);
                })
            ),
            this.featuresStatusService.getFeatureStatus(FeatureNames.BRLA, true).pipe(
                catchError(error => {
                    return of(null);
                })
            ),
            this.featuresStatusService.getFeatureStatus(FeatureNames.CELCOIN_INTEGRATION, true).pipe(
                catchError(error => {
                    return of(null);
                })
            ),
            this.featuresStatusService.getFeatureStatus(FeatureNames.NFT_RESALE).pipe(
                catchError(error => {
                    return of(null);
                })
            ),
            this.featuresStatusService.getFeatureStatus(FeatureNames.PAG_SEGURO, true).pipe(
                catchError(error => {
                    return of(null);
                })
            ),
            this.featuresStatusService.getFeatureStatus(FeatureNames.FIAT_PAYMENTS, false).pipe(
                catchError(error => {
                    return of(null);
                })
            ),
            this.featuresStatusService.getFeatureStatus(FeatureNames.FIAT_DEPOSITS, false).pipe(
                catchError(error => {
                    return of(null);
                })
            ),
            this.featuresStatusService.getFeatureStatus(FeatureNames.CLEAR_LEDGER, false).pipe(
                catchError(error => {
                    return of(null);
                })
            ),
            this.featuresStatusService.getFeatureStatus(FeatureNames.BRASIL_CASH, false).pipe(
                catchError(error => {
                    return of(null);
                })
            ),
            this.featuresStatusService.getFeatureStatus(FeatureNames.TRANSFERA, false).pipe(
                catchError(error => {
                    return of(null);
                })
            ),
            this.featuresStatusService.getFeatureStatus(FeatureNames.DEPOSITS_HANDLING, false).pipe(
                catchError(error => {
                    return of(null);
                })
            ),
            this.featuresStatusService.getFeatureStatus(FeatureNames.DIGITAL_BANKING, false).pipe(
                catchError(error => {
                    return of(null);
                })
            ),
            this.accountService.getLoggedUserDetails().pipe(
                catchError(error => {
                    return of(null);
                })
            )
        ];
        // End of observables to fill the forkjoin

        combineLatest([quotations, authentication, ...featureStatusRequests]).subscribe(async (results: any) => {
            // The first position is the USD quote return
            this.usdQuotation = results[0];

            // The second position is the authentication return
            this.isAuthenticated = results[1];

            // The other positions correspond to the status of the features
            const [
                allowCielo, allowBRLAPayments, allowCelcoinIntegrationPayments, isResellAllowed,
                allowPagSeguro, allowFiat, allowFiatDeposits, allowClearLedger,
                allowBrasilCash, allowTransfera, allowDeposits, allowDigitalBanking, accountDetails
            ] = results.slice(2); // Starts after previous results.

            this.allowCielo = allowCielo && !allowOnlyDeposits;
            this.allowBRLAPayments = allowBRLAPayments;
            this.allowCelcoinIntegrationPayments = allowCelcoinIntegrationPayments;
            this.isResellAllowed = isResellAllowed;
            this.allowPagSeguro = allowPagSeguro && !allowOnlyDeposits;
            this.allowFiat = allowFiat;
            this.allowFiatDeposits = allowFiatDeposits && !allowOnlySpecific;
            this.allowClearLedger = allowClearLedger && !allowOnlySpecific;
            this.allowBrasilCash = allowBrasilCash && !allowOnlySpecific;
            this.allowTransfera = allowTransfera && !allowOnlySpecific;
            this.allowDeposits = allowDeposits && !allowOnlyDeposits;

            if (accountDetails?.bankingAccount?.bankStatus === BaaSAccountStatus.ATIVO || accountDetails?.bankingAccount?.bankStatus === BaaSAccountStatus.CONFIRMED) {
                this.allowDigitalBanking = allowDigitalBanking;
            }

            if(this.allowBRLAPayments) {
                this.accountService.getBRLAKYCStatus().subscribe(brlaKycResp => {
                    if (brlaKycResp && brlaKycResp?.history && brlaKycResp?.history?.length > 0) {
                        for (let hist of brlaKycResp?.history) {
                            if (hist.status === 'APPROVED' && hist.level === 2) {
                                this.brlaAccountApproved = true;
                            }
        
                            if (hist?.limits) {
                                if (hist?.limits?.limitSwapBuy) {
                                    this.brlaBuyLimit = new BigNumber(hist?.limits?.limitSwapBuy).dividedBy(100);
                                }
                            }
        
                            if (this.brlaAccountApproved) {
                                break;
                            }
                        }
                    }
                });
            }

        }).add(() => {
            this.nftTransactionTaxFiat = new BigNumber(this.assetsService.getAssetTransactionTaxPrice(this.product, this.isResellAllowed));

            this.loadingFeatureStatus = false;

            if (this.isAuthenticated) {
                combineLatest([
                    this.tokensService.getTokens(),
                    this.accountService.allQuotations(),
                    this.accountService.allBalances()
                ]).subscribe(async ([tokens, quotes, balances]) => {
                    this.tokens = tokens as any;
                    this.quotes = quotes || [] as any;
                    this.balances = balances || [] as any;
                    this.token = this.tokens?.find(tkn => tkn.id === this.unitOfMoney) as Token;

                    this.definePaymentMethod(this.quotes, this.balances);
                }, error => {
                    this.showCriticalError = true;
                    this.errorOnLoading.emit(true);
                }).add(() => {
                    this.verifyIfCanPayByMetaMask();
                    this.loadingTokens = false;
                    this.loading = false;
                });
            } else {
                combineLatest([
                    this.tokensService.getTokens(),
                    this.accountService.allQuotations()
                ]).subscribe(async ([tokens, quotes]) => {
                    this.tokens = tokens as any;
                    this.quotes = quotes || [] as any;
                    this.balances = [] as any;
                    this.token = this.tokens?.find(tkn => tkn.id === this.unitOfMoney) as Token;

                    this.definePaymentMethod(this.quotes, this.balances);
                    this.notAuthenticated = true;
                }, error => {
                    this.showCriticalError = true;
                    this.errorOnLoading.emit(true);
                }).add(() => {
                    this.verifyIfCanPayByMetaMask();
                    this.loadingTokens = false;
                    this.loading = false;
                });
            }
        });
    }

    public verifyIfCanPayByMetaMask(): void {
        if (this.product) {
            if (this.product instanceof Token) {
                this.hasCryptoInPaymentList = this.tokens.filter(token => token?.usedToPay).length > 0;
            } else {
                this.hasCryptoInPaymentList = this.options.filter(opt =>
                    opt.name === this.tokens.find(tkn => tkn.id === opt.name && tkn.allow_metamask && !opt.isSplitted)?.id
                ).length > 0;
            }
        }
    }

    public verifyDisableMetaMaskButton(): boolean {
        if (
            this.loading || !this.metaParameters?.hasEthereum || !this.metaParameters?.parameters ||
            !this.option || this.option === this.fiatCurrency?.currency || this.option === PaymentTypesEnum.CIELO ||
            !this.hasCryptoInPaymentList
        ) {
            return true;
        }
        return false;
    }

    /**
     * This method will connect in metamask or similar, and collect the user account that is approved
     */
    private async getMetaMaskAccount(): Promise<void> {
        let accounts: Array<string> = [];

        try {
            accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        } catch (e: any) {
            // If it already processing in Chrome, it's necessary to be able to open again
            if (e.code === -32002) {
                try {
                    accounts = await (window as any).ethereum.request({
                        method: "wallet_requestPermissions",
                        params: [{
                            eth_accounts: {}
                        }]
                    }).then(() => (window as any).request({
                        method: 'eth_requestAccounts'
                    }));

                } catch (error) {
                    this.finalizeProcessingForMetamask();
                    throw error;
                }
            } else {
                this.finalizeProcessingForMetamask();
                throw e;
            }
        }

        this.metaParameters.accounts = accounts || [];
    }

    private finalizeProcessingForMetamask(): void {
        this.loading = false;
        this.waitingMetaMaskOutput.emit(false);
        this.waitingMetaMask = false;
    }

    public definePaymentMethod(quotes: AmountConvertedResult[], balances: PlatformBalance[]): void {
        this.loading = true;

        if (this.product?.id !== 'tBRL') {
            for (let payment of this.checkoutObject?.paymentTypes) {
                const quote = quotes?.find(quote => payment.unitOfMoney === quote.currency);
                const balance = balances?.find(blc => blc.unitOfMoney === payment.unitOfMoney);
                let quotationFiat: BigNumber | undefined = this.fiatCurrency.currency === UnitOfMoney.USD ? quote?.amountUsd : quote?.amount;
                let purchasePrice: BigNumber = new BigNumber(0);
                let maxPaymentValue: BigNumber = new BigNumber(0);
                let enoughBalance: boolean = false;
                const hasSomeBalance: boolean = Number(balance?.balance) > 0;
                const splitPayment: boolean = payment.percentage > 0;

                let unitValue: number = 0;

                /**
                 * Check if there is any exchange lock
                 */
                if (new BigNumber((balance?.fiatLock as any)).isGreaterThan(new BigNumber(0))) {
                    let unitQuote: BigNumber = new BigNumber((balance?.fiatLock as any)).dividedBy(new BigNumber((balance?.balance as any)));
                    unitValue = new BigNumber(this.checkoutObject.price).dividedBy(new BigNumber(unitQuote).decimalPlaces(environment.decimalsPlacesBought, BigNumber.ROUND_FLOOR)).toNumber();
                } else if (splitPayment) {
                    unitValue = this.checkoutObject.price.multipliedBy(payment.percentage).dividedBy(100).dividedBy(new BigNumber((quotationFiat as any)).decimalPlaces(environment.decimalsPlacesBought, BigNumber.ROUND_FLOOR)).toNumber();
                } else {
                    if (this.allowOnlySpecific) {
                        unitValue = new BigNumber(this.checkoutObject.price).toNumber();
                    } else {
                        unitValue = new BigNumber(this.checkoutObject.price).dividedBy(new BigNumber((quotationFiat as any)).decimalPlaces(environment.decimalsPlacesBought, BigNumber.ROUND_FLOOR)).toNumber();
                    }
                }

                if (hasSomeBalance) {
                    purchasePrice = this.checkoutObject.quantity.multipliedBy(this.checkoutObject.price);
                    maxPaymentValue = new BigNumber((quotationFiat as any)).multipliedBy((balance?.balance as any));

                    if(this.allowOnlySpecific) {
                        if (new BigNumber((balance?.balance as any)).isGreaterThanOrEqualTo(this.checkoutObject.price)) {
                            enoughBalance = true;
                        } else {
                            enoughBalance = false;
                        }
                    } else {
                        if (maxPaymentValue.isGreaterThanOrEqualTo(purchasePrice)) {
                            enoughBalance = true;
                        } else {
                            enoughBalance = false;
                        }
                    }
                }

                let tax;
                if (this.isNft) {
                    const token = this.tokens.find(tkn => tkn.id === payment.unitOfMoney);
                    const nftTransactionTax: BigNumber = this.nftTransactionTaxFiat.dividedBy((quotationFiat as any));

                    if ((token?.nft_buy_tax ?? 0) > 0) {
                        tax = this.calculateTaxValue(new BigNumber(unitValue), new BigNumber(token?.nft_buy_tax || 0), token?.tax_type as string, new BigNumber((quote?.amountUsd as any)))?.toNumber();
                    }

                    if (nftTransactionTax) {
                        tax = new BigNumber(tax || 0).plus(nftTransactionTax || 0);
                    }

                    unitValue = new BigNumber(unitValue || 0).plus(new BigNumber(tax || 0)).toNumber();
                } else {
                    const token = this.tokens.find(tkn => tkn.id === payment.unitOfMoney);
                    if ((token?.tokens_buy_tax ?? 0) > 0) {
                        tax = this.calculateTaxValue(new BigNumber(unitValue), new BigNumber((token?.tokens_buy_tax as any)), token?.tax_type as string, new BigNumber((quote?.amountUsd as any)))?.toNumber();
                        if (new BigNumber(tax).isGreaterThan(new BigNumber(0))) {
                            unitValue = new BigNumber(unitValue).plus(tax).toNumber();
                        }
                    }
                }

                if ((this.allowOnlySpecific || hasSomeBalance) || splitPayment) {
                    this.checkPaymentMethod(payment.unitOfMoney, true, unitValue,
                        enoughBalance, true, false, payment.percentage > 0, (tax as number), new BigNumber(0));
                }
            }
        }

        let productPrice: number = Number(this.checkoutObject.price);
        let userBalance: BigNumber | undefined = balances?.find(blc => blc.unitOfMoney === 'tBRL')?.balance;
        let userBalanceNumber: number = Number(userBalance);


        if (this.allowFiatDeposits === true) {
            this.checkPaymentMethod(this.payTypeDeposits, true, undefined, true, false, false, false, this.nftTransactionTaxFiat.toNumber(), new BigNumber(0));
        }

        if (this.allowCielo === true) {
            this.checkPaymentMethod(this.payTypeCielo, true, undefined, true, false, false, false, new BigNumber(this.token?.token_buy_with_cielo_tax || 0).plus(new BigNumber(this.nftTransactionTaxFiat)).toNumber(), new BigNumber(0));
        }

        if (this.allowBRLAPayments === true) {
            this.checkPaymentMethod(this.payTypeBRLA, this.isBrlaAccept(), undefined, true, false, false, false, new BigNumber(this.token?.token_buy_with_cielo_tax || 0).plus(new BigNumber(this.nftTransactionTaxFiat)).toNumber(), new BigNumber(this.brlaBuyLimit));
        }

        if (this.allowCelcoinIntegrationPayments === true) {
            this.checkPaymentMethod(this.payTypeCelcoinIntegration, true, undefined, true, false, false, false, new BigNumber(this.token?.token_buy_with_cielo_tax || 0).plus(new BigNumber(this.nftTransactionTaxFiat)).toNumber(), new BigNumber(0));
        }

        if (this.allowPagSeguro === true) {
            this.checkPaymentMethod(this.payTypePagSeguro, true, undefined, true, false, false, false, new BigNumber(this.token?.token_buy_with_pagseguro_tax || 0).plus(new BigNumber(this.nftTransactionTaxFiat)).toNumber(), new BigNumber(0));
        }

        //Deposits are only implemented to cover Token buy situation
        if (this.allowClearLedger === true) {
            this.checkPaymentMethod(this.payTypeClearLedger, true, undefined, true, false, false, false, this.nftTransactionTaxFiat.toNumber(), new BigNumber(0));
        }

        //Deposits are only implemented to cover Token buy situation
        if (this.allowBrasilCash === true) {
            this.checkPaymentMethod(this.payTypeBrasilCash, true, undefined, true, false, false, false, this.nftTransactionTaxFiat.toNumber(), new BigNumber(0));
        }

        if (this.allowTransfera === true) {
            this.checkPaymentMethod(this.payTypeTransfera, true, undefined, true, false, false, false, this.nftTransactionTaxFiat.toNumber(), new BigNumber(0));
        }

        if (this.allowDigitalBanking === true) {
            this.checkPaymentMethod(this.payTypeDigitalBanking, true, undefined, true, false, false, false, this.nftTransactionTaxFiat.toNumber(), new BigNumber(0));
        }

        this.options = this.options.sort((first, second) => {
            if (!first.isSplitted && second.isSplitted) {
                return -1;
            }
            if (first.isSplitted && !second.isSplitted) {
                return 1;
            }

            if (first.isSplitted && second.isSplitted) {
                return 0;
            }

            return 0;
        });
        this.loading = false;
        this.splitTabOptions();
    }

    public isBrlaAccept(): boolean {
        return this.allowBRLAPayments &&
            this.checkoutObject?.data?.brlaIntegration; // To identify if a token have the BRLA integration available.
    }

    public isBrlaEnoughBalance(): boolean {
        return new BigNumber(this.checkoutObject.quantity.multipliedBy(this.checkoutObject.price)).isLessThanOrEqualTo(new BigNumber(this.brlaBuyLimit));
    }

    public checkPaymentMethod(name: string, accept: boolean, value: number | undefined, enoughBalance: boolean,
        showMissingBalance: boolean, isMandatory: boolean, isSplitted: boolean, tax: number, limitToBuy: BigNumber = new BigNumber(0)): void {
        /**
         * If we dont have the deposit feature, the missing balance flag should not appear
         */
        if (showMissingBalance) {
            showMissingBalance = this.allowDeposits;
        }

        if (accept) {
            if (isMandatory && !enoughBalance) {
                this.enoughBalance = false;
            }

            if(enoughBalance === true){
                this.options.push({
                    name: name,
                    value: new BigNumber((value as any)).multipliedBy(this.checkoutObject.quantity).toNumber(), // If is tokens, we need multiply
                    allowed: enoughBalance,
                    // To show missing balance message if user doesn't have balance for this type of payment
                    showMissingBalance: !enoughBalance,
                    isMandatory: isMandatory,
                    isSplitted: isSplitted,
                    showTax: tax > 0,
                    taxValue: tax as any,
                    limitToBuy: limitToBuy ? limitToBuy : new BigNumber(0)
                });
            }

        }
    }

    // Separate option in two tabs (tokens / traditional)
    public splitTabOptions(): void {
        if (this.options.length > 0) {
            this.cryptoOptions = this.options.filter(method => !this.isTraditional(method?.name));
            this.traditionalOptions = this.options.filter(method => this.isTraditional(method?.name));
            // To avoid pay tokens with the same coin =)
            if (this.checkoutObject.data instanceof Token) {
                this.cryptoOptions = this.cryptoOptions.filter(opt => opt.name !== this.checkoutObject.data.id);

            }
            if (this.cryptoOptions.length === 0 && this.traditionalOptions.length > 0) {
                this.selectedTab = 1;
            }
        } else {
            this.showCriticalError = true;
            this.errorOnLoading.emit(true);
        }
    }

    public isTraditional(name: string): boolean {
        return name === this.payTypeCielo ||
            name === this.payTypeCelcoinIntegration ||
            name === this.payTypeBRLA ||
            name === this.fiatCurrency?.currency ||
            name === this.payTypeTransfera ||
            name === this.payTypeBrasilCash ||
            name === this.payTypeClearLedger ||
            name === this.payTypePagSeguro ||
            name === this.payTypeDeposits ||
            name === this.payTypeDigitalBanking;
    }

    public checkout(): void {
        let opt = this.options.find(opt => opt.name === this.option);

        if (opt) {
            if (!opt.allowed) {
                this.customSnackbar.open(this.translationConstants.translate('paymentModal.balanceError'), SnackBarTheme.error);
                this.loading = false;
                return;
            }
        } else if (this.option === PaymentTypesEnum.MULTICURRENCY) {
            opt = {
                name: PaymentTypesEnum.MULTICURRENCY,
                allowed: true,
                isMandatory: false,
                value: undefined
            };
        }

        if (opt?.name === this.payTypeCielo ||
            opt?.name === this.payTypeBrasilCash ||
            opt?.name === this.payTypePagSeguro) {
            this.externalCheckout(opt);
        } else if (opt?.name === this.payTypeDeposits) {
            this.depositCheckout(opt);
        } else if (opt?.name === this.payTypeBRLA) {
            this.depositBRLA(opt);
        } else if (opt?.name === this.payTypeCelcoinIntegration) {
            this.depositCelcoinIntegration(opt);
        } else if (opt?.name === this.payTypeClearLedger) {
            this.clearLedger(opt);
        } else if (opt?.name === this.payTypeTransfera) {
            this.transfera(opt);
        } else if (this.allowOnlySpecific) {
            this.loading = true;
            this.checkoutService.createCheckout(this.preparePaymentData((opt as PaymentTypeOption), opt?.value) as IOrderEvent)
                .subscribe(
                    ((checkoutData: IOrderEvent) => {
                        this.openNftPackageSuccess({
                            package_info: Object.assign({
                                short_name: (this.product as any)?.name
                            }),
                            nfts: [(this.product as any)]
                        });
                    }),
                    (err) => {
                        this.checkoutErrorRedirect('paymentModal.error.generic');
                    }
                )
                .add(() => {
                    this.loading = false;
                });
        } else {
            this.internalCheckout();
        }
    }

    public depositCheckout(paymentTypeChoosen: PaymentTypeOption): void {
        let totalAmountCalc: BigNumber = new BigNumber(0);
        if (paymentTypeChoosen.value) {
            totalAmountCalc = new BigNumber(paymentTypeChoosen.value);
        } else {
            totalAmountCalc = new BigNumber(this.checkoutObject.price).multipliedBy(this.checkoutObject.quantity);
        }

        if (this.fiatCurrency.currency === UnitOfMoney.USD) {
            totalAmountCalc = totalAmountCalc.multipliedBy((this.usdQuotation?.amount as any));
        }

        let nftTransactionTax = new BigNumber(0);

        if (this.isNft) {
            nftTransactionTax = this.nftTransactionTaxFiat;
        }

        const dialogRef: MatDialogRef<FiatDepositModalComponent> = this.dialog.open(FiatDepositModalComponent, {
            data: {
                amount: totalAmountCalc.plus(nftTransactionTax),
                unitOfMoney: this.unitOfMoney,
                coin_amount: this.checkoutObject.quantity,
                isNftBuy: this.product instanceof Assets || this.product instanceof NFTPackage,
                assetId: this.product instanceof Assets ? this.product?.id : undefined,
                packageId: this.product instanceof NFTPackage ? this.product?.id : undefined,
                nftId: this.product instanceof Assets ? this.product?.nftId : undefined,
                external_id: this.checkoutObject.external_id,
                user_email: this.checkoutObject.email
            },
            maxWidth: '600px'
        });

        dialogRef.afterClosed().subscribe((completed: boolean) => {
            // Close all dialogs only if the operation has completed.
            if (completed) {
                this.finishOperation.emit(true);
            }
        });
    }

    public externalCheckout(paymentTypeChoosen: PaymentTypeOption): void {
        this.loading = true;
        let orderEvent = this.preparePaymentData(paymentTypeChoosen) as any;
        this.checkoutService.createCheckout(orderEvent)
            .subscribe(
                ((checkoutData: IOrderEvent) => {
                    if (checkoutData.callbackURL) {
                        if (paymentTypeChoosen.name === PaymentTypesEnum.CIELO) {
                            this.dialog.open(PagseguroModalComponent, {
                                data: {
                                    url: checkoutData?.callbackURL,
                                    processor: 'Cielo'
                                }
                            });
                        } else if (paymentTypeChoosen.name === PaymentTypesEnum.COIN_PAYMENTS) {
                            this.dialog.open(PagseguroModalComponent, {
                                data: {
                                    url: checkoutData?.callbackURL,
                                    processor: 'CoinPayments'
                                }
                            });
                        } else if (paymentTypeChoosen.name === PaymentTypesEnum.BRASIL_CASH) {
                            this.dialog.open(PagseguroModalComponent, {
                                data: {
                                    url: checkoutData?.callbackURL,
                                    processor: 'BrasilCash'
                                }
                            });
                        }
                    } else if (paymentTypeChoosen.name === PaymentTypesEnum.PAGSEGURO && checkoutData.transactionId) {
                        this.dialog.open(PagseguroModalComponent, {
                            data: {
                                url: `https://pagseguro.uol.com.br/v2/checkout/payment.html?code=${checkoutData.transactionId}`,
                                processor: 'PagSeguro'
                            }
                        });
                    } else {
                        this.checkoutErrorRedirect('paymentModal.error.generic');
                    }

                    this.pixel.trackPurchase({
                        name: orderEvent?.unitOfMoney,
                        value: orderEvent?.tokensAmount
                    });
                }),
                (err) => {
                    this.checkoutErrorRedirect('paymentModal.error.generic');
                }
            )
            .add(() => {
                this.loading = false;
            });
    }

    private preparePaymentNFTData(paymentType: string, nft: Assets, tokenAmount?: any): IOrderEvent {
        let taxAmount = new BigNumber(0);
        let fiatTransactionTax = new BigNumber(0);
        let nftTokenTransactionTax = new BigNumber(0);

        if (this.getCorrectPaymentMethodForCheckout(paymentType) === 'TOKEN') {
            let token = this.tokens.find(tkn => tkn.id === paymentType);

            nftTokenTransactionTax = this.nftTransactionTaxFiat.dividedBy((this.usdQuotation?.amountUsd as any));

            if ((token?.nft_buy_tax ?? 0) > 0) {
                taxAmount = this.calculateTaxValue(new BigNumber(this.checkoutObject.price), new BigNumber((token?.nft_buy_tax as any)), token?.tax_type as string, new BigNumber((this.usdQuotation?.amountUsd as any)));
            }

        } else {
            fiatTransactionTax = this.nftTransactionTaxFiat;
        }

        const orderEvent: IOrderEvent = {
            id: undefined,
            status: 'CREATED',
            shippingAmount: new BigNumber(0),
            taxAmount: taxAmount.plus(fiatTransactionTax),
            totalAmount: new BigNumber(this.checkoutObject.price)?.plus(fiatTransactionTax),
            paymentMethod: this.getCorrectPaymentMethodForCheckout(paymentType),
            expirationDate: undefined,
            userId: undefined,
            userEmail: this.notAuthenticated ? this.checkoutObject?.email : undefined,
            shoppingCartId: undefined,
            storeId: 'TEMP',
            isTokenBuy: false,
            isNftBuy: true,
            unitOfMoney: paymentType,
            unit_of_money: paymentType,
            assetId: nft.id,
            packageId: undefined,
            nftId: nft.nftId,
            wantedPrice: this.checkoutObject.price.plus(nftTokenTransactionTax.isGreaterThan(0) ? nftTokenTransactionTax : fiatTransactionTax),
            external_id: this.checkoutObject.external_id,
            tokensAmount: new BigNumber(tokenAmount || this.checkoutObject.price).minus(taxAmount || 0).plus(nftTokenTransactionTax.isGreaterThan(0) ? nftTokenTransactionTax : fiatTransactionTax),
            createdAt: new Date(),
            updatedAt: undefined,
            hmac: undefined,
            transactionId: undefined,
            address_id: undefined,
            items: undefined
        } as IOrderEvent;

        return orderEvent;
    }

    private preparePaymentNFTPackageData(paymentType: string, nftPackage: NFTPackage): IOrderEvent {
        const orderEvent: IOrderEvent = {
            id: undefined,
            status: 'CREATED',
            shippingAmount: new BigNumber(0),
            totalAmount: this.fiatCurrency?.currency === UnitOfMoney.BRL ? new BigNumber(this.checkoutObject.price) : new BigNumber(this.checkoutObject.price).multipliedBy((this.usdQuotation?.amount as any)),
            paymentMethod: this.getCorrectPaymentMethodForCheckout(paymentType),
            expirationDate: undefined,
            userId: undefined,
            userEmail: this.notAuthenticated ? this.checkoutObject?.email : undefined,
            shoppingCartId: undefined,
            storeId: 'TEMP',
            isTokenBuy: false,
            isNftBuy: true,
            assetId: undefined,
            packageId: nftPackage.id,
            nftId: undefined,
            tokensAmount: undefined,
            createdAt: new Date(),
            updatedAt: undefined,
            hmac: undefined,
            transactionId: undefined,
            address_id: undefined,
            items: undefined
        } as IOrderEvent;

        return orderEvent;
    }

    private preparePaymentTokenData(paymentTypeChoosen: PaymentTypeOption, token: Token): IOrderEvent {
        let totalAmountCalc: BigNumber = new BigNumber(0);
        const paymentType: string = paymentTypeChoosen.name;
        if (paymentTypeChoosen.value) {
            totalAmountCalc = new BigNumber(paymentTypeChoosen.value);

            if (paymentTypeChoosen?.taxValue) {
                totalAmountCalc = totalAmountCalc.minus(new BigNumber(paymentTypeChoosen?.taxValue)) /** Lets not charge twice */
            }

        } else {
            totalAmountCalc = new BigNumber(this.checkoutObject.price).multipliedBy(this.checkoutObject.quantity);
        }
        if ((paymentType === PaymentTypesEnum.CIELO || paymentType === PaymentTypesEnum.PAGSEGURO || paymentType === PaymentTypesEnum.DIGITAL_BANKING) && this.fiatCurrency.currency === UnitOfMoney.USD) {
            totalAmountCalc = totalAmountCalc.multipliedBy((this.usdQuotation?.amount as any));
        }

        let taxAmount = new BigNumber(paymentTypeChoosen?.taxValue || 0);
        if (paymentType === PaymentTypesEnum.CIELO && this.token?.token_buy_with_cielo_tax > 0) {
            const taxPercentage: BigNumber = new BigNumber(this.token?.token_buy_with_cielo_tax).dividedBy(100);
            taxAmount = new BigNumber(totalAmountCalc).multipliedBy(taxPercentage);
        }

        if (paymentType === PaymentTypesEnum.COIN_PAYMENTS && this.token?.token_buy_with_coinpayments_tax > 0) {
            const taxPercentage: BigNumber = new BigNumber(this.token?.token_buy_with_coinpayments_tax).dividedBy(100);
            taxAmount = new BigNumber(totalAmountCalc).multipliedBy(taxPercentage);
        }

        if (paymentType === PaymentTypesEnum.PAGSEGURO && this.token?.token_buy_with_pagseguro_tax > 0) {
            const taxPercentage: BigNumber = new BigNumber(this.token?.token_buy_with_pagseguro_tax).dividedBy(100);
            taxAmount = new BigNumber(totalAmountCalc).multipliedBy(taxPercentage);
        }

        if (paymentType === PaymentTypesEnum.DIGITAL_BANKING && this.token?.token_buy_with_digital_banking > 0) {
            const taxPercentage: BigNumber = new BigNumber(this.token?.token_buy_with_digital_banking).dividedBy(100);
            taxAmount = new BigNumber(totalAmountCalc).multipliedBy(taxPercentage);
        }

        const orderEvent: IOrderEvent = {
            id: undefined,
            status: 'CREATED',
            shippingAmount: new BigNumber(0),
            totalAmount: totalAmountCalc,
            taxAmount: taxAmount,
            paymentMethod: this.getCorrectPaymentMethodForCheckout(paymentType),
            expirationDate: undefined,
            userId: undefined,
            userEmail: this.notAuthenticated ? this.checkoutObject?.email : undefined,
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
            unitOfMoney: paymentType !== PaymentTypesEnum.CIELO && paymentType !== PaymentTypesEnum.CELCOIN_INTEGRATION && paymentType !== PaymentTypesEnum.DIGITAL_BANKING && paymentType !== PaymentTypesEnum.COIN_PAYMENTS && paymentType !== PaymentTypesEnum.PAGSEGURO ? paymentType : this.product.id, // Option selected (coin used to pay)
            unit_purchased: token.id // Coin that is being purchased
        } as IOrderEvent;

        return orderEvent;
    }

    public getCorrectPaymentMethodForCheckout(paymentType: string): string {
        if (paymentType !== PaymentTypesEnum.BRASIL_CASH && paymentType !== PaymentTypesEnum.TRANSFERA && paymentType !== PaymentTypesEnum.CELCOIN_INTEGRATION && paymentType !== PaymentTypesEnum.DIGITAL_BANKING && paymentType !== PaymentTypesEnum.CIELO && paymentType !== PaymentTypesEnum.COIN_PAYMENTS && paymentType !== PaymentTypesEnum.CLEAR_LEDGER && paymentType !== PaymentTypesEnum.PAGSEGURO) {
            return 'TOKEN';
        } else {
            return paymentType;
        }
    }

    private preparePaymentData(paymentType: PaymentTypeOption, tokenAmount?: any): IOrderEvent | undefined {
        if (this.product instanceof Assets) {
            return this.preparePaymentNFTData(paymentType.name, this.product, tokenAmount);
        } else if (this.product instanceof NFTPackage) {
            return this.preparePaymentNFTPackageData(paymentType.name, this.product)
        } else if (this.product instanceof Token) {
            return this.preparePaymentTokenData(paymentType, this.product)
        }
        return undefined;
    }

    private internalNFTCheckout(data: Assets): void {
        const selectedOption: PaymentTypeOption | undefined = this.options.find(opt => opt?.name === this.option);
        this.assetsService.buyNFTs({
            assetId: data.id,
            nftId: data.nftId as string,
            tax: selectedOption ? (selectedOption.taxValue as string) : '',
            blockchainId: data.blockchainId as string,
            unitOfMoney: this.option,
            hash: this.metaParameters.hash as string,
            wantedPrice: this.checkoutObject.price,
            principalAmount: true ? undefined : selectedOption ? (selectedOption?.value as any) : ''
        }).subscribe((() => {
            this.openNftPackageSuccess({
                package_info: Object.assign({
                    short_name: data.name
                }),
                nfts: [data]
            });

            this.pixel.trackPurchase({
                name: data.id as string,
                value: selectedOption?.value as any
            });
            this.customSnackbar.open(this.translationConstants.translate('Parabéns! Você está recebendo a sua NFT Digital!'), SnackBarTheme.success, 8000);
            this.finishOperation.emit(true);
            this.router.navigate(['/wallet'], { queryParams: { selectedTab: 1, selectedView: EViewMode.GRID, scrollCards: true } })
        }), (err) => {
            if (err?.error?.message?.includes('An identical transfer has been made in a shorter period than')) {
                this.checkoutErrorRedirect('paymentModal.error.repeatedTransactions');
            } else {
                this.checkoutErrorRedirect('paymentModal.error.generic');
            }
        }).add(() => {
            this.finalizeProcessingForMetamask();
        })
    }

    private internalNFTPackageCheckout(data: NFTPackage): void {
        const selectedOption: PaymentTypeOption | undefined = this.options.find(opt => opt?.name === this.option);

        this.assetsService.buyPackage({
            assetId: data.id,
            unitOfMoney: this.option,
            tax: selectedOption ? (selectedOption.taxValue as string) : '',
            hash: this.metaParameters.hash as string,
            principalAmount: true ? undefined : selectedOption ? (selectedOption?.value as any) : ''
        }).subscribe(((checkoutData: NFTPackageBought) => {
            // Open animation
            this.openNftPackageSuccess(checkoutData);
        }), (err: any) => {
            let errorCode: string = 'paymentModal.packageError.default';
            if (err?.error?.message?.includes("Amount of available NFTs is smaller than the amount of required NFTs to build the package")) {
                errorCode = 'paymentModal.packageError.amount'
            }
            this.checkoutErrorRedirect(errorCode);
        }).add(() => {
            this.finalizeProcessingForMetamask();
        });
    }

    private internalTokenCheckout(data: Token): void {
        const selectedOption: PaymentTypeOption | undefined = this.options.find(opt => opt?.name === this.option);

        this.loading = true;
        this.checkoutService.createCheckout(this.preparePaymentTokenData((selectedOption as PaymentTypeOption), data))
            .subscribe(
                ((checkoutData: IOrderEvent) => {
                    this.customSnackbar.open(this.translationConstants.translate('checkout.message'), SnackBarTheme.success);
                    this.waitingMetaMaskOutput.emit(false);
                    this.finishOperation.emit(true);
                }),
                (err) => {
                    if (err?.error?.message.includes('You cannot buy more than')) {
                        this.checkoutErrorRedirect('tokenProfile.paymentModal.dailyLimitExceeded');
                    } else if (err.error?.message?.includes('CBE098')) {
                        //balance is not enough
                        this.checkoutErrorRedirect('banking.transfers.error.CBE098');
                    } else {
                        this.checkoutErrorRedirect('paymentModal.error.generic');
                    }
                }
            )
        .add(() => {
            this.finalizeProcessingForMetamask();
        });
    }

    public internalCheckout(): void {
        this.loading = true;
        if (this.product instanceof Assets) {
            this.internalNFTCheckout(this.product);
        } else if (this.product instanceof NFTPackage) {
            this.internalNFTPackageCheckout(this.product);
        } else if (this.product instanceof Token) {
            this.internalTokenCheckout(this.product);
        }
    }

    private checkoutErrorRedirect(errorCode: string): void {
        this.customSnackbar.open(this.translationConstants.translate(errorCode), SnackBarTheme.error, 4000);
    }

    public openNftPackageSuccess(packageBought: NFTPackageBought): void {
        this.nftPackageResponse = packageBought;
        this.nftSuccessClose = false;
    }

    public closeNftSuccess(event: boolean): void {
        if (event) {
            this.nftSuccessClose = true;
            this.finishOperation.emit(true);
        }
    }

    public hasAnyEnoughBalance(): boolean {
        //Check whether any of payment types has enough balance to pay.
        if (this.selectedTab === 0) {
            return this.cryptoOptions.filter(data => data.allowed).length > 0;
        } else {
            return this.traditionalOptions.filter(data => data.allowed).length > 0;
        }
    }

    public toggleAdd(name: string, enableButton: boolean): void {
        if (name === PaymentTypesEnum.MULTICURRENCY) {
            this.option = PaymentTypesEnum.MULTICURRENCY;
        } else {
            this.option = name;
        }
        this.enablePaymentButton = enableButton;
    }

    public onSelectedTabPaymentChange(tab: MatTabChangeEvent) {
        this.selectedTab = tab.index;

        if (this.selectedTab === 1) {
            this.toggleAdd(this.traditionalOptions[0]?.name, true);
        } else {
            this.toggleAdd('', false);
        }
    }

    public openMetaMaskLinkToInstall(): void {
        window.open(this.linkToInstallMetamask, '_blank');
    }

    public depositBRLA(paymentTypeChoosen: PaymentTypeOption): void {
        let totalAmountCalc: BigNumber = new BigNumber(0);
        if (paymentTypeChoosen.value) {
            totalAmountCalc = new BigNumber(paymentTypeChoosen.value);
        } else {
            totalAmountCalc = new BigNumber(this.checkoutObject.price).multipliedBy(this.checkoutObject.quantity);
        }

        if (this.fiatCurrency.currency === UnitOfMoney.USD) {
            totalAmountCalc = totalAmountCalc.multipliedBy((this.usdQuotation?.amount as any));
        }

        // const dialogRef = this.dialog.open(BRLADepositsModalComponent, {
        //     panelClass: 'modal',
        //     data: {
        //         amount: totalAmountCalc,
        //         unitOfMoney: this.unitOfMoney,
        //         coin_amount: this.checkoutObject.quantity,
        //         validatedFromPaymentCheckout: this.brlaAccountApproved &&
        //             new BigNumber(this.checkoutObject?.price).multipliedBy(this.checkoutObject?.quantity).isLessThanOrEqualTo(new BigNumber(this.brlaBuyLimit))
        //     },
        //     maxWidth: '600px'
        // });
    }

    public depositCelcoinIntegration(paymentTypeChoosen: PaymentTypeOption): void {
        let totalAmountCalc: BigNumber = new BigNumber(0);
        if (paymentTypeChoosen.value) {
            totalAmountCalc = new BigNumber(paymentTypeChoosen.value);
        } else {
            totalAmountCalc = new BigNumber(this.checkoutObject.price).multipliedBy(this.checkoutObject.quantity);
        }

        let nftTransactionTax = new BigNumber(0);

        nftTransactionTax = new BigNumber(this.assetsService.getAssetTransactionTaxPrice(this.product, this.isResellAllowed) || 0);

        if (this.fiatCurrency.currency === UnitOfMoney.USD) {
            totalAmountCalc = totalAmountCalc.multipliedBy((this.usdQuotation?.amount as any));

            nftTransactionTax = nftTransactionTax.multipliedBy((this.usdQuotation?.amount as any));
        }

        totalAmountCalc = totalAmountCalc.plus(nftTransactionTax);

        this.loading = true;
        this.checkoutService.createCheckout(this.preparePaymentData(paymentTypeChoosen) as IOrderEvent)
            .subscribe(
                ((checkoutData: IOrderEvent) => {
                    if (checkoutData.transactionId) {
                        this.dialog.open(ClearLedgerModalComponent, {
                            data:
                            {
                                info: {
                                    pixQrcode: checkoutData.transactionId,
                                    id: checkoutData.id,
                                    amount: totalAmountCalc
                                },
                                method: 'CELCOIN_INTEGRATION'
                            }
                        });
                    }
                    else {
                        this.checkoutErrorRedirect('paymentModal.error.generic');
                    }
                }),
                (err) => {
                    this.checkoutErrorRedirect('paymentModal.error.generic');
                }
            )
            .add(() => {
                this.loading = false;
            })
        ;
    }

    public checkHasCorrectQuantity(): boolean {
        const isGreatherThanZero = new BigNumber(this.checkoutObject.quantity).isGreaterThan(0);

        if (this.isNft) {
            let isOk: boolean = false;
            if (this.minToBuy) {
                isOk = isGreatherThanZero && new BigNumber(this.checkoutObject.price).isGreaterThanOrEqualTo(this.minToBuy);
            } else {
                isOk = true;
            }

            if (!isOk) {
                return isOk;
            }

            if (this.maxToBuy) {
                isOk = isGreatherThanZero && new BigNumber(this.checkoutObject.price).isLessThanOrEqualTo(this.maxToBuy);
            }

            if (!isOk) {
                return isOk;
            }

            return isGreatherThanZero;
        }

        if (this.token?.onlyInteger && !new BigNumber(this.checkoutObject.quantity).isInteger()) {
            return false;
        }

        if (this.minToBuy) {
            return isGreatherThanZero && new BigNumber(this.checkoutObject.quantity).isGreaterThanOrEqualTo(this.minToBuy);
        } else {
            return isGreatherThanZero;
        }
    }

    public calculateTaxValue(requestedValueToTransfer: BigNumber, taxAmount: BigNumber, taxType: string, dollarQuote: BigNumber): BigNumber {
        if (taxType === TaxItemType.Percentage) {
            const taxPercentage: BigNumber = new BigNumber(taxAmount).dividedBy(100);
            return new BigNumber(requestedValueToTransfer).multipliedBy(taxPercentage);
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

    public clearLedger(paymentTypeChoosen: PaymentTypeOption): void {
        this.loading = true;

        let nftTransactionTax = new BigNumber(0);
        nftTransactionTax = new BigNumber(this.assetsService.getAssetTransactionTaxPrice(this.product, this.isResellAllowed) || 0);

        let amountInUSD = this.checkoutObject.price;
        if (this.fiatCurrency.currency === UnitOfMoney.BRL) {
            amountInUSD = new BigNumber(amountInUSD).dividedBy((this.usdQuotation?.amount as any));
        } else {
            nftTransactionTax = nftTransactionTax.multipliedBy((this.usdQuotation?.amount as any));
        }

        const btcQuote = this.quotes?.find(qt => qt.currency === 'BTC')?.amountUsd;
        nftTransactionTax = nftTransactionTax.dividedBy((btcQuote as any));

        const totalInBtc = new BigNumber(amountInUSD).dividedBy((btcQuote as any)).plus(nftTransactionTax || 0);

        this.checkoutService.createCheckout(this.preparePaymentData(paymentTypeChoosen, totalInBtc) as IOrderEvent)
            .subscribe(
                ((checkoutData: IOrderEvent) => {
                    if (checkoutData.transactionId) {
                        this.dialog.open(ClearLedgerModalComponent, {
                            data:
                            {
                                info: {
                                    pixQrcode: checkoutData.transactionId,
                                    id: checkoutData.id,
                                    amount: totalInBtc
                                },
                                method: 'CLEARLEDGER'
                            }
                        });
                    }
                    else {
                        this.checkoutErrorRedirect('paymentModal.error.generic');
                    }
                }),
                (err) => {
                    this.checkoutErrorRedirect('paymentModal.error.generic');
                }
            )
            .add(() => {
                this.loading = false;
            });
    }

    public transfera(paymentTypeChoosen: PaymentTypeOption): void {
        this.loading = true;

        this.checkoutService.createCheckout(this.preparePaymentData(paymentTypeChoosen) as IOrderEvent)
            .subscribe(
                ((checkoutData: IOrderEvent) => {
                    if (checkoutData.transactionId) {
                        let dt: MatDialogRef<ClearLedgerModalComponent> = this.dialog.open(ClearLedgerModalComponent, {
                            data: {
                                info: {
                                    pixQrcode: checkoutData.transactionId,
                                    id: checkoutData.id,
                                    amount: checkoutData?.totalAmount
                                },
                                method: 'TRANSFERA'
                            }
                        });

                        dt?.afterClosed().subscribe(() => {
                            this.customSnackbar.open(this.translationConstants.translate('Aguarde até 1 hora para liberação da sua compra, após a confirmação do pagamento.'), SnackBarTheme.success, 4000);
                            setTimeout(() => {
                                this.finishOperation.emit(true);
                            }, 4000);
                        });
                    }
                    else {
                        this.checkoutErrorRedirect('paymentModal.error.generic');
                    }
                }),
                (err) => {
                    this.checkoutErrorRedirect('paymentModal.error.generic');
                }
            )
            .add(() => {
                this.loading = false;
            });
    }

    /**
     * Used to block the option if has reach the option transaction limit.
     */
    public valueReachLimit(option: PaymentTypeOption): boolean {
        if (new BigNumber((option?.limitToBuy as any)).isGreaterThan(0)) {
            return new BigNumber(this.checkoutObject.price).multipliedBy(this.checkoutObject.quantity).isGreaterThan(new BigNumber((option?.limitToBuy as any)));
        }
        return false;
    }

    /**
     * Used to block the buy button if the selected option has reach the option transaction limit.
     */
    public optionValueReachLimit(): boolean {
        const optionSelected = this.options.find(opt => opt.name === this.option);

        if (optionSelected && new BigNumber((optionSelected?.limitToBuy as any)).isGreaterThan(0)) {
            return new BigNumber(this.checkoutObject.price).multipliedBy(this.checkoutObject.quantity).isGreaterThan(new BigNumber((optionSelected?.limitToBuy as any)));
        }

        return false;
    }

    public getNumberFromBigNumber(bigNumber: BigNumber | undefined): number | undefined {
        return bigNumber?.toNumber();
    }
}
