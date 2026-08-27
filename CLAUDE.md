# OntarioReno — working notes

Lead-gen site + broker portal for Ontario homeowner renovation grants.
React SPA (Vite) on Vercel, Prisma + Neon Postgres, serverless API under `api/`.

## The rule that matters most: changes are ADDITIVE

Features here have been lost before — the Contract Creator disappeared in a merge
that resolved in favour of the side without it, and nobody noticed until a rep
found the page missing. Assume anything you did not personally write is load
bearing.

- **Never delete or replace a feature to make room for a new one.** Add alongside.
- **Never "clean up" a page, route, or sidebar entry** you were not asked to touch.
- If something looks like dead code, say so and let the user decide. Do not remove it.
- Retiring something deliberately? Delete its entry from the inventory tests in the
  same commit, so the removal is a visible line in the diff.

## Before you push

```bash
npm run lint    # tsc --noEmit
npm test        # includes the inventory + integrity guards below
npm run build   # schema:check + prisma + vite
```

CI (`.github/workflows/ci.yml`) runs lint + test, but has been unreliable on pull
requests — GitHub Actions in this repo intermittently returns HTTP 500 on dispatch
and cancels queued jobs before they start. **A red or missing check is not proof
of a real failure; open the job and confirm steps actually ran.** Run the commands
locally either way.

Work on a branch and merge via PR. `main` deploys to production on push, and
`main` is not currently branch-protected.

## The guard tests — do not weaken these

| File | Protects |
|---|---|
| `src/portal/data/portal-inventory.test.ts` | Every portal feature still has its page + route + sidebar link |
| `lib/grant-integrity.test.ts` | The grant invariants below |
| `lib/grant-closure.test.ts` | Closure-signal and deadline parsing |

If one of these fails, something real broke. Fix the code, not the test.

## Grant Radar — how it works and what must stay true

Two jobs run on GitHub Actions (`scripts/grant-radar-worker.ts`), not Vercel:
weekly `discover` (Tavily search for new city pages) and nightly `scan` (re-fetch
known pages, re-extract on change, **check published programs for closure**).
Also `backfill`, `deadlines`, and read-only `audit` modes.

**Publishing a program IS enrolling it in the re-scan.** This is the invariant.
The original bug was two sets that drifted: the scanner walked *sources* it had
discovered, while `/grants` renders *programs* an admin approved. A source
deactivated by a later re-classification took its published programs out of the
scan permanently, and a closed program sat on the public page until a rep caught
it by hand.

So:
- Any new path that makes a program public **must** call `enrollProgramInRescan`.
- The monitor scans active sources **∪** watched programs' sources. Do not narrow
  it back to `active: true`.
- Closure checks run **before** the fetch-error early-continue and **before** the
  content-hash short-circuit. Moving them after either one restores the old bug.
- Only a passed deadline may change the public page automatically. Every other
  signal is flagged for human confirmation — false positives pull live programs
  off the public site.

Verify the gap is closed at any time:

```bash
DATABASE_URL='<neon url>' npx tsx scripts/grant-watch-audit.ts
```

`NOT enrolled` must read 0.

### Closure detection is tuned for precision, not reach

`lib/grant-closure.ts`. A false positive pulls a live program off the public
page, so patterns are deliberately narrow and every signal carries the phrase
that triggered it. Real cases already caught in testing — keep them passing:

- `"will close once the budget is committed"` — live, not closed
- `"open until funds are exhausted"` — live, not closed
- `"Launched January 15, 2025"` — a START date, not a deadline
- `"March 6, 2025 (applications open)"` — also a start date
- `"Funding is available until the program budget is exhausted, and applications
  are reviewed on a first-come, first-served basis"` — an allocation RULE, live

That last pair matters: a start date read as a deadline auto-downgraded three
live programs on the public site before it was caught.

## Curated pages — the known weak spot

Four cities render from **hardcoded** lists rather than scanned data, so the
scanner does not watch them and a closure there is found by hand:

Hamilton · St. Catharines · Burlington · Barrie

Their status lives in **two places that are not wired together**:

1. `CURATED_PAGES` in `lib/grants.ts` — the `/grants` hub row
2. `grantSections` in `src/components/Navbar.tsx` — the Grants dropdown

**Change both, or the nav and the hub will tell a visitor different things.**
`lib/grant-integrity.test.ts` fails if they disagree.

Currently closed: **Hamilton** and **St. Catharines** (both confirmed August 6,
2026). Closure copy for hand-built pages lives in `src/lib/programClosures.ts`.

Folding these four into the scanner's watch list is the outstanding fix — the
detector already catches Hamilton's exact wording, it just never looks at these
rows. The user has chosen to flag them manually for now.

## Remote (virtual) consultations — what must stay true

Some cities are real business and a bad drive. `lib/remote-consultation.ts` lists
them (**Windsor · Niagara Falls · Thorold**); adding a city there is the whole
change, everything downstream reads that list.

A remote booking is **inert in both directions** — see the header of
`lib/scheduling.ts`. It does not anchor the same-day travel radius, is not
measured against it, neither sets nor respects the scheduling-area lock, does
not consume a fixed start, and carries no weight in the daily cap or in rep
assignment. Days off are the one rule it still obeys.

That is the point of the feature, not an oversight. The original bug: one
Niagara Falls lead taken as the first appointment of a day anchored that rep's
travel radius on Niagara Falls, so the next three leads were ineligible for them
and fell to the other rep — a full day of capacity lost to a lead nobody drove
to.

- `Appointment.remoteConsultation` is **the** scheduling source of truth. The
  `appointmentType` shown in the portal (`video_consultation`) is derived from
  it at booking time. **Never read `appointmentType` to make a scheduling
  decision** — a rep changing that dropdown must not re-anchor anyone's day.
- Every constraint funnels through `constrainingAppointments()`. Keep it that
  way; a rule that filters remote rows by hand is a rule that will drift.
- A remote booking must never be described as a visit. `consultationMode` goes
  to `'phone'` for these, and the confirmation, the SMS, both reminders and the
  calendar entry all branch on it. Known gap: appointments **hand-created in the
  portal** do not set `remoteConsultation` — only the public flow and
  `book_lead` do.

Guarded by `lib/remote-consultation.test.ts` and the remote section at the end
of `lib/scheduling.test.ts`, including the Wednesday regression.

`remoteConsultation` defaults to false, so every row written before the feature
shipped reads as an in-person visit. A **future** booking in a remote city that
is still unflagged keeps anchoring that rep's travel radius. Check at any time:

```bash
DATABASE_URL='<neon url>' npx tsx scripts/remote-consultation-audit.ts
```

`FUTURE + active + NOT flagged` must read 0. The script is read-only.

## Public-facing copy: never advertise money that isn't there

A homeowner who books an in-home visit for a closed grant loses an afternoon and
we lose the trust.

- A closed program's page gets `ProgramClosedNotice` **above the hero** — heroes
  lead with "$40,000", and a caveat further down is one the reader has already
  been misled past.
- Remove booking CTAs (`/consultation/...`) from closed programs' pages, and
  point them at `/grants` rather than dead-ending. The page should still convert.
- Never state an amount, deadline, or status that is not on the official source.

## Notifications

Outgoing mail/SMS goes through `NotificationOutbox` + `drainOutbox`, keyed by
`idempotencyKey`. **Real prospects receive these** — never send test messages or
re-send with stale dates. Grant closure alerts reuse this path and also deliver
inline, because the radar runs on GitHub Actions while the drain runs on Vercel
cron.

### Internal alerts do not go to info@ontarioreno.ca

`ontarioreno.ca`'s MX points at **the web host**, not Google — `info@` is a
mailbox there that forwards to Gmail, and that hop is slow and erratic. The
same booking alert took 1, 40 and 76 minutes on three consecutive bookings
while Resend, SES and our own outbox all recorded the handoff in under a
second. A rep was finding out about a booking an hour after the homeowner made
it.

So `teamInbox()` (api/leads) resolves from `TEAM_INBOX_EMAIL` — a Gmail-hosted
address with no forwarder in the path — and **not** from `EMAIL_FROM`. Those
are two different things: the address homeowners see mail come FROM, and the
address the office reads alerts AT. `archiveInbox()` keeps `EMAIL_FROM`'s
address copied on every alert as its own outbox row, so the slow hop can never
hold up the fast one.

Do not re-derive the alert recipient from `EMAIL_FROM`.

### Inbound SMS forwards to a downstream handler before acting

**Audited August 26, 2026 — the history below is no longer the live situation.
Read this first.**

The number's "a message comes in" webhook now points at
`https://ontarioreno.ca/api/sms/inbound`, i.e. at US. And the Apps Script bound
to the Meta lead sheet (`scripts/google-sheet-lead-sync.gs`) only POSTs rows to
`/api/leads?intake=1` — it has no `doPost`, no Twilio, and sends no texts. No
`doPost` execution appears anywhere in that Google account.

So **nothing outside this repo texts a new lead**. First contact is
`smsLeadWelcome`, sent by us from the intake endpoint, and it is the only
opening message a lead receives. `SMS_FORWARD_URL` is still set in Vercel but
points at something that no longer answers.

This section previously claimed an Apps Script owned the webhook and sent every
lead their first text. That was true once and drove the design below. It is not
true now, and believing it costs an afternoon — which is why the correction is
at the top rather than in a footnote.

The forwarding code is still there and still runs first:

1. Every request is POSTed on to `SMS_FORWARD_URL` **first**, before the
   signature check and outside every other branch.
2. If the downstream answers with TwiML, that TwiML is relayed to Twilio
   verbatim.
3. Only then do we act on the reply ourselves, and only if the Twilio signature
   verifies against `TWILIO_WEBHOOK_URL`.

**Do not reorder those, and do not delete the forward** just because nothing
answers it today. The ordering is free when the URL is dead, and it is the
whole safety property the moment anything is put back behind it. If you retire
the forward deliberately, remove `SMS_FORWARD_URL` from Vercel in the same
change so the two cannot disagree.

Only a literal `C`/`R` (or the words "confirm"/"confirmed"/"reschedule") is read
as an answer. Everything else — "Ok", "thanks", "Cancel", "Running late" — is
**forwarded to the rep verbatim and interpreted by nobody**. Polite noise once
counted as a confirmation and told reps something homeowners had not said; the
fix was to narrow the words AND stop staying silent, not one or the other.

A **confirm** moves `status` to `'confirmed'` and writes an Activity row
attributed to the homeowner (`actorRole: 'homeowner'`, `actorName` the
customer). A status that changes with nothing in the history explaining it is
worse than one that does not change at all.

`Activity.actorUserId` must be a **real user id** — the live database has a
foreign key on it even though the generated DDL declares none, so a sentinel
like `'system'` is rejected and the row is lost to the surrounding catch. Use
the assigned rep; the homeowner is named in `actorName`/`actorRole`, which is
what activity views render. Do not check `schema-ddl.generated.js` to decide
whether a constraint exists.

A **reschedule request** never touches `status`. No status is true there:
`'rescheduled'` claims a new time has been agreed when nothing has been
rebooked, and a rep scanning the calendar would read it as handled.

`smsReplyStatus` is still separate from `status`: a reschedule request is
work for a rep, not a change to the booking, and the slot stays held until a
human moves it. Guarded by `lib/sms-replies.test.ts`.

## Schema

`prisma/schema.prisma` is the source of truth. After editing:

```bash
npm run schema:gen && npx prisma generate
```

Production migrates itself lazily via `ensureSchema()` / `withSchema()` in
`lib/schema.ts`, so a missing column self-heals on first access rather than
500ing. `npm run build` fails if the generated DDL is stale.
