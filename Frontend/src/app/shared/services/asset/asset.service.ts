import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import BigNumber from 'bignumber.js';
import { AssetsSearchInput, AssetsSearchReport, CategoryFilter } from '../../models/asset-search-input.model';
import { HttpClient } from '@angular/common/http';
import { RestEndpoint } from '../../../constants/rest-endpoint.constants';
import { UtilService } from '../util/util.service';
import { Assets, ResellAsset } from '../../models/IAssets.model';
import { NFTPackage } from '../../models/INFTPackage';
import { CustomerBalance } from '../../models/customer.balance';

@Injectable({
    providedIn: 'root'
})
export class AssetService {

    constructor(
        private readonly http: HttpClient,
        private readonly utilService: UtilService
    ) { }

    public getAssetCorrectPrice(asset: any, isResaleAllowed: boolean, sumTax: boolean = false): number {
        let nftTransactionTax: BigNumber = new BigNumber(0);
        if (asset?.taxType && asset?.transactionTax) {
            if (asset.taxType === 'A') {
                nftTransactionTax = new BigNumber(asset?.transactionTax);
            } else {
                nftTransactionTax = new BigNumber(asset?.price).multipliedBy(new BigNumber(asset?.transactionTax)).dividedBy(100);
            }
        }

        if (isResaleAllowed && asset?.resale?.onResale) {
            return new BigNumber(asset.resale.resaleValue)?.plus(sumTax ? nftTransactionTax : 0)?.toNumber();
        }

        return new BigNumber(asset?.price)?.plus(sumTax ? nftTransactionTax : 0)?.toNumber();
    }

    public getAssetOriginalPrice(asset: any, isResaleAllowed: boolean = false): number {
        let price: string = asset?.originalPrice && asset?.originalPrice !== 0 ? asset?.originalPrice : asset?.price;
        return new BigNumber(price).toNumber();
    }

    public getAssetMainPhoto(asset: any): string | undefined {
        if (!asset) {
            return;
        }

        let photoToReturn: string = '';

        if (asset?.url) {
            photoToReturn = asset?.url;
        } else if (Array.isArray(asset?.photos)) {
            for (let photo of asset.photos) {
                if (photo.order <= 0) {
                    photoToReturn = photo.url;
                    break;
                }
            }
        }

        return photoToReturn || "/assets/images/token-image.webp";
    }

    public getAssets(search?: AssetsSearchInput): Observable<AssetsSearchReport> {
        return this.http.get(RestEndpoint.assets.getAssets, { params: this.utilService.searchParams(search) })
            .pipe(
                map((data: any) => {
                    return data;
                }),
                catchError((err) => {
                    throw (err);
                })
            )
        ;
    }

    public getCategories(): Observable<Array<CategoryFilter>> {
        return this.http.get<Array<CategoryFilter>>(RestEndpoint.assets.getCategories, {})
            .pipe(
                map((data: Array<CategoryFilter>) => {
                    return data;
                }),
                catchError((err) => {
                    throw (err);
                })
            )
        ;
    }

    //Source might be NFT or ASSET, it will determine which type of id is being provided
    //It might be used NFT when it is about a NFT which was already bougth by someone
    //It happens because whenever a NFT is bougth it became unique in the blockchain, and this information is stored in a different table
    //So, it must to be indicated from which one it needs to be retrieved
    public getAssetDetails(assetIdentifier?: string, source: string = 'ASSET'): Observable<Assets | NFTPackage> {
        return this.http.get<Assets | NFTPackage>(RestEndpoint.assets.getDetails, { 
            params: { 
                assetIdentifier: assetIdentifier || '',
                source 
            } 
        }).pipe(
            map((data: Assets | NFTPackage) => data),
            catchError((err) => {
                throw err;
            })
        );
    }

    public getReservationsForAsset(assetId?: string): Observable<number> {
        return this.http.get(RestEndpoint.assets.getCountForAssets, {
            params: {
                assetId: assetId || ''
            } 
        })
            .pipe(
                map((data: any) => {
                    return data?.body;
                }),
                catchError((err) => {
                    throw (err);
                })
            )
        ;
    }

    public cancelMyBid(bidId: string): Observable<any> {
        return this.http.post<any>(RestEndpoint.assets.cancelMyBid, {
            params: {
                bidId: bidId
            }
        })
        .pipe(
            map((data: any) => {
                return data;
            }),
            catchError((err) => {
                throw err;
            })
        );
    }

    public cancelAuction(auctionId: string): Observable<boolean> {
        return this.http.post<boolean>(RestEndpoint.assets.cancelAuction, {
            params: {
                auctionId: auctionId
            }
        })
        .pipe(
            map((data: any) => {
                return data;
            }),
            catchError((err) => {
                throw err;
            })
        );
    }

    public createAuction(nftId: string, minimumPrice: BigNumber, deadline: Date): Observable<any> {
        return this.http.post<any>(RestEndpoint.assets.createAuction, {
            nftId: nftId,
            minimumPrice: minimumPrice,
            deadline: deadline
        })
        .pipe(
            map((data: any) => {
                return data;
            }),
            catchError((err) => {
                throw err;
            })
        );
    }

    public createBid(auctionId: string, price: BigNumber, unitOfMoney: string): Observable<any> {
        return this.http.post<ResellAsset>(RestEndpoint.assets.createBid, {
            params: {
                auctionId: auctionId,
                price: price,
                unitOfMoney: unitOfMoney
            }
        })
        .pipe(
            map((data: any) => {
                return data;
            }),
            catchError((err) => {
                throw err;
            })
        );
    }

    public getEniatoBalance(): Observable<CustomerBalance> {
        return this.http.get<CustomerBalance>(RestEndpoint.assets.getEniatoBalance, {})
            .pipe(
                map((data: CustomerBalance) => {
                    return data;
                }),
                catchError((err) => {
                    throw (err);
                })
            )
        ;
    }

    public resellAsset(request: ResellAsset): Observable<boolean> {
        return this.http.post<ResellAsset>(RestEndpoint.assets.resellAsset, request)
            .pipe(
                map((output: any) => {
                    return output;
                }),
                catchError((err) => {
                    throw err;
                })
            )
        ;
    }

    public createSplit(nftId: string, parts: any): Observable<any> {
        return this.http.post<any>(RestEndpoint.assets.splitNFTs, {
            id: nftId,
            parts: parts
        })
        .pipe(
            map((data: any) => {
                return data;
            }),
            catchError((err) => {
                throw err;
            })
        );
    }


    public changeDistributionType(request: any): Observable<boolean> {
        return this.http.post<ResellAsset>(RestEndpoint.assets.changeDistributionType, request)
        .pipe(
            map((output: any) => {
                return output;
            }),
            catchError((err) => {
                throw err;
            })
        );
    }

    public sendNft(request: {
        customerIdToTransferTo: string,
        unitOfMoney: string,
        assetId: string,
        nftId?: string,
        blockchainId?: string
    }): Observable<any> {
        return this.http.post<any>(RestEndpoint.assets.sendNFTs, request)
            .pipe(
                map((userData: any) => {
                    return userData;
                }),
                catchError((err) => {
                    throw err;
                })
            )
        ;
    }

    public getAssetTransactionTaxPrice(asset: any, isResaleAllowed: boolean): number {
        let taxValue: number = 0;

        if (asset?.taxType && asset?.transactionTax) {
            if (asset?.taxType === 'A') {
                taxValue = asset?.transactionTax;
            } else {
                let assetPrice = new BigNumber(0);

                if (isResaleAllowed && asset?.resale?.onResale) {
                    assetPrice = new BigNumber(asset?.resale?.resaleValue);
                } else {
                    assetPrice = new BigNumber(asset?.price);
                }

                taxValue = assetPrice.multipliedBy(new BigNumber(asset?.transactionTax)).dividedBy(100).toNumber();
            }
        }

        return taxValue;
    }

    public buyNFTs(request: {
        unitOfMoney: string,
        assetId: string,
        nftId: string, //Used when a NFT was already bought 
        blockchainId: string, //Used when a NFT was already bought 
        hash: string,
        tax: string,
        wantedPrice: BigNumber,
        principalAmount: number | undefined
    }): Observable<any> {
        return this.http.post<any>(RestEndpoint.assets.buyNFT, request)
            .pipe(
                map((userData: any) => {
                    return userData;
                }),
                catchError((err) => {
                    throw err;
                })
            )
        ;
    }

    public buyPackage(request: {
        unitOfMoney: string,
        assetId: string,
        tax: string,
        hash: string,
        principalAmount: number
    }): Observable<any> {
        return this.http.post<any>(RestEndpoint.assets.buyPackage, request)
            .pipe(
                map((userData: any) => {
                    return userData;
                }),
                catchError((err) => {
                    throw err;
                })
            )
        ;
    }

    public redeemReward(rewardCode: string): Observable<any> {
        return this.http.post<any>(RestEndpoint.assets.redeemReward, {rewardCode})
            .pipe(
                map((resp: any) => {
                    return resp;
                }),
                catchError((err) => {
                    throw err;
                })
            )
        ;
    }
}