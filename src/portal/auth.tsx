import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { User } from './data/types';
import { setViewAsUserId, viewAsHeaders } from './lib/viewAs';

/** /auth/me echoes the real admin's id back when a view-as header was honoured.
 *  Its presence is the only thing that tells the client the view is in effect —
 *  the client never decides that for itself. */
type SessionUser = User & { viewAsOf?: string };

type PortalAuthContextValue = {
  currentUser: User | null;
  /** The rep being viewed as, or null. Server-confirmed, not wishful. */
  viewingAsRepId: string | null;
  /** Admin-only. Pass null to exit. Reloads so every cached fetch re-runs. */
  setViewAs: (repId: string | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  isAdmin: boolean;
  isContractor: boolean;
  isAuthLoading: boolean;
};

const PortalAuthContext = createContext<PortalAuthContextValue | undefined>(
  undefined
);

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // On mount, check if there's an existing JWT session. The view-as header goes
  // out with this too, so that if it is in effect, the portal knows whose name
  // it is wearing from the very first render rather than after a flicker.
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include', headers: { ...viewAsHeaders() } })
      .then((res) => {
        if (!res.ok) return null;
        return res.json() as Promise<SessionUser>;
      })
      .then((user) => {
        // The server ignores an unusable view-as target and answers as the
        // admin. If that happened, drop the stale id so the banner and the data
        // can't disagree.
        if (user && !user.viewAsOf) setViewAsUserId(null);
        if (user) setCurrentUser(user);
      })
      .catch(() => {/* no session — that's fine */})
      .finally(() => setIsAuthLoading(false));
  }, []);

  const value = useMemo<PortalAuthContextValue>(
    () => ({
      currentUser,
      isAuthLoading,
      viewingAsRepId: currentUser?.viewAsOf ? currentUser.id : null,
      // A full reload is the honest way to do this: every page, selector and
      // in-memory store was built from the previous identity's responses, and
      // re-fetching them piecemeal is how a stale admin figure ends up on
      // screen under a rep's name.
      setViewAs: (repId) => {
        setViewAsUserId(repId);
        window.location.assign('/portal/dashboard');
      },
      updateCurrentUser: (updates) => setCurrentUser((u) => u ? { ...u, ...updates } : u),
      login: async (email, password) => {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) return false;
        setViewAsUserId(null);
        const user = (await res.json()) as SessionUser;
        setCurrentUser(user);
        return true;
      },
      logout: () => {
        // Leaving the portal ends the view too — coming back as yourself and
        // still being someone else would be a nasty surprise.
        setViewAsUserId(null);
        fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(
          () => {/* ignore */}
        );
        setCurrentUser(null);
      },
      isAdmin: currentUser?.role === 'admin',
      isContractor: currentUser?.role === 'contractor',
    }),
    [currentUser, isAuthLoading]
  );

  return (
    <PortalAuthContext.Provider value={value}>
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth() {
  const context = useContext(PortalAuthContext);

  if (!context) {
    throw new Error('usePortalAuth must be used inside PortalAuthProvider');
  }

  return context;
}
