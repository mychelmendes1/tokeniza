import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { Router, RouterModule } from '@angular/router';
import { HoverIconClassService } from '../../shared/services/util/hover-icon-class.service';
import { formatDateWithAbbreviatedMonth } from '../../shared/services/util/date-converter.service';
import { usefulSettings } from '../../shared/models/useful-settings.model';
import { AccountService } from '../../shared/services/account/account.service';
import { MenuButtonMobileComponent } from '../../shared/components/menu-button-mobile/menu-button-mobile.component';
import { SortFilterEnum } from '../../shared/models/sort-filter.enum';
import { FinancialService } from '../../shared/services/financial/financial';
import { TransactionFlow } from '../../shared/models/finance.constants';
import { PeriodFilter } from '../../shared/models/period-filter.enum';
import { UserTransactionHistory } from '../../shared/models/user.transaction.history';
import BigNumber from 'bignumber.js';
import { ValueConverterService } from '../../shared/services/util/value-converter.service';
import { Token } from '../../shared/models/tokens';
import { forkJoin } from 'rxjs';
import { TokensService } from '../../shared/services/tokens/token.service';
import { MatMenu } from '@angular/material/menu';

@Component({
    selector: 'app-extract',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule,
        MenuButtonMobileComponent
    ],
    templateUrl: './extract.component.html',
    styleUrl: './extract.component.scss'
})
export class ExtractComponent implements OnInit {
    @ViewChild('menu') menu!: MatMenu;
    public loading: boolean = false;
    public loadingMoreCardsHistory: boolean = false;
    public allItemsLoaded: boolean = false;
    public wasHistoryLoaded: boolean = false;
    public usefulSettings: usefulSettings = new usefulSettings();
    public selectedStatus: TransactionFlow = TransactionFlow.ALL;
    public statusOptions: Array<TransactionFlow> = [
        TransactionFlow.ALL,
        TransactionFlow.CREDIT,
        TransactionFlow.DEBIT
    ];
    public selectedPeriod: PeriodFilter = PeriodFilter.ALL;
    public periodsOptions: Array<PeriodFilter> = [
        PeriodFilter.ALL,
        PeriodFilter.THIRTY,
        PeriodFilter.SIXTY,
        PeriodFilter.NINETY
    ];
    public searchTime!: ReturnType<typeof setTimeout>; // Used in filter
    public SEARCH_TIME_VALUE: number = 700; // In milliseconds
    public filteredTransactionId: string = '';
    public offsetTransactions: number = 0;
    public limitTransactions: number = 10;
    public filteredHistory: Array<UserTransactionHistory> = [];
    public showLoadMoreButton: boolean = false;
    public allTransactions: Array<UserTransactionHistory> = [];
    public tokenSelected: string = '';
    public tokens: Token[] = [];

    constructor(
        public hoverIconClassService: HoverIconClassService,
        private readonly accountService: AccountService,
        private readonly router: Router,
        private readonly financialService: FinancialService,
        public readonly valueConverterService: ValueConverterService,
        private readonly tokensService: TokensService
    ) { }

    public ngOnInit(): void {
        this.usefulSettings = {
            fiatCurrency: this.accountService.getFiatCurrency(),
        }

        this.loading = true;
        forkJoin([
            this.financialService.getMyTransactionHistory(
                undefined, // undefined to take all tokens extract
                this.selectedStatus === TransactionFlow.ALL ? undefined : this.selectedStatus,
                this.selectedPeriod === PeriodFilter.ALL ? undefined : this.selectedPeriod,
                this.filteredTransactionId,
                this.limitTransactions,
                this.offsetTransactions
            ),
            this.tokensService.getTokens()
        ]).subscribe(([allExtract, allTokens]) => {
            allExtract = allExtract?.filter(data => data) || [];
            this.allTransactions = this.allTransactions?.concat(allExtract);
            this.filteredHistory = this.allTransactions;
            this.offsetTransactions = this.offsetTransactions + this.limitTransactions;
            this.defineShowLoadMoreButton(allExtract.length);

            this.tokens = allTokens?.filter(tkn => tkn?.enabled) || [];

        }, error => {

        }).add(() => {
            this.loading = false;
            this.wasHistoryLoaded = true;
        });
    }

    public async getHistory(forceLoad: boolean = false, restartData: boolean = false): Promise<void> {
        if (!this.wasHistoryLoaded || forceLoad) {
            if (this.wasHistoryLoaded) {
                this.loadingMoreCardsHistory = true;
            } else {
                this.loading = true;
            }

            this.financialService.getMyTransactionHistory(
                this.tokenSelected ?? undefined,
                this.selectedStatus === TransactionFlow.ALL ? undefined : this.selectedStatus,
                this.selectedPeriod === PeriodFilter.ALL ? undefined : this.selectedPeriod,
                this.filteredTransactionId,
                this.limitTransactions,
                this.offsetTransactions
            ).subscribe(responseData => {
                if (responseData) {
                    //Removing null entries
                    responseData = responseData.filter(data => data);

                    if (restartData) {
                        this.allTransactions = responseData;
                    } else {
                        this.allTransactions = this.allTransactions.concat(responseData);
                    }
                    this.filteredHistory = this.allTransactions;
                    this.offsetTransactions = this.offsetTransactions + this.limitTransactions;
                    this.defineShowLoadMoreButton(responseData.length);
                }
            }, error => { }).add(() => {
                this.loading = false;
                this.loadingMoreCardsHistory = false;
                this.wasHistoryLoaded = true;
            });
        }
    }

    public getIconExtract(type: any): string {
        if (!type) {
            return '';
        }

        switch (type) {
            case 'debit':
                return 'arrow-down'
            ;
            case 'credit':
                return 'arrow-up'
            ;
            case 'purchase':
                return 'shopping-cart'
            ;
            case 'sale':
                return 'dollar-sign'
            ;
            case 'refund':
                return 'corner-left-down'
            ;
            case 'investment':
                return 'trending-up'
            ;
            case 'staking':
                return '3-layers'
            ;
            default:
                return 'coin-stack'
            ;
        }
    }

    public getIconClass(type: string | undefined): string {
        if (type === TransactionFlow.DEBIT) {
            return 'primary-red-600';
        } else {
            return 'primary-700';
        }
    }

    public formatDateWithAbbreviatedMonth(date: any): string {
        return formatDateWithAbbreviatedMonth(date, false);
    }

    public goToWallet(): void {
        this.router.navigate(['/wallet']);
    }

    public clearFilters(): void {
        this.selectedPeriod = PeriodFilter.ALL;
        this.selectedStatus = TransactionFlow.ALL
        this.tokenSelected = '';
        this.offsetTransactions = 0;
        this.limitTransactions = 10;
        this.menu.closed.emit();
        this.wasHistoryLoaded = false;
        this.filteredTransactionId = '';
        this.getHistory(true, true);
    }

    public filterData(forceSearch: boolean = false, resetValues: boolean = true): void {
        // Clear the timeout to wait a little bit the user to finish typing the search
        this.offsetTransactions = 0;
        this.wasHistoryLoaded = false;

        clearTimeout(this.searchTime);
        this.searchTime = setTimeout(() => {
            this.getHistory(forceSearch, resetValues);
        }, forceSearch ? 0 : this.SEARCH_TIME_VALUE);
    }

    public loadMore(): void {
        this.getHistory(true, false);
    }

    private defineShowLoadMoreButton(lengthLoaded: number): void {
        if (lengthLoaded < this.limitTransactions || this.filteredHistory.length === 0 || lengthLoaded === 0) {
            this.showLoadMoreButton = false;
        } else {
            this.showLoadMoreButton = true;
        }

        this.allItemsLoaded = !this.showLoadMoreButton;
    }

    public translateSortFilter(filter: SortFilterEnum): string {
        if (filter === SortFilterEnum.RECENT) {
            return 'filter.recents';
        } else if (filter === SortFilterEnum.LOWER_VALUE) {
            return 'filter.lowerValue';
        } else {
            return 'filter.highestValue';
        }
    }

    public applyFilter(): void {
        this.filterData(true, true);
    }

    public checkSignal(transactionFlow: TransactionFlow | undefined): string {
        if (transactionFlow === TransactionFlow.CREDIT) {
            return '+';
        } else if (transactionFlow === TransactionFlow.DEBIT) {
            return '-';
        } else {
            return '';
        }
    }

    public checkTitle(transaction: UserTransactionHistory): string {
        if (transaction.transactionDescription?.includes('Troca de token por NFT')) {
            return "nfts";
        } else if (transaction?.isStaking) {
            return "staking";
        } else if (transaction?.isTokenBuy) {
            return "tokens-bought";
        } else if (transaction?.isTokenIndicationRewards) {
            return "reward-received";
        } else if (transaction.transactionType === "debitfordirecttransfer" && transaction?.walletPublicKeyToTransferTo !== '') {
            return "transfer-made";
        } else if (transaction.transactionFlow === TransactionFlow.DEBIT) {
            return "debit-executed";
        } else if (transaction.transactionFlow === TransactionFlow.CREDIT || transaction.customerToName === 'NOT_POSSIBLE_TO_IDENTIFY') {
            return "credit-received";
        } else {
            return '';
        }
    }

    public getAmount(value: any): number {
        return new BigNumber(value)?.toNumber();
    }
}