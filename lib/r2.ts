/**
 * Minimal Cloudflare R2 (S3-compatible) client.
 *
 * We only need three things — a presigned PUT URL (so the browser uploads the
 * video straight to R2, bypassing Vercel's 4.5 MB request-body limit), a
 * presigned GET URL (short-lived links so only logged-in portal users can
 * stream a private video), and a server-side DELETE.
 *
 * To avoid pulling in the heavy AWS SDK we hand-roll SigV4 query signing with
 * Node's crypto. Region is always "auto" and service is "s3" for R2.
 */
import { createHash, createHmac } from 'node:crypto';

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? '';
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID ?? '';
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY ?? '';
const BUCKET = process.env.R2_BUCKET ?? '';
const HOST = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;
const REGION = 'auto';
const SERVICE = 's3';

export function isR2Configured(): boolean {
  return Boolean(ACCOUNT_ID && ACCESS_KEY && SECRET_KEY && BUCKET);
}

/** RFC-3986 encoding (stricter than encodeURIComponent). */
function enc(str: string): string {
  return encodeURIComponent(str).replace(
    /[!*'()]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

/** Encode an object key, preserving "/" path separators. */
function encodeKey(key: string): string {
  return key.split('/').map(enc).join('/');
}

function sha256Hex(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data, 'utf8').digest();
}

function signingKey(dateStamp: string): Buffer {
  const kDate = hmac(`AWS4${SECRET_KEY}`, dateStamp);
  const kRegion = hmac(kDate, REGION);
  const kService = hmac(kRegion, SERVICE);
  return hmac(kService, 'aws4_request');
}

/**
 * Build a presigned URL for a single request (PUT / GET / DELETE) using
 * query-string SigV4 with an unsigned payload.
 */
function presign(method: string, key: string, expiresIn: number): string {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const canonicalUri = `/${BUCKET}/${encodeKey(key)}`;

  const params: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${ACCESS_KEY}/${credentialScope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresIn),
    'X-Amz-SignedHeaders': 'host',
  };
  const canonicalQuery = Object.keys(params)
    .sort()
    .map((k) => `${enc(k)}=${enc(params[k])}`)
    .join('&');

  const canonicalHeaders = `host:${HOST}\n`;
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    'host',
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const signature = createHmac('sha256', signingKey(dateStamp))
    .update(stringToSign, 'utf8')
    .digest('hex');

  return `https://${HOST}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

/** Presigned URL the browser uses to PUT the file directly to R2. */
export function presignPutUrl(key: string, expiresIn = 600): string {
  return presign('PUT', key, expiresIn);
}

/** Short-lived presigned URL for streaming/viewing a private object. */
export function presignGetUrl(key: string, expiresIn = 3600): string {
  return presign('GET', key, expiresIn);
}

/** Delete an object from the bucket (server-side, signed request). */
export async function deleteObject(key: string): Promise<void> {
  const url = presign('DELETE', key, 120);
  const res = await fetch(url, { method: 'DELETE' });
  // R2 returns 204 on success, 404 if already gone — both are fine.
  if (!res.ok && res.status !== 404) {
    throw new Error(`R2 delete failed: ${res.status}`);
  }
}
