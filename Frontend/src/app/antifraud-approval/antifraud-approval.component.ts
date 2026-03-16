import { Component } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { RestEndpoint } from '../constants/rest-endpoint.constants';
import { finalize } from 'rxjs/operators';
import { SharedModule } from '../shared/shared.module';
import { CommonModule } from '@angular/common';

type ApprovalStatus = 'processing' | 'success' | 'pending' | 'expired' | 'error' | 'invalid';

@Component({
    selector: 'app-antifraud-approval',
    templateUrl: './antifraud-approval.component.html',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    styleUrls: ['./antifraud-approval.component.scss']
})
export class AntifraudApprovalComponent {
    public status: ApprovalStatus = 'processing';
    public messageKey: string = 'antifraudApproval.message.processing';
    public detail: string = '';
    public loading: boolean = true;

    constructor(
        private readonly activatedRoute: ActivatedRoute,
        private readonly http: HttpClient
    ) {}

    public ngOnInit(): void {
        const token = this.activatedRoute.snapshot.queryParamMap.get('token');
        if (!token) {
            this.loading = false;
            this.status = 'invalid';
            this.messageKey = 'antifraudApproval.message.invalid';
            return;
        }

        this.http
            .get(RestEndpoint.account.antifraudApprovalUser, {
                params: { token },
                observe: 'response'
            })
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
                next: (response: HttpResponse<any>) => {
                    this.handleResponse(response);
                },
                error: (error) => {
                    this.handleError(error);
                }
            });
    }

    private handleResponse(response: HttpResponse<any>): void {
        const body = response?.body || {};

        if (response.status === 200) {
            this.status = 'success';
            this.messageKey = 'antifraudApproval.message.success';
            this.detail = body?.message || '';
            return;
        }

        if (response.status === 202) {
            this.status = 'pending';
            this.messageKey = 'antifraudApproval.message.pending';
            this.detail = body?.message || '';
            return;
        }

        if (response.status === 410) {
            this.status = 'expired';
            this.messageKey = 'antifraudApproval.message.expired';
            this.detail = body?.message || '';
            return;
        }

        this.status = 'error';
        this.messageKey = 'antifraudApproval.message.error';
        this.detail = body?.message || '';
    }

    private handleError(error: any): void {
        const status = error?.status;
        const message = error?.error?.message;

        if (status === 202) {
            this.status = 'pending';
            this.messageKey = 'antifraudApproval.message.pending';
            this.detail = message || '';
            return;
        }

        if (status === 410) {
            this.status = 'expired';
            this.messageKey = 'antifraudApproval.message.expired';
            this.detail = message || '';
            return;
        }

        if (status === 400) {
            this.status = 'invalid';
            this.messageKey = 'antifraudApproval.message.invalid';
            this.detail = message || '';
            return;
        }

        this.status = 'error';
        this.messageKey = 'antifraudApproval.message.error';
        this.detail = message || '';
    }
}
