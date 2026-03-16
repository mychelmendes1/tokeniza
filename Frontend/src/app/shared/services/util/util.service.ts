import { HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { LocalStorageService, SessionStorageService } from "angular-web-storage";
import { LocalStorageKeys } from "./local.storage.keys";

@Injectable({
    providedIn: 'root'
})
export class UtilService {

    constructor(
        private readonly sessionStorage: SessionStorageService,
        private readonly localStorage: LocalStorageService
    ) { }

    public static getHttpParamsFromObject(object: any): HttpParams {
        let params = new HttpParams();
        for (const key of Object.keys(object)) {
            if (object[key]) {
                params = params.set(key, object[key]);
            }
        }
        return params;
    }

    public searchParams(search?: Record<string, any>): HttpParams {
        if (!search) {
            return new HttpParams();
        }

        const searchParamsObj: { [param: string]: string | number | boolean } = Object.keys(search)
            .reduce((acc, key) => {
                if (Array.isArray(search[key])) {
                    acc[key] = (search[key] as any[]).join(',');
                } else if (search[key]) {
                    acc[key] = search[key];
                }
                return acc;
            }, {} as { [param: string]: string | number | boolean });

        return new HttpParams({ fromObject: searchParamsObj });
    }

    /**
 * @param sessionStorageKey the key to find data on SessionStorage
 * @returns the saved data on SessionStorage
 */
    public getSessionStorageDataFormatted<T>(sessionStorageKey: any): any | undefined {
        const stringData: string = this.sessionStorage.get(sessionStorageKey as string);

        if (stringData) {
            try {
                const objectData: string = JSON.parse(stringData);
                return objectData as T;
            } catch {
                return undefined;
            }
        }
        return undefined;
    }

    /**
     * @param localStorageKey the key to find data on LocalStorage
     * @returns the saved data on LocalStorage
     */
    public getLocalStorageDataFormatted(localStorageKey: LocalStorageKeys): any {
        const stringData: string = this.localStorage.get(localStorageKey as string);

        if (stringData) {
            try {
                const objectData: string = JSON.parse(stringData);
                return objectData;
            } catch {
                return undefined;
            }
        }
        return undefined;
    }

    public normalizeText(text: string): string {
        return text ? text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, '') : '';
    }
}