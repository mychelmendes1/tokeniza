import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';
import { TranslationConstants } from './translation.service';

@Injectable({
    providedIn: 'root'
})
export class PaginatorTranslationService extends MatPaginatorIntl {

    constructor (
        private translate: TranslateService,
        private readonly translationConstants: TranslationConstants
    ) {
        super();

        this.translate.onLangChange.subscribe((e: Event) => {
            this.initTranslations();
        });

        this.initTranslations();
    }

    public override getRangeLabel = (page: number, pageSize: number, length: number): string => {
        const preposition: string = this.translationConstants.translate('paginator.of');
        if (length === 0 || pageSize === 0) {
            return `0 / ${length}`;
        }

        length = Math.max(length, 0);

        const startIndex: number = page * pageSize;
        const endIndex: number = startIndex < length
            ? Math.min(startIndex + pageSize, length)
            : startIndex + pageSize;

        return `${startIndex + 1} - ${endIndex} ${preposition} ${length}`;
    };

    public initTranslations(): void {
        this.itemsPerPageLabel = this.translationConstants.translate('paginator.itemsPerPage');
        this.nextPageLabel = this.translationConstants.translate('paginator.nextPage');
        this.previousPageLabel = this.translationConstants.translate('paginator.previousPage');
        this.firstPageLabel = this.translationConstants.translate('paginator.firstPage');
        this.lastPageLabel = this.translationConstants.translate('paginator.lastPage');

        this.changes.next();
    }
}
