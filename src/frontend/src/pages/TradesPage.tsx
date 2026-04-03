import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { MarketInstrument, TradeOrder } from "../backend.d";
import { Button } from "../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useActor } from "../hooks/useActor";

export default function TradesPage() {
  const { actor } = useActor();
  const [orders, setOrders] = useState<TradeOrder[]>([]);
  const [instruments, setInstruments] = useState<MarketInstrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState<string | null>(null);

  const load = async () => {
    if (!actor) return;
    try {
      const [ords, insts] = await Promise.all([
        actor.getOwnOrders(),
        actor.getAllInstruments(),
      ]);
      setOrders(ords);
      setInstruments(insts);
      setLoading(false);
    } catch {
      setLoading(false);
      toast.error("Failed to load trades");
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: load wraps actor
  useEffect(() => {
    load();
  }, [actor]);

  const getInstrument = (id: bigint) =>
    instruments.find((i) => i.instrumentId === id);

  const handleClose = async (order: TradeOrder) => {
    if (!actor) return;
    setClosing(String(order.orderId));
    try {
      const inst = getInstrument(order.instrumentId);
      const closePrice = inst
        ? order.orderType === "buy"
          ? inst.bidPrice
          : inst.askPrice
        : order.openPrice;
      await actor.closeOrder(order.orderId, closePrice);
      toast.success("Order closed");
      await load();
    } catch {
      toast.error("Failed to close order");
    } finally {
      setClosing(null);
    }
  };

  const openOrders = orders.filter((o) => String(o.status) === "open");
  const closedOrders = orders.filter((o) => String(o.status) !== "open");
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  if (loading) {
    return (
      <div
        data-ocid="trades.loading_state"
        className="flex items-center justify-center h-64"
      >
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-400" />
      </div>
    );
  }

  const OrderTable = ({
    orderList,
    showClose,
  }: { orderList: TradeOrder[]; showClose?: boolean }) =>
    orderList.length === 0 ? (
      <div
        data-ocid="trades.orders.empty_state"
        className="text-center py-16 text-slate-500"
      >
        No orders found
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-slate-400">
              <th className="text-left px-4 py-3">Instrument</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-right px-4 py-3">Lots</th>
              <th className="text-right px-4 py-3">Open</th>
              <th className="text-right px-4 py-3">Close</th>
              <th className="text-right px-4 py-3">P&L</th>
              {showClose && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {orderList.map((order, i) => {
              const inst = getInstrument(order.instrumentId);
              return (
                <tr
                  key={String(order.orderId)}
                  data-ocid={`trades.order.item.${i + 1}`}
                  className="border-b border-white/5 hover:bg-white/5"
                >
                  <td className="px-4 py-3 text-white font-medium">
                    {inst?.symbol ?? "Unknown"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-semibold ${String(order.orderType) === "buy" ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {String(order.orderType).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {order.lotSize}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-300">
                    {order.openPrice.toFixed(5)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-400">
                    {order.closePrice !== undefined && order.closePrice !== null
                      ? order.closePrice.toFixed(5)
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        order.profitLoss !== undefined &&
                        order.profitLoss !== null
                          ? order.profitLoss >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                          : "text-slate-400"
                      }
                    >
                      {order.profitLoss !== undefined &&
                      order.profitLoss !== null
                        ? fmt(order.profitLoss)
                        : "-"}
                    </span>
                  </td>
                  {showClose && (
                    <td className="px-4 py-3">
                      <Button
                        data-ocid={`trades.close.button.${i + 1}`}
                        size="sm"
                        variant="outline"
                        onClick={() => handleClose(order)}
                        disabled={closing === String(order.orderId)}
                        className="border-red-500/40 text-red-400 hover:bg-red-500/20 text-xs"
                      >
                        {closing === String(order.orderId) ? "..." : "Close"}
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );

  return (
    <div data-ocid="trades.page" className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Trades</h1>
      <div className="bg-white/5 rounded-xl border border-white/10">
        <Tabs defaultValue="open">
          <TabsList className="bg-transparent border-b border-white/10 rounded-none w-full justify-start px-4">
            <TabsTrigger
              data-ocid="trades.open.tab"
              value="open"
              className="data-[state=active]:text-emerald-400"
            >
              Open Orders ({openOrders.length})
            </TabsTrigger>
            <TabsTrigger
              data-ocid="trades.history.tab"
              value="history"
              className="data-[state=active]:text-emerald-400"
            >
              Trade History ({closedOrders.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="open">
            <OrderTable orderList={openOrders} showClose />
          </TabsContent>
          <TabsContent value="history">
            <OrderTable orderList={closedOrders} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
