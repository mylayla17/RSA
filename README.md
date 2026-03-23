
# Sovereign Reserve Agent (SRA)

**Autonomous DeFi Agent for Real Blockchain Liquidity Rebalancing**

Built for **DoraHacks Galactica 2026** — Track 3: Autonomous DeFi Agent

> A production-ready autonomous agent that intelligently manages liquidity reserves using real Tether WDK blockchain operations, real-time market data, multi-persona decision-making, and transparent reasoning.

---

# ⚡ Quick Start (5 Minutes)

```bash
# Install dependencies
npm install
cd wdk-service && npm install && cd ..

# Setup environment
cp .env.local.example .env.local
# Add your SEED_PHRASE

# Run everything
npm run wdk:full-dev

Open:

http://localhost:3000

Running Services

Dashboard → http://localhost:3000

WDK Service → http://localhost:3001



---

🧠 Overview

Sovereign Reserve Agent is an autonomous AI-powered liquidity management system that dynamically rebalances token reserves using:

Real blockchain execution (no simulation)

AI-driven decision making

Multi-persona risk modeling

Transparent reasoning logs


The system connects directly to Tether WDK, enabling real swaps, bridging, and lending.


---

🚀 Core Capabilities

🔗 Real Blockchain Integration

Velora DEX swaps

USDT0 cross-chain bridging

Aave V3 lending/borrowing


🧠 AI Decision Engine

Multi-persona system:

Ironclad (conservative)

Surfer (balanced)

Hawk (aggressive)



📊 Real-Time Market Intelligence

CoinGecko API pricing

Live reserve analysis

Market imbalance detection


🔐 Self-Custodial Wallets

BIP39 seed phrase → EVM wallet

Private keys never leave local environment


📜 Transparent Reasoning

Every decision logged with:

Confidence score

Market context

Reasoning hash




---

🏗️ Architecture

User (Dashboard)
    ↓
Next.js API (/api/agent)
    ↓
OmniBrain (Decision Engine)
    ├─ OpenClawEngine (LLM)
    ├─ Strategy Engine
    ├─ PriceOracle
    ├─ ProofOfReasoning
    └─ WDKVault
         ↓
WDKServiceClient (HTTP)
         ↓
WDK Service (Node.js)
         ↓
Tether WDK Protocols
         ↓
Real Blockchain


---

🔄 Data Flow

1. User selects persona


2. Market data fetched (PriceOracle)


3. AI reasoning executed


4. Decision generated


5. Execution routed via WDK


6. Transaction sent to blockchain


7. Result logged + returned


8. Dashboard updated




---

🧩 Tech Stack

Layer	Technology

Frontend	React 18 + Next.js 14
Backend	Node.js + Express
Language	TypeScript
Styling	Tailwind CSS
Animation	Framer Motion
AI	z-ai-web-dev-sdk
Market Data	CoinGecko API
Blockchain	Tether WDK



---

🔌 WDK Integration

Modules Used

Module	Purpose

WDK Core	Wallet orchestration
EVM Wallet	Seed → wallet
Velora DEX ⭐	Token swaps
USDT0 Bridge	Cross-chain
Aave V3	Lending


All operations are real transactions on live blockchain networks.


---

📁 Project Structure

Main App

src/
 ├── app/                # Next.js routes
 ├── core/               # AI & logic
 ├── execution/          # WDK routing
 ├── oracle/             # Market data
 ├── logs/               # Reasoning audit
 └── ui/                 # Dashboard

WDK Service

wdk-service/
 ├── src/index.ts        # HTTP API
 └── src/wdk.ts          # WDK integration


---

⚙️ Installation & Setup

Requirements

Node.js 18+

npm 9+

BIP39 seed phrase

Wallet funds (for gas)


Install

npm install
cd wdk-service && npm install && cd ..

Run

npm run wdk:full-dev


---

🔐 Configuration

.env.local

SEED_PHRASE=word1 word2 ... word12

ETH_RPC_URL=
ARBITRUM_RPC_URL=

SRA_LLM_ENDPOINT=
SRA_LLM_API_KEY=

WDK_SERVICE_PORT=3001


---

👛 Wallet & Security

Key Principles

Self-custodial (you own keys)

No key transmission

Local signing only

Memory wiped on shutdown


Best Practices

✅ Use .env.local
✅ Test with small funds
❌ Never share seed phrase
❌ Never commit secrets


---

🎭 Persona System

Persona	Risk	Strategy

Ironclad	Low	Capital preservation
Surfer	Medium	Rebalancing
Hawk	High	Arbitrage



---

📊 Features

Market Data

Real-time pricing

60s cache


Proof of Reasoning

Each decision includes:

Hash

Timestamp

Confidence

Explanation


Dashboard

Portfolio tracking

Execution logs

Persona selector

Live terminal



---

🔌 API Reference

POST /api/agent

{
  "persona": "Surfer",
  "action": "evaluate_and_execute"
}


---

💸 Supported Operations

Swap

Velora DEX (aggregated liquidity)


Bridge

USDT0 cross-chain


Lending

Aave V3



---

⛽ Transaction Costs (Estimates)

Network	Cost

Ethereum	$10–50
Arbitrum	$0.1–0.5
Optimism	$0.5–2
Polygon	$0.01–0.1
Plasma	~$0



---

🧪 Testing

npm run type-check
npm run build
npm run dev


---

🖥️ Usage Guide

1. Open dashboard


2. Select persona


3. Trigger execution


4. Monitor transaction + balances




---

⚠️ Troubleshooting

Missing dependencies

cd wdk-service && npm install

Port conflict

set WDK_SERVICE_PORT=3002

Service check

curl http://localhost:3001/health


---

📚 References

https://docs.wdk.tether.io/

https://github.com/tetherto/wdk-core





---

📄 License

MIT License


---

🙌 Credits

Tether WDK

CoinGecko

z-ai-web-dev-sdk

Framer Motion

Tailwind CSS

DoraHacks



---

🚀 Final Note

Sovereign Reserve Agent is not a simulation.

It is a real autonomous DeFi agent executing on live blockchain infrastructure with transparent reasoning and self-custodial security.

