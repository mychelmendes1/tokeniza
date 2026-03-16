import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { RouterModule } from '@angular/router';
import BigNumber from 'bignumber.js';
import { CustomSnackbarComponent, SnackBarTheme } from '../../custom-snackbar/custom-snackbar.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Assets } from '../../models/IAssets.model';
import { IFiatCurrency } from '../../models/IFiatCurrency';
import { AccountService } from '../../services/account/account.service';
import { AssetService } from '../../services/asset/asset.service';
import { TranslationConstants } from '../../services/util/translation.service';
import { OnkeypressService } from '../../services/util/onkeypress.service.ts.service';
import { ValueConverterService } from '../../services/util/value-converter.service';

@Component({
    selector: 'app-split-modal',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    templateUrl: './split-modal.component.html',
    styleUrl: './split-modal.component.scss'
})
export class SplitModalComponent {
    public loading: boolean = false;
    public asset: Assets = Object() as Assets;
    public minimumPrice: number = 0;
    public deadLine: Date = new Date(new Date().setDate(new Date().getDate() + 1)); // Tomorrow.
    public fiatCurrency: IFiatCurrency = new IFiatCurrency();
    public parts: {amount: number}[] = []

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { asset: Assets },
        private readonly dialogRef: MatDialogRef<SplitModalComponent>,
        private readonly customSnackbar: CustomSnackbarComponent,
        private readonly accountService: AccountService,
        private readonly assetsService: AssetService,
        private readonly translationConstants: TranslationConstants,
        private readonly keypressService: OnkeypressService,
        public readonly valueConverterService: ValueConverterService
    ) { }

    public ngOnInit(): void {
        this.dialogRef.addPanelClass(['custom-modal', 'resell-modal']);
        this.initData();
    }

    public getMainPhoto(asset: Assets): string | undefined {
        return this.assetsService.getAssetMainPhoto(asset);
    }

    public initData(): void {
        if (this.data?.asset) {
            this.fiatCurrency = this.accountService.getFiatCurrency();
            this.asset = new Assets(this.data.asset);
        } else {
            this.customSnackbar.open(this.translationConstants.translate('myAssets.modalAuction.snackbar.error'), SnackBarTheme.success, 4000);
            this.closeModal();
        }
    }

    public newParts(): void {
        this.parts = [];
        for(let i = 0; i < this.minimumPrice; i ++) {
            this.parts.push(Object.assign({}));
        }
    }

    public closeModal(): void {
        this.dialogRef.close();
    }

    public performTransaction(): void {
        this.loading = true;
        this.assetsService.createSplit(this.asset.nftId as any, this.parts).subscribe(success => {
            this.customSnackbar.open(this.translationConstants.translate('myAssets.modalSplit.snackbar.success'), SnackBarTheme.success, 4000);
            this.dialogRef.close(true);
        }, error => {
            this.customSnackbar.open(this.translationConstants.translate('myAssets.modalSplit.snackbar.error'), SnackBarTheme.error, 4000);
        }).add(() => {
            this.loading = false;
        });
    }

    public onKeyPressEvent(event: KeyboardEvent): void {
        this.keypressService.onlyAllowNumbers(event, false, 20);
    }
    
    public checkValue(): boolean {
        const value = this.minimumPrice;
        const valueOriginal = this.asset.price;

        let tempAmount = new BigNumber(0);
        for(let part of this.parts) {
            tempAmount = new BigNumber(part.amount).plus(tempAmount);
        }

        if (value > 0 && this.parts?.length >= 2 && new BigNumber(valueOriginal).isEqualTo(tempAmount)) {
            return false;
        } else {
            return true;
        }
    }
}