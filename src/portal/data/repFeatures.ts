// Portal sections whose rep access the admin can toggle (Admin → Rep access).
// Invoice generation and commission-rate visibility are deliberately NOT here —
// they remain hard-locked to admins regardless of these toggles.

export type RepFeatureKey =
  | 'workspace'
  | 'contractors'
  | 'deals'
  | 'contracts'
  | 'consultations'
  | 'clients'
  | 'tasks'
  | 'financing'
  | 'analytics';

export const REP_FEATURES: Array<{ key: RepFeatureKey; label: string; description: string }> = [
  { key: 'workspace', label: 'Call Queue', description: 'Sales Workspace — work the lead call queue' },
  { key: 'contractors', label: 'Contractors', description: 'View the contractor directory' },
  { key: 'deals', label: 'Deals', description: 'The deal pipeline' },
  { key: 'contracts', label: 'Contracts', description: 'Generate branded sales agreements' },
  { key: 'consultations', label: 'Consultations', description: 'The consultation calendar' },
  { key: 'clients', label: 'Clients', description: 'Client profiles' },
  { key: 'tasks', label: 'Tasks', description: 'Personal to-do list' },
  { key: 'financing', label: 'Financing', description: 'Financing tools' },
  { key: 'analytics', label: 'Performance', description: 'Performance, leaderboard & their own commissions' },
];

/** Access map is stored as { [key]: boolean }. Missing/true = allowed (default open). */
export function repCanAccess(access: Record<string, boolean> | undefined, key: string): boolean {
  return access?.[key] !== false;
}

/** Which toggleable feature a portal path belongs to (for deep-link enforcement). */
export function featureForPath(pathname: string): RepFeatureKey | null {
  if (pathname.startsWith('/portal/workspace')) return 'workspace';
  if (pathname.startsWith('/portal/contractors')) return 'contractors';
  if (pathname.startsWith('/portal/deals')) return 'deals';
  if (pathname.startsWith('/portal/contracts')) return 'contracts';
  if (pathname.startsWith('/portal/appointments')) return 'consultations';
  if (pathname.startsWith('/portal/clients')) return 'clients';
  if (pathname.startsWith('/portal/tasks')) return 'tasks';
  if (pathname.startsWith('/portal/financing')) return 'financing';
  if (
    pathname.startsWith('/portal/performance') ||
    pathname.startsWith('/portal/leaderboard') ||
    pathname.startsWith('/portal/commissions') ||
    pathname.startsWith('/portal/sales-tracker')
  ) {
    return 'analytics';
  }
  return null;
}
