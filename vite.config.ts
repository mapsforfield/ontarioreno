import { existsSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { HAMILTON_PROGRAM, publicQuestions } from './lib/program-config'

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
  const program = HAMILTON_PROGRAM
  const slots = Array.from({ length: 8 }, (_, d) => {
    const date = new Date(Date.now() + (d + 1) * 86_400_000).toISOString().slice(0, 10)
    return ['10:00', '12:00', '14:00', '16:00', '18:00'].map((time) => ({ date, time }))
  }).flat()

  return {
    name: 'mock-leads-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/leads', (req, res) => {
        const flow = new URL(req.url ?? '', 'http://localhost').searchParams.get('flow')
        const send = (body: unknown) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
        }
        if (flow === 'program') {
          return send({
            key: program.key,
            version: program.version,
            slug: program.slug,
            areaLabel: program.areaLabel,
            enabled: program.enabled,
            displayAmountLabel: program.displayAmountLabel,
            fundingHighlights: program.fundingHighlights,
            programTerms: program.programTerms,
            whyFreeText: program.whyFreeText,
            fundingGuidance: program.fundingGuidance,
            questions: publicQuestions(program),
            visitMinutes: program.visitMinutes,
            consultationMode: program.consultationMode,
            guideUrl: program.guideUrl,
            guideLabel: program.guideLabel,
            smsEnabled: false,
          })
        }
        if (flow === 'address_resolve') return send({ candidate: null })
        if (flow === 'availability') return send({ slots, visitMinutes: program.visitMinutes })
        if (flow === 'submit') {
          // Mirrors the real router closely enough to exercise the flow: every
          // funding answer books, and only a stated "no" on ownership declines.
          let body = ''
          req.on('data', (c) => (body += c))
          return req.on('end', () => {
            const answers = (JSON.parse(body || '{}').answers ?? {}) as Record<string, string>
            const declined = answers.ownership === 'no'
            const nurture = answers.timeline === 'exploring' || answers.timeline === '3_plus_months'
            const offersCalendar = !declined && !nurture
            send({
              leadRef: 'LOCAL-MOCK',
              outcome: declined ? 'DECLINE' : nurture ? 'NURTURE' : 'DIRECT_CALENDAR',
              reasons: offersCalendar
                ? ['ELIGIBLE_FOR_BOOKING', ...(answers.contribution === 'unsure' ? ['NEEDS_FUNDING_GUIDANCE'] : [])]
                : [],
              offersCalendar,
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
