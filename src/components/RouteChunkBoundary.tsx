import { Component, Suspense, type ErrorInfo, type ReactNode } from 'react';

/**
 * Catches a route chunk that fails to arrive, and offers a way out.
 *
 * This exists BECAUSE of code splitting, and it is the thing that makes route
 * splitting safe rather than risky. With one static bundle a page could not
 * half-load: the file either arrived or the site did not run at all. Once each
 * route is its own file there are two new ways to end up staring at nothing,
 * and React's default for both is to unmount the tree and render a white
 * screen:
 *
 *   1. A network blip mid-navigation. The import rejects and the route never
 *      renders.
 *   2. A tab left open across a deploy. The already-loaded index.html names
 *      chunk files from the previous build; navigating asks for a filename the
 *      new deploy may no longer have. (Our immutable asset caching makes this
 *      rarer, since old URLs stay valid while they are cached, but it is not a
 *      guarantee.)
 *
 * Neither is hypothetical on mobile connections, and a white screen on a
 * marketing page is a lead lost with no signal that anything went wrong. So a
 * failure degrades to a small, plain "reload" card instead.
 *
 * Reload rather than a React retry on purpose: if the failure was a stale
 * deploy, re-running the same dynamic import fetches the same missing filename
 * and fails identically. A full reload re-fetches index.html, which is served
 * must-revalidate, so the browser picks up the current chunk names and the
 * problem resolves itself.
 */
type State = { failed: boolean };

export class RouteChunkBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Left as console output deliberately: this is a real user-visible failure
    // and it should be findable in a session recording or a support call.
    console.error('Route failed to load', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-slate-900">This page didn’t finish loading</h1>
          <p className="mt-3 text-slate-600">
            That’s usually a brief connection problem. Reloading should fix it.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#1B3C6C] px-6 py-3 font-bold text-white transition hover:bg-[#16325a]"
          >
            Reload the page
          </button>
        </div>
      </div>
    );
  }
}

/**
 * What shows while a route chunk is in flight.
 *
 * Deliberately near-empty. A spinner that appears for 80ms on a fast connection
 * reads as jank, and a tall skeleton shifts the layout when the real page
 * arrives. This just holds vertical space so the footer does not jump up to meet
 * the header, and says nothing.
 */
function RouteFallback() {
  return <div className="min-h-[60vh]" aria-busy="true" />;
}

/** Both halves together, since a lazy route always wants the pair. */
export function LazyRoutes({ children }: { children: ReactNode }) {
  return (
    <RouteChunkBoundary>
      <Suspense fallback={<RouteFallback />}>{children}</Suspense>
    </RouteChunkBoundary>
  );
}
