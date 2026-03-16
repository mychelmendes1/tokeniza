/**
 * The method transforms the date from a string "11042023" or ISO string to a date in string with abbreviated week and month.
 * @param date 11042023 or ISO string
 * @param showWeekday Mon, Tue, Wed...
 * The navigator language parameter will identify the language defined by the user in his browser
 * and will carry out the correct translation for the abbreviation of the week and month.
 */
export function formatDateWithAbbreviatedMonth(date: string | Date, showWeekday: boolean = true): string {
    let dateObject: Date = new Date;

    if (typeof date === 'string' && date.includes('T')) {
        dateObject = new Date(date);
    } else if (typeof date === 'string') {
        const day: number = Number(date.slice(0, 2));
        const month: number = Number(date.slice(2, 4)) - 1;
        const year: number = Number(date.slice(4, 8));
        dateObject = new Date(year, month, day);
    } else {
        return '';
    }

    const dayOfMonth: string = dateObject.getUTCDate().toString().padStart(2, '0');
    let monthString: string = dateObject.toLocaleString(navigator.language, { month: 'short', timeZone: 'UTC' })?.replace('.', '');
    monthString = monthString.charAt(0).toUpperCase() + monthString.slice(1);
    const yearString: string = dateObject.getUTCFullYear().toString().slice(2);

    if (showWeekday) {
        const dayString: string = dateObject.toLocaleString(navigator.language, { weekday: 'short', timeZone: 'UTC' });
        const dayOfWeek: string = dayString.charAt(0).toUpperCase() + dayString.slice(1)?.replace('.', '');
        return `${dayOfWeek} ${dayOfMonth} ${monthString} ${yearString}`;
    }

    return `${dayOfMonth} ${monthString} ${yearString}`;
}

const DD_MM_YYYY_REGEX: RegExp = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const YYYY_MM_DD_REGEX: RegExp = /^(\d{4})-(\d{2})-(\d{2})$/;

function buildDate(day: number, month: number, year: number): Date | null {
    const parsedDate: Date = new Date(year, month - 1, day);

    if (
        parsedDate.getFullYear() !== year ||
        parsedDate.getMonth() !== month - 1 ||
        parsedDate.getDate() !== day
    ) {
        return null;
    }

    parsedDate.setHours(0, 0, 0, 0);
    return parsedDate;
}

export function parseDateValue(date?: string | Date | null): Date | null {
    if (!date) {
        return null;
    }

    if (date instanceof Date) {
        if (Number.isNaN(date.getTime())) {
            return null;
        }

        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    const value: string = String(date).trim();
    if (!value) {
        return null;
    }

    const datePart: string = value.includes('T') ? value.split('T')[0] : value;

    const ddMmYyyyMatch: RegExpMatchArray | null = datePart.match(DD_MM_YYYY_REGEX);
    if (ddMmYyyyMatch) {
        const day: number = Number(ddMmYyyyMatch[1]);
        const month: number = Number(ddMmYyyyMatch[2]);
        const year: number = Number(ddMmYyyyMatch[3]);

        return buildDate(day, month, year);
    }

    const yyyyMmDdMatch: RegExpMatchArray | null = datePart.match(YYYY_MM_DD_REGEX);
    if (yyyyMmDdMatch) {
        const year: number = Number(yyyyMmDdMatch[1]);
        const month: number = Number(yyyyMmDdMatch[2]);
        const day: number = Number(yyyyMmDdMatch[3]);

        return buildDate(day, month, year);
    }

    const fallbackDate: Date = new Date(value);
    if (Number.isNaN(fallbackDate.getTime())) {
        return null;
    }

    return new Date(fallbackDate.getFullYear(), fallbackDate.getMonth(), fallbackDate.getDate());
}

export function getDateSortingValue(date?: string | Date | null): number {
    const parsedDate: Date | null = parseDateValue(date);
    return parsedDate ? parsedDate.getTime() : 0;
}

export function formatCrowdfundingDate(date?: string | Date | null, language: string = 'pt-BR'): string {
    const parsedDate: Date | null = parseDateValue(date);
    if (!parsedDate) {
        return '';
    }

    const day: string = String(parsedDate.getDate()).padStart(2, '0');
    const month: string = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const year: string = String(parsedDate.getFullYear());

    const isPortugueseLanguage: boolean = String(language).toLowerCase().startsWith('pt');
    return isPortugueseLanguage ? `${day}/${month}/${year}` : `${month}/${day}/${year}`;
}

export function calculateDaysDifference(start: Date | string, end: Date | string): number {
    const oneDay: number = 24 * 60 * 60 * 1000;

    const startDate: Date | null = parseDateValue(start);
    const endDate: Date | null = parseDateValue(end);

    if (!startDate || !endDate) {
        return 0;
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const diffDays: number = Math.round((endDate.getTime() - startDate.getTime()) / oneDay);

    return diffDays;
}
