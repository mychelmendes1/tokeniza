import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { MaterialModule } from './material/material.module';
import { TranslateModule } from '@ngx-translate/core';
import { NgxCurrencyDirective, NgxCurrencyInputMode, provideEnvironmentNgxCurrency } from 'ngx-currency';
import { OnlyLettersAndSpaceDirective } from './directives/only-letters-and-space.directive';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { ComponentsModule } from './components/components.module';
import { QRCodeComponent } from 'angularx-qrcode';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CustomSnackbarComponent } from './custom-snackbar/custom-snackbar.component';
import { OnlyNumbersDirective } from './directives/only-numbers.directive';
import { PipesModule } from './pipes/pipes.module';
import { MaskCurrencyDirective } from './directives/mask-currency.directive';
import { MaskTokenDirective } from './directives/mask-token.directive';
import { MaskTokenNftDirective } from './directives/mask-token-nft.directive';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { PaginatorTranslationService } from './services/util/paginator-translation.service';

@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        RouterModule,
        MaterialModule,
        TranslateModule,
        ReactiveFormsModule,
        NgxCurrencyDirective,
        OnlyLettersAndSpaceDirective,
        OnlyNumbersDirective,
        NgxMaskDirective,
        NgxMaskPipe,
        QRCodeComponent,
        CustomSnackbarComponent,
        NgxSkeletonLoaderModule,
        PipesModule,
        MaskCurrencyDirective,
        MaskTokenDirective,
        MaskTokenNftDirective
    ],
    exports: [
        CommonModule,
        RouterModule,
        MaterialModule,
        TranslateModule,
        ReactiveFormsModule,
        NgxCurrencyDirective,
        OnlyLettersAndSpaceDirective,
        OnlyNumbersDirective,
        NgxMaskDirective,
        NgxMaskPipe,
        ComponentsModule,
        QRCodeComponent,
        CustomSnackbarComponent,
        NgxSkeletonLoaderModule,
        PipesModule,
        MaskCurrencyDirective,
        MaskTokenDirective,
        MaskTokenNftDirective
    ],
    providers: [
        provideNgxMask(),
        CustomSnackbarComponent,
        provideEnvironmentNgxCurrency({
            align: "left",
            allowNegative: false,
            allowZero: true,
            decimal: ",",
            precision: 2,
            prefix: "R$ ",
            suffix: "",
            thousands: ".",
            nullable: true,
            min: null,
            max: null,
            inputMode: NgxCurrencyInputMode.Financial,
        }),
        {
            provide: MatSnackBarRef,
            useValue: {}
        }, {
            provide: MAT_SNACK_BAR_DATA,
            useValue: {}
        },
        {
            provide: MatPaginatorIntl,
            useClass: PaginatorTranslationService
        }
    ]
})
export class SharedModule { }