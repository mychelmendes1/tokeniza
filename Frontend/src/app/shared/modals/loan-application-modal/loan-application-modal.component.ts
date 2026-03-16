import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { WithdrawModalComponent } from '../withdraw-modal/withdraw-modal.component';
import { usefulSettings } from '../../models/useful-settings.model';
import { AccountService } from '../../services/account/account.service';
import { MatRadioChange } from '@angular/material/radio';
import { fadeIn } from '../../services/util/animations.service';
import { WarningModalComponent } from '../warning-modal/warning-modal.component';
import { SimpleModalComponent } from '../simple-modal/simple-modal.component';

@Component({
    selector: 'app-loan-application-modal',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    templateUrl: './loan-application-modal.component.html',
    styleUrl: './loan-application-modal.component.scss',
    animations: [fadeIn]
})
export class LoanApplicationModalComponent {

    public usefulSettings: usefulSettings = new usefulSettings();
    public selectedLoan: string = '';
    public selectedGuarantee: string = '';
    public eLoanType: typeof ELoanType = ELoanType;
    public selectedCoin: string = '';
    public fee: number = 5;
    public loanLimit: number = 1000;
    public allCoins: Array<any> = [
        'tBRL',
        'TKNZ'
    ];
    public amountValue: string = '';
    public allLoanGuarantee: Array<any> = [
        'Golde Pass - Million Pass',
        'Golde Pass - Million Pass',
        'Golde Pass - Million Pass'
    ]

    constructor(
        public dialogRef: MatDialogRef<WithdrawModalComponent>,
        private readonly accountService: AccountService,
        private readonly dialog: MatDialog
    ) { }

    public ngOnInit(): void {
        this.dialogRef.disableClose = true;
        this.dialogRef.addPanelClass(['custom-modal', 'loan-application-modal']);

        this.usefulSettings = {
            fiatCurrency: this.accountService.getFiatCurrency()
        }
    }

    public onRadioGroupChange(event: MatRadioChange): void {
        this.selectedLoan = event?.value;
        this.selectedCoin = '';
        this.amountValue = '';
        this.selectedGuarantee = '';
    }

    public enableButton(): boolean {
        if (this.selectedLoan === ELoanType.LOAN) {
            if (this.selectedCoin && this.amountValue) {
                return true;
            }
        } else {
            if (this.selectedCoin && this.selectedGuarantee && this.amountValue) {
                return true;
            }
        }

        return false;
    }

    public close(): void {
        this.dialogRef.close();
    }

    public openWarningModal(): void {
        const dialogRef: MatDialogRef<WarningModalComponent> = this.dialog.open(WarningModalComponent, {
            data: {
                title: 'Confirmação de Aplicação',
                subtitle: 'Você está prestes a solicitar uma aplicação. Revise os detalhes antes de prosseguir. Caso cancele antes do prazo, haverá aplicação de multa.',
                confirmBtn: 'Confirmar aplicação'
            }
        });

        this.close();

        dialogRef.afterClosed().subscribe((action: boolean) => {
            if (action) {
                this.openSimpleModal();
            }
        });
    }

    public openSimpleModal(): void {
        const dialogRef: MatDialogRef<SimpleModalComponent> = this.dialog.open(SimpleModalComponent, {
            data: {
                title: 'Aplicação realizada com sucesso!',
                subtitle: 'Seu saldo foi atualizado e os detalhes da operação poder ser visualizados em seu extrato.',
            }
        });
    }
}

export enum ELoanType {
    LOAN = 'loan',
    BORROW = 'borrow'
}