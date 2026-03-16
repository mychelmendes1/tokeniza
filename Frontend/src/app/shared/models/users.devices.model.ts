export class UsersDevicesModel {
    public id?: string; // Generated in database.
    public userId?: string; // Retrive in API with user session.
    public model?: string;
    public operatingSystem?: string;
    public platform?: string;
    public browser?: string;
    public manufacturer?: string;
    public isNative?: boolean;
    public deviceType?: DeviceTypeEnum;
    public name?: string;
    public hash?: string;
    public createdAt?: Date;
    public updatedAt?: Date;
    public code?: string;
    public isCurrentDevice?: boolean;
}

export enum DeviceTypeEnum {
    MOBILE = 'mobile',
    WEB = 'web'
}