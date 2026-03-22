/**
 * WDK Service Client
 * Communicates with the real WDK blockchain service
 * Handles all blockchain operations via HTTP API
 */

const WDK_SERVICE_URL = process.env.NEXT_PUBLIC_WDK_SERVICE_URL || "http://localhost:3001";

export interface WalletInitRequest {
  seedPhrase: string;
  chainId: "ethereum" | "plasma" | "stable" | "arbitrum" | "optimism";
  rpcUrl?: string;
}

export interface WalletInitResponse {
  success: boolean;
  address?: string;
  chainId?: number;
  error?: string;
}

export interface SwapRequest {
  fromToken: string;
  toToken: string;
  amount: string;
  slippageTolerance?: number;
  maxGasPrice?: string;
}

export interface SwapResponse {
  success: boolean;
  transactionHash?: string;
  amountOut?: string;
  fee?: string;
  error?: string;
}

export interface BridgeRequest {
  token: string;
  amount: string;
  fromChain: string;
  toChain: string;
  recipient: string;
  maxFee?: string;
}

export interface BridgeResponse {
  success: boolean;
  transactionHash?: string;
  estimatedTime?: string;
  error?: string;
}

class WDKServiceClient {
  private baseUrl: string;

  constructor(baseUrl: string = WDK_SERVICE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check service health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Initialize wallet with seed phrase
   */
  async initWallet(request: WalletInitRequest): Promise<WalletInitResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/wallet/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to initialize wallet",
      };
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(token?: string): Promise<{
    success: boolean;
    balance?: string;
    token?: string;
    error?: string;
  }> {
    try {
      const url = new URL(`${this.baseUrl}/balance`);
      if (token) {
        url.searchParams.append("token", token);
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to get balance",
      };
    }
  }

  /**
   * Execute DEX swap via Velora
   */
  async swap(request: SwapRequest): Promise<SwapResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/swap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Swap failed",
      };
    }
  }

  /**
   * Bridge USDT0 cross-chain
   */
  async bridge(request: BridgeRequest): Promise<BridgeResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/bridge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Bridge failed",
      };
    }
  }

  /**
   * Make x402 payment for protected resources
   */
  async makePayment(resourceUrl: string): Promise<{
    success: boolean;
    data?: any;
    paymentReceipt?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/payment/x402`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceUrl }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Payment failed",
      };
    }
  }

  /**
   * Lending operations: deposit, borrow, withdraw, repay
   */
  async lend(
    action: "deposit" | "borrow" | "withdraw" | "repay",
    token: string,
    amount: string
  ): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/lending/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, amount }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        error: error.message || `${action} operation failed`,
      };
    }
  }

  /**
   * Cleanup: wipe wallet keys from memory
   */
  async cleanup(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/cleanup`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Cleanup failed",
      };
    }
  }
}

// Export singleton instance
export const wdkClient = new WDKServiceClient();

export default WDKServiceClient;
