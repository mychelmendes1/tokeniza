import { Component, OnInit } from '@angular/core';
import { CustomSnackbarComponent, SnackBarTheme } from '../shared/custom-snackbar/custom-snackbar.component';
import { TranslationConstants } from '../shared/services/util/translation.service';
import { AccountService } from '../shared/services/account/account.service';
import { UserLoggedModel } from '../shared/models/user.logged.model';
import { ConfigReaderService } from '../shared/services/util/config.reader.service';
import { forkJoin } from 'rxjs';
import { IDigitalBankingConfigs } from '../shared/models/IDigitalBankingConfigs';
import { MatTableDataSource } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { Router, RouterModule } from '@angular/router';
import { MenuButtonMobileComponent } from '../shared/components/menu-button-mobile/menu-button-mobile.component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

@Component({
    selector: 'app-income-report',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule,
        MenuButtonMobileComponent
    ],
    templateUrl: './income-report.component.html',
    styleUrl: './income-report.component.scss'
})
export class IncomeReportComponent implements OnInit {
    public loading: boolean = false;
    public loadingRequest: boolean = false;
    public userDetails!: UserLoggedModel | undefined;
    public configs!: IDigitalBankingConfigs;
    public irpf: { unitOfMoney: string, baseYear: number, isNft: boolean, endYear: number, quantityBaseYear: number, quantityLastYear: number }[] = [];
    public dataSource: MatTableDataSource<{ unitOfMoney: string, baseYear: number,isNft: boolean,  endYear: number, quantityBaseYear: number, quantityLastYear: number }> = new MatTableDataSource(this.irpf);
    public displayedColumns: Array<string> = ['group', 'code', 'unit', 'quantityBase', 'balanceBase', 'quantityEnd', 'balanceEnd'];
    public lastYearNumber = new Date().getFullYear() - 1;
    public otherYearNumber = new Date().getFullYear() - 2;
    public config!: IDigitalBankingConfigs;

    constructor(
        private readonly router: Router,
        private readonly accountService: AccountService,
        private readonly customSnackbarComponent: CustomSnackbarComponent,
        private readonly translationConstants: TranslationConstants,
        private readonly configReaderService: ConfigReaderService
    ) { }

    public ngOnInit(): void {
        this.accountService.getLoggedUserDetails().subscribe(user => {
            this.userDetails = user;
        });

        this.loading = true;
        forkJoin([
            this.accountService.getIRPF(),
            this.configReaderService.getDigitalBankingConfigs()
        ]).subscribe(([irpfResp, configsResp]) => {
            this.irpf = irpfResp;
            this.dataSource.data = this.irpf;
            this.config = configsResp;
        }, error => {

        }).add(() => {
            this.loading = false;
        });
    }

    public goToWallet(): void {
        this.router.navigate(['/wallet']);
    }

    public async downloadPDF(paddingTop = 15, paddingBottom = 15): Promise<void> {
        this.loading = true;
        await this.convertImagesToBase64();

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const paddingX = 15;
        const usableWidth = pageWidth - (paddingX * 2);

        const tableContainer: any = document.getElementById('irpf');
        const originalWidth = tableContainer?.style?.width;
        
        if (tableContainer) {
            tableContainer.style.width = '1280px';
        }

        // HEADER
        const headerElement: any = document.getElementById('header');
        const headerCanvas = await html2canvas(headerElement, { scale: 2, useCORS: true });
        const headerImg = headerCanvas.toDataURL('image/png');
        const headerHeight = (headerCanvas.height * usableWidth) / headerCanvas.width;
        doc.addImage(headerImg, 'PNG', paddingX, paddingTop, usableWidth, headerHeight);

        // FOOTER
        const footerEl = document.getElementById('footer-content');
        if (!footerEl) {
            this.loading = false;
            return;
        }

        const footerCanvas = await html2canvas(footerEl, { scale: 2, useCORS: true });
        const footerImg = footerCanvas.toDataURL('image/png');
        const footerHeight = (footerCanvas.height * usableWidth) / footerCanvas.width;

        autoTable(doc, {
            html: '#irTable',
            styles: {
                halign: 'center'
            },
            headStyles: {
                lineColor: '#ffffff',
                fillColor: '#7cd60a'
            },
            margin: {
                top: paddingTop + headerHeight + 10,
                bottom: paddingBottom + footerHeight + 10
            },
            didDrawPage: () => {
                // Header
                doc.addImage(headerImg, 'PNG', paddingX, paddingTop, usableWidth, headerHeight);

                // Footer
                doc.addImage(
                    footerImg,
                    'PNG',
                    paddingX,
                    pageHeight - paddingBottom - footerHeight,
                    usableWidth,
                    footerHeight
                );

                // Página
                const pageNumber = doc.internal.pages.length - 1;
                const pageLabel = `${this.translationConstants.translate('incomeReport.page')} ${pageNumber}`;
                doc.setFontSize(10);
                doc.setTextColor(100);
                const textWidth = doc.getTextWidth(pageLabel);
                doc.text(
                    pageLabel,
                    (pageWidth - textWidth) / 2,
                    pageHeight - paddingBottom - footerHeight - 2
                );
            }
        });

        tableContainer.style.width = originalWidth as string;
        this.loading = false;
        doc.save('irpf.pdf');
    }

    public async printPDF(paddingTop = 15, paddingBottom = 15): Promise<void> {
        this.loading = true;
        await this.convertImagesToBase64();

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const paddingX = 15;
        const usableWidth = pageWidth - (paddingX * 2);

        const tableContainer: any = document.getElementById('irpf');
        const originalWidth = tableContainer?.style?.width;
        
        if (tableContainer) {
            tableContainer.style.width = '1280px';
        }

        // HEADER
        const headerElement: any = document.getElementById('header');
        const headerCanvas = await html2canvas(headerElement, { scale: 2, useCORS: true });
        const headerImg = headerCanvas.toDataURL('image/png');
        const headerHeight = (headerCanvas.height * usableWidth) / headerCanvas.width;
        doc.addImage(headerImg, 'PNG', paddingX, paddingTop, usableWidth, headerHeight);

        // FOOTER
        const footerEl = document.getElementById('footer-content');
        if (!footerEl) {
            this.loading = false;
            return;
        }

        const footerCanvas = await html2canvas(footerEl, { scale: 2, useCORS: true });
        const footerImg = footerCanvas.toDataURL('image/png');
        const footerHeight = (footerCanvas.height * usableWidth) / footerCanvas.width;

        autoTable(doc, {
            html: '#irTable',
            styles: {
                halign: 'center'
            },
            headStyles: {
                lineColor: '#ffffff',
                fillColor: '#7cd60a'
            },
            margin: {
                top: paddingTop + headerHeight + 10,
                bottom: paddingBottom + footerHeight + 10
            },
            didDrawPage: () => {
                // Header
                doc.addImage(headerImg, 'PNG', paddingX, paddingTop, usableWidth, headerHeight);

                // Footer
                doc.addImage(
                    footerImg,
                    'PNG',
                    paddingX,
                    pageHeight - paddingBottom - footerHeight,
                    usableWidth,
                    footerHeight
                );

                // Página
                const pageNumber = doc.internal.pages.length - 1;
                const pageLabel = `${this.translationConstants.translate('incomeReport.page')} ${pageNumber}`;
                doc.setFontSize(10);
                doc.setTextColor(100);
                const textWidth = doc.getTextWidth(pageLabel);
                doc.text(
                    pageLabel,
                    (pageWidth - textWidth) / 2,
                    pageHeight - paddingBottom - footerHeight - 2
                );
            }
        });

        // Impressão
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const printWindow = window.open(pdfUrl, '_blank');

        if (printWindow) {
            printWindow.addEventListener('load', () => {
                printWindow?.print();
            });
        } else {
            this.customSnackbarComponent.open(
                this.translationConstants.translate('incomeReport.errorProcessingPdf'),
                SnackBarTheme.error,
                4000
            );
        }
        tableContainer.style.width = originalWidth as string;
        this.loading = false;
    }

    private async convertImagesToBase64(): Promise<void> {
        const images: NodeListOf<HTMLImageElement> = document.querySelectorAll("img#pdf-image");
        const imageArray = Array.from(images);
        for (const img of imageArray) {
            if (!img.src.startsWith("data:image")) {
                const base64 = await this.getBase64Image(img.src);
                img.src = base64;
            }
        }
    }

    private getBase64Image(imgUrl: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = imgUrl;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0);
                resolve(canvas.toDataURL("image/png"));
            };
            img.onerror = reject;
        });
    }
}
