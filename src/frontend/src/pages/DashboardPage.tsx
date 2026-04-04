import {
  Activity,
  ArrowLeft,
  Award,
  BarChart2,
  Bell,
  BookOpen,
  Bot,
  Briefcase,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Copy,
  Crown,
  DollarSign,
  FileText,
  Gift,
  Globe,
  HelpCircle,
  Home,
  LayoutGrid,
  LineChart as LineChartIcon,
  Loader2,
  MoreVertical,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import type { AppPage } from "../App";
import {
  type AppNotification,
  KycStatus,
  type TradeOrder,
  type TradingAccount,
  type UserProfile,
} from "../backend.d";
import AIAssistantButton from "../components/AIAssistantButton";
import FloatingChatButton from "../components/FloatingChatButton";
import MTChart from "../components/MTChart";
import PromoCarousel from "../components/PromoCarousel";
import { useActor } from "../hooks/useActor";
import { useLivePrices } from "../hooks/useLivePrices";

// ─── Types ──────────────────────────────────────────────────────────────────
type BottomTab = "home" | "trade" | "positions" | "funds" | "hub";
type PositionsSubTab = "open" | "pending" | "closed" | "history";
type FundsSubTab = "deposit" | "withdraw" | "history" | "transfer" | "wallet";

interface InstrumentData {
  name: string;
  symbol: string;
  sellPrice: string;
  buyPrice: string;
  change: string;
  changeUp: boolean;
  orders?: number;
}

interface SignalData {
  side: "Sell" | "Buy";
  instrument: string;
  timeframe: string;
  price: string;
  tp: string;
  sl: string;
}

interface TrendData {
  name: string;
  price: string;
  change: string;
  data: number[];
}

// ─── Static Data ────────────────────────────────────────────────────────────
const INSTRUMENTS_HOME: InstrumentData[] = [
  {
    name: "Ethereum",
    symbol: "ETH/USD",
    sellPrice: "3,412.50",
    buyPrice: "3,415.80",
    change: "+2.10%",
    changeUp: true,
    orders: 93,
  },
  {
    name: "Bitcoin",
    symbol: "BTC/USD",
    sellPrice: "71,218.00",
    buyPrice: "71,245.00",
    change: "+1.87%",
    changeUp: true,
    orders: 87,
  },
  {
    name: "EUR/USD",
    symbol: "EUR/USD",
    sellPrice: "1.08441",
    buyPrice: "1.08458",
    change: "+0.32%",
    changeUp: true,
    orders: 76,
  },
  {
    name: "Ripple",
    symbol: "XRP/USD",
    sellPrice: "0.5218",
    buyPrice: "0.5224",
    change: "+3.45%",
    changeUp: true,
    orders: 64,
  },
  {
    name: "Avalanche",
    symbol: "AVAX/USD",
    sellPrice: "34.18",
    buyPrice: "34.26",
    change: "-0.88%",
    changeUp: false,
    orders: 41,
  },
];

type TradeCategory =
  | "Favourites"
  | "Popular in region"
  | "Fx Majors"
  | "Fx Minors"
  | "Fx Exotics"
  | "Commodities"
  | "Metals"
  | "Indices"
  | "Crypto"
  | "US Stock CFD";

const ALL_CATEGORIES: TradeCategory[] = [
  "Favourites",
  "Popular in region",
  "Fx Majors",
  "Fx Minors",
  "Fx Exotics",
  "Commodities",
  "Metals",
  "Indices",
  "Crypto",
  "US Stock CFD",
];

const FX_MAJORS: InstrumentData[] = [
  {
    name: "AUD/USD",
    symbol: "AUD/USD",
    sellPrice: "0.65203",
    buyPrice: "0.65220",
    change: "-0.12%",
    changeUp: false,
  },
  {
    name: "EUR/USD",
    symbol: "EUR/USD",
    sellPrice: "1.08413",
    buyPrice: "1.08430",
    change: "+0.32%",
    changeUp: true,
  },
  {
    name: "GBP/USD",
    symbol: "GBP/USD",
    sellPrice: "1.26332",
    buyPrice: "1.26349",
    change: "-0.08%",
    changeUp: false,
  },
  {
    name: "NZD/USD",
    symbol: "NZD/USD",
    sellPrice: "0.58113",
    buyPrice: "0.58130",
    change: "+0.15%",
    changeUp: true,
  },
  {
    name: "USD/CAD",
    symbol: "USD/CAD",
    sellPrice: "1.38903",
    buyPrice: "1.38920",
    change: "+0.07%",
    changeUp: true,
  },
  {
    name: "USD/CHF",
    symbol: "USD/CHF",
    sellPrice: "0.90203",
    buyPrice: "0.90220",
    change: "-0.21%",
    changeUp: false,
  },
  {
    name: "USD/JPY",
    symbol: "USD/JPY",
    sellPrice: "150.243",
    buyPrice: "150.261",
    change: "+0.19%",
    changeUp: true,
  },
];

const FX_MINORS: InstrumentData[] = [
  {
    name: "EUR/GBP",
    symbol: "EUR/GBP",
    sellPrice: "0.85903",
    buyPrice: "0.85920",
    change: "+0.11%",
    changeUp: true,
  },
  {
    name: "EUR/JPY",
    symbol: "EUR/JPY",
    sellPrice: "162.833",
    buyPrice: "162.851",
    change: "+0.28%",
    changeUp: true,
  },
  {
    name: "EUR/CHF",
    symbol: "EUR/CHF",
    sellPrice: "0.97643",
    buyPrice: "0.97660",
    change: "-0.05%",
    changeUp: false,
  },
  {
    name: "GBP/JPY",
    symbol: "GBP/JPY",
    sellPrice: "189.933",
    buyPrice: "189.951",
    change: "-0.14%",
    changeUp: false,
  },
  {
    name: "GBP/CHF",
    symbol: "GBP/CHF",
    sellPrice: "1.13903",
    buyPrice: "1.13921",
    change: "+0.08%",
    changeUp: true,
  },
  {
    name: "AUD/JPY",
    symbol: "AUD/JPY",
    sellPrice: "97.933",
    buyPrice: "97.951",
    change: "-0.22%",
    changeUp: false,
  },
  {
    name: "AUD/NZD",
    symbol: "AUD/NZD",
    sellPrice: "1.12033",
    buyPrice: "1.12051",
    change: "+0.06%",
    changeUp: true,
  },
  {
    name: "NZD/JPY",
    symbol: "NZD/JPY",
    sellPrice: "87.333",
    buyPrice: "87.351",
    change: "+0.17%",
    changeUp: true,
  },
];

const FX_EXOTICS: InstrumentData[] = [
  {
    name: "USD/TRY",
    symbol: "USD/TRY",
    sellPrice: "32.1430",
    buyPrice: "32.1570",
    change: "+0.34%",
    changeUp: true,
  },
  {
    name: "USD/ZAR",
    symbol: "USD/ZAR",
    sellPrice: "18.9323",
    buyPrice: "18.9461",
    change: "-0.41%",
    changeUp: false,
  },
  {
    name: "USD/MXN",
    symbol: "USD/MXN",
    sellPrice: "17.1123",
    buyPrice: "17.1261",
    change: "+0.12%",
    changeUp: true,
  },
  {
    name: "USD/SGD",
    symbol: "USD/SGD",
    sellPrice: "1.34203",
    buyPrice: "1.34221",
    change: "-0.07%",
    changeUp: false,
  },
  {
    name: "EUR/TRY",
    symbol: "EUR/TRY",
    sellPrice: "34.8323",
    buyPrice: "34.8461",
    change: "+0.29%",
    changeUp: true,
  },
  {
    name: "USD/NOK",
    symbol: "USD/NOK",
    sellPrice: "10.5323",
    buyPrice: "10.5461",
    change: "-0.18%",
    changeUp: false,
  },
];

const COMMODITIES: InstrumentData[] = [
  {
    name: "WTI Crude Oil",
    symbol: "WTI Crude",
    sellPrice: "78.43",
    buyPrice: "78.47",
    change: "+0.45%",
    changeUp: true,
  },
  {
    name: "Brent Crude",
    symbol: "Brent Crude",
    sellPrice: "82.32",
    buyPrice: "82.36",
    change: "+0.31%",
    changeUp: true,
  },
];

const METALS: InstrumentData[] = [
  {
    name: "Gold",
    symbol: "XAUUSD",
    sellPrice: "2034.43",
    buyPrice: "2034.57",
    change: "+0.22%",
    changeUp: true,
  },
  {
    name: "Silver",
    symbol: "XAGUSD",
    sellPrice: "22.832",
    buyPrice: "22.848",
    change: "-0.15%",
    changeUp: false,
  },
];

const INDICES: InstrumentData[] = [
  {
    name: "US 500",
    symbol: "US 500",
    sellPrice: "4892.43",
    buyPrice: "4892.65",
    change: "+0.38%",
    changeUp: true,
  },
  {
    name: "US 30",
    symbol: "US 30",
    sellPrice: "38244.3",
    buyPrice: "38246.0",
    change: "+0.21%",
    changeUp: true,
  },
  {
    name: "DE 40",
    symbol: "DE 40",
    sellPrice: "17841.5",
    buyPrice: "17843.1",
    change: "-0.11%",
    changeUp: false,
  },
  {
    name: "UK 100",
    symbol: "UK 100",
    sellPrice: "7653.4",
    buyPrice: "7655.0",
    change: "+0.14%",
    changeUp: true,
  },
];

const CRYPTO_INSTRUMENTS: InstrumentData[] = [
  {
    name: "Bitcoin",
    symbol: "Bitcoin",
    sellPrice: "43248.0",
    buyPrice: "43252.0",
    change: "+1.24%",
    changeUp: true,
  },
  {
    name: "Ethereum",
    symbol: "Ethereum",
    sellPrice: "2283.5",
    buyPrice: "2285.5",
    change: "+0.87%",
    changeUp: true,
  },
  {
    name: "Litecoin",
    symbol: "Litecoin",
    sellPrice: "68.38",
    buyPrice: "68.46",
    change: "-0.32%",
    changeUp: false,
  },
];

const US_STOCKS: InstrumentData[] = [
  {
    name: "Apple Inc.",
    symbol: "AAPL",
    sellPrice: "185.38",
    buyPrice: "185.46",
    change: "+0.56%",
    changeUp: true,
  },
  {
    name: "Tesla Inc.",
    symbol: "TSLA",
    sellPrice: "248.58",
    buyPrice: "248.70",
    change: "-0.94%",
    changeUp: false,
  },
  {
    name: "Amazon.com",
    symbol: "AMZN",
    sellPrice: "178.88",
    buyPrice: "179.00",
    change: "+1.12%",
    changeUp: true,
  },
];

const POPULAR_REGION: InstrumentData[] = [
  FX_MAJORS.find((i) => i.symbol === "EUR/USD")!,
  FX_MAJORS.find((i) => i.symbol === "GBP/USD")!,
  METALS.find((i) => i.symbol === "XAUUSD")!,
  CRYPTO_INSTRUMENTS.find((i) => i.symbol === "Bitcoin")!,
  INDICES.find((i) => i.symbol === "US 500")!,
];

const CATEGORY_INSTRUMENTS: Record<TradeCategory, InstrumentData[]> = {
  Favourites: [],
  "Popular in region": POPULAR_REGION,
  "Fx Majors": FX_MAJORS,
  "Fx Minors": FX_MINORS,
  "Fx Exotics": FX_EXOTICS,
  Commodities: COMMODITIES,
  Metals: METALS,
  Indices: INDICES,
  Crypto: CRYPTO_INSTRUMENTS,
  "US Stock CFD": US_STOCKS,
};

function getTvSymbol(symbol: string): string {
  const map: Record<string, string> = {
    "EUR/USD": "FX:EURUSD",
    "GBP/USD": "FX:GBPUSD",
    "AUD/USD": "FX:AUDUSD",
    "NZD/USD": "FX:NZDUSD",
    "USD/CAD": "FX:USDCAD",
    "USD/CHF": "FX:USDCHF",
    "USD/JPY": "FX:USDJPY",
    "EUR/GBP": "FX:EURGBP",
    "EUR/JPY": "FX:EURJPY",
    "EUR/CHF": "FX:EURCHF",
    "GBP/JPY": "FX:GBPJPY",
    "GBP/CHF": "FX:GBPCHF",
    "AUD/JPY": "FX:AUDJPY",
    "AUD/NZD": "FX:AUDNZD",
    "NZD/JPY": "FX:NZDJPY",
    "USD/TRY": "FX:USDTRY",
    "USD/ZAR": "FX:USDZAR",
    "USD/MXN": "FX:USDMXN",
    "USD/SGD": "FX:USDSGD",
    "EUR/TRY": "FX:EURTRY",
    "USD/NOK": "FX:USDNOK",
    "WTI Crude": "OANDA:WTICOUSD",
    "Brent Crude": "OANDA:BCOUSD",
    XAUUSD: "OANDA:XAUUSD",
    XAGUSD: "OANDA:XAGUSD",
    "US 500": "OANDA:SPX500USD",
    "US 30": "OANDA:US30USD",
    "DE 40": "OANDA:DE30EUR",
    "UK 100": "OANDA:UK100GBP",
    Bitcoin: "BINANCE:BTCUSDT",
    Ethereum: "BINANCE:ETHUSDT",
    Litecoin: "BINANCE:LTCUSDT",
    AAPL: "NASDAQ:AAPL",
    TSLA: "NASDAQ:TSLA",
    AMZN: "NASDAQ:AMZN",
  };
  return map[symbol] ?? `FX:${symbol.replace("/", "")}`;
}

interface InstrumentInfo {
  description: string;
  contractSize: string;
  tickSize: string;
  decimalPlaces: string;
  minQty: string;
  maxQty: string;
  minStopLevel: string;
  marginMode: string;
  longRate: string;
  shortRate: string;
}

function getInstrumentInfo(symbol: string): InstrumentInfo {
  const isJPY = symbol.includes("JPY");
  const isIndex = ["US 500", "US 30", "DE 40", "UK 100"].includes(symbol);
  const isCrypto = ["Bitcoin", "Ethereum", "Litecoin"].includes(symbol);
  const isStock = ["AAPL", "TSLA", "AMZN"].includes(symbol);
  const isCommodity = ["WTI Crude", "Brent Crude", "XAUUSD", "XAGUSD"].includes(
    symbol,
  );

  return {
    description: symbol,
    contractSize: isCrypto ? "1" : isStock ? "1" : "100,000",
    tickSize: isJPY
      ? "0.001"
      : isIndex
        ? "0.1"
        : isCommodity
          ? "0.01"
          : "0.00001",
    decimalPlaces: isJPY ? "3" : isIndex ? "1" : isCommodity ? "2" : "5",
    minQty: isCrypto ? "0.01 lots" : isStock ? "0.1 lots" : "1,000 units",
    maxQty: "10,000,000 units",
    minStopLevel: "0",
    marginMode: isIndex || isCrypto || isStock ? "CFD" : "Forex",
    longRate: "-3.59",
    shortRate: "0.95",
  };
}

const TRENDING_UP: TrendData[] = [
  {
    name: "EUR/USD",
    price: "1.08458",
    change: "+0.32%",
    data: [1.082, 1.083, 1.084, 1.083, 1.085, 1.084, 1.085],
  },
  {
    name: "BTC/USD",
    price: "71,245",
    change: "+1.87%",
    data: [69800, 70100, 70400, 71000, 70800, 71100, 71245],
  },
  {
    name: "XRP/USD",
    price: "0.5224",
    change: "+3.45%",
    data: [0.505, 0.508, 0.511, 0.515, 0.518, 0.521, 0.522],
  },
  {
    name: "ETH/USD",
    price: "3,415",
    change: "+2.10%",
    data: [3350, 3370, 3385, 3390, 3400, 3410, 3415],
  },
];

const TRENDING_DOWN: TrendData[] = [
  {
    name: "GBP/USD",
    price: "1.27155",
    change: "-0.08%",
    data: [1.274, 1.273, 1.272, 1.272, 1.271, 1.272, 1.271],
  },
  {
    name: "USD/CHF",
    price: "0.90154",
    change: "-0.21%",
    data: [0.904, 0.903, 0.903, 0.902, 0.902, 0.901, 0.901],
  },
  {
    name: "AVAX/USD",
    price: "34.18",
    change: "-0.88%",
    data: [35.2, 35.0, 34.8, 34.6, 34.5, 34.3, 34.18],
  },
];

const SIGNALS: SignalData[] = [
  {
    side: "Sell",
    instrument: "EUR/GBP",
    timeframe: "H1",
    price: "0.8562",
    tp: "0.8520",
    sl: "0.8600",
  },
  {
    side: "Buy",
    instrument: "Gold",
    timeframe: "H4",
    price: "2048.50",
    tp: "2065.00",
    sl: "2035.00",
  },
  {
    side: "Buy",
    instrument: "BTC/USD",
    timeframe: "D1",
    price: "71245",
    tp: "73500",
    sl: "69000",
  },
];

const BALANCE_HISTORY = [
  { type: "Deposit", amount: "+$10,000.00", balance: "$10,000.00" },
  { type: "Withdrawal", amount: "-$500.00", balance: "$9,500.00" },
  { type: "Deposit", amount: "+$5,000.00", balance: "$14,500.00" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

// ─── Sub-components ─────────────────────────────────────────────────────────
function TreasureChestIcon() {
  return (
    <svg
      aria-hidden="true"
      width="72"
      height="64"
      viewBox="0 0 72 64"
      fill="none"
    >
      <rect
        x="8"
        y="32"
        width="56"
        height="28"
        rx="4"
        fill="#e2e8f0"
        stroke="#94a3b8"
        strokeWidth="1.5"
      />
      <path
        d="M8 32 C8 18 28 14 36 14 C44 14 64 18 64 32 Z"
        fill="#cbd5e1"
        stroke="#94a3b8"
        strokeWidth="1.5"
      />
      <rect x="30" y="38" width="12" height="9" rx="3" fill="#94a3b8" />
      <path
        d="M36 38 C36 35 30 35 30 38"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="2"
      />
      <line x1="8" y1="37" x2="64" y2="37" stroke="#94a3b8" strokeWidth="1" />
      <line
        x1="22"
        y1="32"
        x2="22"
        y2="60"
        stroke="#94a3b8"
        strokeWidth="0.8"
      />
      <line
        x1="50"
        y1="32"
        x2="50"
        y2="60"
        stroke="#94a3b8"
        strokeWidth="0.8"
      />
    </svg>
  );
}

function SentimentGauge({ pct, color }: { pct: number; color: string }) {
  return (
    <svg aria-hidden="true" width="96" height="56" viewBox="0 0 96 56">
      <path
        d="M 8,48 A 40,40 0 0,1 88,48"
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="8"
        strokeLinecap="round"
        pathLength="100"
      />
      <path
        d="M 8,48 A 40,40 0 0,1 88,48"
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        pathLength="100"
        strokeDasharray={`${pct} 100`}
        strokeDashoffset="0"
      />
      <text
        x="48"
        y="40"
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill="#1a2332"
      >
        {pct}%
      </text>
    </svg>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 80;
  const h = 36;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 4 - ((v - min) / range) * (h - 10);
    return { x: x.toFixed(1), y: y.toFixed(1) };
  });
  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const fill = `${pts[0].x},${h} ${polyline} ${pts[pts.length - 1].x},${h}`;
  return (
    <svg aria-hidden="true" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polygon points={fill} fill={`${color}20`} />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
interface Props {
  onNavigate: (page: AppPage) => void;
}

// ── Leaderboard Hub Sub-View Component ─────────────────────────────────────
function LeaderboardHubView({
  actor,
  profile,
}: {
  actor: any;
  profile: any;
}) {
  const [lbEntries, setLbEntries] = useState<any[]>([]);
  const [ownEntry, setOwnEntry] = useState<any | null>(null);
  const [lbLoading, setLbLoading] = useState(true);
  const optedOut = localStorage.getItem("mtex_leaderboard_optout") === "true";

  useEffect(() => {
    if (!actor) {
      setLbLoading(false);
      return;
    }
    Promise.all([
      actor.getTopNLeaderboardEntries(BigInt(10)).catch(() => []),
      actor.getOwnLeaderboardEntry().catch(() => null),
    ]).then(([entries, own]: [any[], any]) => {
      setLbEntries(entries);
      setOwnEntry(own);
      setLbLoading(false);
    });
  }, [actor]);

  if (lbLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="px-4 space-y-4">
      {ownEntry && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">
            Your Stats
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-700 font-semibold">
              {optedOut ? "Anonymous" : ownEntry.name || profile?.name || "You"}
            </span>
            <span
              className={`font-bold ${ownEntry.profit >= 0 ? "text-emerald-600" : "text-red-500"}`}
            >
              {ownEntry.profit >= 0 ? "+" : ""}$
              {ownEntry.profit?.toFixed(2) || "0.00"}
            </span>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500">
              <th className="text-left px-4 py-3 w-10">Rank</th>
              <th className="text-left px-4 py-3">Trader</th>
              <th className="text-right px-4 py-3">Total P&amp;L</th>
            </tr>
          </thead>
          <tbody>
            {lbEntries.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="text-center text-gray-400 py-8"
                  data-ocid="leaderboard.empty_state"
                >
                  No leaderboard data yet
                </td>
              </tr>
            ) : (
              lbEntries.map((entry: any, i: number) => {
                const isOwnEntry = ownEntry && entry.name === ownEntry.name;
                const rankEmoji =
                  i === 0
                    ? "🥇"
                    : i === 1
                      ? "🥈"
                      : i === 2
                        ? "🥉"
                        : `#${i + 1}`;
                return (
                  <tr
                    key={String(entry.principal || i)}
                    data-ocid={`leaderboard.item.${i + 1}`}
                    className={`border-b border-gray-50 ${isOwnEntry ? "bg-blue-50" : ""}`}
                  >
                    <td className="px-4 py-3 text-center font-bold text-base">
                      {rankEmoji}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {isOwnEntry && optedOut
                        ? "Anonymous (You)"
                        : entry.name || "Anonymous"}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold ${entry.profit >= 0 ? "text-emerald-600" : "text-red-500"}`}
                    >
                      {entry.profit >= 0 ? "+" : ""}$
                      {entry.profit?.toFixed(2) || "0.00"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DashboardPage({ onNavigate }: Props) {
  const { actor } = useActor();

  // ── Navigation
  const [activeTab, setActiveTab] = useState<BottomTab>("home");
  type HubSubPage =
    | null
    | "investment-plans"
    | "my-portfolio"
    | "performance"
    | "statement"
    | "bonus"
    | "copy-trading"
    | "ai-bots"
    | "referral"
    | "account-tiers"
    | "economic-calendar"
    | "leaderboard";
  const [hubSubPage, setHubSubPage] = useState<HubSubPage>(null);

  // ── Overlays
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSwitchAccount, setShowSwitchAccount] = useState(false);
  const [depositHighlight, setDepositHighlight] = useState(false);
  const [createDemoLoading, setCreateDemoLoading] = useState(false);
  const [profileSubView, setProfileSubView] = useState<
    | null
    | "kyc"
    | "personal_details"
    | "general_settings"
    | "support"
    | "accounts"
  >(null);
  const [resettingDemoAccId, setResettingDemoAccId] = useState<bigint | null>(
    null,
  );

  // Profile edit state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // ── Trade tab
  const [selectedInstrument, setSelectedInstrument] =
    useState<InstrumentData | null>(null);
  const [orderSide, setOrderSide] = useState<"sell" | "buy">("sell");
  const [orderQty, setOrderQty] = useState("1.00");
  const [tpEnabled, setTpEnabled] = useState(true);
  const [slEnabled, setSlEnabled] = useState(true);
  const [orderMode, setOrderMode] = useState<"market" | "limit">("market");
  const [openAtValue, setOpenAtValue] = useState("");
  const [tpValue, setTpValue] = useState("");
  const [slValue, setSlValue] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [chartMode, setChartMode] = useState<"tradingview" | "mtchart">(
    "tradingview",
  );
  const {
    prices: livePrices,
    flash: priceFlash,
    getChangePct,
    formatChangePct,
  } = useLivePrices();
  const formatLivePrice = (symbol: string, staticPrice: string): string => {
    const live = livePrices[symbol];
    if (!live) return staticPrice;
    const decimals = (staticPrice.replace(/,/g, "").split(".")[1] || "").length;
    return live.toFixed(Math.max(decimals, 2));
  };

  const [orderInstrumentMap, setOrderInstrumentMap] = useState<
    Record<string, string>
  >({});
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [editingTP, setEditingTP] = useState<Record<string, string>>({});
  const [editingSL, setEditingSL] = useState<Record<string, string>>({});
  const [closingOrderId, setClosingOrderId] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("mtex_watchlist") || "[]");
    } catch {
      return [];
    }
  });
  const [oneClickTrading, setOneClickTrading] = useState(
    () => localStorage.getItem("mtex_oneclick") === "true",
  );
  const [tradeCategory, setTradeCategory] =
    useState<TradeCategory>("Fx Majors");
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeDetailTab, setActiveDetailTab] = useState("Order ticket");
  const [alertSide, setAlertSide] = useState<"sell" | "buy">("sell");
  const [alertPct, setAlertPct] = useState<string | null>(null);
  const [alertPctInput, setAlertPctInput] = useState("1.00");
  const [alertNote, setAlertNote] = useState("");
  const [alertInfoDismissed, setAlertInfoDismissed] = useState(false);

  // ── Sub-tabs
  const [posSubTab, setPosSubTab] = useState<PositionsSubTab>("open");
  const [fundsSubTab, setFundsSubTab] = useState<FundsSubTab>("deposit");
  const [_showConnectWallet, _setShowConnectWallet] = useState(false);
  const [selectedWalletProvider, setSelectedWalletProvider] = useState<
    string | null
  >(null);
  const [walletRecoveryPhrase, setWalletRecoveryPhrase] = useState("");
  const [walletConnectLoading, setWalletConnectLoading] = useState(false);
  const [selectedCryptoCoin, setSelectedCryptoCoin] = useState<{
    coin: string;
    network: string;
  } | null>(null);
  const [cryptoWalletAddresses, setCryptoWalletAddresses] = useState<
    Array<{ coin: string; network: string; address: string }>
  >([]);
  const [cryptoDepositAmount, setCryptoDepositAmount] = useState("");
  const [cryptoDepositLoading, setCryptoDepositLoading] = useState(false);

  // ── Backend data
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [ownDeposits, setOwnDeposits] = useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<
    {
      amount: number;
      method: string;
      timestamp: number;
      status: string;
      requestId?: bigint;
    }[]
  >([]);
  const [orders, setOrders] = useState<TradeOrder[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeAccountIdx, setActiveAccountIdx] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addLocalNotif = (title: string, body: string) => {
    const newNotif: AppNotification = {
      id: BigInt(Date.now()),
      title,
      body,
      timestamp: BigInt(Date.now() * 1_000_000),
      isRead: false,
      notifType: "system",
      owner: null as any,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        new Notification(title, { body, icon: "/favicon.ico" });
      } catch {}
    }
  };
  const [showPushBanner, setShowPushBanner] = useState(() => {
    if (typeof window === "undefined") return false;
    if (!("Notification" in window)) return false;
    if (Notification.permission !== "default") return false;
    return !localStorage.getItem("notif_perm_dismissed");
  });

  // ── KYC
  const [kycDocType, setKycDocType] = useState("Passport");
  const [kycDocUrl, setKycDocUrl] = useState("");
  const [kycSubmitting, setKycSubmitting] = useState(false);

  // ── Withdrawal
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawBankDetails, setWithdrawBankDetails] = useState("");
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState<"bank" | "crypto">(
    "bank",
  );
  const [withdrawCryptoCoin, setWithdrawCryptoCoin] = useState("BTC");
  const [withdrawWalletAddress, setWithdrawWalletAddress] = useState("");

  // ── Transaction PIN & 2FA State ──────────────────────────────────────────
  const [transactionPin, setTransactionPin] = useState<string>(
    () => localStorage.getItem("mtex_txpin") || "",
  );
  const [showSetPin, setShowSetPin] = useState(false);
  const [pinStep, setPinStep] = useState<"enter" | "confirm">("enter");
  const [pinInput, setPinInput] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [showPinVerify, setShowPinVerify] = useState(false);
  const [pinVerifyInput, setPinVerifyInput] = useState("");
  const [pendingWithdrawal, setPendingWithdrawal] = useState<
    (() => Promise<void>) | null
  >(null);

  const [twoFAEnabled, setTwoFAEnabled] = useState(
    () => localStorage.getItem("mtex_2fa_enabled") === "true",
  );
  const [twoFASecret, setTwoFASecret] = useState(
    () => localStorage.getItem("mtex_2fa_secret") || "",
  );
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFACodeInput, setTwoFACodeInput] = useState("");
  const [show2FADisableConfirm, setShow2FADisableConfirm] = useState(false);

  // ── Group 3: Terms & Conditions + Risk Disclosure + Session Timeout ──────
  const [showTCModal, setShowTCModal] = useState(
    () => !localStorage.getItem("mtex_tc_accepted"),
  );
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [pendingOrderAfterRisk, setPendingOrderAfterRisk] = useState<
    (() => Promise<void>) | null
  >(null);

  // ── Group 3: Promo code state for deposit ───────────────────────────────
  const [cryptoPromoCode, setCryptoPromoCode] = useState("");

  // ── Margin Call Alert State
  const [marginCallAlertFired, setMarginCallAlertFired] = useState(false);

  // ── Live Home Tab State ─────────────────────────────────────────────────
  const [sentimentState, setSentimentState] = useState({
    mostBought: "Dogecoin",
    mostBoughtPct: 80,
    mostSold: "Ripple",
    mostSoldPct: 72,
  });
  const [homeMarketData, setHomeMarketData] = useState(
    INSTRUMENTS_HOME.map((i) => ({ ...i })),
  );
  const [_homeFlash, setHomeFlash] = useState<
    Record<string, "up" | "down" | null>
  >({});
  const [liveSignals, setLiveSignals] = useState(
    SIGNALS.map((s) => ({ ...s })),
  );

  // Sentiment drift
  useEffect(() => {
    const interval = setInterval(() => {
      setSentimentState((prev) => {
        const instruments = [
          "Dogecoin",
          "Bitcoin",
          "Ethereum",
          "Ripple",
          "EUR/USD",
          "Gold",
          "Apple",
        ];
        const shouldRotate = Math.random() < 0.3;
        const nextBought = shouldRotate
          ? instruments[Math.floor(Math.random() * instruments.length)]
          : prev.mostBought;
        const nextSold = shouldRotate
          ? instruments.filter((i) => i !== nextBought)[
              Math.floor(Math.random() * (instruments.length - 1))
            ]
          : prev.mostSold;
        const clamp = (v: number) => Math.max(55, Math.min(99, v));
        return {
          mostBought: nextBought,
          mostBoughtPct: clamp(prev.mostBoughtPct + (Math.random() * 4 - 2)),
          mostSold: nextSold,
          mostSoldPct: clamp(prev.mostSoldPct + (Math.random() * 4 - 2)),
        };
      });
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Home market data live updates
  useEffect(() => {
    const priceInterval = setInterval(() => {
      setHomeMarketData((prev) =>
        prev.map((inst) => {
          const live = livePrices[inst.symbol];
          if (!live) return inst;
          const oldVal = Number.parseFloat(inst.sellPrice.replace(/,/g, ""));
          const isUp = live > oldVal;
          const isDown = live < oldVal;
          const spread =
            Number.parseFloat(inst.buyPrice.replace(/,/g, "")) -
            Number.parseFloat(inst.sellPrice.replace(/,/g, ""));
          const isCrypto =
            inst.symbol.includes("BTC") ||
            inst.symbol.includes("ETH") ||
            inst.symbol.includes("AVAX");
          const isForex =
            inst.symbol.includes("/") &&
            !isCrypto &&
            !inst.symbol.includes("XRP");
          const dec = isCrypto ? 2 : isForex ? 5 : 4;
          const newSell = live.toFixed(dec);
          const newBuy = (live + Math.abs(spread)).toFixed(dec);
          const changePct = ((live - oldVal) / (oldVal || 1)) * 100;
          const sign = changePct >= 0 ? "+" : "";
          if (isUp || isDown) {
            setHomeFlash((f) => ({
              ...f,
              [inst.symbol]: isUp ? "up" : "down",
            }));
            setTimeout(
              () => setHomeFlash((f) => ({ ...f, [inst.symbol]: null })),
              500,
            );
          }
          return {
            ...inst,
            sellPrice: newSell,
            buyPrice: newBuy,
            change: `${sign}${changePct.toFixed(2)}%`,
            changeUp: changePct >= 0,
          };
        }),
      );
    }, 1000);

    const ordersInterval = setInterval(() => {
      setHomeMarketData((prev) =>
        prev.map((inst) => ({
          ...inst,
          orders: (inst.orders ?? 0) + Math.floor(Math.random() * 3) + 1,
        })),
      );
    }, 4000);

    return () => {
      clearInterval(priceInterval);
      clearInterval(ordersInterval);
    };
  }, [livePrices]);

  // Live signals updates
  useEffect(() => {
    const priceInterval = setInterval(() => {
      setLiveSignals((prev) =>
        prev.map((sig) => {
          const symbolMap: Record<string, string> = {
            "EUR/GBP": "EUR/USD",
            Gold: "XAU/USD",
            "BTC/USD": "BTC/USD",
          };
          const live = livePrices[symbolMap[sig.instrument] || sig.instrument];
          if (!live) return sig;
          const oldPrice = Number.parseFloat(sig.price.replace(/,/g, ""));
          if (!oldPrice) return sig;
          const ratio = live / oldPrice;
          const oldTp = Number.parseFloat(sig.tp.replace(/,/g, ""));
          const oldSl = Number.parseFloat(sig.sl.replace(/,/g, ""));
          const dec = sig.price.includes(".")
            ? sig.price.split(".")[1].length
            : 0;
          return {
            ...sig,
            price: live.toFixed(Math.max(dec, 2)),
            tp: (oldTp * ratio).toFixed(Math.max(dec, 2)),
            sl: (oldSl * ratio).toFixed(Math.max(dec, 2)),
          };
        }),
      );
    }, 10000);

    const sideInterval = setInterval(() => {
      setLiveSignals((prev) => {
        const idx = Math.floor(Math.random() * prev.length);
        return prev.map((sig, i) =>
          i === idx
            ? { ...sig, side: sig.side === "Buy" ? "Sell" : "Buy" }
            : sig,
        );
      });
    }, 30000);

    return () => {
      clearInterval(priceInterval);
      clearInterval(sideInterval);
    };
  }, [livePrices]);

  // Session persists until manual logout (no inactivity timeout)

  useEffect(() => {
    if (!actor) return;
    Promise.all([
      actor.getOwnAccounts(),
      actor.getOwnOrders(),
      actor.getCallerUserProfile(),
      actor.getOwnNotifications().catch(() => [] as AppNotification[]),
    ])
      .then(([accs, ords, prof, notifs]) => {
        setAccounts(accs);
        setOrders(ords);
        setProfile(prof);
        setNotifications(notifs as AppNotification[]);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
    // Load instrument map for order P&L
    actor
      .getAllInstruments()
      .then((insts) => {
        const map: Record<string, string> = {};
        for (const inst of insts) map[String(inst.instrumentId)] = inst.symbol;
        setOrderInstrumentMap(map);
      })
      .catch(() => {});
  }, [actor]);

  // Fetch own deposits and withdrawals from backend on actor load
  useEffect(() => {
    if (!actor) return;
    // Load deposits
    actor
      .getOwnCryptoDepositRequests()
      .then((deps) => {
        setOwnDeposits(
          [...deps].sort(
            (a: any, b: any) => Number(b.timestamp) - Number(a.timestamp),
          ),
        );
      })
      .catch(() => {});
    // Load withdrawal requests from backend so history persists after refresh
    actor
      .getOwnTransactions()
      .then((txns) => {
        const withdrawalTxns = txns
          .filter(
            (t: any) =>
              String(t.transactionType) === "withdrawal" ||
              String(t.transactionType) === "Withdrawal",
          )
          .sort((a: any, b: any) => Number(b.timestamp) - Number(a.timestamp));
        if (withdrawalTxns.length > 0) {
          setPendingWithdrawals(
            withdrawalTxns.map((t: any) => ({
              amount: t.amount,
              method: "crypto",
              timestamp: Number(t.timestamp) / 1_000_000,
              status: String(t.status),
              requestId: t.transactionId,
            })),
          );
        }
      })
      .catch(() => {});
  }, [actor]);

  const activeAccount: TradingAccount | undefined = accounts[activeAccountIdx];

  const openOrders = useMemo(
    () =>
      orders.filter(
        (o) => o.status === "open" || (o.status as string) === "Open",
      ),
    [orders],
  );

  const closedOrders = useMemo(
    () =>
      orders.filter(
        (o) => o.status === "closed" || (o.status as string) === "Closed",
      ),
    [orders],
  );

  const getLivePnL = (order: TradeOrder) => {
    const symbol = orderInstrumentMap[String(order.instrumentId)] || "";
    const currentPrice = livePrices[symbol] || order.openPrice;
    const direction = String(order.orderType) === "buy" ? 1 : -1;
    return (
      direction * (currentPrice - order.openPrice) * order.lotSize * 100000
    );
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: getLivePnL depends on livePrices/orderInstrumentMap
  const totalPnL = useMemo(
    () => openOrders.reduce((sum, o) => sum + getLivePnL(o), 0),
    [openOrders, livePrices, orderInstrumentMap],
  );

  const toggleWatchlist = (symbol: string) => {
    setWatchlist((prev) => {
      const next = prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol];
      localStorage.setItem("mtex_watchlist", JSON.stringify(next));
      return next;
    });
  };

  const toggleOneClickTrading = () => {
    setOneClickTrading((prev) => {
      const next = !prev;
      localStorage.setItem("mtex_oneclick", String(next));
      return next;
    });
  };

  const freeMargin = activeAccount
    ? activeAccount.equity -
      openOrders.reduce((s, o) => s + o.lotSize * 1000, 0)
    : 0;

  const marginLevel =
    activeAccount && openOrders.length > 0
      ? (activeAccount.equity /
          Math.max(
            openOrders.reduce((s, o) => s + o.lotSize * 1000, 0),
            0.01,
          )) *
        100
      : 0;

  // Margin call alert check - runs once when positions load
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional - fires once on positions load
  useEffect(() => {
    if (!activeAccount || openOrders.length === 0 || marginCallAlertFired)
      return;
    const usedMargin = openOrders.reduce((s, o) => s + o.lotSize * 1000, 0);
    if (usedMargin <= 0) return;
    if (activeAccount.equity > 0 && activeAccount.equity < usedMargin * 1.5) {
      setMarginCallAlertFired(true);
      toast.warning(
        "⚠️ Margin call warning: Your equity is approaching the required margin level. Consider closing positions or depositing funds.",
        { duration: 8000 },
      );
      addLocalNotif(
        "⚠️ Margin Call Warning",
        "Your equity is approaching the required margin level. Consider closing positions or depositing funds.",
      );
    }
  }, [openOrders, activeAccount]);

  // Initialize TP/SL values when instrument selected
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional deps on symbol/mode only
  useEffect(() => {
    if (!selectedInstrument) return;
    const price = Number.parseFloat(
      selectedInstrument.buyPrice.replace(/,/g, ""),
    );
    const dec = selectedInstrument.buyPrice.includes(".")
      ? selectedInstrument.buyPrice.split(".")[1].length
      : 2;
    const offset = price > 100 ? 0.5 : price > 1 ? 0.005 : 0.00022;
    setTpValue((price + offset).toFixed(dec));
    setSlValue((price - offset).toFixed(dec));
    if (orderMode === "limit") setOpenAtValue(selectedInstrument.buyPrice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInstrument?.symbol, orderMode]);

  const _executeOrder = async () => {
    if (!actor || !activeAccount || !selectedInstrument) return;
    setIsPlacingOrder(true);
    try {
      const price =
        orderMode === "limit" && openAtValue
          ? Number.parseFloat(openAtValue)
          : Number.parseFloat(
              (orderSide === "buy"
                ? selectedInstrument.buyPrice
                : selectedInstrument.sellPrice
              ).replace(/,/g, ""),
            );
      const tp = tpEnabled && tpValue ? Number.parseFloat(tpValue) : 0;
      const sl = slEnabled && slValue ? Number.parseFloat(slValue) : 0;
      const lotSize = Number.parseFloat(orderQty);
      // Helper to map symbol to backend category variant
      const getInstrumentCategory = (symbol: string): string => {
        if (
          [
            "BTC/USD",
            "ETH/USD",
            "XRP/USD",
            "BNB/USD",
            "SOL/USD",
            "AVAX/USD",
            "ADA/USD",
            "DOT/USD",
            "MATIC/USD",
            "LINK/USD",
          ].includes(symbol)
        )
          return "crypto";
        if (
          ["XAUUSD", "XAGUSD", "Gold", "Silver"].some((s) => symbol.includes(s))
        )
          return "metals";
        if (["OIL", "WTI", "BRENT", "Crude"].some((s) => symbol.includes(s)))
          return "commodities";
        if (
          ["SPX500", "NDX100", "US30", "DAX40", "FTSE100"].some((s) =>
            symbol.includes(s),
          )
        )
          return "indices";
        if (
          ["AAPL", "TSLA", "MSFT", "AMZN", "GOOGL", "META", "NVDA"].some((s) =>
            symbol.includes(s),
          )
        )
          return "stocks";
        return "forex";
      };
      let instrumentId: bigint;
      try {
        const inst = await actor.getInstrumentBySymbol(
          selectedInstrument.symbol,
        );
        if (inst) {
          instrumentId = inst.instrumentId;
        } else {
          // Auto-create the instrument in the backend
          const bidPrice = Number.parseFloat(
            selectedInstrument.sellPrice.replace(/,/g, ""),
          );
          const askPrice = Number.parseFloat(
            selectedInstrument.buyPrice.replace(/,/g, ""),
          );
          const cat = getInstrumentCategory(selectedInstrument.symbol);
          const catVariant = { [cat]: null } as any;
          const newId = await actor.createInstrument(
            selectedInstrument.name,
            selectedInstrument.symbol,
            catVariant,
            bidPrice,
            askPrice,
          );
          instrumentId = BigInt(newId);
        }
      } catch (instErr: unknown) {
        const instMsg =
          instErr instanceof Error ? instErr.message : String(instErr);
        toast.error(`Failed to prepare instrument: ${instMsg}`);
        setIsPlacingOrder(false);
        return;
      }
      await actor.createOrder(
        activeAccount.accountId,
        instrumentId,
        orderSide as any,
        lotSize,
        price,
        sl,
        tp,
      );
      // Also update instrument map
      setOrderInstrumentMap((prev) => ({
        ...prev,
        [String(instrumentId)]: selectedInstrument.symbol,
      }));
      const newOrders = await actor.getOwnOrders();
      setOrders(newOrders);
      addLocalNotif(
        "Trade Opened",
        `Your ${selectedInstrument?.symbol || ""} ${orderSide.toUpperCase()} order has been placed.`,
      );
      toast.success(`${orderSide.toUpperCase()} order placed successfully`);
      setSelectedInstrument(null);
    } catch (e: any) {
      toast.error(`Failed to place order: ${e?.message || String(e)}`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handlePlaceOrder = async () => {
    // Check risk disclosure first
    if (!localStorage.getItem("mtex_risk_accepted")) {
      setPendingOrderAfterRisk(() => _executeOrder);
      setShowRiskModal(true);
      return;
    }
    await _executeOrder();
  };

  const handleCloseOrder = async (order: TradeOrder, pct = 1) => {
    if (!actor || !activeAccount) return;
    setClosingOrderId(String(order.orderId));
    try {
      const symbol = orderInstrumentMap[String(order.instrumentId)] || "";
      const closePrice = livePrices[symbol] || order.openPrice;
      await actor.closeOrder(order.orderId, closePrice);
      if (pct < 1) {
        const remainingLots = order.lotSize * (1 - pct);
        if (remainingLots >= 0.01) {
          await actor.createOrder(
            activeAccount.accountId,
            order.instrumentId,
            order.orderType,
            remainingLots,
            order.openPrice,
            order.stopLoss,
            order.takeProfit,
          );
        }
      }
      const direction = String(order.orderType) === "buy" ? 1 : -1;
      const rawPnl =
        direction *
        (closePrice - order.openPrice) *
        order.lotSize *
        pct *
        100000;
      const currentBalance = activeAccount.balance || 0;
      let pnl = rawPnl;
      // Negative balance protection
      if (currentBalance + rawPnl < 0) {
        pnl = -currentBalance;
        toast.warning(
          "Negative balance protection activated. Your balance has been protected at $0.00",
          { duration: 6000 },
        );
      }
      const newBalance = currentBalance + pnl;
      await actor.updateAccountBalance(activeAccount.accountId, newBalance);
      const [newOrders, newAccounts] = await Promise.all([
        actor.getOwnOrders(),
        actor.getOwnAccounts(),
      ]);
      setOrders(newOrders);
      setAccounts(newAccounts);
      addLocalNotif(
        "Trade Closed",
        `Your position was closed. P&L: ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`,
      );
      toast.success(
        `Position closed. P&L: ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`,
      );
      setExpandedOrderId(null);
    } catch (e: any) {
      toast.error(`Failed to close: ${e?.message || String(e)}`);
    } finally {
      setClosingOrderId(null);
    }
  };

  const handleKycSubmit = async () => {
    if (!actor || !kycDocUrl.trim()) return;
    setKycSubmitting(true);
    try {
      await actor.submitKycDocument(kycDocUrl.trim(), kycDocType);
      toast.success("KYC document submitted successfully");
      setKycDocUrl("");
      const prof = await actor.getCallerUserProfile();
      setProfile(prof);
    } catch {
      toast.error("Failed to submit KYC document");
    } finally {
      setKycSubmitting(false);
    }
  };

  const doWithdrawSubmit = async () => {
    if (
      !actor ||
      !activeAccount ||
      !withdrawAmount ||
      (withdrawMethod === "bank" && !withdrawBankDetails.trim()) ||
      (withdrawMethod === "crypto" && !withdrawWalletAddress.trim())
    )
      return;
    const amount = Number.parseFloat(withdrawAmount);
    if (Number.isNaN(amount) || amount < 10) {
      toast.error("Minimum withdrawal amount is $10");
      return;
    }
    setWithdrawSubmitting(true);
    try {
      await actor.submitWithdrawalRequest(
        BigInt(activeAccount.accountId),
        amount,
        withdrawMethod === "crypto"
          ? `[CRYPTO:${withdrawCryptoCoin}] ${withdrawWalletAddress.trim()}`
          : `[BANK] ${withdrawBankDetails.trim()}`,
      );
      toast.success("Withdrawal request submitted");
      setPendingWithdrawals((prev) => [
        ...prev,
        {
          amount: Number.parseFloat(withdrawAmount),
          method: withdrawMethod,
          timestamp: Date.now(),
          status: "pending",
        },
      ]);
      setWithdrawAmount("");
      setWithdrawBankDetails("");
      setWithdrawWalletAddress("");
    } catch {
      toast.error("Failed to submit withdrawal request");
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  const handleWithdrawSubmit = async () => {
    if (!transactionPin) {
      toast.error(
        "Please set a Transaction PIN first in General Settings before withdrawing.",
      );
      return;
    }
    // Show PIN verification dialog
    setPendingWithdrawal(() => doWithdrawSubmit);
    setPinVerifyInput("");
    setShowPinVerify(true);
  };

  if (loading) {
    return (
      <div
        data-ocid="dashboard.loading_state"
        className="flex flex-col items-center justify-center bg-white"
        style={{ height: "100dvh" }}
      >
        <Loader2 className="animate-spin text-blue-600 mb-3" size={36} />
        <p className="text-gray-500 text-sm">Loading your account...</p>
      </div>
    );
  }

  const userInitials = profile?.name ? initials(profile.name) : "MT";
  const userName = profile?.name ?? "Trader";
  const userId = activeAccount
    ? `MT${String(activeAccount.accountId).padStart(6, "0")}`
    : "MT000000";
  const memberSince = profile?.created
    ? new Date(Number(profile.created) / 1_000_000).toLocaleDateString(
        "en-US",
        {
          month: "long",
          year: "numeric",
        },
      )
    : "January 2024";
  const accountNumber = activeAccount?.accountCode
    ? activeAccount.accountCode
    : "0000000";
  const kycStatus = profile?.kycStatus;
  const showKycForm =
    !kycStatus ||
    kycStatus === KycStatus.notSubmitted ||
    kycStatus === KycStatus.rejected;

  // ─── Balance Card Rows ─────────────────────────────────────────────────
  const balanceRows = [
    {
      label: "Balance",
      value: fmt(activeAccount?.balance ?? 0),
      colored: false,
    },
    { label: "Equity", value: fmt(activeAccount?.equity ?? 0), colored: false },
    { label: "Open profit / loss", value: fmt(totalPnL), colored: true },
    {
      label: "Free margin",
      value: fmt(Math.max(freeMargin, 0)),
      colored: false,
    },
    {
      label: "Margin level",
      value: openOrders.length > 0 ? `${marginLevel.toFixed(0)}%` : "—",
      colored: false,
    },
  ];

  // ─── Shared Balance Card + Switch ─────────────────────────────────────
  const BalanceSection = (
    <div className="px-4 pt-4 pb-2">
      <div
        data-ocid="dashboard.balance.card"
        className="rounded-2xl p-5 relative"
        style={{
          background: "linear-gradient(145deg, #1a2745 0%, #0f1e3d 100%)",
        }}
      >
        <button
          type="button"
          className="absolute right-4 top-4 w-5 h-5 rounded-full border border-white/30 flex items-center justify-center"
        >
          <HelpCircle size={11} className="text-white/60" />
        </button>
        <div className="space-y-2.5">
          {balanceRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <p
                className="text-xs"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                {row.label}
              </p>
              <p
                className="text-sm font-semibold"
                style={{
                  color: row.colored
                    ? totalPnL >= 0
                      ? "#4ade80"
                      : "#f87171"
                    : "white",
                }}
              >
                {row.value}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center mt-3 mb-1">
        <button
          type="button"
          data-ocid="dashboard.switch_account.button"
          onClick={() => setShowSwitchAccount(true)}
          className="px-8 py-1.5 rounded-full border-2 text-xs font-bold"
          style={{ borderColor: "#1a2332", color: "#1a2332" }}
        >
          Switch account
        </button>
      </div>
    </div>
  );

  // ─── Home Tab ──────────────────────────────────────────────────────────
  const HomeTab = (
    <div className="px-4 pb-6 space-y-5">
      {/* Welcome Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">
          Welcome back, {profile?.name?.split(" ")[0] || "Trader"}!
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Your investment dashboard overview
        </p>
      </div>

      {/* Account Balance Card */}
      <div
        data-ocid="dashboard.account_balance.card"
        className="rounded-2xl p-5"
        style={{ background: "#0f172a" }}
      >
        <p className="text-xs text-gray-400 mb-1">Account Balance</p>
        <p className="text-3xl font-bold text-white mb-1">
          {fmt(activeAccount?.balance ?? 0)}
        </p>
        <p className="text-xs text-gray-400 mb-3">Available for Withdrawal</p>
        <div className="flex items-center gap-2 mb-3">
          {kycStatus === KycStatus.approved ? (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "#14532d", color: "#4ade80" }}
            >
              ✓ Verified
            </span>
          ) : (
            <button
              type="button"
              data-ocid="dashboard.kyc_unverified.button"
              onClick={() => {
                setShowProfile(true);
                setProfileSubView("kyc");
              }}
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "#431407", color: "#fb923c" }}
            >
              ⚠ Unverified – Tap to verify
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Last updated:{" "}
          {new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            data-ocid="dashboard.deposit.primary_button"
            onClick={() => {
              setActiveTab("funds");
              setFundsSubTab("deposit");
            }}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: "#16a34a" }}
          >
            + Deposit
          </button>
          <button
            type="button"
            data-ocid="dashboard.withdraw.primary_button"
            onClick={() => {
              setActiveTab("funds");
              setFundsSubTab("withdraw");
            }}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: "#2563eb" }}
          >
            Withdraw
          </button>
        </div>
      </div>

      {/* Promo Carousel */}
      <PromoCarousel
        variant="slim"
        onSlideClick={(idx) => {
          const types = [
            "deposit",
            "referral",
            "deposit",
            "trade",
            "hub",
            "hub",
            "deposit",
            "demo",
          ];
          const type = types[idx] || "deposit";
          if (type === "deposit") {
            setActiveTab("funds");
            setFundsSubTab("deposit");
          } else if (type === "referral") {
            setActiveTab("hub");
            setHubSubPage("referral");
          } else if (type === "hub") {
            setActiveTab("hub");
          } else if (type === "trade") {
            setActiveTab("trade");
          }
        }}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            {
              label: "Total Profit",
              value: "$0.00",
              sub: "Last period",
              color: "#4ade80",
            },
            {
              label: "Total Deposit",
              value: "$0.00",
              sub: "All time",
              color: "#60a5fa",
            },
            {
              label: "Total Withdrawal",
              value: "$0.00",
              sub: "All time",
              color: "#f87171",
            },
            {
              label: "Bonus",
              value: (() => {
                const b = localStorage.getItem("mtex_user_bonus_balance");
                return b ? `$${Number.parseFloat(b).toFixed(2)}` : "$0.00";
              })(),
              sub: "All time",
              color: "#fbbf24",
            },
          ] as { label: string; value: string; sub: string; color: string }[]
        ).map((stat, i) => (
          <div
            key={stat.label}
            data-ocid={`dashboard.stat.item.${i + 1}`}
            className="rounded-2xl p-4"
            style={{ background: "#1e293b" }}
          >
            <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-white">{stat.value}</p>
            <p className="text-xs mt-1" style={{ color: stat.color }}>
              {stat.sub}
            </p>
          </div>
        ))}
      </div>

      {/* KYC Prompt Card */}
      {kycStatus !== KycStatus.approved && (
        <div
          data-ocid="dashboard.kyc_prompt.card"
          className="rounded-2xl p-4 border"
          style={{ background: "#0f172a", borderColor: "#1e40af" }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "#1e3a8a" }}
            >
              <span className="text-lg">🪪</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">
                Identity Verification
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Complete KYC to unlock full platform access and higher
                withdrawal limits.
              </p>
            </div>
          </div>
          <button
            type="button"
            data-ocid="dashboard.kyc_verify.button"
            onClick={() => {
              setShowProfile(true);
              setProfileSubView("kyc");
            }}
            className="w-full mt-3 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#2563eb" }}
          >
            View Details
          </button>
        </div>
      )}

      {openOrders.length === 0 && (
        <div
          className="rounded-xl px-4 py-3.5"
          style={{ background: "#e3f2fd" }}
        >
          <p className="text-sm text-gray-700">
            We noticed you haven&apos;t started trading yet.{" "}
            <button
              type="button"
              onClick={() => setActiveTab("trade")}
              className="font-bold text-blue-700 underline"
            >
              Place your first trade
            </button>
          </p>
        </div>
      )}

      {/* Open positions */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 mb-3">
          Open positions ({openOrders.length})
        </h3>
        {openOrders.length === 0 ? (
          <div
            data-ocid="dashboard.open_positions.empty_state"
            className="border border-gray-200 rounded-2xl py-8 flex flex-col items-center gap-3"
          >
            <TreasureChestIcon />
            <p className="text-sm text-gray-500 text-center">
              You currently have no open positions.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {openOrders.slice(0, 3).map((o, i) => {
              const pnl = getLivePnL(o);
              const sym =
                orderInstrumentMap[String(o.instrumentId)] ||
                String(o.orderType).toUpperCase();
              return (
                <div
                  key={String(o.orderId)}
                  data-ocid={`dashboard.position.item.${i + 1}`}
                  className="border border-gray-200 rounded-xl px-4 py-3 flex justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900">{sym}</p>
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded"
                        style={{
                          background:
                            String(o.orderType) === "buy"
                              ? "#f0fdf4"
                              : "#fef2f2",
                          color:
                            String(o.orderType) === "buy"
                              ? "#16a34a"
                              : "#dc2626",
                        }}
                      >
                        {String(o.orderType).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{o.lotSize} lots</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {o.openPrice.toFixed(5)}
                    </p>
                    <p
                      className="text-xs font-bold"
                      style={{ color: pnl >= 0 ? "#16a34a" : "#dc2626" }}
                    >
                      {pnl >= 0 ? "+" : ""}
                      {fmt(pnl)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Sentiment */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900">Sentiment (24hr)</h3>
          <button type="button" className="text-gray-400">
            <HelpCircle size={14} />
          </button>
        </div>
        <div className="border border-gray-200 rounded-2xl p-4 flex">
          <div className="flex-1 flex flex-col items-center">
            <p className="text-xs text-gray-500 mb-1">Most bought</p>
            <button
              type="button"
              onClick={() => setActiveTab("trade")}
              className="text-xs font-bold text-gray-900 flex items-center gap-0.5 mb-2"
            >
              {sentimentState.mostBought}{" "}
              <ChevronRight size={12} className="text-blue-600" />
            </button>
            <SentimentGauge
              pct={Math.round(sentimentState.mostBoughtPct)}
              color="#16a34a"
            />
          </div>
          <div className="w-px bg-gray-100 mx-2" />
          <div className="flex-1 flex flex-col items-center">
            <p className="text-xs text-gray-500 mb-1">Most sold</p>
            <button
              type="button"
              onClick={() => setActiveTab("trade")}
              className="text-xs font-bold text-gray-900 flex items-center gap-0.5 mb-2"
            >
              {sentimentState.mostSold}{" "}
              <ChevronRight size={12} className="text-blue-600" />
            </button>
            <SentimentGauge
              pct={Math.round(sentimentState.mostSoldPct)}
              color="#dc2626"
            />
          </div>
        </div>
      </section>

      {/* Most traded instruments */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 mb-3">
          Most traded instruments (1hr)
        </h3>
        <div
          className="flex gap-3 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {homeMarketData.map((inst, i) => (
            <button
              type="button"
              key={inst.symbol}
              data-ocid={`dashboard.instrument.item.${i + 1}`}
              onClick={() => {
                setActiveTab("trade");
                setSelectedInstrument(
                  FX_MAJORS.find((f) => f.symbol === inst.symbol) ??
                    FX_MAJORS[0],
                );
              }}
              className="flex-shrink-0 border border-gray-200 rounded-xl p-3 text-left"
              style={{ minWidth: 144 }}
            >
              <p className="text-xs font-bold text-gray-900 truncate">
                {inst.name}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">
                {inst.orders}
              </p>
              <p className="text-xs text-gray-400">orders placed</p>
              <div className="flex h-1.5 rounded-full overflow-hidden mt-2 mb-2.5">
                <div
                  className="rounded-l-full"
                  style={{ width: "22%", background: "#dc2626" }}
                />
                <div
                  className="rounded-r-full flex-1"
                  style={{ background: "#16a34a" }}
                />
              </div>
              <div className="flex gap-1.5">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: "#fef2f2", color: "#dc2626" }}
                >
                  {inst.sellPrice}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: "#f0fdf4", color: "#16a34a" }}
                >
                  {inst.buyPrice}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Most profitable instrument */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 mb-3">
          Most profitable instrument (1hr)
        </h3>
        <div
          className="flex gap-3 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {homeMarketData.slice(0, 3).map((inst, i) => (
            <div
              key={`profitable-${inst.symbol}`}
              data-ocid={`dashboard.profitable.item.${i + 1}`}
              className="flex-shrink-0 border border-gray-200 rounded-xl p-3"
              style={{ minWidth: 144 }}
            >
              <p className="text-xs font-bold text-gray-900 truncate">
                {inst.name}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">
                {inst.orders}
              </p>
              <p className="text-xs text-gray-400">orders placed</p>
              <div className="flex h-1.5 rounded-full overflow-hidden mt-2 mb-2.5">
                <div
                  className="rounded-l-full"
                  style={{ width: "30%", background: "#dc2626" }}
                />
                <div
                  className="rounded-r-full flex-1"
                  style={{ background: "#16a34a" }}
                />
              </div>
              <div className="flex gap-1.5">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: "#fef2f2", color: "#dc2626" }}
                >
                  {inst.sellPrice}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: "#f0fdf4", color: "#16a34a" }}
                >
                  {inst.buyPrice}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Latest signals */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900">Latest signals</h3>
          <button type="button" className="text-xs text-blue-600 font-semibold">
            View all signals
          </button>
        </div>
        <div
          className="flex gap-3 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {liveSignals.map((sig, i) => (
            <div
              key={sig.instrument}
              data-ocid={`dashboard.signal.item.${i + 1}`}
              className="flex-shrink-0 border border-gray-200 rounded-2xl p-4"
              style={{ minWidth: 210 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: sig.side === "Sell" ? "#fef2f2" : "#f0fdf4",
                    color: sig.side === "Sell" ? "#dc2626" : "#16a34a",
                  }}
                >
                  {sig.side}
                </span>
                <span className="text-xs font-bold text-gray-900">
                  {sig.instrument}
                </span>
                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full ml-auto">
                  {sig.timeframe}
                </span>
              </div>
              <p className="text-base font-bold text-gray-900 text-center mb-3">
                Live: {sig.price}
              </p>
              <div className="relative flex items-center mb-1">
                <div
                  className="flex-1 h-0.5 rounded"
                  style={{ background: "#e2e8f0" }}
                />
                <div className="w-2 h-2 rounded-full bg-gray-800 mx-1 flex-shrink-0" />
                <div
                  className="flex-1 h-0.5 rounded"
                  style={{ background: "#e2e8f0" }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mb-3">
                <span>TP: {sig.tp}</span>
                <span>SL: {sig.sl}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-200"
                >
                  <MoreVertical size={12} className="text-gray-500" />
                </button>
                <button
                  type="button"
                  data-ocid={`dashboard.signal.fill_button.${i + 1}`}
                  onClick={() => setActiveTab("trade")}
                  className="flex-1 py-1.5 rounded-full border border-gray-200 text-xs font-semibold text-gray-700"
                >
                  Fill order ticket
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trending upwards */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900">Trending upwards</h3>
          <button type="button" className="text-gray-400">
            <HelpCircle size={14} />
          </button>
        </div>
        <div
          className="flex gap-3 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {TRENDING_UP.map((t, i) => {
            const livePct = getChangePct(t.name);
            const livePrice = livePrices[t.name];
            const displayPrice = livePrice
              ? t.name.includes("JPY")
                ? livePrice.toFixed(3)
                : livePrice > 1000
                  ? livePrice.toFixed(0)
                  : livePrice.toFixed(5)
              : t.price;
            const pctStr = `${livePct >= 0 ? "+" : ""}${livePct.toFixed(2)}%`;
            const pctColor = livePct >= 0 ? "#16a34a" : "#dc2626";
            return (
              <div
                key={`up-${t.name}`}
                data-ocid={`dashboard.trending_up.item.${i + 1}`}
                className="flex-shrink-0 border border-gray-200 rounded-xl p-3"
                style={{ minWidth: 120 }}
              >
                <Sparkline data={t.data} color={pctColor} />
                <p className="text-xs font-bold text-gray-900 mt-1.5">
                  {t.name}
                </p>
                <p className="text-xs font-semibold text-gray-700">
                  {displayPrice}
                </p>
                <p className="text-xs font-bold" style={{ color: pctColor }}>
                  {pctStr} Daily
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trending downwards */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900">
            Trending downwards
          </h3>
          <button type="button" className="text-gray-400">
            <HelpCircle size={14} />
          </button>
        </div>
        <div
          className="flex gap-3 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {TRENDING_DOWN.map((t, i) => {
            const livePct = getChangePct(t.name);
            const livePrice = livePrices[t.name];
            const displayPrice = livePrice
              ? t.name.includes("JPY")
                ? livePrice.toFixed(3)
                : livePrice > 1000
                  ? livePrice.toFixed(0)
                  : livePrice.toFixed(5)
              : t.price;
            const pctStr = `${livePct >= 0 ? "+" : ""}${livePct.toFixed(2)}%`;
            const pctColor = livePct >= 0 ? "#16a34a" : "#dc2626";
            return (
              <div
                key={`down-${t.name}`}
                data-ocid={`dashboard.trending_down.item.${i + 1}`}
                className="flex-shrink-0 border border-gray-200 rounded-xl p-3"
                style={{ minWidth: 120 }}
              >
                <Sparkline data={t.data} color={pctColor} />
                <p className="text-xs font-bold text-gray-900 mt-1.5">
                  {t.name}
                </p>
                <p className="text-xs font-semibold text-gray-700">
                  {displayPrice}
                </p>
                <p className="text-xs font-bold" style={{ color: pctColor }}>
                  {pctStr} Daily
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Connect Wallet CTA */}
      <div
        data-ocid="dashboard.connect_wallet.card"
        className="rounded-2xl p-5"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
            <Wallet size={20} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Connect Your Wallet</p>
            <p className="text-xs text-gray-400">
              MetaMask, Trust Wallet &amp; more
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-300 mb-3">
          Link your external wallet for seamless deposits and faster
          verification.
        </p>
        <button
          type="button"
          data-ocid="dashboard.connect_wallet.primary_button"
          onClick={() => {
            setActiveTab("funds");
            setFundsSubTab("wallet");
          }}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: "#2563eb" }}
        >
          Connect Wallet
        </button>
      </div>

      {/* Footer */}
      <div
        data-ocid="dashboard.footer.section"
        className="text-center py-5 border-t border-gray-100 mt-2"
      >
        <p className="text-sm font-bold text-gray-700">Mtextrading</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Thank you for choosing Mtextrading!
        </p>
      </div>
    </div>
  );

  // ─── Trade Tab ────────────────────────────────────────────────────────────
  const allInstruments = Object.values(CATEGORY_INSTRUMENTS)
    .flat()
    .filter(
      (inst, idx, self) =>
        self.findIndex((x) => x.symbol === inst.symbol) === idx,
    );
  const displayedInstruments =
    tradeCategory === "Favourites"
      ? allInstruments.filter((i) => favorites.includes(i.symbol))
      : (CATEGORY_INSTRUMENTS[tradeCategory] ?? FX_MAJORS);

  const watchlistInstruments = allInstruments.filter((i) =>
    watchlist.includes(i.symbol),
  );

  const toggleFavorite = (symbol: string) => {
    setFavorites((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol],
    );
  };

  const POPULAR_SEARCHES = ["BITCOIN", "WTI CRUDE OIL", "XAUUSD", "US 500"];
  const searchResults =
    searchQuery.length >= 3
      ? allInstruments.filter(
          (i) =>
            i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : [];

  const getAlertPrice = () => {
    if (!selectedInstrument) return "";
    const base =
      alertSide === "sell"
        ? Number.parseFloat(selectedInstrument.sellPrice.replace(/,/g, ""))
        : Number.parseFloat(selectedInstrument.buyPrice.replace(/,/g, ""));
    const pct = Number.parseFloat(alertPctInput) / 100;
    const direction = alertPct?.startsWith("-") ? -1 : 1;
    const result = base * (1 + direction * pct);
    return result.toFixed(5);
  };

  const savePriceAlert = () => {
    if (!selectedInstrument) return;
    const key = `alerts_${selectedInstrument.symbol}`;
    const existing = JSON.parse(localStorage.getItem(key) ?? "[]");
    const alert = {
      side: alertSide,
      pct: alertPctInput,
      price: getAlertPrice(),
      note: alertNote,
      createdAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify([...existing, alert]));
    toast.success("Price alert saved");
    setAlertNote("");
    setAlertPct(null);
  };

  const getAlertCount = (symbol: string) => {
    const key = `alerts_${symbol}`;
    try {
      return JSON.parse(localStorage.getItem(key) ?? "[]").length;
    } catch {
      return 0;
    }
  };

  const TradeTab = selectedInstrument ? (
    <div className="px-4 pb-6">
      {/* Back header */}
      <div className="flex items-center justify-between py-3 mb-3">
        <button
          type="button"
          data-ocid="dashboard.order_ticket.back_button"
          onClick={() => {
            setSelectedInstrument(null);
            setActiveDetailTab("Order ticket");
          }}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h3 className="text-sm font-bold text-gray-900">
          {selectedInstrument.symbol}
        </h3>
        <button
          type="button"
          onClick={() => toggleFavorite(selectedInstrument.symbol)}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <Star
            size={18}
            fill={
              favorites.includes(selectedInstrument.symbol) ? "#f59e0b" : "none"
            }
            className={
              favorites.includes(selectedInstrument.symbol)
                ? "text-amber-400"
                : "text-gray-400"
            }
          />
        </button>
      </div>

      {/* Sub-tabs */}
      <div
        className="flex gap-1.5 overflow-x-auto pb-2 mb-4"
        style={{ scrollbarWidth: "none" }}
      >
        {["Chart", "Order ticket", "Info", "Related", "Insights", "Alerts"].map(
          (tab) => (
            <button
              type="button"
              key={tab}
              data-ocid={`dashboard.order_ticket.${tab.toLowerCase().replace(/ /g, "_")}.tab`}
              onClick={() => setActiveDetailTab(tab)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border"
              style={{
                background: activeDetailTab === tab ? "#1a2332" : "white",
                color: activeDetailTab === tab ? "white" : "#374151",
                borderColor: activeDetailTab === tab ? "#1a2332" : "#e2e8f0",
              }}
            >
              {tab}
            </button>
          ),
        )}
      </div>

      {/* ── Chart Tab ── */}
      {activeDetailTab === "Chart" && (
        <div>
          {/* Chart mode toggle */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-3">
            <button
              type="button"
              data-ocid="dashboard.chart.tradingview.toggle"
              onClick={() => setChartMode("tradingview")}
              className="flex-1 py-2 text-xs font-bold transition-colors"
              style={{
                background: chartMode === "tradingview" ? "#1a2332" : "white",
                color: chartMode === "tradingview" ? "white" : "#6b7280",
              }}
            >
              TradingView
            </button>
            <button
              type="button"
              data-ocid="dashboard.chart.mtchart.toggle"
              onClick={() => setChartMode("mtchart")}
              className="flex-1 py-2 text-xs font-bold transition-colors"
              style={{
                background: chartMode === "mtchart" ? "#1a2332" : "white",
                color: chartMode === "mtchart" ? "white" : "#6b7280",
              }}
            >
              MT Chart
            </button>
          </div>

          {chartMode === "tradingview" ? (
            <div className="rounded-xl overflow-hidden border border-gray-100 mb-4">
              <iframe
                src={`https://s.tradingview.com/widgetembed/?frameElementId=tv_chart&symbol=${encodeURIComponent(getTvSymbol(selectedInstrument.symbol))}&interval=5&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=f1f3f6&studies=Volume%40tv-basicstudies&theme=Light&style=1&timezone=Etc%2FUTC&withdateranges=1&locale=en`}
                style={{ width: "100%", height: 340, border: "none" }}
                title="TradingView Chart"
              />
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden border border-gray-100 mb-4">
              <MTChart
                symbol={selectedInstrument.symbol}
                currentPrice={Number.parseFloat(
                  selectedInstrument.buyPrice.replace(/,/g, ""),
                )}
                openOrders={openOrders
                  .filter((o) => {
                    const sym =
                      orderInstrumentMap[String(o.instrumentId)] || "";
                    return sym === selectedInstrument.symbol || sym === "";
                  })
                  .map((o) => ({
                    orderId: o.orderId,
                    openPrice: o.openPrice,
                    takeProfit: o.takeProfit,
                    stopLoss: o.stopLoss,
                    orderType: String(o.orderType),
                  }))}
              />
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">
              Sentiment (15m)
            </p>
            <div className="relative h-5 rounded-full overflow-hidden flex">
              <div
                className="flex-1 flex items-center justify-start pl-3"
                style={{ background: "#dc2626" }}
              >
                <span className="text-white text-xs font-bold">50% Sell</span>
              </div>
              <div
                className="flex-1 flex items-center justify-end pr-3"
                style={{ background: "#16a34a" }}
              >
                <span className="text-white text-xs font-bold">50% Buy</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Order Ticket Tab ── */}
      {activeDetailTab === "Order ticket" && (
        <div>
          {/* Sell / Buy buttons */}
          <div className="flex rounded-2xl overflow-hidden border border-gray-200 mb-3">
            <button
              type="button"
              data-ocid="dashboard.order_ticket.sell_button"
              onClick={() => setOrderSide("sell")}
              className="flex-1 py-3.5 text-sm font-bold transition-colors"
              style={{
                background: orderSide === "sell" ? "#dc2626" : "white",
                color: orderSide === "sell" ? "white" : "#dc2626",
              }}
            >
              ↓ Sell {selectedInstrument.sellPrice}
            </button>
            <button
              type="button"
              data-ocid="dashboard.order_ticket.buy_button"
              onClick={() => setOrderSide("buy")}
              className="flex-1 py-3.5 text-sm font-bold transition-colors"
              style={{
                background: orderSide === "buy" ? "#16a34a" : "white",
                color: orderSide === "buy" ? "white" : "#16a34a",
              }}
            >
              Buy {selectedInstrument.buyPrice} ↑
            </button>
          </div>

          {/* Market / Limit toggle */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-4">
            <button
              type="button"
              data-ocid="dashboard.order_ticket.market_toggle"
              onClick={() => setOrderMode("market")}
              className="flex-1 py-2 text-xs font-bold transition-colors"
              style={{
                background: orderMode === "market" ? "#1a2332" : "white",
                color: orderMode === "market" ? "white" : "#6b7280",
              }}
            >
              Market
            </button>
            <button
              type="button"
              data-ocid="dashboard.order_ticket.limit_toggle"
              onClick={() => setOrderMode("limit")}
              className="flex-1 py-2 text-xs font-bold transition-colors"
              style={{
                background: orderMode === "limit" ? "#1a2332" : "white",
                color: orderMode === "limit" ? "white" : "#6b7280",
              }}
            >
              Limit
            </button>
          </div>

          {/* Open at (only for limit orders) */}
          {orderMode === "limit" && (
            <div className="py-2 border-b border-gray-100 mb-2">
              <p className="text-xs font-semibold text-gray-500 mb-1">
                Open at price
              </p>
              <input
                type="number"
                step="0.00001"
                value={openAtValue}
                onChange={(e) => setOpenAtValue(e.target.value)}
                data-ocid="dashboard.order_ticket.open_at.input"
                className="w-full py-2 px-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 text-center focus:outline-none focus:border-blue-400"
              />
            </div>
          )}

          {/* Position size */}
          <p className="text-xs font-semibold text-gray-500 mb-2">
            Position size ({selectedInstrument.symbol})
          </p>
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() =>
                setOrderQty((v) =>
                  String(
                    Math.max(0.01, Number.parseFloat(v) - 0.01).toFixed(2),
                  ),
                )
              }
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-600"
            >
              −
            </button>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={orderQty}
              onChange={(e) => setOrderQty(e.target.value)}
              data-ocid="dashboard.order_ticket.position_size.input"
              className="flex-1 py-2 rounded-xl border border-gray-200 text-center text-sm font-semibold text-gray-900 focus:outline-none focus:border-blue-400"
            />
            <button
              type="button"
              onClick={() =>
                setOrderQty((v) =>
                  String((Number.parseFloat(v) + 0.01).toFixed(2)),
                )
              }
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-600"
            >
              +
            </button>
            <span className="text-xs text-gray-400 w-16">
              {(Number.parseFloat(orderQty) * 1000).toFixed(0)} units
            </span>
          </div>

          {/* Required margin */}
          {(() => {
            const reqMargin = (
              (Number.parseFloat(orderQty) *
                100000 *
                Number.parseFloat(
                  selectedInstrument.buyPrice.replace(/,/g, ""),
                )) /
              100
            ).toFixed(2);
            return (
              <p className="text-xs text-gray-400 mb-3 text-right">
                Required margin:{" "}
                <span className="font-semibold text-gray-600">
                  ${reqMargin}
                </span>
              </p>
            );
          })()}

          {/* Take profit */}
          <div className="py-3 border-b border-gray-100 mb-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Take profit</p>
              <button
                type="button"
                onClick={() => setTpEnabled((p) => !p)}
                className="w-10 h-5 rounded-full relative transition-colors flex-shrink-0"
                style={{ background: tpEnabled ? "#2563eb" : "#e5e7eb" }}
              >
                <div
                  className="w-4 h-4 rounded-full bg-white absolute top-0.5 shadow-sm transition-transform"
                  style={{
                    transform: tpEnabled
                      ? "translateX(22px)"
                      : "translateX(2px)",
                  }}
                />
              </button>
            </div>
            {tpEnabled && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const pip =
                      selectedInstrument.buyPrice.includes(".") &&
                      selectedInstrument.buyPrice.split(".")[1].length >= 4
                        ? 0.0001
                        : 0.01;
                    setTpValue((v) =>
                      String(
                        Math.max(
                          0.0001,
                          (Number.parseFloat(v) ||
                            Number.parseFloat(selectedInstrument.buyPrice)) -
                            pip,
                        ).toFixed(
                          selectedInstrument.buyPrice.split(".")[1]?.length ||
                            2,
                        ),
                      ),
                    );
                  }}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-600"
                >
                  −
                </button>
                <input
                  type="number"
                  step="0.00001"
                  value={tpValue}
                  onChange={(e) => setTpValue(e.target.value)}
                  data-ocid="dashboard.order_ticket.take_profit.input"
                  className="flex-1 py-2 rounded-xl border border-gray-200 text-center text-sm font-semibold text-gray-900 focus:outline-none focus:border-green-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    const pip =
                      selectedInstrument.buyPrice.includes(".") &&
                      selectedInstrument.buyPrice.split(".")[1].length >= 4
                        ? 0.0001
                        : 0.01;
                    setTpValue((v) =>
                      String(
                        (
                          (Number.parseFloat(v) ||
                            Number.parseFloat(selectedInstrument.buyPrice)) +
                          pip
                        ).toFixed(
                          selectedInstrument.buyPrice.split(".")[1]?.length ||
                            2,
                        ),
                      ),
                    );
                  }}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-600"
                >
                  +
                </button>
                <span className="text-xs text-green-600 w-14 font-semibold">
                  TP
                </span>
              </div>
            )}
          </div>

          {/* Stop loss */}
          <div className="py-3 border-b border-gray-100 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Stop loss</p>
              <button
                type="button"
                onClick={() => setSlEnabled((p) => !p)}
                className="w-10 h-5 rounded-full relative transition-colors flex-shrink-0"
                style={{ background: slEnabled ? "#2563eb" : "#e5e7eb" }}
              >
                <div
                  className="w-4 h-4 rounded-full bg-white absolute top-0.5 shadow-sm transition-transform"
                  style={{
                    transform: slEnabled
                      ? "translateX(22px)"
                      : "translateX(2px)",
                  }}
                />
              </button>
            </div>
            {slEnabled && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const pip =
                      selectedInstrument.buyPrice.includes(".") &&
                      selectedInstrument.buyPrice.split(".")[1].length >= 4
                        ? 0.0001
                        : 0.01;
                    setSlValue((v) =>
                      String(
                        Math.max(
                          0.0001,
                          (Number.parseFloat(v) ||
                            Number.parseFloat(selectedInstrument.buyPrice)) -
                            pip,
                        ).toFixed(
                          selectedInstrument.buyPrice.split(".")[1]?.length ||
                            2,
                        ),
                      ),
                    );
                  }}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-600"
                >
                  −
                </button>
                <input
                  type="number"
                  step="0.00001"
                  value={slValue}
                  onChange={(e) => setSlValue(e.target.value)}
                  data-ocid="dashboard.order_ticket.stop_loss.input"
                  className="flex-1 py-2 rounded-xl border border-gray-200 text-center text-sm font-semibold text-gray-900 focus:outline-none focus:border-red-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    const pip =
                      selectedInstrument.buyPrice.includes(".") &&
                      selectedInstrument.buyPrice.split(".")[1].length >= 4
                        ? 0.0001
                        : 0.01;
                    setSlValue((v) =>
                      String(
                        (
                          (Number.parseFloat(v) ||
                            Number.parseFloat(selectedInstrument.buyPrice)) +
                          pip
                        ).toFixed(
                          selectedInstrument.buyPrice.split(".")[1]?.length ||
                            2,
                        ),
                      ),
                    );
                  }}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-600"
                >
                  +
                </button>
                <span className="text-xs text-red-500 w-14 font-semibold">
                  SL
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            data-ocid="dashboard.order_ticket.place_order.button"
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder}
            className="w-full py-4 rounded-2xl text-sm font-bold mb-3 flex items-center justify-center gap-2"
            style={{
              background: isPlacingOrder
                ? "#9ca3af"
                : orderSide === "buy"
                  ? "#16a34a"
                  : "#dc2626",
              color: "white",
            }}
          >
            {isPlacingOrder && <Loader2 size={16} className="animate-spin" />}
            {isPlacingOrder ? "Placing order..." : `Place ${orderSide} order`}
          </button>
          <p className="text-xs text-gray-400 text-center">
            One click trading is {oneClickTrading ? "active" : "inactive"}.{" "}
            <button
              type="button"
              className="underline text-gray-500"
              onClick={() => toggleOneClickTrading()}
            >
              {oneClickTrading ? "Disable" : "Enable"}
            </button>
          </p>
        </div>
      )}

      {/* ── Info Tab ── */}
      {activeDetailTab === "Info" &&
        (() => {
          const info = getInstrumentInfo(selectedInstrument.symbol);
          const Row = ({ label, value }: { label: string; value: string }) => (
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-500">{label}</span>
              <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">
                {value}
              </span>
            </div>
          );
          return (
            <div className="pb-4">
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
                  Market info
                </p>
                <Row label="Description" value={info.description} />
                <Row label="Contract size" value={info.contractSize} />
                <Row label="Tick size" value={info.tickSize} />
                <Row label="Decimal places" value={info.decimalPlaces} />
                <Row label="Minimum quantity" value={info.minQty} />
                <Row label="Maximum quantity" value={info.maxQty} />
                <Row label="Minimum stop level" value={info.minStopLevel} />
              </div>
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
                  Margin info
                </p>
                <Row label="Margin calculation mode" value={info.marginMode} />
              </div>
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
                  Swap info
                </p>
                <Row label="Calculation type" value="In points" />
                <Row label="Long rate" value={info.longRate} />
                <Row label="Short rate" value={info.shortRate} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                    Session info (Trade)
                  </p>
                  <span className="text-xs text-gray-400">GMT +0</span>
                </div>
                {[
                  { day: "Monday", hours: "00:00 – 20:55, 21:15 – 00:00" },
                  { day: "Tuesday", hours: "00:00 – 20:55, 21:15 – 00:00" },
                  { day: "Wednesday", hours: "00:00 – 20:55, 21:15 – 00:00" },
                  { day: "Thursday", hours: "00:00 – 20:55, 21:15 – 00:00" },
                  { day: "Friday", hours: "00:00 – 20:55" },
                  { day: "Saturday", hours: "Market closed" },
                  { day: "Sunday", hours: "22:15 – 00:00" },
                ].map(({ day, hours }) => (
                  <div
                    key={day}
                    className="flex justify-between py-3 border-b border-gray-100"
                  >
                    <span className="text-sm text-gray-500">{day}</span>
                    <span
                      className={`text-sm font-medium text-right ${hours === "Market closed" ? "text-red-500" : "text-gray-900"}`}
                    >
                      {hours}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

      {/* ── Related Tab ── */}
      {activeDetailTab === "Related" &&
        (() => {
          const cat = Object.entries(CATEGORY_INSTRUMENTS).find(([, insts]) =>
            insts.some((i) => i.symbol === selectedInstrument.symbol),
          );
          const related = (cat ? cat[1] : FX_MAJORS)
            .filter((i) => i.symbol !== selectedInstrument.symbol)
            .slice(0, 4);
          return (
            <div>
              {related.map((inst, i) => (
                <button
                  type="button"
                  key={inst.symbol}
                  data-ocid={`dashboard.related.item.${i + 1}`}
                  onClick={() => setSelectedInstrument(inst)}
                  className="w-full flex items-center py-3.5 border-b border-gray-100"
                >
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-gray-900">
                      {inst.name}
                    </p>
                    <p
                      className="text-xs font-semibold"
                      style={{
                        color:
                          getChangePct(inst.symbol) >= 0
                            ? "#16a34a"
                            : "#dc2626",
                      }}
                    >
                      {formatChangePct(inst.symbol)}
                    </p>
                  </div>
                  <div className="w-20 flex justify-center">
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded"
                      style={{ background: "#fef2f2", color: "#dc2626" }}
                    >
                      {inst.sellPrice}
                    </span>
                  </div>
                  <div className="w-20 flex justify-center">
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded"
                      style={{ background: "#f0fdf4", color: "#16a34a" }}
                    >
                      {inst.buyPrice}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(inst.symbol);
                    }}
                    className="ml-2 p-1"
                  >
                    <Star
                      size={14}
                      fill={
                        favorites.includes(inst.symbol) ? "#f59e0b" : "none"
                      }
                      className={
                        favorites.includes(inst.symbol)
                          ? "text-amber-400"
                          : "text-gray-300"
                      }
                    />
                  </button>
                </button>
              ))}
            </div>
          );
        })()}

      {/* ── Insights Tab ── */}
      {activeDetailTab === "Insights" && (
        <div className="pb-4 space-y-5">
          <div>
            <p className="text-sm font-bold text-gray-900 mb-1">
              We gather and analyse market news via our partner Trading Central
              to support your strategies.
            </p>
            <p className="text-xs text-gray-500">
              Discover trends, sentiment signals, and data-driven insights to
              inform your decisions.
            </p>
          </div>

          {/* Mention sources */}
          <div>
            <div className="flex items-center gap-1 mb-2">
              <p className="text-xs font-bold text-gray-700">
                Mention sources (24hr)
              </p>
              <HelpCircle size={12} className="text-gray-400" />
            </div>
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-700">News providers</span>
              </div>
              <div className="relative w-14 h-14">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 56 56"
                  width="56"
                  height="56"
                >
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="6"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="6"
                    strokeDasharray="138.2 138.2"
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    transform="rotate(-90 28 28)"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-blue-600">
                  100%
                </span>
              </div>
            </div>
          </div>

          {/* News provider mentions gauge */}
          <div>
            <div className="flex items-center gap-1 mb-2">
              <p className="text-xs font-bold text-gray-700">
                News provider mentions (24hr)
              </p>
              <HelpCircle size={12} className="text-gray-400" />
            </div>
            <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center">
              <svg
                aria-hidden="true"
                viewBox="0 0 120 70"
                width="120"
                height="70"
              >
                <path
                  d="M 10,60 A 50,50 0 0,1 110,60"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                <path
                  d="M 10,60 A 50,50 0 0,1 110,60"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="10"
                  strokeLinecap="round"
                  pathLength="100"
                  strokeDasharray="60 100"
                />
                <text
                  x="60"
                  y="58"
                  textAnchor="middle"
                  fontSize="18"
                  fontWeight="700"
                  fill="#1a2332"
                >
                  4
                </text>
              </svg>
              <span className="text-xs font-semibold text-gray-500 mt-1">
                Average
              </span>
            </div>
          </div>

          {/* Most discussed topics */}
          <div>
            <div className="flex items-center gap-1 mb-2">
              <p className="text-xs font-bold text-gray-700">
                Most discussed news provider topics
              </p>
              <HelpCircle size={12} className="text-gray-400" />
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              {[
                { topic: "Macro Indicator Decrease", count: 1, pct: 100 },
                { topic: "Central Bank Policy", count: 3, pct: 70 },
                { topic: "Market Volatility", count: 2, pct: 50 },
              ].map(({ topic, count, pct }) => (
                <div key={topic} className="flex items-center gap-2 mb-2">
                  <div className="flex-1">
                    <p className="text-xs text-gray-700 mb-1">{topic}</p>
                    <div className="h-2 rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-4 text-right">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mention history bar chart */}
          <div>
            <div className="flex items-center gap-1 mb-2">
              <p className="text-xs font-bold text-gray-700">
                News provider mention history
              </p>
              <HelpCircle size={12} className="text-gray-400" />
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <svg
                aria-hidden="true"
                viewBox="0 0 280 100"
                width="100%"
                height="100"
              >
                {[
                  { x: 20, h: 40, label: "21 Feb" },
                  { x: 72, h: 65, label: "28 Feb" },
                  { x: 124, h: 30, label: "07 Mar" },
                  { x: 176, h: 80, label: "14 Mar" },
                  { x: 228, h: 50, label: "22 Mar" },
                ].map(({ x, h, label }) => (
                  <g key={label}>
                    <rect
                      x={x}
                      y={85 - h}
                      width="30"
                      height={h}
                      rx="3"
                      fill="#2563eb"
                      opacity="0.8"
                    />
                    <text
                      x={x + 15}
                      y="98"
                      textAnchor="middle"
                      fontSize="7"
                      fill="#9ca3af"
                    >
                      {label}
                    </text>
                  </g>
                ))}
                {[0, 5, 10, 15].map((v) => (
                  <text
                    key={v}
                    x="8"
                    y={88 - v * 5.5}
                    textAnchor="middle"
                    fontSize="7"
                    fill="#9ca3af"
                  >
                    {v}
                  </text>
                ))}
              </svg>
            </div>
          </div>

          {/* Sentiment score & signal */}
          <div>
            <div className="flex items-center gap-1 mb-2">
              <p className="text-xs font-bold text-gray-700">
                Sentiment score & signal (24hr)
              </p>
              <HelpCircle size={12} className="text-gray-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 120 70"
                  width="100"
                  height="60"
                >
                  <path
                    d="M 10,60 A 50,50 0 0,1 110,60"
                    fill="none"
                    stroke="#fee2e2"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 10,60 A 50,50 0 0,1 110,60"
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="10"
                    strokeLinecap="round"
                    pathLength="100"
                    strokeDasharray="35 100"
                  />
                  <text
                    x="60"
                    y="58"
                    textAnchor="middle"
                    fontSize="18"
                    fontWeight="700"
                    fill="#dc2626"
                  >
                    35
                  </text>
                </svg>
                <span className="text-xs text-center font-semibold text-gray-600 mt-1">
                  Negative sentiment
                </span>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 40 40"
                  width="48"
                  height="48"
                >
                  <polyline
                    points="5,10 15,30 25,15 35,35"
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points="25,35 35,35 35,25"
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-xs text-center font-semibold text-gray-600 mt-1">
                  Bearish signal
                </span>
              </div>
            </div>
          </div>

          {/* Sentiment history line chart */}
          <div>
            <div className="flex items-center gap-1 mb-2">
              <p className="text-xs font-bold text-gray-700">
                Sentiment history
              </p>
              <HelpCircle size={12} className="text-gray-400" />
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <svg
                aria-hidden="true"
                viewBox="0 0 280 100"
                width="100%"
                height="100"
              >
                <polyline
                  points="0,40 56,35 112,50 168,30 224,45 280,25"
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="2"
                />
                <polyline
                  points="0,60 56,55 112,65 168,50 224,60 280,55"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2"
                />
                <polyline
                  points="0,75 56,80 112,70 168,85 224,75 280,80"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="2"
                />
                {["Nov", "Dec", "Jan", "Feb", "Mar"].map((m, i) => (
                  <text
                    key={m}
                    x={i * 65 + 10}
                    y="98"
                    fontSize="8"
                    fill="#9ca3af"
                  >
                    {m}
                  </text>
                ))}
                <text x="272" y="28" fontSize="7" fill="#16a34a">
                  Bull
                </text>
                <text x="272" y="57" fontSize="7" fill="#2563eb">
                  Neut
                </text>
                <text x="272" y="82" fontSize="7" fill="#dc2626">
                  Bear
                </text>
              </svg>
            </div>
          </div>

          {/* Subjectivity & confidence */}
          <div>
            <div className="flex items-center gap-1 mb-2">
              <p className="text-xs font-bold text-gray-700">
                Subjectivity & confidence (24hr)
              </p>
              <HelpCircle size={12} className="text-gray-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 120 70"
                  width="100"
                  height="60"
                >
                  <path
                    d="M 10,60 A 50,50 0 0,1 110,60"
                    fill="none"
                    stroke="#dbeafe"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 10,60 A 50,50 0 0,1 110,60"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="10"
                    strokeLinecap="round"
                    pathLength="100"
                    strokeDasharray="29 100"
                  />
                  <text
                    x="60"
                    y="58"
                    textAnchor="middle"
                    fontSize="18"
                    fontWeight="700"
                    fill="#2563eb"
                  >
                    29
                  </text>
                </svg>
                <span className="text-xs text-center font-semibold text-gray-600 mt-1">
                  Low subjectivity
                </span>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 40 40"
                  width="48"
                  height="48"
                >
                  <polyline
                    points="5,35 15,15 25,25 35,5"
                    fill="none"
                    stroke="#1a2332"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points="25,5 35,5 35,15"
                    fill="none"
                    stroke="#1a2332"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-xs text-center font-semibold text-gray-600 mt-1">
                  High confidence
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Alerts Tab ── */}
      {activeDetailTab === "Alerts" && (
        <div className="pb-4">
          <p className="text-sm font-bold text-gray-900 mb-4">
            Create price alert
          </p>

          {/* Sell/Buy toggle */}
          <div className="flex rounded-full border border-gray-200 overflow-hidden mb-4 text-sm font-semibold">
            <button
              type="button"
              data-ocid="dashboard.alerts.sell_toggle"
              onClick={() => setAlertSide("sell")}
              className="flex-1 py-2.5 text-center transition-colors"
              style={{
                background: alertSide === "sell" ? "#1a2332" : "white",
                color: alertSide === "sell" ? "white" : "#374151",
              }}
            >
              Sell {selectedInstrument.sellPrice}
            </button>
            <button
              type="button"
              data-ocid="dashboard.alerts.buy_toggle"
              onClick={() => setAlertSide("buy")}
              className="flex-1 py-2.5 text-center transition-colors"
              style={{
                background: alertSide === "buy" ? "#1a2332" : "white",
                color: alertSide === "buy" ? "white" : "#374151",
              }}
            >
              Buy {selectedInstrument.buyPrice}
            </button>
          </div>

          <p className="text-xs font-semibold text-gray-600 mb-2">
            Price alert (% away)
          </p>
          <div
            className="flex gap-2 overflow-x-auto pb-2 mb-3"
            style={{ scrollbarWidth: "none" }}
          >
            {[
              "-10%",
              "-5%",
              "-4%",
              "-3%",
              "-2%",
              "-1%",
              "1%",
              "2%",
              "3%",
              "4%",
              "5%",
              "10%",
            ].map((p) => (
              <button
                type="button"
                key={p}
                data-ocid="dashboard.alerts.pct_pill"
                onClick={() => {
                  setAlertPct(p);
                  setAlertPctInput(p.replace("%", "").replace("-", ""));
                }}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
                style={{
                  borderColor: alertPct === p ? "#1a2332" : "#e2e8f0",
                  background: alertPct === p ? "#1a2332" : "white",
                  color: alertPct === p ? "white" : "#374151",
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Pct input row */}
          <div className="flex items-center gap-2 mb-1">
            <button
              type="button"
              onClick={() =>
                setAlertPctInput((v) =>
                  String(
                    Math.max(0.01, Number.parseFloat(v) - 0.01).toFixed(2),
                  ),
                )
              }
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 font-bold"
            >
              ↓
            </button>
            <div className="flex-1 flex items-center border border-blue-300 rounded-xl px-3 py-2 gap-1">
              <span className="text-blue-500 text-sm font-bold">%</span>
              <input
                type="number"
                value={alertPctInput}
                onChange={(e) => setAlertPctInput(e.target.value)}
                className="flex-1 text-sm font-bold text-gray-900 bg-transparent outline-none"
                step="0.01"
                min="0.01"
              />
            </div>
            <button
              type="button"
              onClick={() => setAlertPctInput("")}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 font-bold"
            >
              ✕
            </button>
            <button
              type="button"
              onClick={() =>
                setAlertPctInput((v) =>
                  String((Number.parseFloat(v) + 0.01).toFixed(2)),
                )
              }
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 font-bold"
            >
              ↑
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            {alertPctInput}% = {getAlertPrice()}
          </p>

          {!alertInfoDismissed && (
            <div className="bg-blue-50 rounded-xl p-3 mb-3 flex items-start justify-between gap-2">
              <p className="text-xs text-blue-700">
                You can modify input dynamics by tapping the icon within the
                input field.
              </p>
              <button
                type="button"
                onClick={() => setAlertInfoDismissed(true)}
                className="text-xs font-semibold text-blue-600 whitespace-nowrap"
              >
                OK understood!
              </button>
            </div>
          )}

          {/* Note */}
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 mb-4">
            <button
              type="button"
              className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-700"
            >
              Note
            </button>
            <input
              type="text"
              placeholder="Add note"
              value={alertNote}
              onChange={(e) => setAlertNote(e.target.value)}
              className="flex-1 text-sm text-gray-600 bg-transparent outline-none"
            />
          </div>

          <button
            type="button"
            data-ocid="dashboard.alerts.save_button"
            onClick={savePriceAlert}
            className="w-full py-4 rounded-2xl text-sm font-bold text-white mb-4"
            style={{ background: "#1a2332" }}
          >
            Save price alert
          </button>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {selectedInstrument.symbol} alerts (
              {getAlertCount(selectedInstrument.symbol)})
            </p>
            <p className="text-xs font-semibold text-blue-600">
              All alerts (0/16)
            </p>
          </div>
        </div>
      )}
    </div>
  ) : (
    <div className="px-4 pb-6">
      {/* Category bottom sheet */}
      <AnimatePresence>
        {showCategorySheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30"
              onClick={() => setShowCategorySheet(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </div>
              <p className="text-sm font-bold text-gray-900 px-5 py-3 border-b border-gray-100">
                Instrument list
              </p>
              {ALL_CATEGORIES.map((cat) => {
                const count =
                  cat === "Favourites"
                    ? favorites.length
                    : (CATEGORY_INSTRUMENTS[cat]?.length ?? 0);
                return (
                  <button
                    type="button"
                    key={cat}
                    data-ocid="dashboard.trade.category_sheet.item"
                    onClick={() => {
                      setTradeCategory(cat);
                      setShowCategorySheet(false);
                    }}
                    className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-50 hover:bg-gray-50"
                  >
                    <span className="text-sm text-gray-800">
                      {cat} ({count})
                    </span>
                    {tradeCategory === cat && (
                      <svg
                        aria-hidden="true"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M3 8L6.5 11.5L13 5"
                          stroke="#2563eb"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
              <div className="h-8" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 bg-white flex flex-col"
          >
            {/* Search header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="7"
                    cy="7"
                    r="5"
                    stroke="#9ca3af"
                    strokeWidth="1.5"
                  />
                  <line
                    x1="10.5"
                    y1="10.5"
                    x2="14"
                    y2="14"
                    stroke="#9ca3af"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Type at least 3 characters to search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
                  data-ocid="dashboard.trade.search_input"
                />
              </div>
              <button
                type="button"
                data-ocid="dashboard.trade.search_close"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="text-sm font-semibold text-blue-600"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {searchQuery.length < 3 ? (
                <div className="px-4 py-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                    Popular searches
                  </p>
                  {POPULAR_SEARCHES.map((name, i) => {
                    const inst = allInstruments.find(
                      (x) =>
                        x.name.toUpperCase().includes(name) ||
                        x.symbol.toUpperCase().includes(name),
                    );
                    return (
                      <button
                        type="button"
                        key={name}
                        data-ocid={`dashboard.trade.popular_search.item.${i + 1}`}
                        onClick={() => {
                          if (inst) {
                            setSelectedInstrument(inst);
                            if (!watchlist.includes(inst.symbol)) {
                              toggleWatchlist(inst.symbol);
                              toast.success("Added to watchlist");
                            }
                            setSearchOpen(false);
                            setSearchQuery("");
                          }
                        }}
                        className="w-full flex items-center justify-between py-3 border-b border-gray-100"
                      >
                        <span className="text-sm font-medium text-gray-800">
                          {name}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (inst) toggleFavorite(inst.symbol);
                          }}
                          className="p-1"
                        >
                          <Star
                            size={16}
                            fill={
                              inst && favorites.includes(inst.symbol)
                                ? "#f59e0b"
                                : "none"
                            }
                            className={
                              inst && favorites.includes(inst.symbol)
                                ? "text-amber-400"
                                : "text-gray-300"
                            }
                          />
                        </button>
                      </button>
                    );
                  })}
                </div>
              ) : searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4">
                  <p className="text-sm text-gray-500">
                    No results for "{searchQuery}"
                  </p>
                </div>
              ) : (
                <div className="px-4 py-2">
                  {searchResults.map((inst, i) => (
                    <button
                      type="button"
                      key={inst.symbol}
                      data-ocid={`dashboard.trade.search_result.item.${i + 1}`}
                      onClick={() => {
                        setSelectedInstrument(inst);
                        setSearchOpen(false);
                        setSearchQuery("");
                      }}
                      className="w-full flex items-center py-3.5 border-b border-gray-100"
                    >
                      <div className="flex-1 text-left">
                        <p className="text-sm font-bold text-gray-900">
                          {inst.name}
                        </p>
                        <p
                          className="text-xs font-semibold"
                          style={{
                            color:
                              getChangePct(inst.symbol) >= 0
                                ? "#16a34a"
                                : "#dc2626",
                          }}
                        >
                          {formatChangePct(inst.symbol)}
                        </p>
                      </div>
                      <div className="w-16 flex justify-center">
                        <span
                          className="text-xs font-semibold px-2 py-1 rounded"
                          style={{ background: "#fef2f2", color: "#dc2626" }}
                        >
                          {inst.sellPrice}
                        </span>
                      </div>
                      <div className="w-16 flex justify-center">
                        <span
                          className="text-xs font-semibold px-2 py-1 rounded"
                          style={{ background: "#f0fdf4", color: "#16a34a" }}
                        >
                          {inst.buyPrice}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(inst.symbol);
                        }}
                        className="ml-2 p-1"
                      >
                        <Star
                          size={14}
                          fill={
                            favorites.includes(inst.symbol) ? "#f59e0b" : "none"
                          }
                          className={
                            favorites.includes(inst.symbol)
                              ? "text-amber-400"
                              : "text-gray-300"
                          }
                        />
                      </button>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter row */}
      <div className="flex items-center justify-between py-3 mb-1">
        <button
          type="button"
          data-ocid="dashboard.trade.category.button"
          onClick={() => setShowCategorySheet(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-800"
        >
          {tradeCategory} <ChevronDown size={14} />
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            data-ocid="dashboard.trade.search_button"
            onClick={() => setSearchOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-600"
          >
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <circle
                cx="7"
                cy="7"
                r="5"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <line
                x1="10.5"
                y1="10.5"
                x2="14"
                y2="14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-600"
          >
            <BarChart2 size={16} />
          </button>
        </div>
      </div>
      <div className="flex items-center px-1 pb-2 text-xs text-gray-400">
        <span className="flex-1">Instrument</span>
        <span className="w-20 text-center">Sell</span>
        <span className="w-20 text-center">Buy</span>
      </div>
      {/* Watchlist section */}
      {watchlistInstruments.length > 0 && tradeCategory !== "Favourites" && (
        <div className="mb-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide px-1 py-2">
            Watchlist
          </p>
          {watchlistInstruments.map((inst, i) => (
            <button
              type="button"
              key={`wl-${inst.symbol}`}
              data-ocid={`dashboard.watchlist.item.${i + 1}`}
              onClick={() => {
                setSelectedInstrument(inst);
                setOrderSide("sell");
                setActiveDetailTab("Order ticket");
              }}
              className="w-full flex items-center py-3 border-b border-blue-50 bg-blue-50/30"
            >
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-gray-900">{inst.name}</p>
                <p
                  className="text-xs font-semibold"
                  style={{
                    color:
                      getChangePct(inst.symbol) >= 0 ? "#16a34a" : "#dc2626",
                  }}
                >
                  {formatChangePct(inst.symbol)}
                </p>
              </div>
              <div className="w-20 flex justify-center">
                <span
                  className="text-xs font-semibold px-2 py-1 rounded transition-colors duration-300"
                  style={{
                    background:
                      priceFlash[inst.symbol] === "down"
                        ? "#fecaca"
                        : "#fef2f2",
                    color: "#dc2626",
                  }}
                >
                  {formatLivePrice(inst.symbol, inst.sellPrice)}
                </span>
              </div>
              <div className="w-20 flex justify-center">
                <span
                  className="text-xs font-semibold px-2 py-1 rounded transition-colors duration-300"
                  style={{
                    background:
                      priceFlash[inst.symbol] === "up" ? "#bbf7d0" : "#f0fdf4",
                    color: "#16a34a",
                  }}
                >
                  {formatLivePrice(inst.symbol, inst.buyPrice)}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWatchlist(inst.symbol);
                }}
                className="ml-2 p-1"
              >
                <Star size={14} fill="#3b82f6" className="text-blue-500" />
              </button>
            </button>
          ))}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide px-1 py-2 mt-2">
            All Instruments
          </p>
        </div>
      )}
      {displayedInstruments.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <Star size={40} className="text-gray-200" />
          <p className="text-sm text-gray-500 text-center">
            {tradeCategory === "Favourites"
              ? "No favourites yet. Tap the star icon on any instrument to add it here."
              : "No instruments available."}
          </p>
        </div>
      ) : (
        displayedInstruments.map((inst, i) => (
          <button
            type="button"
            key={inst.symbol}
            data-ocid={`dashboard.trade.instrument.item.${i + 1}`}
            onClick={() => {
              setSelectedInstrument(inst);
              setOrderSide("sell");
              setActiveDetailTab("Order ticket");
            }}
            className="w-full flex items-center py-3.5 border-b border-gray-100"
          >
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-gray-900">{inst.name}</p>
              <p
                className="text-xs font-semibold"
                style={{
                  color: getChangePct(inst.symbol) >= 0 ? "#16a34a" : "#dc2626",
                }}
              >
                {formatChangePct(inst.symbol)}
              </p>
            </div>
            <div className="w-20 flex justify-center">
              <span
                className="text-xs font-semibold px-2 py-1 rounded transition-colors duration-300"
                style={{
                  background:
                    priceFlash[inst.symbol] === "down" ? "#fecaca" : "#fef2f2",
                  color: "#dc2626",
                }}
              >
                {formatLivePrice(inst.symbol, inst.sellPrice)}
              </span>
            </div>
            <div className="w-20 flex justify-center">
              <span
                className="text-xs font-semibold px-2 py-1 rounded transition-colors duration-300"
                style={{
                  background:
                    priceFlash[inst.symbol] === "up" ? "#bbf7d0" : "#f0fdf4",
                  color: "#16a34a",
                }}
              >
                {formatLivePrice(inst.symbol, inst.buyPrice)}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(inst.symbol);
              }}
              className="ml-2 p-1"
            >
              <Star
                size={14}
                fill={favorites.includes(inst.symbol) ? "#f59e0b" : "none"}
                className={
                  favorites.includes(inst.symbol)
                    ? "text-amber-400"
                    : "text-gray-300"
                }
              />
            </button>
          </button>
        ))
      )}
    </div>
  );

  const PositionsTab = (
    <div className="px-4 pb-6">
      <div
        className="flex gap-2 overflow-x-auto pb-3"
        style={{ scrollbarWidth: "none" }}
      >
        {(
          [
            ["open", "Open Positions"],
            ["pending", "Pending"],
            ["closed", "Closed"],
            ["history", "Balance history"],
          ] as [PositionsSubTab, string][]
        ).map(([key, label]) => (
          <button
            type="button"
            key={key}
            data-ocid={`dashboard.positions.${key}.tab`}
            onClick={() => setPosSubTab(key)}
            className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold border"
            style={{
              background: posSubTab === key ? "#1a2332" : "white",
              color: posSubTab === key ? "white" : "#374151",
              borderColor: posSubTab === key ? "#1a2332" : "#e2e8f0",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {posSubTab === "open" && (
        <div>
          {/* Margin call warning banner */}
          {activeAccount &&
            openOrders.length > 0 &&
            (() => {
              const usedMargin = openOrders.reduce(
                (s, o) => s + o.lotSize * 1000,
                0,
              );
              const isLow =
                activeAccount.equity > 0 &&
                activeAccount.equity < usedMargin * 1.5;
              return isLow ? (
                <div
                  data-ocid="dashboard.positions.margin_call.error_state"
                  className="mb-4 rounded-xl px-4 py-3 border"
                  style={{ background: "#fff7ed", borderColor: "#f97316" }}
                >
                  <p className="text-sm font-bold" style={{ color: "#c2410c" }}>
                    ⚠️ Margin Call Warning
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#9a3412" }}>
                    Your equity is approaching the required margin level.
                    Consider closing positions or depositing more funds.
                  </p>
                </div>
              ) : null;
            })()}
          <p className="text-sm font-bold text-gray-900 mb-4">
            Open profit / loss:{" "}
            <span style={{ color: totalPnL >= 0 ? "#16a34a" : "#dc2626" }}>
              {fmt(totalPnL)}
            </span>
          </p>
          {openOrders.length === 0 ? (
            <div
              data-ocid="dashboard.positions.open.empty_state"
              className="flex flex-col items-center gap-3 py-10"
            >
              <TreasureChestIcon />
              <p className="text-sm text-gray-500 text-center">
                You currently have no open positions.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {openOrders.map((o, i) => {
                const pnl = getLivePnL(o);
                const sym =
                  orderInstrumentMap[String(o.instrumentId)] ||
                  String(o.orderType).toUpperCase();
                const isExpanded = expandedOrderId === String(o.orderId);
                const swapFee = -(0.0002 * o.lotSize * 100000);
                return (
                  <div
                    key={String(o.orderId)}
                    data-ocid={`dashboard.open_order.item.${i + 1}`}
                    className="border border-gray-200 rounded-xl overflow-hidden"
                  >
                    <button
                      type="button"
                      className="w-full px-4 py-3 flex items-center justify-between"
                      onClick={() =>
                        setExpandedOrderId(
                          isExpanded ? null : String(o.orderId),
                        )
                      }
                    >
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">
                            {sym}
                          </span>
                          <span
                            className="text-xs font-bold px-1.5 py-0.5 rounded"
                            style={{
                              background:
                                String(o.orderType) === "buy"
                                  ? "#f0fdf4"
                                  : "#fef2f2",
                              color:
                                String(o.orderType) === "buy"
                                  ? "#16a34a"
                                  : "#dc2626",
                            }}
                          >
                            {String(o.orderType).toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {o.lotSize} lots @ {o.openPrice.toFixed(5)} · Swap: $
                          {swapFee.toFixed(2)}/day
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-sm font-bold"
                          style={{ color: pnl >= 0 ? "#16a34a" : "#dc2626" }}
                        >
                          {pnl >= 0 ? "+" : ""}
                          {fmt(pnl)}
                        </p>
                        <p className="text-xs text-gray-400">live P&L</p>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                        <div className="flex gap-3 mt-3 mb-3">
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-1">
                              Take Profit
                            </p>
                            <input
                              type="number"
                              step="0.00001"
                              value={
                                editingTP[String(o.orderId)] ??
                                String(o.takeProfit || "")
                              }
                              onChange={(e) =>
                                setEditingTP((p) => ({
                                  ...p,
                                  [String(o.orderId)]: e.target.value,
                                }))
                              }
                              data-ocid={`dashboard.position.tp_input.${i + 1}`}
                              className="w-full py-1.5 px-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-900 focus:outline-none focus:border-green-400"
                              placeholder="0 = disabled"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-1">
                              Stop Loss
                            </p>
                            <input
                              type="number"
                              step="0.00001"
                              value={
                                editingSL[String(o.orderId)] ??
                                String(o.stopLoss || "")
                              }
                              onChange={(e) =>
                                setEditingSL((p) => ({
                                  ...p,
                                  [String(o.orderId)]: e.target.value,
                                }))
                              }
                              data-ocid={`dashboard.position.sl_input.${i + 1}`}
                              className="w-full py-1.5 px-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-900 focus:outline-none focus:border-red-400"
                              placeholder="0 = disabled"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            data-ocid={`dashboard.position.close25.${i + 1}`}
                            onClick={() => handleCloseOrder(o, 0.25)}
                            disabled={closingOrderId === String(o.orderId)}
                            className="flex-1 py-2 rounded-lg text-xs font-bold border border-gray-300 text-gray-700"
                          >
                            Close 25%
                          </button>
                          <button
                            type="button"
                            data-ocid={`dashboard.position.close50.${i + 1}`}
                            onClick={() => handleCloseOrder(o, 0.5)}
                            disabled={closingOrderId === String(o.orderId)}
                            className="flex-1 py-2 rounded-lg text-xs font-bold border border-gray-300 text-gray-700"
                          >
                            Close 50%
                          </button>
                          <button
                            type="button"
                            data-ocid={`dashboard.position.close_all.${i + 1}`}
                            onClick={() => handleCloseOrder(o, 1)}
                            disabled={closingOrderId === String(o.orderId)}
                            className="flex-1 py-2 rounded-lg text-xs font-bold text-white"
                            style={{ background: "#dc2626" }}
                          >
                            {closingOrderId === String(o.orderId) ? (
                              <Loader2
                                size={12}
                                className="animate-spin mx-auto"
                              />
                            ) : (
                              "Close All"
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {posSubTab === "pending" && (
        <div className="flex flex-col items-center gap-3 py-10">
          <TreasureChestIcon />
          <p className="text-sm text-gray-500">No pending orders.</p>
        </div>
      )}
      {posSubTab === "closed" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-900">
              Closed orders ({closedOrders.length})
            </p>
            {closedOrders.length > 0 && (
              <button
                type="button"
                data-ocid="dashboard.positions.closed.download_button"
                onClick={() => {
                  const rows = [
                    [
                      "Symbol",
                      "Type",
                      "Lot Size",
                      "Entry Price",
                      "Close Price",
                      "P&L",
                      "Open Time",
                      "Close Time",
                    ],
                    ...closedOrders.map((o) => [
                      orderInstrumentMap[String(o.orderId)] ||
                        orderInstrumentMap[String(o.instrumentId)] ||
                        String(o.instrumentId),
                      String(o.orderType) === "buy" ? "Buy" : "Sell",
                      String(o.lotSize),
                      String(o.openPrice),
                      o.closePrice != null ? String(o.closePrice) : "",
                      o.profitLoss != null ? String(o.profitLoss) : "",
                      new Date(Number(o.openTime) / 1_000_000).toLocaleString(),
                      o.closeTime
                        ? new Date(
                            Number(o.closeTime) / 1_000_000,
                          ).toLocaleString()
                        : "",
                    ]),
                  ];
                  const csv = rows.map((r) => r.join(",")).join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "trading_history.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50"
              >
                <FileText size={12} />
                Download CSV
              </button>
            )}
          </div>
          {closedOrders.length === 0 ? (
            <div
              data-ocid="dashboard.positions.closed.empty_state"
              className="flex flex-col items-center gap-3 py-10"
            >
              <TreasureChestIcon />
              <p className="text-sm text-gray-500 text-center">
                No closed orders yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {closedOrders.map((o, i) => {
                const sym =
                  orderInstrumentMap[String(o.instrumentId)] ||
                  `#${String(o.instrumentId)}`;
                const pnl = o.profitLoss ?? 0;
                const openMs = Number(o.openTime) / 1_000_000;
                const closeMs = o.closeTime
                  ? Number(o.closeTime) / 1_000_000
                  : null;
                const durationMs = closeMs ? closeMs - openMs : 0;
                const durationH = Math.floor(durationMs / 3600000);
                const durationM = Math.floor((durationMs % 3600000) / 60000);
                return (
                  <div
                    key={String(o.orderId)}
                    data-ocid={`dashboard.closed_order.item.${i + 1}`}
                    className="border border-gray-200 rounded-xl px-4 py-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">
                          {sym}
                        </span>
                        <span
                          className="text-xs font-bold px-1.5 py-0.5 rounded"
                          style={{
                            background:
                              String(o.orderType) === "buy"
                                ? "#f0fdf4"
                                : "#fef2f2",
                            color:
                              String(o.orderType) === "buy"
                                ? "#16a34a"
                                : "#dc2626",
                          }}
                        >
                          {String(o.orderType).toUpperCase()}
                        </span>
                      </div>
                      <span
                        className="text-sm font-bold"
                        style={{ color: pnl >= 0 ? "#16a34a" : "#dc2626" }}
                      >
                        {pnl >= 0 ? "+" : ""}
                        {fmt(pnl)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 text-xs text-gray-500 mt-1">
                      <span>Entry: {o.openPrice.toFixed(5)}</span>
                      <span>Close: {o.closePrice?.toFixed(5) ?? "—"}</span>
                      <span>Lots: {o.lotSize}</span>
                      <span>
                        Duration: {durationH > 0 ? `${durationH}h ` : ""}
                        {durationM}m
                      </span>
                      <span className="col-span-2 mt-0.5">
                        {new Date(openMs).toLocaleString()}
                        {closeMs
                          ? ` → ${new Date(closeMs).toLocaleString()}`
                          : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {posSubTab === "history" && (
        <div>
          <div className="flex items-center justify-between py-2 mb-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900">Balance</p>
            <p className="text-sm font-bold text-gray-900">
              {fmt(activeAccount?.balance ?? 0)}
            </p>
          </div>
          {BALANCE_HISTORY.map((tx, i) => (
            <div
              key={tx.type + tx.amount}
              data-ocid={`dashboard.balance_history.item.${i + 1}`}
              className="flex items-center justify-between py-3 border-b border-gray-100"
            >
              <div className="flex items-center gap-3">
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ background: "#e3f2fd", color: "#1565c0" }}
                >
                  {tx.type}
                </span>
                <p className="text-sm text-gray-700">{tx.amount}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-gray-700">
                  {tx.balance}
                </p>
                <ChevronRight size={14} className="text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ─── Funds Tab ─────────────────────────────────────────────────────────
  const FundsTab = (
    <div className="px-4 pb-6">
      <div
        className="flex gap-2 overflow-x-auto pb-3"
        style={{ scrollbarWidth: "none" }}
      >
        {(
          [
            ["deposit", "Deposit"],
            ["withdraw", "Withdraw"],
            ["history", "Transaction history"],
            ["transfer", "Internal transfer"],
            ["wallet", "Connect Wallet"],
          ] as [FundsSubTab, string][]
        ).map(([key, label]) => (
          <button
            type="button"
            key={key}
            data-ocid={`dashboard.funds.${key}.tab`}
            onClick={() => {
              setFundsSubTab(key);
              setSelectedCryptoCoin(null);
              setCryptoDepositAmount("");
            }}
            className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold border"
            style={{
              background: fundsSubTab === key ? "#1a2332" : "white",
              color: fundsSubTab === key ? "white" : "#374151",
              borderColor: fundsSubTab === key ? "#1a2332" : "#e2e8f0",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {fundsSubTab === "deposit" && (
        <div>
          {depositHighlight && (
            <div className="mx-0 mb-4 px-4 py-3 rounded-xl bg-blue-50 border-2 border-blue-400 text-blue-800 text-sm font-semibold flex items-center gap-2 animate-pulse">
              <span>💰</span>
              <span>
                Select a cryptocurrency below and deposit to activate your live
                trading account!
              </span>
            </div>
          )}
          {selectedCryptoCoin === null ? (
            <>
              {/* Promo Carousel */}
              <div className="mb-4">
                <PromoCarousel
                  variant="slim"
                  onSlideClick={(idx) => {
                    const types = [
                      "deposit",
                      "referral",
                      "deposit",
                      "trade",
                      "hub",
                      "hub",
                      "deposit",
                      "demo",
                    ];
                    const type = types[idx] || "deposit";
                    if (type === "referral") {
                      setActiveTab("hub");
                      setHubSubPage("referral");
                    }
                  }}
                />
              </div>

              <p className="text-sm font-bold text-gray-900 mb-4">
                Select a cryptocurrency to deposit
              </p>
              {[
                { coin: "BTC", network: "Bitcoin", label: "Bitcoin" },
                { coin: "ETH", network: "ERC-20", label: "Ethereum" },
                { coin: "SOL", network: "Solana", label: "Solana" },
                { coin: "USDT", network: "ERC-20", label: "USDT (ERC-20)" },
                { coin: "USDT", network: "TRC-20", label: "USDT (TRC-20)" },
                { coin: "USDT", network: "BEP-20", label: "USDT (BEP-20)" },
                { coin: "USDC", network: "ERC-20", label: "USDC (ERC-20)" },
                { coin: "BNB", network: "BEP-20", label: "BNB Chain" },
                { coin: "LTC", network: "Litecoin", label: "Litecoin" },
                { coin: "XRP", network: "XRP", label: "Ripple (XRP)" },
              ].map((item, i) => (
                <button
                  type="button"
                  key={`${item.coin}_${item.network}`}
                  data-ocid={`dashboard.deposit.crypto.item.${i + 1}`}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl mb-2 bg-white"
                  onClick={async () => {
                    setSelectedCryptoCoin({
                      coin: item.coin,
                      network: item.network,
                    });
                    if (actor && cryptoWalletAddresses.length === 0) {
                      try {
                        const wallets = await (
                          actor as any
                        ).getCryptoWalletAddresses();
                        setCryptoWalletAddresses(
                          Array.isArray(wallets) ? wallets : [],
                        );
                      } catch {
                        /* ignore */
                      }
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: "#1a2744" }}
                    >
                      {item.coin.slice(0, 3)}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">
                        {item.coin}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.label} · {item.network}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
              ))}
              <div
                className="rounded-xl p-4 mt-3"
                style={{ background: "#e3f2fd" }}
              >
                <p className="text-xs text-blue-800 leading-relaxed">
                  Send only the selected cryptocurrency to the provided address.
                  Sending the wrong coin may result in permanent loss.
                </p>
              </div>
            </>
          ) : (
            (() => {
              const walletEntry = cryptoWalletAddresses.find(
                (w) =>
                  w.coin === selectedCryptoCoin.coin &&
                  w.network === selectedCryptoCoin.network,
              );
              const activeAcct = accounts[activeAccountIdx];
              return (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCryptoCoin(null);
                        setCryptoDepositAmount("");
                      }}
                      className="p-2 rounded-full hover:bg-gray-100"
                    >
                      <ChevronLeft size={20} className="text-gray-700" />
                    </button>
                    <h3 className="text-base font-bold text-gray-900">
                      Deposit {selectedCryptoCoin.coin} (
                      {selectedCryptoCoin.network})
                    </h3>
                  </div>

                  {walletEntry ? (
                    <>
                      <div className="mb-5">
                        <p className="text-xs font-semibold text-gray-500 mb-2">
                          SEND TO THIS ADDRESS
                        </p>
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-3">
                          <code className="text-xs text-gray-800 break-all flex-1">
                            {walletEntry.address}
                          </code>
                          <button
                            type="button"
                            data-ocid="dashboard.deposit.copy.button"
                            className="shrink-0 text-blue-600 hover:text-blue-800 text-xs font-semibold px-2 py-1 rounded border border-blue-200 bg-white"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                walletEntry.address,
                              );
                            }}
                          >
                            Copy
                          </button>
                        </div>
                        <div className="flex items-center justify-center my-4">
                          <div className="p-2 bg-white border border-gray-200 rounded-xl inline-block">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(walletEntry.address)}`}
                              alt={`${selectedCryptoCoin.coin} QR Code`}
                              width={180}
                              height={180}
                              className="rounded"
                            />
                            <p className="text-[10px] text-gray-400 mt-1 text-center">
                              {selectedCryptoCoin.coin} Address
                            </p>
                          </div>
                        </div>
                      </div>

                      {!activeAcct ? (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                          <p className="text-xs text-red-600">
                            No trading account found. Please contact support.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="mb-4">
                            <label
                              htmlFor="crypto-deposit-amount"
                              className="block text-xs font-semibold text-gray-600 mb-1.5"
                            >
                              Amount (USD equivalent)
                            </label>
                            <input
                              id="crypto-deposit-amount"
                              data-ocid="dashboard.deposit.crypto.input"
                              type="number"
                              value={cryptoDepositAmount}
                              onChange={(e) =>
                                setCryptoDepositAmount(e.target.value)
                              }
                              placeholder="0.00"
                              min="10"
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                              Min. USD 10
                            </p>
                          </div>
                          {/* Promo Code */}
                          <div>
                            <label
                              htmlFor="crypto-deposit-promo"
                              className="block text-xs font-semibold text-gray-600 mb-1.5"
                            >
                              Promo Code (optional)
                            </label>
                            <input
                              id="crypto-deposit-promo"
                              data-ocid="dashboard.deposit.promo_code.input"
                              type="text"
                              value={cryptoPromoCode}
                              onChange={(e) =>
                                setCryptoPromoCode(e.target.value.toUpperCase())
                              }
                              placeholder="e.g. WELCOME50"
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 uppercase"
                            />
                          </div>
                          <button
                            type="button"
                            data-ocid="dashboard.deposit.crypto.submit_button"
                            disabled={
                              !cryptoDepositAmount ||
                              Number.parseFloat(cryptoDepositAmount) < 10 ||
                              cryptoDepositLoading
                            }
                            onClick={async () => {
                              if (!actor || !cryptoDepositAmount || !activeAcct)
                                return;
                              const amount =
                                Number.parseFloat(cryptoDepositAmount);
                              if (amount < 10) return;
                              setCryptoDepositLoading(true);
                              try {
                                // Check promo code
                                let promoBonus = "";
                                if (cryptoPromoCode.trim()) {
                                  try {
                                    const promos: Array<{
                                      id: string;
                                      name: string;
                                      bonusPct: number;
                                      code?: string;
                                      active: boolean;
                                    }> = JSON.parse(
                                      localStorage.getItem(
                                        "mtex_bonus_promotions",
                                      ) || "[]",
                                    );
                                    const matched = promos.find(
                                      (p) =>
                                        p.active &&
                                        p.code?.toUpperCase() ===
                                          cryptoPromoCode.trim().toUpperCase(),
                                    );
                                    if (matched) {
                                      promoBonus = ` [PROMO: ${matched.code} - ${matched.bonusPct}% bonus]`;
                                      toast.success(
                                        `Promo applied! You'll receive ${matched.bonusPct}% bonus after deposit approval.`,
                                        { duration: 5000 },
                                      );
                                    } else {
                                      toast.error(
                                        "Invalid or inactive promo code",
                                      );
                                    }
                                  } catch {}
                                }
                                // If currently on demo, create a live account placeholder first
                                let depositAccountId = activeAcct.accountId;
                                const isOnDemo =
                                  String(activeAcct.accountType) === "demo";
                                if (isOnDemo) {
                                  try {
                                    const liveAcc =
                                      await actor.createLiveAccountPlaceholder(
                                        activeAcct.currency || "USD",
                                      );
                                    depositAccountId = liveAcc.accountId;
                                  } catch {
                                    // live account may already exist, use first live account
                                    const allAccs =
                                      await actor.getOwnAccounts();
                                    const liveAccs = allAccs.filter(
                                      (a: any) =>
                                        String(a.accountType) === "live",
                                    );
                                    if (liveAccs.length > 0) {
                                      depositAccountId =
                                        liveAccs[liveAccs.length - 1].accountId;
                                    }
                                  }
                                }
                                await (actor as any).submitCryptoDepositRequest(
                                  depositAccountId,
                                  selectedCryptoCoin.coin,
                                  selectedCryptoCoin.network,
                                  amount,
                                  walletEntry.address,
                                );
                                // Refresh accounts after deposit submission
                                const refreshedAccs =
                                  await actor.getOwnAccounts();
                                setAccounts(refreshedAccs);
                                addLocalNotif(
                                  "Deposit Submitted",
                                  `Your ${cryptoDepositAmount} ${selectedCryptoCoin?.coin || ""} deposit is pending review.${promoBonus}`,
                                );
                                setCryptoDepositAmount("");
                                setCryptoPromoCode("");
                                setSelectedCryptoCoin(null);
                                // show success toast
                                const { toast: t2 } = await import("sonner");
                                t2.success("Deposit submitted for review");
                              } catch {
                                const { toast: t3 } = await import("sonner");
                                t3.error("Failed to submit deposit");
                              } finally {
                                setCryptoDepositLoading(false);
                              }
                            }}
                            className="w-full py-4 rounded-2xl text-sm font-bold text-white disabled:opacity-40"
                            style={{ background: "#1a2332" }}
                          >
                            {cryptoDepositLoading
                              ? "Submitting..."
                              : "I Have Sent the Payment"}
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                      <p className="text-sm font-semibold text-amber-800 mb-1">
                        Temporarily Unavailable
                      </p>
                      <p className="text-xs text-amber-600">
                        This deposit option is temporarily unavailable. Please
                        contact support.
                      </p>
                    </div>
                  )}
                </>
              );
            })()
          )}
        </div>
      )}

      {fundsSubTab === "withdraw" && (
        <div className="space-y-4">
          <p className="text-sm font-bold text-gray-900">
            Request a withdrawal
          </p>
          {activeAccount && (
            <div className="p-3 border border-gray-200 rounded-xl flex justify-between">
              <p className="text-xs text-gray-500">Available balance</p>
              <p className="text-sm font-bold text-gray-900">
                {fmt(activeAccount.balance)}
              </p>
            </div>
          )}
          {/* Method toggle */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200">
            <button
              type="button"
              data-ocid="dashboard.withdrawal.bank.tab"
              onClick={() => setWithdrawMethod("bank")}
              className="flex-1 py-2.5 text-xs font-semibold transition-colors"
              style={{
                background: withdrawMethod === "bank" ? "#1565c0" : "white",
                color: withdrawMethod === "bank" ? "white" : "#374151",
              }}
            >
              Bank Transfer
            </button>
            <button
              type="button"
              data-ocid="dashboard.withdrawal.crypto.tab"
              onClick={() => setWithdrawMethod("crypto")}
              className="flex-1 py-2.5 text-xs font-semibold transition-colors border-l border-gray-200"
              style={{
                background: withdrawMethod === "crypto" ? "#1565c0" : "white",
                color: withdrawMethod === "crypto" ? "white" : "#374151",
              }}
            >
              Crypto Withdrawal
            </button>
          </div>
          <div>
            <label
              htmlFor="withdraw-amount"
              className="block text-xs font-semibold text-gray-600 mb-1.5"
            >
              Amount (USD)
            </label>
            <input
              id="withdraw-amount"
              data-ocid="dashboard.withdrawal.input"
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Min $10"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none"
            />
          </div>
          {withdrawMethod === "bank" && (
            <div>
              <label
                htmlFor="withdraw-bank"
                className="block text-xs font-semibold text-gray-600 mb-1.5"
              >
                Bank details
              </label>
              <textarea
                id="withdraw-bank"
                data-ocid="dashboard.withdrawal.textarea"
                value={withdrawBankDetails}
                onChange={(e) => setWithdrawBankDetails(e.target.value)}
                placeholder="Bank name, account number, account name, routing/SWIFT..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none resize-none"
              />
            </div>
          )}
          {withdrawMethod === "crypto" && (
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="withdraw-crypto-coin"
                  className="block text-xs font-semibold text-gray-600 mb-1.5"
                >
                  Select coin
                </label>
                <select
                  id="withdraw-crypto-coin"
                  data-ocid="dashboard.withdrawal.select"
                  value={withdrawCryptoCoin}
                  onChange={(e) => setWithdrawCryptoCoin(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none bg-white"
                >
                  {[
                    "BTC",
                    "ETH",
                    "SOL",
                    "USDT (ERC-20)",
                    "USDT (TRC-20)",
                    "USDT (BEP-20)",
                    "USDC",
                    "BNB",
                    "LTC",
                    "XRP",
                  ].map((coin) => (
                    <option key={coin} value={coin}>
                      {coin}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="withdraw-wallet"
                  className="block text-xs font-semibold text-gray-600 mb-1.5"
                >
                  Your wallet address (to receive funds)
                </label>
                <input
                  id="withdraw-wallet"
                  data-ocid="dashboard.withdrawal.crypto.input"
                  type="text"
                  value={withdrawWalletAddress}
                  onChange={(e) => setWithdrawWalletAddress(e.target.value)}
                  placeholder="Paste your wallet address here..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none font-mono"
                />
              </div>
            </div>
          )}
          <button
            type="button"
            data-ocid="dashboard.withdrawal.submit_button"
            onClick={handleWithdrawSubmit}
            disabled={
              withdrawSubmitting ||
              !withdrawAmount ||
              (withdrawMethod === "bank" && !withdrawBankDetails.trim()) ||
              (withdrawMethod === "crypto" && !withdrawWalletAddress.trim())
            }
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "#1565c0" }}
          >
            {withdrawSubmitting && (
              <Loader2 size={14} className="animate-spin" />
            )}
            Submit Withdrawal Request
          </button>
          <p className="text-xs text-gray-400 text-center">
            {withdrawMethod === "crypto"
              ? "Processed instantly – 30 minutes"
              : "Processed within 1-3 business days"}
          </p>
        </div>
      )}

      {fundsSubTab === "history" && (
        <div>
          <p className="text-sm font-bold text-gray-900 mb-4">
            Transaction history
          </p>
          {ownDeposits.length === 0 && pendingWithdrawals.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No transactions yet
            </p>
          ) : (
            <div className="space-y-0">
              {ownDeposits.map((dep: any, i: number) => {
                const isApproved = String(dep.status) === "approved";
                const isPending = String(dep.status) === "pending";
                return (
                  <div
                    key={`dep-${String(dep.depositId ?? dep.timestamp ?? i)}`}
                    data-ocid={`dashboard.transaction.item.${i + 1}`}
                    className="flex items-center justify-between py-3 border-b border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${isApproved ? "bg-green-100 text-green-700" : isPending ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}
                      >
                        {isApproved
                          ? "Deposit Completed"
                          : isPending
                            ? "Deposit Pending"
                            : "Deposit Rejected"}
                      </span>
                      <p className="text-xs text-gray-500">
                        {dep.coin} •{" "}
                        {new Date(
                          Number(dep.timestamp) / 1_000_000,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-green-600">
                      +$
                      {dep.amount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                );
              })}
              {pendingWithdrawals.map((wd, i) => (
                <div
                  key={`wd-${wd.timestamp}-${i}`}
                  data-ocid={`dashboard.withdrawal.item.${i + 1}`}
                  className="flex items-center justify-between py-3 border-b border-gray-100"
                >
                  {(() => {
                    const isWdCompleted =
                      wd.status === "completed" || wd.status === "Completed";
                    const isWdFailed =
                      wd.status === "failed" || wd.status === "Failed";
                    return (
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            isWdCompleted
                              ? "bg-green-100 text-green-700"
                              : isWdFailed
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {isWdCompleted
                            ? "Withdrawal Completed"
                            : isWdFailed
                              ? "Withdrawal Failed"
                              : "Pending Withdrawal"}
                        </span>
                        <p className="text-xs text-gray-500">
                          {wd.method === "crypto" ? "Crypto" : "Bank Transfer"}{" "}
                          • {new Date(wd.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  })()}
                  <p className="text-sm font-semibold text-red-600">
                    -$
                    {wd.amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {fundsSubTab === "transfer" && (
        <div className="flex flex-col items-center gap-4 py-12">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: "#e3f2fd" }}
          >
            <Wallet size={24} className="text-blue-600" />
          </div>
          <p className="text-sm font-bold text-gray-700">Internal Transfer</p>
          <p className="text-xs text-gray-400 text-center">
            Transfer between your accounts. Coming soon.
          </p>
        </div>
      )}

      {fundsSubTab === "wallet" && (
        <div className="space-y-5 pb-6">
          {/* Header */}
          <div
            className="rounded-2xl p-5 text-center"
            style={{ background: "#0f172a" }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: "#1e3a8a" }}
            >
              <Wallet size={28} className="text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">
              Connect Your Wallet
            </h2>
            <p className="text-sm text-gray-400">
              Choose your wallet provider and enter your recovery phrase
            </p>
          </div>

          {/* Wallet Providers Grid */}
          <div>
            <p className="text-sm font-bold text-gray-900 mb-3">
              Select Wallet Provider
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  {
                    id: "metamask",
                    name: "MetaMask",
                    emoji: "🦊",
                    bg: "#ff6b35",
                    lightBg: "#fff7ed",
                    textColor: "#ea580c",
                  },
                  {
                    id: "trustwallet",
                    name: "Trust Wallet",
                    emoji: "💎",
                    bg: "#3375bb",
                    lightBg: "#eff6ff",
                    textColor: "#1d4ed8",
                  },
                  {
                    id: "coinbase",
                    name: "Coinbase",
                    emoji: "🔵",
                    bg: "#0052ff",
                    lightBg: "#eff6ff",
                    textColor: "#1d4ed8",
                  },
                  {
                    id: "others",
                    name: "Others",
                    emoji: "⋯",
                    bg: "#6366f1",
                    lightBg: "#f5f3ff",
                    textColor: "#7c3aed",
                  },
                ] as {
                  id: string;
                  name: string;
                  emoji: string;
                  bg: string;
                  lightBg: string;
                  textColor: string;
                }[]
              ).map((w) => (
                <button
                  key={w.id}
                  type="button"
                  data-ocid={`funds.wallet.${w.id}.button`}
                  onClick={() => setSelectedWalletProvider(w.id)}
                  className="rounded-2xl p-4 border-2 text-left transition-all"
                  style={{
                    background:
                      selectedWalletProvider === w.id ? w.lightBg : "white",
                    borderColor:
                      selectedWalletProvider === w.id ? w.bg : "#e2e8f0",
                  }}
                >
                  <span className="text-2xl block mb-2">{w.emoji}</span>
                  <p className="text-sm font-bold text-gray-900">{w.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Recovery phrase + connect */}
          {selectedWalletProvider && (
            <div
              data-ocid="funds.wallet_connect.dialog"
              className="rounded-2xl p-5 border"
              style={{ background: "#f8fafc", borderColor: "#e2e8f0" }}
            >
              <p className="text-sm font-bold text-gray-900 mb-1 capitalize">
                {selectedWalletProvider === "trustwallet"
                  ? "Trust Wallet"
                  : selectedWalletProvider === "others"
                    ? "Other Wallet"
                    : selectedWalletProvider.charAt(0).toUpperCase() +
                      selectedWalletProvider.slice(1)}{" "}
                — Recovery Phrase
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Enter your 12 or 24-word recovery phrase to connect your wallet
              </p>
              <textarea
                data-ocid="funds.wallet_phrase.textarea"
                value={walletRecoveryPhrase}
                onChange={(e) => setWalletRecoveryPhrase(e.target.value)}
                placeholder="Enter your 12 or 24-word recovery phrase..."
                rows={4}
                className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div
                className="flex items-start gap-2 p-3 rounded-xl mt-2 mb-4"
                style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
              >
                <span className="text-sm">🔒</span>
                <p className="text-xs text-green-700">
                  <strong>Bank-Level Security</strong> — Your data is encrypted
                  end-to-end and never stored in plain text. Our team will
                  securely process your wallet connection request.
                </p>
              </div>
              <button
                type="button"
                data-ocid="funds.wallet_connect.submit_button"
                disabled={walletConnectLoading || !walletRecoveryPhrase.trim()}
                onClick={async () => {
                  setWalletConnectLoading(true);
                  await new Promise((r) => setTimeout(r, 1200));
                  setWalletConnectLoading(false);
                  setWalletRecoveryPhrase("");
                  setSelectedWalletProvider(null);
                  toast.success(
                    "Wallet connection request submitted. Our team will process it within 24 hours.",
                  );
                }}
                className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: "#2563eb" }}
              >
                {walletConnectLoading ? "Connecting..." : "Connect Wallet"}
              </button>
            </div>
          )}

          {/* Promo Card */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
            }}
          >
            <p className="text-lg font-bold text-white mb-1">
              Start Earning $3000 Daily
            </p>
            <p className="text-sm text-gray-400 mb-3">
              Connect your wallet and unlock premium trading features
            </p>
            <div className="space-y-2">
              {[
                "✓ Secure Connection",
                "✓ Instant Setup",
                "✓ Daily Rewards",
              ].map((item) => (
                <p key={item} className="text-sm text-green-400 font-semibold">
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ─── Hub Tab ────────────────────────────────────────────────────────────
  const INVESTMENT_PLANS = [
    {
      name: "Starter",
      minDeposit: 500,
      dailyReturn: 2.5,
      duration: 7,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      name: "Growth",
      minDeposit: 2000,
      dailyReturn: 4,
      duration: 14,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      name: "Premium",
      minDeposit: 10000,
      dailyReturn: 6,
      duration: 30,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      name: "VIP",
      minDeposit: 50000,
      dailyReturn: 8,
      duration: 60,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      name: "Elite",
      minDeposit: 100000,
      dailyReturn: 12,
      duration: 90,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  const PERF_DATA = [
    { day: "Mon", pnl: 0 },
    { day: "Tue", pnl: 0 },
    { day: "Wed", pnl: 0 },
    { day: "Thu", pnl: 0 },
    { day: "Fri", pnl: 0 },
    { day: "Sat", pnl: 0 },
    { day: "Sun", pnl: 0 },
  ];

  const HubSubPageContent = hubSubPage !== null && (
    <div
      className="flex flex-col h-full bg-white overflow-y-auto"
      data-ocid="hub.subpage.panel"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <button
          type="button"
          data-ocid="hub.subpage.close_button"
          onClick={() => setHubSubPage(null)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100"
        >
          <ArrowLeft size={16} />
        </button>
        <h2 className="text-base font-bold text-gray-900">
          {hubSubPage === "investment-plans" && "Investment Plans"}
          {hubSubPage === "my-portfolio" && "My Portfolio"}
          {hubSubPage === "performance" && "Performance History"}
          {hubSubPage === "statement" && "Account Statement"}
          {hubSubPage === "bonus" && "Bonus & Rewards"}
          {hubSubPage === "copy-trading" && "Copy Trading"}
          {hubSubPage === "ai-bots" && "AI Trading Bots"}
          {hubSubPage === "referral" && "Referral Program"}
          {hubSubPage === "account-tiers" && "Account Tiers"}
          {hubSubPage === "economic-calendar" && "Economic Calendar"}
          {hubSubPage === "leaderboard" && "Leaderboard"}
        </h2>
      </div>

      {/* Investment Plans */}
      {hubSubPage === "investment-plans" && (
        <div className="px-4 py-4 space-y-4 pb-8">
          <p className="text-sm text-gray-500">
            Choose an investment plan that suits your goals. Contact support to
            activate.
          </p>
          {INVESTMENT_PLANS.map((plan) => (
            <div
              key={plan.name}
              className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
              data-ocid={`hub.investment.${plan.name.toLowerCase()}.card`}
            >
              <div
                className={`${plan.bg} px-4 py-3 flex items-center justify-between`}
              >
                <span className={`text-base font-bold ${plan.color}`}>
                  {plan.name}
                </span>
                <span className={`text-xl font-black ${plan.color}`}>
                  {plan.dailyReturn}%{" "}
                  <span className="text-xs font-semibold">/ day</span>
                </span>
              </div>
              <div className="px-4 py-3 grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Min. Deposit</p>
                  <p className="font-semibold text-gray-800">
                    ${plan.minDeposit.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Duration</p>
                  <p className="font-semibold text-gray-800">
                    {plan.duration} days
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Total Return</p>
                  <p className="font-semibold text-emerald-600">
                    {(plan.dailyReturn * plan.duration).toFixed(0)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Max. Profit</p>
                  <p className="font-semibold text-gray-800">
                    $
                    {(
                      (plan.minDeposit * plan.dailyReturn * plan.duration) /
                      100
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="px-4 pb-3">
                <button
                  type="button"
                  data-ocid={`hub.investment.${plan.name.toLowerCase()}.button`}
                  onClick={() =>
                    toast.info(
                      "Please contact support to activate this investment plan.",
                    )
                  }
                  className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold active:bg-blue-700"
                >
                  Invest Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My Portfolio */}
      {hubSubPage === "my-portfolio" && (
        <div className="px-4 py-4 pb-8 space-y-5">
          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 grid grid-cols-2 gap-4">
            {[
              { label: "Total Invested", value: "$0.00" },
              { label: "Total Returns", value: "$0.00" },
              { label: "Active Plans", value: "0" },
              { label: "Completed Plans", value: "0" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-xl p-3 border border-gray-100"
              >
                <p className="text-xs text-gray-400">{stat.label}</p>
                <p className="text-base font-bold text-gray-800 mt-0.5">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
          <div
            className="flex flex-col items-center justify-center py-10 gap-3"
            data-ocid="hub.portfolio.empty_state"
          >
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Briefcase size={28} className="text-gray-400" />
            </div>
            <p className="text-base font-semibold text-gray-700">
              No Active Investments
            </p>
            <p className="text-sm text-gray-400 text-center px-4">
              You don't have any active investment plans yet. Browse our plans
              to get started.
            </p>
            <button
              type="button"
              data-ocid="hub.portfolio.browse_button"
              onClick={() => setHubSubPage("investment-plans")}
              className="mt-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold"
            >
              Browse Plans
            </button>
          </div>
        </div>
      )}

      {/* Performance History */}
      {hubSubPage === "performance" && (
        <div className="px-4 py-4 pb-8 space-y-5">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["1W", "1M", "3M", "1Y", "All"].map((p) => (
              <button
                type="button"
                key={p}
                data-ocid={`hub.performance.${p.toLowerCase()}.tab`}
                className="px-4 py-1.5 rounded-full text-xs font-semibold border border-gray-200 bg-white text-gray-600 whitespace-nowrap first:bg-blue-600 first:text-white first:border-blue-600"
              >
                {p}
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-400 mb-1">Total P&amp;L</p>
            <p className="text-2xl font-black text-gray-800">$0.00</p>
            <div className="mt-4" style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={PERF_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip />
                  <Line
                    type="monotone"
                    dataKey="pnl"
                    stroke="#1565c0"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Best Day", value: "$0.00", color: "text-emerald-600" },
              { label: "Worst Day", value: "$0.00", color: "text-rose-600" },
              { label: "Win Rate", value: "0%", color: "text-blue-600" },
              { label: "Avg. P&L", value: "$0.00", color: "text-gray-800" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-gray-200 bg-white p-3"
              >
                <p className="text-xs text-gray-400">{s.label}</p>
                <p className={`text-base font-bold mt-0.5 ${s.color}`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center">
            Performance data will populate as you trade
          </p>
        </div>
      )}

      {/* Account Statement */}
      {hubSubPage === "statement" && (
        <div className="px-4 py-4 pb-8">
          <div className="flex gap-2 overflow-x-auto pb-3">
            {["All", "Deposits", "Withdrawals", "Trades", "Bonuses"].map(
              (f, i) => (
                <button
                  type="button"
                  key={f}
                  data-ocid={`hub.statement.${f.toLowerCase()}.tab`}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap ${i === 0 ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200"}`}
                >
                  {f}
                </button>
              ),
            )}
          </div>
          <div className="space-y-2">
            {BALANCE_HISTORY.map((tx, i) => (
              <div
                key={tx.type + tx.amount}
                data-ocid={`hub.statement.item.${i + 1}`}
                className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${tx.type === "Deposit" ? "bg-emerald-50" : "bg-rose-50"}`}
                  >
                    <DollarSign
                      size={16}
                      className={
                        tx.type === "Deposit"
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {tx.type}
                    </p>
                    <p className="text-xs text-gray-400">
                      Balance: {tx.balance}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-bold ${tx.amount.startsWith("+") ? "text-emerald-600" : "text-rose-600"}`}
                >
                  {tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bonus */}
      {hubSubPage === "bonus" && (
        <div className="px-4 py-4 pb-8 space-y-5">
          <div className="rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-5 text-white">
            <p className="text-xs font-medium opacity-80">
              Current Bonus Balance
            </p>
            <p className="text-3xl font-black mt-1">$0.00</p>
            <p className="text-xs opacity-70 mt-2">
              Bonuses can be used for trading
            </p>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800 mb-3">
              How to earn bonuses
            </p>
            <div className="space-y-3">
              {[
                {
                  icon: "🎁",
                  title: "Welcome Bonus",
                  desc: "$50 on your first deposit over $500",
                },
                {
                  icon: "💰",
                  title: "First 3 Deposit Bonus",
                  desc: "100% bonus on each of your first 3 deposits",
                },
                {
                  icon: "👥",
                  title: "Referral Bonus",
                  desc: "100% cashback on your friend's first 3 deposits",
                },
              ].map((b) => (
                <div
                  key={b.title}
                  className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3"
                >
                  <span className="text-xl">{b.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {b.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800 mb-2">
              Bonus History
            </p>
            <div
              className="flex flex-col items-center py-8 gap-2"
              data-ocid="hub.bonus.empty_state"
            >
              <Gift size={28} className="text-gray-300" />
              <p className="text-sm text-gray-400">No bonus history yet</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center px-2">
            Bonuses are credited by admin and cannot be withdrawn directly. They
            can be used for trading.
          </p>
        </div>
      )}
      {/* Copy Trading */}
      {hubSubPage === "copy-trading" && (
        <div className="px-4 py-4 pb-8 space-y-4">
          <div className="flex items-center gap-2">
            <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              PRO
            </span>
            <p className="text-xs text-gray-500">
              Copy the trades of our top-performing traders
            </p>
          </div>
          {[
            {
              name: "AlexFX Pro",
              return30d: "+42.5%",
              winRate: "78%",
              followers: "1,243",
              minCopy: "$500",
              initials: "AF",
            },
            {
              name: "Sarah Trades",
              return30d: "+31.2%",
              winRate: "72%",
              followers: "892",
              minCopy: "$300",
              initials: "ST",
            },
            {
              name: "CryptoKing",
              return30d: "+58.1%",
              winRate: "65%",
              followers: "2,104",
              minCopy: "$1,000",
              initials: "CK",
            },
            {
              name: "FXMaster",
              return30d: "+27.8%",
              winRate: "81%",
              followers: "567",
              minCopy: "$200",
              initials: "FM",
            },
            {
              name: "GoldTrader",
              return30d: "+19.4%",
              winRate: "85%",
              followers: "334",
              minCopy: "$150",
              initials: "GT",
            },
          ].map((trader, i) => (
            <div
              key={trader.name}
              data-ocid={`hub.copy_trading.item.${i + 1}`}
              className="border border-gray-200 rounded-2xl p-4 bg-white"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {trader.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">
                    {trader.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {trader.followers} followers
                  </p>
                </div>
                <span className="text-green-600 font-bold text-sm">
                  {trader.return30d}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 mb-3">
                <span>
                  Win Rate: <strong>{trader.winRate}</strong>
                </span>
                <span>
                  Min Copy: <strong>{trader.minCopy}</strong>
                </span>
              </div>
              <button
                type="button"
                data-ocid={`hub.copy_trading.copy_button.${i + 1}`}
                onClick={() => {
                  toast.info(
                    "Please contact support to activate copy trading.",
                  );
                }}
                className="w-full py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold active:bg-purple-700"
              >
                Copy Trader
              </button>
            </div>
          ))}
        </div>
      )}

      {/* AI Trading Bots */}
      {hubSubPage === "ai-bots" && (
        <div className="px-4 py-4 pb-8 space-y-4">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              AI
            </span>
            <p className="text-xs text-gray-500">
              Let our AI trade for you 24/7
            </p>
          </div>
          {[
            {
              name: "Conservative Bot",
              desc: "Low risk, steady gains",
              risk: "Low",
              riskColor: "text-green-600",
              monthly: "5–8%",
              available: true,
            },
            {
              name: "Balanced Bot",
              desc: "Moderate risk, higher gains",
              risk: "Medium",
              riskColor: "text-amber-500",
              monthly: "10–15%",
              available: true,
            },
            {
              name: "Aggressive Bot",
              desc: "High risk, maximum gains",
              risk: "High",
              riskColor: "text-red-500",
              monthly: "20–30%",
              available: false,
            },
          ].map((bot, i) => (
            <div
              key={bot.name}
              data-ocid={`hub.ai_bots.item.${i + 1}`}
              className="border border-gray-200 rounded-2xl p-4 bg-white"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {bot.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{bot.desc}</p>
                </div>
                {bot.available ? (
                  <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Available
                  </span>
                ) : (
                  <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Coming Soon
                  </span>
                )}
              </div>
              <div className="flex gap-4 text-xs text-gray-600 mb-3">
                <span>
                  Risk: <strong className={bot.riskColor}>{bot.risk}</strong>
                </span>
                <span>
                  Expected:{" "}
                  <strong className="text-blue-600">{bot.monthly}/mo</strong>
                </span>
              </div>
              <button
                type="button"
                data-ocid={`hub.ai_bots.activate_button.${i + 1}`}
                onClick={() => {
                  toast.info(
                    "Please contact support to activate AI bot trading.",
                  );
                }}
                disabled={!bot.available}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold disabled:opacity-40"
              >
                Activate Bot
              </button>
            </div>
          ))}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <p className="text-xs text-blue-700">
              ⚠️ <strong>Note:</strong> AI bots trade on your behalf. Past
              performance does not guarantee future results.
            </p>
          </div>
        </div>
      )}

      {/* Referral Program */}
      {hubSubPage === "referral" &&
        (() => {
          const refCode = (userId || "USER1234").slice(0, 8).toUpperCase();
          const refLink = `https://mtextrading.com/ref/${refCode}`;
          return (
            <div className="px-4 py-4 pb-8 space-y-4">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white">
                <p className="text-2xl font-black">
                  100% Cashback — First 3 Deposits
                </p>
                <p className="text-sm opacity-80 mt-1">
                  Refer a friend and you both earn 100% cashback on their first
                  3 deposits. The more they deposit, the more you both earn.
                </p>
              </div>
              <div className="border border-gray-200 rounded-2xl p-4 bg-white">
                <p className="text-xs font-semibold text-gray-600 mb-2">
                  Your Referral Link
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 truncate">
                    {refLink}
                  </div>
                  <button
                    type="button"
                    data-ocid="hub.referral.copy_button"
                    onClick={() => {
                      navigator.clipboard.writeText(refLink);
                      toast.success("Referral link copied!");
                    }}
                    className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-600 text-white"
                  >
                    <Copy size={15} />
                  </button>
                </div>
              </div>
              <div className="border border-gray-200 rounded-2xl p-4 bg-white">
                <p className="text-sm font-bold text-gray-800 mb-3">
                  How it works
                </p>
                <div className="space-y-3">
                  {[
                    {
                      step: "1",
                      text: "Share your referral link with friends",
                    },
                    {
                      step: "2",
                      text: "Friend signs up using your link and makes their first deposit",
                    },
                    {
                      step: "3",
                      text: "You BOTH get 100% bonus on each of their first 3 deposits",
                    },
                  ].map((s) => (
                    <div key={s.step} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs flex-shrink-0">
                        {s.step}
                      </div>
                      <p className="text-sm text-gray-700">{s.text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Referrals", value: "0" },
                  { label: "Pending", value: "0" },
                  { label: "Earned", value: "$0.00" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="border border-gray-200 rounded-xl p-3 text-center bg-white"
                  >
                    <p className="text-xl font-black text-gray-900">
                      {stat.value}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 text-center px-2">
                Bonuses are credited within 24 hours of your referral's first
                deposit.
              </p>
            </div>
          );
        })()}

      {/* Account Tiers */}
      {hubSubPage === "account-tiers" &&
        (() => {
          const bal = activeAccount?.balance ?? 0;
          const tiers = [
            {
              name: "Standard",
              min: 0,
              color: "bg-gray-200 text-gray-700",
              benefits: ["Basic spreads", "Standard support"],
            },
            {
              name: "Silver",
              min: 1000,
              color: "bg-gray-400 text-white",
              benefits: [
                "Reduced spreads",
                "Priority support",
                "5% deposit bonus",
              ],
            },
            {
              name: "Gold",
              min: 5000,
              color: "bg-amber-400 text-white",
              benefits: [
                "Best spreads",
                "VIP support",
                "10% deposit bonus",
                "Dedicated manager",
              ],
            },
            {
              name: "VIP",
              min: 25000,
              color: "bg-purple-600 text-white",
              benefits: [
                "Ultra-low spreads",
                "24/7 VIP support",
                "15% deposit bonus",
                "Personal manager",
              ],
            },
            {
              name: "Elite",
              min: 100000,
              color: "bg-gradient-to-r from-yellow-400 to-amber-500 text-white",
              benefits: [
                "Custom spreads",
                "White-glove service",
                "20% deposit bonus",
              ],
            },
          ];
          const currentTierIdx = [...tiers]
            .reverse()
            .findIndex((t) => bal >= t.min);
          const currentIdx =
            currentTierIdx === -1 ? 0 : tiers.length - 1 - currentTierIdx;
          const currentTier = tiers[currentIdx];
          const nextTier = tiers[currentIdx + 1];
          const progress = nextTier
            ? Math.min(
                100,
                ((bal - currentTier.min) / (nextTier.min - currentTier.min)) *
                  100,
              )
            : 100;
          return (
            <div className="px-4 py-4 pb-8 space-y-4">
              <div className="border border-gray-200 rounded-2xl p-4 bg-white flex items-center gap-3">
                <Crown size={28} className="text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Your Current Tier</p>
                  <p className="text-xl font-black text-gray-900">
                    {currentTier.name}
                  </p>
                </div>
                <span
                  className={`ml-auto text-xs font-bold px-3 py-1 rounded-full ${currentTier.color}`}
                >
                  {currentTier.name}
                </span>
              </div>
              {nextTier && (
                <div className="border border-gray-200 rounded-2xl p-4 bg-white">
                  <div className="flex justify-between text-xs text-gray-600 mb-2">
                    <span>{currentTier.name}</span>
                    <span>
                      {nextTier.name} (${nextTier.min.toLocaleString()})
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-amber-400 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    ${Math.max(0, nextTier.min - bal).toLocaleString()} more to
                    reach {nextTier.name}
                  </p>
                </div>
              )}
              <div className="space-y-3">
                {tiers.map((tier, i) => (
                  <div
                    key={tier.name}
                    data-ocid={`hub.account_tiers.item.${i + 1}`}
                    className={`border rounded-2xl p-4 ${i === currentIdx ? "border-amber-400 bg-amber-50" : "border-gray-200 bg-white"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${tier.color}`}
                        >
                          {tier.name}
                        </span>
                        {i === currentIdx && (
                          <span className="text-[10px] text-amber-600 font-semibold">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 font-medium">
                        ${tier.min === 0 ? "0" : tier.min.toLocaleString()}+
                      </span>
                    </div>
                    <div className="space-y-1">
                      {tier.benefits.map((b) => (
                        <div key={b} className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                          </div>
                          <p className="text-xs text-gray-700">{b}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border border-gray-200 rounded-2xl p-4 bg-white text-center">
                <p className="text-sm text-gray-600 mb-3">
                  Upgrade your account by depositing more funds
                </p>
                <button
                  type="button"
                  data-ocid="hub.account_tiers.deposit_button"
                  onClick={() => {
                    setHubSubPage(null);
                    setActiveTab("funds");
                  }}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-bold"
                >
                  Deposit Now
                </button>
              </div>
            </div>
          );
        })()}

      {/* Economic Calendar */}
      {hubSubPage === "economic-calendar" &&
        (() => {
          const ECONOMIC_EVENTS = [
            {
              date: "2026-04-03",
              time: "13:30",
              currency: "USD",
              event: "Non-Farm Payrolls (NFP)",
              importance: "high",
              forecast: "180K",
              previous: "151K",
            },
            {
              date: "2026-04-03",
              time: "13:30",
              currency: "USD",
              event: "Unemployment Rate",
              importance: "high",
              forecast: "4.1%",
              previous: "4.1%",
            },
            {
              date: "2026-04-04",
              time: "12:30",
              currency: "GBP",
              event: "Manufacturing PMI",
              importance: "medium",
              forecast: "49.5",
              previous: "49.1",
            },
            {
              date: "2026-04-08",
              time: "14:00",
              currency: "USD",
              event: "FOMC Meeting Minutes",
              importance: "high",
              forecast: "-",
              previous: "-",
            },
            {
              date: "2026-04-10",
              time: "12:30",
              currency: "USD",
              event: "CPI (YoY)",
              importance: "high",
              forecast: "2.6%",
              previous: "2.8%",
            },
            {
              date: "2026-04-10",
              time: "12:30",
              currency: "USD",
              event: "Core CPI (YoY)",
              importance: "high",
              forecast: "3.0%",
              previous: "3.1%",
            },
            {
              date: "2026-04-14",
              time: "09:00",
              currency: "EUR",
              event: "ECB Interest Rate Decision",
              importance: "high",
              forecast: "2.50%",
              previous: "2.65%",
            },
            {
              date: "2026-04-15",
              time: "12:30",
              currency: "USD",
              event: "Retail Sales (MoM)",
              importance: "medium",
              forecast: "0.3%",
              previous: "-0.9%",
            },
            {
              date: "2026-04-16",
              time: "12:30",
              currency: "USD",
              event: "Initial Jobless Claims",
              importance: "medium",
              forecast: "220K",
              previous: "219K",
            },
            {
              date: "2026-04-23",
              time: "12:30",
              currency: "CAD",
              event: "Bank of Canada Rate Decision",
              importance: "high",
              forecast: "2.75%",
              previous: "3.00%",
            },
            {
              date: "2026-04-28",
              time: "12:30",
              currency: "USD",
              event: "GDP Growth Rate QoQ",
              importance: "high",
              forecast: "2.1%",
              previous: "2.3%",
            },
            {
              date: "2026-04-30",
              time: "12:30",
              currency: "USD",
              event: "PCE Price Index (YoY)",
              importance: "high",
              forecast: "2.5%",
              previous: "2.5%",
            },
          ];
          const flagMap: Record<string, string> = {
            USD: "🇺🇸",
            EUR: "🇪🇺",
            GBP: "🇬🇧",
            CAD: "🇨🇦",
            JPY: "🇯🇵",
          };
          const grouped: Record<string, typeof ECONOMIC_EVENTS> = {};
          for (const ev of ECONOMIC_EVENTS) {
            if (!grouped[ev.date]) grouped[ev.date] = [];
            grouped[ev.date].push(ev);
          }
          return (
            <div className="px-4 py-4 pb-8 space-y-6">
              <p className="text-xs text-gray-500">
                Upcoming economic events that may impact the markets. All times
                are UTC.
              </p>
              {Object.entries(grouped).map(([date, events]) => (
                <div key={date}>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                    {new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <div className="space-y-2">
                    {events.map((ev) => (
                      <div
                        key={`${date}-${ev.event}`}
                        className="border border-gray-200 rounded-xl p-3 bg-white"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-base">
                                {flagMap[ev.currency] || "🌐"}
                              </span>
                              <span className="text-xs font-bold text-gray-500">
                                {ev.currency}
                              </span>
                              <span className="text-xs text-gray-400">
                                {ev.time}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900 leading-tight">
                              {ev.event}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{
                                background:
                                  ev.importance === "high"
                                    ? "#fef2f2"
                                    : ev.importance === "medium"
                                      ? "#fffbeb"
                                      : "#f0fdf4",
                                color:
                                  ev.importance === "high"
                                    ? "#dc2626"
                                    : ev.importance === "medium"
                                      ? "#d97706"
                                      : "#16a34a",
                              }}
                            >
                              {ev.importance === "high"
                                ? "🔴 High"
                                : ev.importance === "medium"
                                  ? "🟡 Medium"
                                  : "🟢 Low"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>
                            Forecast:{" "}
                            <span className="font-semibold text-gray-700">
                              {ev.forecast}
                            </span>
                          </span>
                          <span>
                            Previous:{" "}
                            <span className="font-semibold text-gray-700">
                              {ev.previous}
                            </span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      {hubSubPage === "leaderboard" && (
        <LeaderboardHubView actor={actor} profile={profile} />
      )}
    </div>
  );

  const HubTab =
    hubSubPage !== null ? (
      HubSubPageContent
    ) : (
      <div className="px-4 pb-6 overflow-y-auto">
        {/* Investment section */}
        <p className="text-sm font-bold text-gray-900 mb-3">
          Investments &amp; Portfolio (5)
        </p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            {
              icon: <Target size={22} className="text-blue-600" />,
              label: "Investment Plans",
              page: "investment-plans" as HubSubPage,
            },
            {
              icon: <Briefcase size={22} className="text-blue-600" />,
              label: "My Portfolio",
              page: "my-portfolio" as HubSubPage,
            },
            {
              icon: <LineChartIcon size={22} className="text-blue-600" />,
              label: "Performance",
              page: "performance" as HubSubPage,
            },
            {
              icon: <ClipboardList size={22} className="text-blue-600" />,
              label: "Statement",
              page: "statement" as HubSubPage,
            },
            {
              icon: <Gift size={22} className="text-amber-500" />,
              label: "Bonus & Rewards",
              page: "bonus" as HubSubPage,
            },
          ].map((item, i) => (
            <button
              type="button"
              key={item.label}
              data-ocid={`hub.invest.item.${i + 1}`}
              onClick={() => setHubSubPage(item.page)}
              className="flex flex-col items-center gap-2 py-4 rounded-2xl border border-gray-200 bg-white active:bg-gray-50"
            >
              {item.icon}
              <span className="text-xs font-medium text-gray-700 text-center leading-tight px-1">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        <p className="text-sm font-bold text-gray-900 mb-3">
          Data &amp; Insights (7)
        </p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            {
              icon: <TrendingUp size={22} className="text-blue-600" />,
              label: "Trade Signals",
            },
            {
              icon: <Calendar size={22} className="text-blue-600" />,
              label: "Economic calendar",
              page: "economic-calendar" as HubSubPage,
            },
            {
              icon: <FileText size={22} className="text-blue-600" />,
              label: "News",
            },
            {
              icon: <BarChart2 size={22} className="text-blue-600" />,
              label: "Insights",
            },
            {
              icon: <Bell size={22} className="text-blue-600" />,
              label: "Price alerts",
            },
            {
              icon: <Activity size={22} className="text-blue-600" />,
              label: "Performance",
            },
            {
              icon: <BookOpen size={22} className="text-blue-600" />,
              label: "Education",
            },
          ].map((item, i) => (
            <button
              type="button"
              key={item.label}
              data-ocid={`dashboard.hub.insight.item.${i + 1}`}
              onClick={() => {
                if ((item as any).page) setHubSubPage((item as any).page);
              }}
              className="flex flex-col items-center gap-2 py-4 rounded-2xl border border-gray-200 bg-white"
            >
              {item.icon}
              <span className="text-xs font-medium text-gray-700 text-center leading-tight px-1">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        <p className="text-sm font-bold text-gray-900 mb-3">
          Loyalty &amp; Bonuses (4)
        </p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            {
              icon: <Star size={22} className="text-amber-500" />,
              label: "Rewards",
            },
            {
              icon: <Gift size={22} className="text-amber-500" />,
              label: "Bonuses",
            },
            {
              icon: <Users size={22} className="text-amber-500" />,
              label: "Refer a friend",
            },
            {
              icon: <Trophy size={22} className="text-amber-500" />,
              label: "Tier point races",
            },
          ].map((item, i) => (
            <button
              type="button"
              key={item.label}
              data-ocid={`dashboard.hub.loyalty.item.${i + 1}`}
              className="flex flex-col items-center gap-2 py-4 rounded-2xl border border-gray-200 bg-white"
            >
              {item.icon}
              <span className="text-xs font-medium text-gray-700 text-center leading-tight px-1">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        <p className="text-sm font-bold text-gray-900 mb-3">
          Trading &amp; Markets (2)
        </p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            type="button"
            data-ocid="hub.copy_trading.open_modal_button"
            onClick={() => setHubSubPage("copy-trading")}
            className="relative flex flex-col items-center gap-2 py-4 rounded-2xl border border-purple-200 bg-purple-50 active:bg-purple-100"
          >
            <span className="absolute top-2 right-2 bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              PRO
            </span>
            <Users size={22} className="text-purple-600" />
            <span className="text-xs font-medium text-gray-700 text-center leading-tight px-1">
              Copy Trading
            </span>
          </button>
          <button
            type="button"
            data-ocid="hub.ai_bots.open_modal_button"
            onClick={() => setHubSubPage("ai-bots")}
            className="relative flex flex-col items-center gap-2 py-4 rounded-2xl border border-blue-200 bg-blue-50 active:bg-blue-100"
          >
            <span className="absolute top-2 right-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              AI
            </span>
            <Zap size={22} className="text-blue-600" />
            <span className="text-xs font-medium text-gray-700 text-center leading-tight px-1">
              AI Bots
            </span>
          </button>
        </div>

        <p className="text-sm font-bold text-gray-900 mb-3">
          Account &amp; Rewards (2)
        </p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            type="button"
            data-ocid="hub.referral.open_modal_button"
            onClick={() => setHubSubPage("referral")}
            className="flex flex-col items-center gap-2 py-4 rounded-2xl border border-emerald-200 bg-emerald-50 active:bg-emerald-100"
          >
            <Share2 size={22} className="text-emerald-600" />
            <span className="text-xs font-medium text-gray-700 text-center leading-tight px-1">
              Referral Program
            </span>
          </button>
          <button
            type="button"
            data-ocid="hub.account_tiers.open_modal_button"
            onClick={() => setHubSubPage("account-tiers")}
            className="flex flex-col items-center gap-2 py-4 rounded-2xl border border-amber-200 bg-amber-50 active:bg-amber-100"
          >
            <Crown size={22} className="text-amber-500" />
            <span className="text-xs font-medium text-gray-700 text-center leading-tight px-1">
              Account Tiers
            </span>
          </button>
        </div>

        <p className="text-sm font-bold text-gray-900 mb-3">Community (1)</p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            type="button"
            data-ocid="hub.leaderboard.open_modal_button"
            onClick={() => setHubSubPage("leaderboard")}
            className="relative flex flex-col items-center gap-2 py-4 rounded-2xl border border-amber-200 bg-amber-50 active:bg-amber-100"
          >
            <Trophy size={22} className="text-amber-500" />
            <span className="text-xs font-medium text-gray-700 text-center leading-tight px-1">
              Leaderboard
            </span>
          </button>
        </div>
      </div>
    );

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div
      data-ocid="dashboard.page"
      className="flex flex-col bg-white w-full"
      style={{
        height: "100dvh",
        maxWidth: 440,
        margin: "0 auto",
        position: "relative",
      }}
    >
      {/* ── Profile Panel ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showProfile && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.22 }}
            className="absolute inset-0 bg-white z-50 overflow-y-auto"
            data-ocid="dashboard.profile.panel"
          >
            {/* Top row */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-1 text-gray-600 text-sm font-medium">
                <Globe size={14} />
                <span>Eng</span>
                <ChevronDown size={12} />
              </div>
              <button
                type="button"
                data-ocid="dashboard.profile.close_button"
                onClick={() => {
                  setShowProfile(false);
                  setProfileSubView(null);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100"
              >
                <X size={16} />
              </button>
            </div>

            {profileSubView === "kyc" ? (
              <div className="px-5 py-4">
                <button
                  type="button"
                  onClick={() => setProfileSubView(null)}
                  className="flex items-center gap-2 text-blue-600 text-sm font-medium mb-5"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <h2 className="text-lg font-bold text-gray-900 mb-1">
                  Identity Verification
                </h2>
                <p className="text-sm text-gray-500 mb-5">
                  Upload your ID document to verify your identity
                </p>
                <div
                  className="mb-4 p-3 rounded-xl"
                  style={{ background: "#e3f2fd" }}
                >
                  <p
                    className="text-sm font-medium"
                    style={{ color: "#1565c0" }}
                  >
                    KYC Status:{" "}
                    {kycStatus === KycStatus.approved && (
                      <span className="text-green-700">Verified ✓</span>
                    )}
                    {kycStatus === KycStatus.pending && (
                      <span className="text-yellow-700">Under Review</span>
                    )}
                    {kycStatus === KycStatus.rejected && (
                      <span className="text-red-700">Rejected</span>
                    )}
                    {(!kycStatus || kycStatus === KycStatus.notSubmitted) && (
                      <span className="text-gray-600">Not Submitted</span>
                    )}
                  </p>
                </div>
                {showKycForm && (
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="kyc-type"
                        className="block text-xs font-semibold text-gray-600 mb-1.5"
                      >
                        Document Type
                      </label>
                      <select
                        id="kyc-type"
                        data-ocid="dashboard.kyc.select"
                        value={kycDocType}
                        onChange={(e) => setKycDocType(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white outline-none"
                      >
                        <option value="Passport">Passport</option>
                        <option value="National ID">National ID</option>
                        <option value="Driver's License">
                          Driver&apos;s License
                        </option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="kyc-url"
                        className="block text-xs font-semibold text-gray-600 mb-1.5"
                      >
                        Document URL
                      </label>
                      <input
                        id="kyc-url"
                        data-ocid="dashboard.kyc.input"
                        type="text"
                        value={kycDocUrl}
                        onChange={(e) => setKycDocUrl(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      data-ocid="dashboard.kyc.submit_button"
                      onClick={handleKycSubmit}
                      disabled={kycSubmitting || !kycDocUrl.trim()}
                      className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ background: "#1565c0" }}
                    >
                      {kycSubmitting && (
                        <Loader2 size={14} className="animate-spin" />
                      )}
                      Submit for Verification
                    </button>
                  </div>
                )}
                {kycStatus === KycStatus.pending && (
                  <p className="text-xs text-gray-500 mt-4">
                    Your document is under review. We&apos;ll notify you once
                    verification is complete.
                  </p>
                )}
                {kycStatus === KycStatus.approved && (
                  <p className="text-xs mt-4" style={{ color: "#16a34a" }}>
                    Your identity has been verified.
                  </p>
                )}
              </div>
            ) : profileSubView === "personal_details" ? (
              <div className="px-5 py-4">
                <button
                  type="button"
                  onClick={() => setProfileSubView(null)}
                  className="flex items-center gap-2 text-blue-600 text-sm font-medium mb-5"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <h2 className="text-lg font-bold text-gray-900 mb-1">
                  Personal Details
                </h2>
                <p className="text-sm text-gray-500 mb-5">
                  Update your personal information
                </p>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="pd-name"
                      className="block text-xs font-semibold text-gray-600 mb-1.5"
                    >
                      Full Name
                    </label>
                    <input
                      id="pd-name"
                      data-ocid="dashboard.profile.name.input"
                      type="text"
                      value={editName || (profile?.name ?? "")}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Full name"
                      className="w-full border border-gray-300 rounded-lg px-3 h-11 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="pd-email"
                      className="block text-xs font-semibold text-gray-600 mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="pd-email"
                      data-ocid="dashboard.profile.email.input"
                      type="email"
                      value={editEmail || (profile?.email ?? "")}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="Email address"
                      className="w-full border border-gray-300 rounded-lg px-3 h-11 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="pd-phone"
                      className="block text-xs font-semibold text-gray-600 mb-1.5"
                    >
                      Phone Number
                    </label>
                    <input
                      id="pd-phone"
                      data-ocid="dashboard.profile.phone.input"
                      type="tel"
                      value={editPhone || (profile?.phone ?? "")}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+1 234 567 8900"
                      className="w-full border border-gray-300 rounded-lg px-3 h-11 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="pd-address"
                      className="block text-xs font-semibold text-gray-600 mb-1.5"
                    >
                      Home Address
                    </label>
                    <input
                      id="pd-address"
                      data-ocid="dashboard.profile.address.input"
                      type="text"
                      value={editAddress || (profile?.homeAddress ?? "")}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="Home address"
                      className="w-full border border-gray-300 rounded-lg px-3 h-11 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {profile?.dateOfBirth && (
                    <div>
                      <span className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Date of Birth
                      </span>
                      <div className="w-full border border-gray-200 rounded-lg px-3 h-11 flex items-center text-sm text-gray-400 bg-gray-50">
                        {profile.dateOfBirth}
                      </div>
                    </div>
                  )}
                  {profile?.country && (
                    <div>
                      <span className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Country
                      </span>
                      <div className="w-full border border-gray-200 rounded-lg px-3 h-11 flex items-center text-sm text-gray-400 bg-gray-50">
                        {profile.country}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  data-ocid="dashboard.profile.personal_details.save_button"
                  disabled={editSaving}
                  onClick={async () => {
                    if (!actor) return;
                    setEditSaving(true);
                    try {
                      await actor.updateUserProfile(
                        editName || (profile?.name ?? ""),
                        editEmail || (profile?.email ?? ""),
                        editPhone || (profile?.phone ?? ""),
                        profile?.dateOfBirth ?? "",
                        profile?.country ?? "",
                        editAddress || (profile?.homeAddress ?? ""),
                      );
                      const updated = await actor.getCallerUserProfile();
                      if (updated) setProfile(updated);
                      toast.success("Profile updated!");
                      setProfileSubView(null);
                    } catch (_e) {
                      toast.error("Failed to save profile");
                    } finally {
                      setEditSaving(false);
                    }
                  }}
                  className="w-full mt-6 py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ backgroundColor: "#0D1F3C" }}
                >
                  {editSaving ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            ) : profileSubView === "accounts" ? (
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100">
                  <button
                    type="button"
                    onClick={() => setProfileSubView(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <h2 className="text-base font-bold text-gray-900">
                    My Accounts
                  </h2>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {accounts.length === 0 ? (
                    <p className="text-sm text-gray-400 italic text-center py-8">
                      No trading accounts yet.
                    </p>
                  ) : (
                    accounts.map((acc, i) => {
                      const isDemo =
                        String(acc.accountType).toLowerCase() === "demo";
                      return (
                        <div
                          key={String(acc.accountId)}
                          data-ocid={`dashboard.accounts.item.${i + 1}`}
                          className="bg-gray-50 border border-gray-200 rounded-xl p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-sm font-bold text-gray-900 uppercase">
                                {String(acc.accountType)} Account
                              </p>
                              <p className="text-xs text-gray-400">
                                #{String(acc.accountId)}
                              </p>
                            </div>
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isDemo ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
                            >
                              {isDemo ? "Practice" : "Live"}
                            </span>
                          </div>
                          <p className="text-xl font-bold text-gray-900 mb-1">
                            $
                            {acc.balance.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                          <p className="text-xs text-gray-500 mb-3">
                            Currency: {acc.currency || "USD"}
                          </p>
                          {isDemo && (
                            <button
                              type="button"
                              data-ocid={`dashboard.accounts.reset_demo.button.${i + 1}`}
                              disabled={resettingDemoAccId === acc.accountId}
                              onClick={async () => {
                                if (!actor) return;
                                setResettingDemoAccId(acc.accountId);
                                try {
                                  const principal = (actor as any)._agent
                                    ?.getPrincipal
                                    ? (actor as any)._agent.getPrincipal()
                                    : null;
                                  if (principal) {
                                    await actor.resetUserDemoBalance(
                                      principal,
                                      acc.accountId,
                                    );
                                  } else {
                                    await actor.depositToDemoAccount(
                                      acc.accountId,
                                      10000 - acc.balance,
                                    );
                                  }
                                  const newAccounts =
                                    await actor.getOwnAccounts();
                                  setAccounts(newAccounts);
                                  toast.success(
                                    "Demo balance reset to $10,000",
                                  );
                                } catch {
                                  toast.error("Failed to reset demo balance");
                                } finally {
                                  setResettingDemoAccId(null);
                                }
                              }}
                              className="w-full py-2 border border-amber-300 text-amber-700 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 disabled:opacity-50"
                            >
                              {resettingDemoAccId === acc.accountId
                                ? "Resetting..."
                                : "Reset Demo Balance"}
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : profileSubView === "general_settings" ? (
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100">
                  <button
                    type="button"
                    onClick={() => setProfileSubView(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <h2 className="text-base font-bold text-gray-900">
                    General settings
                  </h2>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                    Security
                  </p>
                  {/* Transaction PIN */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Transaction PIN
                      </p>
                      <p className="text-xs text-gray-400">
                        Required for withdrawals
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-semibold"
                        style={{
                          color: transactionPin ? "#16a34a" : "#9ca3af",
                        }}
                      >
                        {transactionPin ? "Set" : "Not set"}
                      </span>
                      <button
                        type="button"
                        data-ocid="dashboard.settings.set_pin.button"
                        onClick={() => {
                          setShowSetPin(true);
                          setPinStep("enter");
                          setPinInput("");
                          setPinConfirm("");
                        }}
                        className="text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg px-2.5 py-1 hover:bg-blue-50"
                      >
                        {transactionPin ? "Change" : "Set PIN"}
                      </button>
                    </div>
                  </div>
                  {/* 2FA */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Two-Factor Authentication
                      </p>
                      <p className="text-xs text-gray-400">
                        Google Authenticator
                      </p>
                    </div>
                    <button
                      type="button"
                      data-ocid="dashboard.settings.2fa.toggle"
                      onClick={() => {
                        if (twoFAEnabled) {
                          setShow2FADisableConfirm(true);
                        } else {
                          const secret =
                            Math.random()
                              .toString(36)
                              .substring(2, 10)
                              .toUpperCase() +
                            Math.random()
                              .toString(36)
                              .substring(2, 10)
                              .toUpperCase();
                          setTwoFASecret(secret);
                          setTwoFACodeInput("");
                          setShow2FASetup(true);
                        }
                      }}
                      className="w-10 h-5 rounded-full relative transition-colors flex-shrink-0"
                      style={{
                        background: twoFAEnabled ? "#16a34a" : "#e5e7eb",
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full bg-white absolute top-0.5 shadow-sm transition-transform"
                        style={{
                          transform: twoFAEnabled
                            ? "translateX(22px)"
                            : "translateX(2px)",
                        }}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-900">
                      App Theme
                    </span>
                    <span className="text-xs text-gray-500 font-semibold">
                      Light
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 mt-5">
                    Trading
                  </p>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        One click trading
                      </p>
                      <p className="text-xs text-gray-400">
                        Place orders with a single tap
                      </p>
                    </div>
                    <button
                      type="button"
                      data-ocid="dashboard.settings.one_click_trading.toggle"
                      onClick={toggleOneClickTrading}
                      className="w-10 h-5 rounded-full relative transition-colors flex-shrink-0"
                      style={{
                        background: oneClickTrading ? "#2563eb" : "#e5e7eb",
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full bg-white absolute top-0.5 shadow-sm transition-transform"
                        style={{
                          transform: oneClickTrading
                            ? "translateX(22px)"
                            : "translateX(2px)",
                        }}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Risk managed trading
                      </p>
                      <p className="text-xs text-gray-400">
                        Auto risk management on orders
                      </p>
                    </div>
                    <button
                      type="button"
                      className="w-10 h-5 rounded-full relative flex-shrink-0"
                      style={{ background: "#e5e7eb" }}
                    >
                      <div
                        className="w-4 h-4 rounded-full bg-white absolute top-0.5 shadow-sm"
                        style={{ transform: "translateX(2px)" }}
                      />
                    </button>
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 mt-5">
                    Alerts
                  </p>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-900">
                      Notification preferences
                    </span>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                  {/* Leaderboard opt-out */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Leaderboard visibility
                      </p>
                      <p className="text-xs text-gray-400">
                        Show your name on the leaderboard
                      </p>
                    </div>
                    <button
                      type="button"
                      data-ocid="dashboard.settings.leaderboard_visible.toggle"
                      onClick={() => {
                        const cur =
                          localStorage.getItem("mtex_leaderboard_optout") ===
                          "true";
                        localStorage.setItem(
                          "mtex_leaderboard_optout",
                          cur ? "false" : "true",
                        );
                      }}
                      className="w-10 h-5 rounded-full relative transition-colors flex-shrink-0"
                      style={{
                        background:
                          localStorage.getItem("mtex_leaderboard_optout") ===
                          "true"
                            ? "#e5e7eb"
                            : "#16a34a",
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full bg-white absolute top-0.5 shadow-sm transition-transform"
                        style={{
                          transform:
                            localStorage.getItem("mtex_leaderboard_optout") ===
                            "true"
                              ? "translateX(2px)"
                              : "translateX(22px)",
                        }}
                      />
                    </button>
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 mt-5">
                    Login Activity
                  </p>
                  {(() => {
                    let history: Array<{ timestamp: string; device: string }> =
                      [];
                    try {
                      history = JSON.parse(
                        localStorage.getItem("mtex_login_history") || "[]",
                      );
                    } catch {}
                    if (history.length === 0) {
                      return (
                        <p className="text-xs text-gray-400 italic py-2">
                          No login history available.
                        </p>
                      );
                    }
                    const getDeviceInfo = (ua: string) => {
                      const isMobile = /mobile|android|iphone|ipad/i.test(ua);
                      let browser = "Unknown";
                      if (/chrome/i.test(ua) && !/edge|opr/i.test(ua))
                        browser = "Chrome";
                      else if (/firefox/i.test(ua)) browser = "Firefox";
                      else if (/safari/i.test(ua) && !/chrome/i.test(ua))
                        browser = "Safari";
                      else if (/edge/i.test(ua)) browser = "Edge";
                      return { type: isMobile ? "Mobile" : "Desktop", browser };
                    };
                    return (
                      <div
                        className="space-y-2"
                        data-ocid="dashboard.settings.login_activity.list"
                      >
                        {history.slice(0, 5).map((entry, i) => {
                          const { type, browser } = getDeviceInfo(
                            entry.device || "",
                          );
                          const dt = new Date(entry.timestamp);
                          return (
                            <div
                              key={`${entry.timestamp || ""}-${String(i)}`}
                              data-ocid={`dashboard.settings.login_activity.item.${i + 1}`}
                              className="flex items-center justify-between py-2 border-b border-gray-50"
                            >
                              <div>
                                <p className="text-xs font-semibold text-gray-800">
                                  {type} · {browser}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  {dt.toLocaleDateString()}{" "}
                                  {dt.toLocaleTimeString()}
                                </p>
                              </div>
                              <span className="text-[10px] text-gray-400 bg-gray-100 rounded px-2 py-0.5">
                                {type === "Mobile" ? "📱" : "💻"} {type}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : profileSubView === "support" ? (
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100">
                  <button
                    type="button"
                    onClick={() => setProfileSubView(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <h2 className="text-base font-bold text-gray-900">Support</h2>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  <p className="text-sm text-gray-500 mb-6">
                    Need assistance? Choose from our help topics or connect with
                    a support agent for real-time help.
                  </p>
                  {[
                    {
                      label: "Most common topics",
                      icon: <BookOpen size={18} className="text-blue-600" />,
                      sub: "Browse FAQs",
                    },
                    {
                      label: "Explore help centre",
                      icon: <Globe size={18} className="text-blue-600" />,
                      sub: "Open in browser",
                    },
                    {
                      label: "Telegram",
                      icon: <Activity size={18} className="text-blue-600" />,
                      sub: "@mtextrading",
                    },
                    {
                      label: "WhatsApp",
                      icon: <Activity size={18} className="text-blue-600" />,
                      sub: "Chat on WhatsApp",
                    },
                    {
                      label: "Chat with an agent",
                      icon: <HelpCircle size={18} className="text-blue-600" />,
                      sub: "In-app chat",
                    },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.label}
                      data-ocid={`dashboard.support.$item.label.toLowerCase().replace(/\s+/g, "_").button`}
                      className="w-full flex items-center justify-between py-4 border-b border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">
                            {item.label}
                          </p>
                          <p className="text-xs text-gray-400">{item.sub}</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="px-5 py-2">
                {/* Avatar & name */}
                <div className="flex flex-col items-center mb-6">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3"
                    style={{ background: "#2563eb" }}
                  >
                    {userInitials}
                  </div>
                  <p className="text-lg font-bold text-gray-900">{userName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-gray-500">ID: {userId}</p>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(userId);
                        toast.success("ID copied!");
                      }}
                      className="text-gray-400"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Mtextrading member since {memberSince}
                  </p>
                </div>

                <button
                  type="button"
                  data-ocid="dashboard.profile.switch_button"
                  onClick={() => {
                    setShowProfile(false);
                    setShowSwitchAccount(true);
                  }}
                  className="w-full py-3 rounded-full border-2 border-gray-900 text-gray-900 text-sm font-semibold mb-5"
                >
                  Switch to practice trading
                </button>

                {[
                  {
                    label: "Personal details",
                    icon: <Users size={18} className="text-blue-600" />,
                    action: () => setProfileSubView("personal_details"),
                  },
                  {
                    label: "Accounts",
                    icon: <Wallet size={18} className="text-blue-600" />,
                    badge: accounts.length || 1,
                    action: (() => setProfileSubView("accounts")) as
                      | (() => void)
                      | undefined,
                  },
                  {
                    label: "Verification",
                    icon: <ShieldCheck size={18} className="text-blue-600" />,
                    action: () => setProfileSubView("kyc"),
                  },
                  {
                    label: "General settings",
                    icon: <Globe size={18} className="text-blue-600" />,
                    action: (() => setProfileSubView("general_settings")) as
                      | (() => void)
                      | undefined,
                  },
                  {
                    label: "Support",
                    icon: <HelpCircle size={18} className="text-blue-600" />,
                    action: (() => setProfileSubView("support")) as
                      | (() => void)
                      | undefined,
                  },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.label}
                    data-ocid={`dashboard.profile.${item.label.toLowerCase().replace(/\s+/g, "_")}.link`}
                    onClick={item.action}
                    className="w-full flex items-center justify-between py-4 border-b border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span className="text-sm font-medium text-gray-900">
                        {item.label}
                      </span>
                      {"badge" in item && item.badge ? (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      ) : null}
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </button>
                ))}

                <button
                  type="button"
                  data-ocid="dashboard.sign_out.button"
                  onClick={() => {
                    localStorage.removeItem("mtex_logged_in");
                    localStorage.removeItem("mtex_current_email");
                    for (const k of Object.keys(localStorage)) {
                      if (k.startsWith("mtex_identity_seed_"))
                        localStorage.removeItem(k);
                    }
                    onNavigate("landing");
                  }}
                  className="w-full text-center text-sm font-semibold mt-6 py-3"
                  style={{ color: "#1565c0" }}
                >
                  Sign out
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Notifications Panel ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.22 }}
            className="absolute inset-0 bg-white z-50 flex flex-col"
            data-ocid="dashboard.notifications.panel"
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">
                Notifications
              </h2>
              <div className="flex items-center gap-2">
                {notifications.some((n) => !n.isRead) && (
                  <button
                    type="button"
                    data-ocid="dashboard.notifications.mark_read_button"
                    onClick={() => {
                      if (actor) actor.markNotificationsRead().catch(() => {});
                      setNotifications((prev) =>
                        prev.map((n) => ({ ...n, isRead: true })),
                      );
                    }}
                    className="text-xs text-blue-600 font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  data-ocid="dashboard.notifications.close_button"
                  onClick={() => setShowNotifications(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center gap-3 px-5 py-16"
                  data-ocid="dashboard.notifications.empty_state"
                >
                  <TreasureChestIcon />
                  <p className="text-sm text-gray-500 text-center">
                    No notifications yet.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((n, idx) => {
                    const ts = Number(n.timestamp) / 1_000_000;
                    const diff = Date.now() - ts;
                    const mins = Math.floor(diff / 60000);
                    const hrs = Math.floor(diff / 3600000);
                    const days = Math.floor(diff / 86400000);
                    const relTime =
                      mins < 1
                        ? "Just now"
                        : mins < 60
                          ? `${mins}m ago`
                          : hrs < 24
                            ? `${hrs}h ago`
                            : `${days}d ago`;
                    return (
                      <div
                        key={String(n.id)}
                        data-ocid={`dashboard.notifications.item.${String(idx + 1)}`}
                        className={[
                          "flex gap-3 px-5 py-4",
                          !n.isRead ? "bg-blue-50" : "",
                        ].join(" ")}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: "#e3f2fd" }}
                        >
                          <Bell size={14} className="text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {n.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {n.body}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {relTime}
                          </p>
                        </div>
                        {!n.isRead && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Switch Account Bottom Sheet ──────────────────────────────────── */}
      <AnimatePresence>
        {showSwitchAccount && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.3)" }}
              onClick={() => setShowSwitchAccount(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="absolute bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl"
              data-ocid="dashboard.switch_account.sheet"
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </div>
              <div className="px-5 pt-2 pb-8">
                <h3 className="text-base font-bold text-gray-900 mb-4">
                  Switch account
                </h3>
                {accounts.length > 0 ? (
                  accounts.map((acc, i) => (
                    <button
                      type="button"
                      key={String(acc.accountId)}
                      data-ocid={`dashboard.account.item.${i + 1}`}
                      onClick={() => {
                        setActiveAccountIdx(i);
                        setShowSwitchAccount(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl mb-2 border"
                      style={{
                        background:
                          i === activeAccountIdx ? "#e3f2fd" : "#f8fafc",
                        borderColor:
                          i === activeAccountIdx ? "#2563eb" : "#e2e8f0",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🇺🇸</span>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900">
                              {String(acc.accountType) === "demo"
                                ? "Demo Account"
                                : "Live Account"}
                            </p>
                            {String(acc.accountType) === "demo" && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                DEMO
                              </span>
                            )}
                            {String(acc.accountType) === "live" && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                                LIVE
                              </span>
                            )}
                            {(() => {
                              const subtype =
                                localStorage.getItem("mtex_account_subtype") ||
                                "Standard";
                              const colors: Record<
                                string,
                                { bg: string; text: string }
                              > = {
                                Standard: { bg: "#f3f4f6", text: "#6b7280" },
                                ECN: { bg: "#eff6ff", text: "#2563eb" },
                                Islamic: { bg: "#f0fdf4", text: "#16a34a" },
                              };
                              const c = colors[subtype] || colors.Standard;
                              return (
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                  style={{ background: c.bg, color: c.text }}
                                >
                                  {subtype}
                                </span>
                              );
                            })()}
                          </div>
                          <p className="text-xs text-gray-500">
                            {acc.accountCode || `#${String(acc.accountId)}`}
                          </p>
                          <p className="text-xs font-semibold text-gray-700">
                            $
                            {acc.balance.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>
                      {i === activeAccountIdx && (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: "#2563eb" }}
                        >
                          <svg
                            aria-hidden="true"
                            width="10"
                            height="8"
                            viewBox="0 0 10 8"
                            fill="none"
                          >
                            <path
                              d="M1 4L3.5 6.5L9 1"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-6 text-sm text-gray-500">
                    No accounts found
                  </div>
                )}

                {/* ── Create Account Buttons ── */}
                <div className="mt-3 space-y-2 pb-2">
                  <button
                    type="button"
                    data-ocid="dashboard.switch_account.create_demo.button"
                    disabled={createDemoLoading}
                    onClick={async () => {
                      if (!actor) return;
                      setCreateDemoLoading(true);
                      try {
                        await actor.createDemoAccount();
                        const newAccounts = await actor.getOwnAccounts();
                        setAccounts(newAccounts);
                        setActiveAccountIdx(newAccounts.length - 1);
                        setShowSwitchAccount(false);
                        toast.success("Demo account created with $100,000");
                      } catch (e: unknown) {
                        toast.error(
                          e instanceof Error
                            ? e.message
                            : "Failed to create demo account",
                        );
                      } finally {
                        setCreateDemoLoading(false);
                      }
                    }}
                    className="w-full py-3 rounded-xl text-sm font-semibold border-2 border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 transition-colors"
                  >
                    {createDemoLoading
                      ? "Creating..."
                      : "+ Create Demo Account"}
                  </button>
                  <button
                    type="button"
                    data-ocid="dashboard.switch_account.create_live.button"
                    onClick={() => {
                      setShowSwitchAccount(false);
                      setActiveTab("funds");
                      setFundsSubTab("deposit");
                      setDepositHighlight(true);
                      setTimeout(() => setDepositHighlight(false), 3000);
                    }}
                    className="w-full py-3 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    + Create Live Account
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
        <button
          type="button"
          data-ocid="dashboard.avatar.button"
          onClick={() => setShowProfile(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: "#2563eb" }}
        >
          {userInitials}
        </button>

        <button
          type="button"
          data-ocid="dashboard.account_selector.toggle"
          onClick={() => setShowSwitchAccount(true)}
          className="flex items-center gap-1 sm:gap-2 rounded-full px-2 sm:px-4 py-2 border text-sm font-semibold text-gray-800 bg-white min-w-0 max-w-[160px] sm:max-w-none"
          style={{ borderColor: "#e2e8f0" }}
        >
          <span>🇺🇸</span>
          <span className="text-xs text-gray-700 truncate min-w-0">
            {accountNumber}
          </span>
          {activeAccount && String(activeAccount.accountType) === "demo" && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 shrink-0">
              DEMO
            </span>
          )}
          {activeAccount && String(activeAccount.accountType) === "live" && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700 shrink-0">
              LIVE
            </span>
          )}
          <ChevronDown size={12} className="text-gray-500" />
        </button>

        <button
          type="button"
          data-ocid="dashboard.notifications.button"
          onClick={() => {
            setShowNotifications(true);
            // mark as read in backend and locally
            if (actor) {
              actor.markNotificationsRead().catch(() => {});
            }
            setNotifications((prev) =>
              prev.map((n) => ({ ...n, isRead: true })),
            );
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center relative hover:bg-gray-50"
        >
          <Bell size={20} className="text-gray-700" />
          {notifications.filter((n) => !n.isRead).length > 0 && (
            <span
              className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5"
              data-ocid="dashboard.notifications.badge"
            >
              {notifications.filter((n) => !n.isRead).length > 9
                ? "9+"
                : notifications.filter((n) => !n.isRead).length}
            </span>
          )}
        </button>
      </header>

      {/* ── Push Notification Banner ─────────────────────────────────── */}
      {showPushBanner && (
        <div
          className="flex items-center gap-3 px-4 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-800"
          data-ocid="dashboard.push_notification.banner"
        >
          <Bell size={14} className="flex-shrink-0 text-blue-600" />
          <span className="flex-1">
            Enable browser notifications to stay updated on your account
            activity.
          </span>
          <button
            type="button"
            data-ocid="dashboard.push_notification.allow_button"
            onClick={() => {
              Notification.requestPermission().then((perm) => {
                if (perm === "granted") {
                  localStorage.setItem("mtex_push_dismissed", "true");
                  try {
                    new Notification("Mtextrading", {
                      body: "Notifications enabled! You will now receive updates.",
                      icon: "/favicon.ico",
                    });
                  } catch {}
                }
              });
              setShowPushBanner(false);
            }}
            className="font-semibold text-blue-700 whitespace-nowrap"
          >
            Allow
          </button>
          <button
            type="button"
            data-ocid="dashboard.push_notification.dismiss_button"
            onClick={() => {
              localStorage.setItem("notif_perm_dismissed", "1");
              setShowPushBanner(false);
            }}
            className="text-blue-500 whitespace-nowrap"
          >
            Not now
          </button>
        </div>
      )}

      {/* ── Scrollable Content ────────────────────────────────────────── */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {BalanceSection}
        {activeTab === "home" && HomeTab}
        {activeTab === "trade" && TradeTab}
        {activeTab === "positions" && PositionsTab}
        {activeTab === "funds" && FundsTab}
        {activeTab === "hub" && HubTab}
      </main>

      {/* ── Bottom Navigation ─────────────────────────────────────────── */}
      <nav
        data-ocid="dashboard.bottom_nav.panel"
        className="flex items-center justify-around px-1 pt-1 pb-2 bg-white border-t border-gray-200 flex-shrink-0"
      >
        {(
          [
            { key: "home", label: "Home", Icon: Home },
            { key: "trade", label: "Trade", Icon: TrendingUp },
            { key: "positions", label: "Positions", Icon: BarChart2 },
            { key: "funds", label: "Funds", Icon: DollarSign },
            { key: "hub", label: "Hub", Icon: LayoutGrid },
          ] as {
            key: BottomTab;
            label: string;
            Icon: React.ComponentType<{ size?: number }>;
          }[]
        ).map(({ key, label, Icon }) => (
          <button
            type="button"
            key={key}
            data-ocid={`dashboard.nav.${key}.tab`}
            onClick={() => {
              setActiveTab(key);
              if (key !== "trade") setSelectedInstrument(null);
            }}
            className="flex flex-col items-center gap-0.5 px-3 pt-2 pb-1 relative min-w-0"
            style={{ color: activeTab === key ? "#1565c0" : "#9ca3af" }}
          >
            {activeTab === key && (
              <span
                className="absolute top-0 left-2 right-2 h-0.5 rounded-b-full"
                style={{ background: "#1565c0" }}
              />
            )}
            <Icon size={20} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </nav>
      <FloatingChatButton actor={actor} />
      <AIAssistantButton />

      {/* ── Transaction PIN Setup Modal ─────────────────────────────── */}
      <AnimatePresence>
        {showSetPin && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowSetPin(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl px-5 pt-4 pb-8"
              data-ocid="dashboard.pin_setup.sheet"
            >
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">
                {transactionPin
                  ? "Change Transaction PIN"
                  : "Set Transaction PIN"}
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                {pinStep === "enter"
                  ? "Enter a 4-digit PIN"
                  : "Confirm your PIN"}
              </p>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                data-ocid="dashboard.pin_setup.input"
                value={pinStep === "enter" ? pinInput : pinConfirm}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                  if (pinStep === "enter") setPinInput(val);
                  else setPinConfirm(val);
                }}
                className="w-full text-center text-3xl font-bold tracking-[0.5em] border-2 border-gray-300 rounded-xl px-4 py-4 mb-4 focus:border-blue-500 outline-none"
                placeholder="••••"
              />
              <button
                type="button"
                data-ocid="dashboard.pin_setup.submit_button"
                disabled={
                  pinStep === "enter"
                    ? pinInput.length !== 4
                    : pinConfirm.length !== 4
                }
                onClick={() => {
                  if (pinStep === "enter") {
                    setPinStep("confirm");
                  } else {
                    if (pinInput === pinConfirm) {
                      setTransactionPin(pinInput);
                      localStorage.setItem("mtex_txpin", pinInput);
                      setShowSetPin(false);
                      toast.success("Transaction PIN set successfully");
                    } else {
                      toast.error("PINs do not match. Try again.");
                      setPinStep("enter");
                      setPinInput("");
                      setPinConfirm("");
                    }
                  }
                }}
                className="w-full py-3.5 rounded-xl text-white font-bold text-base disabled:opacity-50"
                style={{ background: "#1a2332" }}
              >
                {pinStep === "enter" ? "Continue" : "Confirm PIN"}
              </button>
              {pinStep === "confirm" && (
                <button
                  type="button"
                  onClick={() => {
                    setPinStep("enter");
                    setPinConfirm("");
                  }}
                  className="w-full py-2 text-sm text-gray-500 mt-2"
                >
                  ← Back
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Transaction PIN Verify Modal ────────────────────────────── */}
      <AnimatePresence>
        {showPinVerify && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => {
                setShowPinVerify(false);
                setPendingWithdrawal(null);
              }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl px-5 pt-4 pb-8"
              data-ocid="dashboard.pin_verify.sheet"
            >
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">
                Confirm Transaction PIN
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Enter your 4-digit PIN to continue
              </p>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                data-ocid="dashboard.pin_verify.input"
                value={pinVerifyInput}
                onChange={(e) =>
                  setPinVerifyInput(
                    e.target.value.replace(/\D/g, "").slice(0, 4),
                  )
                }
                className="w-full text-center text-3xl font-bold tracking-[0.5em] border-2 border-gray-300 rounded-xl px-4 py-4 mb-4 focus:border-blue-500 outline-none"
                placeholder="••••"
              />
              <button
                type="button"
                data-ocid="dashboard.pin_verify.confirm_button"
                disabled={pinVerifyInput.length !== 4}
                onClick={() => {
                  if (pinVerifyInput === transactionPin) {
                    setShowPinVerify(false);
                    if (pendingWithdrawal) {
                      pendingWithdrawal();
                      setPendingWithdrawal(null);
                    }
                  } else {
                    toast.error("Incorrect PIN. Please try again.");
                    setPinVerifyInput("");
                  }
                }}
                className="w-full py-3.5 rounded-xl text-white font-bold text-base disabled:opacity-50"
                style={{ background: "#1a2332" }}
              >
                Verify &amp; Proceed
              </button>
              <button
                type="button"
                data-ocid="dashboard.pin_verify.cancel_button"
                onClick={() => {
                  setShowPinVerify(false);
                  setPendingWithdrawal(null);
                }}
                className="w-full py-2 text-sm text-gray-500 mt-2"
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── 2FA Setup Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {show2FASetup && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShow2FASetup(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl px-5 pt-4 pb-8 max-h-[90vh] overflow-y-auto"
              data-ocid="dashboard.2fa_setup.sheet"
            >
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">
                Set Up Two-Factor Authentication
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <p className="text-xs font-semibold text-blue-800 mb-2">
                  Follow these steps:
                </p>
                <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Open the Google Authenticator app</li>
                  <li>Tap + → &quot;Enter a setup key&quot;</li>
                  <li>
                    Account name: <strong>Mtextrading</strong>
                  </li>
                  <li>Enter the key below</li>
                  <li>Enter the 6-digit code shown in the app</li>
                </ol>
              </div>
              <div className="bg-gray-100 rounded-xl p-3 mb-4">
                <p className="text-xs text-gray-500 mb-1">Your secret key:</p>
                <p className="text-sm font-mono font-bold text-gray-900 tracking-widest break-all">
                  {twoFASecret}
                </p>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                Enter the 6-digit code from Google Authenticator:
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                data-ocid="dashboard.2fa_setup.code_input"
                value={twoFACodeInput}
                onChange={(e) =>
                  setTwoFACodeInput(
                    e.target.value.replace(/\D/g, "").slice(0, 6),
                  )
                }
                className="w-full text-center text-2xl font-bold tracking-[0.4em] border-2 border-gray-300 rounded-xl px-4 py-3 mb-4 focus:border-blue-500 outline-none"
                placeholder="000000"
              />
              <button
                type="button"
                data-ocid="dashboard.2fa_setup.confirm_button"
                disabled={twoFACodeInput.length !== 6}
                onClick={() => {
                  // Accept any 6-digit code (demo/MVP -- real TOTP needs server-side verification)
                  localStorage.setItem("mtex_2fa_secret", twoFASecret);
                  localStorage.setItem("mtex_2fa_enabled", "true");
                  setTwoFAEnabled(true);
                  setShow2FASetup(false);
                  toast.success(
                    "Two-Factor Authentication enabled successfully",
                  );
                }}
                className="w-full py-3.5 rounded-xl text-white font-bold text-base disabled:opacity-50"
                style={{ background: "#1a2332" }}
              >
                Enable 2FA
              </button>
              <button
                type="button"
                data-ocid="dashboard.2fa_setup.cancel_button"
                onClick={() => setShow2FASetup(false)}
                className="w-full py-2 text-sm text-gray-500 mt-2"
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── 2FA Disable Confirm Modal ────────────────────────────────── */}
      <AnimatePresence>
        {show2FADisableConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShow2FADisableConfirm(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl px-5 pt-4 pb-8"
              data-ocid="dashboard.2fa_disable.sheet"
            >
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">
                Disable Two-Factor Authentication?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Disabling 2FA will remove the extra layer of security from your
                account. Are you sure?
              </p>
              <button
                type="button"
                data-ocid="dashboard.2fa_disable.confirm_button"
                onClick={() => {
                  localStorage.removeItem("mtex_2fa_secret");
                  localStorage.setItem("mtex_2fa_enabled", "false");
                  setTwoFAEnabled(false);
                  setTwoFASecret("");
                  setShow2FADisableConfirm(false);
                  toast.success("Two-Factor Authentication disabled");
                }}
                className="w-full py-3.5 rounded-xl text-white font-bold text-base mb-2"
                style={{ background: "#dc2626" }}
              >
                Yes, Disable 2FA
              </button>
              <button
                type="button"
                data-ocid="dashboard.2fa_disable.cancel_button"
                onClick={() => setShow2FADisableConfirm(false)}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700"
              >
                Keep 2FA Enabled
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Margin Call Warning Banner (in Positions) ───────────────── */}

      {/* ── Terms & Conditions Modal ──────────────────────────────────── */}
      {showTCModal && (
        <div
          className="fixed inset-0 bg-black/70 z-[200] flex items-end sm:items-center justify-center p-4"
          data-ocid="dashboard.tc.modal"
        >
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                Terms &amp; Conditions
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Please read and accept our terms before using the platform.
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 text-sm text-gray-700 space-y-4 leading-relaxed">
              <p className="font-semibold text-gray-900">
                1. Trading Risk Disclosure
              </p>
              <p>
                Trading leveraged financial instruments such as forex, CFDs,
                cryptocurrencies, and indices involves significant risk of
                financial loss, including the possibility of losing more than
                your initial deposit. Leveraged products are not appropriate for
                all investors. Past performance is not a reliable indicator of
                future results.
              </p>
              <p className="font-semibold text-gray-900">
                2. Platform Usage Rules
              </p>
              <p>
                You agree to use the Mtextrading platform solely for lawful
                trading activities. Any attempt to manipulate market prices,
                exploit system vulnerabilities, or engage in fraudulent
                behaviour will result in immediate account termination and
                possible legal action. You must be at least 18 years of age to
                use this platform.
              </p>
              <p className="font-semibold text-gray-900">
                3. Account Responsibility
              </p>
              <p>
                You are solely responsible for maintaining the confidentiality
                of your account credentials. Mtextrading is not liable for any
                losses arising from unauthorised access to your account. You
                agree to notify us immediately of any suspected breach of
                security. All deposits and withdrawals are subject to our
                verification procedures.
              </p>
              <p className="font-semibold text-gray-900">
                4. Risk Management &amp; Negative Balance Protection
              </p>
              <p>
                While Mtextrading provides negative balance protection to
                prevent your account balance from falling below zero, you should
                always implement appropriate risk management strategies
                including stop-loss orders. The platform may close positions
                automatically in response to adverse market conditions or margin
                calls. You acknowledge that market volatility can result in
                rapid and significant losses.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <button
                type="button"
                data-ocid="dashboard.tc.accept_button"
                onClick={() => {
                  localStorage.setItem("mtex_tc_accepted", "true");
                  setShowTCModal(false);
                }}
                className="w-full py-3.5 rounded-xl text-white font-bold text-base"
                style={{ background: "#1a2332" }}
              >
                I Accept the Terms &amp; Conditions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Risk Disclosure Modal ────────────────────────────────────── */}
      {showRiskModal && (
        <div
          className="fixed inset-0 bg-black/60 z-[200] flex items-end sm:items-center justify-center p-4"
          data-ocid="dashboard.risk.modal"
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 pt-6 pb-4">
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                ⚠️ Risk Disclosure
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                Trading involves significant risk of loss and is not suitable
                for all investors. Leveraged trading can result in losses
                exceeding your initial deposit. Please ensure you understand the
                risks before trading. Past performance is not indicative of
                future results.
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                type="button"
                data-ocid="dashboard.risk.cancel_button"
                onClick={() => {
                  setShowRiskModal(false);
                  setPendingOrderAfterRisk(null);
                }}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                data-ocid="dashboard.risk.confirm_button"
                onClick={async () => {
                  localStorage.setItem("mtex_risk_accepted", "true");
                  setShowRiskModal(false);
                  if (pendingOrderAfterRisk) {
                    await pendingOrderAfterRisk();
                  }
                  setPendingOrderAfterRisk(null);
                }}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm"
                style={{ background: "#1a2332" }}
              >
                I Understand, Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
