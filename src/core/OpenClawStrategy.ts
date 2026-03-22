/**
 * OpenClaw Strategy Engine - Real Implementation
 * Separates STRATEGY (when/why decisions) from EXECUTION (how)
 * 
 * Based on WDK OpenClaw documentation:
 * - https://docs.wdk.tether.io/ai/openclaw
 * - https://docs.wdk.tether.io/ai/agent-skills
 * 
 * Strategy Pattern:
 * 1. Analyze market (volatility, trends, imbalance)
 * 2. Evaluate against persona thresholds
 * 3. Generate strategy (decision + reasoning)
 * 4. Return executable instruction (separate from execution)
 */

import { PersonaType, PersonaConfig, PERSONA_CONFIGS } from './PersonaConfig';

export interface MarketState {
  usdtPrice: number;
  xautPrice: number;
  usdtReserve: number;
  xautReserve: number;
  volatilityIndex: number;
  poolRatio: number;
  imbalanceScore: number;
  trend: 'bullish' | 'bearish' | 'neutral';
}

export interface StrategyDecision {
  // WHEN & WHY - The actual reasoning
  shouldExecute: boolean;
  reasoning: string;
  confidence: number;
  
  // Context for the decision
  marketAssessment: {
    volatilityLevel: 'low' | 'medium' | 'high';
    imbalanceStatus: 'balanced' | 'slight_deviation' | 'significant_imbalance';
    trendDirection: string;
    needsRebalance: boolean;
  };
  
  // Executable instruction (separated from execution)
  instruction: {
    action: 'SWAP_USDT_TO_XAUT' | 'SWAP_XAUT_TO_USDT' | 'HOLD';
    swapAmount?: string; // In smallest unit (microunits)
    maxSlippageBps: number;
    estimatedImpact: string;
  };
}

/**
 * OpenClaw Strategy Engine
 * 
 * DIFFERENCE from previous: This engine DECIDES (when/why), separate from EXECUTION
 * An autonomous agent using this strategy doesn't just follow rules—it explains its reasoning
 */
export class OpenClawStrategy {
  private metrics = {
    decisionsGenerated: 0,
    avgConfidence: 0.75,
    lastMarketState: null as MarketState | null
  };

  /**
   * Generate a strategic decision based on market analysis
   * This returns WHAT to do and WHY, not HOW (execution is separate)
   */
  public generateStrategy(persona: PersonaType, market: MarketState): StrategyDecision {
    const config = PERSONA_CONFIGS[persona];
    this.metrics.lastMarketState = market;

    // WHEN: Analyze market conditions
    const volatilityLevel = this.assessVolatility(market.volatilityIndex);
    const imbalanceStatus = this.assessImbalance(market.imbalanceScore, config.rebalanceThreshold);
    const shouldRebalance = imbalanceStatus !== 'balanced';

    // WHAT ACTION: Determine rebalancing instruction
    let action: 'SWAP_USDT_TO_XAUT' | 'SWAP_XAUT_TO_USDT' | 'HOLD' = 'HOLD';
    let swapAmount: string | undefined = undefined;

    if (shouldRebalance) {
      // Determine direction
      if (market.poolRatio > 0.55) {
        action = 'SWAP_USDT_TO_XAUT';
      } else if (market.poolRatio < 0.45) {
        action = 'SWAP_XAUT_TO_USDT';
      }

      // Calculate amount
      if (action !== 'HOLD') {
        const reserve =
          action === 'SWAP_USDT_TO_XAUT'
            ? market.usdtReserve
            : market.xautReserve;
        const maxSwap = reserve * (config.maxPositionSizePercent / 100);
        const swapAmountNum = Math.floor(maxSwap * 1e6);
        swapAmount = swapAmountNum.toFixed(0); // Avoid scientific notation
      }
    }

    // WHY: Generate reasoning
    const confidence = this.calculateConfidence(
      market,
      config,
      volatilityLevel,
      shouldRebalance
    );

    const reasoning =
      action === 'HOLD'
        ? this.generateHoldReasoning(persona, market, imbalanceStatus)
        : this.generateSwapReasoning(
            persona,
            action,
            market,
            imbalanceStatus,
            volatilityLevel
          );

    // Check confidence threshold
    const passThreshold = confidence >= config.confidenceThreshold;

    this.metrics.decisionsGenerated++;
    this.metrics.avgConfidence =
      (this.metrics.avgConfidence + confidence) / 2;

    return {
      shouldExecute: passThreshold && action !== 'HOLD',
      reasoning,
      confidence,
      marketAssessment: {
        volatilityLevel,
        imbalanceStatus,
        trendDirection: market.trend,
        needsRebalance: shouldRebalance
      },
      instruction: {
        action: passThreshold ? action : 'HOLD',
        swapAmount: passThreshold ? swapAmount : undefined,
        maxSlippageBps: config.maxSlippageBps,
        estimatedImpact: this.estimateImpact(config, swapAmount || '0')
      }
    };
  }

  /**
   * Explain a decision for logging and transparency
   */
  public explainDecision(decision: StrategyDecision, persona: PersonaType): string {
    const config = PERSONA_CONFIGS[persona];
    return `
[OpenClaw Strategy - ${persona}]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DECISION: ${decision.instruction.action}
Confidence: ${(decision.confidence * 100).toFixed(1)}% (threshold: ${(config.confidenceThreshold * 100).toFixed(0)}%)
REASONING:
  ${decision.reasoning}
  
MARKET ASSESSMENT:
  ├─ Volatility: ${decision.marketAssessment.volatilityLevel}
  ├─ Imbalance: ${decision.marketAssessment.imbalanceStatus}
  ├─ Trend: ${decision.marketAssessment.trendDirection}
  └─ Needs Rebalancing: ${decision.marketAssessment.needsRebalance}
  
${decision.shouldExecute ? `EXECUTION INSTRUCTION:
  ├─ Action: ${decision.instruction.action}
  ├─ Amount: ${decision.instruction.swapAmount} (microunits)
  ├─ Max Slippage: ${decision.instruction.maxSlippageBps} bps
  └─ Est. Impact: ${decision.instruction.estimatedImpact}` : 'NO EXECUTION (threshold not met)'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;
  }

  // ════════════════════════════════════════════════════════════════════════
  // PRIVATE: Market Assessment Logic
  // ════════════════════════════════════════════════════════════════════════

  private assessVolatility(
    index: number
  ): 'low' | 'medium' | 'high' {
    if (index < 0.2) return 'low';
    if (index < 0.4) return 'medium';
    return 'high';
  }

  private assessImbalance(
    score: number,
    threshold: number
  ): 'balanced' | 'slight_deviation' | 'significant_imbalance' {
    if (score < threshold * 0.5) return 'balanced';
    if (score < threshold) return 'slight_deviation';
    return 'significant_imbalance';
  }

  private calculateConfidence(
    market: MarketState,
    config: PersonaConfig,
    volatilityLevel: string,
    shouldRebalance: boolean
  ): number {
    let baseConfidence = config.confidenceThreshold;

    // Adjust based on volatility
    if (volatilityLevel === 'low' && shouldRebalance) {
      baseConfidence += 0.1; // More confident in stable markets
    } else if (volatilityLevel === 'high') {
      baseConfidence -= 0.15; // Less confident in volatile markets
    }

    // Clamp to [0, 1]
    return Math.max(0, Math.min(1, baseConfidence));
  }

  private generateHoldReasoning(
    persona: PersonaType,
    market: MarketState,
    imbalanceStatus: string
  ): string {
    const statusText = {
      balanced: 'pool is well-balanced',
      slight_deviation: 'imbalance is minor',
      significant_imbalance: 'timing is unfavorable'
    }[imbalanceStatus] || 'conditions unclear';

    return `Current ${persona} analysis: ${statusText}. Maintaining position.`;
  }

  private generateSwapReasoning(
    persona: PersonaType,
    action: string,
    market: MarketState,
    imbalanceStatus: string,
    volatilityLevel: string
  ): string {
    const direction =
      action === 'SWAP_USDT_TO_XAUT'
        ? 'rebalance toward XAUt (bullish stance)'
        : 'rebalance toward USDt (risk-off stance)';
    const volatilityContext =
      volatilityLevel === 'high'
        ? ' despite elevated volatility'
        : '';

    return `${persona} protocol triggered: ${direction}. Pool imbalance (${imbalanceStatus}) warrants adjustment${volatilityContext}. Based on risk profile and market conditions.`;
  }

  private estimateImpact(config: PersonaConfig, swapAmount: string): string {
    const amount = parseFloat(swapAmount) / 1e6;
    if (amount === 0) return 'No impact (HOLD)';

    const slippagePercent = config.maxSlippageBps / 100;
    const impact = (amount * slippagePercent) / 100;

    return `~${impact.toFixed(2)} USD equivalent slippage`;
  }

  // ════════════════════════════════════════════════════════════════════════
  // METRICS & DIAGNOSTICS
  // ════════════════════════════════════════════════════════════════════════

  public getMetrics() {
    return {
      decisionsGenerated: this.metrics.decisionsGenerated,
      averageConfidence: this.metrics.avgConfidence.toFixed(3),
      lastMarketState: this.metrics.lastMarketState
    };
  }

  public resetMetrics() {
    this.metrics = {
      decisionsGenerated: 0,
      avgConfidence: 0.75,
      lastMarketState: null
    };
  }
}

export default OpenClawStrategy;
