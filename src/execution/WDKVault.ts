/**
 * Sovereign Reserve Agent - WDK Vault Implementation
 * 
 * DUAL MODE ARCHITECTURE:
 * - DEMO mode: Fully simulated, no native dependencies (works in Next.js)
 * - PRODUCTION mode: Uses real WDK via standalone service (requires Node.js + WDK packages)
 * 
 * For hackathon demo: This runs in DEMO mode with simulated swaps
 * For production: Run the WDK service and point to it for real blockchain operations
 */

import { ProofOfReasoningLogger } from '../logs/ProofOfReasoning';
import { getPriceOracle } from '@/oracle/PriceOracle';
import { wdkClient, SwapResponse, BridgeResponse } from '@/core/WDKServiceClient';

export const TOKEN_ADDRESSES = {
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  XAUT: '0x4922a015c4407F87432B179bb209e1253e29690f',
  ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
} as const;

export interface VaultConfig {
  seedPhrase: string;
  rpcUrl: string;
  swapMaxFee?: bigint;
  transferMaxFee?: bigint;
}

export interface TokenBalance {
  symbol: string;
  address: string;
  balance: bigint;
  decimals: number;
  formatted: string;
}

export interface SwapQuoteResult {
  sellToken: string;
  buyToken: string;
  sellAmount: bigint;
  buyAmount: bigint;
  fee: bigint;
  priceImpact: number;
}

export interface SwapResult {
  success: boolean;
  txHash?: string;
  approveHash?: string;
  resetAllowanceHash?: string;
  sellAmount?: bigint;
  buyAmount?: bigint;
  fee?: bigint;
  error?: string;
  timestamp: string;
  mode: 'LIVE' | 'DEMO';
}

export interface ReasonLog {
  hash: string;
  confidence: number;
  persona: string;
}

export interface MarketPrice {
  symbol: string;
  price: number;
  change24h: number;
  timestamp: string;
}

/**
 * Simulated Bitfinex Pricing Client
 * In production, this would use @tetherto/wdk-pricing-bitfinex-http
 */
class SimulatedPricingClient {
  private cachedPrices: Record<string, { price: number; timestamp: string }> = {};

  async getCurrentPrice(base: string, quote: string): Promise<number> {
    const now = new Date().toISOString();
    
    // Use realistic prices based on market
    const basePrices: Record<string, number> = {
      'UST': 1.0,
      'XAUT': 2650 + (Math.random() - 0.5) * 50,
      'BTC': 87000 + (Math.random() - 0.5) * 2000,
      'ETH': 3100 + (Math.random() - 0.5) * 100,
    };

    const price = basePrices[base] || 1.0;
    this.cachedPrices[`${base}_${quote}`] = { price, timestamp: now };
    return price;
  }
}

export class WDKVault {
  private proofLogger: ProofOfReasoningLogger;
  private config: VaultConfig | null = null;
  private isInitialized: boolean = false;
  private isDemoMode: boolean = true;
  private pricingClient: SimulatedPricingClient;
  
  // Simulated balances for demo (in smallest units: microunits for both tokens with 6 decimals)
  private demoBalances = {
    USDT: BigInt('5000000000'),  // 5,000 USDT (6 decimals)
    XAUT: BigInt('1000000'),      // 1 XAUT (6 decimals)
  };

  // Cached market prices
  private cachedPrices = {
    USDT: { price: 1.0, change24h: 0, timestamp: '' },
    XAUT: { price: 2650.0, change24h: 0, timestamp: '' },
  };

  constructor(proofLogger: ProofOfReasoningLogger) {
    this.proofLogger = proofLogger;
    this.pricingClient = new SimulatedPricingClient();
  }

  public async initialize(config?: Partial<VaultConfig>): Promise<void> {
    if (this.isInitialized) return;

    const seedPhrase = config?.seedPhrase ?? process.env.SRA_SEED_PHRASE ?? '';
    const rpcUrl = config?.rpcUrl ?? process.env.SRA_RPC_URL ?? '';

    // Check if we have real credentials
    if (!seedPhrase || seedPhrase === 'your_seed_phrase_here' || seedPhrase.length < 12) {
      console.log('[WDKVault] Running in DEMO MODE (simulated swaps)');
      this.isDemoMode = true;
      this.isInitialized = true;
      return;
    }

    // For now, always run in demo mode in Next.js
    // Real WDK requires Node.js runtime with native modules
    console.log('[WDKVault] Running in DEMO MODE (Next.js serverless environment)');
    console.log('[WDKVault] For production with real WDK, use standalone Node.js service');
    this.isDemoMode = true;
    this.isInitialized = true;

    this.config = { seedPhrase, rpcUrl, ...config };
  }

  public getMode(): 'LIVE' | 'DEMO' {
    return this.isDemoMode ? 'DEMO' : 'LIVE';
  }

  public async getAddress(): Promise<string> {
    if (this.isDemoMode) {
      return '0x742d35Cc6634C0532925a3b844Bc9e7595f8bE21';
    }
    throw new Error('[WDKVault] Not initialized');
  }

  public async fetchMarketPrice(symbol: 'USDT' | 'XAUT'): Promise<MarketPrice> {
    const timestamp = new Date().toISOString();
    
    try {
      const oracle = getPriceOracle();
      const marketData = await oracle.getMarketData();

      const tokenData = symbol === 'USDT' ? marketData.usdt : marketData.xaut;
      const price = tokenData.price;
      const change24h = tokenData.change24h;

      this.cachedPrices[symbol] = { price, change24h, timestamp };

      return { symbol, price, change24h, timestamp };
    } catch (error) {
      console.warn('[WDKVault] PriceOracle failed, using fallback pricing', error);

      const bitfinexSymbol = symbol === 'USDT' ? 'UST' : 'XAUT';
      const fallbackPrice = await this.pricingClient.getCurrentPrice(bitfinexSymbol, 'USD');
      const change24h = (Math.random() - 0.5) * 3;

      this.cachedPrices[symbol] = { price: fallbackPrice, change24h, timestamp };

      return { symbol, price: fallbackPrice, change24h, timestamp };
    }
  }

  public async fetchAllMarketPrices(): Promise<{ USDT: MarketPrice; XAUT: MarketPrice }> {
    const [usdt, xaut] = await Promise.all([
      this.fetchMarketPrice('USDT'),
      this.fetchMarketPrice('XAUT')
    ]);
    return { USDT: usdt, XAUT: xaut };
  }

  public async getTokenBalance(token: 'USDT' | 'XAUT'): Promise<TokenBalance> {
    const decimals = 6;
    
    if (this.isDemoMode) {
      const balance = this.demoBalances[token];
      return {
        symbol: token,
        address: TOKEN_ADDRESSES[token],
        balance,
        decimals,
        formatted: (Number(balance) / 1e6).toFixed(2)
      };
    }

    throw new Error('[WDKVault] Not initialized');
  }

  public async getAllBalances(): Promise<{ USDT: TokenBalance; XAUT: TokenBalance }> {
    const [usdt, xaut] = await Promise.all([
      this.getTokenBalance('USDT'),
      this.getTokenBalance('XAUT')
    ]);
    return { USDT: usdt, XAUT: xaut };
  }

  public async getEthBalance(): Promise<string> {
    return this.isDemoMode ? '0.1' : '0.0';
  }

  public async getSwapQuote(
    sellToken: 'USDT' | 'XAUT',
    buyToken: 'USDT' | 'XAUT',
    sellAmount: bigint
  ): Promise<SwapQuoteResult> {
    const xautPrice = Math.max(1, this.cachedPrices.XAUT.price);

    // Correct rate calculations:
    // USDT -> XAUT: rate = (1/xautPrice) * 1e6 to handle fractions (e.g., 377 for price 2650)
    // XAUT -> USDT: rate = xautPrice (unscaled, e.g., 2650)
    const usdToXautRate = BigInt(Math.round(1e6 / xautPrice));  // Scaled for fractions
    const xautToUsdRate = BigInt(Math.round(xautPrice));        // Unscaled (whole number)

    // Apply 0.3% slippage with correct division based on rate scaling:
    // USDT -> XAUT: divide by (1e6 * 1000) to unscale rate and apply slippage
    // XAUT -> USDT: divide by 1000 for slippage only
    let buyAmount: bigint;
    if (sellToken === 'USDT') {
      buyAmount = (sellAmount * usdToXautRate * BigInt(997)) / BigInt(1000000000);  // 1e9
    } else {
      buyAmount = (sellAmount * xautToUsdRate * BigInt(997)) / BigInt(1000);
    }

    return {
      sellToken,
      buyToken,
      sellAmount,
      buyAmount,
      fee: BigInt('15000'),  // Small fee in microunits (0.000015 tokens)
      priceImpact: 0.003
    };
  }

  public async executeHedgingSwap(
    sellToken: 'USDT' | 'XAUT',
    buyToken: 'USDT' | 'XAUT',
    amount: string,
    maxSlippageBps: number,
    reasonLog: ReasonLog
  ): Promise<SwapResult> {
    const timestamp = new Date().toISOString();
    
    // FIX: Handle potential scientific notation string input
    let numAmount: number;
    try {
      numAmount = parseFloat(amount);
      if (isNaN(numAmount) || !isFinite(numAmount)) {
        return { success: false, error: 'Invalid amount format', timestamp, mode: 'DEMO' };
      }
    } catch {
      return { success: false, error: 'Amount parsing failed', timestamp, mode: 'DEMO' };
    }
    
    const sellAmount = BigInt(Math.floor(numAmount));

    if (!this.isInitialized) await this.initialize();

    console.log('\n[WDKVault] HEDGING SWAP');
    console.log('  Mode:', this.isDemoMode ? 'DEMO' : 'LIVE');
    console.log('  Sell:', sellToken);
    console.log('  Buy:', buyToken);
    console.log('  Amount:', sellAmount.toString());
    console.log('  Max Slippage:', maxSlippageBps, 'bps');
    console.log('  Reason Hash:', reasonLog.hash.substring(0, 20) + '...');

    if (sellToken === buyToken) {
      return { success: false, error: 'Cannot swap same token', timestamp, mode: 'DEMO' };
    }

    if (sellAmount <= BigInt(0)) {
      return { success: false, error: 'Amount must be > 0', timestamp, mode: 'DEMO' };
    }

    try {
      // Check balance
      const balance = await this.getTokenBalance(sellToken);
      console.log('  Balance:', balance.formatted);

      if (balance.balance < sellAmount) {
        return {
          success: false,
          error: `Insufficient ${sellToken}. Have: ${balance.formatted}`,
          timestamp,
          mode: 'DEMO'
        };
      }

      // Get quote
      const quote = await this.getSwapQuote(sellToken, buyToken, sellAmount);
      console.log('  Expected output:', (Number(quote.buyAmount) / 1e6).toFixed(2), buyToken);

      // Try real WDK swap first (if service is available)
      if (!this.isDemoMode) {
        console.log('  [LIVE MODE] Attempting real WDK swap via service...');
        const realSwapResult = await this.executeRealSwap(
          sellToken,
          buyToken,
          sellAmount.toString(),
          quote.buyAmount
        );

        if (realSwapResult.success) {
          console.log('  [LIVE] Swap executed on blockchain');
          console.log('  TX Hash:', realSwapResult.transactionHash?.substring(0, 20) + '...');
          return {
            ...realSwapResult,
            txHash: realSwapResult.transactionHash,
            mode: 'LIVE'
          } as SwapResult;
        } else {
          // Fall back to demo mode if real swap fails
          console.log('  [LIVE] Swap failed, falling back to DEMO:', realSwapResult.error);
        }
      }

      // DEMO mode execution
      // Simulate processing delay
      await this.delay(1000 + Math.random() * 2000);

      // Generate mock tx hash
      const mockTxHash = '0x' + Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      // Update demo balances
      this.demoBalances[sellToken] -= sellAmount;
      this.demoBalances[buyToken] += quote.buyAmount;

      console.log('  [DEMO] Swap executed');
      console.log('  TX Hash:', mockTxHash.substring(0, 20) + '...');

      return {
        success: true,
        txHash: mockTxHash,
        sellAmount,
        buyAmount: quote.buyAmount,
        fee: quote.fee,
        timestamp,
        mode: 'DEMO'
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMsg, timestamp, mode: 'DEMO' };
    }
  }

  /**
   * Execute real swap via WDK blockchain service
   * This requires the WDK service to be running and initialized with a seed phrase
   */
  private async executeRealSwap(
    sellToken: string,
    buyToken: string,
    amount: string,
    expectedOutput: bigint
  ): Promise<SwapResponse> {
    try {
      const response = await wdkClient.swap({
        fromToken: TOKEN_ADDRESSES[sellToken as keyof typeof TOKEN_ADDRESSES],
        toToken: TOKEN_ADDRESSES[buyToken as keyof typeof TOKEN_ADDRESSES],
        amount,
        slippageTolerance: 0.01, // 1% slippage
      });

      return response;
    } catch (error) {
      console.error('[WDKVault] Real swap error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public getStatus(): { initialized: boolean; mode: 'LIVE' | 'DEMO' } {
    return { initialized: this.isInitialized, mode: this.getMode() };
  }

  public async emergencyStop(): Promise<void> {
    console.log('[WDKVault] EMERGENCY STOP');
    this.isInitialized = false;
  }

  public dispose(): void {}

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default WDKVault;
