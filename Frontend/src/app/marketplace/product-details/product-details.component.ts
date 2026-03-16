import { CommonModule, Location } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { MenuButtonMobileComponent } from '../../shared/components/menu-button-mobile/menu-button-mobile.component';
import { HoverIconClassService } from '../../shared/services/util/hover-icon-class.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { usefulSettings } from '../../shared/models/useful-settings.model';
import { AccountService } from '../../shared/services/account/account.service';
import { BrowserLanguageService } from '../../shared/services/util/browser-language.service';
import { EViewMode } from '../../shared/models/view-mode.enum';
import { fadeIn } from '../../shared/services/util/animations.service';
import { CardListComponent } from '../../shared/components/card-list/card-list.component';
import { CollectionService } from '../../shared/services/collection/collection.service';
import { Collections } from '../../shared/models/collections';
import { CollectionStatistics } from '../../shared/models/collection-statistics.model';
import { combineLatest } from 'rxjs';
import { FormatStringService } from '../../shared/services/util/format-string.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { TranslationConstants } from '../../shared/services/util/translation.service';
import { CustomSnackbarComponent, SnackBarTheme } from '../../shared/custom-snackbar/custom-snackbar.component';
import { AssetService } from '../../shared/services/asset/asset.service';
import { SortFilterEnum } from '../../shared/models/sort-filter.enum';
import { AssetSearchResult, CategoryFilter } from '../../shared/models/asset-search-input.model';
import BigNumber from 'bignumber.js';
import { Assets } from '../../shared/models/IAssets.model';
import { ShareLinkService } from '../../shared/services/util/share-link.service';
import { FeaturesStatusService } from '../../shared/services/util/features-status.service';
import { FeatureNames } from '../../shared/models/feature-names.enum';
import { AuctionStatusEnum } from '../../shared/models/auction.model';
import { LanguagesEnum } from '../../shared/models/languages.enum';
import { ErrorPageComponent } from '../../shared/components/error-page/error-page.component';
import { PaymentModalComponent } from '../../shared/modals/payment-modal/payment-modal.component';
import { NFTPackage } from '../../shared/models/INFTPackage';
import { MatDialog } from '@angular/material/dialog';
import { ConfigReaderService } from '../../shared/services/util/config.reader.service';
import { ScreenInitOptions } from '../../shared/models/scree-init-options.model';

@Component({
    selector: 'app-product-details',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule,
        MenuButtonMobileComponent,
        MatSortModule,
        CardListComponent,
        ErrorPageComponent
    ],
    templateUrl: './product-details.component.html',
    styleUrl: './product-details.component.scss',
    animations: [fadeIn]
})
export class ProductDetailsComponent implements OnInit {

    @ViewChild('dataSourceNFT') set sortDataSourceNFT(sort: MatSort) {
        this.dataSource.sort = sort;
    }
    public showErrorPage: boolean = false;
    public usefulSettings: usefulSettings = new usefulSettings();
    public selectedNftViewMode: string = EViewMode.LIST;
    public eViewMode: typeof EViewMode = EViewMode;
    public NFTs: Array<AssetSearchResult> = [];
    public displayedColumns: string[] = ['asset', 'originalPrice', 'priceOffered', 'deadline', 'actions3column'];
    public dataSource: MatTableDataSource<any> = new MatTableDataSource<any>(this.NFTs);
    public collectionId: string = '';
    public loading: boolean = false;
    public auctionStatusEnum: typeof AuctionStatusEnum = AuctionStatusEnum;
    public loadingRequest: boolean = true;
    public loadingCollections: boolean = false;
    public collectionDetails: Collections = Object() as Collections;
    public collectionStatistics: CollectionStatistics = Object() as CollectionStatistics;
    public currencySymbol: string = '';
    public currency: string = '';
    public offset: number = 0;
    public limit: number = 0;
    public searchValue: string = '';
    public loadingMoreCards: boolean = false;
    public loadingMainData: boolean = false;
    public eLanguage: typeof LanguagesEnum = LanguagesEnum;
    public LINES_OF_CARDS: number = 4; // Quantity of cards lines to show when start the Home page
    public cardsPerLine: number = 0; // Will variable according the window width
    public browserWidth: number = 0;
    public HORIZONTAL_PADDING: number = 32; // Home page padding
    public CARD_MARGIN_RIGHT: number = 20; // in px;
    public CARD_WIDTH: number = 300; // in px;
    public userLoggedEmail: string = '';
    public showLoadMoreButton: boolean = true;
    public allItemsLoaded: boolean = false;
    public searchTime!: ReturnType<typeof setTimeout>; // Used in filter
    public SEARCH_TIME_VALUE: number = 700; // In milliseconds
    public categories: Array<CategoryFilter> = [];
    // This is the fixed ID for the package category, used to populate the database. In this case we will filter it from the array of categories because we have a tab to search for packages only.
    public PACKAGES_ID: string = 'a4a4fd52-7215-11ec-8c9b-11111';
    public selectedCategories: string[] = [];
    public sortFilterSelected: SortFilterEnum = SortFilterEnum.RECENT;
    public sortFilterList: Array<SortFilterEnum> = [
        SortFilterEnum.RECENT,
        SortFilterEnum.LOWER_VALUE,
        SortFilterEnum.HIGHEST_VALUE
    ];
    public isResellAllowed: boolean = false;
    public userLogged: string = '';
    public product: any = Object() as any;
    public reservationCount: number = 0;
    public collection: CollectionStatistics = Object() as CollectionStatistics;

    constructor(
        private readonly router: Router,
        private readonly dialog: MatDialog, 
        private readonly accountService: AccountService,
        private readonly browserLanguageService: BrowserLanguageService,
        public hoverIconClassService: HoverIconClassService,
        private readonly location: Location,
        private readonly configReaderService: ConfigReaderService,
        private readonly activatedRoute: ActivatedRoute,
        private readonly collectionService: CollectionService,
        private readonly formatStringService: FormatStringService,
        private readonly clipboard: Clipboard,
        private readonly translationConstants: TranslationConstants,
        private readonly customSnackbar: CustomSnackbarComponent,
        private readonly assetsService: AssetService,
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly shareLinkService: ShareLinkService,
        private readonly featuresStatusService: FeaturesStatusService,
    ) { }

    public ngOnInit(): void {
        this.featuresStatusService.getFeatureStatus(FeatureNames.NFT_RESALE).subscribe(data => {
            this.isResellAllowed = data;
        });
        this.browserWidth = window.innerWidth;
        this.getExtractedUrlParams();
        this.getCollectionData();
        this.loadFiatCurrency();

        this.usefulSettings = {
            fiatCurrency: this.accountService.getFiatCurrency(),
            selectedLanguage: this.browserLanguageService.getBrowserLanguage()
        }

        this.assetsService.getCategories().subscribe(cats => {
            if (cats) {
                // We won't show packages as category
                this.categories = cats.filter(item => item.id !== this.PACKAGES_ID);
            }
        }, error => { });

        this.accountService.getLoggedUserDetails().subscribe(userDetails => {
            this.userLogged = userDetails?.id;
        });
    }

    public async ngAfterViewInit(): Promise<void> {
        setTimeout(async () => {
            if (this.sortDataSourceNFT) {
                this.dataSource.sort = this.sortDataSourceNFT;
            }

            this.tableSortingDataAccessor(this.dataSource);
            this.changeDetectorRef.detectChanges();
        }, 200);
    }

    public tableSortingDataAccessor(dataSource: MatTableDataSource<AssetSearchResult>): void {
        dataSource.sortingDataAccessor = (asset: AssetSearchResult, property: string): any => {
            if (property === 'originalPrice') {
                return asset.originalPrice ? new BigNumber(asset.originalPrice).toNumber() : 0;
            }

            if (property === 'priceOffered') {
                return asset.resale?.resale_value ? new BigNumber(asset.resale.resale_value).toNumber() : 0;
            }

            if (property === 'deadline') {
                return asset.auction?.deadline ? new Date(asset.auction.deadline).getTime() : 0;
            }

            return (asset as AssetSearchResult | any)[property];
        };
    }

    @HostListener('window:resize', ['$event'])
    public onResize(): void {
        this.browserWidth = window.innerWidth;
    }

    public loadFiatCurrency(): void {
        this.accountService.loadFiatCurrency().subscribe(currency => {
            this.currencySymbol = currency?.symbol;
            this.currency = currency.currency;

        }, error => { });
    }

    public getExtractedUrlParams(): void {
        this.activatedRoute.paramMap.subscribe((res: Params) => {
            this.collectionId = res['params']['id'];
        });
    }

    public getNFTs(resetValues: boolean = false, initialLoading: boolean = false): void {
        if (!resetValues) {
            this.loadingMoreCards = true;
        } else if (initialLoading) {
            this.loadingRequest = true;
        } else {
            this.loading = true;
        }
        this.calculateLimitOfCards(resetValues);

        this.assetsService.getAssets({
            limit: this.limit,
            offset: this.offset,
            name: this.searchValue,
            sortRule: this.sortFilterSelected,
            categoriesToFilter: this.selectedCategories,
            collectionId: this.collectionId,
            isHome: true,
        }).subscribe(assets => {
            if (resetValues) {
                this.NFTs = [];
                this.offset = 0;
            }

            if (assets?.entries && assets.entries?.length > 0) {
                this.NFTs = [...this.NFTs, ...assets.entries];
                this.offset = this.offset + this.limit;
            }
            this.dataSource.data = this.NFTs;
            this.tableSortingDataAccessor(this.dataSource);
            this.dataSource._updateChangeSubscription();
            this.defineShowLoadMoreButton(assets?.entries?.length);
        }, error => {
            this.showErrorPage = true;
        }).add(() => {
            if (resetValues) {
                this.loading = false;
            } else {
                this.loadingMoreCards = false;
            }
            this.loadingRequest = false;
        });
    }

    public filterData(forceSearch: boolean = false, resetValues: boolean = true): void {
        // Clear the timeout to wait a little bit the user to finish typing the search
        clearTimeout(this.searchTime);
        this.searchTime = setTimeout(() => {
            this.getNFTs(resetValues);
        }, forceSearch ? 0 : this.SEARCH_TIME_VALUE);
    }

    public calculateLimitOfCards(resetValues: boolean = false): void {
        if (resetValues) {
            this.offset = 0;
        }
        this.limit = this.LINES_OF_CARDS * this.cardsPerLine;
    }

    public getCollectionData(): void {
        this.calculateCardsPerLine();
        this.loadingCollections = true;
        combineLatest([
            this.collectionService.getCollection(this.collectionId),
            this.collectionService.getCollectionStatistics(this.collectionId)
        ]).subscribe(([collectionDetails, collection]) => {
            if (collectionDetails?.id) {
                this.collectionDetails = collectionDetails;
                this.collectionStatistics = collection;

                this.getNFTs(true, true);
            }
        }, error => {
            this.showErrorPage = true;
        }).add(() => {
            this.loadingCollections = false;
        });
    }

    public getMainPhoto(asset: any): string | undefined {
        return this.assetsService.getAssetMainPhoto(asset);
    }

    public calculateCardsPerLine(): void {
        // Needs to consider the last margin-right as available, because the last card in the line will not have margin-right.
        const widthAvailable: number = this.browserWidth - this.HORIZONTAL_PADDING + this.CARD_MARGIN_RIGHT;
        this.cardsPerLine = (Math.floor(widthAvailable / (this.CARD_WIDTH + this.CARD_MARGIN_RIGHT))) || 2;
        this.calculateLimitOfCards(true);
    }

    public openDocument(): void {
        window.open(this.collectionStatistics.collectionDetails?.document_url, '_blank');
    }

    public goToWallet(): void {
        this.router.navigate(['/wallet']);
    }

    public backPage(): void {
        this.location.back();
    }

    public selectNftViewMode(mode: string): void {
        this.selectedNftViewMode = mode;
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

    public checkoutHere(asset: Assets | AssetSearchResult) {
        if (asset) {
            //In case there is a nftId, it means we are talking about a resale, hence, we must to search a specific NFT which is stored in a different table
            //In case not, we are looking to a general NFT will be bought for the very first time
            if (asset?.nftId) {
                this.getAssetDetails(asset.nftId, 'nft');
            } else {
                this.getAssetDetails(asset.id, 'asset');
            }
        }
    }

    public getAssetDetails(assetId: any, assetSource: any): void {
        this.product = null;
        this.collection = Object() as CollectionStatistics;
        this.loading = true;
    
        combineLatest([
            this.assetsService.getAssetDetails(assetId, assetSource.toUpperCase()),
            this.accountService.isAuthenticated(false, false),
            this.assetsService.getReservationsForAsset(assetId)
        ]).subscribe(async ([asset, authenticated, reservationCount]) => {
            // If it doesn't have short_name it means it's an asset
            this.product = asset;
            if (authenticated) {
                this.accountService.getLoggedUserDetails().subscribe(userDetails => {
                    this.userLogged = userDetails?.id;
                    this.userLoggedEmail = userDetails?.email;
                });
            }

            let isOnResale = this.product?.resale?.onResale as boolean;

            this.reservationCount = reservationCount || 0;

            if (!asset?.short_name) {
                this.product = new Assets(asset as Assets);

                if (
                    this.product.is_reward_prize ||
                    (
                        assetSource === 'nft' &&
                        (
                            (!this.isResellAllowed) ||
                            (!isOnResale) ||
                            (isOnResale && this.product?.resale?.sellerId === this.userLogged) ||
                            (isOnResale && this.product?.resale?.onlyForCustomer && isOnResale && this.product?.resale?.onlyForCustomer !== this.userLoggedEmail)
                        )
                    ) ||
                    //In case the user access the product details via Collections Details screen, it might happen that the NFT doesn't have any quantity available to buy
                    //In this case we must hide the buy button
                    new BigNumber(this.product?.quantity || 0).isLessThanOrEqualTo(0) ||
                    this.product.only_package
                ) {
                    return;
                }
            } else {
                this.product = new NFTPackage(asset as NFTPackage);
                this.collectionService.getCollectionStatistics(this.product.collection_id as string).subscribe(collection => {
                    this.collection = collection;
                });
            }

            this.collectionService.getMinToBuy().subscribe(minToBuy => {
                if (minToBuy?.entries) {
                    for (let entry of minToBuy?.entries) {
                        if (entry?.id === this.product.id) {
                            this.product.minimumToBuy = entry?.minToBuy;
                        }
                    }

                    if (!this.product.minimumToBuy) {
                        this.product.minimumToBuy = minToBuy?.default;
                    }
                } else {
                    this.product.minimumToBuy = minToBuy?.default;
                }
            });

            if (this.product instanceof Assets && this.product.collection?.price) {
                this.collectionService.getSumUsedByCollection(this.product?.collection.id).subscribe(maxToBuy => {
                    this.product.maxToBuy = new BigNumber((this.product?.collection["price"])).minus(new BigNumber(maxToBuy !== null ? maxToBuy : 0)).toNumber();
                });
            }

        }, error => {
            if (error) {
                this.loading = false;
                this.showErrorPage = true;
            }
        }).add(() => {
            this.loading = false;
            this.buy();
        });
    }

    
    public buy(): void {
            //In case the user is not logged in, he will be redirected to the login screen before going to the checkout screen
            if (!this.userLogged) {
                this.configReaderService.getEniatoConfigs().subscribe(configs => {
                    if (!configs.externalCheckout) {
                        this.router.navigate(['/account/login'], {
                            queryParams: {
                                redirectUrl: this.router.url,
                            }
                        });
                        return;
                    } else {
                        this.dialog.open(PaymentModalComponent, {
                            data: this.product instanceof Assets ? new Assets(this.product) : new NFTPackage(this.product)
                        });
                    }
                });
            } else {
                this.dialog.open(PaymentModalComponent, {
                    data: this.product instanceof Assets ? new Assets(this.product) : new NFTPackage(this.product)
                });
            }
    }

    public getEllipsis(value: string | undefined): string | undefined {
        return this.formatStringService.getEllipsisInTheMiddle(value, 12);
    }

    public getScan_url(): string {
        return this.collectionStatistics?.networkDetails?.scan_url + 'token/' + this.collectionDetails?.contract_address;
    }

    public openScan(url: string | undefined): void {
        if (url) {
            window.open(url, '_blank')?.focus();
        }
    }

    public copy(text: string | undefined): void {
        const copied: boolean = this.clipboard.copy((text) as string);
        if (copied) {
            this.customSnackbar.open(
                this.translationConstants.translate(this.translationConstants.translate("snackbar.copy")),
                SnackBarTheme.success
            );
        }
    }

    private defineShowLoadMoreButton(lengthLoaded: number): void {
        if (lengthLoaded < this.limit) {
            this.showLoadMoreButton = false;
        } else {
            this.showLoadMoreButton = true;
        }
        this.allItemsLoaded = !this.showLoadMoreButton;
    }

    public selectCategorie(categoryId: string): void {
        const categorieIndex: number = this.selectedCategories.indexOf(categoryId);
        if (categorieIndex === -1) {
            this.selectedCategories.push(categoryId);
        } else {
            this.selectedCategories.splice(categorieIndex, 1);
        }
    }

    public translateSortFilter(filter: SortFilterEnum): string {
        if (filter === SortFilterEnum.RECENT) {
            return 'filter.recents';
        } else if (filter === SortFilterEnum.LOWER_VALUE) {
            return 'filter.lowerValue';
        } else {
            return 'filter.highestValue';
        }
    }

    public clearFilters(): void {
        this.selectedCategories = [];
        this.sortFilterSelected = SortFilterEnum.RECENT;

        this.filterData(true, true);
    }

    public applyFilter(): void {
        this.filterData(true, true);
    }

    public shareWhatsapp(element: AssetSearchResult): void {
        this.shareLinkService.shareWhatsapp(element.description as string);
    }

    public getCorrectPrice(asset: Assets | AssetSearchResult): number {
        return this.assetsService.getAssetCorrectPrice(asset, this.isResellAllowed);
    }

    public getAssetOriginalPrice(asset: Assets | AssetSearchResult): number {
        return this.assetsService.getAssetOriginalPrice(asset, this.isResellAllowed);
    }

    public getVariation(asset: Assets | AssetSearchResult): number {
        const variation: string = new BigNumber(new BigNumber(this.getCorrectPrice(asset)).dividedBy(this.getAssetOriginalPrice(asset)).multipliedBy(100)).minus(100).toFixed(2)
        return Number(variation);
    }

    public translateAuctionTooltip(asset: Assets | AssetSearchResult): string {
        if (asset?.auction && asset?.auction?.status === this.auctionStatusEnum.CREATED && asset?.auction?.auctioneerId === this.userLogged) {
            return 'tooltip.seeAuctions';
        } else {
            return 'tooltip.bid';
        }
    }
}