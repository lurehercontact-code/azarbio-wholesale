// Pure reconciliation: this endpoint has no Sheets credentials and performs no writes.
const FIELDS = ['Téléphone', 'Statut', 'Nom', 'Ville', 'Adresse', 'Offre', 'Total (DH)', 'Premier enregistrement (UTC)', 'Campagne', 'Source', 'Annonce', 'Dernière saisie (UTC)'];
const META = '_Capture auto';
const DAY = 86400000;
const TEST_PHONES = new Set(['0600000000', '0700000000']);
const blank = v => v === '' || v === null || v === undefined;
const serial = ms => Number(ms) / DAY + 25569;
const phoneKey = v => {
  let s = String(v ?? '').replace(/[^0-9]/g, '');
  if (s.startsWith('00212')) s = '0' + s.slice(5);
  else if (s.startsWith('212')) s = '0' + s.slice(3);
  else if (/^[567]\d{8}$/.test(s)) s = '0' + s;
  return /^0[567]\d{8}$/.test(s) ? s : '';
};
const cellValue = v => typeof v === 'number' && Number.isFinite(v) ? { numberValue: v } : { stringValue: String(v ?? '') };
const same = (a, b) => (blank(a) && blank(b)) || a === b;

export function planCartSheet({ sheetId, snapshot, journal }) {
  if (!Number.isInteger(sheetId) || !Array.isArray(snapshot) || !Array.isArray(journal) || snapshot.length > 12000 || journal.length > 20000) throw new Error('invalid_snapshot');
  const header = snapshot[0] || [];
  const columns = FIELDS.map(h => header.indexOf(h));
  const metaCol = header.indexOf(META);
  if (columns.some(c => c < 0) || metaCol < 0) throw new Error('invalid_headers');
  const captures = new Map();
  const completions = new Map();
  for (const rawEntry of journal.slice(1)) {
    const entry = Array.from({ length: 12 }, (_, i) => rawEntry[i] ?? '');
    const phone = phoneKey(entry[0]);
    if (!phone || TEST_PHONES.has(phone)) continue;
    const revision = Number(entry[2]);
    if (!Number.isFinite(revision) || revision <= 0) continue;
    // Older Make mappings accidentally concatenated seconds/999; normalize those legacy events.
    const ms = revision > 1e14 ? Math.floor(revision / 1000) : revision;
    if (entry[3] === 'Envoyé') completions.set(phone, Math.max(completions.get(phone) || 0, ms));
    else if (entry[3] === 'Abandonné') {
      const previous = captures.get(phone);
      if (!previous) captures.set(phone, { entry, first: ms, revision: ms });
      else {
        previous.first = Math.min(previous.first, ms);
        if (ms >= previous.revision) { previous.entry = entry; previous.revision = ms; }
      }
    }
  }
  const requests = [];
  const rows = snapshot.slice(1).map(r => [...r]);
  const used = new Map();
  rows.forEach((row, index) => {
    let meta;
    try { meta = JSON.parse(row[metaCol] || '{}'); } catch { meta = {}; }
    const key = phoneKey(meta.phone) || phoneKey(row[columns[0]]);
    if (key && !used.has(key)) used.set(key, { row, index: index + 1, meta });
  });
  let nextRow = rows.reduce((last, row, i) => row.some(v => !blank(v)) ? i + 2 : last, 1);
  let added = 0, updated = 0;
  const write = (index, col, value, link) => {
    const cell = { userEnteredValue: cellValue(value) };
    let fields = 'userEnteredValue';
    if (link) { cell.textFormatRuns = [{ startIndex: 0, format: { link: { uri: link } } }]; fields += ',textFormatRuns'; }
    requests.push({ updateCells: { start: { sheetId, rowIndex: index, columnIndex: col }, rows: [{ values: [cell] }], fields } });
  };
  for (const [phone, capture] of captures) {
    const e = capture.entry;
    const status = (completions.get(phone) || 0) >= Number(e[1]) ? 'Envoyé' : 'Abandonné';
    const auto = [phone, status, ...e.slice(4, 9), serial(capture.first), ...e.slice(9, 12), serial(capture.revision)];
    while (auto.length < FIELDS.length) auto.push('');
    const found = used.get(phone);
    const index = found ? found.index : nextRow++;
    if (found) {
      const previous = Array.isArray(found.meta.auto) ? found.meta.auto : auto;
      for (let f = 1; f < FIELDS.length; f++) {
        const current = found.row[columns[f]];
        if (same(current, previous[f]) && !same(current, auto[f])) { write(index, columns[f], auto[f]); updated++; }
      }
      // Always refresh the literal phone's link, including a phone corrected by the operator.
      const currentPhone = String(found.row[columns[0]] ?? '');
      const callable = phoneKey(currentPhone);
      if (callable) write(index, columns[0], currentPhone, 'https://vitamor-fruits.vercel.app/appeler.html#' + callable);
    } else {
      const row = Array(header.length).fill('');
      columns.forEach((col, f) => { row[col] = auto[f] ?? ''; });
      row[metaCol] = JSON.stringify({ phone, auto, revision: capture.revision });
      const values = row.map(v => ({ userEnteredValue: cellValue(v) }));
      values[columns[0]].textFormatRuns = [{ startIndex: 0, format: { link: { uri: 'https://vitamor-fruits.vercel.app/appeler.html#' + phone } } }];
      requests.push({ updateCells: { start: { sheetId, rowIndex: index, columnIndex: 0 }, rows: [{ values }], fields: 'userEnteredValue,textFormatRuns' } });
      added++;
    }
    const metadata = JSON.stringify({ phone, auto, revision: capture.revision });
    if (found && metadata !== found.row[metaCol]) write(index, metaCol, metadata);
  }
  // Google rejects an empty requests array; this bounded no-match operation is a safe no-op.
  if (!requests.length) requests.push({ findReplace: { find: '__vitamor_noop__', replacement: '__vitamor_noop__', sheetId } });
  return { body: JSON.stringify({ requests }), added, updated };
}

export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') { res.statusCode = 405; res.end('{"error":"method_not_allowed"}'); return; }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const ranges = body?.valueRanges;
    if (!Array.isArray(ranges) || ranges.length !== 2) throw new Error('invalid_snapshot');
    const result = planCartSheet({ sheetId: Number(req.query?.sheetId || 1427491460), snapshot: ranges[0].values || [], journal: ranges[1].values || [] });
    res.statusCode = 200;
    res.end(JSON.stringify(result));
  } catch {
    res.statusCode = 400;
    res.end('{"error":"invalid_snapshot"}');
  }
}
