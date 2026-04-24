import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Landmark } from 'lucide-react';
import { ReactNode } from 'react';
import { buttonStyles } from '../lib/uiStyles';
import { cn } from '../lib/utils';
import BarrieSecondarySuiteResources from './BarrieSecondarySuiteResources';

type BarrieGuidePlaceholderProps = {
  title: string;
  metaTitle: string;
  metaDescription: string;
  canonicalPath: string;
  eyebrow: string;
  intro: string;
  children?: ReactNode;
};

export default function BarrieGuidePlaceholder({
  title,
  metaTitle,
  metaDescription,
  canonicalPath,
  eyebrow,
  intro,
  children,
}: BarrieGuidePlaceholderProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={`https://ontarioreno.ca${canonicalPath}`} />
      </Helmet>

      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-200 ring-1 ring-white/10">
              <Landmark className="h-4 w-4" />
              {eyebrow}
            </div>
            <h1 className="mt-5 text-4xl font-bold leading-[1.02] tracking-[-0.035em] md:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-3xl text-xl leading-8 text-slate-300">
              {intro}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/barrie-secondary-suite-funding"
                className={cn(buttonStyles.primary, 'w-full sm:w-auto')}
              >
                View Barrie Funding Page
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/match"
                className={cn(buttonStyles.ghostDark, 'w-full sm:w-auto')}
              >
                Review My Project
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  This Barrie guide is coming next
                </h2>
                <p className="mt-4 text-lg leading-8 text-slate-600">
                  We are building out the Barrie ARU ecosystem so homeowners can
                  compare funding, permits, costs, and project fit in one place.
                  For now, the main funding page is the best starting point.
                </p>
                <p className="mt-4 text-lg leading-8 text-slate-600">
                  Start with the Barrie funding page if you are comparing a
                  basement apartment, legal secondary suite, or backyard unit
                  against County of Simcoe and City of Barrie program rules.
                </p>
                {children && <div className="mt-4 space-y-4 text-lg leading-8 text-slate-600">{children}</div>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <BarrieSecondarySuiteResources />
    </div>
  );
}
