import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { AccountService } from '../../services/account/account.service';
import { DiditSessionRequest, DiditSessionResponse } from '../../models/didit-session.model';

import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomSnackbarComponent, SnackBarTheme } from '../../custom-snackbar/custom-snackbar.component';

@Component({
    selector: 'app-didit-kyc-modal',
    templateUrl: './didit-kyc-modal.component.html',
    styleUrls: ['./didit-kyc-modal.component.scss'],
    imports: [
        CommonModule,
        TranslateModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule
    ],
    standalone: true
})
export class DiditKycModalComponent implements OnInit, OnDestroy {
    public loading: boolean = true;
    public error: boolean = false;
    public diditVerificationUrl: string = '';
    public diditVerificationUrlSafe!: SafeResourceUrl;
    public sessionId: string = '';
    public showIframe: boolean = false;
    public showAnalysisStatus: boolean = false;
    public sessionStatus: string = '';
    private messageListener: ((event: MessageEvent) => void) | null = null;
    private user: any;

    constructor(
        public readonly dialogRef: MatDialogRef<DiditKycModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private readonly accountService: AccountService,
        private readonly sanitizer: DomSanitizer,
        private readonly customSnackbar: CustomSnackbarComponent,
        private readonly translate: TranslateService
    ) {
        this.user = data?.user;
    }

    /**
     * Check if user has already seen the approved KYC modal
     * This prevents showing the modal multiple times for approved users
     */
    public static hasUserSeenApprovedModal(userEmail: string): boolean {
        return localStorage.getItem(`didit_approved_seen_${userEmail}`) === 'true';
    }

    /**
     * Clear the "approved seen" flag for a user
     * Useful if user needs to re-verify or for testing
     */
    public static clearApprovedSeenFlag(userEmail: string): void {
        localStorage.removeItem(`didit_approved_seen_${userEmail}`);
    }

    public ngOnInit(): void {
        this.createDiditSession();
    }

    public ngOnDestroy(): void {
        // Clean up event listener
        if (this.messageListener) {
            window.removeEventListener('message', this.messageListener);
        }
    }

    /**
     * Creates a Didit session for the logged user
     */
    private createDiditSession(): void {
        this.loading = true;
        this.error = false;

        const user = this.user;
        if (!user) {
             // Fallback if not provided in data, though it should be
             this.accountService.getLoggedUserDetails().subscribe({
                next: (u: any) => {
                    this.user = u;
                    this.proceedWithSessionCreation(u);
                },
                error: (error: any) => {
                    console.error('Error getting user details:', error);
                    this.handleError('Failed to get user information');
                }
             });
        } else {
            this.proceedWithSessionCreation(user);
        }
    }

    private proceedWithSessionCreation(user: any): void {
        // Construct fullname from firstName and lastName
        const fullname = user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.username;

        const userData: DiditSessionRequest = {
            email: user.email || 'temp@example.com',
            fullname: fullname,
            cpf: user.cpf,
            cnpj: user.cnpj
        };

        // Create Didit session
        this.accountService.createDiditSession(userData).subscribe({
            next: (response: DiditSessionResponse) => {
                // Check if this is an existing session (user already completed verification)
                if (response?.existingSession === true) {
                    this.sessionId = response.session_id;
                    this.sessionStatus = response.sessionStatus || 'pending';

                    // If already approved, close modal immediately and mark as seen
                    if (this.sessionStatus === 'approved') {
                        // Mark that user has seen the approved status
                        localStorage.setItem(`didit_approved_seen_${user.email}`, 'true');

                        this.showToast(
                            this.translate.instant('didit.verification.alreadyApproved'),
                            'success'
                        );

                        // Close modal immediately for approved users
                        setTimeout(() => {
                            this.dialogRef.close({ completed: true, alreadyApproved: true });
                        }, 1000);
                        return;
                    }

                    // For non-approved statuses (pending, rejected), show the status
                    this.showAnalysisStatus = true;
                    this.showIframe = false;
                    this.loading = false;
                    return;
                }

                // New session - show iframe
                if (response?.verification_url && response?.session_id) {
                    this.diditVerificationUrl = response.verification_url;
                    this.sessionId = response.session_id;

                    // Sanitize URL for security
                    this.diditVerificationUrlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(
                        response.verification_url
                    );

                    this.showIframe = true;
                    this.showAnalysisStatus = false;
                    this.setupDiditListeners();
                    this.loading = false;
                } else {
                    this.handleError('Invalid response from Didit');
                }
            },
            error: (error: any) => {
                console.error('Error creating Didit session:', error);
                this.handleError(error?.error?.message || 'Failed to create verification session');
            }
        });
    }

    /**
     * Setup event listeners for Didit iframe postMessage events
     */
    private setupDiditListeners(): void {
        this.messageListener = (event: MessageEvent) => {
            // Validate origin
            if (!this.diditVerificationUrl || event.origin !== new URL(this.diditVerificationUrl).origin) {
                return;
            }

            // Handle Didit events
            if (event.data.type === 'didit:complete') {
                this.onDiditComplete(event.data);
            } else if (event.data.type === 'didit:error') {
                this.onDiditError(event.data);
            } else if (event.data.type === 'didit:cancel') {
                this.onDiditCancel(event.data);
            }
        };

        window.addEventListener('message', this.messageListener);
    }

    /**
     * Handle Didit completion event
     */
    private onDiditComplete(data: any): void {
        console.log('Didit verification completed:', data);

        this.showToast(
            this.translate.instant('didit.verification.completed'),
            'success'
        );

        // Close modal after a short delay
        setTimeout(() => {
            this.dialogRef.close({ completed: true, sessionId: this.sessionId });
        }, 2000);
    }

    /**
     * Handle Didit error event
     */
    private onDiditError(data: any): void {
        console.error('Didit verification error:', data);

        this.showToast(
            this.translate.instant('didit.verification.error'),
            'danger'
        );
    }

    /**
     * Handle Didit cancel event
     */
    private onDiditCancel(data: any): void {
        console.log('Didit verification cancelled:', data);
        this.close();
    }

    /**
     * Handle errors during session creation
     */
    private handleError(message: string): void {
        this.loading = false;
        this.error = true;

        this.showToast(
            message || this.translate.instant('didit.verification.sessionError'),
            'danger'
        );
    }

    /**
     * Show toast message
     */
    private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success'): Promise<void> {
        let theme = SnackBarTheme.success;
        if (color === 'danger') theme = SnackBarTheme.error;
        if (color === 'warning') theme = SnackBarTheme.default;

        this.customSnackbar.open(message, theme);
    }

    /**
     * Close the modal
     */
    public close(): void {
        this.dialogRef.close({ completed: false });
    }

    /**
     * Retry creating the Didit session
     */
    public retry(): void {
        this.createDiditSession();
    }
}
