import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ImagePreloaderService {

    constructor() { }

    public preloadImage(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const img: HTMLImageElement = new Image();
            img.src = url;
            img.onload = () => resolve();
            img.onerror = () => reject(`Failed to load image: ${url}`);
        });
    }

    public preloadImages(urls: string[]): Promise<void[]> {
        return Promise.all(urls.map(url => this.preloadImage(url)));
    }
}