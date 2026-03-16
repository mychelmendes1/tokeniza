import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { ICrowdfundingBanners, ICrowdfundingCategories, ICrowdfundingOrders, ICrowdfundingTermsAccepted, IProjectCrowdfunding } from '../../models/IProjectCrowdfunding.model';
import { RestEndpoint } from '../../../constants/rest-endpoint.constants';
import { ICrowfundingBankingAccount } from '../../models/crowdfunding-banking-account';

@Injectable({
    providedIn: 'root'
})
export class CrowdfundingService {

    constructor(
        private readonly http: HttpClient,
    ) { }

    public getCrowdfundings(): Observable<IProjectCrowdfunding[]> {
        return this.http.get<IProjectCrowdfunding[]>(RestEndpoint.crowdfunding.getCrowdfundings)
            .pipe(
                map((data: IProjectCrowdfunding[]) => {
                    return data.map(project => {
                        return project;
                    });
                }),
                catchError((err) => {
                    throw (err);
                })
            )
        ;
    }

    public getCrowdfundingCategories(): Observable<Array<ICrowdfundingCategories>> {
        return this.http.get<Array<ICrowdfundingCategories>>(RestEndpoint.crowdfunding.getAllCrowdfundingCategories, {})
            .pipe(
                map((data: Array<ICrowdfundingCategories>) => {
                    return data;
                }),
                catchError((err) => {
                    throw(err);
                })
        )   ;
    }

    public getAllCrowdfundingBanners(): Observable<Array<ICrowdfundingBanners>> {
        return this.http.get(RestEndpoint.crowdfunding.getAllCrowdfundingBanners, {})
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

    public getCrowdfunding(crowdfundingId: string): Observable<IProjectCrowdfunding> {
        return this.http.get<IProjectCrowdfunding>(RestEndpoint.crowdfunding.getCrowdfunding, {
            params: {
                crowdfundingId
            }
        })
            .pipe(
                map((project: IProjectCrowdfunding) => {
                    return project;
                }),
                catchError((err) => {
                    throw (err);
                })
            )
        ;
    }

    public getCrowdfundingCompanyDetails(projectId: string): Observable<any> {
        return this.http.get(RestEndpoint.crowdfunding.getCrowdfundingCompanyDetails, { 
            params: {
                projectId
            }
        })
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

    public commentItem(itemComment: any): Observable<any>
    {
        return this.http.post<any>(RestEndpoint.crowdfunding.createComment, itemComment)
            .pipe(
                catchError((err) => {
                    throw err;
                })
            )
        ;
    }

    public getAllUserOders(): Observable<ICrowdfundingOrders[]> {
        return this.http.get(RestEndpoint.crowdfunding.getAllUserOders)
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

    public getAllCrowdfundingBanking(projectId: string): Observable<ICrowfundingBankingAccount[]> {
        return this.http.get<ICrowfundingBankingAccount[]>(RestEndpoint.crowdfunding.getAllCrowdfundingBanking, {
            params: 
            {
                projectId
            }
        })
            .pipe(
                map((data: ICrowfundingBankingAccount[]) => {
                    return data;
                }),
                catchError((err) => {
                    throw (err);
                })
            )
        ;
    }

    public performPaymentWithCrypto(object: any): Observable<string> {
        return this.http.post(RestEndpoint.crowdfunding.performPaymentWithCrypto, object)
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

    public createCrowdfundingCheckoutOrder(object: ICrowdfundingOrders): Observable<string> {
        return this.http.post(RestEndpoint.crowdfunding.createCrowdfundingCheckoutOrder, object)
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

    public updateUserAcceptedTerms(object: ICrowdfundingTermsAccepted): Observable<string> {
        return this.http.post(RestEndpoint.crowdfunding.updateUserAcceptedTerms, object)
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
}