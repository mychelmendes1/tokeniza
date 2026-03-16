import { Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';
import { RestEndpoint } from '../../../constants/rest-endpoint.constants';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ErrorHandlerService } from '../util/error-handler.service';
import { File as FileModel } from '../../models/file.model';

@Injectable({
    providedIn: 'root'
})
export class FileService {
    private readonly maxSizePDF: number = 10 * 1024 * 1024; //10mb
    private readonly maxSizePicture: number = 1 * 1024 * 1024 //1mb;

    constructor(
        private readonly http: HttpClient,
        private readonly errorHandler: ErrorHandlerService
    ) {
    }

    public validateFile(file: File, maxSizePDF: boolean = false, maxSizePicture: boolean = false): boolean {
        if (maxSizePDF) {
            if (file.size > this.maxSizePDF) {
                return false;
            }
        }

        if (maxSizePicture) {
            if (file.size > this.maxSizePicture) {
                return false;
            }
        }

        return true;
    }

    public readFile(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject('Failed to read file');
        });
    }

    /**
     * This method returns the attached file name in Normalization Form Unicode, assigning its code point to each character, 
     * ensuring its mapping and final representation, that is, converting the string into normalized Unicode format.
     * NFD - Normalization Form Canonical Decomposition - Will keep accented characters separated by their canonical equivalence.
     * E.g.: Letter with accent 'Á' represented by its unicode ('U+0061' + 'U+0301'), Letter 'O' ('U+006F'), Letter 'I' ('U+0069')...
     * The check is performed on the range of accented characters '\u0300-\u036f', numbering '0-9', lowercase letters 'a-z', uppercase letters 'A-Z'.
    */
        public normalizeFileName(fileName: string): string{
        return fileName.normalize('NFD').replace(/([\u0300-\u036f]|[^0-9a-zA-Z][\-\_])/g, '');
    }

    /**
     * Upload a file
     * @param file File to be uploaded to s3
     */
    public uploadFile(file: FileModel): Observable<any> {
        const header: HttpHeaders = new HttpHeaders({ });
        return this.http.post<any>(RestEndpoint.account.files, file, {headers: header})
            .pipe(
                catchError((err) => { return this.errorHandler.validate(err); })
            )
        ;
    }
}