import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { IsActiveMatchOptions, Router, RouterModule } from '@angular/router';
import { HoverIconClassService } from '../../services/util/hover-icon-class.service';
import { fadeIn, fadeInOut } from '../../services/util/animations.service';
import { AccountService } from '../../services/account/account.service';
import { usefulSettings } from '../../models/useful-settings.model';
import { CustomSnackbarComponent, SnackBarTheme } from '../../custom-snackbar/custom-snackbar.component';
import { TranslationConstants } from '../../services/util/translation.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { forkJoin, Subscription } from 'rxjs';
import { AppService } from '../../../app.service';
import { UserLoggedModel } from '../../models/user.logged.model';
import { LocalStorageKeys } from '../../services/util/local.storage.keys';
import { LocalStorageService } from 'angular-web-storage';
import { environment } from '../../../../environments/environments';
import { MyCommunityModel } from '../../models/my-community.model';
import BigNumber from 'bignumber.js';
import { AmountConvertedResult } from '../../models/amount-converted-result';
import { ConfigReaderService } from '../../services/util/config.reader.service';
import { MultiLevelCommissions } from '../../models/multilevelcomissions';
import { UnitOfMoney } from '../../models/finance.constants';
import { IFiatCurrency } from '../../models/IFiatCurrency';

@Component({
    selector: 'app-menu',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule,
    ],
    templateUrl: './menu.component.html',
    styleUrl: './menu.component.scss',
    animations: [fadeInOut, fadeIn]
})
export class MenuComponent implements OnInit {

    @Output() public menuEmitter: EventEmitter<boolean> = new EventEmitter<boolean>(false);
    @Output() public menuEmitterClose: EventEmitter<boolean> = new EventEmitter<boolean>(false);
    @Input() public menuExpanded: boolean = true;
    public avatarImage: string | null = '';
    public usefulSettings: usefulSettings = new usefulSettings();
    public isMobileSubscription: Subscription;
    public isMobile: boolean = false;
    public loading: boolean = false;
    public userLogged: UserLoggedModel = new Object() as UserLoggedModel;
    public indicationLink: string = '';
    public myCommunity: Array<MyCommunityModel> = [];
    public totalBalance: number = 0;
    public copyValue: string = '';
    public userKey: string = '';
    public completedCashbacks: Array<Partial<MultiLevelCommissions>> = [];
    public quotations: AmountConvertedResult[] = [];
    public fiatCurrency: IFiatCurrency = new IFiatCurrency();
    public totalCommission: number = 0;
    public currentUrl: boolean = false;
    public urlSubscription: Subscription = new Subscription;
    public isAuthenticated: boolean = false;

    constructor(
        public hoverIconClassService: HoverIconClassService,
        private readonly router: Router,
        private readonly accountService: AccountService,
        private readonly customSnackbar: CustomSnackbarComponent,
        private readonly translationConstants: TranslationConstants,
        private readonly clipboard: Clipboard,
        private readonly appService: AppService,
        private readonly localStorageService: LocalStorageService,
        private readonly myConfigReader: ConfigReaderService
    ) {
        this.accountService.userMenuInfo.subscribe(user => {
            this.userLogged.selfieImage = user?.avatar;
            this.userLogged.name = user?.fullname as string;
        });
        this.usefulSettings = {
            fiatCurrency: this.accountService.getFiatCurrency(),
        }
        this.isMobileSubscription = this.appService.getIsMobile().subscribe(isMobile => {
            this.isMobile = isMobile;
        });
    }

    public readonly myMatchOptions: IsActiveMatchOptions = {
        queryParams: 'ignored',
        matrixParams: 'exact',
        paths: 'subset',
        fragment: 'exact',
    };

    public menuButtons: Array<IMenuButtons> = [
        { icon: 'rocket', link: '/crowdfunding', textPath: 'Oportunidades' },
        { icon: 'shopping-cart', link: '/marketplace', textPath: 'Marketplace' },
        { icon: 'wallet', link: '/wallet', textPath: 'Wallet' }
    ];

    public incomeReportsButton: IMenuButtons = {
        icon: 'charge',
        link: '/income-report',
        textPath: 'incomeReport'
    }

    public ngOnInit(): void {
        this.userLogged = this.localStorageService.get(LocalStorageKeys.USER_LOGGED_KEY);

        this.accountService.isAuthenticated(false, false).subscribe(isAuthenticated => {
            this.isAuthenticated = isAuthenticated ? true : false;
        });

        this.urlSubscription = this.appService.getCurrentUrl().subscribe(currentUrl => {
            this.currentUrl = currentUrl.includes('external-deposit');
        });

        if (this.userLogged) {
            this.loading = true;
            forkJoin([
                this.accountService.getMyCommunity(),
                this.accountService.allQuotations(),
                this.accountService.allBalances(),
                this.myConfigReader.getAllExternalLinks(),
                this.accountService.getCommissions(),
            ]).subscribe(([myCommunityResp, quotations, balances, contact, commissions]) => {
                this.userKey = this.userLogged?.externalSourceId as string;
                this.myCommunity = myCommunityResp;
                let totalBalance: number = 0;

                this.quotations = quotations;

                for (let balance of balances) {
                    totalBalance += this.fiatAmount(balance.unitOfMoney, quotations, balance.balance);
                }
                this.totalBalance = totalBalance;

                if (contact?.linkToMidas) {
                    this.indicationLink = contact?.linkToMidas + this.userKey;
                }

                this.completedCashbacks = commissions?.filter(comm => comm.wasProcessed);

            }, error => {

            }).add(() => {
                for (const comm of this.completedCashbacks) {
                    let tokenQuoteInFiat;

                    if (comm?.unit_of_money) {
                        if (this.fiatCurrency?.currency === UnitOfMoney.USD) {
                            tokenQuoteInFiat = this.quotations?.find(qto => qto?.currency === comm?.unit_of_money)?.amountUsd || new BigNumber(0);
                        } else {
                            tokenQuoteInFiat = this.quotations?.find(qto => qto?.currency === comm?.unit_of_money)?.amount || new BigNumber(0);
                        }
                    }


                    this.totalCommission = new BigNumber(this.totalCommission || 0)
                        .plus(new BigNumber(comm?.amount || 0).multipliedBy(new BigNumber(tokenQuoteInFiat || 1))).toNumber();
                }

                this.loading = false;
            });

            this.copyValue = this.translationConstants.translate('indications.shareInvitation').replace('###code###', this.userKey);
        }
    }

    public ngOnDestroy(): void {
        this.urlSubscription.unsubscribe();
    }

    public fiatAmount(unitOfMoney: string, quotes: AmountConvertedResult[], balance: any): number {
        let quote: BigNumber | undefined = quotes?.find(quote => quote.currency === unitOfMoney)?.amount;
        return new BigNumber(quote || 0).multipliedBy(balance || 0).toNumber();
    }

    public toggleMenu(): void {
        this.menuExpanded = !this.menuExpanded;
        this.menuEmitter.emit(this.menuExpanded);
    }

    public goToProfile(): void {
        this.router.navigate(['/profile']);
    }

    public goToLogin(): void {
        window.open('/account/login', '_self');
    }

    public async doLogout(): Promise<void> {
        this.loading = true;
        this.accountService.destroySession().subscribe(() => {
            this.closeMenu();
            window.open('/account/login', '_self');
        }).add(() => {
            this.loading = false;
        });
    }

    public copy(): void {
        const copied: boolean = this.clipboard.copy(this.indicationLink);
        if (copied) {
            this.customSnackbar.open(
                this.translationConstants.translate('Copiado com sucesso'),
                SnackBarTheme.success
            );
        }
    }

    public goToIndications(): void {
        this.router.navigate(['/indications']);
        this.closeMenu();
    }

    public closeMenu(): void {
        this.menuEmitterClose.emit();
    }

    get companyName(): string {
        return environment.companyName;
    }
}

export interface IMenuButtons {
    icon: string;
    textPath: string;
    link: string;
    queryParams?: any;
}