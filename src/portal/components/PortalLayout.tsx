import {
  BarChart3,
  Bell,
  BellOff,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Camera,
  CreditCard,
  Gauge,
  HandCoins,
  LineChart,
  AlertTriangle,
  ListTodo,
  LogOut,
  MoreHorizontal,
  PhoneCall,
  Search,
  ShieldCheck,
  TableProperties,
  Trophy,
  UserRound,
  X,
} from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import {
  getPushPermissionState,
  registerPushNotifications,
  unregisterPushNotifications,
} from '../lib/pushNotifications';
import type { LucideIcon } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { usePortalAuth } from '../auth';
import { usePortalData } from '../data/store';
import { repCanAccess, featureForPath, type RepFeatureKey } from '../data/repFeatures';
import AdminActivityCenter from './AdminActivityCenter';
import GlobalSearch from './GlobalSearch';
import Toaster from './Toaster';

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  mobileLabel?: string;
  adminOnly?: boolean;
  feature?: RepFeatureKey;
};

// Order matters: Call Queue sits near the end so it doesn't crowd the core
// sections for reps (especially in the mobile "More" menu). Admin is always last.
const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/portal/dashboard', icon: Gauge },
  { label: 'Contractors', href: '/portal/contractors', icon: Building2, feature: 'contractors' },
  { label: 'Deals', href: '/portal/deals', icon: BriefcaseBusiness, feature: 'deals' },
  {
    label: 'Consultations',
    mobileLabel: 'Consults',
    href: '/portal/appointments',
    icon: CalendarDays,
    feature: 'consultations',
  },
  { label: 'Clients', href: '/portal/clients', icon: UserRound, feature: 'clients' },
  { label: 'Tasks', href: '/portal/tasks', icon: ListTodo, feature: 'tasks' },
  { label: 'Financing', href: '/portal/financing', icon: CreditCard, feature: 'financing' },
  { label: 'Performance', href: '/portal/performance', icon: LineChart, feature: 'analytics' },
  { label: 'Call Queue', href: '/portal/workspace', icon: PhoneCall, feature: 'workspace' },
  { label: 'Admin', href: '/portal/admin', icon: ShieldCheck, adminOnly: true },
];

// Contractor accounts get a tiny, read-only nav: just their scoped calendar + clients.
const contractorNavItems: NavItem[] = [
  { label: 'Calendar', href: '/portal/cx-calendar', icon: CalendarDays },
  { label: 'Clients', href: '/portal/cx-clients', icon: UserRound },
];

export default function PortalLayout() {
  const { currentUser, isAdmin, isContractor, logout, updateCurrentUser } = usePortalAuth();
  const { changeUserPassword, updateUser, getVisibleAppointmentsForUser, loadError, refetch, repAccess } = usePortalData();

  // Global quick-search (Cmd/Ctrl+K, or "/" when not typing)
  const [searchOpen, setSearchOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((v) => !v);
      } else if (e.key === '/' && !typing) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Needs-attention count for badge on Consultations nav item
  const today = new Date().toISOString().slice(0, 10);
  const visibleAppointments = currentUser ? getVisibleAppointmentsForUser(currentUser) : [];
  const needsAttentionCount = visibleAppointments.filter(
    (a) =>
      (a.status === 'completed' && !a.outcomeSubmitted) ||
      (a.nextStep === 'follow_up_required' && a.followUpDate && a.followUpDate <= today) ||
      (['hot', 'warm'].includes(a.homeownerInterestLevel ?? '') && a.nextStep === 'no_action') ||
      (a.appointmentDate < today && a.status !== 'completed') ||
      a.consultationStage === 'follow_up_required'
  ).length;
  // Push notifications
  const [pushState, setPushState] = useState<'unsupported' | 'default' | 'granted' | 'denied' | 'registering'>('default');
  useEffect(() => {
    setPushState(getPushPermissionState());
  }, []);
  const handleTogglePush = async () => {
    if (!currentUser) return;
    if (pushState === 'granted') {
      await unregisterPushNotifications(currentUser.id);
      setPushState('default');
      return;
    }
    // Check support before attempting
    const hasNotification = 'Notification' in window;
    const hasPushManager = 'PushManager' in window;
    const hasServiceWorker = 'serviceWorker' in navigator;
    if (!hasNotification || !hasPushManager || !hasServiceWorker) {
      alert(
        `Push not available in this browser context.\n\nSupport: Notification=${hasNotification}, PushManager=${hasPushManager}, ServiceWorker=${hasServiceWorker}\n\nMake sure you opened this from your Home Screen icon (not Safari).`
      );
      return;
    }
    setPushState('registering');
    try {
      const ok = await registerPushNotifications(currentUser.id);
      if (ok) {
        setPushState('granted');
      } else {
        const perm = Notification.permission;
        setPushState(perm === 'denied' ? 'denied' : 'default');
        if (perm === 'denied') {
          alert('Notifications are blocked. Go to iPhone Settings → Notifications → find OntarioReno and enable.');
        } else {
          alert(`Push registration returned false. Permission: "${perm}". VAPID key present: ${!!import.meta.env.VITE_VAPID_PUBLIC_KEY}`);
        }
      }
    } catch (err) {
      setPushState('default');
      alert(`Push error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const [isPasswordPanelOpen, setIsPasswordPanelOpen] = useState(false);
  const[isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    confirmPassword: '',
    currentPassword: '',
    newPassword: '',
  });
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const location = useLocation();
  const navigate = useNavigate();
  const visibleNavItems = isContractor
    ? contractorNavItems
    : navItems.filter((item) => {
        if (item.adminOnly) return isAdmin;
        if (isAdmin) return true;
        return item.feature ? repCanAccess(repAccess, item.feature) : true;
      });

  // Deep-link enforcement: a rep who types/bookmarks a URL for a section they're
  // no longer allowed into is bounced to the dashboard.
  useEffect(() => {
    if (!currentUser || isAdmin || isContractor) return;
    const feature = featureForPath(location.pathname);
    if (feature && !repCanAccess(repAccess, feature)) {
      navigate('/portal/dashboard', { replace: true });
    }
  }, [currentUser, isAdmin, isContractor, location.pathname, repAccess, navigate]);

  // Contractors can only ever be on their two scoped pages — anything else
  // (dashboard, deep links, etc.) bounces to their calendar.
  useEffect(() => {
    if (!currentUser || !isContractor) return;
    if (!location.pathname.startsWith('/portal/cx-')) {
      navigate('/portal/cx-calendar', { replace: true });
    }
  }, [currentUser, isContractor, location.pathname, navigate]);
  const mobilePrimaryHrefs = [
    '/portal/dashboard',
    '/portal/deals',
    '/portal/appointments',
    '/portal/contractors',
  ];
  const mobilePrimaryItems = isContractor
    ? visibleNavItems
    : mobilePrimaryHrefs
        .map((href) => visibleNavItems.find((item) => item.href === href))
        .filter((item): item is (typeof visibleNavItems)[number] => Boolean(item));
  const mobileMoreItems = isContractor
    ? []
    : visibleNavItems.filter((item) => !mobilePrimaryHrefs.includes(item.href));
  const isMoreRouteActive = mobileMoreItems.some((item) =>
    location.pathname.startsWith(item.href)
  );

  const handleLogout = () => {
    logout();
    navigate('/portal/login', { replace: true });
  };

  const closePasswordPanel = () => {
    setIsPasswordPanelOpen(false);
    setPasswordForm({
      confirmPassword: '',
      currentPassword: '',
      newPassword: '',
    });
    setPasswordMessage('');
    setPasswordStatus('idle');
  };

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser) return;

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus('error');
      setPasswordMessage('New password and confirmation must match.');
      return;
    }

    const result = await changeUserPassword(
      currentUser.id,
      passwordForm.currentPassword,
      passwordForm.newPassword,
      currentUser
    );
    if (!result.ok) {
      setPasswordStatus('error');
      setPasswordMessage(result.message ?? 'Password could not be changed.');
      return;
    }

    setPasswordStatus('success');
    setPasswordMessage('Password updated successfully.');
    setPasswordForm({
      confirmPassword: '',
      currentPassword: '',
      newPassword: '',
    });
  };

  const handleProfileImageUpload = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;
    event.target.value = '';

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Resize to max 200×200, keeping aspect ratio
        const MAX = 200;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        // Update store + auth context so sidebar updates immediately
        updateUser(currentUser.id, { avatarUrl: dataUrl }, currentUser);
        updateCurrentUser({ avatarUrl: dataUrl });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const profileAvatar = currentUser?.avatarUrl ? (
    <img
      src={currentUser.avatarUrl}
      alt={currentUser.name}
      className="h-full w-full object-cover"
    />
  ) : (
    currentUser?.avatarInitial
  );

  return (
    <div className="min-h-screen bg-[#eef3f8] text-slate-950">
      <div style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }} className="fixed inset-x-0 top-0 z-40 border-b border-white/65 bg-white/88 px-4 pb-3 pt-3 shadow-[0_10px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between">
          <img src="/logo.png" alt="OntarioReno" className="h-9 w-auto" />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:text-[#1B3C6C]"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
            <AdminActivityCenter variant="mobile" />
            <label className="relative flex h-10 w-10 cursor-pointer shrink-0 overflow-visible rounded-full">
              <span className="flex h-10 w-10 overflow-hidden rounded-full bg-[#f4c35a] text-[#071525]">
                <span className="flex h-full w-full items-center justify-center text-sm font-black">
                  {profileAvatar}
                </span>
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#1B3C6C] ring-1 ring-white">
                <Camera className="h-2.5 w-2.5 text-white" />
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageUpload}
                className="hidden"
              />
            </label>
            {(
              <button
                type="button"
                onClick={handleTogglePush}
                disabled={pushState === 'registering'}
                title={
                  pushState === 'granted'
                    ? 'Notifications on — tap to disable'
                    : pushState === 'denied'
                    ? 'Notifications blocked in browser settings'
                    : pushState === 'unsupported'
                    ? 'Add to Home Screen to enable push notifications'
                    : 'Enable push notifications'
                }
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition',
                  pushState === 'granted'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : pushState === 'denied' || pushState === 'unsupported'
                    ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                    : 'border-slate-200 bg-white text-slate-600 hover:text-[#1B3C6C]'
                )}
              >
                {pushState === 'granted' ? (
                  <Bell className="h-4 w-4" />
                ) : (
                  <BellOff className="h-4 w-4" />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:text-[#1B3C6C]"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[17.5rem] border-r border-white/70 bg-[#071525] px-5 py-6 text-white shadow-[18px_0_42px_rgba(7,21,37,0.12)] lg:block">
        <div className="flex h-full flex-col">
          <div>
            <div className="px-1 pt-1">
              <img src="/logo-sidebar.png" alt="OntarioReno" className="h-11 w-auto" />
            </div>
            <div className="mt-8 rounded-[0.5rem] border border-white/10 bg-white/[0.06] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/70">
                Broker Portal
              </p>
              <h1 className="mt-2 text-xl font-bold tracking-[-0.01em]">
                Sales command center
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="mt-4 flex w-full items-center gap-2 rounded-[0.5rem] border border-white/10 bg-white/[0.06] px-3.5 py-2.5 text-sm font-semibold text-blue-100/70 transition hover:bg-white/[0.1]"
            >
              <Search className="h-4 w-4" />
              <span className="flex-1 text-left">Search…</span>
              <span className="rounded border border-white/15 px-1.5 py-0.5 text-[0.6rem] font-bold text-blue-100/60">⌘K</span>
            </button>
          </div>

          <nav className="mt-7 space-y-1.5">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-[0.5rem] px-3.5 py-3 text-sm font-semibold transition',
                    isActive
                      ? 'bg-white text-[#102b4c] shadow-[0_14px_26px_rgba(0,0,0,0.14)]'
                      : 'text-blue-50/82 hover:bg-white/10 hover:text-white'
                  )
                }
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto rounded-[0.5rem] border border-white/10 bg-white/[0.06] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 overflow-hidden rounded-full bg-[#f4c35a] text-sm font-black text-[#071525]">
                <div className="flex h-full w-full items-center justify-center">
                  {profileAvatar}
                </div>
              </div>
              <div>
                <p className="text-sm font-bold">{currentUser?.name}</p>
                <p className="text-xs font-medium text-blue-100/70">
                  {currentUser?.role === 'admin' ? 'Admin' : 'Sales Rep'}
                </p>
              </div>
            </div>
            <label className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-[0.5rem] border border-white/12 bg-white/8 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/14">
              <Camera className="h-4 w-4" />
              Upload profile image
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageUpload}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={() => setIsPasswordPanelOpen(true)}
              className="mt-2 flex w-full items-center justify-center rounded-[0.5rem] border border-white/12 bg-white/8 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/14"
            >
              Change password
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-[0.5rem] border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 5rem)' }}
        className="min-h-screen px-4 pb-24 sm:px-6 lg:ml-[17.5rem] lg:px-8 lg:pb-10 lg:pt-8 xl:px-10 2xl:px-12"
      >
        {/* Full-width content with comfortable gutters — consistent across every
            page so navigation never jumps. */}
        <div className="w-full">
          {loadError && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[0.6rem] border border-red-300 bg-red-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
                <p className="text-sm font-bold text-red-800">
                  Some data couldn&rsquo;t be loaded. Your records are safe — this is a temporary loading problem, not data loss.
                </p>
              </div>
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-[0.5rem] bg-red-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}
          <div className="mb-6 hidden items-center justify-between lg:flex">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#32639b]">
                Private access
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.02em] text-slate-950">
                OntarioReno Broker Portal
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <AdminActivityCenter variant="desktop" />
              <div className="flex items-center gap-2 rounded-full border border-white bg-white px-4 py-2 shadow-sm">
                <BarChart3 className="h-4 w-4 text-[#1B3C6C]" />
                <span className="text-sm font-semibold text-slate-700">
                  Broker Portal Beta
                </span>
              </div>
            </div>
          </div>
          <Outlet />
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/94 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.45rem)] pt-2 shadow-[0_-12px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {mobilePrimaryItems.map((item) => {
            const showBadge = item.href === '/portal/appointments' && needsAttentionCount > 0;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => setIsMoreMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-[0.5rem] px-0.5 text-[0.63rem] font-bold leading-none transition sm:text-[0.68rem]',
                    isActive
                      ? 'bg-[#e8f1fb] text-[#1B3C6C]'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-[#1B3C6C]'
                  )
                }
              >
                <span className="relative">
                  <item.icon className="h-4.5 w-4.5" />
                  {showBadge && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[0.5rem] font-black text-white ring-1 ring-white">
                      {needsAttentionCount > 9 ? '9+' : needsAttentionCount}
                    </span>
                  )}
                </span>
                <span>{item.mobileLabel ?? item.label}</span>
              </NavLink>
            );
          })}
          <button
            type="button"
            onClick={() => setIsMoreMenuOpen((current) => !current)}
            className={cn(
              'flex min-h-14 flex-col items-center justify-center gap-1 rounded-[0.5rem] px-0.5 text-[0.63rem] font-bold leading-none transition sm:text-[0.68rem]',
              isMoreRouteActive || isMoreMenuOpen
                ? 'bg-[#e8f1fb] text-[#1B3C6C]'
                : 'text-slate-500 hover:bg-slate-50 hover:text-[#1B3C6C]'
            )}
            aria-expanded={isMoreMenuOpen}
            aria-controls="portal-mobile-more-menu"
          >
            <MoreHorizontal className="h-4.5 w-4.5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {isMoreMenuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 h-full w-full bg-slate-950/30 backdrop-blur-[2px] lg:hidden"
            onClick={() => setIsMoreMenuOpen(false)}
            aria-label="Close more navigation"
          />
          <div
            id="portal-mobile-more-menu"
            className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+5.35rem)] z-50 mx-auto max-w-lg overflow-hidden rounded-[0.5rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.24)] lg:hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#32639b]">
                  More
                </p>
                <p className="text-sm font-black text-slate-950">
                  Portal sections
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                aria-label="Close more menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-1 p-2">
              {mobileMoreItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMoreMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-[0.5rem] px-3.5 py-3.5 text-sm font-bold transition',
                      isActive
                        ? 'bg-[#e8f1fb] text-[#1B3C6C]'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-[#1B3C6C]'
                    )
                  }
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-[0.5rem] bg-slate-100 text-[#1B3C6C]">
                    <item.icon className="h-4.5 w-4.5" />
                  </span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </>
      )}

      {isPasswordPanelOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/45 p-0 backdrop-blur-sm sm:p-5">
          <div className="ml-auto flex h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,23,42,0.25)] sm:rounded-[0.5rem]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 pb-5" style={{ paddingTop: 'max(1.25rem, calc(1.25rem + env(safe-area-inset-top, 0px)))' }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
                  Profile Security
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
                  Change password
                </h2>
              </div>
              <button
                type="button"
                onClick={closePasswordPanel}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                aria-label="Close password panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handlePasswordChange} className="grid gap-4 p-5">
              <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                Current Password
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      currentPassword: event.target.value,
                    }))
                  }
                  autoComplete="current-password"
                  required
                />
              </label>
              <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                New Password
                <input
                  type="password"
                  minLength={8}
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      newPassword: event.target.value,
                    }))
                  }
                  autoComplete="new-password"
                  required
                />
              </label>
              <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                Confirm New Password
                <input
                  type="password"
                  minLength={8}
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }))
                  }
                  autoComplete="new-password"
                  required
                />
              </label>
              {passwordMessage && (
                <p className={`rounded-[0.5rem] border px-3 py-2 text-sm font-bold ${
                  passwordStatus === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}>
                  {passwordMessage}
                </p>
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closePasswordPanel}
                  className="rounded-[0.5rem] border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-[0.5rem] bg-[#1B3C6C] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#153158]"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <Toaster />
    </div>
  );
}
