'use strict';
const {spawn}=require('node:child_process');
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
const assert=require('node:assert/strict');
const PORT=31517, base=`http://127.0.0.1:${PORT}`;
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'bidbattle17-'));
let proc;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const env={...process.env,PORT:String(PORT),BIDBATTLE_TEST_FAST:'1',BIDBATTLE_TEST_COUNTDOWN:'1',BIDBATTLE_DATA_FILE:path.join(tmp,'data.json')};
async function start(){proc=spawn(process.execPath,['server.js'],{cwd:path.join(__dirname,'..'),env,stdio:['ignore','pipe','pipe']});proc.stderr.on('data',x=>process.stderr.write(x));for(let i=0;i<100;i++){try{if((await fetch(base+'/api/health')).ok)return;}catch{}await sleep(40);}throw Error('server not started');}
async function stop(){if(proc?.exitCode===null){proc.kill('SIGTERM');await new Promise(r=>proc.once('exit',r));}proc=null;}
async function api(route,data,token){const r=await fetch(base+route,{method:data?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:data?JSON.stringify(data):undefined});return {http:r.status,...await r.json()};}
const act=(x,name,data={})=>api(`/api/rooms/${x.code}/${name}`,{token:x.token,...data});
const state=x=>api(`/api/rooms/${x.code}?token=${x.token}`);
async function until(x,fn){for(let i=0;i<100;i++){let r=await state(x);if(fn(r))return r;await sleep(18);}throw Error('state timeout');}
async function run(){
 const r=await api('/api/auth/register',{email:'TEST@example.org',name:'Football Friend',password:'Secret-Password-123',avatar:'🦊',avatarColor:'peach'});
 assert.equal(r.http,201);assert(!JSON.stringify(r).includes('passwordHash'));assert.equal(r.user.email,'test@example.org');
 assert.equal((await api('/api/auth/register',{email:'test@example.org',name:'X',password:'Something-1234'})).http,409);
 assert.equal((await api('/api/auth/login',{email:'test@example.org',password:'incorrect'})).http,401);
 const login=await api('/api/auth/login',{email:'test@example.org',password:'Secret-Password-123'});assert.equal(login.http,200);
 assert.equal((await api('/api/auth/me',null,login.token)).user.name,'Football Friend');
 const newProfile=await api('/api/auth/profile',{name:'Bid Champion',avatar:'🐼',avatarColor:'mint'},login.token);assert.equal(newProfile.user.name,'Bid Champion');
 const a=await api('/api/rooms',{name:'Forged Name',mode:'food',budget:10,auctionType:'sealed',timeLimit:0},login.token);
 assert.equal(a.http,201);assert.equal(a.state.players[0].name,'Bid Champion');
 const b=await api(`/api/rooms/${a.code}/join`,{name:'Gast Berni',avatar:'🐱'});assert.equal(b.http,200);
 assert.equal((await act(a,'start')).status,'countdown');
 assert.equal((await act(a,'bid',{amount:3})).http,409,'No bids during countdown');
 let st=await until(a,x=>x.status==='bidding');
 assert.equal(st.players.length,2);
 // Persist midway and restart the same server (same local on-disk snapshot).
 assert(fs.existsSync(env.BIDBATTLE_DATA_FILE),'room and account data should persist to disk');
 await stop();await start();
 st=await state(a);assert.equal(st.code,a.code);assert.equal(st.status,'bidding');
 assert.equal((await api('/api/auth/me',null,login.token)).user.name,'Bid Champion');
 let first=await act(a,'bid',{amount:10});assert.equal(first.status,'bidding');
 await act(b,'bid',{amount:0});await until(a,x=>x.status==='bidding'&&x.round===1);
 await act(a,'bid',{amount:0});await act(b,'bid',{amount:10});st=await until(a,x=>x.status==='voting');
 await act(a,'vote',{winnerId:'tie'});st=await act(b,'vote',{winnerId:'tie'});assert.equal(st.status,'complete');assert.equal(st.winner,null);assert.equal(st.tieBreakReason,'mutual-tie');
 console.log('PASS: registration/login/profile, authentication, saved room restoration, countdown and mutual draw');
 const again=await act(a,'playagain');assert.equal(again.rematchReady.length,1);
 st=await act(b,'playagain');assert.equal(st.status,'countdown');
 st=await act(b,'leave');assert.equal(st.left,true);
 st=await state(a);assert.equal(st.players.length,1);assert.equal(st.status,'waiting');assert.match(st.lobbyNotice,/Gast Berni/);
 const c=await api(`/api/rooms/${a.code}/join`,{name:'Neuer Gast'});assert.equal(c.http,200);
 assert.equal((await act(c,'start')).http,403);
 st=await act(a,'leave');assert.equal(st.left,true);
 st=await state(c);assert.equal(st.isHost,true);assert.match(st.lobbyNotice,/Bid Champion/);
 assert.equal((await act(c,'leave')).left,true);
 assert.equal((await state(c)).http,404);
 console.log('PASS: rematch, leave warning, room preservation, rejoin and host transfer');
 // Simulate two real SSE-connected browsers; disconnect one mid-auction.
 const p=await api('/api/rooms',{name:'Offline Host',mode:'food',budget:20,auctionType:'open',timeLimit:0});
 const q=await api(`/api/rooms/${p.code}/join`,{name:'Offline Guest'});
 const openEvents=(who,controller)=>fetch(base+`/api/rooms/${who.code}/events?token=${who.token}`,{signal:controller.signal});
 const ac=new AbortController(),bc=new AbortController();
 const streamA=await openEvents(p,ac),streamB=await openEvents(q,bc);
 assert.equal(streamA.status,200);assert.equal(streamB.status,200);
 await act(p,'start');await until(p,x=>x.status==='bidding');
 await until(p,x=>x.players.every(y=>y.online));
 bc.abort();
 let paused=await until(p,x=>x.paused===true);
 assert.equal((await act(p,'bid',{amount:2})).http,409);
 const newBc=new AbortController();const streamB2=await openEvents(q,newBc);assert.equal(streamB2.status,200);
 paused=await until(p,x=>x.paused===false);
 assert.equal((await act(p,'bid',{amount:2})).http,200);
 ac.abort();newBc.abort();
 console.log('PASS: live SSE presence, pause on disconnect, resume on reconnect, stale bids denied during pause');
 // Rating tiebreak must resolve contradictory football votes without treating a
 // lower-rated selection as an automatic winner, while unanimous draw stays a draw.
 const f=await api('/api/rooms',{name:'Rating Host',mode:'football',footballVariant:'byp',playerLimit:3,budget:20,auctionType:'sealed',timeLimit:0});
 const g=await api(`/api/rooms/${f.code}/join`,{name:'Rating Guest'});
 await act(f,'start');await until(f,x=>x.status==='bidding');
 let rr=await act(f,'bid',{amount:1});rr=await act(g,'bid',{amount:0});
 rr=await until(f,x=>x.round===1&&x.status==='bidding');
 while(rr.status!=='voting'){
   if(rr.status==='bidding'){
     await act(f,'bid',{amount:0});rr=await act(g,'bid',{amount:0});
   }
   rr=await until(f,x=>x.status==='voting'||(x.status==='bidding'&&x.round>=rr.round+1));
 }
 const people=rr.players;assert.equal(people[0].items.length,1);assert.equal(people[1].items.length,0);
 await act(f,'vote',{winnerId:people[1].id});rr=await act(g,'vote',{winnerId:people[0].id});
 assert.equal(rr.status,'complete');assert.equal(rr.winner,people[0].id);assert.equal(rr.tieBreakReason,'rating');
 console.log('PASS: football split vote -> team-average rating tiebreak');
 assert.equal((await api('/api/auth/logout',{},login.token)).ok,true);
 assert.equal((await api('/api/auth/me',null,login.token)).http,401);
 const relog=await api('/api/auth/login',{email:'test@example.org',password:'Secret-Password-123'});
 assert.equal((await api('/api/auth/delete',{password:'Secret-Password-123'},relog.token)).ok,true);
 assert.equal((await api('/api/auth/me',null,relog.token)).http,401);
 console.log('PASS: account logout and permanent account deletion');
}
(async()=>{try{await start();await run();}catch(e){console.error(e);process.exitCode=1;}finally{await stop();fs.rmSync(tmp,{recursive:true,force:true});}})();
