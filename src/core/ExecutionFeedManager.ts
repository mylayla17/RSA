/**
 * Execution Feed Manager
 * Central hub for synchronizing OmniBrain terminal history with WDK Execution Feed
 * Ensures dashboard sees unified execution history
 */

export interface ExecutionLogEntry {
  id: string;
  timestamp: string;
  action: string;
  persona: string;
  status: 'success' | 'failed' | 'pending' | 'skipped';
  txHash?: string;
  amount?: string;
  slippage?: number;
  confidence?: number;
  reasoning?: string; // From strategy
  marketState?: {
    volatility: string;
    imbalance: string;
    trend: string;
  };
}

/**
 * Central repository for all execution events
 * Used by OmniBrain to track decisions and by Dashboard to display
 */
export class ExecutionFeedManager {
  private logs: ExecutionLogEntry[] = [];
  private maxLogs = 100; // Keep last 100 entries
  private subscribers: Array<(logs: ExecutionLogEntry[]) => void> = [];

  /**
   * Add a new execution event to feed
   */
  public logExecution(entry: Omit<ExecutionLogEntry, 'id'>): ExecutionLogEntry {
    const logEntry: ExecutionLogEntry = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...entry
    };

    this.logs.push(logEntry);

    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Notify subscribers
    this.notifySubscribers();

    console.log(`[ExecutionFeed] Logged: ${logEntry.action} - ${logEntry.status}`);
    return logEntry;
  }

  /**
   * Log a decision (with or without execution)
   */
  public logDecision(
    action: string,
    persona: string,
    confidence: number,
    reasoning: string,
    status: 'success' | 'failed' | 'pending' | 'skipped',
    marketState?: { volatility: string; imbalance: string; trend: string },
    txHash?: string,
    amounts?: { sell: number; buy: number }
  ): ExecutionLogEntry {
    return this.logExecution({
      timestamp: new Date().toISOString(),
      action,
      persona,
      status,
      confidence,
      reasoning,
      marketState,
      txHash,
      amount: amounts ? `${amounts.sell.toFixed(2)} → ${amounts.buy.toFixed(2)}` : undefined,
      slippage: Math.random() * 50 // Placeholder
    });
  }

  /**
   * Get all logs
   */
  public getLogs(): ExecutionLogEntry[] {
    return [...this.logs]; // Return copy to prevent external mutations
  }

  /**
   * Get logs filtered by persona
   */
  public getLogsByPersona(persona: string): ExecutionLogEntry[] {
    return this.logs.filter(log => log.persona === persona);
  }

  /**
   * Get successful swaps only
   */
  public getSuccessfulSwaps(): ExecutionLogEntry[] {
    return this.logs.filter(log => log.status === 'success' && log.txHash);
  }

  /**
   * Subscribe to execution feed updates
   */
  public subscribe(callback: (logs: ExecutionLogEntry[]) => void): () => void {
    this.subscribers.push(callback);
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Get statistics
   */
  public getStats() {
    const successful = this.logs.filter(l => l.status === 'success').length;
    const failed = this.logs.filter(l => l.status === 'failed').length;
    const skipped = this.logs.filter(l => l.status === 'skipped').length;

    return {
      total: this.logs.length,
      successful,
      failed,
      skipped,
      successRate: this.logs.length > 0 
        ? ((successful / (successful + failed)) * 100).toFixed(1) 
        : '0.0'
    };
  }

  /**
   * Clear all logs
   */
  public clear(): void {
    this.logs = [];
    this.notifySubscribers();
  }

  /**
   * Notify all subscribers of updated logs
   */
  private notifySubscribers(): void {
    for (const subscriber of this.subscribers) {
      subscriber([...this.logs]);
    }
  }
}

export default ExecutionFeedManager;
