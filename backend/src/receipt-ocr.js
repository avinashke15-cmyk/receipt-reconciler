const money = x => { const n=Number(String(x).replace(/[,AED\s]/gi,''));return Number.isFinite(n)&&n>=0?Math.round(n*100):null; };
const iso = input => {
 let s=String(input||'').trim().replace(/[.]/g,'/');
 let m=s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
 if(m)s=m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return null;
 const d=new Date(s+'T00:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===s?s:null;
};
function receiptFromOcr(text) {
 const lines=String(text||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const merchant=lines.find(x=>/[a-z]{3}/i.test(x)&&!/\b(total|receipt|date|visa|mastercard|card|vat|tax|subtotal|thank|invoice|payment|cash|balance|amount)\b/i.test(x))||null;
 const dateMatch=text.match(/\b(\d{4}-\d{2}-\d{2}|\d{1,2}[\/.-]\d{1,2}[\/.-]\d{4})\b/);
 const candidates=[];
 for(const line of lines){
   if(/\b(subtotal|sub total|vat|tax|discount|change|cash received)\b/i.test(line))continue;
   const label=/\b(grand\s*total|total\s*(?:due|paid|amount)?|amount\s*(?:paid|due))\b/i.exec(line);
   if(!label)continue;
   const rest=line.slice(label.index+label[0].length);
   const matches=[...rest.matchAll(/(?:AED\s*)?(\d{1,6}(?:,\d{3})*\.\d{2}|\d{1,6}[.,]\d{2})\b/gi)];
   if(matches.length)candidates.push({value:matches[matches.length-1][1],rank:/grand\s*total/i.test(label[0])?3:/total/i.test(label[0])?2:1});
 }
 candidates.sort((a,b)=>b.rank-a.rank);
 const card=text.match(/(?:VISA|MASTERCARD|CARD|\*{2,}|X{2,})[^\n]{0,35}?(\d{4})\b/i);
 const number=text.match(/\b(?:receipt|invoice)\s*(?:no\.?|number|#|:)\s*[:#-]?\s*([A-Z0-9-]{3,})/i);
 return {merchant,receipt_date:dateMatch?iso(dateMatch[1]):null,amount_minor:candidates.length?money(candidates[0].value):null,card_last4:card?.[1]||null,receipt_number:number?.[1]||null};
}
module.exports={receiptFromOcr,iso,money};
