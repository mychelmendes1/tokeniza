/**
 * Model retrieved from BRLA Documentation:
 * https://brla-superuser-api.readme.io/reference/superuserkychistory
 */
export interface BrlaKycHistoryItemModel {
    id: string;
    userName: string;
    status: string // "REJECTED", "APPROVED"
    level: number;
    limits: BrlaKycLimitsModel;
    birthDate: string; // Date ISO 8601 format
    documentData: string;
    createdAt: string; // Date ISO 8601 format
    updatedAt: string; // Date ISO 8601 format
    failureReason: string;
    documentType: string;
    partnerTaxId: string;
    partnerFullName: string;
    partnerBirthDate: string; // Date ISO 8601 format
    reason: string;
}

export interface BrlaKycLimitsModel {
    limitMint: number;
    limitBurn: number;
    limitSwapBuy: number;
    limitSwapSell: number;
    limitBRLAOutOwnAccount: number;
    limitBRLAOutThirdParty: number;
}

export interface BrlaKycHistoryModel {
    history: BrlaKycHistoryItemModel[];
}