import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { SessionStorageService } from 'angular-web-storage';import { AccountService } from '../shared/services/account/account.service';
import { SessionlStorageKeys } from '../shared/utils/session.storage.keys';
import { AppService } from '../app.service';

/**
 * Block some route if is not logged
 */
@Injectable()
export class AuthGuardService implements CanActivate
{
    constructor(
        private readonly accountService: AccountService,
        private readonly router: Router,
        private readonly sessionStorage: SessionStorageService,
        private readonly appService: AppService
    )
    { }

    /**
     * Security guard for some routes
     * Changed the method so that it is asynchronous, since before it was allowing the display of the page before having the Subscribe result
     */
    public async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
        this.appService.setSpinnerLoading(true);
        return new Promise<boolean>((resolve) => {
            this.accountService.isAuthenticated().subscribe(authentication => {
                if (authentication) {
                    return resolve(true);
                } else {
                    this.router.navigate(['/account/login']);

                    const redemptionCodeParam = route.queryParams['redemptionCode'];
                    if (redemptionCodeParam) {
                        this.sessionStorage.set(SessionlStorageKeys.REDEMPTIOIN_CODE_PARAM, redemptionCodeParam);
                    }

                    return resolve(false);
                }
            }).add(() => {
                this.appService.setSpinnerLoading(false);
            });
        });
    }
}