import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { MarketInstrument, TradingAccount } from "../backend.d";
import { AccountType, InstrumentCategory, OrderType } from "../backend.d";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useActor } from "../hooks/useActor";

const SEED_INSTRUMENTS = [
  {
    name: "Euro / US Dollar",
    symbol: "EUR/USD",
    category: InstrumentCategory.forex,
    bid: 1.08523,
    ask: 1.08541,
  },
  {
    name: "British Pound / US Dollar",
    symbol: "GBP/USD",
    category: InstrumentCategory.forex,
    bid: 1.26834,
    ask: 1.26852,
  },
  {
    name: "US Dollar / Japanese Yen",
    symbol: "USD/JPY",
    category: InstrumentCategory.forex,
    bid: 149.234,
    ask: 149.251,
  },
  {
    name: "Australian Dollar / US Dollar",
    symbol: "AUD/USD",
    category: InstrumentCategory.forex,
    bid: 0.65123,
    ask: 0.65141,
  },
  {
    name: "US Dollar / Swiss Franc",
    symbol: "USD/CHF",
    category: InstrumentCategory.forex,
    bid: 0.89023,
    ask: 0.89041,
  },
  {
    name: "Bitcoin / US Dollar",
    symbol: "BTC/USD",
    category: InstrumentCategory.crypto,
    bid: 67234,
    ask: 67312,
  },
  {
    name: "Ethereum / US Dollar",
    symbol: "ETH/USD",
    category: InstrumentCategory.crypto,
    bid: 3412.5,
    ask: 3418.2,
  },
  {
    name: "XRP / US Dollar",
    symbol: "XRP/USD",
    category: InstrumentCategory.crypto,
    bid: 0.5234,
    ask: 0.5238,
  },
  {
    name: "Apple Inc",
    symbol: "AAPL",
    category: InstrumentCategory.stocks,
    bid: 182.5,
    ask: 182.7,
  },
  {
    name: "Alphabet Inc",
    symbol: "GOOGL",
    category: InstrumentCategory.stocks,
    bid: 142.3,
    ask: 142.5,
  },
  {
    name: "Tesla Inc",
    symbol: "TSLA",
    category: InstrumentCategory.stocks,
    bid: 248.9,
    ask: 249.2,
  },
  {
    name: "Amazon Inc",
    symbol: "AMZN",
    category: InstrumentCategory.stocks,
    bid: 178.2,
    ask: 178.4,
  },
  {
    name: "Gold / US Dollar",
    symbol: "XAU/USD",
    category: InstrumentCategory.commodities,
    bid: 2034.5,
    ask: 2035.1,
  },
  {
    name: "Silver / US Dollar",
    symbol: "XAG/USD",
    category: InstrumentCategory.commodities,
    bid: 22.45,
    ask: 22.49,
  },
  {
    name: "Crude Oil WTI",
    symbol: "WTI",
    category: InstrumentCategory.commodities,
    bid: 78.23,
    ask: 78.29,
  },
  {
    name: "S&P 500",
    symbol: "SPX500",
    category: InstrumentCategory.indices,
    bid: 4987.5,
    ask: 4988.2,
  },
  {
    name: "NASDAQ 100",
    symbol: "NAS100",
    category: InstrumentCategory.indices,
    bid: 17234.5,
    ask: 17236.1,
  },
  {
    name: "Dow Jones 30",
    symbol: "DJ30",
    category: InstrumentCategory.indices,
    bid: 38234.5,
    ask: 38238.2,
  },
];

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: InstrumentCategory.forex, label: "Forex" },
  { key: InstrumentCategory.crypto, label: "Crypto" },
  { key: InstrumentCategory.stocks, label: "Stocks" },
  { key: InstrumentCategory.commodities, label: "Commodities" },
  { key: InstrumentCategory.indices, label: "Indices" },
];

export default function MarketsPage() {
  const { actor } = useActor();
  const [instruments, setInstruments] = useState<MarketInstrument[]>([]);
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [selectedInstrument, setSelectedInstrument] =
    useState<MarketInstrument | null>(null);
  const [tradeForm, setTradeForm] = useState({
    orderType: OrderType.buy,
    lotSize: "0.1",
    stopLoss: "",
    takeProfit: "",
    accountId: "",
  });
  const [trading, setTrading] = useState(false);

  const loadData = async () => {
    if (!actor) return;
    try {
      const [insts, accs] = await Promise.all([
        actor.getAllInstruments(),
        actor.getOwnAccounts(),
      ]);
      if (insts.length === 0 && !seeding) {
        setSeeding(true);
        for (const inst of SEED_INSTRUMENTS) {
          try {
            await actor.createInstrument(
              inst.name,
              inst.symbol,
              inst.category,
              inst.bid,
              inst.ask,
            );
          } catch {}
        }
        const insts2 = await actor.getAllInstruments();
        setInstruments(insts2);
        setSeeding(false);
      } else {
        setInstruments(insts);
      }
      setAccounts(accs);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: load wraps actor
  useEffect(() => {
    loadData();
  }, [actor]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (accounts.length > 0 && !tradeForm.accountId) {
      setTradeForm((f) => ({ ...f, accountId: String(accounts[0].accountId) }));
    }
  }, [accounts]);

  const handleTrade = async () => {
    if (!actor || !selectedInstrument || !tradeForm.accountId) return;
    setTrading(true);
    try {
      const accountId = BigInt(tradeForm.accountId);
      const openPrice =
        tradeForm.orderType === OrderType.buy
          ? selectedInstrument.askPrice
          : selectedInstrument.bidPrice;
      await actor.createOrder(
        accountId,
        selectedInstrument.instrumentId,
        tradeForm.orderType,
        Number.parseFloat(tradeForm.lotSize) || 0.1,
        openPrice,
        Number.parseFloat(tradeForm.stopLoss) || 0,
        Number.parseFloat(tradeForm.takeProfit) || 0,
      );
      toast.success(
        `${tradeForm.orderType.toUpperCase()} order placed for ${selectedInstrument.symbol}`,
      );
      setSelectedInstrument(null);
    } catch (e) {
      toast.error("Failed to place order");
      console.error(e);
    } finally {
      setTrading(false);
    }
  };

  if (loading || seeding) {
    return (
      <div
        data-ocid="markets.loading_state"
        className="flex items-center justify-center h-64"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-400 mx-auto mb-3" />
          <p className="text-slate-400">
            {seeding ? "Setting up markets..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div data-ocid="markets.page" className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Market Watch</h1>

      <Tabs defaultValue="all">
        <TabsList className="bg-white/10 mb-6">
          {CATEGORIES.map((c) => (
            <TabsTrigger
              key={c.key}
              value={c.key}
              data-ocid={`markets.${c.key}.tab`}
              className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black"
            >
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map((cat) => {
          const filtered =
            cat.key === "all"
              ? instruments
              : instruments.filter((i) => String(i.category) === cat.key);
          return (
            <TabsContent key={cat.key} value={cat.key}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((inst, idx) => (
                  <div
                    key={String(inst.instrumentId)}
                    data-ocid={`markets.instrument.item.${idx + 1}`}
                    className="bg-white/5 rounded-xl border border-white/10 p-4 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-bold text-white">
                          {inst.symbol}
                        </div>
                        <div className="text-xs text-slate-400">
                          {inst.name}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-white/10 text-slate-300">
                        {String(inst.category).toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                      <div>
                        <div className="text-slate-500 text-xs">BID</div>
                        <div className="text-red-400 font-mono">
                          {inst.bidPrice.toFixed(5)}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs">ASK</div>
                        <div className="text-emerald-400 font-mono">
                          {inst.askPrice.toFixed(5)}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs">SPREAD</div>
                        <div className="text-slate-300 font-mono">
                          {inst.spread.toFixed(1)}
                        </div>
                      </div>
                    </div>
                    <Button
                      data-ocid={`markets.trade.button.${idx + 1}`}
                      size="sm"
                      onClick={() => setSelectedInstrument(inst)}
                      className="w-full bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/30 transition-colors"
                    >
                      Trade
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Trade Modal */}
      <Dialog
        open={!!selectedInstrument}
        onOpenChange={(open) => !open && setSelectedInstrument(null)}
      >
        <DialogContent
          data-ocid="markets.trade.dialog"
          className="bg-[#0f1422] border border-white/10 text-white max-w-sm"
        >
          <DialogHeader>
            <DialogTitle>Trade {selectedInstrument?.symbol}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Buy/Sell Toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                data-ocid="markets.buy.toggle"
                onClick={() =>
                  setTradeForm((f) => ({ ...f, orderType: OrderType.buy }))
                }
                className={`py-3 rounded-lg font-bold text-sm transition-colors ${
                  tradeForm.orderType === OrderType.buy
                    ? "bg-emerald-500 text-black"
                    : "bg-white/10 text-slate-400 hover:bg-white/20"
                }`}
              >
                BUY {selectedInstrument?.askPrice.toFixed(5)}
              </button>
              <button
                type="button"
                data-ocid="markets.sell.toggle"
                onClick={() =>
                  setTradeForm((f) => ({ ...f, orderType: OrderType.sell }))
                }
                className={`py-3 rounded-lg font-bold text-sm transition-colors ${
                  tradeForm.orderType === OrderType.sell
                    ? "bg-red-500 text-white"
                    : "bg-white/10 text-slate-400 hover:bg-white/20"
                }`}
              >
                SELL {selectedInstrument?.bidPrice.toFixed(5)}
              </button>
            </div>

            {accounts.length > 0 && (
              <div>
                <Label className="text-slate-300 text-sm">Account</Label>
                <Select
                  value={tradeForm.accountId}
                  onValueChange={(v) =>
                    setTradeForm((f) => ({ ...f, accountId: v }))
                  }
                >
                  <SelectTrigger
                    data-ocid="markets.account.select"
                    className="bg-white/10 border-white/20 text-white mt-1"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f1422] border-white/20 text-white">
                    {accounts.map((acc) => (
                      <SelectItem
                        key={String(acc.accountId)}
                        value={String(acc.accountId)}
                      >
                        #{String(acc.accountId)} -{" "}
                        {String(acc.accountType).toUpperCase()} ($
                        {acc.balance.toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="text-slate-300 text-sm">Lot Size</Label>
              <Input
                data-ocid="markets.lotsize.input"
                type="number"
                step="0.01"
                value={tradeForm.lotSize}
                onChange={(e) =>
                  setTradeForm((f) => ({ ...f, lotSize: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-sm">Stop Loss</Label>
                <Input
                  data-ocid="markets.stoploss.input"
                  type="number"
                  step="0.00001"
                  placeholder="0 = none"
                  value={tradeForm.stopLoss}
                  onChange={(e) =>
                    setTradeForm((f) => ({ ...f, stopLoss: e.target.value }))
                  }
                  className="bg-white/10 border-white/20 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Take Profit</Label>
                <Input
                  data-ocid="markets.takeprofit.input"
                  type="number"
                  step="0.00001"
                  placeholder="0 = none"
                  value={tradeForm.takeProfit}
                  onChange={(e) =>
                    setTradeForm((f) => ({ ...f, takeProfit: e.target.value }))
                  }
                  className="bg-white/10 border-white/20 text-white mt-1"
                />
              </div>
            </div>

            <Button
              data-ocid="markets.trade.submit_button"
              onClick={handleTrade}
              disabled={trading || !tradeForm.accountId}
              className={`w-full font-bold py-3 ${
                tradeForm.orderType === OrderType.buy
                  ? "bg-emerald-500 hover:bg-emerald-600 text-black"
                  : "bg-red-500 hover:bg-red-600 text-white"
              }`}
            >
              {trading
                ? "Placing Order..."
                : `${tradeForm.orderType.toUpperCase()} ${tradeForm.lotSize} lot`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
