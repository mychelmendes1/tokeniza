import { Injectable } from "@angular/core";
import { catchError, map, Observable } from "rxjs";
import { RestEndpoint } from "../../../constants/rest-endpoint.constants";
import { HttpClient } from "@angular/common/http";
import { IAccountInfoLegalPersonResponse, IAccountInfoRequest, IAccountInfoResponse } from "../../models/account.info.request";

@Injectable({
    providedIn: 'root'
})
export class BankingService {

    constructor(
        private readonly http: HttpClient,
    ) {}


    public getAccountInfoNaturalPerson(accountInfoRequest: IAccountInfoRequest): Observable<IAccountInfoResponse> {
        return this.http.get<{ data: IAccountInfoResponse }>(RestEndpoint.banking.account.getAccountInfoNaturalPerson, {
            params: {
                accountId: accountInfoRequest.accountId,
                documentNumber: accountInfoRequest.documentNumber
            }
        })
            .pipe(
                map((res: { data: IAccountInfoResponse }) => {
                    return res.data;
                }),
                catchError((err) => {
                    throw err;
                })
            )
        ;
    }

    public getAccountInfoLegalPerson(accountInfoRequest: IAccountInfoRequest): Observable<IAccountInfoLegalPersonResponse> {
        return this.http.get<{ data: IAccountInfoLegalPersonResponse }>(RestEndpoint.banking.account.getAccountInfoLegalPerson, {
            params: {
                accountId: accountInfoRequest.accountId,
                documentNumber: accountInfoRequest.documentNumber
            }
        })
            .pipe(
                map((res: { data: IAccountInfoLegalPersonResponse }) => {
                    return res.data;
                }),
                catchError((err) => {
                    throw err;
                })
            )
        ;
    }
}