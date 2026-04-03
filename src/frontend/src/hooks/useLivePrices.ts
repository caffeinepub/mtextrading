import { useEffect, useRef, useState } from "react";

export const BASE_PRICES: Record<string, number> = {
  "EUR/USD": 1.0843,
  "GBP/USD": 1.26349,
  "AUD/USD": 0.6522,
  "NZD/USD": 0.5813,
  "USD/CAD": 1.3892,
  "USD/CHF": 0.9022,
  "USD/JPY": 150.261,
  "EUR/GBP": 0.8562,
  "EUR/JPY": 163.45,
  "GBP/JPY": 190.12,
  "CHF/JPY": 166.34,
  "AUD/JPY": 98.45,
  "EUR/AUD": 1.6621,
  "EUR/CAD": 1.4821,
  "GBP/AUD": 1.9345,
  "USD/CNY": 7.2341,
  "USD/MXN": 17.142,
  "USD/ZAR": 18.734,
  "BTC/USD": 71245,
  "ETH/USD": 3415.8,
  "XRP/USD": 0.5224,
  "LTC/USD": 88.42,
  "BNB/USD": 412.5,
  "SOL/USD": 148.3,
  "AVAX/USD": 34.18,
  "DOT/USD": 7.82,
  "ADA/USD": 0.612,
  "LINK/USD": 14.23,
  "MATIC/USD": 0.892,
  Gold: 2045.0,
  Silver: 24.82,
  Oil: 78.5,
  Platinum: 998.0,
  "S&P 500": 5204.3,
  "Nasdaq 100": 18240,
  "Dow Jones": 39100,
  "FTSE 100": 8200,
  DAX: 18050,
  "Nikkei 225": 38400,
  Apple: 189.5,
  Microsoft: 415.2,
  Tesla: 172.3,
  Amazon: 185.4,
  Google: 172.1,
  Meta: 492.3,
};

export function useLivePrices() {
  const [prices, setPrices] = useState<Record<string, number>>({
    ...BASE_PRICES,
  });
  const [flash, setFlash] = useState<Record<string, "up" | "down" | null>>({});
  const initialRef = useRef<Record<string, number>>({ ...BASE_PRICES });

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices((prev) => {
        const next = { ...prev };
        const flashUpdates: Record<string, "up" | "down"> = {};
        for (const sym in next) {
          const drift = (Math.random() - 0.5) * next[sym] * 0.0004;
          const newPrice = Math.max(0.0001, next[sym] + drift);
          flashUpdates[sym] = newPrice >= next[sym] ? "up" : "down";
          next[sym] = newPrice;
        }
        setFlash((prev2) => ({ ...prev2, ...flashUpdates }));
        setTimeout(() => {
          setFlash((prev2) => {
            const cleared = { ...prev2 };
            for (const s in flashUpdates) cleared[s] = null;
            return cleared;
          });
        }, 600);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getChangePct = (symbol: string): number => {
    const base = initialRef.current[symbol];
    const cur = prices[symbol];
    if (!base || !cur) return 0;
    return ((cur - base) / base) * 100;
  };

  const formatChangePct = (symbol: string): string => {
    const pct = getChangePct(symbol);
    return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
  };

  return {
    prices,
    flash,
    getChangePct,
    formatChangePct,
    initialPrices: initialRef.current,
  };
}
