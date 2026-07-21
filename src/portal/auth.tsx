import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { User } from './data/types';

type PortalAuthContextValue = {
  currentUser: User | null;
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // On mount, check if there's an existing JWT session
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) return null;
        return res.json() as Promise<User>;
      })
      .then((user) => {
        if (user) setCurrentUser(user);
      })
      .catch(() => {/* no session — that's fine */})
      .finally(() => setIsAuthLoading(false));
  }, []);

  const value = useMemo<PortalAuthContextValue>(
    () => ({
      currentUser,
      isAuthLoading,
      updateCurrentUser: (updates) => setCurrentUser((u) => u ? { ...u, ...updates } : u),
      login: async (email, password) => {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) return false;
        const user = (await res.json()) as User;
        setCurrentUser(user);
        return true;
      },
      logout: () => {
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
