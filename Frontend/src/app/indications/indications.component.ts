import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { Router, RouterModule } from '@angular/router';
import { usefulSettings } from '../shared/models/useful-settings.model';
import { AccountService } from '../shared/services/account/account.service';
import { HoverIconClassService } from '../shared/services/util/hover-icon-class.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { BrowserLanguageService } from '../shared/services/util/browser-language.service';
import { LanguagesEnum } from '../shared/models/languages.enum';
import { FormatStringService } from '../shared/services/util/format-string.service';
import { CustomSnackbarComponent, SnackBarTheme } from '../shared/custom-snackbar/custom-snackbar.component';
import { TranslationConstants } from '../shared/services/util/translation.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { MenuButtonMobileComponent } from '../shared/components/menu-button-mobile/menu-button-mobile.component';
import { forkJoin } from 'rxjs';
import { ConfigReaderService } from '../shared/services/util/config.reader.service';
import { MultiLevelCommissions } from '../shared/models/multilevelcomissions';
import { AmountConvertedResult } from '../shared/models/amount-converted-result';
import { IFiatCurrency } from '../shared/models/IFiatCurrency';
import { UnitOfMoney } from '../shared/models/finance.constants';
import BigNumber from 'bignumber.js';
import { ShareLinkService } from '../shared/services/util/share-link.service';
import { MyCommunityModel } from '../shared/models/my-community.model';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';

@Component({
    selector: 'app-indications',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule,
        MatSortModule,
        MatTableModule,
        MenuButtonMobileComponent,
        MatPaginator
    ],
    templateUrl: './indications.component.html',
    styleUrl: './indications.component.scss'
})
export class IndicationsComponent implements OnInit, AfterViewInit {
    @ViewChild('sortIndicated') set sortIndicated(sort: MatSort) {
        this.dataSourceUsersIndications.sort = sort;
    }

    @ViewChild('sortBonus') set sortBonus(sort: MatSort) {
        this.dataSourceBonus.sort = sort;
    }

    @ViewChild('paginatorBonus') public paginatorBonus!: MatPaginator;
    @ViewChild('paginator') public paginator!: MatPaginator;

    public loading: boolean = false;
    public usefulSettings: usefulSettings = new usefulSettings();
    public displayedColumnsBonus: string[] = ['description', 'date', 'value'];
    public displayedColumnsUsersIndications: string[] = ['name', 'level', 'date'];
    public eLanguage: typeof LanguagesEnum = LanguagesEnum;
    public userKey: string = '';
    public myCommunity: Array<MyCommunityModel> = [];
    public dataSourceUsersIndications: MatTableDataSource<MyCommunityModel> = new MatTableDataSource<MyCommunityModel>(this.myCommunity);
    public termsOfIndication: string = '';
    public indicationLink: string = '';
    public copyValue: string = '';
    public completedCashbacks: Array<Partial<MultiLevelCommissions>> = [];
    public dataSourceBonus: MatTableDataSource<MultiLevelCommissions> = new MatTableDataSource<MultiLevelCommissions>(this.completedCashbacks);
    public quotations: AmountConvertedResult[] = [];
    public fiatCurrency: IFiatCurrency = new IFiatCurrency();
    public totalCommission: number = 0;
    public numberOfIndications: number = 0;
    public searchIndicated: string = '';

    constructor(
        private readonly router: Router,
        private readonly accountService: AccountService,
        public hoverIconClassService: HoverIconClassService,
        private readonly browserLanguageService: BrowserLanguageService,
        private readonly formatStringService: FormatStringService,
        private readonly customSnackbar: CustomSnackbarComponent,
        private readonly translationConstants: TranslationConstants,
        private readonly clipboard: Clipboard,
        private readonly myConfigReader: ConfigReaderService,
        private readonly shareLinkService: ShareLinkService,
        private readonly changeDetectorRef: ChangeDetectorRef
    ) { }

    public ngOnInit(): void {
        this.usefulSettings = {
            fiatCurrency: this.accountService.getFiatCurrency(),
            selectedLanguage: this.browserLanguageService.getBrowserLanguage()
        }

        this.loading = true;
        forkJoin([
            this.accountService.getLoggedUserDetails(),
            this.accountService.getMyCommunity(),
            this.myConfigReader.getAllExternalLinks(),
            this.accountService.getCommissions(),
            this.accountService.allQuotations()
        ]).subscribe(([user, communityResp, contact, commissions, quotations]) => {
            this.userKey = user?.externalSourceId as string;
            this.myCommunity = communityResp;

            if (contact?.externalFiles?.termsOfIndication) {
                this.termsOfIndication = contact?.externalFiles?.termsOfIndication;
            }

            if (contact?.linkToMidas) {
                this.indicationLink = contact?.linkToMidas + this.userKey;
            }

            this.copyValue = this.translationConstants.translate('indications.shareInvitation').replace('###code###', this.userKey);

            this.completedCashbacks = commissions?.filter(comm => comm.wasProcessed);

            this.quotations = quotations;

            this.dataSourceBonus.data = this.completedCashbacks;
            this.dataSourceUsersIndications.data = this.myCommunity;
            setTimeout(() => this.dataSourceBonus.paginator = this.paginatorBonus);
            setTimeout(() => this.dataSourceUsersIndications.paginator = this.paginator);
            this.changeDetectorRef.detectChanges();
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

                this.totalCommission = new BigNumber(this.totalCommission || 0).plus(new BigNumber(comm?.amount || 0).multipliedBy(new BigNumber(tokenQuoteInFiat || 1))).toNumber();
            }
            this.loading = false;
        });
    }

    public async ngAfterViewInit(): Promise<void> {
        setTimeout(async () => {
            if (this.sortIndicated) {
                this.dataSourceUsersIndications.sort = this.sortIndicated;
            }

            if (this.sortBonus) {
                this.dataSourceBonus.sort = this.sortBonus;
            }

            this.tableSortingDataAccessor(this.dataSourceUsersIndications);
            this.tableSortingDataAccessorBonus(this.dataSourceBonus);
            this.changeDetectorRef.detectChanges();
        }, 200);
    }


    public goToWallet(): void {
        this.router.navigate(['/wallet']);
    }

    public maskedLocalPartEmail(email: string): string {
        return this.formatStringService.maskedLocalPartEmail(email);
    }

    public copy(): void {
        const copied: boolean = this.clipboard.copy(this.indicationLink);
        if (copied) {
            this.customSnackbar.open(
                this.translationConstants.translate(this.translationConstants.translate('snackbar.copy')),
                SnackBarTheme.success
            );
        }
    }

    public openWhatsApp(): void {
        this.shareLinkService.shareWhatsapp(this.copyValue, true, this.indicationLink);
    }

    public getFullName(indicated: MyCommunityModel): string {
        if (!indicated) return '';

        const capitalize = (name: string) =>
            name ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() : '';

        return `${capitalize(indicated.firstName as string)} ${capitalize(indicated.lastName as string)}`;
    }

    public applyFilter(value: string): string {
        return value.trim().toLocaleLowerCase();
    }

    public searchByIndicated(): void {
        const filterValue: string = this.applyFilter(this.searchIndicated);
        this.dataSourceUsersIndications.filter = filterValue;
    }

    public tableSortingDataAccessor(dataSource: MatTableDataSource<MyCommunityModel>): void {
        dataSource.sortingDataAccessor = (community: MyCommunityModel, property: string): any => {
            if (property === 'level') {
                return community?.level ? community?.level : 0;
            }

            if (property === 'date') {
                return new Date(community?.acceptedInvite as Date).getTime();
            }

            return (community as MyCommunityModel | any)[property];
        };
    }

    public tableSortingDataAccessorBonus(dataSource: MatTableDataSource<MultiLevelCommissions>): void {
        dataSource.sortingDataAccessor = (bonus: MultiLevelCommissions, property: string): any => {
            if (property === 'value') {
                return bonus?.amount ? new BigNumber(bonus?.amount).toNumber() : 0;
            }

            if (property === 'date') {
                return new Date(bonus?.when as Date).getTime();
            }

            return (bonus as MultiLevelCommissions | any)[property];
        };
    }
}