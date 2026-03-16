import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { RouterModule } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { AccountService } from '../../services/account/account.service';
import { UserLoggedModel } from '../../models/user.logged.model';
import { CustomSnackbarComponent, SnackBarTheme } from '../../custom-snackbar/custom-snackbar.component';
import { TranslationConstants } from '../../services/util/translation.service';
import { environment } from '../../../../environments/environments';

@Component({
    selector: 'app-remove-account-modal',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    templateUrl: './remove-account-modal.component.html',
    styleUrl: './remove-account-modal.component.scss'
})
export class RemoveAccountModalComponent {

    public text: string = '';
    public loading: boolean = false;
    public user: UserLoggedModel = new UserLoggedModel();
    public answer: string = '';
    public firstAnswer: string = '';

    constructor(
        public dialogRef: MatDialogRef<RemoveAccountModalComponent>,
        private accountService: AccountService,
        private readonly customSnackbarComponent: CustomSnackbarComponent,
        private readonly translationConstants: TranslationConstants,
    ) { }

    public ngOnInit(): void {
        this.dialogRef.disableClose = true;
        this.dialogRef.addPanelClass(['custom-modal', 'remove-account-modal']);

        this.loading = true;
        this.accountService.getLoggedUserDetails().subscribe(user => {
            this.user = user;
        }).add(() => {
            this.loading = false;
        });

        this.text = this.translationConstants.translate('cancellation.firstQuestion').replace('###project###', environment.projectName);
        this.answer = this.translationConstants.translate('cancellation.answer').replace('###project###', environment.projectName);
    }

    public sendNotification(): void {
        this.loading = true;
        this.accountService.sendNotification({
            name: this.user?.name || this.user?.firstName,
            contact: '',
            observation: this.buildMessage,
            emailFrom: this.user?.email,
            emailTo: this.user?.email,
            product: '',
            period: '',
            subject: 'Remover conta'
        }).subscribe((success: any) => {
            this.customSnackbarComponent.open(this.translationConstants.translate('snackbar.notification'), SnackBarTheme.success, 3000);
            this.firstAnswer = '';
            this.close();
        }, error => {
            this.customSnackbarComponent.open(this.translationConstants.translate('snackbar.error'), SnackBarTheme.error, 3000);
        }).add(() => {
            this.loading = false;
        });
    }

    public close(dismiss?: boolean): void {
        this.dialogRef.close(dismiss);
    }

    public get buildMessage(): string {
        return this.firstAnswer;
    }
}