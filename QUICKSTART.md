# Quick Start: Real Blockchain Integration

Get the Sovereign Reserve Agent running with **real Tether WDK blockchain swaps** in 5 minutes.

## ⚡ Shortest Path: DEMO Mode (2 Steps)

```bash
npm install
npm run dev
```

Open http://localhost:3000 - Done! (Simulated swaps, no blockchain needed)

---

## 🔗 Full Setup: PRODUCTION Mode (Real Blockchain)

### Step 1: Install Dependencies (2 min)

```bash
# Main project
npm install

# WDK blockchain service (IMPORTANT!)
cd wdk-service
npm install
cd ..
```

**Do not forget!** WDK service requires separate dependencies.

### Step 2: Configure Wallet (1 min)

Create `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your seed phrase:

```bash
# Your 12 or 24 word Ethereum wallet seed phrase
SEED_PHRASE=word1 word2 word3 ... word12

# WDK service location (default: http://localhost:3001)
NEXT_PUBLIC_WDK_SERVICE_URL=http://localhost:3001
```

⚠️ `.env.local` is git-ignored, safe for secrets.

### Step 3: Start Services (2 min)

**Option A - Start Both Together (Recommended):**

```bash
npm run wdk:full-dev
```

**Option B - Start Separately:**

Terminal 1:
```bash
npm run wdk:service:dev
```

Terminal 2:
```bash
npm run dev
```

### Done! 🎉

Open http://localhost:3000 - Real blockchain swaps ready!

---

## 5-Minute Setup

### Step 1: Install Dependencies (2 min)

```bash
# Main project
npm install

# WDK blockchain service
npm run wdk:service:install
```

### Step 2: Configure Environment (1 min)

Create `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your seed phrase:

```bash
# Your 12 or 24 word Ethereum wallet seed phrase
SEED_PHRASE=word1 word2 word3 ... word12

# WDK service location (default: http://localhost:3001)
NEXT_PUBLIC_WDK_SERVICE_URL=http://localhost:3001
```

⚠️ `.env.local` is git-ignored, so it's safe for secrets.

### Step 3: Start Services (2 min)

**Terminal 1 - WDK Blockchain Service:**

```bash
npm run wdk:service:dev
```

Output: `📍 Host: http://localhost:3001`

**Terminal 2 - Next.js Dashboard:**

```bash
npm run dev
```

Output: `▲ Next.js 14.2.0`

### Done! 🎉

Open http://localhost:3000 and you'll see:

- ✅ Real wallet address (from your seed phrase)
- ✅ Real token balances (from blockchain)
- ✅ Real-time market prices (via CoinGecko)
- ✅ Real swap execution (actual blockchain transactions)

---

## What Got Activated?

### New Files Added

```
wdk-service/                      # New: Standalone blockchain service
├── src/
│   ├── wdk.ts                   # WDK core operations
│   └── index.ts                 # Express HTTP API
├── package.json                 # WDK dependencies
└── .env.example                 # Configuration template

src/core/
└── WDKServiceClient.ts          # New: HTTP client for Dashboard → WDK
```

### Updated Files

```
src/execution/WDKVault.ts        # Now calls WDK service for real swaps
.env.example                     # Added WDK service URL config
package.json                     # Added wdk:* scripts
README.md                        # Added WDK integration guide
```

### New npm Scripts

```bash
npm run wdk:service:dev          # Start WDK service (dev mode)
npm run wdk:service:build        # Build WDK service
npm run wdk:service:start        # Start WDK service (production)
npm run wdk:service:install      # Install WDK dependencies
npm run wdk:full-dev             # Run both Next.js + WDK together
```

---

## Architecture

```
┌─────────────────────────────────────────┐
│  Dashboard (Next.js React)              │
│  http://localhost:3000                  │
└────────────┬────────────────────────────┘
             │ HTTP API calls
             │ (WDKServiceClient)
             ▼
┌─────────────────────────────────────────┐
│  WDK Service (Node.js + Express)        │
│  http://localhost:3001                  │
│  Real blockchain operations             │
└────────────┬────────────────────────────┘
             │ Real blockchain calls
             │ (Tether WDK libraries)
             ▼
┌─────────────────────────────────────────┐
│  Blockchain Networks                    │
│  Ethereum, Plasma, Stable, Arbitrum... │
└─────────────────────────────────────────┘
```

---

## Key Features

### 1. Self-Custodial Wallets
- Your seed phrase stays **local only**
- Never sent to servers
- Multi-chain support (20+ blockchains)

### 2. Real Token Swaps
- **DEX**: Velora aggregator with best prices
- **Slippage**: Configurable (default 1%)
- **Fees**: Transparent fee display

### 3. Cross-Chain Bridges
- **Protocol**: USDT0 via LayerZero
- **Chains**: Plasma, Stable, Ethereum, etc.
- **Time**: 2-5 minutes

### 4. Lending Protocol
- **Protocol**: Aave V3
- **Operations**: Deposit, borrow, withdraw, repay
- **Collateral**: Real-time health factors

---

## Testing First Swap

### 1. Get  Test USDT

**On Plasma** (preferred - free, instant):
- Faucet: https://faucet.plasma.to
- Request: 10 USDT0

**On Ethereum** (if needed):
- Faucet: https://faucet.alchemy.com

### 2. Check Balance

```bash
curl http://localhost:3001/balance
```

### 3. Execute Swap via Dashboard

1. Click "Test Swap" button
2. Select: Swap 1 USDT → XAUT
3. Confirm transaction
4. See real tx hash on blockchain explorer

### 4. Verify on Explorer

- **Plasma**: https://explorer.plasma.to
- **Stable**: https://explorer.stable.xyz
- **Ethereum**: https://etherscan.io

---

## Switching Modes

### DEMO Mode (Simulated)

```bash
# Just run Next.js, no WDK service
npm run dev

# No seed phrase needed
# Swaps are simulated (fake tx hashes)
# Perfect for UI testing
```

### PRODUCTION Mode (Real Blockchain)

```bash
# Start both services
npm run wdk:service:dev  # Terminal 1
npm run dev              # Terminal 2

# Or together:
npm run wdk:full-dev

# Requires:
# - SEED_PHRASE in .env.local
# - WDK service running
# - Real blockchain transactions
```

---

## Troubleshooting

### WDK Service Won't Start

```bash
# Check if port 3001 is in use
netstat -an | findstr 3001

# Kill process on port
taskkill /PID <PID> /F

# Try different port
set WDK_SERVICE_PORT=3002
npm run wdk:service:dev
```

### "Cannot find seed phrase"

```bash
# Verify .env.local exists and has SEED_PHRASE
cat .env.local | findstr SEED_PHRASE

# Or set environment variable manually
set SEED_PHRASE=word1 word2 ... word12
npm run wdk:service:dev
```

### Swap fails with "Insufficient balance"

```bash
# Check wallet balance
curl http://localhost:3001/balance

# Bridge more funds if needed
# Or get more from faucet
```

### "WDK service unreachable"

```bash
# Check if service is running
curl http://localhost:3001/health

# If not running, start it:
npm run wdk:service:dev
```

---

## Security Checklist

- [ ] Seed phrase stored in `.env.local` (not .env!)
- [ ] `.env.local` is in `.gitignore`
- [ ] Testing with small amounts ($1-10) first
- [ ] WDK service running on private network only
- [ ] No seed phrases in code or logs
- [ ] Call `/cleanup` endpoint before shutdown

---

## Next Steps

1. **Explore Dashboard**: Test persona selection and market data
2. **Try Small Swap**: Execute $1-5 swap to see real blockchain
3. **Monitor Transaction**: View on blockchain explorer
4. **Review Cost**: See actual gas fees paid
5. **Scale Up**: Increase amounts once comfortable

---

## Cost Estimates

| Operation | Plasma/Stable | Ethereum | Arbitrum |
|-----------|---------------|----------|----------|
| Swap | ~$0.001 | ~$10-50 | ~$0.10-0.50 |
| Bridge | ~$0.001 | ~$3-10 | ~$0.50-2 |


**Recommendation**: Use **Plasma or Stable** for development (near-zero fees)

---

## Supported Blockchains

### Recommended (USDT0 optimized)
- **Plasma**: Zero fees, instant finality
- **Stable**: Zero fees, instant finality

### Popular EVM Chains
- Ethereum, Arbitrum, Optimism, Base, Polygon, Avalanche, Fantom

### Other Chains
- Bitcoin, Solana, TON, Tron, Spark (via WDK multi-chain)

---

## References

| Resource | Link |
|----------|------|
| **Full WDK Guide** | [wdk-service/README.md](../wdk-service/README.md) |
| **Tether WDK Docs** | https://docs.wdk.tether.io/ |
| **WDK GitHub** | https://github.com/tetherto/wdk-core |
| **Agent Skills** | https://docs.wdk.tether.io/ai/agent-skills |

---

## Support

**Questions?**
- 💬 Discord: https://discord.gg/tetherdev
- 🐛 GitHub: https://github.com/tetherto/wdk-core
- 📧 Email: wallet-info@tether.io

---

**Happy trading! 🚀**

*Last updated: March 22, 2026*
*Version: 2.0.0 - Real WDK Integration*
