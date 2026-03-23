# Sovereign Reserve Agent (SRA)

**Autonomous DeFi Agent for Real Blockchain Liquidity Rebalancing**

Built for **DoraHacks Galactica 2026** - Track 3: Autonomous DeFi Agent

> A production-ready autonomous agent that intelligently manages liquidity reserves using real Tether WDK blockchain operations, real-time market data, multi-persona decision-making, and transparent reasoning.

---

## ⚡ Quick Start (5 Minutes)

### Setup Real Blockchain Integration

```bash
# 1. Install main project and WDK service dependencies
npm install
cd wdk-service
npm install
cd ..

# 2. Configure wallet with BIP39 seed phrase
cp .env.local.example .env.local
# Edit .env.local: Set SEED_PHRASE=word1 word2 ... word12 (your 12 or 24 words)

# 3. Run everything
npm run wdk:full-dev
```

Open **http://localhost:3000** - Real blockchain operations active!

**What's running:**
- **http://localhost:3000**: React dashboard with real portfolio data
- **http://localhost:3001**: WDK blockchain service (Tether WDK protocols)


## Overview

Sovereign Reserve Agent is an autonomous AI-powered liquidity management system that dynamically rebalances token reserves using **real Tether WDK blockchain operations**. The agent analyzes market conditions, makes intelligent decisions, and executes actual transactions through self-custodial non-custodial wallets.

### Core Capabilities

- **Real WDK Blockchain Integration**: Actual swaps via Velora DEX, bridges via Everscale, lending via Aave V3
- **Multi-Persona Decision Engine**: Three distinct risk profiles (Ironclad, Surfer, Hawk) with independent thresholds
- **Transparent Reasoning**: Every decision logged with market analysis and confidence scoring
- **Real-Time Market Data**: Live prices from CoinGecko and Bitfinex APIs  
- **Self-Custodial Wallets**: BIP39 seed phrase → EVM wallet (non-custodial, never uploaded)
- **React Command Center**: Real-time dashboard with execution feed, portfolio tracking, and terminal
- **Multi-Chain Support**: Ethereum, Plasma, Stable, Arbitrum, Optimism, Polygon, and 14+ more chains

---

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | React 18 + Next.js 14 | Web UI & Server API |
| **Backend Service** | Node.js + Express | Tether WDK integration service |
| **Language** | TypeScript 5.4 | Type-safe development |
| **Styling** | Tailwind CSS 3.4 | Responsive UI design |
| **Animations** | Framer Motion 11 | Smooth interactions |
| **AI/LLM** | z-ai-web-dev-sdk | Decision reasoning |
| **Market Data** | CoinGecko API | Real prices (USDT, XAUT, ETH) |
| **Blockchain** | Tether WDK (real) | Actual swap, bridge, lending operations |

---

## WDK Real Modules Reference

The Sovereign Reserve Agent uses **5 real Tether WDK modules** for blockchain operations. All modules execute actual transactions on live blockchains - no simulation or mock data.

### Module Inventory

| # | Module | Package | Version | Purpose | GitHub |
|---|--------|---------|---------|---------|--------|
| 1 | **WDK Core** | `@tetherto/wdk` | ^1.0.0-beta.6 | Wallet orchestrator & protocol manager | [Link](https://github.com/tetherto/wdk) |
| 2 | **EVM Wallet** | `@tetherto/wdk-wallet-evm` | ^1.0.0-beta.10 | BIP39 seed → EVM accounts | [Link](https://github.com/tetherto/wdk-wallet-evm) |
| 3 | **Velora DEX** | `@tetherto/wdk-protocol-swap-velora-evm` | ^1.0.0-beta.4 | DEX swaps (Velora aggregator) ⭐ | [Link](https://github.com/tetherto/wdk-protocol-swap-velora-evm) |
| 4 | **USDT0 Bridge** | `@tetherto/wdk-protocol-bridge-usdt0-evm` | ^1.0.0-beta.3 | Cross-chain token bridge | [Link](https://github.com/tetherto/wdk-protocol-bridge-usdt0-evm) |
| 5 | **Aave V3** | `@tetherto/wdk-protocol-lending-aave-evm` | ^1.0.0-beta.3 | Lending/borrowing protocol | [Link](https://github.com/tetherto/wdk-protocol-lending-aave-evm) |

### Detailed Module Descriptions

#### 1. **WDK Core** (`@tetherto/wdk`)
**Purpose**: Central orchestrator for wallet management and protocol registration  
**Key Functions**:
- `new WDK(seedPhrase)` - Initialize WDK instance
- `.registerWallet(type, walletImpl, config)` - Register wallet driver
- `.registerProtocol(chain, name, protocolImpl, config)` - Register protocol
- `.getAccount(chain, index)` - Derive account from wallet

**Example**:
```typescript
const wdk = new WDK(process.env.SEED_PHRASE);
wdk.registerWallet('evm', WalletManagerEvm, { chainId: 1 });
wdk.registerProtocol('evm', 'velora', VeloraSwapEvm, { maxFee: 0.5 });
const account = await wdk.getAccount('evm', 0);
```

#### 2. **EVM Wallet** (`@tetherto/wdk-wallet-evm`)
**Purpose**: Ethereum-compatible wallet derivation using BIP39 seed phrases  
**Key Functions**:
- `createWallet({ seedPhrase, chainId })` - Derive wallet from seed
- `.getAddress()` - Get wallet address
- `.getSigner()` - Get transaction signer
- `.getBalance(tokenAddress)` - Query balance

**Supported Chains**: Ethereum, Arbitrum, Optimism, Polygon, Plasma, Stable, and 15+ others

**Example**:
```typescript
const wallet = createWallet({
  seedPhrase: 'word1 word2 ... word12',
  chainId: 1  // Ethereum
});
const address = wallet.getAddress(); // 0x7f49...
const balance = await wallet.getBalance(USDT_ADDRESS);
```

#### 3. **Velora DEX** (`@tetherto/wdk-protocol-swap-velora-evm`) ⭐ **MAIN DEX**

**Purpose**: Decentralized token swaps via Velora aggregator  
**Real DEX**: Velora provides liquidity aggregation across multiple DEXs (Uniswap, SushiSwap, Curve, etc.)  
**Key Functions**:
- `.swap({ tokenIn, tokenOut, tokenInAmount })` - Execute DEX swap
- `.quoteSwap({ tokenIn, tokenOut, tokenInAmount })` - Get swap quote without execution
- `.getPrice(tokenAddress)` - Get current token price

**Transaction Details**:
- Real blockchain transaction executed on specified chain
- Returns actual transaction hash: `result.hash`
- Output amount: `result.tokenOutAmount` (BigInt)
- Gas fees included in `result.fee`

**Example**:
```typescript
const velora = account.getSwapProtocol('velora');
const quote = await velora.quoteSwap({
  tokenIn: USDT_ADDRESS,
  tokenOut: XAUT_ADDRESS,
  tokenInAmount: BigInt(1000000)  // 1 USDT (6 decimals)
});

const result = await velora.swap({
  tokenIn: USDT_ADDRESS,
  tokenOut: XAUT_ADDRESS,
  tokenInAmount: BigInt(1000000)
});
// Returns: { hash: '0x7f...', tokenOutAmount: BigInt(15243000), fee: BigInt(123456) }
```

**Dashboard Integration**: When you click "Execute Swap" on the dashboard, this exact module is called in real-time!

#### 4. **USDT0 Bridge** (`@tetherto/wdk-protocol-bridge-usdt0-evm`)

**Purpose**: Cross-chain USDT0 transfers between EVM blockchains  
**Chains Supported**: Ethereum, Plasma (optimized), Stable (optimized), Arbitrum, Optimism  
**Key Functions**:
- `.bridge({ token, amount, toChain, recipient })` - Bridge tokens
- `.estimateFee({ amount, toChain })` - Estimate bridge fee
- `.supportedChains()` - List supported destination chains

**Example**:
```typescript
const bridge = account.getBridgeProtocol('usdt0');
const fee = await bridge.estimateFee({
  amount: BigInt(5000000),  // 5 USDT
  toChain: 'plasma'
});

const result = await bridge.bridge({
  token: USDT_ADDRESS,
  amount: BigInt(5000000),
  toChain: 'plasma',
  recipient: recipientAddress
});
```

#### 5. **Aave V3** (`@tetherto/wdk-protocol-lending-aave-evm`)

**Purpose**: Lending and borrowing on Aave V3 protocol  
**Key Functions**:
- `.deposit({ token, amount })` - Deposit as collateral
- `.withdraw({ token, amount })` - Withdraw from Aave
- `.borrow({ token, amount })` - Borrow against collateral
- `.repay({ token, amount })` - Repay borrowed amount
- `.getUserAccountData()` - Get health factor and balances

**Example**:
```typescript
const aave = account.getLendingProtocol('aave-v3');

// Deposit 100 USDT as collateral
await aave.deposit({
  token: USDT_ADDRESS,
  amount: BigInt(100000000)
});

// Borrow 50 DAI
await aave.borrow({
  token: DAI_ADDRESS,
  amount: BigInt(50000000)
});

// Check account status
const data = await aave.getUserAccountData();
// Returns: { totalCollateral, totalBorrow, healthFactor, ... }
```

### Location in Codebase

**Frontend Integration** → [WDKServiceClient.ts](src/core/WDKServiceClient.ts)  
**Execution Router** → [WDKVault.ts](src/execution/WDKVault.ts)  
**WDK Service** → [wdk-service/src/wdk.ts](wdk-service/src/wdk.ts)  
**HTTP Endpoints** → [wdk-service/src/index.ts](wdk-service/src/index.ts)  

### Module Installation

All modules are installed via npm:

```bash
cd wdk-service
npm install  # Installs all @tetherto/* packages
```

**Verify Installation**:
```bash
npm ls @tetherto/wdk-core
npm ls @tetherto/wdk-wallet-evm
npm ls @tetherto/wdk-protocol-swap-velora-evm
npm ls @tetherto/wdk-protocol-bridge-usdt0-evm
npm ls @tetherto/wdk-protocol-lending-aave-evm
```

### Type Safety

All modules are fully typed in TypeScript. The project validates module usage with:

```bash
npm run type-check
```

Output should show **0 errors** ✅

---

## Architecture

### Components Overview

```
User (Dashboard) 
    ↓
SovereignDashboard (React UI)
    ↓
API Route Handler (/api/agent)
    ↓
OmniBrain (Decision Orchestrator)
    ├─→ OpenClawEngine (LLM Reasoning)
    ├─→ OpenClawStrategy (Market Analysis)
    ├─→ WDKVault (Execution Router)
    │   └─→ WDKServiceClient (HTTP to WDK service)
    ├─→ PriceOracle (Live Prices)
    └─→ ProofOfReasoning (Audit Trail)
    
         ↓ (HTTP API)
    
Standalone WDK Service (Node.js + Express)
    ├─→ WDK Core (@tetherto/wdk)
    ├─→ EVM Wallet (@tetherto/wdk-wallet-evm)
    ├─→ Velora Swaps (@tetherto/wdk-protocol-swap-velora-evm)
    ├─→ USDT0 Bridge (@tetherto/wdk-protocol-bridge-usdt0-evm)
    ├─→ Aave Lending (@tetherto/wdk-protocol-lending-aave-evm)
    └─→ Real Blockchain Networks
```

### Data Flow

1. **Input**: User selects persona and triggers evaluation
2. **Market Analysis**: `OmniBrain` fetches real prices via `PriceOracle`
3. **Decision Making**: `OpenClawEngine` invokes LLM for reasoning
4. **Execution Router**: `WDKVault` routes to `WDKServiceClient`
5. **Real Blockchain**: WDK Service executes via Tether WDK protocols on real blockchain
6. **Wallet**: Non-custodial wallet from BIP39 seed phrase (local only)
7. **Audit**: `ProofOfReasoning` logs decision with reasoning hash
8. **Output**: Dashboard displays decision, execution confirmation, and updated balances

---

## Project Structure

### Frontend & Core (Next.js)

```
sovereign-reserve-agent-final/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── agent/
│   │   │       └── route.ts              # POST /api/agent endpoint
│   │   ├── page.tsx                      # Entry page
│   │   ├── layout.tsx                    # Root layout
│   │   └── globals.css                   # Global styles
│   │
│   ├── core/
│   │   ├── OmniBrain.ts                  # Decision orchestrator
│   │   ├── OpenClawEngine.ts             # LLM integration
│   │   ├── OpenClawStrategy.ts           # Market strategy engine
│   │   ├── PersonaConfig.ts              # Risk profile definitions
│   │   └── WDKServiceClient.ts ⭐         # HTTP client to WDK service
│   │
│   ├── execution/
│   │   └── WDKVault.ts ⭐                 # Routes to WDK service
│   │
│   ├── oracle/
│   │   └── PriceOracle.ts                # CoinGecko + fallback pricing
│   │
│   ├── logs/
│   │   └── ProofOfReasoning.ts           # Audit trail & hashing
│   │
│   └── ui/
│       └── SovereignDashboard.tsx        # React command center
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

### Tether WDK Service (Node.js + Express)

```
wdk-service/ ⭐
├── src/
│   ├── index.ts                          # Express HTTP API server (port 3001)
│   │   ├── POST /wallet/init             # Initialize wallet from seed
│   │   ├── POST /swap                    # Execute DEX swap via Velora
│   │   ├── POST /bridge                  # Bridge tokens via USDT0
│   │   ├── POST /lending/:action         # Aave V3 lending operations
│   │   ├── GET /balance                  # Wallet balance (real blockchain)
│   │   ├── POST /cleanup                 # Wipe keys from memory
│   │   └── GET /health                   # Service health check
│   │
│   └── wdk.ts ⭐ (Core WDK Integration)
│   └── Tether WDK Protocols:
│        ├── @tetherto/wdk-wallet-evm           # EVM wallet ops
│        ├── @tetherto/wdk-protocol-swap-velora # Velora DEX swaps
│        ├── @tetherto/wdk-protocol-bridge-usdt0 # USDT0 bridge
│        └── @tetherto/wdk-protocol-lending-aave # Aave V3
│
├── package.json                          # WDK service dependencies
└── README.md                             # WDK service documentation
```

---

## WDK Integration Files - How It Works

### 1. **WDKServiceClient.ts** (Frontend → WDK Service Bridge)

Location: `src/core/WDKServiceClient.ts`

Provides HTTP client methods to call the standalone WDK service:

```typescript
// Initialize wallet from seed phrase
await wdkClient.initWallet({
  seedPhrase: process.env.SEED_PHRASE
});

// Execute real swap on Velora DEX
await wdkClient.swap({
  fromToken: 'USDT',
  toToken: 'XAUT',
  amount: BigInt(100 * 10**6)  // 100 USDT in microunits
});

// Bridge USDT to another chain
await wdkClient.bridge({
  token: 'USDT0',
  fromChain: 'ethereum',
  toChain: 'plasma',
  amount: BigInt(50 * 10**6)
});

// Lend/borrow on Aave V3
await wdkClient.lend('deposit', 'USDT', BigInt(100 * 10**6));

// x402 payment
await wdkClient.makePayment('https://api.example.com/resource');
```

### 2. **WDKVault.ts** (Execution Routing)

Location: `src/execution/WDKVault.ts`

Routes all execution requests to the real WDK service:

```typescript
async executeHedgingSwap(request) {
  // Always try real WDK service
  const result = await wdkClient.swap({
    fromToken: request.sellToken,
    toToken: request.buyToken,
    amount: request.amount
  });
  
  // Returns real blockchain transaction hash
  return {
    success: result.success,
    txHash: result.transactionHash,
    amount: result.outputAmount,
    mode: 'LIVE'  // Real blockchain
  };
}
```

### 3. **wdk-service/src/wdk.ts** (Real WDK Implementation)

Location: `wdk-service/src/wdk.ts`

Core WDK operations using actual Tether WDK protocols:

```typescript
// Initialize EVM wallet from BIP39 seed phrase
async function initializeWallet(config) {
  const wallet = createWallet({
    seedPhrase: config.seedPhrase,
    chain: 'ethereum'
  });
  return wallet;
}

// Execute real swap on Velora DEX
async function executeSwap(request) {
  const tx = await velora.swap({
    wallet,
    fromToken: request.fromToken,
    toToken: request.toToken,
    amountIn: request.amount
  });
  return { transactionHash: tx.hash, ... };
}

// Real bridge operation
async function bridgeUsdt(request) {
  const tx = await everscaleBridge.bridge({
    token: 'USDT0',
    fromChain: request.fromChain,
    toChain: request.toChain,
    amount: request.amount
  });
  return { transactionHash: tx.hash, ... };
}
```

### 4. **wdk-service/src/index.ts** (Express HTTP API)

Location: `wdk-service/src/index.ts`

Exposes WDK operations as REST API endpoints:

```typescript
// Endpoint: POST /wallet/init
app.post('/wallet/init', async (req, res) => {
  const wallet = await initializeWallet(req.body);
  res.json({ success: true, wallet: wallet.address });
});

// Endpoint: POST /swap
app.post('/swap', async (req, res) => {
  const result = await executeSwap(req.body);
  res.json(result);
});

// Endpoint: GET /balance
app.get('/balance', async (req, res) => {
  const balance = await wallet.getBalance();
  res.json({ usdt: balance.usdt, xaut: balance.xaut });
});
```

---

## Real Blockchain Flow

```
Dashboard (React)
    ↓ HTTP POST
WDKServiceClient.swap()
    ↓ HTTP POST to localhost:3001
wdk-service/src/index.ts POST /swap
    ↓ Calls
wdk-service/src/wdk.ts executeSwap()
    ↓ Uses Tether WDK
@tetherto/wdk-protocol-swap-velora
    ↓ Real blockchain transaction
Velora DEX Smart Contract
    ↓ Execution
Ethereum / Plasma / Arbitrum / etc.
    ↓ Returns
Transaction Hash: 0x7f8e...3a2b
    ↓ Sent back to Dashboard
Updated Portfolio Display
```

---

## Getting Started

### Prerequisites

- **Node.js** 18.17 or later
- **npm** 9 or later
- **BIP39 Seed Phrase** (12 or 24 words) - Generate from MetaMask, Trust Wallet, or similar
- **Funds** on your wallet for gas fees and test transactions

### Installation & Setup

```bash
# 1. Navigate to project directory
cd sovereign-reserve-agent-final

# 2. Install main project dependencies
npm install

# 3. Install WDK service dependencies (CRITICAL - do not skip!)
cd wdk-service
npm install
cd ..

# 4. Configure wallet with your seed phrase
cp .env.local.example .env.local

# 5. Edit .env.local and uncomment/set:
# SEED_PHRASE=word1 word2 word3 ... word12
# (Your 12 or 24 word BIP39 seed phrase)

# 6. Start both services together
npm run wdk:full-dev
```

### What's Running

- **Dashboard**: http://localhost:3000 (React UI)
- **WDK Service**: http://localhost:3001 (Real blockchain operations)

### Type Checking

```bash
npm run type-check
```

All TypeScript files should compile without errors.

---

## Configuration

### Environment Variables

Create a `.env.local` file for wallet and blockchain configuration:

```env
# REQUIRED: Your BIP39 Seed Phrase (12 or 24 words)
# NEVER commit this file - it's in .gitignore
# NEVER share your seed phrase with anyone
SEED_PHRASE=word1 word2 word3 ... word12

# Optional: RPC Endpoints (uses defaults if not set)
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-key
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/your-key

# Optional: LLM Configuration
SRA_LLM_MODE=PRODUCTION
SRA_LLM_ENDPOINT=https://api.example.com/v1/chat/completions
SRA_LLM_API_KEY=your_api_key_here
SRA_LLM_MODEL=gpt-4-turbo

# Optional: WDK Service Port
WDK_SERVICE_PORT=3001
```

### Public Configuration (`.env.example`)

```env
# These are safe to commit - no secrets
NEXT_PUBLIC_WDK_SERVICE_URL=http://localhost:3001
COINTECKO_API_KEY=optional_for_higher_rate_limits
```

---

## Wallet & Security

### Seed Phrase Protection

- **Never commit** `.env.local` (it's in `.gitignore`)
- **Never share** your seed phrase
- **Never log** your seed phrase in console
- Seed phrase is **only used locally** - never sent to server
- Keys are **wiped from memory** on service shutdown (SIGTERM/SIGINT)

### How Wallets Work

1. **Local Derivation**: BIP39 seed phrase → EVM wallet address
2. **Self-Custodial**: You control the private key, not the service
3. **Non-Custodial**: Service never stores or transmitted your keys
4. **Transaction Signing**: Service signs transactions locally, sends to blockchain

```typescript
// Example: Wallet initialization (in wdk-service)
const wallet = createWallet({
  seedPhrase: process.env.SEED_PHRASE,  // Only read from .env.local
  chainId: 1  // Ethereum mainnet
});

// Private key never leaves service
const signer = wallet.getSigner();
signer.signTransaction(tx);  // Signed locally
blockchain.sendTransaction(tx);  // Only signed tx sent
```

---

## Persona System

### Decision Profiles

| Aspect | Ironclad | Surfer | Hawk |
|--------|----------|--------|------|
| **Risk Level** | Conservative | Balanced | Aggressive |
| **Max Slippage** | 5 bps | 30 bps | 100 bps |
| **Confidence Threshold** | 95% | 75% | 60% |
| **Max Position Size** | 5% | 20% | 35% |
| **Volatility Tolerance** | 15% | 35% | 60% |
| **Preferred Action** | Hold | Rebalance | Arbitrage |

### How They Work

1. **Ironclad**: Capital preservation focused. Only executes swaps with ultra-high confidence.
2. **Surfer**: Opportunistic rebalancing. Balances yield with risk management.
3. **Hawk**: Aggressive arbitrage hunting. Strikes on any profitable inefficiency.

---

## Features

### Real-Time Market Data

The `PriceOracle` fetches live data from **CoinGecko API** (free, no auth):
- **USDT Price**: ~$1.00
- **XAUT Price**: ~$2,600-2,700 (gold-backed)
- **ETH Price**: Current market rate
- **Update Frequency**: 60-second cache TTL

### Proof of Reasoning

Every AI decision is audited:

```json
{
  "hash": "a7f3e9c21b45d67f8a9e2c1f4d7b9a3e",
  "timestamp": "2026-03-22T14:32:15Z",
  "persona": "Surfer",
  "confidence": 0.82,
  "decision": "SWAP_XAUT_TO_USDT",
  "reasoning": "Pool ratio 52% indicates USDT surplus...",
  "verificationEndpoint": "/api/proof/a7f3e9c21b45d67f8a9e2c1f4d7b9a3e"
}
```

### Dashboard Components

- **Treasury Matrix**: Pool reserves and ratios
- **OmniBrain Terminal**: Live decision logs
- **Execution Feed**: Transaction history
- **Wallet Display**: User balance tracking
- **Persona Selector**: Risk profile switcher

---

## API Reference

### POST /api/agent

Execute a decision cycle:

**Request:**
```json
{
  "persona": "Surfer",
  "action": "evaluate_and_execute",
  "timestamp": "2026-03-22T14:32:15Z"
}
```

**Response:**
```json
{
  "success": true,
  "persona": "Surfer",
  "decision": {
    "action": "SWAP_XAUT_TO_USDT",
    "confidence": 0.82,
    "reasoning": "Pool imbalance detected..."
  },
  "execution": {
    "success": true,
    "txHash": "0x...",
    "sellAmount": "100000000",
    "buyAmount": "265000000",
    "status": "SUCCESS"
  },
  "marketData": {
    "usdtPrice": 0.9999,
    "xautPrice": 2650.45,
    "usdtReserve": 5000,
    "xautReserve": 2000
  },
  "walletData": {
    "usdt": 5000,
    "xaut": 1
  },
  "proofOfReasoning": {
    "hash": "a7f3e9c21b45d67f8a9e2c1f4d7b9a3e",
    "timestamp": "2026-03-22T14:32:15Z",
    "verificationEndpoint": "/api/proof/a7f3e9c21b45d67f8a9e2c1f4d7b9a3e"
  }
}
```

---

## Real Blockchain Operations

### Supported WDK Operations

**Swap Protocol** (Velora DEX)
```
Execute real token swaps on DEX aggregators
- Currencies: All EVM-compatible tokens
- Chains: Ethereum, Arbitrum, Optimism, Plasma, Stable, Polygon, etc.
- Slippage: Configurable per persona
- Example: Swap 100 USDT → XAUT
```

**Bridge Protocol** (Everscale Bridge)
```
Cross-chain token transfers
- Bridge: USDT0 between chains
- Example: Bridge 50 USDT from Ethereum → Arbitrum
```

**Lending Protocol** (Aave V3)
```
Deposit/borrow/repay on Aave V3
- Deposit: Add collateral to earn interest
- Borrow: Borrow against collateral
- Repay: Return borrowed amount
- Withdraw: Retrieve collateral
```

**Payment Protocol** (x402)
```
Pay for API resources with tokens
- Example: Pay for premium API access
```

### Transaction Costs

All WDK operations incur real gas fees:

```
Network              | Gas Price (typical) | Cost per swap
--------------------|---------------------|------------------
Ethereum Mainnet     | 30-100 gwei        | $10-50 USD
Arbitrum            | 0.1-0.5 gwei       | $0.10-0.50 USD
Optimism            | 1-5 gwei           | $0.50-2.50 USD
Polygon             | 30-100 gwei        | $0.01-0.10 USD
Plasma              | < 0.1 gwei         | < $0.01 USD (very low)
```

---

## Testing & Validation

### Type Checking
```bash
npm run type-check
```

### Build Verification
```bash
npm run build
```

### Run Locally
```bash
npm run dev
# Visit http://localhost:3000
```

---

## How to Use (Dashboard)

1. **Open Dashboard**: http://localhost:3000
2. **Ensure WDK Service Running**: Check http://localhost:3001/health
3. **Select Persona**: Choose Ironclad, Surfer, or Hawk (risk profile)
4. **Click Trigger Persona**: Initiates decision cycle and real blockchain swap
5. **View Execution**: Watch terminal output + real transaction hash
6. **Monitor Wallet**: See balance changes on real blockchain

---

## Common Questions

### Q: How do I start real blockchain operations?
**A:** Follow the setup in "Getting Started" - install WDK service and provide SEED_PHRASE in .env.local

### Q: What happens if I don't provide a seed phrase?
**A:** Without SEED_PHRASE, the system cannot initialize wallets - you must provide one for real operations.

### Q: How accurate are prices?
**A:** CoinGecko API provides real-time market data updated every 60 seconds. Suitable for trading decisions.

### Q: Can I modify personas?
**A:** Yes! Edit `src/core/PersonaConfig.ts` to adjust slippage, confidence thresholds, and position sizes.

### Q: What happens if WDK service crashes?
**A:** Dashboard becomes unavailable for trading. Restart with: `npm run wdk:service:dev`

### Q: How much do real swaps cost?
**A:** Each swap incurs gas fees based on network. See "Transaction Costs" section above for estimates.

---

## Architecture Details: How WDK Integration Works

### Complete Blockchain Flow

```
1. User Dashboard (React)
   ↓ User clicks "Trigger Persona"
2. /api/agent endpoint
   ↓ Analyze market + make decision
3. OmniBrain reasoning engine
   ↓ Call WDKVault.executeHedgingSwap()
4. WDKVault routes to WDKServiceClient
   ↓ HTTP POST to WDK service
5. wdk-service/index.ts receives request
   ↓ Calls wdk-service/wdk.ts
6. WDK Core implementation
   ├─ Load wallet from SEED_PHRASE
   ├─ Connect to RPC endpoint
   ├─ Prepare transaction via Tether WDK
   └─ Sign locally (keys never leave service)
7. Send signed transaction to blockchain
   ↓ Execute on Velora DEX / Aave / Bridge
8. Wait for confirmation
   ↓ Return transaction hash
9. Dashboard updates with results
   ├─ New portfolio balances
   ├─ Transaction hash & link
   └─ Execution details
```

### Key Security Features

1. **Seed phrase**: Lives only in `wdk-service` process
2. **Private keys**: Never logged, never transmitted
3. **Transaction signing**: Happens locally in wdk-service
4. **Only signed transactions**: Sent to blockchain
5. **Memory cleanup**: Keys wiped on service shutdown

---

## Configuration Files Explained

### `.env.local` (Secrets - never commit)

```env
# Your BIP39 seed phrase - 12 or 24 words
SEED_PHRASE=word1 word2 word3 ... word24

# Override WDK service URL if not locally hosted
NEXT_PUBLIC_WDK_SERVICE_URL=http://localhost:3001

# Optional: Custom RPC endpoints
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-key
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/your-key
```

### `.env.example` (Public template - commit this)

```env
# WDK service location
NEXT_PUBLIC_WDK_SERVICE_URL=http://localhost:3001

# CoinGecko API (optional, free tier sufficient)
COINGECKO_API_KEY=

# Optional LLM for better reasoning
SRA_LLM_ENDPOINT=https://api.openai.com/v1/chat/completions
SRA_LLM_API_KEY=
SRA_LLM_MODEL=gpt-4-turbo
```

### `wdk-service/.env` (WDK Service config)

```env
# Port for WDK service HTTP API
PORT=3001

# Database URL (if using persistence)
DATABASE_URL=

# Logging level
NODE_LOG_LEVEL=debug|info|warn|error
```
  recipient: '0x...'
});
```

### Transaction Confirmation

All write operations require explicit user confirmation:

1. User triggers action in dashboard
2. Agent prepares transaction
3. **User approves** in confirmation dialog
4. Transaction broadcasts to blockchain
5. Receipt shown in dashboard

This ensures human oversight of all real transactions.

### Security Best Practices

```bash
✅ DO:
- Store seed phrase in environment variables
- Use .env.local (in .gitignore)
- Run WDK service on private network
- Test with small amounts first ($1-5)
- Call /cleanup endpoint on shutdown

❌ DON'T:
- Commit seed phrases to git
- Hardcode secrets in source code
- Run WDK service publicly
- Use production funds for testing
- Share seed phrases with anyone
```

### Recommended Chains for Testing

**Plasma** (Recommended)
- Zero fees
- Instant finality
- Purpose-built for USDT0

**Stable** (Recommended)
- Zero fees
- Instant finality
- Purpose-built for USDT0

**Ethereum Goerli** (Alternative)
- Free testnet faucets
- Slower transactions
- Good for development

### Cost Estimates

| Chain | Swap Fee | Bridge Fee | x402 Fee |
|-------|----------|-----------|----------|
| **Plasma/Stable** | ~$0.001 | ~$0.001 | ~$0.001 |
| **Ethereum** | ~$5-50+ | ~$3-10 | ~$0.5-2 |
| **Arbitrum** | ~$0.10-0.50 | ~$0.50-2 | ~$0.01 |

### References

- **Tether WDK Docs**: https://docs.wdk.tether.io/
- **WDK Core GitHub**: https://github.com/tetherto/wdk-core
- **Agent Skills**: https://docs.wdk.tether.io/ai/agent-skills
- **x402 Protocol**: https://www.x402.org/
- **SDK All Modules**: https://docs.wdk.tether.io/sdk/all-modules

### Support & Community

- **Discord**: [WDK Community](https://discord.gg/tetherdev)
- **GitHub**: [tetherto/wdk-core](https://github.com/tetherto/wdk-core)
- **Email**: wallet-info@tether.io

---

## Troubleshooting

### Error: `'tsx' is not recognized`

**Cause**: WDK service dependencies tidak terinstall

**Solution**:
```bash
cd wdk-service
npm install
cd ..
npm run wdk:service:dev
```

### Error: `Cannot find module @tetherto/wdk-wallet-evm`

**Cause**: Sama seperti di atas - forgot to `npm install` in wdk-service

**Solution**:
```bash
cd wdk-service && npm install && cd ..
```

### Port 3001 already in use

**Cause**: WDK service already running or port in use

**Solution**:
```bash
# Change port
set WDK_SERVICE_PORT=3002
npm run wdk:service:dev
```

### SEED_PHRASE not working

**Cause**: `.env.local` not created or wrong format

**Solution**:
```bash
# Create file
cp .env.local.example .env.local

# Edit .env.local and uncomment:
# SEED_PHRASE=word1 word2 ... word12

# Verify seed phrase has 12 or 24 words
echo %SEED_PHRASE% | wc -w  # Should output 12 or 24
```

### Dashboard shows "DEMO mode" even though SEED_PHRASE exists

**Cause**: WDK service not running or cannot be reached

**Solution**:
```bash
# Check if service running
curl http://localhost:3001/health

# If no response, start service:
npm run wdk:service:dev
```

### Wallet balance not updating

**Cause**: Service not yet connected to blockchain

**Solution**:
1. Make sure WDK service is running: `http://localhost:3001/health`
2. Check RPC connection in `.env.local`
3. Wait ~10 seconds for first sync

### Swap fails with "Insufficient balance"

**Cause**: Wallet doesn't have enough tokens

**Solution**:
- Bridge USDT from Ethereum to Plasma/Stable
- Or request from faucet: https://faucet.plasma.to

### Service crashes with native module error

**Cause**: WDK native dependencies conflict

**Solution**:
```bash
# Clean everything
rm -rf wdk-service/node_modules
cd wdk-service
npm cache clean --force
npm install
cd ..
npm run wdk:service:dev
```

### Next.js dev server won't start

**Cause**: Port 3000 already in use

**Solution**:
```bash
# Change port
set PORT=3001
npm run dev

# Or kill process using port 3000
taskkill /PID <PID> /F
```

---

## License

MIT License - Built for DoraHacks Galactica 2026

---

## Credits & Attribution

- **Tether WDK**: Wallet Development Kit for swap protocol
- **CoinGecko**: Free market data API  
- **z-ai-web-dev-sdk**: Free AI inference layer
- **Framer Motion**: Animation library
- **Tailwind CSS**: Utility-first styling
- **DoraHacks**: Galactica 2026 Hackathon

---

**Ready to deploy autonomous liquidity management!** 🚀
