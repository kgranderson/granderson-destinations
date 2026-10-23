import { finite, validMonth, monthDays, safeListingUrl } from './model.mjs';
export function parseCSV(text) {
  if(typeof text!=='string'||Buffer.byteLength(text)>500000)throw new Error('file_too_large');
  const rows=[];let row=[],field='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(field.trim());field='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field.trim());if(row.some(Boolean))rows.push(row);row=[];field='';}else field+=c;}
  if(quoted)throw new Error('invalid_csv');row.push(field.trim());if(row.some(Boolean))rows.push(row);
  if(rows.length<2||rows.length>5001)throw new Error('invalid_row_count');
  const headers=rows.shift().map(x=>x.replace(/^\uFEFF/,'').toLowerCase());
  if(new Set(headers).size!==headers.length)throw new Error('duplicate_columns');
  return rows.map(r=>{if(r.length!==headers.length)throw new Error('invalid_csv');return Object.fromEntries(headers.map((h,i)=>[h,r[i]]));});
}
function numeric(v,min=0,max=1e8){if(v===undefined||v==='')throw new Error('missing_number');const n=Number(v);if(!finite(n,min,max))throw new Error('invalid_number');return n;}
export function importActuals(text,now=new Date()){
  const seen=new Set();return parseCSV(text).map(r=>{
    if(!validMonth(r.month)||r.month>=now.toISOString().slice(0,7))throw new Error('complete_months_only');
    if(r.currency!=='USD')throw new Error('usd_required');
    if(seen.has(r.month))throw new Error('duplicate_month');seen.add(r.month);
    const available=numeric(r.nights_available,1,monthDays(r.month)),booked=numeric(r.nights_booked,0,available),revenue=numeric(r.revenue_realized);
    if(!Number.isInteger(available)||!Number.isInteger(booked)||(booked===0&&revenue>0))throw new Error('invalid_nights');
    return {month:r.month,nights_available:available,nights_booked:booked,revenue_realized:revenue,adr_realized:booked?revenue/booked:0,source:'manual'};
  });
}
export function importComparables(text,propertySlug,now=new Date()){
  const grouped=new Map();for(const r of parseCSV(text)){
    if(!validMonth(r.month)||r.month>=now.toISOString().slice(0,7))throw new Error('complete_months_only');
    if(r.currency!=='USD')throw new Error('usd_required');
    if(!/^[\w-]{1,100}$/.test(r.listing_id||''))throw new Error('invalid_listing_id');
    const c={listingId:r.listing_id,name:(r.title||r.listing_id).slice(0,140),bedrooms:numeric(r.bedrooms,0,50),accommodates:numeric(r.accommodates,1,100),distanceKm:numeric(r.distance_km,0,1000),listingType:r.listing_type,currency:'USD',url:safeListingUrl(r.listing_url),months:[]};
    if(c.listingType!=='entire_place')throw new Error('entire_place_required');
    const prev=grouped.get(c.listingId);
    if(prev&&['bedrooms','accommodates','distanceKm'].some(k=>prev[k]!==c[k]))throw new Error('inconsistent_listing');
    const entry=prev||c;if(entry.months.some(m=>m.month===r.month))throw new Error('duplicate_listing_month');
    entry.months.push({month:r.month,adr:numeric(r.adr),occupancy:numeric(r.occupancy,0,1),available:numeric(r.nights_available,1,monthDays(r.month))});grouped.set(c.listingId,entry);
  }
  return {schema:1,propertySlug,provider:'manual',fetchedAt:now.toISOString(),currency:'USD',availabilityBasis:'Imported sellable nights',comps:[...grouped.values()]};
}
