import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { RouterModule } from '@angular/router';
import { MediaType } from '../../models/media-type.enum';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
    selector: 'app-photos-slide',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    templateUrl: './photos-slide.component.html',
    styleUrl: './photos-slide.component.scss'
})
export class PhotosSlideComponent {

    @Input() public midias: IMidias[] | undefined = [];
    @Input() public selectedPic: number = 0;
    @Input() public showPicValue: number = 0;
    @Output() public changePic: EventEmitter<number> = new EventEmitter<number>();
    public midiaType: typeof MediaType = MediaType;

    constructor(
        private sanitizer: DomSanitizer
    ) { }

    public ngOnInit(): void {
        this.generateSafeUrls();
    }

    public generateSafeUrls(): void {
        for (let midia of this.midias as IMidias[]) {
            if (midia.type === MediaType.VIDEO && midia.url) {
                midia.safeUrl = this.getSafeResourceUrl(midia);
            }
        }
    }

    public getSafeResourceUrl(midia: IMidias): SafeResourceUrl {
        const videoId: string | null = this.extractYoutubeId(midia.url);
        return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`);
    }

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

    private extractYoutubeId(url: string): string | null {
        const regExp: RegExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match: RegExpMatchArray | null = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }
}

export interface IMidias {
    id?: string;
    name: string;
    url: string;
    type: MediaType;
    safeUrl?: SafeResourceUrl;
}