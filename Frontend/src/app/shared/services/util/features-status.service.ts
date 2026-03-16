import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { LocalStorageService } from "angular-web-storage";
import { Observable, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { RestEndpoint } from "../../../constants/rest-endpoint.constants";
import { LocalStorageKeys } from "./local.storage.keys";
import { FeatureNames } from "../../models/feature-names.enum";

@Injectable({
    providedIn: 'root'
})
export class FeaturesStatusService {

    constructor(
        private readonly http: HttpClient,
        private readonly storage: LocalStorageService
    ) { }

    public getFeatureStatus(featureName: FeatureNames, forceLoad: boolean = false): Observable<boolean> {
        if (this.storage.get(LocalStorageKeys.FEATURE_STATUS + featureName)){
            return of(this.storage.get(LocalStorageKeys.FEATURE_STATUS + featureName));
        }

        return this.http.get<{ value: boolean }>(RestEndpoint.features.getFeatureStatus, {
            params: {'featureName': featureName}
        })
            .pipe(
                map((data: {value: boolean}) => {
                    this.storage.set(LocalStorageKeys.FEATURE_STATUS + featureName, data?.value);
                    return data?.value;
                }),
                catchError((err) => {
                    throw(err);
                })
        )   ;
    }

    public getAllFeatureStatus(): Observable<any> {
        return this.http.get(RestEndpoint.features.getAllFeatureStatus)
            .pipe(
                map((data) => {
                    return data;
                }),
                catchError((err) => {
                    throw(err);
                })
        )   ;
    }
}