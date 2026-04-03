import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { AppPage } from "../App";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { createRawActor } from "../utils/rawActor";

interface Props {
  onNavigate: (page: AppPage) => void;
}

export default function ForgotPasswordPage({ onNavigate }: Props) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSubmitting(true);
    try {
      const rawActor = await createRawActor();
      await (rawActor as any).sendPasswordResetEmail(email);
      setSent(true);
    } catch {
      // Always show success to not reveal if email exists
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 pt-6 pb-2">
        <button
          type="button"
          data-ocid="forgot_password.back.button"
          onClick={() => onNavigate("login")}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={22} className="text-gray-700" />
        </button>
      </div>

      <div className="flex-1 px-6 pt-4 pb-32">
        {!sent ? (
          <>
            <h1
              className="text-2xl font-bold mb-1"
              style={{ color: "#0D1F3C" }}
            >
              Forgot password
            </h1>
            <p className="text-sm text-gray-500 mb-8">
              Enter the email you used to create your account and we&apos;ll
              send you a reset link.
            </p>

            <div className="mb-5">
              <Label
                htmlFor="forgot-email"
                className="text-sm font-medium text-gray-700 mb-1.5 block"
              >
                Email address
              </Label>
              <Input
                id="forgot-email"
                data-ocid="forgot_password.email.input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !submitting && handleSubmit()
                }
                disabled={submitting}
                className="border-gray-300 bg-white text-gray-900 h-12"
              />
            </div>
          </>
        ) : (
          <div
            data-ocid="forgot_password.success_state"
            className="text-center pt-16"
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: "#ECFDF5" }}
            >
              <svg
                role="img"
                aria-label="Email sent"
                className="w-10 h-10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#059669"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-3" style={{ color: "#0D1F3C" }}>
              Check your inbox
            </h2>
            <p className="text-sm text-gray-500 mb-2">
              If an account exists for
            </p>
            <p className="font-semibold text-gray-800 mb-4">{email}</p>
            <p className="text-sm text-gray-500 mb-8">
              a password reset link has been sent. Check your spam folder if you
              don&apos;t see it.
            </p>
            <button
              type="button"
              data-ocid="forgot_password.back_to_login.button"
              onClick={() => onNavigate("login")}
              className="text-sm font-semibold underline"
              style={{ color: "#0D1F3C" }}
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>

      {!sent && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            data-ocid="forgot_password.submit_button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-14 rounded-2xl font-semibold text-white text-base flex items-center justify-center transition-opacity disabled:opacity-70"
            style={{ backgroundColor: "#0D1F3C" }}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Sending...
              </span>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
