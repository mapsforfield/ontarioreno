import { Helmet } from 'react-helmet-async';

/**
 * Title, description, canonical and social tags for one public page.
 *
 * The same block most city pages already write out by hand in their own
 * <Helmet>. Added for the core service pages (basements, bathrooms, kitchens,
 * legal suites, costs), which had none: every one of them showed Google the
 * site-wide default title, so nothing in the search result said "bathroom".
 */
export function PageMeta({ title, description, path }: { title: string; description: string; path: string }) {
  const url = `https://ontarioreno.ca${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
    </Helmet>
  );
}
