import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    CollectionStatistics,
    SortCollectionsStatistics,
} from '../../models/collection-statistics.model';
import { catchError, map, Observable } from 'rxjs';
import { RestEndpoint } from '../../../constants/rest-endpoint.constants';
import {
    Collections,
    CollectionSearchInput,
    CollectionsSummaryResponse,
} from '../../models/collections';
import { UtilService } from '../util/util.service';
import { Network } from '../../models/network.model';

@Injectable({
    providedIn: 'root',
})
export class CollectionService {
    constructor(
        private readonly http: HttpClient,
        private readonly utilService: UtilService
    ) {}

    public getAllCollectionsStatistics(
        sortRule: SortCollectionsStatistics
    ): Observable<Array<CollectionStatistics>> {
        return this.http
            .get<Array<CollectionStatistics>>(
                RestEndpoint.collections.getAllCollectionsStatistics,
                { params: { sortRule } }
            )
            .pipe(
                map((data: Array<CollectionStatistics>) => {
                    return data;
                }),
                catchError((err) => {
                    throw err;
                })
            );
    }

    public getNetworks(onlySync: boolean = false): Observable<Network[]> {
        return this.http
            .get(RestEndpoint.collections.getNetworks, { params: { onlySync } })
            .pipe(
                map((data: any) => {
                    return data || [];
                }),
                catchError((err) => {
                    throw err;
                })
            );
    }

    public getCollection(
        collectionIdentifier: string
    ): Observable<Collections> {
        return this.http
            .get<Collections>(RestEndpoint.collections.getCollection, {
                params: { collectionIdentifier },
            })
            .pipe(
                map((data: Collections) => {
                    return data;
                }),
                catchError((err) => {
                    throw err;
                })
            );
    }

    public getCollections(
        search?: CollectionSearchInput
    ): Observable<CollectionsSummaryResponse> {
        return this.http
            .get<CollectionsSummaryResponse>(
                RestEndpoint.collections.getAllCollections,
                { params: this.utilService.searchParams(search) }
            )
            .pipe(
                map((data: CollectionsSummaryResponse) => {
                    return data;
                }),
                catchError((err) => {
                    throw err;
                })
            );
    }

    public getCollectionStatistics(
        collectionIdentifier: string
    ): Observable<CollectionStatistics> {
        return this.http
            .get<CollectionStatistics>(
                RestEndpoint.collections.getCollectionStatistics,
                { params: { collectionIdentifier } }
            )
            .pipe(
                map((data: CollectionStatistics) => {
                    return data;
                }),
                catchError((err) => {
                    throw err;
                })
            );
    }

    public getMinToBuy(): Observable<any> {
        return this.http.get<any>(RestEndpoint.collections.getMinToBuy).pipe(
            map((data: { value: number }) => {
                return data?.value;
            }),
            catchError((err) => {
                throw err;
            })
        );
    }

    public getSumUsedByCollection(collectionId: string): Observable<number> {
        return this.http
            .get<{ value: number }>(
                RestEndpoint.collections.getSumUsedByCollection,
                {
                    params: {
                        collectionId,
                    },
                }
            )
            .pipe(
                map((data: { value: number }) => {
                    return data?.value;
                }),
                catchError((err) => {
                    throw err;
                })
            );
    }

    public getSumUsedByAsset(collectionId: string): Observable<number> {
        return this.http
            .get<{ value: number }>(
                RestEndpoint.collections.getSumUsedByAsset,
                {
                    params: {
                        collectionId,
                    },
                }
            )
            .pipe(
                map((data: { value: number }) => {
                    return data?.value;
                }),
                catchError((err) => {
                    throw err;
                })
            );
    }
}
