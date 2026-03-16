import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared.module';

@Component({
    selector: 'app-simple-modal',
    imports: [
        CommonModule,
        SharedModule
    ],
    templateUrl: './simple-modal.component.html',
    styleUrl: './simple-modal.component.scss'
})
export class SimpleModalComponent implements OnInit {

    constructor(
        public dialogRef: MatDialogRef<SimpleModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ISimpleModal
    ) { }

    public ngOnInit(): void {
        this.dialogRef.disableClose = true;
        this.dialogRef.addPanelClass(['custom-modal', 'simple-modal']);
        if (!this.data) {
            this.dialogRef.close();
        }

        if (this.data.autoClosingTime) {
            setTimeout(() => {
                this.close();
            }, this.data.autoClosingTime);
        }
    }

    public close(): void {
        this.dialogRef.close(true);
    }
}

export interface ISimpleModal {
    title: string;
    subtitle: string;
    icon?: string;
    autoClosingTime: number;
}