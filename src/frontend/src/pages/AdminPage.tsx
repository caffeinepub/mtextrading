import type { Principal } from "@icp-sdk/core/principal";
import {
  Activity,
  BarChart2,
  Bot,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  DollarSign,
  Eye,
  Gift,
  LogOut,
  Menu,
  MessageCircle,
  PlayCircle,
  Settings,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { BotConfig } from "../backend";
import type {
  MarketInstrument,
  PlatformSettings,
  TradeOrder,
  TradingAccount,
  Transaction,
  UserProfile,
  WithdrawalRequest,
} from "../backend.d";
import {
  AccountType,
  InstrumentCategory,
  KycStatus,
  OrderStatus,
  TransactionStatus,
  TransactionType,
  UserRole,
} from "../backend.d";
import { AdminChatPanel } from "../components/FloatingChatButton";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Switch } from "../components/ui/switch";

import { Textarea } from "../components/ui/textarea";
import { useActor } from "../hooks/useActor";
import { useEmailAuth } from "../hooks/useEmailAuth";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

type UserEntry = [Principal, UserProfile];

interface Promotion {
  id: string;
  name: string;
  bonusPct: number;
  code?: string;
  applicableTo: "first" | "all";
  active: boolean;
}

// ── Audit Log utility ────────────────────────────────────────────────────────
function logAdminAction(action: string, details: string) {
  try {
    const log: Array<{
      action: string;
      details: string;
      timestamp: string;
      admin: string;
    }> = JSON.parse(localStorage.getItem("mtex_audit_log") || "[]");
    log.unshift({
      action,
      details,
      timestamp: new Date().toISOString(),
      admin: "Admin",
    });
    localStorage.setItem("mtex_audit_log", JSON.stringify(log.slice(0, 200)));
  } catch {}
}

// ── Per-user limits utility ───────────────────────────────────────────────────
function getUserLimits(principalStr: string) {
  try {
    const limits: Record<
      string,
      { depositLimit: number | null; withdrawalLimit: number | null }
    > = JSON.parse(localStorage.getItem("mtex_user_limits") || "{}");
    return (
      limits[principalStr] || { depositLimit: null, withdrawalLimit: null }
    );
  } catch {
    return { depositLimit: null, withdrawalLimit: null };
  }
}

function setUserLimits(
  principalStr: string,
  depositLimit: number | null,
  withdrawalLimit: number | null,
) {
  try {
    const limits: Record<
      string,
      { depositLimit: number | null; withdrawalLimit: number | null }
    > = JSON.parse(localStorage.getItem("mtex_user_limits") || "{}");
    limits[principalStr] = { depositLimit, withdrawalLimit };
    localStorage.setItem("mtex_user_limits", JSON.stringify(limits));
  } catch {}
}

function formatDate(nanoseconds: bigint): string {
  const ms = Number(nanoseconds / 1_000_000n);
  if (!ms) return "-";
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function KycBadge({ status }: { status: KycStatus }) {
  const map: Record<KycStatus, { label: string; className: string }> = {
    [KycStatus.notSubmitted]: {
      label: "Not Submitted",
      className: "bg-slate-500/20 text-gray-500 border-slate-500/30",
    },
    [KycStatus.pending]: {
      label: "Pending",
      className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    },
    [KycStatus.approved]: {
      label: "Approved",
      className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    },
    [KycStatus.rejected]: {
      label: "Rejected",
      className: "bg-red-500/20 text-red-400 border-red-500/30",
    },
  };
  const { label, className } = map[status] ?? map[KycStatus.notSubmitted];
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded border font-medium ${className}`}
    >
      {label}
    </span>
  );
}

// ── Adjust Balance Dialog ──────────────────────────────────────────────────
function AdjustBalanceDialog({
  open,
  onClose,
  userAccounts,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  userAccounts: TradingAccount[];
  onSave: (accountId: bigint, amount: number) => Promise<void>;
}) {
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!accountId || !amount) return;
    setSaving(true);
    try {
      await onSave(BigInt(accountId), Number.parseFloat(amount));
      onClose();
      setAccountId("");
      setAmount("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-white border-gray-200 text-gray-900">
        <DialogHeader>
          <DialogTitle>Adjust Account Balance</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-gray-600 text-sm">Account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger
                data-ocid="admin.adjust_balance.select"
                className="bg-gray-50 border-gray-200 text-white mt-1"
              >
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 text-gray-900">
                {userAccounts.map((a) => (
                  <SelectItem
                    key={String(a.accountId)}
                    value={String(a.accountId)}
                  >
                    #{String(a.accountId)} —{" "}
                    {String(a.accountType).toUpperCase()} ($
                    {a.balance.toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-gray-600 text-sm">New Balance (USD)</Label>
            <Input
              data-ocid="admin.adjust_balance.input"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 10000"
              className="bg-gray-50 border-gray-200 text-white mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-gray-500">
            Cancel
          </Button>
          <Button
            data-ocid="admin.adjust_balance.save_button"
            onClick={handleSave}
            disabled={saving || !accountId || !amount}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── View User Trades Dialog ────────────────────────────────────────────────
function UserTradesDialog({
  open,
  onClose,
  trades,
  userName,
}: {
  open: boolean;
  onClose: () => void;
  trades: TradeOrder[];
  userName: string;
}) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-3xl">
        <DialogHeader>
          <DialogTitle>Trades — {userName}</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto max-h-96">
          {trades.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">
              No trades found.
            </p>
          ) : (
            <table className="w-full min-w-[700px] text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="text-left px-3 py-2">ID</th>
                  <th className="text-left px-3 py-2">Type</th>
                  <th className="text-right px-3 py-2">Lots</th>
                  <th className="text-right px-3 py-2">Open Price</th>
                  <th className="text-right px-3 py-2">P&L</th>
                  <th className="text-right px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((order) => (
                  <tr
                    key={String(order.orderId)}
                    className="border-b border-white/5"
                  >
                    <td className="px-3 py-2 text-gray-500">
                      #{String(order.orderId)}
                    </td>
                    <td
                      className={`px-3 py-2 font-semibold ${String(order.orderType) === "buy" ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {String(order.orderType).toUpperCase()}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600">
                      {order.lotSize}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-gray-600">
                      {order.openPrice.toFixed(5)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right ${
                        order.profitLoss !== undefined &&
                        order.profitLoss !== null
                          ? order.profitLoss >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                          : "text-gray-500"
                      }`}
                    >
                      {order.profitLoss !== undefined &&
                      order.profitLoss !== null
                        ? fmt(order.profitLoss)
                        : "-"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-50 text-gray-600">
                        {String(order.status).toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-gray-500">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Reject KYC Dialog ─────────────────────────────────────────────────────
function RejectKycDialog({
  open,
  onClose,
  onConfirm,
  userName,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => Promise<void>;
  userName: string;
}) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(notes);
      setNotes("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-white border-gray-200 text-gray-900">
        <DialogHeader>
          <DialogTitle>Reject KYC — {userName}</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <Label className="text-gray-600 text-sm">Rejection Reason</Label>
          <Textarea
            data-ocid="admin.kyc_reject.textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Explain why this document was rejected..."
            className="bg-gray-50 border-gray-200 text-white mt-1 resize-none"
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-500"
            data-ocid="admin.kyc_reject.cancel_button"
          >
            Cancel
          </Button>
          <Button
            data-ocid="admin.kyc_reject.confirm_button"
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {loading ? "Rejecting..." : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── BotConfigSection ──────────────────────────────────────────────────────
function BotConfigSection({ actor }: { actor: any }) {
  const [config, setConfig] = useState<BotConfig>({
    botName: "Mtex AI Assistant",
    greetingMessage:
      "Hi! I'm Mtex AI, your trading assistant. Ask me anything about the platform — how to deposit, how to trade, or how to find your way around!",
    rules: "",
    voiceEnabled: true,
    findProviderEnabled: true,
    depositFlowEnabled: true,
    tradeFlowEnabled: true,
    supportFlowEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    actor
      ?.getBotConfig()
      .then((c: BotConfig) => {
        setConfig(c);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [actor]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await actor.setBotConfig(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400">
        Loading bot config...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-lg text-gray-900 mb-1">
          AI Bot Configuration
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Control how the AI assistant behaves for all users on the platform.
        </p>

        <div className="space-y-5">
          {/* Bot Name */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1 block">
              Bot Name
            </Label>
            <Input
              data-ocid="admin.bot_config.bot_name.input"
              value={config.botName}
              onChange={(e) =>
                setConfig((c) => ({ ...c, botName: e.target.value }))
              }
              placeholder="Mtex AI Assistant"
            />
          </div>

          {/* Greeting Message */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1 block">
              Greeting Message
            </Label>
            <Textarea
              data-ocid="admin.bot_config.greeting.textarea"
              value={config.greetingMessage}
              onChange={(e) =>
                setConfig((c) => ({ ...c, greetingMessage: e.target.value }))
              }
              placeholder="What the bot says when it opens..."
              rows={3}
            />
            <p className="text-xs text-gray-400 mt-1">
              This is the first message users see when they open the AI chat.
            </p>
          </div>

          {/* Bot Rules */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1 block">
              Bot Rules
            </Label>
            <Textarea
              data-ocid="admin.bot_config.rules.textarea"
              value={config.rules}
              onChange={(e) =>
                setConfig((c) => ({ ...c, rules: e.target.value }))
              }
              placeholder="e.g. Always remind users about the 3-request daily limit. Always mention the scam warning."
              rows={3}
            />
            <p className="text-xs text-gray-400 mt-1">
              These rules are prepended to every bot response as a note.
            </p>
          </div>

          {/* Feature Toggles */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Feature Toggles
            </Label>
            <div className="space-y-3">
              {[
                {
                  key: "voiceEnabled",
                  label: "Voice Input",
                  desc: "Allow users to use microphone for voice input",
                },
                {
                  key: "findProviderEnabled",
                  label: "Find Provider Flow",
                  desc: "Allow bot to assist with finding providers",
                },
                {
                  key: "depositFlowEnabled",
                  label: "Deposit Flow",
                  desc: "Allow bot to assist with deposit questions",
                },
                {
                  key: "tradeFlowEnabled",
                  label: "Trade Flow",
                  desc: "Allow bot to assist with trading questions",
                },
                {
                  key: "supportFlowEnabled",
                  label: "Support Flow",
                  desc: "Allow bot to direct users to support chat",
                },
              ].map(({ key, label, desc }) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 border border-gray-100 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                  <Switch
                    data-ocid={`admin.bot_config.${key}.switch`}
                    checked={config[key as keyof BotConfig] as boolean}
                    onCheckedChange={(checked) =>
                      setConfig((c) => ({ ...c, [key]: checked }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              data-ocid="admin.bot_config.save.submit_button"
              onClick={handleSave}
              disabled={saving}
              className="bg-[#1a2744] hover:bg-[#243359] text-white"
            >
              {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Changes"}
            </Button>
            {saved && (
              <span className="text-sm text-green-600">
                Changes applied to all users
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main AdminPage ─────────────────────────────────────────────────────────
interface AdminPageProps {
  isSuperAdmin?: boolean;
  staffEmail?: string;
}
export default function AdminPage({
  isSuperAdmin = false,
  staffEmail,
}: AdminPageProps) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity, isInitializing } = useInternetIdentity();
  const emailAuth = useEmailAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [copiedPrincipal, setCopiedPrincipal] = useState(false);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [orders, setOrders] = useState<TradeOrder[]>([]);
  const [instruments, setInstruments] = useState<MarketInstrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("users");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Promotions state
  const [promotions, setPromotions] = useState<Promotion[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("mtex_bonus_promotions") || "[]");
    } catch {
      return [];
    }
  });
  const [newPromo, setNewPromo] = useState({
    name: "",
    bonusPct: "",
    code: "",
    applicableTo: "first" as "first" | "all",
  });

  // ── Per-user limits dialog state ─────────────────────────────────────────
  const [limitsUser, setLimitsUser] = useState<UserEntry | null>(null);
  const [limitsDepositInput, setLimitsDepositInput] = useState("");
  const [limitsWithdrawInput, setLimitsWithdrawInput] = useState("");
  const [savingLimits, setSavingLimits] = useState(false);
  const [savingPromo, setSavingPromo] = useState(false);

  // Instruments form
  const [newInst, setNewInst] = useState({
    name: "",
    symbol: "",
    category: InstrumentCategory.forex,
    bid: "",
    ask: "",
  });
  const [creating, setCreating] = useState(false);

  // Trade filter
  const [tradeFilter, setTradeFilter] = useState<"all" | OrderStatus>("all");

  // KYC filter
  const [kycFilter, setKycFilter] = useState<"all" | KycStatus>("all");

  // Dialogs
  const [balanceDialogUser, setBalanceDialogUser] = useState<UserEntry | null>(
    null,
  );
  const [balanceUserAccounts, setBalanceUserAccounts] = useState<
    TradingAccount[]
  >([]);
  const [tradesDialogUser, setTradesDialogUser] = useState<UserEntry | null>(
    null,
  );
  const [tradesDialogOrders, setTradesDialogOrders] = useState<TradeOrder[]>(
    [],
  );
  const [rejectKycUser, setRejectKycUser] = useState<UserEntry | null>(null);
  const [viewUser, setViewUser] = useState<UserEntry | null>(null);

  // New Part 2 state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<
    WithdrawalRequest[]
  >([]);
  const [financialSummary, setFinancialSummary] = useState<{
    totalDeposits: number;
    totalWithdrawals: number;
    platformBalance: number;
    revenue: number;
  } | null>(null);
  const [approvingId, setApprovingId] = useState<bigint | null>(null);
  const [rejectingId, setRejectingId] = useState<bigint | null>(null);

  // Part 3 state
  const [platformSettings, setPlatformSettings] =
    useState<PlatformSettings | null>(null);
  const [settingsForm, setSettingsForm] = useState<{
    maintenanceMode: boolean;
    minDeposit: string;
    maxDeposit: string;
    minWithdrawal: string;
    maxWithdrawal: string;
    forexHours: string;
    stocksHours: string;
    cryptoHours: string;
    defaultDemoBalance: string;
  }>({
    maintenanceMode: false,
    minDeposit: "100",
    maxDeposit: "100000",
    minWithdrawal: "50",
    maxWithdrawal: "50000",
    forexHours: "24/5",
    stocksHours: "8/5",
    cryptoHours: "24/7",
    defaultDemoBalance: "10000",
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [announcementToAll, setAnnouncementToAll] = useState({
    subject: "",
    body: "",
  });
  const [announcementToUser, setAnnouncementToUser] = useState({
    email: "",
    subject: "",
    body: "",
  });
  const [sendingAll, setSendingAll] = useState(false);
  const [sendingUser, setSendingUser] = useState(false);
  const [updatingLeverage, setUpdatingLeverage] = useState<bigint | null>(null);
  const [leverageEdits, setLeverageEdits] = useState<Record<string, string>>(
    {},
  );
  const [togglingInstrument, setTogglingInstrument] = useState<bigint | null>(
    null,
  );
  const [resettingDemo, setResettingDemo] = useState<bigint | null>(null);

  // Crypto deposits state
  const [cryptoDeposits, setCryptoDeposits] = useState<any[]>([]);
  const [rejectingDepositId, setRejectingDepositId] = useState<bigint | null>(
    null,
  );
  const [rejectDepositNotes, setRejectDepositNotes] = useState("");

  // Wallet addresses state
  const [walletAddresses, setWalletAddresses] = useState<
    Array<{ coin: string; network: string; address: string }>
  >([]);
  const [walletEditMode, setWalletEditMode] = useState<string | null>(null);
  const [walletEditValue, setWalletEditValue] = useState("");
  const [savingWallet, setSavingWallet] = useState(false);
  const [showQrFor, setShowQrFor] = useState<string | null>(null);

  // Staff admins state (super admin only)
  const [staffAdmins, setStaffAdmins] = useState<string[]>([]);
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [addingStaff, setAddingStaff] = useState(false);

  const COINS = [
    { coin: "BTC", network: "Bitcoin", label: "Bitcoin" },
    { coin: "ETH", network: "ERC-20", label: "Ethereum (ERC-20)" },
    { coin: "SOL", network: "Solana", label: "Solana" },
    { coin: "USDT", network: "ERC-20", label: "USDT (ERC-20)" },
    { coin: "USDT", network: "TRC-20", label: "USDT (TRC-20)" },
    { coin: "USDT", network: "BEP-20", label: "USDT (BEP-20)" },
    { coin: "USDC", network: "ERC-20", label: "USDC (ERC-20)" },
    { coin: "BNB", network: "BEP-20", label: "BNB Chain (BEP-20)" },
    { coin: "LTC", network: "Litecoin", label: "Litecoin" },
    { coin: "XRP", network: "XRP", label: "Ripple (XRP)" },
  ];

  const loadData = async () => {
    if (!actor) return;
    try {
      const [u, a, o, i, wallets, emailRegs] = await Promise.all([
        actor.getAllUsers(),
        actor.getAllAccounts(),
        actor.getAllOrders(),
        actor.getAllInstruments(),
        (actor as any).getCryptoWalletAddresses(),
        (actor as any).getEmailRegistrations().catch(() => [] as string[]),
      ]);
      // Merge email-only registrations (no profile yet) into user list
      const profileEmails = new Set((u as UserEntry[]).map(([, p]) => p.email));
      const incomplete: UserEntry[] = (emailRegs as string[])
        .filter((email: string) => !profileEmails.has(email))
        .map((email: string) => {
          const stub: UserProfile = {
            name: "",
            email,
            phone: "",
            dateOfBirth: "",
            country: "",
            homeAddress: "",
            accountType: AccountType.demo,
            created: BigInt(0),
            isBanned: false,
            kycStatus: KycStatus.notSubmitted,
            kycDocumentUrl: undefined,
            kycNotes: undefined,
          };
          // Use a placeholder principal for email-only users
          const placeholder = { toText: () => email } as unknown as Principal;
          return [placeholder, stub] as UserEntry;
        });
      setUsers([...(u as UserEntry[]), ...incomplete]);
      setAccounts(a);
      setOrders(o);
      setInstruments(i);
      setWalletAddresses(Array.isArray(wallets) ? wallets : []);
    } catch {
      // silently fail — same pattern as loadPart2Data and loadPart3Data
    }
  };

  const loadStaffAdmins = async () => {
    if (!actor || !isSuperAdmin) return;
    try {
      const list = await (actor as any).getStaffAdmins();
      setStaffAdmins(Array.isArray(list) ? list : []);
    } catch {
      // silently fail
    }
  };

  const loadPart3Data = async () => {
    if (!actor) return;
    try {
      const settings = await actor.getPlatformSettings();
      setPlatformSettings(settings);
      setSettingsForm({
        maintenanceMode: settings.maintenanceMode,
        minDeposit: String(settings.minDeposit),
        maxDeposit: String(settings.maxDeposit),
        minWithdrawal: String(settings.minWithdrawal),
        maxWithdrawal: String(settings.maxWithdrawal),
        forexHours: settings.forexHours,
        stocksHours: settings.stocksHours,
        cryptoHours: settings.cryptoHours,
        defaultDemoBalance: String(settings.defaultDemoBalance),
      });
    } catch {
      // silently fail
    }
  };

  const loadPart2Data = async () => {
    if (!actor) return;
    try {
      const [txns, withdrawals, summary, cryptoDepsRaw] = await Promise.all([
        actor.getAllTransactions(),
        (actor as any).getAllWithdrawalRequests(),
        (actor as any).getFinancialSummary(),
        (actor as any).getCryptoDepositRequests(),
      ]);
      setTransactions(txns);
      setWithdrawalRequests(withdrawals);
      setFinancialSummary({
        totalDeposits: (summary as any).totalDeposits ?? 0,
        totalWithdrawals: (summary as any).totalWithdrawals ?? 0,
        platformBalance:
          (summary as any).totalBalance ??
          (summary as any).platformBalance ??
          0,
        revenue: (summary as any).revenue ?? 0,
      });
      setCryptoDeposits(Array.isArray(cryptoDepsRaw) ? cryptoDepsRaw : []);
    } catch {
      // silently fail, tabs will show empty state
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadData depends only on actor which is already in deps
  useEffect(() => {
    if (!actor) {
      if (!isSuperAdmin) {
        // Staff path: wait for actor from email identity
        // If staffEmail + email identity exist, actor is still loading -- keep waiting
        if (!actorFetching && !(staffEmail && emailAuth.identity)) {
          setLoading(false);
          setIsAdmin(false);
        }
      } else {
        if (!isInitializing && !actorFetching) {
          setLoading(false);
          setIsAdmin(false);
        }
      }
      return;
    }

    if (!isSuperAdmin) {
      // Staff admin path: OTP verification IS the auth check.
      // If staffEmail is provided and email identity is available, grant access directly.
      if (staffEmail && emailAuth.identity) {
        setIsAdmin(true);
        Promise.all([loadData(), loadPart2Data(), loadPart3Data()]).finally(
          () => setLoading(false),
        );
      } else {
        // fallback: check isCallerAdmin
        actor
          .isCallerAdmin()
          .then((admin) => {
            setIsAdmin(admin);
            if (admin) {
              Promise.all([
                loadData(),
                loadPart2Data(),
                loadPart3Data(),
              ]).finally(() => setLoading(false));
            } else {
              setLoading(false);
            }
          })
          .catch(() => setLoading(false));
      }
      return;
    }

    // Super admin path: check hardcoded principal or AccessControl
    const ADMIN_PRINCIPAL =
      "4qixx-3hllv-jm445-bwqqh-qdyjf-nnauk-kw52p-jnkte-uro35-xvk3i-4ae";
    const callerPrincipal = identity?.getPrincipal().toText();
    if (callerPrincipal === ADMIN_PRINCIPAL) {
      setIsAdmin(true);
      Promise.all([
        loadData(),
        loadPart2Data(),
        loadPart3Data(),
        loadStaffAdmins(),
      ]).finally(() => setLoading(false));
      return;
    }
    actor
      .isCallerAdmin()
      .then((admin) => {
        setIsAdmin(admin);
        if (admin) {
          Promise.all([
            loadData(),
            loadPart2Data(),
            loadPart3Data(),
            loadStaffAdmins(),
          ]).finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [actor, isInitializing, identity, actorFetching, isSuperAdmin]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  const getInstrumentSymbol = (id: bigint) =>
    instruments.find((i) => i.instrumentId === id)?.symbol ?? `#${String(id)}`;

  // ── User actions ──
  const handleBanToggle = async (principal: Principal, isBanned: boolean) => {
    if (!actor) return;
    const userEmail =
      users.find(([p]) => String(p) === String(principal))?.[1]?.email ||
      String(principal);
    try {
      if (isBanned) {
        await actor.unbanUser(principal);
        logAdminAction("Unbanned user", `Unbanned user ${userEmail}`);
        toast.success("User unbanned");
      } else {
        await actor.banUser(principal);
        logAdminAction("Banned user", `Banned user ${userEmail}`);
        toast.success("User banned");
      }
      await loadData();
    } catch {
      toast.error("Action failed");
    }
  };

  const handleDeleteUser = async (principal: Principal) => {
    if (!actor) return;
    const userEmail =
      users.find(([p]) => String(p) === String(principal))?.[1]?.email ||
      String(principal);
    try {
      await actor.deleteUser(principal);
      logAdminAction("Deleted user", `Deleted user ${userEmail}`);
      setUsers((prev) => prev.filter(([p]) => p !== principal));
      toast.success("User deleted");
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const handleChangeAccountType = async (
    principal: Principal,
    accountType: AccountType,
  ) => {
    if (!actor) return;
    try {
      await actor.upgradeUserAccountType(principal, accountType);
      toast.success("Account type updated");
      await loadData();
    } catch {
      toast.error("Failed to update account type");
    }
  };

  const openBalanceDialog = async (entry: UserEntry) => {
    if (!actor) return;
    const accs = await actor.getUserAccounts(entry[0]);
    setBalanceUserAccounts(accs);
    setBalanceDialogUser(entry);
  };

  const handleAdjustBalance = async (accountId: bigint, amount: number) => {
    if (!actor) return;
    const userEmail = balanceDialogUser?.[1]?.email || String(accountId);
    try {
      await actor.updateAccountBalance(accountId, amount);
      logAdminAction(
        "Adjusted balance",
        `Adjusted balance for ${userEmail} to $${amount}`,
      );
      toast.success("Balance updated");
      await loadData();
    } catch {
      toast.error("Failed to update balance");
    }
  };

  const openTradesDialog = async (entry: UserEntry) => {
    if (!actor) return;
    const trades = await actor.getUserOrders(entry[0]);
    setTradesDialogOrders(trades);
    setTradesDialogUser(entry);
  };

  // ── Trade actions ──
  const handleCancelTrade = async (orderId: bigint) => {
    if (!actor) return;
    try {
      await actor.adminCancelOrder(orderId);
      toast.success("Trade cancelled");
      await loadData();
    } catch {
      toast.error("Failed to cancel trade");
    }
  };

  // ── KYC actions ──
  const handleApproveKyc = async (principal: Principal) => {
    if (!actor) return;
    const userEmail =
      users.find(([p]) => String(p) === String(principal))?.[1]?.email ||
      String(principal);
    try {
      await actor.reviewKycDocument(principal, KycStatus.approved, "");
      logAdminAction("Approved KYC", `Approved KYC for ${userEmail}`);
      toast.success("KYC approved");
      await loadData();
    } catch {
      toast.error("Failed to approve KYC");
    }
  };

  const handleRejectKyc = async (notes: string) => {
    if (!actor || !rejectKycUser) return;
    const userEmail = rejectKycUser[1]?.email || String(rejectKycUser[0]);
    await actor.reviewKycDocument(rejectKycUser[0], KycStatus.rejected, notes);
    logAdminAction(
      "Rejected KYC",
      `Rejected KYC for ${userEmail}: ${notes || "No reason given"}`,
    );
    toast.success("KYC rejected");
    await loadData();
  };

  // ── Instruments ──
  const handleCreateInstrument = async () => {
    if (!actor || !newInst.name || !newInst.symbol) return;
    setCreating(true);
    try {
      await actor.createInstrument(
        newInst.name,
        newInst.symbol,
        newInst.category,
        Number.parseFloat(newInst.bid) || 0,
        Number.parseFloat(newInst.ask) || 0,
      );
      toast.success("Instrument created");
      const insts = await actor.getAllInstruments();
      setInstruments(insts);
      setNewInst({
        name: "",
        symbol: "",
        category: InstrumentCategory.forex,
        bid: "",
        ask: "",
      });
    } catch {
      toast.error("Failed to create instrument");
    } finally {
      setCreating(false);
    }
  };

  // ── Part 3 handlers ──
  const handleToggleInstrument = async (inst: MarketInstrument) => {
    if (!actor) return;
    setTogglingInstrument(inst.instrumentId);
    try {
      await actor.toggleInstrumentEnabled(inst.instrumentId, !inst.enabled);
      const insts = await actor.getAllInstruments();
      setInstruments(insts);
      toast.success(
        inst.enabled ? "Instrument disabled" : "Instrument enabled",
      );
    } catch {
      toast.error("Failed to toggle instrument");
    } finally {
      setTogglingInstrument(null);
    }
  };

  const handleUpdateLeverage = async (inst: MarketInstrument) => {
    if (!actor) return;
    const val = Number.parseFloat(
      leverageEdits[String(inst.instrumentId)] ?? String(inst.leverage),
    );
    if (Number.isNaN(val)) return;
    setUpdatingLeverage(inst.instrumentId);
    try {
      await actor.updateInstrumentLeverage(inst.instrumentId, val);
      const insts = await actor.getAllInstruments();
      setInstruments(insts);
      setLeverageEdits((prev) => {
        const n = { ...prev };
        delete n[String(inst.instrumentId)];
        return n;
      });
      toast.success("Leverage updated");
    } catch {
      toast.error("Failed to update leverage");
    } finally {
      setUpdatingLeverage(null);
    }
  };

  const handleSendToAll = async () => {
    if (!actor || !announcementToAll.subject || !announcementToAll.body) return;
    setSendingAll(true);
    try {
      await actor.sendAnnouncementToAll(
        announcementToAll.subject,
        announcementToAll.body,
      );
      toast.success("Announcement sent to all users");
      setAnnouncementToAll({ subject: "", body: "" });
    } catch {
      toast.error("Failed to send announcement");
    } finally {
      setSendingAll(false);
    }
  };

  const handleSendToUser = async () => {
    if (
      !actor ||
      !announcementToUser.email ||
      !announcementToUser.subject ||
      !announcementToUser.body
    )
      return;
    setSendingUser(true);
    try {
      await actor.sendAnnouncementToUser(
        announcementToUser.email,
        announcementToUser.subject,
        announcementToUser.body,
      );
      toast.success("Message sent to user");
      setAnnouncementToUser({ email: "", subject: "", body: "" });
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSendingUser(false);
    }
  };

  const handleResetDemoBalance = async (user: Principal, accountId: bigint) => {
    if (!actor) return;
    setResettingDemo(accountId);
    try {
      await actor.resetUserDemoBalance(user, accountId);
      toast.success("Demo balance reset");
      await loadData();
    } catch {
      toast.error("Failed to reset demo balance");
    } finally {
      setResettingDemo(null);
    }
  };

  const handleSaveSettings = async () => {
    if (!actor) return;
    setSavingSettings(true);
    try {
      await actor.setPlatformSettings({
        maintenanceMode: settingsForm.maintenanceMode,
        minDeposit: Number.parseFloat(settingsForm.minDeposit) || 0,
        maxDeposit: Number.parseFloat(settingsForm.maxDeposit) || 0,
        minWithdrawal: Number.parseFloat(settingsForm.minWithdrawal) || 0,
        maxWithdrawal: Number.parseFloat(settingsForm.maxWithdrawal) || 0,
        forexHours: settingsForm.forexHours,
        stocksHours: settingsForm.stocksHours,
        cryptoHours: settingsForm.cryptoHours,
        defaultDemoBalance:
          Number.parseFloat(settingsForm.defaultDemoBalance) || 0,
      });
      await loadPart3Data();
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  // ── Derived data ──
  const pendingKycCount = users.filter(
    ([, p]) => p.kycStatus === KycStatus.pending,
  ).length;

  const filteredOrders =
    tradeFilter === "all"
      ? orders
      : orders.filter((o) => String(o.status) === tradeFilter);

  const filteredKycUsers =
    kycFilter === "all"
      ? users.filter(([, p]) => p.kycStatus !== KycStatus.notSubmitted)
      : users.filter(([, p]) => String(p.kycStatus) === kycFilter);

  if (loading || (isAdmin === null && actorFetching))
    return (
      <div
        data-ocid="admin.loading_state"
        className="flex items-center justify-center h-64"
      >
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400" />
      </div>
    );

  if (isAdmin === false) {
    const principalId = identity ? identity.getPrincipal().toText() : "Unknown";
    return (
      <div
        data-ocid="admin.error_state"
        className="flex flex-col items-center justify-center min-h-screen text-center px-6"
      >
        <ShieldAlert size={40} className="text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
        <p className="text-gray-500 mb-6">
          Your account does not have admin privileges.
        </p>
        <div className="w-full max-w-md bg-gray-100 border border-gray-200 rounded-xl p-5 text-left">
          <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">
            Your Principal ID
          </p>
          <div className="flex items-center gap-2 bg-black/30 rounded-lg p-3 mb-3">
            <code className="text-xs text-gray-700 break-all flex-1">
              {principalId}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(principalId);
                setCopiedPrincipal(true);
                setTimeout(() => setCopiedPrincipal(false), 2000);
              }}
              className="shrink-0 text-gray-500 hover:text-white text-xs px-2 py-1 rounded border border-gray-200 whitespace-nowrap"
            >
              {copiedPrincipal ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Copy this Principal ID and set it as the admin principal in your
            backend configuration.
          </p>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-blue-300 text-xs">
            Are you a staff member?{" "}
            <a
              href="/#/admin"
              className="text-blue-400 underline hover:text-blue-200"
            >
              Go to Staff Login (/#/admin)
            </a>{" "}
            instead. This page requires the super admin Internet Identity.
          </p>
        </div>
      </div>
    );
  }

  const pendingWithdrawalsCount = withdrawalRequests.filter(
    (w) => String(w.status) === "pending",
  ).length;
  const navItems = [
    { id: "users", label: "Users", icon: Users, badge: users.length },
    {
      id: "kyc",
      label: "KYC",
      icon: ShieldCheck,
      badge: pendingKycCount > 0 ? pendingKycCount : null,
    },
    { id: "accounts", label: "Accounts", icon: Wallet, badge: null },
    { id: "trades", label: "Trades", icon: Activity, badge: null },
    { id: "instruments", label: "Instruments", icon: BarChart2, badge: null },
    { id: "deposits", label: "Deposits", icon: TrendingDown, badge: null },
    {
      id: "withdrawals",
      label: "Withdrawals",
      icon: TrendingUp,
      badge: pendingWithdrawalsCount > 0 ? pendingWithdrawalsCount : null,
    },
    { id: "financials", label: "Financials", icon: DollarSign, badge: null },
    {
      id: "announcements",
      label: "Announcements",
      icon: MessageCircle,
      badge: null,
    },
    {
      id: "demo-controls",
      label: "Demo Controls",
      icon: PlayCircle,
      badge: null,
    },
    { id: "settings", label: "Settings", icon: Settings, badge: null },
    {
      id: "crypto-deposits",
      label: "Crypto Deposits",
      icon: CircleDollarSign,
      badge: null,
    },
    { id: "wallets", label: "Wallets", icon: CreditCard, badge: null },
    {
      id: "support-chat",
      label: "Support Chat",
      icon: MessageCircle,
      badge: null,
    },
    { id: "promotions", label: "Promotions", icon: Gift, badge: null },
    { id: "audit-log", label: "Audit Log", icon: ShieldAlert, badge: null },
    ...(isSuperAdmin
      ? [
          { id: "staff", label: "Staff", icon: Users, badge: null },
          { id: "bot-config", label: "AI Bot", icon: Bot, badge: null },
        ]
      : []),
  ];

  return (
    <div
      data-ocid="admin.page"
      className="min-h-screen bg-gray-50 flex flex-col"
    >
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            data-ocid="admin.sidebar.toggle"
            type="button"
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              M
            </div>
            <span className="font-bold text-gray-900 text-lg hidden sm:block">
              Admin Dashboard
            </span>
            <span className="font-bold text-gray-900 text-base sm:hidden">
              Admin
            </span>
          </div>
        </div>
        <Button
          data-ocid="admin.logout.button"
          variant="outline"
          size="sm"
          className="text-gray-600 border-gray-200 hover:bg-gray-100"
          onClick={() => {
            window.location.href = "/";
          }}
        >
          <LogOut size={16} className="mr-1.5" /> Logout
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
            role="button"
            tabIndex={-1}
            aria-label="Close sidebar"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed md:sticky left-0 top-0 md:top-[57px] h-screen md:h-[calc(100vh-57px)] w-60 bg-white border-r border-gray-200 flex flex-col z-50 md:z-auto transition-transform duration-300 overflow-y-auto flex-shrink-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        >
          <div className="flex items-center justify-between px-4 py-3 md:hidden border-b border-gray-100">
            <span className="font-semibold text-gray-700 text-sm">
              Navigation
            </span>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded hover:bg-gray-100"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-ocid={`admin.${item.id.replace(/-/g, "_")}.tab`}
                  onClick={() => {
                    setActiveSection(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-blue-50 text-blue-700 border border-blue-100" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
                >
                  <Icon
                    size={17}
                    className={isActive ? "text-blue-600" : "text-gray-400"}
                  />
                  <span className="flex-1 text-left truncate">
                    {item.label}
                  </span>
                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${isActive ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600"}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 min-w-0">
          {/* Adjust Balance Dialog */}
          {balanceDialogUser && (
            <AdjustBalanceDialog
              open={!!balanceDialogUser}
              onClose={() => setBalanceDialogUser(null)}
              userAccounts={balanceUserAccounts}
              onSave={handleAdjustBalance}
            />
          )}

          {/* User Trades Dialog */}
          {tradesDialogUser && (
            <UserTradesDialog
              open={!!tradesDialogUser}
              onClose={() => setTradesDialogUser(null)}
              trades={tradesDialogOrders}
              userName={tradesDialogUser[1].name}
            />
          )}

          {/* View User Dialog */}
          {viewUser && (
            <Dialog
              open={!!viewUser}
              onOpenChange={(v) => !v && setViewUser(null)}
            >
              <DialogContent
                className="max-w-2xl bg-white text-gray-900 max-h-[90vh] overflow-y-auto"
                data-ocid="admin.view_user.dialog"
              >
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    User Profile
                  </DialogTitle>
                </DialogHeader>
                {(() => {
                  const [vPrincipal, vProfile] = viewUser;
                  const userAccounts = accounts.filter(
                    (a) => String(a.owner) === String(vPrincipal),
                  );
                  const liveAccount = userAccounts.find(
                    (a) => String(a.accountType) === AccountType.live,
                  );
                  const demoAccount = userAccounts.find(
                    (a) => String(a.accountType) === AccountType.demo,
                  );
                  return (
                    <div className="space-y-6">
                      {/* Profile Info */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                          Profile Information
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: "Full Name", value: vProfile.name },
                            { label: "Email", value: vProfile.email },
                            { label: "Phone", value: vProfile.phone || "-" },
                            {
                              label: "Date of Birth",
                              value: vProfile.dateOfBirth || "-",
                            },
                            {
                              label: "Country",
                              value: vProfile.country || "-",
                            },
                            {
                              label: "Home Address",
                              value: vProfile.homeAddress || "-",
                            },
                            {
                              label: "Member Since",
                              value: formatDate(vProfile.created),
                            },
                            {
                              label: "Account Type",
                              value: String(vProfile.accountType).toUpperCase(),
                            },
                          ].map(({ label, value }) => (
                            <div
                              key={label}
                              className="bg-gray-50 rounded-lg p-3"
                            >
                              <p className="text-xs text-gray-500 mb-0.5">
                                {label}
                              </p>
                              <p className="text-sm font-medium text-gray-900 break-all">
                                {value}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            KYC Status:
                          </span>
                          <KycBadge status={vProfile.kycStatus} />
                          <span
                            className={`text-xs px-2 py-0.5 rounded border font-medium ${vProfile.isBanned ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-600 border-green-200"}`}
                          >
                            {vProfile.isBanned ? "Banned" : "Active"}
                          </span>
                        </div>
                      </div>

                      {/* Account Balances */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                          Account Balances
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <p className="text-xs font-semibold text-blue-600 mb-2">
                              LIVE ACCOUNT
                            </p>
                            {liveAccount ? (
                              <>
                                <p className="text-2xl font-bold text-gray-900">
                                  {liveAccount.currency}{" "}
                                  {liveAccount.balance.toLocaleString(
                                    undefined,
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    },
                                  )}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Equity:{" "}
                                  {liveAccount.equity.toLocaleString(
                                    undefined,
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    },
                                  )}
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-gray-400 italic">
                                No account
                              </p>
                            )}
                          </div>
                          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                            <p className="text-xs font-semibold text-purple-600 mb-2">
                              DEMO ACCOUNT
                            </p>
                            {demoAccount ? (
                              <>
                                <p className="text-2xl font-bold text-gray-900">
                                  {demoAccount.currency}{" "}
                                  {demoAccount.balance.toLocaleString(
                                    undefined,
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    },
                                  )}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Equity:{" "}
                                  {demoAccount.equity.toLocaleString(
                                    undefined,
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    },
                                  )}
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-gray-400 italic">
                                No account
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                          Actions
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            data-ocid="admin.view_user.ban_button"
                            variant="outline"
                            onClick={() => {
                              handleBanToggle(vPrincipal, vProfile.isBanned);
                              setViewUser(null);
                            }}
                            className={
                              vProfile.isBanned
                                ? "border-green-300 text-green-700 hover:bg-green-50"
                                : "border-orange-300 text-orange-700 hover:bg-orange-50"
                            }
                          >
                            {vProfile.isBanned ? "Unban User" : "Ban User"}
                          </Button>
                          <Button
                            data-ocid="admin.view_user.adjust_balance_button"
                            variant="outline"
                            onClick={() => {
                              setBalanceDialogUser(viewUser);
                              setBalanceUserAccounts(userAccounts);
                              setViewUser(null);
                            }}
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            Adjust Balance
                          </Button>
                          <Button
                            data-ocid="admin.view_user.delete_button"
                            variant="outline"
                            onClick={() => {
                              handleDeleteUser(vPrincipal);
                              setViewUser(null);
                            }}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            Delete Account
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                <DialogFooter>
                  <Button
                    data-ocid="admin.view_user.close_button"
                    variant="outline"
                    onClick={() => setViewUser(null)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Reject KYC Dialog */}
          {rejectKycUser && (
            <RejectKycDialog
              open={!!rejectKycUser}
              onClose={() => setRejectKycUser(null)}
              onConfirm={handleRejectKyc}
              userName={rejectKycUser[1].name}
            />
          )}

          {/* ── USERS TAB ── */}
          {activeSection === "users" && (
            <div>
              <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                {users.length === 0 ? (
                  <div
                    data-ocid="admin.users.empty_state"
                    className="text-center py-16 text-gray-400"
                  >
                    No users
                  </div>
                ) : (
                  <table
                    data-ocid="admin.users.table"
                    className="w-full min-w-[700px] text-sm"
                  >
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500">
                        <th className="text-left px-4 py-3">Name</th>
                        <th className="text-left px-4 py-3">Email</th>
                        <th className="text-left px-4 py-3">Type</th>
                        <th className="text-left px-4 py-3">Status</th>
                        <th className="text-left px-4 py-3">KYC</th>
                        <th className="text-left px-4 py-3">Registered</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(([principal, profile], i) => (
                        <tr
                          key={String(principal)}
                          data-ocid={`admin.user.item.${i + 1}`}
                          className="border-b border-white/5 hover:bg-white"
                        >
                          <td className="px-4 py-3 font-medium">
                            {profile.name ? (
                              <span className="text-gray-900 font-medium">
                                {profile.name}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic text-xs">
                                Profile pending
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {profile.email}
                          </td>
                          <td className="px-4 py-3">
                            <Select
                              value={String(profile.accountType)}
                              onValueChange={(v) =>
                                handleChangeAccountType(
                                  principal,
                                  v as AccountType,
                                )
                              }
                            >
                              <SelectTrigger
                                data-ocid={`admin.user_type.select.${i + 1}`}
                                className="bg-gray-50 border-gray-200 text-gray-900 h-7 text-xs w-24"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-gray-200 text-gray-900">
                                <SelectItem value={AccountType.demo}>
                                  DEMO
                                </SelectItem>
                                <SelectItem value={AccountType.live}>
                                  LIVE
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-3">
                            {profile.isBanned ? (
                              <span className="text-xs px-2 py-0.5 rounded border bg-red-500/20 text-red-400 border-red-500/30 font-medium">
                                Banned
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded border bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-medium">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <KycBadge status={profile.kycStatus} />
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {formatDate(profile.created)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 justify-center flex-wrap">
                              <Button
                                data-ocid={`admin.ban_user.button.${i + 1}`}
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleBanToggle(principal, profile.isBanned)
                                }
                                className={`text-xs ${
                                  profile.isBanned
                                    ? "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20"
                                    : "border-orange-500/40 text-orange-400 hover:bg-orange-500/20"
                                }`}
                              >
                                {profile.isBanned ? "Unban" : "Ban"}
                              </Button>
                              <Button
                                data-ocid={`admin.adjust_balance.button.${i + 1}`}
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  openBalanceDialog([principal, profile])
                                }
                                className="border-blue-500/40 text-blue-400 hover:bg-blue-500/20 text-xs"
                              >
                                Balance
                              </Button>
                              <Button
                                data-ocid={`admin.view_trades.button.${i + 1}`}
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  openTradesDialog([principal, profile])
                                }
                                className="border-gray-200 text-gray-600 hover:bg-gray-50 text-xs"
                              >
                                Trades
                              </Button>
                              <Button
                                data-ocid={`admin.delete_user.button.${i + 1}`}
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteUser(principal)}
                                className="border-red-500/40 text-red-400 hover:bg-red-500/20 text-xs"
                              >
                                Delete
                              </Button>
                              <Button
                                data-ocid={`admin.view_user.button.${i + 1}`}
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setViewUser([principal, profile])
                                }
                                className="border-blue-500/40 text-blue-400 hover:bg-blue-500/20 text-xs"
                              >
                                <Eye size={12} className="mr-1" />
                                View
                              </Button>
                              <Button
                                data-ocid={`admin.set_limits.button.${i + 1}`}
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const existing = getUserLimits(
                                    String(principal),
                                  );
                                  setLimitsDepositInput(
                                    existing.depositLimit != null
                                      ? String(existing.depositLimit)
                                      : "",
                                  );
                                  setLimitsWithdrawInput(
                                    existing.withdrawalLimit != null
                                      ? String(existing.withdrawalLimit)
                                      : "",
                                  );
                                  setLimitsUser([principal, profile]);
                                }}
                                className="border-purple-500/40 text-purple-400 hover:bg-purple-500/20 text-xs"
                              >
                                Limits
                              </Button>
                            </div>
                            {(() => {
                              const lim = getUserLimits(String(principal));
                              if (!lim.depositLimit && !lim.withdrawalLimit)
                                return null;
                              return (
                                <div className="flex gap-1 mt-1 justify-center flex-wrap">
                                  {lim.depositLimit != null && (
                                    <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                                      Dep: ${lim.depositLimit}
                                    </span>
                                  )}
                                  {lim.withdrawalLimit != null && (
                                    <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                                      With: ${lim.withdrawalLimit}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── KYC TAB ── */}
          {activeSection === "kyc" && (
            <div>
              <div className="mb-4 flex items-center gap-3">
                <Label className="text-gray-600 text-sm">Filter:</Label>
                <Select
                  value={kycFilter}
                  onValueChange={(v) => setKycFilter(v as typeof kycFilter)}
                >
                  <SelectTrigger
                    data-ocid="admin.kyc_filter.select"
                    className="bg-gray-50 border-gray-200 text-white w-40"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 text-gray-900">
                    <SelectItem value="all">All Submitted</SelectItem>
                    <SelectItem value={KycStatus.pending}>Pending</SelectItem>
                    <SelectItem value={KycStatus.approved}>Approved</SelectItem>
                    <SelectItem value={KycStatus.rejected}>Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                {filteredKycUsers.length === 0 ? (
                  <div
                    data-ocid="admin.kyc.empty_state"
                    className="text-center py-16 text-gray-400"
                  >
                    No KYC submissions
                  </div>
                ) : (
                  <table
                    data-ocid="admin.kyc.table"
                    className="w-full min-w-[700px] text-sm"
                  >
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500">
                        <th className="text-left px-4 py-3">User</th>
                        <th className="text-left px-4 py-3">Email</th>
                        <th className="text-left px-4 py-3">Status</th>
                        <th className="text-left px-4 py-3">Document</th>
                        <th className="text-left px-4 py-3">Notes</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredKycUsers.map(([principal, profile], i) => (
                        <tr
                          key={String(principal)}
                          data-ocid={`admin.kyc.item.${i + 1}`}
                          className="border-b border-white/5 hover:bg-white"
                        >
                          <td className="px-4 py-3 text-white font-medium">
                            {profile.name}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {profile.email}
                          </td>
                          <td className="px-4 py-3">
                            <KycBadge status={profile.kycStatus} />
                          </td>
                          <td className="px-4 py-3">
                            {profile.kycDocumentUrl ? (
                              <a
                                href={profile.kycDocumentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-400 hover:underline text-xs"
                              >
                                View Document
                              </a>
                            ) : (
                              <span className="text-gray-400 text-xs">
                                No document
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs max-w-[180px] truncate">
                            {profile.kycNotes || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 justify-center">
                              {profile.kycStatus !== KycStatus.approved && (
                                <Button
                                  data-ocid={`admin.kyc_approve.button.${i + 1}`}
                                  size="sm"
                                  onClick={() => handleApproveKyc(principal)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7"
                                >
                                  Approve
                                </Button>
                              )}
                              {profile.kycStatus !== KycStatus.rejected && (
                                <Button
                                  data-ocid={`admin.kyc_reject.button.${i + 1}`}
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setRejectKycUser([principal, profile])
                                  }
                                  className="border-red-500/40 text-red-400 hover:bg-red-500/20 text-xs h-7"
                                >
                                  Reject
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── ACCOUNTS TAB ── */}
          {activeSection === "accounts" && (
            <div>
              <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                <table
                  data-ocid="admin.accounts.table"
                  className="w-full min-w-[700px] text-sm"
                >
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500">
                      <th className="text-left px-4 py-3">ID</th>
                      <th className="text-left px-4 py-3">Type</th>
                      <th className="text-right px-4 py-3">Balance</th>
                      <th className="text-right px-4 py-3">Equity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((acc, i) => (
                      <tr
                        key={String(acc.accountId)}
                        data-ocid={`admin.account.item.${i + 1}`}
                        className="border-b border-white/5 hover:bg-white"
                      >
                        <td className="px-4 py-3 text-gray-600">
                          #{String(acc.accountId)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 rounded bg-gray-50 text-gray-600">
                            {String(acc.accountType).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-white">
                          {fmt(acc.balance)}
                        </td>
                        <td className="px-4 py-3 text-right text-white">
                          {fmt(acc.equity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TRADES TAB ── */}
          {activeSection === "trades" && (
            <div>
              <div className="mb-4 flex items-center gap-3">
                <Label className="text-gray-600 text-sm">Filter:</Label>
                <Select
                  value={tradeFilter}
                  onValueChange={(v) => setTradeFilter(v as typeof tradeFilter)}
                >
                  <SelectTrigger
                    data-ocid="admin.trade_filter.select"
                    className="bg-gray-50 border-gray-200 text-white w-36"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 text-gray-900">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value={OrderStatus.open}>Open</SelectItem>
                    <SelectItem value={OrderStatus.closed}>Closed</SelectItem>
                    <SelectItem value={OrderStatus.cancelled}>
                      Cancelled
                    </SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-gray-400 text-xs">
                  {filteredOrders.length} trade(s)
                </span>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                {filteredOrders.length === 0 ? (
                  <div
                    data-ocid="admin.trades.empty_state"
                    className="text-center py-16 text-gray-400"
                  >
                    No trades found
                  </div>
                ) : (
                  <table
                    data-ocid="admin.trades.table"
                    className="w-full min-w-[700px] text-sm"
                  >
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500">
                        <th className="text-left px-4 py-3">Order ID</th>
                        <th className="text-left px-4 py-3">Instrument</th>
                        <th className="text-left px-4 py-3">Type</th>
                        <th className="text-right px-4 py-3">Lots</th>
                        <th className="text-right px-4 py-3">Open Price</th>
                        <th className="text-right px-4 py-3">P&L</th>
                        <th className="text-right px-4 py-3">Status</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order, i) => (
                        <tr
                          key={String(order.orderId)}
                          data-ocid={`admin.trade.item.${i + 1}`}
                          className="border-b border-white/5 hover:bg-white"
                        >
                          <td className="px-4 py-3 text-gray-500">
                            #{String(order.orderId)}
                          </td>
                          <td className="px-4 py-3 text-white font-medium">
                            {getInstrumentSymbol(order.instrumentId)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                String(order.orderType) === "buy"
                                  ? "text-emerald-400 font-semibold"
                                  : "text-red-400 font-semibold"
                              }
                            >
                              {String(order.orderType).toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {order.lotSize}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-gray-600">
                            {order.openPrice.toFixed(5)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={
                                order.profitLoss !== undefined &&
                                order.profitLoss !== null
                                  ? order.profitLoss >= 0
                                    ? "text-emerald-400"
                                    : "text-red-400"
                                  : "text-gray-500"
                              }
                            >
                              {order.profitLoss !== undefined &&
                              order.profitLoss !== null
                                ? fmt(order.profitLoss)
                                : "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-xs px-2 py-1 rounded bg-gray-50 text-gray-600">
                              {String(order.status).toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {String(order.status) === OrderStatus.open && (
                              <Button
                                data-ocid={`admin.cancel_trade.button.${i + 1}`}
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelTrade(order.orderId)}
                                className="border-red-500/40 text-red-400 hover:bg-red-500/20 text-xs"
                              >
                                Cancel
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── INSTRUMENTS TAB ── */}
          {activeSection === "instruments" && (
            <div>
              <div className="mb-6 bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold mb-4">Add New Instrument</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <Label className="text-gray-600 text-xs">Name</Label>
                    <Input
                      data-ocid="admin.instrument_name.input"
                      value={newInst.name}
                      onChange={(e) =>
                        setNewInst((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="EUR/USD"
                      className="bg-gray-50 border-gray-200 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-600 text-xs">Symbol</Label>
                    <Input
                      data-ocid="admin.instrument_symbol.input"
                      value={newInst.symbol}
                      onChange={(e) =>
                        setNewInst((f) => ({ ...f, symbol: e.target.value }))
                      }
                      placeholder="EURUSD"
                      className="bg-gray-50 border-gray-200 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-600 text-xs">Category</Label>
                    <Select
                      value={newInst.category}
                      onValueChange={(v) =>
                        setNewInst((f) => ({
                          ...f,
                          category: v as InstrumentCategory,
                        }))
                      }
                    >
                      <SelectTrigger
                        data-ocid="admin.instrument_category.select"
                        className="bg-gray-50 border-gray-200 text-white mt-1"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200 text-gray-900">
                        {Object.values(InstrumentCategory).map((c) => (
                          <SelectItem key={c} value={c}>
                            {c.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-600 text-xs">Bid</Label>
                    <Input
                      data-ocid="admin.instrument_bid.input"
                      type="number"
                      step="0.00001"
                      value={newInst.bid}
                      onChange={(e) =>
                        setNewInst((f) => ({ ...f, bid: e.target.value }))
                      }
                      className="bg-gray-50 border-gray-200 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-600 text-xs">Ask</Label>
                    <Input
                      data-ocid="admin.instrument_ask.input"
                      type="number"
                      step="0.00001"
                      value={newInst.ask}
                      onChange={(e) =>
                        setNewInst((f) => ({ ...f, ask: e.target.value }))
                      }
                      className="bg-gray-50 border-gray-200 text-white mt-1"
                    />
                  </div>
                </div>
                <Button
                  data-ocid="admin.create_instrument.submit_button"
                  onClick={handleCreateInstrument}
                  disabled={creating}
                  className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
                >
                  {creating ? "Creating..." : "Create Instrument"}
                </Button>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                <table
                  data-ocid="admin.instruments.table"
                  className="w-full min-w-[700px] text-sm"
                >
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500">
                      <th className="text-left px-4 py-3">Symbol</th>
                      <th className="text-left px-4 py-3">Name</th>
                      <th className="text-left px-4 py-3">Category</th>
                      <th className="text-right px-4 py-3">Bid</th>
                      <th className="text-right px-4 py-3">Ask</th>
                      <th className="text-center px-4 py-3">Enabled</th>
                      <th className="text-right px-4 py-3">Leverage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instruments.map((inst, i) => (
                      <tr
                        key={String(inst.instrumentId)}
                        data-ocid={`admin.instrument.item.${i + 1}`}
                        className="border-b border-white/5 hover:bg-white"
                      >
                        <td className="px-4 py-3 font-bold text-white">
                          {inst.symbol}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{inst.name}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 rounded bg-gray-50 text-gray-600">
                            {String(inst.category).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-red-400">
                          {inst.bidPrice.toFixed(5)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-400">
                          {inst.askPrice.toFixed(5)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Switch
                            data-ocid={`admin.instrument_enabled.toggle.${i + 1}`}
                            checked={inst.enabled}
                            disabled={togglingInstrument === inst.instrumentId}
                            onCheckedChange={() => handleToggleInstrument(inst)}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Input
                              data-ocid={`admin.instrument_leverage.input.${i + 1}`}
                              type="number"
                              className="bg-gray-50 border-gray-200 text-white w-20 h-7 text-xs"
                              value={
                                leverageEdits[String(inst.instrumentId)] ??
                                String(inst.leverage)
                              }
                              onChange={(e) =>
                                setLeverageEdits((prev) => ({
                                  ...prev,
                                  [String(inst.instrumentId)]: e.target.value,
                                }))
                              }
                            />
                            <Button
                              data-ocid={`admin.instrument_leverage.save_button.${i + 1}`}
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs border-gray-200 text-white hover:bg-gray-50"
                              disabled={updatingLeverage === inst.instrumentId}
                              onClick={() => handleUpdateLeverage(inst)}
                            >
                              {updatingLeverage === inst.instrumentId
                                ? "..."
                                : "Set"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── DEPOSITS TAB ── */}
          {activeSection === "deposits" && (
            <div className="space-y-4">
              {(() => {
                const deposits = transactions.filter(
                  (t) => String(t.transactionType) === TransactionType.deposit,
                );
                const totalAmount = deposits.reduce(
                  (sum, t) => sum + t.amount,
                  0,
                );
                return (
                  <>
                    <div className="flex gap-4 mb-4">
                      <div className="bg-white border border-gray-200 rounded-xl p-4 flex-1">
                        <p className="text-gray-500 text-sm">Total Deposits</p>
                        <p className="text-2xl font-bold text-emerald-400">
                          {deposits.length}
                        </p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl p-4 flex-1">
                        <p className="text-gray-500 text-sm">Total Amount</p>
                        <p className="text-2xl font-bold text-emerald-400">
                          $
                          {totalAmount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                      <table
                        data-ocid="admin.deposits.table"
                        className="w-full min-w-[700px] text-sm"
                      >
                        <thead>
                          <tr className="border-b border-gray-200 text-gray-500">
                            <th className="text-left px-4 py-3">
                              Transaction ID
                            </th>
                            <th className="text-left px-4 py-3">Account ID</th>
                            <th className="text-right px-4 py-3">Amount ($)</th>
                            <th className="text-left px-4 py-3">Status</th>
                            <th className="text-left px-4 py-3">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deposits.length === 0 ? (
                            <tr>
                              <td
                                data-ocid="admin.deposits.empty_state"
                                colSpan={5}
                                className="px-4 py-8 text-center text-gray-400"
                              >
                                No deposits found
                              </td>
                            </tr>
                          ) : (
                            deposits.map((t, i) => {
                              const statusClass =
                                String(t.status) === TransactionStatus.completed
                                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                  : String(t.status) ===
                                      TransactionStatus.pending
                                    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                    : "bg-red-500/20 text-red-400 border-red-500/30";
                              return (
                                <tr
                                  key={String(t.transactionId)}
                                  data-ocid={`admin.deposit.item.${i + 1}`}
                                  className="border-b border-white/5 hover:bg-white"
                                >
                                  <td className="px-4 py-3 font-mono text-gray-600">
                                    #{String(t.transactionId)}
                                  </td>
                                  <td className="px-4 py-3 text-gray-600">
                                    #{String(t.accountId)}
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono text-gray-900">
                                    $
                                    {t.amount.toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`text-xs px-2 py-1 rounded border ${statusClass}`}
                                    >
                                      {String(t.status)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-gray-500">
                                    {formatDate(t.timestamp)}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* ── WITHDRAWALS TAB ── */}
          {activeSection === "withdrawals" && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                <table
                  data-ocid="admin.withdrawals.table"
                  className="w-full min-w-[700px] text-sm"
                >
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500">
                      <th className="text-left px-4 py-3">Request ID</th>
                      <th className="text-left px-4 py-3">User</th>
                      <th className="text-left px-4 py-3">Account ID</th>
                      <th className="text-right px-4 py-3">Amount ($)</th>
                      <th className="text-left px-4 py-3">
                        Wallet / Bank Details
                      </th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Date</th>
                      <th className="text-left px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawalRequests.length === 0 ? (
                      <tr>
                        <td
                          data-ocid="admin.withdrawals.empty_state"
                          colSpan={8}
                          className="px-4 py-8 text-center text-gray-400"
                        >
                          No withdrawal requests
                        </td>
                      </tr>
                    ) : (
                      withdrawalRequests.map((w, i) => {
                        const isPending = String(w.status) === "pending";
                        const statusClass = isPending
                          ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          : String(w.status) === "approved"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : "bg-red-500/20 text-red-400 border-red-500/30";
                        const matchedUser = users.find(
                          ([p]) => String(p) === String(w.owner),
                        );
                        const displayName = matchedUser?.[1]?.name || null;
                        const displayEmail = matchedUser?.[1]?.email || null;
                        const owner = String(w.owner);
                        const shortOwner = `${owner.slice(0, 8)}...${owner.slice(-4)}`;
                        return (
                          <tr
                            key={String(w.requestId)}
                            data-ocid={`admin.withdrawal.item.${i + 1}`}
                            className="border-b border-white/5 hover:bg-white"
                          >
                            <td className="px-4 py-3 font-mono text-gray-600">
                              #{String(w.requestId)}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              {displayName ? (
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {displayName}
                                  </p>
                                  <p className="text-gray-400">
                                    {displayEmail}
                                  </p>
                                </div>
                              ) : (
                                <span className="font-mono text-gray-500">
                                  {shortOwner}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              #{String(w.accountId)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-gray-900">
                              $
                              {w.amount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-4 py-3 text-gray-500 max-w-[150px]">
                              {(() => {
                                const bd = w.bankDetails || "";
                                const cryptoMatch = bd.match(
                                  /^\[CRYPTO:([^\]]+)\]\s*(.*)/,
                                );
                                if (cryptoMatch) {
                                  return (
                                    <div>
                                      <span className="text-xs font-bold text-blue-600">
                                        {cryptoMatch[1]}
                                      </span>
                                      <p className="text-xs text-gray-500 truncate max-w-[120px]">
                                        {cryptoMatch[2]}
                                        <button
                                          type="button"
                                          className="text-xs text-blue-600 hover:underline ml-1"
                                          onClick={() =>
                                            navigator.clipboard.writeText(
                                              cryptoMatch[2],
                                            )
                                          }
                                        >
                                          Copy
                                        </button>
                                      </p>
                                    </div>
                                  );
                                }
                                return (
                                  <span className="text-gray-500 truncate block max-w-[120px]">
                                    {bd || "-"}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs px-2 py-1 rounded border ${statusClass}`}
                              >
                                {String(w.status)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              {formatDate(w.timestamp)}
                            </td>
                            <td className="px-4 py-3">
                              {isPending && actor && (
                                <div className="flex gap-2">
                                  <Button
                                    data-ocid={`admin.withdrawal.approve_button.${i + 1}`}
                                    size="sm"
                                    disabled={
                                      approvingId === w.requestId ||
                                      rejectingId === w.requestId
                                    }
                                    className="bg-emerald-500 hover:bg-emerald-600 text-black text-xs h-7 px-2"
                                    onClick={async () => {
                                      const notes =
                                        window.prompt(
                                          "Approval notes (optional):",
                                          "",
                                        ) ?? "";
                                      setApprovingId(w.requestId);
                                      try {
                                        await (
                                          actor as any
                                        ).approveWithdrawalRequest(
                                          w.requestId,
                                          notes,
                                        );
                                        logAdminAction(
                                          "Approved withdrawal",
                                          `Approved withdrawal #${String(w.requestId)}`,
                                        );
                                        toast.success("Withdrawal approved");
                                        await loadPart2Data();
                                      } catch {
                                        toast.error("Failed to approve");
                                      } finally {
                                        setApprovingId(null);
                                      }
                                    }}
                                  >
                                    {approvingId === w.requestId
                                      ? "..."
                                      : "Payment Verified"}
                                  </Button>
                                  <Button
                                    data-ocid={`admin.withdrawal.reject_button.${i + 1}`}
                                    size="sm"
                                    variant="destructive"
                                    disabled={
                                      approvingId === w.requestId ||
                                      rejectingId === w.requestId
                                    }
                                    className="text-xs h-7 px-2"
                                    onClick={async () => {
                                      const notes =
                                        window.prompt(
                                          "Rejection reason:",
                                          "",
                                        ) ?? "";
                                      setRejectingId(w.requestId);
                                      try {
                                        await (
                                          actor as any
                                        ).rejectWithdrawalRequest(
                                          w.requestId,
                                          notes,
                                        );
                                        logAdminAction(
                                          "Rejected withdrawal",
                                          `Rejected withdrawal #${String(w.requestId)}`,
                                        );
                                        toast.success("Withdrawal rejected");
                                        await loadPart2Data();
                                      } catch {
                                        toast.error("Failed to reject");
                                      } finally {
                                        setRejectingId(null);
                                      }
                                    }}
                                  >
                                    {rejectingId === w.requestId
                                      ? "..."
                                      : "Reject"}
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── FINANCIALS TAB ── */}
          {activeSection === "financials" && (
            <div className="space-y-6">
              {financialSummary ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    data-ocid="admin.financials.deposits.card"
                    className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6"
                  >
                    <p className="text-emerald-400 text-sm font-medium mb-1">
                      Total Deposits
                    </p>
                    <p className="text-3xl font-bold text-white">
                      $
                      {financialSummary.totalDeposits.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div
                    data-ocid="admin.financials.withdrawals.card"
                    className="bg-red-500/10 border border-red-500/30 rounded-xl p-6"
                  >
                    <p className="text-red-400 text-sm font-medium mb-1">
                      Total Withdrawals
                    </p>
                    <p className="text-3xl font-bold text-white">
                      $
                      {financialSummary.totalWithdrawals.toLocaleString(
                        "en-US",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      )}
                    </p>
                  </div>
                  <div
                    data-ocid="admin.financials.balance.card"
                    className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6"
                  >
                    <p className="text-blue-400 text-sm font-medium mb-1">
                      Platform Balance
                    </p>
                    <p className="text-3xl font-bold text-white">
                      $
                      {financialSummary.platformBalance.toLocaleString(
                        "en-US",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      )}
                    </p>
                  </div>
                  <div
                    data-ocid="admin.financials.revenue.card"
                    className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6"
                  >
                    <p className="text-purple-400 text-sm font-medium mb-1">
                      Revenue
                    </p>
                    <p className="text-3xl font-bold text-white">
                      $
                      {financialSummary.revenue.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  data-ocid="admin.financials.loading_state"
                  className="flex items-center justify-center h-32"
                >
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
                </div>
              )}
              {/* Trade P&L Breakdown */}
              {orders.length > 0 &&
                (() => {
                  const closedOrders = orders.filter(
                    (o) => String(o.status).toLowerCase() === "closed",
                  );
                  const totalPnl = closedOrders.reduce(
                    (sum, o) => sum + (o.profitLoss || 0),
                    0,
                  );
                  // Breakdown by instrument
                  const instMap: Record<
                    string,
                    { pnl: number; wins: number; total: number }
                  > = {};
                  for (const o of closedOrders) {
                    const key = String(o.instrumentId);
                    if (!instMap[key])
                      instMap[key] = { pnl: 0, wins: 0, total: 0 };
                    instMap[key].pnl += o.profitLoss || 0;
                    instMap[key].total += 1;
                    if ((o.profitLoss || 0) > 0) instMap[key].wins += 1;
                  }
                  const top10 = Object.entries(instMap)
                    .sort((a, b) => Math.abs(b[1].pnl) - Math.abs(a[1].pnl))
                    .slice(0, 10);
                  return (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Trade P&amp;L Breakdown
                      </h3>
                      <p className="text-xs text-gray-400 mb-4">
                        Based on {closedOrders.length} closed orders
                      </p>
                      <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="text-xs text-purple-600 font-medium">
                          Platform Revenue from Spreads
                        </p>
                        <p className="text-2xl font-bold text-purple-700">
                          $
                          {financialSummary?.revenue?.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          }) || "0.00"}
                        </p>
                      </div>
                      <div className="mb-3 flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          Total Closed P&amp;L (all users)
                        </span>
                        <span
                          className={`font-bold ${totalPnl >= 0 ? "text-emerald-600" : "text-red-600"}`}
                        >
                          {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
                        </span>
                      </div>
                      {top10.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[400px] text-xs">
                            <thead>
                              <tr className="border-b border-gray-100 text-gray-400">
                                <th className="text-left py-2">
                                  Instrument ID
                                </th>
                                <th className="text-right py-2">
                                  Total P&amp;L
                                </th>
                                <th className="text-right py-2">Win Rate</th>
                                <th className="text-right py-2"># Trades</th>
                              </tr>
                            </thead>
                            <tbody>
                              {top10.map(([id, stats]) => (
                                <tr
                                  key={id}
                                  className="border-b border-gray-50"
                                >
                                  <td className="py-2 text-gray-700">#{id}</td>
                                  <td
                                    className={`py-2 text-right font-semibold ${stats.pnl >= 0 ? "text-emerald-600" : "text-red-500"}`}
                                  >
                                    {stats.pnl >= 0 ? "+" : ""}$
                                    {stats.pnl.toFixed(2)}
                                  </td>
                                  <td className="py-2 text-right text-gray-600">
                                    {stats.total > 0
                                      ? Math.round(
                                          (stats.wins / stats.total) * 100,
                                        )
                                      : 0}
                                    %
                                  </td>
                                  <td className="py-2 text-right text-gray-500">
                                    {stats.total}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })()}
            </div>
          )}

          {/* ── STRIPE TAB ── */}
          {/* ── ANNOUNCEMENTS TAB ── */}
          {activeSection === "announcements" && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <h3 className="font-semibold text-lg">
                  Broadcast to All Users
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-gray-600 text-xs">Subject</Label>
                    <Input
                      data-ocid="admin.announcement_all_subject.input"
                      value={announcementToAll.subject}
                      onChange={(e) =>
                        setAnnouncementToAll((p) => ({
                          ...p,
                          subject: e.target.value,
                        }))
                      }
                      placeholder="Important platform update"
                      className="bg-gray-50 border-gray-200 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-600 text-xs">Message</Label>
                    <Textarea
                      data-ocid="admin.announcement_all_body.textarea"
                      value={announcementToAll.body}
                      onChange={(e) =>
                        setAnnouncementToAll((p) => ({
                          ...p,
                          body: e.target.value,
                        }))
                      }
                      placeholder="Write your announcement here..."
                      rows={5}
                      className="bg-gray-50 border-gray-200 text-white mt-1 resize-none"
                    />
                  </div>
                  <Button
                    data-ocid="admin.send_to_all.submit_button"
                    onClick={handleSendToAll}
                    disabled={
                      sendingAll ||
                      !announcementToAll.subject ||
                      !announcementToAll.body
                    }
                    className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
                  >
                    {sendingAll ? "Sending..." : "Send to All Users"}
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <h3 className="font-semibold text-lg">Send to Specific User</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-gray-600 text-xs">User Email</Label>
                    <Input
                      data-ocid="admin.announcement_user_email.input"
                      value={announcementToUser.email}
                      onChange={(e) =>
                        setAnnouncementToUser((p) => ({
                          ...p,
                          email: e.target.value,
                        }))
                      }
                      placeholder="user@example.com"
                      className="bg-gray-50 border-gray-200 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-600 text-xs">Subject</Label>
                    <Input
                      data-ocid="admin.announcement_user_subject.input"
                      value={announcementToUser.subject}
                      onChange={(e) =>
                        setAnnouncementToUser((p) => ({
                          ...p,
                          subject: e.target.value,
                        }))
                      }
                      placeholder="Message subject"
                      className="bg-gray-50 border-gray-200 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-600 text-xs">Message</Label>
                    <Textarea
                      data-ocid="admin.announcement_user_body.textarea"
                      value={announcementToUser.body}
                      onChange={(e) =>
                        setAnnouncementToUser((p) => ({
                          ...p,
                          body: e.target.value,
                        }))
                      }
                      placeholder="Write your message here..."
                      rows={5}
                      className="bg-gray-50 border-gray-200 text-white mt-1 resize-none"
                    />
                  </div>
                  <Button
                    data-ocid="admin.send_to_user.submit_button"
                    onClick={handleSendToUser}
                    disabled={
                      sendingUser ||
                      !announcementToUser.email ||
                      !announcementToUser.subject ||
                      !announcementToUser.body
                    }
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                  >
                    {sendingUser ? "Sending..." : "Send Message"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── DEMO CONTROLS TAB ── */}
          {activeSection === "demo-controls" && (
            <div className="space-y-6">
              {platformSettings && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 max-w-sm">
                  <h3 className="font-semibold text-lg">
                    Default Demo Balance
                  </h3>
                  <div className="flex items-center gap-3">
                    <Input
                      data-ocid="admin.default_demo_balance.input"
                      type="number"
                      value={settingsForm.defaultDemoBalance}
                      onChange={(e) =>
                        setSettingsForm((p) => ({
                          ...p,
                          defaultDemoBalance: e.target.value,
                        }))
                      }
                      className="bg-gray-50 border-gray-200 text-white"
                    />
                    <Button
                      data-ocid="admin.default_demo_balance.save_button"
                      onClick={handleSaveSettings}
                      disabled={savingSettings}
                      className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold whitespace-nowrap"
                    >
                      {savingSettings ? "Saving..." : "Save"}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Current: {fmt(platformSettings.defaultDemoBalance)}
                  </p>
                </div>
              )}

              <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                <table
                  data-ocid="admin.demo_accounts.table"
                  className="w-full min-w-[700px] text-sm"
                >
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500">
                      <th className="text-left px-4 py-3">User</th>
                      <th className="text-left px-4 py-3">Account ID</th>
                      <th className="text-right px-4 py-3">Balance</th>
                      <th className="text-right px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts
                      .filter((a) => String(a.accountType) === AccountType.demo)
                      .map((acc, i) => {
                        const userEntry = users.find(
                          ([p]) => String(p) === String(acc.owner),
                        );
                        const userInfo = userEntry?.[1];
                        return (
                          <tr
                            key={String(acc.accountId)}
                            data-ocid={`admin.demo_account.item.${i + 1}`}
                            className="border-b border-white/5 hover:bg-white"
                          >
                            <td className="px-4 py-3 text-gray-600">
                              <div className="font-medium text-white">
                                {userInfo?.name || "Unknown"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {userInfo?.email || ""}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                              {String(acc.accountId)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-emerald-400">
                              {fmt(acc.balance)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                data-ocid={`admin.reset_demo.button.${i + 1}`}
                                size="sm"
                                variant="outline"
                                disabled={resettingDemo === acc.accountId}
                                onClick={() =>
                                  handleResetDemoBalance(
                                    acc.owner,
                                    acc.accountId,
                                  )
                                }
                                className="border-gray-200 text-white hover:bg-gray-50 text-xs"
                              >
                                {resettingDemo === acc.accountId
                                  ? "Resetting..."
                                  : "Reset Balance"}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    {accounts.filter(
                      (a) => String(a.accountType) === AccountType.demo,
                    ).length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          data-ocid="admin.demo_accounts.empty_state"
                          className="text-center py-10 text-gray-400"
                        >
                          No demo accounts found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PLATFORM SETTINGS TAB ── */}
          {activeSection === "settings" && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                <h3 className="font-semibold text-lg">Platform Settings</h3>

                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <div>
                    <Label className="text-white font-medium">
                      Maintenance Mode
                    </Label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Takes the platform offline for all users
                    </p>
                  </div>
                  <Switch
                    data-ocid="admin.maintenance_mode.switch"
                    checked={settingsForm.maintenanceMode}
                    onCheckedChange={(val) =>
                      setSettingsForm((p) => ({ ...p, maintenanceMode: val }))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600 text-xs">
                      Min Deposit (USD)
                    </Label>
                    <Input
                      data-ocid="admin.min_deposit.input"
                      type="number"
                      value={settingsForm.minDeposit}
                      onChange={(e) =>
                        setSettingsForm((p) => ({
                          ...p,
                          minDeposit: e.target.value,
                        }))
                      }
                      className="bg-gray-50 border-gray-200 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-600 text-xs">
                      Max Deposit (USD)
                    </Label>
                    <Input
                      data-ocid="admin.max_deposit.input"
                      type="number"
                      value={settingsForm.maxDeposit}
                      onChange={(e) =>
                        setSettingsForm((p) => ({
                          ...p,
                          maxDeposit: e.target.value,
                        }))
                      }
                      className="bg-gray-50 border-gray-200 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-600 text-xs">
                      Min Withdrawal (USD)
                    </Label>
                    <Input
                      data-ocid="admin.min_withdrawal.input"
                      type="number"
                      value={settingsForm.minWithdrawal}
                      onChange={(e) =>
                        setSettingsForm((p) => ({
                          ...p,
                          minWithdrawal: e.target.value,
                        }))
                      }
                      className="bg-gray-50 border-gray-200 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-600 text-xs">
                      Max Withdrawal (USD)
                    </Label>
                    <Input
                      data-ocid="admin.max_withdrawal.input"
                      type="number"
                      value={settingsForm.maxWithdrawal}
                      onChange={(e) =>
                        setSettingsForm((p) => ({
                          ...p,
                          maxWithdrawal: e.target.value,
                        }))
                      }
                      className="bg-gray-50 border-gray-200 text-white mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-600 text-xs">
                      Forex Trading Hours
                    </Label>
                    <Input
                      data-ocid="admin.forex_hours.input"
                      value={settingsForm.forexHours}
                      onChange={(e) =>
                        setSettingsForm((p) => ({
                          ...p,
                          forexHours: e.target.value,
                        }))
                      }
                      placeholder="24/5"
                      className="bg-gray-50 border-gray-200 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-600 text-xs">
                      Stocks Trading Hours
                    </Label>
                    <Input
                      data-ocid="admin.stocks_hours.input"
                      value={settingsForm.stocksHours}
                      onChange={(e) =>
                        setSettingsForm((p) => ({
                          ...p,
                          stocksHours: e.target.value,
                        }))
                      }
                      placeholder="8/5"
                      className="bg-gray-50 border-gray-200 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-600 text-xs">
                      Crypto Trading Hours
                    </Label>
                    <Input
                      data-ocid="admin.crypto_hours.input"
                      value={settingsForm.cryptoHours}
                      onChange={(e) =>
                        setSettingsForm((p) => ({
                          ...p,
                          cryptoHours: e.target.value,
                        }))
                      }
                      placeholder="24/7"
                      className="bg-gray-50 border-gray-200 text-white mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-gray-600 text-xs">
                    Default Demo Balance (USD)
                  </Label>
                  <Input
                    data-ocid="admin.settings_demo_balance.input"
                    type="number"
                    value={settingsForm.defaultDemoBalance}
                    onChange={(e) =>
                      setSettingsForm((p) => ({
                        ...p,
                        defaultDemoBalance: e.target.value,
                      }))
                    }
                    className="bg-gray-50 border-gray-200 text-white mt-1 max-w-xs"
                  />
                </div>

                <Button
                  data-ocid="admin.save_settings.submit_button"
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
                >
                  {savingSettings ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </div>
          )}

          {/* ── CRYPTO DEPOSITS TAB ── */}
          {activeSection === "crypto-deposits" && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                {cryptoDeposits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                    <p className="text-sm">No crypto deposit requests yet.</p>
                  </div>
                ) : (
                  <table className="w-full min-w-[700px] text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase">
                        <th className="px-4 py-3 text-left">ID</th>
                        <th className="px-4 py-3 text-left">User</th>
                        <th className="px-4 py-3 text-left">Coin</th>
                        <th className="px-4 py-3 text-left">Network</th>
                        <th className="px-4 py-3 text-left">Amount</th>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cryptoDeposits.map((dep: any, idx: number) => {
                        const rawStatus = dep.status;
                        const statusStr =
                          rawStatus?.pending != null
                            ? "pending"
                            : rawStatus?.approved != null
                              ? "approved"
                              : rawStatus?.rejected != null
                                ? "rejected"
                                : String(rawStatus) === "pending"
                                  ? "pending"
                                  : String(rawStatus) === "approved"
                                    ? "approved"
                                    : "rejected";
                        const depUser = users.find(
                          ([p]) => String(p) === String(dep.owner),
                        );
                        const depUserName = depUser?.[1]?.name || null;
                        const depUserEmail = depUser?.[1]?.email || null;
                        return (
                          <tr
                            key={String(dep.depositId)}
                            className="border-b border-gray-100 hover:bg-gray-50"
                            data-ocid={`admin.crypto_deposits.row.item.${idx + 1}`}
                          >
                            <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                              #{String(dep.depositId)}
                            </td>
                            <td className="px-4 py-3 text-gray-700 text-xs">
                              {depUserName ? (
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {depUserName}
                                  </p>
                                  <p className="text-gray-400 text-[10px]">
                                    {depUserEmail}
                                  </p>
                                </div>
                              ) : (
                                <span className="font-mono">
                                  {String(dep.owner).slice(0, 10)}...
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-900">
                              {dep.coin}
                            </td>
                            <td className="px-4 py-3 text-gray-600 text-xs">
                              {dep.network}
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-900">
                              {fmt(dep.amount)}
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">
                              {formatDate(dep.timestamp)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs px-2 py-0.5 rounded border font-medium ${statusStr === "pending" ? "bg-yellow-50 text-yellow-700 border-yellow-200" : statusStr === "approved" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}
                              >
                                {statusStr}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {statusStr === "pending" && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    data-ocid={`admin.crypto_deposits.approve.button.${idx + 1}`}
                                    className="bg-green-600 hover:bg-green-700 text-white text-xs h-7 px-2"
                                    onClick={async () => {
                                      if (!actor) return;
                                      try {
                                        await (
                                          actor as any
                                        ).approveCryptoDeposit(dep.depositId);
                                        logAdminAction(
                                          "Approved deposit",
                                          `Approved deposit #${String(dep.depositId)} for ${dep.owner ? String(dep.owner) : "user"}`,
                                        );
                                        toast.success("Deposit approved");
                                        await loadPart2Data();
                                      } catch {
                                        toast.error("Failed to approve");
                                      }
                                    }}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    data-ocid={`admin.crypto_deposits.reject.button.${idx + 1}`}
                                    className="bg-red-600 hover:bg-red-700 text-white text-xs h-7 px-2"
                                    onClick={() =>
                                      setRejectingDepositId(dep.depositId)
                                    }
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
              {rejectingDepositId !== null && (
                <Dialog open onOpenChange={() => setRejectingDepositId(null)}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reject Deposit</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Label>Reason (optional)</Label>
                      <Input
                        value={rejectDepositNotes}
                        onChange={(e) => setRejectDepositNotes(e.target.value)}
                        placeholder="Reason for rejection..."
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setRejectingDepositId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={async () => {
                          if (!actor || rejectingDepositId === null) return;
                          try {
                            await (actor as any).rejectCryptoDeposit(
                              rejectingDepositId,
                              rejectDepositNotes,
                            );
                            logAdminAction(
                              "Rejected deposit",
                              `Rejected deposit #${String(rejectingDepositId)}: ${rejectDepositNotes || "No reason"}`,
                            );
                            toast.success("Deposit rejected");
                            setRejectingDepositId(null);
                            setRejectDepositNotes("");
                            await loadPart2Data();
                          } catch {
                            toast.error("Failed to reject");
                          }
                        }}
                      >
                        Confirm Reject
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}

          {/* ── WALLETS TAB ── */}
          {activeSection === "wallets" && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">
                  Crypto Wallet Addresses
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Set the wallet addresses that users will send deposits to.
                </p>
                <div className="space-y-3">
                  {COINS.map((c) => {
                    const key = `${c.coin}_${c.network}`;
                    const existing = walletAddresses.find(
                      (w) => w.coin === c.coin && w.network === c.network,
                    );
                    const isEditing = walletEditMode === key;
                    return (
                      <div
                        key={key}
                        data-ocid={`admin.wallets.${c.coin.toLowerCase()}.row`}
                        className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-blue-700">
                            {c.coin}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {c.label}
                          </p>
                          {isEditing ? (
                            <div className="flex gap-2 mt-1">
                              <Input
                                data-ocid={`admin.wallets.${c.coin.toLowerCase()}.input`}
                                value={walletEditValue}
                                onChange={(e) =>
                                  setWalletEditValue(e.target.value)
                                }
                                placeholder={`Enter ${c.coin} wallet address`}
                                className="text-xs h-8"
                              />
                              <Button
                                size="sm"
                                data-ocid={`admin.wallets.${c.coin.toLowerCase()}.save_button`}
                                disabled={
                                  savingWallet || !walletEditValue.trim()
                                }
                                className="bg-[#1a2744] hover:bg-[#243359] text-white text-xs h-8 shrink-0"
                                onClick={async () => {
                                  if (!actor) return;
                                  setSavingWallet(true);
                                  try {
                                    await (actor as any).setCryptoWalletAddress(
                                      c.coin,
                                      c.network,
                                      walletEditValue.trim(),
                                    );
                                    toast.success(`${c.label} address saved`);
                                    setWalletEditMode(null);
                                    const wallets = await (
                                      actor as any
                                    ).getCryptoWalletAddresses();
                                    setWalletAddresses(
                                      Array.isArray(wallets) ? wallets : [],
                                    );
                                  } catch {
                                    toast.error("Failed to save");
                                  } finally {
                                    setSavingWallet(false);
                                  }
                                }}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-8 shrink-0"
                                onClick={() => setWalletEditMode(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {existing?.address ?? (
                                  <span className="italic text-gray-400">
                                    Not set
                                  </span>
                                )}
                              </p>
                              {existing?.address && (
                                <div className="mt-1">
                                  <button
                                    type="button"
                                    className="text-xs text-blue-600 hover:underline"
                                    onClick={() =>
                                      setShowQrFor(
                                        showQrFor === key ? null : key,
                                      )
                                    }
                                  >
                                    {showQrFor === key ? "Hide QR" : "Show QR"}
                                  </button>
                                  {showQrFor === key && (
                                    <div className="mt-2 p-3 bg-white border border-gray-200 rounded-xl inline-block">
                                      <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(existing.address)}`}
                                        alt="QR Code"
                                        width={150}
                                        height={150}
                                        className="rounded"
                                      />
                                      <p className="text-[10px] text-gray-400 mt-1 text-center break-all max-w-[150px]">
                                        {existing.address}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {!isEditing && (
                          <Button
                            size="sm"
                            variant="outline"
                            data-ocid={`admin.wallets.${c.coin.toLowerCase()}.edit_button`}
                            className="text-xs h-8 shrink-0"
                            onClick={() => {
                              setWalletEditMode(key);
                              setWalletEditValue(existing?.address ?? "");
                            }}
                          >
                            {existing ? "Edit" : "Set"}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── SUPPORT CHAT TAB ── */}
          {activeSection === "support-chat" && (
            <div className="space-y-4">
              <AdminChatPanel actor={actor as any} />
            </div>
          )}
          {/* ── PROMOTIONS TAB ── */}
          {activeSection === "promotions" && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
                <h2 className="text-base font-bold text-gray-900 mb-1">
                  Deposit Bonus Promotions
                </h2>
                <p className="text-sm text-gray-500 mb-5">
                  Create bonus promotions that apply automatically when users
                  make deposits. Bonuses are credited to the user&apos;s bonus
                  balance.
                </p>

                {/* New Promotion Form */}
                <div className="border border-gray-200 rounded-xl p-4 mb-6 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">
                    Create New Promotion
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="promo-name"
                        className="block text-xs font-medium text-gray-600 mb-1"
                      >
                        Promotion Name
                      </label>
                      <Input
                        id="promo-name"
                        value={newPromo.name}
                        onChange={(e) =>
                          setNewPromo((p) => ({ ...p, name: e.target.value }))
                        }
                        placeholder="e.g. Welcome Bonus 50%"
                        className="bg-white"
                        data-ocid="admin.promo.name.input"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="promo-pct"
                          className="block text-xs font-medium text-gray-600 mb-1"
                        >
                          Bonus Percentage (%)
                        </label>
                        <Input
                          id="promo-pct"
                          type="number"
                          min="1"
                          max="500"
                          value={newPromo.bonusPct}
                          onChange={(e) =>
                            setNewPromo((p) => ({
                              ...p,
                              bonusPct: e.target.value,
                            }))
                          }
                          placeholder="e.g. 50"
                          className="bg-white"
                          data-ocid="admin.promo.bonus_pct.input"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="promo-applicable"
                          className="block text-xs font-medium text-gray-600 mb-1"
                        >
                          Applicable To
                        </label>
                        <select
                          id="promo-applicable"
                          data-ocid="admin.promo.applicable_to.select"
                          value={newPromo.applicableTo}
                          onChange={(e) =>
                            setNewPromo((p) => ({
                              ...p,
                              applicableTo: e.target.value as "first" | "all",
                            }))
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                        >
                          <option value="first">First Deposit Only</option>
                          <option value="all">All Deposits</option>
                        </select>
                      </div>
                    </div>
                    <Button
                      data-ocid="admin.promo.create.primary_button"
                      disabled={
                        savingPromo ||
                        !newPromo.name.trim() ||
                        !newPromo.bonusPct
                      }
                      onClick={() => {
                        setSavingPromo(true);
                        const promo: Promotion = {
                          id: Date.now().toString(),
                          name: newPromo.name.trim(),
                          bonusPct: Number(newPromo.bonusPct),
                          applicableTo: newPromo.applicableTo,
                          active: true,
                        };
                        const updated = [...promotions, promo];
                        setPromotions(updated);
                        localStorage.setItem(
                          "mtex_bonus_promotions",
                          JSON.stringify(updated),
                        );
                        setNewPromo({
                          name: "",
                          bonusPct: "",
                          code: "",
                          applicableTo: "first",
                        });
                        setSavingPromo(false);
                        toast.success("Promotion created successfully");
                      }}
                      className="w-full"
                    >
                      {savingPromo ? "Creating..." : "Create Promotion"}
                    </Button>
                  </div>
                </div>

                {/* Active Promotions List */}
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Active Promotions ({promotions.filter((p) => p.active).length}
                  )
                </h3>
                {promotions.length === 0 ? (
                  <div
                    data-ocid="admin.promotions.empty_state"
                    className="text-center py-8 text-gray-400 text-sm"
                  >
                    No promotions yet. Create one above.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {promotions.map((promo, i) => (
                      <div
                        key={promo.id}
                        data-ocid={`admin.promo.item.${i + 1}`}
                        className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 bg-white"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">
                              {promo.name}
                            </span>
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${promo.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                            >
                              {promo.active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {promo.bonusPct}% bonus ·{" "}
                            {promo.applicableTo === "first"
                              ? "First deposit only"
                              : "All deposits"}
                          </p>
                          {promo.code && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                                {promo.code}
                              </span>
                              <button
                                type="button"
                                data-ocid={`admin.promo.copy_code.button.${i + 1}`}
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    promo.code || "",
                                  );
                                  toast.success("Code copied to clipboard");
                                }}
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="Copy promo code"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                  role="presentation"
                                >
                                  <title>Copy</title>
                                  <rect
                                    x="9"
                                    y="9"
                                    width="13"
                                    height="13"
                                    rx="2"
                                    ry="2"
                                  />
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            data-ocid={`admin.promo.toggle.button.${i + 1}`}
                            onClick={() => {
                              const updated = promotions.map((p) =>
                                p.id === promo.id
                                  ? { ...p, active: !p.active }
                                  : p,
                              );
                              setPromotions(updated);
                              localStorage.setItem(
                                "mtex_bonus_promotions",
                                JSON.stringify(updated),
                              );
                            }}
                          >
                            {promo.active ? "Disable" : "Enable"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            data-ocid={`admin.promo.delete.delete_button.${i + 1}`}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => {
                              const updated = promotions.filter(
                                (p) => p.id !== promo.id,
                              );
                              setPromotions(updated);
                              localStorage.setItem(
                                "mtex_bonus_promotions",
                                JSON.stringify(updated),
                              );
                              toast.success("Promotion deleted");
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PER-USER LIMITS DIALOG ── */}
          {limitsUser && (
            <div
              className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
              data-ocid="admin.user_limits.modal"
            >
              <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-sm shadow-xl">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Set Limits — {limitsUser[1].name || limitsUser[1].email}
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  Override global platform limits for this user. Leave blank to
                  use global defaults.
                </p>
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="admin-limits-deposit"
                      className="block text-xs font-medium text-gray-600 mb-1"
                    >
                      Custom Deposit Limit ($)
                    </label>
                    <input
                      id="admin-limits-deposit"
                      data-ocid="admin.user_limits.deposit.input"
                      type="number"
                      value={limitsDepositInput}
                      onChange={(e) => setLimitsDepositInput(e.target.value)}
                      placeholder="e.g. 50000 (blank = global default)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="admin-limits-withdraw"
                      className="block text-xs font-medium text-gray-600 mb-1"
                    >
                      Custom Withdrawal Limit ($)
                    </label>
                    <input
                      id="admin-limits-withdraw"
                      data-ocid="admin.user_limits.withdrawal.input"
                      type="number"
                      value={limitsWithdrawInput}
                      onChange={(e) => setLimitsWithdrawInput(e.target.value)}
                      placeholder="e.g. 10000 (blank = global default)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-5">
                  <button
                    type="button"
                    data-ocid="admin.user_limits.cancel_button"
                    onClick={() => setLimitsUser(null)}
                    className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    data-ocid="admin.user_limits.save_button"
                    disabled={savingLimits}
                    onClick={() => {
                      setSavingLimits(true);
                      setUserLimits(
                        String(limitsUser[0]),
                        limitsDepositInput.trim()
                          ? Number(limitsDepositInput)
                          : null,
                        limitsWithdrawInput.trim()
                          ? Number(limitsWithdrawInput)
                          : null,
                      );
                      logAdminAction(
                        "Set user limits",
                        `Set limits for ${limitsUser[1].email}: Dep=$${limitsDepositInput || "default"}, With=$${limitsWithdrawInput || "default"}`,
                      );
                      setSavingLimits(false);
                      setLimitsUser(null);
                      toast.success("Limits saved");
                    }}
                    className="flex-1 py-2 bg-[#1a2744] text-white rounded-lg text-sm font-medium"
                  >
                    {savingLimits ? "Saving..." : "Save Limits"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── AUDIT LOG TAB ── */}
          {activeSection === "audit-log" &&
            (() => {
              let auditLog: Array<{
                action: string;
                details: string;
                timestamp: string;
                admin: string;
              }> = [];
              try {
                auditLog = JSON.parse(
                  localStorage.getItem("mtex_audit_log") || "[]",
                );
              } catch {}
              return (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-gray-900">
                          Admin Audit Log
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Last 100 admin actions — most recent first
                        </p>
                      </div>
                      {isSuperAdmin && (
                        <button
                          type="button"
                          data-ocid="admin.audit_log.clear_button"
                          onClick={() => {
                            if (
                              window.confirm(
                                "Clear all audit log entries? This cannot be undone.",
                              )
                            ) {
                              localStorage.removeItem("mtex_audit_log");
                              toast.success("Audit log cleared");
                            }
                          }}
                          className="text-xs text-red-500 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50"
                        >
                          Clear Log
                        </button>
                      )}
                    </div>
                    {auditLog.length === 0 ? (
                      <div
                        data-ocid="admin.audit_log.empty_state"
                        className="text-center py-12 text-gray-400 text-sm"
                      >
                        No audit log entries yet. Actions will appear here after
                        admin operations.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table
                          data-ocid="admin.audit_log.table"
                          className="w-full min-w-[600px] text-sm"
                        >
                          <thead>
                            <tr className="border-b border-gray-100 text-gray-500">
                              <th className="text-left px-4 py-3">Timestamp</th>
                              <th className="text-left px-4 py-3">Action</th>
                              <th className="text-left px-4 py-3">Details</th>
                              <th className="text-left px-4 py-3">By</th>
                            </tr>
                          </thead>
                          <tbody>
                            {auditLog.slice(0, 100).map((entry, i) => (
                              <tr
                                key={`${entry.timestamp}-${String(i)}`}
                                data-ocid={`admin.audit_log.item.${i + 1}`}
                                className="border-b border-gray-50 hover:bg-gray-50"
                              >
                                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                                  {new Date(entry.timestamp).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                                  {entry.action}
                                </td>
                                <td className="px-4 py-3 text-gray-600 text-xs">
                                  {entry.details}
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-400">
                                  {entry.admin}
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
            })()}

          {/* ── STAFF TAB (super admin only) ── */}
          {isSuperAdmin && activeSection === "staff" && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-xl">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">
                  Staff Admin Accounts
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Manage which email addresses can log in to the staff admin
                  dashboard.
                </p>
                <div className="flex gap-2 mb-6">
                  <Input
                    data-ocid="admin.staff.email.input"
                    type="email"
                    placeholder="staff@email.com"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      !addingStaff &&
                      newStaffEmail.trim() &&
                      (async () => {
                        if (!actor) return;
                        setAddingStaff(true);
                        try {
                          await (actor as any).addStaffAdmin(
                            newStaffEmail.trim(),
                          );
                          toast.success("Staff admin added");
                          setNewStaffEmail("");
                          await loadStaffAdmins();
                        } catch {
                          toast.error("Failed to add");
                        } finally {
                          setAddingStaff(false);
                        }
                      })()
                    }
                  />
                  <Button
                    data-ocid="admin.staff.add.submit_button"
                    disabled={addingStaff || !newStaffEmail.trim()}
                    className="bg-[#1a2744] hover:bg-[#243359] text-white shrink-0"
                    onClick={async () => {
                      if (!actor || !newStaffEmail.trim()) return;
                      setAddingStaff(true);
                      try {
                        await (actor as any).addStaffAdmin(
                          newStaffEmail.trim(),
                        );
                        toast.success("Staff admin added");
                        setNewStaffEmail("");
                        await loadStaffAdmins();
                      } catch {
                        toast.error("Failed to add");
                      } finally {
                        setAddingStaff(false);
                      }
                    }}
                  >
                    {addingStaff ? "Adding..." : "Add"}
                  </Button>
                </div>
                {staffAdmins.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">
                    No staff admins yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {staffAdmins.map((email, idx) => (
                      <div
                        key={email}
                        data-ocid={`admin.staff.item.${idx + 1}`}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-xl"
                      >
                        <span className="text-sm text-gray-800">{email}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          data-ocid={`admin.staff.delete_button.${idx + 1}`}
                          className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-7"
                          onClick={async () => {
                            if (!actor) return;
                            try {
                              await (actor as any).removeStaffAdmin(email);
                              toast.success("Staff admin removed");
                              await loadStaffAdmins();
                            } catch {
                              toast.error("Failed to remove");
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* ── BOT CONFIG TAB (super admin only) ── */}
          {isSuperAdmin && activeSection === "bot-config" && (
            <div className="space-y-4">
              <BotConfigSection actor={actor} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
