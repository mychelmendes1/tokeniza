import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SharedModule } from '../../shared.module';
import { RouterModule } from '@angular/router';

export type AntifraudNoticeType = 'pending' | 'blocked';

@Component({
    selector: 'app-antifraud-notice-modal',
    templateUrl: './antifraud-notice-modal.component.html',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    styleUrls: ['./antifraud-notice-modal.component.scss']
})
export class AntifraudNoticeModalComponent {
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { type: AntifraudNoticeType }
    ) {}

    public get titleKey(): string {
        return this.data?.type === 'blocked'
            ? 'antifraudModal.title.blocked'
            : 'antifraudModal.title.pending';
    }

    public get bodyKey(): string {
        return this.data?.type === 'blocked'
            ? 'antifraudModal.blocked.text'
            : 'antifraudModal.pending.text';
    }

    public get badgeKey(): string {
        return this.data?.type === 'blocked'
            ? 'antifraudModal.badge.blocked'
            : 'antifraudModal.badge.pending';
    }

    public onConfirm(): void {
        window.location.href = '/home';
    }
}
