import * as forge from 'node-forge';

// tslint: disable-next-line: max-classes-per-file
class EncryptedBase
{
    private static PRIVATE_KEY: string;

    constructor(rsaKey: string)
    {
        EncryptedBase.PRIVATE_KEY = rsaKey;
    }

    protected encrypt(msg: string): any
    {
        // Convert PEM key to forge public key
        const publicKey = forge.pki.publicKeyFromPem(EncryptedBase.PRIVATE_KEY);

        // Encrypt using RSA-OAEP with SHA-256
        const encrypted = publicKey.encrypt(msg, 'RSA-OAEP', {
            md: forge.md.sha256.create(),
            mgf1: {
                md: forge.md.sha256.create()
            }
        });

        // Convert to base64
        return forge.util.encode64(encrypted);
    }
}

export class LoginEncrypted extends EncryptedBase {
    public email: string | undefined;
    public password: string;
    public username: string | undefined;
    public secretcode: string | undefined;
    public code: string | undefined;
    public configureForInternal?: boolean;

    constructor(
        email: string | undefined,
        password: string,
        username: string | undefined,
        code: string | undefined,
        rsaKey: string,
        configureForInternal?: boolean
    ) {
        super(rsaKey);
        this.email = email;
        this.password = this.encrypt(password);
        this.username = username;
        this.code = code;
        this.secretcode = code;
        this.configureForInternal = configureForInternal;
    }
}