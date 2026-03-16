import { Injectable } from '@angular/core';
import { IFiatCurrency } from '../../models/IFiatCurrency';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
import {
    HttpClient,
    HttpErrorResponse,
    HttpHeaders,
} from '@angular/common/http';
import { RestEndpoint } from '../../../constants/rest-endpoint.constants';
import { LoginEncrypted } from '../../models/encrypt.base';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';
import {
    LocalStorageService,
    SessionStorageService,
} from 'angular-web-storage';
import { LocalStorageKeys } from '../util/local.storage.keys';
import {
    IUserGenericDocuments,
    UserIdentifierEnum,
    UserLoggedModel,
    UserStatus,
} from '../../models/user.logged.model';
import { ResetModel } from '../../models/reset.model';
import { VerifyUserEncrypted } from '../../models/verify.encrypted.model';
import { AccountCreationRequest } from '../../models/bank.account.creation.model';
import { SignupEncrypt } from '../../models/signup.encrypt.base';
import { AmountConvertedResult } from '../../models/amount-converted-result';
import { BrlaKycHistoryModel } from '../../models/brla-kyc-history.model';
import { PlatformBalance } from '../../models/wallet.balance';
import { MultiLevelCommissions } from '../../models/multilevelcomissions';
import { MyCommunityModel } from '../../models/my-community.model';
import { IDecimalPlaces } from '../../models/IDecimalPlaces';
import { IUserEmailResponse } from '../../models/IUserEmailResponse';
import { IInvoicesCreationRequest } from '../../models/invoice.model';
import { EscrowsUpdateRequest } from '../../models/escrow.model';
import { IUserAddress } from '../../models/IUserAddress';
import { IUserAdditionalInformation } from '../../models/IUserAdditionalInformation';
import { ApplyStake } from '../../models/apply.stake';
import { IUserDocuments, PERSONAL_DOCUMENTS_FILTER } from '../../models/IUserDocuments';
import {
    VerifyTransferInput,
    VerifyTransferOutput,
} from '../../models/transfer.model';
import { TransferValueModel } from '../../models/transfer-value.model';
import { DiditSessionRequest, DiditSessionResponse } from '../../models/didit-session.model';

@Injectable({
    providedIn: 'root',
})
export class AccountService {
    public static RSA_KEY: string;
    private readonly registerAccess: BehaviorSubject<boolean> =
        new BehaviorSubject<boolean>(true);
    private $userMenuInfoSubject: BehaviorSubject<UserMenuInfo | null> =
        new BehaviorSubject<UserMenuInfo | null>(null);
    public userMenuInfo!: Observable<UserMenuInfo | null>;

    constructor(
        private readonly http: HttpClient,
        private readonly localStorage: LocalStorageService,
        private readonly sessionStorage: SessionStorageService
    ) {
        this.userMenuInfo = this.$userMenuInfoSubject.asObservable();
    }

    public updateUserMenu(user: UserMenuInfo): void {
        this.$userMenuInfoSubject.next(user);
    }

    /**
     * Get name and password inserted on login and compare with data. If it's match, return true to do login.
     * @param name
     * @param password
     */
    public async loginUser(
        name: string,
        password: string,
        code: string = ''
    ): Promise<UserLoggedModel> {
        const encryptedData = new LoginEncrypted(
            name,
            password,
            name,
            code,
            AccountService.RSA_KEY
        );
        const options = {
            url: RestEndpoint.account.authenticateUser,
            headers: { 'Content-Type': 'application/json' },
            data: encryptedData,
        };
        const response: HttpResponse = await CapacitorHttp.post(options);

        if (response.status === 200) {
            const userData = response.data;
            if (!userData) {
                throw new HttpErrorResponse({
                    status: 405,
                    statusText: 'Impossible to retrieve user data.',
                });
            }
            userData.firstName =
                userData.firstName.charAt(0).toUpperCase() +
                userData.firstName.slice(1);
            userData.name = `${userData.firstName} ${userData.lastName}`;
            this.localStorage.set(LocalStorageKeys.USER_LOGGED_KEY, userData);
            this.registerAccess.next(true);
            return Promise.resolve(response.data);
        } else {
            return Promise.reject(response.data);
        }
    }

    /**
     * Check if the user is authenticated
     */
    public isAuthenticated(
        menu?: boolean,
        redirectToLogin: boolean = true
    ): Observable<UserLoggedModel> {
        return this.internalIsAuthenticated(menu, redirectToLogin);
    }

    private internalIsAuthenticated(
        menu?: boolean,
        redirectToLogin: boolean = true
    ): Observable<any> {
        return this.http
            .post<boolean>(RestEndpoint.account.isAuthenticated, {})
            .pipe(
                map((authenticated: any) => {
                    if (!authenticated || !authenticated.isAuthenticated) {
                        if (!menu) {
                            this.destroySession().subscribe();
                            if (redirectToLogin) {
                                void window.open('/account/login', '_self');
                            }
                        }
                        return;
                    }
                    if (authenticated.user) {
                        authenticated.user.name = `${authenticated.user.firstName} ${authenticated.user.lastName}`;
                        authenticated.user.firstName =
                            authenticated.user.firstName
                                .charAt(0)
                                .toUpperCase() +
                            authenticated.user.firstName.slice(1);

                        this.localStorage.set(
                            LocalStorageKeys.USER_LOGGED_KEY,
                            authenticated.user
                        );
                    }
                    return of(
                        this.localStorage.get(LocalStorageKeys.USER_LOGGED_KEY)
                    );
                }),
                catchError((err) => {
                    this.destroySession().subscribe();
                    if (redirectToLogin) {
                        void window.open('/account/login', '_self');
                    }
                    throw err;
                })
            );
    }

    public getUserAdditionalinformation(
        filterKycAddress?: boolean
    ): Observable<any[]> {
        return this.http
            .get(RestEndpoint.account.getAllUserAdditional, {})
            .pipe(
                map((data: any) => {
                    return data;
                }),
                catchError((err) => {
                    throw err;
                })
            );
    }


    public checkDiditSessionStatus(sessionId: string): Observable<any> {
        return this.http
            .get<any>(`${RestEndpoint.account.checkDiditSessionStatus}/${sessionId}`)
            .pipe(
                catchError((err) => {
                    console.error('Error checking Didit session status:', err);
                    throw err;
                })
            );
    }

    public updateBasicInfos(
        fullName: string,
        nickname: string,
        phone: string,
        externalSourceIndication?: string,
        externalSourceId?: string,
        selfieImage?: string,
        dateOfBirth?: Date,
        openingDate?: Date,
        identityCompanyManager?: string
    ): Observable<any> {
        return this.http
            .post<any>(RestEndpoint.profile.updateUserBasicInfos, {
                fullName,
                nickname,
                phone,
                externalSourceIndication,
                externalSourceId,
                selfieImage,
                dateOfBirth,
                openingDate,
                identityCompanyManager,
            })
            .pipe(
                map((data: { id: string }) => {
                    let userData: UserLoggedModel = this.localStorage.get(
                        LocalStorageKeys.USER_LOGGED_KEY
                    );
                    userData.nickname = nickname;
                    userData.selfieImage = selfieImage;
                    userData.phone = phone;
                    userData.dateOfBirth = dateOfBirth;
                    userData.name = fullName;
                    userData.externalSourceId = externalSourceId;
                    this.localStorage.set(
                        LocalStorageKeys.USER_LOGGED_KEY,
                        userData
                    );
                    this.updateUserMenu({
                        avatar: userData?.selfieImage as string,
                        fullname: userData.name,
                    });
                }),
                catchError((err) => {
                    throw err;
                })
            );
    }

    public getLoggedUserDetails(): Observable<UserLoggedModel> {
        const user: UserLoggedModel = this.localStorage.get(
            LocalStorageKeys.USER_LOGGED_KEY
        );

        if (!user) {
            throw new HttpErrorResponse({
                status: 405,
                statusText: 'Impossible to retrieve user data.',
            });
        }

        if (user) {
            user.firstName =
                user.firstName.charAt(0).toUpperCase() +
                user.firstName.slice(1);
            user.name = user.name.charAt(0).toUpperCase() + user.name.slice(1);
            this.localStorage.set(LocalStorageKeys.USER_LOGGED_KEY, user);
            return of(user);
        } else {
            return of();
        }
    }

    public getMyCommunity(): Observable<Array<MyCommunityModel>> {
        return this.http
            .get<MyCommunityModel[]>(RestEndpoint.account.getMyCommunity, {})
            .pipe(
                map((data: Array<MyCommunityModel>) => {
                    return data;
                }),
                catchError((err) => {
                    throw err;
                })
            );
    }

    public getCommissions(): Observable<MultiLevelCommissions[]> {
        return this.http
            .get<MultiLevelCommissions[]>(
                RestEndpoint.account.getAllUserCommissionRequest
            )
            .pipe(
                map((data: MultiLevelCommissions[]) => {
                    return data;
                }),
                catchError((err) => {
                    throw err;
                })
            );
    }

    public verifyMFAStatus(): Observable<{ status: boolean; type: string }> {
        return this.http.get(RestEndpoint.account.verifyMFAStatus, {}).pipe(
            map((data: any) => {
                return {
                    status: data?.value,
                    type: data?.type,
                };
            }),
            catchError(() => {
                throw new Error('Not possible to get the MFA status');
            })
        );
    }

    /**
     * Return if the user is authenticated, but don't destroy the session if he isn't
     */
    public verifyAuthentication(): Observable<boolean> {
        return this.http
            .post<boolean>(RestEndpoint.account.isAuthenticated, {})
            .pipe(
                map((authenticated: any) => {
                    if (!authenticated || !authenticated.isAuthenticated) {
                        return false;
                    } else {
                        return true;
                    }
                })
            );
    }

    /**
     * Check email on Forgot Password page. If don't match, don't let go to Reset Password Page
     * @param user
     */
    public sendCode(email: string): Observable<void> {
        return this.http
            .post<void>(RestEndpoint.account.lostpassword, { email: email })
            .pipe(
                catchError((err) => {
                    throw err;
                })
            );
    }

    /**
     * Compare the email, verification code and new password to reset the password on Reset Password Page
     * @param reset
     */
    public resetPassword(reset: ResetModel): Observable<void> {
        return this.http
            .post<void>(
                RestEndpoint.account.changelostpassword,
                new VerifyUserEncrypted(reset, AccountService.RSA_KEY)
            )
            .pipe(
                catchError((err) => {
                    throw err;
                })
            );
    }

    public getRsaPublicKey(): Observable<boolean | void> {
        if (AccountService.RSA_KEY) {
            return of(true);
        }

        return this.http.get(RestEndpoint.account.publicRsa, {}).pipe(
            map((data: any) => {
                if (!data.value) {
                    throw new Error('Problems to retrieve RSA Key.');
                }
                AccountService.RSA_KEY = data.value;
                return of();
            }),
            map(() => true),
            catchError((err) => {
                throw err;
            })
        );
    }

    public validateUsername(externalSourceId: string): Observable<any> {
        return this.http
            .get<any>(RestEndpoint.account.validateUsername, {
                params: {
                    externalSourceId: externalSourceId,
                },
            })
            .pipe(
                catchError((err) => {
                    throw err;
                })
            );
    }

    public verifyDocument(cpf: string, cnpj: string): Observable<any> {
        return this.http
            .get<any>(RestEndpoint.account.verifyDocument, {
                params: {
                    cpf: cpf,
                    cnpj: cnpj,
                },
            })
            .pipe(
                catchError((err) => {
                    throw err;
                })
            );
    }

    public createUser(
        email: string,
        password: string,
        firstName: string,
        lastName: string,
        identifier: string,
        indicationToken: string,
        documentType: UserIdentifierEnum | typeof UserIdentifierEnum,
        documentToken: string,
        diditToken: string,
        token_id: string,
        account_type?: string,
        externalSourceIndication?: string,
        nft_token?: string,
        accountCreationRequest?: AccountCreationRequest,
        phone?: string,
        username?: string,
        dateOfBirth?: string,
        openingDate?: string,
        identityCompanyManager?: string,
        isPhoneVerified?: boolean
    ): Observable<any> {
        return this.http
            .post<any>(
                RestEndpoint.account.createUser,
                new SignupEncrypt(
                    email,
                    password,
                    username as string,
                    firstName,
                    lastName,
                    identifier,
                    indicationToken,
                    AccountService.RSA_KEY,
                    documentType,
                    documentToken,
                    diditToken,
                    token_id,
                    accountCreationRequest as AccountCreationRequest,
                    account_type as string,
                    externalSourceIndication as string,
                    nft_token as string,
                    phone as string,
                    '' as string, // externalSourceId - not used in Tokeniza
                    dateOfBirth as string,
                    openingDate as string,
                    identityCompanyManager as string,
                    isPhoneVerified as boolean
                )
            )
            .pipe(
                catchError((err) => {
                    throw err;
                })
            );
    }

    public createDiditSession(userData: DiditSessionRequest): Observable<DiditSessionResponse> {
        return this.http
            .post<DiditSessionResponse>(RestEndpoint.account.createDiditSession, userData)
            .pipe(
                catchError((err) => {
                    throw err;
                })
            );
    }

    public resendCode(email: string): Observable<string> {
        return this.http
            .post<any>(RestEndpoint.account.resendConfirmationCode, { email })
            .pipe(
                catchError((err) => {
                    throw err;
                })
            );
    }

    public logout(): void {
        this.destroySession().subscribe();
    }

    /**
     * Destroy the session
     */
    public destroySession(): Observable<void> {
        return this.http.delete<void>(RestEndpoint.account.destroySession).pipe(
            tap(() => {
                this.clearLocalSession();
            })
        );
    }

    /**
     * Clears local session state without calling the API.
     * Used when the backend returns 401 (e.g. session expired) so the user is logged out and redirected to login.
     */
    public clearLocalSession(): void {
        this.localStorage.remove(LocalStorageKeys.BANK_ACCOUNT_ORDERED);
        this.sessionStorage.clear();
        this.registerAccess.next(false);
        this.localStorage.remove(LocalStorageKeys.USER_LOGGED_KEY);
    }

    public getFiatCurrency(): IFiatCurrency {
        return {
            currency: 'BRL',
            symbol: 'R$',
        };
    }

    public loadFiatCurrency(): Observable<IFiatCurrency> {
        return this.http
            .get<IFiatCurrency>(RestEndpoint.account.getFiatCurrency, {})
            .pipe(
                map((data: IFiatCurrency) => {
                    return data;
                }),
                catchError(() => {
                    throw new Error('Not possible to get the fiat currency');
                })
            );
    }

    public changeNewsLetter(
        receivesNewletter: boolean,
        email: string
    ): Observable<boolean> {
        return this.http
            .post<boolean>(RestEndpoint.account.changeNewsLetter, {
                receivesNewletter,
                email,
            })
            .pipe(
                map((res: any) => {
                    return res;
                }),
                catchError((err) => {
                    throw err;
                })
            );
    }

    public quotations(currency: string): Observable<AmountConvertedResult> {
        let unitOfMoney = currency;
        return this.http
            .get(RestEndpoint.account.quotations, {
                params: { currency, unitOfMoney },
            })
            .pipe(
                map((data: any) => {
                    return data;
                }),
                catchError(() => {
                    throw new Error('Not possible to get the quotation');
                })
            );
    }

    public getBRLAKYCStatus(): Observable<BrlaKycHistoryModel> {
        return this.http
            .get<BrlaKycHistoryModel>(RestEndpoint.account.getBRLAKYCStatus)
            .pipe(
                map((data: BrlaKycHistoryModel) => {
                    return data;
                }),
                catchError(() => {
                    throw new Error('Not possible to get the user wallet');
                })
            );
    }

    public allQuotations(): Observable<AmountConvertedResult[]> {
        return this.http
            .get<AmountConvertedResult[]>(
                RestEndpoint.account.allQuotations,
                {}
            )
            .pipe(
                map((data: AmountConvertedResult[]) => {
                    if (data) {
                        return data;
                    }
                    return [];
                }),
                catchError(() => {
                    throw new Error('Not possible to get the quotation');
                })
            );
    }

    public allBalances(): Observable<PlatformBalance[]> {
        return this.http
            .get<PlatformBalance[]>(RestEndpoint.account.balance, {})
            .pipe(
                map((data: PlatformBalance[]) => {
                    return data;
                }),
                catchError(() => {
                    throw new Error('Not possible to get the balance');
                })
            );
    }

    public reprocessBlock(
        blockNumber: number,
        network: string
    ): Observable<any> {
        return this.http
            .post<PlatformBalance[]>(RestEndpoint.account.reprocessBlock, {
                blockNumber,
                network,
            })
            .pipe(
                map((data: PlatformBalance[]) => {
                    return data;
                }),
                catchError(() => {
                    throw new Error('Not possible to get the balance');
                })
            );
    }

    public sendNewsLetter(email: string): Observable<boolean> {
        return this.http
            .post<boolean>(RestEndpoint.account.subscribeNewsLetter, {
                email: email,
            })
            .pipe(
                map((data: boolean) => {
                    return data;
                }),
                catchError(() => {
                    throw new Error('Failed to subscribe.');
                })
            );
    }

    public getClearLedgerPaymentStatus(orderId: string): Observable<any> {
        return this.http
            .get(RestEndpoint.account.checkClearLedgerPaymentStatus + orderId)
            .pipe(
                map((data: any) => {
                    return data;
                }),
                catchError((err) => {
                    throw err;
                })
            );
    }

    public getCelcoinIntegrationPaymentStatus(
        orderId: string
    ): Observable<any> {
        return this.http
            .get(
                RestEndpoint.account.checkCelcoinIntegrationPaymentStatus +
                orderId
            )
            .pipe(
                map((data: any) => {
                    return data;
                }),
                catchError((err) => {
                    throw err;
                })
            );
    }

    public loadDecimalsPlaces(): Observable<IDecimalPlaces> {
        return this.http
            .get<IDecimalPlaces>(RestEndpoint.account.getDecimalPlaces, {})
            .pipe(
                map((data: IDecimalPlaces) => {
                    return data;
                }),
                catchError(() => {
                    throw new Error('Not possible to get the decimals');
                })
            );
    }

    public startMFAProcess(
        name: string,
        password: string,
        code: string,
        configureForInternal: boolean
    ): Observable<any> {
        return this.http
            .post<any>(
                RestEndpoint.account.startMFAProcess,
                new LoginEncrypted(
                    name,
                    password,
                    name,
                    code,
                    AccountService.RSA_KEY,
                    configureForInternal
                )
            )
            .pipe(
                map((data: any) => {
                    return data;
                }),
                catchError((error) => {
                    throw error.error.message;
                })
            );
    }

    public finalizeMFAProcess(
        name: string,
        password: string,
        code: string,
        configureForInternal: boolean
    ): Observable<any> {
        return this.http
            .post<any>(
                RestEndpoint.account.finalizeMFAProcess,
                new LoginEncrypted(
                    name,
                    password,
                    name,
                    code,
                    AccountService.RSA_KEY,
                    configureForInternal
                )
            )
            .pipe(
                map((data: any) => {
                    return data;
                }),
                catchError((error) => {
                    throw error.error.message;
                })
            );
    }

    public getUserByEmailWallet(email: string): Observable<IUserEmailResponse> {
        email = email?.toLocaleLowerCase()?.trim();
        return this.http
            .get<IUserEmailResponse>(
                RestEndpoint.account.getUserByEmailWallet,
                { params: { email } }
            )
            .pipe(
                map((data: IUserEmailResponse) => {
                    return data;
                }),
                catchError(() => {
                    throw new Error('Not possible to get the user wallet');
                })
            );
    }

    public sendInvoice(request: IInvoicesCreationRequest): Observable<any> {
        return this.http.post(RestEndpoint.account.createInvoice, request).pipe(
            map((data: any) => {
                return data;
            }),
            catchError(() => {
                throw new Error('Not possible to get the balance');
            })
        );
    }

    public updateInvoice(request: EscrowsUpdateRequest): Observable<any> {
        return this.http.post(RestEndpoint.account.updateInvoice, request).pipe(
            map((data: any) => {
                return data;
            }),
            catchError(() => {
                throw new Error('Not possible to get the balance');
            })
        );
    }

    public createAddress(data: IUserAddress): Observable<any> {
        return this.http
            .post<any>(RestEndpoint.account.createUserAddress, data)
            .pipe(
                catchError((err) => {
                    throw err;
                })
            );
    }

    public uploadGenericDocuments(
        genericDocuments: IUserGenericDocuments[]
    ): Observable<string> {
        return this.http
            .post<any>(
                RestEndpoint.account.updateMyGenericKYCDocuments,
                genericDocuments
            )
            .pipe(
                map((userData: string) => {
                    return userData;
                }),
                catchError((err) => {
                    throw err;
                })
            );
    }

    public getMyKYCDocuments(
        filter?: PERSONAL_DOCUMENTS_FILTER
    ): Observable<IUserDocuments[]> {
        const params: any = {};

        if (filter !== undefined) {
            params.filter = filter;
        }

        return this.http
            .get<IUserDocuments[]>(RestEndpoint.account.getMyDocuments, {
                params,
            })
            .pipe(
                map((data: IUserDocuments[]) => {
                    return data;
                }),
                catchError((err) => {
                    throw err;
                })
            );
    }

    public getMyKYCDocumentsStatus(): Observable<UserStatus> {
        return this.http
            .get<{ value: UserStatus }>(
                RestEndpoint.account.getMyKYCDocumentsStatus,
                {}
            )
            .pipe(
                map((data: { value: UserStatus }) => {
                    return data.value;
                }),
                catchError((err) => {
                    throw err;
                })
            );
    }

    public updateDocuments(
        selfie_document: string,
        address_document_url: string,
        identification_document_url: string
    ): Observable<string> {
        return this.http
            .post<any>(RestEndpoint.account.updateDocuments, {
                selfie_document,
                address_document_url,
                identification_document_url,
            })
            .pipe(
                map((userData: string) => {
                    return userData;
                }),
                catchError((err) => {
                    throw err;
                })
            );
    }

    public getMyGenericDocuments(): Observable<IUserGenericDocuments[]> {
        return this.http
            .get<IUserGenericDocuments[]>(
                RestEndpoint.account.getMyGenericKYCDocuments
            )
            .pipe(
                map((documents: IUserGenericDocuments[]) => {
                    return documents;
                }),
                catchError((err) => {
                    throw err;
                })
            );
    }

    public checkDocumentStatus(document_sign_key: string): Observable<any> {
        return this.http
            .post(RestEndpoint.account.checkDocumentStatus, {
                document_sign_key: document_sign_key,
            })
            .pipe(
                map((data: any) => {
                    return data;
                }),
                catchError((err) => {
                    throw err;
                })
            );
    }

    public createSignRequest(applyStake: any): Observable<any> {
        return this.http
            .post(RestEndpoint.account.createSignRequest, applyStake)
            .pipe(
                map((data: any) => {
                    return data;
                }),
                catchError((err) => {
                    throw err;
                })
            );
    }

    public createAdditionalInformation(
        data: IUserAdditionalInformation
    ): Observable<any> {
        return this.http
            .post<any>(RestEndpoint.account.createUserAdditional, data)
            .pipe(
                catchError((err) => {
                    throw err;
                })
            );
    }

    public createUserStake(applyStake: ApplyStake): Observable<any> {
        return this.http
            .post(RestEndpoint.account.createUserStake, applyStake)
            .pipe(
                map((data: any) => {
                    return data;
                }),
                catchError((err) => {
                    throw err;
                })
            );
    }

    public verifyTransaction(
        verifyData: VerifyTransferInput
    ): Observable<VerifyTransferOutput> {
        return this.http
            .post<VerifyTransferOutput>(RestEndpoint.account.verify, verifyData)
            .pipe(
                map((data: VerifyTransferOutput) => {
                    return data;
                }),
                catchError(() => {
                    throw new Error('Not possible to get the balance');
                })
            );
    }

    public sendMFACode(): Observable<string> {
        return this.http.post<any>(RestEndpoint.account.sendMFACode, {}).pipe(
            catchError((err) => {
                throw err;
            })
        );
    }

    public transfer(transferValue: TransferValueModel): Observable<any> {
        return this.http
            .post(RestEndpoint.account.transfer, transferValue)
            .pipe(
                map((data: any) => {
                    return data;
                }),
                catchError((err) => {
                    throw err;
                })
            );
    }

    public sendNotification(data: {
        name?: string;
        contact: string;
        observation: string;
        emailFrom: string;
        emailTo: string;
        product: string;
        period: string;
        storeId?: string;
        subject: string;
    }): Observable<any> {
        return this.http
            .post<any>(RestEndpoint.account.sendContactEmail, data)
            .pipe(
                map((userData: any) => {
                    if (!userData) {
                        throw new HttpErrorResponse({
                            status: 405,
                            statusText: 'Impossible to send notification.',
                        });
                    }
                }),
                catchError((err) => {
                    throw err;
                })
            );
    }

    public getIRPF(): Observable<
        {
            unitOfMoney: string;
            baseYear: number;
            isNft: boolean;
            endYear: number;
            quantityBaseYear: number;
            quantityLastYear: number;
        }[]
    > {
        return this.http.get<any>(RestEndpoint.account.getIRPF).pipe(
            catchError((err) => {
                throw err;
            })
        );
    }

    public getUserAddress(
        filterKycAddress?: boolean
    ): Observable<IUserAddress | undefined> {
        return this.http.get<IUserAddress[]>(RestEndpoint.account.getUserAddress, {}).pipe(
            map((addresses: IUserAddress[]) => {
                if (!addresses?.length) {
                    return undefined;
                }
 
                if (filterKycAddress) {
                    // Find the first address with KYC, or fall back to the first address in the array.
                    return addresses.find(addr => addr.has_kyc) ?? addresses[0];
                }
 
                return addresses[0];
            }),
            catchError((err) => {
                throw err;
            })
        );
    }
}

export interface UserMenuInfo {
    fullname: string;
    avatar: string;
}
