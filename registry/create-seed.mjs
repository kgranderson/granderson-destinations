import { CHECKS } from '../src/lib/reliability/core.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const now=new Date().toISOString().replace(/\.\d{3}Z$/,'Z');
const directory=fileURLToPath(new URL('./seed/',import.meta.url));
const entity='Granderson Holdings Inc.';
const program='p_granderson_destinations';
const documents={
  'apps/a_granderson_destinations':{name:'Granderson Destinations',description:'Luxury vacation rentals and property operations',entity,notes:'Key-check activation pending; no live health results synced yet.',order:6,created_at:now,updated_at:now},
  [`programs/${program}`]:{name:'Granderson Destinations web app',app_id:'a_granderson_destinations',entity,criticality:'high',hosting:{vercel_project:'granderson-destinations',github_repo:'kgranderson/granderson-destinations',supabase_ref:'yyhfdqunyufjoyztvcti',domains:['grandersondestinations.com']},notes:'Daily key checks at 14:50 UTC after activation. Credentials stay on the production server. Registry uses the token-protected outcome endpoint. Confirm custom domain reaches this project before placing a read token.',created_at:now,updated_at:now}
};
const observed=new Set(['supabase_anon','supabase_service_role','anthropic_key','clickup','twilio','gmail','perplexity','google_places','google_maps','owner_admin_token']);
for(const c of CHECKS){
 const enabled=observed.has(c.id)&&!['presence','paid','webhook'].includes(c.kind);
 documents[`credentials/c_gd_${c.id}`]={name:`${c.label} — Granderson Destinations`,kind:c.id.includes('salt')?'encryption_key':'api_key',provider:'other',entity,environment:'prod',bindings:[{program_id:program,var_name:c.variable,file:'Vercel Production'}],storage:[{kind:'vercel_env',ref:`vercel:granderson-destinations:${c.variable}:production`}],features:[c.label],expiry:{},check_enabled:enabled,check:{enabled,adapter:'granderson_destinations_inapp',source:{kind:'inapp',app:'granderson_destinations',check_id:c.id},target:{check_id:c.id}},notes:observed.has(c.id)?'Variable name observed in Vercel Production; value not inspected. Health not yet tested.':'Not present in the reviewed Vercel Production configuration. Provision only if this integration is needed.',test_plan:['paid','presence','webhook'].includes(c.kind)?'Presence/skipped only; no validity claim or paid canary.':'Free read-only request inside the production application after activation.',source_doc:'Granderson Destinations docs/reliability/KEY-CHECK.md; names-only review 2026-10-23',created_at:now,updated_at:now};
}
for(const [path,value] of Object.entries(documents)){await mkdir(`${directory}/${path.split('/')[0]}`,{recursive:true});await writeFile(`${directory}/${path}.json`,JSON.stringify(value,null,2)+'\n');}
console.log(`${Object.keys(documents).length} metadata-only seed documents created`);
