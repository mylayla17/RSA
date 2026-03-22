/**
 * Sovereign Reserve Agent - OpenClaw Reasoning Engine
 * REAL Implementation using z-ai-web-dev-sdk (FREE AI)
 * 
 * Supports:
 * - DEMO mode: Uses free z-ai-web-dev-sdk (no API key needed)
 * - PRODUCTION mode: User can provide their own LLM API endpoint
 */

import ZAI from 'z-ai-web-dev-sdk';
import { PersonaType, PersonaConfig } from './PersonaConfig';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface MarketDataContext {
  usdtReserve: number;
  xautReserve: number;
  usdtPrice: number;
  xautPrice: number;
  poolRatio: number;
  volatilityIndex: number;
  trendDirection: string;
}

export interface ReasoningRequest {
  persona: PersonaType;
  personaConfig: PersonaConfig;
  marketContext: MarketDataContext;
  poolRatio: number;
  imbalanceScore: number;
}

export interface ReasoningResponse {
  shouldRebalance: boolean;
  action: 'SWAP_USDT_TO_XAUT' | 'SWAP_XAUT_TO_USDT' | 'HOLD';
  swapAmount: string;
  confidence: number;
  reasoning: string;
  marketOutlook: 'bullish' | 'bearish' | 'neutral';
  riskAssessment: 'low' | 'medium' | 'high';
  rawLLMResponse?: string;
  model: string;
  latencyMs: number;
}

export interface LLMConfig {
  mode: 'DEMO' | 'PRODUCTION';
  customEndpoint?: string;
  customApiKey?: string;
  model?: string;
  temperature?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// OPENCLAW ENGINE - REAL IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

export class OpenClawEngine {
  private config: LLMConfig;
  private zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;
  private requestCount: number = 0;
  private totalLatency: number = 0;
  private initialized: boolean = false;

  constructor(config?: Partial<LLMConfig>) {
    this.config = {
      mode: config?.mode ?? (process.env.SRA_LLM_MODE as 'DEMO' | 'PRODUCTION') ?? 'DEMO',
      customEndpoint: config?.customEndpoint ?? process.env.SRA_LLM_ENDPOINT,
      customApiKey: config?.customApiKey ?? process.env.SRA_LLM_API_KEY,
      model: config?.model ?? process.env.SRA_LLM_MODEL ?? 'default',
      temperature: config?.temperature ?? 0.7
    };
  }

  /**
   * Initialize the LLM connection
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    if (this.config.mode === 'DEMO') {
      // Initialize z-ai-web-dev-sdk (FREE, no API key needed)
      try {
        this.zai = await ZAI.create();
        console.log('\x1b[32m[OpenClaw] ✓ Initialized with z-ai-web-dev-sdk (FREE)\x1b[0m\n');
        this.initialized = true;
      } catch (error) {
        console.log('\x1b[33m[OpenClaw] SDK init failed, using rule-based fallback\x1b[0m\n');
        this.initialized = true;
      }
    } else {
      console.log(`\x1b[32m[OpenClaw] ✓ Production mode with custom endpoint\x1b[0m\n`);
      this.initialized = true;
    }
  }

  /**
   * Main reasoning method - matches OmniBrain expected interface
   */
  public async reason(request: ReasoningRequest): Promise<ReasoningResponse> {
    const startTime = Date.now();
    this.requestCount++;

    // Ensure initialized
    if (!this.initialized) {
      await this.initialize();
    }

    console.log('\x1b[35m[OpenClaw] Initiating reasoning inference...\x1b[0m');
    console.log(`\x1b[90m         Mode: ${this.config.mode}\x1b[0m`);
    console.log(`\x1b[90m         Persona: ${request.persona}\x1b[0m`);

    try {
      let response: ReasoningResponse;

      if (this.config.mode === 'DEMO' && this.zai) {
        // Use FREE z-ai-web-dev-sdk
        try {
          response = await this.invokeFreeLLM(request);
        } catch (error) {
          console.log('[OpenClaw] Free LLM failed, using rule-based');
          response = this.ruleBasedReasoning(request);
        }
      } else if (this.config.mode === 'PRODUCTION' && this.config.customEndpoint) {
        // Use custom LLM endpoint (Production mode)
        response = await this.invokeCustomLLM(request);
      } else {
        // Fallback to rule-based
        response = this.ruleBasedReasoning(request);
      }

      const latency = Date.now() - startTime;
      this.totalLatency += latency;
      
      console.log(`\x1b[32m[OpenClaw] ✓ Inference complete (${latency}ms)\x1b[0m`);
      console.log(`\x1b[32m         Decision: ${response.action}\x1b[0m`);
      console.log(`\x1b[32m         Confidence: ${(response.confidence * 100).toFixed(1)}%\x1b[0m\n`);

      return { ...response, latencyMs: latency };

    } catch (error) {
      const latency = Date.now() - startTime;
      console.log(`\x1b[31m[OpenClaw] Inference failed, using fallback\x1b[0m\n`);
      
      return {
        ...this.ruleBasedReasoning(request),
        latencyMs: latency
      };
    }
  }

  /**
   * Invoke FREE z-ai-web-dev-sdk
   */
  private async invokeFreeLLM(request: ReasoningRequest): Promise<ReasoningResponse> {
    if (!this.zai) {
      await this.initialize();
    }

    if (!this.zai) {
      return this.ruleBasedReasoning(request);
    }

    const systemPrompt = this.buildSystemPrompt(request);
    const userPrompt = this.buildUserPrompt(request);

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: this.config.temperature
      });

      const content = completion.choices?.[0]?.message?.content || '';
      
      return this.parseResponse(content, request);
    } catch (error) {
      console.log('\x1b[33m[OpenClaw] Free LLM call failed, using fallback\x1b[0m');
      return this.ruleBasedReasoning(request);
    }
  }

  /**
   * Invoke custom LLM endpoint (Production mode)
   */
  private async invokeCustomLLM(request: ReasoningRequest): Promise<ReasoningResponse> {
    if (!this.config.customEndpoint) {
      throw new Error('No custom endpoint configured');
    }

    const systemPrompt = this.buildSystemPrompt(request);
    const userPrompt = this.buildUserPrompt(request);

    const response = await fetch(this.config.customEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.customApiKey && { 'Authorization': `Bearer ${this.config.customApiKey}` })
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: this.config.temperature
      })
    });

    if (!response.ok) {
      throw new Error(`Custom LLM error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || data.response || data.text || '';
    
    return this.parseResponse(content, request);
  }

  /**
   * Build system prompt with persona context
   */
  private buildSystemPrompt(request: ReasoningRequest): string {
    return `You are the Sovereign Reserve Agent (SRA), an autonomous AI managing USDt/XAUt liquidity.

## Active Persona: ${request.persona}

**Risk Profile:** ${request.personaConfig.riskProfile}
**Max Slippage:** ${request.personaConfig.maxSlippageBps} bps
**Confidence Threshold:** ${(request.personaConfig.confidenceThreshold * 100).toFixed(0)}%
**Reasoning Style:** ${request.personaConfig.reasoningStyle}

## Decision Factors
${request.personaConfig.decisionFactors.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## Response Format (JSON only)
{
  "shouldRebalance": boolean,
  "action": "SWAP_USDT_TO_XAUT" | "SWAP_XAUT_TO_USDT" | "HOLD",
  "swapAmount": "<amount in smallest unit (6 decimals)>",
  "confidence": <0.0-1.0>,
  "reasoning": "<brief explanation>",
  "marketOutlook": "bullish" | "bearish" | "neutral",
  "riskAssessment": "low" | "medium" | "high"
}`;
  }

  /**
   * Build user prompt with market data
   */
  private buildUserPrompt(request: ReasoningRequest): string {
    const { marketContext, poolRatio, imbalanceScore } = request;
    
    return `## Market Data

| Metric | Value |
|--------|-------|
| USDt Reserve | ${marketContext.usdtReserve.toLocaleString()} |
| XAUt Reserve | ${marketContext.xautReserve.toLocaleString()} oz |
| USDt Price | $${marketContext.usdtPrice.toFixed(4)} |
| XAUt Price | $${marketContext.xautPrice.toFixed(2)} |
| Pool Ratio | ${(poolRatio * 100).toFixed(2)}% USDt |
| Imbalance | ${imbalanceScore.toFixed(4)} |
| Volatility | ${(marketContext.volatilityIndex * 100).toFixed(1)}% |
| Trend | ${marketContext.trendDirection.toUpperCase()} |

Analyze and decide. Return JSON only.`;
  }

  /**
   * Parse LLM response
   */
  private parseResponse(content: string, request: ReasoningRequest): ReasoningResponse {
    try {
      console.log('[OpenClaw] Parsing response:', content.substring(0, 200) + '...');
      
      // Extract JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log('[OpenClaw] No JSON found in response');
        throw new Error('No JSON found');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('[OpenClaw] Parsed JSON:', parsed);
      
      return {
        shouldRebalance: Boolean(parsed.shouldRebalance),
        action: this.validateAction(parsed.action),
        swapAmount: String(parsed.swapAmount || '0'),
        confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
        reasoning: String(parsed.reasoning || 'No reasoning provided'),
        marketOutlook: this.validateOutlook(parsed.marketOutlook),
        riskAssessment: this.validateRisk(parsed.riskAssessment),
        rawLLMResponse: content,
        model: this.config.mode === 'DEMO' ? 'z-ai-free' : this.config.model ?? 'custom',
        latencyMs: 0
      };
    } catch (error) {
      console.log('[OpenClaw] Parse failed, using fallback:', error);
      return this.ruleBasedReasoning(request);
    }
  }

  /**
   * Rule-based fallback reasoning
   */
  private ruleBasedReasoning(request: ReasoningRequest): ReasoningResponse {
    const { personaConfig, marketContext, poolRatio, imbalanceScore } = request;
    
    let action: 'SWAP_USDT_TO_XAUT' | 'SWAP_XAUT_TO_USDT' | 'HOLD' = 'HOLD';
    let shouldRebalance = false;
    let confidence = personaConfig.confidenceThreshold;

    if (imbalanceScore > personaConfig.rebalanceThreshold) {
      shouldRebalance = true;
      
      if (poolRatio > 0.55) {
        action = 'SWAP_USDT_TO_XAUT';
      } else if (poolRatio < 0.45) {
        action = 'SWAP_XAUT_TO_USDT';
      }
      
      confidence = marketContext.volatilityIndex < personaConfig.volatilityTolerance
        ? personaConfig.confidenceThreshold + 0.1
        : personaConfig.confidenceThreshold;
    }

    const riskAssessment = marketContext.volatilityIndex > 0.4 ? 'high' 
                         : marketContext.volatilityIndex > 0.2 ? 'medium' 
                         : 'low';

    const marketOutlook = marketContext.trendDirection === 'bullish' ? 'bullish'
                        : marketContext.trendDirection === 'bearish' ? 'bearish'
                        : 'neutral';

    // Calculate swap amount based on REAL USD values (small, realistic amounts)
    // Persona determines max USD swap value:
    // - Ironclad: $50 (conservative)
    // - Surfer: $100 (balanced)
    // - Hawk: $150 (aggressive)
    let swapAmount = '0';
    if (shouldRebalance && action !== 'HOLD') {
      // Determine swap USD value based on persona (realistic amounts)
      const usdSwapMap: Record<string, number> = {
        'Ironclad': 50,    // $50
        'Surfer': 100,     // $100
        'Hawk': 150        // $150
      };
      
      const maxUsdValue = usdSwapMap[personaConfig.name] || 100;
      
      // Convert USD value to actual token amount based on real market prices
      let swapAmountNum = 0;
      if (action === 'SWAP_USDT_TO_XAUT') {
        // Selling USDT: amount = USD value / 1.0 (USDT price)
        swapAmountNum = Math.floor((maxUsdValue / marketContext.usdtPrice) * 1e6);
      } else {
        // Selling XAUT: amount = USD value / XAUT price
        swapAmountNum = Math.floor((maxUsdValue / marketContext.xautPrice) * 1e6);
      }
      
      swapAmount = swapAmountNum.toFixed(0); // Use toFixed to avoid scientific notation
      
      console.log(`[OpenClaw] action=${action}, USD value=${maxUsdValue}, price=${action === 'SWAP_USDT_TO_XAUT' ? marketContext.usdtPrice : marketContext.xautPrice}, swapAmount=${swapAmount}`);
    }

    return {
      shouldRebalance,
      action,
      swapAmount,
      confidence: Math.min(confidence, 0.99),
      reasoning: `[RULE-BASED] Pool ratio ${(poolRatio * 100).toFixed(1)}% with imbalance ${imbalanceScore.toFixed(4)}. ${personaConfig.name} persona with ${personaConfig.maxSlippageBps} bps max slippage.`,
      marketOutlook,
      riskAssessment,
      model: 'rule-based',
      latencyMs: 0
    };
  }

  // Validators
  private validateAction(a: unknown): 'SWAP_USDT_TO_XAUT' | 'SWAP_XAUT_TO_USDT' | 'HOLD' {
    const validActions = ['SWAP_USDT_TO_XAUT', 'SWAP_XAUT_TO_USDT', 'HOLD'] as const;
    const strA = String(a);
    return validActions.includes(strA as typeof validActions[number]) 
      ? strA as 'SWAP_USDT_TO_XAUT' | 'SWAP_XAUT_TO_USDT' | 'HOLD' 
      : 'HOLD';
  }

  private validateOutlook(o: unknown): 'bullish' | 'bearish' | 'neutral' {
    return ['bullish', 'bearish', 'neutral'].includes(String(o)) ? o as 'bullish' | 'bearish' | 'neutral' : 'neutral';
  }

  private validateRisk(r: unknown): 'low' | 'medium' | 'high' {
    return ['low', 'medium', 'high'].includes(String(r)) ? r as 'low' | 'medium' | 'high' : 'medium';
  }

  /**
   * Get metrics
   */
  public getMetrics() {
    return {
      requests: this.requestCount,
      avgLatencyMs: this.requestCount > 0 ? this.totalLatency / this.requestCount : 0,
      mode: this.config.mode,
      initialized: this.initialized
    };
  }

  /**
   * Health check for LLM connection
   */
  public async healthCheck() {
    return {
      status: this.initialized ? 'healthy' : 'not_initialized',
      mode: this.config.mode,
      hasZai: !!this.zai,
      hasCustomEndpoint: !!this.config.customEndpoint
    };
  }
}

export default OpenClawEngine;
