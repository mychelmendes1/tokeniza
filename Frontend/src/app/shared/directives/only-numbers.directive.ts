import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
    selector: '[OnlyNumbers]'
})
export class OnlyNumbersDirective {
    private _allowedSpecialChars: string[] = [];

    @Input()
    public set allowedSpecialChars(value: string) {
        if (typeof value === 'string' && value.length > 0) {
            this._allowedSpecialChars = value.split('');
        } else {
            this._allowedSpecialChars = [];
        }
    }

    constructor(
        private el: ElementRef
    ) { }

    @HostListener('input', ['$event'])
    public onInputChange(event: any): void {
        const inputValue = this.el.nativeElement.value;

        // Regular expression to allow only numbers and the specified special characters
        const allowedChars = this._allowedSpecialChars.map(char => '\\' + char).join('');
        const regexPattern = new RegExp(`[^0-9${allowedChars}]*`, 'g');
        const sanitizedValue = inputValue.replace(regexPattern, '');

        if (sanitizedValue !== inputValue) {
            this.el.nativeElement.value = sanitizedValue;
            this.el.nativeElement.dispatchEvent(new Event('input'));
            event.stopPropagation();
        }
    }
}