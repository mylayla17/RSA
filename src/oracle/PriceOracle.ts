/**
 * Sovereign Reserve Agent - Real Price Oracle
 * Fetches LIVE market data from CoinGecko API (FREE)
 */

export interface TokenPrice {
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  lastUpdated: string;
}

export interface MarketData {
  usdt: TokenPrice;
  xaut: TokenPrice;
  goldPrice: number;
  ethPrice: number;
  timestamp: string;
  source: 'LIVE' | 'FALLBACK';
}

// CoinGecko API (FREE, no API key needed)
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

const COINGECKO_IDS = {
  USDT: 'tether',
  XAUT: 'tether-gold',
  ETH: 'ethereum',
  GOLD: 'gold'
} as const;

export class PriceOracle {
  private cache: { data: MarketData | null; lastFetch: number; ttl: number };
  private requestCount: number = 0;

  constructor(cacheTtlMs: number = 60000) {
    this.cache = { data: null, lastFetch: 0, ttl: cacheTtlMs };
  }

  /**
   * Get market data (with caching)
   */
  public async getMarketData(): Promise<MarketData> {
    const now = Date.now();

    if (this.cache.data && (now - this.cache.lastFetch) < this.cache.ttl) {
      console.log('\x1b[90m[PriceOracle] Returning cached data\x1b[0m');
      return this.cache.data;
    }

    try {
      const data = await this.fetchFromCoinGecko();
      this.cache.data = data;
      this.cache.lastFetch = now;
      return data;
    } catch (error) {
      console.log('\x1b[33m[PriceOracle] CoinGecko failed, using fallback\x1b[0m');
      return this.getFallbackData();
    }
  }

  /**
   * Fetch REAL data from CoinGecko (FREE API)
   */
  private async fetchFromCoinGecko(): Promise<MarketData> {
    this.requestCount++;
    console.log('\x1b[90m[PriceOracle] Fetching LIVE data from CoinGecko...\x1b[0m');

    const ids = `${COINGECKO_IDS.USDT},${COINGECKO_IDS.XAUT},${COINGECKO_IDS.ETH},${COINGECKO_IDS.GOLD}`;
    const url = `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const timestamp = new Date().toISOString();

    const usdtData = data[COINGECKO_IDS.USDT] || {};
    const xautData = data[COINGECKO_IDS.XAUT] || {};
    const ethData = data[COINGECKO_IDS.ETH] || {};
    const goldData = data[COINGECKO_IDS.GOLD] || {};

    const marketData: MarketData = {
      usdt: {
        symbol: 'USDT',
        price: usdtData.usd ?? 1.0,
        change24h: usdtData.usd_24h_change ?? 0,
        marketCap: usdtData.usd_market_cap ?? 0,
        volume24h: usdtData.usd_24h_vol ?? 0,
        lastUpdated: timestamp
      },
      xaut: {
        symbol: 'XAUT',
        price: xautData.usd ?? 2650,
        change24h: xautData.usd_24h_change ?? 0,
        marketCap: xautData.usd_market_cap ?? 0,
        volume24h: xautData.usd_24h_vol ?? 0,
        lastUpdated: timestamp
      },
      goldPrice: goldData.usd ?? xautData.usd ?? 2650,
      ethPrice: ethData.usd ?? 3000,
      timestamp,
      source: 'LIVE'
    };

    console.log(`\x1b[32m[PriceOracle] ✓ LIVE data fetched\x1b[0m`);
    console.log(`\x1b[33m           USDT: $${marketData.usdt.price.toFixed(4)} (${marketData.usdt.change24h >= 0 ? '+' : ''}${marketData.usdt.change24h.toFixed(2)}%)\x1b[0m`);
    console.log(`\x1b[33m           XAUT: $${marketData.xaut.price.toFixed(2)} (${marketData.xaut.change24h >= 0 ? '+' : ''}${marketData.xaut.change24h.toFixed(2)}%)\x1b[0m`);
    console.log(`\x1b[33m           ETH:  $${marketData.ethPrice.toFixed(2)}\x1b[0m`);

    return marketData;
  }

  /**
   * Fallback simulated data
   */
  private getFallbackData(): MarketData {
    const timestamp = new Date().toISOString();
    
    return {
      usdt: {
        symbol: 'USDT',
        price: 1.0 + (Math.random() - 0.5) * 0.001,
        change24h: (Math.random() - 0.5) * 0.1,
        marketCap: 100_000_000_000,
        volume24h: 50_000_000_000,
        lastUpdated: timestamp
      },
      xaut: {
        symbol: 'XAUT',
        price: 2650 + (Math.random() - 0.5) * 50,
        change24h: (Math.random() - 0.5) * 3,
        marketCap: 500_000_000,
        volume24h: 10_000_000,
        lastUpdated: timestamp
      },
      goldPrice: 2650,
      ethPrice: 3000 + (Math.random() - 0.5) * 100,
      timestamp,
      source: 'FALLBACK'
    };
  }

  /**
   * Calculate volatility index
   */
  public async getVolatilityIndex(): Promise<number> {
    const data = await this.getMarketData();
    const usdtVol = Math.abs(data.usdt.change24h) / 10;
    const xautVol = Math.abs(data.xaut.change24h) / 10;
    return Math.min((usdtVol + xautVol) / 2, 1);
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<{ healthy: boolean; latency: number }> {
    const start = Date.now();
    try {
      const response = await fetch(`${COINGECKO_API}/ping`);
      return { healthy: response.ok, latency: Date.now() - start };
    } catch {
      return { healthy: false, latency: Date.now() - start };
    }
  }
}

// Singleton
let oracleInstance: PriceOracle | null = null;

export function getPriceOracle(): PriceOracle {
  if (!oracleInstance) {
    oracleInstance = new PriceOracle();
  }
  return oracleInstance;
}

export default PriceOracle;
