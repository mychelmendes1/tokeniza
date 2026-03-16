import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { RouterModule } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-pagseguro-modal',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    templateUrl: './pagseguro-modal.component.html',
    styleUrl: './pagseguro-modal.component.scss'
})
export class PagseguroModalComponent {

    public loading: boolean = false;
    public urlPagSeguro: string = '';
    public paymentProcessor: string = '';

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: {
            url: string, 
            processor: string
        },
        private readonly dialogRef: MatDialogRef<PagseguroModalComponent>,
    ) { }

    public ngOnInit(): void {
        this.dialogRef.addPanelClass(['custom-modal', 'pagseguro-modal']);
        this.urlPagSeguro = this.data?.url;
        this.paymentProcessor = this.data?.processor;
    }

    public close(): void {
        this.dialogRef.close();
    }

    public openCoin(): void {
        window.location.href = this.urlPagSeguro;
    }
}