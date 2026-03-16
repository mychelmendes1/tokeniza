export interface BaseAcrossResponse {
    originChainId?: number;
    originToken?: string;
    destinationChainId?: number;
    destinationToken?: string;
}

interface TokenOnChain {
    chainId: number;
    address: string;
    name?: string;
    symbol: string;
    decimals: number;
}

interface TransferLimits {
    minDeposit?: string,
    maxDeposit?: string,
    maxDepositInstant?: string,
    maxDepositShortDelay?: string,
    recommendedDepositInstant?: string
    minDepositHuman?: string,
    maxDepositHuman?: string,
}

interface FeeBreakdown {
    pct: string;   // 1e18-scaled fraction, as decimal string
    total: string; // amount in token units, as decimal string
}

interface BridgeStep {
    inputAmount?: string;
    outputAmount?: string;
    tokenIn?: TokenOnChain;
    tokenOut?: TokenOnChain;
    fees?: {
        totalRelay?: FeeBreakdown;
        relayerCapital?: FeeBreakdown;
        relayerGas?: FeeBreakdown;
        lp?: FeeBreakdown;
    };
}

interface DestinationSwapStep {
    tokenIn?: TokenOnChain;
    tokenOut?: TokenOnChain;
    inputAmount?: string;
    maxInputAmount?: string;
    outputAmount?: string;
    minOutputAmount?: string;

    swapProvider?: {
        name: string;
        sources?: string[]
    };
}

interface Steps {
    bridge?: BridgeStep;
    destinationSwap?: DestinationSwapStep;
    originSwap?: DestinationSwapStep;
}

interface FeeAmountDetailed {
    amount?: string;     // token units
    amountUsd?: string;  // decimal string
    pct?: string;        // 1e18-scaled fraction (string)
    token?: TokenOnChain;
}

interface Fees {
    total?: FeeAmountDetailed;
    originGas?: FeeAmountDetailed;
    destinationGas?: FeeAmountDetailed;
    relayerCapital?: FeeAmountDetailed;
    lpFee?: FeeAmountDetailed;
    relayerTotal?: FeeAmountDetailed;
    app?: FeeAmountDetailed;
}

interface SwapTransaction {
    simulationSuccess?: boolean;
    chainId?: number;
    to?: string;
    data?: string;
    gas?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
}

interface ApprovalChecks {
    allowance?: {
        token?: string;
        spender?: string;
        actual?: string;
        expected?: string;
    };
    balance?: {
        token?: string;
        actual?: string;
        expected?: string;
    };
}


export interface BridgeRoutesModel {
    originTokenSymbol?: string;
    destinationTokenSymbol?: string;
    isNative?: boolean;
}

interface SwapChainsRecord {
    chainId: number;
    name: string;
    publicRpcUrl: string;
    explorerUrl: string;
    logoUrl: string;
}

export type BridgeChainsModel = SwapChainsRecord[];

interface SwapTokensRecord {
    chainId: number;
    address: string;
    name?: string;
    symbol: string;
    decimals: number;
    logoUrl: string;
    priceUsd: string;
}

export type BridgeTokensModel = SwapTokensRecord[];

export type BridgeSwapSourcesModel = string[];

export interface BridgeTransferLimitsModel {
    minDeposit?: string,
    maxDeposit?: string,
    maxDepositInstant?: string,
    maxDepositShortDelay?: string,
    recommendedDepositInstant?: string
}

export interface BridgeQuoteModel {

    id: string;
    capitalFeePct: string;
    capitalFeeTotal: string;
    relayGasFeePct: string;
    relayGasFeeTotal: string;
    relayFeePct: string;
    relayFeeTotal: string;
    lpFeePct: string;
    outputAmount: string;

    outputAmountHuman: string;
    totalFeeBase: string;
    totalFeeHuman: string;

    inputToken: TokenOnChain;
    outputToken: TokenOnChain;

    // --- OPTIONAL FIELDS

    totalRelayFee?: FeeBreakdown;
    relayerCapitalFee?: FeeBreakdown;
    relayerGasFee?: FeeBreakdown;
    lpFee?: FeeBreakdown;

    timestamp?: string;

    isAmountTooLow?: boolean;

    quoteBlock?: string;

    spokePoolAddress?: string;

    exclusiveRelayer?: string;

    exclusivityDeadline?: string | number;

    expectedFillTimeSec?: string;
    estimatedFillTimeSec?: string

    fillDeadline?: string;

    limits?: TransferLimits;

    destinationSpokePoolAddress?: string;
}

export interface BridgeDepositStatusModel {

    status: DepositStatus;

    originChainId: number;

    destinationChainId?: number;

    depositId: string;

    depositTxHash: string;

    depositTxnRef: string;

    depositRefundTxHash: string | null;

    depositRefundTxnRef: string | null;

    fillTxnRef: string;

    actionsSucceeded: string | null;

    pagination: {
        currentIndex: number;
        maxIndex: number;
    };

    fillStatus?: DepositStatus;

    fillTxHash?: string
}

interface DepositRecord extends BaseAcrossResponse {
    id?: number;
    relayHash?: string;
    depositId?: string;

    depositor?: string;
    recipient?: string;

    inputAmount?: string;
    outputAmount?: string;

    message?: string;
    messageHash?: string;

    exclusiveRelayer?: string;
    exclusivityDeadline?: string | null;
    fillDeadline?: string;
    quoteTimestamp?: string;

    depositTxHash?: string;
    depositBlockNumber?: number;
    depositBlockTimestamp?: string;

    status?: DepositStatus;

    depositRefundTxHash?: string | null;

    swapTokenPriceUsd?: string | null;
    swapFeeUsd?: string | null;

    bridgeFeeUsd?: string;
    inputPriceUsd?: string;
    outputPriceUsd?: string;

    fillGasFee?: string;
    fillGasFeeUsd?: string;
    fillGasTokenPriceUsd?: string;

    swapTransactionHash?: string | null;
    swapToken?: string | null;
    swapTokenAmount?: string | null;

    relayer?: string;
    fillBlockTimestamp?: string;
    fillTx: string;

    depositTxnRef?: string | null;
    depositRefundTxnRef?: string | null;
    fillTxnRef?: string | null;

    speedups?: string[];

}

export type BridgeDepositHistoryModel = DepositRecord[];

export interface BridgeSwapApprovalModel {

    id?: string;
    crossSwapType?: crossSwapType;
    amountType?: TradeType;
    checks?: ApprovalChecks;
    steps?: Steps;

    inputToken?: TokenOnChain;
    outputToken?: TokenOnChain;
    refundToken?: TokenOnChain;

    fees?: Fees;

    inputAmount?: string;                     // Required input amount in the smallest unit of the input token.
    expectedOutputAmount?: string;            // Expected amount of output token.: "263466241499732"
    minOutputAmount?: string;                 // Minimum guaranteed amount of output token. Ex: "260831579075100"
    expectedFillTime?: number;                // Expected time in seconds to complete the swap. Ex: 3

    swapTx?: SwapTransaction;
}

export interface BridgeExecutionPayload {
    inputToken: {
        address: string,
        amount: string,
        decimals: number,
        symbol: string
    },
    outputToken: {
        address: string,
        decimals: number,
        symbol: string,
        expectedAmount: string
    },
    chain: {
        originChainId: number,
        destinationChainId: number
    },
    recipient?: string,
    slippage?: number | 'auto',
    fee: {
        bridgeFeeInToken: string,
        estimatedFillTimeSec: string
    },
    transactionInfo: {
        outTax: {
            percentage: number;
            amountTokens: number;
            amountInCurrency: number;
        },
        gasCost: {
            amountTokens: number;
            amountInCurrency: number;
        },
        bridgeFee: {
            amountTokens: number;
            amountInCurrency: number;
        },
    }
}

export interface BridgeExecutionResponse {
    success: boolean;
    message: string;
    tsxHash: string;
    bridgeTransactionId: string;
    estimatedFillTimeSec?: string;
}

type DepositStatus =
    | "filled"
    | "pending"
    | "expired"
    | "refunded"
    | "slowFillRequested";

type crossSwapType = 'BRIDGEABLE_TO_BRIDGEABLE' | 'BRIDGEABLE_TO_ANY' | 'ANY_TO_BRIDGEABLE' | 'ANY_TO_ANY';

export type TradeType = 'exactInput' | 'minOutput' | 'exactOutput';
