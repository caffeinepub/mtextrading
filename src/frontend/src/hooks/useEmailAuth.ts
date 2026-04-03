import type { Identity } from "@dfinity/agent";
import { Ed25519KeyIdentity } from "@dfinity/identity";
import {
  type ReactNode,
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
} from "react";

const IDENTITY_KEY_PREFIX = "mtex_identity_";
const CURRENT_EMAIL_KEY = "mtex_current_email";

function saveIdentity(email: string, identity: Ed25519KeyIdentity) {
  localStorage.setItem(
    IDENTITY_KEY_PREFIX + email,
    JSON.stringify(identity.toJSON()),
  );
  localStorage.setItem(CURRENT_EMAIL_KEY, email);
}

function loadIdentityByEmail(email: string): Ed25519KeyIdentity | null {
  const stored = localStorage.getItem(IDENTITY_KEY_PREFIX + email);
  if (!stored) return null;
  try {
    return Ed25519KeyIdentity.fromJSON(stored);
  } catch {
    return null;
  }
}

function loadCurrentIdentity(): {
  identity: Ed25519KeyIdentity;
  email: string;
} | null {
  const email = localStorage.getItem(CURRENT_EMAIL_KEY);
  if (!email) return null;
  const identity = loadIdentityByEmail(email);
  if (!identity) return null;
  return { identity, email };
}

export type EmailAuthContext = {
  identity: Identity | null;
  currentEmail: string | null;
  registerWithEmail: (email: string) => Ed25519KeyIdentity;
  loginWithEmail: (email: string) => Ed25519KeyIdentity | null;
  logout: () => void;
};

const EmailAuthReactContext = createContext<EmailAuthContext>({
  identity: null,
  currentEmail: null,
  registerWithEmail: () => {
    throw new Error("EmailAuthProvider not found");
  },
  loginWithEmail: () => null,
  logout: () => {},
});

export function useEmailAuth() {
  return useContext(EmailAuthReactContext);
}

export function EmailAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    identity: Ed25519KeyIdentity | null;
    email: string | null;
  }>({ identity: null, email: null });

  useEffect(() => {
    const loaded = loadCurrentIdentity();
    if (loaded) {
      setState({ identity: loaded.identity, email: loaded.email });
    }
  }, []);

  const registerWithEmail = (email: string): Ed25519KeyIdentity => {
    // Reuse existing identity if one already exists for this email
    let identity = loadIdentityByEmail(email);
    if (!identity) {
      identity = Ed25519KeyIdentity.generate();
    }
    saveIdentity(email, identity);
    setState({ identity, email });
    return identity;
  };

  const loginWithEmail = (email: string): Ed25519KeyIdentity | null => {
    const identity = loadIdentityByEmail(email);
    if (!identity) return null;
    localStorage.setItem(CURRENT_EMAIL_KEY, email);
    setState({ identity, email });
    return identity;
  };

  const logout = () => {
    localStorage.removeItem(CURRENT_EMAIL_KEY);
    setState({ identity: null, email: null });
  };

  return createElement(EmailAuthReactContext.Provider, {
    value: {
      identity: state.identity,
      currentEmail: state.email,
      registerWithEmail,
      loginWithEmail,
      logout,
    },
    children,
  });
}
