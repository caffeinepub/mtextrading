import { Mic, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { BotConfig } from "../backend";
import { useActor } from "../hooks/useActor";

const THOUGHT_MESSAGES = [
  "Use AI 🤖",
  "How can I help?",
  "Need help depositing?",
  "Ask me anything!",
  "New to trading?",
  "Find your way around",
];

const OFF_TOPIC_PATTERNS = [
  "what app",
  "built with",
  "how was",
  "how were you built",
  "what framework",
  "what technology",
  "what ai",
  "what model",
  "who made you",
  "who built",
  "who created",
  "caffeine",
  "openai",
  "claude",
  "gpt",
  "react",
  "motoko",
  "internet computer",
  "icp",
  "dfinity",
];

const DEFAULT_CONFIG: BotConfig = {
  botName: "Mtex AI Assistant",
  greetingMessage:
    "Hi! I'm Mtex AI, your trading assistant. Ask me anything about the platform — how to deposit, how to trade, or how to find your way around!",
  rules: "",
  voiceEnabled: true,
  findProviderEnabled: true,
  depositFlowEnabled: true,
  tradeFlowEnabled: true,
  supportFlowEnabled: true,
};

function isOffTopic(msg: string): boolean {
  const m = msg.toLowerCase();
  return OFF_TOPIC_PATTERNS.some((p) => m.includes(p));
}

function getResponse(msg: string, config: BotConfig): string {
  const m = msg.toLowerCase();
  const rulesPrefix = config.rules ? `Note: ${config.rules}\n\n` : "";

  if (isOffTopic(msg)) {
    return "I can only help with questions about using Mtextrading. For technical support, please use the chat button.";
  }

  if (/deposit|fund|add money/.test(m)) {
    if (!config.depositFlowEnabled)
      return "This feature is currently unavailable.";
    return `${rulesPrefix}To make a deposit, go to the **Funds tab** at the bottom of the screen. We accept crypto only: BTC, ETH, SOL, USDT, USDC, BNB, LTC, and XRP. Select your coin, copy the wallet address, send the funds, and submit your deposit — our team will approve it shortly.`;
  }
  if (/kyc not required|no kyc|without kyc/.test(m)) {
    return `${rulesPrefix}You do NOT need to complete KYC to deposit or trade. Just go to the Funds tab, make a deposit, and start trading right away!`;
  }
  if (/kyc|verification|verify|identity/.test(m)) {
    return `${rulesPrefix}Great news! You can deposit and start trading without completing KYC first. KYC is only required for withdrawals above certain limits. To complete KYC, go to your **Profile** (top-left avatar) → **Personal Details** → **Verify Identity**.`;
  }
  if (/withdraw/.test(m)) {
    return `${rulesPrefix}To withdraw funds, go to the **Funds tab** and select **Withdraw**. You can choose Bank Transfer or Crypto Withdrawal. Note: KYC verification may be required for withdrawals.`;
  }
  if (/trade|trading|buy|sell|open position/.test(m)) {
    if (!config.tradeFlowEnabled)
      return "This feature is currently unavailable.";
    return `${rulesPrefix}To place a trade, go to the **Trade tab** (second icon at the bottom). Select an instrument, choose Buy or Sell, set your position size and optional TP/SL, then tap **Place Order**. Your open trades will appear in the **Positions tab**.`;
  }
  if (/position|positions|open trades/.test(m)) {
    return `${rulesPrefix}Your open positions are in the **Positions tab** (third icon). You can see live P&L, edit your TP/SL, or close positions from there.`;
  }
  if (/copy trading|copy trade/.test(m)) {
    return `${rulesPrefix}Copy Trading is in the **Hub tab**. You can browse top traders and follow their strategies automatically.`;
  }
  if (/ai bot|trading bot|robot/.test(m)) {
    return `${rulesPrefix}AI Trading Bots are in the **Hub tab**. Activate a bot and it will trade on your behalf based on market signals.`;
  }
  if (/hub|investment|invest|plans|portfolio/.test(m)) {
    return `${rulesPrefix}The **Hub tab** (last icon) is your investment center. You'll find Investment Plans, Copy Trading, AI Bots, your Portfolio, Performance History, Referral Program, and Account Tiers there.`;
  }
  if (/referral|refer|bonus/.test(m)) {
    return `${rulesPrefix}Find your unique referral link in the **Hub tab** under Referral Program. Share it with friends — both you and your referee get a bonus when they sign up and deposit.`;
  }
  if (/find.*provider|provider/.test(m)) {
    if (!config.findProviderEnabled)
      return "This feature is currently unavailable.";
    return `${rulesPrefix}For finding a provider, please visit the **Hub tab** for copy trading options and top traders.`;
  }
  if (/support|help|contact|chat/.test(m)) {
    if (!config.supportFlowEnabled)
      return "This feature is currently unavailable.";
    return `${rulesPrefix}For direct support, tap the **chat bubble** button (bottom-right of the screen) to message our support team directly.`;
  }
  if (/account|profile|settings/.test(m)) {
    return `${rulesPrefix}Access your profile by tapping the avatar icon in the top-left corner of the dashboard. From there you can edit your name, email, phone, address, and view your account details.`;
  }
  if (/balance|money|funds/.test(m)) {
    return `${rulesPrefix}Your account balance is shown at the top of the **Home tab**. It updates in real time as your trades run.`;
  }
  if (/chart|graph|candlestick/.test(m)) {
    return `${rulesPrefix}In the Trade tab, after selecting an instrument, you can view a live chart. Toggle between TradingView and our custom MT-style chart using the button above the chart.`;
  }
  if (/demo|practice|demo account/.test(m)) {
    return `${rulesPrefix}You can switch to a Demo account from your profile settings. Demo accounts let you practice trading with virtual funds.`;
  }
  return `${rulesPrefix}I'm not sure about that one. For more help, tap the **chat button** (bottom-right) to message our support team directly, or browse the **Hub tab** for guides and resources.`;
}

type ChatMsg = { role: "user" | "assistant"; text: string; id: number };

export default function AIAssistantButton() {
  const [open, setOpen] = useState(false);
  const [thoughtIdx, setThoughtIdx] = useState(0);
  const [thoughtVisible, setThoughtVisible] = useState(true);
  const [config, setConfig] = useState<BotConfig>(DEFAULT_CONFIG);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const { actor } = useActor();

  // Load bot config from backend
  useEffect(() => {
    if (!actor) return;
    actor
      .getBotConfig()
      .then((c) => {
        setConfig(c);
        setMessages([
          {
            role: "assistant",
            text: c.greetingMessage,
            id: 0,
          },
        ]);
      })
      .catch(() => {
        setMessages([
          {
            role: "assistant",
            text: DEFAULT_CONFIG.greetingMessage,
            id: 0,
          },
        ]);
      });
  }, [actor]);

  // Rotate thought bubble
  useEffect(() => {
    const interval = setInterval(() => {
      setThoughtVisible(false);
      setTimeout(() => {
        setThoughtIdx((i) => (i + 1) % THOUGHT_MESSAGES.length);
        setThoughtVisible(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom on new messages
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const ts = Date.now();
    const userMsg: ChatMsg = { role: "user", text: text.trim(), id: ts };
    const reply: ChatMsg = {
      role: "assistant",
      text: getResponse(text.trim(), config),
      id: ts + 1,
    };
    setMessages((prev) => [...prev, userMsg, reply]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage(input);
  };

  const startVoice = () => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      sendMessage(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return (
    <>
      <style>{`
        @keyframes ai-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .ai-bob { animation: ai-bob 2s ease-in-out infinite; }
        @keyframes ai-thought-fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ai-thought-visible { animation: ai-thought-fade-in 0.3s ease forwards; }
        .ai-thought-hidden { opacity: 0; }
        @keyframes ai-panel-slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ai-panel { animation: ai-panel-slide-up 0.25s ease forwards; }
      `}</style>

      {/* Thought bubble */}
      {!open && (
        <div
          className={`fixed z-48 pointer-events-none ${
            thoughtVisible ? "ai-thought-visible" : "ai-thought-hidden"
          }`}
          style={{ bottom: "5.5rem", left: "1.5rem" }}
        >
          <div
            className="text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap"
            style={{
              background: "#1e293b",
              color: "#e2e8f0",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {THOUGHT_MESSAGES[thoughtIdx]}
          </div>
          {/* Tail */}
          <div
            className="w-2 h-2 rounded-full mx-4 mt-1"
            style={{ background: "#1e293b" }}
          />
          <div
            className="w-1.5 h-1.5 rounded-full mx-5"
            style={{ background: "#1e293b", opacity: 0.7 }}
          />
        </div>
      )}

      {/* Floating Robot Button */}
      <button
        type="button"
        data-ocid="ai_assistant.open_modal_button"
        onClick={() => setOpen((o) => !o)}
        className="fixed z-49 w-14 h-14 rounded-full shadow-xl flex items-center justify-center select-none ai-bob"
        style={{
          bottom: "1.5rem",
          left: "1.5rem",
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          border: "2px solid rgba(99,102,241,0.5)",
        }}
        aria-label="Open AI Assistant"
      >
        <RobotIcon />
      </button>

      {/* Chat Panel */}
      {open && (
        <div
          data-ocid="ai_assistant.dialog"
          className="fixed z-50 ai-panel"
          style={{ bottom: "5.5rem", left: "1.5rem" }}
        >
          <div
            className="flex flex-col rounded-2xl shadow-2xl overflow-hidden"
            style={{
              width: 320,
              height: 420,
              background: "#0f172a",
              border: "1px solid rgba(99,102,241,0.3)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #1e293b, #0f172a)",
                borderBottom: "1px solid rgba(99,102,241,0.2)",
              }}
            >
              <div className="flex items-center gap-2">
                <RobotIcon size={20} />
                <span className="text-sm font-bold text-white">
                  {config.botName}
                </span>
              </div>
              <button
                type="button"
                data-ocid="ai_assistant.close_button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className="max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed"
                    style={{
                      background:
                        msg.role === "user"
                          ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                          : "rgba(255,255,255,0.07)",
                      color: msg.role === "user" ? "#fff" : "#cbd5e1",
                      borderRadius:
                        msg.role === "user"
                          ? "16px 16px 4px 16px"
                          : "16px 16px 16px 4px",
                    }}
                  >
                    <FormattedMessage text={msg.text} />
                  </div>
                </div>
              ))}
              {listening && (
                <div className="flex justify-center">
                  <span className="text-xs text-indigo-400 animate-pulse">
                    🎤 Listening...
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              className="flex items-center gap-2 px-3 py-2 flex-shrink-0"
              style={{ borderTop: "1px solid rgba(99,102,241,0.2)" }}
            >
              <input
                data-ocid="ai_assistant.input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="flex-1 text-xs rounded-full px-3 py-2 outline-none"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  color: "#e2e8f0",
                  border: "1px solid rgba(99,102,241,0.25)",
                }}
              />
              {config.voiceEnabled && (
                <button
                  type="button"
                  data-ocid="ai_assistant.toggle"
                  onClick={listening ? stopVoice : startVoice}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                  style={{
                    background: listening
                      ? "rgba(239,68,68,0.2)"
                      : "rgba(99,102,241,0.2)",
                    color: listening ? "#f87171" : "#818cf8",
                  }}
                  aria-label={
                    listening ? "Stop listening" : "Start voice input"
                  }
                >
                  <Mic size={14} />
                </button>
              )}
              <button
                type="button"
                data-ocid="ai_assistant.submit_button"
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
                style={{ background: "#6366f1" }}
              >
                <Send size={14} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function RobotIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
    >
      {/* Antenna */}
      <line
        x1="14"
        y1="2"
        x2="14"
        y2="6"
        stroke="#818cf8"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="14" cy="2" r="1.5" fill="#818cf8" />
      {/* Head */}
      <rect
        x="5"
        y="6"
        width="18"
        height="14"
        rx="4"
        fill="#334155"
        stroke="#6366f1"
        strokeWidth="1.2"
      />
      {/* Eyes */}
      <rect x="8" y="10" width="4" height="3" rx="1" fill="#6366f1" />
      <rect x="16" y="10" width="4" height="3" rx="1" fill="#6366f1" />
      {/* Eye glow */}
      <rect
        x="9"
        y="11"
        width="2"
        height="1"
        rx="0.5"
        fill="#a5b4fc"
        opacity="0.8"
      />
      <rect
        x="17"
        y="11"
        width="2"
        height="1"
        rx="0.5"
        fill="#a5b4fc"
        opacity="0.8"
      />
      {/* Mouth */}
      <rect x="9" y="15" width="10" height="2" rx="1" fill="#475569" />
      <rect x="10" y="15.5" width="2" height="1" rx="0.5" fill="#6366f1" />
      <rect x="13" y="15.5" width="2" height="1" rx="0.5" fill="#6366f1" />
      <rect x="16" y="15.5" width="2" height="1" rx="0.5" fill="#6366f1" />
      {/* Neck */}
      <rect x="12" y="20" width="4" height="2" rx="1" fill="#334155" />
      {/* Ears */}
      <rect
        x="2"
        y="10"
        width="3"
        height="5"
        rx="1.5"
        fill="#334155"
        stroke="#6366f1"
        strokeWidth="1"
      />
      <rect
        x="23"
        y="10"
        width="3"
        height="5"
        rx="1.5"
        fill="#334155"
        stroke="#6366f1"
        strokeWidth="1"
      />
    </svg>
  );
}

function FormattedMessage({ text }: { text: string }) {
  // Simple bold markdown support: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: static content
          <strong key={i} style={{ color: "#a5b4fc" }}>
            {part.slice(2, -2)}
          </strong>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: static content
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}
