/**
 * WDK Service Server
 * Express API that bridges Next.js frontend with real WDK blockchain operations
 */

import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  initializeWallet,
  getBalance,
  executeSwap,
  bridgeUsdt,
  makeX402Payment,
  lendOrBorrow,
  cleanup,
  WalletConfig,
  SwapRequest,
  BridgeRequest,
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
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /wallet/init
 * Initialize wallet with seed phrase
 * Body: { seedPhrase: string, chainId: string, rpcUrl?: string }
 */
app.post("/wallet/init", async (req: Request, res: Response) => {
  try {
    const { seedPhrase, chainId, rpcUrl } = req.body;

    if (!seedPhrase || !chainId) {
      return res.status(400).json({
        error: "Missing required fields: seedPhrase, chainId",
      });
    }

    // SECURITY: Never log seed phrases
    console.log(`[API] Initializing wallet on chain ${chainId}`);

    const result = await initializeWallet({
      seedPhrase,
      chainId,
      rpcUrl: rpcUrl || undefined,
    } as WalletConfig);

    res.json(result);
  } catch (error: any) {
    console.error("[API] Wallet init error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /balance
 * Get current wallet balance
 * Query: { token?: string }
 */
app.get("/balance", async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string | undefined;
    const result = await getBalance(token);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /swap
 * Execute DEX swap via Velora
 * Body: {
 *   fromToken: string,
 *   toToken: string,
 *   amount: string (in microunits),
 *   slippageTolerance?: number,
 *   maxGasPrice?: string
 * }
 */
app.post("/swap", async (req: Request, res: Response) => {
  try {
    const { fromToken, toToken, amount, slippageTolerance, maxGasPrice } =
      req.body;

    if (!fromToken || !toToken || !amount) {
      return res.status(400).json({
        error: "Missing required fields: fromToken, toToken, amount",
      });
    }

    console.log(`[API] Swap request: ${amount} ${fromToken} → ${toToken}`);

    const result = await executeSwap({
      fromToken,
      toToken,
      amount,
      slippageTolerance,
      maxGasPrice,
    } as SwapRequest);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /bridge
 * Bridge USDT0 cross-chain
 * Body: {
 *   token: string,
 *   amount: string,
 *   fromChain: string,
 *   toChain: string,
 *   recipient: string,
 *   maxFee?: string
 * }
 */
app.post("/bridge", async (req: Request, res: Response) => {
  try {
    const { token, amount, fromChain, toChain, recipient, maxFee } = req.body;

    if (!token || !amount || !toChain || !recipient) {
      return res.status(400).json({
        error:
          "Missing required fields: token, amount, toChain, recipient",
      });
    }

    console.log(
      `[API] Bridge request: ${amount} ${token} to ${toChain}`
    );

    const result = await bridgeUsdt({
      token,
      amount,
      fromChain,
      toChain,
      recipient,
      maxFee,
    } as BridgeRequest);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /payment/x402
 * Make x402 payment for protected resources
 * Body: { resourceUrl: string }
 */
app.post("/payment/x402", async (req: Request, res: Response) => {
  try {
    const { resourceUrl } = req.body;

    if (!resourceUrl) {
      return res.status(400).json({
        error: "Missing required field: resourceUrl",
      });
    }

    console.log(`[API] x402 payment request for ${resourceUrl}`);

    const result = await makeX402Payment(resourceUrl);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /lending/:action
 * Lending operations: deposit, borrow, withdraw, repay
 * Body: { token: string, amount: string }
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
        error: "Missing required fields: token, amount",
      });
    }

    if (!["deposit", "borrow", "withdraw", "repay"].includes(action)) {
      return res.status(400).json({
        error: "Invalid action. Must be deposit, borrow, withdraw, or repay",
      });
    }

    console.log(`[API] Lending ${action}: ${amount} ${token}`);

    const result = await lendOrBorrow(action, token, amount);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /cleanup
 * Wipe wallet keys from memory (security)
 */
app.post("/cleanup", async (req: Request, res: Response) => {
  try {
    await cleanup();
    res.json({
      success: true,
      message: "Wallet cleaned and keys wiped from memory",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[Server] SIGTERM received, cleaning up...");
  await cleanup();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("[Server] SIGINT received, cleaning up...");
  await cleanup();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║  WDK Blockchain Service                   ║
║  Real Tether WDK Integration               ║
╚════════════════════════════════════════════╝

📍 Host: http://localhost:${PORT}
🔗 Health: http://localhost:${PORT}/health

Available Endpoints:
  POST /wallet/init          - Initialize wallet
  GET  /balance              - Get wallet balance
  POST /swap                 - Execute DEX swap
  POST /bridge               - Bridge USDT0 cross-chain
  POST /payment/x402         - Make x402 payment
  POST /lending/:action      - Lend/borrow via Aave V3
  POST /cleanup              - Wipe wallet keys

Environment Variables Required:
  - SEED_PHRASE or prompt on initialization
  - WDK_SERVICE_PORT (default: 3001)
  - ETH_RPC, PLASMA_RPC, STABLE_RPC (optional)
  - BRIDGE_MAX_FEE (optional)

⚠️  SECURITY: Never commit seed phrases to version control
🔐 All write operations require explicit confirmation
  `);
});
