import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    ElementRef,
    OnInit,
    ViewChild,
} from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { Router, RouterModule } from '@angular/router';
import Swiper from 'swiper';
import { HoverIconClassService } from '../shared/services/util/hover-icon-class.service';
import {
    CardClass,
    CardColorClassService,
} from '../shared/services/util/card-color-class.service';
import { usefulSettings } from '../shared/models/useful-settings.model';
import { BrowserLanguageService } from '../shared/services/util/browser-language.service';
import { AccountService } from '../shared/services/account/account.service';
import { SwiperOptions } from 'swiper/types';
import { environment } from '../../environments/environments';
import { moveElementForward } from '../shared/services/util/animations.service';
import { CrowdfundingCardComponent } from '../shared/components/crowdfunding-card/crowdfunding-card.component';
import { CrowdfundingService } from '../shared/services/crowdfunding/crowdfunding.service';
import { calculateDaysDifference } from '../shared/services/util/date-converter.service';
import {
    ECrowdfundingStatus,
    IProjectCrowdfunding,
} from '../shared/models/IProjectCrowdfunding.model';
import { ShareLinkService } from '../shared/services/util/share-link.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { emailValidator } from '../shared/validators/email-validator';
import { showErrorForInputs } from '../shared/validators/form-group.validators';
import { TranslationConstants } from '../shared/services/util/translation.service';
import {
    CustomSnackbarComponent,
    SnackBarTheme,
} from '../shared/custom-snackbar/custom-snackbar.component';

@Component({
    selector: 'app-home',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule,
        CrowdfundingCardComponent,
    ],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    animations: [moveElementForward],
})
export class HomeComponent implements OnInit, AfterViewInit {
    @ViewChild('swiper', { static: false }) protected swiperRef:
        | ElementRef
        | undefined;
    public loading: boolean = false;
    public swiperBreakpoints: Record<number, SwiperOptions> = {
        320: { slidesPerView: 1, spaceBetween: 10 },
        768: { slidesPerView: 1, spaceBetween: 15 },
        1024: { slidesPerView: 2.3, spaceBetween: 20 },
    };
    public swiper?: Swiper;
    public aboutCompany: Array<string> = [
        'home.ourHistory',
        'home.missionAndValues',
        'home.foundationTeam',
        'home.securityAndCompliance',
    ];
    public usefulSettings: usefulSettings = new usefulSettings();
    public contactUsPhone: string = environment.contactUsPhone;
    public contactUsEmail: string = environment.contactUsEmail;
    public email: string = environment.email;
    public isHovered: { [key: string]: boolean } = {};
    public projectList: IProjectCrowdfunding[] = [];
    public currentDate = new Date();
    public environmentUrl: typeof environment = environment;
    public formNewsletter: FormGroup<IFormNewsletter> =
        new FormGroup<IFormNewsletter>({
            email: new FormControl('', {
                validators: [Validators.required, emailValidator],
            }),
        });
    public investment: number = 10000;
    public rentability: number = 15;
    public viewROIEighteenMonths: number = 0;
    public viewROIThirtyTwoMonthss: number = 0;
    public viewROIFortyEightMonths: number = 0;

    constructor(
        public hoverIconClassService: HoverIconClassService,
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly cardColorClassService: CardColorClassService,
        private readonly browserLanguageService: BrowserLanguageService,
        private readonly accountService: AccountService,
        private readonly router: Router,
        private readonly crowdfundingService: CrowdfundingService,
        private readonly shareLinkService: ShareLinkService,
        private readonly translationConstants: TranslationConstants,
        private readonly customSnackbar: CustomSnackbarComponent
    ) {}

    public ngOnInit(): void {
        this.usefulSettings = {
            fiatCurrency: this.accountService.getFiatCurrency(),
            selectedLanguage: this.browserLanguageService.getBrowserLanguage(),
        };
        this.getCrowdfundings();
    }

    public async ngAfterViewInit(): Promise<void> {
        setTimeout(async () => {
            this.swiperReady();
            this.swiper?.update();

            this.changeDetectorRef.detectChanges();
        }, 200);
    }

    public swiperReady(): void {
        this.swiper = this.swiperRef?.nativeElement?.swiper;
    }

    public getCrowdfundings(): void {
        this.loading = true;
        this.crowdfundingService
            .getCrowdfundings()
            .subscribe((projects) => {
                projects.forEach((project) => {
                    const totalDays: number = calculateDaysDifference(
                        this.currentDate,
                        project.finalDate as any
                    );
                    project.daysRemaining = totalDays;
                });

                this.projectList = projects.filter(
                    (project) => project.status === ECrowdfundingStatus.ACTIVE
                );
            })
            .add(() => {
                this.loading = false;
                this.calcInvestment();
            });
    }

    public getCardColorClass(remaining: number): CardClass {
        return this.cardColorClassService.getCardColorClass(remaining);
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

    public goToLogin(): void {
        this.router.navigate(['/account']);
    }

    public goToSignUp(): void {
        this.router.navigate(['/account/sign-up']);
    }

    public goToElement(elementId: string): void {
        if (elementId === 'offers') {
            this.router.navigate(['/crowdfunding']);
        } else {
            const el: HTMLElement | null = document.getElementById(elementId);
            if (el) {
                el?.scrollIntoView({
                    behavior: 'smooth',
                });
            }
        }
    }

    public onMouseEnter(identifier: string): void {
        this.isHovered[identifier] = true;
    }

    public onMouseLeave(identifier: string): void {
        this.isHovered[identifier] = false;
    }

    public goToUrl(url: string): void {
        window.open(url, '_blank');
    }

    public openWhatsApp(): void {
        this.shareLinkService.openWhatsApp(environment.contactUsPhone);
    }

    public showError(formName: string, form: FormGroup): boolean {
        return showErrorForInputs(formName, form);
    }

    public sendEmailNewsletter(): void {
        this.loading = true;
        this.accountService
            .sendNewsLetter(this.formNewsletter.value.email as string)
            .subscribe(
                (dt) => {
                    this.customSnackbar.open(
                        this.translationConstants.translate(
                            'home.snackbar.newsLetterSuccess'
                        ),
                        SnackBarTheme.success
                    );
                },
                (error) => {
                    this.customSnackbar.open(
                        this.translationConstants.translate(
                            `home.snackbar.newsLetterError`
                        ),
                        SnackBarTheme.error,
                        4000
                    );
                }
            )
            .add(() => (this.loading = false));
    }

    public calcInvestment(): void {
        this.viewROIEighteenMonths = this.calcROI(this.investment, 18);
        this.viewROIThirtyTwoMonthss = this.calcROI(this.investment, 32);
        this.viewROIFortyEightMonths = this.calcROI(this.investment, 48);
    }

    public calcROI(investmentValue: number, months: number): number {
        const taxMonth: number = this.rentability / 100 / 12;
        return investmentValue + investmentValue * taxMonth * months;
    }

    public allowOnlyNumbers(event: KeyboardEvent): void {
        this.onlyAllowNumbers(event, false, 20);
    }

    public onlyAllowNumbers(
        event: any,
        allowDecimal: boolean = true,
        maxLength: number = 14
    ): void {
        if (!allowDecimal) {
            // Allow Only Numbers
            if (
                event?.target?.value?.length >= maxLength ||
                !(event.charCode >= 48 && event.charCode <= 57)
            ) {
                event.preventDefault();
            }
        } else {
            //Allow Numbers, dot and comma.
            if (
                event?.target?.value?.length >= maxLength ||
                !(
                    (event.charCode >= 48 && event.charCode <= 57) ||
                    event.charCode == 44 ||
                    event.charCode == 46
                )
            ) {
                event.preventDefault();
            }
        }
    }
}

interface IFormNewsletter {
    email: FormControl<string | null>;
}
