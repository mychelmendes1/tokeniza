import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SimpleModalComponent } from '../simple-modal/simple-modal.component';
import { fadeIn } from '../../services/util/animations.service';
import { combineLatest } from 'rxjs';
import { AccountService } from '../../services/account/account.service';
import { FinancialService } from '../../services/financial/financial';
import { TokensService } from '../../services/tokens/token.service';
import { AmountConvertedResult } from '../../models/amount-converted-result';
import { ISwapCriptoToken, ISwapCriptoTransaction } from '../../models/swap.model';
import { TokenPairsConfig, TokensPairs } from '../../models/tokens.pairs';
import { Token } from '../../models/tokens';
import BigNumber from 'bignumber.js';
import { OnkeypressService } from '../../services/util/onkeypress.service.ts.service';
import { usefulSettings } from '../../models/useful-settings.model';
import { IOrderEvent } from '../../models/order.event';
import { CustomSnackbarComponent, SnackBarTheme } from '../../custom-snackbar/custom-snackbar.component';
import { TranslationConstants } from '../../services/util/translation.service';

@Component({
    selector: 'app-swap-crypto-modal',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule,
    ],
    templateUrl: './swap-crypto-modal.component.html',
    styleUrl: './swap-crypto-modal.component.scss',
    animations: [fadeIn]
})
export class SwapCryptoModalComponent {

    @Output() public reloadCryptoBalance: EventEmitter<boolean> = new EventEmitter(false);
    public selectedTokenIn: any = undefined;
    public selectedTokenOut: any = undefined;
    public loading: boolean = false;
    public quotes: Array<AmountConvertedResult> = [];
    public tokensWithUserBalance: ISwapCriptoToken[] = [];
    public swapsConfig: TokensPairs[] = [];
    public fiatToken: Token = new Token();
    public tokens: Token[] = [];
    public tokenOut: ISwapCriptoToken = {
        id: "",
        img: "",
        userBalance: BigNumber(0),
    };

    public tokenIn: ISwapCriptoToken = {
        id: "",
        img: "",
        userBalance: BigNumber(0),
    }
    public quantityTokenOut: number = 0;
    // Pay token details (token out)
    public tokenOutBalance: BigNumber = new BigNumber(0);
    public tokenOutDetails: ISwapCriptoToken = Object() as ISwapCriptoToken;
    public tokenOutRate: BigNumber = new BigNumber(0);
    // Receive token details (token in)
    public tokenInBalance: BigNumber = new BigNumber(0);
    public tokenInDetails: ISwapCriptoToken = Object() as ISwapCriptoToken;
    public tokenInRate: BigNumber = new BigNumber(0);
    public amountReceive: number = 0;
    public transactionInfo: ISwapCriptoTransaction = {
        ourTax: {
            percentage: undefined,
            amountTokens: undefined,
            amountInCurrency: undefined
        },
        gasCoast: {
            amountTokens: undefined,
            amountInCurrency: undefined
        }
    };
    public insufficientBalance: boolean = false;
    public usefulSettings: usefulSettings = new usefulSettings();
    public listIn: ISwapCriptoToken[] = [];
    public listOut: ISwapCriptoToken[] = [];

    constructor(
        public dialogRef: MatDialogRef<SwapCryptoModalComponent>,
        private readonly dialog: MatDialog,
        private readonly accountService: AccountService,
        private readonly financialService: FinancialService,
        private readonly tokensService: TokensService,
        private readonly keypressService: OnkeypressService,
        private readonly translationConstants: TranslationConstants,
        private readonly customSnackbarComponent: CustomSnackbarComponent
    ) { }

    public ngOnInit(): void {
        this.usefulSettings = {
            fiatCurrency: this.accountService.getFiatCurrency(),
        }
        this.dialogRef.disableClose = true;
        this.dialogRef.addPanelClass(['custom-modal', 'swap-crypto-modal']);
        this.initData();
    }

    public initData(): void {
        this.loading = true;
        combineLatest({
            allQuotations: this.accountService.allQuotations(),
            swapResponse: this.financialService.getAllSwapCriptoToken(),
            allTokens: this.tokensService.getTokens()
        }).subscribe((response) => {
            this.quotes = response?.allQuotations;
            this.tokensWithUserBalance = response?.swapResponse?.swapCriptos;
            this.swapsConfig = response?.swapResponse?.tokensPairs;
            this.fiatToken = response?.allTokens?.find(tkn => tkn.isMainFiatToken) as Token;
            this.tokens = response?.allTokens?.filter(tk => {
                if (!tk.isAutomaticSwap) return false;
                const config = this.swapsConfig.find(sc => sc.id === tk.id);
                return Array.isArray(config?.pairs) && config.pairs.length > 0;
            });
        }, error => {
        }).add(() => {
            this.openCriptoList(true);
            this.loading = false;
        });
    }

    public close(dismiss: boolean = false): void {
        this.dialogRef.close(dismiss);
    }

    public allowOnlyNumbers(event: KeyboardEvent): void {
        this.keypressService.onlyAllowNumbers(event, false, 20);
    }

    public compareTokens(token1: ISwapCriptoToken, token2: ISwapCriptoToken): boolean {
        return token1 && token2 ? token1.id === token2.id : token1 === token2;
    }

    public changeTokens(): void {
        const auxTokenOut: ISwapCriptoToken = { ... this.tokenOut };
        this.tokenOut = { ... this.tokenIn };
        this.selectedTokenOut = { ... this.selectedTokenIn };

        this.tokenIn = {
            id: "",
            img: "",
            userBalance: BigNumber(0)
        };
        this.openCriptoList(false); // Update the list of crypto in.
        const newTokenOutDetails: any = this.tokensWithUserBalance.find(tk => tk?.id === this.tokenOut?.id);

        if (newTokenOutDetails && (newTokenOutDetails?.pairs?.length ?? 0) > 0) {
            let identifiedToken: string = '';

            for (const pair of newTokenOutDetails?.pairs as TokenPairsConfig[]) {
                if (pair && pair?.id === auxTokenOut?.id) {
                    identifiedToken = auxTokenOut?.id as string;
                }

                if (identifiedToken) {
                    this.tokenIn = {
                        id: this.tokensWithUserBalance.find(tk => tk?.id === identifiedToken)?.id,
                        img: this.tokensWithUserBalance.find(tk => tk?.id === identifiedToken)?.img as string,
                        userBalance: this.tokensWithUserBalance.find(tk => tk?.id === identifiedToken)?.userBalance as BigNumber
                    };
                } else {
                    this.tokenIn = {
                        id: newTokenOutDetails?.pairs[0]?.id,
                        img: newTokenOutDetails?.pairs[0]?.imageSymbol,
                        userBalance: this.tokensWithUserBalance.find(tk => tk?.id === newTokenOutDetails.pairs[0]?.id)?.userBalance as BigNumber
                    };
                }
                this.selectedTokenIn = this.listIn.find(ls => ls.id === this.tokenIn.id) as ISwapCriptoToken;
            }
        } else {
            this.tokenIn = {
                id: '',
                img: '',
                userBalance: new BigNumber((undefined as any))
            };
        }

        this.quantityTokenOut = 0;
        this.amountReceive = 0;
        this.assignPayAndtokenInDetails();
    }

    public openSimpleModal(): void {
        const dialogRef: MatDialogRef<SimpleModalComponent> = this.dialog.open(SimpleModalComponent, {
            data: {
                title: 'swapCrypto.modal.success.title',
                subtitle: 'swapCrypto.modal.success.subtitle',
                autoClosingTime: 8000
            }
        });

        this.close();
    }

    public openSelect(event: boolean, isTokenOut: boolean): void {
        if (event) {
            this.openCriptoList(isTokenOut);
        }
    }

    public openCriptoList(isTokenOut: boolean = false): void {
        if (isTokenOut) {
            this.listOut = [];
            // To listOut, the tokens must have pairs availables.
            const tokensForListOut: ISwapCriptoToken[] = this.tokensWithUserBalance.filter(tk => tk.pairs && tk.pairs?.length > 0);
            for (const swapPair of tokensForListOut) {
                const crypto: ISwapCriptoToken = new ISwapCriptoToken();
                const tokenDetails = this.tokensWithUserBalance.find(tk => tk?.id === swapPair?.id);
                if (tokenDetails) {
                    crypto.name = tokenDetails?.name;
                    crypto.id = tokenDetails?.id;
                    crypto.img = tokenDetails?.img as string;
                    crypto.userBalance = tokenDetails?.userBalance as BigNumber;
                    this.listOut.push(crypto);
                }
            }
        } else {
            if (this.tokenOut) {
                this.listIn = [];
                // To listIn, the tokens must be in the tokenOut pairs.
                const pairsAvailables: TokenPairsConfig[] | undefined = this.tokensWithUserBalance.find(tk => tk?.id === this.tokenOut?.id)?.pairs;
                for (const swapPair of pairsAvailables as TokenPairsConfig[]) {
                    const tokenDetails = this.tokensWithUserBalance.find(tk => tk?.id === swapPair?.id);
                    if (tokenDetails) {
                        const crypto: ISwapCriptoToken = new ISwapCriptoToken();
                        crypto.name = tokenDetails?.name;
                        crypto.id = tokenDetails?.id;
                        crypto.img = tokenDetails?.img as string;
                        crypto.userBalance = tokenDetails?.userBalance as BigNumber;
                        this.listIn.push(crypto);
                    }
                }
            } else {
                return;
            }
        }
    }

    public onTokenOutChange(token: ISwapCriptoToken): void {
        this.selectedTokenOut = token;
        this.tokenOut = {
            id: token.id,
            img: token.img,
            userBalance: token.userBalance
        };
        this.openCriptoList(false);
        this.assignPayAndtokenInDetails();
    }

    public onTokenInChange(token: ISwapCriptoToken): void {
        this.selectedTokenIn = token;
        this.tokenIn = {
            id: token.id,
            img: token.img,
            userBalance: token.userBalance
        };
        this.quantityTokenOut = 0;
        this.assignPayAndtokenInDetails();
    }

    get tokensOutAvailable(): ISwapCriptoToken[] {
        return this.listOut?.length > 0 ? this.listOut : [];
    }

    get tokensInAvailable(): ISwapCriptoToken[] {
        return this.listIn?.length > 0 ? this.listIn : [];
    }

    public assignPayAndtokenInDetails(): void {
        if (this.tokenOut?.id) {
            this.tokenOutDetails = this.tokensWithUserBalance.find(tk => tk?.id === this.tokenOut?.id) as ISwapCriptoToken;
            this.tokenOutBalance = new BigNumber(this.tokenOutDetails?.userBalance || 0);
            this.tokenOutRate = this.quotes.find(qt => qt.currency === this.tokenOut?.id)?.rate as BigNumber;
        }

        if (this.tokenIn?.id) {
            this.tokenInDetails = this.tokensWithUserBalance.find(tk => tk?.id === this.tokenIn?.id) as ISwapCriptoToken;
            this.tokenInBalance = new BigNumber(this.tokenInDetails?.userBalance || 0);
            this.tokenInRate = this.quotes.find(qt => qt?.currency === this.tokenIn?.id)?.rate as BigNumber;
        }
    }

    public buyMax(): void {
        if (this.tokenOutBalance.isGreaterThan(new BigNumber(0))) {
            this.quantityTokenOut = this.tokenOutBalance.toNumber();
        }
        this.changeTransactionInfo();
        this.setAmountReceive();
    }

    public changeTransactionInfo(): void {
        const tokenPercentage = this.tokenOutDetails?.transactionTax || 0;
        const taxAmountTokens = new BigNumber(this.quantityTokenOut).multipliedBy(new BigNumber(tokenPercentage)).dividedBy(new BigNumber(100)) || new BigNumber(0);
        const taxAmountInCurrency = new BigNumber(taxAmountTokens).multipliedBy(this.tokenOutRate) || new BigNumber(0);

        const gasCoastAmountTokens = new BigNumber(this.quantityTokenOut).multipliedBy(new BigNumber(this.tokenOutDetails?.blockchainFee as any)).dividedBy(new BigNumber(100));
        const gasCoastAmountInCurrency = new BigNumber(gasCoastAmountTokens).multipliedBy(new BigNumber(this.tokenOutRate)) || new BigNumber(0);

        this.transactionInfo = {
            ourTax: { // Token
                percentage: tokenPercentage,
                amountTokens: taxAmountTokens.toNumber() || 0,
                amountInCurrency: taxAmountInCurrency.toNumber() || 0,
            },
            gasCoast: { // Blockchain
                amountTokens: gasCoastAmountTokens.toNumber() || 0,
                amountInCurrency: gasCoastAmountInCurrency.toNumber() || 0
            }
        }
    }

    public changeQuantityTokens(): void {
        if (new BigNumber(this.quantityTokenOut).isGreaterThan(new BigNumber(this.tokenOutBalance))) {
            this.insufficientBalance = true;
        } else {
            this.insufficientBalance = false;
        }

        this.changeTransactionInfo();
        this.setAmountReceive();
    }

    // Get the receive token in FIAT.
    public setAmountReceive(): void {
        if (this.quantityTokenOut > 0) {
            const tokenOutsAmount = new BigNumber(this.getTokensConverted());
            const valueReceivedInToken = tokenOutsAmount.multipliedBy(new BigNumber(this.tokenInRate));

            this.amountReceive = valueReceivedInToken.toNumber();
        }
    }

    // Get the receive token amount.
    public getTokensConverted(): number {
        if (!this.quantityTokenOut || this.quantityTokenOut <= 0) {
            return 0;
        }

        const paymentTokenInFiat = new BigNumber(this.quantityTokenOut)
            .minus(this.transactionInfo?.gasCoast?.amountTokens || 0)
            .minus(this.transactionInfo?.ourTax?.amountTokens || 0)
            .multipliedBy(new BigNumber(this.tokenOutRate))
        ;

        const valueReceivedInToken = paymentTokenInFiat.dividedBy(new BigNumber(this.tokenInRate));
        return valueReceivedInToken.toNumber() || 0;
    }

    // Get the pay token amount in FIAT.
    public getValueInCurrency(): number {
        if (this.quantityTokenOut > 0) {
            const tokenOutInFiat = new BigNumber(this.quantityTokenOut).multipliedBy(new BigNumber(this.tokenOutRate));

            return tokenOutInFiat.toNumber() || 0;
        }
        return 0;
    }

    public goToConvert(): void {
        this.internalTokenCheckout();
    }

    private internalTokenCheckout(): void {
        this.loading = true;
        let tokenIn = this.tokens?.find(tkn => tkn.id === this.tokenIn?.id);
        let tokenOut = this.tokens?.find(tkn => tkn.id === this.tokenOut?.id);

        if (tokenOut?.id === this.fiatToken?.id) {
            if (tokenIn?.brasil_bitcoin_integration) {
                this.financialService.checkoutSwap(this.preparePaymentSwapBuyData())
                    .subscribe(
                        ((checkoutData: IOrderEvent) => {
                            this.close();
                            this.openSimpleModal();
                            setTimeout(() => {
                                this.reloadCryptoBalance.emit(true);
                            }, 100);
                        }),
                        (err: any) => {
                            if (err.error?.message?.includes('You cannot buy more than')) {
                                this.checkoutErrorRedirect('paymentModal.error.dailyLimitExceeded');
                            } else if (err.error?.message?.includes('CBE098')) {
                                //balance is not enough 
                                this.checkoutErrorRedirect('banking.transfers.error.CBE098');
                            } else if (err.error?.message?.includes('Duplicated transaction')) {
                                this.checkoutErrorRedirect('banking.transfers.error.CBE100');
                            } else {
                                this.checkoutErrorRedirect('paymentModal.error.generic');
                            }
                        }
                    )
                    .add(() => {
                        this.loading = false;
                    });
            } else {
                this.financialService.createCheckout(this.preparePaymentTokenData())
                    .subscribe(
                        ((checkoutData: IOrderEvent) => {
                            this.close();
                            this.openSimpleModal();
                            setTimeout(() => {
                                this.reloadCryptoBalance.emit(true);
                            }, 100);
                        }),
                        (err: any) => {
                            if (err.error?.message?.includes('You cannot buy more than')) {
                                this.checkoutErrorRedirect('paymentModal.error.dailyLimitExceeded');
                            } else if (err.error?.message?.includes('CBE098')) {
                                //balance is not enough 
                                this.checkoutErrorRedirect('banking.transfers.error.CBE098');
                            } else if (err.error?.message?.includes('Duplicated transaction')) {
                                this.checkoutErrorRedirect('banking.transfers.error.CBE100');
                            } else {
                                this.checkoutErrorRedirect('paymentModal.error.generic');
                            }
                        }
                    )
                    .add(() => {
                        this.loading = false;
                    });
            }
        } else {
            if (tokenIn?.id === this.fiatToken?.id && tokenOut?.brasil_bitcoin_integration) {
                this.loading = true;
                this.financialService.checkoutSwap(this.preparePaymentSwapDataForSell())
                    .subscribe(
                        ((checkoutData: IOrderEvent) => {
                            this.close();
                            this.openSimpleModal();
                            setTimeout(() => {
                                this.reloadCryptoBalance.emit(true);
                            }, 100);
                        }),
                        (err: any) => {
                            if (err.error?.message?.includes('You cannot buy more than')) {
                                this.checkoutErrorRedirect('paymentModal.error.dailyLimitExceeded');
                            } else if (err.error?.message?.includes('CBE098')) {
                                //balance is not enough 
                                this.checkoutErrorRedirect('banking.transfers.error.CBE098');
                            } else if (err.error?.message?.includes('Duplicated transaction')) {
                                this.checkoutErrorRedirect('banking.transfers.error.CBE100');
                            } else {
                                this.checkoutErrorRedirect('paymentModal.error.generic');
                            }
                        }
                    )
                    .add(() => {
                        this.loading = false;
                    });
            } else {
                this.financialService.createCheckout(this.prepareTokenData())
                    .subscribe(
                        ((checkoutData: IOrderEvent) => {
                            this.close();
                            this.openSimpleModal();
                            setTimeout(() => {
                                this.reloadCryptoBalance.emit(true);
                            }, 100);
                        }),
                        (err: any) => {
                            if (err.error?.message?.includes('You cannot buy more than')) {
                                this.checkoutErrorRedirect('paymentModal.error.dailyLimitExceeded');
                            } else if (err.error?.message?.includes('CBE098')) {
                                //balance is not enough 
                                this.checkoutErrorRedirect('banking.transfers.error.CBE098');
                            } else if (err.error?.message?.includes('Duplicated transaction')) {
                                this.checkoutErrorRedirect('banking.transfers.error.CBE100');
                            } else {
                                this.checkoutErrorRedirect('paymentModal.error.generic');
                            }
                        }
                    )
                    .add(() => {
                        this.loading = false;
                    })
                ;
            }
        }
    }

    private preparePaymentSwapBuyData(): any {
        let totalAmountCalc: BigNumber = new BigNumber(this.quantityTokenOut).multipliedBy(this.tokenOutRate);

        const orderEvent = {
            userId: undefined,
            amount: totalAmountCalc,
            unitOfMoney: this.tokenOut?.id,
            from_book: 'swap',
            taxAmount: new BigNumber(this.transactionInfo.gasCoast.amountInCurrency || 0).plus(new BigNumber(this.transactionInfo.ourTax.amountInCurrency || 0)), //Nesse caso cobramos em reais
            expectedAmount: totalAmountCalc,
            side: 'BUY'
        };

        return orderEvent;
    }

    private preparePaymentTokenData(): any {
        const orderEvent = {
            id: undefined,
            status: 'CREATED',
            shippingAmount: new BigNumber(0),
            totalAmount: new BigNumber(this.quantityTokenOut),
            taxAmount: new BigNumber(this.transactionInfo.gasCoast.amountTokens || 0).plus(new BigNumber(this.transactionInfo.ourTax.amountTokens || 0)),
            paymentMethod: 'TOKEN',
            expirationDate: undefined,
            shoppingCartId: undefined,
            storeId: 'TEMP',
            isTokenBuy: true,
            isNftBuy: false,
            assetId: undefined,
            packageId: undefined,
            nftId: undefined,
            tokensAmount: this.getTokensConverted(),
            createdAt: new Date(),
            hash: undefined,
            transactionId: undefined,
            items: undefined,
            unitOfMoney: this.tokenOut?.id,
            unit_purchased: this.tokenIn?.id // Coin that is being purchased
        };

        return orderEvent;
    }

    private checkoutErrorRedirect(errorCode: string): void {
        this.customSnackbarComponent.open(this.translationConstants.translate(errorCode), SnackBarTheme.error, 4000);
    }

    private preparePaymentSwapDataForSell(): any {
        let totalAmountCalc: BigNumber = new BigNumber(this.quantityTokenOut || 0);

        const orderEvent = {
            userId: undefined,
            amount: this.tokenOutBalance,
            from_book: 'swap',
            taxAmount: new BigNumber((this.transactionInfo.gasCoast.amountTokens as any)).plus(new BigNumber((this.transactionInfo.ourTax.amountTokens as any))),
            unitOfMoney: this.tokenOut?.id,
            expectedAmount: totalAmountCalc
        };

        return orderEvent;
    }

    private prepareTokenData(): any {
        const orderEvent = {
            id: undefined,
            status: 'CREATED',
            shippingAmount: new BigNumber(0),
            totalAmount: new BigNumber(this.quantityTokenOut),
            taxAmount: new BigNumber(this.transactionInfo.gasCoast.amountTokens || 0).plus(new BigNumber(this.transactionInfo.ourTax.amountTokens || 0)),
            paymentMethod: 'TOKEN',
            expirationDate: undefined,
            shoppingCartId: undefined,
            storeId: 'TEMP',
            isTokenBuy: true,
            isNftBuy: false,
            assetId: undefined,
            packageId: undefined,
            nftId: undefined,
            tokensAmount: this.getTokensConverted(),
            createdAt: new Date(),
            hash: undefined,
            transactionId: undefined,
            items: undefined,
            unitOfMoney: this.tokenOut?.id,
            unit_purchased: this.tokenIn.id // Coin that is being purchased
        };

        return orderEvent;
    }
}