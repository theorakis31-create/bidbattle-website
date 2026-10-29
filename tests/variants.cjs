'use strict';
const {spawn}=require('node:child_process');const path=require('node:path');const assert=require('node:assert/strict');
const PORT=31075;
const server=spawn(process.execPath,['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:String(PORT),BIDBATTLE_TEST_FAST:'1'},stdio:['ignore','pipe','pipe']});
server.stderr.on('data',s=>process.stderr.write(s));
const base=`http://127.0.0.1:${PORT}`;const sleep=t=>new Promise(r=>setTimeout(r,t));
async function api(route,data){const r=await fetch(base+route,{method:data?'POST':'GET',headers:{'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});return {http:r.status,...await r.json()};}
async function act(p,action,data={}){return api(`/api/rooms/${p.code}/${action}`,{token:p.token,...data});}
async function state(p){return api(`/api/rooms/${p.code}?token=${p.token}`)}
async function wait(p,fn){for(let i=0;i<240;i++){const s=await state(p);if(fn(s))return s;await sleep(12);}throw Error('Wait exceeded '+JSON.stringify(await state(p)))}
async function main(){
 for(const max of [3,4,5]){
  const a=await api('/api/rooms',{name:'Alex',mode:'football',footballVariant:'byp',playerLimit:max,budget:20,auctionType:'sealed',timeLimit:0});assert.equal(a.http,201,JSON.stringify(a));
  const b=await api(`/api/rooms/${a.code}/join`,{name:'Bea'});assert.equal(b.http,200);assert.equal((await act(a,'start')).http,200);let s=await state(a);
  assert.equal(s.modeLabel,'Bid Your Player');assert.equal(s.playerLimit,max);assert.equal(s.total,4*max);assert.equal(s.footballSlots,null);
  assert.equal(new Set(s.players.map(p=>p.id)).size,2);
  let last=0;
  for(let n=0;n<max*4+4;n++){
   s=await state(a);if(s.status==='voting')break;
   if(s.status==='reveal'||s.status==='autofill'){await sleep(16);continue;}
   assert.equal(s.status,'bidding');assert.equal(s.round>=last,true);last=s.round;
   const winnerIdx=n%2;const bidder=winnerIdx?b:a;const passer=winnerIdx?a:b;
   // Bid 1, pass 0, make sure only the winner receives a player.
   const w=s.players[winnerIdx], loser=s.players[1-winnerIdx];
   if(!w.hasBid){const r=await act(bidder,'bid',{amount:1});assert.equal(r.http,200,JSON.stringify(r));}
   if(!loser.hasBid){const r=await act(passer,'bid',{amount:0});assert.equal(r.http,200,JSON.stringify(r));}
   const res=await state(a);assert.equal(res.status,'reveal');
   assert.ok(res.players.every(p=>p.items.length<=max));
   if(n===0){assert.equal(res.players[winnerIdx].items.length,1);assert.equal(res.players[1-winnerIdx].items.length,0);assert.equal(res.players[winnerIdx].budget,19);}
   await wait(a,t=>t.status==='voting'||t.round>s.round);
  }
  s=await state(a);assert.equal(s.status,'voting');
  assert.ok(s.players.every(p=>p.items.length===max),JSON.stringify(s.players.map(p=>p.items.length)));
  assert.deepEqual(s.players.map(p=>p.budget),[20-max,20-(max-1)]);
  const illegal=await act(a,'lineup',{playerId:s.players[0].items[0].id,slot:'GK'});assert.equal(illegal.http,409);
  const right=await act(a,'vote',{winnerId:s.players[1].id});assert.equal(right.status,'voting');
  assert.equal(right.votesCast,1);assert.equal(right.players[0].hasVoted,true);
  const final=await act(b,'vote',{winnerId:s.players[1].id});assert.equal(final.status,'complete');assert.equal(final.winner,s.players[1].id);
  console.log(`PASS: Bid Your Player ${max} slots, ${max*4} offers, auto-filling, voting`);
 }
 const bad1=await api('/api/rooms',{name:'X',mode:'football',footballVariant:'byp',playerLimit:6,budget:20,auctionType:'open'});assert.equal(bad1.http,400);
 const bad2=await api('/api/rooms',{name:'X',mode:'football',footballVariant:'byp',playerLimit:4,budget:50,auctionType:'sealed'});assert.equal(bad2.http,201);
 const start=await api('/api/rooms',{name:'X',mode:'football',footballVariant:'startelf',budget:50,auctionType:'open'});assert.equal(start.http,201);assert.equal(start.state.total,44);assert.equal(start.state.playerLimit,11);
 console.log('PASS: validation & Startelf compatibility');
}
(async()=>{try{for(let n=0;n<80;n++){try{if((await fetch(base)).ok)break;}catch{}await sleep(50);}await main();}catch(e){console.error(e);process.exitCode=1;}finally{server.kill('SIGTERM');}})();
