import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CpfCnpjPipe } from './cpf.cnpj.pipe';
import { FloorCurrencyPipe } from './floor-currency.pipe';
import { FloorNumberPipe } from './floor-number.pipe';

@NgModule({
    imports: [
        CommonModule,
        CpfCnpjPipe,
        FloorCurrencyPipe,
        FloorNumberPipe,
    ],
    exports: [
        CpfCnpjPipe,
        FloorCurrencyPipe,
        FloorNumberPipe,
    ],
})
export class PipesModule { }
