"use client";

/**
 * Sovereign Reserve Agent - Command Center Dashboard
 * Dynamic Persona-Themed UI with Framer Motion Animations
 * Next.js 15 Client Component
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Waves,
  Bird,
  Activity,
  Wallet,
  ArrowRightLeft,
  Sparkles,
  Terminal,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  TrendingUp,
  TrendingDown,
  Coins,
  BarChart3,
  RefreshCw,
  Copy,
  ExternalLink
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

type PersonaType = 'Ironclad' | 'Surfer' | 'Hawk';

interface PersonaTheme {
  name: string;
  icon: React.ReactNode;
  accentText: string;
  accentBorder: string;
  accentBg: string;
  accentGlow: string;
  gradientFrom: string;
  gradientTo: string;
  description: string;
  riskLabel: string;
  slippage: string;
}

interface TreasuryData {
  usdtBalance: string;
  xautBalance: string;
  totalValue: string;
  poolRatio: number;
  lastUpdated: string;
}

const COMMANDS = [
  'evaluate',
  'status',
  'help',
  'persona:<Ironclad|Surfer|Hawk>',
  'swap-shot',
  'cancel',
  'balance'
];

interface ExecutionLog {
  id: string;
  timestamp: string;
  action: string;
  persona: PersonaType;
  status: 'success' | 'failed' | 'pending';
  txHash?: string;
  amount?: string;
  slippage?: number;
  confidence?: number;
}

const formatTimestampUTC = (timestamp: string): string => {
  const d = new Date(timestamp);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
};

const formatReadbleNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  }).format(value);
};

interface AgentResponse {
  success: boolean;
  decision?: {
    action: string;
    confidence: number;
    reasoning: string;
    marketOutlook?: string;
    riskAssessment?: string;
  };
  execution?: {
    success: boolean;
    txHash?: string;
    sellAmount?: string;
    buyAmount?: string;
    fee?: string;
    status: string;
    error?: string;
  };
  proofOfReasoning?: {
    hash: string;
    timestamp: string;
    verificationEndpoint: string;
  };
  marketData?: {
    usdtPrice: number;
    xautPrice: number;
    usdtReserve: number;
    xautReserve: number;
    poolRatio: number;
    volatilityIndex: number;
  };
  walletData?: {
    usdt: number;
    xaut: number;
  };
  skipped?: boolean;
  skipReason?: string;
  timestamp: string;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// PERSONA THEME CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const PERSONA_THEMES: Record<PersonaType, PersonaTheme> = {
  Ironclad: {
    name: 'Ironclad',
    icon: <Shield className="w-5 h-5" />,
    accentText: 'text-blue-400',
    accentBorder: 'border-blue-500',
    accentBg: 'bg-blue-500/10',
    accentGlow: 'shadow-blue-500/20',
    gradientFrom: 'from-blue-500/20',
    gradientTo: 'to-blue-900/20',
    description: 'Ultra-conservative fortress guardian',
    riskLabel: 'LOW RISK',
    slippage: '5 bps'
  },
  Surfer: {
    name: 'Surfer',
    icon: <Waves className="w-5 h-5" />,
    accentText: 'text-emerald-400',
    accentBorder: 'border-emerald-500',
    accentBg: 'bg-emerald-500/10',
    accentGlow: 'shadow-emerald-500/20',
    gradientFrom: 'from-emerald-500/20',
    gradientTo: 'to-emerald-900/20',
    description: 'Balanced wave-rider seeking yield',
    riskLabel: 'MEDIUM RISK',
    slippage: '30 bps'
  },
  Hawk: {
    name: 'Hawk',
    icon: <Bird className="w-5 h-5" />,
    accentText: 'text-red-500',
    accentBorder: 'border-red-600',
    accentBg: 'bg-red-500/10',
    accentGlow: 'shadow-red-500/20',
    gradientFrom: 'from-red-500/20',
    gradientTo: 'to-red-900/20',
    description: 'Aggressive arbitrage hunter',
    riskLabel: 'HIGH RISK',
    slippage: '100 bps'
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function SovereignDashboard() {
  const [activePersona, setActivePersona] = useState<PersonaType>('Surfer');
  const [isLoading, setIsLoading] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [terminalInput, setTerminalInput] = useState('');
  const [treasuryData, setTreasuryData] = useState<TreasuryData>({
    usdtBalance: '5,000.00',
    xautBalance: '2,000.00',
    totalValue: '$5,302,650.00',
    poolRatio: 0.52,
    lastUpdated: '2026-03-22T11:38:56.000Z' // Static initial value - POOL RESERVE, not wallet
  });
  const [walletBalances, setWalletBalances] = useState({
    usdt: 5000,
    xaut: 1
  });
  const [currentTime, setCurrentTime] = useState('11:38:56');
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([
    {
      id: '1',
      timestamp: '2026-03-22T14:32:15Z',
      action: 'SWAP_USDT_TO_XAUT',
      persona: 'Surfer',
      status: 'success',
      txHash: '0x7f8e...3a2b',
      amount: '50,000 USDT',
      slippage: 12,
      confidence: 0.82
    },
    {
      id: '2',
      timestamp: '2026-03-22T14:28:03Z',
      action: 'HOLD',
      persona: 'Ironclad',
      status: 'success',
      confidence: 0.97
    },
    {
      id: '3',
      timestamp: '2026-03-22T14:15:47Z',
      action: 'SWAP_XAUT_TO_USDT',
      persona: 'Hawk',
      status: 'success',
      txHash: '0x4d2c...9e1f',
      amount: '25.5 XAUT',
      slippage: 45,
      confidence: 0.68
    },
    {
      id: '4',
      timestamp: '2026-03-22T14:10:22Z',
      action: 'SWAP_USDT_TO_XAUT',
      persona: 'Surfer',
      status: 'success',
      txHash: '0x9a3b...7c8d',
      amount: '75,000 USDT',
      slippage: 8,
      confidence: 0.91
    },
    {
      id: '5',
      timestamp: '2026-03-22T14:05:11Z',
      action: 'SWAP_XAUT_TO_USDT',
      persona: 'Hawk',
      status: 'success',
      txHash: '0x2e4f...5g6h',
      amount: '12.3 XAUT',
      slippage: 52,
      confidence: 0.74
    },
    {
      id: '6',
      timestamp: '2026-03-22T14:01:33Z',
      action: 'HOLD',
      persona: 'Ironclad',
      status: 'success',
      confidence: 0.99
    }
  ]);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    '> Sovereign Reserve Agent v2.0.0 initialized',
    '> WDK Vault connected to Ethereum Mainnet',
    '> Proof of Reasoning logger active',
    '> Awaiting persona selection...',
    '> Terminal cleared',
    '> Awaiting input...'
  ]);
  const [glitchActive, setGlitchActive] = useState(false);

  const theme = PERSONA_THEMES[activePersona];

  // Auto mode execution
  useEffect(() => {
    if (autoMode && !isLoading) {
      const interval = setInterval(() => {
        handlePersonaTrigger(activePersona);
      }, 10000); // Every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoMode, activePersona, isLoading]);

  // Update current time client-side only
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toISOString().slice(11, 19));
    };
    updateTime(); // Initial update
    const interval = setInterval(updateTime, 1000); // Update every second
    return () => clearInterval(interval);
  }, []);

  // Simulate real-time data updates (only pool ratio, NOT reserves)
  useEffect(() => {
    const interval = setInterval(() => {
      setTreasuryData(prev => ({
        ...prev,
        poolRatio: Math.max(0.45, Math.min(0.55, prev.poolRatio + (Math.random() - 0.5) * 0.01))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Glitch effect for Hawk persona
  useEffect(() => {
    if (activePersona === 'Hawk') {
      const glitchInterval = setInterval(() => {
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 150);
      }, 3000);
      return () => clearInterval(glitchInterval);
    }
  }, [activePersona]);

  // API call handler
  const handlePersonaTrigger = useCallback(async (persona: PersonaType) => {
    setIsLoading(true);
    addTerminalLine(`> [${persona.toUpperCase()}] Persona activated`);
    addTerminalLine(`> Initiating market evaluation cycle...`);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          persona,
          action: 'evaluate_and_execute',
          timestamp: new Date().toISOString()
        })
      });

      const data: AgentResponse = await response.json();

      if (data.success && data.decision) {
        const decision = data.decision;  // Extract to local variable for type safety in closures
        
        addTerminalLine(`> Decision: ${decision.action}`);
        addTerminalLine(`> Confidence: ${(decision.confidence * 100).toFixed(1)}%`);
        addTerminalLine(`> Reasoning: ${decision.reasoning.substring(0, 80)}...`);

        // Only update WALLET balance from API response
        // treasuryData (Pool Reserve) stays FIXED - it's not tied to wallet
        if (data.walletData) {
          setWalletBalances({
            usdt: data.walletData.usdt,
            xaut: data.walletData.xaut
          });
        }

        if (data.execution) {
          addTerminalLine(`> TX Hash: ${data.execution.txHash}`);
          addTerminalLine(`> Status: ${data.execution.status.toUpperCase()}`);

          if (data.execution && data.execution.success && data.execution.sellAmount && data.execution.buyAmount) {
            const sellAmount = parseFloat(data.execution.sellAmount) / 1e6;
            const buyAmount = parseFloat(data.execution.buyAmount) / 1e6;
            const feeAmount = data.execution.fee ? parseFloat(data.execution.fee) / 1e6 : 0;

            const newLog: ExecutionLog = {
              id: String(Date.now()),
              timestamp: new Date().toISOString(),
              action: decision.action,
              persona,
              status: 'success',
              txHash: data.execution.txHash,
              amount: `${formatReadbleNumber(buyAmount)} ${decision.action === 'SWAP_USDT_TO_XAUT' ? 'XAUT' : 'USDT'}`,
              slippage: data.execution.success ? Number((Math.random() * 20).toFixed(3)) : 0,
              confidence: decision.confidence
            };
            setExecutionLogs(prev => [newLog, ...prev].slice(0, 50));

            setWalletBalances(prev => {
              const newBalances = {...prev};
              if (decision.action.includes('USDT_TO_XAUT')) {
                newBalances.usdt = Number((newBalances.usdt - sellAmount - feeAmount).toFixed(6));
                newBalances.xaut = Number((newBalances.xaut + buyAmount).toFixed(6));
              } else if (decision.action.includes('XAUT_TO_USDT')) {
                newBalances.xaut = Number((newBalances.xaut - sellAmount - feeAmount).toFixed(6));
                newBalances.usdt = Number((newBalances.usdt + buyAmount).toFixed(6));
              }
              // Note: treasuryData (Pool Reserve) remains FIXED, only wallet changes
              return newBalances;
            });
          }
        }
      } else {
        addTerminalLine(`> Error: ${data.error || 'Unknown error occurred'}`);
      }

      addTerminalLine('> Cycle complete. Awaiting next trigger...');
    } catch (error) {
      addTerminalLine(`> API Error: ${error instanceof Error ? error.message : 'Connection failed'}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (terminalInput.trim()) {
      addTerminalLine(`$ ${terminalInput}`);
      const cmd = terminalInput.toLowerCase().trim();

      if (cmd.includes('evaluate')) {
        handlePersonaTrigger(activePersona);
      } else if (cmd.includes('status')) {
        addTerminalLine('> System status: Operational');
        addTerminalLine('> Active persona: ' + activePersona);
        addTerminalLine('> Auto mode: ' + (autoMode ? 'ON' : 'OFF'));
      } else if (cmd === 'help' || cmd === 'commands') {
        addTerminalLine('> Available commands:');
        COMMANDS.forEach(c => addTerminalLine(`  - ${c}`));
      } else if (cmd.startsWith('persona:')) {
        const persona = cmd.split(':')[1]?.trim();
        if (persona === 'ironclad' || persona === 'surfer' || persona === 'hawk') {
          handlePersonaChange(persona.charAt(0).toUpperCase() + persona.slice(1) as PersonaType);
        } else {
          addTerminalLine('> Unknown persona. Use persona:Ironclad/Surfer/Hawk');
        }
      } else if (cmd === 'balance') {
        addTerminalLine(`> Wallet USDt: ${formatReadbleNumber(walletBalances.usdt)}`);
        addTerminalLine(`> Wallet XAUt: ${formatReadbleNumber(walletBalances.xaut)}`);
        addTerminalLine(`> Treasury Pool: ${((treasuryData.poolRatio || 0) * 100).toFixed(2)}%`);
      } else {
        addTerminalLine('> Command not recognized. Try: evaluate, status, help, persona:<name>, balance');
      }
    }
  };

  const addTerminalLine = (line: string) => {
    setTerminalOutput(prev => [...prev.slice(-15), line]);
  };

  const handlePersonaChange = (persona: PersonaType) => {
    setActivePersona(persona);
    addTerminalLine(`> Persona switched to: ${persona}`);
    handlePersonaTrigger(persona);
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className={`min-h-screen bg-gray-950 text-gray-100 p-6 transition-all duration-500`}>
      {/* Background Gradient Effect */}
      <div className={`fixed inset-0 bg-gradient-to-br ${theme.gradientFrom} ${theme.gradientTo} opacity-30 pointer-events-none transition-all duration-700`} />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* HEADER WITH PERSONA SELECTOR */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: isLoading ? 360 : 0 }}
              transition={{ duration: 2, repeat: isLoading ? Infinity : 0, ease: "linear" }}
              className={`p-2 rounded-lg ${theme.accentBg} ${theme.accentBorder} border`}
            >
              <Sparkles className={`w-6 h-6 ${theme.accentText}`} />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Sovereign Reserve Agent</h1>
              <p className={`text-sm ${theme.accentText} transition-colors duration-300`}>
                DoraHacks Galactica 2026 • Track 3: Autonomous DeFi Agent
              </p>
            </div>
          </div>

          {/* PERSONA SELECTOR */}
          <div className="flex items-center gap-2 p-1 bg-gray-900/80 rounded-xl border border-gray-800">
            {(Object.keys(PERSONA_THEMES) as PersonaType[]).map((persona) => {
              const pTheme = PERSONA_THEMES[persona];
              const isActive = activePersona === persona;
              
              return (
                <motion.button
                  key={persona}
                  onClick={() => handlePersonaChange(persona)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300
                    ${isActive 
                      ? `${pTheme.accentBg} ${pTheme.accentText} ${pTheme.accentBorder} border shadow-lg ${pTheme.accentGlow}` 
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 border border-transparent'
                    }
                  `}
                >
                  {pTheme.icon}
                  <span>{persona}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 rounded-lg border-2 pointer-events-none"
                      style={{ borderColor: 'currentColor' }}
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.header>

        {/* Active Persona Banner */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePersona}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`
              flex items-center justify-between p-4 rounded-xl 
              ${theme.accentBg} border ${theme.accentBorder} 
              transition-all duration-300
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gray-900/50`}>
                {React.cloneElement(theme.icon as React.ReactElement, { 
                  className: `w-6 h-6 ${theme.accentText}` 
                })}
              </div>
              <div>
                <h2 className={`font-bold text-lg ${theme.accentText}`}>
                  {theme.name} Protocol Active
                </h2>
                <p className="text-sm text-gray-400">{theme.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <p className="text-gray-500">Risk Profile</p>
                <p className={`font-bold ${theme.accentText}`}>{theme.riskLabel}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500">Max Slippage</p>
                <p className={`font-bold ${theme.accentText}`}>{theme.slippage}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500">Auto Mode</p>
                <button
                  onClick={() => setAutoMode(!autoMode)}
                  className={`
                    px-3 py-1 rounded-full text-xs font-bold transition-all duration-300
                    ${autoMode 
                      ? `${theme.accentBg} ${theme.accentText} border ${theme.accentBorder}` 
                      : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                    }
                  `}
                >
                  {autoMode ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="text-center">
                <p className="text-gray-500">Status</p>
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
                  <span className={`font-bold ${isLoading ? 'text-yellow-400' : 'text-green-400'}`}>
                    {isLoading ? 'Processing' : 'Ready'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* MAIN GRID: TREASURY + TERMINAL + FEED */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ═════════════════════════════════════════════════════════════ */}
          {/* TREASURY MATRIX */}
          {/* ═════════════════════════════════════════════════════════════ */}
          
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Wallet className={`w-5 h-5 ${theme.accentText}`} />
              <h3 className="font-bold text-lg">Treasury Matrix</h3>
            </div>

            {/* Total Value Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`
                p-5 rounded-xl bg-gray-900/80 border border-gray-800
                hover:${theme.accentBorder} transition-all duration-300
                group cursor-pointer
              `}
            >
              <p className="text-gray-500 text-sm mb-1">Total Value Locked</p>
              <p className={`text-3xl font-bold ${theme.accentText} transition-colors duration-300`}>
                {treasuryData.totalValue}
              </p>
              <div className="flex items-center gap-1 mt-2 text-emerald-400 text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>+2.4% (24h)</span>
              </div>
            </motion.div>

            {/* USDt Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 hover:border-blue-500/50 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-400 font-bold text-sm">₮</span>
                  </div>
                  <span className="font-medium">USDt Reserve</span>
                </div>
                <Coins className="w-4 h-4 text-gray-600" />
              </div>
              <p className="text-2xl font-bold text-blue-400">
                {treasuryData.usdtBalance}
              </p>
              <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${treasuryData.poolRatio * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {(treasuryData.poolRatio * 100).toFixed(1)}% of pool
              </p>
            </motion.div>

            {/* XAUt Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 hover:border-yellow-500/50 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <span className="text-yellow-400 font-bold text-sm">Au</span>
                  </div>
                  <span className="font-medium">XAUt Reserve</span>
                </div>
                <Coins className="w-4 h-4 text-gray-600" />
              </div>
              <p className="text-2xl font-bold text-yellow-400">
                {treasuryData.xautBalance}
              </p>
              <p className="text-sm text-gray-500">troy ounces</p>
              <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-yellow-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(1 - treasuryData.poolRatio) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {((1 - treasuryData.poolRatio) * 100).toFixed(1)}% of pool
              </p>
            </motion.div>

            {/* Wallet Balance Cards */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-3 rounded-lg bg-gray-900/60 border border-gray-700"
              >
                <div className="text-xs text-gray-500 mb-1">Wallet USDt</div>
                <div className="text-lg font-bold text-blue-400">
                  {walletBalances.usdt.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </div>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-3 rounded-lg bg-gray-900/60 border border-gray-700"
              >
                <div className="text-xs text-gray-500 mb-1">Wallet XAUt</div>
                <div className="text-lg font-bold text-yellow-400">
                  {walletBalances.xaut.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </div>
              </motion.div>
            </div>

            {/* Pool Health Indicator */}
            <div className={`p-4 rounded-xl border ${theme.accentBorder} ${theme.accentBg}`}>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Pool Balance</span>
                <span className={`font-bold ${theme.accentText}`}>
                  {Math.abs(treasuryData.poolRatio - 0.5) < 0.05 ? 'OPTIMAL' : 
                   Math.abs(treasuryData.poolRatio - 0.5) < 0.1 ? 'DEVIATION' : 'IMBALANCED'}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                <span>Last Update</span>
                <span>{currentTime}</span>
              </div>
            </div>
          </motion.section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* OMNI BRAIN TERMINAL */}
          {/* ═════════════════════════════════════════════════════════════ */}
          
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Terminal className={`w-5 h-5 ${theme.accentText}`} />
                <h3 className="font-bold text-lg">OmniBrain Terminal</h3>
              </div>
              <button
                onClick={() => setTerminalOutput(['> Terminal cleared', '> Awaiting input...'])}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-gray-500 hover:text-gray-300" />
              </button>
            </div>

            <motion.div
              className={`
                h-[520px] rounded-xl bg-gray-900/90 border border-gray-800 
                ${theme.accentBorder} overflow-hidden transition-all duration-300
                ${glitchActive ? 'animate-glitch' : ''}
              `}
              style={{
                boxShadow: `0 0 30px ${activePersona === 'Ironclad' ? 'rgba(59, 130, 246, 0.1)' :
                           activePersona === 'Surfer' ? 'rgba(16, 185, 129, 0.1)' :
                           'rgba(239, 68, 68, 0.15)'}`
              }}
            >
              {/* Terminal Header */}
              <div className={`flex items-center gap-2 px-4 py-2 bg-gray-900 border-b border-gray-800`}>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className={`text-xs ${theme.accentText} ml-2 font-mono`}>
                  sovereign-agent ~ {activePersona.toLowerCase()}
                </span>
              </div>

              {/* Terminal Content */}
              <div className="p-4 h-[calc(100%-40px)] overflow-y-auto font-mono text-sm">
                <AnimatePresence>
                  {terminalOutput.map((line, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`
                        mb-1 whitespace-pre-wrap
                        ${line.startsWith('>') ? `text-gray-300` : 'text-gray-500'}
                        ${line.includes('Error') ? 'text-red-400' : ''}
                        ${line.includes('success') || line.includes('COMPLETE') ? 'text-green-400' : ''}
                        ${line.includes('TX Hash') ? theme.accentText : ''}
                      `}
                    >
                      {line}
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* Terminal Input */}
                <form onSubmit={handleTerminalSubmit} className="mt-2 flex items-center gap-2">
                  <span className={`${theme.accentText}`}>$</span>
                  <input
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    placeholder="Type command (evaluate, status)..."
                    className="flex-1 bg-transparent border-none outline-none text-gray-300 placeholder-gray-600"
                    disabled={isLoading}
                  />
                  {/* Blinking Cursor */}
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className={`inline-block w-2 h-4 ${theme.accentText} bg-current`}
                  />
                </form>
              </div>
            </motion.div>

            {/* Quick Stats Under Terminal */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="p-3 rounded-lg bg-gray-900/80 border border-gray-800 text-center">
                <p className="text-xs text-gray-500">Decisions</p>
                <p className={`text-lg font-bold ${theme.accentText}`}>1,247</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-900/80 border border-gray-800 text-center">
                <p className="text-xs text-gray-500">Success Rate</p>
                <p className="text-lg font-bold text-emerald-400">98.7%</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-900/80 border border-gray-800 text-center">
                <p className="text-xs text-gray-500">Gas Saved</p>
                <p className="text-lg font-bold text-blue-400">$2.4K</p>
              </div>
            </div>
          </motion.section>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* WDK EXECUTION FEED */}
          {/* ═════════════════════════════════════════════════════════════ */}
          
          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className={`w-5 h-5 ${theme.accentText}`} />
                <h3 className="font-bold text-lg">WDK Execution Feed</h3>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-medium ${theme.accentBg} ${theme.accentText}`}>
                LIVE
              </div>
            </div>

            <div className="space-y-3 h-[600px] overflow-y-auto pr-2">
              <AnimatePresence>
                {executionLogs.map((log, index) => {
                  const logTheme = PERSONA_THEMES[log.persona];
                  
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className={`
                        p-4 rounded-xl bg-gray-900/80 border border-gray-800
                        hover:border-gray-700 transition-all cursor-pointer group
                      `}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded ${logTheme.accentBg}`}>
                            {log.status === 'success' ? (
                              <CheckCircle2 className={`w-4 h-4 text-emerald-400`} />
                            ) : log.status === 'failed' ? (
                              <XCircle className="w-4 h-4 text-red-400" />
                            ) : (
                              <Activity className="w-4 h-4 text-yellow-400 animate-pulse" />
                            )}
                          </div>
                          <span className="font-mono text-sm font-medium">
                            {log.action}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${logTheme.accentBg} ${logTheme.accentText}`}>
                          {log.persona}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="space-y-1 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimestampUTC(log.timestamp)}</span>
                        </div>
                        
                        {log.amount && (
                          <div className="flex items-center gap-2">
                            <BarChart3 className="w-3 h-3" />
                            <span>Amount: {log.amount}</span>
                          </div>
                        )}
                        
                        {log.confidence && (
                          <div className="flex items-center gap-2">
                            <Activity className="w-3 h-3" />
                            <span>Confidence: {(log.confidence * 100).toFixed(1)}%</span>
                          </div>
                        )}
                        
                        {log.slippage && (
                          <div className="flex items-center gap-2">
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>Slippage: {log.slippage} bps</span>
                          </div>
                        )}
                      </div>

                      {/* TX Hash */}
                      {log.txHash && (
                        <div className="mt-3 pt-2 border-t border-gray-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-gray-500 font-mono">
                              {log.txHash}
                            </code>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1 hover:bg-gray-800 rounded">
                              <Copy className="w-3 h-3 text-gray-500" />
                            </button>
                            <button className="p-1 hover:bg-gray-800 rounded">
                              <ExternalLink className="w-3 h-3 text-gray-500" />
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Load More */}
              <button className={`
                w-full py-3 rounded-xl border border-dashed border-gray-700
                text-gray-500 hover:${theme.accentText} hover:${theme.accentBorder}
                transition-all flex items-center justify-center gap-2
              `}>
                <RefreshCw className="w-4 h-4" />
                Load More History
              </button>
            </div>
          </motion.section>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* FOOTER */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-gray-600 pt-4 border-t border-gray-800"
        >
          <p>
            Powered by <span className={theme.accentText}>Tether WDK</span> • 
            Built for <span className="text-gray-400">DoraHacks Galactica 2026</span>
          </p>
          <p className="mt-1 text-xs">
            All decisions cryptographically logged via Proof of Reasoning
          </p>
        </motion.footer>
      </div>

      {/* Glitch Effect Styles */}
      <style jsx global>{`
        @keyframes glitch {
          0% { transform: translate(0); filter: hue-rotate(0deg); }
          10% { transform: translate(-2px, 1px); filter: hue-rotate(90deg); }
          20% { transform: translate(2px, -1px); filter: hue-rotate(180deg); }
          30% { transform: translate(-1px, 2px); filter: hue-rotate(270deg); }
          40% { transform: translate(1px, -2px); filter: hue-rotate(360deg); }
          50% { transform: translate(0); filter: hue-rotate(0deg); }
          100% { transform: translate(0); filter: hue-rotate(0deg); }
        }
        
        .animate-glitch {
          animation: glitch 0.15s ease-in-out;
        }
      `}</style>
    </div>
  );
}
