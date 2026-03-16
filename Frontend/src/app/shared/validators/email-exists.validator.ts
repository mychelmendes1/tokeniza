import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map, catchError, debounceTime, switchMap, first } from 'rxjs/operators';
import { AccountService } from '../services/account/account.service';

/**
 * Async validator to check if an email already exists in the system.
 * Returns an error if the email is already registered.
 * Suppresses backend errors to prevent registration failures.
 */
export function emailExistsValidator(accountService: AccountService): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
        if (!control.value || control.value.trim() === '') {
            return of(null);
        }

        // Basic email format check before making API call
        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        if (!emailRegex.test(control.value)) {
            return of(null); // Let the sync email validator handle format errors
        }

        return of(control.value).pipe(
            debounceTime(500), // Wait 500ms after user stops typing
            switchMap((email: string) => {
                return accountService.validateUsername(email).pipe(
                    map((response: { value: boolean }) => {
                        // If value is true, email exists - return error
                        return response?.value ? { emailExists: true } : null;
                    }),
                    catchError(() => {
                        // On error (including backend EntityNotFound), don't block the user
                        // Let backend handle validation during actual registration
                        return of(null);
                    })
                );
            }),
            first() // Complete the observable after first emission
        );
    };
}
