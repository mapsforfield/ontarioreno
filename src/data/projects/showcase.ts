/**
 * Home page imagery.
 *
 * WHY THIS FILE EXISTS SEPARATELY. The home page does not need a project's
 * scope, phases or dossier — it needs one frame per room and a short label. It
 * points at the SAME resized variants the hub pages serve, so a photograph is
 * never encoded twice and the home page can never drift onto a file the hub
 * pages have retired.
 *
 * Everything here obeys the rules in bathroom.ts. In particular:
 *
 *   - LOCATION IS A REGION, never a town. Same privacy call as the hub pages.
 *   - NOTHING ASSERTS LEGAL STATUS. The suite tile says "Lower unit", not
 *     "legal suite" — a photograph cannot show a permit. The Legal Suites hub
 *     card links to the guide, which is where approval is explained.
 *   - The labels describe what the photograph shows and nothing more.
 */

export type ShowcaseTile = {
  src: string;
  srcSet: string;
  alt: string;
  /** What the room is. Short — this sits under a photo, not in a paragraph. */
  room: string;
  /** Region, never a town. */
  region: string;
};

function tile(
  stem: string,
  alt: string,
  room: string,
  region: string,
): ShowcaseTile {
  return {
    src: `${stem}-1600w.webp`,
    srcSet: `${stem}-800w.webp 800w, ${stem}-1600w.webp 1600w`,
    alt,
    room,
    region,
  };
}

/**
 * The four hub cards.
 *
 * One frame each, chosen as the clearest single statement of that trade rather
 * than the prettiest photograph in the folder — a card has one job, which is to
 * tell a homeowner "this is the one I am here for".
 */
export const HUB_CARDS = [
  {
    to: '/basements',
    title: 'Basement Finishing',
    body: 'From framing to flooring, understand the costs and process of finishing your Ontario basement.',
    photo: tile(
      '/Basement/Basement%203/55',
      'Finished basement with a projection media wall and a bar beyond',
      'Lower level',
      'York Region',
    ),
  },
  {
    to: '/legal-suites',
    title: 'Legal Secondary Suites',
    body: 'Navigate zoning, fire separation, and municipal requirements to build a legal income suite.',
    photo: tile(
      '/Legal%20Basements/Separate%20Entrance/3',
      'Finished separate entrance with the suite door open onto the lower unit',
      'Separate entrance',
      'Peel Region',
    ),
  },
  {
    to: '/kitchen-renovations',
    title: 'Kitchen Renovations',
    body: 'Real pricing for cabinets, countertops, and layout changes across Ontario kitchens.',
    photo: tile(
      '/Kitchen/Kitchen1/kitchen01',
      'Finished kitchen with a quartz island, white cabinetry and a full pantry wall',
      'Kitchen',
      'York Region',
    ),
  },
  {
    to: '/bathroom-renovations',
    title: 'Bathroom Renovations',
    body: 'Waterproofing, plumbing, and tile costs explained before you start your project.',
    photo: tile(
      '/Bathroom/Bathroom04/bathrom000001',
      'Primary ensuite with a freestanding tub, glass corner shower and double vanity',
      'Primary ensuite',
      'North York',
    ),
  },
];
