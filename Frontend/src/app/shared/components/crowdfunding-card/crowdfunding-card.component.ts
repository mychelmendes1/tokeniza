import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, Input, ViewChild } from '@angular/core';
import { SharedModule } from '../../shared.module';
import Swiper from 'swiper';
import { SwiperOptions } from 'swiper/types';
import { usefulSettings } from '../../models/useful-settings.model';
import { AccountService } from '../../services/account/account.service';
import { CardClass, CardColorClassService } from '../../services/util/card-color-class.service';
import { Router } from '@angular/router';
import { ICrowdfundingOrdersCard, IProjectCrowdfunding } from '../../models/IProjectCrowdfunding.model';
import { calculateDaysDifference } from '../../services/util/date-converter.service';
import { HoverIconClassService } from '../../services/util/hover-icon-class.service';

@Component({
    selector: 'app-crowdfunding-card',
    imports: [
        CommonModule,
        SharedModule
    ],
    templateUrl: './crowdfunding-card.component.html',
    styleUrl: './crowdfunding-card.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CrowdfundingCardComponent {

    constructor(
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly accountService: AccountService,
        private readonly cardColorClassService: CardColorClassService,
        private readonly router: Router,
        public hoverIconClassService: HoverIconClassService
    ) {}

    @ViewChild('swiper', { static: false }) protected swiperRef: ElementRef | undefined;
    @Input() projectsList: IProjectCrowdfunding[] | ICrowdfundingOrdersCard[] = [];
    @Input() public hasTitleText: boolean = false;
    @Input() public cardClickable: boolean = true;
    @Input() public loading: boolean = false;
    public usefulSettings: usefulSettings = new usefulSettings();
    public currentDate = new Date();
    public swiperBreakpoints: Record<number, SwiperOptions> = {
        320: {
            slidesPerView: 1,
            spaceBetween: 20,
            width: 350,
        },
        640: {
            slidesPerView: 1,
            spaceBetween: 20,
            width: 450
        },
        768: {
            slidesPerView: 1,
            spaceBetween: 20,
            width: 450
        },
        1024: {
            slidesPerView: 1,
            spaceBetween: 20,
            width: 450
        },
        1366: {
            slidesPerView: 3,
            spaceBetween: 20,
            width: 1350
        },
    };
    public swiper?: Swiper;

    public ngOnInit(): void {
        this.usefulSettings = {
            fiatCurrency: this.accountService.getFiatCurrency(),
        }
    }

    public async ngAfterViewInit(): Promise<void> {
        setTimeout(async () => {
            this.swiperReady();
            this.swiper?.update();

            this.changeDetectorRef.detectChanges();
        }, 200);
    }

    public ngOnChanges(): void {
        if (this.projectsList?.length > 0) {
            this.projectsList?.forEach(project => {
                if (project?.moneyReceived != null && project?.targetCapture != null) {
                    const percentage = (Number(project.moneyReceived) / Number(project.targetCapture)) * 100;
                    project.targetAmountPercentage = Math.min(percentage, 100); // Limita a 100%
                  } else {
                    project.targetAmountPercentage = 0;
                  }                
                  const totalDays: number = this.calculateDaysDifference(this.currentDate, project.finalDate as any);
                project.daysRemaining = totalDays;
            });
        }
    }

    public calculateDaysDifference(start: Date, end: Date): number {
        return calculateDaysDifference(start, end);
    }

    public swiperReady(): void {
        this.swiper = this.swiperRef?.nativeElement?.swiper;
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

    public getCardColorClass(remaining: number | undefined): CardClass {
        return this.cardColorClassService.getCardColorClass(remaining);
    }

    public goToCrowdfundfingDetails(id: string): void {
        this.router.navigate([`/crowdfunding/details/${id}`]);
    }

    public trackById(index: number, item: IProjectCrowdfunding): string {
        return item.id;
    }

    public slide(direction: 'next' | 'prev', target: 'swiper'): void {
        const swiperMap: { swiper: ElementRef<any> | undefined } = {
            swiper: this.swiperRef
        };

        const swiperRef: ElementRef<any> | undefined = swiperMap[target];
        const swiperInstance: Swiper = swiperRef?.nativeElement?.swiper;

        if (!swiperInstance) {
            return;
        }

        if (direction === 'next') {
            swiperInstance.slideNext();
        } else {
            swiperInstance.slidePrev();
        }
    }
}