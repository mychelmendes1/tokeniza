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
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { showErrorForInputs } from '../../validators/form-group.validators';
import { emailValidator } from '../../validators/email-validator';

@Component({
    selector: 'app-resell-modal',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    templateUrl: './resell-modal.component.html',
    styleUrl: './resell-modal.component.scss'
})
export class ResellModalComponent {

    public loading: boolean = false;
    public asset: Assets = Object() as Assets;
    public resaleValue: string = '';
    public isEditing: boolean = false;
    public fiatCurrency: IFiatCurrency = new IFiatCurrency();
    public formResell: FormGroup<IFormResell> = new FormGroup<IFormResell>({
        email: new FormControl(''),
    });

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { asset: Assets, isEditing: boolean },
        private readonly dialogRef: MatDialogRef<ResellModalComponent>,
        private readonly customSnackbar: CustomSnackbarComponent,
        private readonly accountService: AccountService,
        private readonly assetsService: AssetService,
        private readonly translationConstants: TranslationConstants,
        private readonly keypressService: OnkeypressService,
        public readonly valueConverterService: ValueConverterService
    ) { 
        this.formResell.get('email')?.valueChanges.subscribe(value => {
            if (value && value.trim() !== '') {
                this.formResell.get('email')?.setValidators([Validators.required, emailValidator]);
            } else {
                this.formResell.get('email')?.clearValidators();
            }
            this.formResell.get('email')?.updateValueAndValidity();
        });
    }

    public ngOnInit(): void {
        this.dialogRef.addPanelClass(['custom-modal', 'resell-modal']);
        this.initData();
    }

    public getMainPhoto(asset: Assets): string | undefined {
        return this.assetsService.getAssetMainPhoto(asset);
    }

    public initData(): void {
        if (this.data) {
            this.fiatCurrency = this.accountService.getFiatCurrency();
            this.asset = new Assets(this.data.asset);
            this.resaleValue = new BigNumber(this.asset.getCorrectPrice()).toFixed(2);
            this.isEditing = this.data.isEditing;
        }
    }

    public closeModal(): void {
        this.dialogRef.close();
    }

    public closeResell(): void {
        this.performTransaction(new BigNumber(0), 'myAssets.modalResell.snackbar.resaleClosed', 'myAssets.modalResell.snackbar.resaleClosedError');
    }

    public resellAsset(): void {
        const valueToResell: BigNumber = this.valueConverterService.handlingMonetaryAmount(String(this.resaleValue));
        this.performTransaction(valueToResell, 'myAssets.modalResell.snackbar.nftOnResale', 'myAssets.modalResell.snackbar.nftOnResaleError');
    }

    public saveChange(): void {
        const valueToResell = this.valueConverterService.handlingMonetaryAmount(String(this.resaleValue));
        this.performTransaction(valueToResell, 'myAssets.modalResell.snackbar.successChanged', 'myAssets.modalResell.snackbar.changeError');
    }

    public performTransaction(valueToResell: BigNumber, sucessMessage: string, errorMessage: string): void {
        this.loading = true;
        this.assetsService.resellAsset({nftId: this.asset.nftId as string, resellValue: valueToResell, only_for_customer: this.formResell.value.email as string}).subscribe(success => {
            if (success){
                this.customSnackbar.open(this.translationConstants.translate(sucessMessage), SnackBarTheme.success, 4000);
            }else{
                this.customSnackbar.open(this.translationConstants.translate(errorMessage), SnackBarTheme.success, 4000);
            }
        }, (error: any) => {
            if (error) {
                this.customSnackbar.open(this.translationConstants.translate(errorMessage), SnackBarTheme.error, 4000);
            }
        }).add(() => {
            this.dialogRef.close(true);
            this.loading = false;
        });
    }

    public onKeyPressEvent(event: KeyboardEvent): void {
        this.keypressService.onlyAllowNumbers(event, false, 20);
    }

    public checkValue(): boolean {
        if (!this.resaleValue) {
            return true;
        }

        const value: BigNumber = this.valueConverterService.handlingMonetaryAmount(String(this.resaleValue));

        if (!value || value.isNaN() || value.isLessThanOrEqualTo(0)) {
            return true;
        }

        if (value.isGreaterThan(0)) {
            return false;
        } else {
            return true;
        }
    }

    public showError(formName: string, form: FormGroup): boolean {
        return showErrorForInputs(formName, form);
    }
}

interface IFormResell {
    email: FormControl<string | null>;
}