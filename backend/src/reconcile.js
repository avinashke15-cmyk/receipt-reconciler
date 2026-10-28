const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\b(llc|ltd|limited|inc|ae|dubai)\b/g, ' ').replace(/\s+/g, ' ').trim();
function similarity(a, b) {
  a = norm(a); b = norm(b);
  if (!a || !b) return 0;
  if (a === b || a.includes(b) || b.includes(a)) return 1;
  const A = new Set(a.split(' ')), B = new Set(b.split(' '));
  return [...A].filter(x => B.has(x)).length / Math.max(A.size, B.size);
}
const days = (a, b) => a && b ? Math.abs((Date.parse(a) - Date.parse(b)) / 86400000) : Infinity;
function reconcile(receipts, lines) {
  const output = [], duplicates = new Set(), grouped = new Map();
  // Only a repeated explicit receipt number is strong enough to classify a duplicate.
  for (const r of receipts) {
    const number = norm(r.receipt_number);
    if (!number) continue;
    const key = [number, norm(r.merchant), r.receipt_date || '', r.card_last4 || ''].join('|');
    if (grouped.has(key)) duplicates.add(r.id);
    else grouped.set(key, r.id);
  }
  const edges = [];
  for (const r of receipts) {
    if (duplicates.has(r.id)) continue;
    for (const l of lines) {
      const merchant = similarity(r.merchant, l.description), gap = days(r.receipt_date, l.date);
      if (!r.merchant || !r.receipt_date || r.amount_minor == null || gap > 3 || merchant < 0.4) continue;
      if (r.card_last4 && r.card_last4 !== l.card_last4) continue;
      const exact = r.amount_minor === l.amount_minor;
      const score = (exact ? 100 : 0) + merchant * 20 + (3 - gap) * 2 + (r.card_last4 ? 5 : 0);
      edges.push({r, l, exact, merchant, gap, score});
    }
  }
  // Global best-first assignment avoids an early approximate match stealing a later exact match.
  edges.sort((a, b) => b.score - a.score || a.r.id - b.r.id || a.l.id - b.l.id);
  const assignedReceipts = new Set(), assignedLines = new Set();
  for (const e of edges) {
    if (assignedReceipts.has(e.r.id) || assignedLines.has(e.l.id)) continue;
    assignedReceipts.add(e.r.id); assignedLines.add(e.l.id);
    output.push({
      receipt_id: e.r.id, statement_line_id: e.l.id,
      status: e.exact ? 'matched' : 'mismatch',
      reason: e.exact ? 'Merchant, date, card and amount aligned' :
        'Receipt AED ' + (e.r.amount_minor / 100).toFixed(2) + ' vs statement AED ' + (e.l.amount_minor / 100).toFixed(2),
      confidence: Math.min(.99, .55 + e.merchant * .35 + (e.exact ? .08 : 0))
    });
  }
  for (const r of receipts) {
    if (duplicates.has(r.id)) output.push({receipt_id:r.id,statement_line_id:null,status:'duplicate',reason:'Repeated receipt number for the same merchant, date and card',confidence:.99});
    else if (!assignedReceipts.has(r.id)) output.push({receipt_id:r.id,statement_line_id:null,status:'missing',reason:r.amount_minor == null || !r.receipt_date || !r.merchant ? 'Receipt needs OCR review: missing merchant, date or amount' : 'Receipt without matching statement transaction',confidence:0});
  }
  for (const l of lines) if (!assignedLines.has(l.id)) output.push({receipt_id:null,statement_line_id:l.id,status:'missing',reason:'Statement transaction without receipt',confidence:0});
  return output;
}
module.exports = {reconcile, similarity};
