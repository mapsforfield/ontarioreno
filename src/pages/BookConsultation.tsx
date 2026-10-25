import { Helmet } from 'react-helmet-async';
import ServicePicker from '../components/ServicePicker';

/**
 * /book — the service picker on its own page.
 *
 * Where a button that cannot ask a question goes: the header CTA on the
 * homepage, and the homepage's sticky mobile bar. Both used to open /match;
 * see src/lib/bookingRoutes.ts for why they no longer do.
 *
 * Indexable, like /match. Every public route is written into the generated
 * sitemap (scripts/prerender.mjs), and a sitemap URL marked noindex is an
 * error in Search Console.
 */
export default function BookConsultation() {
  return (
    <div className="bg-slate-50">
      <Helmet>
        <title>Book a Free Consultation | OntarioReno</title>
        <meta
          name="description"
          content="Pick your project — basement, legal suite, kitchen, bathroom or garden suite — and book a free consultation with OntarioReno."
        />
        <link rel="canonical" href="https://ontarioreno.ca/book" />
      </Helmet>

      <section className="mx-auto max-w-xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">
          Booking is open
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-900 sm:text-4xl">
          Book a free consultation
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Pick your project to see open times. We come to see the space — or
          call, if you&apos;re outside our travel area — and confirm by text.
        </p>

        <ServicePicker tone="light" source="book" className="mt-8" />

        <p className="mt-8 text-sm text-slate-500">
          100% free for homeowners. No obligation to hire.
        </p>
      </section>
    </div>
  );
}
