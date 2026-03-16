import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { Params, Router, RouterModule } from '@angular/router';
import { AppService } from '../../../app.service';

@Component({
    selector: 'app-error-page',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    templateUrl: './error-page.component.html',
    styleUrl: './error-page.component.scss'
})
export class ErrorPageComponent implements OnInit {

    @Input() public hideBackButton: boolean = false;
    public lastRoute: string = '';

    constructor(
        private readonly router: Router,
        private readonly appService: AppService
    ) { }

    public ngOnInit(): void {
        this.lastRoute = this.appService.getPreviousUrl();
    }

    public navigate(url: string, queryParams?: Params): void {
        this.router.navigate([url], queryParams);
    }
}