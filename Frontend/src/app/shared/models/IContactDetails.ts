
export enum EContactChannels{
    EMAIL,
    CHAT,
    NONE
}

export class IContactDetails{
    public useEmail?: boolean;
    public email?: string;
    public tawkTo?: string;
    public projectId?: string;
    public projects!: IContactDetails[];
    public ceoWhatsapp?: string;

    constructor(object: IContactDetails){
        if (object){
            Object.assign(this, object);
        }
    }

    public enableContactButton(): boolean{
        if (
                (this.useEmail && this.email) || 
                this.tawkTo
            ){
            return true;
        }
        return false;
    }

    public channelToUse(): EContactChannels {
        if (this.useEmail && this.email){
            return EContactChannels.EMAIL;
        }else if (this.tawkTo){
            return EContactChannels.CHAT
        }
        return EContactChannels.NONE
    }
}