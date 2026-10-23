import 'server-only';
import { getAdminClient } from '@/lib/supabase/admin';
import { PROPERTIES } from '@/lib/constants';
import { actualPerformance,comparePerformance } from '@/lib/analytics/model.mjs';
import { loadOccupancy } from '@/lib/hospitable/loader';
async function stored(marketCode) {
  const property=PROPERTIES.find(p=>p.airdnaMarketCode===marketCode);const db=getAdminClient();
  if(!property||!db)return null;
  const [{data},actual]=await Promise.all([db.from('property_benchmarks').select('payload').eq('property_slug',property.slug).maybeSingle(),loadOccupancy(property.slug)]);
  if(actual.stub)return null;
  return comparePerformance(actualPerformance(actual.rows),data?.payload,property);
}
export async function getCompSet({marketCode}) { const c=await stored(marketCode); return {stub:!c?.ready,unavailable:!c?.ready,comps:c?.ready?c.comps.map(p=>({...p,revPar:p.revpar})):[],asOf:c?.fetchedAt}; }
export async function getMarketSummary(marketCode) {const c=await stored(marketCode);return {stub:!c?.ready,unavailable:!c?.ready,adr:c?.ready?c.benchmark.adr:null,occupancy:c?.ready?c.benchmark.occupancy:null,revPar:c?.ready?c.benchmark.revpar:null,activeListings:c?.comps.length||0,asOf:c?.fetchedAt};}
