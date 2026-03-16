import { Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LOCATION_INITIALIZED } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

export function HttpLoaderFactory(httpClient: HttpClient) {
    return new TranslateHttpLoader(httpClient);
}

export function ApplicationInitializerFactory(
    translate: TranslateService, injector: Injector) {
    return async () => {
        await injector.get(LOCATION_INITIALIZED, Promise.resolve(null));

        translate.addLangs(['en', 'fr', 'pt-br', 'eninternal', 'pt-brinternal', 'es']);
        translate.setDefaultLang('pt-br');

        const browserLang: string | undefined = translate.getBrowserLang();

        let langToUse: string = 'pt-br';

        if (browserLang?.startsWith('pt')) {
            langToUse = 'pt-br';
        } else if (browserLang?.startsWith('en')) {
            langToUse = 'en';
        } else if (browserLang?.startsWith('es')) {
            langToUse = 'es';
        }

        try {
            await translate.use(langToUse).toPromise();
        } catch (err) {
            console.error('Erro ao carregar tradução:', err);
        }
    };
}