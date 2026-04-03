import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { TradingAccount, Transaction, UserProfile } from "../backend.d";
import { AccountType } from "../backend.d";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useActor } from "../hooks/useActor";

export default function AccountPage() {
  const { actor } = useActor();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [depositing, setDepositing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!actor) return;
    try {
      const [accs, txns, prof] = await Promise.all([
        actor.getOwnAccounts(),
        actor.getOwnTransactions(),
        actor.getCallerUserProfile(),
      ]);
      setAccounts(accs);
      setTransactions(txns);
      setProfile(prof);
      if (accs.length > 0) setSelectedAccountId(String(accs[0].accountId));
      setLoading(false);
    } catch {
      setLoading(false);
      toast.error("Failed to load account data");
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: load wraps actor
  useEffect(() => {
    load();
  }, [actor]);

  const handleDeposit = async () => {
    if (!actor || !selectedAccountId || !depositAmount) return;
    const account = accounts.find(
      (a) => String(a.accountId) === selectedAccountId,
    );
    if (!account || String(account.accountType) !== AccountType.demo) {
      toast.error(
        "Deposits are only available for Demo accounts in this version",
      );
      return;
    }
    setDepositing(true);
    try {
      await actor.depositToDemoAccount(
        BigInt(selectedAccountId),
        Number.parseFloat(depositAmount),
      );
      toast.success(`Deposited $${depositAmount} to demo account`);
      setDepositAmount("");
      await load();
    } catch {
      toast.error("Deposit failed");
    } finally {
      setDepositing(false);
    }
  };

  const handleCreateAccount = async (type: AccountType) => {
    if (!actor) return;
    try {
      await actor.createTradingAccount(type, "USD");
      toast.success(`New ${type} account created`);
      await load();
    } catch {
      toast.error("Failed to create account");
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  if (loading) {
    return (
      <div
        data-ocid="account.loading_state"
        className="flex items-center justify-center h-64"
      >
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-400" />
      </div>
    );
  }

  return (
    <div data-ocid="account.page" className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Account</h1>

      {/* Profile */}
      {profile && (
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-slate-400">Name</div>
              <div className="text-white">{profile.name}</div>
            </div>
            <div>
              <div className="text-slate-400">Email</div>
              <div className="text-white">{profile.email}</div>
            </div>
            <div>
              <div className="text-slate-400">Phone</div>
              <div className="text-white">{profile.phone || "-"}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trading Accounts */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Trading Accounts</h2>
          <div className="flex gap-2">
            <Button
              data-ocid="account.new_demo.button"
              size="sm"
              variant="outline"
              onClick={() => handleCreateAccount(AccountType.demo)}
              className="border-white/20 text-white hover:bg-white/10 text-xs"
            >
              + Demo
            </Button>
            <Button
              data-ocid="account.new_live.button"
              size="sm"
              variant="outline"
              onClick={() => handleCreateAccount(AccountType.live)}
              className="border-white/20 text-white hover:bg-white/10 text-xs"
            >
              + Live
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((acc, i) => (
            <div
              key={String(acc.accountId)}
              data-ocid={`account.trading_account.item.${i + 1}`}
              className="bg-white/5 rounded-xl border border-white/10 p-4"
            >
              <div className="flex justify-between mb-3">
                <span className="text-slate-400 text-sm">
                  Account #{String(acc.accountId)}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    String(acc.accountType) === AccountType.demo
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {String(acc.accountType).toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-slate-500 text-xs">Balance</div>
                  <div className="text-white font-semibold">
                    {fmt(acc.balance)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">Equity</div>
                  <div className="text-white font-semibold">
                    {fmt(acc.equity)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">Margin</div>
                  <div className="text-white">{fmt(acc.margin)}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">Free Margin</div>
                  <div className="text-white">{fmt(acc.freeMargin)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deposit */}
      <Card className="bg-white/5 border-white/10 mb-6">
        <CardHeader>
          <CardTitle className="text-white text-base">
            Deposit to Demo Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label className="text-slate-300 text-sm">
                Select Demo Account
              </Label>
              <select
                data-ocid="account.deposit_account.select"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full mt-1 bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white text-sm"
              >
                {accounts
                  .filter((a) => String(a.accountType) === AccountType.demo)
                  .map((acc) => (
                    <option
                      key={String(acc.accountId)}
                      value={String(acc.accountId)}
                      className="bg-[#0f1422]"
                    >
                      #{String(acc.accountId)} ({fmt(acc.balance)})
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex-1">
              <Label className="text-slate-300 text-sm">Amount (USD)</Label>
              <Input
                data-ocid="account.deposit.input"
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="1000"
                className="bg-white/10 border-white/20 text-white mt-1"
              />
            </div>
            <Button
              data-ocid="account.deposit.submit_button"
              onClick={handleDeposit}
              disabled={depositing || !depositAmount}
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
            >
              {depositing ? "Depositing..." : "Deposit"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
        {transactions.length === 0 ? (
          <div
            data-ocid="account.transactions.empty_state"
            className="text-center py-12 text-slate-500 bg-white/5 rounded-xl border border-white/10"
          >
            No transactions yet
          </div>
        ) : (
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-x-auto">
            <table
              data-ocid="account.transactions.table"
              className="w-full text-sm"
            >
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-right px-4 py-3">Amount</th>
                  <th className="text-right px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <tr
                    key={String(tx.transactionId)}
                    data-ocid={`account.transaction.item.${i + 1}`}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={
                          String(tx.transactionType) === "deposit"
                            ? "text-emerald-400"
                            : "text-red-400"
                        }
                      >
                        {String(tx.transactionType).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-white">
                      {fmt(tx.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          String(tx.status) === "completed"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : String(tx.status) === "pending"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {String(tx.status).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">
                      {new Date(
                        Number(tx.timestamp) / 1_000_000,
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
