import type { ReactNode } from 'react';

/**
 * Frames a hero calculator card with a rendered Ontario home, so the card is
 * sandwiched: the house stands BEHIND it and a front-yard tree stands just IN
 * FRONT of it.
 *
 * The house and the tree are separate cut-outs (hero-house / hero-tree), so the
 * tree can be placed freely; nothing is masked out of a single photo. The
 * card's blue light leaks out only at the seam where the house goes under it
 * (screen-blended, so the white page is untouched), and the desktop tree,
 * which faces away from the card, picks up a faint rim on its near side.
 *
 * Two compositions, not one scaled:
 *
 *  - xl+ (beside): the house is tucked behind the card's right side and rises
 *    to about a third of the card's height, so the hero gets no taller. The
 *    tree stands at the card's lower-right; its canopy crosses the card's edge
 *    by 18px, inside the 28px padding, clear of every value and the CTA arrow.
 *    Below 1440px the house and tree scale down (--s) so the house still ends
 *    inside the viewport; the 18px overlap stays fixed.
 *  - <xl (above): no room beside the card, so the house sits above it at the
 *    card's width and the card rises over its foundation. The tree stands in
 *    front of the garage but BEHIND the card, dropped so its trunk base and
 *    shrubs go behind the card's top edge exactly as the house's foundation
 *    does. Drawn in front of the card at this size, the tree hovered over it
 *    with nothing grounding it.
 *
 * Geometry is tied to the renders: house 1157×677 (lawn strip at the bottom),
 * tree 699×707 (shrubs at the base).
 */
export function HeroHouse({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-[440px] [--s:0.8] xl:mx-0 xl:max-w-[360px] min-[1440px]:[--s:1]">
      {/* Above-the-card composition (< xl) */}
      <div aria-hidden className="pointer-events-none relative -mb-[10.4%] select-none xl:hidden">
        <img
          src="/images/hero/hero-house.webp"
          srcSet="/images/hero/hero-house-700.webp 700w, /images/hero/hero-house.webp 1120w"
          sizes="min(440px, calc(100vw - 32px))"
          alt=""
          width={1120}
          height={655}
          decoding="async"
          className="block h-auto w-full"
        />
        <img
          src="/images/hero/hero-tree.webp"
          alt=""
          width={440}
          height={445}
          decoding="async"
          className="absolute h-auto"
          style={{ left: '-2.9%', top: 'calc(17.7% + 26px)', width: '37.3%' }}
        />
        {/* Seam light: the card's glow leaking up onto the house where it
            goes under the card's top edge. Screen blend, so the white page
            stays white and only the render picks up the blue. */}
        <div
          className="absolute inset-x-[4%] h-[34%] mix-blend-screen"
          style={{
            bottom: '17.8%',
            background:
              'radial-gradient(ellipse 60% 100% at 50% 100%, rgba(56,189,248,0.9), rgba(56,189,248,0.32) 40%, transparent 75%)',
          }}
        />
        <div
          className="absolute inset-x-[14%] h-3 translate-y-1/2 rounded-full bg-sky-400/70 blur-md"
          style={{ bottom: '17.8%' }}
        />
      </div>

      {/* Beside-the-card composition (xl+) */}
      <img
        aria-hidden
        src="/images/hero/hero-house.webp"
        srcSet="/images/hero/hero-house-700.webp 700w, /images/hero/hero-house.webp 1120w"
        sizes="(min-width: 1440px) 560px, 448px"
        alt=""
        width={1120}
        height={655}
        decoding="async"
        className="pointer-events-none absolute bottom-[28px] hidden h-auto max-w-none select-none xl:block"
        style={{ left: 'calc(360px - 310px * var(--s))', width: 'calc(560px * var(--s))' }}
      />
      {/* Seam light (xl+): glow leaking out from under the card's right edge
          onto the tucked-in side of the house. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-[12%] left-[330px] hidden w-[150px] mix-blend-screen xl:block"
        style={{
          background:
            'radial-gradient(ellipse 100% 60% at 0% 62%, rgba(56,189,248,0.9), rgba(56,189,248,0.32) 40%, transparent 75%)',
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-[22%] left-[354px] hidden w-3 rounded-full bg-sky-400/70 blur-md xl:block"
      />

      <div className="relative z-10">{children}</div>

      <img
        aria-hidden
        src="/images/hero/hero-tree.webp"
        alt=""
        width={440}
        height={445}
        decoding="async"
        className="pointer-events-none absolute bottom-[32px] z-20 hidden h-auto max-w-none select-none drop-shadow-[-6px_0_14px_rgba(56,189,248,0.28)] xl:block"
        style={{ left: '342px', width: 'calc(200px * var(--s))' }}
      />
    </div>
  );
}
