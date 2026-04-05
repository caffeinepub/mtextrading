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
import { EmailIdentityOverrideContext } from "./useInternetIdentity";

const CURRENT_EMAIL_KEY = "mtex_current_email";

/**
 * Derive a deterministic Ed25519KeyIdentity from email + passwordHash.
 * The seed is SHA-256(email + ":" + passwordHash) -- 32 bytes, always
 * the same on any device as long as the credentials match.
 */
export async function deriveIdentityFromCredentials(
  email: string,
  passwordHash: string,
): Promise<Ed25519KeyIdentity> {
  const encoder = new TextEncoder();
  const data = encoder.encode(
    `${email.toLowerCase().trim()}:${passwordHash}:mtex_identity_v1`,
  );
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const seed = new Uint8Array(hashBuffer); // 32 bytes
  return Ed25519KeyIdentity.generate(seed);
}

export type EmailAuthContext = {
  identity: Identity | null;
  currentEmail: string | null;
  setIdentityFromCredentials: (
    email: string,
    passwordHash: string,
  ) => Promise<Ed25519KeyIdentity>;
  /** @deprecated use setIdentityFromCredentials for new code */
  registerWithEmail: (
    email: string,
    passwordHash?: string,
  ) => Ed25519KeyIdentity | Promise<Ed25519KeyIdentity>;
  /** @deprecated use setIdentityFromCredentials for new code */
  loginWithEmail: (
    email: string,
    passwordHash?: string,
  ) => Ed25519KeyIdentity | null | Promise<Ed25519KeyIdentity | null>;
  logout: () => void;
};

const EmailAuthReactContext = createContext<EmailAuthContext>({
  identity: null,
  currentEmail: null,
  setIdentityFromCredentials: async () => {
    throw new Error("EmailAuthProvider not found");
  },
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

  // On mount: restore session from localStorage (email only — identity
  // is re-derived on login, but we keep a cached copy for the session)
  useEffect(() => {
    const email = localStorage.getItem(CURRENT_EMAIL_KEY);
    const cachedSeed = email
      ? localStorage.getItem(`mtex_identity_seed_${email}`)
      : null;
    if (email && cachedSeed) {
      try {
        const identity = Ed25519KeyIdentity.fromJSON(cachedSeed);
        setState({ identity, email });
      } catch {
        // corrupted — ignore, user will re-login
      }
    }
  }, []);

  const setIdentityFromCredentials = async (
    email: string,
    passwordHash: string,
  ): Promise<Ed25519KeyIdentity> => {
    const identity = await deriveIdentityFromCredentials(email, passwordHash);
    // Cache in localStorage so the session survives page refresh
    localStorage.setItem(CURRENT_EMAIL_KEY, email);
    localStorage.setItem(
      `mtex_identity_seed_${email}`,
      JSON.stringify(identity.toJSON()),
    );
    setState({ identity, email });
    return identity;
  };

  // Backward-compat shims — callers that don't pass passwordHash fall back
  // to the old localStorage-based lookup so existing sessions still work.
  const registerWithEmail = (
    email: string,
    passwordHash?: string,
  ): Ed25519KeyIdentity | Promise<Ed25519KeyIdentity> => {
    if (passwordHash) {
      return setIdentityFromCredentials(email, passwordHash);
    }
    // Legacy: try cache, otherwise generate random (old behaviour)
    const cached =
      localStorage.getItem(`mtex_identity_seed_${email}`) ||
      localStorage.getItem(`mtex_identity_${email}`);
    if (cached) {
      try {
        const identity = Ed25519KeyIdentity.fromJSON(cached);
        localStorage.setItem(CURRENT_EMAIL_KEY, email);
        localStorage.setItem(`mtex_identity_seed_${email}`, cached);
        setState({ identity, email });
        return identity;
      } catch {
        /* fall through */
      }
    }
    const identity = Ed25519KeyIdentity.generate();
    localStorage.setItem(CURRENT_EMAIL_KEY, email);
    localStorage.setItem(
      `mtex_identity_seed_${email}`,
      JSON.stringify(identity.toJSON()),
    );
    setState({ identity, email });
    return identity;
  };

  const loginWithEmail = (
    email: string,
    passwordHash?: string,
  ): Ed25519KeyIdentity | null | Promise<Ed25519KeyIdentity | null> => {
    if (passwordHash) {
      return setIdentityFromCredentials(email, passwordHash);
    }
    // Legacy: look up from cache
    const cached =
      localStorage.getItem(`mtex_identity_seed_${email}`) ||
      localStorage.getItem(`mtex_identity_${email}`);
    if (!cached) return null;
    try {
      const identity = Ed25519KeyIdentity.fromJSON(cached);
      localStorage.setItem(CURRENT_EMAIL_KEY, email);
      setState({ identity, email });
      return identity;
    } catch {
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem(CURRENT_EMAIL_KEY);
    setState({ identity: null, email: null });
  };

  return createElement(
    EmailIdentityOverrideContext.Provider,
    { value: state.identity },
    createElement(
      EmailAuthReactContext.Provider,
      {
        value: {
          identity: state.identity,
          currentEmail: state.email,
          setIdentityFromCredentials,
          registerWithEmail,
          loginWithEmail,
          logout,
        },
      },
      children,
    ),
  );
}
