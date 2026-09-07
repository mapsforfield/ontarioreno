import type { Photo, Project } from './types';

/**
 * Basement dossiers.
 *
 * Same rules as bathroom.ts — read that file's header first. Scope is read off
 * the photographs and nothing is claimed that a finished photo cannot show;
 * location is a REGION, never a town; there is no price field and one must not
 * be added; anything unknown renders a visible [NEEDS: …] marker.
 *
 * BASEMENTS NEED ONE EXTRA RULE, AND IT MATTERS MORE HERE THAN ANYWHERE.
 *
 * A basement is either a legal secondary suite or it is not, and that is a
 * LEGAL status granted by a municipality after inspection — not something
 * anyone can read off a photograph. Calling a finished basement "legal" when
 * it has no permit is a claim a homeowner could act on, and the site has a
 * whole separate page devoted to what legalisation actually involves.
 *
 * So: the word "legal" does not appear in any scope line below. Where a
 * photograph plainly shows a code feature that was built — an illuminated exit
 * sign, an interconnected smoke alarm, a separate entrance — the FEATURE is
 * named, because the feature is visible. The STATUS is never asserted, because
 * it is not.
 *
 * DURATION: the office has supplied day bands for bathrooms only. Nothing for
 * basements, and a basement is the longest of the three by a wide margin. So
 * `phases` is empty and the duration line does not render. Same reasoning as
 * kitchen.ts: a guess a consultant then contradicts is worse than a gap.
 *
 * `beneath` is empty throughout — these were finished before any process
 * captured framing, insulation or rough-in. That is a real loss on a basement
 * page, where underpinning, waterproofing and insulation are exactly the
 * expensive invisible work, and it is worth photographing on the next job.
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

const B1 = '/Basement/Basement%201';
const B2 = '/Basement/Basement%202';
const B3 = '/Basement/Basement%203';

export const BASEMENT_PROJECTS: Project[] = [
  {
    slug: 'basement-entertainment-level',
    room: 'basement',
    title: 'Full lower level with a media wall, bar and games room',
    location: 'York Region',
    finished: [
      shot(`${B3}/55`, 'Finished basement with a projection media wall and a bar beyond', 2560, 1706),
      shot(`${B3}/22`, 'Open-riser stair with stained treads and black spindles', 2560, 1706),
      shot(`${B3}/66`, 'Games area with a billiards table, seen through to the lounge', 2560, 1706),
      shot(`${B3}/44`, 'Laundry room with cabinetry, a folding counter and open shelving', 2560, 1706),
      shot(`${B3}/33`, 'Finished basement interior', 2560, 1706),
      shot(`${B3}/11`, 'Finished basement detail', 1594, 2400),
    ],
    beneath: [],
    scope: [
      'Open-riser stair rebuilt with stained treads, a matching handrail and black spindles',
      'Built-in media wall in dark millwork, housing a projection screen with a ceiling-mounted projector',
      'Bar and kitchenette with a brick backsplash, counter seating and a full-height refrigerator',
      'Dining nook with a built-in banquette',
      'Games area laid out for a billiards table and shuffleboard',
      'Laundry room with cabinetry, a folding counter and open shelving',
      'Luxury vinyl plank throughout, over a levelled slab',
      'Recessed lighting on multiple zones, with in-ceiling speakers',
      'Bulkheads boxed and finished around the beams and ductwork',
    ],
    phases: [],
  },

  {
    slug: 'basement-rec-room-and-bath',
    room: 'basement',
    title: 'Open rec room with a three-piece bath',
    location: 'Peel Region',
    finished: [
      shot(`${B2}/333`, 'Open finished basement rec room with plank flooring', 1600, 1068),
      shot(`${B2}/111`, 'Landing at the foot of the stairs, looking through to the rec room and bath', 1600, 1068),
      shot(`${B2}/444`, 'Rec room with recessed lighting and boxed bulkheads', 1600, 1068),
      shot(`${B2}/222`, 'Refinished stair with wood treads and an oak handrail', 1068, 1600),
    ],
    beneath: [],
    scope: [
      'Stair refinished with wood treads and a solid oak handrail',
      'Open rec room framed and drywalled, with the beam boxed into a bulkhead',
      'Three-piece bathroom added off the landing',
      'A separate room finished behind a wide opening, painted in a dark accent',
      'Wide-plank flooring carried through the whole level',
      'Recessed lighting throughout, with returns and supply registers tied into the existing system',
      'Matte black door hardware and lever sets',
    ],
    phases: [],
  },

  {
    slug: 'basement-secondary-suite',
    room: 'basement',
    title: 'Self-contained lower unit with its own entrance and laundry',
    location: 'Durham Region',
    finished: [
      shot(`${B1}/5555`, 'Bedroom with a mirrored closet and a hardwired smoke alarm', 1600, 1066),
      shot(`${B1}/1111`, 'Separate stair entrance with an illuminated exit sign at the top', 1600, 1066),
      shot(`${B1}/3333`, 'In-suite laundry closet with a stacked washer and dryer', 1600, 1066),
      shot(`${B1}/2222`, 'Hall with the laundry closet and a lockable door', 1600, 1066),
      shot(`${B1}/4444`, 'Finished lower unit interior', 1600, 1066),
    ],
    beneath: [],
    /*
     * Every line here names something visible in the frames. Note what is NOT
     * claimed: nothing says "legal", "permitted" or "code compliant". The exit
     * sign and the hardwired alarm are named because they are in the photograph;
     * the status they point at is a municipal decision and is not ours to state.
     */
    scope: [
      'Separate stair entrance finished with its own lockable door',
      'Illuminated exit sign and emergency lighting at the head of the stair',
      'Hardwired, interconnected smoke alarms in the bedroom and hall',
      'Bedroom with a mirrored sliding closet and an above-grade window in a widened well',
      'In-suite stacked laundry in its own closet',
      'Separate storage room off the hall',
      'Luxury vinyl plank throughout, with painted baseboard and casing',
      'Bulkheads boxed and finished around the ducting',
      'Recessed lighting throughout',
    ],
    phases: [],
  },
];

/**
 * The loose finished photographs for the marquee.
 *
 * Landscape, like the kitchens: a basement is a wide room and the portrait tile
 * the bathroom page uses crops the span the photograph exists to show.
 */
export const BASEMENT_MORE_PHOTOS = Array.from({ length: 8 }, (_, i) => ({
  src: `/Basement/Basement%20Additional%20Photos/${i + 1}-1600w.webp`,
  srcSet: `/Basement/Basement%20Additional%20Photos/${i + 1}-800w.webp 800w, /Basement/Basement%20Additional%20Photos/${i + 1}-1600w.webp 1600w`,
  alt: 'Finished basement renovation',
}));
