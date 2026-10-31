'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {CATALOGS,FOOD_DISHES,FOOD_CHOICES,chooseDish,createFoodDeck,catalogSummary}=require('../food');
const port=31189;
const base=`http://127.0.0.1:${port}`;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn(process.execPath,['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:String(port),BIDBATTLE_TEST_FAST:'1'},stdio:['ignore','pipe','pipe']});
server.stderr.on('data',d=>process.stderr.write(d));
async function api(url, data){const res=await fetch(base+url,{method:data?'POST':'GET',headers:{'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});return {http:res.status,...await res.json()};}
const baseSettings={name:'Host',mode:'food',budget:20,auctionType:'sealed',timeLimit:0};
async function main(){
  assert.deepEqual(FOOD_CHOICES,['random','burger','pizza','pasta','hotdog']);
  for(const [dish,items] of Object.entries(CATALOGS)){
    assert.ok(items.length>=45,`${dish} has too few items`);
    const ids=new Set(items.map(x=>x.id));assert.equal(ids.size,items.length);
    assert.ok(items.every(x=>x.id.startsWith(dish+'-')));
    for(let i=0;i<50;i++){
      const deck=createFoodDeck(dish);
      assert.equal(deck.length,12);
      assert.ok(deck.every(x=>ids.has(x.id)));
      assert.ok(new Set(deck.map(x=>x.type)).size>=4,`${dish} missing food groups`);
    }
  }
  assert.equal(CATALOGS.hotdog.some(x=>x.title.toLowerCase().includes('tomatensauce')),false);
  assert.equal(CATALOGS.pizza.some(x=>x.title==='Tomatensauce'),true);
  const dishes=await api('/api/food/catalog');
  assert.equal(dishes.http,200);
  assert.equal(dishes.dishes.length,4);
  for(const dish of Object.keys(FOOD_DISHES)){
    const listing=await api('/api/food/catalog?dish='+dish);
    assert.equal(listing.http,200);assert.equal(listing.count,CATALOGS[dish].length);
  }
  const invalid=await api('/api/food/catalog?dish=pancake');assert.equal(invalid.http,400);
  const invalidCreate=await api('/api/rooms',{...baseSettings,foodChoice:'sushi'});assert.equal(invalidCreate.http,400);
  for(const dish of ['burger','pizza','pasta','hotdog']){
    const room=await api('/api/rooms',{...baseSettings,foodChoice:dish});assert.equal(room.http,201,JSON.stringify(room));
    assert.equal(room.state.modeLabel,'Food Creator');
    assert.equal(room.state.foodChoice,dish);assert.equal(room.state.foodDish,dish);
    assert.equal(room.state.foodPoolSize,CATALOGS[dish].length);
    assert.equal(room.state.total,12);
    const guest=await api(`/api/rooms/${room.code}/join`,{name:'Gast'});assert.equal(guest.http,200);
    const started=await api(`/api/rooms/${room.code}/start`,{token:room.token});assert.equal(started.http,200);
    let state;
    for(let i=0;i<40;i++){
      state=await api(`/api/rooms/${room.code}?token=${room.token}`);
      if(state.status==='bidding')break;
      await sleep(20);
    }
    assert.equal(state.status,'bidding',JSON.stringify(state));
    assert.equal(state.foodDish,dish);
    assert.ok(CATALOGS[dish].some(x=>x.id===state.card.id),`Offered a non-${dish} item`);
    assert.equal((await api(`/api/rooms/${room.code}/bid`,{token:room.token,amount:2})).http,200);
    const end=await api(`/api/rooms/${room.code}/bid`,{token:guest.token,amount:0});assert.equal(end.http,200);
    assert.equal(end.players[0].items.length,1);
    assert.ok(CATALOGS[dish].some(x=>x.id===end.players[0].items[0].id));
  }
  // Change from a nonfood lobby to a manual food dish with both participants synchronized.
  const host=await api('/api/rooms',{name:'Host',mode:'hero',budget:20,auctionType:'open',timeLimit:0});
  assert.equal(host.http,201);
  const guest=await api(`/api/rooms/${host.code}/join`,{name:'Guest'});assert.equal(guest.http,200);
  const wrong=await api(`/api/rooms/${host.code}/settings`,{...baseSettings,foodChoice:'pasta',token:guest.token});assert.equal(wrong.http,403);
  const updated=await api(`/api/rooms/${host.code}/settings`,{...baseSettings,foodChoice:'pasta',token:host.token});
  assert.equal(updated.http,200);assert.equal(updated.foodDish,'pasta');assert.equal(updated.foodChoice,'pasta');
  const guestState=await api(`/api/rooms/${host.code}?token=${guest.token}`);
  assert.equal(guestState.foodDish,'pasta');assert.equal(guestState.foodPoolSize,CATALOGS.pasta.length);
  const random=await api(`/api/rooms/${host.code}/settings`,{...baseSettings,foodChoice:'random',token:host.token});
  assert.equal(random.http,200);assert.equal(random.foodChoice,'random');assert.ok(FOOD_DISHES[random.foodDish]);
  assert.equal(random.foodDish,(await api(`/api/rooms/${host.code}?token=${guest.token}`)).foodDish);
  const lockedDish=random.foodDish;
  const startRandom=await api(`/api/rooms/${host.code}/start`,{token:host.token});
  assert.equal(startRandom.http,200);assert.equal(startRandom.foodDish,lockedDish,'Random dish must not change unexpectedly after the host presses Start');
  const returnLobby=await api(`/api/rooms/${host.code}/lobby`,{token:host.token});assert.equal(returnLobby.status,'waiting');
  const seen=new Set([random.foodDish]);for(let i=0;i<14;i++){const s=await api(`/api/rooms/${host.code}/settings`,{...baseSettings,foodChoice:'random',token:host.token});seen.add(s.foodDish);}assert.ok(seen.size>=2,'Random should vary across games');
  // Older clients and saved lobbies are mapped back to burger safely.
  const old=await api('/api/rooms',baseSettings);assert.equal(old.http,201);assert.equal(old.state.foodDish,'burger');
  console.log('PASS Food Creator: 215 separate curated ingredients, 4 dish modes, automatic/manual selection, lobby updates and live auctions');
}
(async()=>{try{for(let i=0;i<100;i++){try{if((await fetch(base+'/api/health')).ok)break;}catch{}await sleep(35);}await main();}catch(e){console.error(e);process.exitCode=1;}finally{server.kill('SIGTERM');}})();
