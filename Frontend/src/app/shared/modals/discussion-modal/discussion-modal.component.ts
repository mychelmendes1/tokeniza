import { Component, Inject } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { showErrorForInputs } from '../../validators/form-group.validators';

@Component({
    selector: 'app-discussion-modal',
    imports: [
        SharedModule,
        CommonModule,
        RouterModule
    ],
    templateUrl: './discussion-modal.component.html',
    styleUrl: './discussion-modal.component.scss'
})
export class DiscussionModalComponent {

    public form: FormGroup<IFormDiscussion> = new FormGroup<IFormDiscussion>({
        discussion: new FormControl<string>('', { validators: [Validators.minLength(20), Validators.maxLength(250)] })
    });

    constructor(
        public dialogRef: MatDialogRef<DiscussionModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { title: string, label: string, placeholder: string, button: string }
    ) { }

    public ngOnInit(): void {
        this.dialogRef.disableClose = true;
        this.dialogRef.addPanelClass(['custom-modal', 'discussion-modal']);
    }

    public showError(formName: string, form: FormGroup): boolean {
        return showErrorForInputs(formName, form);
    }

    public close(emit: boolean): void {
        this.dialogRef.close(emit ? this.form.value.discussion : false);
    }

}

interface IFormDiscussion {
    discussion: FormControl<string | null>;
}