import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CreditCard,
  Gauge,
  HandCoins,
  LineChart,
  LogOut,
  MoreHorizontal,
  ShieldCheck,
  Trophy,
  X,
} from 'lucide-react';
import { ChangeEvent, FormEvent, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { usePortalAuth } from '../auth';
import { usePortalData } from '../data/store';

const navItems = [
  { label: 'Dashboard', href: '/portal/dashboard', icon: Gauge },
  { label: 'Contractors', href: '/portal/contractors', icon: Building2 },
  { label: 'Deals', href: '/portal/deals', icon: BriefcaseBusiness },
  {
    label: 'Consultations',
    mobileLabel: 'Consults',
    href: '/portal/appointments',
    icon: CalendarDays,
  },
  { label: 'Financing', href: '/portal/financing', icon: CreditCard },
  { label: 'Performance', href: '/portal/performance', icon: LineChart },
  { label: 'Leaderboard', href: '/portal/leaderboard', icon: Trophy },
  { label: 'Commissions', href: '/portal/commissions', icon: HandCoins },
  { label: 'Admin', href: '/portal/admin', icon: ShieldCheck, adminOnly: true },
];

export default function PortalLayout() {
  const { currentUser, isAdmin, logout } = usePortalAuth();
  const { changeUserPassword, updateUser } = usePortalData();
  const [isPasswordPanelOpen, setIsPasswordPanelOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    confirmPassword: '',
    currentPassword: '',
    newPassword: '',
  });
  const [passwordMessage, setPasswordMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);
  const mobilePrimaryHrefs = [
    '/portal/dashboard',
    '/portal/deals',
    '/portal/appointments',
    '/portal/contractors',
  ];
  const mobilePrimaryItems = mobilePrimaryHrefs
    .map((href) => visibleNavItems.find((item) => item.href === href))
    .filter((item): item is (typeof visibleNavItems)[number] => Boolean(item));
  const mobileMoreItems = visibleNavItems.filter(
    (item) => !mobilePrimaryHrefs.includes(item.href)
  );
  const isMoreRouteActive = mobileMoreItems.some((item) =>
    location.pathname.startsWith(item.href)
  );
  const wideWorkspaceRoutes = [
    '/portal/admin',
    '/portal/appointments',
    '/portal/commissions',
    '/portal/contractors',
    '/portal/deals',
    '/portal/financing',
    '/portal/performance',
  ];
  const isWideWorkspace = wideWorkspaceRoutes.some((route) =>
    location.pathname.startsWith(route)
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
  };

  const handlePasswordChange = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser) return;

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage('New password and confirmation must match.');
      return;
    }

    const result = changeUserPassword(
      currentUser.id,
      passwordForm.currentPassword,
      passwordForm.newPassword,
      currentUser
    );
    if (!result.ok) {
      setPasswordMessage(result.message ?? 'Password could not be changed.');
      return;
    }

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

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateUser(currentUser.id, { avatarUrl: reader.result }, currentUser);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
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
      <div className="fixed inset-x-0 top-0 z-40 border-b border-white/65 bg-white/88 px-4 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between">
          <img src="/logo.png" alt="OntarioReno" className="h-9 w-auto" />
          <div className="flex items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-[#b9cbe0] bg-[#f8fbff] py-1 pl-1 pr-3 text-xs font-semibold text-[#1B3C6C]">
              <span className="flex h-7 w-7 overflow-hidden rounded-full bg-[#f4c35a] text-[#071525]">
                <span className="flex h-full w-full items-center justify-center text-xs font-black">
                  {profileAvatar}
                </span>
              </span>
              {currentUser?.name}
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageUpload}
                className="hidden"
              />
            </label>
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
            <div className="rounded-[0.5rem] bg-white px-4 py-3">
              <img src="/logo.png" alt="OntarioReno" className="h-10 w-auto" />
            </div>
            <div className="mt-7 rounded-[0.5rem] border border-white/10 bg-white/[0.06] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/70">
                Broker Portal
              </p>
              <h1 className="mt-2 text-xl font-bold tracking-[-0.01em]">
                Sales command center
              </h1>
            </div>
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
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-[0.5rem] border border-white/12 bg-white/8 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/14"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
            <label className="mt-2 flex w-full cursor-pointer items-center justify-center rounded-[0.5rem] border border-white/12 bg-white/8 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/14">
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
          </div>
        </div>
      </aside>

      <main
        className={cn(
          'min-h-screen px-4 pb-32 pt-20 sm:px-6 lg:ml-[17.5rem] lg:pb-10 lg:pt-8',
          isWideWorkspace ? 'lg:px-6 xl:px-8 2xl:px-10' : 'lg:px-8'
        )}
      >
        <div
          className={cn(
            'mx-auto w-full',
            isWideWorkspace ? 'max-w-none' : 'max-w-6xl'
          )}
        >
          <div className="mb-6 hidden items-center justify-between lg:flex">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#32639b]">
                Private access
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.02em] text-slate-950">
                OntarioReno Broker Portal
              </h2>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white bg-white px-4 py-2 shadow-sm">
              <BarChart3 className="h-4 w-4 text-[#1B3C6C]" />
              <span className="text-sm font-semibold text-slate-700">
                Broker Portal Beta
              </span>
            </div>
          </div>
          <Outlet />
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/94 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.45rem)] pt-2 shadow-[0_-12px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {mobilePrimaryItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => setIsMoreMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 rounded-[0.5rem] px-0.5 text-[0.63rem] font-bold leading-none transition sm:text-[0.68rem]',
                  isActive
                    ? 'bg-[#e8f1fb] text-[#1B3C6C]'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-[#1B3C6C]'
                )
              }
            >
              <item.icon className="h-4.5 w-4.5" />
              <span>{item.mobileLabel ?? item.label}</span>
            </NavLink>
          ))}
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
                      'flex items-center gap-3 rounded-[0.5rem] px-3.5 py-3 text-sm font-bold transition',
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
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
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
                X
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
                <p className="rounded-[0.5rem] border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
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
    </div>
  );
}
