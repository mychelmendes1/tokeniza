import { ResetModel } from './reset.model';
import { LoginEncrypted } from './encrypt.base';

export class VerifyUserEncrypted extends LoginEncrypted {
    public newPassword?: string;
    public override secretcode: string;

    constructor(resetModel: ResetModel, rsaKey: string) {
        super(
            resetModel.email,
            resetModel.newPassword,
            resetModel.email,
            undefined,
            rsaKey
        );

        this.newPassword = this.encrypt(resetModel.newPassword ?? '');
        this.secretcode = resetModel.secretCode ?? '';
    }
}
