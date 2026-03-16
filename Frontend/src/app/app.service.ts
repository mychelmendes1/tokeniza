import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
import { Injectable } from "@angular/core";
import { Event, NavigationEnd, Router } from "@angular/router";
import { SessionStorageService } from "angular-web-storage";
import { BehaviorSubject, Observable } from "rxjs";
import { LocalStorageKeys } from "./shared/services/util/local.storage.keys";
import { environment } from "../environments/environments";
import { TranslationConstants } from "./shared/services/util/translation.service";
import { PageTitlesEnum } from "./shared/models/page-title.enum";

@Injectable({
    providedIn: 'root'
})
export class AppService {
    public routeHistory: Array<string> = [];
    public previousUrl: string = '';
    private currentUrl: BehaviorSubject<string> = new BehaviorSubject<string>('');
    private isMobile: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private showBalance: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private loadingSpinner: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    constructor(
        private readonly router: Router,
        private breakpointObserver: BreakpointObserver,
        private readonly sessionStorage: SessionStorageService,
        private readonly translationConstants: TranslationConstants
    ) {
        this.router.events.subscribe((event: Event) => {
            if (event instanceof NavigationEnd) {
                const currentUrl: string = event?.url;
                this.routeHistory.unshift(currentUrl);
                this.setCurrentUrl(currentUrl);
            }
        });

        this.breakpointObserver.observe([Breakpoints.Handset, Breakpoints.TabletPortrait]).subscribe(result => {
            this.isMobile.next(result.matches);
        });

        const showBalance: boolean = this.sessionStorage.get(LocalStorageKeys.HIDE_BANKING_BALANCE);
        this.showBalance.next(showBalance);
    }

    public setCurrentUrl(url: string): void {
        this.previousUrl = this.currentUrl.getValue();
        this.currentUrl.next(url);
    }

    public getCurrentUrl(): Observable<string> {
        return this.currentUrl.asObservable();
    }

    public getPreviousUrl(): string {
        return this.previousUrl;
    }

    public setSpinnerLoading(show: boolean = false): void {
        if (show) {
            this.loadingSpinner.next(true)
        } else {
            this.loadingSpinner.next(false);
        }
    }

    public getSpinnerLoading(): Observable<boolean> {
        return this.loadingSpinner.asObservable();
    }

    // Returns if it's mobile size
    public getIsMobile(): Observable<boolean> {
        return this.isMobile.asObservable();
    }

    public getShowBalance(): Observable<boolean> {
        return this.showBalance.asObservable();
    }

    public toggleHideBalance(): void {
        const showBalance: boolean = this.showBalance.getValue();
        this.showBalance.next(!showBalance);
        this.sessionStorage.set(LocalStorageKeys.HIDE_BANKING_BALANCE, !showBalance);
    }

    public getPageTitle(event: NavigationEnd): string {
        const currentUrl: string = event?.url;
        let pageTitle: string = environment.projectName;

        Object.values(PageTitlesEnum).forEach((page) => {
            if (currentUrl?.includes(page)) {
                pageTitle = `${environment.projectName} | ${this.translationConstants.translate(`pageTitle.${page}`)}`;
            }
        });

        return pageTitle;
    }
}