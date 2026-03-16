import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { EMPTY, Observable, of, throwError } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { AntifraudNoticeService } from '../shared/utils/antifraud-notice.service';

export const antifraudHttpInterceptor: HttpInterceptorFn = (
    req: HttpRequest<any>,
    next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
    const antifraudNoticeService = inject(AntifraudNoticeService);

    return next(req).pipe(
        mergeMap((event: HttpEvent<any>) => {
            if (event instanceof HttpResponse) {
                if (isPendingBody(event.body)) {
                    antifraudNoticeService.showPending();
                    return EMPTY;
                }
            }
            return of(event);
        }),
        catchError((error: HttpErrorResponse) => {
            if (isPendingError(error)) {
                antifraudNoticeService.showPending();
                return EMPTY;
            }

            if (isBlockedError(error)) {
                antifraudNoticeService.showBlocked();
                return EMPTY;
            }

            return throwError(() => error);
        })
    );
};

function isPendingBody(body: any): boolean {
    return body?.error === 'TRANSACTION_PENDING_APPROVAL';
}

function isPendingError(error: HttpErrorResponse): boolean {
    return error?.error?.error === 'TRANSACTION_PENDING_APPROVAL';
}

function isBlockedError(error: HttpErrorResponse): boolean {
    const code = error?.error?.error;
    if (code === 'TRANSACTION_BLOCKED') return true;

    const message = (error?.error?.message || error?.message || '').toLowerCase();
    return message.includes('transaction blocked') || message.includes('antifraud');
}
