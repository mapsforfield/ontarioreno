/**
 * Safety net: fails if a portal feature silently disappears.
 *
 * The Contract Creator was lost once already — not by anyone deleting it, but by
 * a merge between diverging branches that resolved in favour of the side without
 * it. Nothing caught it, so it stayed gone until a rep noticed the page missing.
 *
 * This test asserts every shipped portal feature still has its three pieces:
 * the page file, the route in App.tsx, and the sidebar link in PortalLayout.
 * Removing any one of them turns CI red on the pull request instead of in
 * production.
 *
 * Deliberately retiring a feature? Delete its entry here in the same commit.
 * That makes the removal a visible, intentional line in the diff.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (rel: string) => readFileSync(join(repoRoot, rel), 'utf8');

type PortalFeature = {
  /**
   * Sidebar label exactly as a rep sees it, or null for a page that is
   * deliberately reachable by URL only. Null still checks the page and the
   * route — it only stops asserting a sidebar link that is not meant to exist.
   */
  navLabel: string | null;
  /** Route segment under /portal in App.tsx. */
  route: string;
  /** Page component file, repo-relative. */
  page: string;
  /** Component name imported by App.tsx. */
  component: string;
};

const PORTAL_FEATURES: PortalFeature[] = [
  { navLabel: 'Dashboard', route: 'dashboard', page: 'src/portal/pages/PortalDashboard.tsx', component: 'PortalDashboard' },
  { navLabel: 'Contractors', route: 'contractors', page: 'src/portal/pages/PortalContractors.tsx', component: 'PortalContractors' },
  { navLabel: 'Deals', route: 'deals', page: 'src/portal/pages/PortalDeals.tsx', component: 'PortalDeals' },
  { navLabel: 'Contracts', route: 'contracts', page: 'src/portal/pages/PortalContracts.tsx', component: 'PortalContracts' },
  { navLabel: 'Clients', route: 'clients', page: 'src/portal/pages/PortalClients.tsx', component: 'PortalClients' },
  { navLabel: 'Tasks', route: 'tasks', page: 'src/portal/pages/PortalTasks.tsx', component: 'PortalTasks' },
  { navLabel: 'Financing', route: 'financing', page: 'src/portal/pages/PortalFinancing.tsx', component: 'PortalFinancing' },
  { navLabel: 'Performance', route: 'performance', page: 'src/portal/pages/PortalAnalytics.tsx', component: 'PortalAnalytics' },
  { navLabel: 'Call Queue', route: 'workspace', page: 'src/portal/pages/PortalWorkspace.tsx', component: 'PortalWorkspace' },
  { navLabel: 'Conversations', route: 'conversations', page: 'src/portal/pages/PortalConversations.tsx', component: 'PortalConversations' },
  { navLabel: 'Submissions', route: 'submissions', page: 'src/portal/pages/PortalSubmissions.tsx', component: 'PortalSubmissions' },
  { navLabel: 'Invoices', route: 'invoices', page: 'src/portal/pages/PortalInvoices.tsx', component: 'PortalInvoices' },
  { navLabel: 'Admin', route: 'admin', page: 'src/portal/pages/PortalAdmin.tsx', component: 'PortalAdmin' },
  // Consultations is the biggest page in the portal and was not listed here
  // until the August 2026 audit — the guard has never covered the calendar the
  // whole business runs on.
  { navLabel: 'Consultations', route: 'appointments', page: 'src/portal/pages/PortalAppointments.tsx', component: 'PortalAppointments' },
  // The contractor accounts' entire portal: two read-only pages behind their
  // own sidebar (contractorNavItems in PortalLayout).
  { navLabel: 'Calendar', route: 'cx-calendar', page: 'src/portal/pages/ContractorCalendar.tsx', component: 'ContractorCalendar' },
  { navLabel: 'Clients', route: 'cx-clients', page: 'src/portal/pages/ContractorClients.tsx', component: 'ContractorClients' },
  // Grant Radar's admin review queue. Routed and admin-guarded, with no
  // sidebar link — an admin reaches it by typing the URL. That is the state it
  // shipped in; listing it with navLabel: null protects the page and the route
  // without asserting a link that does not exist. If a link is ever added,
  // change this to 'Grants'.
  { navLabel: null, route: 'grants', page: 'src/portal/pages/PortalGrants.tsx', component: 'PortalGrants' },
];

/** Supporting modules with no route of their own, but a feature dies without them. */
const REQUIRED_MODULES = [
  'src/portal/data/contractTemplates.ts',
  'src/portal/data/scopePresets.ts',
  'src/portal/data/smsTemplates.ts',
  'src/portal/lib/contractPdf.ts',
  'src/portal/lib/contractFonts.ts',
  'src/portal/lib/brandColor.ts',
  // Both invoice generators. The commission one is reachable only from a Deal,
  // so it has no route of its own to protect it.
  'src/portal/components/CommissionInvoice.tsx',
  'src/portal/components/ClientInvoice.tsx',
];

const app = read('src/App.tsx');
const layout = read('src/portal/components/PortalLayout.tsx');

for (const feature of PORTAL_FEATURES) {
  test(`portal feature "${feature.navLabel ?? feature.route}" is still wired up`, () => {
    const source = read(feature.page);
    assert.ok(
      source.trim().length > 0,
      `${feature.page} is empty — the "${feature.navLabel}" page has no content.`,
    );

    // Either form counts as wired up: a static `import X from './...'` or a
    // `const X = lazy(() => import('./...'))`. The portal pages are lazy so
    // they stay out of the bundle a homeowner downloads; asserting only the
    // static form would have made that split look like a deletion.
    //
    // assert.ok rather than assert.match: a failed match dumps all of App.tsx
    // into the CI log, burying the one line that says what broke.
    const imported =
      new RegExp(`import\\s+${feature.component}\\s+from`).test(app) ||
      new RegExp(`const\\s+${feature.component}\\s*=\\s*lazy\\(`).test(app);
    assert.ok(
      imported,
      `App.tsx no longer imports ${feature.component}. The "${feature.navLabel}" page exists but nothing loads it.`,
    );

    assert.ok(
      new RegExp(`<Route\\s+path="${feature.route}"`).test(app),
      `App.tsx has no route for /portal/${feature.route} — "${feature.navLabel}" is unreachable by URL.`,
    );

    if (feature.navLabel !== null) {
      assert.ok(
        layout.includes(`href: '/portal/${feature.route}'`),
        `PortalLayout has no sidebar link to /portal/${feature.route} — reps cannot reach "${feature.navLabel}".`,
      );

      assert.ok(
        layout.includes(`label: '${feature.navLabel}'`),
        `The sidebar label "${feature.navLabel}" is gone from PortalLayout.`,
      );
    }
  });
}

test('supporting portal modules are present and non-empty', () => {
  for (const rel of REQUIRED_MODULES) {
    let source: string;
    try {
      source = read(rel);
    } catch {
      assert.fail(`${rel} is missing — a portal feature depends on it.`);
    }
    assert.ok(source.trim().length > 0, `${rel} is empty.`);
  }
});
