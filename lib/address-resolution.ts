// ─── Why an address failed to resolve ─────────────────────────────────────────
// Routing only cares THAT an address is unverified. Operations care WHY, because
// the two causes need opposite responses:
//
//   - The homeowner gave us something we cannot confirm (no unit number, a
//     place that standardised without a postal code, a municipality we do not
//     map yet). Manual review is the correct outcome; a person reads it.
//
//   - Our address provider was absent, erroring, or out of daily budget. The
//     address may have been perfectly good. Manual review here is OUR failure
//     leaking into the queue, and it will keep happening — silently, at volume
//     — until somebody restores the provider.
//
// Recording the cause on the lead makes the second kind visible after the fact;
// alerting on it makes it visible while it is still happening. This module is
// deliberately free of routing rules: it explains an input, it decides nothing.

export type AddressResolutionCause =
  /** Standardised cleanly into a municipality we map. */
  | 'RESOLVED'
  /**
   * No suggestion was picked, but the text the homeowner typed matched exactly
   * one real address, which then standardised cleanly. Weaker evidence than a
   * picked suggestion — nobody chose this from a list — but strong enough to
   * schedule on, because a single unambiguous match is not an ambiguity.
   */
  | 'RESOLVED_FROM_TYPED_TEXT'
  /** Typed text matched several real addresses; picking one for them would guess. */
  | 'TYPED_TEXT_AMBIGUOUS'
  /** Typed text matched no real address at all. */
  | 'TYPED_TEXT_NO_MATCH'
  /** Confidently outside Ontario — the one address fact we decline on. */
  | 'OUTSIDE_ONTARIO'
  /** Resolved, but missing a street number, route or postal code. */
  | 'INCOMPLETE_ADDRESS'
  /** Resolved and complete, but the municipality maps to no scheduling area. */
  | 'MUNICIPALITY_UNMAPPED'
  /** The homeowner typed free text instead of picking a suggestion. */
  | 'NO_PLACE_SELECTED'
  /** GOOGLE_PLACES_API_KEY is not set in this environment. */
  | 'PROVIDER_NOT_CONFIGURED'
  /** The daily billable-call ceiling is spent, so we stopped suggesting. */
  | 'PROVIDER_QUOTA_EXHAUSTED'
  /** The provider was reached but errored, or returned something unusable. */
  | 'PROVIDER_ERROR';

/**
 * Causes that are our infrastructure failing, not the homeowner's address.
 *
 * NO_PLACE_SELECTED is deliberately excluded: on a healthy system it means the
 * homeowner ignored the suggestions, which is their choice and not an incident.
 * When the provider is down or capped there are no suggestions to ignore, and
 * the caller resolves the cause to the provider reason instead of this one.
 */
const PROVIDER_DEGRADED = new Set<AddressResolutionCause>([
  'PROVIDER_NOT_CONFIGURED',
  'PROVIDER_QUOTA_EXHAUSTED',
  'PROVIDER_ERROR',
]);

export function isProviderDegradation(cause: AddressResolutionCause): boolean {
  return PROVIDER_DEGRADED.has(cause);
}

/** Operator-facing sentence. Says what broke and what to do about it. */
export function describeCause(cause: AddressResolutionCause): string {
  switch (cause) {
    case 'RESOLVED':
      return 'Address resolved normally.';
    case 'RESOLVED_FROM_TYPED_TEXT':
      return 'No suggestion was picked, but the typed address matched exactly one real address and resolved cleanly. Worth an eye before the visit — it was never chosen from a list.';
    case 'TYPED_TEXT_AMBIGUOUS':
      return 'No suggestion was picked, and the typed address matched more than one real address, so none could be chosen without guessing.';
    case 'TYPED_TEXT_NO_MATCH':
      return 'No suggestion was picked, and the typed address matched no real address.';
    case 'OUTSIDE_ONTARIO':
      return 'Address resolved to a province outside Ontario.';
    case 'INCOMPLETE_ADDRESS':
      return 'Address resolved but was missing a street number, street or postal code, so a dwelling could not be confirmed.';
    case 'MUNICIPALITY_UNMAPPED':
      return 'Address resolved completely, but its municipality is not mapped to a scheduling area yet.';
    case 'NO_PLACE_SELECTED':
      return 'The homeowner typed an address instead of choosing one of the suggestions.';
    case 'PROVIDER_NOT_CONFIGURED':
      return 'GOOGLE_PLACES_API_KEY is not set, so no address could be verified. Every submission in this environment is going to manual review regardless of its address.';
    case 'PROVIDER_QUOTA_EXHAUSTED':
      return 'The daily Places autocomplete budget is spent, so homeowners are being shown no suggestions and their typed addresses cannot be verified.';
    case 'PROVIDER_ERROR':
      return 'The Places API was called but failed or returned an unusable response.';
  }
}
