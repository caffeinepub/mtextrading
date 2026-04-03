import { Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import type { LeaderboardEntry } from "../backend.d";
import { useActor } from "../hooks/useActor";

export default function LeaderboardPage() {
  const { actor } = useActor();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor) return;
    actor.getTopNLeaderboardEntries(BigInt(50)).then((e) => {
      setEntries(e);
      setLoading(false);
    });
  }, [actor]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      signDisplay: "always",
    }).format(n);

  if (loading) {
    return (
      <div
        data-ocid="leaderboard.loading_state"
        className="flex items-center justify-center h-64"
      >
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-400" />
      </div>
    );
  }

  return (
    <div data-ocid="leaderboard.page" className="p-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <Trophy className="text-amber-400 mx-auto mb-2" size={32} />
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-slate-400">Top traders by total profit</p>
      </div>

      {entries.length === 0 ? (
        <div
          data-ocid="leaderboard.empty_state"
          className="text-center py-16 text-slate-500 bg-white/5 rounded-xl border border-white/10"
        >
          No traders ranked yet. Start trading to appear here!
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <div
              key={entry.name ? entry.name + i : i}
              data-ocid={`leaderboard.entry.item.${i + 1}`}
              className={`flex items-center gap-4 p-4 rounded-xl border ${
                i === 0
                  ? "bg-amber-500/10 border-amber-500/30"
                  : i === 1
                    ? "bg-slate-400/10 border-slate-400/30"
                    : i === 2
                      ? "bg-amber-700/10 border-amber-700/30"
                      : "bg-white/5 border-white/10"
              }`}
            >
              <div
                className={`text-lg font-bold w-8 text-center ${
                  i === 0
                    ? "text-amber-400"
                    : i === 1
                      ? "text-slate-300"
                      : i === 2
                        ? "text-amber-700"
                        : "text-slate-500"
                }`}
              >
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-white">
                  {entry.name || "Anonymous Trader"}
                </div>
              </div>
              <div
                className={`font-bold font-mono ${
                  entry.profit >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {fmt(entry.profit)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
