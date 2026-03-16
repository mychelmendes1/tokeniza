import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class CardColorClassService {

    constructor() { }

    public getCardColorClass(remaining: number | undefined): CardClass {
        if (!remaining) {
            return { 
                textClass: 'primary',
                borderClass: 'card-border-primary',
                progressBarClass: 'progress-bar__value-primary'
            };
        } else if (remaining <= 10) {
            return { 
                textClass: 'primary-red',
                borderClass: 'card-border-red',
                progressBarClass: 'progress-bar__value-red'
            };
        } else if (remaining >= 11 && remaining <= 20) {
            return { 
                textClass: 'primary-warning',
                borderClass: 'card-border-warning',
                progressBarClass: 'progress-bar__value-warning'
            };
        } else {
            return { 
                textClass: 'primary',
                borderClass: 'card-border-primary',
                progressBarClass: 'progress-bar__value-primary'
            };
        }
    }
}


export interface CardClass {
    textClass: string;
    borderClass: string;
    progressBarClass: string;
}