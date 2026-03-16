import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SharedModule } from '../../shared.module';
import { Router, RouterModule } from '@angular/router';
import { SimpleModalComponent } from '../simple-modal/simple-modal.component';
import { CustomSnackbarComponent, SnackBarTheme } from '../../custom-snackbar/custom-snackbar.component';
import { TranslationConstants } from '../../services/util/translation.service';
import { EViewMode } from '../../models/view-mode.enum';
import { AssetService } from '../../services/asset/asset.service';

@Component({
    selector: 'app-redeem-reward-modal',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    templateUrl: './redeem-reward-modal.component.html',
    styleUrl: './redeem-reward-modal.component.scss'
})
export class RedeemRewardModalComponent {

    public redeemCode: string = '';
    public loading: boolean = false;

    constructor(
        public dialogRef: MatDialogRef<RedeemRewardModalComponent>,
        private readonly dialog: MatDialog,
        private readonly customSnackbar: CustomSnackbarComponent,
        private readonly translationConstants: TranslationConstants,
        private router: Router,
        private assetService: AssetService
    ) { }

    public ngOnInit(): void {
        this.dialogRef.disableClose = true;
        this.dialogRef.addPanelClass(['custom-modal', 'redeem-reward-modal']);
    }

    public close(): void {
        this.dialogRef.close();
    }

    public openSimpleModal(): void {
        const dialogRef: MatDialogRef<SimpleModalComponent> = this.dialog.open(SimpleModalComponent, {
            data: {
                title: 'redeem.reward.modal.title',
                subtitle: 'redeem.reward.modal.subtitle',
                icon: 'assets/images/check-container.svg',
                autoClosingTime: 8000
            }
        });

        dialogRef.afterClosed().subscribe((action: boolean) => {
            if (action) {
                this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                    this.router.navigate(['/wallet'], { queryParams: { selectedTab: 1, selectedView: EViewMode.GRID, scrollCards: true } });
                });
            }
        });
    }

    public redeem(): void {
        this.loading = true;
        this.assetService.redeemReward(this.redeemCode.trim()).subscribe(resp => {
            this.openSimpleModal();
            this.close();
        }, error => {
            let snackbarMessage: string = '';

            if (error.error?.message?.includes('Reward not found')) {
                snackbarMessage = this.translationConstants.translate('redeemRewardModal.snackbar.rewardNotFound');
            } else if (error.error?.message?.includes('Reward already redeemed')) {
                snackbarMessage = this.translationConstants.translate('redeemRewardModal.snackbar.rewardAlreadyRedeemed');
            } else if (error.error?.message?.includes('Reward disabled')) {
                snackbarMessage = this.translationConstants.translate('redeemRewardModal.snackbar.rewardDisabled');
            } else if (error.error?.message?.includes('Redemption period expired')) {
                snackbarMessage = this.translationConstants.translate('redeemRewardModal.snackbar.redemptionPeriodExpired');
            } else {
                snackbarMessage = this.translationConstants.translate('redeemRewardModal.snackbar.failedToRedeemReward');
            }

            this.customSnackbar.open(snackbarMessage, SnackBarTheme.error, 4000);
            this.loading = false;
        }).add(() => this.loading = false);
    }
}