import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})

export class ShareLinkService {
    constructor() { }
    
    /**
     * Method used to open share via whatsapp
     * @param message Message to be sent next to the link of the current page.
     */
    public shareWhatsapp(message: string, shareLink: boolean = true, linkToShare?: string): void {
        const shareableLink: string = linkToShare ? linkToShare : window.location.href;

        const finalText: string = shareLink ? `${message} ${encodeURI(shareableLink)}` : message;
        const link: string = `https://wa.me/?text=${encodeURIComponent(finalText)}`;

        if (navigator.userAgent.match(/iPhone|Android/i)) {
            window.open(`whatsapp://send?text=${encodeURIComponent(finalText)}`, 'whatsapp-share');
        } else {
            window.open(link, 'whatsapp-share');
        }
    }

    /**
     * Open WhatsApp with default text.
     */
    public openWhatsApp(phoneNumber: string, defaultText?: string): Window | null {
        const formattedNumber: string = phoneNumber.replace(/\D/g, '').replace(/^55/, '');
        const formattedText: string = defaultText ? encodeURIComponent(defaultText) : '';
        return window.open(`https://wa.me/+55${formattedNumber}?text=${formattedText ?? ''}`);
    }
}