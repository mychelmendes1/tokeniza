import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ICep } from '../../models/cep.model';

/**
 * Axia CEP service
 */
@Injectable({
    providedIn: 'root'
})
export class CepService {

    constructor(
        private readonly http: HttpClient,
    ) { }

    public findCep(zipcode: string): Observable<ICep> {
        return this.http.get<ICep>(`https://viacep.com.br/ws/${zipcode}/json`, {})
            .pipe(
                map((data: ICep) => {
                    return data;
                }),
                catchError((err) => {
                    throw (err);
                })
            )
        ;
    }
}