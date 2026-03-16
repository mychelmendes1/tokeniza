import { Component, Inject, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SharedModule } from '../../shared.module';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { IFiatCurrency } from '../../models/IFiatCurrency';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { AccountService } from '../../services/account/account.service';
import { TranslationConstants } from '../../services/util/translation.service';
import { CustomSnackbarComponent, SnackBarTheme } from '../../custom-snackbar/custom-snackbar.component';
import { ConfigReaderService } from '../../services/util/config.reader.service';
import { combineLatest } from 'rxjs';
import { UserLoggedModel } from '../../models/user.logged.model';
import { IProjectCrowdfunding } from '../../models/IProjectCrowdfunding.model';
import { Token } from '../../models/tokens';
import { PaymentTypeOption } from '../../models/payment-type-option.model';
import { AmountConvertedResult } from '../../models/amount-converted-result';
import { PlatformBalance } from '../../models/wallet.balance';
import { TokensService } from '../../services/tokens/token.service';
import { CrowdfundingService } from '../../services/crowdfunding/crowdfunding.service';
import { ICrowfundingBankingAccount } from '../../models/crowdfunding-banking-account';
import { TaxItemType } from '../../models/tax-item-type.enum';
import BigNumber from 'bignumber.js';
import { showErrorForInputs } from '../../validators/form-group.validators';
import { v4 as uuid4 } from 'uuid';
import { Clipboard } from '@angular/cdk/clipboard';
import { HoverIconClassService } from '../../services/util/hover-icon-class.service';
import { PixelService } from '../../services/util/pixel.service';

@Component({
    selector: 'app-crowdfunding-checkout-modal',
    imports: [
        SharedModule,
        RouterModule,
        CommonModule
    ],
    templateUrl: './crowdfunding-checkout-modal.component.html',
    styleUrl: './crowdfunding-checkout-modal.component.scss'
})
export class CrowdfundingCheckoutModalComponent {

    @ViewChild('stepper', { static: false }) public stepper!: MatStepper;
    public formInvestment: FormGroup<IFormInvestment> = new FormGroup<IFormInvestment>({
        amount: new FormControl<number | null>(null, { validators: [Validators.required, this.minContributionValidator()] }),
        coupon: new FormControl<string>('')
    });

    public formContracts: FormGroup<IFormContracts> = new FormGroup<IFormContracts>({
        accept: new FormControl<boolean>(false, { validators: [Validators.required] }),
    });

    public formPayment: FormGroup<IFormPayment> = new FormGroup<IFormPayment>({
        methods: new FormControl<string>('', { validators: [Validators.required] }),
    });

    public loading: boolean = false;
    public fiatCurrency: IFiatCurrency = Object() as IFiatCurrency;
    public option: string = '';
    public checkoutId: string = '';
    public loadingRequest: boolean = false;
    public elementType: string = 'url';
    public QRWidth: number = 205;
    public codeInvalid: boolean = false;
    public location: any;
    public user: UserLoggedModel = Object() as UserLoggedModel;
    public totalReturn: number = 0;
    public profitability: number = 0;
    public quantityTokens: number = 0;
    public project: IProjectCrowdfunding = Object() as IProjectCrowdfunding;
    public signed: boolean = false;
    public helpLink: string = '';
    public qrCodeId: string = '';
    public bankList: ICrowfundingBankingAccount[] = [];
    public tokens: Token[] = [];
    public options: Array<PaymentTypeOption> = [];
    private quotes: Array<AmountConvertedResult> = [];
    private balances: Array<PlatformBalance> = [];
    public enablePaymentButton: boolean = false;
    public progressBarWidth: number = 0;
    public currentStepperIndex: number = 0;
    public selectedPaymentMethod: string = 'PIX';
    public availablePaymentMethods: Array<{value: string, label: string}> = [];

    constructor(
        public dialogRef: MatDialogRef<CrowdfundingCheckoutModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { id: string, pendingPaymentId: string | null } = { id: '', pendingPaymentId: '' },
        private readonly accountService: AccountService,
        private readonly router: Router,
        private readonly clipboard: Clipboard,
        private readonly tokensService: TokensService,
        private readonly translationConstants: TranslationConstants,
        private readonly customSnackbar: CustomSnackbarComponent,
        private readonly pixel: PixelService,
        private readonly configService: ConfigReaderService,
        private readonly crowdfundingService: CrowdfundingService,
        public hoverIconClassService: HoverIconClassService,
    ) { }

    public ngOnInit(): void {
        if (!this.data) {
            this.dialogRef.close();
        }
        this.dialogRef.disableClose = true;
        this.dialogRef.addPanelClass(['custom-modal', 'crowdfunding-checkout-modal']);
        this.initData();
    }

    public ngAfterViewInit(): void {
        this.stepper.selectionChange.subscribe(stepper => {
            this.currentStepperIndex = stepper.selectedIndex;
            const matStepLength: number = this.stepper.steps.length;
            this.progressBarWidth = (stepper.selectedIndex * 100) / (matStepLength - 1);
        });

        if (this.data.pendingPaymentId) {
            setTimeout(() => {
                this.stepper.selectedIndex = 1;
            });
        }
    }

    public close(dismiss: boolean = false): void {
        this.dialogRef.close(dismiss);
    }

    public initData(): void {
        const id: string | null = this.data.id;
        this.formContracts.get('accept')?.setValue(true);

        this.loading = true;
        if (this.data.pendingPaymentId) {
            combineLatest([
                this.crowdfundingService.getCrowdfunding((id as string)),
                this.crowdfundingService.getAllUserOders(),
                this.crowdfundingService.getAllCrowdfundingBanking((id as string))
            ]).subscribe(([project, orders, banks]) => {
                this.project = project;
                const pendingPaymentAmount: number = orders?.find((order) => order.id === this.data.pendingPaymentId)?.amount || 0;
                this.formInvestment.patchValue({ amount: pendingPaymentAmount });
                this.bankList = banks || [];
                this.initializePaymentMethods();
            }).add(() => { 
                this.loadBalances();
            });
        } else {
            combineLatest([
                this.crowdfundingService.getCrowdfunding((id as string)),
                this.crowdfundingService.getAllCrowdfundingBanking((id as string)),
            ]).subscribe(([project, banks]) => {
                this.project = project;
                if (this.project) {
                    if (this.project?.moneyReceived != null && this.project?.targetCapture != null) {
                        const percentage = (Number(this.project.moneyReceived) / Number(this.project.targetCapture)) * 100;
                        this.project.targetAmountPercentage = Math.min(percentage, 100); // Limita a 100%
                    } else {
                        this.project.targetAmountPercentage = 0;
                    }                    
                    this.project.minimumCapturePercentage = (((this.project.moneyReceived as any) / (this.project.minimumCapture as any)) * 100) || 0;
                    if (this.formInvestment && this.project?.minimumContribution != null) {
                        this.formInvestment.get('amount')?.setValue(this.project.minimumContribution);
                    }

                    this.totalReturn = this.calcROI(this.project?.minimumContribution, Number(this.project?.deadline), this.project?.scenarioInfo?.base?.profitabilityTIR as number);
                    this.quantityTokens = this.quantityTokensCalc(this.project?.minimumContribution, this.project?.tokenValue as number);
                }
                this.bankList = banks || [];
                this.initializePaymentMethods();
            }).add(() => {
                this.loadBalances();
            });

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    this.location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        IPv4: position.coords.heading
                    }
                });
            }
        }

        this.accountService.isAuthenticated(false, false).subscribe(authenticated => {
            if (authenticated) {
                this.accountService.getLoggedUserDetails().subscribe(userDetails => {
                    this.user = userDetails;
                });
            }
        })

        this.configService.getContactDetails().subscribe(links => {
            this.helpLink = links.tawkTo as string;
        });

        this.getData();
    }

    public loadBalances(): void {
        if (this.project.crypto) {
            combineLatest([
                this.tokensService.getTokens(),
                this.accountService.allQuotations(),
                this.accountService.allBalances(),
            ]).subscribe(([tokens, quotes, balances]) => {
                    this.tokens = tokens?.filter(token => token.usedToPay);
                    this.quotes = quotes || [] as any;
                    this.balances = balances || [] as any;

                    this.definePaymentMethod();
                }, error => {
            }).add(() => {
                this.loading = false;
            });
        } else {
            this.loading = false;
        }
    }

    public definePaymentMethod(): void {
        let quotes = this.quotes;
        let balances = this.balances;
        this.options = [];
        for (let payment of this.tokens) {
            const quote = quotes?.find(quote => payment.id === quote.currency);
            const balance = balances?.find(blc => blc.unitOfMoney === payment.id);
            let quotationFiat: BigNumber | undefined = this.project?.isDolar ? quote?.amountUsd : quote?.amount;
            let purchasePrice: BigNumber = new BigNumber(0);
            let maxPaymentValue: BigNumber = new BigNumber(0);
            let enoughBalance: boolean = false;
            const hasSomeBalance: boolean = Number(balance?.balance) > 0;
            const token = this.tokens.find(tkn => tkn.id === payment.id);
            let unitValue = new BigNumber(1).dividedBy(new BigNumber((quotationFiat as any)).decimalPlaces(6, BigNumber.ROUND_FLOOR)).toNumber();

            if (hasSomeBalance) {
                purchasePrice = new BigNumber((this.formInvestment.value.amount) as number).multipliedBy(new BigNumber(1));
                if (new BigNumber((balance?.balance) as any).isGreaterThanOrEqualTo(new BigNumber(unitValue).multipliedBy((this.formInvestment.value.amount) as number).toNumber())) {
                    enoughBalance = true;
                } else {
                    enoughBalance = false;
                }
            }

            let originalValue = new BigNumber(unitValue).multipliedBy((this.formInvestment.value.amount) as number).toNumber();

            let tax: BigNumber | undefined = undefined;
            if ((token?.nft_buy_tax as any) > 0) {
                tax = this.calculateTaxValue(new BigNumber(originalValue), new BigNumber((token?.nft_buy_tax) as any), token?.tax_type as any, new BigNumber((quote?.amountUsd) as any));

                if (new BigNumber(tax).isGreaterThan(new BigNumber(0)) && token?.tax_type !== 'A') {
                    originalValue = new BigNumber(originalValue).plus(tax).toNumber();
                }
            }

            this.checkPaymentMethod(payment.id, true, originalValue, enoughBalance, true, false, false, tax ? new BigNumber(tax).toNumber() : 0, quotationFiat);
        }

        this.options = this.options.sort((first, second) => {
            if (!first.isSplitted && second.isSplitted) {
                return -1;
            }
            if (first.isSplitted && !second.isSplitted) {
                return 1;
            }

            if (first.isSplitted && second.isSplitted) {
                return 0;
            }

            return 0;
        });
    }

    public calculateTaxValue(requestedValueToTransfer: BigNumber, taxAmount: BigNumber, taxType: string, dollarQuote: BigNumber): BigNumber {
        if (taxType === TaxItemType.Percentage) {
            const taxPercentage: BigNumber = new BigNumber(taxAmount).dividedBy(100);
            return new BigNumber(requestedValueToTransfer).multipliedBy(taxPercentage);
        }

        /**
         * If the type isn't 'Percentage', it needs be 'Absolute'.
         * It's necessary to return a tax value in token.
         */
        if (taxType === TaxItemType.Absolute && dollarQuote.isGreaterThan(0)) {
            return new BigNumber(taxAmount).multipliedBy(dollarQuote);
        }

        return new BigNumber(0);
    }

    public minContributionValidator() {
        return (control: AbstractControl) => {
            const amount: number = control.value;
            const minimumContribution: number = this.project?.minimumContribution || 0;
            if (amount < minimumContribution) {
                return { minContributionError: true };
            }
            return null;
        };
    }

    public getData(): void {
        this.fiatCurrency = this.accountService.getFiatCurrency();
    }

    public checkPaymentMethod(name: string, accept: boolean, value: number, enoughBalance: boolean,
        showMissingBalance: boolean, isMandatory: boolean, isSplitted: boolean, tax: number, quote: any): void {

        if (accept) {
            if(enoughBalance === true){
                this.options.push({
                    name: name,
                    value: value, // If is tokens, we need multiply
                    allowed: enoughBalance,
                    // To show missing balance message if user doesn't have balance for this type of payment
                    showMissingBalance: !enoughBalance,
                    quote: quote,
                    isMandatory: isMandatory,
                    isSplitted: isSplitted,
                    showTax: tax > 0,
                    taxValue: tax as any
                    });
            }
        }
    }

    public goForward(): void {
        if (this.project.contract) {
            this.stepper.next();
        } else {
            this.stepper.next();

            this.loading = true;
            this.crowdfundingService.createCrowdfundingCheckoutOrder({
                id: uuid4(),
                user_id: undefined,
                project_id: this.project.id,
                amount: this.formInvestment.value.amount as number,
                created_at: new Date(),
                last_update: new Date(),
                status: 'CREATED',
                was_paid: false
            }).subscribe((id: any) => {
                if (id) {
                    this.checkoutId = id["body"]["id"];
                    this.qrCodeId = id["body"]["pix_qrcode"]
                }
            }).add(() => {
                this.loading = false;
            });
        }
    }

    public signContract(): void {
        let latitude: number = 0;
        let longitude: number = 0;

        this.loading = true;
        this.crowdfundingService.updateUserAcceptedTerms({
            id: uuid4(),
            user_id: undefined,
            project_id: this.project.id,
            accepted_when: new Date().toString(),
            term_accepted: this.project.contract as string,
            created_at: new Date(),
            last_update: new Date(),
            ip: this.location?.IPv4 || '1',
            latitude: this.location?.latitude || '1',
            longitude: this.location?.longitude || '1'
        }).subscribe(dt => {
            this.stepper.next();
            this.crowdfundingService.createCrowdfundingCheckoutOrder({
                id: uuid4(),
                user_id: undefined,
                project_id: this.project.id,
                amount: Number(this.formInvestment.value.amount),
                created_at: new Date(),
                last_update: new Date(),
                status: 'CREATED',
                was_paid: false
            }).subscribe(id => {
                if (id) {
                    this.checkoutId = (id as any)["body"]["id"];
                    this.qrCodeId = (id as any)["body"]["pix_qrcode"]
                }
            }).add(() => {
                this.loading = false;
            })
        });
    }

    public calcROI(investmentValue: any, months: number, tax: number): number {
        let returnOnInvestment = (investmentValue * (Number(String(tax).replace(',', '.')) / 100));

        this.profitability = returnOnInvestment;
        if (this.project.crypto) {
            this.definePaymentMethod();
        }
        return Number(investmentValue) + Number(returnOnInvestment);
    }

    public quantityTokensCalc(moneyAmount: number, tokenPrice: number) {
        return moneyAmount / tokenPrice;
    }

    public changeAmount(newValue: any): void {
        let availableAmount = Number(this.project?.targetCapture) - Number(this.project?.moneyReceived);
        newValue = Number(newValue);
        if (newValue >= this.project?.minimumContribution && availableAmount <= availableAmount) {
            this.totalReturn = this.calcROI(newValue, Number(this.project?.scenarioInfo?.base?.deadline), this.project?.scenarioInfo?.base?.profitabilityTIR as number);
            this.quantityTokens = this.quantityTokensCalc(newValue, this.project?.tokenValue as number);
        } else {
            this.totalReturn = 0;
            this.quantityTokens = 0;
            this.profitability = 0;
        }
    }

    public toggleAdd(name: string, enableButton: boolean): void {
        this.option = name
        this.enablePaymentButton = true;
    }

    public checkout() {
        let info = this.options.find(opt => opt.name === this.option);

        const amountBn = new BigNumber((info?.value) as any).minus(info?.taxValue || 0);
        const taxValue = info?.taxValue ?? 0;

        this.loadingRequest = true;
        this.crowdfundingService.performPaymentWithCrypto({
            userId: undefined,
            amount: amountBn.toNumber(),
            tax: Number(taxValue),
            checkoutId: this.checkoutId,
            unitOfMoney: info?.name
        }).subscribe((success: any) => {
            if (success) {
                this.customSnackbar.open(this.translationConstants.translate('crowdfunding.success'), SnackBarTheme.success, 6000);
                this.close(true);
                setTimeout(() => {
                    this.router.navigate(['/crowdfunding']);
                }, 6000);
                this.pixel.trackPurchase({
                    name: info?.name as string,  // Item SKUs
                    value: amountBn.toNumber()
                });
            }
        }, (error: any) => {
            if (error) {
                const message = this.getPaymentErrorMessage(error);
                this.customSnackbar.open(message, SnackBarTheme.error, 5000);
            }
        }).add(() => {
            this.loadingRequest = false;
        });
    }

    /**
     * Builds a user-friendly error message for performPaymentWithCrypto failures.
     * Uses backend message when available; otherwise suggests amount/validation issues.
     */
    private getPaymentErrorMessage(error: any): string {
        const backendMessage = error?.error?.message ?? error?.error?.error ?? (typeof error?.error === 'string' ? error.error : null);
        if (backendMessage && typeof backendMessage === 'string' && backendMessage.trim().length > 0) {
            return backendMessage.trim();
        }
        const status = error?.status;
        if (status === 400 || status === 422) {
            return this.translationConstants.translate('crowdfunding.error.amount');
        }
        return this.translationConstants.translate('crowdfunding.error');
    }

    public showError(formName: string, form: FormGroup): boolean {
        return showErrorForInputs(formName, form);
    }

    public translateHeaderText(): { title: string } {
        if (this.currentStepperIndex === 0) {
            return {
                title: 'crowdfunding.checkout.modal.title1',
            }
        } else if (this.currentStepperIndex === 1) {
            return {
                title: 'crowdfunding.checkout.modal.title2',
            }
        } else {
            return {
                title: 'crowdfunding.checkout.modal.title3',
            }
        }
    }

    public openContract() {
        window.open(this.project?.contract, '_blank');
    }

    public copyPublicWallet(key: string | undefined): void {
        this.clipboard.copy(key as string);
        this.customSnackbar.open(this.translationConstants.translate('snackbar.keyCopied'), SnackBarTheme.success, 3000);
    }

    public openCrowdfundingPayments() {
        this.router.navigate(['/wallet']);
        this.dialogRef.close();
    }

    public callToSpecialist() {
        window.open(this.helpLink, '_blank');
    }

    public initializePaymentMethods(): void {
        this.availablePaymentMethods = [];
        
        if (this.project?.pix && this.bankList.length > 0) {
            this.availablePaymentMethods.push({ value: 'PIX', label: 'crowdfunding.checkout.payment.bank.pix' });
        }
        
        if (this.project?.ted && this.bankList.length > 0) {
            this.availablePaymentMethods.push({ value: 'TED', label: 'crowdfunding.checkout.payment.bank.tedOrDoc' });
        }
        
        if (this.project?.crypto) {
            this.availablePaymentMethods.push({ value: 'CRYPTO', label: 'Cripto' });
        }

        // Define PIX como padrão se disponível, senão usa o primeiro método disponível
        if (this.availablePaymentMethods.length > 0) {
            const pixMethod = this.availablePaymentMethods.find(m => m.value === 'PIX');
            this.selectedPaymentMethod = pixMethod ? 'PIX' : this.availablePaymentMethods[0].value;
            this.formPayment.get('methods')?.setValue(this.selectedPaymentMethod);
        }
    }

    public onPaymentMethodChange(method: string): void {
        this.selectedPaymentMethod = method;
        this.formPayment.get('methods')?.setValue(method);
    }

    public getCurrentBank(): ICrowfundingBankingAccount | undefined {
        return this.bankList.length > 0 ? this.bankList[0] : undefined;
    }
}

interface IFormInvestment {
    amount: FormControl<number | null>;
    coupon?: FormControl<string | null>;
}

interface IFormContracts {
    accept: FormControl<boolean | null>;
}

interface IFormPayment {
    methods: FormControl<string | null>;
}