import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map } from "rxjs/operators";
import { CountriesResponse, Country, CryptoCurrenciesResponse, CryptoCurrencyResponse, ITransakOrderStatus, ITransakRefreshTokenResp, TransakOnRampModel, TransakParameters, TransakUserData } from '../../models/transak.models';
import { IUserAddress } from '../../models/IUserAddress';
import { Token } from '../../models/tokens';
import { UserLoggedModel } from '../../models/user.logged.model';
import { TranslationConstants } from '../util/translation.service';
import { RestEndpoint } from '../../../constants/rest-endpoint.constants';


@Injectable({
    providedIn: 'root'
})
export class TransakService {

    constructor(
        private readonly http: HttpClient,
        private readonly translationConstants: TranslationConstants
    ) { }

    public getCountries(): Observable<Country[]> {
        return this.http.get<CountriesResponse>(RestEndpoint.transak.getCountries, {})
            .pipe(
                map((data: CountriesResponse) => {
                    return data.response || [];
                }),
                catchError((err) => {
                    throw (err);
                })
            );
    }

    public getCryptoCurrencies(): Observable<CryptoCurrencyResponse[]> {
        return this.http.get<CryptoCurrenciesResponse>(RestEndpoint.transak.getCryptoCurrencies, {})
            .pipe(
                map((data: CryptoCurrenciesResponse) => {
                    return data.response || [];
                }),
                catchError((err) => {
                    throw (err);
                })
            );
    }

    public getFiatCurrencies(): Observable<any> {
        return this.http.get(RestEndpoint.transak.getFiatCurrencies, {})
            .pipe(
                map((data: any) => {
                    return data;
                }),
                catchError((err) => {
                    throw (err);
                })
            );
    }

    public getTransakParameters(): Observable<TransakParameters> {
        return this.http.get<TransakParameters>(RestEndpoint.transak.getTransakParameters, {})
            .pipe(
                map((data: TransakParameters) => {
                    return data;
                }),
                catchError((err) => {
                    throw (err);
                })
            );
    }

    public storeOrderData(
        transakOrder: ITransakOrderStatus,
        eventName: string,
        checkoutOrderId: string
    ): Observable<any> {
        return this.http.post<any>(RestEndpoint.transak.storeOrderData, {
            transakOrder,
            eventName,
            checkoutOrderId
        })
            .pipe(
                map((data: any) => {
                    return data;
                }),
                catchError((err) => {
                    throw (err);
                })
            );
    }

    // Buy Crypto
    public mountOnRampData(
        parameters: TransakParameters,
        userAddress: IUserAddress | undefined,
        tokenDetails: Token,
        userDetails: UserLoggedModel,
        orderId: string
    ): TransakOnRampModel {
        let customerWallet: string = '';
        if (tokenDetails?.network_id === 'TRON') {
            customerWallet = userDetails?.tron_wallet || '';
        } else if (tokenDetails?.id === 'BTC') {
            customerWallet = userDetails?.btc_wallet || '';
        } else {
            customerWallet = userDetails?.walletPublicData || '';
        }

        const userData: TransakUserData = {
            firstName: userDetails?.firstName ? userDetails.firstName.charAt(0).toUpperCase() + userDetails.firstName.slice(1) : '',
            lastName: userDetails?.lastName || '',
            email: userDetails?.email || '',
            mobileNumber: userDetails?.phone || '',
            dob: userDetails?.dateOfBirth ? this.getDOBFormatted(userDetails?.dateOfBirth) : ''
        };

        if (userAddress) {
            userData.address = {
                addressLine1: userAddress.street_address,
                addressLine2: '',
                city: userAddress.city,
                state: userAddress.state,
                postCode: userAddress.postal_code,
            };
        }

        const onRamData: TransakOnRampModel = {
            apiKey: parameters.apiKey, // (Required)
            environment: parameters.environment, // (Required) Options = STAGING, PRODUCTION
            widgetHeight: '98%', // Default = 100%
            productsAvailed: "BUY", // Options = BUY (OR) SELL (OR) BUY,SELL - For this case, only buy
            exchangeScreenTitle: `${this.translationConstants.translate('transakScreenTitle.buy')} ${tokenDetails.id}`, // Title to display inside the SDK.
            fiatAmount: 100, // The amount in fiat the customer will pay, can be change inside the SDK.
            fiatCurrency: tokenDetails.id, // Checar se é possível comprar ou vender antes, se não exibira uma lista de tokens.
            network: tokenDetails.network_id.toLowerCase(),
            cryptoCurrencyCode: tokenDetails.id,
            hideExchangeScreen: true,
            walletAddress: customerWallet,
            disableWalletAddressForm: true, // Will not allow the user change the wallet.
            email: userDetails?.email,
            isAutoFillUserData: true,
            themeColor: "000000",
            hideMenu: true,
            partnerCustomerId: userDetails.id,
            partnerOrderId: orderId,
            userData: userData
        };

        return onRamData
    }

    // Sell Crypto
    public mountOffRampData(): void {

    }

    private getDOBFormatted(dateParam: Date): string {
        const date = new Date(dateParam);
        const year = String(date.getFullYear());
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

}
