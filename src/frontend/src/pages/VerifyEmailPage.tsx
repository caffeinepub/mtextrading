import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { AppPage } from "../App";
import { createRawActor } from "../utils/rawActor";

interface Props {
  onNavigate: (page: AppPage) => void;
}

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage({ onNavigate }: Props) {
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const run = async () => {
      // Parse token from hash: /#/verify-email?token=XXX
      const hash = window.location.hash;
      const queryStart = hash.indexOf("?");
      const queryStr = queryStart >= 0 ? hash.substring(queryStart + 1) : "";
      const params = new URLSearchParams(queryStr);
      const token = params.get("token");

      if (!token) {
        setErrorMsg(
          "No verification token found in the link. Please check your email.",
        );
        setStatus("error");
        return;
      }

      try {
        const rawActor = await createRawActor();
        const email = (await (rawActor as any).verifyEmailToken(
          token,
        )) as string;

        // Store verified email so RegisterPage profile step picks it up
        localStorage.setItem(
          "mtex_pending_profile",
          JSON.stringify({ email, verified: true }),
        );

        setStatus("success");

        // After 2 seconds, navigate to register (profile step)
        setTimeout(() => {
          onNavigate("register");
        }, 2000);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setErrorMsg(
          msg || "Email verification failed. The link may have expired.",
        );
        setStatus("error");
      }
    };

    run();
  }, [onNavigate]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-8">
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

        {status === "loading" && (
          <>
            <div
              data-ocid="verify_email.loading_state"
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: "#EEF2FF" }}
            >
              <Loader2
                className="w-10 h-10 animate-spin"
                style={{ color: "#0D1F3C" }}
              />
            </div>
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: "#0D1F3C" }}
            >
              Verifying your email...
            </h1>
            <p className="text-gray-500 text-sm">
              Please wait while we confirm your email address.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div
              data-ocid="verify_email.success_state"
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: "#ECFDF5" }}
            >
              <CheckCircle className="w-10 h-10" style={{ color: "#059669" }} />
            </div>
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: "#0D1F3C" }}
            >
              Email Verified!
            </h1>
            <p className="text-gray-500 text-sm mb-4">
              Your email has been verified. Setting up your account...
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirecting...
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div
              data-ocid="verify_email.error_state"
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: "#FEF2F2" }}
            >
              <XCircle className="w-10 h-10" style={{ color: "#DC2626" }} />
            </div>
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: "#0D1F3C" }}
            >
              Verification Failed
            </h1>
            <p className="text-gray-500 text-sm mb-6">{errorMsg}</p>
            <button
              type="button"
              data-ocid="verify_email.back.button"
              onClick={() => onNavigate("register")}
              className="w-full h-12 rounded-2xl font-semibold text-white text-sm flex items-center justify-center"
              style={{ backgroundColor: "#0D1F3C" }}
            >
              Go back to Register
            </button>
          </>
        )}
      </div>
    </div>
  );
}
