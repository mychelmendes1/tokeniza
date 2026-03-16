import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { Router, RouterModule } from '@angular/router';
import { IFiatCurrency } from '../../models/IFiatCurrency';
import { AccountService } from '../../services/account/account.service';
import { AssetService } from '../../services/asset/asset.service';
import { HoverIconClassService } from '../../services/util/hover-icon-class.service';
import { combineLatest, Subscription } from 'rxjs';
import { AppService } from '../../../app.service';
import { Assets } from '../../models/IAssets.model';
import { AssetSearchResult } from '../../models/asset-search-input.model';
import BigNumber from 'bignumber.js';
import { FeaturesStatusService } from '../../services/util/features-status.service';
import { FeatureNames } from '../../models/feature-names.enum';
import { CalculateRemainingAuctionTimeService } from '../../services/util/calculate-remaining-auction-time.service';
import { TranslationConstants } from '../../services/util/translation.service';
import { ShareLinkService } from '../../services/util/share-link.service';
import { AuctionModalComponent } from '../../modals/auction-modal/auction-modal.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AuctionStatusEnum } from '../../models/auction.model';
import { ResellModalComponent } from '../../modals/resell-modal/resell-modal.component';
import { SendModalComponent } from '../../modals/send-modal/send-modal.component';

@Component({
    selector: 'app-card-list',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    templateUrl: './card-list.component.html',
    styleUrl: './card-list.component.scss'
})
export class CardListComponent implements OnInit, OnDestroy {

    @Input() public assetList: Array<any> = [];
    @Input() public autoScroll: boolean = false;
    @Input() public selectedCategory: any;
    @Output() public reloadData: EventEmitter<boolean> = new EventEmitter(false);
    public isResellAllowed: boolean = false;
    public fiatCurrency: IFiatCurrency = new IFiatCurrency();
    public currentPage: string = 'MY_ASSETS';
    public cardHovered: { [key: string]: boolean } = {};
    public isMobile: boolean = false;
    public isMobileSubscription: Subscription;
    public isSendNFTAllowed: boolean = false;
    public isNFTStakingEnabled: boolean = false;
    public isAuctionNFTAllowed: boolean = false;
    public distributeOnNFTs?: boolean = false;
    public isAuthenticated: boolean = false;
    public loading: boolean = false;
    public userLogged: string = '';
    public auctionStatusEnum: typeof AuctionStatusEnum = AuctionStatusEnum;

    constructor(
        private readonly assetsService: AssetService,
        private readonly router: Router,
        private readonly accountService: AccountService,
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly featuresStatusService: FeaturesStatusService,
        public hoverIconClassService: HoverIconClassService,
        private readonly appService: AppService,
        private readonly calculateRemainingAuctionTimeService: CalculateRemainingAuctionTimeService,
        private readonly translationConstants: TranslationConstants,
        private readonly shareLinkService: ShareLinkService,
        private readonly dialog: MatDialog,
    ) {
        this.isMobileSubscription = this.appService.getIsMobile().subscribe(isMobile => {
            this.isMobile = isMobile;
        });
    }

    public ngOnInit(): void {
        this.fiatCurrency = this.accountService.getFiatCurrency();
        this.defineCurrentPage();
        this.getFeatureStatus();
    }

    public ngOnDestroy(): void {
        this.isMobileSubscription.unsubscribe();
    }

    public getFeatureStatus(): void {
        this.loading = true;
        combineLatest([
            this.featuresStatusService.getFeatureStatus(FeatureNames.NFT_RESALE),
            this.featuresStatusService.getFeatureStatus(FeatureNames.SEND_NFT),
            this.featuresStatusService.getFeatureStatus(FeatureNames.STAKING_NFT),
            this.featuresStatusService.getFeatureStatus(FeatureNames.AUCTION_NFT),
            this.featuresStatusService.getFeatureStatus(FeatureNames.DISTRIBUTE_ON_NFTS),
            this.accountService.isAuthenticated(false, false)
        ]).subscribe(
            ([ResellAllowed, SendNFTAllowed, NFTStakingEnabled, auctionEnabled, distributeOnNFTs, isAuthenticated]
        ) => {
            this.isResellAllowed = ResellAllowed;
            this.isSendNFTAllowed = SendNFTAllowed;
            this.isNFTStakingEnabled = NFTStakingEnabled;
            this.isAuctionNFTAllowed = auctionEnabled;
            this.distributeOnNFTs = distributeOnNFTs;
            this.isAuthenticated = isAuthenticated ? true : false;

            if (isAuthenticated) {
                this.accountService.getLoggedUserDetails().subscribe(userDetails => {
                    this.userLogged = userDetails?.id;
                });
            }
        }).add(() => this.loading = false);
    }

    public getMainPhoto(asset: any): string | undefined {
        return this.assetsService.getAssetMainPhoto(asset);
    }

    public ngOnChanges(): void {
        this.changeDetectorRef.detectChanges();
        this.scrollCardAfterLoad();

        for(let asset of this.assetList) {
            if (asset?.auction?.deadline) {
                asset.auctionTimeExpiration = this.calculateRemainingAuctionTimeService.calculateRemainingAuctionTime(asset);
            }
        }
    }

    public goToDetails(asset: Assets | AssetSearchResult) {
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

    private defineCurrentPage(): void {
        if (this.router.url.includes('/wallet')) {
            this.currentPage = 'MY_ASSETS';
        } else {
            this.currentPage = '';
        }
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
            return this.fiatCurrency.symbol;
        }
    }

    public scrollCardAfterLoad(): void {
        if (!this.autoScroll) {
            return;
        }
        const cardHeight: number | undefined = document.querySelector('.card')?.clientHeight;
        const optionsToScroll: ScrollToOptions = {
            behavior: 'smooth',
            top: window.scrollY + (cardHeight ? cardHeight : 514)
        }
        window.scrollTo(optionsToScroll);
    }

    public buyAssets(): void{
        this.router.navigate(['/projects'], { queryParams: { scrollToClass: "cards", categoryId: this.selectedCategory?.id } });
    }

    public getAmountOfBidsText(quantity: number): string {
        if (quantity === 0) {
            return this.translationConstants.translate('productDetails.noBidMade');
        } else if (quantity === 1) {
            return this.translationConstants.translate('productDetails.bidMade');
        } else {
            return this.translationConstants.translate('productDetails.bidsMade');
        }
    }

    public shareWhatsapp(asset: Assets | AssetSearchResult): void {
        this.shareLinkService.shareWhatsapp(asset.description as string);
    }

    public auctionAsset(asset: Assets): void {
        if (asset?.on_staking || asset?.resale?.onResale) {
            return;
        }

        const dialogRef: MatDialogRef<AuctionModalComponent> = this.dialog.open(AuctionModalComponent, {
            data: asset
        });

        dialogRef.afterClosed().subscribe(action => {
            if (action) {
                this.reloadData.emit(true);
            }
        });
    }

    public resellAsset(asset: Assets, isEditing: boolean): void {
        if (asset?.on_staking){
            return;
        }

        const dialogRef: MatDialogRef<ResellModalComponent> = this.dialog.open(ResellModalComponent, {
            data: { asset, isEditing }
        });

        dialogRef.afterClosed().subscribe(action => {
            if (action) {
                this.reloadData.emit(true);
            }
        });
    }

    public sendAsset(asset: Assets) {
        if ((asset?.resale?.onResale && this.isResellAllowed) || asset?.on_staking){
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
                this.reloadData.emit(true);
            }
        });
    }

    public setAutionTooltip(asset: Assets): string {
        if (asset?.on_staking) {
            return 'myAssets.auctionAssetForStaking';
        } else if (asset?.resale?.onResale) {
            return 'myAssets.auctionAssetForResale';
        }  else if (asset?.auction) {
            return 'myAssets.assetAlreadyAtAuction';
        } else {
            return 'myAssets.auctionAsset';
        }
    }

    public setResaleTooltip(asset: Assets): string {
        if (asset?.on_staking) {
            return 'myAssets.resellAssetStaking';
        } else if (asset?.auction) {
            return 'myAssets.resellAssetAuction';
        } else if (asset?.resale?.onResale) {
            return 'myAssets.editResale';
        } else {
            return 'myAssets.resell';
        }
    }

    public translateAuctionTooltip(asset: Assets | AssetSearchResult): string {
        if (asset?.auction && asset?.auction?.status === this.auctionStatusEnum.CREATED && asset?.auction?.auctioneerId === this.userLogged) {
            return 'tooltip.seeAuctions';
        } else {
            return 'tooltip.bid';
        }
    }
}