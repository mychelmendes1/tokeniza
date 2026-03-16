import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RestEndpoint } from '../../../constants/rest-endpoint.constants';
import { map, catchError } from 'rxjs/operators';
import { IOrderEvent } from '../../models/order.event';

@Injectable({
    providedIn: 'root'
})
export class CheckoutService {
    constructor(
        private readonly http: HttpClient
    ) { }

    public createCheckout(order: IOrderEvent): Observable<IOrderEvent> {
        let endpoint = order?.userEmail ? RestEndpoint.checkout.createExternalCheckout : RestEndpoint.checkout.createCheckout;
        return this.http.post<IOrderEvent>(
            endpoint, order
        );
    }

    public pixToTokenBRLA(order: IOrderEvent): Observable<any> {
        return this.http.post<any>(RestEndpoint.checkout.pixToTokenBRLA, order)
            .pipe(
                map(result => {
                    return result?.value;
                }),
                catchError((err) => {
                    throw ('Failed');
                })
            )
        ;
    }

    public tokenToPixBrla(order: { pixKey: string, amount: any, token: string }): Observable<any> {
        return this.http.post<any>(RestEndpoint.checkout.tokenToPixBRLA, order)
            .pipe(
                map(result => {
                    return result?.value;
                }),
                catchError((err) => {
                    throw ('Failed');
                })
            )
        ;
    }
}