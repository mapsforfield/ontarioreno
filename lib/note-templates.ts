// ─── Customer Notes templates ─────────────────────────────────────────────────
// Admin-editable, stored as JSON in Setting.note_templates. Shared between the
// portal (rep picks one when booking) and the public flow (applies the program's
// template automatically), so a public booking reads exactly what a rep would
// have inserted by hand — and stays in step when an admin edits it.

export type NoteTemplate = { id: string; label: string; body: string };

export const DEFAULT_NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: 'hamilton-grant',
    label: 'Hamilton Grant',
    body:
      'Pre-qualified through OntarioReno for the Hamilton Secondary Suite Grant (up to $40K).\n\n' +
      'This visit is to confirm eligibility and provide an accurate scope and estimate.',
  },
];

/** Parse the stored setting, falling back to the defaults on absence or junk. */
export function parseNoteTemplates(raw: string | null | undefined): NoteTemplate[] {
  if (!raw) return DEFAULT_NOTE_TEMPLATES;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as NoteTemplate[]) : DEFAULT_NOTE_TEMPLATES;
  } catch {
    return DEFAULT_NOTE_TEMPLATES;
  }
}

export function findNoteTemplate(
  templates: NoteTemplate[],
  id: string
): NoteTemplate | undefined {
  return templates.find((t) => t.id === id);
}
