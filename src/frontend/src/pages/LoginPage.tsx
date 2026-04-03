import { ArrowLeft, Eye, EyeOff, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AppPage } from "../App";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { createActorWithConfig } from "../config";
import { useEmailAuth } from "../hooks/useEmailAuth";
import { hashPassword } from "../utils/hashPassword";
import { createRawActor } from "../utils/rawActor";

interface Props {
  onNavigate: (page: AppPage) => void;
}

export default function LoginPage({ onNavigate }: Props) {
  const { setIdentityFromCredentials } = useEmailAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [show2FAStep, setShow2FAStep] = useState(false);
  const [twoFAInput, setTwoFAInput] = useState("");
  const [twoFAError, setTwoFAError] = useState("");
  const [pendingLoginAction, setPendingLoginAction] = useState<
    (() => void) | null
  >(null);

  useEffect(() => {
    const remembered = localStorage.getItem("mtex_remembered_email");
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async () => {
    setError("");
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setSubmitting(true);
    try {
      const hash = await hashPassword(password);
      const rawActor = await createRawActor();

      // Verify password against backend
      const valid = await (rawActor as any).verifyLoginPassword(email, hash);
      if (!valid) {
        setError("Incorrect email or password");
        return;
      }

      // Check email verification
      const verified = await (rawActor as any).isEmailVerified(email);
      if (!verified) {
        setError(
          "Please verify your email first. Check your inbox for the verification code.",
        );
        return;
      }

      // Derive deterministic identity from email + passwordHash
      // This is the same on every device — no localStorage seed required
      const identity = await setIdentityFromCredentials(email, hash);
      const actor = await createActorWithConfig({ agentOptions: { identity } });
      await actor._initializeAccessControlWithSecret("");

      // Save remember me preference
      if (rememberMe) {
        localStorage.setItem("mtex_remembered_email", email);
      } else {
        localStorage.removeItem("mtex_remembered_email");
      }

      // Check if profile is complete
      const profile = await actor.getCallerUserProfile();
      if (!profile?.phone) {
        // Profile not completed — go to profile setup
        localStorage.setItem(
          "mtex_pending_profile",
          JSON.stringify({ email, verified: true }),
        );
        onNavigate("register");
        return;
      }

      // Check 2FA
      const is2FAEnabled = localStorage.getItem("mtex_2fa_enabled") === "true";
      if (is2FAEnabled) {
        setPendingLoginAction(() => () => {
          try {
            const loginHistory: Array<{ timestamp: string; device: string }> =
              JSON.parse(localStorage.getItem("mtex_login_history") || "[]");
            loginHistory.unshift({
              timestamp: new Date().toISOString(),
              device: navigator.userAgent,
            });
            localStorage.setItem(
              "mtex_login_history",
              JSON.stringify(loginHistory.slice(0, 10)),
            );
          } catch {}
          toast.success(`Welcome back, ${profile.name || "Trader"}!`);
          onNavigate("dashboard");
        });
        setShow2FAStep(true);
        return;
      }

      // Track login activity
      try {
        const loginHistory: Array<{ timestamp: string; device: string }> =
          JSON.parse(localStorage.getItem("mtex_login_history") || "[]");
        loginHistory.unshift({
          timestamp: new Date().toISOString(),
          device: navigator.userAgent,
        });
        localStorage.setItem(
          "mtex_login_history",
          JSON.stringify(loginHistory.slice(0, 10)),
        );
      } catch {}
      toast.success(`Welcome back, ${profile.name || "Trader"}!`);
      onNavigate("dashboard");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Sign in failed: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 2FA step screen
  if (show2FAStep) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex items-center justify-between px-4 pt-6 pb-2">
          <button
            type="button"
            onClick={() => {
              setShow2FAStep(false);
              setTwoFAInput("");
              setTwoFAError("");
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={22} className="text-gray-700" />
          </button>
        </div>
        <div className="flex-1 px-6 pt-4 pb-36 overflow-y-auto">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#0D1F3C" }}>
            Two-Factor Authentication
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Enter the 6-digit code from your Google Authenticator app
          </p>
          {twoFAError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
              <p className="text-sm text-red-700">{twoFAError}</p>
            </div>
          )}
          <div className="mb-6">
            <label
              htmlFor="2fa-code"
              className="text-sm font-medium text-gray-700 mb-1.5 block"
            >
              Authentication Code
            </label>
            <Input
              id="2fa-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={twoFAInput}
              onChange={(e) =>
                setTwoFAInput(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && twoFAInput.length === 6) {
                  if (pendingLoginAction) {
                    pendingLoginAction();
                  }
                }
              }}
              className="border-gray-300 bg-white text-gray-900 h-12 text-center text-xl tracking-[0.4em]"
              placeholder="000000"
            />
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            disabled={twoFAInput.length !== 6}
            onClick={() => {
              if (twoFAInput.length === 6) {
                if (pendingLoginAction) {
                  pendingLoginAction();
                }
              } else {
                setTwoFAError(
                  "Please enter the 6-digit code from your authenticator app.",
                );
              }
            }}
            className="w-full h-14 rounded-2xl font-semibold text-white text-base flex items-center justify-center transition-opacity disabled:opacity-70"
            style={{ backgroundColor: "#0D1F3C" }}
          >
            Verify &amp; Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 pt-6 pb-2">
        <button
          type="button"
          data-ocid="login.back.button"
          onClick={() => onNavigate("landing")}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={22} className="text-gray-700" />
        </button>
        <button
          type="button"
          onClick={() => onNavigate("landing")}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X size={22} className="text-gray-700" />
        </button>
      </div>

      <div className="flex-1 px-6 pt-4 pb-36 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#0D1F3C" }}>
          Sign in
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Enter your email and password to continue
        </p>

        {error && (
          <div
            data-ocid="login.error_state"
            className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5"
          >
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="mb-5">
          <Label
            htmlFor="login-email"
            className="text-sm font-medium text-gray-700 mb-1.5 block"
          >
            Email address
          </Label>
          <Input
            id="login-email"
            data-ocid="login.email.input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !submitting && handleLogin()}
            disabled={submitting}
            className="border-gray-300 bg-white text-gray-900 focus:border-gray-500 h-12"
          />
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <Label
              htmlFor="login-password"
              className="text-sm font-medium text-gray-700"
            >
              Password
            </Label>
            <button
              type="button"
              data-ocid="login.forgot_password.link"
              onClick={() => onNavigate("forgot-password")}
              className="text-xs font-medium hover:underline"
              style={{ color: "#0D1F3C" }}
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              data-ocid="login.password.input"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !submitting && handleLogin()
              }
              disabled={submitting}
              className="border-gray-300 bg-white text-gray-900 h-12 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="login-remember"
              data-ocid="login.remember.checkbox"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
            />
            <Label
              htmlFor="login-remember"
              className="text-sm text-gray-600 cursor-pointer"
            >
              Remember me
            </Label>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-5">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Your capital is at risk.</span>{" "}
              Mtextrading is a regulated broker.
            </p>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm pt-6">
          No account?{" "}
          <button
            type="button"
            data-ocid="login.register.link"
            onClick={() => onNavigate("register")}
            className="font-semibold underline"
            style={{ color: "#0D1F3C" }}
          >
            Register here
          </button>
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4">
        <button
          type="button"
          data-ocid="login.submit_button"
          onClick={handleLogin}
          disabled={submitting}
          className="w-full h-14 rounded-2xl font-semibold text-white text-base flex items-center justify-center transition-opacity disabled:opacity-70"
          style={{ backgroundColor: "#0D1F3C" }}
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </div>
    </div>
  );
}
