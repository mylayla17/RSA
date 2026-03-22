/**
 * Sovereign Reserve Agent - Proof of Reasoning Logger
 * Accountability Layer for Autonomous DeFi Decision Making
 * Generates immutable cryptographic receipts of AI reasoning chains
 */

import { createHash } from 'crypto';

export interface DecisionPayload {
  timestamp: string;
  action: string;
  persona: string;
  confidence: number;
  reasoning: string;
  marketDataContext: MarketDataContext;
}

export interface MarketDataContext {
  usdtReserve: number;
  xautReserve: number;
  usdtPrice: number;
  xautPrice: number;
  poolRatio: number;
  volatilityIndex: number;
  trendDirection: 'bullish' | 'bearish' | 'neutral';
}

export interface ProofReceipt {
  hash: string;
  timestamp: string;
  action: string;
  persona: string;
  confidence: number;
  verificationEndpoint: string;
}

export interface LoggedDecision extends ProofReceipt {
  payload: DecisionPayload;
  reasoningPreview: string;
  riskScore: number;
}

export class ProofOfReasoningLogger {
  private readonly algorithm = 'sha256';
  private readonly verificationBase = 'https://verify.sovereign-reserve.ai/proof';
  private decisionHistory: LoggedDecision[] = [];

  /**
   * Logs an AI decision with cryptographic proof of reasoning
   */
  public logDecision(
    action: string,
    persona: string,
    confidence: number,
    reasoning: string,
    marketDataContext: MarketDataContext
  ): ProofReceipt {
    const timestamp = new Date().toISOString();
    
    const payload: DecisionPayload = {
      timestamp,
      action,
      persona,
      confidence,
      reasoning,
      marketDataContext
    };

    const serializedPayload = JSON.stringify(payload, Object.keys(payload).sort());
    const hash = createHash(this.algorithm)
      .update(serializedPayload)
      .digest('hex');

    const riskScore = this.calculateRiskScore(confidence, marketDataContext);
    
    const loggedDecision: LoggedDecision = {
      hash,
      timestamp,
      action,
      persona,
      confidence,
      verificationEndpoint: `${this.verificationBase}/${hash}`,
      payload,
      reasoningPreview: reasoning.length > 80 ? `${reasoning.substring(0, 77)}...` : reasoning,
      riskScore
    };

    this.decisionHistory.push(loggedDecision);
    this.renderDecisionOutput(loggedDecision, reasoning);
    
    return {
      hash,
      timestamp,
      action,
      persona,
      confidence,
      verificationEndpoint: `${this.verificationBase}/${hash}`
    };
  }

  /**
   * Calculates a composite risk score based on confidence and market conditions
   */
  private calculateRiskScore(confidence: number, context: MarketDataContext): number {
    const confidenceRisk = (1 - confidence) * 40;
    const volatilityRisk = Math.min(context.volatilityIndex * 10, 30);
    const imbalanceRisk = Math.abs(0.5 - context.poolRatio) * 60;
    const trendRisk = context.trendDirection === 'neutral' ? 10 : 0;
    
    return Math.min(Math.round(confidenceRisk + volatilityRisk + imbalanceRisk + trendRisk), 100);
  }

  /**
   * Renders beautifully formatted terminal output simulating AI thought process
   */
  private renderDecisionOutput(decision: LoggedDecision, fullReasoning: string): void {
    const border = '═'.repeat(72);
    const innerBorder = '─'.repeat(70);
    
    console.log('\n');
    console.log(`\x1b[36m${border}\x1b[0m`);
    console.log(`\x1b[36m║\x1b[0m  \x1b[1;35m🧠 SOVEREIGN RESERVE AGENT — PROOF OF REASONING\x1b[0m            \x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m${border}\x1b[0m`);
    
    // Identity Block
    console.log(`\x1b[36m║\x1b[0m \x1b[33mPersona:\x1b[0m    ${this.padRight(decision.persona, 55)} \x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m║\x1b[0m \x1b[33mAction:\x1b[0m     ${this.padRight(decision.action, 55)} \x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m║\x1b[0m \x1b[33mTimestamp:\x1b[0m  ${this.padRight(decision.timestamp, 54)} \x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m${innerBorder}\x1b[0m`);
    
    // Confidence Meter
    const confidenceBar = this.generateProgressBar(decision.confidence, 30, 'green');
    console.log(`\x1b[36m║\x1b[0m \x1b[33mConfidence:\x1b[0m ${confidenceBar} ${(decision.confidence * 100).toFixed(1)}%              \x1b[36m║\x1b[0m`);
    
    // Risk Score Meter
    const riskBar = this.generateProgressBar(decision.riskScore / 100, 30, decision.riskScore > 50 ? 'red' : 'yellow');
    console.log(`\x1b[36m║\x1b[0m \x1b[33mRisk Score:\x1b[0m ${riskBar} ${decision.riskScore}/100                \x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m${innerBorder}\x1b[0m`);
    
    // Reasoning Chain
    console.log(`\x1b[36m║\x1b[0m \x1b[1;37m💭 REASONING CHAIN\x1b[0m                                               \x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m║\x1b[0m                                                                   \x1b[36m║\x1b[0m`);
    
    const reasoningLines = this.wrapText(fullReasoning, 65);
    for (const line of reasoningLines.slice(0, 4)) {
      console.log(`\x1b[36m║\x1b[0m   \x1b[37m${this.padRight(line, 65)}\x1b[0m \x1b[36m║\x1b[0m`);
    }
    if (reasoningLines.length > 4) {
      console.log(`\x1b[36m║\x1b[0m   \x1b[90m... reasoning continues ...\x1b[0m                              \x1b[36m║\x1b[0m`);
    }
    console.log(`\x1b[36m${innerBorder}\x1b[0m`);
    
    // Cryptographic Proof
    console.log(`\x1b[36m║\x1b[0m \x1b[1;37m🔐 CRYPTOGRAPHIC RECEIPT\x1b[0m                                         \x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m║\x1b[0m                                                                   \x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m║\x1b[0m   \x1b[90mSHA-256:\x1b[0m ${this.padRight(decision.hash.substring(0, 24) + '...', 52)} \x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m║\x1b[0m   \x1b[90mVerify:\x1b[0m  ${this.padRight(decision.verificationEndpoint.substring(0, 48) + '...', 51)} \x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m${border}\x1b[0m`);
    
    // Status Indicator
    const statusIcon = decision.confidence >= 0.8 ? '✅' : decision.confidence >= 0.6 ? '⚠️' : '🛑';
    const statusText = decision.confidence >= 0.8 ? 'DECISION APPROVED' : decision.confidence >= 0.6 ? 'DECISION FLAGGED' : 'DECISION REJECTED';
    const statusColor = decision.confidence >= 0.8 ? '\x1b[32m' : decision.confidence >= 0.6 ? '\x1b[33m' : '\x1b[31m';
    
    console.log(`\x1b[36m║\x1b[0m                                                                   \x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m║\x1b[0m   ${statusIcon} ${statusColor}${statusText}\x1b[0m                                            \x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m${border}\x1b[0m`);
    console.log('\n');
  }

  /**
   * Generates a visual progress bar
   */
  private generateProgressBar(value: number, width: number, color: 'green' | 'yellow' | 'red'): string {
    const filled = Math.round(value * width);
    const empty = width - filled;
    
    const colorCode = color === 'green' ? '\x1b[32m' : color === 'yellow' ? '\x1b[33m' : '\x1b[31m';
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    
    return `${colorCode}[${bar}]\x1b[0m`;
  }

  /**
   * Pads text to a specific length for alignment
   */
  private padRight(text: string, length: number): string {
    if (text.length >= length) return text.substring(0, length);
    return text + ' '.repeat(length - text.length);
  }

  /**
   * Wraps text to a maximum line width
   */
  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    
    return lines;
  }

  /**
   * Retrieves the full decision history
   */
  public getDecisionHistory(): LoggedDecision[] {
    return [...this.decisionHistory];
  }

  /**
   * Verifies a decision hash against stored history
   */
  public verifyDecision(hash: string): LoggedDecision | null {
    return this.decisionHistory.find(d => d.hash === hash) || null;
  }

  /**
   * Exports decision history for audit purposes
   */
  public exportAuditLog(): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      totalDecisions: this.decisionHistory.length,
      decisions: this.decisionHistory
    }, null, 2);
  }

  /**
   * Clears decision history (use with caution)
   */
  public clearHistory(): void {
    this.decisionHistory = [];
    console.log('\x1b[33m⚠️  Proof of Reasoning history cleared.\x1b[0m\n');
  }
}

export default ProofOfReasoningLogger;
