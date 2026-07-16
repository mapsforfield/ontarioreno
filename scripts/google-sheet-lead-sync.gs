/**
 * OntarioReno — Google Sheet → Call Flow lead sync (no Zapier).
 *
 * Paste this into your Leads spreadsheet: Extensions → Apps Script, replace the
 * default file with this, set the two CONFIG values, then run `setUp` once (it
 * authorizes the script AND installs a 5-minute trigger). New rows on the sheet
 * are POSTed to the portal's intake endpoint and appear in the Call Flow queue.
 *
 * It is idempotent: a "Synced" column is written after each row is sent, so rows
 * are never sent twice and only NEW rows go out on each run.
 */

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const CONFIG = {
  SHEET_NAME: 'Sheet1',                             // the tab to read
  API_URL: 'https://ontarioreno.ca/api/leads?intake=1',
  TOKEN: 'PASTE_THE_SAME_SECRET_AS_LEAD_INTAKE_TOKEN_HERE',
  SYNCED_HEADER: 'Synced',                          // a column the script manages
  SOURCE: 'website_intake',
  MAX_PER_RUN: 200,                                 // safety cap per execution
};

// Core lead fields ← sheet columns (matched by header, case/underscore-insensitive).
const FIELD_MAP = {
  name: ['fullname', 'name', 'firstandlastname'],
  email: ['email', 'emailaddress'],
  phone: ['phone', 'phonenumber', 'mobile'],
  address: ['streetaddress', 'address', 'propertyaddress'],
  submittedAt: ['createdtime', 'timestamp', 'submitted', 'submissiondate', 'date'],
};

// ONLY these extra columns are captured as qualifying "answers" on the lead —
// every other column on the sheet (Meta ad ids, campaign, platform, etc.) is
// ignored. "Label shown on the lead": [matching header aliases].
const ANSWER_MAP = {
  'Hamilton homeowner?': ['areyouahamiltonhomeowner'],
};

function normHeader(h) {
  return String(h || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function syncNewLeads() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error('Sheet not found: ' + CONFIG.SHEET_NAME);

  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length < 2) return; // header only

  const headers = values[0];
  // Build header lookups.
  const fieldCol = {};        // payload field -> column index
  for (const [field, aliases] of Object.entries(FIELD_MAP)) {
    const idx = headers.findIndex((h) => aliases.includes(normHeader(h)));
    if (idx >= 0) fieldCol[field] = idx;
  }
  // Find or create the "Synced" column.
  let syncedIdx = headers.findIndex((h) => normHeader(h) === normHeader(CONFIG.SYNCED_HEADER));
  if (syncedIdx < 0) {
    syncedIdx = headers.length;
    sheet.getRange(1, syncedIdx + 1).setValue(CONFIG.SYNCED_HEADER);
  }

  let sent = 0;
  for (let r = 1; r < values.length && sent < CONFIG.MAX_PER_RUN; r++) {
    const row = values[r];
    if (row[syncedIdx]) continue;                    // already synced

    const get = (field) => (fieldCol[field] != null ? String(row[fieldCol[field]] || '').trim() : '');
    const name = get('name');
    const email = get('email');
    const phone = get('phone');
    if (!name && !email && !phone) continue;         // blank row — skip silently

    // Capture ONLY the allow-listed question columns (ANSWER_MAP) as answers;
    // ignore every other sheet column (Meta ad metadata).
    const extraAnswers = {};
    for (const [label, aliases] of Object.entries(ANSWER_MAP)) {
      const idx = headers.findIndex((h) => aliases.includes(normHeader(h)));
      if (idx >= 0) {
        const val = String(row[idx] || '').trim();
        if (val) extraAnswers[label] = val;
      }
    }

    const payload = {
      name: name,
      email: email,
      phone: phone,
      address: get('address'),
      city: get('city'),
      budget: get('budget'),
      projectType: get('projectType'),
      source: CONFIG.SOURCE,
      sourceDetail: get('sourceDetail'),
      submittedAt: get('submittedAt'),
      extraAnswers: extraAnswers,
    };

    const res = UrlFetchApp.fetch(CONFIG.API_URL, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'x-intake-token': CONFIG.TOKEN },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });
    const code = res.getResponseCode();
    if (code === 200 || code === 201) {
      sheet.getRange(r + 1, syncedIdx + 1).setValue(new Date());
      sent++;
    } else {
      // Leave unsynced so it retries next run; log for visibility.
      console.error('Intake failed row ' + (r + 1) + ' → HTTP ' + code + ' ' + res.getContentText());
    }
  }
  console.log('Synced ' + sent + ' new lead(s).');
}

/** Run this ONCE: authorizes the script and installs a 5-minute trigger. */
function setUp() {
  ScriptApp.getProjectTriggers().forEach((t) => {
    if (t.getHandlerFunction() === 'syncNewLeads') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('syncNewLeads').timeBased().everyMinutes(5).create();
  syncNewLeads(); // first pass now
}

/**
 * OPTIONAL — run this ONCE *before* setUp if you only want NEW rows from now on.
 * It stamps every existing row as already-synced so your current backlog is NOT
 * pushed into the Call Flow. Skip it if you DO want your whole list imported.
 */
function markAllSyncedWithoutSending() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error('Sheet not found: ' + CONFIG.SHEET_NAME);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return;
  const headers = values[0];
  let syncedIdx = headers.findIndex((h) => normHeader(h) === normHeader(CONFIG.SYNCED_HEADER));
  if (syncedIdx < 0) {
    syncedIdx = headers.length;
    sheet.getRange(1, syncedIdx + 1).setValue(CONFIG.SYNCED_HEADER);
  }
  const now = new Date();
  let marked = 0;
  for (let r = 1; r < values.length; r++) {
    if (!values[r][syncedIdx]) { sheet.getRange(r + 1, syncedIdx + 1).setValue(now); marked++; }
  }
  console.log('Marked ' + marked + ' existing row(s) as already-synced.');
}
