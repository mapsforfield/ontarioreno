// ─── Scope-of-work presets ───────────────────────────────────────────────────
//
// The scope is the bulk of every agreement and the part reps spend the longest
// on. These presets pre-load the line items we actually quote, drawn from the
// agreements we've closed, so a rep starts from a near-complete scope and edits
// rather than typing forty rows at the kitchen table.
//
// `detail` is the right-hand spec column — leave it blank where the item needs
// no qualification, fill it where the homeowner is choosing something.

export type ScopeLine = {
  id: string;
  /** Left column — what the work is. */
  item: string;
  /** Right column — the spec, material, count or qualifier. */
  detail: string;
};

export type ScopePreset = {
  id: string;
  label: string;
  /** Shown under the label in the preset picker. */
  description: string;
  /** Deal project types that should surface this preset first. */
  matches: string[];
  lines: Array<Omit<ScopeLine, 'id'>>;
};

export const SCOPE_PRESETS: ScopePreset[] = [
  {
    id: 'basement-legal-suite',
    label: 'Basement — Legal Second Dwelling',
    description: 'Full permit-ready basement suite: framing through appliances. ~35 lines.',
    matches: ['basement', 'legal suite', 'second dwelling', 'secondary suite'],
    lines: [
      { item: 'Job materials', detail: 'Included' },
      { item: 'Demolition of existing basement', detail: 'Approx. ___ sq ft' },
      { item: 'Renovation of basement to permit a second dwelling, plus owner area', detail: '' },
      { item: 'Dimmable pot lights throughout basement — common areas, washroom, bedrooms, kitchen', detail: '___ pcs, 4 inch' },
      { item: 'Flooring in basement', detail: 'Luxury vinyl plank with 30-year manufacturer warranty' },
      { item: 'Stairs leading to basement', detail: 'Finished to match upper-floor flooring' },
      { item: 'Basement painting', detail: 'Benjamin Moore' },
      { item: 'Smoke detectors and carbon monoxide monitors', detail: 'Interconnected, per code' },
      { item: 'HVAC ventilation to bedrooms and living areas', detail: '' },
      { item: 'New windows', detail: '___ total, including one egress' },
      { item: 'New doors throughout basement', detail: 'Standard doors as per code' },
      { item: 'Furnace room fitted with lockable door', detail: 'Restricts tenant access' },
      { item: 'New bedrooms', detail: '___ bedrooms, each with 4 dimmable pot lights and closet with swing doors' },
      { item: '3-piece washroom', detail: 'Vanity, standing glass shower, LED mirror, vent, 24x24 porcelain tile, black fixtures' },
      { item: 'Laundry rough-in for tenant', detail: 'Located in bathroom' },
      { item: 'New kitchen in rental area', detail: 'Quartz countertop, 36" sink, backsplash, LVP flooring, MDF/melamine cabinets, soft-close hinges (lifetime warranty), 6 dimmable pot lights' },
      { item: 'Kitchen island', detail: '3 ft x 4 ft' },
      { item: 'Storage area for owner', detail: '' },
      { item: 'Fire separation in all areas required by permit', detail: '' },
      { item: 'Electrical panel upgrade to 200 amps', detail: 'Subject to city approval; some municipalities cap at 125 or 150 amps depending on local code and existing infrastructure' },
      { item: 'Sprinkler in furnace room', detail: '' },
      { item: 'Soundproofed ceiling', detail: '' },
      { item: 'Electrical work', detail: 'Permit-compliant, by licensed electrician' },
      { item: 'Plumbing work', detail: 'Permit-compliant, by licensed plumber' },
      { item: 'Construction drawing fees', detail: 'Included' },
      { item: '3D rendering to visualise the finished project', detail: 'Included' },
      { item: 'Shoe mould and baseboards installed', detail: '' },
      { item: 'Refrigerator', detail: 'Model selection to be confirmed' },
      { item: 'Electric range', detail: 'Model selection to be confirmed' },
      { item: 'Microwave and range hood', detail: 'Model selection to be confirmed' },
      { item: 'All-in-one washer/dryer', detail: 'Model selection to be confirmed' },
      { item: 'Extended warranty on all appliances', detail: '2-year premium coverage' },
      { item: 'Project timeline', detail: '___ weeks' },
      { item: 'Code compliance', detail: 'Work follows city code and the permit provided by the Owner. The Contractor is not liable for code changes not reflected on the permit, or for illegal prior work discovered by the city that the permit does not cover.' },
    ],
  },
  {
    id: 'kitchen-renovation',
    label: 'Kitchen Renovation',
    description: 'Full kitchen gut and rebuild — cabinets, counters, appliances.',
    matches: ['kitchen'],
    lines: [
      { item: 'Job materials', detail: 'Included' },
      { item: 'Demolition and removal of existing kitchen', detail: 'Disposal included' },
      { item: 'New cabinetry', detail: 'MDF/melamine, soft-close hinges with lifetime warranty' },
      { item: 'Countertops', detail: 'Quartz — client selects from available samples' },
      { item: 'Backsplash', detail: 'Client selects from available samples' },
      { item: 'Undermount sink', detail: '36 inch' },
      { item: 'Kitchen faucet', detail: 'Client selects from available samples' },
      { item: 'Kitchen island', detail: '___ ft x ___ ft' },
      { item: 'Flooring', detail: 'Luxury waterproof vinyl plank' },
      { item: 'Dimmable pot lights', detail: '___ pcs, 4 inch' },
      { item: 'Under-cabinet lighting', detail: '' },
      { item: 'Painting', detail: 'Benjamin Moore' },
      { item: 'Electrical work', detail: 'Includes new circuits for appliances, permit-compliant' },
      { item: 'Plumbing work', detail: 'Relocation of supply and drain as required' },
      { item: 'Range hood and venting to exterior', detail: '' },
      { item: 'Appliance installation', detail: 'Owner-supplied unless listed below' },
      { item: 'Shoe mould and baseboards', detail: '' },
      { item: 'Project timeline', detail: '___ weeks' },
    ],
  },
  {
    id: 'bathroom-renovation',
    label: 'Bathroom Renovation',
    description: 'Full bathroom gut and rebuild — tile, vanity, fixtures.',
    matches: ['bathroom', 'washroom'],
    lines: [
      { item: 'Job materials', detail: 'Included' },
      { item: 'Demolition and removal of existing bathroom', detail: 'Disposal included' },
      { item: 'Waterproofing to shower and wet areas', detail: 'Membrane system, per code' },
      { item: 'Floor tile', detail: '24x24 porcelain — client selects from available samples' },
      { item: 'Wall and shower tile', detail: 'Client selects from available samples' },
      { item: 'Standing shower', detail: 'Glass enclosure' },
      { item: 'Shower fixture set', detail: 'Client selects from available samples' },
      { item: 'Vanity and countertop', detail: 'Client selects from available samples' },
      { item: 'Vanity faucet', detail: 'Client selects from available samples' },
      { item: 'Mirror', detail: 'LED mirror with integrated lighting' },
      { item: 'Toilet', detail: 'Client selects from available samples' },
      { item: 'Tissue holder and towel bar', detail: 'Client selects from available samples' },
      { item: 'Exhaust vent to exterior', detail: '' },
      { item: 'Dimmable pot lights', detail: '___ pcs, 4 inch' },
      { item: 'Electrical work', detail: 'GFCI protection, permit-compliant' },
      { item: 'Plumbing work', detail: 'Permit-compliant, by licensed plumber' },
      { item: 'Painting', detail: 'Benjamin Moore, bathroom-grade' },
      { item: 'Project timeline', detail: '___ weeks' },
    ],
  },
  {
    id: 'garden-suite',
    label: 'Garden / Laneway Suite (ADU)',
    description: 'Detached accessory dwelling — foundation through occupancy.',
    matches: ['garden suite', 'laneway', 'adu', 'accessory dwelling'],
    lines: [
      { item: 'Job materials', detail: 'Included' },
      { item: 'Site survey and grading', detail: '' },
      { item: 'Architectural and structural drawings', detail: 'Included' },
      { item: 'Permit application and city liaison', detail: 'Permit fees payable by Owner' },
      { item: 'Excavation and foundation', detail: 'Slab or frost-protected foundation as engineered' },
      { item: 'Framing and structural build', detail: '' },
      { item: 'Exterior cladding and roofing', detail: 'Client selects from available samples' },
      { item: 'Windows and exterior doors', detail: 'Energy-rated, per code' },
      { item: 'Insulation and vapour barrier', detail: 'To current Ontario Building Code' },
      { item: 'Electrical service and distribution', detail: 'New sub-panel, permit-compliant' },
      { item: 'Plumbing — water supply, drainage and connection to municipal services', detail: '' },
      { item: 'HVAC — heating, cooling and ventilation', detail: 'Ductless system unless otherwise specified' },
      { item: 'Interior finishes — drywall, paint, trim', detail: 'Benjamin Moore' },
      { item: 'Flooring', detail: 'Luxury vinyl plank with 30-year manufacturer warranty' },
      { item: 'Kitchen', detail: 'Cabinets, quartz counter, sink, appliances' },
      { item: 'Bathroom', detail: '3-piece — vanity, shower, toilet, tile' },
      { item: 'Smoke and carbon monoxide detectors', detail: 'Interconnected, per code' },
      { item: 'Landscaping and pathway to suite', detail: '' },
      { item: 'Final inspection and occupancy sign-off', detail: '' },
      { item: 'Project timeline', detail: '___ weeks' },
    ],
  },
  {
    id: 'whole-home',
    label: 'Whole-Home Renovation',
    description: 'Multi-room interior renovation across the full house.',
    matches: ['full renovation', 'whole home', 'interior renovation'],
    lines: [
      { item: 'Job materials', detail: 'Included' },
      { item: 'Demolition and disposal', detail: 'Approx. ___ sq ft' },
      { item: 'Framing alterations and structural work', detail: 'Per engineered drawings where required' },
      { item: 'Electrical rewiring and panel review', detail: 'Permit-compliant' },
      { item: 'Plumbing updates', detail: 'Permit-compliant' },
      { item: 'HVAC review and duct modification', detail: '' },
      { item: 'Insulation upgrades', detail: 'Where walls are opened' },
      { item: 'Drywall, taping and finishing', detail: 'Level 4 finish' },
      { item: 'Flooring throughout', detail: 'Client selects from available samples' },
      { item: 'Interior doors and hardware', detail: '' },
      { item: 'Trim, baseboards and shoe mould', detail: '' },
      { item: 'Painting throughout', detail: 'Benjamin Moore' },
      { item: 'Kitchen renovation', detail: 'See kitchen specification' },
      { item: 'Bathroom renovation', detail: '___ bathrooms' },
      { item: 'Pot lights throughout', detail: '___ pcs, 4 inch, dimmable' },
      { item: 'Staircase refinishing', detail: '' },
      { item: 'Smoke and carbon monoxide detectors', detail: 'Interconnected, per code' },
      { item: 'Construction drawings', detail: 'Included' },
      { item: '3D rendering', detail: 'Included' },
      { item: 'Project timeline', detail: '___ weeks' },
    ],
  },
  {
    id: 'blank',
    label: 'Start from blank',
    description: 'Empty scope — build every line yourself.',
    matches: [],
    lines: [{ item: '', detail: '' }],
  },
];

/** Presets ordered so the ones matching this deal's project type come first. */
export function presetsForProjectType(projectType: string | undefined): ScopePreset[] {
  const needle = (projectType || '').toLowerCase();
  if (!needle) return SCOPE_PRESETS;
  const score = (p: ScopePreset) => (p.matches.some((m) => needle.includes(m)) ? 0 : 1);
  return [...SCOPE_PRESETS].sort((a, b) => score(a) - score(b));
}
