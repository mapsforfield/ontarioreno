import type { Photo, Project } from './types';

/**
 * Bathroom dossiers.
 *
 * WHAT IS SOURCED FROM WHERE — read this before editing.
 *
 * PHOTOGRAPHS are real completed projects, supplied by the office. Folder
 * `public/Bathroom/BathroomNN/` is one job shot from several angles, so a
 * folder maps to exactly one dossier and the angles are that dossier's gallery.
 *
 * SCOPE is read off those photographs. Every line below describes something
 * visible in the frames — a frameless enclosure, a two-tier niche, an
 * undermount sink in quartz. Nothing describes work that cannot be seen: no
 * membrane brand, no board type, no plumbing route, because the finished photo
 * cannot show any of that and we were not there. If you add a line, be able to
 * point at the pixel that justifies it.
 *
 * DURATION is the office's own banding, applied by matching each room to its
 * category:
 *   cosmetic / small powder room ............ 4, 5, 6 days
 *   standard 3-piece tub or shower .......... 8, 9, 11, 12 days
 *   large primary ensuite ................... 14, 16, 18, 21 days
 *
 * LOCATION is a REGION, never an address or a city. Client privacy: a
 * homeowner who let us photograph their bathroom did not agree to have their
 * town published next to it, and the region carries everything a reader
 * actually needs — that the work is GTA-wide. Deliberate, per the office.
 *
 * INVESTMENT IS NOT HERE AND MUST NOT COME BACK. Pricing happens in the home
 * with the room measured. Publishing what a past job cost invites a homeowner
 * to anchor on someone else's bathroom and puts the consultant in the position
 * of explaining a number they did not quote.
 *
 * BEFORE PHOTOGRAPHS exist for one project only. The rest are finished-only,
 * and that is fine — these were completed before the process captured
 * in-progress work. `beneath` stays empty everywhere and renders nothing.
 */

/**
 * Build a photo entry pointing at the DISPLAY-SIZED variants, not the camera
 * original.
 *
 * `scripts/resize-project-photos.mjs` writes `<stem>-800w.webp` and
 * `<stem>-1600w.webp` next to every source file. The originals stay on disk and
 * are never served: a 6000px JPEG squeezed into a 320px box is where the
 * shimmer on the tile came from, and it cost about 10MB of page weight for the
 * privilege.
 *
 * `width`/`height` describe the 1600w variant, so the browser reserves the
 * right box before anything decodes.
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

export const BATHROOM_PROJECTS: Project[] = [
  {
    slug: 'bathroom-ensuite-wet-room',
    room: 'bathroom',
    title: 'Primary ensuite, tub and shower in one wet room',
    location: 'Durham Region',
    finished: [
      {
        src: '/images/bathroom-reno/before-after/pair-1-after.webp',
        alt: 'Primary ensuite with a freestanding tub and walk-in shower behind one glass enclosure',
        width: 1080,
        height: 813,
      },
    ],
    beneath: [],
    scope: [
      'Freestanding soaker tub and shower combined behind a single frameless glass enclosure',
      'Marble-look large-format porcelain to the vaulted ceiling',
      'Mosaic shower floor, curbed and drained to a centre point',
      'Arched window retained and tiled around inside the wet area',
      'Double vanity in shaker doors with a quartz top and undermount basins',
      'Backlit mirror and wall sconces at each station',
      'Champagne bronze fixtures throughout, including a wall-mounted tub filler',
      'Wood-look plank flooring outside the enclosure',
    ],
    phases: [{ name: 'On site', duration: '21 days' }],
    beforeAfter: {
      before: {
        src: '/images/bathroom-reno/before-after/pair-1-before.webp',
        alt: 'The same ensuite before the renovation',
        width: 1080,
        height: 813,
      },
      after: {
        src: '/images/bathroom-reno/before-after/pair-1-after.webp',
        alt: 'The same ensuite after the renovation',
        width: 1080,
        height: 813,
      },
    },
  },

  {
    slug: 'bathroom-ensuite-freestanding-tub',
    room: 'bathroom',
    title: 'Primary ensuite with freestanding tub and walk-in shower',
    location: 'North York',
    finished: [
      shot(
        '/Bathroom/Bathroom04/bathrom000001',
        'Primary ensuite with a freestanding tub, glass corner shower and double vanity',
        6000,
        4000,
      ),
      shot(
        '/Bathroom/Bathroom04/bathrom000002',
        'Ensuite shower enclosure in large-format porcelain',
        6000,
        4000,
      ),
      shot(
        '/Bathroom/Bathroom04/bathrom000003',
        'Double vanity with brushed gold fixtures and a framed mirror',
        6000,
        4000,
      ),
      shot(
        '/Bathroom/Bathroom04/bathrom000004',
        'Freestanding tub with a floor-mounted filler',
        6000,
        4000,
      ),
    ],
    beneath: [],
    scope: [
      'Freestanding soaker tub with a floor-mounted filler and handheld',
      'Frameless glass corner shower with a low-profile entry',
      'Rainfall head and handheld on a slide bar, on a single wall valve',
      'Mosaic shower floor with a recessed niche in the wet wall',
      'Book-matched large-format porcelain to the ceiling',
      'Double vanity with a quartz top and undermount basins',
      'Brushed gold fixtures, pulls, mirror frame and lighting',
      'Pot lights, a pendant over the tub, and a ceiling exhaust fan',
    ],
    phases: [{ name: 'On site', duration: '21 days' }],
  },

  {
    slug: 'bathroom-ensuite-double-vanity',
    room: 'bathroom',
    title: 'Primary ensuite, corner shower and double vanity',
    location: 'York Region',
    finished: [
      shot(
        '/Bathroom/Bathroom01/bathroom%20001',
        'Ensuite double vanity with round mirrors and matte black fixtures',
        2877,
        1920,
      ),
      shot(
        '/Bathroom/Bathroom01/bathroom%20007',
        'Corner shower in marble-look porcelain with a frameless glass enclosure',
        2875,
        1920,
      ),
      shot(
        '/Bathroom/Bathroom01/bathroom%20004',
        'Ensuite seen from the shower, with the vanity and linen tower beyond',
        2877,
        1920,
      ),
      shot(
        '/Bathroom/Bathroom01/bathroom%20005',
        'Detail of the vanity and quartz countertop',
        2880,
        1920,
      ),
      shot(
        '/Bathroom/Bathroom01/bathroom%20008',
        'Ensuite shower and toilet from the doorway',
        2879,
        1920,
      ),
    ],
    beneath: [],
    scope: [
      'Frameless glass corner shower with a tiled curb',
      'Rainfall head and handheld on a slide bar, on one wall valve',
      'Hexagon mosaic shower floor and a matching recessed niche',
      'Marble-look large-format porcelain on the walls and floor',
      'Double vanity in shaker doors with a quartz top and undermount basins',
      'Floor-to-ceiling linen tower built in beside the vanity',
      'Round mirrors with linear LED sconces above each basin',
      'One-piece skirted toilet',
      'Matte black fixtures and hardware throughout',
    ],
    phases: [{ name: 'On site', duration: '16 days' }],
  },

  {
    slug: 'bathroom-three-piece-walk-in',
    room: 'bathroom',
    title: 'Three-piece with a walk-in glass shower',
    location: 'East York',
    finished: [
      shot(
        '/Bathroom/Bathroom03/bathroom00002',
        'Three-piece bathroom with a grey vanity and a walk-in glass shower',
        4096,
        2731,
      ),
      shot(
        '/Bathroom/Bathroom03/bathroom00004',
        'Shower wall in marble-look porcelain with a two-tier niche',
        4096,
        2731,
      ),
      shot(
        '/Bathroom/Bathroom03/bathroom00001',
        'Grey shaker vanity with a quartz top and undermount basin',
        4096,
        2731,
      ),
      shot(
        '/Bathroom/Bathroom03/bathroom00003',
        'Walk-in shower seen through the glass panel',
        4096,
        2731,
      ),
      shot(
        '/Bathroom/Bathroom03/bathroom00005',
        'Three-piece bathroom from the doorway',
        4096,
        2731,
      ),
    ],
    scope: [
      'Tub removed and replaced with a walk-in shower',
      'Frameless glass panel with a fixed return',
      'Rainfall head and handheld on a slide bar, on one wall valve',
      'Two-tier recessed niche with a herringbone mosaic back',
      'Marble-look large-format porcelain on the shower walls',
      'Grey shaker vanity with a quartz top, integrated backsplash and undermount basin',
      'Frameless mirror with a vanity light bar above',
      'Obscured glass retained at the window',
      'Brushed nickel fixtures and hardware throughout',
    ],
    beneath: [],
    phases: [{ name: 'On site', duration: '11 days' }],
  },

  {
    slug: 'bathroom-three-piece-tub-shower',
    room: 'bathroom',
    title: 'Three-piece with a tub and shower combination',
    location: 'Peel Region',
    finished: [
      shot(
        '/Bathroom/Bathroom02/bathroom0001',
        'Three-piece bathroom with a tub and shower combination and a white vanity',
        4096,
        2731,
      ),
      shot(
        '/Bathroom/Bathroom02/bathroom0003',
        'Tub surround in stone-look porcelain with a two-tier niche',
        4096,
        2731,
      ),
      shot(
        '/Bathroom/Bathroom02/bathroom0002',
        'Vanity with a quartz top, undermount basin and framed mirror',
        4096,
        2731,
      ),
      shot(
        '/Bathroom/Bathroom02/bathroom0004',
        'Three-piece bathroom from the doorway',
        4096,
        2731,
      ),
    ],
    beneath: [],
    scope: [
      'Alcove tub with a sliding glass door on a black rail',
      'Stone-look large-format porcelain surround, tiled to the ceiling',
      'Two-tier recessed niche trimmed in black',
      'Obscured glass retained at the window inside the wet area',
      'Vanity in shaker doors with a quartz top, integrated backsplash and undermount basin',
      'Widespread faucet and a framed mirror with a light bar above',
      'Porcelain floor tile with a linear floor register',
      'Matte black fixtures and hardware throughout',
    ],
    phases: [{ name: 'On site', duration: '9 days' }],
  },
];
