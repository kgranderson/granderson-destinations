export function monthDays(month) { const [y,m]=month.split('-').map(Number); return new Date(Date.UTC(y,m,0)).getUTCDate(); }
export function validMonth(v) { return typeof v==='string' && /^20\d{2}-(0[1-9]|1[0-2])$/.test(v); }
export function finite(v,min=0,max=1e8) { return typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max; }
const round=n=>Number.isFinite(n)?Math.round(n*100)/100:null;
const median=a=>{const v=a.filter(Number.isFinite).sort((x,y)=>x-y);return v.length?(v[Math.floor((v.length-1)/2)]+v[Math.ceil((v.length-1)/2)])/2:null;};

export function actualPerformance(rows=[],now=new Date()) {
  const current=now.toISOString().slice(0,7);
  const usable=rows.filter(r=>validMonth(r.month?.slice(0,7))&&r.month.slice(0,7)<current&&finite(Number(r.nights_available),1,31)&&finite(Number(r.nights_booked),0,Number(r.nights_available))&&finite(Number(r.revenue_realized))&&!(Number(r.nights_booked)===0&&Number(r.revenue_realized)>0)).map(r=>({...r,month:r.month.slice(0,7)})).sort((a,b)=>a.month.localeCompare(b.month)).slice(-12);
  if (!usable.length) return null;
  const booked=usable.reduce((s,r)=>s+Number(r.nights_booked),0),available=usable.reduce((s,r)=>s+Number(r.nights_available),0),revenue=usable.reduce((s,r)=>s+Number(r.revenue_realized),0);
  return { months:usable.map(r=>r.month), rows:usable, revenue:round(revenue), booked, available, adr:booked?round(revenue/booked):null, occupancy:booked/available, revpar:round(revenue/available), currency:'USD' };
}
export function normalizeAirDNA(body,property,now=new Date()) {
  const p=body?.payload;
  if (!p||p.stats?.currency?.toLowerCase()!=='usd'||!Array.isArray(p.comps)) throw new Error('invalid_provider_payload');
  const comps=p.comps.slice(0,50).map(c=>({
    listingId:String(c.property_id||'').slice(0,100),name:String(c.details?.title||'Comparable property').slice(0,140),
    bedrooms:c.details?.bedrooms,accommodates:c.details?.accommodates,distanceKm:finite(c.distance_meters)?c.distance_meters/1000:null,
    listingType:c.details?.listing_type||'unknown',currency:'USD',
    url:safeListingUrl(c.platforms?.airbnb_property_url||c.platforms?.vrbo_property_url||c.platforms?.booking_property_url),
    months:(c.stats?.metrics||[]).filter(m=>validMonth(m.date)&&finite(m.occupancy,0,1)&&(finite(m.adr)||m.occupancy===0)).map(m=>({month:m.date,adr:finite(m.adr)?m.adr:null,occupancy:m.occupancy,available:monthDays(m.date)})),
  })).filter(c=>c.listingId&&c.months.length);
  if(!comps.length)throw new Error('no_comparables');
  return {schema:1,propertySlug:property.slug,provider:'airdna',fetchedAt:now.toISOString(),currency:'USD',availabilityBasis:'Calendar days (provider monthly available nights not supplied)',comps,
    forecast:p.stats.future?.summary&&finite(p.stats.future.summary.adr)&&finite(p.stats.future.summary.occupancy,0,1)?{adr:p.stats.future.summary.adr,occupancy:p.stats.future.summary.occupancy,revenue:p.stats.future.summary.revenue??null}:null};
}
export function safeListingUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&['www.airbnb.com','airbnb.com','www.vrbo.com','vrbo.com','www.booking.com','booking.com'].includes(u.hostname)?u.href:null;}catch{return null;}}
export function comparePerformance(actual,snapshot,property,now=new Date()) {
  const warnings=[];
  if(!actual)return {actual:null,comps:[],benchmark:null,warnings:['Import actual lodging revenue and available nights to start.'],ready:false};
  if(!snapshot)return {actual,comps:[],benchmark:null,warnings:['Add a comparable-property dataset.'],ready:false};
  const age=(now-Date.parse(snapshot.fetchedAt))/86400000;
  const stale=!Number.isFinite(age)||age<0||age>45;
  if(stale)warnings.push('Comparable data is over 45 days old or has an invalid date. Refresh before making decisions.');
  const end=new Date(`${actual.months.at(-1)}-01T00:00:00Z`);end.setUTCMonth(end.getUTCMonth()+1);
  const actualStale=(now-end)/86400000>60;
  if(actualStale)warnings.push('Actual results are over 60 days behind. Import recent complete months.');
  if(actual.months.length<3)warnings.push('Fewer than three complete months of actual results.');
  const seen=new Set();
  const comps=(snapshot.comps||[]).filter(c=>{
    if(seen.has(c.listingId))return false;seen.add(c.listingId);
    return c.currency==='USD'&&finite(c.bedrooms)&&Math.abs(c.bedrooms-property.bedrooms)<=1&&finite(c.accommodates)&&Math.abs(c.accommodates-property.sleeps)<=2&&finite(c.distanceKm,0,10)&&c.listingType==='entire_place';
  }).map(c=>{
    const months=actual.months.map(month=>c.months.find(m=>m.month===month));
    if(months.some(m=>!m||!finite(m.occupancy,0,1)||!(finite(m.adr)||m.occupancy===0)||!finite(m.available,1,31)))return null;
    const available=months.reduce((s,m)=>s+m.available,0),booked=months.reduce((s,m)=>s+m.available*m.occupancy,0),revenue=months.reduce((s,m)=>s+(m.adr||0)*m.available*m.occupancy,0);
    return {...c,months:undefined,adr:booked?round(revenue/booked):null,occupancy:booked/available,revpar:round(revenue/available)};
  }).filter(Boolean);
  if(comps.length<3)warnings.push('At least three similar properties with the same months are needed for a reliable comparison.');
  warnings.push('Confirm pool, finish quality, location and amenities manually; size and distance filters alone do not establish equivalence.');
  const benchmark=comps.length?{adr:median(comps.map(c=>c.adr)),occupancy:median(comps.map(c=>c.occupancy)),revpar:median(comps.map(c=>c.revpar))}:null;
  const gap=benchmark?.revpar>0?(actual.revpar/benchmark.revpar-1):null;
  return {actual,comps,benchmark,warnings,stale,actualStale,gap,ready:!!benchmark&&comps.length>=3&&actual.months.length>=3&&!stale&&!actualStale,provider:snapshot.provider,fetchedAt:snapshot.fetchedAt,availabilityBasis:snapshot.availabilityBasis};
}

// Evidence is computed first; AI can summarize it but cannot change the numbers or execute changes.
export function optimizationReport(comparison) {
  const actions=[];const {actual,benchmark,ready}=comparison;
  const add=(id,title,why,test,measure,priority='medium',scenario=null)=>actions.push({id,title,why,test,measure,priority,scenario});
  if(!actual)add('import-actuals','Establish an operating baseline','No actual monthly performance is available.','Import lodging-only revenue, booked nights and sellable nights for at least three complete months.','Complete and current data','high');
  else if(!ready)add('improve-evidence','Complete the comparison set',comparison.warnings.slice(0,2).join(' '),'Refresh actuals and add at least three similar rentals covering the same months.','Three or more comparable rentals and three complete months','high');
  if(ready){
    const occGap=benchmark.occupancy-actual.occupancy;
    const rateGap=benchmark.adr&&actual.adr?benchmark.adr/actual.adr-1:null;
    if(occGap>0.05)add('fill-open-nights','Recover unbooked nights',`Occupancy trails the comparable median by ${round(occGap*100)} percentage points.`,`Test a targeted weekday or short-gap offer for two weeks. Check calendar restrictions and listing conversion first. Keep peak dates unchanged.`,`Track booked nights, net RevPAR and cancellation rate. Stop if net RevPAR falls.`,'high',{label:'Illustrative gross revenue at half the occupancy gap',usd:round(occGap/2*actual.available*(actual.adr||0))});
    if(rateGap>0.05&&actual.occupancy>=benchmark.occupancy-0.03)add('test-rate','Test a measured rate increase',`Realized ADR is ${round(rateGap*100)}% below the comparable median with similar occupancy.`,`Test a 5% increase on a limited date range for two weeks after checking booking pace.`,`Compare net RevPAR and booking pace against similar unadjusted dates.`,'high',{label:'Illustrative 5% rate increase at unchanged occupancy',usd:round(actual.revenue*0.05)});
    if(actual.adr>benchmark.adr*1.1&&occGap>0.05)add('price-position','Check the premium against demand',`Rates exceed the comparable median while occupancy trails it.`,`Review photos, amenity differences and restrictions before a limited discount test.`,`Watch net RevPAR rather than occupancy alone.`,'high');
    if(!actions.length)add('protect-performance','Protect current performance','No large rate or occupancy gap is evident in the matched sample.','Review upcoming demand events and guest feedback; test one change at a time.','Net RevPAR, guest ratings and repeat bookings');
    add('protect-margin','Measure the profit behind revenue','Gross lodging revenue does not include management costs, commissions or operating expenses.','Reconcile the financial import and compare channel fees and recurring maintenance before expanding discounts.','Net operating income and acquisition cost');
  }
  return {schema:1,generatedAt:new Date().toISOString(),confidence:ready?'directional':'insufficient_data',summary:ready?'Prioritize controlled experiments using the matched property comparison.':'Complete the data before making pricing decisions.',actions,limitations:['Scenarios are illustrations, not forecasts. They overlap and must not be added together.','Seasonality, amenities and booking-window differences can explain performance gaps.','No rates, listings, advertisements or messages are changed automatically.']};
}
