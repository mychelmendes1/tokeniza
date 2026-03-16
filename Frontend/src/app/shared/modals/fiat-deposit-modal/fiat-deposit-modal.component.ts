import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { RouterModule } from '@angular/router';
import { ITransferDetails } from '../../models/ITransferDetails';
import { EDepositPaymentType } from '../../models/deposit.model';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import BigNumber from 'bignumber.js';
import { CustomSnackbarComponent, SnackBarTheme } from '../../custom-snackbar/custom-snackbar.component';
import { TranslationConstants } from '../../services/util/translation.service';
import { FileService } from '../../services/file/file.service';
import { ConfigReaderService } from '../../services/util/config.reader.service';
import { FILE_TYPES_TO_UPLOAD, getFileTypesForHtml } from '../../../constants/file-types-accepted.constants';
import { Clipboard } from '@angular/cdk/clipboard';
import { DepositsService } from '../../services/account/deposits.service';
import { MatTabChangeEvent } from '@angular/material/tabs';

@Component({
    selector: 'app-fiat-deposit-modal',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    templateUrl: './fiat-deposit-modal.component.html',
    styleUrl: './fiat-deposit-modal.component.scss'
})
export class FiatDepositModalComponent {

    public loading: boolean = false;
    public amount: string = '0';
    public coin_amount: number = 0;
    public unitOfMoney: string = '';
    public elementType: string = 'url';
    public transferProofFile: string = '';
    public transferProofFileTED: string = '';
    public transferProofFilePix: string = '';
    public apiOffline: boolean = false;
    public transferDetails: ITransferDetails = new ITransferDetails();
    public filesSizeError: boolean = false;
    public filesSize: number = 0;
    public maxSize = 10000000; // 10MB;
    public paymentTypeSelected: EDepositPaymentType | undefined = undefined;
    public depositType: typeof EDepositPaymentType = EDepositPaymentType;
    public sectionPaymentType: Array<EDepositPaymentType> = [];
    public documentTypeError: boolean = false;
    public loadingDocuments: boolean = false;
    public cancelDuplicatedTransaction: boolean = false;
    public isNftBuy: boolean = false;
    public assetId: string = '';
    public packageId: string = '';
    public external_id: string = '';
    public nftId: string = '';
    public requestProof: boolean = true;
    public user_email: string = '';

    constructor(
        @Inject(MAT_DIALOG_DATA) private readonly data: {
            amount: BigNumber,
            unitOfMoney: string,
            coin_amount: BigNumber,
            isNftBuy: boolean,
            assetId: string,
            user_email: string,
            packageId: string,
            external_id: string,
            nftId: string
        },
        private readonly dialogRef: MatDialogRef<FiatDepositModalComponent>,
        private readonly customSnackbar: CustomSnackbarComponent,
        private readonly translationConstants: TranslationConstants,
        private readonly fileService: FileService,
        private readonly depositsServices: DepositsService,
        private readonly configReaderService: ConfigReaderService,
        private readonly clipboard: Clipboard
    ) {}

    public ngOnInit(): void {
        this.loading = true;
        this.buildSectionButtons();
        this.configReaderService.getTransferDetails().subscribe(transferDetails => {
            let found: boolean = false;

            if (transferDetails?.coins) {
                let coinDetails = transferDetails?.coins.find((coin: any) => coin.unit_of_money === this.data.unitOfMoney);
                if(coinDetails) {
                    this.transferDetails = coinDetails;
                    found = true;
                }
            }
            this.requestProof = transferDetails?.requestProof as boolean;

            if(!found) {
                this.transferDetails = transferDetails || new ITransferDetails();
            }
        }, error => {
            this.apiOffline = true;
            this.customSnackbar.open(this.translationConstants.translate(`snackbar.systemUnavailable`), SnackBarTheme.error, 4000);
        }).add(() => {
            this.loading = false;
        });

        this.amount = new BigNumber(this.data?.amount).toFixed(2);
        this.coin_amount = new BigNumber(this.data?.coin_amount).toNumber();
        this.unitOfMoney = this.data?.unitOfMoney;
        this.isNftBuy = this.data?.isNftBuy;
        this.external_id = this.data?.external_id;
        this.user_email = this.data?.user_email;
        this.assetId = this.data?.assetId;
        this.packageId = this.data?.packageId;
        this.nftId = this.data?.nftId;
        this.paymentTypeSelected = this.sectionPaymentType.find(paymentType => paymentType === EDepositPaymentType.TED);
        this.dialogRef.addPanelClass(['custom-modal', 'fiat-deposit-modal']);
    }

    public buildSectionButtons(): void {
        let sections: Array<EDepositPaymentType> = [
            EDepositPaymentType.TED,
            EDepositPaymentType.PIX
        ];

        this.sectionPaymentType = sections;
    }

    public confirm(): void {
        if (this.cancelDuplicatedTransaction) {
            return;
        }
        this.loading = true;
        this.cancelDuplicatedTransaction = true;

        this.depositsServices.createDeposit({
            amount: new BigNumber(this.amount), 
            coin_amount: this.coin_amount, 
            unitOfMoney: this.unitOfMoney, 
            transferProofFile: this.paymentTypeSelected === this.depositType.TED ? this.transferProofFileTED : this.transferProofFilePix,
            depositType: this.paymentTypeSelected as EDepositPaymentType,
            external_id: this.external_id,
            userEmail: this.user_email,
            isNftBuy: this.isNftBuy,
            assetId: this.assetId,
            packageId: this.packageId,
            nftId: this.nftId
        }).subscribe((success: any) => {
            this.customSnackbar.open(this.translationConstants.translate('fiatModal.successMessage'), SnackBarTheme.success, 10000);
            this.dialogRef.close(true);
        }, (error: any) => {
            this.customSnackbar.open(this.translationConstants.translate('fiatModal.errorMessage'), SnackBarTheme.error, 2000);
        }).add(() => {
            this.loading = false;
        });
    }

    public verifyConfirm(): boolean {
        if (
            (this.paymentTypeSelected === this.depositType.TED && (!this.transferProofFileTED && this.requestProof)) || 
            (this.paymentTypeSelected === this.depositType.PIX && (!this.transferProofFilePix && this.requestProof)) || 
            this.loading || 
            this.apiOffline || 
            this.documentTypeError || 
            this.loadingDocuments
        ) {
            return true;
        } else {
            return false;
        }
    }

    public clearDocuments(): void {
        this.transferProofFile = ''; // Clear the input to be able to choose the same file
        this.transferProofFileTED = '';
        this.transferProofFilePix = '';
    }

    public addNewFile(event: Event): void {
        const input: HTMLInputElement = event.target as HTMLInputElement;
        if (input.files?.length) {
            this.mapDocuments(input.files);
        }
    }

    // Check type of "documents"
    public mapDocuments(files: FileList): void {
        this.loadingDocuments = true;
        this.filesSizeError = false;
        this.documentTypeError = false;
        for (let i = 0; i < files.length; i++) {
            this.filesSize = files[i].size;
            const file: File = files[i];
            const documentType: string = file.type;
            this.filesSizeError = this.filesSize > this.maxSize; // in MB
            this.documentTypeError = !this.acceptDocumentType(documentType);

            // It should not proceed if there is an error with the size or type of document
            if (this.filesSizeError || this.documentTypeError) {
                this.clearDocuments();
                this.loadingDocuments = false;
                return;
            }

            const reader: FileReader = new FileReader();
            const normFileName: string = this.fileService.normalizeFileName(file.name);
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                this.fileService.uploadFile({
                    file: (event.target)?.result as string,
                    name: normFileName
                }).subscribe(data => {
                    if (this.paymentTypeSelected === this.depositType.TED) {
                        this.transferProofFileTED = data?.value;
                    } else {
                        this.transferProofFilePix = data?.value;
                    }
                }, (error: any) => {
                    this.customSnackbar.open(this.translationConstants.translate('snackbar.docUploadError'), SnackBarTheme.error, 4000);
                }).add(() => {
                    this.loadingDocuments = false;
                });
            };
        }
    }

    public acceptDocumentType(documentType: string): boolean {
        return FILE_TYPES_TO_UPLOAD.includes(documentType);
    }

    public getFileTypes(): string {
        return getFileTypesForHtml();
    }

    public copyPixKey(): void {
        this.clipboard.copy(this.transferDetails?.pix_key as string);
        this.customSnackbar.open(this.translationConstants.translate('fiatModal.copiedPixKey'), SnackBarTheme.success, 4000);
    }

    public close(): void {
        this.dialogRef.close();
    }

    public receiptDocumentName(): string {
        let docNameAux: Array<string> | undefined = undefined;
        if (this.paymentTypeSelected === this.depositType.TED) {
            docNameAux = this.transferProofFileTED?.split('/');
        } else {
            docNameAux = this.transferProofFilePix?.split('/');
        }
        const docName: string = docNameAux ? docNameAux[docNameAux.length -1] : '';

        if (!docName || this.documentTypeError || this.loadingDocuments) {
            return 'fiatModal.noFileChosen';
        }
        return docName;
    }

    public onSelectedTabProjectChange(tab: MatTabChangeEvent) {
        this.paymentTypeSelected = tab.tab.textLabel as EDepositPaymentType;
    }
}