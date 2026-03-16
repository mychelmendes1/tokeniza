import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { Subscription } from 'rxjs';
import { AppService } from '../../../app.service';
import { NgEventBus } from 'ng-event-bus';

@Component({
    selector: 'app-menu-button-mobile',
    imports: [
        CommonModule,
        SharedModule
    ],
    templateUrl: './menu-button-mobile.component.html',
    styleUrl: './menu-button-mobile.component.scss'
})
export class MenuButtonMobileComponent {

    @Input() public colorIcon: string = 'svg-icon primary-light';
    public isMobile: boolean = false;
    public isMobileSubscription!: Subscription;

    constructor(
        private eventBus: NgEventBus,
        private readonly appService: AppService
    ) {
        this.appService.getIsMobile().subscribe(isMobile => {
            this.isMobile = isMobile;
        });
    }

    public openSidenav(): void {
        this.eventBus.cast('appBarMenuButtonClickedEvent');
    }

    public ngOnDestroy(): void {
        this.isMobileSubscription?.unsubscribe();
    }
}