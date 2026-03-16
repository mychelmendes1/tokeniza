import { APP_INITIALIZER, ApplicationConfig, Injector, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TranslationConstants } from './shared/services/util/translation.service';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { HttpClient, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideTranslateService, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { ApplicationInitializerFactory } from './translation.initializer';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localePt from '@angular/common/locales/pt';
import localeEs from '@angular/common/locales/es';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { NgEventBus } from 'ng-event-bus';
import { AuthGuardService } from './guards/auth-guard.service';
import { capacitorHttpInterceptor } from './interceptors/capacitor.http.interceptor';
import { authHttpInterceptor } from './interceptors/auth.http.interceptor';
import { ImagePreloaderService } from './shared/services/util/image-preloader.service';
import { antifraudHttpInterceptor } from './interceptors/antifraud.http.interceptor';

const browserLang = window.navigator.language.toLowerCase();

let APP_LANG: string = 'pt-br';
let angularLocale: any = localePt;

if (browserLang.includes('en')) {
    APP_LANG = 'en';
    angularLocale = localeEn;
} else if (browserLang.includes('es')) {
    APP_LANG = 'es';
    angularLocale = localeEs;
}

registerLocaleData(angularLocale);

/**
* Custom HTTP language loader
*
* @param httpClient The httpClient
*/
export function LangHttpLoaderFactory(httpClient: HttpClient): TranslateHttpLoader {
    return new TranslateHttpLoader(httpClient, './assets/i18n/', '.json');
}

export function preloadImagesFactory(preloader: ImagePreloaderService) {
    return () => preloader.preloadImages([
        'assets/images/account-image.svg',
        'assets/images/home-image.svg'
    ]);
}

export const appConfig: ApplicationConfig = {
    providers: [
        NgEventBus,
        AuthGuardService,
        TranslationConstants,
        provideHttpClient(
            withInterceptors([authHttpInterceptor, capacitorHttpInterceptor, antifraudHttpInterceptor]),
        ),
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideAnimationsAsync(),
        provideClientHydration(withEventReplay()),
        provideHttpClient(withFetch()),
        provideTranslateService({
            loader: {
                provide: TranslateLoader,
                useFactory: LangHttpLoaderFactory,
                deps: [HttpClient],
            },
            defaultLanguage: APP_LANG
        }),
        {
            provide: LOCALE_ID,
            useValue: APP_LANG
        },
        {
            provide: APP_INITIALIZER,
            useFactory: ApplicationInitializerFactory,
            deps: [TranslateService, Injector],
            multi: true
        },
        {
            provide: MAT_DATE_LOCALE,
            useValue: APP_LANG
        },
        {
            provide: APP_INITIALIZER,
            useFactory: preloadImagesFactory,
            deps: [ImagePreloaderService],
            multi: true,
        },
    ]
};
