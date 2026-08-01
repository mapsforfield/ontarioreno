import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { trackPageView } from '../lib/pixel';

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();
  const firstRender = useRef(true);

  // Meta Pixel counts one PageView on hard load (index.html). In a SPA every
  // route change after that is silent, so it is reported here instead.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    trackPageView();
  }, [pathname]);

  useEffect(() => {
    if (hash) {
      const elementId = hash.replace('#', '');
      let attempts = 0;

      const scrollToHashTarget = () => {
        const target = document.getElementById(elementId);

        if (target) {
          target.scrollIntoView({ block: 'start', behavior: 'auto' });
          return;
        }

        if (attempts < 10) {
          attempts += 1;
          window.requestAnimationFrame(scrollToHashTarget);
        }
      };

      window.requestAnimationFrame(scrollToHashTarget);
      return;
    }

    if (navigationType === 'POP') {
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash, navigationType]);

  return null;
}
