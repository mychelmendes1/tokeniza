import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuComponent } from './menu/menu.component';
import { DiditKycModalComponent } from './didit-kyc-modal/didit-kyc-modal.component';

@NgModule({
    imports: [
        CommonModule,
        MenuComponent,
        DiditKycModalComponent
    ],
    declarations: [
    ],
    exports: [
        MenuComponent,
        DiditKycModalComponent
    ]
})
export class ComponentsModule { }