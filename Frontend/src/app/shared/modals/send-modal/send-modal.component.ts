import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { RouterModule } from '@angular/router';
import { Assets } from '../../models/IAssets.model';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CustomSnackbarComponent, SnackBarTheme } from '../../custom-snackbar/custom-snackbar.component';
import { AssetService } from '../../services/asset/asset.service';
import { TranslationConstants } from '../../services/util/translation.service';
import { WalletUtilsService } from '../../services/util/wallet.utils';
import { AccountService } from '../../services/account/account.service';

function isEmail(text: string) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(text);
}

@Component({
    selector: 'app-send-modal',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    templateUrl: './send-modal.component.html',
    styleUrl: './send-modal.component.scss'
})
export class SendModalComponent {

    public loading: boolean = false;
    public assetId: string = '';
    public nftId: string = '';
    public blockchainId: string = '';
    public walletNumber: string = '';
    public asset: Assets = Object() as Assets;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { asset: Assets },
        private readonly dialogRef: MatDialogRef<SendModalComponent>,
        private readonly customSnackbar: CustomSnackbarComponent,
        private readonly assetsService: AssetService,
        private readonly accountService: AccountService,
        private readonly translationConstants: TranslationConstants,
        private readonly walletUtilsService: WalletUtilsService
    ) { }

    public ngOnInit(): void {
        this.dialogRef.addPanelClass(['custom-modal', 'send-modal']);

        if (this.data) {
            this.assetId = this.data.asset.id;
            this.nftId = this.data.asset.nftId as string;
            this.blockchainId = this.data.asset.blockchainId as string;
            this.asset = new Assets(this.data.asset);
        }
    }

    public getMainPhoto(asset: Assets): string | undefined {
        return this.assetsService.getAssetMainPhoto(asset);
    }

    public close(): void {
        this.dialogRef.close();
    }

    public validateWalletFormat(): boolean{
        return this.walletUtilsService.checkAddress(this.walletNumber, 'eth') || isEmail(this.walletNumber);
    }

    public sendAsset(): void {
        if(isEmail(this.walletNumber)) {
            this.accountService.getUserByEmailWallet(this.walletNumber).subscribe(dt => {
                if (dt?.walletPublicData) {
                    this.walletNumber = dt?.walletPublicData;
                    this.loading = false;
                    this.doTransfer();
                } else {
                    this.customSnackbar.open(this.translationConstants.translate('transferModal.userNotFound'), SnackBarTheme.error, 3000);
                    this.loading = false;
                }
            });
        } else {
            this.doTransfer();
        }
    }

    public doTransfer(): void {
         this.loading = true;
            this.assetsService.sendNft({
                assetId: this.assetId,
                customerIdToTransferTo: this.walletNumber,
                unitOfMoney: this.assetId,
                nftId: this.nftId,
                blockchainId: this.blockchainId
            }).subscribe(success => {
                if (success?.result === 'error') {
                    this.customSnackbar.open(this.translationConstants.translate('myAssets.modalSend.error'), SnackBarTheme.error, 4000);
                } else {
                    this.customSnackbar.open(this.translationConstants.translate('myAssets.modalSend.success'), SnackBarTheme.success, 4000);
                    this.dialogRef.close(true);
                }
            }, (error: any) => {
                if(error?.error?.message?.includes('find the destiny user')) {
                    this.customSnackbar.open(this.translationConstants.translate('myAssets.modalSend.user'), SnackBarTheme.error, 4000);
                } else {
                    this.customSnackbar.open(this.translationConstants.translate('myAssets.modalSend.sendError'), SnackBarTheme.error, 4000);
                }

            }).add(() => {
                this.loading = false;
            })
    }
}