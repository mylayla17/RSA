---
title: Sovereign Reserve Agent - Developer Customization Guide
description: Complete guide for developers to understand, extend, and customize the Sovereign Reserve Agent architecture, components, and blockchain operations.
applyTo:
  - typescript
  - nextjs
  - blockchain
  - wdk
  - nodejs
rules:
  - rule: Always run npm install in wdk-service before starting development
    rationale: Native WDK modules cannot be loaded without proper dependency installation
    applies_to: [setup, development, production]
  
  - rule: Keep SEED_PHRASE and RPC endpoints in .env.local, never in .env
    rationale: Security - sensitive credentials must not be version controlled
    applies_to: [environment, security, production]
  
  - rule: DEMO mode executes locally without WDK service, PRODUCTION mode requires running WDK service
    rationale: NextJS serverless cannot load native modules - separate Node.js service needed
    applies_to: [architecture, execution, deployment]
  
  - rule: All blockchain operations use BigInt with 6 decimal places for token amounts
    rationale: Consistency across WDK protocols and avoiding floating point errors
    applies_to: [wdk-service, execution, calculations]
---

# 🔧 Developer Customization Guide

## Overview

The Sovereign Reserve Agent is a **dual-mode autonomous liquidity management system** with real blockchain integration:

- **DEMO Mode**: Simulated operations (default, requires no setup)
- **PRODUCTION Mode**: Real blockchain via Tether WDK (requires WDK service + seed phrase)

This guide explains the architecture, component responsibilities, and how to extend functionality.  

---

## 📐 Architecture Overview

### System Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js Frontend (React Dashboard)                         │
│  - User interactions                                         │
│  - Portfolio visualization                                  │
│  - Settings management                                      │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP API
                 ↓
┌─────────────────────────────────────────────────────────────┐
│  Next.js Backend API Route (/api/agent)                     │
│  - Parse user requests                                      │
│  - Route to OmniBrain                                       │
│  - Return results                                           │
└────────────────┬────────────────────────────────────────────┘
                 │ Direct imports
                 ↓
┌─────────────────────────────────────────────────────────────┐
│  OmniBrain Execution Core (src/core/OmniBrain.ts)          │
│  - Reasoning about markets                                  │
│  - Strategy selection                                       │
│  - Calls WDKVault for execution                            │
└────────────────┬────────────────────────────────────────────┘
                 │ Executes through
                 ↓
┌─────────────────────────────────────────────────────────────┐
│  WDKVault (src/execution/WDKVault.ts)                     │
│  - Routes to DEMO or PRODUCTION mode                       │
│  - Calls WDKServiceClient for real operations             │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP API calls
                 ↓
┌──────────────────────────────────────────────────────────────┐
│  Standalone WDK Service (wdk-service/src/index.ts)          │
│  - Node.js + Express HTTP API                               │
│  - Loads @tetherto/wdk-* native modules                    │
│  - Executes real blockchain transactions                    │
└──────────────────────────────────────────────────────────────┘
                 │ Uses
                 ↓
┌──────────────────────────────────────────────────────────────┐
│  Tether WDK Protocols (via @tetherto/wdk-*)                │
│  - Wallet management                                         │
│  - Swap operations (Velora DEX)                            │
│  - Cross-chain bridge (Everscale Bridge)                   │
│  - Lending/Borrowing (Aave V3)                             │
│                                                           │
└──────────────────────────────────────────────────────────────┘
                 │
                 ↓
        🌍 Blockchain Networks 🌍
        (Ethereum, Plasma, Stable, Arbitrum, etc.)
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Separate WDK Service** | NextJS serverless runtime cannot load native modules (@tetherto requires native bindings) |
| **Dual-mode execution** | DEMO for testing without infrastructure, PRODUCTION for real blockchain |
| **HTTP communication** | Decouples frontend from blockchain operations, enables scaling |
| **BigInt for amounts** | WDK protocols require precise integer amounts (6 decimals = microunits) |
| **Environment-based routing** | SEED_PHRASE in .env.local determines mode (simple, clear activation) |

---

## 📁 File Responsibilities

### Core Files

#### `src/app/layout.tsx` & `src/app/page.tsx`
**Purpose**: React layout and main dashboard page
**Responsibilities**:
- Render Next.js layout (metadata, fonts, root structure)
- Provide dashboard shell component

**When to modify**:
- Changing page structure or metadata
- Adding global styles or scripts
- Adding new layout sections

---

#### `src/app/api/agent/route.ts`
**Purpose**: HTTP API endpoint (`POST /api/agent`)
**Responsibilities**:
- Parse user prompts from dashboard
- Initialize OmniBrain if needed
- Dispatch to appropriate handler (chat, hedge, portfolio, etc.)
- Return formatted response to frontend

**Key exports**:
- `POST()` - Main request handler
- Internal helpers: `initializeIfNeeded()`, helper functions

**When to modify**:
- Adding new action types (beyond current: chat, hedge, portfolio, settings)
- Changing request/response format
- Adding middleware (logging, validation, auth)

---

#### `src/core/OmniBrain.ts`
**Purpose**: Core reasoning and execution orchestration
**Responsibilities**:
- Analyze market conditions (prices, trends, volatility)
- Reason about hedging strategies (delta hedging, volatility trading, arbitrage)
- Select optimal execution path
- Call WDKVault for actual transactions
- Maintain execution history for learning

**Key methods**:
- `analyzePortfolio()` - Current holdings analysis
- `suggestHedge()` - Strategy recommendations
- `executeHedge()` - Execute selected strategy
- `healthCheck()` - Service status

**When to modify**:
- Adding new reasoning strategies
- Changing market analysis algorithms
- Adding new portfolio metrics
- Implementing learning mechanisms

---

#### `src/execution/WDKVault.ts`
**Purpose**: Execution router (DEMO ↔ PRODUCTION)
**Responsibilities**:
- Detect if PRODUCTION mode enabled (SEED_PHRASE in .env.local)
- Route execution requests to appropriate handler
- DEMO: Simulate trades with fake tx hashes
- PRODUCTION: Call WDKServiceClient for real blockchain operations
- Handle fallback (PRODUCTION → DEMO on service unavailable)

**Key methods**:
- `isDemoMode` - Property detecting mode
- `executeHedgingSwap()` - Primary execution entry point
- `executeRealSwap()` - Private method calling WDK service
- All DEMO simulation methods

**Critical implementation**:
```typescript
// Inside executeHedgingSwap():
if (!this.isDemoMode) {
  try {
    const result = await this.executeRealSwap(...);
    if (result.success) return result;
  } catch (e) {
    console.warn('Real swap failed, falling back to DEMO');
  }
}
// Falls back to DEMO mode
```

**When to modify**:
- Changing fallback behavior
- Adding new execution types (lending, borrowing)
- Adjusting slippage or gas calculations
- Modifying DEMO simulation values

---

#### `src/core/WDKServiceClient.ts`
**Purpose**: HTTP client connecting to WDK service
**Responsibilities**:
- Singleton pattern - single instance for entire app
- Provides methods for all WDK operations
- Handles timeouts and connection failures
- Formats request/response data

**Key methods**:
- `healthCheck()` - Verify service is running
- `initWallet(config)` - Initialize wallet from seed phrase
- `swap(request)` - Execute DEX swap
- `bridge(request)` - Cross-chain bridge
- `lend(action, token, amount)` - Lending operations
- `makePayment(resourceUrl)` - x402 payment protocol
- `cleanup()` - Wipe keys from memory

**Configuration**:
- Service URL from `NEXT_PUBLIC_WDK_SERVICE_URL` environment variable
- Defaults to `http://localhost:3001` if not set
- Timeouts: 30s for operations, 5s for health check

**When to modify**:
- Adding new WDK operations
- Changing timeout values
- Adding request/response transformations
- Implementing retry logic

---

### WDK Service Files (Node.js Backend)

#### `wdk-service/src/wdk.ts`
**Purpose**: Core WDK protocol integration
**Responsibilities**:
- Initialize EVM wallets from BIP39 seed phrases
- Execute swaps via Velora DEX
- Bridge USDT across chains
- Manage Aave V3 lending/borrowing
- Cleanup keys on shutdown

**Key functions**:
- `initializeWallet(config)` - Wallet initialization
- `executeSwap(request)` - DEX swap execution
- `bridgeUsdt(request)` - Cross-chain bridge
- `lendOrBorrow(action, token, amount)` - Aave operations
- `cleanup()` - Security cleanup

**Critical patterns**:
- All amounts are **BigInt with 6 decimals** (1 USDT = 1000000)
- Swap scaling: USDT→XAUT scaled (1e6), XAUT→USDT unscaled
- Results always have `success` and `error` properties
- Never throws - always returns result object

**Example - BigInt usage**:
```typescript
// 100 USDT = 100000000 in microunits
const amountMicrounits = BigInt(100) * BigInt(10**6);

// For rates: 1 XAUT costs 100 USDT
// If swapping to XAUT, multiply rate by scaling factor
const rateWithScale = rate * BigInt(10**6);
```

**When to modify**:
- Replacing Velora with different DEX
- Adding support for new chains
- Changing Aave V3 configuration
- Implementing new protocols

---

#### `wdk-service/src/index.ts`
**Purpose**: Express HTTP API server
**Responsibilities**:
- Expose WDK operations as REST endpoints
- Handle request parsing and validation
- Implement CORS and middleware
- Graceful shutdown with key cleanup
- Health check endpoint

**Endpoints**:
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/wallet/init` | Initialize wallet from seed phrase |
| POST | `/swap` | Execute swap |
| POST | `/bridge` | Bridge tokens across chains |
| POST | `/lending/:action` | Lending/borrowing (deposit/borrow/withdraw/repay) |
| POST | `/payment/x402` | x402 payment |
| GET | `/balance` | Check wallet balance |
| POST | `/cleanup` | Wipe keys from memory |
| GET | `/health` | Service health check |

**Request/response format**:
```typescript
// Generic request
{ operation: "string", data: {...} }

// Generic response
{ success: boolean, data?: any, error?: string }
```

**When to modify**:
- Adding new endpoints
- Changing request/response format
- Adding authentication
- Implementing rate limiting

---

### Configuration Files

#### `.env.example`
**Purpose**: Template for environment variables
**Contains**:
- NEXT_PUBLIC_WDK_SERVICE_URL (frontend WDK service location)
- RPC endpoints for all chains
- CoinGecko API key (optional)
- z-ai inference API key
- WDK service configuration

**Never put sensitive data here** - this is committed to git

---

#### `.env.local.example`
**Purpose**: Template for local development with real blockchain
**Contains**:
- SEED_PHRASE (your 12/24 word mnemonic - **NEVER COMMIT**)
- Any environment-specific overrides

**Critical**:
- Copy to `.env.local` before running PRODUCTION mode
- Add to `.gitignore` (should already be there)
- Never share or commit SEED_PHRASE

---

#### `tsconfig.json`
**Purpose**: TypeScript configuration
**Key settings**:
- Target: ES2020 (BigInt support required)
- Module: ESNext
- Strict mode: true
- JSX: preserve (React JSX transform)
- Paths: Aliasing for clean imports

**When to modify**:
- Adding path aliases
- Changing JavaScript target
- Adding library references

---

### Documentation Files

#### `README.md`
**Purpose**: Main project documentation
**Sections**:
1. Overview - What the system does
2. Quick Start - DEMO mode (2 steps)
3. Getting Started - PRODUCTION setup (4 steps)
4. Architecture - System design
5. API Reference - Endpoint documentation
6. Configuration - .env settings
7. Troubleshooting - 8 common errors with solutions
8. License and Credits

**When to update**:
- Adding new features
- Changing setup process
- Discovering new common errors
- Updating dependencies

---

#### `QUICKSTART.md`
**Purpose**: Fast setup guide for both modes
**Contains**:
- 2-step DEMO setup (no dependencies)
- 4-step PRODUCTION setup (with WDK service)
- Exact terminal commands
- Expected output for each step

**When to update**:
- Simplifying setup process
- Changing port numbers
- Adding new quick setup paths

---

#### `wdk-service/README.md`
**Purpose**: Complete WDK service documentation
**Contains**:
- Architecture explanation
- Installation steps
- API reference
- Configuration guide
- Cost estimates for operations
- Security considerations
- Troubleshooting

**When to update**:
- Adding new WDK capabilities
- Changing service startup
- Adding new security recommendations

---

## 🔄 Development Workflow

### Local Development

#### Setup (DEMO Mode - Fastest)

```bash
# Clone and install
git clone <repo>
cd sovereign-reserve-agent-final
npm install

# Run development server
npm run dev

# Open http://localhost:3000
# Dashboard shows "DEMO mode" - all trades simulated
```

No additional setup needed. Perfect for UI development and testing logic.

#### Setup (PRODUCTION Mode - Real Blockchain)

```bash
# 1. Install WDK service dependencies
cd wdk-service
npm install
cd ..

# 2. Create .env.local with seed phrase
cp .env.local.example .env.local
# Edit: add your 12 or 24 word BIP39 seed phrase

# 3. Start WDK service (terminal 1)
npm run wdk:service:dev

# 4. Start Next.js dashboard (terminal 2)
npm run dev

# Open http://localhost:3000
# Dashboard shows "LIVE mode" - real operations on blockchain
```

---

### Common Development Tasks

#### Adding a new Execution Strategy

1. **Define strategy in OmniBrain.ts**:
```typescript
async suggestArbitrageStrategy(portfolio: Portfolio) {
  // Analyze opportunities
  // Return strategy recommendation
  return {
    type: 'arbitrage',
    fromChain: 'ethereum',
    toChain: 'arbitrum',
    amount: portfolio.usdt * 0.1,
    expectedProfit: '2.3%'
  };
}
```

2. **Add execution in WDKVault.ts**:
```typescript
async executeArbitrage(request: ArbitrageRequest) {
  if (this.isDemoMode) {
    return this.simulateArbitrage(request); // DEMO
  } else {
    return wdkClient.bridge(request); // PRODUCTION
  }
}
```

3. **Route from /api/agent**:
```typescript
case 'arbitrage':
  return omniBrain.executeArbitrage(request);
```

#### Adding WDK Operation Support

1. **Add endpoint in wdk-service/src/index.ts**:
```typescript
app.post('/new-operation', (req, res) => {
  const result = performNewOperation(req.body);
  res.json(result);
});
```

2. **Implement in wdk-service/src/wdk.ts**:
```typescript
export async function performNewOperation(data) {
  try {
    // Use wdk protocols
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

3. **Add client method in WDKServiceClient.ts**:
```typescript
async newOperation(data) {
  return this.call('new-operation', data);
}
```

#### Testing Your Changes

```bash
# Type checking
npm run type-check

# Run dev with both services (requires two terminals)
# Terminal 1:
npm run wdk:service:dev

# Terminal 2:
npm run dev

# Manual testing at http://localhost:3000
```

---

## 🔐 Security Considerations

### Key Management
- **SEED_PHRASE**: 
  - 12 or 24 word BIP39 mnemonic
  - Lives in `.env.local` (NOT committed)
  - Only loaded when .env.local exists
  - Wiped from memory on service cleanup (SIGTERM/SIGINT)

### Network Security
- **RPC Endpoints**: Use public or trusted private nodes
  - Public: Free but rate-limited
  - Private: Higher limits, costs money
- **WDK Service**: Runs locally on localhost:3001 by default
  - Never expose to internet without authentication

### Code Security
- **No key logging**: Never console.log() seed phrases or private keys
- **Result objects**: Always use result.success/error pattern (no throws)
- **Environment vars**: Use .env.local for secrets, .env for public config

---

## 🐛 Troubleshooting Guide

### WDK Service Won't Start

**Error**: `'tsx' is not recognized`
```bash
# Solution: Install WDK service dependencies first
cd wdk-service
npm install
cd ..
npm run wdk:service:dev
```

**Error**: `Cannot find module '@tetherto/...'`
```bash
# Make sure you npm install in BOTH directories
cd wdk-service && npm install && cd ..
npm install  # Also in root
```

### DEMO Mode When PRODUCTION Expected

**Error**: Dashboard shows "DEMO mode" but SEED_PHRASE in .env.local
```bash
# Check 1: Is WDK service running?
curl http://localhost:3001/health

# Check 2: Is .env.local actually loaded?
# Restart dev server after creating .env.local

# Check 3: Is SEED_PHRASE correct format?
echo %SEED_PHRASE% | wc -w  # Should output 12 or 24
```

### Out of Order Execution

**Problem**: Commands execute but results appear in wrong order

**Solution**: OmniBrain maintains execution queue - check console logs for ordering

---

## 📊 Performance Optimization

### Database Queries
- No database currently - all state in memory
- For scaling: Implement Redis for session state

### Blockchain Calls
- Batch requests to reduce RPC calls
- Cache price data (currently caches for 5 minutes)
- Use contract ABIs with minimal fields

### Frontend Rendering
- Framer Motion animations: Already optimized for 60fps
- Update only changed portfolio values
- Implement React.memo() for expensive components

---

## 🚀 Deployment

### To Production Server

```bash
# Build Next.js
npm run build

# Start WDK service (in background or systemd)
cd wdk-service
npm install --production
NODE_ENV=production npm start &

# Start Next.js (in background or systemd)
cd ..
NODE_ENV=production npm start
```

### Environment Setup for Production

```bash
# .env.local on server
SEED_PHRASE=word1 word2 ... word24
NEXT_PUBLIC_WDK_SERVICE_URL=http://localhost:3001
ETH_RPC_URL=<your-eth-rpc>
WDK_SERVICE_PORT=3001
```

### Security for Production

- Use environment variable vault (AWS Secrets Manager, HashiCorp Vault)
- Run WDK service as isolated user with minimal permissions
- Use firewall rules to restrict WDK service access
- Implement monitoring/alerts for service health
- Regular backups of execution logs

---

## 📚 Key Concepts

### BigInt and Decimal Scaling
- WDK APIs use **integer arithmetic** (no decimals)
- USDT: 6 decimal places → 1 USDT = 1,000,000 microunits
- Example: `BigInt(100) * BigInt(10**6) = 100,000,000`

### DEMO vs PRODUCTION
- **DEMO**: Simulated trades, no blockchain, instant results
- **PRODUCTION**: Real trades, requires WDK service, real gas fees

### Token Amounts
- Always represent as BigInt with 6 decimal places
- Convert: `humanReadable * BigInt(10**6) = blockchainAmount`
- Example: `100.5 USDT = 100500000 microunits`

### Rate Scaling
- **USDT → XAUT**: Multiply rate by 1e6 (scaling for precision)
- **XAUT → USDT**: Use rate as-is (already properly scaled)
- Reason: Velora DEX requires scaled rates for stable pairs

---

## 🔗 External Resources

- **Tether WDK**: https://github.com/tetherto/wdk
- **CoinGecko API**: https://www.coingecko.com/en/api
- **Aave V3**: https://aave.com/
- **Velora DEX**: https://velora.io/

---

## 📝 Contributing Guidelines

1. Create feature branch: `git checkout -b feature/name`
2. Make changes with clear commits
3. Test in both DEMO and PRODUCTION modes
4. Update documentation if behavior changes
5. Ensure `npm run type-check` passes
6. Submit PR with description

---

## ❓ FAQ

**Q: Can I run DEMO and PRODUCTION simultaneously?**
A: Yes. DEMO uses simulated data, PRODUCTION uses separate WDK service on port 3001. No conflict.

**Q: Where do I get a seed phrase?**
A: Generate from wallet: MetaMask, Trust Wallet, or `npm run generate-seed` (after implementing).

**Q: How much does it cost to run?**
A: See [wdk-service/README.md](wdk-service/README.md) for cost estimates. DEMO mode is free.

**Q: Why is WDK a separate service?**
A: NextJS serverless can't load native Node.js modules. WDK needs native bindings, so separate Node.js process required.

**Q: Can I use different blockchains?**
A: Yes. WDK supports 20+ EVM chains. Configure RPC endpoints in .env.

---
