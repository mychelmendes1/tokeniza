import { HttpErrorResponse, HttpHandlerFn, HttpHeaders, HttpInterceptorFn, HttpParams, HttpRequest, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { CapacitorHttp } from '@capacitor/core';
import { defer, from, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environments';
import { DeviceService } from '../shared/services/util/device.service';
import { UsersDevicesModel } from '../shared/models/users.devices.model';
import { throwError } from 'rxjs';

export const capacitorHttpInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
    const deviceService: DeviceService = inject(DeviceService);

    return from(deviceService.getDeviceData()).pipe(
        switchMap((deviceDetails: UsersDevicesModel) => {
            if (environment.isCapacitor) {
                return interceptNativeRequest(req, next, deviceDetails) ?? of();
            }
            return interceptWebRequest(req, next, deviceDetails) ?? of();
        })
    );
};

function interceptWebRequest(
    req: HttpRequest<any>,
    next: HttpHandlerFn,
    deviceDetails: UsersDevicesModel
) {
    const deviceDetailsString: string = JSON.stringify(deviceDetails) || '';
    const isInternal: boolean = req.url.startsWith(environment.apiBaseUrl);

    const requestToSend: HttpRequest<any> = isInternal && deviceDetailsString
        ? req.clone({
            headers: req.headers.set('device', deviceDetailsString),
        })
        : req
    ;

    return next(requestToSend).pipe(
        catchError((error) => {
            console.error('Erro interceptado no WebRequest:', error);
            return throwError(() => handleError(error));
        })
    );
}

function handleError(res: any): HttpErrorResponse {
    console.log('res:', res);

    if (res?.staus === 500) {

    }

    const errorMessage = res?.error?.error ?? '';

    if (errorMessage === 'Unauthorized access.') {

    }

    return new HttpErrorResponse({
        error: res?.response?.data ?? res?.error ?? res['data'],
        headers: new HttpHeaders(res['headers'] ?? {}),
        url: res['url'],
        status: res['status'],
    });
}
function interceptNativeRequest(req: HttpRequest<any>, _next: HttpHandlerFn, deviceDetails: UsersDevicesModel) {
    const deviceDetailsString = JSON.stringify(deviceDetails) || '';
    const { method, body, url, headers, params } = req;
    const isInternal = req.url.startsWith(environment.apiBaseUrl);

    // Para iOS, sempre usar CapacitorHttp para requisições internas para garantir headers corretos
    if (url?.includes('i18n')) {
        return _next(req);
    }

    const sanitizeHeaders = (headers: HttpHeaders) => {
        const res: Record<string, string> = {};
        for (const key of headers.keys()) {
            res[key] = headers.get(key) || '';
        }
        res['Content-Type'] = 'application/json';

        if (deviceDetailsString) {
            res['Device'] = deviceDetailsString;
        }
        return res;
    };

    // Removida função sanitizeParams pois não é mais necessária

    const handleError = (res: any) => {
        console.log('res:', res);
        return new HttpErrorResponse({
            error: res?.response?.data ?? res['data'],
            headers: new HttpHeaders(res["headers"]),
            url: res["url"],
            status: res["status"],
        });
    };

    const handleResponse = (res: any) => {
        if (res["status"] >= 400) throw handleError(res);
        return new HttpResponse({ body: res["data"] });
    };

    // Construir URL com query parameters para GET requests
    let fullUrl = url;
    if (method === 'GET' && params.keys().length > 0) {
        const queryParams = new URLSearchParams();
        for (const key of params.keys()) {
            queryParams.append(key, params.get(key) || '');
        }
        fullUrl = `${url}?${queryParams.toString()}`;
    }

    const options = {
        url: fullUrl,
        headers: sanitizeHeaders(headers),
        data: method !== 'GET' ? body : undefined
    };

    switch (method) {
        case 'POST':
            return defer(() => CapacitorHttp.post(options)).pipe(
                catchError(err => { console.log(err); throw handleError(err); }),
                map(handleResponse)
            );
        case 'PUT':
            return defer(() => CapacitorHttp.put(options)).pipe(
                catchError(err => { console.log(err); throw handleError(err); }),
                map(handleResponse)
            );
        case 'DELETE':
            return defer(() => CapacitorHttp.delete(options)).pipe(
                catchError(err => { console.log(err); throw handleError(err); }),
                map(handleResponse)
            );
        case 'GET':
            return defer(() => CapacitorHttp.get(options)).pipe(
                catchError(err => { console.log(err); throw handleError(err); }),
                map(handleResponse)
            );
        default:
            return undefined;
    }
}