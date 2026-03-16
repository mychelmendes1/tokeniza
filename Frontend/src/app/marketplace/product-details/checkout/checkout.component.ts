import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, Renderer2 } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { MenuButtonMobileComponent } from '../../../shared/components/menu-button-mobile/menu-button-mobile.component';
import { HoverIconClassService } from '../../../shared/services/util/hover-icon-class.service';
import { combineLatest } from 'rxjs';
import { AssetService } from '../../../shared/services/asset/asset.service';
import { AccountService } from '../../../shared/services/account/account.service';
import { FinancialService } from '../../../shared/services/financial/financial';
import {
    Assets,
    ProductCharacteristics,
} from '../../../shared/models/IAssets.model';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import BigNumber from 'bignumber.js';
import { NFTPackage } from '../../../shared/models/INFTPackage';
import { CollectionService } from '../../../shared/services/collection/collection.service';
import { CollectionStatistics } from '../../../shared/models/collection-statistics.model';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { DistributionRequestsModel } from '../../../shared/models/distribution.requests.model';
import { ShareLinkService } from '../../../shared/services/util/share-link.service';
import { IFiatCurrency } from '../../../shared/models/IFiatCurrency';
import { FeaturesStatusService } from '../../../shared/services/util/features-status.service';
import { FeatureNames } from '../../../shared/models/feature-names.enum';
import { FormatStringService } from '../../../shared/services/util/format-string.service';
import { AuctionStatusEnum } from '../../../shared/models/auction.model';
import { CalculateRemainingAuctionTimeService } from '../../../shared/services/util/calculate-remaining-auction-time.service';
import { TranslationConstants } from '../../../shared/services/util/translation.service';
import {
    CustomSnackbarComponent,
    SnackBarTheme,
} from '../../../shared/custom-snackbar/custom-snackbar.component';
import {
    MatBottomSheet,
    MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { BottomSheetComponent } from '../../../shared/bottom-sheet/bottom-sheet.component';
import { ScreenInitOptions } from '../../../shared/models/scree-init-options.model';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { BidModalComponent } from '../../../shared/modals/bid-modal/bid-modal.component';
import { PaymentModalComponent } from '../../../shared/modals/payment-modal/payment-modal.component';
import { ConfigReaderService } from '../../../shared/services/util/config.reader.service';
import { Token } from '../../../shared/models/tokens';
import { ErrorPageComponent } from '../../../shared/components/error-page/error-page.component';
import { DiditKycModalComponent } from '../../../shared/components/didit-kyc-modal/didit-kyc-modal.component';
import { UserLoggedModel } from '../../../shared/models/user.logged.model';
import { Network } from '../../../shared/models/network.model';

@Component({
    selector: 'app-checkout',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule,
        MenuButtonMobileComponent,
        MatTableModule,
        ErrorPageComponent,
    ],
    templateUrl: './checkout.component.html',
    styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit {
    public showErrorPage: boolean = false;
    public assetId: string = '';
    public assetSource: string = '';
    public loading: boolean = false;
    public userLogged: string = '';
    public userLoggedEmail: string = '';
    public reservationCount: number = 0;
    public product: any = Object() as any;
    public isOnResale: boolean = false;
    public seller: string = '';
    public characteristics: Array<ProductCharacteristics> = [];
    public customHtmlContent!: SafeHtml;
    public isResellAllowed: boolean = false;
    public hideBuyButton: boolean = false;
    public collection: CollectionStatistics = Object() as CollectionStatistics;
    public iHaveAnOffer: boolean = false;
    public myBidId: string = '';
    public myBidValue: string = '';
    public fiatCurrency: IFiatCurrency = new IFiatCurrency();
    public auctionStatusEnum: typeof AuctionStatusEnum = AuctionStatusEnum;
    public distributions: DistributionRequestsModel[] = [];
    public distributionsDisplayedColumns: string[] = [
        'projectDate',
        'projectValue',
        'projectToken',
        'projectStatus',
    ];
    public distributionsDataSource: MatTableDataSource<DistributionRequestsModel> =
        new MatTableDataSource(this.distributions);
    public detailsList: Detail[] = [];
    public dataSource: MatTableDataSource<any> = new MatTableDataSource();
    public displayedColumns: Array<string> = ['value', 'date'];
    public loadingRequest: boolean = false;
    public accepted: boolean = false;
    public percentageText?: string;
    public networks: Network[] = [];

    constructor(
        private readonly router: Router,
        private readonly location: Location,
        public hoverIconClassService: HoverIconClassService,
        private readonly activatedRoute: ActivatedRoute,
        private readonly assetsService: AssetService,
        private readonly accountService: AccountService,
        private financialService: FinancialService,
        private readonly sanitizer: DomSanitizer,
        private readonly collectionService: CollectionService,
        private readonly shareLinkService: ShareLinkService,
        private readonly featuresStatusService: FeaturesStatusService,
        private readonly formatStringService: FormatStringService,
        private readonly calculateRemainingAuctionTimeService: CalculateRemainingAuctionTimeService,
        private readonly translationConstants: TranslationConstants,
        private readonly customSnackbar: CustomSnackbarComponent,
        private readonly bottomSheet: MatBottomSheet,
        private readonly dialog: MatDialog,
        private readonly renderer: Renderer2,
        private readonly configReaderService: ConfigReaderService
    ) { }

    public ngOnInit(): void {
        this.fiatCurrency = this.accountService.getFiatCurrency();
        this.extractedUrlParams();
        this.getAssetDetails({ initialLoading: true });

        this.collectionService.getNetworks(false).subscribe((networks) => {
            this.networks = networks;
        });
    }

    public getTransactionTax(): string {
        if (this.product?.taxType === 'A') {
            return this.product?.transactionTax.toLocaleString(undefined, {
                style: 'currency',
                currency: this.fiatCurrency.currency,
            });
        } else {
            return this.product?.transactionTax + '%';
        }
    }

    private initializeDetailsList(): void {
        this.isOnResale = this.isOnResale || false;

        let network = this.networks.find(
            (network) => network.id === this.product?.collection?.network_id
        );

        const rawDetailsList: Detail[] = [
            {
                label: 'marketplace.collection',
                value: this.product?.collection?.name,
            },
            {
                label:
                    this.toNumber(this.product?.quantity) === 1
                        ? 'marketplace.checkout.unitAvailable'
                        : 'marketplace.checkout.unitsAvailable',
                value: this.product?.quantity,
                condition:
                    this.toNumber(this.product?.quantity) > 0 &&
                    !this.hideBuyButton &&
                    !this.product?.collection?.price &&
                    !this.product?.auction,
            },
            {
                label: 'marketplace.checkout.network',
                link: `${network?.scan_url}nft/${this.product?.collection?.contract_address}/${this.product?.blockchainId}`,
                isLink: true,
                value: this.product?.collection?.network_id,
            },
            {
                label: 'marketplace.productDetails.wallet',
                value: this.product?.resale?.publicWalletKey
                    ? this.getEllipsis(this.product?.resale?.publicWalletKey)
                    : false,
                condition:
                    this.product?.resale?.publicWalletKey !== undefined &&
                    this.product?.resale?.publicWalletKey !== null,
            },
            {
                label: 'marketplace.checkout.linkToProject',
                value: this.product?.collection?.creator_institution_url,
                link: this.product?.collection?.creator_institution_url,
                isLink: true,
                condition:
                    this.product?.collection?.creator_institution_url !==
                    undefined &&
                    this.product?.collection?.creator_institution_url !== null,
            },
            {
                label: 'marketplace.productDetails.seller',
                value: this.seller,
                pipe: 'titlecase',
                condition: this.isResellAllowed && this.isOnResale,
            },
            {
                label: 'marketplace.checkout.transactionTax',
                value: this.getTransactionTax(),
                condition:
                    this.product?.price > 0 &&
                    this.product?.taxType &&
                    this.product?.transactionTax,
            },
        ];

        this.detailsList = rawDetailsList.filter(
            (detail) => detail.condition !== false
        );
    }

    public extractedUrlParams(): void {
        this.activatedRoute.params.subscribe((param: Params) => {
            const extractedUrl: string = param['id'];
            this.assetId = extractedUrl.split(':')[1];
            this.assetSource = extractedUrl.split(':')[0];
        });
    }

    public getAssetDetails(screenInitOptions: ScreenInitOptions): void {
        const initialLoading: boolean =
            screenInitOptions.initialLoading || false;
        if (initialLoading) {
            this.loading = true;
        } else {
            this.loadingRequest = true;
        }
        this.featuresStatusService
            .getFeatureStatus(FeatureNames.NFT_RESALE)
            .subscribe((data) => {
                this.isResellAllowed = data;
            });
        combineLatest([
            this.assetsService.getAssetDetails(
                this.assetId,
                this.assetSource.toUpperCase()
            ),
            this.accountService.isAuthenticated(false, false),
            this.assetsService.getReservationsForAsset(this.assetId),
            this.financialService.getDistributionsByAssetId(this.assetId),
        ])
            .subscribe(
                async ([
                    asset,
                    authenticated,
                    reservationCount,
                    distributionResp,
                ]) => {
                    console.log(asset);

                    // If it doesn't have short_name it means it's an asset
                    if (authenticated) {
                        this.accountService
                            .getLoggedUserDetails()
                            .subscribe((userDetails) => {
                                this.userLogged = userDetails?.id;
                                this.userLoggedEmail = userDetails?.email;
                            });
                    }

                    this.reservationCount = reservationCount || 0;

                    if (!asset?.short_name) {
                        this.product = new Assets(asset as Assets);

                        this.collectionService
                            .getSumUsedByAsset(
                                this.product?.id
                            )
                            .subscribe((value) => {
                                let price = this.getAssetOriginalPrice(
                                    this.product
                                );

                                if (price && value > 0) {
                                    const percentage = (price / value) * 100;

                                    this.percentageText = `${percentage.toFixed(
                                        6
                                    )}%`;

                                    this.detailsList.push({
                                        label: 'percentage',
                                        value: this.percentageText,
                                        condition: true
                                    });
                                }
                            });

                        this.isOnResale = this.product?.resale
                            ?.onResale as boolean;
                        this.seller = this.product?.resale
                            ?.sellerName as string;
                        this.characteristics = this.product
                            ?.characteristics as ProductCharacteristics[];
                        if (this.product?.projectCustomHtml) {
                            this.customHtmlContent =
                                this.sanitizer.bypassSecurityTrustHtml(
                                    this.product.projectCustomHtml
                                );
                        }

                        if (
                            this.product.is_reward_prize ||
                            (this.assetSource === 'nft' &&
                                (!this.isResellAllowed ||
                                    !this.isOnResale ||
                                    (this.isOnResale &&
                                        this.product?.resale?.sellerId ===
                                        this.userLogged) ||
                                    (this.isOnResale &&
                                        this.product?.resale?.onlyForCustomer &&
                                        this.isOnResale &&
                                        this.product?.resale
                                            ?.onlyForCustomer !==
                                        this.userLoggedEmail))) ||
                            //In case the user access the product details via Collections Details screen, it might happen that the NFT doesn't have any quantity available to buy
                            //In this case we must hide the buy button
                            new BigNumber(
                                this.product?.quantity || 0
                            ).isLessThanOrEqualTo(0) ||
                            this.product.only_package
                        ) {
                            this.hideBuyButton = true;
                        }
                    } else {
                        this.product = new NFTPackage(asset as NFTPackage);
                        this.collectionService
                            .getCollectionStatistics(
                                this.product.collection_id as string
                            )
                            .subscribe((collection) => {
                                this.collection = collection;
                            });
                    }

                    this.collectionService
                        .getMinToBuy()
                        .subscribe((minToBuy) => {
                            if (minToBuy?.entries) {
                                for (let entry of minToBuy?.entries) {
                                    if (entry?.id === this.product.id) {
                                        this.product.minimumToBuy =
                                            entry?.minToBuy;
                                    }
                                }

                                if (!this.product.minimumToBuy) {
                                    this.product.minimumToBuy =
                                        minToBuy?.default;
                                }
                            } else {
                                this.product.minimumToBuy = minToBuy?.default;
                            }
                        });

                    if (
                        this.product instanceof Assets &&
                        this.product.collection?.price
                    ) {
                        this.collectionService
                            .getSumUsedByCollection(this.product?.collection.id)
                            .subscribe((maxToBuy) => {
                                this.product.maxToBuy = new BigNumber(
                                    this.product?.collection['price']
                                )
                                    .minus(
                                        new BigNumber(
                                            maxToBuy !== null ? maxToBuy : 0
                                        )
                                    )
                                    .toNumber();
                            });
                    }

                    if (this.product.auction?.bids.length > 0) {
                        this.product.auction.bids.forEach((bid: any) => {
                            if (bid?.customerId === this.userLogged) {
                                this.myBidId = bid.id;
                                this.myBidValue = bid.price;
                                this.iHaveAnOffer = true;
                            }
                        });
                    }

                    if (this.product?.auction?.deadline) {
                        this.product.auctionTimeExpiration =
                            this.calculateRemainingAuctionTimeService.calculateRemainingAuctionTime(
                                this.product
                            );
                    }

                    if (distributionResp) {
                        this.distributions = distributionResp || [];
                        this.distributionsDataSource = new MatTableDataSource(
                            this.distributions
                        );
                    }

                    this.initializeDetailsList();
                },
                (error) => {
                    if (error) {
                        this.loading = false;
                        this.loadingRequest = false;
                        this.showErrorPage = true;
                    }
                }
            )
            .add(() => {
                this.loading = false;
                this.loadingRequest = false;
                this.dataSource = new MatTableDataSource(
                    this.product?.auction?.bids
                );
            });
    }

    public goToWallet(): void {
        this.router.navigate(['/wallet']);
    }

    public goToMarketplace(): void {
        this.router.navigate(['/marketplace']);
    }

    public backPage(): void {
        this.location.back();
    }

    public getMainPhoto(): string | undefined {
        return this.assetsService.getAssetMainPhoto(this.product);
    }

    public shareWhatsapp(): void {
        this.shareLinkService.shareWhatsapp(this.product.description as string);
    }

    public getCorrectPrice(
        asset: Assets | NFTPackage,
        sumTax: boolean = false
    ): number {
        return this.assetsService.getAssetCorrectPrice(
            asset,
            this.isResellAllowed,
            sumTax
        );
    }

    public getAssetOriginalPrice(asset: Assets | NFTPackage): number {
        return this.assetsService.getAssetOriginalPrice(asset, false);
    }

    public getVariation(asset: Assets | NFTPackage): number {
        const variation = new BigNumber(
            new BigNumber(this.getCorrectPrice(asset))
                .dividedBy(this.getAssetOriginalPrice(asset))
                .multipliedBy(100)
        )
            .minus(100)
            .toFixed(2);
        return Number(variation);
    }

    public toNumber(value: BigNumber): number {
        return new BigNumber(value || 0).toNumber();
    }

    public getSymbom(asset: Assets): string {
        if (asset.collection?.priceCurrency) {
            return asset.collection.priceCurrency;
        } else {
            return this.fiatCurrency.symbol;
        }
    }

    public getEllipsis(value: string): string | undefined {
        if (!value) {
            return '';
        }
        return this.formatStringService.getEllipsisInTheMiddle(value, 12);
    }

    public goToUrl(url: string): void {
        if (url && !/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }
        window.open(url, '_blank');
    }

    public getMinimumPriceAccepted(): number {
        return Number(this.product?.auction?.minimumPrice);
    }

    public createBid(): void {
        if (!this.product.auction.expired) {
            const dialogRef: MatDialogRef<BidModalComponent> = this.dialog.open(
                BidModalComponent,
                {
                    data: this.product,
                }
            );

            dialogRef.afterClosed().subscribe((action) => {
                if (action) {
                    this.getAssetDetails({ initialLoading: false });
                }
            });
        }
    }

    public cancelMyBid(): void {
        const sheetRef: MatBottomSheetRef = this.bottomSheet.open(
            BottomSheetComponent,
            {
                data: {
                    text: `${this.translationConstants.translate(
                        'productDetails.cancelMyBid.bottomSheetConfirmation'
                    )} ${this.translationConstants.translate(
                        'productDetails.cancelMyBid.yourBidWas'
                    )} ${this.fiatCurrency.symbol} ${Number(
                        this.myBidValue
                    ).toFixed(2)}`,
                    declineOption:
                        this.translationConstants.translate('snackbar.no'),
                    confirmOption:
                        this.translationConstants.translate('snackbar.ok'),
                },
            }
        );

        sheetRef.afterDismissed().subscribe((action) => {
            if (action) {
                this.loadingRequest = true;
                this.assetsService
                    .cancelMyBid(this.myBidId)
                    .subscribe(
                        (success) => {
                            if (success) {
                                this.customSnackbar.open(
                                    this.translationConstants.translate(
                                        'productDetails.cancelMyBid.snackbar.success'
                                    ),
                                    SnackBarTheme.success,
                                    4000
                                );
                            } else {
                                this.customSnackbar.open(
                                    this.translationConstants.translate(
                                        'productDetails.cancelMyBid.snackbar.error'
                                    ),
                                    SnackBarTheme.success,
                                    4000
                                );
                            }
                        },
                        (error) => {
                            this.customSnackbar.open(
                                this.translationConstants.translate(
                                    'productDetails.cancelMyBid.snackbar.error'
                                ),
                                SnackBarTheme.error,
                                4000
                            );
                        }
                    )
                    .add(() => {
                        // Set bid data to default values.
                        this.iHaveAnOffer = false;
                        this.myBidId = '';
                        this.myBidValue = '';
                        this.getAssetDetails({ initialLoading: false });
                    });
            }
        });
    }

    public cancelAuction(): void {
        const sheetRef: MatBottomSheetRef = this.bottomSheet.open(
            BottomSheetComponent,
            {
                data: {
                    text: this.translationConstants.translate(
                        'productDetails.cancelAuction.bottomSheetConfirmation'
                    ),
                    declineOption:
                        this.translationConstants.translate('snackbar.no'),
                    confirmOption:
                        this.translationConstants.translate('snackbar.ok'),
                },
            }
        );

        sheetRef.afterDismissed().subscribe((action) => {
            if (action) {
                this.loadingRequest = true;
                this.assetsService
                    .cancelAuction(this.product?.auction?.id)
                    .subscribe(
                        (success) => {
                            if (success) {
                                this.customSnackbar.open(
                                    this.translationConstants.translate(
                                        'productDetails.cancelAuction.snackbar.success'
                                    ),
                                    SnackBarTheme.success,
                                    4000
                                );
                            } else {
                                this.customSnackbar.open(
                                    this.translationConstants.translate(
                                        'productDetails.cancelAuction.snackbar.error'
                                    ),
                                    SnackBarTheme.success,
                                    4000
                                );
                            }
                        },
                        (error) => {
                            this.customSnackbar.open(
                                this.translationConstants.translate(
                                    'productDetails.cancelAuction.snackbar.error'
                                ),
                                SnackBarTheme.error,
                                4000
                            );
                        }
                    )
                    .add(() => {
                        this.getAssetDetails({ initialLoading: false });
                    });
            }
        });
    }

    public changeTermsStatus(element: any): void {
        this.accepted = !this.accepted;

        setTimeout(() => {
            if (!this.accepted) {
                element.checked = false;
                this.renderer.removeClass(
                    element['_elementRef'].nativeElement,
                    'cdk-focused'
                );
                this.renderer.removeClass(
                    element['_elementRef'].nativeElement,
                    'cdk-program-focused'
                );
            }
        });
    }

    public translateDistributionsStatus(status: EDistributionsStatus): string {
        if (status === EDistributionsStatus.PROCESSED) {
            return 'marketplace.checkout.processed';
        }
        return '--';
    }

    public async goToCheckout(): Promise<void> {
        //In case the user is not logged in, he will be redirected to the login screen before going to the checkout screen
        if (!this.userLogged) {
            this.configReaderService.getEniatoConfigs().subscribe((configs) => {
                if (!configs.externalCheckout) {
                    this.router.navigate(['/account/login'], {
                        queryParams: {
                            redirectUrl: this.router.url,
                        },
                    });
                    return;
                } else {
                    this.openPaymentModal();
                }
            });
        } else {
            // Check for DIDIT KYC if enabled
            const isDiditEnabled = await this.featuresStatusService.getFeatureStatus(FeatureNames.DIDIT_SDK).toPromise();

            if (isDiditEnabled) {
                const hasSeenApprovedModal = DiditKycModalComponent.hasUserSeenApprovedModal(this.userLoggedEmail);
                if (!hasSeenApprovedModal) {
                    const user = await this.accountService.getLoggedUserDetails().toPromise() as UserLoggedModel;
                    if (user) {
                        const dialogRef = this.dialog.open(DiditKycModalComponent, {
                            data: { user },
                            panelClass: 'didit-kyc-modal',
                            maxWidth: '900px',
                            maxHeight: '90vh',
                            width: '100%',
                            height: '100%'
                        });

                        const result = await dialogRef.afterClosed().toPromise();
                        if (!result?.completed) {
                            return; // Stop if KYC not successful/approved
                        }
                    }
                }
            }

            this.openPaymentModal();
        }
    }

    private openPaymentModal(): void {
        this.dialog.open(PaymentModalComponent, {
            data:
                this.product instanceof Assets
                    ? new Assets(this.product)
                    : this.product instanceof NFTPackage
                        ? new NFTPackage(this.product)
                        : new Token(this.product),
        });
    }
}

interface Detail {
    label: string;
    value: any;
    condition?: any;
    pipe?: string;
    isLink?: boolean;
    link?: string;
}

enum EDistributionsStatus {
    PROCESSED = 'PROCESSED',
}
