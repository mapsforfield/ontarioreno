import { StrictMode } from 'react';
import { prerenderToNodeStream } from 'react-dom/static';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';

/**
 * Build-time only: renders one public URL to HTML so a crawler receives the
 * page's real title, description and content instead of an empty <div id="root">.
 * Called by scripts/prerender.mjs after `vite build`; never shipped to the
 * browser. `prerenderToNodeStream` waits for every lazy route chunk to resolve,
 * so the output is the finished page, not the Suspense fallback.
 */
export async function render(url: string): Promise<string> {
  const { prelude } = await prerenderToNodeStream(
    <StrictMode>
      <HelmetProvider>
        <App location={url} />
      </HelmetProvider>
    </StrictMode>,
  );
  const chunks: Buffer[] = [];
  for await (const chunk of prelude) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}
