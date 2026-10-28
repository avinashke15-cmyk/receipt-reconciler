const {test}=require('node:test'),assert=require('node:assert/strict'),{reconcile}=require('../src/reconcile');
test('both sides and mismatch',()=>{const rs=[{id:1,merchant:'Cafe Blue',receipt_date:'2026-06-02',amount_minor:24000,card_last4:'4417'},{id:2,merchant:'Other Shop',receipt_date:'2026-06-04',amount_minor:3000,card_last4:null}];const ls=[{id:11,description:'CAFE BLUE',date:'2026-06-02',amount_minor:25000,card_last4:'4417'},{id:12,description:'TAXI',date:'2026-06-03',amount_minor:2000,card_last4:'4417'}];const out=reconcile(rs,ls);assert.equal(out.filter(x=>x.status==='mismatch').length,1);assert.equal(out.filter(x=>x.status==='missing').length,2)});
test('duplicate receipt not consumed twice',()=>{const r={merchant:'Cafe Blue',receipt_date:'2026-06-02',amount_minor:24000,card_last4:'4417',receipt_number:'R-100'};const out=reconcile([{id:1,...r},{id:2,...r}],[{id:11,description:'Cafe Blue',date:'2026-06-02',amount_minor:24000,card_last4:'4417'}]);assert.deepEqual(out.map(x=>x.status),['matched','duplicate'])});

test('legitimate same-amount purchases are not duplicates without receipt number',()=>{
 const r={merchant:'Cafe Blue',receipt_date:'2026-06-02',amount_minor:24000,card_last4:'4417'};
 const out=reconcile([{id:1,...r},{id:2,...r}],[{id:11,description:'Cafe Blue',date:'2026-06-02',amount_minor:24000,card_last4:'4417'},{id:12,description:'Cafe Blue',date:'2026-06-02',amount_minor:24000,card_last4:'4417'}]);
 assert.deepEqual(out.map(x=>x.status),['matched','matched']);
});
test('duplicate explicit receipt number is flagged',()=>{
 const r={merchant:'Cafe Blue',receipt_date:'2026-06-02',amount_minor:24000,card_last4:'4417',receipt_number:'R-100'};
 const out=reconcile([{id:1,...r},{id:2,...r}],[{id:11,description:'Cafe Blue',date:'2026-06-02',amount_minor:24000,card_last4:'4417'}]);
 assert.deepEqual(out.map(x=>x.status),['matched','duplicate']);
});
test('global assignment prefers exact amount over earlier mismatch',()=>{
 const rs=[{id:1,merchant:'Cafe Blue',receipt_date:'2026-06-02',amount_minor:2000,card_last4:'4417'},{id:2,merchant:'Cafe Blue',receipt_date:'2026-06-02',amount_minor:3000,card_last4:'4417'}];
 const ls=[{id:11,description:'Cafe Blue',date:'2026-06-02',amount_minor:3000,card_last4:'4417'},{id:12,description:'Cafe Blue',date:'2026-06-02',amount_minor:2000,card_last4:'4417'}];
 const out=reconcile(rs,ls);
 assert.equal(out.filter(x=>x.status==='matched').length,2);
 assert.equal(out.find(x=>x.receipt_id===1).statement_line_id,12);
});
test('incomplete OCR is unmatched, not amount mismatch',()=>{
 const out=reconcile([{id:1,merchant:'Cafe Blue',receipt_date:'2026-06-02',amount_minor:null,card_last4:'4417'}],[{id:11,description:'Cafe Blue',date:'2026-06-02',amount_minor:2000,card_last4:'4417'}]);
 assert.equal(out.filter(x=>x.status==='mismatch').length,0);
 assert.equal(out.filter(x=>x.status==='missing').length,2);
});
