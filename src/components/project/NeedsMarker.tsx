/**
 * A visible marker where a fact is missing.
 *
 * The alternative — hiding the field, or writing something plausible — is what
 * this whole redesign exists to avoid. A homeowner who checks a claimed
 * duration or city against the real job and finds it invented has taken the
 * page's only asset and thrown it out.
 *
 * So it is loud on purpose. Amber, monospaced, bracketed: nobody reviewing the
 * page can mistake it for finished copy, and nobody can ship it by accident.
 */
export function NeedsMarker({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded border border-amber-300 bg-amber-50 px-2 py-0.5 font-mono text-[0.7rem] font-semibold uppercase tracking-wide text-amber-800">
      [needs: {label}]
    </span>
  );
}
