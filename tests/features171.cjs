'use strict';
const {spawn}=require('node:child_process');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
const crypto=require('node:crypto');const assert=require('node:assert/strict');
const {catalog,createDeck,arrange}=require('../football');
const PORT=31671,base=`http://127.0.0.1:${PORT}`,sleep=t=>new Promise(r=>setTimeout(r,t));
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'bidbattle171-'));
const server=spawn(process.execPath,['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:String(PORT),BIDBATTLE_TEST_FAST:'1',BIDBATTLE_DATA_FILE:path.join(tmp,'state.json')},stdio:['ignore','pipe','pipe']});
server.stderr.on('data',x=>process.stderr.write(x));
async function api(route,data){const r=await fetch(base+route,{method:data?'POST':'GET',headers:{'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});return {http:r.status,...await r.json()};}
const act=(p,what,data={})=>api(`/api/rooms/${p.code}/${what}`,{token:p.token,...data});
const state=p=>api(`/api/rooms/${p.code}?token=${p.token}`);
async function until(p,fun,timeout=4500){let start=Date.now();while(Date.now()-start<timeout){let x=await state(p);if(fun(x))return x;await sleep(15)}throw Error('Timeout: '+JSON.stringify(await state(p)));}
async function run(){
 assert.ok(catalog.length>=230);assert.equal(Math.min(...catalog.map(x=>x.rating)),80);
 assert.equal(new Set(catalog.map(x=>x.title)).size,catalog.length);
 const a=createDeck(crypto);const b=createDeck(crypto,new Set(a.map(x=>x.id)));
 assert.equal(a.length,44);assert.equal(b.length,44);assert.equal(new Set(b.map(x=>x.id)).size,44);
 assert.equal(a.filter(x=>x.group==='GK').length,5);
 assert.equal(a.filter(x=>x.role==='RB').length,3);
 assert.equal(a.filter(x=>x.role==='LB').length,3);
 assert.equal(a.filter(x=>x.role==='CB').length,7);
 assert.equal(new Set(a.map(x=>x.id)).size,44);
 assert.equal(b.filter(x=>a.some(y=>y.id===x.id)).length,0,'second deck avoids the first completely');
 console.log(`PASS: ${catalog.length} real names >=80; decks fresh, unique, with full position coverage`);
 const p=await api('/api/rooms',{name:'Vier Spieler',mode:'football',footballVariant:'startelf',budget:50,auctionType:'sealed',timeLimit:0});
 const q=await api(`/api/rooms/${p.code}/join`,{name:'Ein Spieler'});
 assert.equal((await act(p,'start')).http,200);
 let n=0,s,awards=0;
 while(n++<48){
  s=await until(p,x=>x.status==='bidding'||x.status==='autofill',3000);
  if(s.status==='autofill')break;
  if(s.players[0].items.length===4 && s.players[1].items.length===1)throw Error('Both should be out of budget; expected autofill');
  const ia=s.players[0],ib=s.players[1];
  if(ia.items.length<4&&s.footballCanBuy[ia.id]){
    const bid=[12,12,13,13][ia.items.length];
    if(!ia.hasBid)assert.equal((await act(p,'bid',{amount:bid})).http,200);
    if(!ib.hasBid)assert.equal((await act(q,'bid',{amount:0})).http,200);
  }else if(ia.items.length===4 && ib.items.length===0 && s.footballCanBuy[ib.id]){
    if(!ia.hasBid)assert.equal((await act(p,'bid',{amount:0})).http,200);
    if(!ib.hasBid)assert.equal((await act(q,'bid',{amount:50})).http,200);
  }else{
    if(!ia.hasBid)assert.equal((await act(p,'bid',{amount:0})).http,200);
    if(!ib.hasBid)assert.equal((await act(q,'bid',{amount:0})).http,200);
  }
  await until(p,x=>x.status==='autofill'||x.status==='voting'||x.round>s.round);
 }
 s=await until(p,x=>x.status==='autofill',3000);
 assert.equal(s.players[0].budget,0);assert.equal(s.players[1].budget,0);
 assert.equal(s.autoFillReason,'startelf');
 const entries=[];
 let previous='';
 while(s.status==='autofill'){
   const stamp=s.autoFillLast?.card?.id+'-'+s.autoFillLast?.playerId;
   if(s.autoFillLast && stamp!==previous){entries.push(s.autoFillLast);previous=stamp;assert.equal(s.autoFillLast.limit,11);}
   await sleep(13);s=await state(p);
 }
 assert.equal(s.status,'voting');
 assert.equal(entries.length,17,'first four players plus one player leaves 17 to fill');
 const all=s.players.flatMap(x=>x.items);
 assert.equal(all.length,22);
 assert.equal(new Set(all.map(x=>x.id)).size,22);
 assert.ok(all.every(x=>x.rating>=80));
 assert.deepEqual(s.players.map(x=>x.budget),[0,0]);
 for(const person of s.players){
  assert.equal(person.items.length,11);assert.equal(Object.keys(person.lineup).length,11);
  assert.ok(arrange(person.items,person.lineup));
  assert.equal(new Set(Object.values(person.lineup)).size,11);
 }
 assert.equal(entries.filter(x=>x.playerId===s.players[0].id).length,7);
 assert.equal(entries.filter(x=>x.playerId===s.players[1].id).length,10);
 assert.ok(entries.every(x=>x.missingAtStart===7||x.missingAtStart===10));
 await act(p,'vote',{winnerId:s.players[0].id});const final=await act(q,'vote',{winnerId:s.players[0].id});
 assert.equal(final.status,'complete');
 console.log('PASS: 4+1 purchased players => 11+11 valid free auto-filled positions, 17 distinct card reveals, votes work');
 // Start a rematch to test fresh selection after the room has seen a previous match.
 await act(p,'rematch');const reset=await state(p);
 assert.equal(reset.status,'waiting');assert.equal(reset.playerPoolSize,catalog.length);
 assert.equal(reset.budget,50);
 console.log('PASS: room reset preserves lobby and player pool');
}
(async()=>{try{for(let i=0;i<100;i++){try{if((await fetch(base+'/api/health')).ok)break;}catch{}await sleep(40);}await run();}catch(err){console.error('FAIL',err);process.exitCode=1;}finally{server.kill('SIGTERM');fs.rmSync(tmp,{recursive:true,force:true});}})();
