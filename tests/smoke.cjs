'use strict';
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const path=require('node:path');
const {catalog,createDeck,arrange,canAcquire,SLOTS}=require('../football');
const crypto=require('node:crypto');
const PORT=Number(process.env.TEST_PORT || 30998);
const server=spawn(process.execPath,['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:String(PORT),BIDBATTLE_TEST_FAST:'1'},stdio:['ignore','pipe','pipe']});
server.stdout.on('data',s=>process.stdout.write(s));server.stderr.on('data',s=>process.stderr.write(s));
const base=`http://127.0.0.1:${PORT}`;
const delay=n=>new Promise(resolve=>setTimeout(resolve,n));
async function call(route,payload){const res=await fetch(base+route,{method:payload?'POST':'GET',headers:{'Content-Type':'application/json'},body:payload?JSON.stringify(payload):undefined});let data;try{data=await res.json()}catch{data={}};return {httpStatus:res.status,...data};}
async function create(mode='food',kind='sealed',budget=20){
 const a=await call('/api/rooms',{mode,auctionType:kind,budget,timeLimit:0,name:'Alex',avatar:'🦊',avatarColor:'mint'});
 assert.equal(a.httpStatus,201,JSON.stringify(a));
 const b=await call(`/api/rooms/${a.code}/join`,{name:'Bea',avatar:'🐼'});assert.equal(b.httpStatus,200);
 const started=await call(`/api/rooms/${a.code}/start`,{token:a.token});assert.equal(started.httpStatus,200,JSON.stringify(started));
 return {a,b};
}
const act=(p,operation,fields={})=>call(`/api/rooms/${p.code}/${operation}`,{token:p.token,...fields});
const state=p=>call(`/api/rooms/${p.code}?token=${p.token}`);
async function waitFor(p,predicate,ms=2500){const start=Date.now();while(Date.now()-start<ms){let s=await state(p);if(predicate(s))return s;await delay(12);}throw Error('Timeout waiting for match transition. '+JSON.stringify(await state(p)));}
async function main(){
 const page=await fetch(base);assert.equal(page.status,200);const html=await page.text();assert.match(html,/footballModeHint/);
 const app=await(await fetch(base+'/app.js')).text();assert.match(app,/squad-editor|squadEditor/);
 assert.equal((await call('/api/rooms',{name:'Test',mode:'football',auctionType:'sealed',budget:20})).httpStatus,400);
 assert.equal((await call('/api/rooms',{name:'Test',mode:'football',auctionType:'sealed',budget:50})).httpStatus,201);
 assert.ok(catalog.length>=220);
 assert.ok(catalog.every(p=>p.rating>=80));
 assert.equal(new Set(catalog.map(p=>p.title)).size,catalog.length);
 let eliteCardsSeen=0;
 for(let k=0;k<50;k++){
   const deck=createDeck(crypto);assert.equal(deck.length,44);
   assert.equal(deck.filter(x=>x.group==='GK').length,5);
   assert.equal(deck.filter(x=>x.role==='RB').length,3);
   assert.equal(deck.filter(x=>x.role==='LB').length,3);
   assert.ok(deck.some(x=>x.rating<=83));
   eliteCardsSeen+=deck.filter(x=>x.rating>=88).length;
 }
 assert.ok(eliteCardsSeen>0,'Across many randomized decks elite players should be available');
 const cb=catalog.find(x=>x.role==='CB');const keeper=catalog.find(x=>x.role==='GK');
 assert.ok(cb.eligible.includes('CM2'));assert.ok(!cb.eligible.includes('ST'));assert.deepEqual(keeper.eligible,['GK']);
 assert.equal(arrange([keeper,cb],{GK:keeper.id,CM1:cb.id}).CM1,cb.id);
 assert.equal(arrange([keeper,catalog.find(x=>x.role==='GK'&&x.id!==keeper.id)]),null);
 console.log('PASS: football pool, ratings, legal formations and budget restrictions');

 let x=await create('food','sealed',20);
 await act(x.a,'bid',{amount:5});let r=await act(x.b,'bid',{amount:5});assert.equal(r.status,'tiebreak');
 await act(x.a,'bid',{amount:3});r=await act(x.b,'bid',{amount:3});assert.equal(r.lastResult.reason,'double-tie');
 assert.equal(r.players[0].items.length,0);assert.equal(r.players[1].budget,20);
 await waitFor(x.a,s=>s.round===1);
 console.log('PASS: food sealed tie and no arbitrary winner');

 x=await create('football','sealed',50);
 r=await state(x.a);assert.equal(r.total,44);assert.ok(r.card.rating>=79);assert.equal(r.budget,50);
 assert.equal(r.footballSlots.length,11);assert.ok(!('footballAlternates' in r));
 // For the first offered item, two passes must never award anyone a footballer.
 await act(x.a,'bid',{amount:0});r=await act(x.b,'bid',{amount:0});assert.equal(r.status,'reveal');
 assert.equal(r.players[0].items.length,0);assert.equal(r.players[1].items.length,0);
 await waitFor(x.a,s=>s.round>0 && s.status==='bidding');
 // Win an actual CB and demonstrate CB -> central midfield, never striker or keeper.
 let testedPosition=false;
 let rounds=0;
 while(rounds<44){
   r=await state(x.a);
   if(r.status==='voting')break;
   if(r.status!=='bidding'){await delay(12);continue;}
   rounds++;
   const card=r.card;
   if(card.role==='CB'&&!testedPosition){
     await act(x.a,'bid',{amount:1});r=await act(x.b,'bid',{amount:0});
     assert.equal(r.players[0].items.at(-1).id,card.id);
     assert.equal(r.players[1].items.length,0);
     const invalid=await act(x.a,'lineup',{playerId:card.id,slot:'ST'});assert.equal(invalid.httpStatus,400);
     const changed=await act(x.a,'lineup',{playerId:card.id,slot:'CM2'});assert.equal(changed.httpStatus,200);
     assert.equal(changed.players[0].lineup.CM2,card.id);
     testedPosition=true;
     break;
   }
   const [p,q]=r.players;
   if(!p.hasBid)await act(x.a,'bid',{amount:0});
   if(!q.hasBid)await act(x.b,'bid',{amount:0});
   await waitFor(x.a,s=>s.round>r.round||s.status==='voting');
 }
 assert.ok(testedPosition,'At least one CB must appear within the 44 offers');
 const photo=await call('/api/photos/f999');assert.equal(photo.httpStatus,404);
 console.log('PASS: no consolation player, flexible position change, goalkeeper restriction, photo endpoint');

 // New match: deliberately build complete teams with 1+4+3+3 4-3-3 squads.
 x=await create('football','sealed',50);
 const needs={GK:1,RB:1,LB:1,CB:2,MID:3,ATT:3};
 let counts=[Object.fromEntries(Object.keys(needs).map(k=>[k,0])),Object.fromEntries(Object.keys(needs).map(k=>[k,0]))];
 const roleOf=card=>card.group==='MID'?'MID':card.group==='ATT'?'ATT':card.role;
 let made=0;
 while(made++<65){
   r=await state(x.a);if(r.status==='voting')break;
   if(r.status!=='bidding'){await delay(10);continue;}
   const category=roleOf(r.card);
   let target=[0,1].find(i=>counts[i][category]<needs[category] && r.footballCanBuy[r.players[i].id]);
   if(target===undefined){
     for(const [i,p] of r.players.entries())if(!p.hasBid)await act(i===0?x.a:x.b,'bid',{amount:0});
   }else{
     const p=target===0?x.a:x.b, q=target===0?x.b:x.a;
     await act(p,'bid',{amount:1});
     if(!r.players[1-target].hasBid)await act(q,'bid',{amount:0});
     counts[target][category]++;
   }
   const prev=r.round;
   await waitFor(x.a,s=>s.status==='voting'||s.round>prev);
 }
 r=await state(x.a);assert.equal(r.status,'voting');
 for(const p of r.players){assert.equal(p.items.length,11);assert.equal(new Set(p.items.map(q=>q.id)).size,11);assert.equal(Object.keys(p.lineup).length,11);assert.ok(p.stats.average>0);}
 assert.equal((await act(x.a,'lineup',{playerId:r.players[0].items.find(x=>x.role!=='GK').id,slot:'GK'})).httpStatus,400);
 await act(x.a,'vote',{winnerId:r.players[0].id});r=await act(x.b,'vote',{winnerId:r.players[0].id});assert.equal(r.status,'complete');
 console.log('PASS: 11 independently won footballers per team, 4-3-3, voting');

 x=await create('hero','open',20);
 r=await act(x.a,'bid',{amount:3});assert.equal(r.open.currentBid,3);
 r=await act(x.b,'bid',{amount:6});r=await act(x.a,'pass');assert.equal(r.players[1].budget,14);
 await waitFor(x.a,s=>s.round===1);
 console.log('PASS: open bid flow retained');
 console.log('ALL TESTS PASSED');
}
(async()=>{try{for(let i=0;i<80;i++){try{if((await fetch(base)).ok)break;}catch{}await delay(50);}await main();}catch(err){console.error('FAIL',err);process.exitCode=1;}finally{server.kill('SIGTERM');}})();
