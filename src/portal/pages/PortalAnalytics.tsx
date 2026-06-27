import { Link, useLocation } from 'react-router-dom';
import PortalPerformance from './PortalPerformance';
import PortalSalesTracker from './PortalSalesTracker';
import PortalLeaderboard from './PortalLeaderboard';
import PortalCommissions from './PortalCommissions';

// One hub for all the "how am I doing / money" views. Each tab is its own route
// (so deep links, refresh and back/forward keep working), and only the active
// tab's page actually renders.
const TABS = [
  { key: 'overview', label: 'Overview', path: '/portal/performance' },
  { key: 'sales', label: 'My Sales', path: '/portal/sales-tracker' },
  { key: 'leaderboard', label: 'Leaderboard', path: '/portal/leaderboard' },
  { key: 'commissions', label: 'Commissions', path: '/portal/commissions' },
] as const;

export default function PortalAnalytics() {
  const location = useLocation();
  const active = TABS.find((t) => t.path === location.pathname)?.key ?? 'overview';

  return (
    <div className="space-y-5">
      <div className="-mx-1 flex gap-1 overflow-x-auto rounded-[0.6rem] border border-slate-200 bg-white p-1 shadow-sm">
        {TABS.map((t) => (
          <Link
            key={t.key}
            to={t.path}
            className={`shrink-0 rounded-[0.5rem] px-4 py-2 text-sm font-bold transition ${
              active === t.key ? 'bg-[#1B3C6C] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {active === 'overview' && <PortalPerformance />}
      {active === 'sales' && <PortalSalesTracker />}
      {active === 'leaderboard' && <PortalLeaderboard />}
      {active === 'commissions' && <PortalCommissions />}
    </div>
  );
}
