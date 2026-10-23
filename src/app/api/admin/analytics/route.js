import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/admin';
import { getAdminClient } from '@/lib/supabase/admin';
import { PROPERTIES } from '@/lib/constants';
import { importActuals,importComparables } from '@/lib/analytics/import.mjs';
import { refreshAirDNA,thinkAboutProperty,loadAnalysis } from '@/lib/analytics/service';
import { optimizationReport } from '@/lib/analytics/model.mjs';
import { audit } from '@/lib/reliability/service';
import { revalidateTag } from 'next/cache';
export const maxDuration=60;
const CODES=new Set(['airdna_not_configured','exact_address_required','daily_limit','cooldown','provider_auth_failed','provider_plan_required','provider_rate_limited','provider_unavailable','storage_unavailable','invalid_provider_payload','no_comparables','file_too_large','invalid_csv','duplicate_columns','invalid_row_count','missing_number','invalid_number','complete_months_only','usd_required','duplicate_month','invalid_nights','invalid_listing_id','entire_place_required','inconsistent_listing','duplicate_listing_month']);
export const POST=withAdmin(async(request,_ctx,auth)=>{
  try{
    if(Number(request.headers.get('content-length'))>600000)return NextResponse.json({code:'file_too_large'},{status:413});
    const text=await request.text();if(text.length>600000)return NextResponse.json({code:'file_too_large'},{status:413});
    let body;try{body=JSON.parse(text);}catch{return NextResponse.json({code:'invalid_json'},{status:400});}
    const {propertySlug:slug,action}=body;
    if(!PROPERTIES.some(p=>p.slug===slug))return NextResponse.json({code:'unknown_property'},{status:400});
    const db=getAdminClient();if(!db)throw new Error('storage_unavailable');
    if(action==='refresh'){const count=await refreshAirDNA(slug,body.address,auth);return NextResponse.json({ok:true,count});}
    if(action==='think'){const report=await thinkAboutProperty(slug,auth);return NextResponse.json({ok:true,report});}
    if(action==='status'){
      const data=await loadAnalysis(slug);const allowed=optimizationReport(data.comparison).actions.map(a=>a.id);
      if(!allowed.includes(body.actionId)||!['planned','testing','done','dismissed'].includes(body.status))return NextResponse.json({code:'invalid_action'},{status:400});
      const {error}=await db.from('property_optimization_actions').upsert({property_slug:slug,action_id:body.actionId,status:body.status,updated_at:new Date().toISOString()});if(error)throw new Error('storage_unavailable');
      await audit('optimization_action_updated',auth);return NextResponse.json({ok:true});
    }
    if(action==='import_actuals'){
      const rows=importActuals(body.csv);
      const {data:property}=await db.from('properties').select('id').eq('slug',slug).maybeSingle();if(!property)throw new Error('storage_unavailable');
      const {error}=await db.from('occupancy_records').upsert(rows.map(r=>({...r,property_id:property.id})),{onConflict:'property_id,month'});if(error)throw new Error('storage_unavailable');
      revalidateTag(`occupancy:${slug}`,{expire:0});await audit('actuals_imported',auth);return NextResponse.json({ok:true,count:rows.length});
    }
    if(action==='import_comps'){
      const payload=importComparables(body.csv,slug);
      const {error}=await db.from('property_benchmarks').upsert({property_slug:slug,provider:'manual',fetched_at:payload.fetchedAt,payload});if(error)throw new Error('storage_unavailable');
      await audit('comparables_imported',auth);return NextResponse.json({ok:true,count:payload.comps.length});
    }
    return NextResponse.json({code:'invalid_action'},{status:400});
  }catch(error){const code=CODES.has(error.message)?error.message:'request_failed';return NextResponse.json({code},{status:['daily_limit','cooldown'].includes(code)?429:code==='storage_unavailable'?503:400});}
});
