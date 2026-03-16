import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { SessionStorageService } from 'angular-web-storage';
import { SessionStorageKeys } from '../shared/services/util/session.storage.keys';

@Injectable({
    providedIn: 'root'
})
export class RouteGuard implements CanActivate {

    constructor(
        private router: Router,
        private readonly sessionStorage: SessionStorageService,
    ) { }

    canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        const pageAccessedByReload: boolean = (window.performance.getEntriesByType('navigation').map((nav: any) => nav?.type).includes('reload'));
        const trustedNavigation: boolean = this.sessionStorage.get(SessionStorageKeys.TRUSTED_NAVIGATION);

        if (trustedNavigation === true) {
            this.sessionStorage.remove(SessionStorageKeys.TRUSTED_NAVIGATION);
            return true;
        } else if (!this.router.navigated && !pageAccessedByReload) {
            this.router.navigate(['/account/login'], { replaceUrl: true });
            return false;
        } else {
            return true;
        }
    }
}