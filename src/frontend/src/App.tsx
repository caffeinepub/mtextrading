import { useEffect, useState } from "react";
import Layout from "./components/Layout";
import { Toaster } from "./components/ui/sonner";
import { EmailAuthProvider } from "./hooks/useEmailAuth";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import AccountPage from "./pages/AccountPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminPage from "./pages/AdminPage";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import LandingPage from "./pages/LandingPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import LoginPage from "./pages/LoginPage";
import MarketsPage from "./pages/MarketsPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import StaffAdminLoginPage from "./pages/StaffAdminLoginPage";
import TradesPage from "./pages/TradesPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";

export type AppPage =
  | "landing"
  | "login"
  | "register"
  | "dashboard"
  | "markets"
  | "trades"
  | "account"
  | "leaderboard"
  | "admin"
  | "verify-email"
  | "forgot-password"
  | "reset-password";

import { createContext, useContext } from "react";

const NavCtx = createContext<{ navigate: (page: AppPage) => void }>({
  navigate: () => {},
});

export function useNavigate() {
  return useContext(NavCtx);
}

// Super Admin section — Internet Identity only
function SuperAdminSection() {
  const { identity, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4" />
          <p className="text-slate-400">Loading Admin...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return <AdminLoginPage />;
  }

  return (
    <div className="min-h-screen bg-white">
      <AdminPage isSuperAdmin={true} />
    </div>
  );
}

// Staff Admin section — email OTP only
function StaffAdminSection() {
  const [staffEmail, setStaffEmail] = useState<string | null>(null);

  if (!staffEmail) {
    return (
      <StaffAdminLoginPage onLoginSuccess={(email) => setStaffEmail(email)} />
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <AdminPage isSuperAdmin={false} staffEmail={staffEmail} />
    </div>
  );
}

const getInitialPage = (): AppPage => {
  try {
    const email = localStorage.getItem("mtex_current_email");
    const hasSeed = email
      ? !!localStorage.getItem(`mtex_identity_seed_${email}`)
      : false;
    // sessionStorage is cleared when the browser tab closes, so this only
    // returns "dashboard" on a real page refresh within the same session,
    // not on a fresh browser open.
    const activeSession =
      sessionStorage.getItem("mtex_active_session") === "true";
    if (email && hasSeed && activeSession) return "dashboard";
    // Clean up stale localStorage logged-in flag from old builds
    localStorage.removeItem("mtex_logged_in");
  } catch {}
  return "landing";
};

export default function App() {
  const [page, setPage] = useState<AppPage>(getInitialPage);
  const [adminRouteType, setAdminRouteType] = useState<
    "none" | "superadmin" | "staff"
  >("none");

  useEffect(() => {
    const hash = window.location.hash;
    const pathname = window.location.pathname;
    const isSuperAdmin =
      hash === "#/superadmin" ||
      hash.startsWith("#/superadmin/") ||
      pathname === "/superadmin" ||
      pathname.startsWith("/superadmin/");
    const isStaff =
      hash === "#/admin" ||
      hash.startsWith("#/admin/") ||
      pathname === "/admin" ||
      pathname.startsWith("/admin/");
    const isVerifyEmail = hash.startsWith("#/verify-email");
    const isResetPassword = hash.startsWith("#/reset-password");

    if (isSuperAdmin) setAdminRouteType("superadmin");
    else if (isStaff) setAdminRouteType("staff");
    else if (isVerifyEmail) setPage("verify-email");
    else if (isResetPassword) setPage("reset-password");
  }, []);

  const navigate = (p: AppPage) => {
    setPage(p);
  };

  if (adminRouteType === "superadmin") {
    return (
      <>
        <Toaster richColors />
        <SuperAdminSection />
      </>
    );
  }

  if (adminRouteType === "staff") {
    return (
      <EmailAuthProvider>
        <Toaster richColors />
        <StaffAdminSection />
      </EmailAuthProvider>
    );
  }

  const renderPage = () => {
    switch (page) {
      case "login":
        return <LoginPage onNavigate={navigate} />;
      case "register":
        return <RegisterPage onNavigate={navigate} />;
      case "dashboard":
        return <DashboardPage onNavigate={navigate} />;
      case "verify-email":
        return <VerifyEmailPage onNavigate={navigate} />;
      case "forgot-password":
        return <ForgotPasswordPage onNavigate={navigate} />;
      case "reset-password":
        return <ResetPasswordPage onNavigate={navigate} />;
      case "markets":
        return (
          <Layout currentPage={page} onNavigate={navigate}>
            <MarketsPage />
          </Layout>
        );
      case "trades":
        return (
          <Layout currentPage={page} onNavigate={navigate}>
            <TradesPage />
          </Layout>
        );
      case "account":
        return (
          <Layout currentPage={page} onNavigate={navigate}>
            <AccountPage />
          </Layout>
        );
      case "leaderboard":
        return (
          <Layout currentPage={page} onNavigate={navigate}>
            <LeaderboardPage />
          </Layout>
        );
      default:
        return <LandingPage onNavigate={navigate} isAuthenticated={false} />;
    }
  };

  return (
    <EmailAuthProvider>
      <NavCtx.Provider value={{ navigate }}>
        <Toaster richColors />
        {renderPage()}
      </NavCtx.Provider>
    </EmailAuthProvider>
  );
}
