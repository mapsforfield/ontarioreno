import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

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
