import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { ValueConverterService } from '../services/util/value-converter.service';

@Directive({
    selector: '[appMaskCurrency]'
})
export class MaskCurrencyDirective {
    @Input() public withCurrency: boolean = true;

    constructor(private el: ElementRef,
        public readonly valueConverterService: ValueConverterService,
    ) { }

    @HostListener('input', ['$event'])
    public inputChange(event: any): void {
        this.onInputChange(event.target.value);
    }

    public onInputChange(originalValue: any) {
        let newVal = this.valueConverterService.formatMonetaryInput(originalValue, this.withCurrency);
        if (newVal){
            this.el.nativeElement.value = newVal;
        }
    }
}
