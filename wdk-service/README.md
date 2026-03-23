# WDK Real Blockchain Integration

Complete guide for integrating real Tether WDK blockchain operations into the Sovereign Reserve Agent.

## ⚡ Before Anything: Install Dependencies

```bash
cd wdk-service
npm install
cd ..
```

⚠️ **CRITICAL**: Do not skip! `tsx`, `@tetherto/*`, and other dependencies must be installed first.

If you skip, you will get error: `'tsx' is not recognized`

---

## Overview

The Sovereign Reserve Agent uses a **dual-mode architecture**:

- **DEMO Mode** (default): Simulated swaps in Next.js frontend, no blockchain calls
- **PRODUCTION Mode**: Real blockchain operations via dedicated WDK service

This separation exists because WDK native modules cannot run in Next.js serverless environment. The WDK service runs as a standalone Node.js application that processes real blockchain transactions.

## Architecture

```
┌─────────────────────────────────┐
│   Next.js Frontend              │
│  (SovereignDashboard.tsx)        │
└──────────────────┬──────────────┘
                   │ HTTP API calls
                   │ (WDKServiceClient)
                   ▼
┌─────────────────────────────────┐
│  WDK Service (Node.js)          │
│  Real blockchain operations     │
│  - Wallets                      │
│  - Swaps (Velora DEX)           │
│  - Bridges (USDT0)              │
│  - Lending (Aave V3)            │
└─────────────────────────────────┘
         │
         │ Blockchain calls
         ▼
┌─────────────────────────────────┐
│  Tether WDK Core                │
│  @tetherto/wdk-wallet-evm       │
│  @tetherto/wdk-protocol-*       │
└─────────────────────────────────┘
         │
         │ Real blockchain transactions
         ▼
┌─────────────────────────────────┐
│  EVM Blockchains                │
│  - Ethereum, Plasma, Stable     │
│  - Arbitrum, Optimism, etc.     │
└─────────────────────────────────┘
```

## Installation

### Prerequisites

- Node.js >= 18.0
- npm >= 9.0
- A BIP39 seed phrase (12 or 24 words)
- Funds on your wallet for gas fees and test transactions

### ⚠️ COMMON MISTAKE: Forget to npm install

```bash
# ❌ WRONG - Will fail with 'tsx' not found
npm run wdk:service:dev

# ✅ CORRECT - Must install first
cd wdk-service
npm install
cd ..

# Now it works
npm run wdk:service:dev
```

### Step 1: Install WDK Dependencies

Navigate to the wdk-service directory and install packages:

```bash
cd wdk-service
npm install
```

This installs:
- `@tetherto/wdk` - Core wallet management
- `@tetherto/wdk-wallet-evm` - EVM blockchain wallet support
- `@tetherto/wdk-protocol-swap-velora-evm` - DEX swaps via Velora
- `@tetherto/wdk-protocol-bridge-usdt0-evm` - USDT0 cross-chain bridge
- `@tetherto/wdk-protocol-lending-aave-evm` - Lending/borrowing via Aave V3
- `express` - HTTP API server

### Step 2: Configure Environment Variables

Create `wdk-service/.env.local`:

```bash
cp wdk-service/.env.example wdk-service/.env.local
```

Edit `.env.local` and add your seed phrase (⚠️ **NEVER commit this!**):

```env
# Your 12 or 24 word seed phrase
SEED_PHRASE=word1 word2 word3 ... word12

# Service port (optional)
WDK_SERVICE_PORT=3001

# RPC endpoints (optional - defaults provided)
ETH_RPC=https://eth.drpc.org
PLASMA_RPC=https://rpc.plasma.to
STABLE_RPC=https://rpc.stable.xyz

# x402 payment settings
X402_FACILITATOR_URL=https://x402.semanticpay.io/
```

### Step 3: Configure Next.js to Use the Service

In the root `.env.local`, add:

```bash
# WDK Service URL
NEXT_PUBLIC_WDK_SERVICE_URL=http://localhost:3001
```

## Running

### Option A: Development (DEMO Mode - Default)

Run the Next.js app in DEMO mode (no blockchain calls):

```bash
npm run dev
```

This is the **default** and works without the WDK service. Perfect for testing UI and logic.

### Option B: Full Stack (With Real Blockchain)

Terminal 1 - Start WDK Service:

```bash
npm run wdk:service:dev
```

This starts the WDK service on `http://localhost:3001`.

Terminal 2 - Start Next.js Frontend:

```bash
npm run dev
```

Or run both together:

```bash
npm run wdk:full-dev
```

## Usage

### From the Dashboard

When the WDK service is running (`http://localhost:3001` accessible):

1. **Initialize Wallet** - The service detects your `SEED_PHRASE` environment variable
2. **Execute Swap** - Click "Execute Swap" to process real blockchain transactions
3. **View Transactions** - Each swap generates a real blockchain tx hash

### From Code

Use the `WDKServiceClient`:

```typescript
import { wdkClient } from '@/core/WDKServiceClient';

// Initialize wallet
const initResult = await wdkClient.initWallet({
  seedPhrase: 'your seed phrase',
  chainId: 'plasma', // or 'ethereum', 'stable', etc.
});

// Get balance
const balance = await wdkClient.getBalance('0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb');

// Execute swap
const swapResult = await wdkClient.swap({
  fromToken: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
  toToken: '0x4922a015c4407F87432B179bb209e1253e29690f', // XAUT
  amount: '1000000', // 1 USDT (6 decimals)
  slippageTolerance: 0.01, // 1%
});

// Bridge USDT0 cross-chain
const bridgeResult = await wdkClient.bridge({
  token: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  amount: '5000000', // 5 USDT (6 decimals)
  fromChain: 'ethereum',
  toChain: 'plasma',
  recipient: '0x...',
});

// x402 payment for protected resources
const paymentResult = await wdkClient.makePayment('https://api.example.com/weather');

// Lending operations
const depositResult = await wdkClient.lend('deposit', tokenAddress, amount);
```

## Supported Chains

**EVM Chains**:
- Ethereum (mainnet)
- Plasma (purpose-built for USDT0)
- Stable (purpose-built for USDT0)
- Arbitrum
- Optimism
- And 10+ more (see WDK docs)

**Other Blockchains** (via WDK multi-chain support):
- Bitcoin
- Solana
- TON
- Tron
- Spark
- And more

## Features

### 1. Self-Custodial Wallets

- EVM wallets via `@tetherto/wdk-wallet-evm`
- Seed phrase remains local, never sent to server
- Multi-chain wallet creation
- Support for 20+ blockchains

### 2. Token Swaps

- DEX aggregation via Velora
- Automatic price quoting
- Slippage protection
- Real-time gas estimation

### 3. Cross-Chain Bridge

- Bridge USDT0 between EVM chains
- LayerZero-powered transfers
- Plasma and Stable optimized (near-zero fees)
- Automatic conversion from USDT to USDT0

### 4. Lending Protocol

- Deposit and withdraw via Aave V3
- Borrow stablecoins against collateral
- Real-time interest rates and health factors

### 5. x402 Payment Protocol

- HTTP 402 payment standard
- Sign payments with WDK wallet
- Automatic payment authorization (EIP-3009)
- No account setup required

## Security Considerations

### Seed Phrase Protection

```bash
# ✅ GOOD - Use environment variables
export SEED_PHRASE="word1 word2 ... word12"

# ❌ BAD - Never hardcode
const seedPhrase = "word1 word2 ... word12";

# ❌ BAD - Never commit to git
# .env.local is in .gitignore, use it instead
```

### WDK Key Cleanup

The service automatically wipes wallet keys from memory on shutdown:

```bash
# Call cleanup endpoint before deploying
curl -X POST http://localhost:3001/cleanup
```

### Use Non-Privileged User

Run WDK service with minimal permissions:

```bash
# Run as non-root user
sudo -u app-user npm run wdk:service:start
```

### Transaction Confirmation

All write operations require explicit user confirmation in the dashboard before broadcasting:

- Swaps
- Bridges
- Lending operations
- x402 payments

## API Endpoints Reference

### Wallet Management

```
POST /wallet/init
Body: { seedPhrase, chainId, rpcUrl? }
Returns: { success, address?, chainId?, error? }
```

### Balances

```
GET /balance?token=0x...
Returns: { success, balance?, token?, error? }
```

### Swaps (Velora)

```
POST /swap
Body: {
  fromToken: string,
  toToken: string,
  amount: string (in microunits),
  slippageTolerance?: number,
  maxGasPrice?: string
}
Returns: { success, transactionHash?, amountOut?, fee?, error? }
```

### Bridge (USDT0)

```
POST /bridge
Body: {
  token: string,
  amount: string,
  fromChain: string,
  toChain: string,
  recipient: string,
  maxFee?: string
}
Returns: { success, transactionHash?, estimatedTime?, error? }
```

### Lending (Aave V3)

```
POST /lending/deposit|borrow|withdraw|repay
Body: { token: string, amount: string }
Returns: { success, transactionHash?, error? }
```

### x402 Payments

```
POST /payment/x402
Body: { resourceUrl: string }
Returns: { success, data?, paymentReceipt?, error? }
```

### Cleanup

```
POST /cleanup
Returns: { success, message?, error? }
```

## Troubleshooting

### Service Won't Start

```bash
# Check if port 3001 is in use
netstat -an | grep 3001

# Kill process on that port
lsof -ti:3001 | xargs kill -9

# Try different port
WDK_SERVICE_PORT=3002 npm run wdk:service:dev
```

### Wallet Initialization Fails

```bash
# Verify seed phrase format (12 or 24 words)
echo $SEED_PHRASE | wc -w

# Check environment variable is set
printenv SEED_PHRASE

# Verify RPC is accessible
curl https://eth.drpc.org
```

### Swap Fails with "Insufficient Balance"

```bash
# Check wallet balance
curl http://localhost:3001/balance?token=0x...

# Bridge more funds if needed
# Use the /bridge endpoint to transfer USDT0
```

### x402 Facilitator Unreachable

```bash
# Default is Semantic facilitator (third-party, supported but not by Tether)
# For self-hosted x402 facilitator, see wdk-service/src/index.ts

# Check facilitator status
curl https://x402.semanticpay.io/health
```

### Keys Not Wiped on Shutdown

```bash
# Manually call cleanup
curl -X POST http://localhost:3001/cleanup

# Verify service is stopped
ps aux | grep wdk:service
```

## Token Addresses

Common token addresses on Plasma/Stable:

```typescript
const TOKENS = {
  // Plasma (chainId: 9745)
  USDT0_PLASMA: '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb',
  
  // Stable (chainId: 988)
  USDT0_STABLE: '0x779Ded0c9e1022225f8E0630b35a9b54bE713736',
  
  // Ethereum
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  XAUT: '0x4922a015c4407F87432B179bb209e1253e29690f',
};
```

## Next Steps

1. **Get Test USDT** - Bridge from Ethereum or faucet on target chain
2. **Test Small Amounts** - Start with $1-5 test swaps
3. **Monitor Transactions** - View on [Plasma explorer](https://explorer.plasma.to) or [Stable explorer](https://explorer.stable.xyz)
4. **Review Costs** - x402 on Plasma/Stable costs ~$0.001-0.01 per transaction

## Recommended Chains for Development

- **Plasma** - Purpose-built for USD₮0, near-zero fees, instant finality
- **Stable** - Purpose-built for USD₮0, near-zero fees, instant finality
- **Ethereum Goerli** - Free testnet faucets, but slower

## References

- [Tether WDK Docs](https://docs.wdk.tether.io/)
- [WDK GitHub](https://github.com/tetherto/wdk-core)
- [Agent Skills](https://docs.wdk.tether.io/ai/agent-skills)
- [x402 Protocol](https://www.x402.org/)
- [Plasma Testnet](https://docs.plasma.to/)
- [Stable Testnet](https://docs.stable.xyz/)

## Support

- **Discord**: [WDK Community](https://discord.gg/tetherdev)
- **GitHub Issues**: [tetherto/wdk-core](https://github.com/tetherto/wdk-core)
- **Email**: wallet-info@tether.io

---

**Last Updated**: March 22, 2026
**Version**: 2.0.0 - Real WDK Integration
