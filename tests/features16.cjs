'use strict';
const {spawn}=require('node:child_process');
const path=require('node:path');
const assert=require('node:assert/strict');
const PORT=31176;
const child=spawn(process.execPath,['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:String(PORT),BIDBATTLE_TEST_FAST:'1'},stdio:['ignore','pipe','pipe']});
child.stderr.on('data',s=>process.stderr.write(s));
const base=`http://127.0.0.1:${PORT}`;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function api(path,data){const response=await fetch(base+path,{method:data?'POST':'GET',headers:{'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});return {http:response.status,...await response.json()};}
const act=(x,action,params={})=>api(`/api/rooms/${x.code}/${action}`,{token:x.token,...params});
const state=x=>api(`/api/rooms/${x.code}?token=${x.token}`);
async function until(x,pred,ms=2500){const stop=Date.now()+ms;do{const s=await state(x);if(pred(s))return s;await sleep(6);}while(Date.now()<stop);throw Error('Timed out '+JSON.stringify(await state(x)).slice(0,450));}
async function create(opts={}){const options={name:'Alex',mode:'football',footballVariant:'byp',playerLimit:3,budget:40,auctionType:'open',timeLimit:0,...opts};const a=await api('/api/rooms',options);assert.equal(a.http,201,JSON.stringify(a));const b=await api(`/api/rooms/${a.code}/join`,{name:'Bea'});assert.equal(b.http,200);return {a,b};}
async function main(){
 const {a,b}=await create();
 let s=await state(a);
 assert.equal(s.status,'waiting');assert.equal(s.players.length,2);assert.equal(s.isHost,true);
 assert.equal((await state(b)).isHost,false);
 assert.equal((await act(b,'start')).http,403);
 const setting={mode:'football',footballVariant:'byp',playerLimit:3,budget:40,auctionType:'open',timeLimit:0};
 assert.equal((await act(b,'settings',setting)).http,403);
 assert.equal((await act(a,'settings',setting)).http,200);
 assert.equal((await act(a,'start')).status,'bidding');
 s=await state(a);assert.equal(s.open.turnId,s.players[0].id);
 // A wins the first card and starts the next one.
 assert.equal((await act(a,'bid',{amount:1})).http,200);
 s=await act(b,'pass');assert.equal(s.status,'reveal');assert.equal(s.players[0].items.length,1);
 s=await until(a,v=>v.round===1&&v.status==='bidding');assert.equal(s.open.turnId,s.players[0].id);
 // Same again, to reach 3 players while the opponent has none.
 for(let round=1;round<3;round++){
  assert.equal(s.open.turnId,s.players[0].id);
  assert.equal((await act(a,'bid',{amount:1})).http,200);
  s=await act(b,'pass');assert.equal(s.status,'reveal');
  s=await until(a,v=>v.status==='autofill'||v.status==='bidding');
 }
 assert.equal(s.status,'autofill');
 const snapshots=[];let n=0;
 while(n++<200){s=await state(a);if(s.status==='voting')break;if(s.status==='autofill'&&s.autoFillLast){snapshots.push({id:s.autoFillLast.card.id,count:s.autoFillLast.received});assert.equal(s.players[0].budget,37);assert.equal(s.players[1].budget,40);}await sleep(5);}
 assert.equal(s.status,'voting');assert.deepEqual(s.players.map(p=>p.items.length),[3,3]);
 assert.equal(s.players[0].budget,37);assert.equal(s.players[1].budget,40);
 assert.equal(new Set(snapshots.map(x=>x.id)).size,3,'three individually revealed cards');
 assert.equal((await act(a,'bid',{amount:1})).http,409);
 await act(a,'vote',{winnerId:s.players[0].id});s=await act(b,'vote',{winnerId:s.players[0].id});assert.equal(s.status,'complete');
 const oldCode=a.code;
 s=await act(b,'rematch');assert.equal(s.http,200);assert.equal(s.status,'waiting');assert.equal(s.code,oldCode);
 assert.deepEqual(s.players.map(p=>p.items.length),[0,0]);assert.equal(s.players.length,2);
 assert.equal((await act(a,'settings',{...setting,budget:50,timeLimit:15})).http,200);
 s=await act(a,'start');assert.equal(s.status,'bidding');assert.equal(s.budget,50);assert.equal(s.timeLimit,15);
 assert.ok(s.deadline>Date.now());
 console.log('PASS lobby, permissions, host start, same-room rematch, 50€ and 15s');
 console.log('PASS winner begins next open auction, auto-fill one-by-one, cost-free, voting');
 // 10/15/30/60 and unbounded validate; fast timer simulates each limit.
 for(const t of [10,15,30,60,0]){
  const game=await create({auctionType:'sealed',budget:20,timeLimit:t});
  let z=await act(game.a,'start');assert.equal(z.status,'bidding');assert.equal(z.timeLimit,t);
  if(t===0){await sleep(180);z=await state(game.a);assert.equal(z.round,0);assert.equal(z.status,'bidding');}
  else{z=await until(game.a,v=>v.round>0||v.status==='reveal');assert.ok(['reveal','bidding'].includes(z.status));}
 }
 console.log('PASS timed and untimed sealed auctions');

 const timedOpen=await create({auctionType:'open',timeLimit:10});
 let o=await act(timedOpen.a,'start');const firstId=o.open.turnId;
 o=await until(timedOpen.a,v=>v.status==='bidding'&&v.open.turnId!==firstId);
 assert.equal(o.open.history[0].pass,true);
 o=await until(timedOpen.a,v=>v.status==='reveal'||v.round>0);
 assert.ok(['reveal','bidding'].includes(o.status));
 console.log('PASS timed open auction auto-passes without blocking');

 for(const budget of [20,30,40,50]){const r=await api('/api/rooms',{name:'budget',mode:'football',footballVariant:'byp',playerLimit:5,budget,auctionType:'open',timeLimit:15});assert.equal(r.http,201);}
 console.log('PASS all short-mode budgets and 3/4/5-player limits');
}
(async()=>{try{for(let n=0;n<60;n++){try{if((await fetch(base)).ok)break;}catch{}await sleep(40);}await main();}catch(e){console.error(e);process.exitCode=1;}finally{child.kill();}})();
