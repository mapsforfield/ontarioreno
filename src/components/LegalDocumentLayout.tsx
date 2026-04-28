import { Helmet } from 'react-helmet-async';

type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

type LegalDocumentLayoutProps = {
  title: string;
  metaTitle: string;
  metaDescription: string;
  canonicalPath: string;
  eyebrow: string;
  intro: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export default function LegalDocumentLayout({
  title,
  metaTitle,
  metaDescription,
  canonicalPath,
  eyebrow,
  intro,
  lastUpdated,
  sections,
}: LegalDocumentLayoutProps) {
  return (
    <div className="bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={`https://ontarioreno.ca${canonicalPath}`} />
      </Helmet>

      <section className="border-b border-slate-100 bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">
            {eyebrow}
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-[-0.04em] text-slate-900 sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            {intro}
          </p>
          <p className="mt-5 text-sm leading-7 text-slate-500">
            Last updated: {lastUpdated}
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)] sm:p-8 lg:p-10">
            {sections.map((section) => (
              <section key={section.title} className="border-b border-slate-100 pb-10 last:border-b-0 last:pb-0">
                <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-900">
                  {section.title}
                </h2>

                {section.paragraphs?.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-4 text-base leading-8 text-slate-600"
                  >
                    {paragraph}
                  </p>
                ))}

                {section.bullets && (
                  <ul className="mt-4 space-y-3 text-base leading-8 text-slate-600">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3">
                        <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1B3C6C]" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
