import { IFiatCurrency } from "./IFiatCurrency";
import { LanguagesEnum } from "./languages.enum";

export class usefulSettings {
    public fiatCurrency: IFiatCurrency = new IFiatCurrency();
    public selectedLanguage?: LanguagesEnum;
}