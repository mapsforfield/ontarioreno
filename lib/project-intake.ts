// ─── Project Review (/match) → consultation booking ───────────────────────────
// The /match form opens on "what's your project?" and, for every project that
// has a consultation program, ends on that program's live calendar. This is the
// pure half: which program a choice books under, what its answers become, and
// how uploaded documents are checked and described. No fetch, no Prisma, no env
// — it is bundled into the browser.
//
// Why the calendar moved INTO /match rather than the form texting a link: the
// project review turned 13 of 131 submissions into a booking, where the
// /consultation flows (which end on a calendar) booked about 120 of 140. See
// src/lib/bookingRoutes.ts.

import { programBySlug, type ProgramConfig, type QuestionOption } from './program-config.js';
import { isAllowedQuoteFile, isQuoteFileKey, QUOTE_FILE_RULES, type QuoteFile } from './window-quote.js';

export type ProjectChoice = {
  /**
   * The homeowner's words on screen, and what the lead arrives carrying.
   * Must match lib/project-review.ts exactly — that mapping is keyed on it.
   */
  label: string;
  blurb: string;
  /** Tile photo. Absent ⇒ an icon tile. */
  image?: string;
  /** Consultation program this choice books under, or null when a person calls. */
  slug: string | null;
  /**
   * Which of the program's projectType values to offer on the details screen,
   * in order. Never 'unsure': routing reads it as PROJECT_TYPE_UNCERTAIN, which
   * takes the calendar away after the homeowner has done the work to reach it.
   */
  detailValues?: string[];
};

export const PROJECT_CHOICES: ProjectChoice[] = [
  {
    label: 'Basement renovation',
    blurb: 'Finish or upgrade your basement',
    image: '/images/hero/basement-after-800.webp',
    slug: 'basement',
    detailValues: ['basement_finish', 'basement_renovation'],
  },
  {
    label: 'Legal basement / secondary suite',
    blurb: 'A rental-ready, code-compliant unit',
    image: '/Legal Basements/Legalized Basements/Additional photos/1-800w.webp',
    slug: 'basement',
    detailValues: ['basement_finish', 'basement_renovation'],
  },
  {
    label: 'Kitchen renovation',
    blurb: 'Layout, cabinets, counters and finishes',
    image: '/Kitchen/Kitchen1/kitchen01-800w.webp',
    slug: 'kitchen',
    detailValues: ['full_remodel', 'cabinets_countertops'],
  },
  {
    label: 'Bathroom renovation',
    blurb: 'Refresh or fully remodel a bathroom',
    image: '/images/bathroom-reno/bathroom-01.webp',
    slug: 'bathroom',
    detailValues: ['bathroom_refresh', 'bathroom_gut', 'bathroom_addition', 'multiple_bathrooms'],
  },
  {
    label: 'Windows & doors',
    blurb: 'Replace windows, entry or patio doors',
    image: '/images/windows/hero-480w.webp',
    slug: 'windows-doors',
    detailValues: ['windows', 'doors', 'windows_and_doors'],
  },
  {
    label: 'Garden suite',
    blurb: 'A detached unit in your back yard',
    image: '/images/garden-suite.jpg',
    slug: 'garden-suite',
    detailValues: ['garden_suite', 'laneway_suite', 'garage_conversion'],
  },
  {
    label: 'Full home renovation',
    blurb: 'A larger, multi-room project',
    image: '/images/hero/hero-house-700.webp',
    slug: null,
  },
  {
    label: 'Not sure yet',
    blurb: 'We will help you narrow it down',
    slug: null,
  },
];

export function projectChoice(label: string): ProjectChoice | null {
  return PROJECT_CHOICES.find((c) => c.label === label) ?? null;
}

/** The program a choice books under, or null when it has none or it is closed. */
export function programForChoice(label: string): ProgramConfig | null {
  const slug = projectChoice(label)?.slug;
  const program = slug ? programBySlug(slug) : null;
  return program?.enabled ? program : null;
}

/** The details-screen options: the program's own projectType wording. */
export function detailOptionsFor(label: string): QuestionOption[] {
  const choice = projectChoice(label);
  const program = programForChoice(label);
  const question = program?.questions.find((q) => q.key === 'projectType');
  if (!choice?.detailValues || !question) return [];
  return choice.detailValues
    .map((v) => question.options.find((o) => o.value === v))
    .filter((o): o is QuestionOption => Boolean(o));
}

/**
 * The timing question /match asks of everyone. Values are the shared TIMELINE
 * vocabulary in lib/program-config.ts, so a program that asks timeline itself
 * receives an answer it already understands.
 */
export const INTAKE_TIMELINE_OPTIONS: QuestionOption[] = [
  { value: 'asap', label: 'As soon as possible' },
  { value: '1_3_months', label: 'In 1–3 months' },
  { value: '3_plus_months', label: 'In 3+ months' },
  { value: 'exploring', label: 'Just exploring' },
];

/**
 * A timeline answer, translated into one the program offers. Kitchen folded
 * "3+ months" into "exploring" (see KITCHEN_TIMELINE), so that is where it goes;
 * anything else unknown to the program is sent blank rather than invented.
 */
export function timelineForProgram(program: ProgramConfig, value: string): string {
  const question = program.questions.find((q) => q.key === 'timeline');
  if (!question) return '';
  if (question.options.some((o) => o.value === value)) return value;
  if (value === '3_plus_months' && question.options.some((o) => o.value === 'exploring')) return 'exploring';
  return '';
}

/**
 * The answers a /match submission sends to the program's submit flow.
 *
 * Only keys the program asks. No 'contribution': /match no longer asks how a
 * homeowner will pay — that is for the visit — and routing treats a blank one
 * as "no funding tag", never as a reason to withhold the calendar.
 */
export function consultationAnswers(
  program: ProgramConfig,
  input: { projectType: string; timeline: string }
): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const q of program.questions) {
    if (q.key === 'projectType') answers.projectType = input.projectType;
    else if (q.key === 'timeline') answers.timeline = timelineForProgram(program, input.timeline);
  }
  return answers;
}

// ─── Optional documents: drawings, permits, other quotes ──────────────────────
// Same storage and rules as the /windows quote upload: private bucket, presigned
// PUT, PDF/JPG/PNG up to 10 MB, five files.

export const PROJECT_FILE_KINDS = ['Drawings or plans', 'Permit documents', 'A quote from someone else', 'Photos'] as const;

const s = (v: unknown, max = 200) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

/** Files from a request body, kept only when the presign flow could have issued them. */
export function parseProjectFiles(raw: unknown): { ok: true; files: QuoteFile[] } | { ok: false; error: string } {
  const list = Array.isArray(raw) ? raw : [];
  const files = list.slice(0, QUOTE_FILE_RULES.maxFiles).map((f) => {
    const o = (f && typeof f === 'object' ? f : {}) as Record<string, unknown>;
    return { key: s(o.key), name: s(o.name, 120), size: Number(o.size) || 0, type: s(o.type, 60) };
  });
  if (files.length === 0) return { ok: false, error: 'No files to attach.' };
  if (files.some((f) => !isQuoteFileKey(f.key) || !isAllowedQuoteFile(f.type, f.size))) {
    return { ok: false, error: 'One of the files could not be accepted. Please upload it again.' };
  }
  return { ok: true, files };
}

/** The line appended to the lead's notes, so a rep sees there are documents. */
export function projectFilesNote(files: QuoteFile[], kinds: string[]): string {
  const what = kinds.length ? ` (${kinds.join(', ')})` : '';
  return `Project Review documents${what}: ${files.map((f) => f.name || 'file').join(', ')} — links in the admin alert email.`;
}

/** The admin's email. Links need a portal admin login, as on /windows. */
export function projectFilesAlert(
  c: { name: string; phone: string; projectType: string; kinds: string[]; files: QuoteFile[] },
  leadId: string,
  fileLink: (index: number) => string
): { subject: string; body: string } {
  const lines = [
    'A homeowner attached documents to their Project Review.',
    '',
    `Name:          ${c.name}`,
    `Phone:         ${c.phone}`,
    `Project:       ${c.projectType || 'Not given'}`,
  ];
  if (c.kinds.length) lines.push(`They sent:     ${c.kinds.join(', ')}`);
  lines.push('', `Files (${c.files.length}). Opening one needs a portal admin login:`);
  c.files.forEach((f, i) => lines.push(`  ${f.name || `File ${i + 1}`}: ${fileLink(i)}`));
  lines.push('', `Lead ID:       ${leadId}`);
  return {
    subject: `Project Review documents: ${c.name}${c.projectType ? ` (${c.projectType})` : ''}`,
    body: lines.join('\n'),
  };
}
