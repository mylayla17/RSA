/**
 * WDK Service Server
 * Express API that bridges Next.js frontend with real Tether WDK operations
 * 
 * Real APIs from:
 * - @tetherto/wdk (core)
 * - @tetherto/wdk-wallet-evm (wallet)
 * - @tetherto/wdk-protocol-swap-velora-evm (swaps)
 * - @tetherto/wdk-protocol-bridge-usdt0-evm (bridge)
 * - @tetherto/wdk-protocol-lending-aave-evm (lending)
 */

import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  initializeWallet,
  getBalance,
  executeSwap,
  quoteSwap,
  bridgeUsdt0,
  lendOrBorrow,
  cleanup
} from "./wdk.js";

dotenv.config();

const app = express();
const PORT = process.env.WDK_SERVICE_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "WDK Blockchain Service",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /wallet/init
 * Initialize wallet with seed phrase
 * 
 * Request Body:
 * {
 *   seedPhrase: string (12 or 24 words),
 *   chain: string ("ethereum" | "arbitrum" | "optimism" | "polygon" | "plasma" | "stable"),
 *   accountIndex?: number (default: 0)
 * }
 * 
 * Returns: { success: boolean, address?: string, chain?: string, error?: string }
 */
app.post("/wallet/init", async (req: Request, res: Response) => {
  try {
    const { seedPhrase, chain, accountIndex } = req.body;

    if (!seedPhrase || !chain) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: seedPhrase, chain"
      });
    }

    // SECURITY: Never log seed phrases
    console.log(`[WDK] Initializing wallet on chain: ${chain}`);

    const result = await initializeWallet({
      seedPhrase,
      chain,
      accountIndex: accountIndex || 0
    });

    res.json(result);
  } catch (error: any) {
    console.error("[WDK] Wallet init error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /balance
 * Get wallet balance
 * 
 * Returns: { success: boolean, address?: string, message?: string, error?: string }
 */
app.get("/balance", async (req: Request, res: Response) => {
  try {
    const result = await getBalance();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /swap/quote
 * Get swap quote without executing
 * 
 * Request Body:
 * {
 *   fromToken: string (token address),
 *   toToken: string (token address),
 *   amount: string (in microunits, e.g., "1000000" for 1 USDT)
 * }
 * 
 * Returns: { success: boolean, fee?: string, amountIn?: string, amountOut?: string, error?: string }
 */
app.post("/swap/quote", async (req: Request, res: Response) => {
  try {
    const { fromToken, toToken, amount } = req.body;

    if (!fromToken || !toToken || !amount) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: fromToken, toToken, amount"
      });
    }

    console.log(`[WDK] Quote request: ${amount} ${fromToken} → ${toToken}`);

    const result = await quoteSwap({
      fromToken,
      toToken,
      amount: BigInt(amount)
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /swap
 * Execute real DEX swap via Velora
 * https://github.com/tetherto/wdk-protocol-swap-velora-evm
 * 
 * Request Body:
 * {
 *   fromToken: string (token address),
 *   toToken: string (token address),
 *   amount: string (in microunits, e.g., "1000000" for 1 USDT),
 *   maxGasPrice?: string (optional)
 * }
 * 
 * Returns: { success: boolean, transactionHash?: string, amountIn?: string, amountOut?: string, fee?: string, error?: string }
 */
app.post("/swap", async (req: Request, res: Response) => {
  try {
    const { fromToken, toToken, amount, maxGasPrice } = req.body;

    if (!fromToken || !toToken || !amount) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: fromToken, toToken, amount"
      });
    }

    console.log(`[WDK] Swap: ${amount} ${fromToken} → ${toToken}`);

    const result = await executeSwap({
      fromToken,
      toToken,
      amount: BigInt(amount),
      maxGasPrice: maxGasPrice ? BigInt(maxGasPrice) : undefined
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /bridge
 * Bridge USDT0 across chains
 * https://github.com/tetherto/wdk-protocol-bridge-usdt0-evm
 * 
 * Request Body:
 * {
 *   token: string (USDT token address),
 *   amount: string (in microunits),
 *   fromChain: string,
 *   toChain: string,
 *   recipient: string (destination address)
 * }
 * 
 * Returns: { success: boolean, transactionHash?: string, amount?: string, fee?: string, error?: string }
 */
app.post("/bridge", async (req: Request, res: Response) => {
  try {
    const { token, amount, fromChain, toChain, recipient } = req.body;

    if (!token || !amount || !toChain || !recipient) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: token, amount, toChain, recipient"
      });
    }

    console.log(`[WDK] Bridge: ${amount} from ${fromChain || 'current'} to ${toChain}`);

    const result = await bridgeUsdt0({
      token,
      amount: BigInt(amount),
      fromChain: fromChain || 'ethereum',
      toChain,
      recipient
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /lending/:action
 * Aave V3 lending operations
 * https://github.com/tetherto/wdk-protocol-lending-aave-evm
 * 
 * URL Parameters:
 *   action: "deposit" | "borrow" | "withdraw" | "repay"
 * 
 * Request Body:
 * {
 *   token: string (token address),
 *   amount: string (in microunits)
 * }
 * 
 * Returns: { success: boolean, transactionHash?: string, action?: string, amount?: string, fee?: string, error?: string }
 */
app.post("/lending/:action", async (req: Request, res: Response) => {
  try {
    const action = req.params.action as
      | "deposit"
      | "borrow"
      | "withdraw"
      | "repay";
    const { token, amount } = req.body;

    if (!token || !amount) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: token, amount"
      });
    }

    if (!["deposit", "borrow", "withdraw", "repay"].includes(action)) {
      return res.status(400).json({
        success: false,
        error: "Invalid action. Must be: deposit, borrow, withdraw, repay"
      });
    }

    console.log(`[WDK] Lending ${action}: ${amount} ${token}`);

    const result = await lendOrBorrow(
      action,
      token,
      BigInt(amount)
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /cleanup
 * Wipe wallet keys from memory (security!)
 * 
 * Returns: { success: boolean, message?: string, error?: string }
 */
app.post("/cleanup", async (req: Request, res: Response) => {
  try {
    const result = cleanup();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Graceful shutdown - cleanup on termination
 */
process.on("SIGTERM", () => {
  console.log("[WDK] SIGTERM received, cleaning up...");
  cleanup();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("[WDK] SIGINT received, cleaning up...");
  cleanup();
  process.exit(0);
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║        WDK Blockchain Service (Real Tether WDK)       ║
╚════════════════════════════════════════════════════════╝

📍 Service: http://localhost:${PORT}
✅ Health: http://localhost:${PORT}/health

Endpoints:
  ▪ POST /wallet/init         Initialize wallet
  ▪ GET  /balance             Get balance
  ▪ POST /swap/quote          Quote swap (no execution)
  ▪ POST /swap                Execute swap (Velora)
  ▪ POST /bridge              Bridge USDT0 cross-chain
  ▪ POST /lending/:action     Lend/borrow (Aave)
  ▪ POST /cleanup             Cleanup & wipe keys

Real WDK Modules:
  • @tetherto/wdk (core)
  • @tetherto/wdk-wallet-evm (wallet)
  • @tetherto/wdk-protocol-swap-velora-evm (Velora DEX)
  • @tetherto/wdk-protocol-bridge-usdt0-evm (Bridge)
  • @tetherto/wdk-protocol-lending-aave-evm (Aave V3)

Documentation:
  https://docs.wallet.tether.io/

`);
});
⚠️  SECURITY: Never commit seed phrases to version control
🔐 All write operations require explicit confirmation
  `);
});
