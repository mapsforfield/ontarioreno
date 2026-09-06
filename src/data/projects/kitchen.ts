import type { Photo, Project } from './types';

/**
 * Kitchen dossiers.
 *
 * Same rules as bathroom.ts — read that file's header first, it is the longer
 * version. In short: scope is read off the photographs and nothing is claimed
 * that a finished photo cannot show; location is a REGION, never a town;
 * there is no price field and one must not be added; anything unknown renders
 * a visible [NEEDS: …] marker rather than being invented.
 *
 * DURATION IS THE ONE THING MISSING. The office supplied day bands for
 * bathrooms (cosmetic 4-6, three-piece 8-12, primary ensuite 14-21) but has
 * not yet supplied the equivalent for kitchens, and a kitchen is not a
 * bathroom — cabinet lead times, counter templating and the gap between
 * teardown and install make the shape of the schedule different. So `phases`
 * is empty on every kitchen and the duration line simply does not render.
 *
 * Guessing here would be worse than the gap. A homeowner who is told "14 days"
 * and then hears eight weeks from the consultant has been misled by this page
 * before anyone met them. Fill these in when the bands arrive; the component
 * already renders them.
 *
 * `beneath` is empty throughout for the same reason as the bathrooms: these
 * jobs were completed before any process captured demolition or rough-in.
 * Kitchen3 is the exception in spirit — it has a genuine BEFORE frame — but a
 * before photo is not an in-progress photo and is not treated as one.
 */

/**
 * Display-sized variants, built by scripts/resize-project-photos.mjs.
 * See the identical helper in bathroom.ts for why the originals are never
 * served directly.
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

export const KITCHEN_PROJECTS: Project[] = [
  {
    slug: 'kitchen-gut-and-replace',
    room: 'kitchen',
    title: 'Full kitchen replacement, dated oak stripped out',
    location: 'Durham Region',
    finished: [
      shot(
        '/Kitchen/Kitchen3/Afterkitchen0004',
        'Finished kitchen with an island, quartzite-look counters and a stainless refrigerator',
        4096,
        2733,
      ),
      shot(
        '/Kitchen/Kitchen3/Afterkitchen0002',
        'Sink run with a full-height stone backsplash and a brushed gold faucet',
        4096,
        2733,
      ),
      shot(
        '/Kitchen/Kitchen3/Afterkitchen0003',
        'Finished kitchen cabinetry and counter detail',
        4096,
        2733,
      ),
    ],
    beneath: [],
    scope: [
      'Original oak cabinets, granite counters and patterned tile backsplash removed',
      'New shaker cabinetry in a warm off-white, with a wood-fronted island',
      'Stone-look counters carried up the wall as a full-height slab backsplash',
      'Undermount sink with a brushed gold pull-down faucet',
      'Textured ceiling taken off and refinished flat',
      'Window trim replaced and the surround tiled back into the counter run',
      'Brushed gold pulls throughout',
    ],
    phases: [],
    beforeAfter: {
      before: shot(
        '/Kitchen/Kitchen3/BEFOREkitchen0001',
        'The same kitchen before the renovation, with dated oak cabinets and a tile backsplash',
        4096,
        2733,
      ),
      after: shot(
        '/Kitchen/Kitchen3/Afterkitchen0002',
        'The same kitchen after the renovation',
        4096,
        2733,
      ),
    },
  },

  {
    slug: 'kitchen-island-and-pantry',
    room: 'kitchen',
    title: 'Kitchen with an island and a floor-to-ceiling pantry wall',
    location: 'York Region',
    finished: [
      shot(
        '/Kitchen/Kitchen1/kitchen01',
        'Finished kitchen with a quartz island, white cabinetry and a full pantry wall',
        6000,
        4000,
      ),
      shot(
        '/Kitchen/Kitchen1/kitchen03',
        'Sink run with a book-matched quartz backsplash and brushed gold fixtures',
        6000,
        4000,
      ),
      shot(
        '/Kitchen/Kitchen1/kitchen02',
        'Kitchen island seating and cabinetry',
        6000,
        4000,
      ),
      shot(
        '/Kitchen/Kitchen1/kitchen04',
        'Range wall with a stainless chimney hood',
        6000,
        4000,
      ),
      shot(
        '/Kitchen/Kitchen1/kitchen05',
        'Finished kitchen from the dining side',
        6000,
        4000,
      ),
    ],
    beneath: [],
    scope: [
      'Quartz island with a waterfall end and seating for two',
      'Book-matched quartz backsplash carried full height behind the sink and range',
      'Shaker cabinetry to the ceiling with a bulkhead built out above',
      'Floor-to-ceiling pantry bank beside the refrigerator, plus a glazed display cabinet',
      'Stainless chimney hood with the range wall opened up around it',
      'Undermount double sink with a brushed gold pull-down faucet and filter tap',
      'Recessed pot lights and under-cabinet lighting throughout',
      'Large-format polished porcelain floor tile',
    ],
    phases: [],
  },

  {
    slug: 'kitchen-galley-reworked',
    room: 'kitchen',
    title: 'Galley kitchen with a peninsula and cooktop run',
    location: 'Peel Region',
    finished: [
      shot(
        '/Kitchen/Kitchen2/kitchen001',
        'Galley kitchen with white cabinetry, quartz counters and a cooktop peninsula',
        4096,
        2730,
      ),
      shot(
        '/Kitchen/Kitchen2/kitchen002',
        'Kitchen cabinetry and counter run',
        4096,
        2732,
      ),
      shot(
        '/Kitchen/Kitchen2/kitchen003',
        'Sink run with a stone backsplash and matte black faucet',
        4096,
        2731,
      ),
      shot(
        '/Kitchen/Kitchen2/kitchen004',
        'Finished kitchen looking through to the dining area',
        4096,
        2733,
      ),
    ],
    beneath: [],
    scope: [
      'Shaker cabinetry in white with matte black bar pulls',
      'Quartz counters with a stone-look slab backsplash behind the sink and cooktop',
      'Peninsula with an induction cooktop and a downdraft-height counter run',
      'Undermount double sink with a matte black pull-down faucet',
      'Integrated dishwasher panel and a stainless refrigerator recessed into the cabinet run',
      'Under-cabinet lighting and recessed pot lights',
      'Porcelain floor tile carried through to the adjoining room',
    ],
    phases: [],
  },
];

/**
 * The loose finished photographs for the marquee.
 *
 * Landscape, unlike the bathroom set: kitchens are wide rooms and a 3:4 tile
 * crops the run of cabinetry that the photograph exists to show.
 */
export const KITCHEN_MORE_PHOTOS = Array.from({ length: 17 }, (_, i) => ({
  src: `/Kitchen/More%20Photos/${i + 1}-1600w.webp`,
  srcSet: `/Kitchen/More%20Photos/${i + 1}-800w.webp 800w, /Kitchen/More%20Photos/${i + 1}-1600w.webp 1600w`,
  alt: 'Finished kitchen renovation',
}));
