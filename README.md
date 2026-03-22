# Sovereign Reserve Agent (SRA)

**Autonomous DeFi Agent for USDt/XAUt Liquidity Rebalancing**

Built for **DoraHacks Galactica 2026** - Track 3: Autonomous DeFi Agent

> A production-ready autonomous agent that intelligently manages liquidity reserves using real-time market data, multi-persona decision-making, and cryptographic proof of reasoning.

---

## ⚡ Quick Start (2 Minutes)

### Option A: DEMO Mode (Fastest - No blockchain needed)

```bash
npm install
npm run dev
```

Open **http://localhost:3000** - Ready! (Swaps are simulated, not real blockchain)

### Option B: PRODUCTION Mode (Real Blockchain)

```bash
# 1. Install main project
npm install

# 2. Install WDK service dependencies (IMPORTANT!)
cd wdk-service
npm install
cd ..

# 3. Setup wallet
cp .env.local.example .env.local
# Edit .env.local: Uncomment and set SEED_PHRASE=word1 word2 ... word12

# 4. Run both together
npm run wdk:full-dev
```

Open **http://localhost:3000** - Real blockchain swaps active!

---

## Overview

Sovereign Reserve Agent is an autonomous AI-powered liquidity management system that dynamically rebalances USDt/XAUt reserves based on real-time market conditions. Powered by Tether WDK, advanced reasoning, and live market intelligence.

### Core Capabilities

- **Multi-Persona Decision Engine**: Three distinct risk profiles with independent thresholds
- **Cryptographic Proof of Reasoning**: SHA-256 audit trail of every AI decision
- **Real-Time Market Data**: Live prices from CoinGecko and Bitfinex APIs  
- **Dual Execution Modes**: DEMO (simulated) and PRODUCTION (real swaps via WDK)
- **Free AI Integration**: Uses free z-ai-web-dev-sdk, upgradeable to enterprise LLMs
- **React Command Center**: Real-time dashboard with execution feed and terminal

---

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | React 18 + Next.js 14 | Web UI & Server API |
| **Language** | TypeScript 5.4 | Type-safe development |
| **Styling** | Tailwind CSS 3.4 | Responsive UI design |
| **Animations** | Framer Motion 11 | Smooth interactions |
| **AI/LLM** | z-ai-web-dev-sdk | Decision reasoning |
| **Market Data** | CoinGecko API | Real prices (USDT, XAUT, ETH) |
| **Blockchain** | Tether WDK | Swap execution & balances |

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
    ├─→ WDKVault (Swap Execution)
    ├─→ PriceOracle (Live Prices)
    └─→ ProofOfReasoning (Audit Trail)
```

### Data Flow

1. **Input**: User selects persona (Ironclad, Surfer, or Hawk)
2. **Market Analysis**: `OmniBrain` fetches real prices via `PriceOracle`
3. **Decision Making**: `OpenClawEngine` invokes LLM for reasoning
4. **Execution**: `WDKVault` simulates (DEMO) or executes (PROD) swap
5. **Audit**: `ProofOfReasoning` logs decision with cryptographic hash
6. **Output**: Dashboard displays decision, execution, and balances

---

## Project Structure

```
sovereign-reserve-agent-final/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── agent/
│   │   │       └── route.ts        # POST /api/agent endpoint
│   │   ├── page.tsx                # Entry page
│   │   ├── layout.tsx              # Root layout
│   │   └── globals.css             # Global styles
│   ├── core/
│   │   ├── OmniBrain.ts            # Decision orchestrator
│   │   ├── OpenClawEngine.ts       # LLM integration
│   │   ├── OpenClawStrategy.ts     # Market strategy engine
│   │   └── PersonaConfig.ts        # Risk profile definitions
│   ├── execution/
│   │   └── WDKVault.ts             # DEMO/PROD swap handler
│   ├── oracle/
│   │   └── PriceOracle.ts          # CoinGecko + fallback pricing
│   ├── logs/
│   │   └── ProofOfReasoning.ts     # Audit trail & hashing
│   └── ui/
│       └── SovereignDashboard.tsx  # React command center
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** 18.17 or later
- **npm** 9 or later

### Installation

#### DEMO Mode (Recommended First Try)

```bash
# 1. Navigate to project directory
cd sovereign-reserve-agent-final

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

**Open**: http://localhost:3000 → Done!

#### PRODUCTION Mode (Real Blockchain)

```bash
# 1. Install main project
cd sovereign-reserve-agent-final
npm install

# 2. Install WDK service (IMPORTANT - do not skip!)
cd wdk-service
npm install
cd ..

# 3. Setup wallet
cp .env.local.example .env.local
# Edit .env.local: Uncomment SEED_PHRASE and set your seed phrase

# 4. Start both services
npm run wdk:full-dev
```

**Open**: http://localhost:3000 → Real blockchain swaps active!

### Run & Access

- **Dashboard**: http://localhost:3000
- **API**: http://localhost:3000/api/agent
- **WDK Service** (if running): http://localhost:3001

### Type Checking

```bash
npm run type-check
```

---

## Configuration

### DEMO Mode (Default)

No configuration needed! The agent runs in DEMO mode by default:
- Uses **free** z-ai-web-dev-sdk for AI
- Simulates swaps (no real blockchain calls)
- Fetches **live** prices from CoinGecko
- Perfect for hackathon demos and testing

### Environment Variables (Optional)

Create a `.env.local` file for advanced configuration:

```env
# LLM Configuration
SRA_LLM_MODE=DEMO                    # or PRODUCTION
SRA_LLM_ENDPOINT=https://api.example.com/v1/chat/completions
SRA_LLM_API_KEY=your_api_key_here
SRA_LLM_MODEL=gpt-4-turbo

# Real WDK Execution (for PRODUCTION mode)
SRA_SEED_PHRASE=your twelve word seed phrase here
SRA_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-key

# Optional: Custom price sources
SRA_BITFINEX_API=true
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

## Execution Modes

### DEMO Mode (Default)

```
Perfect for:
✓ Hackathon videos & demos
✓ Testing decision engine
✓ Live price integration testing
✓ No API keys needed

Behavior:
- Uses free z-ai-web-dev-sdk
- Simulates swaps (no blockchain)
- Fetches REAL market prices
- Instant response (< 500ms)
```

### PRODUCTION Mode

```
Perfect for:
✓ Real portfolio management
✓ Live swap execution
✓ Enterprise LLM integration
✓ Mainnet deployment

Requirements:
- Custom LLM endpoint + API key
- WDK seed phrase
- Ethereum RPC endpoint
- Real ETH for gas fees
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
2. **Select Persona**: Choose Ironclad, Surfer, or Hawk
3. **Click Trigger Persona**: Initiates decision cycle
4. **View Results**: Watch terminal output + execution feed
5. **Monitor Wallet**: See balance changes post-swap
6. **Check Proof**: Review cryptographic audit trail

---

## Common Questions

### Q: Does this cost anything to run?
**A:** No! DEMO mode uses free APIs and free AI (z-ai-web-dev-sdk). No API keys required.

### Q: Can it do real swaps?
**A:** Yes, but requires PRODUCTION configuration with a custom LLM endpoint and WDK seed phrase.

### Q: How accurate are prices?
**A:** CoinGecko API provides real market data with 60-second update frequency. Highly accurate for demo purposes.

### Q: Can I modify personas?
**A:** Yes! Edit `src/core/PersonaConfig.ts` to adjust risk thresholds.

---

## Known Limitations

- DEMO mode simulates swaps (no real blockchain interaction)
- Price cache updates every 60 seconds
- UI is optimized for desktop (mobile support pending)
- Free z-ai-web-dev-sdk has rate limits (use custom LLM for production)

---
## Real WDK Blockchain Integration

The Sovereign Reserve Agent now includes **full Tether WDK integration** for real blockchain swaps, bridges, lending, and x402 payments.

### Architecture

The system uses a **dual-mode architecture**:

```
┌──────────────────────────────────────────────────────────┐
│  DEMO MODE (Default)                                     │
│  Simulated blockchain operations,  no WDK service needed│
│  Perfect for hackathon/testing without real transactions │
└──────────────────────────────────────────────────────────┘
                          OR
┌──────────────────────────────────────────────────────────┐
│  PRODUCTION MODE (With Real Blockchain)                  │
│  Real WDK service + actual blockchain swaps              │
│  Requires: wdk-service running + seed phrase             │
└──────────────────────────────────────────────────────────┘
```

### Quick Start: Enable Real Blockchain

**1. Install WDK Service**

```bash
cd wdk-service
npm install
```

**2. Configure Wallet**

Edit `.env.local` (create from `.env.example`):

```bash
# Add your 12 or 24 word seed phrase
SEED_PHRASE=word1 word2 word3 ... word12

# Specify WDK service URL (default: http://localhost:3001)
NEXT_PUBLIC_WDK_SERVICE_URL=http://localhost:3001
```

⚠️ **SECURITY**: `.env.local` is in `.gitignore` - never commit seed phrases!

**3. Start WDK Service**

```bash
npm run wdk:service:dev
```

Runs on `http://localhost:3001`

**4. Start Dashboard**

In another terminal:

```bash
npm run dev
```

Now REAL blockchain swaps execute when you use the dashboard.

### Capabilities

With WDK service enabled, the agent can:

| Feature | Technology | Status |
|---------|-----------|--------|
| **Wallet Management** | @tetherto/wdk-wallet-evm | ✅ Supported |
| **Token Swaps** | Velora DEX aggregator | ✅ Real swaps |
| **Cross-Chain Bridge** | USDT0 LayerZero bridge | ✅ Real bridges |
| **Lending/Borrowing** | Aave V3 Protocol | ✅ Supported |
| **x402 Payments** | HTTP 402 protocol | ✅ Supported |
| **Multi-Chain** | EVM + Bitcoin, Solana, etc. | ✅ 20+ chains |

### Supported Chains

**EVM Chains** (primary):
- Ethereum (mainnet)
- Plasma (optimized for USDT0, near-zero fees)
- Stable (optimized for USDT0, near-zero fees)
- Arbitrum, Optimism, and 10+ more

**Other Blockchains** (via WDK):
- Bitcoin
- Solana
- TON, Tron, Spark
- And more...

### Configuration

See the complete WDK service documentation:

📖 **[wdk-service/README.md](wdk-service/README.md)**

Key sections:
- Detailed installation steps
- Seed phrase security best practices
- All API endpoints reference
- Troubleshooting guide
- Token addresses by chain
- Cost estimates (gas, x402 fees)

### WDK Service API Endpoints

The WDK service exposes HTTP endpoints for all blockchain operations:

```typescript
// Wallet initialization
POST /wallet/init
{ seedPhrase, chainId, rpcUrl? }

// Get balance
GET /balance?token=0x...

// Execute swaps
POST /swap
{ fromToken, toToken, amount, slippageTolerance? }

// Bridge cross-chain
POST /bridge
{ token, amount, fromChain, toChain, recipient }

// x402 Payments
POST /payment/x402
{ resourceUrl }

// Lending operations
POST /lending/deposit|borrow|withdraw|repay
{ token, amount }
```

Full API reference in [wdk-service/README.md](wdk-service/README.md#api-endpoints-reference)

### Development vs Production

| Aspect | DEMO | PRODUCTION |
|--------|------|-----------|
| **Requires WDK Service** | ❌ No | ✅ Yes |
| **Requires Seed Phrase** | ❌ No | ✅ Yes |
| **Real Blockchain** | ❌ Simulated | ✅ Real |
| **Transaction Cost** | $0 | Variable (gas) |
| **Setup Time** | < 1 min | ~10 min |
| **Use Case** | Hackathons, demos | Production, testing |

### WDK Integration Examples

#### Initialize Real Wallet

```typescript
import { wdkClient } from '@/core/WDKServiceClient';

const result = await wdkClient.initWallet({
  seedPhrase: process.env.SEED_PHRASE,
  chainId: 'plasma', // EVM chain
  rpcUrl: 'https://rpc.plasma.to'
});

console.log('Wallet address:', result.address);
```

#### Execute Real Swap

```typescript
const swapResult = await wdkClient.swap({
  fromToken: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
  toToken: '0x4922a015c4407F87432B179bb209e1253e29690f', // XAUT
  amount: '1000000', // 1 USDT (6 decimals)
  slippageTolerance: 0.01  // 1%
});

if (swapResult.success) {
  console.log('Swap executed:', swapResult.transactionHash);
  console.log('Received:', swapResult.amountOut);
}
```

#### Bridge USDT Cross-Chain

```typescript
const bridgeResult = await wdkClient.bridge({
  token: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  amount: '5000000', // 5 USDT
  fromChain: 'ethereum',
  toChain: 'plasma',
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
