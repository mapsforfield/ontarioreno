import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usePortalData } from './data/store';
import { User } from './data/types';

type PortalAuthContextValue = {
  currentUser: User | null;
  users: User[];
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
};

const STORAGE_KEY = 'ontarioreno.portal.user';

const PortalAuthContext = createContext<PortalAuthContextValue | undefined>(
  undefined
);

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const { authenticateUser, users: storedUsers } = usePortalData();
  const activeUsers = useMemo(
    () => storedUsers.filter((user) => user.active),
    [storedUsers]
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(() =>
    window.localStorage.getItem(STORAGE_KEY)
  );
  const currentUser =
    activeUsers.find((user) => user.id === currentUserId) ?? null;

  useEffect(() => {
    if (currentUserId && currentUser) {
      window.localStorage.setItem(STORAGE_KEY, currentUserId);
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
  }, [currentUser, currentUserId]);

  const value = useMemo<PortalAuthContextValue>(
    () => ({
      currentUser,
      users: activeUsers,
      login: (email, password) => {
        const user = authenticateUser(email, password);
        if (!user) return false;

        setCurrentUserId(user.id);
        return true;
      },
      logout: () => setCurrentUserId(null),
      isAdmin: currentUser?.role === 'admin',
    }),
    [activeUsers, authenticateUser, currentUser]
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
