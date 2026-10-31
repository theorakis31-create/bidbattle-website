'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {CATALOGS,createFoodDeck,FOOD_STEPS,FOOD_FOUNDATION_TYPES}=require('../food');
const PORT=31228,base=`http://127.0.0.1:${PORT}`,sleep=t=>new Promise(r=>setTimeout(r,t));
const server=spawn(process.execPath,['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:String(PORT),BIDBATTLE_TEST_FAST:'1'},stdio:['ignore','pipe','pipe']});
server.stderr.on('data',d=>process.stderr.write(d));
async function api(url,data){const r=await fetch(base+url,{method:data?'POST':'GET',headers:{'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});return {http:r.status,...await r.json()};}
async function action(player,name,extra={}){return api(`/api/rooms/${player.code}/${name}`,{token:player.token,...extra});}
async function get(player){return api(`/api/rooms/${player.code}?token=${player.token}`);}
async function until(player,test){for(let i=0;i<200;i++){const s=await get(player);if(test(s))return s;await sleep(12);}throw Error('wait timeout: '+JSON.stringify(await get(player)));}
async function match(dish,type,scenario){
 const host=await api('/api/rooms',{name:'Host',mode:'food',foodChoice:dish,budget:20,auctionType:type,timeLimit:0});assert.equal(host.http,201);
 const guest=await api(`/api/rooms/${host.code}/join`,{name:'Gast'});assert.equal(guest.http,200);
 assert.equal((await action(host,'start')).http,200);
 let s=await until(host,x=>x.status==='bidding');assert.equal(s.foodFoundationPhase,true);assert.equal(s.card.type,FOOD_FOUNDATION_TYPES[dish]);assert.equal(s.foodCanBid,true);
 if(type==='sealed'){
   if(scenario==='no-bids'){
     assert.equal((await action(host,'bid',{amount:0})).http,200);
     s=await action(guest,'bid',{amount:0});
     assert.equal(s.lastResult.reason,'food-foundation-free');
   }else{
     assert.equal((await action(host,'bid',{amount:2})).http,200);
     s=await action(guest,'bid',{amount:0});
     assert.equal(s.lastResult.winningBid,2);
   }
 }else{
   if(scenario==='no-bids'){
     assert.equal((await action(host,'pass')).http,200);
     s=await action(guest,'pass');
     assert.equal(s.lastResult.reason,'food-foundation-free');
   }else{
     s=await action(host,'bid',{amount:2});
     assert.equal(s.http,200);
     if(s.status==='bidding')s=await action(guest,'pass');
   }
 }
 assert.equal(s.status,'reveal');assert.equal(s.players[0].items.length,1);assert.equal(s.players[1].items.length,0);
 const firstId=s.players[0].id,firstBudget=s.players[0].budget;
 s=await until(host,x=>x.round===1&&x.status==='bidding');
 assert.equal(s.foodFoundationPhase,true);assert.equal(s.card.type,FOOD_FOUNDATION_TYPES[dish]);assert.equal(s.foodCanBid,false);
 assert.equal((await get(guest)).foodCanBid,true);
 assert.equal((await action(host,'bid',{amount:1})).http,409,'Winner must not buy second foundation');
 if(type==='sealed'){
   assert.equal(s.players[0].hasBid,true,'Already-equipped player auto-passes');
   s=await action(guest,'bid',{amount:0});
 }else{
   assert.equal(s.open.turnId,s.players[1].id);
   s=await action(guest,'pass');
 }
 assert.equal(s.http,200);assert.equal(s.status,'reveal');assert.equal(s.lastResult.reason,'food-foundation-free');assert.equal(s.players[0].budget,firstBudget);assert.ok(s.players.every(p=>p.items.length===1));
 assert.ok(s.players.every(p=>p.items[0].type===FOOD_FOUNDATION_TYPES[dish]));
 s=await until(host,x=>x.round===2&&x.status==='bidding');
 assert.equal(s.foodFoundationPhase,false);assert.equal(s.players.filter(p=>p.id===firstId)[0].items.length,1);
 assert.equal(s.card.type,FOOD_STEPS[dish][1][0],'Second phase must be the appropriate next ingredient category');
 assert.equal(s.foodCanBid,true);
 console.log(`PASS food ${dish} ${type} ${scenario}: both start with guaranteed foundations, next step ${s.card.type}`);
}
async function main(){
 for(const [dish,plan] of Object.entries(FOOD_STEPS)){
  assert.equal(plan.reduce((n,p)=>n+p[1],0),12);
  for(let i=0;i<30;i++){
   const deck=createFoodDeck(dish);
   assert.equal(deck.length,12);assert.equal(new Set(deck.map(x=>x.id)).size,12);
   assert.deepEqual(deck.map(x=>x.type),plan.flatMap(([type,n])=>Array(n).fill(type)));
   assert.ok(deck.every(x=>CATALOGS[dish].includes(x)));
  }
 }
 await match('pizza','sealed','normal');
 await match('pasta','sealed','no-bids');
 await match('burger','open','normal');
 await match('hotdog','open','no-bids');
 const html=await(await fetch(base+'/')).text();
 assert.match(html,/bb-mode-emoji">🍽️/);assert.match(html,/value="food">🍽️ Food Creator/);
 const script=await(await fetch(base+'/app.js')).text();assert.match(script,/food:'🍽️'/);
 console.log('PASS Food Creator chronological ingredient ordering and front menu symbol');
}
(async()=>{try{for(let i=0;i<90;i++){try{if((await fetch(base+'/api/health')).ok)break;}catch{}await sleep(35);}await main();}catch(e){console.error(e);process.exitCode=1;}finally{server.kill('SIGTERM');}})();
