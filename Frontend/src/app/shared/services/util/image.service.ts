import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RestEndpoint } from '../../../constants/rest-endpoint.constants';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ErrorHandlerService } from './error-handler.service';
import { Image } from '../../models/image.model';

/**
 * Axia Image service
 */
@Injectable({
    providedIn: 'root'
})
export class ImageService {

    constructor(
        private readonly http: HttpClient,
        private readonly errorHandler: ErrorHandlerService
    ) { }

    /**
     * Upload an image
     * @param image Image to be uploaded to s3
     */
    public uploadImage(image: Image): Observable<any> {
        const header: HttpHeaders = new HttpHeaders({});
        return this.http.post<any>(RestEndpoint.account.files, image, { headers: header })
            .pipe(
                map((data) => {
                    return data;
                }),
                catchError((err) => { return this.errorHandler.validate(err); })
            )
            ;
    }
}