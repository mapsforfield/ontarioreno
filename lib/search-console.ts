import jwt from 'jsonwebtoken';

/**
 * Minimal read-only Google Search Console client for the SEO miner.
 *
 * Auth is a service account (seo-miner@ontarioreno-portal.iam.gserviceaccount.com)
 * added to the Search Console property with RESTRICTED (read-only) permission.
 * Its JSON key lives in the GitHub secret GSC_SERVICE_ACCOUNT_JSON. Read-only is
 * deliberate: this client can look at search data and nothing else; it cannot
 * submit sitemaps, remove URLs or change the property.
 *
 * Signed with jsonwebtoken (already a dependency) rather than pulling in
 * google-auth-library for one token exchange.
 */

export const GSC_SITE = 'sc-domain:ontarioreno.ca';
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

type ServiceAccount = { client_email: string; private_key: string; token_uri?: string };

export function parseServiceAccount(raw: string | undefined): ServiceAccount {
  if (!raw) throw new Error('GSC_SERVICE_ACCOUNT_JSON is not set');
  const key = JSON.parse(raw) as Partial<ServiceAccount>;
  if (!key.client_email || !key.private_key) throw new Error('GSC_SERVICE_ACCOUNT_JSON is missing client_email or private_key');
  return key as ServiceAccount;
}

async function accessToken(key: ServiceAccount): Promise<string> {
  const tokenUri = key.token_uri ?? 'https://oauth2.googleapis.com/token';
  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    { iss: key.client_email, scope: SCOPE, aud: tokenUri, iat: now, exp: now + 3600 },
    key.private_key,
    { algorithm: 'RS256' },
  );
  const res = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  const body = (await res.json()) as { access_token?: string; error_description?: string };
  if (!res.ok || !body.access_token) throw new Error(`Search Console auth failed: ${res.status} ${body.error_description ?? ''}`);
  return body.access_token;
}

export type GscRow = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };

/**
 * Every row of a Search Analytics query, paging past the API's 25,000-row cap.
 * `dimensions` order decides `keys` order in each row.
 */
export async function querySearchAnalytics(
  rawKey: string | undefined,
  opts: { startDate: string; endDate: string; dimensions: string[] },
): Promise<GscRow[]> {
  const token = await accessToken(parseServiceAccount(rawKey));
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(GSC_SITE)}/searchAnalytics/query`;
  const rows: GscRow[] = [];
  const pageSize = 25000;
  for (let startRow = 0; ; startRow += pageSize) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...opts, rowLimit: pageSize, startRow, dataState: 'all' }),
    });
    const body = (await res.json()) as { rows?: GscRow[]; error?: { message?: string } };
    if (!res.ok) throw new Error(`Search Console query failed: ${res.status} ${body.error?.message ?? ''}`);
    const page = body.rows ?? [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}
