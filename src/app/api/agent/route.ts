/**
 * Sovereign Reserve Agent - API Bridge Route Handler
 * Next.js 14 App Router API Endpoint
 * Connects Dashboard UI to OmniBrain Execution Core
 */

import { NextResponse } from 'next/server';
import { OmniBrain, PersonaType } from '@/core/OmniBrain';
import { WDKVault } from '@/execution/WDKVault';
import { ProofOfReasoningLogger } from '@/logs/ProofOfReasoning';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

interface AgentRequest {
  persona: PersonaType;
  action: 'evaluate_and_execute' | 'status' | 'history';
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface AgentResponse {
  success: boolean;
  persona: PersonaType;
  decision?: {
    action: string;
    confidence: number;
    reasoning: string;
    marketOutlook: string;
    riskAssessment: string;
  };
  proofOfReasoning?: {
    hash: string;
    timestamp: string;
    verificationEndpoint: string;
  };
  execution?: {
    success: boolean;
    txHash?: string;
    sellAmount?: string;
    buyAmount?: string;
    fee?: string;
    status: string;
    error?: string;
  };
  marketData?: {
    usdtPrice: number;
    xautPrice: number;
    usdtReserve: number;
    xautReserve: number;
    poolRatio: number;
    volatilityIndex: number;
  };
  walletData?: {
    usdt: number;
    xaut: number;
  };
  skipped?: boolean;
  skipReason?: string;
  timestamp: string;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCES
// ═══════════════════════════════════════════════════════════════════════════

let proofLoggerInstance: ProofOfReasoningLogger | null = null;
let vaultInstance: WDKVault | null = null;
let omniBrainInstance: OmniBrain | null = null;

/**
 * Get or create singleton instances for the agent components
 */
function initializeComponents(): {
  proofLogger: ProofOfReasoningLogger;
  vault: WDKVault;
  omniBrain: OmniBrain;
} {
  if (!proofLoggerInstance) {
    proofLoggerInstance = new ProofOfReasoningLogger();
  }

  if (!vaultInstance) {
    vaultInstance = new WDKVault(proofLoggerInstance);
  }

  if (!omniBrainInstance) {
    omniBrainInstance = new OmniBrain(vaultInstance, proofLoggerInstance);
  }

  return {
    proofLogger: proofLoggerInstance,
    vault: vaultInstance,
    omniBrain: omniBrainInstance
  };
}

/**
 * Validate persona type
 */
function isValidPersona(persona: unknown): persona is PersonaType {
  return persona === 'Ironclad' || persona === 'Surfer' || persona === 'Hawk';
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE HANDLER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/agent
 * Main entry point for Sovereign Reserve Agent execution
 */
export async function POST(request: Request): Promise<NextResponse<AgentResponse>> {
  const timestamp = new Date().toISOString();

  try {
    // Parse and validate request body
    let body: AgentRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          persona: 'Surfer' as PersonaType,
          timestamp,
          error: 'Invalid JSON in request body'
        },
        { status: 400 }
      );
    }

    // Validate persona
    if (!isValidPersona(body.persona)) {
      return NextResponse.json(
        {
          success: false,
          persona: 'Surfer' as PersonaType,
          timestamp,
          error: `Invalid persona: ${body.persona}. Must be one of: Ironclad, Surfer, Hawk`
        },
        { status: 400 }
      );
    }

    // Initialize components
    const { omniBrain, proofLogger } = initializeComponents();

    // Handle different actions
    switch (body.action) {
      case 'status': {
        const marketSnapshot = await omniBrain.fetchMarketData();
        const balances = await omniBrain.getWalletBalances();

        return NextResponse.json({
          success: true,
          persona: body.persona,
          timestamp,
          marketData: {
            usdtPrice: marketSnapshot.usdtPrice,
            xautPrice: marketSnapshot.xautPrice,
            usdtReserve: marketSnapshot.usdtReserve,
            xautReserve: marketSnapshot.xautReserve,
            poolRatio: marketSnapshot.usdtReserve / (marketSnapshot.usdtReserve + marketSnapshot.xautReserve * marketSnapshot.xautPrice),
            volatilityIndex: marketSnapshot.volatilityIndex
          },
          walletData: {
            usdt: balances.USDT,
            xaut: balances.XAUT
          }
        });
      }

      case 'history': {
        const executionHistory = omniBrain.getExecutionHistory();
        const decisionHistory = proofLogger.getDecisionHistory();
        
        return NextResponse.json({
          success: true,
          persona: body.persona,
          timestamp,
          skipped: true,
          skipReason: 'History retrieved'
        });
      }

      case 'evaluate_and_execute':
      default: {
        // Set persona
        omniBrain.setPersona(body.persona);

        // Execute market evaluation cycle
        const result = await omniBrain.evaluateMarketAndExecute(body.persona);

        // Build response
        const response: AgentResponse = {
          success: true,
          persona: body.persona,
          timestamp,
          decision: {
            action: result.swapResult?.success 
              ? (result.swapResult.txHash ? 'SWAP_EXECUTED' : 'HOLD') 
              : 'HOLD',
            confidence: result.proofReceipt.confidence,
            reasoning: result.skipReason || 'Market evaluation completed',
            marketOutlook: 'neutral',
            riskAssessment: 'medium'
          },
          proofOfReasoning: {
            hash: result.proofReceipt.hash,
            timestamp: result.proofReceipt.timestamp,
            verificationEndpoint: result.proofReceipt.verificationEndpoint
          },
          skipped: result.skipped,
          skipReason: result.skipReason
        };

        // Add live market and wallet state
        const currentMarket = await omniBrain.fetchMarketData();
        const reflectedWallet = await omniBrain.getWalletBalances();

        response.marketData = {
          usdtPrice: currentMarket.usdtPrice,
          xautPrice: currentMarket.xautPrice,
          usdtReserve: currentMarket.usdtReserve,
          xautReserve: currentMarket.xautReserve,
          poolRatio: currentMarket.usdtReserve / (currentMarket.usdtReserve + currentMarket.xautReserve * currentMarket.xautPrice),
          volatilityIndex: currentMarket.volatilityIndex
        };

        response.walletData = {
          usdt: reflectedWallet.USDT,
          xaut: reflectedWallet.XAUT
        };

        // Include execution result if swap was performed
        if (result.swapResult) {
          response.execution = {
            success: result.swapResult.success,
            txHash: result.swapResult.txHash,
            sellAmount: result.swapResult.sellAmount?.toString(),
            buyAmount: result.swapResult.buyAmount?.toString(),
            fee: result.swapResult.fee?.toString(),
            status: result.swapResult.success ? 'SUCCESS' : 'FAILED',
            error: result.swapResult.error
          };
        }

        return NextResponse.json(response);
      }
    }

  } catch (error) {
    // Comprehensive error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Log error for debugging
    console.error('[SRA API] Execution Error:');
    console.error('  Message:', errorMessage);
    if (errorStack) {
      console.error('  Stack:', errorStack.split('\n').slice(0, 3).join('\n'));
    }

    // Determine if this is a known error type
    let statusCode = 500;
    let userMessage = errorMessage;

    if (errorMessage.includes('SRA_SEED_PHRASE')) {
      userMessage = 'Wallet configuration error: Seed phrase not configured';
      statusCode = 503;
    } else if (errorMessage.includes('RPC')) {
      userMessage = 'RPC connection error: Unable to connect to Ethereum node';
      statusCode = 503;
    } else if (errorMessage.includes('SLIPPAGE_EXCEEDED')) {
      userMessage = 'Execution rejected: Slippage tolerance exceeded';
      statusCode = 422;
    } else if (errorMessage.includes('insufficient funds')) {
      userMessage = 'Execution failed: Insufficient wallet balance';
      statusCode = 422;
    }

    const errorResponse: AgentResponse = {
      success: false,
      persona: 'Surfer' as PersonaType,
      timestamp,
      error: userMessage
    };

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * GET /api/agent
 * Health check and status endpoint
 */
export async function GET(): Promise<NextResponse> {
  const timestamp = new Date().toISOString();

  try {
    const { omniBrain, proofLogger, vault } = initializeComponents();
    
    const executionHistory = omniBrain.getExecutionHistory();
    const decisionHistory = proofLogger.getDecisionHistory();
    const vaultStatus = vault.getStatus();

    return NextResponse.json({
      status: 'operational',
      timestamp,
      agent: {
        name: 'Sovereign Reserve Agent',
        version: '2.0.0',
        hackathon: 'DoraHacks Galactica 2026',
        track: 'Track 3: Autonomous DeFi Agent'
      },
      components: {
        proofOfReasoning: {
          status: 'active',
          totalDecisions: decisionHistory.length
        },
        wdkVault: {
          status: vaultStatus.mode === 'LIVE' ? 'connected' : 'demo',
          mode: vaultStatus.mode
        },
        omniBrain: {
          status: 'ready',
          activePersona: omniBrain.getActivePersona(),
          totalExecutions: executionHistory.length
        }
      },
      features: {
        personaShiftEngine: true,
        openClawIntegration: true,
        proofOfReasoning: true,
        wdkSwapProtocol: true,
        bitfinexPricing: true
      }
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      status: 'error',
      timestamp,
      error: errorMessage
    }, { status: 500 });
  }
}
