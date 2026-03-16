import { IProjectCrowdfunding } from "./IProjectCrowdfunding.model";

export interface ICommentCreate {
    user_id: string;
    comment: string;
    user_name: string;
    item_id: string;
    parent_comment_id?: string;
}

export interface IComment {
    id: string;
    user_id: string;
    user_name: string;
    comment: string;
    when: Date;
    item: IProjectCrowdfunding;
    parent?: any[];
    child?: any[];
}

export interface ItemComment {
    user_id?: string;
    user_name?: string;
    comment: string;
    item_id: string;
    parent_comment_id?: string;
    when: string;
    parent: any[];
    id: string;
}

export interface ICreateComment {
    comment: string,
    item_id: string,
    parent_comment_id?: string
}