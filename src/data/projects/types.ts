/**
 * Project dossier schema.
 *
 * The service pages used to be cost guides with a photo grid bolted on. Every
 * bathroom looks good the day the tile goes on, so a grid of finished rooms
 * proves nothing a competitor's grid does not also prove. A dossier is the
 * answer: one project at a time, shown in four layers — the finished space,
 * what is underneath it, what was actually done, and the one action that
 * follows.
 *
 * THE RULE THIS FILE EXISTS TO ENFORCE: nothing here may be invented.
 *
 * A homeowner who checks a claimed city, duration or material against the real
 * job and finds it wrong has taken the page's only asset — its credibility —
 * and thrown it out. So every field a real job would have is nullable, and a
 * missing one renders a VISIBLE `[NEEDS: …]` marker rather than being hidden
 * or filled with something plausible. A gap you can see is a task. A gap that
 * renders as confident copy is a lie with a deadline on it.
 *
 * That is also why `beneath` is allowed to be empty, and why an empty one is
 * not a defect. These projects were completed before any process captured
 * demolition or rough-in, so the photographs do not exist and cannot be
 * obtained after the fact. The layer renders nothing rather than apologising
 * for itself, and it is ready if a future job is ever shot that way. Do not
 * substitute a stock image or a finished shot to fill it.
 */

export type Photo = {
  /** Default source. Point this at a DISPLAY-SIZED file, not the camera original. */
  src: string;
  /**
   * Responsive candidates, e.g. "…-800w.webp 800w, …-1600w.webp 1600w".
   *
   * Not a nicety. The originals are 2877-6000px wide and the page paints them
   * at 320-660px; a browser downscaling that far uses a fast filter, and on
   * photographs of tile — grout lines, mosaic, anything finely repeating — that
   * aliases into a shimmer that reads as poor image quality without ever
   * looking obviously broken. Variants are built by
   * scripts/resize-project-photos.mjs.
   */
  srcSet?: string;
  /** Describes the ROOM, for screen readers and for search. Never a sales line. */
  alt: string;
  /** Intrinsic size, so the box is reserved before the image decodes. */
  width: number;
  height: number;
  /** Shown beneath the photo. Only what is verifiable. */
  caption?: string;
};

/**
 * The construction stages worth photographing, in the order they happen.
 *
 * Deliberately short. These are the points where a cheap job and an expensive
 * one visibly diverge and where the difference is invisible forever afterwards.
 */
export type BuildStage =
  | 'demo'
  | 'framing'
  | 'plumbing'
  | 'electrical'
  | 'waterproofing'
  | 'subfloor'
  | 'drywall';

export const STAGE_LABELS: Record<BuildStage, string> = {
  demo: 'Demolition',
  framing: 'Framing',
  plumbing: 'Plumbing rough-in',
  electrical: 'Electrical',
  waterproofing: 'Waterproofing',
  subfloor: 'Subfloor',
  drywall: 'Drywall',
};

/**
 * An in-progress photograph plus the two sentences that make it mean something.
 *
 * A photo of a membrane is not evidence on its own — most homeowners have
 * never seen one and cannot tell a good one from a bad one. `why` says what
 * they are looking at; `skipped` says what happens on the job that came in
 * eight thousand dollars cheaper. Both are written the way a foreman talks:
 * short, concrete, no adjective that cannot be checked.
 */
export type BeneathPhoto = Photo & {
  stage: BuildStage;
  /** One line: what this is and why it is there. */
  why: string;
  /** One line: what a cheaper job does instead. */
  skipped: string;
};

export type Phase = {
  name: string;
  /** Plain language — "about a week", not a fake-precise "6.5 days". */
  duration: string;
};

export type Project = {
  /** URL-safe and stable; used as the anchor id and the analytics label. */
  slug: string;
  room: 'bathroom' | 'kitchen' | 'basement';
  /** What the job was: "Main bathroom, full rebuild". Not a headline. */
  title: string;
  /** City or region. `null` until someone confirms which job this is. */
  location: string | null;
  /** At least one. The first is the one the dossier leads with. */
  finished: Photo[];
  /**
   * In-progress photographs, when they exist.
   *
   * Usually empty: the completed projects on the page predate any process that
   * captured demolition or rough-in, and asking for them retroactively is not
   * possible. An empty array renders NOTHING — no placeholder, no apology, and
   * never a finished photo standing in for one.
   */
  beneath: BeneathPhoto[];
  /** Scope as a checklist of plain nouns, not marketing copy. Empty is allowed. */
  scope: string[];
  /** Duration by phase. Empty is allowed. */
  phases: Phase[];

  /*
   * THERE IS NO PRICE FIELD, AND ONE MUST NOT BE ADDED.
   *
   * An earlier version carried an `investmentBand`. It is gone on purpose:
   * pricing happens in the home with the room measured, and publishing what a
   * past job cost invites a homeowner to anchor on someone else's bathroom and
   * leaves the consultant explaining a number they never quoted.
   */
  /** Optional, and only when both frames are genuinely the same room. */
  beforeAfter?: { before: Photo; after: Photo };
};

/**
 * True when every field a finished dossier needs has been supplied.
 *
 * Intended for a guard test before this page goes live, so a placeholder
 * cannot reach production unnoticed — the same shape as the inventory guards
 * that already protect the portal.
 */
export function isComplete(project: Project): boolean {
  return (
    project.location !== null &&
    project.scope.length > 0 &&
    project.phases.length > 0
  );
}

/** Every unfilled field on a project, as human-readable labels. */
export function missingFields(project: Project): string[] {
  const missing: string[] = [];
  if (project.location === null) missing.push('location');
  if (project.scope.length === 0) missing.push('scope');
  if (project.phases.length === 0) missing.push('phase durations');
  // `beneath` is NOT checked. These projects were finished before the process
  // captured in-progress work, so a dossier without it is complete, not
  // unfinished — the layer simply does not render.
  return missing;
}
