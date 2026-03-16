import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { RouterModule } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { fadeIn } from '../../services/util/animations.service';
import { AccountService } from '../../services/account/account.service';
import { TranslationConstants } from '../../services/util/translation.service';
import { CustomSnackbarComponent, SnackBarTheme } from '../../custom-snackbar/custom-snackbar.component';
import { UserLoggedModel } from '../../models/user.logged.model';
import { usefulSettings } from '../../models/useful-settings.model';
import { BrowserLanguageService } from '../../services/util/browser-language.service';

@Component({
    selector: 'app-view-external-charge-modal',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    templateUrl: './view-external-charge-modal.component.html',
    styleUrl: './view-external-charge-modal.component.scss',
    animations: [fadeIn]
})
export class ViewExternalChargeModalComponent implements OnInit {
    public loading: boolean = false;
    public charge: any;
    public userLogged: UserLoggedModel = Object() as UserLoggedModel;
    public usefulSettings: usefulSettings = new usefulSettings();

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<ViewExternalChargeModalComponent>,
        private readonly accountService: AccountService,
        private readonly browserLanguageService: BrowserLanguageService,
        private readonly translationConstants: TranslationConstants,
        private readonly customSnackbar: CustomSnackbarComponent
    ) {
        this.charge = data;
    }

    public ngOnInit(): void {
        this.dialogRef.disableClose = true;
        this.dialogRef.addPanelClass(['custom-modal', 'charge-modal']);

        this.accountService.getLoggedUserDetails().subscribe(resp => {
            this.userLogged = resp;
        });

        this.usefulSettings = {
            fiatCurrency: this.accountService.getFiatCurrency(),
            selectedLanguage: this.browserLanguageService.getBrowserLanguage()
        }
    }

    public isInvoiceInternal(): boolean {
        if (!this.charge?.name) {
            return true;
        } else {
            return false
        }
    }

    public isOwner(): boolean {
        return this.charge?.userIdFrom === this.userLogged?.id;
    }

    public close(): void {
        this.dialogRef.close();
    }

    public updateInvoice(status: string): void {
        this.loading = true;
        this.accountService.updateInvoice({
            userId: undefined,
            id: this.charge?.id,
            status: status as any,
            traceId: undefined
        }).subscribe(success => {
            this.customSnackbar.open(this.translationConstants.translate('invoice.send.success'), SnackBarTheme.success, 4000);
            this.dialogRef.close(true);
        }, error => {
            this.customSnackbar.open(this.translationConstants.translate('invoice.send.error'), SnackBarTheme.error, 4000);
        }).add(() => {
            this.loading = false;
        });
    }
}