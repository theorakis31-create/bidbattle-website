'use strict';
// Local atomic snapshots for development. On Render use a separate durable
// Supabase PostgreSQL database via its server-only REST API.
const fs=require('node:fs');
const path=require('node:path');
const url=String(process.env.SUPABASE_URL||'').replace(/\/$/,'');
const key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||'';
const authHeaders=key.startsWith('sb_secret_')?{}:{Authorization:`Bearer ${key}`};
const remote=!!(url&&key);
const testMemory=process.env.BIDBATTLE_TEST_FAST==='1'&&!process.env.BIDBATTLE_DATA_FILE&&!remote;
const file=process.env.BIDBATTLE_DATA_FILE||path.join(__dirname,'data','bidbattle.json');
let pending=Promise.resolve(),generation=0,lastError=null;
async function load(){
 if(testMemory)return {rooms:[],users:[]};
 if(remote){
  const res=await fetch(`${url}/rest/v1/bidbattle_store?id=eq.global&select=payload`,{headers:{apikey:key,...authHeaders},signal:AbortSignal.timeout(10000)});
  if(!res.ok)throw Error(`Supabase-Lesen fehlgeschlagen (${res.status})`);
  const data=await res.json();return data[0]?.payload||{rooms:[],users:[]};
 }
 try{return JSON.parse(fs.readFileSync(file,'utf8'));}
 catch(e){if(e.code==='ENOENT')return {rooms:[],users:[]};throw e;}
}
function save(snapshot){
 if(testMemory)return;
 generation++;
 if(!remote){fs.mkdirSync(path.dirname(file),{recursive:true});const tmp=`${file}.${process.pid}.tmp`;fs.writeFileSync(tmp,JSON.stringify(snapshot),{mode:0o600});fs.renameSync(tmp,file);return;}
 const version=generation;
 pending=pending.catch(()=>{}).then(async()=>{
  const res=await fetch(`${url}/rest/v1/bidbattle_store?on_conflict=id`,{method:'POST',headers:{apikey:key,...authHeaders,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify([{id:'global',payload:snapshot}]),signal:AbortSignal.timeout(10000)});
  if(!res.ok)throw Error(`Supabase-Schreiben fehlgeschlagen (${res.status})`);
  lastError=null;
 }).catch(e=>{lastError=e.message;console.error('SPEICHERFEHLER',e.message,'Generation',version);});
}
function status(){return {kind:remote?'supabase':'local',lastError};}
function flush(){return pending;}
module.exports={load,save,status,flush,remote};
