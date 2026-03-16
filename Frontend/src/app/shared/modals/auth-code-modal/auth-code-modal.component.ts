import { CommonModule } from '@angular/common';
import { Component, ViewChildren, QueryList, ElementRef, AfterViewInit, Inject } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { RouterModule } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HoverIconClassService } from '../../services/util/hover-icon-class.service';

@Component({
    selector: 'app-auth-code-modal',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    templateUrl: './auth-code-modal.component.html',
    styleUrl: './auth-code-modal.component.scss'
})
export class AuthCodeModalComponent implements AfterViewInit {

    @ViewChildren('inputValue') public inputElements!: QueryList<ElementRef<HTMLInputElement>>;
    public numberAuthCodeInput: number[] = Array(6).fill(0);
    public inputCode: string[] = Array(6).fill('');
    public filledInputsCount: number = 0;
    public email: boolean = false;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<AuthCodeModalComponent>,
        public hoverIconClassService: HoverIconClassService,
    ) {}

    public ngOnInit(): void {
        this.dialogRef.disableClose = true;
        this.dialogRef.addPanelClass(['custom-modal', 'auth-code-modal']);

        if(this.data) {
            this.email = true;
        }
    }

    public ngAfterViewInit(): void {
        this.inputElements.first?.nativeElement.focus();
    }

    public filledInput(value: string, index: number): void {
        this.inputCode[index] = value;

        let lastFilledIndex: number = this.inputCode.reduce((lastIndex, val, i) => val !== '' ? i : lastIndex, -1);
        this.filledInputsCount = lastFilledIndex + 1;

        if (value !== '' && index < this.numberAuthCodeInput.length - 1) {
            setTimeout(() => {
                this.inputElements.get(index + 1)?.nativeElement.focus();
            }, 10);
        }

        this.checkInputCode();
    }

    public reset(): void {
        this.inputCode = Array(6).fill('');
        this.filledInputsCount = 0;
        setTimeout(() => {
            this.inputElements.first?.nativeElement.focus();
        }, 10);
    }

    public async pasteCode(): Promise<void> {
        const clipboardText: string = await navigator.clipboard.readText();
        const code: string = clipboardText.replace(/\D/g, '').slice(0, this.inputCode.length);

        if (code.length === this.inputCode.length) {
            this.inputCode = code.split('');
            this.filledInputsCount = this.inputCode.length;

            this.inputElements.forEach((input, index) => {
                input.nativeElement.value = this.inputCode[index];
            });

            this.checkInputCode();
        }
    }

    public checkInputCode(): void {
        if (this.inputCode.every(val => val !== '')) {
            this.dialogRef.close(this.inputCode.join(''));
        }
    }
}