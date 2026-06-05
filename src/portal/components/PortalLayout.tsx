import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Gauge,
  HandCoins,
  LogOut,
  ShieldCheck,
  Trophy,
} from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { usePortalAuth } from '../auth';

const navItems = [
  { label: 'Dashboard', href: '/portal/dashboard', icon: Gauge },
  { label: 'Contractors', href: '/portal/contractors', icon: Building2 },
  { label: 'Deals', href: '/portal/deals', icon: BriefcaseBusiness },
  { label: 'Leaderboard', href: '/portal/leaderboard', icon: Trophy },
  { label: 'Commissions', href: '/portal/commissions', icon: HandCoins },
  { label: 'Admin', href: '/portal/admin', icon: ShieldCheck, adminOnly: true },
];

export default function PortalLayout() {
  const { currentUser, isAdmin, logout } = usePortalAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);
  const wideWorkspaceRoutes = [
    '/portal/admin',
    '/portal/commissions',
    '/portal/contractors',
    '/portal/deals',
  ];
  const isWideWorkspace = wideWorkspaceRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  const handleLogout = () => {
    logout();
    navigate('/portal/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#eef3f8] text-slate-950">
      <div className="fixed inset-x-0 top-0 z-40 border-b border-white/65 bg-white/88 px-4 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between">
          <img src="/logo.png" alt="OntarioReno" className="h-9 w-auto" />
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[#b9cbe0] bg-[#f8fbff] px-3 py-1 text-xs font-semibold text-[#1B3C6C]">
              {currentUser?.name}
            </span>
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
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4c35a] text-sm font-black text-[#071525]">
                {currentUser?.avatarInitial}
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
          </div>
        </div>
      </aside>

      <main className="min-h-screen px-4 pb-28 pt-20 sm:px-6 lg:ml-[17.5rem] lg:px-8 lg:pb-10 lg:pt-8">
        <div
          className={cn(
            'mx-auto w-full',
            isWideWorkspace ? 'max-w-[100rem]' : 'max-w-6xl'
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
        <div
          className="mx-auto grid max-w-lg gap-1"
          style={{
            gridTemplateColumns: `repeat(${visibleNavItems.length}, minmax(0, 1fr))`,
          }}
        >
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 rounded-[0.5rem] px-1 text-[0.66rem] font-bold transition',
                  isActive
                    ? 'bg-[#e8f1fb] text-[#1B3C6C]'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-[#1B3C6C]'
                )
              }
            >
              <item.icon className="h-4.5 w-4.5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
