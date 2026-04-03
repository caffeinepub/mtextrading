import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AppPage } from "../App";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { hashPassword } from "../utils/hashPassword";
import { createRawActor } from "../utils/rawActor";

interface Props {
  onNavigate: (page: AppPage) => void;
}

export default function ResetPasswordPage({ onNavigate }: Props) {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const hash = window.location.hash;
    const queryStart = hash.indexOf("?");
    const queryStr = queryStart >= 0 ? hash.substring(queryStart + 1) : "";
    const params = new URLSearchParams(queryStr);
    const t = params.get("token");
    if (t) setToken(t);
    else
      setError(
        "No reset token found. Please request a new password reset link.",
      );
  }, []);

  const handleSubmit = async () => {
    setError("");
    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const hash = await hashPassword(newPassword);
      const rawActor = await createRawActor();
      await (rawActor as any).resetPassword(token, hash);
      setSuccess(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "Failed to reset password. The link may have expired.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex items-center gap-2 mb-8">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: "#0D1F3C" }}
          >
            MT
          </div>
          <span className="font-bold text-lg" style={{ color: "#0D1F3C" }}>
            Mtextrading
          </span>
        </div>

        {success ? (
          <div data-ocid="reset_password.success_state" className="text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: "#ECFDF5" }}
            >
              <svg
                role="img"
                aria-label="Password changed"
                className="w-10 h-10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#059669"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: "#0D1F3C" }}
            >
              Password Changed!
            </h1>
            <p className="text-gray-500 text-sm mb-8">
              Your password has been successfully updated. You can now sign in
              with your new password.
            </p>
            <button
              type="button"
              data-ocid="reset_password.signin.button"
              onClick={() => onNavigate("login")}
              className="w-full h-14 rounded-2xl font-semibold text-white text-base flex items-center justify-center"
              style={{ backgroundColor: "#0D1F3C" }}
            >
              Sign In
            </button>
          </div>
        ) : (
          <>
            <h1
              className="text-2xl font-bold mb-1"
              style={{ color: "#0D1F3C" }}
            >
              Set new password
            </h1>
            <p className="text-sm text-gray-500 mb-8">
              Choose a strong password for your account.
            </p>

            {error && (
              <div
                data-ocid="reset_password.error_state"
                className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5"
              >
                <p className="text-sm text-red-700">{error}</p>
                {error.includes("token") && (
                  <button
                    type="button"
                    onClick={() => onNavigate("forgot-password")}
                    className="text-sm font-semibold underline mt-1 text-red-600"
                  >
                    Request a new reset link
                  </button>
                )}
              </div>
            )}

            <div className="mb-5">
              <Label
                htmlFor="new-password"
                className="text-sm font-medium text-gray-700 mb-1.5 block"
              >
                New password
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  data-ocid="reset_password.new_password.input"
                  type={showNew ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={submitting}
                  className="border-gray-300 bg-white text-gray-900 h-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="mb-8">
              <Label
                htmlFor="confirm-password"
                className="text-sm font-medium text-gray-700 mb-1.5 block"
              >
                Confirm password
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  data-ocid="reset_password.confirm_password.input"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={submitting}
                  className="border-gray-300 bg-white text-gray-900 h-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">
                  Passwords do not match
                </p>
              )}
            </div>

            <button
              type="button"
              data-ocid="reset_password.submit_button"
              onClick={handleSubmit}
              disabled={submitting || !token}
              className="w-full h-14 rounded-2xl font-semibold text-white text-base flex items-center justify-center transition-opacity disabled:opacity-70"
              style={{ backgroundColor: "#0D1F3C" }}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Set New Password"
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
