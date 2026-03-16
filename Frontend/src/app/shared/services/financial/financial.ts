import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, map, Observable } from "rxjs";
import { RestEndpoint } from "../../../constants/rest-endpoint.constants";
import { DistributionRequestsModel } from "../../models/distribution.requests.model";
import { UserTransactionHistory } from "../../models/user.transaction.history";
import { StakingConfig } from "../../models/staking.config";
import { StakingBalanceHistory } from "../../models/staking.balance.history";
import { CancelStake } from "../../models/apply.stake";
import { PlatformBalance } from "../../models/wallet.balance";
import { ExternalInvoiceModel, IInvoiceResponse } from "../../models/invoice.model";
import { TokensPairs } from "../../models/tokens.pairs";
import { ISwapCriptoToken } from "../../models/swap.model";
import { IOrderEvent } from "../../models/order.event";
import { BridgeChainsModel, BridgeTokensModel } from "../../models/bridge.model";
import { IBridgeCriptoToken } from "../../models/IBridgeTokens.model";

@Injectable({
    providedIn: 'root'
})
export class FinancialService {

    constructor(
        private readonly http: HttpClient
    ) {
    }

    public getDistributionsByAssetId(assetId: string): Observable<DistributionRequestsModel[]> {
        return this.http.get<DistributionRequestsModel[]>(RestEndpoint.financial.getDistributionsByAssetId, { params: { assetId: assetId } })
            .pipe(
                map((data: DistributionRequestsModel[]) => {
                    return data;
                }),
                catchError((err) => {
                    throw (err);
                })
            )
            ;
    }

    public getMyTransactionHistory(
        unitOfMoney: string | undefined,
        transactionFlow: string | undefined,
        periodRange: string | undefined,
        transactionId: string,
        limit: number,
        offset: number): Observable<Array<UserTransactionHistory>> {
        let params = new HttpParams();
        if (unitOfMoney) params = params.set('unitOfMoney', unitOfMoney);
        if (transactionFlow) params = params.set('transactionFlow', transactionFlow);
        if (periodRange) params = params.set('periodRange', periodRange);
        if (transactionId) params = params.set('transactionId', transactionId);
        params = params.set('limit', limit);
        params = params.set('offset', offset);

        return this.http.get<UserTransactionHistory[]>(RestEndpoint.financial.getMyTransactionHistory, { params })
            .pipe(
                map((data: Array<UserTransactionHistory>) => {
                    return data;
                }),
                catchError((err) => {
                    throw (err);
                }));
    }

    public getStakingConfig(unitOfMoney: string): Observable<StakingConfig[]> {
        return this.http.get<StakingConfig[]>(RestEndpoint.financial.getStakingConfig, {
            params: {
                unitOfMoney: unitOfMoney
            }
        })
            .pipe(
                map((data: StakingConfig[]) => {
                    return data;
                }),
                catchError((err) => {
                    throw (err);
                }));
    }

    public getUserStakes(unitOfMoney: string): Observable<StakingBalanceHistory[]> {
        return this.http.get<StakingBalanceHistory[]>(RestEndpoint.financial.getUserStakes, {
            params: {
                unitOfMoney: unitOfMoney
            }
        })
            .pipe(
                map((data: StakingBalanceHistory[]) => {
                    return data;
                }),
                catchError((err) => {
                    throw (err);
                }));
    }

    public cancelUserStake(
        cancelStake: CancelStake,
    ): Observable<{ value: boolean }> {
        return this.http.post<{ value: boolean }>(RestEndpoint.financial.cancelUserStake, cancelStake)
            .pipe(
                map((data: { value: boolean }) => {
                    return data;
                }),
                catchError((err) => {
                    throw err;
                })
            );
    }

    public balance(unit: string): Observable<PlatformBalance[]> {
        let unitOfMoney = unit;
        return this.http.get<PlatformBalance[]>(RestEndpoint.financial.balance, {
            params: {
                unitOfMoney
            }
        })
            .pipe(
                map((data: PlatformBalance[]) => {
                    return data;
                }),
                catchError(() => {
                    throw new Error('Not possible to get the balance')
                })
            );
    }

    public getInvoices(): Observable<Array<IInvoiceResponse>> {
        return this.http.get<{ data: Array<IInvoiceResponse> }>(RestEndpoint.financial.getInvoices, {})
            .pipe(
                map((response) => response.data),
                catchError((err) => {
                    throw err;
                })
            );
    }

    public getExternalDeposits(): Observable<ExternalInvoiceModel[]> {
        return this.http.get<{ data: ExternalInvoiceModel[] }>(RestEndpoint.financial.getExternalDeposits, {})
            .pipe(
                map((response) => response.data),
                catchError((err) => {
                    throw err;
                })
            );
    }

    public getAllSwapCriptoToken(): Observable<{ tokensPairs: TokensPairs[], swapCriptos: ISwapCriptoToken[] }> {
        return this.http.get(RestEndpoint.financial.getAllSwapCriptoToken)
            .pipe(
                map((data: any) => {
                    return data;
                }),
                catchError((err) => {
                    throw (err);
                })
            );
    }

    public checkoutSwap(order: IOrderEvent): Observable<IOrderEvent> {
        return this.http.post<IOrderEvent>(RestEndpoint.financial.performSwap, order);
    }

    public createCheckout(order: IOrderEvent): Observable<IOrderEvent> {
        return this.http.post<IOrderEvent>(
            RestEndpoint.financial.createCheckout, order
        )
            .pipe(
                map((result) => {
                    return result;
                }),
                catchError((err) => {
                    throw ('Failed');
                })
            );
    }

    public realizeExternalDeposit(depositData: any): Observable<any> {
        return this.http.post<any>(RestEndpoint.financial.externalDeposit, depositData)
            .pipe(
                map((result) => {
                    return result?.data;
                }),
                catchError((err) => {
                    throw ('Failed');
                })
            );
    }

    
    public getAllBridgeTokens(): Observable<IBridgeCriptoToken[]> {
        return this.http.get(RestEndpoint.financial.getAllBridgeTokens)
            .pipe(
                map((data: any) => {
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