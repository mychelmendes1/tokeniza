import { Injectable } from '@angular/core';
import { countries } from '../../../constants/countries.constants';

@Injectable({
    providedIn: 'root'
})
export class NationalityService {

    constructor() { }

    public getAllNationality(): Array<INationality> {
        const nationalityList: Array<INationality> = countries.map((item: any) => {
            return {
                name: item.name?.common,
                idd: item.idd?.root && item.idd?.suffixes[0] ? item.idd.root + item.idd.suffixes[0] : ''
            }
        })
        return nationalityList.sort((a, b) => {
            return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
        });
    }
}

export interface INationality {
    idd: any;
    name: string;
}