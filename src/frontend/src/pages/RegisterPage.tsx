import { ArrowLeft, Eye, EyeOff, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { AppPage } from "../App";
import { AccountType } from "../backend.d";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { createActorWithConfig } from "../config";
import { useEmailAuth } from "../hooks/useEmailAuth";
import { hashPassword } from "../utils/hashPassword";
import { createRawActor } from "../utils/rawActor";

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Angola",
  "Argentina",
  "Australia",
  "Austria",
  "Bahrain",
  "Bangladesh",
  "Belgium",
  "Bolivia",
  "Brazil",
  "Cameroon",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "Costa Rica",
  "Cote d'Ivoire",
  "Croatia",
  "Czech Republic",
  "Denmark",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "Ethiopia",
  "Finland",
  "France",
  "Germany",
  "Ghana",
  "Greece",
  "Guatemala",
  "Honduras",
  "Hong Kong",
  "Hungary",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kuwait",
  "Lebanon",
  "Libya",
  "Malaysia",
  "Mexico",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Netherlands",
  "New Zealand",
  "Nigeria",
  "Norway",
  "Oman",
  "Pakistan",
  "Panama",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Saudi Arabia",
  "Senegal",
  "Singapore",
  "South Africa",
  "South Korea",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tanzania",
  "Thailand",
  "Tunisia",
  "Turkey",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

interface Props {
  onNavigate: (page: AppPage) => void;
}

type Step = "form" | "otp" | "profile";

export default function RegisterPage({ onNavigate }: Props) {
  const { setIdentityFromCredentials } = useEmailAuth();

  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [marketing, setMarketing] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // OTP state
  const [otpCode, setOtpCode] = useState("");

  // Profile setup state
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [phone, setPhone] = useState("");

  // Store the password hash so we can derive the same identity in profile step
  const passwordHashRef = useRef<string>("");

  const actorRef = useRef<Awaited<
    ReturnType<typeof createActorWithConfig>
  > | null>(null);

  // On mount: check if profile is pending (returning from login with incomplete profile)
  useEffect(() => {
    const pendingStr = localStorage.getItem("mtex_pending_profile");
    if (pendingStr) {
      try {
        const pending = JSON.parse(pendingStr) as {
          email: string;
          verified: boolean;
          passwordHash?: string;
        };
        if (pending.verified && pending.email) {
          setEmail(pending.email);
          if (pending.passwordHash) {
            passwordHashRef.current = pending.passwordHash;
          }
          setStep("profile");
        }
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  // Build an actor using the deterministic identity derived from email+passwordHash
  const getActor = async (emailAddr: string, pwHash: string) => {
    const identity = await setIdentityFromCredentials(emailAddr, pwHash);
    const actor = await createActorWithConfig({ agentOptions: { identity } });
    await actor._initializeAccessControlWithSecret("");
    return actor;
  };

  const handleRegister = async () => {
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
      toast.error("Please enter a password");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!country) {
      toast.error("Please select your country of residence");
      return;
    }

    setSubmitting(true);
    try {
      const rawActor = await createRawActor();
      const alreadyRegistered = await (rawActor as any).checkEmailRegistered(
        email,
      );
      if (alreadyRegistered) {
        toast.error("This email is already registered. Please sign in.");
        return;
      }
      const hash = await hashPassword(password);
      passwordHashRef.current = hash;
      // Register with password — this sends a verification code
      await (rawActor as any).registerWithPassword(email, hash);
      setStep("otp");
      setOtpCode("");
      toast.success("Verification code sent to your email!");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Registration failed: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    setSubmitting(true);
    try {
      const rawActor = await createRawActor();
      const success = await (rawActor as any).verifyOtp(email, otpCode);
      if (success) {
        toast.success("Email verified!");
        // Persist passwordHash so profile step can derive the right identity
        localStorage.setItem(
          "mtex_pending_profile",
          JSON.stringify({
            email,
            verified: true,
            passwordHash: passwordHashRef.current,
          }),
        );
        setStep("profile");
      } else {
        toast.error("Invalid or expired code. Please try again.");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Verification failed: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setSubmitting(true);
    try {
      const hash = await hashPassword(password);
      const rawActor = await createRawActor();
      await (rawActor as any).registerWithPassword(email, hash);
      setOtpCode("");
      toast.success("Verification code resent!");
    } catch {
      toast.error("Failed to resend. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileSubmit = async () => {
    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!dob) {
      toast.error("Please enter your date of birth");
      return;
    }
    if (!homeAddress.trim()) {
      toast.error("Please enter your home address");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    if (!passwordHashRef.current) {
      toast.error(
        "Session expired. Please log in again to complete your profile.",
      );
      onNavigate("login");
      return;
    }

    setSubmitting(true);
    try {
      const actor =
        actorRef.current ?? (await getActor(email, passwordHashRef.current));
      actorRef.current = actor;

      // Create demo trading account if none exists
      try {
        await actor.createTradingAccount(AccountType.demo, "USD");
      } catch {
        /* already exists */
      }

      await actor.saveCallerUserProfile(
        fullName.trim(),
        email,
        phone.trim(),
        dob,
        country || "Unknown",
        homeAddress.trim(),
        AccountType.demo,
      );

      // Clear pending profile flag
      localStorage.removeItem("mtex_pending_profile");

      // Send profile complete notification (best-effort)
      actor
        .sendAnnouncementToUser(
          email,
          "Profile Complete — Start Trading",
          "Congratulations! Your Mtextrading profile is set up. Make your first deposit and start trading today.",
        )
        .catch(() => {});

      toast.success("Profile saved! Welcome to Mtextrading");
      onNavigate("dashboard");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Failed to save profile: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Profile Setup Step ─────────────────────────────────────────────
  if (step === "profile") {
    const profileValid =
      fullName.trim().length > 0 &&
      dob.length > 0 &&
      homeAddress.trim().length > 0 &&
      phone.trim().length > 0;

    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex items-center justify-between px-4 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: "#0D1F3C" }}
            >
              MT
            </div>
            <span className="font-bold text-sm" style={{ color: "#0D1F3C" }}>
              Mtextrading
            </span>
          </div>
        </div>

        <div className="flex-1 px-6 pt-4 pb-36 overflow-y-auto">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#0D1F3C" }}>
            Complete Your Profile
          </h1>
          <p className="text-sm text-gray-500 mb-7">
            Please fill in your details to finish setting up your account. All
            fields are required.
          </p>

          <div className="mb-4">
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Email address
            </Label>
            <Input
              data-ocid="register.profile.email.input"
              type="email"
              value={email}
              readOnly
              className="border-gray-200 bg-gray-50 text-gray-400 h-12 cursor-not-allowed"
            />
          </div>

          <div className="mb-4">
            <Label
              htmlFor="profile-name"
              className="text-sm font-medium text-gray-700 mb-1.5 block"
            >
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="profile-name"
              data-ocid="register.profile.name.input"
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={submitting}
              className="border-gray-300 bg-white text-gray-900 h-12"
            />
          </div>

          <div className="mb-4">
            <Label
              htmlFor="profile-dob"
              className="text-sm font-medium text-gray-700 mb-1.5 block"
            >
              Date of Birth <span className="text-red-500">*</span>
            </Label>
            <Input
              id="profile-dob"
              data-ocid="register.profile.dob.input"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              disabled={submitting}
              className="border-gray-300 bg-white text-gray-900 h-12"
            />
          </div>

          <div className="mb-4">
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Country of Residence
            </Label>
            <Input
              data-ocid="register.profile.country.input"
              type="text"
              value={country || "Not specified"}
              readOnly
              className="border-gray-200 bg-gray-50 text-gray-400 h-12 cursor-not-allowed"
            />
          </div>

          <div className="mb-4">
            <Label
              htmlFor="profile-address"
              className="text-sm font-medium text-gray-700 mb-1.5 block"
            >
              Home Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="profile-address"
              data-ocid="register.profile.address.input"
              type="text"
              placeholder="Enter your home address"
              value={homeAddress}
              onChange={(e) => setHomeAddress(e.target.value)}
              disabled={submitting}
              className="border-gray-300 bg-white text-gray-900 h-12"
            />
          </div>

          <div className="mb-4">
            <Label
              htmlFor="profile-phone"
              className="text-sm font-medium text-gray-700 mb-1.5 block"
            >
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="profile-phone"
              data-ocid="register.profile.phone.input"
              type="tel"
              placeholder="+1 234 567 8900"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={submitting}
              className="border-gray-300 bg-white text-gray-900 h-12"
            />
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            data-ocid="register.profile.submit.primary_button"
            onClick={handleProfileSubmit}
            disabled={submitting || !profileValid}
            className="w-full h-14 rounded-2xl font-semibold text-white text-base flex items-center justify-center transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "#0D1F3C" }}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </span>
            ) : (
              "Complete Setup"
            )}
          </button>
          <p className="text-center text-xs text-gray-400 mt-3">
            Your information is securely stored and never shared.
          </p>
        </div>
      </div>
    );
  }

  // ── OTP Verification Step ──────────────────────────────────────────
  if (step === "otp") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          {/* Code icon */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: "#EEF2FF" }}
          >
            <svg
              role="img"
              aria-label="Verification code"
              className="w-10 h-10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0D1F3C"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold mb-3" style={{ color: "#0D1F3C" }}>
            Enter verification code
          </h1>
          <p className="text-gray-500 text-sm mb-2">
            We sent a 6-digit code to
          </p>
          <p className="font-semibold text-gray-800 mb-6">{email}</p>

          <div className="mb-6">
            <Input
              data-ocid="register.otp.input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={otpCode}
              onChange={(e) =>
                setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              disabled={submitting}
              className="text-center text-2xl font-bold tracking-[0.5em] border-gray-300 bg-white text-gray-900 h-14"
            />
          </div>

          <button
            type="button"
            data-ocid="register.otp.submit.primary_button"
            onClick={handleVerifyOtp}
            disabled={submitting || otpCode.length !== 6}
            className="w-full h-12 rounded-2xl font-semibold text-white text-sm flex items-center justify-center transition-opacity disabled:opacity-50 mb-4"
            style={{ backgroundColor: "#0D1F3C" }}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </span>
            ) : (
              "Verify Code"
            )}
          </button>

          <button
            type="button"
            data-ocid="register.otp.resend.button"
            onClick={handleResendCode}
            disabled={submitting}
            className="text-sm font-medium underline disabled:opacity-50"
            style={{ color: "#0D1F3C" }}
          >
            Resend code
          </button>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => setStep("form")}
              className="text-sm text-gray-400 hover:text-gray-600 underline"
            >
              Use a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration Form Step ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 pt-6 pb-2">
        <button
          type="button"
          onClick={() => onNavigate("landing")}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close"
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
          Create account
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Register and open a trading account
        </p>

        <div className="mb-5">
          <Label
            htmlFor="register-email"
            className="text-sm font-medium text-gray-700 mb-1.5 block"
          >
            Email address
          </Label>
          <Input
            id="register-email"
            data-ocid="register.email.input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            className="border-gray-300 bg-white text-gray-900 focus:border-gray-500 h-12"
          />
        </div>

        <div className="mb-5">
          <Label
            htmlFor="register-password"
            className="text-sm font-medium text-gray-700 mb-1.5 block"
          >
            Password
          </Label>
          <div className="relative">
            <Input
              id="register-password"
              data-ocid="register.password.input"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        <div className="mb-5">
          <Label
            htmlFor="register-confirm"
            className="text-sm font-medium text-gray-700 mb-1.5 block"
          >
            Confirm password
          </Label>
          <div className="relative">
            <Input
              id="register-confirm"
              data-ocid="register.confirm_password.input"
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
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
          )}
        </div>

        <div className="mb-6">
          <Label
            htmlFor="register-country"
            className="text-sm font-medium text-gray-700 mb-1.5 block"
          >
            Country of residence
          </Label>
          <div className="relative">
            <select
              id="register-country"
              data-ocid="register.country.select"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={submitting}
              className="w-full h-12 border border-gray-300 rounded-md bg-white text-gray-900 px-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 appearance-none"
            >
              <option value="">Select country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {country && (
              <button
                type="button"
                onClick={() => setCountry("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear country"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-5 mb-5">
          <p className="text-sm text-gray-500 leading-relaxed">
            By proceeding I agree to the{" "}
            <button
              type="button"
              className="font-semibold underline inline"
              style={{ color: "#0D1F3C" }}
            >
              Mtextrading Privacy Policy.
            </button>
          </p>
        </div>

        <div className="border-t border-gray-200 pt-5 mb-5">
          <div className="flex items-start gap-3">
            <Checkbox
              id="register-marketing"
              data-ocid="register.marketing.checkbox"
              checked={marketing}
              onCheckedChange={(checked) => setMarketing(checked === true)}
              className="mt-0.5"
            />
            <Label
              htmlFor="register-marketing"
              className="text-sm text-gray-500 leading-relaxed cursor-pointer"
            >
              Sign up to hear about our latest news, brand new product launches
              and exciting offers.
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
          Already have an account?{" "}
          <button
            type="button"
            data-ocid="register.login.link"
            onClick={() => onNavigate("login")}
            className="font-semibold underline"
            style={{ color: "#0D1F3C" }}
          >
            Sign in
          </button>
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4">
        <button
          type="button"
          data-ocid="register.next.primary_button"
          onClick={handleRegister}
          disabled={submitting}
          className="w-full h-14 rounded-2xl font-semibold text-white text-base flex items-center justify-center transition-opacity disabled:opacity-70"
          style={{ backgroundColor: "#0D1F3C" }}
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Creating account...
            </span>
          ) : (
            "Create Account"
          )}
        </button>
      </div>
    </div>
  );
}
