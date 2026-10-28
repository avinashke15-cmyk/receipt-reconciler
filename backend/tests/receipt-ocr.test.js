const {test}=require('node:test'),assert=require('node:assert/strict');
const {receiptFromOcr}=require('../src/receipt-ocr');
test('extracts merchant, date, grand total and card',()=>{
 const r=receiptFromOcr('Jumeirah Beach Cafe\nDate 22/06/2026\nSubtotal AED 200.00\nVAT AED 10.00\nGrand Total AED 240.00\nVISA ****9921\nReceipt # R38155');
 assert.equal(r.merchant,'Jumeirah Beach Cafe');
 assert.equal(r.receipt_date,'2026-06-22');
 assert.equal(r.amount_minor,24000);
 assert.equal(r.card_last4,'9921');
 assert.equal(r.receipt_number,'R38155');
});
test('missing amount is left null for manual review',()=>{
 const r=receiptFromOcr('Cafe Blue\n2026-06-02\nThank you');
 assert.equal(r.amount_minor,null);
});
