import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { RestEndpoint } from "../../../constants/rest-endpoint.constants";
import { Token, TokenStatistics } from "../../models/tokens";

@Injectable({
    providedIn: 'root'
})
export class TokensService {

    constructor(
        private readonly http: HttpClient,
        private readonly router: Router
    ) { }

    public getTokenById(tokenIdentifier: string): Observable<Token> {
        return this.http.get<Token>(RestEndpoint.tokens.getToken, { params: { tokenIdentifier } })
            .pipe(
                map((data: Token) => {
                    return data;
                }),
                catchError((err) => {
                    throw (err);
                })
            )
        ;
    }

    public getTokens(): Observable<Array<Token>> {
        return this.http.get<Array<Token>>(RestEndpoint.tokens.getAllTokens, {})
            .pipe(
                map((data: Array<Token>) => {
                    return data;
                }),
                catchError((err) => {
                    throw (err);
                })
            )
        ;
    }

    public getDataForExchange(): Observable<TokenStatistics[]> {
        return this.http.get<TokenStatistics[]>(RestEndpoint.tokens.getDataForExchange, {})
            .pipe(
                map((data: TokenStatistics[]) => {
                    if(data) {
                        return data;
                    }
                    return [];
                }),
                catchError(() => {
                    throw new Error('Not possible to get the quotation')
                })
            )
        ;
    }
}