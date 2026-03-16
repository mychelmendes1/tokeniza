import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

// tslint:disable: max-line-length
@Injectable()
export class TranslationConstants {
    constructor(
        private readonly translateService: TranslateService
    ) { }

    public translate(path: string): string {
        return this.translateService.instant(path);
    }

    public translateList(path: string): string[] {
        return this.translateService.instant(path) as string[];
    }
}