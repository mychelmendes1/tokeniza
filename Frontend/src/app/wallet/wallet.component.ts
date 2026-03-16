import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { usefulSettings } from '../shared/models/useful-settings.model';
import { AccountService } from '../shared/services/account/account.service';
import { BrowserLanguageService } from '../shared/services/util/browser-language.service';
import { FormatStringService } from '../shared/services/util/format-string.service';
import { HoverIconClassService } from '../shared/services/util/hover-icon-class.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { LanguagesEnum } from '../shared/models/languages.enum';
import { CardClass, CardColorClassService } from '../shared/services/util/card-color-class.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TokenQrcodeModalComponent } from '../shared/modals/token-qrcode-modal/token-qrcode-modal.component';
import { DepositModalComponent } from '../shared/modals/deposit-modal/deposit-modal.component';
import { WithdrawModalComponent } from '../shared/modals/withdraw-modal/withdraw-modal.component';
import { RedeemRewardModalComponent } from '../shared/modals/redeem-reward-modal/redeem-reward-modal.component';
import { LoanApplicationModalComponent } from '../shared/modals/loan-application-modal/loan-application-modal.component';
import { StakingModalComponent } from '../shared/modals/staking-modal/staking-modal.component';
import { ChargeModalComponent } from '../shared/modals/charge-modal/charge-modal.component';
import { SwapCryptoModalComponent } from '../shared/modals/swap-crypto-modal/swap-crypto-modal.component';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AssetService } from '../shared/services/asset/asset.service';
import { CardListComponent } from '../shared/components/card-list/card-list.component';
import { fadeIn } from '../shared/services/util/animations.service';
import { MenuButtonMobileComponent } from '../shared/components/menu-button-mobile/menu-button-mobile.component';
import { EViewMode } from '../shared/models/view-mode.enum';
import { Assets } from '../shared/models/IAssets.model';
import BigNumber from 'bignumber.js';
import { catchError, combineLatest, forkJoin, of, Subscription } from 'rxjs';
import { AssetSearchResult } from '../shared/models/asset-search-input.model';
import { AuctionModalComponent } from '../shared/modals/auction-modal/auction-modal.component';
import { FeaturesStatusService } from '../shared/services/util/features-status.service';
import { FeatureNames } from '../shared/models/feature-names.enum';
import { UtilService } from '../shared/services/util/util.service';
import { SendModalComponent } from '../shared/modals/send-modal/send-modal.component';
import { ResellModalComponent } from '../shared/modals/resell-modal/resell-modal.component';
import { UserLoggedModel } from '../shared/models/user.logged.model';
import { AppService } from '../app.service';
import { AmountConvertedResult } from '../shared/models/amount-converted-result';
import { CrowdfundingService } from '../shared/services/crowdfunding/crowdfunding.service';
import { ECrowdfundingOrders, ECrowdfundingStatus, ICrowdfundingOrdersCard, IProjectCrowdfunding } from '../shared/models/IProjectCrowdfunding.model';
import { calculateDaysDifference, formatCrowdfundingDate, getDateSortingValue } from '../shared/services/util/date-converter.service';
import { CrowdfundingCheckoutModalComponent } from '../shared/modals/crowdfunding-checkout-modal/crowdfunding-checkout-modal.component';
import { FilterDuration } from '../shared/models/filter-duration.enum';
import { TokensService } from '../shared/services/tokens/token.service';
import { Token, TokenStatistics } from '../shared/models/tokens';
import { PlatformBalance } from '../shared/models/wallet.balance';
import { LocalStorageService } from 'angular-web-storage';
import { LocalStorageKeys } from '../shared/services/util/local.storage.keys';
import { CustomSnackbarComponent, SnackBarTheme } from '../shared/custom-snackbar/custom-snackbar.component';
import { TranslationConstants } from '../shared/services/util/translation.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { MaskedAmountValue } from '../constants/shared-constants';
import { FinancialService } from '../shared/services/financial/financial';
import { StakingBalanceHistory } from '../shared/models/staking.balance.history';
import { BottomSheetComponent } from '../shared/bottom-sheet/bottom-sheet.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ViewInternalChargeModalComponent } from '../shared/modals/view-internal-charge-modal/view-internal-charge-modal.component';
import { ViewExternalChargeModalComponent } from '../shared/modals/view-external-charge-modal/view-external-charge-modal.component';
import { TransferModalComponent } from '../shared/modals/transfer-modal/transfer-modal.component';
import { IInvoiceResponse } from '../shared/models/invoice.model';
import { ErrorPageComponent } from '../shared/components/error-page/error-page.component';
import { TokenPaymentModalComponent } from '../shared/modals/token-payment-modal/token-payment-modal.component';
import { SplitModalComponent } from '../shared/modals/split-modal/split-modal.component';
import { BridgeCryptoModalComponent } from '../shared/modals/bridge-crypto-modal/bridge-crypto-modal.component';
import { CryptoCurrencyResponse, ITransakOrderCreated, ITransakOrderSuccessful, TransakOnRampModel, TransakParameters } from '../shared/models/transak.models';
import { IUserAddress } from '../shared/models/IUserAddress';
import { TransakService } from '../shared/services/tokens/transak.service';
import { CollectionService } from '../shared/services/collection/collection.service';
import { v4 as uuidv4 } from 'uuid';
import transakSDK from '@transak/transak-sdk';
import { IOrderEvent } from '../shared/models/order.event';
import { PaymentTypesEnum } from '../shared/models/payment-type.enum';
import { Network } from '../shared/models/network.model';
import { CheckoutService } from '../shared/services/checkout/checkout.service';

@Component({
    selector: 'app-wallet',
    imports: [
        CommonModule,
        SharedModule,
        MatTableModule,
        MatSortModule,
        MatPaginatorModule,
        MenuButtonMobileComponent,
        CardListComponent,
        ErrorPageComponent
    ],
    templateUrl: './wallet.component.html',
    styleUrl: './wallet.component.scss',
    animations: [fadeIn]
})
export class WalletComponent implements OnInit {

    @ViewChild(CardListComponent) cardListComponent: CardListComponent | undefined;
    @ViewChild(MatPaginator) public paginator!: MatPaginator;
    @ViewChild('dataSourceNFT') set sortDataSourceNFT(sort: MatSort) {
        this.dataSource.sort = sort;
    }
    @ViewChild(MatSort) set sortDataSourceOffers(sort: MatSort) {
        this.dataSourceOffers.sort = sort;
    }
    @ViewChild('stakingSort') set sortDataSourceStaking(sort: MatSort) {
        this.dataSourceStaking.sort = sort;
    }
    @ViewChild('sortCharge') set sortCharge(sort: MatSort) {
        this.dataSourceAllUserHistoryTransactions.sort = sort;
    }
    public showErrorPage: boolean = false;
    public showBalance: boolean = true;
    public eLanguage: typeof LanguagesEnum = LanguagesEnum;
    public showAssetBalance: boolean = true;
    public usefulSettings: usefulSettings = new usefulSettings();
    public allUserNfts: Array<Assets> = [];
    public filteredUserNfts: Array<Assets> = [];
    public allUserOffers: Array<any> = [];
    public allUserStaking: Array<StakingBalanceHistory> = [];
    public allApplications: Array<any> = [];
    public allUserApplications: Array<any> = [];
    public allUserHistoryTransactions: Array<any> = [];
    public filteredAllUserHistoryTransactions: Array<any> = [];
    public filteredAllUserOffers: Array<ICrowdfundingOrdersCard> = [];
    public displayedColumnsOffers: string[] = ['offer', 'buy-date', 'amount', 'captured', 'min', 'final', 'actions1column'];
    public dataSourceOffers: MatTableDataSource<ICrowdfundingOrdersCard> = new MatTableDataSource<ICrowdfundingOrdersCard>(this.allUserOffers);
    public dataSource: MatTableDataSource<any> = new MatTableDataSource<any>(this.allUserNfts);
    public displayedColumns: string[] = ['nft', 'amount', 'current-value', 'deadline', 'actions3column'];
    public dataSourceStaking: MatTableDataSource<StakingBalanceHistory> = new MatTableDataSource<StakingBalanceHistory>(this.allUserStaking);
    public displayedColumnsStaking: string[] = ['token', 'quantity', 'initial-date', 'deadline', 'remaining-time', 'income', 'actions1column'];
    public dataSourceAllApplications: MatTableDataSource<any> = new MatTableDataSource<any>(this.allApplications);
    public displayedColumnsAllApplications: string[] = ['coin', 'applications', 'profitability', 'value-used', 'interest'];
    public dataSourceAllUserApplications: MatTableDataSource<any> = new MatTableDataSource<any>(this.allUserApplications);
    public displayedColumnsAllUserApplications: string[] = ['coin', 'loan', 'date', 'income'];
    public dataSourceAllUserHistoryTransactions: MatTableDataSource<any> = new MatTableDataSource<any>(this.allUserHistoryTransactions);
    public displayedColumnsAllUserHistoryTransactions: string[] = ['person', 'date', 'value', 'status', 'type', 'actions1column'];
    public totalAssetBalance: number = 0;
    public crowdfundingList: Array<IProjectCrowdfunding> = [];
    public loading: boolean = false;
    public loadingRequest: boolean = false;
    public offersButtons: Array<ETabButtons> = [
        ETabButtons.CAPTURE,
        ETabButtons.NOT_DONE
    ];
    public nftButtons: Array<ETabButtons> = [
        ETabButtons.ALLOCATIONS,
        ETabButtons.COMMUNITY,
        ETabButtons.COLLECTIBLE,
    ];
    public transactionButtons: Array<ETabButtons> = [
        ETabButtons.SENT,
        ETabButtons.RECEIVED
    ];
    public selectedOfferButton: ETabButtons = ETabButtons.CAPTURE;
    public selectedNftButton: ETabButtons = ETabButtons.ALLOCATIONS;
    public selectedTransactionButton: ETabButtons = ETabButtons.SENT;
    public eTabButtons: typeof ETabButtons = ETabButtons;
    public eStatus: typeof EStatus = EStatus;
    public eStatusOrders: typeof ECrowdfundingOrders = ECrowdfundingOrders;
    public selectedNftViewMode: string = EViewMode.LIST;
    public eViewMode: typeof EViewMode = EViewMode;
    public isResellAllowed: boolean = false;
    public isNFTStakingEnabled: boolean = false;
    public isSendNFTAllowed: boolean = false;
    public isAuctionNFTAllowed: boolean = false;
    public distributeOnNFTs?: boolean = false;
    public isAuthenticated: boolean = false;
    public selectedTab: number = 0;
    public scrollCards: boolean = false;
    public userLogged: UserLoggedModel = Object() as UserLoggedModel;
    public showBalanceSubscription: Subscription = new Subscription;
    public totalBalance: number = 0;
    public currentDate = new Date();
    public selectedDurationCategorie: string = '';
    public filter: { duration: FilterDuration[] } = {
        duration: [
            FilterDuration.TwelveMonths,
            FilterDuration.EighteenMonths,
            FilterDuration.TwentyMonths,
            FilterDuration.ThirtySixMonths,
            FilterDuration.FortyTwoMonths,
            FilterDuration.All,
        ]
    };
    public searchOrderName: string = '';
    public tokens: Array<Token> = [];
    public filteredTokens: Array<Token> = [];
    public userBalances: Array<PlatformBalance> = [];
    public tokenStatitics: TokenStatistics[] = [];
    public quotations: AmountConvertedResult[] = [];
    public haveMfa: boolean = false;
    public mfaType?: string = '';
    public searchChargeByEmail: string = '';
    public showAllTokens: boolean = false;

    // Transak
    public transakCryptosAvailables: CryptoCurrencyResponse[] = [];
    public userAddress: IUserAddress | undefined = undefined;
    public allowTransak: boolean = false;
    public networks: Network[] = [];
    @ViewChild('transakIframe', { static: true })
    iframeRef!: ElementRef<HTMLIFrameElement>;
    public userAuthenticationData: UserLoggedModel | undefined = undefined;

    constructor(
        private readonly accountService: AccountService,
        private readonly browserLanguageService: BrowserLanguageService,
        private readonly formatStringService: FormatStringService,
        public hoverIconClassService: HoverIconClassService,
        private readonly cardColorClassService: CardColorClassService,
        private readonly dialog: MatDialog,
        private readonly router: Router,
        private readonly assetService: AssetService,
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly assetsService: AssetService,
        private readonly featuresStatusService: FeaturesStatusService,
        private readonly utilService: UtilService,
        private readonly activatedRoute: ActivatedRoute,
        private readonly appService: AppService,
        private readonly crowdfundingService: CrowdfundingService,
        private readonly tokensService: TokensService,
        private readonly localStorage: LocalStorageService,
        private readonly clipboard: Clipboard,
        private readonly customSnackbar: CustomSnackbarComponent,
        private readonly translationConstants: TranslationConstants,
        private readonly financialService: FinancialService,
        private readonly bottomSheet: MatBottomSheet,
        private readonly transakService: TransakService,
        private readonly collectionService: CollectionService,
        private readonly checkoutService: CheckoutService
    ) {
        this.getUserLoggedDetails();
    }

    public ngOnInit(): void {
        this.usefulSettings = {
            fiatCurrency: this.accountService.getFiatCurrency(),
            selectedLanguage: this.browserLanguageService.getBrowserLanguage()
        }
        this.extractedUrlParams();
        this.initData();

        this.showBalanceSubscription = this.appService.getShowBalance().subscribe(value => {
            this.showAssetBalance = value;
            this.showBalance = value;
        });

        this.selectOfferButton(ETabButtons.CAPTURE);
    }

    public ngOnDestroy(): void {
        if (this.showBalanceSubscription) {
            this.showBalanceSubscription.unsubscribe();
        }
    }

    public getUserLoggedDetails(): void {
        this.accountService.getLoggedUserDetails().subscribe(userDetails => {
            this.userLogged = userDetails;
        });
    }

    public extractedUrlParams(): void {
        this.activatedRoute.queryParams.subscribe((param: Params) => {
            if (param) {
                this.selectedTab = param['selectedTab'];
                this.selectedNftViewMode = param['selectedView'] ?? EViewMode.LIST;
                this.scrollCards = param['scrollCards'] === 'true';
            }
        });
    }

    public async ngAfterViewInit(): Promise<void> {
        setTimeout(async () => {
            if (this.sortDataSourceNFT) {
                this.dataSource.sort = this.sortDataSourceNFT;
            }

            if (this.sortDataSourceOffers) {
                this.dataSourceOffers.sort = this.sortDataSourceOffers;
            }

            if (this.dataSourceStaking) {
                this.dataSourceStaking.sort = this.sortDataSourceStaking;
            }

            if (this.dataSourceAllUserHistoryTransactions) {
                this.dataSourceAllUserHistoryTransactions.sort = this.sortCharge;
            }

            this.tableSortingDataAccessor(this.dataSource);
            this.tableSortingOfferAccessor(this.dataSourceOffers);
            this.tableSortingStakingAccessor(this.dataSourceStaking);
            this.tableSortingChargeAccessor(this.dataSourceAllUserHistoryTransactions);
            this.changeDetectorRef.detectChanges();
        }, 200);
    }

    public initData(): void {
        this.loading = true;
        this.allUserNfts = [];
        combineLatest({
            ResellAllowed: this.featuresStatusService.getFeatureStatus(FeatureNames.NFT_RESALE),
            SendNFTAllowed: this.featuresStatusService.getFeatureStatus(FeatureNames.SEND_NFT),
            NFTStakingEnabled: this.featuresStatusService.getFeatureStatus(FeatureNames.STAKING_NFT),
            auctionEnabled: this.featuresStatusService.getFeatureStatus(FeatureNames.AUCTION_NFT),
            distributeOnNFTs: this.featuresStatusService.getFeatureStatus(FeatureNames.DISTRIBUTE_ON_NFTS),
            isAuthenticated: this.accountService.isAuthenticated(false, false),
            orderList: this.crowdfundingService.getAllUserOders(),
            crowdfundingList: this.crowdfundingService.getCrowdfundings(),
            tokenList: this.tokensService.getTokens(),
            balances: this.accountService.allBalances(),
            exchangeList: this.tokensService.getDataForExchange(),
            quotations: this.accountService.allQuotations(),
            userStakes: this.financialService.getUserStakes(''),
            internalInvoices: this.financialService.getInvoices(),
            externalInvoices: this.financialService.getExternalDeposits(),
            assets: this.assetService.getEniatoBalance(),
            mfaData: this.accountService.verifyMFAStatus(),
            transakCryptos: this.transakService.getCryptoCurrencies().pipe(catchError(error => { return of(null); })), // To avoid broke the screen
            allowTransak: this.featuresStatusService.getFeatureStatus(FeatureNames.TRANSAK, false).pipe(catchError(error => { return of(false); })), // To avoid broke the screen
            networks: this.collectionService.getNetworks(true) // To avoid broke the screen
        }).subscribe(response => {
            this.allowTransak = response?.allowTransak || false;
            this.networks = response.networks || [];
            this.transakCryptosAvailables = response.transakCryptos || [];
            this.isResellAllowed = response?.ResellAllowed;
            this.isSendNFTAllowed = response?.SendNFTAllowed;
            this.isNFTStakingEnabled = response?.NFTStakingEnabled;
            this.isAuctionNFTAllowed = response?.auctionEnabled;
            this.distributeOnNFTs = response?.distributeOnNFTs;
            this.isAuthenticated = response?.isAuthenticated ? true : false;
            this.userBalances = response?.balances || [];

            this.tokenStatitics = response?.exchangeList;
            this.quotations = response?.quotations;
            this.allUserStaking = response?.userStakes;
            this.dataSourceStaking.data = this.allUserStaking;
            this.tableSortingStakingAccessor(this.dataSourceStaking);
            this.dataSourceStaking._updateChangeSubscription();
            this.haveMfa = response.mfaData?.status;
            this.mfaType = response.mfaData?.type;
            if (response?.assets?.balances) {
                let totalBalance = 0;
                for (let assetData of response?.assets.balances) {
                    if (assetData.asset) {
                        assetData.asset.quantity = Number(assetData.balance);
                        const newAsset: Assets = new Assets(assetData.asset);
                        this.allUserNfts.push(newAsset);
                        totalBalance += new BigNumber(assetData?.asset?.price).toNumber();
                    }
                }
                this.totalAssetBalance = totalBalance;
            }

            this.dataSource.data = this.allUserNfts
            this.filteredUserNfts = this.allUserNfts;
            this.tableSortingDataAccessor(this.dataSource);
            this.dataSource._updateChangeSubscription();

            let totalBalance: number = 0;

            for (let balance of response.balances) {
                totalBalance += this.fiatAmount(balance.unitOfMoney, response.quotations, balance.balance);
            }
            this.totalBalance = totalBalance;

            this.crowdfundingList = response?.crowdfundingList;

            response.orderList = response.orderList?.filter(order => order.status !== 'CANCELLED');
            response.orderList = response.orderList;

            this.allUserOffers = response?.orderList.map((order) => {
                const projectCrowdfunding = response?.crowdfundingList.find((project) => project.id === order.project_id);
                let object = {
                    ...order,
                    ...projectCrowdfunding,
                    order_id: order.id
                };

                const totalDays: number = this.calculateDaysDifference(this.currentDate, object.finalDate as any);
                if (object?.moneyReceived != null && object?.targetCapture != null) {
                    const percentage = (Number(object.moneyReceived) / Number(object.targetCapture)) * 100;
                    object.targetAmountPercentage = Math.min(percentage, 100); // Limita a 100%
                } else {
                    object.targetAmountPercentage = 0;
                }

                object.daysRemaining = totalDays;
                object.status = order.status;

                return object;
            });
            this.loadTokens(response.tokenList);
            this.filteredAllUserOffers = this.allUserOffers.slice();
            this.filterOffersTable();

            this.filteredAllUserHistoryTransactions = [
                ...(response?.internalInvoices ?? []),
                ...(response?.externalInvoices ?? [])
            ];

            this.filteredTransactionsTable();
            this.getTokenStatistics();
        }, error => {
            if (error) {
                this.showErrorPage = true;
            }
        }).add(() => {
            this.loading = false;
        });
    }

    public isInvoiceInternal(invoice: any): boolean {
        if (!invoice?.name) {
            return true;
        } else {
            return false
        }
    }

    public loadMoreTokens(): void {
        this.showAllTokens = !this.showAllTokens;
        this.defineShowLoadMoreButton();
    }

    private loadTokens(tokenList: Token[]): void {
        if (tokenList?.length > 0) {
            this.tokens = tokenList?.filter(tkn => tkn.enabled);

            if (
                this.allowTransak &&
                (this.transakCryptosAvailables?.length === 0 || this.networks?.length === 0)
            ) {
                this.allowTransak = false;
            }

            for (let token of tokenList) {
                if (this.allowTransak) {
                    const tokenNetworkDetails = this.networks?.find(nw => nw?.id === token?.network_id);
                    token.transakEnabled = !!this.transakCryptosAvailables.find(tca =>
                        tca.chainId === tokenNetworkDetails?.chain_id &&
                        tca.symbol === token.id &&
                        tca.network &&
                        tca.network?.name?.toLowerCase() === token?.network_id?.toLowerCase()
                    );
                }

                token["balance"] = this.getBalanceInTokens(token?.id);
            }

            let btc: Token | undefined = this.tokens.find(entry => entry.id === 'BTC');
            let brl: Token | undefined = this.tokens.find(entry => entry.id === 'tBRL');

            this.tokens = tokenList?.filter(entry => entry.id !== 'tBRL' && entry.id !== 'BTC')?.sort((a, b) => Number(b["balance"]) > Number(a["balance"]) ? 1 : Number(b["balance"]) < Number(a["balance"]) ? -1 : 0);

            if (btc) {
                this.tokens.unshift(btc);
            }

            if (brl) {
                this.tokens.unshift(brl);
            }

            this.defineShowLoadMoreButton();
        }
    }

    private defineShowLoadMoreButton(): void {
        if (this.showAllTokens) {
            this.filteredTokens = this.tokens;
        } else {
            this.filteredTokens = this.tokens.slice(0, 4);
        }
    }

    public getBalanceInTokens(tokenId: string): number {
        const balance: BigNumber | undefined = this.userBalances.find(balance => balance.unitOfMoney === tokenId)?.balance;
        return new BigNumber(balance || 0).toNumber();
    }

    public getBalanceInCurrency(tokenId: string, quotation: number | undefined): number {
        const tokens: number = this.getBalanceInTokens(tokenId);
        return new BigNumber(tokens).multipliedBy(new BigNumber(quotation || 0)).toNumber();
    }

    private getTokenStatistics(): void {
        this.tokens.forEach((token) => {
            const statistics: TokenStatistics | undefined = this.tokenStatitics.find(tkn => tkn.coin === token.id);

            token.statistics = new TokenStatistics({
                coin: statistics?.coin ?? token.id,
                qty_buyers: statistics?.qty_buyers,
                qty_issued: statistics?.qty_issued,
                qty_available: statistics?.qty_available,
                qty_with_issuer: statistics?.qty_with_issuer,
                exchangeStatistics: {
                    price: new BigNumber((this.quotations.find(quote => quote.currency === token?.id)?.amount) as any)?.toNumber(),
                    ...statistics?.exchangeStatistics
                }
            });
        });
    }

    public filterOrdersName(orderName: string = ''): void {
        let filteredList: ICrowdfundingOrdersCard[] = [];

        const offersCaptureList: ICrowdfundingOrdersCard[] = this.filteredAllUserOffers.filter(
            offer => offer.status !== ECrowdfundingOrders.CREATED
        );

        const offersNotDoneList: ICrowdfundingOrdersCard[] = this.filteredAllUserOffers.filter(
            offer => offer.status === ECrowdfundingOrders.CREATED
        );

        if (this.selectedOfferButton === ETabButtons.CAPTURE) {
            filteredList = [...offersCaptureList];
        } else if (this.selectedOfferButton === ETabButtons.NOT_DONE) {
            filteredList = [...offersNotDoneList];
        } else {
            filteredList = [...this.filteredAllUserOffers];
        }

        if (orderName) {
            orderName = orderName.toLowerCase();
            filteredList = filteredList.filter(order => order.name?.toLowerCase()?.includes(orderName));
        }

        this.dataSourceOffers.data = [...filteredList];
    }

    public calculateDaysDifference(start: Date | string, end: Date | string): number {
        return calculateDaysDifference(start, end);
    }
    public formatCrowdfundingDate(value?: string | Date): string {
        return formatCrowdfundingDate(
            value,
            this.usefulSettings.selectedLanguage === this.eLanguage.PORTUGUESE ? 'pt-BR' : 'en-US'
        );
    }


    public auctionAsset(asset: any): void {
        if (asset?.on_staking || asset?.resale?.onResale) {
            return;
        }

        const dialogRef: MatDialogRef<AuctionModalComponent> = this.dialog.open(AuctionModalComponent, {
            data: asset
        });

        dialogRef.afterClosed().subscribe(action => {
            if (action) {
                this.ngOnInit();
            }
        });
    }

    public sendAsset(asset: Assets) {
        if ((asset?.resale?.onResale && this.isResellAllowed) || asset?.on_staking) {
            return;
        }

        const dialogRef = this.dialog.open(SendModalComponent, {
            data: {
                asset
            }
        });

        // If you confirmed the shipment, we need to update the asset list.
        dialogRef.afterClosed().subscribe(action => {
            if (action) {
                this.ngOnInit();
            }
        });
    }

    public splitAsset(asset: Assets, isEditing: boolean): void {
        if (asset?.on_staking) {
            return;
        }

        const dialogRef: MatDialogRef<SplitModalComponent> = this.dialog.open(SplitModalComponent, {
            data: { asset, isEditing }
        });

        dialogRef.afterClosed().subscribe(action => {
            if (action) {
                this.loadBalance();
            }
        });
    }

    public resellAsset(asset: Assets, isEditing: boolean): void {
        if (asset?.on_staking) {
            return;
        }

        const dialogRef: MatDialogRef<ResellModalComponent> = this.dialog.open(ResellModalComponent, {
            data: { asset, isEditing }
        });

        dialogRef.afterClosed().subscribe(action => {
            if (action) {
                this.initData();
            }
        });
    }

    public async loadBalance(): Promise<void> {
        this.loading = true;
        this.allUserNfts = [];
        combineLatest([
            this.assetService.getEniatoBalance(),
            this.accountService.allQuotations(),
            this.accountService.allBalances(),
        ]).subscribe(async ([assets, quotations, balances]) => {

            this.dataSource.data = this.allUserNfts
            this.filteredUserNfts = this.allUserNfts;
            this.tableSortingDataAccessor(this.dataSource);
            this.dataSource._updateChangeSubscription();

            let totalBalance: number = 0;

            for (let balance of balances) {
                totalBalance += this.fiatAmount(balance.unitOfMoney, quotations, balance.balance);
            }
            this.totalBalance = totalBalance;

        }).add(() => {
            this.loading = false;
        });
    }

    public fiatAmount(unitOfMoney: string, quotes: AmountConvertedResult[], balance: any): number {
        let quote: BigNumber | undefined = quotes?.find(quote => quote.currency === unitOfMoney)?.amount;
        return new BigNumber(quote || 0).multipliedBy(balance || 0).toNumber();
    }

    public filterAssets(value: string): void {
        const normalizedText: string = this.utilService.normalizeText(value);

        this.filteredUserNfts = this.allUserNfts.filter(nft =>
            this.utilService.normalizeText(JSON.stringify(nft)).includes(normalizedText)
        );

        setTimeout(() => this.dataSource.data = this.filteredUserNfts);

    }

    public maskedAmountValue(): string[] {
        return this.formatStringService.maskedAmountValue(MaskedAmountValue);
    }

    public getCardColorClass(percentage: number): CardClass {
        return this.cardColorClassService.getCardColorClass(percentage);
    }

    public selectOfferButton(button: ETabButtons): void {
        this.selectedOfferButton = button;

        if (button === ETabButtons.CAPTURE) {
            this.displayedColumnsOffers = ['offer', 'buy-date', 'amount', 'captured', 'min', 'final', 'status', 'actions1column'];
        } else {
            this.displayedColumnsOffers = ['offer', 'buy-date', 'amount', 'capturedFinal', 'min'];
        }
        this.filterOffersTable();
        this.clearFilters();
    }

    public filterOffersTable(): void {
        if (this.selectedOfferButton === ETabButtons.CAPTURE) {
            this.allUserOffers = this.filteredAllUserOffers.filter(offer => {
                const projectCrowdfunding: IProjectCrowdfunding | undefined = this?.crowdfundingList.find((project) => project.id === offer.project_id);
                if ((projectCrowdfunding as IProjectCrowdfunding)?.status === ECrowdfundingStatus.ACTIVE) {
                    return true;
                } else {
                    return false;
                }
            });
        } else {
            this.allUserOffers = this.filteredAllUserOffers.filter(offer => {
                const projectCrowdfunding: IProjectCrowdfunding | undefined = this?.crowdfundingList.find((project) => project.id === offer.project_id);
                if ((projectCrowdfunding as IProjectCrowdfunding)?.status !== ECrowdfundingStatus.ACTIVE) {
                    return true;
                } else {
                    return false;
                }
            });
        }
        setTimeout(() => this.dataSourceOffers.data = this.allUserOffers);

        this.tableSortingOfferAccessor(this.dataSourceOffers);
    }

    public translateOfferButton(button: ETabButtons): string {
        if (!button) {
            return '--';
        } else if (button === ETabButtons.CAPTURE) {
            return 'button.inCapture';
        } else {
            return 'button.notDone';
        }
    }

    public translateStatus(status: string, table: string = ''): string {
        if (!status) {
            return '--';
        }

        if (table === 'offers') {
            if (status === ECrowdfundingOrders.CREATED) {
                return 'wallet.waitingPayment';
            } else {
                return 'wallet.refunded';
            }
        } else {
            return this.translationConstants.translate('wallet.invoice.status.' + status);
        }
    }

    public translateType(invoice: any): string {
        if (!invoice) {
            return '--';
        }

        if (invoice['name']) {
            return this.translationConstants.translate('wallet.invoice.external');
        } else {
            return this.translationConstants.translate('wallet.invoice.internal');
        }
    }

    public selectNftButton(button: ETabButtons): void {
        this.selectedNftButton = button;
    }

    public selecTransactionButton(button: ETabButtons): void {
        this.selectedTransactionButton = button;

        this.filteredTransactionsTable();
    }

    public filteredTransactionsTable(): void {
        if (this.selectedTransactionButton === ETabButtons.SENT) {
            this.allUserHistoryTransactions = this.filteredAllUserHistoryTransactions.filter(transaction => transaction.userIdFrom === this.userLogged?.id);
        } else {
            this.allUserHistoryTransactions = this.filteredAllUserHistoryTransactions.filter(transaction => transaction.userIdFrom !== this.userLogged?.id);
        }
        this.dataSourceAllUserHistoryTransactions.data = this.allUserHistoryTransactions;

        this.tableSortingChargeAccessor(this.dataSourceAllUserHistoryTransactions);
        this.dataSourceAllUserHistoryTransactions._updateChangeSubscription();
    }

    public translateNftButton(button: ETabButtons): string {
        if (!button) {
            return '--';
        } else if (button === ETabButtons.ALLOCATIONS) {
            return 'wallet.allocations';
        } else if (button === ETabButtons.COMMUNITY) {
            return 'wallet.community';
        } else {
            return 'wallet.collectibles';
        }
    }

    public translateTransactionButton(button: ETabButtons): string {
        if (!button) {
            return '--';
        } else if (button === ETabButtons.RECEIVED) {
            return 'wallet.received';
        } else {
            return 'wallet.sent';
        }
    }

    public selectNftViewMode(mode: string) {
        this.selectedNftViewMode = mode;
    }

    public openTokenQrCodeModal(token: Token): void {
        const dialogRef: MatDialogRef<TokenQrcodeModalComponent> = this.dialog.open(TokenQrcodeModalComponent, {
            data: {
                token: token
            }
        });

        this.setUnitOfMoneyInStorage(token.id);
    }

    public openDepositModal(): void {
        const dialogRef: MatDialogRef<DepositModalComponent> = this.dialog.open(DepositModalComponent, {
            data: {
                tokens: this.tokens
            }
        });
    }

    public openTransferModal(): void {
        if (!this.haveMfa && this.loading) {
            return;
        }

        if (!this.haveMfa) {
            this.router.navigate(['/profile'], {
                queryParams: {
                    withdrawMfa: true
                }
            });
        } else {
            const dialogRef: MatDialogRef<TransferModalComponent> = this.dialog.open(TransferModalComponent, {});

            dialogRef.afterClosed().subscribe((action: boolean) => {
                if (action) {
                    this.initData();
                }
            });
        }
    }

    public openWithdrawModal(unitOfMoney?: string): void {
        if (!this.haveMfa && this.loading) {
            return;
        }

        const dialogRef: MatDialogRef<WithdrawModalComponent> = this.dialog.open(WithdrawModalComponent, {
            data: { unitOfMoney: unitOfMoney }
        });

        this.setUnitOfMoneyInStorage('tBRL');
        dialogRef.afterClosed().subscribe((action: boolean) => {
            if (action) {
                this.initData();
            }
        });
        dialogRef.componentInstance.reloadBalance.subscribe((action: boolean) => {
            if (action) {
                this.initData();
            }
        });
    }

    public openRedeemRewardModal(): void {
        const dialogRef: MatDialogRef<RedeemRewardModalComponent> = this.dialog.open(RedeemRewardModalComponent, {});
    }

    public openLoanApplicationModal(): void {
        const dialogRef: MatDialogRef<LoanApplicationModalComponent> = this.dialog.open(LoanApplicationModalComponent, {});
    }

    public openStakingModal(): void {
        const dialogRef: MatDialogRef<StakingModalComponent> = this.dialog.open(StakingModalComponent, {});

        dialogRef.componentInstance.reloadBalance.subscribe((action: boolean) => {
            if (action) {
                this.ngOnInit();
            }
        });
    }

    public openChargeModal(): void {
        const dialogRef: MatDialogRef<ChargeModalComponent> = this.dialog.open(ChargeModalComponent, {});

        dialogRef.afterClosed().subscribe((action: boolean) => {
            if (action) {
                this.ngOnInit();
            }
        });

        dialogRef.componentInstance.reloadChargeList.subscribe((action: boolean) => {
            if (action) {
                this.ngOnInit();
            }
        });
    }

    public openSwapCryptoModal(): void {
        const dialogRef: MatDialogRef<SwapCryptoModalComponent> = this.dialog.open(SwapCryptoModalComponent, {});

        dialogRef.afterClosed().subscribe((action: boolean) => {
            if (action) {
                this.initData();
            }
        });

        dialogRef.componentInstance.reloadCryptoBalance.subscribe((action: boolean) => {
            if (action) {
                this.initData();
            }
        });
    }

    public openBridgeCryptoModal(): void {
        const dialogRef: MatDialogRef<BridgeCryptoModalComponent> = this.dialog.open(BridgeCryptoModalComponent, {});

        dialogRef.afterClosed().subscribe((action: boolean) => {
            if (action) {
                this.initData();
            }
        });

        dialogRef.componentInstance.reloadCryptoBalance.subscribe((action: boolean) => {
            if (action) {
                this.initData();
            }
        });
    }

    public goToExtract(): void {
        this.router.navigate(['/wallet/extract']);
    }

    public getMainPhoto(asset: any): string | undefined {
        return this.assetsService.getAssetMainPhoto(asset);
    }

    public getSymbom(asset: Assets | AssetSearchResult): string {
        if (asset.collection?.priceCurrency) {
            return asset.collection.priceCurrency;
        } else {
            return this.usefulSettings.fiatCurrency.symbol;
        }
    }

    public reloadData(forceReload: boolean): void {
        if (forceReload) {
            this.initData();
        }
    }

    public goToCheckout(asset: Assets | AssetSearchResult) {
        if (asset) {
            //In case there is a nftId, it means we are talking about a resale, hence, we must to search a specific NFT which is stored in a different table
            //In case not, we are looking to a general NFT will be bought for the very first time
            if (asset?.nftId) {
                window.open(`marketplace/product/nft:${asset.nftId}/checkout`, '_self');
            } else {
                window.open(`marketplace/product/asset:${asset.id}/checkout`, '_self');
            }
        }
    }

    public tableSortingDataAccessor(dataSource: MatTableDataSource<AssetSearchResult>): void {
        dataSource.sortingDataAccessor = (asset: AssetSearchResult, property: string): any => {
            if (property === 'amount') {
                return asset.price ? new BigNumber(asset.price).toNumber() : 0;
            }

            if (property === 'current-value') {
                return asset.resale?.resale_value ? new BigNumber(asset.resale.resale_value).toNumber() : 0;
            }

            if (property === 'deadline') {
                return asset.auction?.deadline ? new Date(asset.auction.deadline).getTime() : 0;
            }

            return (asset as AssetSearchResult | any)[property];
        };
    }

    public tableSortingOfferAccessor(dataSource: MatTableDataSource<ICrowdfundingOrdersCard>): void {
        dataSource.sortingDataAccessor = (project: ICrowdfundingOrdersCard, property: string): string | number => {
            switch (property) {
                case 'buy-date':
                    return new Date(project.created_at as Date).getTime()
                        ;

                case 'amount':
                    return project.amount ? Number(project.amount) : 0
                        ;

                case 'captured':
                    return Number(project.targetAmountPercentage) || 0
                        ;

                case 'min':
                    return Number(project.minimumCapture) || 0
                        ;

                case 'final':
                    return getDateSortingValue(project.finalDate as any)
                        ;

                case 'capturedFinal':
                    return project.targetCapture ? Number(project.targetCapture) : 0
                        ;

                default:
                    return (project as any)[property] || ''
                        ;
            }
        };
    }

    public tableSortingStakingAccessor(dataSource: MatTableDataSource<StakingBalanceHistory>): void {
        dataSource.sortingDataAccessor = (staking: StakingBalanceHistory, property: string): string | number => {
            switch (property) {
                case 'quantity':
                    return staking.amountStaked ? new BigNumber(staking.amountStaked).toNumber() : 0
                        ;

                case 'initial-date':
                    return new Date(staking.startDate as Date).getTime()
                        ;

                case 'deadline':
                    return Number(staking.config.stakingLength) || 0
                        ;

                case 'remaining-time':
                    return new Date(staking.endDate as Date).getTime()
                        ;

                case 'income':
                    return this.getAmountToGain(staking);
                    ;

                default:
                    return (staking as any)[property] || ''
                        ;
            }
        };
    }

    public tableSortingChargeAccessor(dataSource: MatTableDataSource<IInvoiceResponse>): void {
        dataSource.sortingDataAccessor = (element: any, property: string): string | number => {
            switch (property) {
                case 'value':
                    return new BigNumber(element.fiduciaryAmount).toNumber() || new BigNumber(element.fiatAmount).toNumber()
                        ;

                case 'date':
                    return new Date(element.creationDate as Date).getTime() || new Date(element.when as Date).getTime()
                        ;

                default:
                    return (element as any)[property] || ''
                        ;
            }
        };
    }

    public toggleHideBalance(): void {
        this.appService.toggleHideBalance();
    }

    public percentageProgressBar(captures: string, goal: string): number {
        let result: number = (Number(captures) / Number(goal)) * 100;

        if (result > 100) {
            result = 100;
        } else if (result > 0 && result < 1) {
            result = 2;
        }

        return result;
    }

    public goToCrowdfundfingDetails(id: string): void {
        this.router.navigate([`/crowdfunding/details/${id}`]);
    }

    public openCheckoutModal(crowdFundingId: string, pendingPaymentId: string): void {
        if (!this.userLogged) {
            this.router.navigate(['/account/login'], {
                queryParams: {
                    redirectUrl: this.router.url,
                }
            });
            return;
        } else {
            const dialogRef: MatDialogRef<CrowdfundingCheckoutModalComponent> = this.dialog.open(CrowdfundingCheckoutModalComponent, {
                data: {
                    id: crowdFundingId,
                    pendingPaymentId: pendingPaymentId,
                }
            });

            dialogRef.afterClosed().subscribe((action: boolean) => {
                if (action) {
                    this.initData();
                }
            });
        }
    }

    public translateFilterDuration(duration: FilterDuration): string {
        if (!duration) {
            return '';
        } else if (duration === FilterDuration.All) {
            return 'filter.all';
        } else if (duration === FilterDuration.TwelveMonths) {
            return 'filter.duration.twelveMonths';
        } else if (duration === FilterDuration.EighteenMonths) {
            return 'filter.duration.eighteenMonths';
        } else if (duration === FilterDuration.TwentyMonths) {
            return 'filter.duration.twentyMonths';
        } else if (duration === FilterDuration.ThirtySixMonths) {
            return 'filter.duration.thirtySixMonths';
        } else {
            return 'filter.duration.fortyTwoMonths';
        }
    }

    public clearFilters(): void {
        this.selectedDurationCategorie = '';
        this.filterOrdersName('');
        this.applyFilters();
        this.searchOrderName = '';
    }

    public applyFilters(): void {
        let filteredList: ICrowdfundingOrdersCard[] = [];

        const offersCaptureList: ICrowdfundingOrdersCard[] = this.filteredAllUserOffers.filter(
            offer => offer.status !== ECrowdfundingOrders.CREATED
        );

        const offersNotDoneList: ICrowdfundingOrdersCard[] = this.filteredAllUserOffers.filter(
            offer => offer.status === ECrowdfundingOrders.CREATED
        );

        if (this.selectedOfferButton === ETabButtons.CAPTURE) {
            filteredList = this.getDurationSelection(offersCaptureList);
        } else if (this.selectedOfferButton === ETabButtons.NOT_DONE) {
            filteredList = this.getDurationSelection(offersNotDoneList);
        } else {
            filteredList = [...this.filteredAllUserOffers];
        }

        this.dataSourceOffers.data = [...filteredList];
    }

    public getDurationSelection(list: ICrowdfundingOrdersCard[]) {
        if (!this.selectedDurationCategorie || this.selectedDurationCategorie === FilterDuration.All) {
            return list;
        }

        const durationMap = {
            [FilterDuration.TwelveMonths]: 12,
            [FilterDuration.EighteenMonths]: 18,
            [FilterDuration.TwentyMonths]: 20,
            [FilterDuration.ThirtySixMonths]: 36,
            [FilterDuration.FortyTwoMonths]: 42
        } as const;

        return list.filter(project =>
            project?.deadline && Number(project.deadline) >= durationMap[this.selectedDurationCategorie as keyof typeof durationMap]
        );
    }

    public copyPublicWallet(tokenId: string): void {
        let publicWallet: string = '';

        if (tokenId === 'BTC') {
            publicWallet = this.userLogged.btc_wallet as string;
        } else {
            publicWallet = this.userLogged.walletPublicData as string;
        }

        this.setUnitOfMoneyInStorage(tokenId);

        this.clipboard.copy(publicWallet);
        this.customSnackbar.open(this.translationConstants.translate('snackbar.keyCopied'), SnackBarTheme.success, 3000);
    }

    public setUnitOfMoneyInStorage(tokenId: string): void {
        this.localStorage.set(LocalStorageKeys.UNIT_OF_MONEY, tokenId);
    }

    public getNumberFromBigNumber(value: any): number {
        return new BigNumber(value)?.toNumber();
    }

    public checkStakeTransactionStatus(history: StakingBalanceHistory): string {
        if (history?.earlyLeave) {
            return "transaction-canceled";
        } else if (!history?.earlyLeave && history?.applied) {
            return "transaction-income";
        } else {
            return "transaction-started";
        }
    }

    public getStakeDeadline(history: StakingBalanceHistory): string {
        let text: string = '';
        if (history?.config?.periodType === 'M') {
            text = `${history?.config?.stakingLength} ${this.translationConstants.translate(history?.config?.stakingLength > 1 ? 'wallet.stake.months' : 'wallet.stake.month')}`;
        } else {
            text = `${history?.config?.stakingLength} ${this.translationConstants.translate(history?.config?.stakingLength > 1 ? 'wallet.stake.years' : 'wallet.stake.year')}`;
        }

        return text;
    }

    public getAmountToGain(history: StakingBalanceHistory): number {
        let value: number = 0;
        const quoteDetails = this.quotations?.find(qt => qt?.currency === history?.config?.unit_of_money);
        const quote = this.usefulSettings?.fiatCurrency?.currency === 'BRL' ? quoteDetails?.amount || new BigNumber(0) : quoteDetails?.amountUsd || new BigNumber(0);

        value = new BigNumber(history?.amountStaked || 0).multipliedBy(new BigNumber(quote || 1))?.toNumber();
        return value;
    }

    public calculateRemainingStakeMonths(history: StakingBalanceHistory): string {
        const today: Date = new Date();
        const endDay: Date = new Date(history?.endDate as Date);
        today.setHours(0, 0, 0, 0);
        endDay.setHours(0, 0, 0, 0);

        const difference: BigNumber = new BigNumber(endDay.getTime() - today.getTime());
        const days: number = Number(difference.dividedBy(new BigNumber(1000 * 60 * 60 * 24)));
        const months: number = Math.floor(days / 30);

        let remainMonths: string = '';
        if (months > 1) {
            remainMonths = `${months} ${this.translationConstants.translate('wallet.stake.months')}`;
        } else if (months === 1) {
            remainMonths = `${months} ${this.translationConstants.translate('wallet.stake.month')}`;
        } else {
            remainMonths = `0 ${this.translationConstants.translate('wallet.stake.month')}`;
        }

        return remainMonths;
    }

    public checkTransactionStatus(history: StakingBalanceHistory): string {
        if (history?.earlyLeave) {
            return "transaction-canceled";
        } else if (!history?.earlyLeave && history?.applied) {
            return "transaction-income";
        } else {
            return "transaction-started";
        }
    }

    public checkTransactionIcon(history: StakingBalanceHistory): string {
        if (!history) {
            return '';
        }

        if (!history?.earlyLeave && history?.applied) {
            return "emoji_events"
        } else {
            return "trending_up";
        }
    }

    public cancelStakingBottomSheet(history: StakingBalanceHistory): void {
        let penalty: number = 0;
        if (history?.config?.exit_fee) {
            penalty = new BigNumber(history.amountStaked || 0).multipliedBy(new BigNumber(history?.config?.exit_fee).dividedBy(100)).toNumber()
        }

        const sheetRef: any = this.bottomSheet.open(BottomSheetComponent, {
            data: {
                text: penalty === 0 ? this.translationConstants.translate('wallet.stake.removeStaking') : this.translationConstants.translate('wallet.stake.penalty') + penalty + ' ' + history?.config?.unit_of_money + '.',
                declineOption: this.translationConstants.translate('wallet.stake.keepButton'),
                confirmOption: this.translationConstants.translate('wallet.stake.removeButton')
            }
        });
        sheetRef.afterDismissed().subscribe((removeStake: boolean) => {
            if (removeStake !== true) {
                return;
            } else {
                this.cancelStake(history);
            }
        });
    }

    private cancelStake(stake: StakingBalanceHistory): void {
        this.loading = true;
        this.financialService.cancelUserStake({
            stakeId: stake.id
        }).subscribe(success => {
            this.customSnackbar.open(this.translationConstants.translate('wallet.stake.cancelStaking'), SnackBarTheme.success, 3000);
            this.loading = false;
            this.ngOnInit();
        }, err => {
            this.customSnackbar.open(this.translationConstants.translate('wallet.stake.cancelFailed'), SnackBarTheme.error, 3000);
            this.loading = false;
        }).add(() => {
        });
    }

    public openInvoiceDetails(invoice: any): void {
        if (!invoice?.name) {
            const dialogRef: MatDialogRef<ViewInternalChargeModalComponent> = this.dialog.open(ViewInternalChargeModalComponent, {
                data: invoice
            });

            dialogRef.afterClosed().subscribe(action => {
                if (action) {
                    this.initData();
                }
            });
        } else {
            const dialogRef: MatDialogRef<ViewExternalChargeModalComponent> = this.dialog.open(ViewExternalChargeModalComponent, {
                data: invoice
            });

            dialogRef.afterClosed().subscribe(action => {
                if (action) {
                    this.initData();
                }
            });
        }
    }

    public buyToken(tokenId: string): void {
        this.setUnitOfMoneyInStorage(tokenId);
        const dialogRef: MatDialogRef<TokenPaymentModalComponent> = this.dialog.open(TokenPaymentModalComponent, {});

        dialogRef.afterClosed().subscribe(action => {
            if (action) {
                this.initData();
            }
        });
    }

    public filterCharge(): void {
        const filterValue: string = this.searchChargeByEmail.trim();
        this.dataSourceAllUserHistoryTransactions.filter = filterValue;
    }


    public changeDistributionType(asset: Assets, is_distribuition_fiat: boolean): void {
        this.loading = true;
        this.assetsService.changeDistributionType({ id: asset.nftId, is_distribuition_fiat: is_distribuition_fiat }).subscribe(success => {
            if (success) {
                this.customSnackbar.open(this.translationConstants.translate('banking.escrow.success'), SnackBarTheme.success, 4000);
            } else {
                this.customSnackbar.open(this.translationConstants.translate('banking.escrow.error'), SnackBarTheme.error, 4000);
            }
        }, error => {
            this.customSnackbar.open(this.translationConstants.translate('banking.escrow.error'), SnackBarTheme.error, 4000);
        }).add(() => {
            asset.is_distribuition_fiat = !asset.is_distribuition_fiat;
            this.loading = false;
        });
    }

    public buyTokenTransak(token: Token): void {
        this.loadingRequest = true;
        forkJoin({
            transakParameters: this.transakService.getTransakParameters(), // Mandatory
            userAddress: this.accountService.getUserAddress(true).pipe(catchError(() => of(null))), // It's okay if there's no data or if the request fails.
            userAuthenticationData: this.accountService.getLoggedUserDetails()
        }).subscribe(response => {
            this.userAddress = response?.userAddress ? response.userAddress : undefined;
            this.userAuthenticationData = response.userAuthenticationData;

            if (
                !response.transakParameters.apiKey ||
                !response.transakParameters.environment
            ) {
                this.customSnackbar.open(this.translationConstants.translate('paymentModal.error.failedToConectPartner'), SnackBarTheme.error);
                return;
            }

            this.goToTransakSDK(response.transakParameters, token);
        }, error => {
            this.customSnackbar.open(this.translationConstants.translate('paymentModal.error.generic'), SnackBarTheme.error);
        }).add(() => {
            this.loadingRequest = false;
        });
    }

    public goToTransakSDK(transakParameters: TransakParameters, token: Token): void {
        const orderId: string = uuidv4();

        const onRampData: TransakOnRampModel = this.transakService.mountOnRampData(
            transakParameters,
            this.userAddress,
            token,
            this.userAuthenticationData as UserLoggedModel,
            orderId
        );

        const orderEvent: IOrderEvent = {
            id: orderId,
            status: 'CREATED',
            shippingAmount: new BigNumber(0),
            totalAmount: new BigNumber(1),
            taxAmount: new BigNumber(0),
            paymentMethod: PaymentTypesEnum.TRANSAK,
            expirationDate: undefined,
            userId: undefined,
            userEmail: '',
            shoppingCartId: undefined,
            storeId: 'TEMP',
            isTokenBuy: true,
            hash: undefined,
            isNftBuy: false,
            assetId: undefined,
            packageId: undefined,
            nftId: undefined,
            tokensAmount: 0,
            createdAt: new Date(),
            updatedAt: undefined,
            hmac: undefined,
            transactionId: undefined,
            address_id: undefined,
            items: undefined,
            unitOfMoney: token.id,
            unit_purchased: token.id // Coin that is being purchased
        } as IOrderEvent;

        let transak = new transakSDK(onRampData);
        transak.init();

        transak.on(transak.EVENTS.TRANSAK_ORDER_CREATED, (orderData: Partial<ITransakOrderCreated>) => {
            orderEvent.tokensAmount = new BigNumber(orderData?.status?.cryptoAmount || 0);

            if (orderData?.status) {
                this.loadingRequest = true;
                forkJoin({
                    storeTransakOrder: this.transakService.storeOrderData(
                        orderData.status,
                        orderData.eventName as string,
                        orderId
                    ),
                    storeOrder: this.checkoutService.createCheckout(orderEvent)
                }).subscribe(response => {

                }, error => {

                }).add(() => {
                    this.loadingRequest = false;
                });
            }
        });

        transak.on(transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (orderData: Partial<ITransakOrderSuccessful>) => {
            orderEvent.tokensAmount = new BigNumber(orderData?.status?.cryptoAmount || 0);
            orderEvent.status = 'finished'
            if (orderData?.status) {
                this.loadingRequest = true;
                forkJoin({
                    storeTransakOrder: this.transakService.storeOrderData(
                        orderData.status,
                        orderData.eventName as string,
                        orderId
                    ),
                    storeOrder: this.checkoutService.createCheckout(orderEvent)
                }).subscribe(response => {
                    this.customSnackbar.open(this.translationConstants.translate('transakPayment.successfully'), SnackBarTheme.success, 5000);
                }, error => {

                }).add(() => {
                    this.loadingRequest = false;
                    transak.close();
                });
            }
        });
    }
}

export enum ETabButtons {
    CAPTURE = 'CAPTURE',
    NOT_DONE = 'NOT_DONE',
    ALLOCATIONS = 'ALLOCATIONS',
    COMMUNITY = 'COMMUNITY',
    COLLECTIBLE = 'COLLECTIBLE',
    SENT = 'SENT',
    RECEIVED = 'RECEIVED'
}

export enum EStatus {
    WAITING = 'waiting',
    APPROVED = 'approved',
    PENDING = 'pending'
}

export enum EType {
    INTERNAL = 'internal',
    EXTERNAL = 'external'
}