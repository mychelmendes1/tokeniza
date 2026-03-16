import { Component, HostListener } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import BigNumber from 'bignumber.js';
import { FinancialService } from '../shared/services/financial/financial';
import { TokensService } from '../shared/services/tokens/token.service';
import { Token } from '../shared/models/tokens';
import { ExternalPaymentModel, DepositMethodsEnum, ExternalDepositResponseModel } from '../shared/models/external-deposit.model';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ValueConverterService } from '../shared/services/util/value-converter.service';
import { IFiatCurrency } from '../shared/models/IFiatCurrency';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { BottomSheetComponent } from '../shared/bottom-sheet/bottom-sheet.component';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { OnkeypressService } from '../shared/services/util/onkeypress.service.ts.service';
import { AccountService } from '../shared/services/account/account.service';
import { TranslationConstants } from '../shared/services/util/translation.service';
import { CustomSnackbarComponent, SnackBarTheme } from '../shared/custom-snackbar/custom-snackbar.component';
import { DocumentValidationService } from '../shared/services/util/cpfCnpjValidate.service';
import { MenuButtonMobileComponent } from '../shared/components/menu-button-mobile/menu-button-mobile.component';
import { fadeIn } from '../shared/services/util/animations.service';
import { completeFullNameValidator } from '../shared/validators/fullname.validator';
import { FormControl, NgModel, ValidationErrors } from '@angular/forms';
import { emailValidator } from '../shared/validators/email-validator';
import { CpfCnpjValidator } from '../shared/validators/cpf-cnpj.validator.function';

@Component({
	selector: 'app-external-deposit',
	templateUrl: './external-deposit.component.html',
	styleUrls: ['./external-deposit.component.scss'],
	imports: [
		CommonModule,
		SharedModule,
		RouterModule,
		MenuButtonMobileComponent
	],
	animations: [fadeIn]
})
export class ExternalDepositComponent {
	public loading: boolean = false;
	public showErrorPage: boolean = false;
	public depositMethods: DepositMethodsEnum[] = [
		DepositMethodsEnum.TOKEN,
		DepositMethodsEnum.PIX
	];
	public depositMethodSelected: DepositMethodsEnum = DepositMethodsEnum.TOKEN; // Initiate as Token.
	public depositMethodsEnum: typeof DepositMethodsEnum = DepositMethodsEnum;
	public externalDepositData: ExternalPaymentModel = new ExternalPaymentModel();
	public valueFormatedToNumber: number = 0;
	public fiatCurrency: IFiatCurrency = Object() as IFiatCurrency;
	public tokens: Token[] = [];
	public externalDepositResp: ExternalDepositResponseModel | null = null;
	public isIdentifyInvalid: boolean = true;
	public valueFromParams: string = '';
	public disableAllOptions: boolean = false;
	public fiatValue: string = '';
	public qrCodeWith: number = 300;
	public selectedToken: Token | null = null;

	constructor(
		private readonly onKeyPressService: OnkeypressService,
		private readonly valueConverterService: ValueConverterService,
		private readonly clipboard: Clipboard,
		private readonly financialService: FinancialService,
		private readonly accountService: AccountService,
		private readonly tokensService: TokensService,
		private readonly translationConstants: TranslationConstants,
		private readonly snackbarComponent: CustomSnackbarComponent,
		private readonly documentValidationService: DocumentValidationService,
		private readonly activatedRoute: ActivatedRoute,
		private readonly bottomSheet: MatBottomSheet,
	) { }

	@HostListener('window:resize', ['$event'])
	public onResize(event: any) {
		if (window.innerWidth < 500) {
			this.qrCodeWith = 250;
		}
	}

	public ngOnInit(): void {
		this.fiatCurrency = this.accountService.getFiatCurrency();

		this.activatedRoute.params.subscribe(params => {
			this.externalDepositData.userId = params['userId'];
			this.valueFromParams = params['value'];

			if (this.valueFromParams) {
				this.externalDepositData.fiatAmount = new BigNumber(Number(this.valueFromParams) / 100);
				this.fiatValue = this.valueConverterService.toStringFormat(new BigNumber(this.externalDepositData?.fiatAmount));
				this.disableAllOptions = true;
			}
		});

		this.loading = true;
		this.tokensService.getTokens().subscribe(resp => {
			this.tokens = resp?.filter(tk => tk.network_id !== 'INTERNAL' && tk.network_id !== 'BITCOIN');
			
			if (this.externalDepositData.depositMethod) {
				this.selectedToken = this.tokens.find(t => t.id === this.externalDepositData?.depositMethod) as any;
			}
		}).add(() => {
			this.loading = false;
		});
	}

	public allowOnlyNumbers(event: any, maxSize: number = 0) {
		this.onKeyPressService.onlyAllowNumbers(event, true, maxSize);
	}

	public getValue(valueInString: Event): void {
		const input = valueInString.target as HTMLInputElement;
		const value = input.value as string;
		this.externalDepositData.fiatAmount = this.valueConverterService.fromStringFormatToBigNumber(value, 2);
	}

	public generateQrcode(): void {
		const sheetRef: MatBottomSheetRef = this.bottomSheet.open(BottomSheetComponent, {
			data: {
				text: this.translationConstants.translate('externalDeposit.confirmYourData'),
				declineOption: this.translationConstants.translate('snackbar.no'),
				confirmOption: this.translationConstants.translate('snackbar.ok'),
			}
		});
		sheetRef.afterDismissed().subscribe(action => {
			if (action) {
				this.loading = true;
				this.financialService.realizeExternalDeposit({
					...this.externalDepositData,
					depositMethod: this.selectedToken?.id || this.externalDepositData.depositMethod
				}).subscribe(resp => {
					if (resp) {
						this.externalDepositResp = resp;
						this.snackbarComponent.open(this.translationConstants.translate('externalDeposit.qrcodeGeneratedSuccessfuly'), SnackBarTheme.success, 5000);
					}
				}, error => {
					this.snackbarComponent.open(this.translationConstants.translate('externalDeposit.failedToGenerateQrcode'), SnackBarTheme.error, 3000);
				}).add(() => {
					this.loading = false;
				});
			}
		});
	}

	public confirmDeposit(): void {
		this.snackbarComponent.open(this.translationConstants.translate('externalDeposit.confirmDepositSuccess'), SnackBarTheme.success, 9000);

		setTimeout(() => {
			window.open('/account/login', '_self');
		}, 9000);

	}

	public shouldDisableGenerateButton(): boolean {
		if (
			!this.externalDepositData?.userId ||
			this.validateFullName() ||
			!this.externalDepositData?.name ||
			this.validateEmail() ||
			!this.externalDepositData?.email ||
			!this.externalDepositData?.fiatAmount ||
			!this.externalDepositData?.depositMethod ||
			this.externalDepositData.identify && this.validateCpf()
		) {
			return true;
		}

		return false;
	}

	/**
	 * When changing the deposit type, if it is not the PIX type, then the type
	 * must be the Token ID. Therefore, we set it to undefined and wait for the
	 * token to be selected to assign the ID.
	 * @param depositMethod 
	 */
	public changedDepositMethod(depositMethod: DepositMethodsEnum): void {
		if (depositMethod === DepositMethodsEnum.PIX) {
			this.externalDepositData.depositMethod = DepositMethodsEnum.PIX;
		} else {
			this.externalDepositData.depositMethod = undefined;
		}

		this.resetDepostMethod(depositMethod);
	}

	public resetDepostMethod(depositMethod?: DepositMethodsEnum): void {
		this.depositMethodSelected = depositMethod as DepositMethodsEnum;
		this.selectedToken = null;
		this.externalDepositResp = null;
	}

	public copyQrcodeUrl(): void {
		this.clipboard.copy(this.externalDepositResp?.depositAddress || '');
		this.snackbarComponent.open(this.translationConstants.translate('snackbar.copy'), SnackBarTheme.success, 3000);
	}

	public tokenChanged(tokenId: string): void {
		if (tokenId) {
			this.externalDepositData.depositMethod = tokenId;
		}

		this.externalDepositResp = null;
	}

	public validateFullName(model?: NgModel): boolean {
		const validatorFn: (control: FormControl) => ValidationErrors | null = completeFullNameValidator();
		const result: ValidationErrors | null = validatorFn({ value: this.externalDepositData.name } as FormControl);

		if (result) {
			if (result['completeFullNameError']) {
				model?.control.setErrors(result);
				return true;
			}
		}

		if (!this.externalDepositData.name?.trim()) {
			model?.reset(this.externalDepositData.name);
		}

		return false;
	}

	public validateEmail(model?: NgModel): boolean {
		const validatorFn: (control: FormControl) => ValidationErrors | null = emailValidator;
		const result: ValidationErrors | null = validatorFn({ value: this.externalDepositData.email } as FormControl);

		if (result) {
			if (result['emailError']) {
				model?.control.setErrors(result);
				return true;
			}
		}

		if (!this.externalDepositData.email?.trim()) {
			model?.reset(this.externalDepositData.email);
		}

		return false;
	}

	public validateCpf(model?: NgModel): boolean {
		const validatorFn: (control: FormControl) => ValidationErrors | null = CpfCnpjValidator.validatorFn();
		const result: ValidationErrors | null = validatorFn({ value: this.externalDepositData.identify } as FormControl);

		this.isIdentifyInvalid = !!result;

		if (result) {
			model?.control.setErrors(result);
			return true;
		}

		if (!this.externalDepositData.identify?.trim()) {
			model?.reset(this.externalDepositData.identify);
		}

		return false;
	}
}