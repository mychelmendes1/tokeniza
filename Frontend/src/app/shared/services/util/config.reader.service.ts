import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { RestEndpoint } from "../../../constants/rest-endpoint.constants";
import { IExternalLinks } from "../../models/IExternalLinks";
import { IConfig } from "../../models/IConfig";
import { IDigitalBankingConfigs } from "../../models/IDigitalBankingConfigs";
import { ITransferDetails } from "../../models/ITransferDetails";
import { IContactDetails } from "../../models/IContactDetails";

@Injectable({
    providedIn: 'root'
})
export class ConfigReaderService {

    constructor(
        private readonly http: HttpClient
    ) { }

    public getUserLocation(): Observable<any> {
        return this.http.get<any>('https://geolocation-db.com/json/')
            .pipe(
                catchError(err => {
                    throw (err);
                }),
                map(response => {
                    return response;
                })
            )
        ;
    }

    public getAllExternalLinks(): Observable<IExternalLinks> {

        return this.http.get(RestEndpoint.config.getExternalLinks)
            .pipe(
                map((data: IExternalLinks) => {
                    return data;
                }),
                catchError((err) => {
                    throw (err);
                })
            )
        ;
    }

    public getEniatoConfigs(): Observable<IConfig> {
        return this.http.get<IConfig>(RestEndpoint.config.getEniatoConfig)
            .pipe(
                map((data: IConfig) => {
                    return data;
                }),
                catchError((err) => {
                    throw (err);
                })
            )
        ;
    }


    public getDigitalBankingConfigs(): Observable<IDigitalBankingConfigs> {
        return this.http.get<IDigitalBankingConfigs>(RestEndpoint.config.getDigitalBankingConfigs)
            .pipe(
                map((data: IDigitalBankingConfigs) => {
                    return data;
                }),
                catchError((err) => {
                    throw (err);
                })
            )
        ;
    }

    public getTransferDetails(): Observable<ITransferDetails> {
        return this.http.get(RestEndpoint.config.getTransferDetails)
            .pipe(
                map((data: ITransferDetails) => {
                    return data;
                }),
                catchError((err) => {
                    throw (err);
                })
            )
        ;
    }

    public getContactDetails(): Observable<IContactDetails> {
        return this.http.get<IContactDetails>(RestEndpoint.config.getContactDetails)
            .pipe(
                map((data: IContactDetails) => {
                    return data;
                }),
                catchError((err) => {
                    throw (err);
                })
            )
        ;
    }
}