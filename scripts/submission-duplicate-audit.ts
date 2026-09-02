/**
 * READ-ONLY audit: duplicate consultation-flow submissions. Writes NOTHING.
 *
 *   DATABASE_URL='<neon url>' npx tsx scripts/submission-duplicate-audit.ts
 *
 * Why this exists: `flow=submit` creates a Lead unconditionally — it is the one
 * intake path in api/leads that does not go through findExistingLead. So every
 * POST that reaches it becomes another row in the Submissions log, and one
 * homeowner can appear four times for a single visit to the form.
 *
 * The fix depends on WHY the form posted more than once, and the only thing
 * that separates the causes is the gap between the rows:
 *
 *   seconds apart      → one visit, posted repeatedly. Either a double-tap that
 *                        beat the disabled button, or — far more likely — the
 *                        availability call after a successful submit failed, the
 *                        homeowner saw an error on a form that had ALREADY
 *                        created their lead, and pressed the button again.
 *   minutes apart      → same, with the homeowner reading the error first.
 *   hours/days apart   → a genuine second visit to the form. Still worth
 *                        merging, but nothing is broken.
 *
 * So this prints every cluster with the gaps, and does not guess.
 *
 * Required env: DATABASE_URL
 */
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

function pad(s: string, n: number): string {
  const v = s.length > n ? s.slice(0, n - 1) + '…' : s;
  return v + ' '.repeat(Math.max(0, n - v.length));
}

/** Last 10 digits, matching phoneKey in src/portal/data/clientLinks.ts. */
function phoneKey(value: string | null | undefined): string {
  const digits = (value ?? '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : '';
}

function emailKey(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

/** A gap, in the units a person reading this actually thinks in. */
function gap(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 90) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 90) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

/**
 * How to read a cluster's tightest gap. Deliberately three buckets and no
 * verdict beyond them — this script reports, a person decides.
 */
function verdict(tightestMs: number): string {
  if (tightestMs <= 120_000) return 'SAME VISIT — the form posted more than once';
  if (tightestMs <= 60 * 60_000) return 'same session, minutes apart';
  return 'separate visits';
}

export async function runSubmissionDuplicateAudit(): Promise<void> {
  const { prisma } = await import('../lib/prisma.js');

  const leads = await prisma.lead.findMany({
    where: { source: 'consultation_flow' },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      address: true,
      createdAt: true,
      routingOutcome: true,
      appointmentId: true,
      programKey: true,
      sourceDetail: true,
      addressResolutionCause: true,
      deletedAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`\nConsultation-flow submissions: ${leads.length}`);

  // Cluster on the same keys the rest of the codebase identifies a person by:
  // the phone first, then the email. Name is deliberately not matched — two
  // homeowners share a common name far too often.
  const clusters = new Map<string, typeof leads>();
  for (const lead of leads) {
    const key = phoneKey(lead.phone) || emailKey(lead.email);
    // No usable identifier: it cannot be deduped and it cannot be counted as a
    // duplicate of anything. Left out rather than lumped under a blank key,
    // which would report every one of them as duplicates of each other.
    if (!key) continue;
    const bucket = clusters.get(key);
    if (bucket) bucket.push(lead);
    else clusters.set(key, [lead]);
  }

  const dupes = [...clusters.entries()]
    .filter(([, rows]) => rows.length > 1)
    .map(([key, rows]) => {
      let tightest = Infinity;
      for (let i = 1; i < rows.length; i++) {
        tightest = Math.min(tightest, rows[i].createdAt.getTime() - rows[i - 1].createdAt.getTime());
      }
      return { key, rows, tightest };
    })
    .sort((a, b) => a.tightest - b.tightest);

  const extraRows = dupes.reduce((n, d) => n + d.rows.length - 1, 0);
  const sameVisit = dupes.filter((d) => d.tightest <= 120_000);

  console.log(`People with more than one submission: ${dupes.length}`);
  console.log(`Extra rows in the log because of it:  ${extraRows}`);
  console.log(`Clusters posted within 2 minutes:     ${sameVisit.length}  ← the bug, if this is not 0`);

  const header =
    pad('CREATED (UTC)', 22) + pad('GAP', 7) + pad('NAME', 20) +
    pad('OUTCOME', 17) + pad('BOOKED?', 9) + pad('PROGRAM', 14) + 'ADDRESS CAUSE';

  console.log('\n=== Clusters, tightest gap first ===');
  if (dupes.length === 0) console.log('  none');
  for (const d of dupes) {
    const first = d.rows[0];
    console.log(
      `\n  ${first.name || '—'}  ·  ${first.phone || first.email || '—'}  ·  ` +
      `${d.rows.length} submissions  ·  tightest gap ${gap(d.tightest)}  →  ${verdict(d.tightest)}`
    );
    console.log('  ' + header);
    d.rows.forEach((r, i) => {
      const delta = i === 0 ? '—' : gap(r.createdAt.getTime() - d.rows[i - 1].createdAt.getTime());
      console.log(
        '  ' +
        pad(r.createdAt.toISOString().replace('T', ' ').slice(0, 19), 22) +
        pad(delta, 7) +
        pad(r.name || '—', 20) +
        pad(r.routingOutcome || '—', 17) +
        pad(r.appointmentId ? 'booked' : '—', 9) +
        pad(r.programKey || '—', 14) +
        (r.addressResolutionCause || '—') +
        (r.deletedAt ? '  [trashed]' : '')
      );
    });
  }

  // ── What the same-visit clusters have in common ──
  // If the repeats are the availability call failing, the EARLIER rows in a
  // cluster are the ones with no appointment and the LAST is the booked one.
  // That shape is the signature, so it is counted rather than left to the eye.
  const trailingBooked = sameVisit.filter(
    (d) => !d.rows.slice(0, -1).some((r) => r.appointmentId) && !!d.rows[d.rows.length - 1].appointmentId
  );
  console.log('\n=== Shape of the same-visit clusters ===');
  console.log(`  Only the LAST row booked:            ${trailingBooked.length} of ${sameVisit.length}`);
  console.log('  That shape means the homeowner kept pressing the button until it worked,');
  console.log('  and every earlier press had already created a lead.');

  console.log('');
}

if (process.argv[1] && process.argv[1].includes('submission-duplicate-audit')) {
  runSubmissionDuplicateAudit()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
