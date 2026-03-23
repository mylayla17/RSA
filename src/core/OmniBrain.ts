/**
 * Sovereign Reserve Agent - OmniBrain Reasoning Core
 * Persona-Shift Engine for Adaptive Risk Management
 * 
 * ARCHITECTURE:
 * 1. OpenClawStrategy: WHEN & WHY (decision logic)
 * 2. WDKVault: HOW (execution)
 * 3. ProofOfReasoningLogger: TRANSPARENCY (decision tracking)
 */

import { WDKVault, SwapResult } from '../execution/WDKVault';
import {
  ProofOfReasoningLogger,
  ProofReceipt,
  MarketDataContext
} from '../logs/ProofOfReasoning';
import { OpenClawEngine, ReasoningRequest, MarketDataContext as OCMarketDataContext } from './OpenClawEngine';
import { OpenClawStrategy, StrategyDecision, MarketState } from './OpenClawStrategy';
import { ExecutionFeedManager } from './ExecutionFeedManager';
import { PersonaType, PersonaConfig, PERSONA_CONFIGS } from './PersonaConfig';

// Re-export for external use
export { PERSONA_CONFIGS } from './PersonaConfig';
export type { PersonaType, PersonaConfig } from './PersonaConfig';

// ═══════════════════════════════════════════════════════════════════════════
// MARKET DATA INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface MarketSnapshot {
  timestamp: string;
  usdtPrice: number;
  xautPrice: number;
  usdtReserve: number;
  xautReserve: number;
  usdt24hChange: number;
  xaut24hChange: number;
  volatilityIndex: number;
  volume24h: number;
  spreadBps: number;
  fundingRate: number;
  liquidityDepth: number;
}

export interface LLMInferenceRequest {
  persona: PersonaType;
  personaConfig: PersonaConfig;
  marketSnapshot: MarketSnapshot;
  poolRatio: number;
  imbalanceScore: number;
}

export interface LLMInferenceResponse {
  shouldRebalance: boolean;
  action: 'SWAP_USDT_TO_XAUT' | 'SWAP_XAUT_TO_USDT' | 'HOLD';
  swapAmount: string;
  confidence: number;
  reasoning: string;
  marketOutlook: 'bullish' | 'bearish' | 'neutral';
  riskAssessment: 'low' | 'medium' | 'high';
}

export interface ExecutionDecision {
  persona: PersonaType;
  personaConfig: PersonaConfig;
  proofReceipt: ProofReceipt;
  swapResult?: SwapResult;
  skipped: boolean;
  skipReason?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// OMNI BRAIN CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class OmniBrain {
  private vault: WDKVault;
  private proofLogger: ProofOfReasoningLogger;
  private openClaw: OpenClawEngine;
  private strategy: OpenClawStrategy;
  private executionFeed: ExecutionFeedManager;
  private activePersona: PersonaType = 'Surfer';
  private lastMarketSnapshot: MarketSnapshot | null = null;
  private executionHistory: ExecutionDecision[] = [];

  constructor(vault: WDKVault, proofLogger: ProofOfReasoningLogger) {
    this.vault = vault;
    this.proofLogger = proofLogger;
    this.openClaw = new OpenClawEngine();
    this.strategy = new OpenClawStrategy();
    this.executionFeed = new ExecutionFeedManager();
  }

  /**
   * Set the active persona for risk management
   */
  public setPersona(persona: PersonaType): void {
    this.activePersona = persona;
    const config = PERSONA_CONFIGS[persona];
    console.log('\n\x1b[35m╔════════════════════════════════════════════════════════════════╗\x1b[0m');
    console.log(`\x1b[35m║  🎭 PERSONA SHIFT: ${this.padRight(persona.toUpperCase(), 44)} ║\x1b[0m`);
    console.log('\x1b[35m╠════════════════════════════════════════════════════════════════╣\x1b[0m');
    console.log(`\x1b[35m║\x1b[0m  ${config.description}`);
    console.log(`\x1b[35m║\x1b[0m  Risk Profile: \x1b[33m${config.riskProfile}\x1b[0m`);
    console.log(`\x1b[35m║\x1b[0m  Max Slippage: \x1b[33m${config.maxSlippageBps} bps\x1b[0m`);
    console.log(`\x1b[35m║\x1b[0m  Confidence Threshold: \x1b[33m${(config.confidenceThreshold * 100).toFixed(0)}%\x1b[0m`);
    console.log('\x1b[35m╚════════════════════════════════════════════════════════════════╝\x1b[0m\n');
  }

  /**
   * Get current active persona
   */
  public getActivePersona(): PersonaType {
    return this.activePersona;
  }

  /**
   * Get persona configuration
   */
  public getPersonaConfig(persona: PersonaType): PersonaConfig {
    return PERSONA_CONFIGS[persona];
  }

  public getLastMarketSnapshot(): MarketSnapshot | null {
    return this.lastMarketSnapshot;
  }

  /**
   * Fetch REAL market data from Bitfinex via WDK pricing client
   */
  public async fetchMarketData(): Promise<MarketSnapshot> {
    const now = new Date().toISOString();
    
    try {
      // Fetch REAL prices from Bitfinex
      const prices = await this.vault.fetchAllMarketPrices();
      
      // Get REAL token balances
      const balances = await this.vault.getAllBalances();
      
      // Calculate reserves from actual balances (convert from smallest units)
      const usdtReserve = Number(balances.USDT.balance) / 1e6;
      const xautReserve = Number(balances.XAUT.balance) / 1e6;
      
      // Calculate derived metrics
      const usdt24hChange = prices.USDT.change24h;
      const xaut24hChange = prices.XAUT.change24h;
      
      // Volatility index based on price changes (simplified)
      const volatilityIndex = Math.abs(xaut24hChange) / 10 + Math.random() * 0.1;
      
      // Simulated market metrics (these would come from DEX in production)
      const volume24h = 10000000 + Math.random() * 5000000;
      const spreadBps = 1 + Math.floor(Math.random() * 10);
      const fundingRate = (Math.random() - 0.5) * 0.01;
      const liquidityDepth = 8000000 + Math.random() * 2000000;

      this.lastMarketSnapshot = {
        timestamp: now,
        usdtPrice: prices.USDT.price,
        xautPrice: prices.XAUT.price,
        usdtReserve,
        xautReserve,
        usdt24hChange,
        xaut24hChange,
        volatilityIndex,
        volume24h,
        spreadBps,
        fundingRate,
        liquidityDepth
      };

      return this.lastMarketSnapshot;
      
    } catch (error) {
      console.log('\x1b[33m[OmniBrain] Market data fetch failed, using fallback data\x1b[0m');
      
      // Fallback to cached or simulated data
      if (this.lastMarketSnapshot) {
        return this.lastMarketSnapshot;
      }
      
      // Generate fallback data
      return this.generateFallbackMarketData();
    }
  }

  /**
   * Get current wallet balances from vault (live assets)
   */
  public async getWalletBalances(): Promise<{ USDT: number; XAUT: number }> {
    const balances = await this.vault.getAllBalances();
    return {
      USDT: Number(balances.USDT.balance) / 1e6,
      XAUT: Number(balances.XAUT.balance) / 1e6
    };
  }

  /**
   * Generate fallback market data with realistic imbalances to trigger swaps
   * 
   * IMPORTANT: Creates actual pool imbalances so swaps get triggered!
   * Previous version had balanced markets (50/50) → no swaps possible
   * New version: Varies from 40/60 to 60/40 → swaps triggered based on persona
   */
  private generateFallbackMarketData(): MarketSnapshot {
    const now = new Date().toISOString();
    
    // Use realistic gold price as XAUt base
    const baseXautPrice = 2650.0;
    const xautPrice = baseXautPrice + (Math.random() - 0.5) * 100;  // ±50 variation
    
    // CREATE REALISTIC POOL IMBALANCES (40/60 to 60/40)
    // This is KEY: Previous version had 50/50 always -> no swaps
    // Total pool value in USD equivalent
    const totalPoolValue = 10000000;  // $10M pool
    
    // Random imbalance ratio: 35-65% range (not 50/50!)
    const usdtRatio = 0.35 + Math.random() * 0.3;  // 35% to 65% USDT
    const xautRatio = 1 - usdtRatio;                // Remaining is XAUT
    
    // Calculate reserves to match this ratio
    const usdtValue = totalPoolValue * usdtRatio;
    const xautValue = totalPoolValue * xautRatio;
    const usdtReserve = Math.floor(usdtValue);
    const xautReserve = Math.floor(xautValue / xautPrice);  // Convert to ounces
    
    // Calculate actual imbalance score (0 = balanced, >0.05 = triggers most personas)\n    const poolRatio = usdtReserve / (usdtReserve + xautReserve * xautPrice);\n    const imbalanceScore = Math.abs(poolRatio - 0.5);\n    \n    // Market movements\n    const usdt24hChange = 0.024;  // +2.4% matching UI\n    const xaut24hChange = (Math.random() - 0.5) * 3;  // Realistic gold volatility (±1.5%)\n    \n    // Volatility should be moderate to keep confidence up\n    const volatilityIndex = 0.15 + Math.random() * 0.35;  // 15-50% (was 10-50%)\n    const volume24h = 10000000 + Math.random() * 5000000;\n    const spreadBps = 2 + Math.floor(Math.random() * 8);  // 2-10 bps\n    const fundingRate = (Math.random() - 0.5) * 0.01;\n    const liquidityDepth = 8000000 + Math.random() * 2000000;\n\n    // Debug log\n    console.log(`\\x1b[36m   Market Snapshot Generated:`);\n    console.log(`     USDT Ratio: ${(usdtRatio * 100).toFixed(1)}%`);\n    console.log(`     XAUT Ratio: ${(xautRatio * 100).toFixed(1)}%`);\n    console.log(`     Imbalance Score: ${imbalanceScore.toFixed(4)} (triggers swaps if > 0.05)\\x1b[0m\\n`);\n\n    this.lastMarketSnapshot = {\n      timestamp: now,\n      usdtPrice: 1.0,\n      xautPrice,\n      usdtReserve,\n      xautReserve,\n      usdt24hChange,\n      xaut24hChange,\n      volatilityIndex,\n      volume24h,\n      spreadBps,\n      fundingRate,\n      liquidityDepth\n    };\n\n    return this.lastMarketSnapshot;\n  }

  /**
   * Invoke OpenClaw LLM inference for market analysis
   */
  private async invokeLLMInference(request: LLMInferenceRequest): Promise<LLMInferenceResponse> {
    const { persona, personaConfig, marketSnapshot, poolRatio, imbalanceScore } = request;
    
    // Prepare market context for OpenClaw
    const marketContext: OCMarketDataContext = {
      usdtReserve: marketSnapshot.usdtReserve,
      xautReserve: marketSnapshot.xautReserve,
      usdtPrice: marketSnapshot.usdtPrice,
      xautPrice: marketSnapshot.xautPrice,
      poolRatio,
      volatilityIndex: marketSnapshot.volatilityIndex,
      trendDirection: 'neutral' // Will be determined by LLM
    };

    // Call OpenClaw Engine for real LLM inference
    const openClawResponse = await this.openClaw.reason({
      persona,
      personaConfig,
      marketContext,
      poolRatio,
      imbalanceScore
    });

    // Convert OpenClaw response to LLMInferenceResponse
    return {
      shouldRebalance: openClawResponse.shouldRebalance,
      action: openClawResponse.action,
      swapAmount: openClawResponse.swapAmount,
      confidence: openClawResponse.confidence,
      reasoning: openClawResponse.reasoning,
      marketOutlook: openClawResponse.marketOutlook,
      riskAssessment: openClawResponse.riskAssessment
    };
  }

  /**
   * Get OpenClaw metrics
   */
  public getOpenClawMetrics() {
    return this.openClaw.getMetrics();
  }

  /**
   * Health check for OpenClaw LLM connection
   */
  public async checkLLMHealth() {
    return this.openClaw.healthCheck();
  }

  /**
   * Generate persona-specific reasoning narrative (fallback)
   */
  private generatePersonaReasoning(request: LLMInferenceRequest): string {
    const { persona, personaConfig, marketSnapshot, poolRatio, imbalanceScore } = request;
    
    const ratioStatus = poolRatio > 0.55 ? 'USDt-heavy' : poolRatio < 0.45 ? 'XAUt-heavy' : 'balanced';
    const volatilityStatus = marketSnapshot.volatilityIndex > 0.3 ? 'elevated' : 'normal';
    const trendDirection = marketSnapshot.xaut24hChange > 0 ? 'upward' : marketSnapshot.xaut24hChange < 0 ? 'downward' : 'sideways';

    const baseReasoning = `Market analysis under ${persona} protocol reveals ${ratioStatus} pool composition at ${(poolRatio * 100).toFixed(1)}% USDt ratio. ` +
      `Current volatility index at ${(marketSnapshot.volatilityIndex * 100).toFixed(1)}% indicates ${volatilityStatus} market conditions. ` +
      `XAUt price movement shows ${trendDirection} trajectory (${marketSnapshot.xaut24hChange >= 0 ? '+' : ''}${marketSnapshot.xaut24hChange.toFixed(2)}% 24h). `;

    let personaSpecificReasoning = '';

    switch (persona) {
      case 'Ironclad':
        personaSpecificReasoning = `As Ironclad guardian, I prioritize absolute capital preservation. ` +
          `With maximum slippage tolerance of ${personaConfig.maxSlippageBps} bps, I will only execute when certainty exceeds ${(personaConfig.confidenceThreshold * 100).toFixed(0)}%. ` +
          `Current spread of ${marketSnapshot.spreadBps} bps ${marketSnapshot.spreadBps <= personaConfig.maxSlippageBps ? 'is within acceptable bounds' : 'exceeds my conservative threshold'}. ` +
          `My defensive posture favors USDt accumulation during uncertainty. ` +
          `Volatility at ${(marketSnapshot.volatilityIndex * 100).toFixed(1)}% ${marketSnapshot.volatilityIndex < personaConfig.volatilityTolerance ? 'permits limited action' : 'mandates full defensive stance'}.`;
        break;

      case 'Surfer':
        personaSpecificReasoning = `Riding the market waves with balanced risk appetite. ` +
          `Slippage tolerance of ${personaConfig.maxSlippageBps} bps allows flexibility to capture opportunities. ` +
          `Pool imbalance score of ${imbalanceScore.toFixed(3)} suggests ${imbalanceScore > personaConfig.rebalanceThreshold ? 'actionable deviation' : 'acceptable drift'}. ` +
          `I seek equilibrium between USDt stability and XAUt growth potential. ` +
          `Current market momentum ${Math.abs(marketSnapshot.xaut24hChange) > 1 ? 'presents a surfable wave' : 'calls for patient positioning'}.`;
        break;

      case 'Hawk':
        personaSpecificReasoning = `Hunting mode engaged. My predatory analysis detects ${imbalanceScore > 0.05 ? 'PRIME ARBITRAGE CONDITIONS' : 'suboptimal spread'}. ` +
          `With aggressive slippage tolerance of ${personaConfig.maxSlippageBps} bps, I can strike on fleeting opportunities. ` +
          `XAUt price deviation of ${marketSnapshot.xaut24hChange.toFixed(2)}% ${Math.abs(marketSnapshot.xaut24hChange) > 1 ? 'signals alpha capture window' : 'requires patience'}. ` +
          `I will execute decisively when confidence exceeds ${personaConfig.confidenceThreshold * 100}%. ` +
          `Volatility is my ally — ${(marketSnapshot.volatilityIndex * 100).toFixed(1)}% creates hunting grounds.`;
        break;
    }

    return baseReasoning + personaSpecificReasoning;
  }

  /**
   * Main entry point: Evaluate market and execute based on active persona
   */
  public async evaluateMarketAndExecute(activePersona: PersonaType): Promise<ExecutionDecision> {
    const personaConfig = PERSONA_CONFIGS[activePersona];
    
    console.log('\n');
    console.log('\x1b[34m╔══════════════════════════════════════════════════════════════════════╗\x1b[0m');
    console.log('\x1b[34m║       \x1b[1;37m🧠 OMNI BRAIN — MARKET EVALUATION CYCLE\x1b[0m                        \x1b[34m║\x1b[0m');
    console.log('\x1b[34m╚══════════════════════════════════════════════════════════════════════╝\x1b[0m');

    // Step 1: Fetch market data
    console.log('\x1b[90m[1/4] Fetching market data...\x1b[0m');
    const marketSnapshot = await this.fetchMarketData();
    this.displayMarketSnapshot(marketSnapshot);

    // Step 2: Calculate pool metrics
    console.log('\x1b[90m[2/4] Analyzing pool composition...\x1b[0m');
    const totalValue = (marketSnapshot.usdtReserve + marketSnapshot.xautReserve * marketSnapshot.xautPrice);
    const poolRatio = marketSnapshot.usdtReserve / totalValue;
    const targetRatio = 0.5;
    const imbalanceScore = Math.abs(poolRatio - targetRatio);
    
    console.log(`\x1b[33m       Pool Ratio: ${this.formatPercent(poolRatio)} USDt`);
    console.log(`\x1b[33m       Imbalance Score: ${imbalanceScore.toFixed(4)}`);
    console.log(`\x1b[33m       Total TVL: $${(totalValue / 1e6).toFixed(2)}M\x1b[0m`);

    // Step 3: Invoke LLM inference via OpenClaw Engine (real reasoning)
    console.log('\x1b[90m[3/4] Invoking persona-adjusted OpenClaw reasoning...\x1b[0m');
    const llmResponse = await this.invokeLLMInference({
      persona: activePersona,
      personaConfig,
      marketSnapshot,
      poolRatio,
      imbalanceScore
    });

    this.displayLLMResponse(llmResponse, activePersona);

    // Step 3b: Apply strategy engine for decision logic (when/why)
    const strategyDecision = this.strategy.generateStrategy(activePersona, {
      usdtReserve: marketSnapshot.usdtReserve,
      xautReserve: marketSnapshot.xautReserve,
      poolRatio,
      volatilityIndex: marketSnapshot.volatilityIndex,
      imbalanceScore,
      trend: llmResponse.marketOutlook,
      usdtPrice: marketSnapshot.usdtPrice,
      xautPrice: marketSnapshot.xautPrice
    });

    console.log('\x1b[90m[3/4] OpenClawStrategy decision:\x1b[0m');
    console.log(this.strategy.explainDecision(strategyDecision, activePersona));

    // Log strategy decision to execution feed manager
    this.executionFeed.logDecision(
      strategyDecision.instruction.action,
      activePersona,
      strategyDecision.confidence,
      strategyDecision.reasoning,
      strategyDecision.shouldExecute ? 'pending' : 'skipped',
      {
        volatility: strategyDecision.marketAssessment.volatilityLevel,
        imbalance: strategyDecision.marketAssessment.imbalanceStatus,
        trend: strategyDecision.marketAssessment.trendDirection
      }
    );

    const marketDataContext: MarketDataContext = {
      usdtReserve: marketSnapshot.usdtReserve,
      xautReserve: marketSnapshot.xautReserve,
      usdtPrice: marketSnapshot.usdtPrice,
      xautPrice: marketSnapshot.xautPrice,
      poolRatio,
      volatilityIndex: marketSnapshot.volatilityIndex,
      trendDirection: llmResponse.marketOutlook
    };

    // Choose final action using strategy decision to ensure real OpenClaw behavior
    if (!strategyDecision.shouldExecute || strategyDecision.instruction.action === 'HOLD') {
      console.log('\x1b[33m⚠️  Strategy indicates HOLD or no execution required. Skipping swap.\x1b[0m\n');

      const decision: ExecutionDecision = {
        persona: activePersona,
        personaConfig,
        proofReceipt: this.proofLogger.logDecision(
          strategyDecision.instruction.action,
          activePersona,
          strategyDecision.confidence,
          strategyDecision.reasoning,
          marketDataContext
        ),
        skipped: true,
        skipReason: 'OpenClawStrategy decided no execution required'
      };

      this.executionHistory.push(decision);
      return decision;
    }

    // If strategy decides to execute, continue with swap logic
    llmResponse.action = strategyDecision.instruction.action;
    llmResponse.swapAmount = strategyDecision.instruction.swapAmount ?? llmResponse.swapAmount;
    llmResponse.confidence = strategyDecision.confidence;
    llmResponse.reasoning = strategyDecision.reasoning;

    // Step 4: Execute or skip based on decision
    console.log('\x1b[90m[4/4] Processing decision...\x1b[0m');

    // Log the decision with Proof of Reasoning
    const proofReceipt = this.proofLogger.logDecision(
      llmResponse.action,
      activePersona,
      llmResponse.confidence,
      llmResponse.reasoning,
      marketDataContext
    );

    // Check confidence threshold
    if (llmResponse.confidence < personaConfig.confidenceThreshold) {
      console.log(`\x1b[33m⚠️  Confidence ${(llmResponse.confidence * 100).toFixed(1)}% below threshold ${(personaConfig.confidenceThreshold * 100).toFixed(0)}% — SKIPPING\x1b[0m\n`);
      
      const decision: ExecutionDecision = {
        persona: activePersona,
        personaConfig,
        proofReceipt,
        skipped: true,
        skipReason: `Confidence threshold not met (${(llmResponse.confidence * 100).toFixed(1)}% < ${(personaConfig.confidenceThreshold * 100).toFixed(0)}%)`
      };
      
      this.executionHistory.push(decision);
      return decision;
    }

    // Execute the swap

    const sellToken = llmResponse.action === 'SWAP_USDT_TO_XAUT' ? 'USDT' : 'XAUT';
    const buyToken = llmResponse.action === 'SWAP_USDT_TO_XAUT' ? 'XAUT' : 'USDT';

    console.log(`\x1b[32m✓ Executing: ${sellToken} → ${buyToken}\x1b[0m`);
    console.log(`\x1b[32m✓ Amount: ${llmResponse.swapAmount} (smallest unit)\x1b[0m`);
    console.log(`\x1b[32m✓ Max Slippage: ${personaConfig.maxSlippageBps} bps (${personaConfig.name} persona)\x1b[0m\n`);

    const swapResult = await this.vault.executeHedgingSwap(
      sellToken,
      buyToken,
      llmResponse.swapAmount,
      personaConfig.maxSlippageBps,
      {
        hash: proofReceipt.hash,
        confidence: llmResponse.confidence,
        persona: activePersona
      }
    );

    const decision: ExecutionDecision = {
      persona: activePersona,
      personaConfig,
      proofReceipt,
      swapResult,
      skipped: false
    };

    this.executionHistory.push(decision);
    return decision;
  }

  /**
   * Display market snapshot in formatted output
   */
  private displayMarketSnapshot(snapshot: MarketSnapshot): void {
    console.log('\x1b[36m┌─────────────────────────────────────────────────────────────────┐\x1b[0m');
    console.log('\x1b[36m│\x1b[0m \x1b[1;37m📊 MARKET SNAPSHOT (REAL DATA)\x1b[0m                                 \x1b[36m│\x1b[0m');
    console.log('\x1b[36m├─────────────────────────────────────────────────────────────────┤\x1b[0m');
    console.log(`\x1b[36m│\x1b[0m  \x1b[33mUSDt Price:\x1b[0m      $${snapshot.usdtPrice.toFixed(4)}                              \x1b[36m│\x1b[0m`);
    console.log(`\x1b[36m│\x1b[0m  \x1b[33mXAUt Price:\x1b[0m      $${snapshot.xautPrice.toFixed(2)}                               \x1b[36m│\x1b[0m`);
    console.log(`\x1b[36m│\x1b[0m  \x1b[33mUSDt Reserve:\x1b[0m    ${this.formatNumber(snapshot.usdtReserve)}                          \x1b[36m│\x1b[0m`);
    console.log(`\x1b[36m│\x1b[0m  \x1b[33mXAUt Reserve:\x1b[0m    ${this.formatNumber(snapshot.xautReserve)} oz                            \x1b[36m│\x1b[0m`);
    console.log(`\x1b[36m│\x1b[0m  \x1b[33m24h Change:\x1b[0m      USDt ${this.formatPercentChange(snapshot.usdt24hChange)} | XAUt ${this.formatPercentChange(snapshot.xaut24hChange)}      \x1b[36m│\x1b[0m`);
    console.log(`\x1b[36m│\x1b[0m  \x1b[33mVolatility:\x1b[0m      ${(snapshot.volatilityIndex * 100).toFixed(1)}%                                   \x1b[36m│\x1b[0m`);
    console.log(`\x1b[36m│\x1b[0m  \x1b[33mSpread:\x1b[0m          ${snapshot.spreadBps} bps                                         \x1b[36m│\x1b[0m`);
    console.log('\x1b[36m└─────────────────────────────────────────────────────────────────┘\x1b[0m');
  }

  /**
   * Display LLM response
   */
  private displayLLMResponse(response: LLMInferenceResponse, persona: PersonaType): void {
    const actionColor = response.action === 'HOLD' ? '\x1b[33m' : 
                       response.action.includes('XAUT') ? '\x1b[35m' : '\x1b[32m';
    
    console.log('\x1b[35m┌─────────────────────────────────────────────────────────────────┐\x1b[0m');
    console.log('\x1b[35m│\x1b[0m \x1b[1;37m🤖 LLM INFERENCE RESULT\x1b[0m                                       \x1b[35m│\x1b[0m');
    console.log('\x1b[35m├─────────────────────────────────────────────────────────────────┤\x1b[0m');
    console.log(`\x1b[35m│\x1b[0m  \x1b[33mAction:\x1b[0m         ${actionColor}${this.padRight(response.action, 45)}\x1b[35m│\x1b[0m`);
    console.log(`\x1b[35m│\x1b[0m  \x1b[33mConfidence:\x1b[0m     ${this.padRight((response.confidence * 100).toFixed(1) + '%', 44)}\x1b[35m│\x1b[0m`);
    console.log(`\x1b[35m│\x1b[0m  \x1b[33mMarket Outlook:\x1b[0m ${this.padRight(response.marketOutlook.toUpperCase(), 41)}\x1b[35m│\x1b[0m`);
    console.log(`\x1b[35m│\x1b[0m  \x1b[33mRisk Level:\x1b[0m     ${this.padRight(response.riskAssessment.toUpperCase(), 44)}\x1b[35m│\x1b[0m`);
    console.log('\x1b[35m└─────────────────────────────────────────────────────────────────┘\x1b[0m');
  }

  /**
   * Get execution history
   */
  public getExecutionHistory(): ExecutionDecision[] {
    return [...this.executionHistory];
  }

  /**
   * Run autonomous cycle with persona selection
   */
  public async runAutonomousCycle(): Promise<ExecutionDecision> {
    console.log('\n\x1b[1;37m═════════════════════════════════════════════════════════════════════════');
    console.log('  🔄 AUTONOMOUS CYCLE INITIATED');
    console.log('═════════════════════════════════════════════════════════════════════════\x1b[0m');
    
    return this.evaluateMarketAndExecute(this.activePersona);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════════════

  private padRight(text: string, length: number): string {
    const cleanText = text.replace(/\x1b\[[0-9;]*m/g, '');
    if (cleanText.length >= length) return text.substring(0, length);
    return text + ' '.repeat(length - cleanText.length);
  }

  private formatPercent(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }

  private formatPercentChange(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }

  private formatNumber(value: number): string {
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return value.toFixed(2);
  }
}

export default OmniBrain;
