import { Directive, HostListener, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
    selector: '[onlyLettersAndSpace]'
})
export class OnlyLettersAndSpaceDirective {

    constructor(
        @Optional() private ngControl: NgControl
    ) { }

    @HostListener('input', ['$event']) onInput(event: Event): void {
        const inputValue: string = this.ngControl?.value;

        if (inputValue) {
            const sanitizedValue: string = inputValue.replace(/[^a-zA-ZÀ-ú\s]/g, '');

            if (sanitizedValue !== inputValue) {
                this.ngControl?.control?.setValue(sanitizedValue);
                event.stopPropagation();
            }
        }
    }
}