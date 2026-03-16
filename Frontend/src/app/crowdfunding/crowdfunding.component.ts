import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnInit, ViewChild } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { Router } from '@angular/router';
import { CrowdfundingCardComponent } from '../shared/components/crowdfunding-card/crowdfunding-card.component';
import { HoverIconClassService } from '../shared/services/util/hover-icon-class.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AccountService } from '../shared/services/account/account.service';
import { BrowserLanguageService } from '../shared/services/util/browser-language.service';
import { CardClass, CardColorClassService } from '../shared/services/util/card-color-class.service';
import { usefulSettings } from '../shared/models/useful-settings.model';
import { LanguagesEnum } from '../shared/models/languages.enum';
import { MatSort, MatSortModule } from '@angular/material/sort';
import Swiper from 'swiper';
import { MenuButtonMobileComponent } from '../shared/components/menu-button-mobile/menu-button-mobile.component';
import { CrowdfundingService } from '../shared/services/crowdfunding/crowdfunding.service';
import { ECrowdfundingStatus, ICrowdfundingBanners, ICrowdfundingCategories, IProjectCrowdfunding } from '../shared/models/IProjectCrowdfunding.model';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { calculateDaysDifference, formatCrowdfundingDate, getDateSortingValue } from '../shared/services/util/date-converter.service';
import { forkJoin, Subscription } from 'rxjs';
import { AppService } from '../app.service';
import { FilterProfitability } from '../shared/models/filter-profitability.enum';
import { FilterDuration } from '../shared/models/filter-duration.enum';
import { FormsModule } from '@angular/forms';
import { ErrorPageComponent } from '../shared/components/error-page/error-page.component';

@Component({
    selector: 'app-crowdfunding',
    imports: [
        CommonModule,
        SharedModule,
        CrowdfundingCardComponent,
        MatSortModule,
        MatTableModule,
        MenuButtonMobileComponent,
        FormsModule,
        ErrorPageComponent
    ],
    templateUrl: './crowdfunding.component.html',
    styleUrl: './crowdfunding.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CrowdfundingComponent implements OnInit, AfterViewInit {

    @ViewChild('tabGroup') public tabGroup!: MatTabGroup;
    @ViewChild('swiperBanners', { static: false }) protected swiperRef: ElementRef | undefined;
    public swiper?: Swiper;
    @ViewChild('sortCrowdfunding') set sortCrowdfunding(sort: MatSort) {
        this.dataSourceCrowdfunding.sort = sort;
    }
    @ViewChild('sortCrowdfundingFinished') set sortCrowdfundingFinished(sort: MatSort) {
        this.dataSourceCrowdfundingFinished.sort = sort;
    }
    public showErrorPage: boolean = false;
    public loading: boolean = false;
    public categories: ICrowdfundingCategories[] = [];
    public searchCrowndfundingTable: string = '';
    public searchCrowdfundingCard: string = '';
    public projectListFinished: IProjectCrowdfunding[] = [];
    public allProjectList: IProjectCrowdfunding[] = [];
    public projectCards: IProjectCrowdfunding[] = [];
    public projectList: IProjectCrowdfunding[] = [];
    public currentDate = new Date();
    public selectedCrowdfundingId: string = '';
    public displayedColumnsOffers: string[] = ['offer', 'profitability', 'category', 'type', 'captured', 'deadline'];
    public dataSourceCrowdfunding: MatTableDataSource<IProjectCrowdfunding> = new MatTableDataSource<IProjectCrowdfunding>(this.allProjectList);
    public dataSourceCrowdfundingFinished: MatTableDataSource<IProjectCrowdfunding> = new MatTableDataSource<IProjectCrowdfunding>(this.projectListFinished);
    public usefulSettings: usefulSettings = new usefulSettings();
    public eLanguage: typeof LanguagesEnum = LanguagesEnum;
    public banners: Array<ICrowdfundingBanners> = [];
    public isMobileSubscription: Subscription;
    public isMobile: boolean = false;
    public filter: { profitabilit: FilterProfitability[], duration: FilterDuration[] } = {
        profitabilit: [
            FilterProfitability.eighteenPercentage,
            FilterProfitability.twentyPercentage,
            FilterProfitability.twentyTwoPercentage,
            FilterProfitability.All,
        ],
        duration: [
            FilterDuration.TwelveMonths,
            FilterDuration.EighteenMonths,
            FilterDuration.TwentyMonths,
            FilterDuration.ThirtySixMonths,
            FilterDuration.FortyTwoMonths,
            FilterDuration.All,
        ]
    };
    public selectedDuration: string = '';
    public selectedDurationCategorie: string = '';
    public selectedProfitabilityCategorie: string = '';
    public selectedProfitability: string = '';
    public selectedDurationFinished: string = '';
    public selectedProfitabilityFinished: string = '';
    public selectedTabIndex: number = EProjectTab.ALL;
    public selectedTabCategory: string = EProjectTabName.ALL;
    public eTabName: typeof EProjectTabName = EProjectTabName;

    constructor(
        private readonly router: Router,
        public hoverIconClassService: HoverIconClassService,
        private readonly accountService: AccountService,
        private readonly cardColorClassService: CardColorClassService,
        private readonly browserLanguageService: BrowserLanguageService,
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly crowdfundingService: CrowdfundingService,
        private readonly appService: AppService,
    ) {
        this.isMobileSubscription = this.appService.getIsMobile().subscribe(isMobile => {
            this.isMobile = isMobile;
        });
    }

    public ngOnInit(): void {
        this.usefulSettings = {
            fiatCurrency: this.accountService.getFiatCurrency(),
            selectedLanguage: this.browserLanguageService.getBrowserLanguage()
        }

        this.getCrowdfundings();
    }

    public ngOnDestroy(): void {
        this.isMobileSubscription.unsubscribe();
    }

    public async ngAfterViewInit(): Promise<void> {
        setTimeout(async () => {
            this.swiperReady();
            this.swiper?.update();
            if (this.sortCrowdfunding) {
                this.dataSourceCrowdfunding.sort = this.sortCrowdfunding;
            }

            if (this.sortCrowdfundingFinished) {
                this.dataSourceCrowdfundingFinished.sort = this.sortCrowdfundingFinished;
            }

            this.tableSortingDataAccessor(this.dataSourceCrowdfunding);
            this.tableSortingDataAccessor(this.dataSourceCrowdfundingFinished);

            this.changeDetectorRef.detectChanges();
        }, 200);
    }

    public swiperReady(): void {
        this.swiper = this.swiperRef?.nativeElement?.swiper;
    }

    public goToWallet(): void {
        this.router.navigate(['/wallet']);
    }

    public getCrowdfundings(): void {
        this.loading = true;
        forkJoin([
            this.crowdfundingService.getCrowdfundings(),
            this.crowdfundingService.getCrowdfundingCategories(),
            this.crowdfundingService.getAllCrowdfundingBanners()
        ]).subscribe(([projects, categories, banners]) => {
            this.projectListFinished = projects?.filter(project => project.status === ECrowdfundingStatus.FINISHED);
            if (this.projectListFinished?.length > 0) {
                this.projectListFinished?.forEach(project => {
                    if (project?.moneyReceived != null && project?.targetCapture != null) {
                        const percentage = (Number(project.moneyReceived) / Number(project.targetCapture)) * 100;
                        project.targetAmountPercentage = Math.min(percentage, 100); // Limita a 100%
                      } else {
                        project.targetAmountPercentage = 0;
                      }                
                    });
            }

            projects.forEach(project => {
                const totalDays: number = calculateDaysDifference(this.currentDate, project.finalDate as any);
                if (project?.moneyReceived != null && project?.targetCapture != null) {
                    const percentage = (Number(project.moneyReceived) / Number(project.targetCapture)) * 100;
                    project.targetAmountPercentage = Math.min(percentage, 100); // Limita a 100%
                  } else {
                    project.targetAmountPercentage = 0;
                  }                     
                  project.daysRemaining = totalDays;
            });

            this.projectList = projects;
            this.allProjectList = projects;
            this.projectCards = projects.filter(project =>
                project.status === ECrowdfundingStatus.ACTIVE
            );
            this.dataSourceCrowdfunding = new MatTableDataSource(this.allProjectList);
            this.dataSourceCrowdfundingFinished = new MatTableDataSource(this.projectListFinished);

            this.tableSortingDataAccessor(this.dataSourceCrowdfunding);
            this.tableSortingDataAccessor(this.dataSourceCrowdfundingFinished);

            this.categories = categories || [];
            this.banners = banners || [];
        }, error => {
            this.showErrorPage = true;
        }).add(() => {
            // The filterPredicate must be set everytime a "new MatTableDataSource" is used.
            this.dataSourceCrowdfunding.filterPredicate = (data: IProjectCrowdfunding, filter: string): boolean => {
                const normalizedName = this.normalizeText(data.name || '');
                const normalizedFilter = this.normalizeText(filter);
                return normalizedName.includes(normalizedFilter);
            };

            this.dataSourceCrowdfundingFinished.filterPredicate = (data: IProjectCrowdfunding, filter: string): boolean => {
                const normalizedName = this.normalizeText(data.name || '');
                const normalizedFilter = this.normalizeText(filter);
                return normalizedName.includes(normalizedFilter);
            };

            this.loading = false;
        });
    }

    private normalizeText(text: string): string {
        return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    public tableSortingDataAccessor(dataSource: MatTableDataSource<IProjectCrowdfunding>): void {
        dataSource.sortingDataAccessor = (project: IProjectCrowdfunding, property: string): string | number => {
            if (property === 'deadline') {
                return getDateSortingValue(project.finalDate);
            }

            if (property === 'profitability') {
                return Number(project.profitability) || 0;
            }

            if (property === 'captured') {
                return Number(project.targetAmountPercentage) || 0;
            }

            return (project as IProjectCrowdfunding | any)[property];
        };
    }

    public onTabTableProjectChange(tab: MatTabChangeEvent) {
        const lastTabIndex: number = this.tabGroup._tabs.toArray().length - 1;

        if (tab.index === 0) {
            this.selectedTabCategory = EProjectTabName.ALL;
        } else if (tab.index === lastTabIndex) {
            this.selectedTabCategory = EProjectTabName.FINISHED;
        } else {
            this.selectedTabCategory = tab.tab.textLabel as EProjectTabName;
        }

        if (tab.index !== 0) {
            this.projectList = this.allProjectList.filter(project => project.type === tab.tab.textLabel);
            this.dataSourceCrowdfunding.data = this.projectList;
        } else {
            this.dataSourceCrowdfunding.data = this.allProjectList;
        }

        this.tableSortingDataAccessor(this.dataSourceCrowdfunding);
        this.tableSortingDataAccessor(this.dataSourceCrowdfundingFinished);
        this.applyFilters();
        this.applyFiltersFinished();
        this.clearFilters();
        this.changeDetectorRef.detectChanges();
    }

    public onSelectedTabProjectChange(tab: MatTabChangeEvent) {
        this.selectedTabIndex = tab.index;
        this.projectCards = [...this.allProjectList];
        this.searchCrowdfundingCard = '';
        this.projectCards = this.allProjectList.filter(project => {
            const daysRemaining: number | undefined = project.daysRemaining ?? 0;
            const active: boolean = project.status === ECrowdfundingStatus.ACTIVE;
            if (tab.index === EProjectTab.FINISHING) {
                return active && daysRemaining <= 10;
            } else if (tab.index === EProjectTab.RECENT) {
                return active && daysRemaining >= 21;
            } else {
                return active;
            }
        });
    }

    public getCardColorClass(percentage: number): CardClass {
        return this.cardColorClassService.getCardColorClass(percentage);
    }

    public goToCrowdfundfingDetails(id: string): void {
        this.router.navigate([`/crowdfunding/details/${id}`]);
    }

    public percentageProgressBar(captures: string, goal: string): number {
        let result: number = (Number(captures) / Number(goal)) * 100;

        if (result > 100) {
            result = 100;
        } else if (result > 0 && result < 1) {
            result = 2;
        }

        return result;
    }

    public applyFilter(value: string): string {
        return value.trim().toLocaleLowerCase();
    }

    public searchProjectInTable(): void {
        const filterValue: string = this.applyFilter(this.searchCrowndfundingTable);
        this.dataSourceCrowdfunding.filter = filterValue;
        this.dataSourceCrowdfundingFinished.filter = filterValue;
    }

    public searchProjectInCards(): void {
        const filterValue: string = this.applyFilter(this.searchCrowdfundingCard).toLowerCase();

        if (filterValue) {
            this.projectCards = this.allProjectList.filter(project =>
                project.name.toLowerCase().includes(filterValue) && project.status === ECrowdfundingStatus.ACTIVE
            );
        } else {
            this.onSelectedTabProjectChange({ index: this.selectedTabIndex } as MatTabChangeEvent);
        }
    }

    public translateFilterDuration(duration: FilterDuration): string {
        if (!duration) {
            return '';
        } else if (duration === FilterDuration.All) {
            return 'filter.all';
        } else if (duration === FilterDuration.TwelveMonths) {
            return 'filter.duration.twelveMonths';
        } else if (duration === FilterDuration.EighteenMonths) {
            return 'filter.duration.eighteenMonths';
        } else if (duration === FilterDuration.TwentyMonths) {
            return 'filter.duration.twentyMonths';
        } else if (duration === FilterDuration.ThirtySixMonths) {
            return 'filter.duration.thirtySixMonths';
        } else {
            return 'filter.duration.fortyTwoMonths';
        }
    }

    public translateFilterProfitability(profitability: FilterProfitability): string {
        if (!profitability) {
            return '';
        } else if (profitability === FilterProfitability.All) {
            return 'filter.all';
        } else if (profitability === FilterProfitability.eighteenPercentage) {
            return 'filter.profitability.eighteenPercentage';
        } else if (profitability === FilterProfitability.twentyPercentage) {
            return 'filter.profitability.twentyPercentage';
        } else {
            return 'filter.profitability.twentyTwoPercentage';
        }
    }

    public applyFilters(): void {
        let filteredList: IProjectCrowdfunding[] = this.selectedTabCategory === EProjectTabName.FINISHED ? this.projectListFinished.slice() : this.allProjectList.slice();

        filteredList = this.getDurationSelection(filteredList);
        filteredList = this.getProfitabilitySelection(filteredList);
        filteredList = this.getCategorySelection(filteredList);

        if (this.selectedTabCategory === EProjectTabName.FINISHED) {
            this.dataSourceCrowdfundingFinished.data = filteredList;
        } else {
            this.dataSourceCrowdfunding.data = filteredList
        }
    }

    public applyFiltersFinished(): void {
        let filteredList: IProjectCrowdfunding[] = this.projectListFinished.slice();

        filteredList = this.getDurationSelection(filteredList);
        filteredList = this.getProfitabilitySelection(filteredList);

        this.dataSourceCrowdfundingFinished.data = filteredList;
    }

    public getCategorySelection(list: IProjectCrowdfunding[]) {
        if (this.selectedTabCategory !== EProjectTabName.ALL) {
            return list.filter(project => project?.type === this.selectedTabCategory);
        }
        return list;
    }

    public getDurationSelection(list: IProjectCrowdfunding[]) {
        let selectedDuration: string = '';

        if (this.selectedTabCategory === EProjectTabName.ALL) {
            selectedDuration = this.selectedDuration;
        } else if (this.selectedTabCategory === EProjectTabName.FINISHED) {
            selectedDuration = this.selectedDurationFinished;
        } else {
            selectedDuration = this.selectedDurationCategorie;
        }

        if (!selectedDuration) {
            return list;
        }

        const durationMap = {
            [FilterDuration.TwelveMonths]: 12,
            [FilterDuration.EighteenMonths]: 18,
            [FilterDuration.TwentyMonths]: 20,
            [FilterDuration.ThirtySixMonths]: 36,
            [FilterDuration.FortyTwoMonths]: 42
        } as const;

        if (!(selectedDuration in durationMap)) {
            return list;
        }

        return list.filter(project => Number(project?.deadline) >= durationMap[selectedDuration as keyof typeof durationMap]);
    }

    public getProfitabilitySelection(list: IProjectCrowdfunding[]) {
        let selectedProfitability: string = '';

        if (this.selectedTabCategory === EProjectTabName.ALL) {
            selectedProfitability = this.selectedProfitability;
        } else if (this.selectedTabCategory === EProjectTabName.FINISHED) {
            selectedProfitability = this.selectedProfitabilityFinished;
        } else {
            selectedProfitability = this.selectedProfitabilityCategorie;
        }

        if (!selectedProfitability) {
            return list;
        }

        const durationMap = {
            [FilterProfitability.eighteenPercentage]: 18,
            [FilterProfitability.twentyPercentage]: 20,
            [FilterProfitability.twentyTwoPercentage]: 22,
        } as const;

        if (!(selectedProfitability in durationMap)) {
            return list;
        }

        return list.filter(project => Number(project?.profitability) >= durationMap[selectedProfitability as keyof typeof durationMap]);
    }

    public clearFilters(): void {
        this.selectedDuration = '';
        this.selectedProfitability = '';

        this.selectedDurationCategorie = '';
        this.selectedProfitabilityCategorie = '';

        this.selectedDurationFinished = '';
        this.selectedProfitabilityFinished = '';

        this.applyFilters();
        this.applyFiltersFinished();
    }

    public translateTab(tabName: EProjectTabName): string {
        if (tabName === EProjectTabName.ALL) {
            return 'crowdfunding.allOffers';
        } else {
            return 'crowdfunding.finished';
        }
    }

    public getCorrectDate(date: string | Date): Date {
        if (date instanceof Date) {
            return date;
        }

        if (typeof date === 'string') {
            const parts = date.split('-');
            return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        }

        return new Date();
    }

    public formatDateFromISOString(isoString: any): string {
        return formatCrowdfundingDate(
            isoString,
            this.usefulSettings.selectedLanguage === this.eLanguage.PORTUGUESE ? 'pt-BR' : 'en-US'
        );
    };
}

export enum EProjectTab {
    ALL = 0,
    RECENT = 1,
    FINISHING = 2
}

export enum EProjectTabName {
    ALL = 'all',
    FINISHED = 'finished'
}