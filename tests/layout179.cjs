'use strict';
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');const app=fs.readFileSync(path.join(root,'public/app.js'),'utf8');
assert(html.includes('id="bbCreateProfileStep"')&&html.includes('id="bbCreateSettingsStep"'));
assert(html.includes('id="bbCreateModeChooser"'));
assert(app.includes('directModeSelected')&&app.includes('resumeEntryIntent()'));
assert.equal((html.match(/id="createName"/g)||[]).length,1);
for(const id of ['nova','luna','kai','roxy','ace','milo','juno','zara','rex','ember','shadow','pixel'])assert(fs.existsSync(path.join(root,'public/assets/avatars',id+'.svg')),`${id} missing`);
const port=32000+Math.floor(Math.random()*3000),env={...process.env,PORT:String(port),BIDBATTLE_DATA_FILE:path.join('/tmp',`bb-layout179-${port}.json`)};
const server=spawn(process.execPath,['server.js'],{cwd:root,env,stdio:'ignore'});
const base=`http://127.0.0.1:${port}`;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function go(){
  for(let i=0;i<60;i++){try{const r=await fetch(base+'/api/health');if(r.ok)break;}catch{}await pause(100);}
  for(const id of ['nova','luna','shadow','pixel']){
    const r=await fetch(base+'/assets/avatars/'+id+'.svg');assert.equal(r.status,200,`${id} image HTTP ${r.status}`);
    assert.match(r.headers.get('content-type')||'',/svg/);
    assert.match(await r.text(),/<svg/);
  }
  const missing=await fetch(base+'/assets/avatars/unknown.svg');assert.equal(missing.status,404);
  const r=await fetch(base+'/api/rooms',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'Avatar Host',avatar:'luna',avatarColor:'pink',mode:'food',auctionType:'sealed',timeLimit:15,budget:20})});
  assert.equal(r.status,201,`Unexpected room creation HTTP ${r.status}`);
  // Server ensures new avatar IDs travel through real multiplayer state.
  const body=await r.json();assert.equal(body.state.players[0].avatar,'luna');
  const j=await fetch(base+`/api/rooms/${body.code}/join`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'Avatar Gast',avatar:'pixel',avatarColor:'blue'})});
  assert.equal(j.status,200);const joined=await j.json();assert.equal(joined.state.players[1].avatar,'pixel');
  console.log('PASS 1.7.9: avatars served and retained in multiplayer, onboarding markup and rules preserved');
}
go().then(()=>{server.kill();}).catch(e=>{console.error(e);server.kill();process.exitCode=1;});
