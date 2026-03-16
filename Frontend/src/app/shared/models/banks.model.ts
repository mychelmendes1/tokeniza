export class Banks {
    public code!: string;
    public name!: string;
    public enabled!: boolean;
    public ispb?: string; // Pix identifier
    public uniqueBranch?: string;
    public hasAccountDigit?: boolean;
    public hasSavingAccount?: boolean;
}