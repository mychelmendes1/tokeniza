import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { RouterModule } from '@angular/router';
import { CustomSnackbarComponent, SnackBarTheme } from '../../custom-snackbar/custom-snackbar.component';
import { TranslationConstants } from '../../services/util/translation.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ICreateComment, ItemComment } from '../../models/IComments';
import { CrowdfundingService } from '../../services/crowdfunding/crowdfunding.service';
import { DiscussionModalComponent } from '../../modals/discussion-modal/discussion-modal.component';

@Component({
    selector: 'app-comment-list',
    imports: [
        CommonModule,
        SharedModule,
        RouterModule
    ],
    templateUrl: './comment-list.component.html',
    styleUrl: './comment-list.component.scss'
})
export class CommentListComponent {

    @Output() public reloadCommentsList: EventEmitter<boolean> = new EventEmitter();
    @Input() public comments: Array<ItemComment> = [];
    @Input() public name: string = '';
    @Input() public projectId: string = '';
    public loading: boolean = false;
    

    constructor(
        public dialog: MatDialog,
        private readonly translationConstants: TranslationConstants,
        private readonly customSnackbar: CustomSnackbarComponent,
        private readonly crowdfundingService: CrowdfundingService
    ) {}

    public openConfirmationModal(commentId: string): void {
        const dialogRef: MatDialogRef<DiscussionModalComponent> = this.dialog.open(DiscussionModalComponent, {
            data: {
                title: 'commentList.title',
                label: 'label.response',
                placeholder: 'placeholder.insert',
                button: 'button.send'
            }
        });

        dialogRef.afterClosed().subscribe((text: string) => {
            if (text) {
                this.reply(commentId, text);
            }
        });
    }

    public reply(commentId: string, commentText: string): void {
        const itemComment: ICreateComment = {
            comment: commentText,
            item_id: this.projectId,
            parent_comment_id: commentId
        };

        this.loading = true;
        this.crowdfundingService.commentItem(itemComment).subscribe(
            () => {
                this.customSnackbar.open(
                    this.translationConstants.translate(this.translationConstants.translate("snackbar.success")),
                    SnackBarTheme.success
                );

                this.reloadCommentsList.emit(true);
            },
            () => {
                this.customSnackbar.open(
                    this.translationConstants.translate(this.translationConstants.translate("snackbar.error")),
                    SnackBarTheme.error
                );
            }
        ).add(() => {
            this.loading = false;
        });
    }
}