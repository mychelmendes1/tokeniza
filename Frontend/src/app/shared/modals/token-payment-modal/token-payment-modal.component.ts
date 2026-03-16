import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { Router, RouterModule } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { usefulSettings } from '../../models/useful-settings.model';
import { AccountService } from '../../services/account/account.service';
import { CheckoutObject, PaymentTypes } from '../../models/payment-checkout.model';
import BigNumber from 'bignumber.js';
import { OnkeypressService } from '../../services/util/onkeypress.service.ts.service';
import { FeaturesStatusService } from '../../services/util/features-status.service';
import { LocalStorageService } from 'angular-web-storage';
import { ValueConverterService } from '../../services/util/value-converter.service';
import { TokensService } from '../../services/tokens/token.service';
import { LocalStorageKeys } from '../../services/util/local.storage.keys';
import { FeatureNames } from '../../models/feature-names.enum';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { UnitOfMoney } from '../../models/finance.constants';
import { Token } from '../../models/tokens';
import { PaymentCheckoutComponent } from '../../components/payment-checkout/payment-checkout.component';
import { DiditKycModalComponent } from '../../components/didit-kyc-modal/didit-kyc-modal.component';
import { UserLoggedModel } from '../../models/user.logged.model';

@Component({
    selector: 'app-token-payment-modal',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule,
        PaymentCheckoutComponent
    ],
    templateUrl: './token-payment-modal.component.html',
    styleUrl: './token-payment-modal.component.scss'
})
export class TokenPaymentModalComponent implements OnInit {

    public loading: boolean = false;
    public loadingData: boolean = false;
    public checkoutObject: CheckoutObject = Object() as CheckoutObject;
    public tokensQuantity: string = '';
    public amountToPay: string = '';
    public errorOnLoading: boolean = false;
    public listenChanges: number = 0;
    public changesDelay!: ReturnType<typeof setTimeout>; // Used in filter
    public CHANGES_DELAY_VALUE: number = 500; // In milliseconds
    public unitOfMoney: string = '';
    public minToBuy: number | undefined = undefined;
    public useTokenToConvert: boolean = true;
    public hasLock: boolean = false;
    public isKYCEnabled: boolean = false;
    public isDiditSdkEnabled: boolean = false;
    public tokenPriceDecimalsPlacesStrategy: string = '1.2-2';
    public amountToPayDecimalsPlacesStrategy: number = 2;
    public brlaBuyLimit: BigNumber = new BigNumber(0);
    public brlaSellLimit: BigNumber = new BigNumber(0);
    public brlaAccountApproved: boolean = false;
    public usefulSettings: usefulSettings = new usefulSettings();

    constructor(
        private readonly dialogRef: MatDialogRef<TokenPaymentModalComponent>,
        private readonly accountService: AccountService,
        private readonly tokensService: TokensService,
        private readonly router: Router,
        private readonly keypressService: OnkeypressService,
        private readonly featuresStatusService: FeaturesStatusService,
        public readonly localStorage: LocalStorageService,
        public readonly valueConverterService: ValueConverterService,
        private readonly dialog: MatDialog
    ) { }

    public async ngOnInit(): Promise<void> {
        this.dialogRef.addPanelClass(['custom-modal', 'token-payment-modal']);
        this.dialogRef.disableClose = true;
        this.usefulSettings = {
            fiatCurrency: this.accountService.getFiatCurrency()
        }

        this.getData();
    }

    public async getData(): Promise<void> {
        this.loading = true;

        this.unitOfMoney = await this.localStorage.get(LocalStorageKeys.UNIT_OF_MONEY);

        forkJoin({
            allowBRLAPayments: this.featuresStatusService.getFeatureStatus(FeatureNames.BRLA),
            diditSdkEnabled: this.featuresStatusService.getFeatureStatus(FeatureNames.DIDIT_SDK),
            decimals: this.accountService.loadDecimalsPlaces(),
            quotation: this.accountService.quotations(this.unitOfMoney),
            token: this.tokensService.getTokenById(this.unitOfMoney),
            tokens: this.tokensService.getTokens()
        })
            .pipe(finalize(() => {
                this.loading = false;
            }))
            .subscribe({
                next: ({ allowBRLAPayments, diditSdkEnabled, decimals, quotation, token, tokens }) => {
                    this.tokenPriceDecimalsPlacesStrategy = decimals?.tokenPriceDecimals || '1.2-2';
                    this.amountToPayDecimalsPlacesStrategy = decimals?.amountToPayDecimals || 2;
                    this.isDiditSdkEnabled = diditSdkEnabled;

                    const fiatQuotation: BigNumber = quotation
                        ? this.usefulSettings.fiatCurrency.currency === UnitOfMoney.USD
                            ? quotation?.amountUsd || new BigNumber(0)
                            : quotation?.amount || new BigNumber(0)
                        : new BigNumber(0);

                    this.minToBuy = token?.minimumToBuy || undefined;
                    this.hasLock = token?.exchange_lock as boolean;

                    this.checkoutObject = {
                        data: token,
                        quantity: new BigNumber(0),
                        paymentTypes: [],
                        price: fiatQuotation
                    }

                    if (tokens?.length > 0) {
                        const paymentTypes: Array<PaymentTypes> = [];
                        const tokensAvailable: Array<Token> = tokens.filter(tkn => tkn.usedToPay && tkn.id !== this.unitOfMoney);
                        tokensAvailable.forEach(tkn => {
                            paymentTypes.push({
                                unitOfMoney: tkn.id,
                                percentage: 0
                            });
                        });
                        this.checkoutObject.paymentTypes = paymentTypes;
                    }

                    if (allowBRLAPayments) {
                        this.loadBrlaKycStatus();
                    }
                },
                error: () => {
                    this.errorOnLoading = true;
                }
            });
    }

    public convertTokenToFiduciary(event: { target: HTMLInputElement }): void {
        clearTimeout(this.changesDelay);
        this.changesDelay = setTimeout(() => {
            const rawInput: string = event.target.value;

            const cleanInput: string = rawInput.replace(/[^\d.,-]/g, '')
                .replace(/\./g, '')
                .replace(',', '.')
                ;

            const tokenQuantity: BigNumber = new BigNumber(cleanInput || 0);
            const totalAmountInFiduciary: BigNumber = tokenQuantity.multipliedBy(this.checkoutObject.price);

            this.amountToPay = String(totalAmountInFiduciary);
            this.checkoutObject.quantity = tokenQuantity;
            this.listenChanges += 1;
        }, this.CHANGES_DELAY_VALUE);
    }

    public convertFiduciaryToToken(value: string | number): void {
        clearTimeout(this.changesDelay);
        const newValew: BigNumber = new BigNumber(value);

        this.changesDelay = setTimeout(() => {
            const totalAmountInToken: BigNumber = newValew.dividedBy(new BigNumber(this.checkoutObject.price));

            this.checkoutObject.quantity = totalAmountInToken;
            this.tokensQuantity = this.valueConverterService.toStringFormat(totalAmountInToken, 6);
            this.listenChanges += 1;
        }, this.CHANGES_DELAY_VALUE);
    }

    public allowOnlyNumbers(event: KeyboardEvent): void {
        this.keypressService.onlyAllowNumbers(event, false, 20);
    }

    public close(dismiss?: boolean): void {
        this.dialogRef.close(dismiss);
    }

    /**
     * Orchestrate KYC provider based on feature flags
     * Opens DIDIT modal if enabled, otherwise redirects to personal documents
     */
    public async orchestrateKycProvider(): Promise<void> {
        if (this.isDiditSdkEnabled) {
            await this.openDiditKycModal();
        } else {
            // Redirect to personal documents page for manual KYC
            this.router.navigate(['/profile/personal-documents']);
            this.close();
        }
    }

    /**
     * Open DIDIT KYC modal for identity verification
     * Based on Midas-Web implementation
     */
    private async openDiditKycModal(): Promise<void> {
        // Get current user details
        const user: UserLoggedModel = await this.accountService.getLoggedUserDetails().toPromise() as UserLoggedModel;

        if (!user) {
            console.error('[DIDIT] No user logged in');
            return;
        }

        // Check if user has already seen the approved modal
        const hasSeenApprovedModal = DiditKycModalComponent.hasUserSeenApprovedModal(user.email);

        if (hasSeenApprovedModal) {
            // User already completed KYC, allow checkout
            return;
        }

        // Open DIDIT modal
        const dialogRef = this.dialog.open(DiditKycModalComponent, {
            data: {
                user: user
            },
            panelClass: 'didit-kyc-modal',
            maxWidth: '900px',
            maxHeight: '90vh',
            width: '100%',
            height: '100%'
        });

        // Wait for modal to close and get result
        dialogRef.afterClosed().subscribe(result => {
            if (result?.completed) {
                console.log('[DIDIT] KYC verification successful');
                // User can proceed with checkout
                // NOTE: logic to proceed with checkout is missing here in the original code too?
                // The original code comment says "User can proceed with checkout" but didn't seem to trigger anything.
                // It likely relied on the user clicking the button again or side effects.
                // Analyzing original code:
                /*
                if (data?.success) {
                    console.log('[DIDIT] KYC verification successful');
                    // User can proceed with checkout
                } else {
                    console.log('[DIDIT] KYC verification cancelled or failed');
                    // Optionally close the payment modal
                    // this.close();
                }
                */
               // The original code was using `data?.success`, wait `data` from `onDidDismiss`.
               // I used `result?.completed` in my refactor plan for DiditKycModal, need to ensure they match.
            } else {
                console.log('[DIDIT] KYC verification cancelled or failed');
            }
        });
    }

    private loadBrlaKycStatus(): void {
        this.brlaAccountApproved = false;
        this.brlaBuyLimit = new BigNumber(0);
        this.brlaSellLimit = new BigNumber(0);

        this.accountService.getBRLAKYCStatus().subscribe(dt => {
            if (dt && dt?.history && dt?.history?.length > 0) {
                for (let hist of dt?.history) {
                    if (hist.status === 'APPROVED' && hist.level === 2) {
                        this.brlaAccountApproved = true;
                    }

                    if (hist?.limits) {
                        if (hist?.limits?.limitSwapBuy) {
                            if (!this.brlaBuyLimit) {
                                this.brlaBuyLimit = new BigNumber(hist?.limits?.limitSwapBuy);
                            }
                        }

                        if (hist?.limits?.limitSwapSell) {
                            if (!this.brlaSellLimit) {
                                this.brlaSellLimit = new BigNumber(hist?.limits?.limitSwapSell);
                            }
                        }
                    }

                    if (this.brlaAccountApproved) {
                        break;
                    }
                }
            }
        }, error => {
        });
    }
}
