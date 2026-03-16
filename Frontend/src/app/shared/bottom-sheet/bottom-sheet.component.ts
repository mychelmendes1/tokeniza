import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { SharedModule } from '../shared.module';
import { RouterModule } from '@angular/router';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';

@Component({
    selector: 'app-bottom-sheet',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    templateUrl: './bottom-sheet.component.html',
    styleUrl: './bottom-sheet.component.scss'
})
export class BottomSheetComponent {

    constructor(
        private readonly bottomSheetRef: MatBottomSheetRef<BottomSheetComponent>,
        @Inject(MAT_BOTTOM_SHEET_DATA) public data: BottomSheetModel
    ) {}

    public clearBar(): void {
        this.bottomSheetRef.dismiss(false);
    }

    public confirmOperation(): void {
        this.bottomSheetRef.dismiss(true);
    }

    public close(): void {
        this.bottomSheetRef.dismiss();
    }
}

class BottomSheetModel {
    public text!: string;
    public declineOption!: string;
    public confirmOption!: string;
    public close?: boolean;
}