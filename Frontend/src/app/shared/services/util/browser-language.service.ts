import { Injectable } from '@angular/core';
import { LanguagesEnum } from '../../models/languages.enum';
import { SessionStorageService } from 'angular-web-storage';
import { TranslateService } from '@ngx-translate/core';
import { LocalStorageKeys } from './local.storage.keys';

@Injectable({
    providedIn: 'root'
})
export class BrowserLanguageService {

    constructor(
        private readonly sessionStorage: SessionStorageService,
        private readonly translate: TranslateService
    ) { }

    public getBrowserLanguage(): LanguagesEnum {
        const language: string | null = this.sessionStorage.get(LocalStorageKeys.LANGUAGE_LIST);
        if (!language) {
            const browserLang: string = this.translate.getBrowserLang() || 'pt-br';
            if (browserLang.match(/pt/)) {
                return LanguagesEnum.PORTUGUESE;
            } else {
                return LanguagesEnum.ENGLISH;
            }
        }
        return language as LanguagesEnum;
    }

    public setUserLanguage(selectedLanguage: LanguagesEnum): void {
        this.sessionStorage.set(LocalStorageKeys.LANGUAGE_LIST, selectedLanguage);
        this.translate.use(selectedLanguage);
    }
}