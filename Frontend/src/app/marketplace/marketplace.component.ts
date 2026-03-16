import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { Router, RouterModule } from '@angular/router';
import { MenuButtonMobileComponent } from '../shared/components/menu-button-mobile/menu-button-mobile.component';
import { HoverIconClassService } from '../shared/services/util/hover-icon-class.service';
import Swiper from 'swiper';
import { SwiperOptions } from 'swiper/types';
import { CollectionService } from '../shared/services/collection/collection.service';
import { combineLatest } from 'rxjs';
import { CollectionStatistics, SortCollectionsStatistics } from '../shared/models/collection-statistics.model';
import { AccountService } from '../shared/services/account/account.service';
import { AssetSearchResult, CategoryFilter, ENFTsAllocations } from '../shared/models/asset-search-input.model';
import { AssetService } from '../shared/services/asset/asset.service';
import { SortFilterEnum } from '../shared/models/sort-filter.enum';
import BigNumber from 'bignumber.js';
import { Assets } from '../shared/models/IAssets.model';
import { FeatureNames } from '../shared/models/feature-names.enum';
import { FeaturesStatusService } from '../shared/services/util/features-status.service';
import { BrowserLanguageService } from '../shared/services/util/browser-language.service';
import { usefulSettings } from '../shared/models/useful-settings.model';
import { LanguagesEnum } from '../shared/models/languages.enum';
import { IFiatCurrency } from '../shared/models/IFiatCurrency';
import { Collections } from '../shared/models/collections';
import { TranslationConstants } from '../shared/services/util/translation.service';
import { ErrorPageComponent } from '../shared/components/error-page/error-page.component';
import { MatTabChangeEvent } from '@angular/material/tabs';

@Component({
    selector: 'app-marketplace',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule,
        MenuButtonMobileComponent,
        ErrorPageComponent
    ],
    templateUrl: './marketplace.component.html',
    styleUrl: './marketplace.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MarketplaceComponent implements OnInit {
    @ViewChild('topSwiper', { static: false }) protected topSwiperRef?: ElementRef;
    @ViewChild('highlightSwiper', { static: false }) protected highlightSwiperRef?: ElementRef;
    public showErrorPage: boolean = false;
    public allAssets: Array<any> = [];
    public NFTs: Array<AssetSearchResult> = [];
    public browserWidth: number = 0;
    public collectionSelected!: Collections;
    public collectionFilterList: Array<Collections> = [];
    public swiperBreakpoints: Record<number, SwiperOptions> = {
        320: {
            slidesPerView: 1,
            spaceBetween: 20,
            loop: true
        },
        640: {
            slidesPerView: 1,
            spaceBetween: 20,
            loop: true
        },
        768: {
            slidesPerView: 1,
            spaceBetween: 20,
            loop: true
        },
        1024: {
            slidesPerView: 2.5,
            spaceBetween: 20,
            loop: true
        },
        1366: {
            slidesPerView: 2.5,
            spaceBetween: 20,
            loop: true
        },
    };
    public showLoadMoreButton: boolean = true;
    public allItemsLoaded: boolean = false;
    public offset: number = 0;
    public limit: number = 0;
    public swiper?: Swiper;
    public loadingCollections: boolean = false;
    public loadingMoreCards: boolean = false;
    public loading: boolean = false;
    public loadingRequest: boolean = true;
    public searchTime!: ReturnType<typeof setTimeout>; // Used in filter
    public SEARCH_TIME_VALUE: number = 700; // In milliseconds
    // Top Collections
    public topCollectionList: Array<CollectionStatistics> = [];
    public topCollectionListHighlight: Array<CollectionStatistics> = [];
    public currencySymbol: string = '';
    public currency: string = '';
    public searchValue: string = '';
    public selectedCategories: string[] = [];
    public sortFilterSelected: SortFilterEnum = SortFilterEnum.RECENT;
    public sortFilterList: Array<SortFilterEnum> = [
        SortFilterEnum.RECENT,
        SortFilterEnum.LOWER_VALUE,
        SortFilterEnum.HIGHEST_VALUE
    ];
    public LINES_OF_CARDS: number = 4; // Quantity of cards lines to show when start the Home page
    public cardsPerLine: number = 0; // Will variable according the window width
    public HORIZONTAL_PADDING: number = 32; // Home page padding
    public CARD_MARGIN_RIGHT: number = 10; // in px;
    public CARD_WIDTH: number = 425; // in px;
    public isResellAllowed: boolean = false;
    public usefulSettings: usefulSettings = new usefulSettings();
    public eLanguage: typeof LanguagesEnum = LanguagesEnum;
    public categories: Array<CategoryFilter> = [];
    // This is the fixed ID for the package category, used to populate the database. In this case we will filter it from the array of categories because we have a tab to search for packages only.
    public PACKAGES_ID: string = 'a4a4fd52-7215-11ec-8c9b-11111';
    public COLLECTIBLES_CATEGORY_ID: string = 'e4da9280-867e-11ef-b10d-06aff79fa023';
    public allCollections: Collections = Object() as Collections;
    public collectiblesCategory: Array<CategoryFilter> = [];
    public collectiblesTabSelected: string | null = null;
    public eNFTAllocations: typeof ENFTsAllocations = ENFTsAllocations;

    constructor(
        private readonly router: Router,
        public hoverIconClassService: HoverIconClassService,
        private readonly collectionService: CollectionService,
        private readonly accountService: AccountService,
        private readonly assetsService: AssetService,
        private readonly featuresStatusService: FeaturesStatusService,
        private readonly browserLanguageService: BrowserLanguageService,
        private readonly translationConstants: TranslationConstants,
    ) { }

    public ngOnInit(): void {
        this.usefulSettings = {
            fiatCurrency: {} as IFiatCurrency,
            selectedLanguage: this.browserLanguageService.getBrowserLanguage()
        }
        this.browserWidth = window.innerWidth;
        this.assetsService.getCategories().subscribe(cats => {
            if (cats) {
                // We won't show packages as category
                this.categories = cats.filter(item => item.id !== this.PACKAGES_ID && item.id !== this.COLLECTIBLES_CATEGORY_ID);
                this.collectiblesCategory = cats.filter(item => item.id === this.COLLECTIBLES_CATEGORY_ID);
            }
        }, error => { });
        this.accountService.loadFiatCurrency().subscribe(currency => {
            this.currencySymbol = currency?.symbol;
            this.currency = currency.currency;

        }, error => {});
        this.initData();
    }

    public slide(direction: 'next' | 'prev', target: 'top' | 'highlight'): void {
        const swiperMap: { top: ElementRef<any> | undefined; highlight: ElementRef<any> | undefined } = {
            top: this.topSwiperRef,
            highlight: this.highlightSwiperRef
        };

        const swiperRef: ElementRef<any> | undefined = swiperMap[target];
        const swiperInstance: Swiper = swiperRef?.nativeElement?.swiper;

        if (!swiperInstance) {
            return;
        }

        if (direction === 'next') {
            swiperInstance.slideNext();
        } else {
            swiperInstance.slidePrev();
        }
    }

    public initData(): void {
        this.featuresStatusService.getFeatureStatus(FeatureNames.NFT_RESALE).subscribe(data => {
            this.isResellAllowed = data;
        });
        this.getCollectionsData();

        this.allCollections.name = this.translationConstants.translate('marketplace.filterOptions.allCollections');
        this.collectionSelected = this.allCollections;
    }

    public getCollectionsData(): void {
        this.calculateCardsPerLine();
        this.loadingCollections = true;
        combineLatest([
            this.collectionService.getCollections(),
            this.collectionService.getAllCollectionsStatistics(SortCollectionsStatistics.BIGGEST_MARKET_PRICE)
        ]).subscribe(([collectionsSummary, collectionsStatistics]) => {
            this.collectionFilterList = collectionsSummary?.collections || [];

            this.topCollectionList = collectionsStatistics || [];
            this.topCollectionListHighlight = (collectionsStatistics || []).filter(collection => collection.visits).sort((a, b) => b.visits - a.visits);
            this.getNFTs(true, true);
        }, error => {
            if (error) {
                this.showErrorPage = true;
            }
        });
    }

    public calculateCardsPerLine(): void {
        // Needs to consider the last margin-right as available, because the last card in the line will not have margin-right.
        const widthAvailable: number = this.browserWidth - this.HORIZONTAL_PADDING + this.CARD_MARGIN_RIGHT;
        this.cardsPerLine = (Math.floor(widthAvailable / (this.CARD_WIDTH + this.CARD_MARGIN_RIGHT))) || 2;
        this.calculateLimitOfCards(true);
    }

    public goToWallet(): void {
        this.router.navigate(['/wallet']);
    }

    public goToCollectionDetails(collectionId: string | undefined): void {
        this.router.navigate([`/marketplace/product/${collectionId}`]);
    }

    public calculateLimitOfCards(resetValues: boolean = false): void {
        if (resetValues) {
            this.offset = 0;
        }
        this.limit = this.LINES_OF_CARDS * this.cardsPerLine;
    }

    @HostListener('window:resize', ['$event'])
    public onResize(): void {
        this.browserWidth = window.innerWidth;
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
            isHome: true,
            collectionId: this.collectionSelected?.id
        }).subscribe(assets => {
            if (resetValues) {
                this.NFTs = [];
                this.offset = 0;
            }

            if (assets?.entries && assets.entries?.length > 0) {
                this.NFTs = [...this.NFTs, ...assets.entries];
                this.offset = this.offset + this.limit;
            }
            this.defineShowLoadMoreButton(assets?.entries?.length);
        }).add(() => {
            if (resetValues) {
                this.loading = false;
            } else {
                this.loadingMoreCards = false;
            }
            this.loadingRequest = false;
            this.loadingCollections = false;
        });
    }

    public filterNFTsByStatus(status: ENFTsAllocations): AssetSearchResult[] {
        return this.NFTs.filter(asset => asset.status === status);
    }

    public hasNFTValidByStatus(): boolean {
        return this.NFTs.some(nft =>
            nft.status === ENFTsAllocations.WAITING ||
            nft.status === ENFTsAllocations.DISTRIBUITING ||
            nft.status === ENFTsAllocations.FINISHED
        );
    }

    public filterData(forceSearch: boolean = false, resetValues: boolean = true): void {
        // Clear the timeout to wait a little bit the user to finish typing the search
        clearTimeout(this.searchTime);
        this.searchTime = setTimeout(() => {
            this.getNFTs(resetValues);
        }, forceSearch ? 0 : this.SEARCH_TIME_VALUE);
    }

    private defineShowLoadMoreButton(lengthLoaded: number): void {
        if (lengthLoaded < this.limit) {
            this.showLoadMoreButton = false;
        } else {
            this.showLoadMoreButton = true;
        }
        this.allItemsLoaded = !this.showLoadMoreButton;
    }

    public applyFilter(): void {
        this.filterData(true, true);
    }

    public getMainPhoto(asset: any): string | undefined {
        return this.assetsService.getAssetMainPhoto(asset);
    }

    public toNumber(value: BigNumber): number {
        return new BigNumber(value || 0).toNumber();
    }

    public getCorrectPrice(asset: Assets | AssetSearchResult): number {
        return this.assetsService.getAssetCorrectPrice(asset, this.isResellAllowed);
    }

    public getAssetOriginalPrice(asset: Assets | AssetSearchResult): number {
        return this.assetsService.getAssetOriginalPrice(asset, false);
    }

    public getVariation(asset: Assets | AssetSearchResult): number {
        const variation = new BigNumber(new BigNumber(this.getCorrectPrice(asset)).dividedBy(this.getAssetOriginalPrice(asset)).multipliedBy(100)).minus(100).toFixed(2)
        return Number(variation);
    }

    public getSymbom(asset: Assets | AssetSearchResult): string {
        if(asset.collection?.priceCurrency) {
            return asset.collection.priceCurrency;
        } else {
            return this.currencySymbol;
        }
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

    public tabSelected(event: MatTabChangeEvent): void {
        const tabIndex: number = event.index;
        const selectedTab: CategoryFilter = this.collectiblesCategory?.[tabIndex - 2];

        this.NFTs = [];

        if (selectedTab?.id === this.COLLECTIBLES_CATEGORY_ID) {
            this.selectedCategories = [selectedTab.id];
            this.collectiblesTabSelected = selectedTab.id;
        } else {
            this.selectedCategories = [];
        }

        this.filterData(true, true);
    }

    public clearFilters(): void {
        const isCollectiblesTab: boolean = this.collectiblesTabSelected === this.COLLECTIBLES_CATEGORY_ID;
        this.selectedCategories = isCollectiblesTab ? [this.COLLECTIBLES_CATEGORY_ID] : [];
        this.sortFilterSelected = SortFilterEnum.RECENT;
        this.collectionSelected = this.allCollections;

        this.filterData(true, true);
    }
}