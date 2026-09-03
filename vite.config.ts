import { existsSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { programBySlug, publicQuestions } from './lib/program-config'
import { routeConsultation } from './lib/consultation-routing'

/**
 * Local-only stand-in for /api/leads.
 *
 * `vite dev` serves the front end and nothing else — the real handlers need
 * `vercel dev` plus database credentials. Without this, every submission on
 * localhost lands on the "a specialist will call you" screen no matter what was
 * answered, because the POST has nothing to talk to.
 *
 * OFF unless the untracked file .claude/mock-api exists, and `apply: 'serve'`
 * keeps it out of every build regardless — so it can never reach production.
 * The data is fabricated: nothing is written, nothing is booked, and the slots
 * are generated, not real availability.
 */
function mockLeadsApi(): Plugin {
  // Uneven on purpose: every day offering the same five times cannot show
  // whether the "N left" scarcity label renders, which is half of what the
  // calendar screen is being previewed for.
  const ALL_TIMES = ['10:00', '12:00', '14:00', '16:00', '18:00']
  // A fortnight, to match bookingHorizonDays — the full-month view is only
  // worth previewing if there is something past the seven days the row shows.
  // A zero means a day with nothing open, so the month grid has greyed-out
  // dates to render as well as blue ones.
  const OPEN_PER_DAY = [2, 5, 1, 4, 5, 3, 5, 2, 0, 4, 1, 0, 5, 3]
  const slots = Array.from({ length: OPEN_PER_DAY.length }, (_, d) => {
    const date = new Date(Date.now() + (d + 1) * 86_400_000).toISOString().slice(0, 10)
    return ALL_TIMES.slice(0, OPEN_PER_DAY[d]).map((time) => ({ date, time }))
  }).flat()

  return {
    name: 'mock-leads-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/leads', (req, res) => {
        const params = new URL(req.url ?? '', 'http://localhost').searchParams
        const flow = params.get('flow')
        const send = (body: unknown) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
        }
        // Whichever program the URL asks for, so /consultation/<slug> previews
        // the real config rather than a hardcoded one.
        const program = programBySlug(params.get('slug') ?? '') ?? programBySlug('hamilton')!
        if (flow === 'program') {
          return send({
            key: program.key,
            version: program.version,
            slug: program.slug,
            areaLabel: program.areaLabel,
            enabled: program.enabled,
            closure: program.closure ?? null,
            displayAmountLabel: program.displayAmountLabel,
            fundingHighlights: program.fundingHighlights,
            programTerms: program.programTerms,
            whyFreeText: program.whyFreeText,
            fundingGuidance: program.fundingGuidance,
            questions: publicQuestions(program),
            visitMinutes: program.visitMinutes,
            consultationMode: program.consultationMode,
            pageTitle: program.pageTitle ?? null,
            fundingStepHeading: program.fundingStepHeading ?? null,
            // Must mirror publicProgramPayload: without it the local preview
            // renders the address on step 1 while production renders it last,
            // which makes this mock actively misleading about the real flow.
            addressPlacement: program.addressPlacement ?? 'first',
            bookingFlow: program.bookingFlow ?? 'questions_first',
            prepQuestions: program.prepQuestions,
            guideUrl: program.guideUrl,
            guideLabel: program.guideLabel,
            smsEnabled: false,
          })
        }
        if (flow === 'address_resolve') return send({ candidate: null })
        // The grid the real endpoint sends: every start the program offers, and
        // the floor below which one is too soon rather than taken. Dated
        // yesterday here so the preview marks every unbooked start as taken
        // rather than hiding it — which is the thing being previewed.
        const slotGrid = {
          startTimes: program.slotStartTimes,
          earliestWall: `${new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)}T00:00`,
        }
        if (flow === 'availability') return send({ slots, visitMinutes: program.visitMinutes, slotGrid })
        // The calendar-early flow's lead-less calendar — and, once an address
        // is supplied, the narrower answer the travel radius gives.
        //
        // The narrowing is fabricated (localhost has no Places key and no
        // appointments), but the SHAPE is the real one: a located answer is a
        // subset of the unlocated one, and it is what makes the swap card on
        // the details screen reachable in a local preview at all.
        if (flow === 'availability_preview') {
          const located = Boolean(params.get('placeId') || params.get('address'))
          if (!located) return send({ slots, visitMinutes: program.visitMinutes, slotGrid, located: false })
          const narrowed = slots.filter((s) => s.time >= '14:00')
          return send({ slots: narrowed, visitMinutes: program.visitMinutes, slotGrid, located: true })
        }
        if (flow === 'prep') return send({ saved: 0 })
        if (flow === 'submit') {
          // Mirrors the real router closely enough to exercise the flow: every
          // funding answer books, and only a stated "no" on ownership declines.
          let body = ''
          req.on('data', (c) => (body += c))
          return req.on('end', () => {
            const parsed = JSON.parse(body || '{}')
            const answers = (parsed.answers ?? {}) as Record<string, string>
            const submitted = programBySlug(String(parsed.programSlug ?? '')) ?? program
            // The REAL router, so the preview cannot disagree with production
            // about who gets a calendar. Only the address is faked: localhost has
            // no Places key, so we assume a verified address in the program's own
            // area rather than reimplementing resolution.
            const routing = routeConsultation({
              addressState: 'ADDRESS_VERIFIED',
              area: submitted.schedulingArea,
              program: submitted,
              answers,
            })
            send({
              leadRef: 'LOCAL-MOCK',
              outcome: routing.outcome,
              reasons: routing.reasons,
              offersCalendar: routing.outcome === 'DIRECT_CALENDAR',
            })
          })
        }
        if (flow === 'book') {
          let body = ''
          req.on('data', (c) => (body += c))
          return req.on('end', () => {
            const b = JSON.parse(body || '{}')
            send({ publicReference: 'LOCAL-MOCK-1', date: b.date, time: b.time, propertyAddress: 'Local preview' })
          })
        }
        send({})
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), ...(existsSync('.claude/mock-api') ? [mockLeadsApi()] : [])],
})
