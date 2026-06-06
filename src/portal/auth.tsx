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
  users: User[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isAuthLoading: boolean;
};

const PortalAuthContext = createContext<PortalAuthContextValue | undefined>(
  undefined
);

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
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

  // Keep an up-to-date user list for components that need it (e.g. user switcher).
  // Fetched lazily after auth resolves.
  useEffect(() => {
    if (!currentUser) return;
    fetch('/api/users', { credentials: 'include' })
      .then((res) => (res.ok ? (res.json() as Promise<User[]>) : []))
      .then((list) => setUsers(list.filter((u) => u.active)))
      .catch(() => {/* ignore */});
  }, [currentUser?.id]); // re-fetch when the logged-in user changes

  const value = useMemo<PortalAuthContextValue>(
    () => ({
      currentUser,
      users,
      isAuthLoading,
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
        setUsers([]);
      },
      isAdmin: currentUser?.role === 'admin',
    }),
    [currentUser, users, isAuthLoading]
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
