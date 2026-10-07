import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';

const container = document.getElementById('root')!;
const app = (
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>
);

// Public pages arrive pre-rendered by scripts/prerender.mjs, so a crawler sees
// real content. Hydrating keeps that HTML on screen while the route chunk loads
// instead of blanking it to the Suspense fallback. Everything else (portal,
// /consultation, any route not pre-rendered) gets the empty SPA shell and
// mounts exactly as it always has.
if (container.hasAttribute('data-prerendered')) {
  // The page's <title>/<meta> were copied into <head> for crawlers. React
  // renders its own copies on hydrate and manages them across navigation;
  // leaving these would pin the first page's title after a client-side route
  // change.
  document.head.querySelectorAll('[data-prerender]').forEach((el) => el.remove());
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}
