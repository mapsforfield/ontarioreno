/**
 * Build-time pre-render of every public marketing page.
 *
 * WHY: the site is a React SPA, so every URL used to serve the same empty
 * index.html — same <title>, no description, and no page text until JavaScript
 * ran. Google's first look at /basement-renovation-ajax contained the word
 * "Ajax" zero times. This writes a real HTML file per public route, with that
 * page's own title, description, canonical and content; the browser then
 * hydrates it into the same app as before.
 *
 * Runs after `vite build` (client, into dist/) and
 * `vite build --ssr src/entry-server.tsx --outDir dist-ssr`.
 *
 * Output:
 *   dist/spa-shell.html      the untouched SPA shell. vercel.json's catch-all
 *                            rewrite points here, so the portal, /consultation
 *                            and every route not listed below behave exactly as
 *                            before.
 *   dist/index.html          the pre-rendered home page.
 *   dist/<route>/index.html  one per public route.
 *
 * A route that fails to render is SKIPPED, not fatal: that URL falls back to the
 * SPA shell, which is how every page worked before this script existed. The
 * build only fails if the home page cannot render or most routes fail, since
 * that means the pre-render itself is broken rather than one page.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const dist = path.join(root, 'dist');
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

if (!template.includes('<div id="root"></div>')) {
  throw new Error('prerender: dist/index.html has no empty <div id="root"></div> — was it already pre-rendered?');
}

// The shell first, before index.html is overwritten with the home page.
fs.writeFileSync(path.join(dist, 'spa-shell.html'), template);

/**
 * Public routes, read from App.tsx: every static path inside the marketing
 * <Route path="/" element={<Layout />}> block. Portal and /consultation routes
 * sit outside that block and are never pre-rendered; `:param` routes are
 * skipped because their content comes from the API at runtime.
 */
function publicRoutes(appSource) {
  const start = appSource.indexOf('<Route path="/" element={<Layout />}>');
  if (start === -1) throw new Error('prerender: marketing <Route path="/" element={<Layout />}> block not found in App.tsx');
  const block = appSource.slice(start);
  const routes = new Set(['/']);
  for (const m of block.matchAll(/<Route\s+path="([^"]+)"/g)) {
    const p = m[1].trim();
    if (p === '/' || p.includes(':') || p.includes('*')) continue;
    routes.add('/' + p.replace(/^\/+/, ''));
  }
  return [...routes];
}

/**
 * React 19 emits a component's <title>, <meta> and <link> elements at the very
 * start of the rendered markup. Split them off so they can go in <head>.
 */
function splitHoisted(html) {
  const tag = /^(?:<(?:link|meta)\b[^>]*\/?>|<title\b[^>]*>[\s\S]*?<\/title>|<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>)/;
  let head = '';
  let rest = html;
  for (let m = rest.match(tag); m; m = rest.match(tag)) {
    head += m[0];
    rest = rest.slice(m[0].length);
  }
  return { head, body: rest };
}

/** Mark every injected head tag so main.tsx can hand <head> back to React. */
const mark = (tags) => tags.replace(/<(title|meta|link|script)\b/g, '<$1 data-prerender');

function buildPage(head, body) {
  let page = template;
  const has = (re) => re.test(head);
  // The template's site-wide defaults give way to the page's own tags.
  if (has(/<title\b/)) page = page.replace(/<title>[\s\S]*?<\/title>/, '');
  if (has(/<meta name="description"/)) page = page.replace(/<meta\s+name="description"[\s\S]*?\/>/, '');
  if (has(/<meta property="og:title"/)) page = page.replace(/<meta\s+property="og:title"[\s\S]*?\/>/, '');
  if (has(/<meta property="og:description"/)) page = page.replace(/<meta\s+property="og:description"[\s\S]*?\/>/, '');
  if (has(/<meta property="og:url"/)) page = page.replace(/<meta\s+property="og:url"[\s\S]*?\/>/, '');
  page = page.replace('</head>', `${mark(head)}\n  </head>`);
  return page.replace('<div id="root"></div>', `<div id="root" data-prerendered="">${body}</div>`);
}

const { render } = await import(pathToFileURL(path.join(root, 'dist-ssr', 'entry-server.js')).href);
const routes = publicRoutes(fs.readFileSync(path.join(root, 'src', 'App.tsx'), 'utf8'));

// Leaflet and friends may log to console during render; keep the build log readable.
const failed = [];
let written = 0;
for (const route of routes) {
  try {
    const { head, body } = splitHoisted(await render(route));
    const out = route === '/' ? path.join(dist, 'index.html') : path.join(dist, route.slice(1), 'index.html');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, buildPage(head, body));
    written++;
  } catch (err) {
    failed.push(route);
    console.warn(`prerender: SKIPPED ${route} — ${String(err?.message ?? err).split('\n')[0]}`);
  }
}

console.log(`prerender: ${written}/${routes.length} public pages written${failed.length ? `, ${failed.length} fell back to the SPA shell` : ''}`);

// dist/sitemap.xml from the same route list, so the sitemap can no longer drift
// from the app. The hand-run `npm run sitemap` copy in public/ had gone stale
// and was missing /grants — the site's top page in Search Console. This only
// replaces the copy in dist/; public/sitemap.xml is left as it is.
// No <lastmod>: stamping every URL with the build date on every deploy is a
// signal Google learns to ignore.
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...routes]
  .sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)))
  .map((r) => `  <url>\n    <loc>https://ontarioreno.ca${r === '/' ? '/' : r}</loc>\n  </url>`)
  .join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);
console.log(`prerender: sitemap.xml written with ${routes.length} URLs`);
if (failed.includes('/')) throw new Error('prerender: the home page failed to render');
if (failed.length > routes.length / 2) throw new Error('prerender: most routes failed — the pre-render itself is broken');
process.exit(0);
