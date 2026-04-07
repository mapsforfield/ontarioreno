import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'https://ontarioreno.ca';
const appPath = path.resolve('src', 'App.tsx');
const sitemapPath = path.resolve('public', 'sitemap.xml');

const appSource = fs.readFileSync(appPath, 'utf8');

const routePaths = new Set(['/']);
const pathRegex = /<Route\s+path="([^"]+)"/g;

for (const match of appSource.matchAll(pathRegex)) {
  const routePath = match[1]?.trim();

  if (!routePath || routePath === '/') {
    continue;
  }

  routePaths.add(`/${routePath.replace(/^\/+/, '')}`);
}

const urls = [...routePaths]
  .map((routePath) =>
    routePath === '/' ? `${BASE_URL}/` : `${BASE_URL}${routePath}`
  )
  .sort((a, b) => {
    if (a === `${BASE_URL}/`) return -1;
    if (b === `${BASE_URL}/`) return 1;
    return a.localeCompare(b);
  });

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${urls
  .map(
    (url) => `  <url>
    <loc>${url}</loc>
  </url>`
  )
  .join('\n\n')}

</urlset>
`;

fs.writeFileSync(sitemapPath, sitemap, 'utf8');

console.log(`Sitemap generated: ${sitemapPath}`);
console.log(`URLs written: ${urls.length}`);
