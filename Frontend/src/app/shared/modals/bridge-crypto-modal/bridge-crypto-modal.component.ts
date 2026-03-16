import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { fadeIn } from '../../services/util/animations.service';
import { finalize, forkJoin, Subject } from 'rxjs';
import { AccountService } from '../../services/account/account.service';
import { FinancialService } from '../../services/financial/financial';
import { TokensService } from '../../services/tokens/token.service';
import { AmountConvertedResult } from '../../models/amount-converted-result';
import { ISwapCriptoToken } from '../../models/swap.model';
import { Token } from '../../models/tokens';
import BigNumber from 'bignumber.js';
import { usefulSettings } from '../../models/useful-settings.model';
import { CustomSnackbarComponent, SnackBarTheme } from '../../custom-snackbar/custom-snackbar.component';
import { TranslationConstants } from '../../services/util/translation.service';
import { IBridgeChains } from '../../models/IBridgeChains.model';
import { IBridgeCriptoToken, IBridgeTransaction } from '../../models/IBridgeTokens.model';
import { BridgeChainsModel, BridgeExecutionPayload, BridgeExecutionResponse, BridgeQuoteModel, BridgeTokensModel } from '../../models/bridge.model';
import { Network } from '../../models/network.model';
import { CollectionService } from '../../services/collection/collection.service';
import { BridgeService } from '../../services/financial/bridge.service';

@Component({
    selector: 'app-bridge-crypto-modal',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule,
    ],
    templateUrl: './bridge-crypto-modal.component.html',
    styleUrl: './bridge-crypto-modal.component.scss',
    animations: [fadeIn]
})
export class BridgeCryptoModalComponent {

    @Output() public reloadCryptoBalance: EventEmitter<boolean> = new EventEmitter(false);
    public usefulSettings: usefulSettings = new usefulSettings();
    public loading: boolean = false;

    public showErrorPage: boolean = false;
    public insufficientBalance: boolean = false;
    public linkCopied: boolean = false;
    public tokensWithUserBalance: IBridgeCriptoToken[] = [];
    public quantityInputToken!: number;

    // Pay token details (token out)
    public inputTokenBalance: BigNumber = new BigNumber(0);
    public inputTokenDetails: IBridgeCriptoToken = {} as IBridgeCriptoToken;
    public inputTokenRate: BigNumber = new BigNumber(0);

    // Receive token details (token in)
    public outputTokenBalance: BigNumber = new BigNumber(0);
    public outputTokenDetails: IBridgeCriptoToken = {} as IBridgeCriptoToken;
    public outputTokenRate: BigNumber = new BigNumber(0);
    public amountReceive: number = 0;

    public transactionInfo: IBridgeTransaction = {
        ourTax: {
            percentage: 0,
            amountTokens: 0,
            amountInCurrency: 0
        },
        gasCost: {
            amountTokens: 0,
            amountInCurrency: 0
        },
        bridgeCost: {
            amountTokens: 0,
            amountInCurrency: 0
        },
        totalCost: {
            amountTokens: 0,
            amountInCurrency: 0
        }
    };

    // Bridge details
    public chainsList: BridgeChainsModel = []; // List of all the chains accepted by the bridge.
    public acceptedOriginChains: IBridgeChains[] = []; // List of chains accepted for the selected input token.
    public acceptedDestinationChains: IBridgeChains[] = []; // List of chains accepted for the selected output token.
    public bridgeTransferLimits = { min: new BigNumber(0), max: new BigNumber(0) };
    private tokensAndChainsMap: Record<string, IBridgeChains[]> = {}; // Map of tokens and their accepted chains.
    private providerBridgeTokens: BridgeTokensModel = []; // All tokens provided by the bridge service.
    public availableBridgeTokens: IBridgeCriptoToken[] = []; // Tokens from the platform that can be bridged.
    public bridgeEstimatedFillTimeSec: string = '0';

    public showTransferLimitMinError: boolean = false;
    public showTransferLimitMaxError: boolean = false;

    public quotes: Array<AmountConvertedResult> = [];
    public allTokens: Token[] = [];
    public fiatToken: Token = new Token();

    // Token selections
    public bridgeFeeInTokens: BigNumber = new BigNumber(0);
    public bridgeFeeInCurrency: BigNumber = new BigNumber(0);

    // Selected tokens and chains
    private _inputToken: IBridgeCriptoToken = {} as IBridgeCriptoToken;
    private _outputToken: IBridgeCriptoToken = {} as IBridgeCriptoToken;
    private _chainTo: IBridgeChains = {} as IBridgeChains; // Destination chain
    private _chainFrom: IBridgeChains = {} as IBridgeChains; // Origin chain
    private inputChainToken: BridgeTokensModel[0] | null = null; // Token details from the bridge provider for the input chain
    private outputChainToken: BridgeTokensModel[0] | null = null; // Token details from the bridge provider for the output chain

    // UI related
    public networks: Network[] = [];
    public recipientAddress: string = '';
    public useCustomRecipient: boolean = false;
    public destinationRequiresRecipient: boolean = false;
    public slippageMode: 'auto' | 'custom' = 'auto';
    public slippagePercentage: number = 0.5;

    private quantityInputTokenChanged = new Subject<number>();
    private readonly destroy$ = new Subject<void>();
    private managedChainIds: Set<number> = new Set<number>();

    public get chainFrom(): IBridgeChains {
        return this._chainFrom;
    }

    public get chainTo(): IBridgeChains {
        return this._chainTo;
    }

    public get inputToken(): IBridgeCriptoToken {
        return this._inputToken;
    }

    public get outputToken(): IBridgeCriptoToken {
        return this._outputToken;
    }

    public set chainFrom(chain: IBridgeChains) {
        this._chainFrom = chain;
        this.fetchBridgeLimits();
        this.calculateBridgeQuote();
    }

    public set chainTo(chain: IBridgeChains) {
        this._chainTo = chain;

        if (this.inputToken.id) {
            const normalizedSymbol = this.normalizeTokenSymbol(this.inputToken.id).toUpperCase();
            const allPossibleChains = this.tokensAndChainsMap[normalizedSymbol] || [];
            this.acceptedDestinationChains = allPossibleChains.filter(c => c.chainId !== this.chainFrom?.chainId);

            // If current chainTo is now invalid, select a new one
            if (this.chainTo && this.chainTo.chainId === this.chainFrom?.chainId) {
                this.chainTo = this.acceptedDestinationChains.find(c => c.isManaged) || this.acceptedDestinationChains[0];
            }
        }

        this.fetchBridgeLimits();
        this.calculateBridgeQuote();
        this.updateRecipientRequirements();
    }

    public set inputToken(token: IBridgeCriptoToken) {
        this._inputToken = token;
        this._outputToken = token;
        this.onTokenChanged();
    }

    public set outputToken(token: IBridgeCriptoToken) {
        this._outputToken = token;
        this.onTokenChanged();
    }

    private onTokenChanged(): void {
        this.assignPayAndtokenInDetails();
        this.changeTransactionInfo();
        this.setAmountReceive();
        this.fetchBridgeLimits();
        this.calculateBridgeQuote();
        this.updateAcceptedChainsForToken();
    }

    constructor(
        public dialogRef: MatDialogRef<BridgeCryptoModalComponent>,
        private readonly dialog: MatDialog,
        private readonly accountService: AccountService,
        private readonly financialService: FinancialService,
        private readonly tokensService: TokensService,
        private readonly translationConstants: TranslationConstants,
        private readonly customSnackbarComponent: CustomSnackbarComponent,
        private readonly collectionService: CollectionService,
        private readonly bridgeService: BridgeService,
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
        forkJoin({
            quotesResp: this.accountService.allQuotations(),
            bridgeTokens: this.financialService.getAllBridgeTokens(),
            allTokens: this.tokensService.getTokens(),
            possibleBridgeTokens: this.bridgeService.getAvailableTokens(),
            bridgeChains: this.bridgeService.getAvailableChains(),
            networks: this.collectionService.getNetworks()
        })
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: ({ quotesResp, bridgeTokens, allTokens, possibleBridgeTokens, bridgeChains, networks }: {
                    quotesResp: AmountConvertedResult[];
                    bridgeTokens: IBridgeCriptoToken[];
                    allTokens: Token[];
                    possibleBridgeTokens: BridgeTokensModel;
                    bridgeChains: BridgeChainsModel;
                    networks: Network[];
                }) => {

                    this.quotes = quotesResp;
                    this.networks = networks;
                    this.managedChainIds = new Set((networks || []).map(net => Number(net.chain_id)));

                    // Set will all the supported tokens from bridge config.
                    const supportedTokens = new Set((possibleBridgeTokens || []).map(token => (token.address.toUpperCase() || '').toUpperCase()));

                    // Only take the tokens that are supported by the bridge service and have the "bridgeable" == true flag.
                    this.tokensWithUserBalance = bridgeTokens.filter(tk => supportedTokens.has((tk.address!.toUpperCase() || '').toUpperCase()));

                    this.allTokens = allTokens;
                    this.fiatToken = this.allTokens.find(tkn => tkn.isMainFiatToken) as Token;
                    this.chainsList = bridgeChains;
                    this.providerBridgeTokens = possibleBridgeTokens;
                    this.tokensAndChainsMap = {};

                    // Helper to associate chains and their chain Ids.
                    const chainToIdMap = new Map(bridgeChains?.map(ch => [ch.chainId, ch]));

                    // Create a map of tokens and their accepted chains.
                    for (const token of this.providerBridgeTokens) {
                        const symbol = token.symbol?.toUpperCase() || '';

                        // Get the chains where the token is available.
                        const chain = chainToIdMap.get(token.chainId);

                        if (!chain) {
                            continue;
                        }

                        const formattedChain: IBridgeChains = {
                            chainId: chain.chainId,
                            name: chain.name,
                            img: chain.logoUrl,
                            url: chain.explorerUrl,
                            isManaged: this.managedChainIds.has(Number(chain.chainId))
                        }

                        this.tokensAndChainsMap[symbol] = this.tokensAndChainsMap[symbol] || [];
                        if (!this.tokensAndChainsMap[symbol].some(c => c.chainId === formattedChain.chainId)) {
                            this.tokensAndChainsMap[symbol].push(formattedChain);
                        }
                    }

                    // Default Initization to USDC BSC to USDC ETH
                    this.initializeDefaultSelections();
                },
                error: () => {
                    this.showErrorPage = true;
                }
            });
    }

    private initializeDefaultSelections(): void {

        // Default token is the first one with user balance.
        const defaultToken = this.tokensWithUserBalance[0];

        if (defaultToken) {
            this.inputToken = defaultToken;
            this.outputToken = defaultToken;
        }
    }

    private updateAcceptedChainsForToken(): void {

        if (!this.inputToken.id) {
            this.chainFrom = null as any;
            this.chainTo = null as any;
            this.acceptedDestinationChains = [];
            this.acceptedOriginChains = [];
        }

        // Normalize the token symbol for mapping (E.g USDT BEP20 -> USDT)
        const normalizedSymbol = this.normalizeTokenSymbol(this.inputToken.id || '').toUpperCase();

        const relatedProviderTokens = this.providerBridgeTokens.filter(
            providerToken => this.normalizeTokenSymbol(providerToken.symbol || '').toUpperCase() === normalizedSymbol
        );

        if (relatedProviderTokens.length === 0) {
            this.acceptedOriginChains = [];
            this.acceptedDestinationChains = [];
            this.chainFrom = null as any;
            this.chainTo = null as any;
            return;
        }

        // Find the specific provider token that matches both symbol and address (to identify the origin chain).
        // E.g 0xdAC17F958D2ee523a2206206994597C13D831ec7 -> USDT ERC-20 -> Ethereum -> ChainId 1
        const matchingProviderToken = relatedProviderTokens.find(
            providerToken => providerToken.address.toLowerCase() === this.inputToken.address!.toLowerCase()
        );

        // All the chains that support the selected token
        const possibleChains = this.tokensAndChainsMap[normalizedSymbol] || [];

        if (matchingProviderToken) {
            // Origin chains are those that have the selected token address
            const originChain = possibleChains.find(
                chain => chain.chainId === matchingProviderToken.chainId
            );

            if (originChain) {
                this.acceptedOriginChains = [originChain];
                this.acceptedDestinationChains = possibleChains.filter(
                    chain => chain.chainId !== originChain.chainId
                );

                // Auto-select chains, having preference for managed chains
                this.chainFrom = originChain;
                this.chainTo = this.acceptedDestinationChains.find(chain => chain.isManaged) || this.acceptedDestinationChains[0];
            }
        } else {
            // If we can't find exact match, allow all chains
            this.acceptedOriginChains = possibleChains;
            this.acceptedDestinationChains = possibleChains;

            // Auto-select default chains
            const defaultFrom = possibleChains.find(chain => chain.isManaged) || possibleChains[0];
            this.chainFrom = defaultFrom;
            this.chainTo = possibleChains.find(chain => chain.chainId !== defaultFrom?.chainId) || possibleChains[1];
        }
    }

    /**
     * Get the bridge transfer limits based on the selected token and chains.
     * Runs whenever the input token or chains change.
     */
    private fetchBridgeLimits(): void {

        if (!this.inputToken?.id || !this.chainFrom?.chainId || !this.chainTo?.chainId) {
            this.bridgeTransferLimits = { min: new BigNumber(0), max: new BigNumber(0) };
            return;
        }

        const normalizedSymbol = this.normalizeTokenSymbol(this.inputToken.id).toUpperCase();

        const fromToken = this.providerBridgeTokens.find(
            tkn => tkn.chainId === this.chainFrom.chainId && this.normalizeTokenSymbol(tkn.symbol) === normalizedSymbol
        );
        const toToken = this.providerBridgeTokens.find(
            tkn => tkn.chainId === this.chainTo.chainId && this.normalizeTokenSymbol(tkn.symbol) === normalizedSymbol
        );

        if (!fromToken || !toToken) {
            this.bridgeTransferLimits = { min: new BigNumber(0), max: new BigNumber(0) };
            return;
        }

        this.inputChainToken = fromToken;
        this.outputChainToken = toToken;

        this.bridgeService.getBridgeLimits({
            inputToken: fromToken.address,
            outputToken: toToken.address,
            originChainId: this.chainFrom.chainId,
            destinationChainId: this.chainTo.chainId
        }).subscribe({
            next: (limits) => {
                if (limits?.maxDeposit && limits?.minDeposit) {
                    this.bridgeTransferLimits = {
                        min: new BigNumber(limits.minDeposit).shiftedBy(-fromToken.decimals),
                        max: new BigNumber(limits.maxDeposit).shiftedBy(-fromToken.decimals)
                    };

                    // Validate current amount if exists
                    if (this.quantityInputToken > 0) {
                        this.validateTransferLimits();
                    }

                    // Recalculate quote after limits are fetched
                    this.calculateBridgeQuote();
                }
            },
            error: (err) => {
                this.bridgeTransferLimits = { min: new BigNumber(0), max: new BigNumber(0) };
            }
        });

    }

    /**
     * Calculates the bridge quote based on the selected tokens, chains, and input amount.
     * Runs whenever the input amount or selections change.
     */
    private calculateBridgeQuote(): void {

        if (!this.inputToken?.id || !this.chainFrom?.chainId || !this.chainTo?.chainId || !this.quantityInputToken || this.quantityInputToken <= 0) {
            this.amountReceive = 0;
            return;
        }

        // Validate limits before fetching quote
        this.validateTransferLimits();

        // Don't fetch quote if amount is out of bounds
        if (this.showTransferLimitMinError || this.showTransferLimitMaxError) {
            this.amountReceive = 0;
            this.bridgeFeeInTokens = new BigNumber(0);
            this.bridgeFeeInCurrency = new BigNumber(0);
            return;
        }

        // If the tokens is not selected properly, skip
        if (!this.inputChainToken || !this.outputChainToken) {
            return;
        }

        this.loading = true;

        this.bridgeService.getBridgeQuote({
            inputToken: this.inputChainToken.address, outputToken: this.outputChainToken.address,
            originChainId: this.chainFrom.chainId, destinationChainId: this.chainTo.chainId,
            amount: this.quantityInputToken.toString(), decimals: this.inputChainToken.decimals
        })
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: (quote: BridgeQuoteModel) => {
                    if (!quote || Object.keys(quote).length === 0) {
                        this.amountReceive = 0;
                        this.bridgeFeeInTokens = new BigNumber(0);
                        this.bridgeFeeInCurrency = new BigNumber(0);
                        return;
                    }

                    // Calculate the bridge quote
                    this.bridgeFeeInTokens = new BigNumber(quote.totalFeeHuman || 0);
                    this.bridgeFeeInCurrency = new BigNumber(this.bridgeFeeInTokens).multipliedBy(new BigNumber(this.inputTokenRate));

                    this.amountReceive = new BigNumber(quote.outputAmountHuman).toNumber() || 0;

                    this.bridgeEstimatedFillTimeSec = quote.estimatedFillTimeSec?.toString() || '0';

                    if (Number(this.bridgeEstimatedFillTimeSec) > 60) {
                        const minutes = Math.floor(Number(this.bridgeEstimatedFillTimeSec) / 60);
                        const seconds = Number(this.bridgeEstimatedFillTimeSec) % 60;
                        this.bridgeEstimatedFillTimeSec = `${minutes}m ${seconds}s`;
                    } else {
                        this.bridgeEstimatedFillTimeSec = `${this.bridgeEstimatedFillTimeSec}s`;
                    }
                },
                error: (err) => {
                    this.amountReceive = 0;
                    this.bridgeFeeInTokens = new BigNumber(0);
                    this.bridgeFeeInCurrency = new BigNumber(0);
                }
            });
    }

    /**
  * Sanitizes the input to allow only numbers and a single decimal point.
  */
    public sanitizeTokensInput(amount: any): void {

        const value = Number(amount);

        if (isNaN(value) || value < 0) {
            this.quantityInputToken = 0;
        } else {
            this.quantityInputToken = value;
        }

        this.changeQuantityTokens();
    }

    /**
    * Triggered when the user changes the quantity of input tokens to bridge.
    */
    public changeQuantityTokens(): void {

        if (new BigNumber(this.quantityInputToken).isGreaterThan(new BigNumber(this.inputTokenBalance))) {
            this.insufficientBalance = true;
        } else {
            this.insufficientBalance = false;
        }

        // Validate limits if they've been fetched
        if (this.bridgeTransferLimits.max.isGreaterThan(0)) {
            this.validateTransferLimits();
        }

        this.calculateBridgeQuote();
        this.changeTransactionInfo();
        this.setAmountReceive();

        this.quantityInputTokenChanged.next(this.quantityInputToken);
    }

    /**
     * Validates the current input token amount against the fetched bridge transfer limits.
     */
    private validateTransferLimits(): void {
        const inputTokenAmount = new BigNumber(this.quantityInputToken || 0);

        this.showTransferLimitMaxError = false;
        this.showTransferLimitMinError = false;

        if (inputTokenAmount.isGreaterThan(0)) {
            if (inputTokenAmount.isLessThan(this.bridgeTransferLimits.min)) {
                this.showTransferLimitMinError = true;
            } else if (inputTokenAmount.isGreaterThan(this.bridgeTransferLimits.max)) {
                this.showTransferLimitMaxError = true;
            }
        }
    }

    /**
     * Get the input token amount in FIAT.
     * @returns 
     */
    public getInputTokenCurrency(): number {
        if (this.quantityInputToken > 0) {
            const inputTokenInFiat = new BigNumber(this.quantityInputToken).multipliedBy(new BigNumber(this.inputTokenRate));
            return inputTokenInFiat.toNumber() || 0;
        }
        return 0;
    }

    /**
     * Get the output token amount in FIAT.
     * @returns 
     */
    public getOutputTokenCurrency(): number {
        if (this.quantityInputToken > 0) {
            const outputTokenInFiat = new BigNumber(this.getTokensConverted()).multipliedBy(new BigNumber(this.inputTokenRate));
            return outputTokenInFiat.toNumber() || 0;
        }
        return 0;
    }

    /**
     * Get the converted tokens after fees.
     * @returns 
     */
    public getTokensConverted(): number {
        if (this.quantityInputToken > 0) {

            // Since the bridge is for the same token, just subtract the fees
            const amountAfterTaxes = new BigNumber(this.quantityInputToken)
                .minus(this.transactionInfo?.ourTax?.amountTokens || 0)
                .minus(this.bridgeFeeInTokens || 0);

            return amountAfterTaxes.toNumber();
        }
        return 0;
    }

    // Get the receive token in FIAT.
    public setAmountReceive(): void {
        if (this.quantityInputToken > 0) {
            const tokensReceived = new BigNumber(this.getTokensConverted());
            // Como é o mesmo token, usa a mesma taxa (inputTokenRate)
            const valueReceivedInFiat = tokensReceived.multipliedBy(new BigNumber(this.inputTokenRate));

            this.amountReceive = valueReceivedInFiat.toNumber();
            return;
        }
        this.amountReceive = 0;
    }

    /**
     * Changes the transaction info (taxes and gas cost) based on the input token and quantity.
     */
    public changeTransactionInfo(): void {
        const tokenPercentage = this.inputTokenDetails?.transactionTax || 0;
        const taxAmountTokens = new BigNumber(this.quantityInputToken).multipliedBy(new BigNumber(tokenPercentage)).dividedBy(new BigNumber(100)) || new BigNumber(0);
        const taxAmountInCurrency = new BigNumber(taxAmountTokens).multipliedBy(this.inputTokenRate) || new BigNumber(0);

        this.transactionInfo = {
            // Token
            ourTax: {
                percentage: tokenPercentage,
                amountTokens: taxAmountTokens.toNumber() || 0,
                amountInCurrency: taxAmountInCurrency.toNumber() || 0,
            },
            // Blockchain
            gasCost: {
                amountTokens: 0,
                amountInCurrency: 0
            },
            // Bridge
            bridgeCost: {
                amountTokens: this.bridgeFeeInTokens.toNumber() || 0,
                amountInCurrency: this.bridgeFeeInCurrency.toNumber() || 0
            },
            totalCost: {
                amountTokens: taxAmountTokens.plus(this.bridgeFeeInTokens).toNumber() || 0,
                amountInCurrency: taxAmountInCurrency.plus(this.bridgeFeeInCurrency).toNumber() || 0
            }
        }
    }

    /**
     * Assigns the token details and balances for the selected input and output tokens.
     */
    public assignPayAndtokenInDetails(): void {
        if (this.inputToken?.id) {
            let network = this.networks?.find(net => Number(net.chain_id) === Number(this.chainFrom?.chainId));
            let token = this.allTokens.find(tkn => tkn.id?.includes(this.inputToken?.id as string) && tkn.network_id === network?.id);
            this.inputTokenDetails = this.tokensWithUserBalance.find(tk => tk?.id === token?.id) as IBridgeCriptoToken;
            this.inputTokenBalance = new BigNumber(this.inputTokenDetails?.userBalance || 0);
            this.inputTokenRate = this.quotes.find(qt => qt?.currency === this.inputToken?.id)?.rate as BigNumber;
        }

        if (this.outputToken?.id) {
            this.outputTokenDetails = this.tokensWithUserBalance.find(tk => tk?.id === this.outputToken?.id) as IBridgeCriptoToken;
            this.outputTokenBalance = new BigNumber(this.outputTokenDetails?.userBalance || 0);
            this.outputTokenRate = this.quotes.find(qt => qt?.currency === this.outputToken?.id)?.rate as BigNumber;
        }
    }

    /**
     * Set the maximum amount of input tokens based on the user's balance.
     */
    public buyMax(): void {
        if (this.inputTokenBalance.isGreaterThan(new BigNumber(0))) {
            this.quantityInputToken = this.inputTokenBalance.toNumber();
        }
        this.changeTransactionInfo();
    }

    /**
     * Normalizes the token symbol by removing known chain prefixes.
     * Example: BSCUSDT -> USDT
     * @param symbol 
     * @returns normalized symbol
     */
    private normalizeTokenSymbol(symbol?: string): string {
        if (!symbol) {
            return '';
        }

        const upperSymbol = symbol.toUpperCase();

        const prefixes = ['BSC', 'ETH', 'ARB', 'POL', 'MATIC'];
        const prefix = prefixes.find(pref => upperSymbol.startsWith(pref));

        if (prefix) {
            return upperSymbol.substring(prefix.length);
        } else {
            return upperSymbol;
        }

    }

    public onRecipientToggle(useCustom: boolean): void {
        this.useCustomRecipient = this.destinationRequiresRecipient ? true : useCustom;
        if (!this.useCustomRecipient) {
            this.recipientAddress = '';
        }
    }

    public onSlippageModeChange(mode: 'auto' | 'custom'): void {
        this.slippageMode = mode;

        if (mode === 'auto') {
            this.slippagePercentage = 0.5;
        }
    }

    private updateRecipientRequirements(): void {
        if (!this.chainTo) {
            this.destinationRequiresRecipient = false;
            if (!this.useCustomRecipient) {
                this.recipientAddress = '';
            }
            return;
        }

        const isManaged = this.chainTo.isManaged ?? this.managedChainIds.has(Number(this.chainTo.chainId));
        this.destinationRequiresRecipient = !isManaged;

        if (this.destinationRequiresRecipient) {
            this.useCustomRecipient = true;
        } else if (!this.useCustomRecipient) {
            this.recipientAddress = '';
        }
    }

    public isValidEvmAddress(address: string): boolean {
        return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
    }

    public createBridge(): void {
        if (this.insufficientBalance) {
            this.customSnackbarComponent.open(this.translationConstants.translate('bridge.error.insufficientBalance'), SnackBarTheme.error, 4000);
            return;
        }

        if (this.showTransferLimitMinError || this.showTransferLimitMaxError) {
            this.customSnackbarComponent.open(this.translationConstants.translate('bridge.error.transferLimitOutOfBounds'), SnackBarTheme.error, 4000);
            return;
        }

        if (this.useCustomRecipient || this.destinationRequiresRecipient) {
            const trimmedRecipient = this.recipientAddress?.trim();

            if (!trimmedRecipient) {
                this.customSnackbarComponent.open(this.translationConstants.translate('bridge.error.recipientRequired'), SnackBarTheme.error, 4000);
                return;
            }

            if (!this.isValidEvmAddress(trimmedRecipient)) {
                this.customSnackbarComponent.open(this.translationConstants.translate('bridge.error.invalidRecipient'), SnackBarTheme.error, 4000);
                return;
            }
        }

        if (this.slippageMode === 'custom') {
            const parsedSlippage = Number(this.slippagePercentage);

            if (Number.isNaN(parsedSlippage) || parsedSlippage < 0 || parsedSlippage > 100) {
                this.customSnackbarComponent.open(this.translationConstants.translate('bridge.error.invalidSlippage'), SnackBarTheme.error, 4000);
                return;
            }
        }

        this.executeBridge();
    }

    public executeBridge(): void {
        this.loading = true;

        const payload: BridgeExecutionPayload = {
            inputToken: {
                address: this.inputChainToken!.address,
                amount: this.quantityInputToken.toString(),
                decimals: this.inputChainToken!.decimals,
                symbol: this.inputChainToken!.symbol
            },
            outputToken: {
                address: this.outputChainToken!.address,
                decimals: this.outputChainToken!.decimals,
                symbol: this.outputChainToken!.symbol,
                expectedAmount: this.amountReceive.toString()
            },
            chain: {
                originChainId: this.chainFrom.chainId!,
                destinationChainId: this.chainTo.chainId!
            },
            fee: {
                bridgeFeeInToken: this.bridgeFeeInTokens.toString(),
                estimatedFillTimeSec: this.bridgeEstimatedFillTimeSec
            },
            transactionInfo: {
                outTax: this.transactionInfo.ourTax,
                gasCost: this.transactionInfo.gasCost,
                bridgeFee: this.transactionInfo.bridgeCost,
            }
        };

        if ((this.useCustomRecipient || this.destinationRequiresRecipient) && this.recipientAddress?.trim()) {
            payload.recipient = this.recipientAddress.trim();
        }

        if (this.slippageMode === 'custom') {
            payload.slippage = Number(this.slippagePercentage) / 100;
        }

        this.bridgeService.executeBridgeTransfer(payload)
            .subscribe({
                next: (response) => {
                    if (response?.success) {
                        this.handleBridgeSuccess(response);
                    } else {
                        this.handleBridgeFailure(response)
                    }
                },
                error: (err) => {
                    this.handleBridgeFailure(err)
                }
            }).add(() => {
                this.loading = false;
            })

    }

    private handleBridgeSuccess(response: BridgeExecutionResponse): void {
        const message = (response.tsxHash && response.bridgeTransactionId) ? (this.translationConstants.translate(`bridge.success.hash`) + ': ' + response.tsxHash) : this.translationConstants.translate(`bridge.success.generic`);
        this.customSnackbarComponent.open(message, SnackBarTheme.success, 4000);

        // Reset the form
        this.quantityInputToken = 0;
        this.amountReceive = 0;

        // Reload the page to refresh the balances.
        setTimeout(() => {
            window.location.reload();
        }, 4000);
    }

    private handleBridgeFailure(error: any): void {
        let errorMessage = 'bridge.error.generic';

        if (error?.message || error.error?.message) {
            const errorMsg = error?.message || error.error.message;

            // Specific error handling based on backend error messages.
            if (errorMsg.includes('insufficient funds')) {
                errorMessage = 'bridge.error.insufficientFunds';
            } else if (errorMsg.includes('insufficient balance')) {
                errorMessage = 'bridge.error.insufficientBalance';
            } else if (errorMsg.includes('allowance')) {
                errorMessage = 'bridge.error.allowance';
            } else if (errorMsg.includes('liquidity')) {
                errorMessage = 'bridge.error.insufficientLiquidity';
            } else if (errorMsg.includes('daily limit')) {
                errorMessage = 'bridge.error.dailyLimit';
            } else if (errorMsg.includes('CBE098')) {
                errorMessage = 'banking.transfers.error.CBE098';
            } else if (errorMsg.includes('CBE100')) {
                errorMessage = 'banking.transfers.error.CBE100';
            }
        }

        this.openSnackBar(
            this.translationConstants.translate(errorMessage),
            SnackBarTheme.error,
            4000
        );
    }

    public openSnackBar(message: string, theme: SnackBarTheme, duration?: number): void {
        this.customSnackbarComponent.open(message, theme, duration)
    }

    public openSuccessMessage(): void {
        this.customSnackbarComponent.open(this.translationConstants.translate('swap.snackbar.success'), SnackBarTheme.success, 3000);
        setTimeout(() => {
            window.location.reload();
        }, 10000);
    }

    public close(dismiss: boolean = false): void {
        this.dialogRef.close(dismiss);
    }

    public ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

}