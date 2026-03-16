import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, Inject, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '../material/material.module';

@Component({
    selector: 'app-custom-snackbar',
    standalone: true,
    imports: [
        CommonModule,
        MaterialModule
    ],
    templateUrl: './custom-snackbar.component.html',
    styleUrl: './custom-snackbar.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CustomSnackbarComponent {

    private readonly snackBar = inject(MatSnackBar);
    public theme: SnackBarTheme = SnackBarTheme.default;
    public message: string = '';
    public eSnackBarTheme: typeof SnackBarTheme = SnackBarTheme;

    constructor(
        @Inject(MAT_SNACK_BAR_DATA) public data: {message: string; theme: SnackBarTheme},
    ) { }

    public ngOnInit(): void {
        if(this.data) {
            this.message = this.data.message || '';
            this.theme = this.data.theme || SnackBarTheme.default;
        }
    }

    public open(message: string, theme?: SnackBarTheme, duration?: number): void {
        this.snackBar.openFromComponent(CustomSnackbarComponent, {
            data:  {
                message: message,
                theme: theme,
            },
            horizontalPosition: 'center',
            verticalPosition: 'top',
            duration: duration || SnackbarDuration.DEFAULT_DURATION,
            panelClass: 'custom-snackbar',
        });
    }
}

export const SnackbarDuration = {
    DEFAULT_DURATION: 3000,
    SUCCESS_DURATION: 3000,
    ERROR_DURATION: 4000,
    LONG_DURATION: 8000
};

export enum SnackBarTheme {
    error = 'error',
    success = 'success',
    default = 'default'
}