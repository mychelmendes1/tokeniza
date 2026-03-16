import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { RouterModule } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-warning-modal',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    templateUrl: './warning-modal.component.html',
    styleUrl: './warning-modal.component.scss'
})
export class WarningModalComponent implements OnInit {

    constructor(
        public dialogRef: MatDialogRef<WarningModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: IWarningModal
    ) { }

    public ngOnInit(): void {
        this.dialogRef.disableClose = true;
        this.dialogRef.addPanelClass(['custom-modal', 'warning-modal']);
        if (!this.data) {
            this.dialogRef.close();
        }
    }

    public close(): void {
        this.dialogRef.close(true);
    }
}

export interface IWarningModal {
    title: string;
    subtitle: string;
    icon?: string;
    declineBtn: string | undefined;
    confirmBtn: string | undefined;
}