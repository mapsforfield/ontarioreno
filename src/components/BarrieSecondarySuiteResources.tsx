import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarClock,
  FileCheck2,
  FileText,
  Home,
  Landmark,
  TreePine,
} from 'lucide-react';

const resources = [
  {
    title: 'Barrie Secondary Suite Funding',
    href: '/barrie-secondary-suite-funding',
    copy:
      'See how eligible Barrie homeowners may access up to $65,000 through County funding and the Barrie Bonus.',
    icon: Landmark,
  },
  {
    title: 'Barrie ARU Permit Rebate',
    href: '/barrie-aru-permit-rebate',
    copy:
      'Understand Barrie’s permit fee reduction and rebate opportunity for eligible ARU projects.',
    icon: FileText,
  },
  {
    title: 'Barrie Basement Apartment Permits',
    href: '/barrie-basement-apartment-permits',
    copy:
      'Learn what permits are typically required to create a legal basement apartment in Barrie.',
    icon: Home,
  },
  {
    title: 'Barrie Garden Suites',
    href: '/barrie-garden-suites',
    copy:
      'Review how detached garden suites work in Barrie and what homeowners should consider.',
    icon: TreePine,
  },
  {
    title: 'Barrie Secondary Suite Costs',
    href: '/barrie-secondary-suite-costs',
    copy:
      'Understand typical cost ranges, funding impact, and permit-related expenses.',
    icon: FileCheck2,
  },
  {
    title: 'Barrie ARU Eligibility',
    href: '/barrie-aru-eligibility',
    copy:
      'Check the main property, rental, and program factors that affect eligibility.',
    icon: CalendarClock,
  },
];

export default function BarrieSecondarySuiteResources() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900 md:text-4xl">
            Barrie Secondary Suite Resources
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Use these Barrie guides to compare funding, permits, costs, and project fit from one place.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {resources.map((resource) => (
            <Link
              key={resource.title}
              to={resource.href}
              className="group rounded-[1.35rem] border border-slate-200 bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.05)] transition hover:border-slate-300 hover:shadow-[0_16px_34px_rgba(15,23,42,0.07)]"
            >
              <div className="w-fit rounded-2xl bg-slate-100 p-3 text-slate-700">
                <resource.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-2xl font-bold text-slate-900">{resource.title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{resource.copy}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#1B3C6C]">
                Explore guide
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
