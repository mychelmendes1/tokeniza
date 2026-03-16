import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class FormatStringService {

    public maskedAmountValue(max: number): string[] {
        return new Array(max).fill('•');
    }

    public maskedLocalPartEmail(email: string): string {
        if (!email) {
            return '';
        }

        const [localPart, domain]: string[] = email.split('@');
        const maskedLocalPart: string = localPart.slice(0, 2) + '*'.repeat(localPart.length - 2);

        return `${maskedLocalPart}@${domain}`;
    }

    public getEllipsisInTheMiddle(string: string | undefined, maxLength: number = 6) {
        if (!string || maxLength < 1 || string.length <= maxLength) {
            return string;
        }

        if (maxLength === 1) {
            return string.substring(0, 1) + '...';
        }
    
        var middlePoint = Math.ceil(string.length / 2);
        var quantityToHide = string.length - maxLength;
        var leftString = Math.ceil(quantityToHide / 2);
        var rightString = quantityToHide - leftString;
        return `${string.substring(0, middlePoint - leftString)}...${string.substring(middlePoint + rightString)}`;
    }
}