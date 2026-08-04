// ─── Sales Agreement templates ───────────────────────────────────────────────
//
// We represent several contractor brands and our reps close for all of them.
// Two things make template *variety* a business requirement, not a nicety:
//
//   1. A homeowner may be seen by more than one of our reps under different
//      brands. Identical-looking paperwork makes that obvious and confusing.
//   2. FinanceIt reviews the agreement behind every financed close. If every
//      contractor submits a document that is visually identical apart from the
//      company name, that reads as one operation wearing several hats and
//      invites questions we don't need.
//
// So each template is a genuinely different document: its own typeface, title
// treatment, section numbering scheme, scope-table styling, signature block —
// and its own wording for every clause. The legal substance is equivalent; the
// document is not a reskin.
//
// Adding a contractor requires no work here: `templateForContractor` hashes the
// contractor id to a stable pick, and the rep can override it in the UI.

import type { ContractFontFamily } from '../lib/contractFonts';

export type ContractTemplateId = 'meridian' | 'vertex' | 'atlas' | 'sterling' | 'harbor';

export type RGB = [number, number, number];

/** The body sections a template can lay out, in the order it chooses. */
export type SectionKey =
  | 'services'
  | 'commencement'
  | 'payment'
  | 'termination'
  | 'amendments'
  | 'indemnity'
  | 'allowances'
  | 'confidentiality'
  | 'warranty'
  | 'disputes'
  | 'misc';

/** One clause: a heading plus the paragraphs/bullets that sit under it. */
export type Clause = {
  heading: string;
  /** Rendered as flowing paragraphs. */
  paras?: string[];
  /** Rendered as the template's bullet/list style. */
  bullets?: string[];
};

export type TemplateSpec = {
  id: ContractTemplateId;
  /** Internal name shown to the rep when picking a style. */
  name: string;
  /** One-line description of the look, for the style picker. */
  blurb: string;

  // ── Typography & colour ──
  /** Embedded typeface — see contractFonts.ts for why each was chosen. */
  font: ContractFontFamily;
  /** Built-in stand-in used if the embedded font chunk fails to load. */
  fontFallback: 'times' | 'helvetica';
  /** Point size of body copy. */
  bodySize: number;
  /** Leading multiplier applied to bodySize. */
  leading: number;
  accent: RGB;
  /**
   * Light wash of the accent, used behind dark text (callouts, table headers).
   * Derived at render time so it always tracks the accent actually in use,
   * including a contractor's brand colour.
   */
  tint: RGB;
  ink: RGB;
  muted: RGB;
  rule: RGB;

  // ── Layout personality ──
  margin: { top: number; bottom: number; left: number; right: number };
  /** How the letterhead / first-page masthead is drawn. */
  header: 'stacked-serif' | 'band' | 'rail' | 'boxed' | 'split-tab';
  /** How the document title is set. */
  title: 'centered-caps' | 'band-inline' | 'oversized-left' | 'boxed-center' | 'underscored-left';
  /** Section heading numbering scheme. */
  numbering: 'roman' | 'decimal' | 'none' | 'padded' | 'lettered';
  /** Section heading treatment. */
  headingStyle: 'serif-caps-centered' | 'accent-bar' | 'tracked-mini' | 'rule-under' | 'side-tab';
  /** Bullet glyph / list treatment. */
  bullet: 'dash' | 'dot' | 'square' | 'none' | 'arrow';
  /** Scope-of-work table styling. */
  scopeTable: 'bordered' | 'zebra' | 'rules-only' | 'boxed-header' | 'open';
  /** Signature block arrangement. */
  signatures: 'stacked-lines' | 'two-column' | 'boxed-pair' | 'rule-pair';
  /** Page footer treatment. */
  footer: 'centered-page' | 'rule-left' | 'minimal-right' | 'boxed';
  /**
   * Optional cover page. Different firms produce differently *shaped*
   * paperwork, not just differently styled paperwork — a cover is the
   * strongest shape signal available.
   */
  cover: 'none' | 'brand-block' | 'document-control';
  /** Clause body column count. Two columns reads as a different firm entirely. */
  columns: 1 | 2;
  /** Force the signature block onto a page of its own. */
  signaturePage: boolean;

  /** Every clause, worded for this template. */
  clauses: Record<SectionKey, Clause>;
  /** The order sections appear in. */
  order: SectionKey[];
  /** Heading used above the scope-of-work table. */
  scopeHeading: string;
  /** Preamble sentence above the scope table. */
  scopeNote: string;
  /** Wording of the execution line above the signature block. */
  execution: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// MERIDIAN — traditional legal instrument. Serif throughout, centred small-caps
// headings, roman-numeral articles, no colour. Reads as solicitor-drafted.
// ─────────────────────────────────────────────────────────────────────────────
const meridian: TemplateSpec = {
  id: 'meridian',
  name: 'Meridian',
  blurb: 'Traditional legal instrument — serif, roman numerals, no colour',
  font: 'EBGaramond',
  fontFallback: 'times',
  bodySize: 11.4,
  leading: 1.42,
  accent: [30, 30, 30],
  tint: [237, 237, 237],
  ink: [20, 20, 20],
  muted: [95, 95, 95],
  rule: [140, 140, 140],
  margin: { top: 62, bottom: 62, left: 72, right: 72 },
  header: 'stacked-serif',
  title: 'centered-caps',
  numbering: 'roman',
  headingStyle: 'serif-caps-centered',
  bullet: 'none',
  scopeTable: 'rules-only',
  signatures: 'stacked-lines',
  footer: 'centered-page',
  cover: 'none',
  columns: 1,
  signaturePage: true,
  scopeHeading: 'Schedule "A" — Scope of Work',
  scopeNote:
    'The works enumerated in this Schedule form part of and are governed by the Agreement to which it is attached.',
  execution:
    'IN WITNESS WHEREOF the parties have hereunto executed this Agreement as of the date first above written.',
  order: [
    'services',
    'commencement',
    'payment',
    'termination',
    'amendments',
    'indemnity',
    'allowances',
    'confidentiality',
    'warranty',
    'disputes',
    'misc',
  ],
  clauses: {
    services: {
      heading: 'Services',
      paras: [
        'The Contractor shall furnish competent and professional home improvement services at the Property in accordance with Schedule "A" annexed hereto.',
        'No variation to the said Schedule shall be of any force or effect unless reduced to writing and executed by both parties.',
      ],
    },
    commencement: {
      heading: 'Commencement and Completion',
      paras: [
        'The Services shall commence on the Start Date and shall be substantially completed on or before the Completion Date, subject to delays not within the Contractor’s reasonable control.',
        'The term hereof may be extended only by the mutual written agreement of the parties, or determined in accordance with the provisions hereinafter set out.',
      ],
    },
    payment: {
      heading: 'Consideration and Payment',
      paras: [
        'In consideration of the Services, the Owner shall pay to the Contractor the Total Price set out above, together with all applicable taxes, in the manner following.',
      ],
    },
    termination: {
      heading: 'Termination',
      paras: [
        'The Contractor is bound to complete the works described in Schedule "A" in their entirety.',
        'The Owner shall have no unilateral right to determine this Agreement nor to suspend or withhold the release of funds during the currency of the works.',
      ],
    },
    amendments: {
      heading: 'Amendment and Entire Agreement',
      paras: [
        'This Agreement may be amended only by an instrument in writing executed by both parties and duly witnessed.',
        'Save as aforesaid, this Agreement constitutes the entire agreement and understanding between the parties with respect to the subject matter hereof, and supersedes all prior negotiations, representations, agreements and understandings, whether oral or written, all of which are hereby cancelled.',
      ],
    },
    indemnity: {
      heading: 'Indemnity',
      paras: [
        'Each party shall indemnify and save harmless the other, together with its affiliates, directors, officers, employees and agents, from and against all third-party claims, losses, damages and expenses arising out of that party’s own negligence, wilful misconduct or breach of this Agreement.',
      ],
    },
    allowances: {
      heading: 'Allowances and Selection of Materials',
      paras: [
        'The Owner may select from the materials made available by the Contractor, or may select alternatives within the allowance provided for in the Total Price.',
        'Any cost attributable to an upgrade or to a selection exceeding the applicable allowance shall be approved by the Owner in writing prior to purchase and shall be borne by the Owner.',
      ],
    },
    confidentiality: {
      heading: 'Confidentiality',
      paras: [
        'The Contractor shall hold all information of the Owner in confidence, save as required by law or as authorised by the Owner in writing.',
        'The obligations in this Article survive the determination of this Agreement, save in respect of information which enters the public domain otherwise than through the default of the Contractor, or which is required for the resolution of a dispute between the parties.',
      ],
    },
    warranty: {
      heading: 'Warranty',
      paras: [
        'The Contractor warrants all installed materials and workmanship for a period of one (1) year from the date of substantial completion.',
      ],
    },
    disputes: {
      heading: 'Dispute Resolution',
      paras: [
        'Any dispute arising out of or in connection with this Agreement shall in the first instance be addressed by good-faith negotiation between the parties.',
        'Failing resolution, the parties shall submit the dispute to mediation before commencing any proceeding at law.',
      ],
    },
    misc: {
      heading: 'General',
      paras: [
        'Assignment. This Agreement shall not be assigned without the prior written consent of both parties.',
        'Independent Contractor. The Contractor is an independent contractor and is neither an employee nor a partner of the Owner.',
        'Notices. All notices shall be in writing and delivered personally or by registered mail to the addresses first above written.',
        'Force Majeure. Neither party shall be liable for any delay occasioned by events beyond its reasonable control.',
        'Headings. Headings are inserted for convenience of reference only and shall not affect the construction hereof.',
        'Governing Law. This Agreement shall be governed by and construed in accordance with the laws of the Province of Ontario and the laws of Canada applicable therein.',
        'Severability. Should any provision hereof be held invalid, the remaining provisions shall continue in full force and effect.',
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// VERTEX — modern branded. Sans-serif, full-bleed colour masthead band, accent
// bars beside headings, zebra-striped scope table. Reads as a marketing-led firm.
// ─────────────────────────────────────────────────────────────────────────────
const vertex: TemplateSpec = {
  id: 'vertex',
  name: 'Vertex',
  blurb: 'Modern branded — colour masthead band, accent headings, striped table',
  font: 'Manrope',
  fontFallback: 'helvetica',
  bodySize: 9.2,
  leading: 1.5,
  accent: [21, 94, 117],
  tint: [236, 242, 244],
  ink: [28, 32, 36],
  muted: [110, 118, 128],
  rule: [200, 212, 220],
  margin: { top: 58, bottom: 58, left: 54, right: 54 },
  header: 'band',
  title: 'band-inline',
  numbering: 'decimal',
  headingStyle: 'accent-bar',
  bullet: 'dot',
  scopeTable: 'zebra',
  signatures: 'two-column',
  footer: 'rule-left',
  cover: 'brand-block',
  columns: 1,
  signaturePage: false,
  scopeHeading: 'Scope of Work',
  scopeNote:
    'Everything below is included in your project price. Where a material is listed, you will be shown a selection to choose from.',
  execution: 'By signing below, both parties agree to the terms set out in this agreement.',
  order: [
    'services',
    'commencement',
    'payment',
    'allowances',
    'warranty',
    'termination',
    'indemnity',
    'confidentiality',
    'disputes',
    'amendments',
    'misc',
  ],
  clauses: {
    services: {
      heading: 'The Work',
      bullets: [
        'We will carry out the renovation work at your property professionally and to a competent standard, exactly as set out in the Scope of Work.',
        'Any change to the Scope of Work needs to be written down and signed by both of us before it happens.',
      ],
    },
    commencement: {
      heading: 'Schedule',
      bullets: [
        'Work starts on the Start Date and we expect it to be substantially complete by the Completion Date.',
        'We can extend the timeline if we both agree in writing, or end the agreement under the Termination section.',
      ],
    },
    payment: {
      heading: 'Price and Payment',
      bullets: ['The total price for the work, plus applicable tax, is set out above. Payment works as follows.'],
    },
    termination: {
      heading: 'Termination',
      bullets: [
        'We are committed to completing the project as described in the Scope of Work.',
        'The Owner cannot unilaterally cancel this agreement or stop the release of funds once work is underway.',
      ],
    },
    amendments: {
      heading: 'Changes and Whole Agreement',
      bullets: [
        'This agreement can only be changed in writing, signed by both parties and witnessed.',
        'Apart from any such change, this document is the complete agreement between us. It replaces every earlier discussion, quote or understanding, spoken or written.',
      ],
    },
    indemnity: {
      heading: 'Indemnity',
      bullets: [
        'Each of us protects the other — including affiliates, directors, officers, employees and agents — from third-party claims, losses or damages caused by our own negligence, deliberate misconduct, or breach of this agreement.',
      ],
    },
    allowances: {
      heading: 'Materials and Allowances',
      bullets: [
        'You can pick from the materials we supply, or choose your own within the budget already allowed for in the price.',
        'If a choice costs more than the allowance, we will tell you the difference and get your written approval before we buy anything.',
      ],
    },
    confidentiality: {
      heading: 'Confidentiality',
      bullets: [
        'We keep your information private, unless the law requires otherwise or you give us written permission to share it.',
        'This continues after the agreement ends. It does not apply to information that becomes public through no fault of ours, or that is needed to resolve a dispute.',
      ],
    },
    warranty: {
      heading: 'Warranty',
      bullets: [
        'All installed materials and workmanship carry a one-year warranty starting from the date of substantial completion.',
      ],
    },
    disputes: {
      heading: 'If Something Goes Wrong',
      bullets: [
        'We will first try to resolve any disagreement by talking it through in good faith.',
        'If that does not work, we both agree to try mediation before going to court.',
      ],
    },
    misc: {
      heading: 'General Terms',
      bullets: [
        'Assignment — neither party can transfer this agreement without the other’s written consent.',
        'Independent contractor — we work as an independent contractor, not as your employee or partner.',
        'Notices — all notices must be in writing, delivered by hand or registered mail to the addresses shown above.',
        'Force majeure — neither party is responsible for delays caused by events outside their reasonable control.',
        'Headings — headings are for navigation only and do not change the meaning of the terms.',
        'Governing law — this agreement is governed by the laws of Ontario and Canada.',
        'Severability — if any part is found invalid, the rest of the agreement still applies.',
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ATLAS — minimal editorial. Wide left rail carrying tracked mini-labels,
// generous whitespace, monochrome with a single warm accent, rule-free tables.
// ─────────────────────────────────────────────────────────────────────────────
const atlas: TemplateSpec = {
  id: 'atlas',
  name: 'Atlas',
  blurb: 'Minimal editorial — wide margin rail, tracked labels, lots of white space',
  font: 'Karla',
  fontFallback: 'helvetica',
  bodySize: 9.2,
  leading: 1.62,
  accent: [161, 98, 7],
  tint: [247, 242, 235],
  ink: [38, 38, 38],
  muted: [130, 130, 130],
  rule: [222, 222, 222],
  margin: { top: 72, bottom: 66, left: 168, right: 60 },
  header: 'rail',
  title: 'oversized-left',
  numbering: 'none',
  headingStyle: 'tracked-mini',
  bullet: 'dash',
  scopeTable: 'open',
  signatures: 'rule-pair',
  footer: 'minimal-right',
  cover: 'none',
  columns: 1,
  signaturePage: true,
  scopeHeading: 'Scope',
  scopeNote:
    'Materials shown are indicative. Selections outside the ranges we carry are accommodated against a stated budget.',
  execution: 'Executed on the date shown above.',
  order: [
    'services',
    'commencement',
    'payment',
    'warranty',
    'allowances',
    'termination',
    'amendments',
    'indemnity',
    'confidentiality',
    'disputes',
    'misc',
  ],
  clauses: {
    services: {
      heading: 'Services',
      paras: [
        'The Contractor provides professional renovation services at the Property, as described in the Scope.',
        'Changes to the Scope take effect only once written and signed by both parties.',
      ],
    },
    commencement: {
      heading: 'Dates',
      paras: [
        'Work begins on the Start Date and is expected to reach substantial completion by the Completion Date.',
        'Extensions require mutual written agreement. Termination is addressed separately below.',
      ],
    },
    payment: {
      heading: 'Payment',
      paras: ['The Total Price, plus applicable tax, is payable as follows.'],
    },
    termination: {
      heading: 'Termination',
      paras: [
        'The Contractor is obligated to complete the project as specified in the Scope.',
        'The Owner may not unilaterally terminate this Agreement or halt the release of funds.',
      ],
    },
    amendments: {
      heading: 'Amendment',
      paras: [
        'Amendments must be in writing, signed by both parties, and witnessed.',
        'Subject to those amendments, this Agreement is the entire agreement between the parties and supersedes all prior negotiations, agreements and understandings, oral or written, which are cancelled.',
      ],
    },
    indemnity: {
      heading: 'Indemnity',
      paras: [
        'Each party indemnifies the other — with its affiliates, directors, officers, employees and agents — against third-party claims, losses or damages arising from that party’s negligence, wilful misconduct or breach.',
      ],
    },
    allowances: {
      heading: 'Allowances',
      paras: [
        'The Owner selects from Contractor-supplied materials, or alternatives within the agreed budget.',
        'Costs above the allowance require the Owner’s written approval before purchase.',
      ],
    },
    confidentiality: {
      heading: 'Confidentiality',
      paras: [
        'Owner information is kept confidential except where disclosure is required by law or authorised in writing.',
        'This survives termination, excepting information that becomes public without the Contractor’s fault or that is required to resolve a dispute.',
      ],
    },
    warranty: {
      heading: 'Warranty',
      paras: [
        'One year on installed materials and workmanship, running from the date of substantial completion.',
      ],
    },
    disputes: {
      heading: 'Disputes',
      paras: [
        'Disputes are first addressed by good-faith negotiation.',
        'If unresolved, the parties mediate before pursuing legal action.',
      ],
    },
    misc: {
      heading: 'General',
      paras: [
        'Assignment requires the prior written consent of both parties.',
        'The Contractor acts as an independent contractor, not an employee or partner.',
        'Notices are in writing, delivered personally or by registered mail to the addresses above.',
        'Neither party is liable for delays beyond its reasonable control.',
        'Headings are for reference and do not affect interpretation.',
        'Ontario and Canadian law govern this Agreement.',
        'If a provision is invalid, the remainder stays in effect.',
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// STERLING — corporate formal. Boxed masthead, decimal sub-numbering (1.1, 1.2),
// grey banded table headers, ruled footer with page numbers. Reads institutional.
// ─────────────────────────────────────────────────────────────────────────────
const sterling: TemplateSpec = {
  id: 'sterling',
  name: 'Sterling',
  blurb: 'Corporate formal — boxed masthead, 1.1 sub-numbering, grey banded tables',
  font: 'IBMPlexSerif',
  fontFallback: 'times',
  bodySize: 9.3,
  leading: 1.45,
  accent: [51, 65, 85],
  tint: [239, 240, 241],
  ink: [24, 28, 34],
  muted: [100, 108, 118],
  rule: [176, 186, 198],
  margin: { top: 60, bottom: 64, left: 60, right: 60 },
  header: 'boxed',
  title: 'boxed-center',
  numbering: 'padded',
  headingStyle: 'rule-under',
  bullet: 'square',
  scopeTable: 'boxed-header',
  signatures: 'boxed-pair',
  footer: 'boxed',
  cover: 'document-control',
  columns: 1,
  signaturePage: false,
  scopeHeading: 'Appendix I — Statement of Work',
  scopeNote:
    'The following items constitute the agreed statement of work. Material selections are made from the Contractor’s standard offering unless otherwise budgeted.',
  execution:
    'EXECUTED by the parties, each acknowledging having read and understood the whole of this Agreement.',
  order: [
    'services',
    'commencement',
    'payment',
    'termination',
    'warranty',
    'allowances',
    'indemnity',
    'confidentiality',
    'disputes',
    'amendments',
    'misc',
  ],
  clauses: {
    services: {
      heading: 'Scope of Engagement',
      bullets: [
        'The Contractor shall perform the home improvement services described in the Statement of Work at the Property, applying the standard of care expected of a competent professional in the trade.',
        'Variations to the Statement of Work are effective only upon written instrument signed by both parties.',
      ],
    },
    commencement: {
      heading: 'Term',
      bullets: [
        'Performance commences on the Start Date and is scheduled to reach substantial completion by the Completion Date.',
        'The term may be extended by mutual written agreement, or terminated in accordance with the Termination provisions.',
      ],
    },
    payment: {
      heading: 'Contract Price and Payment',
      bullets: [
        'The Owner shall pay the Contract Price stated above, plus all applicable taxes, on the terms set out below.',
      ],
    },
    termination: {
      heading: 'Termination',
      bullets: [
        'The Contractor is obligated to complete the project as specified in the Statement of Work.',
        'The Owner holds no right of unilateral termination and shall not halt or defer the release of funds.',
      ],
    },
    amendments: {
      heading: 'Amendment; Integration',
      bullets: [
        'Amendments require a written instrument signed by both parties and duly witnessed.',
        'Subject to the foregoing, this Agreement records the entire understanding of the parties, superseding all prior negotiations, agreements and understandings, oral or written, all of which are cancelled.',
      ],
    },
    indemnity: {
      heading: 'Indemnification',
      bullets: [
        'Each party shall indemnify and hold harmless the other, including its affiliates, directors, officers, employees and agents, against third-party claims, losses or damages arising from that party’s negligence, wilful misconduct or breach of this Agreement.',
      ],
    },
    allowances: {
      heading: 'Allowances; Material Selection',
      bullets: [
        'The Owner may select from Contractor-supplied materials or may specify alternatives within the allowance carried in the Contract Price.',
        'Costs arising from upgrades or selections in excess of the allowance require the Owner’s written approval in advance of procurement.',
      ],
    },
    confidentiality: {
      heading: 'Confidentiality',
      bullets: [
        'The Contractor shall treat Owner information as confidential save where disclosure is compelled by law or authorised by the Owner in writing.',
        'These obligations survive termination, excepting information that enters the public domain without fault of the Contractor or that is required for dispute resolution.',
      ],
    },
    warranty: {
      heading: 'Warranty',
      bullets: [
        'The Contractor warrants installed materials and workmanship for twelve (12) months from the date of substantial completion.',
      ],
    },
    disputes: {
      heading: 'Dispute Resolution',
      bullets: [
        'The parties shall first attempt resolution through good-faith negotiation.',
        'Failing resolution, the parties shall proceed to mediation prior to the commencement of legal proceedings.',
      ],
    },
    misc: {
      heading: 'General Provisions',
      bullets: [
        'Assignment — no assignment without the prior written consent of both parties.',
        'Relationship — the Contractor is an independent contractor and not an employee or partner of the Owner.',
        'Notices — in writing, delivered personally or by registered mail to the addresses recorded above.',
        'Force majeure — no liability for delay arising from causes beyond a party’s reasonable control.',
        'Headings — for reference only; they do not affect interpretation.',
        'Governing law — the laws of the Province of Ontario and the federal laws of Canada applicable therein.',
        'Severability — invalidity of any provision does not affect the remainder of this Agreement.',
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HARBOR — contemporary compact. Side-tab section markers, tinted callout for
// payment terms, lettered clauses, tighter set. Reads as a newer design-build shop.
// ─────────────────────────────────────────────────────────────────────────────
const harbor: TemplateSpec = {
  id: 'harbor',
  name: 'Harbor',
  blurb: 'Contemporary compact — side tabs, tinted callouts, lettered clauses',
  font: 'Nunito',
  fontFallback: 'helvetica',
  bodySize: 8.9,
  leading: 1.48,
  accent: [15, 118, 110],
  tint: [236, 244, 243],
  ink: [30, 34, 38],
  muted: [115, 124, 132],
  rule: [198, 214, 210],
  margin: { top: 56, bottom: 58, left: 66, right: 52 },
  header: 'split-tab',
  title: 'underscored-left',
  numbering: 'lettered',
  headingStyle: 'side-tab',
  bullet: 'arrow',
  scopeTable: 'bordered',
  signatures: 'two-column',
  footer: 'rule-left',
  cover: 'none',
  columns: 2,
  signaturePage: false,
  scopeHeading: 'What’s Included',
  scopeNote:
    'This is the full scope for your project. Where materials are listed we will walk you through the options we carry; anything outside that gets a set budget.',
  execution: 'Signed by both parties on the date shown above.',
  order: [
    'services',
    'commencement',
    'payment',
    'allowances',
    'warranty',
    'confidentiality',
    'indemnity',
    'termination',
    'disputes',
    'amendments',
    'misc',
  ],
  clauses: {
    services: {
      heading: 'Our Work',
      bullets: [
        'We provide competent, professional renovation services at your property, exactly as described in the scope below.',
        'Anything that changes the scope has to be put in writing and signed by both of us.',
      ],
    },
    commencement: {
      heading: 'Timeline',
      bullets: [
        'We start on the Start Date and expect substantial completion by the Completion Date.',
        'The timeline can be extended if we both agree in writing, or ended under the Termination section.',
      ],
    },
    payment: {
      heading: 'Payment',
      bullets: ['Your total price plus applicable tax is shown above. Here is how payment works.'],
    },
    termination: {
      heading: 'Termination',
      bullets: [
        'We are obligated to finish the project as specified in the scope.',
        'The Owner does not have the right to unilaterally end this agreement or stop the release of funds.',
      ],
    },
    amendments: {
      heading: 'Changes to This Agreement',
      bullets: [
        'Changes have to be written, signed by both parties, and witnessed.',
        'Other than those changes, this document is the whole agreement between us and replaces anything discussed or written before it — all of which is cancelled.',
      ],
    },
    indemnity: {
      heading: 'Indemnity',
      bullets: [
        'Each party covers the other, including affiliates, directors, officers, employees and agents, for third-party claims, losses or damages caused by their own negligence, wilful misconduct or breach of this agreement.',
      ],
    },
    allowances: {
      heading: 'Materials and Budget',
      bullets: [
        'Choose from what we carry, or bring your own selection within the budget already built into your price.',
        'If your choice runs over the allowance, we get your written approval on the difference before we order.',
      ],
    },
    confidentiality: {
      heading: 'Your Privacy',
      bullets: [
        'We keep your information confidential unless the law requires disclosure or you tell us in writing that we can share it.',
        'This continues after the project ends, except for information that becomes public through no fault of ours, or that is needed to settle a dispute.',
      ],
    },
    warranty: {
      heading: 'Warranty',
      bullets: [
        'One-year warranty on everything we install — materials and workmanship — starting at substantial completion.',
      ],
    },
    disputes: {
      heading: 'Resolving Disagreements',
      bullets: [
        'We start with a good-faith conversation.',
        'If that does not settle it, we both agree to mediation before anyone goes to court.',
      ],
    },
    misc: {
      heading: 'Other Terms',
      bullets: [
        'Assignment — neither side hands this agreement to someone else without written consent.',
        'Independent contractor — we are an independent contractor, not an employee or partner.',
        'Notices — in writing, delivered in person or by registered mail to the addresses above.',
        'Force majeure — no one is liable for delays outside their reasonable control.',
        'Headings — for reference only; they do not change how terms are read.',
        'Governing law — Ontario and Canada.',
        'Severability — if one part is invalid, the rest still stands.',
      ],
    },
  },
};

export const CONTRACT_TEMPLATES: TemplateSpec[] = [meridian, vertex, atlas, sterling, harbor];

const BY_ID = new Map<ContractTemplateId, TemplateSpec>(CONTRACT_TEMPLATES.map((t) => [t.id, t]));

export function getTemplate(id: ContractTemplateId | string | undefined): TemplateSpec {
  return (id && BY_ID.get(id as ContractTemplateId)) || meridian;
}

// Explicit pins for the contractors we work with today, so their paperwork stays
// consistent close-to-close. Anything not listed falls through to the hash below.
const PINNED: Record<string, ContractTemplateId> = {
  'galaxy-renovations': 'meridian',
  perahome: 'vertex',
  renochefs: 'harbor',
};

/**
 * The default template for a contractor. Pinned where we've chosen one,
 * otherwise a stable hash of the id so every contractor gets a consistent
 * style without anyone having to configure it. The rep can override per deal.
 */
export function templateForContractor(contractorId: string | null | undefined): ContractTemplateId {
  if (!contractorId) return 'meridian';
  const pinned = PINNED[contractorId];
  if (pinned) return pinned;
  let hash = 0;
  for (let i = 0; i < contractorId.length; i += 1) {
    hash = (hash * 31 + contractorId.charCodeAt(i)) >>> 0;
  }
  return CONTRACT_TEMPLATES[hash % CONTRACT_TEMPLATES.length].id;
}
