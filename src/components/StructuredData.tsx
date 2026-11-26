import { Helmet } from 'react-helmet-async';
import { PUBLIC_PHONE_E164 } from '../lib/contact';

/**
 * schema.org data for the service and city pages, so Google can read what the
 * page is (a renovation service, in a place, by this business) and show the FAQ
 * answers in results. Same <Helmet><script type="application/ld+json"> pattern
 * the Barrie and grant pages already use; the pre-render hoists it into <head>.
 *
 * Only facts that are true everywhere: the business name, site, phone and the
 * area the page is about. No ratings or reviews — schema reviews must match
 * reviews actually shown on the page, and there are none yet.
 */

const PROVIDER = {
  '@type': 'HomeAndConstructionBusiness',
  name: 'OntarioReno',
  url: 'https://ontarioreno.ca',
  telephone: PUBLIC_PHONE_E164,
  areaServed: { '@type': 'State', name: 'Ontario' },
};

export type Faq = { question: string; answer: string };

export function ServiceSchema({
  name,
  serviceType,
  path,
  city,
  description,
  faqs,
}: {
  name: string;
  serviceType: string;
  path: string;
  /** Omit for Ontario-wide pages. */
  city?: string;
  description: string;
  faqs?: Faq[];
}) {
  const service = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    serviceType,
    description,
    url: `https://ontarioreno.ca${path}`,
    provider: PROVIDER,
    areaServed: city
      ? { '@type': 'City', name: city, containedInPlace: { '@type': 'State', name: 'Ontario' } }
      : { '@type': 'State', name: 'Ontario' },
  };
  const faq = faqs?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      }
    : null;
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(service)}</script>
      {faq && <script type="application/ld+json">{JSON.stringify(faq)}</script>}
    </Helmet>
  );
}
