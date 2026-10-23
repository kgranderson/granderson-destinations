import test from 'node:test';
import assert from 'node:assert/strict';
import { actualPerformance,comparePerformance,optimizationReport,normalizeAirDNA } from '../src/lib/analytics/model.mjs';
import { importActuals,importComparables,parseCSV } from '../src/lib/analytics/import.mjs';
const now=new Date('2026-10-23T00:00:00Z'),property={slug:'palm-springs',bedrooms:4,sleeps:10};
const rows=['2026-07','2026-08','2026-09'].map(month=>({month,nights_booked:15,nights_available:30,revenue_realized:6000}));
const snapshot={provider:'manual',fetchedAt:now.toISOString(),comps:[1,2,3].map(i=>({listingId:`c${i}`,currency:'USD',bedrooms:4,accommodates:10,distanceKm:2,listingType:'entire_place',months:rows.map(r=>({month:r.month,adr:500,occupancy:0.7,available:30}))}))};
test('actual ADR and occupancy are weighted by nights, not averages of monthly percentages',()=>{
  const a=actualPerformance([{...rows[0],nights_booked:2,nights_available:4,revenue_realized:200}, {...rows[1],nights_booked:20,nights_available:30,revenue_realized:4000}],now);
  assert.equal(a.adr,190.91);assert.equal(a.occupancy,22/34);assert.equal(a.revpar,123.53);
});
test('no rows is missing, zero bookings is real zero with unknown ADR',()=>{assert.equal(actualPerformance([],now),null);const a=actualPerformance([{...rows[0],nights_booked:0,revenue_realized:0}],now);assert.equal(a.adr,null);assert.equal(a.revpar,0);});
test('current and future months excluded; malformed totals excluded',()=>{assert.equal(actualPerformance([{...rows[0],month:'2026-10'},{...rows[0],nights_booked:32}],now),null);});
test('comps must match dates, currency, size, distance and entire-home type',()=>{
  const a=actualPerformance(rows,now);const result=comparePerformance(a,snapshot,property,now);assert.equal(result.ready,true);assert.equal(result.benchmark.revpar,350);assert.equal(result.comps.length,3);
  for(const edit of [{currency:'MXN'},{bedrooms:1},{distanceKm:15},{listingType:'private_room'},{months:[]}]){const c=comparePerformance(a,{...snapshot,comps:snapshot.comps.map(x=>({...x,...edit}))},property,now);assert.equal(c.ready,false);assert.equal(c.comps.length,0);}
});
test('duplicates, small samples and stale data do not generate confident pricing recommendations',()=>{
  const a=actualPerformance(rows,now);for(const s of [{...snapshot,comps:[snapshot.comps[0],snapshot.comps[0]]},{...snapshot,fetchedAt:'2025-01-01'}]){const c=comparePerformance(a,s,property,now);assert.equal(c.ready,false);assert.equal(optimizationReport(c).actions[0].id,'improve-evidence');}
});
test('optimization explains assumptions and never adds overlapping scenarios',()=>{const r=optimizationReport(comparePerformance(actualPerformance(rows,now),snapshot,property,now));assert.equal(r.actions[0].id,'fill-open-nights');assert.equal(r.actions[0].scenario.usd,3600);assert.match(r.limitations[0],/must not be added/);});
test('CSV handles quoted commas and rejects broken quotes/duplicates',()=>{assert.equal(parseCSV('a,b\n"one, two",3')[0].a,'one, two');assert.throws(()=>parseCSV('a,a\n1,2'));assert.throws(()=>parseCSV('a,b\n"bad,2'));});
test('actual import validates complete months, USD, and impossible nights before writes',()=>{const header='month,nights_booked,nights_available,revenue_realized,currency\n';assert.equal(importActuals(header+'2026-09,10,30,5000,USD',now)[0].month,'2026-09');for(const r of ['2026-09,31,30,5000,USD','2026-09,0,30,5000,USD','2026-10,10,30,5000,USD','2026-09,10,30,5000,MXN'])assert.throws(()=>importActuals(header+r,now));});
test('AirDNA normalization keeps historical comps separate from forecast',()=>{const raw={payload:{stats:{currency:'usd',future:{summary:{adr:900,occupancy:0.8,revenue:250000}}},comps:[{property_id:'abnb_1',details:{bedrooms:4,accommodates:10,listing_type:'entire_place'},distance_meters:2000,stats:{metrics:[{date:'2026-09',adr:500,occupancy:0.5}]}}]}};const s=normalizeAirDNA(raw,property,now);assert.equal(s.comps[0].months[0].adr,500);assert.equal(s.forecast.adr,900);assert.throws(()=>normalizeAirDNA({payload:{stats:{currency:'mxn'},comps:[]}},property,now));});
test('comparable import rejects inconsistent metadata and duplicate months',()=>{const h='listing_id,title,month,adr,occupancy,nights_available,currency,bedrooms,accommodates,distance_km,listing_type\n';const row='a,Home,2026-09,500,0.7,30,USD,4,10,2,entire_place';assert.equal(importComparables(h+row,'palm-springs',now).comps.length,1);assert.throws(()=>importComparables(h+row+'\n'+row,'palm-springs',now));});
