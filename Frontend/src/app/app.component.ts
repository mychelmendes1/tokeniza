import { Component, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { Event, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { svgIcons } from './constants/svg-icons.constants';
import { CommonModule } from '@angular/common';
import { SharedModule } from './shared/shared.module';
import { AppService } from './app.service';
import { Subscription } from 'rxjs';
import { NgEventBus } from 'ng-event-bus';
import { MatSidenav } from '@angular/material/sidenav';
import { UserLoggedModel } from './shared/models/user.logged.model';
import { AccountService } from './shared/services/account/account.service';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { App } from '@capacitor/app';
import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav.component';
import { environment } from '../environments/environments';

@Component({
    selector: 'app-root',
    imports: [
        CommonModule,
        SharedModule,
        RouterOutlet,
        BottomNavComponent
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {

    @ViewChild('drawer', { static: true }) public sidenav!: MatSidenav;
    public currentUrl: boolean = false;
    public urlSubscription: Subscription = new Subscription;
    public isMobileSubscription: Subscription = new Subscription;
    public isMobile: boolean = false;
    public menuExpanded: boolean = false;
    public loadingSubscription: Subscription = new Subscription;
    public loading: boolean = false;
    public userDetails!: UserLoggedModel | undefined;
    private backButtonListener?: PluginListenerHandle;

    constructor(
        private readonly router: Router,
        private readonly iconRegistry: MatIconRegistry,
        private readonly domSanitizer: DomSanitizer,
        private readonly appService: AppService,
        private eventBus: NgEventBus,
        private readonly renderer: Renderer2,
        private readonly accountService: AccountService,
        private readonly location: Location
    ) {
        this.iconRegistry.setDefaultFontSetClass('material-icons-outlined');
        this.registrySvg(svgIcons, 'icons');

        this.isMobileSubscription = this.appService.getIsMobile().subscribe(isMobile => {
            this.isMobile = isMobile;
        });

        this.urlSubscription = this.appService.getCurrentUrl().subscribe(currentUrl => {
            this.currentUrl = currentUrl === '/' || !currentUrl || Object.values(EUrl).some(url => currentUrl.includes(url));
        });

        this.loadingSubscription = this.appService.getSpinnerLoading().subscribe(loadingSppiner => {
            this.loading = loadingSppiner;
        });

        const urlParams = new URLSearchParams(window.location.search);
            ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(key => {
                const value = urlParams.get(key);
                if (value) {
                    localStorage.setItem(key, value);
                }
        });
    }

    public async ngOnInit(): Promise<void> {
        this.router.events.subscribe((evt: Event) => {
            if (!(evt instanceof NavigationEnd)) {
                return;
            }

            if (evt instanceof NavigationEnd) {
                const pageTitle = this.appService.getPageTitle(evt);
                this.renderer.setProperty(document, 'title', pageTitle || "")
            }

            this.getUserDetails();

            window.scrollTo(0, 0);
        });

        const isApp = Capacitor.getPlatform() !== 'web';
        if (isApp) {
        document.body.classList.add('is-app');
            // Handle Android hardware back button to navigate within the app
            this.backButtonListener = await App.addListener('backButton', ({ canGoBack }) => {
                const atHome = this.router.url === '/home';
                const canAngularGoBack = window.history.length > 1;

                if ((canGoBack || canAngularGoBack) && !atHome) {
                    this.location.back();
                } else {
                    App.exitApp();
                }
            });
        }

        this.eventBus.on('appBarMenuButtonClickedEvent').subscribe(() => {
            this.sidenav.open();
            this.menuExpanded = true;
        });
    }

    public registrySvg(svgList: Array<string>, folder: string): void {
        svgList.forEach((imageName: string) => {
            let iconUrl: string;

            if (environment.isCapacitor) {
                // Para mobile (Capacitor), usar URL completa
                iconUrl = `https://${environment.baseUrl}/assets/${folder}/${imageName}.svg`;
            } else {
                // Para web, usar caminho relativo como no código que funciona
                iconUrl = `../assets/${folder}/${imageName}.svg`;
            }

            this.iconRegistry.addSvgIcon(
                imageName,
                this.domSanitizer.bypassSecurityTrustResourceUrl(iconUrl)
            );
        });
    }

    public ngOnDestroy(): void {
        this.urlSubscription.unsubscribe();
        this.isMobileSubscription.unsubscribe();
        this.backButtonListener?.remove();
    }

    public onToggleMenu(expanded: boolean): void {
        this.menuExpanded = expanded;
    }

    public closeMenu(): void {
        this.sidenav.close();
    }

    public getUserDetails(): void {
        this.accountService.getLoggedUserDetails().subscribe(user => {
            this.userDetails = user;
        }, error => {
            this.userDetails = undefined;
        });
    }
}

export enum EUrl {
    ACCOUNT = 'account',
    HOME = 'home',
}
