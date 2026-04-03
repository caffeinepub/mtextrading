import { useEffect, useRef } from "react";

interface OpenOrderLine {
  orderId: bigint;
  openPrice: number;
  takeProfit: number;
  stopLoss: number;
  orderType: string;
}

interface MTChartProps {
  symbol: string;
  currentPrice: number;
  openOrders: OpenOrderLine[];
}

const MTChart: React.FC<MTChartProps> = ({
  symbol,
  currentPrice,
  openOrders,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const candlesRef = useRef<
    { o: number; h: number; c: number; l: number; t: number }[]
  >([]);
  const liveIndexRef = useRef(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: only regenerate when symbol/price changes
  useEffect(() => {
    // Generate initial candle data
    const now = Date.now();
    const candles: { o: number; h: number; c: number; l: number; t: number }[] =
      [];
    let price = currentPrice;
    for (let i = 120; i >= 0; i--) {
      const o = price;
      const change = (Math.random() - 0.5) * price * 0.0015;
      const c = Math.max(0.0001, o + change);
      const h = Math.max(o, c) + Math.random() * price * 0.0005;
      const l = Math.min(o, c) - Math.random() * price * 0.0005;
      candles.push({ o, h, c, l, t: now - i * 60000 });
      price = c;
    }
    candlesRef.current = candles;
    liveIndexRef.current = candles.length - 1;

    // Animate: update last candle periodically
    let tick = 0;
    const interval = setInterval(() => {
      tick++;
      const last = candlesRef.current[candlesRef.current.length - 1];
      const drift = (Math.random() - 0.5) * last.c * 0.0008;
      const newC = Math.max(0.0001, last.c + drift);
      const newH = Math.max(last.h, newC);
      const newL = Math.min(last.l, newC);
      candlesRef.current[candlesRef.current.length - 1] = {
        ...last,
        c: newC,
        h: newH,
        l: newL,
      };

      // Every 60 ticks start a new candle
      if (tick % 30 === 0) {
        candlesRef.current.push({
          o: newC,
          h: newC,
          c: newC,
          l: newC,
          t: Date.now(),
        });
        if (candlesRef.current.length > 150) candlesRef.current.shift();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [symbol, currentPrice]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const draw = () => {
      const w = container.clientWidth;
      const h = 320;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const candles = candlesRef.current;
      if (candles.length === 0) return;

      // Background
      ctx.fillStyle = "#1a2332";
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = "#243044";
      ctx.lineWidth = 0.5;
      for (let gy = 0; gy < 5; gy++) {
        const y = (gy / 4) * (h - 40) + 20;
        ctx.beginPath();
        ctx.moveTo(60, y);
        ctx.lineTo(w - 10, y);
        ctx.stroke();
      }

      // Calculate visible candles
      const visibleCount = Math.min(candles.length, Math.floor((w - 70) / 8));
      const visible = candles.slice(Math.max(0, candles.length - visibleCount));

      const allPrices = visible.flatMap((c) => [c.h, c.l]);
      const allLines = openOrders.flatMap(
        (o) =>
          [
            o.openPrice,
            o.takeProfit > 0 ? o.takeProfit : null,
            o.stopLoss > 0 ? o.stopLoss : null,
          ].filter(Boolean) as number[],
      );
      const minP = Math.min(...allPrices, ...allLines) * 0.9998;
      const maxP = Math.max(...allPrices, ...allLines) * 1.0002;
      const priceRange = maxP - minP || 1;

      const toY = (p: number) => 20 + ((maxP - p) / priceRange) * (h - 60);

      const candleW = Math.max(2, (w - 70) / visibleCount - 1);

      // Draw candles
      visible.forEach((c, i) => {
        const x = 60 + i * ((w - 70) / visibleCount) + candleW / 2;
        const isUp = c.c >= c.o;
        ctx.strokeStyle = isUp ? "#16a34a" : "#dc2626";
        ctx.fillStyle = isUp ? "#16a34a" : "#dc2626";
        ctx.lineWidth = 1;

        // Wick
        ctx.beginPath();
        ctx.moveTo(x, toY(c.h));
        ctx.lineTo(x, toY(c.l));
        ctx.stroke();

        // Body
        const bodyTop = toY(Math.max(c.o, c.c));
        const bodyBot = toY(Math.min(c.o, c.c));
        const bodyH = Math.max(1, bodyBot - bodyTop);
        ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);
      });

      // Draw price lines for open orders
      const drawHLine = (
        price: number,
        color: string,
        label: string,
        dashed = false,
      ) => {
        const y = toY(price);
        if (y < 15 || y > h - 15) return;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        if (dashed) ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(60, y);
        ctx.lineTo(w - 10, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label
        ctx.fillStyle = color;
        ctx.fillRect(w - 62, y - 9, 54, 18);
        ctx.fillStyle = "white";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(label, w - 35, y + 3);
        ctx.restore();
      };

      for (const o of openOrders) {
        const isBuy = String(o.orderType) === "buy";
        drawHLine(
          o.openPrice,
          isBuy ? "#3b82f6" : "#f59e0b",
          `${isBuy ? "BUY" : "SELL"}`,
        );
        if (o.takeProfit > 0) drawHLine(o.takeProfit, "#16a34a", "TP", true);
        if (o.stopLoss > 0) drawHLine(o.stopLoss, "#dc2626", "SL", true);
      }

      // Price axis labels
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "right";
      for (let gi = 0; gi <= 4; gi++) {
        const p = maxP - (gi / 4) * priceRange;
        const y = 20 + (gi / 4) * (h - 60);
        const decimals = p > 100 ? 2 : p > 1 ? 4 : 5;
        ctx.fillText(p.toFixed(decimals), 56, y + 4);
      }

      // Symbol label
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(symbol, 62, 14);

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [symbol, openOrders]);

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      <canvas ref={canvasRef} style={{ width: "100%", display: "block" }} />
    </div>
  );
};

export default MTChart;
