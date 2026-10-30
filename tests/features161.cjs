'use strict';
const {spawn}=require('node:child_process');
const path=require('node:path');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const PORT=31361,base=`http://127.0.0.1:${PORT}`;
const child=spawn(process.execPath,['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:String(PORT),BIDBATTLE_TEST_FAST:'1'},stdio:['ignore','pipe','pipe']});
child.stderr.on('data',b=>process.stderr.write(b));
const sleep=n=>new Promise(r=>setTimeout(r,n));
async function api(route,data){const res=await fetch(base+route,{method:data?'POST':'GET',headers:{'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});return {http:res.status,...await res.json()};}
const act=(x,action,data={})=>api(`/api/rooms/${x.code}/${action}`,{token:x.token,...data});
const state=x=>api(`/api/rooms/${x.code}?token=${x.token}`);
async function until(x,pred){for(let i=0;i<250;i++){const s=await state(x);if(pred(s))return s;await sleep(12);}throw Error(`Timeout: ${JSON.stringify(await state(x)).slice(0,400)}`);}
async function create(){const a=await api('/api/rooms',{name:'Max Mustermann',mode:'food',budget:10,auctionType:'sealed',timeLimit:0});assert.equal(a.http,201);const b=await api(`/api/rooms/${a.code}/join`,{name:'Anna Testspielerin'});assert.equal(b.http,200);assert.equal((await act(a,'start')).status,'bidding');return {a,b};}
async function run(){
  let {a,b}=await create();let r=await state(a);
  // Empty the first budget while the second person keeps bidding power.
  assert.equal((await act(a,'bid',{amount:10})).status,'bidding');
  r=await act(b,'bid',{amount:0});assert.equal(r.status,'reveal');assert.deepEqual(r.players.map(x=>x.budget),[0,10]);
  r=await until(a,x=>x.round===1&&x.status==='bidding');
  assert.equal((await act(a,'bid',{amount:0})).status,'bidding');
  r=await act(b,'bid',{amount:10});assert.equal(r.status,'reveal');assert.deepEqual(r.players.map(x=>x.budget),[0,0]);
  r=await until(a,x=>x.status==='voting');assert.equal(r.round,2);assert.deepEqual(r.players.map(x=>x.budget),[0,0]);
  console.log('PASS: both budgets at 0 -> immediately voting after reveal');
  assert.equal((await act(a,'vote',{winnerId:r.players[0].id})).status,'voting');
  r=await act(b,'vote',{winnerId:r.players[0].id});assert.equal(r.status,'complete');
  r=await act(a,'playagain');assert.equal(r.status,'complete');assert.equal(r.rematchReady.length,1);
  assert.equal((await act(a,'playagain')).rematchReady.length,1,'double click does not count twice');
  r=await act(b,'playagain');assert.equal(r.status,'bidding');assert.equal(r.code,a.code);
  assert.equal(r.players.length,2);assert.deepEqual(r.players.map(x=>x.budget),[10,10]);
  console.log('PASS: direct rematch only after BOTH confirmations, same room code, same seats');
  r=await act(b,'lobby');assert.equal(r.status,'waiting');assert.equal(r.code,a.code);
  assert.equal(r.players.length,2);assert.match(r.lobbyNotice,/Anna Testspielerin/);
  assert.deepEqual(r.players.map(x=>x.budget),[10,10]);
  assert.equal((await act(a,'bid',{amount:1})).http,409);
  r=await act(a,'start');assert.equal(r.status,'bidding');
  r=await act(a,'lobby');assert.equal(r.status,'waiting');
  assert.equal((await state(b)).players.length,2);
  console.log('PASS: either player can end round for both; lobby, code & profiles persist; stale bids rejected');
  const file=fs.readFileSync(path.join(__dirname,'../public/app.js'),'utf8');
  const css=fs.readFileSync(path.join(__dirname,'../public/styles.css'),'utf8');
  const server=fs.readFileSync(path.join(__dirname,'../server.js'),'utf8');
  assert.match(file,/data-playagain/);assert.match(css,/grid-template-columns:minmax\(0,1fr\)!important/);
  assert.ok(!server.includes('gsrsearch'), 'unspecific Wikimedia image search must be disabled');
  console.log('PASS: mobile single-column summary and no fuzzy surname portrait lookup');
}
(async()=>{try{for(let i=0;i<50;i++){try{if((await fetch(base)).ok)break;}catch{}await sleep(50);}await run();}catch(e){console.error(e);process.exitCode=1;}finally{child.kill();}})();
