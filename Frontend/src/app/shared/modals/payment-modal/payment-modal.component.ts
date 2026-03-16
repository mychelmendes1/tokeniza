import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environments';
import { CheckoutObject } from '../../models/payment-checkout.model';
import { IFiatCurrency } from '../../models/IFiatCurrency';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { OnkeypressService } from '../../services/util/onkeypress.service.ts.service';
import { AccountService } from '../../services/account/account.service';
import { TokensService } from '../../services/tokens/token.service';
import { FeaturesStatusService } from '../../services/util/features-status.service';
import { ValueConverterService } from '../../services/util/value-converter.service';
import { TranslationConstants } from '../../services/util/translation.service';
import BigNumber from 'bignumber.js';
import { Assets } from '../../models/IAssets.model';
import { FeatureNames } from '../../models/feature-names.enum';
import { BottomSheetComponent } from '../../bottom-sheet/bottom-sheet.component';
import { PaymentCheckoutComponent } from '../../components/payment-checkout/payment-checkout.component';

@Component({
    selector: 'app-payment-modal',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule,
        PaymentCheckoutComponent
    ],
    templateUrl: './payment-modal.component.html',
    styleUrl: './payment-modal.component.scss'
})
export class PaymentModalComponent {

    public checkoutObject: CheckoutObject = Object() as CheckoutObject;
    public waitingMetaMaskOutput: boolean = false;
    public amountToPay: string = '';
    public external_id: string = '';
    public minToBuy: number = 0;
    public maxToBuy: number = 0;
    public showExternal: boolean = false;
    public listenChanges: number = 0;
    public fiatCurrency: IFiatCurrency = new IFiatCurrency();
    public currency: string = '';
    public loading: boolean = false;
    public checkout_text: string = '';
    public isLogged: boolean = true;
    public email: string = '';

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        private readonly dialogRef: MatDialogRef<PaymentModalComponent>,
        private readonly bottomSheet: MatBottomSheet,
        private readonly keypressService: OnkeypressService,
        private readonly accountService: AccountService,
        private readonly tokenService: TokensService,
        private readonly featureService: FeaturesStatusService,
        public readonly valueConverterService: ValueConverterService,
        private readonly translationConstants: TranslationConstants
    ) { }

    public ngOnInit(): void {
        this.loading = true;
        this.dialogRef.addPanelClass(['custom-modal', 'payment-modal']);
        this.dialogRef.disableClose = true;
        this.getData();
        this.fiatCurrency = this.accountService.getFiatCurrency();
        this.loading = false;
    }

    public getData(): void {
        if (this.data) {
            this.checkoutObject = {
                data: { ...this.data },
                quantity: new BigNumber(1),
                paymentTypes: this.data.payment_types,
                price: this.data instanceof Assets ? new BigNumber(this.data.getCorrectPrice()) : new BigNumber(this.data.price)
            }

            if(this.data?.collection?.priceCurrency) {
                this.currency = this.data.collection.priceCurrency;

                this.tokenService.getTokenById(this.currency).subscribe(token => {
                    this.checkout_text = token?.checkout_text as string;
                });
            } else {
                this.currency = this.fiatCurrency.currency;
            }

            this.accountService.isAuthenticated(false, false).subscribe(isAuthenticated => {
                if(!isAuthenticated) {
                    this.isLogged = false;
                }
            });

            this.minToBuy = this.data?.minimumToBuy || undefined;
            this.maxToBuy = this.data?.maxToBuy || undefined;

            this.featureService.getFeatureStatus(FeatureNames.NFT_EXTERNAL_PURCHASE).subscribe(showExternal => {
                this.showExternal = showExternal;
            });
        } else {
            this.close();
            return;
        }
    }

    public close(): void {
        if(this.waitingMetaMaskOutput){
            const sheetRef: any =  this.bottomSheet.open(BottomSheetComponent, {
                data: {
                    text: this.translationConstants.translate('paymentModal.closeWarning'),
                    declineOption: this.translationConstants.translate('snackbar.no'),
                    confirmOption: this.translationConstants.translate('snackbar.confirm'),
                }
            });
            sheetRef.afterDismissed().subscribe((action: any) => {
                if (action) {
                    // It's necessary to can call MetaMask if the user try again
                    window.location.reload();
                }
            });
            return;
        }
        this.dialogRef.close();
    }

    public allowOnlyNumbers(event: KeyboardEvent): void {
        this.keypressService.onlyAllowNumbers(event, false, 20);
    }

    public sendToCheckoutExternalId(event: Event): void {
        const inputElement: HTMLInputElement = event.target as HTMLInputElement;
        if (inputElement) {
            this.checkoutObject.external_id = inputElement.value;
            this.listenChanges += 1;
        }
    }

    public sendToCheckoutEmail(event: Event): void {
        const inputElement: HTMLInputElement = event.target as HTMLInputElement;
        if (inputElement) {
            this.checkoutObject.email = inputElement.value;
            this.listenChanges += 1;
        }
    }

    public sendToCheckout(event: Event): void {
        const inputElement: HTMLInputElement = event.target as HTMLInputElement;
        if (inputElement) {
            let price = this.valueConverterService.fromStringFormatToBigNumber(inputElement.value, environment.decimalsPlacesBought);
            this.checkoutObject.price = price;
            this.checkoutObject.data.price = price;
            this.listenChanges += 1;
        }
    }
}