import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environments';
import { AccountService } from '../shared/services/account/account.service';
import { RestEndpoint } from '../constants/rest-endpoint.constants';

/**
 * Intercepts 401 (and 403) responses from the API. When the user's session has expired
 * (e.g. after inactivity), clears local session and redirects to login so the user
 * is not left in a broken state.
 */
export const authHttpInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
    const accountService = inject(AccountService);
    const router = inject(Router);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            const status = error?.status;
            const isOurApi = req.url.startsWith(environment.apiBaseUrl);
            const isLoginRequest = req.url.includes(RestEndpoint.account.authenticateUser);

            if (isOurApi && !isLoginRequest && (status === 401 || status === 403)) {
                accountService.clearLocalSession();
                router.navigate(['/account/login']);
            }

            return throwError(() => error);
        })
    );
};
