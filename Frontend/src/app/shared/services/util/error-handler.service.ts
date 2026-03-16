import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TranslationConstants } from './translation.service';


@Injectable({
    providedIn: 'root'
})
export class ErrorHandlerService
{
    constructor(
        private readonly translationConstants: TranslationConstants
    ){ }

    public validate(err: any): Observable<any> {
        try {
            const intError: any = JSON.parse(err.error);

            if (intError && intError.message) {
                err.error.message = this.translationConstants.translate(err.error.message);
                throw new Error(err.error.message);
            }

            if (err.message) {
                err.message = this.translationConstants.translate(err.message);
                throw err;
            }

            if (err.error) {
                throw err.error;
            }

        } catch(ex) {
            throw err;
        }

        throw err;
    }
}