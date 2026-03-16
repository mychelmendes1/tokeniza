import { CommonModule, Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MenuButtonMobileComponent } from '../../shared/components/menu-button-mobile/menu-button-mobile.component';
import { HoverIconClassService } from '../../shared/services/util/hover-icon-class.service';
import { PhotosSlideComponent } from '../../shared/components/photos-slide/photos-slide.component';
import { ThumbsSlideComponent } from '../../shared/components/thumbs-slide/thumbs-slide.component';
import { CardClass, CardColorClassService } from '../../shared/services/util/card-color-class.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { showErrorForInputs } from '../../shared/validators/form-group.validators';
import { MatTableModule } from '@angular/material/table';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { CrowdfundingService } from '../../shared/services/crowdfunding/crowdfunding.service';
import { CrowdfundingCompanyDetails, ECrowdfundingStatus, IProjectCrowdfunding, TypeOfRiskCrowdFunding } from '../../shared/models/IProjectCrowdfunding.model';
import { calculateDaysDifference, formatCrowdfundingDate } from '../../shared/services/util/date-converter.service';
import { usefulSettings } from '../../shared/models/useful-settings.model';
import { AccountService } from '../../shared/services/account/account.service';
import { LanguagesEnum } from '../../shared/models/languages.enum';
import { BrowserLanguageService } from '../../shared/services/util/browser-language.service';
import { environment } from '../../../environments/environments';
import { CommentListComponent } from '../../shared/components/comment-list/comment-list.component';
import { ICreateComment } from '../../shared/models/IComments';
import { TranslationConstants } from '../../shared/services/util/translation.service';
import { CustomSnackbarComponent, SnackBarTheme } from '../../shared/custom-snackbar/custom-snackbar.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CrowdfundingCheckoutModalComponent } from '../../shared/modals/crowdfunding-checkout-modal/crowdfunding-checkout-modal.component';
import { UserLoggedModel } from '../../shared/models/user.logged.model';
import { ShareLinkService } from '../../shared/services/util/share-link.service';
import { IContactDetails } from '../../shared/models/IContactDetails';
import { ConfigReaderService } from '../../shared/services/util/config.reader.service';
import { forkJoin, mergeMap, Observable } from 'rxjs';
import { ErrorPageComponent } from '../../shared/components/error-page/error-page.component';

@Component({
    selector: 'app-details',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule,
        MenuButtonMobileComponent,
        PhotosSlideComponent,
        ThumbsSlideComponent,
        MatTableModule,
        CommentListComponent,
        ErrorPageComponent
    ],
    templateUrl: './details.component.html',
    styleUrl: './details.component.scss'
})
export class DetailsComponent implements OnInit {

    public showErrorPage: boolean = false;
    public loading: boolean = false;
    public loadingRequest: boolean = false;
    public showPicValue: number = 4;
    public selectedPic: number = 0;
    public faqList: Array<string> = [
        'guarantee',
        'fgc',
        'investmentsContract',
        'tributation',
        'deadline',
        'howItWorkTheInvestment',
        'investmentGuarantee',
        'investmentFollow',
        'annualReport',
        'incomeTax',
        'newsProjects',
        'reserveInvestment'
    ];
    public formForum: FormGroup<IFormForum> = new FormGroup<IFormForum>({
        doubt: new FormControl<string>('', { validators: [Validators.required, Validators.minLength(20), Validators.maxLength(250)] })
    });
    public project: IProjectCrowdfunding = Object() as IProjectCrowdfunding;
    public showPublicButton: boolean = false;
    public crowdfundingCompany: CrowdfundingCompanyDetails = Object() as CrowdfundingCompanyDetails;
    public currentDate = new Date();
    public usefulSettings: usefulSettings = new usefulSettings();
    public eLanguage: typeof LanguagesEnum = LanguagesEnum;
    public eStatus: typeof ECrowdfundingStatus = ECrowdfundingStatus;
    public crowdFundingId: string = '';
    public user: UserLoggedModel = Object() as UserLoggedModel;
    public contactDetails: IContactDetails | null = null;
    public midasLink: string = '';
    public hasCeoContact: boolean = false;
    public whatsContact: string = '';
    public startDate: string = '';
    public finalDate: string = '';

    public allowedEmailsToInsertComments = [
        'glauciane-martins2@hotmail.com',
        'nathaliacosta.adv@outlook.com',
        'tayara@grupoblue.com.br',
        'Arthur@blueconsult.com.br',
        'fcchagass@gmail.com',
        // 'thiago.fm012@gmail.com'
    ];

    constructor(
        private readonly router: Router,
        private readonly activatedRoute: ActivatedRoute,
        private readonly location: Location,
        public hoverIconClassService: HoverIconClassService,
        private readonly cardColorClassService: CardColorClassService,
        private readonly crowdfundingService: CrowdfundingService,
        private readonly accountService: AccountService,
        private readonly browserLanguageService: BrowserLanguageService,
        private readonly translationConstants: TranslationConstants,
        private readonly customSnackbar: CustomSnackbarComponent,
        private readonly dialog: MatDialog,
        private readonly shareLinkService: ShareLinkService,
        private readonly myConfigReader: ConfigReaderService
    ) { }

    public ngOnInit(): void {
        this.usefulSettings = {
            fiatCurrency: this.accountService.getFiatCurrency(),
            selectedLanguage: this.browserLanguageService.getBrowserLanguage()
        }
        this.initData();
    }

    public initData(): void {
        this.activatedRoute.params.subscribe(params => {
            this.crowdFundingId = params['id'];
        });

        this.loading = true;
        forkJoin([
            this.crowdfundingService.getCrowdfunding(this.crowdFundingId),
            this.crowdfundingService.getCrowdfundingCompanyDetails(this.crowdFundingId),
            this.myConfigReader.getAllExternalLinks(),
            this.accountService.isAuthenticated(false, false),
            this.myConfigReader.getContactDetails()
        ]).subscribe({
            next: ([crowdfunding, crowdfundingCompany, links, authenticated, contactDetails]) => {
                if (crowdfunding) {

                    this.project = crowdfunding;
                    this.startDate = this.formatDateFromISOString(this.project.startDate as any);
                    this.finalDate = this.formatDateFromISOString(this.project.finalDate as any);

                    this.project.comments = crowdfunding?.comments?.filter((comment: any) => {
                        if (!comment.parent && !comment.child) {
                            return true;
                        }

                        if (comment.parent?.length == 0 && comment.child?.length == 0) {
                            return true;
                        }

                        if (comment.parent?.length > 0 && comment.child?.length > 0) {
                            return true;
                        }
                        return false;
                    }).sort((a: any, b: any) => {
                        return new Date(b.when).getTime() - new Date(a.when).getTime();
                    });


                    if (this.project?.moneyReceived != null && this.project?.targetCapture != null) {
                        const percentage = (Number(this.project.moneyReceived) / Number(this.project.targetCapture)) * 100;
                        this.project.targetAmountPercentage = Math.min(percentage, 100); // Limita a 100%
                    } else {
                        this.project.targetAmountPercentage = 0;
                    }

                    const totalDays: number = this.calculateDaysDifference(this.currentDate, this.project.finalDate as any);
                    this.project.daysRemaining = totalDays;
                }

                if (crowdfundingCompany?.id) {
                    this.showPublicButton = true;
                    this.crowdfundingCompany = crowdfundingCompany;
                }

                this.contactDetails = new IContactDetails(contactDetails);
                this.midasLink = links?.midasWebRedirects?.midasWebBuy || '';
                this.whatsContact = contactDetails?.ceoWhatsapp ? contactDetails?.ceoWhatsapp : contactDetails?.tawkTo || '';
                this.hasCeoContact = !!contactDetails?.ceoWhatsapp;
                if (authenticated) {
                    this.accountService.getLoggedUserDetails().subscribe(userDetails => {
                        this.user = userDetails;
                    });
                }
            },
            error: (error) => {
                console.log(error?.error?.message)
                if (error?.error?.message === 'User must be logged in!') {
                    this.router.navigate(['/account/login'], {
                        queryParams: {
                            redirectUrl: this.router.url,
                        }
                    });
                    return;
                }

                if (error?.error?.message === 'User should not see this private operation!') {
                    this.router.navigate(['/home'], {
                    });
                    return;
                }

                if (error) {
                    this.showErrorPage = true;
                }
            },
            complete: () => {
                this.loading = false;
            }
        });
    }

    public calculateDaysDifference(start: Date, end: Date): number {
        return calculateDaysDifference(start, end);
    }

    public goToWallet(): void {
        this.router.navigate(['/wallet']);
    }

    public backPage(): void {
        this.location.back();
    }

    public changeSelectedPic(index: number) {
        if ((index + 1) > this.showPicValue) this.showPicValue = index + 1;
        if (index < (this.showPicValue - 4)) {
            this.showPicValue = index < 4 ? 4 : index;
        }
        this.selectedPic = index;
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

    public showError(formName: string, form: FormGroup): boolean {
        return showErrorForInputs(formName, form);
    }

    public scrollToSelectedTab(tab: string) {
        setTimeout(() => {
            const element: HTMLElement | null = document.getElementById(tab);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }, 0)
    };

    public onTabChange(event: MatTabChangeEvent): void {
        const tabIds: string[] = ['description', 'scenarios', 'documents', 'doubts', 'infos', 'forum', 'disclaimer'];
        this.scrollToSelectedTab(tabIds[event.index]);
    }

    public opentechnicalBlade(): void {
        let doc: { url: string, name: string } | undefined = this.project.documents?.find(doct => doct.name?.toLocaleLowerCase()?.includes('technicalblade'));
        window.open(doc?.url, '_blank');
    }

    public openDocument(url: string): void {
        window.open(url, '_blank');
    }

    public aboutUs(): void {
        window.open(this.project.companyWebsite, '_blank');
    }

    public translateRisk(risk: TypeOfRiskCrowdFunding): string {
        if (!risk) {
            return '';
        } else if (risk === TypeOfRiskCrowdFunding.MINIMUM) {
            return 'crowdfunding.typeOfRisk.minimum';
        } else if (risk === TypeOfRiskCrowdFunding.MEDIUM) {
            return 'crowdfunding.typeOfRisk.medium';
        } else {
            return 'crowdfunding.typeOfRisk.high';
        }
    }

    public getCompanyName(): string {
        return environment.pageTitle;
    }

    public comment(): void {
        const itemComment: ICreateComment = {
            comment: this.formForum.value.doubt as string,
            item_id: this.project?.id,
        };

        this.loadingRequest = true;
        this.crowdfundingService.commentItem(itemComment).subscribe(
            () => {
                this.customSnackbar.open(
                    this.translationConstants.translate(this.translationConstants.translate('snackbar.success')),
                    SnackBarTheme.success
                );

                this.clearDoubt();
                this.initData();
            },
            () => {
                this.customSnackbar.open(
                    this.translationConstants.translate(this.translationConstants.translate('snackbar.error')),
                    SnackBarTheme.error
                );
            }
        ).add(() => {
            this.loadingRequest = false;
        });
    }

    public isAllowedUser(): boolean {
        if (!this.user || !this.user.email) {
            return false;
        }
        return this.allowedEmailsToInsertComments.includes(this.user.email);
    }

    public openCheckoutModal(): void {
        this.accountService.isAuthenticated(false).subscribe(auth => {
            if(auth) {
                const dialogRef: MatDialogRef<CrowdfundingCheckoutModalComponent> = this.dialog.open(CrowdfundingCheckoutModalComponent, {
                    data: {
                        id: this.crowdFundingId
                    }
                });
            }
        });
    }

    public clearDoubt(): void {
        this.formForum.patchValue({
            doubt: ''
        });

        this.formForum.controls.doubt.reset();
        this.formForum.controls.doubt.updateValueAndValidity();
    }

    public reloadCommentsList(event: boolean) {
        if (event) {
            this.initData();
        }
    }

    public openWhatsContact(): void {
        if (this.whatsContact) {
            this.shareLinkService.openWhatsApp(this.whatsContact as string);
        }
    }

    public shareCrowdfunding(): void {
        if (this.midasLink) {
            const linkToCrowdfunding: string = `${this.midasLink}/crowdfunding/details/${this.crowdFundingId}`;
            this.shareLinkService.shareWhatsapp('', true, linkToCrowdfunding);
        }
    }

    public formatDateFromISOString = (isoString: string): string => {
        return formatCrowdfundingDate(
            isoString,
            this.usefulSettings.selectedLanguage === this.eLanguage.PORTUGUESE ? 'pt-BR' : 'en-US'
        );
    };
}

interface IFormForum {
    doubt: FormControl<string | null>;
}