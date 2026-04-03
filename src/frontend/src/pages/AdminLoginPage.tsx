import { CheckCircle, Copy, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function AdminLoginPage() {
  const { login, isLoggingIn, identity } = useInternetIdentity();
  const [loginAttempted, setLoginAttempted] = useState(false);
  const [copied, setCopied] = useState(false);

  const principalId = identity ? identity.getPrincipal().toText() : null;

  const handleLogin = async () => {
    setLoginAttempted(true);
    await login();
  };

  const handleCopy = () => {
    if (principalId) {
      navigator.clipboard.writeText(principalId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center px-4">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.4) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-sm z-10">
        {/* Header badge */}
        <div className="flex justify-center mb-6">
          <span className="text-xs font-bold tracking-widest text-blue-600 uppercase border border-blue-200 px-3 py-1 rounded-full bg-blue-50">
            Restricted Access
          </span>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
            <ShieldCheck size={32} className="text-blue-600" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Authorized personnel only. Authenticate with Internet Identity to
            continue.
          </p>
        </div>

        {/* Card */}
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 shadow-md">
          <div className="flex items-center gap-3 mb-6 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <span className="text-amber-400 text-lg">⚠️</span>
            <p className="text-amber-300 text-xs">
              This area is restricted to system administrators only.
            </p>
          </div>

          {/* Show principal ID if logged in but access denied */}
          {loginAttempted && principalId && (
            <div className="mb-5 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-red-400 text-xs font-semibold mb-2">
                Access denied. Your Principal ID:
              </p>
              <div className="flex items-center gap-2 bg-black/30 rounded-lg p-2">
                <code className="text-xs text-slate-300 break-all flex-1">
                  {principalId}
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="shrink-0 text-slate-400 hover:text-white transition-colors"
                  title="Copy Principal ID"
                >
                  {copied ? (
                    <CheckCircle size={16} className="text-blue-400" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
              <p className="text-slate-500 text-xs mt-2">
                Copy this ID and set it as the admin principal in your backend.
              </p>
            </div>
          )}

          <Button
            data-ocid="admin_login.submit_button"
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full bg-[#1a2744] hover:bg-[#243359] text-white font-bold py-3 text-sm tracking-wide border border-blue-500/30"
          >
            {isLoggingIn ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              "Login with Internet Identity"
            )}
          </Button>

          <p className="text-center text-gray-400 text-xs mt-5">
            Not an admin?{" "}
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
          © {new Date().getFullYear()} Mtextrading. Admin Portal.
        </p>
      </div>
    </div>
  );
}
