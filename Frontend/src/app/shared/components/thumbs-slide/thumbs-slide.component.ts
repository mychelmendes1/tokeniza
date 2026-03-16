import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IMidias } from '../photos-slide/photos-slide.component';
import { MediaType } from '../../models/media-type.enum';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';

@Component({
    selector: 'app-thumbs-slide',
    imports: [
        SharedModule,
        CommonModule,
        RouterModule
    ],
    templateUrl: './thumbs-slide.component.html',
    styleUrl: './thumbs-slide.component.scss'
})
export class ThumbsSlideComponent {
    @Input() public midias: IMidias[] | undefined = [];
    @Input() public selectedPic: number = 0;
    @Input() public showPicValue: number = 0;
    @Output() public changePic: EventEmitter<number> = new EventEmitter<number>();
    public midiaType: typeof MediaType = MediaType;

    constructor(
        private sanitizer: DomSanitizer
    ) { }

    public canShowImage(index: number): boolean {
        return index < this.showPicValue && index >= (this.showPicValue - 4);
    }

    public showPrevious(): void {
        if (this.selectedPic === 0) {
            this.changePic.emit((this.midias?.length ?? 0) - 1)
        } else if (this.selectedPic > 0) {
            this.changePic.emit(this.selectedPic - 1);
        } else if ((this.showPicValue - 4) > 0) {
            this.showPicValue = this.showPicValue - 1;
        }
    }

    public showNext(): void {
        if (this.selectedPic === (this.midias?.length ?? 0) - 1) {
            this.changePic.emit(0)
        } else if (this.selectedPic < ((this.midias?.length ?? 0) - 1)) {
            this.changePic.emit(this.selectedPic + 1);
        }
        else if (this.showPicValue < (this.midias?.length ?? 0)) {
            this.showPicValue++;
        }
    }

    public setPic(index: number): void {
        this.changePic.emit(index);
    }

    public getSafeUrl(midia: IMidias): SafeStyle {
        if (midia?.type === MediaType.VIDEO) {
            const videoId: string = midia.url?.split('=')[1];
            const styleUrl: string = `url(http://img.youtube.com/vi/${videoId}/default.jpg)`;
            return this.sanitizer.bypassSecurityTrustStyle(styleUrl);
        }
        return this.sanitizer.bypassSecurityTrustStyle('');
    }
}