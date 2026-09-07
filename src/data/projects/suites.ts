import type { Photo, Project } from './types';

/**
 * Legal secondary suite dossiers, plus the separate-entrance and
 * transformation material for /legal-suites.
 *
 * Same rules as bathroom.ts. Plus the one that governs this page:
 *
 * NOTHING HERE ASSERTS LEGAL STATUS. A photograph can show an excavated
 * entrance, an exit sign or a fire-rated door. It cannot show a permit, and
 * "legal" is a municipal decision made after inspection. This page's own
 * warning panel tells homeowners that an illegal apartment means fines,
 * insurance problems and forced removal — so implying approval from a
 * photograph is the single worst thing this page could do. The scope names
 * what was BUILT. The guide beneath it explains how approval is obtained.
 *
 * PROVENANCE. Every file here was confirmed with the office. Two sets were
 * rejected during that check and must not come back without a new decision:
 *
 *   - a separate-entrance photo carrying another brokerage's watermark. The
 *     office supplied a clean original of the same entrance, which is what
 *     `SEPARATE_ENTRANCE` uses.
 *   - a third "legal basement" folder that was not a basement at all — a
 *     ground-floor room in a US new-build, with a patio door opening level
 *     onto a graded lawn. Deleted.
 *
 * That is why this file names its sources explicitly rather than globbing a
 * folder: a folder scan would have published both.
 *
 * DURATION is absent, as on every other room but bathrooms. No day bands have
 * been supplied for suites, and a suite is the longest job the company does.
 */

function shot(stem: string, alt: string, width: number, height: number): Photo {
  const scale = 1600 / width;
  return {
    src: `${stem}-1600w.webp`,
    srcSet: `${stem}-800w.webp 800w, ${stem}-1600w.webp 1600w`,
    alt,
    width: 1600,
    height: Math.round(height * scale),
  };
}

const L1 = '/Legal%20Basements/Legalized%20Basements/Legal%20Basement%201';
const L2 = '/Legal%20Basements/Legalized%20Basements/Legal%20Basement%202';
const ENTRANCE = '/Legal%20Basements/Separate%20Entrance';

/**
 * The separate entrance, as its own section.
 *
 * It earns one because it is the piece homeowners least expect and the line
 * that moves a suite budget most — $8,000 to $20,000 on the page's own cost
 * table. It is also the only part of a suite that involves excavation,
 * concrete and drainage, and none of it is visible once the door is hung.
 *
 * These three are not one job. They are three entrances, shown as a sequence
 * because together they explain the work: the excavated well, the same idea
 * finished, and the door a tenant actually walks through.
 */
export const SEPARATE_ENTRANCE: Photo[] = [
  shot(
    `${ENTRANCE}/1`,
    'Excavated basement entrance with poured concrete retaining walls, an aluminum guard and a drain at the base of the stair',
    900,
    1200,
  ),
  shot(
    `${ENTRANCE}/2`,
    'Separate entrance stairwell alongside the house, with a gate at grade and a guard around the opening',
    1600,
    1200,
  ),
  shot(
    `${ENTRANCE}/3`,
    'Finished separate entrance with the suite door open onto the lower unit',
    1024,
    1536,
  ),
];

/**
 * The four-stage progression composite the office supplied.
 *
 * This is the closest thing on the site to the "beneath the surface" layer the
 * other pages were built around and have never been able to fill: taping,
 * flooring, trim, finished, in one frame, with the crew in it. On a page about
 * legal suites it does more work than any finished room, because the argument
 * is precisely that the expensive part happens before anyone sees the space.
 */
export const SUITE_TRANSFORMATION: Photo = shot(
  '/Legal%20Basements/timelaps%20transformation',
  'The same basement at four stages: drywall and taping, flooring going down, trim, and the finished room',
  1376,
  768,
);

export const SUITE_PROJECTS: Project[] = [
  {
    slug: 'suite-lower-unit-with-bar',
    room: 'basement',
    title: 'Lower unit with an open living area and a full bar run',
    location: 'York Region',
    finished: [
      shot(`${L1}/3`, 'Bar run with a quartz counter, upper glass display and a full-height refrigerator', 2560, 1706),
      shot(`${L1}/1`, 'Open lower-level living area with recessed lighting and a boxed structural column', 2560, 1706),
      shot(`${L1}/2`, 'Finished lower unit interior', 2560, 1706),
      shot(`${L1}/4`, 'Finished lower unit interior', 2560, 1706),
      shot(`${L1}/5`, 'Finished lower unit interior', 2560, 1706),
    ],
    beneath: [],
    scope: [
      'Full lower level framed, insulated, drywalled and finished',
      'Bar run with a quartz counter, sink, upper glass display cabinets and a full-height refrigerator',
      'Structural column boxed and finished into the room',
      'Bulkheads built out around the beams and ductwork',
      'Above-grade window retained and cased',
      'Luxury vinyl plank throughout, with painted baseboard and casing',
      'Recessed lighting across the level, with pendants over the bar',
    ],
    phases: [],
  },

  {
    slug: 'suite-lower-unit-with-kitchenette',
    room: 'basement',
    title: 'Lower unit with a kitchenette and its own stair',
    location: 'Peel Region',
    finished: [
      shot(`${L2}/1`, 'Lower unit living area with a kitchenette run and the stair beyond', 2560, 1706),
      shot(`${L2}/2`, 'Finished lower unit interior', 2560, 1706),
      shot(`${L2}/3`, 'Finished lower unit interior', 2560, 1706),
    ],
    beneath: [],
    scope: [
      'Kitchenette run with shaker cabinetry, a quartz counter, sink and undercounter refrigeration',
      'Open plan living area with a separate room behind a cased opening',
      'Stair finished with wood treads, painted risers and a black handrail',
      'Bulkheads boxed and finished around the ducting',
      'Luxury vinyl plank throughout, with painted baseboard and casing',
      'Recessed lighting throughout, with under-cabinet lighting at the kitchenette',
    ],
    phases: [],
  },
];

/**
 * Loose finished photographs of suite work, for the marquee.
 *
 * Sequential filenames because the folder is numbered 1–27 with two gaps. The
 * list is written out rather than generated so that removing a rejected image
 * is a visible line in a diff — see the provenance note at the top of this file
 * for why that matters here more than elsewhere.
 */
const MORE_IDS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
  23, 24, 25, 26, 27,
];

export const SUITE_MORE_PHOTOS = MORE_IDS.map((id) => ({
  src: `/Legal%20Basements/Legalized%20Basements/Additional%20photos/${id}-1600w.webp`,
  srcSet: `/Legal%20Basements/Legalized%20Basements/Additional%20photos/${id}-800w.webp 800w, /Legal%20Basements/Legalized%20Basements/Additional%20photos/${id}-1600w.webp 1600w`,
  alt: 'Finished basement suite',
}));
