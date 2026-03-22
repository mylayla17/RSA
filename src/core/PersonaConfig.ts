/**
 * Sovereign Reserve Agent - Persona Configuration
 * Shared types and configurations for persona-based risk management
 */

export type PersonaType = 'Ironclad' | 'Surfer' | 'Hawk';
export type TokenType = 'USDt' | 'USA₮' | 'XAUt';

export interface PersonaConfig {
  name: string;
  description: string;
  riskProfile: 'conservative' | 'balanced' | 'aggressive';
  maxSlippageBps: number;
  rebalanceThreshold: number;
  preferredHedgeToken: TokenType | 'balanced';
  confidenceThreshold: number;
  volatilityTolerance: number;
  maxPositionSizePercent: number;
  reasoningStyle: string;
  decisionFactors: string[];
}

export const PERSONA_CONFIGS: Record<PersonaType, PersonaConfig> = {
  Ironclad: {
    name: 'Ironclad',
    description: 'Ultra-conservative fortress guardian. Prioritizes capital preservation.',
    riskProfile: 'conservative',
    maxSlippageBps: 5,
    rebalanceThreshold: 0.02,
    preferredHedgeToken: 'USDt',
    confidenceThreshold: 0.95,
    volatilityTolerance: 0.15,
    maxPositionSizePercent: 5,
    reasoningStyle: 'Defensive analysis with multi-layer validation.',
    decisionFactors: [
      'Capital preservation',
      'Minimum slippage',
      'USDt stability priority',
      'Volatility avoidance',
      'Regulatory compliance'
    ]
  },
  Surfer: {
    name: 'Surfer',
    description: 'Balanced wave-rider. Seeks optimal yield with risk awareness.',
    riskProfile: 'balanced',
    maxSlippageBps: 30,
    rebalanceThreshold: 0.05,
    preferredHedgeToken: 'balanced',
    confidenceThreshold: 0.75,
    volatilityTolerance: 0.35,
    maxPositionSizePercent: 20,
    reasoningStyle: 'Flow-state analysis. Balances opportunity with calculated risk.',
    decisionFactors: [
      'Yield optimization',
      'Balanced exposure',
      'Market momentum',
      'Opportunistic rebalancing',
      'Trend following'
    ]
  },
  Hawk: {
    name: 'Hawk',
    description: 'Aggressive arbitrage hunter. High-frequency alpha focus.',
    riskProfile: 'aggressive',
    maxSlippageBps: 100,
    rebalanceThreshold: 0.08,
    preferredHedgeToken: 'XAUt',
    confidenceThreshold: 0.60,
    volatilityTolerance: 0.60,
    maxPositionSizePercent: 35,
    reasoningStyle: 'Predatory analysis. Strikes on market inefficiencies.',
    decisionFactors: [
      'Arbitrage detection',
      'XAUt momentum',
      'Price discrepancy',
      'High-frequency opportunity',
      'Alpha generation'
    ]
  }
};

export default PERSONA_CONFIGS;
