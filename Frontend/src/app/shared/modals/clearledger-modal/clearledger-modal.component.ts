import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { RouterModule } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AccountService } from '../../services/account/account.service';
import { interval, Subscription } from 'rxjs';
import { TranslationConstants } from '../../services/util/translation.service';
import { CustomSnackbarComponent, SnackBarTheme } from '../../custom-snackbar/custom-snackbar.component';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
    selector: 'app-clearledger-modal',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    templateUrl: './clearledger-modal.component.html',
    styleUrl: './clearledger-modal.component.scss'
})
export class ClearLedgerModalComponent {

    public loading: boolean = false;
    public pixQrcode: string = '';
    public QRWidth: number = 278;
    public id: string = '';
    public elementType: string = 'url';
    public subscription: Subscription = new Subscription;
    public amount: number = 0;
    public from: string = '';

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: {
            info: any,
            method: string
        },
        private readonly dialogRef: MatDialogRef<ClearLedgerModalComponent>,
        private readonly accountService: AccountService,
        private readonly dialog: MatDialog,
        private readonly translationConstants: TranslationConstants,
        private readonly customSnackbar: CustomSnackbarComponent,
        private readonly clipboard: Clipboard
    ) { }

    public ngOnInit(): void {
        this.dialogRef.addPanelClass(['custom-modal', 'clearledger-modal']);
        this.pixQrcode = this.data?.info?.pixQrcode;
        this.id = this.data?.info?.id;
        this.amount = Number(this.data?.info?.amount);

        if (window.screen.availWidth < 500) {
            this.QRWidth = 210;
        }
        this.from = this.data?.method?.toLocaleLowerCase();

        if(this.data.method === 'CLEARLEDGER') {
            this.checkClearLedgerPaymentStatus();
        }

        if(this.data.method === 'CELCOIN_INTEGRATION') {
            this.checkPixStatus();
        }
    }

    public ngOnDestroy(): void {
        this.subscription?.unsubscribe()
    }

    public close(): void {
        this.dialogRef.close();
    }

    public checkClearLedgerPaymentStatus(): void {
        this.subscription = interval(5000).subscribe(x => { // will execute every 5 seconds
            this.onCheckStatus();
        });
    }

    public checkPixStatus(): void {
        this.subscription = interval(10000).subscribe(x => { // will execute every 5 seconds
            this.onCheckPixStatus();
        });
    }

    public onCheckStatus(): void {
        this.accountService.getClearLedgerPaymentStatus(this.id).subscribe(dt => {
            if(dt === true) {
                this.subscription?.unsubscribe();
                this.customSnackbar.open(this.translationConstants.translate('clearledgerModal.checkout.message'), SnackBarTheme.success, 4000);
                this.dialogRef.close();
            }
        });
    }

    public onCheckPixStatus(): void {
        this.accountService.getCelcoinIntegrationPaymentStatus(this.id).subscribe(dt => {
            if(dt === true) {
                this.subscription?.unsubscribe();
                this.customSnackbar.open(this.translationConstants.translate('clearledgerModal.checkout.message'), SnackBarTheme.success, 4000);
                this.dialogRef.close();
            }
        });
    }

    public copyPixKey(): void {
        this.clipboard.copy(this.pixQrcode as string);
        this.customSnackbar.open(this.translationConstants.translate('fiatModal.copiedPixKey'), SnackBarTheme.success, 4000);
    }
}