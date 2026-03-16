import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { RouterModule } from '@angular/router';
import { Assets } from '../../models/IAssets.model';
import { IFiatCurrency } from '../../models/IFiatCurrency';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CustomSnackbarComponent, SnackBarTheme } from '../../custom-snackbar/custom-snackbar.component';
import { AssetService } from '../../services/asset/asset.service';
import { OnkeypressService } from '../../services/util/onkeypress.service.ts.service';
import { TranslationConstants } from '../../services/util/translation.service';
import { AccountService } from '../../services/account/account.service';
import { ValueConverterService } from '../../services/util/value-converter.service';
import BigNumber from 'bignumber.js';

@Component({
    selector: 'app-auction-modal',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    templateUrl: './auction-modal.component.html',
    styleUrl: './auction-modal.component.scss'
})
export class AuctionModalComponent implements OnInit {

    public loading: boolean = false;
    public asset: Assets = Object() as Assets;
    public minimumPrice: string = '';
    public deadLine: Date = new Date(new Date().setDate(new Date().getDate() + 1)); // Tomorrow.
    public fiatCurrency: IFiatCurrency = new IFiatCurrency();

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        private readonly dialogRef: MatDialogRef<AuctionModalComponent>,
        private readonly customSnackbar: CustomSnackbarComponent,
        private readonly accountService: AccountService,
        private readonly assetService: AssetService,
        private readonly keypressService: OnkeypressService,
        public readonly valueConverterService: ValueConverterService,
        private readonly translationConstants: TranslationConstants
    ) { }

    public ngOnInit(): void {
        this.dialogRef.addPanelClass(['custom-modal', 'auction-modal']);
        this.initData();
    }

    public initData(): void {
        this.dialogRef.disableClose = true;
        if (this.data) {
            this.asset = this.data;
            this.fiatCurrency = this.accountService.getFiatCurrency();
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
        this.deadLine.setHours(0, 0, 0, 0); // To use the initial time of the day.

        this.assetService.createAuction(this.asset.nftId as string, this.valueConverterService.handlingMonetaryAmount(String(this.minimumPrice)), this.deadLine).subscribe(success => {
            if (success) {
                this.customSnackbar.open(this.translationConstants.translate('myAssets.modalAuction.snackbar.success'), SnackBarTheme.success, 4000);
            } else {
                this.customSnackbar.open(this.translationConstants.translate('myAssets.modalAuction.snackbar.error'), SnackBarTheme.success, 4000);
            }
        }, error => {
            this.customSnackbar.open(this.translationConstants.translate('myAssets.modalAuction.snackbar.error'), SnackBarTheme.error, 4000);
        }).add(() => {
            this.loading = false;
            this.dialogRef.close(true);
        });
    }

    public onKeyPressEvent(event: any): void {
        this.keypressService.onlyAllowNumbers(event, false, 20);
    }

    public checkValue(): boolean {
        if (!this.minimumPrice || !this.deadLine) {
            return true;
        }

        const value: BigNumber = this.valueConverterService.handlingMonetaryAmount(String(this.minimumPrice));

        if (!value || value.isNaN() || value.isLessThanOrEqualTo(0)) {
            return true;
        }

        if (value.isGreaterThan(0) && this.deadLine) {
            return false;
        } else {
            return true;
        }
    }

    public dateFilter = (date: Date | null): boolean => {
        const today: Date = new Date();
        today.setHours(0, 0, 0, 0);
        return date ? date > today : false;
    }
}