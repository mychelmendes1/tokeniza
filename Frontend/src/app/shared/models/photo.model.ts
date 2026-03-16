import { Assets } from "./IAssets.model";

export interface Photo {
    id: string;
    url: string;
    isMain: boolean;
    asset?: Assets | null;
    file?: File;
    name?: string;
    order?: number;
}