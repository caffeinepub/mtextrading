import { ShieldCheck } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { createActorWithConfig } from "../config";
import { useEmailAuth } from "../hooks/useEmailAuth";

const STAFF_EMAIL = "mtextradingsupport@gmail.com";

interface StaffAdminLoginPageProps {
  onLoginSuccess: (email: string) => void;
}

export default function StaffAdminLoginPage({
  onLoginSuccess,
}: StaffAdminLoginPageProps) {
  const { registerWithEmail } = useEmailAuth();
  const actorRef = useRef<any>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getEmailActor = async () => {
    if (actorRef.current) return actorRef.current;
    const identity = registerWithEmail(STAFF_EMAIL);
    const actor = await createActorWithConfig({ agentOptions: { identity } });
    await actor._initializeAccessControlWithSecret("");
    actorRef.current = actor;
    return actor;
  };

  const handleSendCode = async () => {
    setLoading(true);
    setError("");
    try {
      const actor = await getEmailActor();
      const result = await actor.requestStaffOtp(STAFF_EMAIL);
      // Handle new result variant { ok: null } | { err: string }
      if (result && typeof result === "object") {
        if ("err" in result) {
          const errMsg = String(result.err);
          if (
            errMsg.toLowerCase().includes("not authorized") ||
            errMsg.toLowerCase().includes("not authorised")
          ) {
            setError("Access denied. This email is not authorized.");
          } else if (
            errMsg.toLowerCase().includes("not enough cycles") ||
            errMsg.toLowerCase().includes("cycles")
          ) {
            setError(
              "Email service is temporarily unavailable due to low system resources. Please try again in a few minutes or contact support.",
            );
          } else {
            setError(`Could not send verification code: ${errMsg}`);
          }
          return;
        }
        // #ok case — proceed
        setOtpSent(true);
      } else {
        // Old void return (backward compat) — treat as success
        setOtpSent(true);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (
        msg.toLowerCase().includes("not authorized") ||
        msg.toLowerCase().includes("not authorised") ||
        msg.toLowerCase().includes("not authorized as staff")
      ) {
        setError("Access denied. This email is not authorized.");
      } else if (
        msg.toLowerCase().includes("not enough cycles") ||
        msg.toLowerCase().includes("cycles")
      ) {
        setError(
          "Email service is temporarily unavailable due to low system resources. Please try again in a few minutes or contact support.",
        );
      } else {
        setError(`Could not send verification code. Please try again. ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    try {
      const actor = await getEmailActor();
      const ok = await actor.verifyStaffOtp(STAFF_EMAIL, code.trim());
      if (ok) {
        onLoginSuccess(STAFF_EMAIL);
      } else {
        setError("Invalid or expired code. Please try again.");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Verification failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.4) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-sm z-10">
        <div className="flex justify-center mb-6">
          <span className="text-xs font-bold tracking-widest text-blue-600 uppercase border border-blue-200 px-3 py-1 rounded-full bg-blue-50">
            Staff Access
          </span>
        </div>

        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
            <ShieldCheck size={32} className="text-blue-600" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Admin Login
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Click below to receive a verification code.
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 shadow-md">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-red-600 text-xs">{error}</p>
            </div>
          )}

          {!otpSent ? (
            <div className="space-y-4">
              <Button
                data-ocid="staff_login.send_code.submit_button"
                onClick={handleSendCode}
                disabled={loading}
                className="w-full bg-[#1a2744] hover:bg-[#243359] text-white font-bold py-3 text-sm"
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  "Send Verification Code"
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 mb-2">
                <p className="text-blue-700 text-xs">
                  A 6-digit code was sent to your email. Check your inbox and
                  spam folder.
                </p>
              </div>
              <div>
                <label
                  htmlFor="staff-otp"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Verification Code
                </label>
                <Input
                  id="staff-otp"
                  data-ocid="staff_login.otp.input"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  className="text-center text-xl tracking-widest bg-white border-gray-200"
                />
              </div>
              <Button
                data-ocid="staff_login.verify.submit_button"
                onClick={handleVerify}
                disabled={loading || code.length !== 6}
                className="w-full bg-[#1a2744] hover:bg-[#243359] text-white font-bold py-3 text-sm"
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  "Verify & Login"
                )}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setCode("");
                  setError("");
                  actorRef.current = null;
                }}
                className="w-full text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Resend code
              </button>
            </div>
          )}

          <p className="text-center text-gray-400 text-xs mt-5">
            Not staff?{" "}
            <button
              type="button"
              onClick={() => {
                window.location.hash = "";
                window.location.reload();
              }}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Go to main site
            </button>
          </p>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          © {new Date().getFullYear()} Mtextrading. Staff Portal.
        </p>
      </div>
    </div>
  );
}
