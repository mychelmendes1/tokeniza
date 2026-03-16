
export interface BridgeBaseRequestModel {
    /**
* Origin chain token address (must exist on originChainId).
* Example: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
*/
    inputToken?: string;

    /**
     * Destinations chain token address (must exist on destinationChainId).
     * Example: "0x4200000000000000000000000000000000000006"
     */
    outputToken?: string;

    /**
     * Origin chain ID.
     * Possible values: 1, 10, 137, 324, 8453, 42161, 59144, 84532, 421614, 11155420, 11155111
     */
    originChainId?: number;

    /**
     * Destination chain ID.
     * Possible values: 1, 10, 137, 324, 8453, 42161, 59144, 84532, 421614, 11155420, 11155111
     */
    destinationChainId?: number;
}

export type BridgeBaseRequiredRequestModel = Required<BridgeBaseRequestModel>

interface ActionArgument {
    value: string;
    populateDynamically: boolean;
    balanceSourceToken?: string | null;
}

export interface ApprovalActions {
    target?: string;
    functionSignature?: string;
    args?: ActionArgument[];
    value?: string;
    isNativeTransfer?: boolean;
}

export interface BridgeRoutesRequestModel {
    originChainId?: number;
    destinationChainId?: number;
    originToken?: string;
    destinationToken?: string;
}

export interface BridgeQuoteRequestModel extends BridgeBaseRequiredRequestModel {
    amount: string;
    recipient?: string;
    message?: string;
    relayer?: string;
    timestamp?: number;
    decimals?: number;
}

export interface BridgeDepositStatusRequestModel {
    depositTxHash: string;
    depositId?: number;
    originChainId?: number;
}

export interface BridgeDepositHistoryRequestModel {
    depositor: string;
    limit?: number;
    skip?: number;
}

export interface BridgeSourcesRequestModel {
    chainId?: string;
}

export interface BridgeLimitsRequestModel {
    originChainId: number;
    destinationChainId: number;
    inputToken: string;
    outputToken: string;
}

export interface BridgeSwapRequestModel extends BridgeBaseRequiredRequestModel {
    /** Required. How the amount is interpreted. Default: "exactInput". */
    tradeType: TradeType;

    /**
     * Required. If tradeType=exactInput, amount is in inputToken units;
     * otherwise it is in outputToken units.
     */
    amount: string;

    inputToken: string;

    outputToken: string;

    originChainId: number;

    destination: number;

    depositor: string;

    /** Defaults to depositor. */
    recipient?: string;

    /** If set, appFeeRecipient should also be set. */
    appFee?: number;

    /** Optional. Required if appFee is provided. */
    appFeeRecipient?: string;

    integratorId?: string;

    /** Optional. Defaults to depositor. */
    refundAddress?: string;

    /** Optional. Refund on origin chain. Default: true. */
    refundOnOrigin?: boolean;

    /** Optional. Default: 0.005. */
    slippage?: number;

    /**
     * Optional. Skip origin swap estimation. Default: false.
     */
    skipOriginTxEstimation?: boolean;

    /**
     * Optional. Enforce tradeType strictly. Default: true.
     */
    strictTradeType?: boolean;

    /**
     * Optional. Sources to exclude from routing. Default: [].
     * Values can be discovered via GET /api/swap/sources.
     */
    excludeSources?: string[];

    /**
     * Optional. Sources to include for routing. Default: [].
     */
    includeSources?: string[];
}

export interface BridgeSwapBodyModel {
    actions?: ApprovalActions[]
}

// ===== Types =====

export type DepositStatus =
    | "filled"
    | "pending"
    | "expired"
    | "refunded"
    | "slowFillRequested";

export type TradeType = 'exactInput' | 'minOutput' | 'exactOutput';