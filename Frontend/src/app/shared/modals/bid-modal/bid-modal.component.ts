import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { RouterModule } from '@angular/router';
import { IFiatCurrency } from '../../models/IFiatCurrency';
import BigNumber from 'bignumber.js';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CustomSnackbarComponent, SnackBarTheme } from '../../custom-snackbar/custom-snackbar.component';
import { AccountService } from '../../services/account/account.service';
import { AssetService } from '../../services/asset/asset.service';
import { OnkeypressService } from '../../services/util/onkeypress.service.ts.service';
import { ValueConverterService } from '../../services/util/value-converter.service';
import { TranslationConstants } from '../../services/util/translation.service';

@Component({
    selector: 'app-bid-modal',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    templateUrl: './bid-modal.component.html',
    styleUrl: './bid-modal.component.scss'
})
export class BidModalComponent implements OnInit {

    public loading: boolean = false;
    public asset: any;
    public price: string = '';
    public unitOfMoney: string = '';
    public fiatCurrency: IFiatCurrency = new IFiatCurrency();
    public currentValue: BigNumber = new BigNumber(0);

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        private readonly dialogRef: MatDialogRef<BidModalComponent>,
        private readonly customSnackbar: CustomSnackbarComponent,
        private readonly accountService: AccountService,
        private readonly assetService: AssetService,
        private readonly keypressService: OnkeypressService,
        public readonly valueConverterService: ValueConverterService,
        private readonly translationConstants: TranslationConstants
    ) { }

    public ngOnInit(): void {
        this.dialogRef.addPanelClass(['custom-modal', 'bid-modal']);
        this.initData();
    }

    public initData(): void {
        this.dialogRef.disableClose = true;
        if (this.data) {
            this.asset = this.data;
            this.fiatCurrency = this.accountService.getFiatCurrency();
            this.currentValue = new BigNumber(this.data?.auction?.bids[0]?.price || 0);
        } else {
            this.closeModal();
        }
    }

    public closeModal(): void {
        this.dialogRef.close();
    }

    public getMainPhoto(asset: any): string {
        return this.assetService.getAssetMainPhoto(asset) as string;
    }

    public performTransaction(): void {
        this.loading = true;
        this.assetService.createBid(this.asset?.auction?.id, this.valueConverterService.handlingMonetaryAmount(String(this.price)), this.unitOfMoney).subscribe(success => {
            if (success) {
                this.customSnackbar.open(this.translationConstants.translate('productDetails.bidModal.snackbar.success'), SnackBarTheme.success, 4000);
            } else {
                this.customSnackbar.open(this.translationConstants.translate('productDetails.bidModal.snackbar.error'), SnackBarTheme.success, 4000);
            }
        }, error => {
            if (error?.error?.message.includes("User doesnt have enough balance!")) {
                this.customSnackbar.open(this.translationConstants.translate("snackbar.insufficientBalance"), SnackBarTheme.error, 4000);
            } else {
                this.customSnackbar.open(this.translationConstants.translate('productDetails.bidModal.snackbar.error'), SnackBarTheme.error, 4000);
            }
        }).add(() => {
            this.loading = false;
            this.dialogRef.close(true);
        });
    }

    public onKeyPressEvent(event: KeyboardEvent): void {
        this.keypressService.onlyAllowNumbers(event, false, 20);
    }

    public checkValue(): boolean {
        if (!this.price || !this.unitOfMoney) {
            return true;
        }

        const value: BigNumber = this.valueConverterService.handlingMonetaryAmount(String(this.price));

        if (value.isNaN() || value.isLessThanOrEqualTo(0)) {
            return true;
        }

        const currentValue: BigNumber = new BigNumber(this.currentValue || 0);

        return value.isLessThanOrEqualTo(currentValue);
    }
}