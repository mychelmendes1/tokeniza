import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SharedModule } from '../../shared.module';
import { RouterModule } from '@angular/router';
import { LocalStorageService } from 'angular-web-storage';
import { LocalStorageKeys } from '../../services/util/local.storage.keys';
import { AccountService } from '../../services/account/account.service';
import { ShareLinkService } from '../../services/util/share-link.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { CustomSnackbarComponent, SnackBarTheme } from '../../custom-snackbar/custom-snackbar.component';
import { TranslationConstants } from '../../services/util/translation.service';
import { Token } from '../../models/tokens';

@Component({
    selector: 'app-token-qrcode-modal',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    templateUrl: './token-qrcode-modal.component.html',
    styleUrl: './token-qrcode-modal.component.scss'
})
export class TokenQrcodeModalComponent implements OnInit {

    public loading: boolean = false;
    public publicWallet: string = '';
    public elementType: string = 'img';
    public QRWidth: number = 278;
    public screenWidth: number | undefined = undefined;
    public unitOfMoney: string = '';

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { token: Token } | null,
        public dialogRef: MatDialogRef<TokenQrcodeModalComponent>,
        private readonly localStorage: LocalStorageService,
        private readonly accountService: AccountService,
        private readonly shareLinkService: ShareLinkService,
        private readonly clipboard: Clipboard,
        private readonly customSnackbar: CustomSnackbarComponent,
        private readonly translationConstants: TranslationConstants,
    ) { }

    public async ngOnInit(): Promise<void> {
        this.dialogRef.addPanelClass(['custom-modal', 'token-qrcode-modal']);

        this.initData();
    }

    public async initData(): Promise<void> {
        this.loading = true;
        this.unitOfMoney = await this.localStorage.get(LocalStorageKeys.UNIT_OF_MONEY);

        if (this.unitOfMoney === 'BTC') {
            this.accountService.getLoggedUserDetails().subscribe(user => {
                this.publicWallet = user?.btc_wallet as string;
            }).add(() => {
                this.loading = false;
            });
        } else {
            this.accountService.getLoggedUserDetails().subscribe(user => {
                this.publicWallet = user?.walletPublicData as string;
            }).add(() => {
                this.loading = false;
            });
        }
    }

    public close(): void {
        this.dialogRef.close(true);
    }

    public sharePublicWalletWhatsapp(): void {
        this.shareLinkService.shareWhatsapp(this.translationConstants.translate('indications.shareDigitalWallet').replace('###code###', this.publicWallet));
    }

    public copyPublicWallet(): void {
        this.clipboard.copy(this.publicWallet);
        this.customSnackbar.open(this.translationConstants.translate('snackbar.keyCopied'), SnackBarTheme.success, 3000);
    }
}