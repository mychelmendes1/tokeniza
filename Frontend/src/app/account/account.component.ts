import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AppService } from '../app.service';

@Component({
    selector: 'app-account',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule,
    ],
    templateUrl: './account.component.html',
    styleUrl: './account.component.scss'
})
export class AccountComponent {

    public loadImage: boolean = false;
    public isMobileSubscription: Subscription = new Subscription;
    public isMobile: boolean = false;

    constructor(
        private readonly router: Router,
        private readonly appService: AppService,
    ) {
        this.isMobileSubscription = this.appService.getIsMobile().subscribe(isMobile => {
            this.isMobile = isMobile;
        });
    }

    public goHome(): void {
        this.router.navigate(['/home']);
    }
}