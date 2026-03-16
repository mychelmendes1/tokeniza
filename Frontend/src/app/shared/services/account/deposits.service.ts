import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { LocalStorageService } from "angular-web-storage";
import BigNumber from "bignumber.js";
import { catchError, map, Observable } from "rxjs";
import { RestEndpoint } from "../../../constants/rest-endpoint.constants";
import { CreateDepositModel } from "../../models/deposit.model";
import { LocalStorageKeys } from "../util/local.storage.keys";
import { Banks } from "../../models/banks.model";
import { WithdrawalModel } from "../../models/withdrawal.model";
import { WithdrawalRequestsFavorites } from "../../models/withdrawal-requests-favorites";

@Injectable({ 
    providedIn: 'root' 
})
export class DepositsService {

    constructor(
        private readonly http: HttpClient,
        private readonly localStorage: LocalStorageService
    ) {}

    public createDeposit(data: CreateDepositModel): Observable<BigNumber> {
        return this.http.post<BigNumber>(RestEndpoint.account.createDepositRequest, data)
            .pipe(
                catchError((err) => {
                    throw err;
                })
            )
        ;
    }

    public getListOfBanks(): Observable<Banks[]> {
        return this.http.get<{body: Banks[]}>(RestEndpoint.account.getListOfBanks, {})
            .pipe(
                map((data: {body: Banks[]}) => {
                    this.localStorage.set(LocalStorageKeys.LIST_OF_BANKS, data.body);
                    return data.body;
                }),
                catchError((err) => {
                    throw err;
                })
            )
        ;
    }

    public createWithdrawal(request: any): Observable<any> {
        return this.http.post<WithdrawalModel>(RestEndpoint.account.createWithdrawRequest, request)
            .pipe(
                catchError((err) => {
                    throw err;
                })
            )
        ;
    }

    public getUserWithdrawalFavorites(): Observable<Array<WithdrawalRequestsFavorites>> {
        return this.http.get(RestEndpoint.account.getUserWithdrawalFavorites, { params: {} })
            .pipe(
                map((data: any) => {
                    return data.body;
                }),
                catchError((err) => {
                    throw err;
                })
            )
        ;
    }
}