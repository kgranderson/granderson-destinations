import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
const port=3197,base=`http://127.0.0.1:${port}`;
const env={...process.env,PORT:String(port),OWNER_ADMIN_TOKEN:'local-smoke-fixture-only',NEXT_PUBLIC_SUPABASE_URL:'',NEXT_PUBLIC_SUPABASE_ANON_KEY:'',SUPABASE_SERVICE_ROLE_KEY:'',KEY_CHECK_ENABLED:'',CRON_SECRET:'',KEY_CHECK_READ_TOKEN:''};
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{env,stdio:['ignore','pipe','pipe']});
let logs='';for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{logs=(logs+chunk).slice(-5000);});
try{
 let ready=false;for(let i=0;i<60;i++){try{const r=await fetch(`${base}/api/health`);if(r.ok){ready=true;break;}}catch{}await delay(500);}
 assert.ok(ready,'production server starts');
 for(const path of ['/admin/keys','/admin/analytics','/admin/optimize','/economics','/pricing-engine','/social']){
  const r=await fetch(base+path,{redirect:'manual'});
  if([303,307,308].includes(r.status))assert.ok(r.headers.get('location')?.startsWith('/admin/login'));
  else {
    const html=await r.text();
    // Next may flush the shell before an async auth redirect; then it sends a meta redirect.
    assert.equal(r.status,200,`signed-out ${path}: ${r.status}`);
    assert.match(html,/<meta[^>]+http-equiv="refresh"[^>]+content="[^"]*url=\/admin\/login/);
    assert.ok(!html.includes('Know what is connected.')&&!html.includes('Performance, in context.')&&!html.includes('Operator’s assessment'),'no private page content before redirect');
  }
 }
 for(const path of ['/api/admin/keys/run','/api/admin/analytics']){
  const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(r.status,401,`${path} reauthenticates`);
 }
 for(const path of ['/api/reliability/key-check','/api/reliability/key-check/latest'])assert.equal((await fetch(base+path)).status,401);
 const cross=await fetch(base+'/api/admin/analytics',{method:'POST',headers:{Origin:'https://other.example',Cookie:'gd_owner=local-smoke-fixture-only'},body:'{}'});assert.equal(cross.status,403);
 for(const [path,label] of [['/admin/keys','Know what is connected.'],['/admin/analytics','Performance, in context.'],['/admin/optimize','Turn performance into a plan.']]){
  const r=await fetch(base+path,{headers:{Cookie:'gd_owner=local-smoke-fixture-only'}});assert.equal(r.status,200,`owner ${path} renders`);assert.ok((await r.text()).includes(label),`${path} has expected content`);
 }
 console.log('Production smoke checks passed: owner pages, signed-out redirects, API auth, cron/read auth, cross-origin rejection, missing-storage states.');
}catch(error){console.error(logs);throw error;}finally{child.kill('SIGTERM');}
