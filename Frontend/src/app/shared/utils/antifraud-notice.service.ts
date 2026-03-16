import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AntifraudNoticeModalComponent } from '../modals/antifraud-notice-modal/antifraud-notice-modal.component';

@Injectable({
    providedIn: 'root',
})
export class AntifraudNoticeService {
    constructor(
        private readonly dialog: MatDialog
    ) {}

    public showPending(): void {
        this.openNotice('pending');
    }

    public showBlocked(): void {
        this.openNotice('blocked');
    }

    private openNotice(type: 'pending' | 'blocked'): void {
        const disableClose = type === 'blocked';
        this.dialog.open(AntifraudNoticeModalComponent, {
            data: { type },
            panelClass: 'antifraud-notice-dialog',
            disableClose
        });
    }
}
