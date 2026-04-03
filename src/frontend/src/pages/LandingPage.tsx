import {
  BarChart2,
  Bitcoin,
  BookOpen,
  Building,
  CandlestickChart,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  CreditCard,
  DollarSign,
  Facebook,
  FileText,
  Flame,
  Globe,
  GraduationCap,
  Headphones,
  Instagram,
  Landmark,
  Layers,
  Menu,
  Monitor,
  Shield,
  TrendingUp,
  Trophy,
  Twitter,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useState } from "react";
import type { AppPage } from "../App";
import PromoCarousel from "../components/PromoCarousel";
import { useLivePrices } from "../hooks/useLivePrices";

interface Props {
  onNavigate: (page: AppPage) => void;
  isAuthenticated: boolean;
}

const TICKER_ITEMS = [
  { name: "Nasdaq 100", price: "24,442.4", change: "-0.43%", positive: false },
  { name: "EUR/USD", price: "1.14372", change: "-0.64%", positive: false },
  { name: "BTC/USD", price: "71,828", change: "+1.80%", positive: true },
  { name: "Gold", price: "2,045", change: "+0.21%", positive: true },
  { name: "Oil", price: "78.5", change: "-0.31%", positive: false },
  { name: "S&P 500", price: "5,204.3", change: "+0.51%", positive: true },
  { name: "GBP/USD", price: "1.27841", change: "-0.12%", positive: false },
  { name: "ETH/USD", price: "3,421", change: "+2.14%", positive: true },
];

const FOREX_HEAT = [
  { pair: "EUR/USD", val: "-0.64", pos: false },
  { pair: "GBP/USD", val: "-0.12", pos: false },
  { pair: "USD/JPY", val: "+0.38", pos: true },
  { pair: "USD/CHF", val: "+0.22", pos: true },
  { pair: "AUD/USD", val: "-0.41", pos: false },
  { pair: "USD/CAD", val: "+0.17", pos: true },
  { pair: "NZD/USD", val: "-0.29", pos: false },
  { pair: "EUR/GBP", val: "-0.51", pos: false },
  { pair: "EUR/JPY", val: "-0.27", pos: false },
  { pair: "GBP/JPY", val: "+0.26", pos: true },
  { pair: "CHF/JPY", val: "+0.15", pos: true },
  { pair: "AUD/JPY", val: "-0.04", pos: false },
  { pair: "EUR/AUD", val: "-0.23", pos: false },
  { pair: "EUR/CAD", val: "-0.47", pos: false },
  { pair: "GBP/AUD", val: "+0.31", pos: true },
  { pair: "USD/CNY", val: "+0.08", pos: true },
];

const SVG_LINE =
  "M 0 80 C 40 75, 80 60, 120 55 S 180 45, 220 50 S 280 30, 320 25 S 380 35, 420 20 S 480 10, 520 15 S 580 5, 620 8";

export default function LandingPage({ onNavigate, isAuthenticated }: Props) {
  const { prices: livePrices, getChangePct } = useLivePrices();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedAnalysis, setExpandedAnalysis] = useState<number | null>(0);
  const [activeMarketTab, setActiveMarketTab] = useState("Indices");

  const toggleAnalysis = (i: number) =>
    setExpandedAnalysis(expandedAnalysis === i ? null : i);

  return (
    <div
      className="min-h-screen bg-white font-body"
      style={{ color: "#111827" }}
    >
      {/* ============ HEADER ============ */}
      <header
        className="bg-white shadow-sm sticky top-0 z-50"
        data-ocid="header.panel"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <CandlestickChart size={28} style={{ color: "#3366ff" }} />
            <span
              className="text-xl font-extrabold font-display"
              style={{ color: "#111827" }}
            >
              Mtextrading
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a
              href="#markets"
              className="hover:text-blue-600 transition-colors"
              style={{ color: "#374151" }}
            >
              Markets
            </a>
            <a
              href="#trading"
              className="hover:text-blue-600 transition-colors"
              style={{ color: "#374151" }}
            >
              Trading
            </a>
            <a
              href="#why-us"
              className="hover:text-blue-600 transition-colors"
              style={{ color: "#374151" }}
            >
              Why Us
            </a>
            <a
              href="#education"
              className="hover:text-blue-600 transition-colors"
              style={{ color: "#374151" }}
            >
              Education
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <button
                type="button"
                data-ocid="nav.dashboard.button"
                onClick={() => onNavigate("dashboard")}
                className="px-5 py-2 rounded-lg font-semibold text-sm text-white transition-opacity hover:opacity-90"
                style={{ background: "#3366ff" }}
              >
                Dashboard
              </button>
            ) : (
              <>
                <button
                  type="button"
                  data-ocid="nav.login.button"
                  onClick={() => onNavigate("login")}
                  className="px-5 py-2 rounded-lg font-semibold text-sm border transition-colors hover:bg-gray-50"
                  style={{ borderColor: "#d1d5db", color: "#111827" }}
                >
                  Login
                </button>
                <button
                  type="button"
                  data-ocid="nav.register.button"
                  onClick={() => onNavigate("register")}
                  className="px-5 py-2 rounded-lg font-semibold text-sm text-white transition-opacity hover:opacity-90"
                  style={{ background: "#3366ff" }}
                >
                  Create Account
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            data-ocid="nav.toggle"
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden border-t px-4 py-4 flex flex-col gap-3"
            style={{ borderColor: "#e5e7eb" }}
          >
            <a
              href="#markets"
              className="py-2 font-medium"
              style={{ color: "#374151" }}
            >
              Markets
            </a>
            <a
              href="#trading"
              className="py-2 font-medium"
              style={{ color: "#374151" }}
            >
              Trading
            </a>
            <a
              href="#why-us"
              className="py-2 font-medium"
              style={{ color: "#374151" }}
            >
              Why Us
            </a>
            <a
              href="#education"
              className="py-2 font-medium"
              style={{ color: "#374151" }}
            >
              Education
            </a>
            <div className="flex flex-col gap-2 pt-2">
              {isAuthenticated ? (
                <button
                  type="button"
                  data-ocid="nav.mobile.dashboard.button"
                  onClick={() => {
                    onNavigate("dashboard");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 rounded-lg font-semibold text-sm text-white"
                  style={{ background: "#3366ff" }}
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    data-ocid="nav.mobile.login.button"
                    onClick={() => {
                      onNavigate("login");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2.5 rounded-lg font-semibold text-sm border"
                    style={{ borderColor: "#d1d5db" }}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    data-ocid="nav.mobile.register.button"
                    onClick={() => {
                      onNavigate("register");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2.5 rounded-lg font-semibold text-sm text-white"
                    style={{ background: "#3366ff" }}
                  >
                    Create Account
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ============ TICKER BAR ============ */}
      <div
        className="overflow-hidden py-2"
        style={{ background: "#eef2ff", borderBottom: "1px solid #e0e7ff" }}
      >
        <div className="ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => {
            const livePrice = livePrices[item.name];
            const pct = getChangePct(item.name);
            const isPositive = pct >= 0;
            const fmtPrice = livePrice
              ? item.name.includes("JPY")
                ? livePrice.toFixed(3)
                : livePrice > 10000
                  ? livePrice.toFixed(0)
                  : livePrice > 100
                    ? livePrice.toFixed(1)
                    : livePrice.toFixed(2)
              : item.price;
            const fmtPct = `${isPositive ? "+" : ""}${pct.toFixed(2)}%`;
            return (
              <div
                key={`${item.name}-${i}`}
                className="flex items-center gap-2 px-6 text-sm font-medium whitespace-nowrap"
              >
                <span style={{ color: "#374151" }}>{item.name}</span>
                <span className="font-semibold" style={{ color: "#111827" }}>
                  {fmtPrice}
                </span>
                <span
                  className="text-xs font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    background: isPositive ? "#d1fae5" : "#fee2e2",
                    color: isPositive ? "#065f46" : "#991b1b",
                  }}
                >
                  {fmtPct}
                </span>
                <span className="mx-2" style={{ color: "#d1d5db" }}>
                  |
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============ HERO ============ */}
      <section className="px-4 sm:px-6 pt-12 pb-8 max-w-7xl mx-auto">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-6"
          style={{ background: "#e0e7ff", color: "#3366ff" }}
        >
          INNOVATIVE TRADING PLATFORM
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-display leading-tight mb-5">
          <span style={{ color: "#111827" }}>Trade Global Markets</span>
          <br />
          <span style={{ color: "#3366ff" }}>With Confidence</span>
        </h1>
        <p className="text-lg" style={{ color: "#6b7280", maxWidth: "560px" }}>
          Access advanced trading tools for Forex, Crypto, Shares, Commodities
          and Indices with competitive spreads and fast execution.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-8 mb-10">
          <button
            type="button"
            data-ocid="hero.register.primary_button"
            onClick={() => onNavigate("register")}
            className="flex-1 sm:flex-none px-8 py-3.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
            style={{ background: "#3366ff" }}
          >
            Create Account
          </button>
          <button
            type="button"
            data-ocid="hero.login.secondary_button"
            onClick={() => onNavigate("login")}
            className="flex-1 sm:flex-none px-8 py-3.5 rounded-xl font-bold text-sm border transition-colors hover:bg-gray-50"
            style={{ borderColor: "#d1d5db", color: "#111827" }}
          >
            Login
          </button>
        </div>

        {/* Promo Carousel */}
        <div className="mb-6">
          <PromoCarousel
            variant="large"
            onSlideClick={() => onNavigate("register")}
          />
        </div>

        {/* TradingView Chart */}
        <div
          className="rounded-2xl overflow-hidden shadow-card border"
          style={{ borderColor: "#e5e7eb" }}
        >
          <iframe
            src="https://s.tradingview.com/widgetembed/?symbol=BITSTAMP%3ABTCUSD&interval=D&theme=light&style=1&locale=en&toolbar_bg=%23f1f3f6&withdateranges=1&hide_side_toolbar=0&allow_symbol_change=1&details=1&calendar=1"
            style={{ width: "100%", height: "400px", border: "none" }}
            title="TradingView Chart"
          />
        </div>
      </section>

      {/* ============ MARKET ANALYSIS ============ */}
      <section className="px-4 sm:px-6 py-14 max-w-7xl mx-auto" id="markets">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-4"
          style={{ background: "#d1fae5", color: "#065f46" }}
        >
          REAL-TIME INTELLIGENCE
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold font-display mb-3">
          Market Analysis & <span style={{ color: "#10b981" }}>Insights</span>
        </h2>
        <p
          className="text-base mb-8"
          style={{ color: "#6b7280", maxWidth: "520px" }}
        >
          Stay ahead with real-time market data, AI-powered insights, and expert
          analysis
        </p>

        <div
          className="bg-white rounded-2xl border shadow-card p-5 sm:p-7"
          style={{ borderColor: "#e5e7eb" }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-lg" style={{ color: "#111827" }}>
              Live Market Overview
            </h3>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {["Indices", "Futures", "Bonds", "Forex"].map((tab) => (
              <button
                type="button"
                key={tab}
                data-ocid={`markets.${tab.toLowerCase()}.tab`}
                onClick={() => setActiveMarketTab(tab)}
                className="px-4 py-1.5 rounded-full text-sm font-semibold transition-colors"
                style={{
                  background: activeMarketTab === tab ? "#3366ff" : "#f3f4f6",
                  color: activeMarketTab === tab ? "#ffffff" : "#6b7280",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* SVG Chart */}
          <div
            className="rounded-xl mb-4 relative overflow-hidden"
            style={{ background: "#f0fdf4", height: "100px" }}
          >
            <svg
              role="img"
              aria-label="Market trend chart"
              viewBox="0 0 620 100"
              preserveAspectRatio="none"
              width="100%"
              height="100"
            >
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={`${SVG_LINE} L 620 100 L 0 100 Z`}
                fill="url(#lineGrad)"
              />
              <path
                d={SVG_LINE}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
              />
            </svg>
          </div>

          {/* Time filters */}
          <div className="flex gap-1 mb-5">
            {["1D", "1M", "3M", "1Y", "5Y", "All"].map((t) => (
              <button
                type="button"
                key={t}
                className="px-3 py-1 rounded text-xs font-semibold transition-colors"
                style={{
                  background: t === "1Y" ? "#3366ff" : "transparent",
                  color: t === "1Y" ? "#ffffff" : "#9ca3af",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Instrument rows */}
          <div className="flex flex-col gap-1">
            {[
              {
                name: "S&P 500",
                badge: "500",
                badgeColor: "#ef4444",
                sym: "SPXUSD",
                price: "6,654.7",
                change: "-26.10",
                pct: "-0.39%",
                pos: false,
              },
              {
                name: "US 100",
                badge: "100",
                badgeColor: "#10b981",
                sym: "NSXUSD",
                price: "24,443.9",
                change: "+104.80",
                pct: "+0.43%",
                pos: true,
              },
              {
                name: "Dow 30",
                badge: "30",
                badgeColor: "#3366ff",
                sym: "DJI",
                price: "46,689.0",
                change: "-39.80",
                pct: "-0.09%",
                pos: false,
              },
              {
                name: "Nikkei 225",
                badge: "225",
                badgeColor: "#f97316",
                sym: "NKY",
                price: "53,819.6",
                change: "-633.35",
                pct: "-1.16%",
                pos: false,
              },
            ].map((row, i) => (
              <div
                key={row.sym}
                data-ocid={`markets.instrument.item.${i + 1}`}
                className="flex items-center justify-between py-3 border-b last:border-0"
                style={{ borderColor: "#f3f4f6" }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded text-white"
                    style={{ background: row.badgeColor }}
                  >
                    {row.badge}
                  </span>
                  <div>
                    <div
                      className="font-semibold text-sm"
                      style={{ color: "#111827" }}
                    >
                      {row.name}
                    </div>
                    <div className="text-xs" style={{ color: "#9ca3af" }}>
                      {row.sym}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="font-bold text-sm"
                    style={{ color: "#111827" }}
                  >
                    {row.price}
                  </div>
                  <div
                    className="text-xs font-semibold"
                    style={{ color: row.pos ? "#10b981" : "#ef4444" }}
                  >
                    {row.change} {row.pct}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ DIVERSE TRADING PRODUCTS ============ */}
      <section
        className="px-4 sm:px-6 py-14"
        style={{ background: "#f8f9fa" }}
        id="trading"
      >
        <div className="max-w-7xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-extrabold font-display mb-2"
            style={{ color: "#111827" }}
          >
            Diverse Trading Products
          </h2>
          <p className="text-base mb-10" style={{ color: "#6b7280" }}>
            Access global markets with competitive conditions
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Globe,
                title: "Forex",
                borderColor: "#3366ff",
                iconBg: "#e0e7ff",
                iconColor: "#3366ff",
                linkColor: "#3366ff",
                desc: "Trade major, minor and exotic currency pairs. Access 50+ currency pairs with competitive spreads starting from 0.0 pips.",
              },
              {
                icon: TrendingUp,
                title: "Shares",
                borderColor: "#10b981",
                iconBg: "#d1fae5",
                iconColor: "#10b981",
                linkColor: "#10b981",
                desc: "Invest in world's leading companies. Trade stocks from NYSE, NASDAQ, LSE and other major global exchanges.",
              },
              {
                icon: Flame,
                title: "Energies",
                borderColor: "#f59e0b",
                iconBg: "#fef3c7",
                iconColor: "#f59e0b",
                linkColor: "#f59e0b",
                desc: "Trade Crude Oil, Natural Gas and other energy commodities. Benefit from high liquidity and tight spreads.",
              },
              {
                icon: Building,
                title: "Indices",
                borderColor: "#6366f1",
                iconBg: "#ede9fe",
                iconColor: "#6366f1",
                linkColor: "#6366f1",
                desc: "Gain exposure to global economies through major indices like S&P 500, Dow Jones, FTSE 100 and more.",
              },
              {
                icon: Bitcoin,
                title: "Crypto",
                borderColor: "#f97316",
                iconBg: "#ffedd5",
                iconColor: "#f97316",
                linkColor: "#f97316",
                desc: "Trade Bitcoin, Ethereum and 30+ cryptocurrencies with leverage. Take advantage of 24/7 crypto markets.",
              },
            ].map((product, i) => (
              <div
                key={product.title}
                data-ocid={`products.item.${i + 1}`}
                className="bg-white rounded-2xl p-6 shadow-card border-l-4 transition-transform hover:-translate-y-1"
                style={{
                  borderLeftColor: product.borderColor,
                  border: "1px solid #e5e7eb",
                  borderLeft: `4px solid ${product.borderColor}`,
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: product.iconBg }}
                >
                  <product.icon
                    size={22}
                    style={{ color: product.iconColor }}
                  />
                </div>
                <h3
                  className="font-bold text-lg mb-2"
                  style={{ color: "#111827" }}
                >
                  {product.title}
                </h3>
                <p
                  className="text-sm mb-4"
                  style={{ color: "#6b7280", lineHeight: 1.6 }}
                >
                  {product.desc}
                </p>
                <button
                  type="button"
                  data-ocid={`products.explore.button.${i + 1}`}
                  onClick={() => onNavigate("register")}
                  className="text-sm font-semibold transition-opacity hover:opacity-75"
                  style={{ color: product.linkColor }}
                >
                  Explore {product.title} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PREMIUM TRADING EXPERIENCE ============ */}
      <section className="px-4 sm:px-6 py-14 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h2
              className="text-3xl sm:text-4xl font-extrabold font-display mb-4"
              style={{ color: "#10b981" }}
            >
              Premium Trading Experience
            </h2>
            <p
              className="text-base mb-6"
              style={{ color: "#374151", lineHeight: 1.8 }}
            >
              Experience deep liquidity with tight spreads and lightning-fast
              execution. Our institutional-grade infrastructure ensures you
              always get the best possible price for your trades across all
              asset classes.
            </p>
            <ul className="flex flex-col gap-3 mb-8">
              {[
                "Trade Forex, Indices, Shares & Commodities",
                "Access global markets 24 hours / 7 days",
                "Multilingual customer support",
                "Trade on the go on our mobile apps",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm font-medium"
                  style={{ color: "#374151" }}
                >
                  <CheckCircle
                    size={18}
                    style={{ color: "#3366ff", flexShrink: 0 }}
                  />
                  {item}
                </li>
              ))}
            </ul>
            <button
              type="button"
              data-ocid="premium.commissions.button"
              onClick={() => onNavigate("register")}
              className="px-7 py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: "#3366ff" }}
            >
              Learn About Our Commissions →
            </button>
          </div>
          <div
            className="rounded-2xl overflow-hidden shadow-card"
            style={{
              background: "#f0fdf4",
              minHeight: "280px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #d1fae5",
            }}
          >
            <svg
              role="img"
              aria-label="Price trend chart"
              viewBox="0 0 400 220"
              width="100%"
              height="220"
            >
              <defs>
                <linearGradient id="premGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 160 C 50 150, 80 130, 120 110 S 180 80, 220 70 S 280 55, 320 40 S 370 20, 400 15 L 400 220 L 0 220 Z"
                fill="url(#premGrad)"
              />
              <path
                d="M 0 160 C 50 150, 80 130, 120 110 S 180 80, 220 70 S 280 55, 320 40 S 370 20, 400 15"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
              />
              {[0, 60, 120, 180, 240, 300, 360, 400].map((x) => (
                <circle
                  key={x}
                  cx={x}
                  cy={
                    [160, 145, 125, 105, 82, 65, 45, 15][
                      [0, 60, 120, 180, 240, 300, 360, 400].indexOf(x)
                    ] ?? 80
                  }
                  r="4"
                  fill="#10b981"
                  opacity="0.8"
                />
              ))}
            </svg>
          </div>
        </div>
      </section>

      {/* ============ WHY TRADE WITH US ============ */}
      <section
        className="px-4 sm:px-6 py-14"
        style={{ background: "#f8f9fa" }}
        id="why-us"
      >
        <div className="max-w-7xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-extrabold font-display text-center mb-2"
            style={{ color: "#111827" }}
          >
            Why Trade With Us
          </h2>
          <p
            className="text-center text-base mb-10"
            style={{ color: "#6b7280" }}
          >
            Everything you need for successful trading
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: TrendingUp,
                bg: "#e0e7ff",
                color: "#3366ff",
                title: "Trading Tools",
                desc: "Plan your trades effectively with our wide range of free professional trading tools",
              },
              {
                icon: Layers,
                bg: "#d1fae5",
                color: "#10b981",
                title: "Trading Products",
                desc: "Diverse opportunities to optimize your trading portfolio across multiple markets",
              },
              {
                icon: Monitor,
                bg: "#e0e7ff",
                color: "#3366ff",
                title: "Trading Platforms",
                desc: "Powerful platforms to suit all trading styles and needs on any device",
              },
              {
                icon: Landmark,
                bg: "#fef3c7",
                color: "#f59e0b",
                title: "Education Center",
                desc: "Access our comprehensive library of trading guides and video tutorials",
              },
            ].map((item, i) => (
              <div
                key={item.title}
                data-ocid={`why.item.${i + 1}`}
                className="bg-white rounded-2xl p-6 shadow-card text-center"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: item.bg }}
                >
                  <item.icon size={24} style={{ color: item.color }} />
                </div>
                <h3
                  className="font-bold text-base mb-2"
                  style={{ color: "#111827" }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm"
                  style={{ color: "#6b7280", lineHeight: 1.6 }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="px-4 sm:px-6 py-14 max-w-7xl mx-auto">
        <h2
          className="text-3xl sm:text-4xl font-extrabold font-display text-center mb-10"
          style={{ color: "#111827" }}
        >
          How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              num: "1",
              title: "Open Account",
              desc: "Register in minutes with our simple online form with full verification and start trading immediately.",
              btn: null,
            },
            {
              num: "2",
              title: "Trade",
              desc: "Trade any of 100+ assets and stocks. Use technical analysis and trade the news for better results.",
              btn: {
                label: "Explore Markets →",
                action: "register" as AppPage,
              },
            },
            {
              num: "3",
              title: "Withdraw",
              desc: "Get funds easily to your bank card or e-wallet with our fast and secure withdrawal process.",
              btn: { label: "Learn More →", action: "register" as AppPage },
            },
          ].map((step, i) => (
            <div
              key={step.num}
              data-ocid={`howit.item.${i + 1}`}
              className="bg-white rounded-2xl p-6 border shadow-card"
              style={{ borderColor: "#e5e7eb" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg mb-5"
                style={{ background: "#3366ff" }}
              >
                {step.num}
              </div>
              <h3
                className="font-bold text-lg mb-3"
                style={{ color: "#111827" }}
              >
                {step.title}
              </h3>
              <p
                className="text-sm mb-4"
                style={{ color: "#6b7280", lineHeight: 1.6 }}
              >
                {step.desc}
              </p>
              {step.btn && (
                <button
                  type="button"
                  data-ocid={`howit.action.button.${i + 1}`}
                  onClick={() => onNavigate(step.btn!.action)}
                  className="text-sm font-semibold transition-opacity hover:opacity-75"
                  style={{ color: "#3366ff" }}
                >
                  {step.btn.label}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ============ CRYPTOCURRENCY ============ */}
      <section className="px-4 sm:px-6 py-14" style={{ background: "#f8f9fa" }}>
        <div className="max-w-7xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-extrabold font-display text-center mb-2"
            style={{ color: "#111827" }}
          >
            Cryptocurrency Trading
          </h2>
          <p
            className="text-center text-base mb-10"
            style={{
              color: "#6b7280",
              maxWidth: "520px",
              margin: "0 auto 2.5rem",
            }}
          >
            Trade the world's most popular digital assets with competitive
            spreads and advanced tools
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {[
              {
                coin: "Bitcoin",
                sym: "BTC/USD",
                grad: "from-orange-400 to-yellow-400",
                desc: "The original cryptocurrency. Trade Bitcoin with leverage and access deep liquidity markets 24/7.",
              },
              {
                coin: "Ethereum",
                sym: "ETH/USD",
                grad: "from-blue-500 to-purple-600",
                desc: "The smart contract platform powering DeFi. Trade ETH and benefit from high volatility opportunities.",
              },
              {
                coin: "Ripple",
                sym: "XRP/USD",
                grad: "from-blue-400 to-cyan-500",
                desc: "Fast digital payment network. Trade XRP with tight spreads and instant execution.",
              },
              {
                coin: "Cardano",
                sym: "ADA/USD",
                grad: "from-blue-800 to-indigo-900",
                desc: "Proof-of-stake blockchain. Trade ADA and participate in the growing DeFi ecosystem.",
              },
              {
                coin: "Dogecoin",
                sym: "DOGE/USD",
                grad: "from-amber-400 to-yellow-300",
                desc: "The community-driven crypto. Trade DOGE with competitive spreads and lightning-fast execution.",
              },
              {
                coin: "Litecoin",
                sym: "LTC/USD",
                grad: "from-slate-600 to-slate-800",
                desc: "Peer-to-peer digital currency. Trade LTC as a fast and reliable store of value.",
              },
            ].map((crypto, i) => (
              <div
                key={crypto.coin}
                data-ocid={`crypto.item.${i + 1}`}
                className="bg-white rounded-2xl overflow-hidden shadow-card border"
                style={{ borderColor: "#e5e7eb" }}
              >
                <div
                  className={`bg-gradient-to-r ${crypto.grad} h-20 flex items-center px-5`}
                >
                  <div>
                    <div className="font-bold text-lg text-white">
                      {crypto.coin}
                    </div>
                    <div className="text-xs text-white/80">{crypto.sym}</div>
                  </div>
                </div>
                <div className="p-5">
                  <p
                    className="text-sm mb-4"
                    style={{ color: "#6b7280", lineHeight: 1.6 }}
                  >
                    {crypto.desc}
                  </p>
                  <button
                    type="button"
                    data-ocid={`crypto.trade.button.${i + 1}`}
                    onClick={() => onNavigate("register")}
                    className="text-sm font-semibold transition-opacity hover:opacity-75"
                    style={{ color: "#3366ff" }}
                  >
                    Trade now →
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <button
              type="button"
              data-ocid="crypto.view_all.button"
              onClick={() => onNavigate("register")}
              className="px-8 py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: "#3366ff" }}
            >
              View all cryptocurrencies →
            </button>
          </div>
        </div>
      </section>

      {/* ============ FOREX HEAT MAP ============ */}
      <section className="px-4 sm:px-6 py-14 max-w-7xl mx-auto">
        <h2
          className="text-3xl sm:text-4xl font-extrabold font-display text-center mb-10"
          style={{ color: "#111827" }}
        >
          Real-Time Market Analysis
        </h2>
        <div
          className="bg-white rounded-2xl border shadow-card p-5 sm:p-7 overflow-x-auto"
          style={{ borderColor: "#e5e7eb" }}
        >
          <h3 className="font-bold text-lg mb-5" style={{ color: "#111827" }}>
            Forex Heat Map
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FOREX_HEAT.map((cell) => {
              const pct = getChangePct(cell.pair);
              const isPos = pct >= 0;
              const pctStr = `${isPos ? "+" : ""}${pct.toFixed(2)}%`;
              const intensity = Math.min(Math.abs(pct) / 1.5, 1);
              const bg = isPos
                ? `rgba(209, 250, 229, ${0.4 + intensity * 0.6})`
                : `rgba(254, 226, 226, ${0.4 + intensity * 0.6})`;
              return (
                <div
                  key={cell.pair}
                  className="rounded-lg px-4 py-3 flex items-center justify-between transition-colors duration-500"
                  style={{ background: bg }}
                >
                  <span
                    className="font-semibold text-sm"
                    style={{ color: "#111827" }}
                  >
                    {cell.pair}
                  </span>
                  <span
                    className="font-bold text-sm"
                    style={{ color: isPos ? "#065f46" : "#991b1b" }}
                  >
                    {pctStr}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ EXPERT MARKET ANALYSIS ============ */}
      <section className="px-4 sm:px-6 py-14" style={{ background: "#f8f9fa" }}>
        <div className="max-w-7xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-extrabold font-display text-center mb-10"
            style={{ color: "#10b981" }}
          >
            Expert Market Analysis
          </h2>
          <div className="flex flex-col gap-4 max-w-3xl mx-auto">
            {[
              {
                key: "daily-market",
                icon: FileText,
                bg: "#d1fae5",
                color: "#10b981",
                title: "Daily Market",
                highlight: "Updates",
                desc: "Get comprehensive daily market reports covering all major asset classes. Our expert analysts provide actionable insights on Forex, crypto, indices, and commodities every trading day. Stay informed with pre-market analysis, mid-session updates, and end-of-day summaries.",
              },
              {
                key: "premium-tools",
                icon: Wrench,
                bg: "#e0e7ff",
                color: "#3366ff",
                title: "Premium Trading",
                highlight: "Tools",
                desc: "Access our suite of professional trading tools including economic calendars, currency strength meters, pip calculators, and advanced charting. All tools are free for registered clients and updated in real-time.",
              },
              {
                key: "funds-protection",
                icon: Shield,
                bg: "#e0e7ff",
                color: "#3366ff",
                title: "Funds",
                highlight: "Protection",
                desc: "Your funds are fully segregated from company assets and held in tier-1 banking institutions. We are regulated by multiple financial authorities globally and maintain the highest standards of client fund security and transparency.",
              },
            ].map((item, i) => (
              <div
                key={item.title}
                data-ocid={`analysis.item.${i + 1}`}
                className="bg-white rounded-2xl border p-5 shadow-card"
                style={{ borderColor: "#e5e7eb" }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: item.bg }}
                  >
                    <item.icon size={20} style={{ color: item.color }} />
                  </div>
                  <div className="flex-1">
                    <h3
                      className="font-bold text-base mb-1"
                      style={{ color: "#111827" }}
                    >
                      {item.title}{" "}
                      <span style={{ color: "#10b981" }}>{item.highlight}</span>
                    </h3>
                    {expandedAnalysis === i && (
                      <p
                        className="text-sm mb-3"
                        style={{ color: "#6b7280", lineHeight: 1.7 }}
                      >
                        {item.desc}
                      </p>
                    )}
                    <button
                      type="button"
                      data-ocid={`analysis.toggle.button.${i + 1}`}
                      onClick={() => toggleAnalysis(i)}
                      className="flex items-center gap-1 text-sm font-semibold transition-opacity hover:opacity-75"
                      style={{ color: "#10b981" }}
                    >
                      {expandedAnalysis === i ? (
                        <>
                          <ChevronUp size={14} /> Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown size={14} /> Read more
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ AWARD + INVESTMENT ============ */}
      <section className="px-4 sm:px-6 py-14 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            {
              icon: Trophy,
              bg: "#e0e7ff",
              color: "#3366ff",
              title: "Award-Winning Broker",
              items: [
                "42+ Industry Awards",
                "Top 100 Companies",
                "Best Client Funds Security Global",
                "Best Forex News & Analysis Provider",
              ],
            },
            {
              icon: DollarSign,
              bg: "#d1fae5",
              color: "#10b981",
              title: "Investment Options",
              items: [
                "BA Copy — How it Works",
                "Become a Follower",
                "PAMM Ranking",
                "Become an Investor",
              ],
            },
          ].map((card, i) => (
            <div
              key={card.title}
              data-ocid={`awards.item.${i + 1}`}
              className="bg-white rounded-2xl border p-7 shadow-card"
              style={{ borderColor: "#e5e7eb" }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
                style={{ background: card.bg }}
              >
                <card.icon size={26} style={{ color: card.color }} />
              </div>
              <h3
                className="font-bold text-xl mb-4"
                style={{ color: "#111827" }}
              >
                {card.title}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {card.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm"
                    style={{ color: "#374151" }}
                  >
                    <CheckCircle
                      size={16}
                      style={{ color: card.color, flexShrink: 0 }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ============ TRUSTED REPUTATION ============ */}
      <section className="px-4 sm:px-6 py-14" style={{ background: "#f8f9fa" }}>
        <div className="max-w-7xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-extrabold font-display text-center mb-10"
            style={{ color: "#111827" }}
          >
            Our Trusted Reputation
          </h2>
          <div className="flex flex-col gap-4 max-w-2xl mx-auto">
            {[
              {
                icon: CheckCircle,
                color: "#3366ff",
                bg: "#e0e7ff",
                title: "Globally Regulated",
                desc: "Operating under strict financial regulations across multiple jurisdictions for maximum client protection.",
              },
              {
                icon: Trophy,
                color: "#f59e0b",
                bg: "#fef3c7",
                title: "40+ International Awards",
                desc: "Recognized by leading financial industry bodies for excellence in trading services and client satisfaction.",
              },
              {
                icon: Headphones,
                color: "#10b981",
                bg: "#d1fae5",
                title: "24/7 Multilingual Support",
                desc: "Our dedicated support team is available around the clock in over 15 languages to assist you.",
              },
              {
                icon: Shield,
                color: "#6366f1",
                bg: "#ede9fe",
                title: "Segregated Client Funds",
                desc: "Client funds are held separately from company assets in tier-1 banking institutions worldwide.",
              },
              {
                icon: Users,
                color: "#3366ff",
                bg: "#e0e7ff",
                title: "Personal Account Managers",
                desc: "Dedicated account managers are assigned to guide you through your trading journey from day one.",
              },
            ].map((item, i) => (
              <div
                key={item.title}
                data-ocid={`reputation.item.${i + 1}`}
                className="bg-white rounded-2xl border p-5 shadow-card flex items-start gap-4"
                style={{ borderColor: "#e5e7eb" }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: item.bg }}
                >
                  <item.icon size={20} style={{ color: item.color }} />
                </div>
                <div>
                  <h3
                    className="font-bold text-sm mb-1"
                    style={{ color: "#111827" }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="text-sm"
                    style={{ color: "#6b7280", lineHeight: 1.6 }}
                  >
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ EDUCATION CENTER ============ */}
      <section className="px-4 sm:px-6 py-14 max-w-7xl mx-auto" id="education">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-4"
          style={{ background: "#e0e7ff", color: "#3366ff" }}
        >
          EDUCATION CENTER
        </div>
        <h2
          className="text-3xl sm:text-4xl font-extrabold font-display mb-3"
          style={{ color: "#111827" }}
        >
          Learn From Market Experts
        </h2>
        <p
          className="text-base mb-8"
          style={{ color: "#6b7280", maxWidth: "500px" }}
        >
          Discover everything you need to know about cryptocurrency trading,
          forex markets, and investment strategies.
        </p>
        <div
          className="rounded-2xl overflow-hidden shadow-card mb-8 border"
          style={{ borderColor: "#e5e7eb" }}
        >
          <iframe
            src="https://www.youtube.com/embed/Gc2en3nHxA4"
            style={{ width: "100%", height: "280px", border: "none" }}
            allowFullScreen
            title="What is Bitcoin?"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              title: "About Bitcoin",
              desc: "Bitcoin is the world's first decentralized digital currency. Learn how blockchain technology works and why BTC remains the gold standard of crypto.",
            },
            {
              title: "About Ethereum",
              desc: "Ethereum introduced smart contracts to the blockchain world. Discover how ETH powers decentralized applications and the growing DeFi ecosystem.",
            },
            {
              title: "About Forex Trading",
              desc: "The forex market is the largest financial market in the world. Learn the fundamentals of currency trading, technical analysis, and risk management.",
            },
          ].map((article, i) => (
            <div
              key={article.title}
              data-ocid={`education.item.${i + 1}`}
              className="bg-white rounded-2xl border p-5 shadow-card"
              style={{ borderColor: "#e5e7eb" }}
            >
              <h3
                className="font-bold text-base mb-2"
                style={{ color: "#111827" }}
              >
                {article.title}
              </h3>
              <p
                className="text-sm"
                style={{ color: "#6b7280", lineHeight: 1.6 }}
              >
                {article.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ WHY TRADE WITH MTEXTRADING ============ */}
      <section className="px-4 sm:px-6 py-16" style={{ background: "#0A1628" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p
              className="text-xs font-bold tracking-widest uppercase mb-3"
              style={{ color: "#F59E0B" }}
            >
              OUR ADVANTAGES
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-white">
              Why Trade With Mtextrading
            </h2>
            <p className="text-slate-400 mt-3 max-w-xl mx-auto">
              Everything you need to trade the global markets with confidence.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <BarChart2 size={32} style={{ color: "#F59E0B" }} />,
                title: "More Tools",
                desc: "Advanced charting, real-time data, and professional trading tools to help you make better decisions.",
              },
              {
                icon: <Shield size={32} style={{ color: "#F59E0B" }} />,
                title: "More Security",
                desc: "Bank-grade encryption and regulatory compliance keep your funds and data safe at all times.",
              },
              {
                icon: <GraduationCap size={32} style={{ color: "#F59E0B" }} />,
                title: "More Education",
                desc: "From beginner guides to advanced strategies, our education hub helps every trader grow.",
              },
              {
                icon: <Headphones size={32} style={{ color: "#F59E0B" }} />,
                title: "More Support",
                desc: "Our dedicated support team is available to assist you whenever you need help.",
              },
            ].map((item, i) => (
              <div
                key={item.title}
                data-ocid={`why_trade.item.${i + 1}`}
                className="rounded-2xl p-7 flex flex-col gap-4"
                style={{ background: "#0D1F3C", border: "1px solid #1e3a5f" }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(245,158,11,0.12)" }}
                >
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PAYMENT METHODS ============ */}
      <section className="px-4 sm:px-6 py-14" style={{ background: "#f9fafb" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p
              className="text-xs font-bold tracking-widest uppercase mb-3"
              style={{ color: "#F59E0B" }}
            >
              CONVENIENT & SECURE
            </p>
            <h2
              className="text-3xl font-extrabold font-display"
              style={{ color: "#111827" }}
            >
              Payment Methods
            </h2>
            <p className="text-sm mt-2" style={{ color: "#6b7280" }}>
              Fund your account instantly using your preferred payment method.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Visa",
                icon: <CreditCard size={22} style={{ color: "#1a1f71" }} />,
                bg: "#eff6ff",
              },
              {
                label: "Mastercard",
                icon: <CreditCard size={22} style={{ color: "#eb001b" }} />,
                bg: "#fff1f2",
              },
              {
                label: "Maestro",
                icon: <CreditCard size={22} style={{ color: "#007b5e" }} />,
                bg: "#f0fdf4",
              },
              {
                label: "Skrill",
                icon: <DollarSign size={22} style={{ color: "#862165" }} />,
                bg: "#fdf4ff",
              },
              {
                label: "Neteller",
                icon: <DollarSign size={22} style={{ color: "#e91e63" }} />,
                bg: "#fdf2f8",
              },
              {
                label: "Bank Transfer",
                icon: <Landmark size={22} style={{ color: "#1d4ed8" }} />,
                bg: "#eff6ff",
              },
              {
                label: "Local Transfers",
                icon: <Building size={22} style={{ color: "#0369a1" }} />,
                bg: "#f0f9ff",
              },
              {
                label: "Crypto",
                icon: <Bitcoin size={22} style={{ color: "#f59e0b" }} />,
                bg: "#fffbeb",
              },
            ].map((method, i) => (
              <div
                key={method.label}
                data-ocid={`payment.item.${i + 1}`}
                className="flex items-center gap-3 rounded-xl px-5 py-4 border"
                style={{ background: method.bg, borderColor: "#e5e7eb" }}
              >
                {method.icon}
                <span
                  className="font-semibold text-sm"
                  style={{ color: "#111827" }}
                >
                  {method.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ORANGE CTA BANNER ============ */}
      <section
        className="px-4 sm:px-6 py-14 text-center"
        style={{
          background: "linear-gradient(135deg, #F59E0B 0%, #FF6B35 100%)",
        }}
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-white mb-4">
            Start Trading in Minutes
          </h2>
          <p className="text-white/90 text-base mb-8">
            Open a free demo account and practice with $10,000 in virtual funds
            before trading real money.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="button"
              data-ocid="cta_banner.register.primary_button"
              onClick={() => onNavigate("register")}
              className="px-8 py-4 rounded-xl font-bold text-base transition-all hover:scale-105 shadow-lg"
              style={{ background: "#fff", color: "#F59E0B" }}
            >
              Open Free Demo Account
            </button>
            <button
              type="button"
              data-ocid="cta_banner.login.secondary_button"
              onClick={() => onNavigate("login")}
              className="px-8 py-4 rounded-xl font-bold text-base border-2 border-white text-white transition-all hover:bg-white/10"
            >
              Login to Live Account
            </button>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="px-4 sm:px-6 py-12" style={{ background: "#111827" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CandlestickChart size={24} style={{ color: "#3366ff" }} />
                <span className="text-xl font-extrabold font-display text-white">
                  Mtextrading
                </span>
              </div>
              <p
                className="text-sm"
                style={{ color: "#9ca3af", maxWidth: "280px", lineHeight: 1.6 }}
              >
                Your gateway to global financial markets. Trade with confidence.
              </p>
            </div>
            <nav className="flex flex-wrap gap-6">
              {["About", "Markets", "Trading", "Support"].map((link) => (
                <a
                  key={link}
                  href="#footer"
                  data-ocid={`footer.${link.toLowerCase()}.link`}
                  className="text-sm font-medium transition-colors hover:text-white"
                  style={{ color: "#9ca3af" }}
                >
                  {link}
                </a>
              ))}
            </nav>
          </div>
          <div className="border-t pt-6" style={{ borderColor: "#374151" }}>
            <p
              className="text-xs mb-3"
              style={{ color: "#6b7280", lineHeight: 1.7 }}
            >
              <strong style={{ color: "#9ca3af" }}>Risk Warning:</strong>{" "}
              Trading Contracts for Difference (CFDs) involves significant risk
              of loss and is not suitable for all investors. Please ensure you
              fully understand the risks involved and only invest what you can
              afford to lose. Past performance is not indicative of future
              results.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-xs" style={{ color: "#6b7280" }}>
                © {new Date().getFullYear()} Mtextrading. All rights reserved.
              </p>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  aria-label="Twitter"
                  data-ocid="footer.twitter.link"
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <Twitter size={18} />
                </button>
                <button
                  type="button"
                  aria-label="Instagram"
                  data-ocid="footer.instagram.link"
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <Instagram size={18} />
                </button>
                <button
                  type="button"
                  aria-label="Facebook"
                  data-ocid="footer.facebook.link"
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <Facebook size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
