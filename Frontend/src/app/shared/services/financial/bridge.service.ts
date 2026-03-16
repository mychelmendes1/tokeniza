import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, map, Observable } from "rxjs";
import { RestEndpoint } from "../../../constants/rest-endpoint.constants";
import { BridgeChainsModel, BridgeExecutionPayload, BridgeExecutionResponse, BridgeQuoteModel, BridgeTokensModel, BridgeTransferLimitsModel } from "../../models/bridge.model";
import { UtilService } from "../util/util.service";
import { BridgeLimitsRequestModel, BridgeQuoteRequestModel } from "../../models/bridge-request.model";

@Injectable({
    providedIn: 'root'
})
export class BridgeService {

    constructor(
        private readonly http: HttpClient
    ) {
    }

    public executeBridgeTransfer(payload: BridgeExecutionPayload): Observable<BridgeExecutionResponse> {
        return this.http.post<BridgeExecutionResponse>(RestEndpoint.financial.executeBridgeTransfer, payload)
            .pipe(
                map((data: BridgeExecutionResponse) => {
                    return data;
                }),
                catchError((err) => {
                    throw (err);
                })
            )
    }

    public getBridgeQuote(request: BridgeQuoteRequestModel): Observable<BridgeQuoteModel> {
        const params = UtilService.getHttpParamsFromObject(request);
        return this.http.get<BridgeQuoteModel>(RestEndpoint.financial.getBridgeQuotes, { params })
            .pipe(
                map((data: BridgeQuoteModel) => {
                    return data;
                }),
                catchError((err) => {
                    throw (err);
                })
            );
    }

    public getBridgeLimits(request: BridgeLimitsRequestModel): Observable<BridgeTransferLimitsModel> {
        const params = UtilService.getHttpParamsFromObject(request);
        return this.http.get<BridgeTransferLimitsModel>(RestEndpoint.financial.getBridgeLimits, { params })
            .pipe(
                map((data: BridgeTransferLimitsModel) => {
                    return data;
                }),
                catchError((err) => {
                    throw (err);
                })
            );
    }

    public getAvailableTokens(): Observable<BridgeTokensModel> {
        return this.http.get<BridgeTokensModel>(RestEndpoint.financial.getBridgeTokens, {})
            .pipe(
                map((data: BridgeTokensModel) => {
                    return data;
                }),
                catchError((err) => {
                    throw (err);
                })
            );
    }

    public getAvailableChains(): Observable<BridgeChainsModel> {
        return this.http.get<BridgeChainsModel>(RestEndpoint.financial.getBridgeChains, {})
            .pipe(
                map((data: BridgeChainsModel) => {
                    return data;
                }),
                catchError((err) => {
                    throw (err);
                })
            );
    }
}