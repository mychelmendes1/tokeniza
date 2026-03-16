import { Injectable } from "@angular/core";
import { Assets } from "../../models/IAssets.model";
import { TranslationConstants } from "./translation.service";

@Injectable({
    providedIn: 'root'
})
export class CalculateRemainingAuctionTimeService {

    constructor(
        private readonly translationConstants: TranslationConstants
    ) { }

    public calculateRemainingAuctionTime(asset: Assets): string {
        if (!asset?.auction?.deadline) {
            return '';
        }

        const CURRENT_MOMENT: Date = new Date();
        const ASSET_DEADLINE: Date = this.returnFixedDate(asset.auction.deadline.toString());
        const TIME_DIFFERENCE: number = ASSET_DEADLINE.getTime() - CURRENT_MOMENT.getTime();

        let dayText: string = '';
        let hourText: string = '';

        if (TIME_DIFFERENCE > 0) {
            const totalMinutes: number = Math.floor(TIME_DIFFERENCE / 60000);
            const totalHours: number = Math.floor(totalMinutes / 60);
            const days: number = Math.floor(totalHours / 24);
            const hours: number = totalHours % 24;

            if (days > 1) {
                dayText = this.translationConstants.translate('myAssets.auction.days');
            } else {
                dayText = this.translationConstants.translate('myAssets.auction.day');
            }

            if (hours > 1) {
                hourText = this.translationConstants.translate('myAssets.auction.hours');
            } else {
                hourText = this.translationConstants.translate('myAssets.auction.hour');
            }

            const addConj: string = this.translationConstants.translate('myAssets.auction.and');

            return `${days} ${dayText} ${addConj} ${hours} ${hourText}`;
        } else {
            asset.auction.expired = true;
            return this.translationConstants.translate('myAssets.auction.timeExpired');
        }
    }

    /**
     * Receive a date like "2024-06-01T00:00:00.000Z"
     * Return a new Date without Timezone.
     * @param date 
     */
    private returnFixedDate(date: string): Date {
        const DATE_WITHOUT_TIMEZONE: string = date.split('T')[0]; // "2024-06-01T00:00:00.000Z" into "2024-06-01"
        const DATE_ARRAY_STRING: string[] = DATE_WITHOUT_TIMEZONE.split('-'); // "2024-06-01" into ["2024", "06", "01"]
        const formatedDate: Date = new Date();
        formatedDate.setDate(Number(DATE_ARRAY_STRING[2])); // Set date with the index 2, "01"
        formatedDate.setMonth(Number(DATE_ARRAY_STRING[1]) - 1); // Set month with the index 1, "06", but the month starts with 0, so remove 1 from the month.
        formatedDate.setFullYear(Number(DATE_ARRAY_STRING[0])); // Set date with the index 0, "2024"
        formatedDate.setHours(0, 0, 0, 0);

        return formatedDate;
    }
}