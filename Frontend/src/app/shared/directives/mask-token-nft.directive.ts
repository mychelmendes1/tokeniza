import { Directive, ElementRef, HostListener } from '@angular/core';
import { ValueConverterService } from '../services/util/value-converter.service';
import { environment } from '../../../environments/environments';

@Directive({
    selector: '[appMaskTokenNft]'
})
export class MaskTokenNftDirective {

    constructor(
        private el: ElementRef,
        public readonly valueConverterService: ValueConverterService
    ) { }

    @HostListener('input', ['$event'])
    public inputChange(event: any): void {
        this.onInputChange(event.target.value);
    }

    /**
     * It formats a given number into a decimal number with 6 decimal places. E.g. 7815000 returns 7,815000
     * @param originalValue 
     */
    public onInputChange(originalValue: string): void {
        let newVal = this.valueConverterService.toStringFormat(originalValue, environment.decimalsPlacesBought);
        if (newVal){
            this.el.nativeElement.value = newVal;
        }
    }
}
