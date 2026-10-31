'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {SLOTS,catalog,byId,createDeck,arrange,canAcquire,ratingStats} = require('./football');
const storage = require('./storage');
const users = new Map();
const limiter = new Map();

const PORT = Number(process.env.PORT || 3000);
const PUBLIC = path.join(__dirname, 'public');
const rooms = new Map();
const ROOM_TTL = 24 * 60 * 60 * 1000;
const TEST_FAST = process.env.BIDBATTLE_TEST_FAST === '1';
const ACCOUNTS_ENABLED=storage.remote || process.env.BIDBATTLE_PERSISTENT_DISK==='1' || !(process.env.RENDER || process.env.RENDER_SERVICE_ID);
const AUTO_NEXT_MS = TEST_FAST ? 35 : 1700;
const AUTO_FILL_MS = TEST_FAST ? 40 : 1550;
const START_COUNTDOWN_MS=TEST_FAST?55:3800;
const AVATARS = ['nova','luna','kai','roxy','ace','milo','juno','zara','rex','ember','shadow','pixel','🙂','😎','🤩','🐼','🦊','🐯','🐱','🐸','🦄','🤖','👽','🐧'];
const AVATAR_COLORS = ['lilac','blue','peach','mint','pink','yellow'];
function safeAvatar(v) {return AVATARS.includes(v) ? v : '🙂';}
function safeColor(v) {return AVATAR_COLORS.includes(v) ? v : 'lilac';}
const LABELS = {food: 'Food Battle', football: 'Football Draft', hero: 'Superhero Showdown', random: 'Random Battle'};
const FOOTBALL_VARIANTS = {startelf: 'Startelf', byp: 'Bid Your Player'};
function footballLimit(room) {return room.footballVariant==='byp'?room.playerLimit:11;}
const TIME_LIMITS=[0,10,15,30,60];
function parseSettings(b){
 const mode=b.mode, variant=mode==='football'?(b.footballVariant||'startelf'):null;
 if(!Object.hasOwn(LABELS,mode))throw Error('Unbekannter Spielmodus.');
 if(mode==='football'&&!Object.hasOwn(FOOTBALL_VARIANTS,variant))throw Error('Unbekannte Fußball-Variante.');
 const playerLimit=variant==='byp'?Number(b.playerLimit):11;
 if(variant==='byp'&&![3,4,5].includes(playerLimit))throw Error('Bitte wähle drei bis fünf Spieler.');
 const budget=Number(b.budget);
 if(mode==='football'?(variant==='byp'?![20,30,40,50].includes(budget):![50,75,100].includes(budget)):![10,20,30,50].includes(budget))throw Error('Ungültiges Startbudget.');
 if(!['sealed','open'].includes(b.auctionType))throw Error('Ungültige Auktionsart.');
 const timeLimit=b.timeLimit===undefined?15:Number(b.timeLimit);
 if(!TIME_LIMITS.includes(timeLimit))throw Error('Ungültiges Zeitlimit.');
 return {mode,footballVariant:variant,playerLimit,startBudget:budget,auctionType:b.auctionType,timeLimit};
}
function newDeck(room){
 if(room.mode!=='football')return shuffle(CATALOG[room.mode]).slice(0,12);
 const recent=new Set((room.deckHistory||[]).flat());
 if(room.footballVariant==='startelf')return createDeck(crypto,recent);
 const fresh=shuffle(catalog.filter(p=>!recent.has(p.id)));
 const older=shuffle(catalog.filter(p=>recent.has(p.id)));
 return [...fresh,...older].slice(0,room.playerLimit*4);
}
function cancelTimer(room){if(room.timer)clearTimeout(room.timer);room.timer=null;room.deadline=null;room.timerSeq=(room.timerSeq||0)+1;}
function resetMatch(room){cancelTimer(room);if(room.countdownTimer)clearTimeout(room.countdownTimer);room.countdownTimer=null;if(room.resultTimer)clearTimeout(room.resultTimer);room.resultTimer=null;if(room.disconnectTimer)clearTimeout(room.disconnectTimer);room.disconnectTimer=null;room.paused=false;room.wasLive=false;room.pauseRemaining=null;room.countdownEnds=null;
 if(room.mode==='football' && room.cards?.length && room.round>0){
   room.deckHistory=[...(room.deckHistory||[]).slice(-1),room.cards.map(c=>c.id)];
 }
 room.players.forEach(p=>{p.budget=room.startBudget;p.items=[];p.lineup={};});room.cards=newDeck(room);
 room.round=0;room.status='waiting';room.bids=new Map();room.votes=new Map();room.lastResult=null;room.tieInfo=null;room.open=null;room.winner=null;room.lastAuctionWinnerId=null;room.autoFillLast=null;room.autoFillQueue=[];room.autoFillReason=null;room.ready=new Set();room.notice=null;room.tieBreakReason=null;
}

function canWinCard(room, player, card) {return room.mode!=='football'||(room.footballVariant==='byp' ? player.items.length<room.playerLimit && player.budget>=1 : canAcquire(player,card));}
function item(title, emoji, type, detail) { return {title, emoji, type, detail}; }
const CATALOG = {
  food: [
    item('Brioche-Brötchen','🍞','Brot','Goldbraun und fluffig'),
    item('Smash-Patty','🥩','Patty','Saftig und knusprig gebraten'),
    item('Cheddar','🧀','Käse','Extra cremig'),
    item('Karamellisierte Zwiebeln','🧅','Topping','Süß und würzig'),
    item('Frischer Salat','🥬','Gemüse','Knackiger Crunch'),
    item('Geheime Burgersoße','🥫','Soße','Der Geschmackskick'),
    item('Wagyu-Patty','🍔','Premium','Luxuriöses Upgrade'),
    item('Knuspriger Bacon','🥓','Topping','Rauchige Note'),
    item('Tomatenscheiben','🍅','Gemüse','Frisch und saftig'),
    item('Jalapeños','🌶️','Extra','Feurig scharf'),
    item('Trüffel-Mayo','🍄','Soße','Fein und aromatisch'),
    item('Sesam-Brötchen','🥯','Brot','Der Klassiker')
  ],
  football: [
    item('Lionel Messi','🇦🇷','Angriff','Argentinien · Kreativität & Abschluss'),
    item('Cristiano Ronaldo','🇵🇹','Angriff','Portugal · Torjäger'),
    item('Kylian Mbappé','🇫🇷','Angriff','Frankreich · Schnelligkeit'),
    item('Erling Haaland','🇳🇴','Angriff','Norwegen · Torinstinkt'),
    item('Mohamed Salah','🇪🇬','Angriff','Ägypten · Dribbling & Tore'),
    item('Vinícius Júnior','🇧🇷','Angriff','Brasilien · Tempo & Technik'),
    item('Harry Kane','🇬🇧','Angriff','England · Abschluss & Spielübersicht'),
    item('Lamine Yamal','🇪🇸','Angriff','Spanien · Kreativität'),
    item('Jude Bellingham','🇬🇧','Mittelfeld','England · Dynamik'),
    item('Kevin De Bruyne','🇧🇪','Mittelfeld','Belgien · Pässe & Spielgestaltung'),
    item('Rodri','🇪🇸','Mittelfeld','Spanien · Spielkontrolle'),
    item('Pedri','🇪🇸','Mittelfeld','Spanien · Technik & Übersicht'),
    item('Federico Valverde','🇺🇾','Mittelfeld','Uruguay · Ausdauer & Tempo'),
    item('Virgil van Dijk','🇳🇱','Abwehr','Niederlande · Zweikämpfe'),
    item('Antonio Rüdiger','🇩🇪','Abwehr','Deutschland · Verteidigung'),
    item('Achraf Hakimi','🇲🇦','Abwehr','Marokko · Offensive Läufe'),
    item('William Saliba','🇫🇷','Abwehr','Frankreich · Stellungsspiel'),
    item('Trent Alexander-Arnold','🇬🇧','Abwehr','England · Flanken & Pässe'),
    item('Alisson Becker','🇧🇷','Torwart','Brasilien · Reflexe'),
    item('Thibaut Courtois','🇧🇪','Torwart','Belgien · Paraden'),
    item('Manuel Neuer','🇩🇪','Torwart','Deutschland · Torwartspiel')
  ],
  hero: [
    item('Superstärke','💪','Kraft','Hebt ganze Gebäude'),
    item('Flugfähigkeit','🪽','Bewegung','Frei durch die Lüfte'),
    item('Unsichtbarkeit','👻','Taktik','Verschwindet spurlos'),
    item('Blitzgeschwindigkeit','⚡','Tempo','Schneller als der Schall'),
    item('Feuerkontrolle','🔥','Element','Beherrscht die Flammen'),
    item('Eisschild','🧊','Verteidigung','Unzerbrechlicher Schutz'),
    item('Telekinese','🧠','Geist','Bewegt alles mit Gedanken'),
    item('Heilkräfte','💚','Support','Regeneriert blitzschnell'),
    item('Zeitlupe','⏳','Taktik','Verlangsamt die Umgebung'),
    item('Supergehör','👂','Sinne','Hört jede Bewegung'),
    item('Magieportal','🌀','Bewegung','Teleportiert durch Räume'),
    item('Energieblitz','✨','Angriff','Explosive Superattacke')
  ],
  random: [
    item('Legendäres Sandwich','🥪','Food','Ein Snack der Extraklasse'),
    item('Goldener Fußball','⚽','Sport','Das entscheidende Tor'),
    item('Teleportation','🌀','Superkraft','Plötzlich überall'),
    item('Riesiger Roboter','🤖','Technik','Unglaublich stark'),
    item('Drachen-Ei','🥚','Fantasy','Ein seltener Fund'),
    item('Zaubertrank','🧪','Fantasy','Überraschende Wirkung'),
    item('Mega-Pizza','🍕','Food','Mit allem drauf'),
    item('Turbo-Sneaker','👟','Sport','Schnell wie der Wind'),
    item('Wetterkontrolle','🌈','Superkraft','Sonne oder Sturm'),
    item('Goldener Schlüssel','🗝️','Mystery','Öffnet jede Tür'),
    item('Unsichtbarer Umhang','🧥','Fantasy','Bleib unerkannt'),
    item('Geheimer Joker','🃏','Mystery','Alles ist möglich')
  ]
};

function shuffle(a) { const out = [...a]; for(let i=out.length-1;i>0;i--){const j=crypto.randomInt(i+1);[out[i],out[j]]=[out[j],out[i]];} return out; }
function code() { let value; do {value = Array.from({length: 6}, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[crypto.randomInt(32)]).join('');} while (rooms.has(value)); return value; }
function safeName(input) {return typeof input === 'string' ? input.trim().replace(/\s+/g,' ').slice(0,24) : '';}
function publicState(room, token) {
  const own = room.players.find(p => p.token === token);
  if (!own) return null;
  return {
    code:room.code, mode:room.mode, modeLabel:room.mode==='football'?FOOTBALL_VARIANTS[room.footballVariant]:LABELS[room.mode], status:room.status, paused:!!room.paused, countdownEnds:room.countdownEnds||null, tieBreakReason:room.tieBreakReason||null, storageKind:storage.status().kind,
    footballVariant:room.mode==='football'?room.footballVariant:null, playerLimit:room.mode==='football'?footballLimit(room):null,
    budget:room.startBudget, auctionType:room.auctionType, timeLimit:room.timeLimit, deadline:room.deadline, hostId:room.hostId, isHost:own.id===room.hostId, round:room.round, total:room.cards.length, autoFillLast:room.status==='autofill'?room.autoFillLast:null, autoFillReason:room.status==='autofill'?(room.autoFillReason||'byp'):null, autoFillRemaining:room.status==='autofill'?(room.autoFillQueue?.length||0):0,
    open:room.auctionType === 'open' && room.status === 'bidding' ? {
      currentBid:room.open.currentBid,
      leaderId:room.open.leaderId,
      turnId:room.open.turnId,
      history:room.open.history
    } : null,
    tieInfo:room.status === 'tiebreak' ? room.tieInfo : null,
    card:['bidding', 'tiebreak', 'reveal'].includes(room.status) ? room.cards[room.round] : null,
    footballSlots:room.mode==='football'&&room.footballVariant==='startelf'?SLOTS:null, playerPoolSize:room.mode==='football'?catalog.length:null,
    footballCanBuy:room.mode==='football' && room.cards[room.round] ? Object.fromEntries(room.players.map(p=>[p.id,canWinCard(room,p,room.cards[room.round])])) : null,
    players:room.players.map(p => ({id:p.id,name:p.name,avatar:p.avatar,avatarColor:p.avatarColor,online:[...(room.clients||[])].some(c=>c.playerId===p.id),budget:p.budget,items:p.items,lineup:p.lineup,stats:room.mode==='football'?ratingStats(p):null,hasBid:room.bids.has(p.id),hasVoted:room.votes.has(p.id)})),
    ownId:own.id, ownBid:room.auctionType === 'sealed' && room.bids.has(own.id) ? room.bids.get(own.id) : null,
    lastResult:room.status === 'reveal' ? room.lastResult : null,
    winner:room.status === 'complete' ? room.winner : null,
    votesCast:room.votes.size, rematchReady:[...(room.ready||new Set())], lobbyNotice:room.status==='waiting'?room.notice:null, updated:room.updated
  };
}
function initialOpen(room) {
  // The starter changes per auction; a player who cannot legally buy the
  // current item is not required to take an empty turn.
  const winnerStarter=room.mode==='football'&&room.footballVariant==='byp'?room.players.find(p=>p.id===room.lastAuctionWinnerId):null;
  const first=winnerStarter||room.players[room.round % 2];
  const other=room.players.find(x=>x.id!==first.id);
  const eligible=p=>room.mode!=='football'||canWinCard(room,p,room.cards[room.round]);
  room.open={currentBid:0,leaderId:null,turnId:eligible(first)?first.id:other.id,emptyPasses:0,history:[]};
}
function armDeadline(room,overrideMs){
 cancelTimer(room);
 if(!room.timeLimit||!['bidding','tiebreak'].includes(room.status))return;
 const seq=room.timerSeq, delay=overrideMs===undefined?(TEST_FAST?85:room.timeLimit*1000):Math.max(20,overrideMs);
 room.deadline=Date.now()+delay;
 room.timer=setTimeout(()=>{
  if(room.timerSeq!==seq||!['bidding','tiebreak'].includes(room.status))return;
  room.timer=null;room.deadline=null;
  if(room.auctionType==='sealed'){
   for(const p of room.players)if(!room.bids.has(p.id))room.bids.set(p.id,0);
   settleSealed(room);
  }else{const p=room.players.find(p=>p.id===room.open?.turnId);if(p)applyOpenPass(room,p);}
  touch(room);
 },delay);room.timer.unref();
}
// Startelf: fill every legal 4-3-3 slot after normal auctions are no longer possible.
// The more places a user failed to purchase, the LOWER the chance of a star
// card (88+) in each of their free penalty picks. All picks still score 80+.
function weightedStartelfCard(options,missingAtStart){
  const premiumChance=Math.max(0.015,0.27*Math.pow(0.75,Math.max(0,missingAtStart-1)));
  const good=options.filter(x=>x.rating>=88),normal=options.filter(x=>x.rating<88);
  const basket=good.length&&(!normal.length||crypto.randomInt(1000000)<Math.floor(premiumChance*1000000))?good:(normal.length?normal:good);
  return basket[crypto.randomInt(basket.length)];
}
function planStartelfAutoFill(room){
  const used=new Set(room.players.flatMap(p=>p.items.map(c=>c.id)));
  const clones=room.players.map(p=>({id:p.id,name:p.name,items:[...p.items],lineup:{...p.lineup},missing:11-p.items.length}));
  const queue=[];
  // Important: specialist positions first, because there are fewer suitable cards.
  const slotOrder=['GK','RB','LB','CB1','CB2','CM1','CM2','CM3','LW','RW','ST'];
  for(let step=0;step<11;step++)for(const p of clones){
    if(p.items.length>=11)continue;
    const formation=arrange(p.items,p.lineup)||{};
    const empty=slotOrder.find(slot=>!formation[slot]);
    if(!empty)throw new Error('Auffüllung: Keine freie Position gefunden.');
    const eligible=catalog.filter(c=>!used.has(c.id)&&c.eligible.includes(empty)&&arrange([...p.items,c],formation));
    if(!eligible.length)throw new Error(`Auffüllung: Keine verfügbaren Spieler für ${empty}.`);
    const card=weightedStartelfCard(eligible,p.missing);
    p.items.push(card);p.lineup=arrange(p.items,formation);
    used.add(card.id);
    queue.push({playerId:p.id,playerName:p.name,card,missingAtStart:p.missing});
  }
  return queue;
}
function activateStartelfAutoFill(room){
 if(room.mode!=='football'||room.footballVariant!=='startelf'||room.players.every(p=>p.items.length===11))return false;
 cancelTimer(room);
 room.status='autofill';room.open=null;room.autoFillLast=null;room.autoFillReason='startelf';
 room.autoFillQueue=planStartelfAutoFill(room);
 autoFillNext(room);
 return true;
}
function activateAutoFill(room){
 if(room.mode!=='football'||room.footballVariant!=='byp')return false;
 const full=room.players.filter(p=>p.items.length>=room.playerLimit);
 if(full.length!==1)return false;
 const recipient=room.players.find(p=>p.id!==full[0].id);
 if(recipient.items.length>=room.playerLimit)return false;
 cancelTimer(room);
 room.status='autofill';room.open=null;room.autoFillLast=null;room.autoFillReason='byp';room.autoFillQueue=[];
 autoFillNext(room);return true;
}
function autoFillNext(room){
 if(room.status!=='autofill')return;
 if(room.autoFillReason==='startelf'){
   const next=room.autoFillQueue?.shift();
   if(!next){room.status='voting';room.autoFillLast=null;room.autoFillQueue=[];touch(room);return;}
   const target=room.players.find(p=>p.id===next.playerId);
   if(!target||target.items.length>=11)throw new Error('Ungültiger Auffüll-Empfänger.');
   const newLineup=arrange([...target.items,next.card],target.lineup);
   if(!newLineup)throw new Error('Auffüllung verletzt Positionsregeln.');
   target.items.push(next.card);target.lineup=newLineup;
   room.autoFillLast={...next,received:target.items.length,limit:11};
   touch(room);
   room.resultTimer=setTimeout(()=>{room.resultTimer=null;autoFillNext(room);},AUTO_FILL_MS);room.resultTimer.unref();
   return;
 }

 const target=room.players.find(p=>p.items.length<room.playerLimit);
 if(!target){room.status='voting';room.autoFillLast=null;touch(room);return;}
 if(room.round>=room.cards.length){
  const used=new Set(room.cards.map(c=>c.id));const extra=shuffle(catalog.filter(c=>!used.has(c.id))).slice(0,room.playerLimit-target.items.length);
  room.cards.push(...extra);
 }
 if(room.round>=room.cards.length){room.status='voting';room.autoFillLast=null;touch(room);return;}
 const card=room.cards[room.round++];target.items.push(card); // items shown sequentially from the already generated auction deck; no purchase
 room.autoFillLast={playerId:target.id,playerName:target.name,card,received:target.items.length,limit:room.playerLimit};
 touch(room);
 room.resultTimer=setTimeout(()=>{room.resultTimer=null;autoFillNext(room);},AUTO_FILL_MS);room.resultTimer.unref();
}
function prepareRound(room){
  // Startelf: no auction time remaining, or no valid bid is possible -> show
  // the penalty draw animation before voting. Keep budget costs unchanged.
  if(room.mode==='football'&&room.footballVariant==='startelf'){
    const noMoney=room.players.every(p=>p.budget<1||p.items.length>=11);
    if(noMoney||room.round>=room.cards.length){
      if(activateStartelfAutoFill(room))return;
      cancelTimer(room);room.status='voting';room.open=null;return;
    }
  }
  // In the short football mode, finish the other roster before affordability checks.
  if(activateAutoFill(room))return;
  // With no positive bid possible, do not show dead auctions or require two passes.
  if(room.players.every(p=>p.budget<1)){
    cancelTimer(room);room.status='voting';room.open=null;return;
  }
  // Skip irrelevant offers automatically when neither team can use the player.
  if(room.mode==='football'){
    while(room.round<room.cards.length && room.players.every(p=>!canWinCard(room,p,room.cards[room.round])))room.round++;
  }
  if(room.round>=room.cards.length || (room.mode==='football'&&room.players.every(p=>p.items.length>=footballLimit(room)))){
    if(activateStartelfAutoFill(room))return;
    cancelTimer(room);room.status='voting';room.open=null;return;
  }
  if(activateAutoFill(room))return;
  room.status='bidding';
  if(room.auctionType==='open')initialOpen(room);
  else if(room.mode==='football'){
    for(const p of room.players)if(!canWinCard(room,p,room.cards[room.round]))room.bids.set(p.id,0);
  }
  armDeadline(room);
  presenceSync(room);
}
function advanceRound(room) {
  if (room.status !== 'reveal') return;
  room.round++;
  room.bids.clear();room.lastResult=null;room.tieInfo=null;
  prepareRound(room);
  touch(room);
}
function finishAuction(room, winner, amount, reason, bids=[]) {
  cancelTimer(room);
  room.lastAuctionWinnerId=winner?.id||null;
  const currentCard=room.cards[room.round];
  if(winner){
    winner.budget -= amount;
    winner.items.push(currentCard);
    if(room.mode==='football'&&room.footballVariant==='startelf')winner.lineup=arrange(winner.items,winner.lineup)||winner.lineup;
  }
  room.lastResult={winnerId:winner?.id||null,winnerName:winner?.name||null,
    winningBid:amount,bids,reason,awards:[],
    history:room.auctionType==='open' ? [...room.open.history] : [],
    tieAmount:room.tieInfo?.amount ?? null};
  room.status='reveal';room.tieInfo=null;
  // The transition is server-driven; no player has to press Next.
  room.resultTimer=setTimeout(()=>{room.resultTimer=null;advanceRound(room);}, AUTO_NEXT_MS);
  room.resultTimer.unref();
}
function applyOpenPass(room,own){
 room.open.history.push({id:own.id,name:own.name,pass:true});
 if(room.open.leaderId){const winner=room.players.find(p=>p.id===room.open.leaderId);finishAuction(room,winner,room.open.currentBid,'win');}
 else{room.open.emptyPasses++;if(room.open.emptyPasses===2)finishAuction(room,null,0,'passed');
 else{room.open.turnId=room.players.find(p=>p.id!==own.id).id;armDeadline(room);}}
}
function settleSealed(room) {
  const [a,b]=room.players, aa=room.bids.get(a.id),bb=room.bids.get(b.id);
  if (room.bids.size !== 2) return;
  const bids=room.players.map(p=>({id:p.id,name:p.name,amount:room.bids.get(p.id)}));
  if (aa===bb && aa>0 && room.status==='bidding') {
    // Bei Gleichstand erhält niemand das Item per Zufall.
    // Einmaliges geheimes Stechen ohne Kosten; bei erneutem Gleichstand bleibt es unverkauft.
    room.tieInfo={amount:aa}; room.status='tiebreak'; room.bids.clear();armDeadline(room);return;
  }
  const winner=aa===bb ? null : (aa>bb?a:b);
  const reason=winner?'win':aa===0?'passed':'double-tie';
  finishAuction(room,winner,winner?room.bids.get(winner.id):0,reason,bids);
}
function touch(room) {room.updated = Date.now(); if(room.players.length===2 && room.players.every(p=>[...room.clients].some(c=>c.playerId===p.id)) && ['bidding','tiebreak','reveal','voting','countdown'].includes(room.status))room.wasLive=true;persist();for(const client of room.clients){const payload=publicState(room,client.token);if(payload){try{client.res.write(`data: ${JSON.stringify(payload)}\n\n`);}catch{room.clients.delete(client);}}} }
function send(res,status,payload){const body=JSON.stringify(payload);res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Content-Length':Buffer.byteLength(body),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(body);}
function error(res,status,message){send(res,status,{error:message});}
function bodyOf(req){return new Promise((resolve,reject)=>{let raw='';req.on('data',ch=>{raw+=ch;if(raw.length>16000){reject(new Error('Anfrage zu groß'));req.destroy();}});req.on('end',()=>{try{resolve(JSON.parse(raw||'{}'));}catch{reject(new Error('Ungültige Daten'));}});req.on('error',reject);});}
function authorizedRoom(code,token,res){const room=rooms.get(code);if(!room){error(res,404,'Dieser Spielraum existiert nicht (mehr).');return null;}if(!room.players.some(p=>p.token===token)){error(res,403,'Du bist nicht in diesem Spielraum angemeldet.');return null;}return room;}
function serveStatic(req,res,pathname){
  const files = {'/':'index.html','/index.html':'index.html','/styles.css':'styles.css','/app.js':'app.js','/favicon.svg':'favicon.svg', '/assets/arena-soft.webp':'assets/arena-soft.webp', '/assets/hero-trophy.webp':'assets/hero-trophy.webp','/assets/hero-trophy-integrated.webp':'assets/hero-trophy-integrated.webp', '/assets/mode-football.webp':'assets/mode-football.webp', '/assets/mode-food.webp':'assets/mode-food.webp', '/assets/mode-superhero.webp':'assets/mode-superhero.webp', '/assets/mode-random.webp':'assets/mode-random.webp', '/assets/home-hero-trophy.webp':'assets/home-hero-trophy.webp', '/assets/home-mode-football.webp':'assets/home-mode-football.webp', '/assets/home-mode-food.webp':'assets/home-mode-food.webp', '/assets/home-mode-superhero.webp':'assets/home-mode-superhero.webp', '/assets/home-mode-random.webp':'assets/home-mode-random.webp', '/assets/home-mode-die.svg':'assets/home-mode-die.svg', '/assets/hero-controller-pro.svg':'assets/hero-controller-pro.svg', '/assets/hero-die-pro.svg':'assets/hero-die-pro.svg'};
  const file=files[pathname] || (/^\/assets\/avatars\/(nova|luna|kai|roxy|ace|milo|juno|zara|rex|ember|shadow|pixel)\.svg$/.test(pathname) ? pathname.slice(1) : null);if(!file){error(res,404,'Nicht gefunden');return;}
  const ext=path.extname(file);const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp'}[ext];
  fs.readFile(path.join(PUBLIC,file),(err,buf)=>{if(err){error(res,404,'Nicht gefunden');return;}res.writeHead(200,{'Content-Type':mime,'Content-Length':buf.length,'X-Content-Type-Options':'nosniff'});res.end(buf);});
}
// Cache image metadata, not image files. Public Wikimedia thumbnails are linked
// to their original file page so credits and the license remain accessible.
const photoCache = new Map();
async function wikiJSON(host,params){
  const u=new URL(`https://${host}/w/api.php`);
  for(const [k,v] of Object.entries({action:'query',format:'json',formatversion:'2',...params}))u.searchParams.set(k,v);
  const r=await fetch(u,{signal:AbortSignal.timeout(4200),headers:{'User-Agent':'BidBattle-Hobby/1.6.1 (local game prototype; requests exact Wikimedia page images)','Accept':'application/json'}});
  if(!r.ok)throw Error('Wikimedia unavailable');return r.json();
}
const validPhotoUrl=url=>typeof url==='string'&&url.startsWith('https://upload.wikimedia.org/');
// Deliberately no fuzzy Commons name search: surname matches previously
// returned pictures of other people. Only use the freely licensed page image
// from the EXACT article assigned to this footballer; otherwise show a flag.
async function lookupImage(p){
  const canonical=s=>String(s||'').normalize('NFKC').trim().toLocaleLowerCase('de');
  try{
    const d=await wikiJSON('en.wikipedia.org',{prop:'pageimages',redirects:'1',titles:p.wiki,piprop:'thumbnail|name',pithumbsize:'360',pilicense:'free'});
    const page=d.query?.pages?.[0];
    if(!page || page.missing)return null;
    // Many verified footballer pages redirect to updated titles. A redirect is
    // only accepted when the Wikipedia API explicitly maps the requested,
    // manually assigned article title to the returned page (never fuzzy search).
    const sameTitle=canonical(page.title)===canonical(p.wiki);
    const redirects=d.query?.redirects||[];
    const explicitRedirect=redirects.some(r=>canonical(r.from)===canonical(p.wiki)&&canonical(r.to)===canonical(page.title));
    if(!sameTitle&&!explicitRedirect)return null;
    const url=page.thumbnail?.source;
    // Accept only Wikimedia-served, free images linked to the player's article.
    if(validPhotoUrl(url) && page.pageimage && /\.(?:jpg|jpeg|png|webp)$/i.test(page.pageimage)){
      return {src:url,source:`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(page.pageimage).replace(/%20/g,'_')}`,article:`https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g,'_'))}`,provider:'Wikimedia Commons'};
    }
  }catch{}
  return null;
}
async function getImage(p){
  let cached=photoCache.get(p.id);if(cached&&Date.now()<cached.expires)return cached.value;
  // Cache in-flight requests, so re-renders and both players do not spam API.
  if(cached?.pending)return cached.pending;
  const pending=lookupImage(p).catch(()=>null);
  photoCache.set(p.id,{pending});const value=await pending;
  photoCache.set(p.id,{value,expires:Date.now()+(value?24*60*60*1000:15*60*1000)});return value;
}
// A single-server, low-cost persistence model. Backend secrets never reach the browser.
function snapshotRoom(room){
 return {...Object.fromEntries(Object.entries(room).filter(([k])=>!['clients','timer','resultTimer','countdownTimer','disconnectTimer','bids','votes','ready'].includes(k))),
   bids:[...room.bids],votes:[...room.votes],ready:[...room.ready],clients:undefined};
}
function persist(){storage.save({rooms:[...rooms.values()].map(snapshotRoom),users:[...users.values()]});}
function restoreRoom(data){return {...data,bids:new Map(data.bids||[]),votes:new Map(data.votes||[]),ready:new Set(data.ready||[]),clients:new Set(),timer:null,resultTimer:null,countdownTimer:null,disconnectTimer:null,timerSeq:0};}
function startCountdown(room){
 if(TEST_FAST && process.env.BIDBATTLE_TEST_COUNTDOWN!=='1'){prepareRound(room);return;}
 cancelTimer(room);room.status='countdown';room.countdownEnds=Date.now()+START_COUNTDOWN_MS;
 room.countdownTimer=setTimeout(()=>{room.countdownTimer=null;if(room.status!=='countdown')return;room.countdownEnds=null;prepareRound(room);presenceSync(room);touch(room);},START_COUNTDOWN_MS);
 room.countdownTimer.unref();
}
function presenceSync(room){
 if(!rooms.has(room.code)||!room.wasLive||room.players.length!==2)return;
 if(!['bidding','tiebreak'].includes(room.status))return;
 const online=room.players.every(p=>[...room.clients].some(c=>c.playerId===p.id));
 if(online){
  if(room.disconnectTimer){clearTimeout(room.disconnectTimer);room.disconnectTimer=null;}
  if(room.paused){const remaining=room.pauseRemaining;room.paused=false;room.pauseRemaining=null;if(room.timeLimit)armDeadline(room,remaining||room.timeLimit*1000);touch(room);}
 }else{
  if(!room.paused){room.pauseRemaining=room.deadline?Math.max(150,room.deadline-Date.now()):null;room.paused=true;cancelTimer(room);touch(room);}
  if(!room.disconnectTimer){room.disconnectTimer=setTimeout(()=>{room.disconnectTimer=null;
    if(!room.paused||!rooms.has(room.code))return;
    resetMatch(room);room.notice='Ein Spieler war zu lange offline. Die laufende Partie wurde beendet. Ihr könnt erneut starten.';touch(room);
   },TEST_FAST?1500:60000);room.disconnectTimer.unref();}
 }
}
function hashToken(v){return crypto.createHash('sha256').update(v).digest('hex');}
function hashPassword(password,salt){return crypto.scryptSync(password,salt,64).toString('hex');}
function getAuth(req){
 const v=req.headers.authorization||'';if(!v.startsWith('Bearer '))return null;
 const hash=hashToken(v.slice(7));const now=Date.now();
 for(const user of users.values())if((user.sessions||[]).some(x=>x.hash===hash&&x.until>now))return user;
 return null;
}
function publicUser(u){return {id:u.id,name:u.name,email:u.email,avatar:u.avatar,avatarColor:u.avatarColor};}
function newAuthSession(user){const token=crypto.randomBytes(32).toString('base64url');user.sessions=(user.sessions||[]).filter(x=>x.until>Date.now()).slice(-4);user.sessions.push({hash:hashToken(token),until:Date.now()+30*86400000});persist();return token;}
function rateLimit(req,key,max=12,windowMs=60000){
 const addr=String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'local').split(',')[0].trim().slice(0,80);
 const name=key+':'+addr,now=Date.now();const hit=limiter.get(name)||{count:0,until:now+windowMs};
 if(now>hit.until){hit.count=0;hit.until=now+windowMs;}hit.count++;limiter.set(name,hit);
 return hit.count<=max;
}
function rateLimited(res){error(res,429,'Zu viele Versuche. Bitte versuche es später erneut.');}
function verifyPassword(user,password){
 const actual=Buffer.from(hashPassword(password,user.salt),'hex'),expected=Buffer.from(user.passwordHash,'hex');
 return actual.length===expected.length&&crypto.timingSafeEqual(actual,expected);
}
function resolveProfile(req,b){const account=getAuth(req);return account?{name:account.name,avatar:account.avatar,avatarColor:account.avatarColor,accountId:account.id}:
 {name:safeName(b.name),avatar:safeAvatar(b.avatar),avatarColor:safeColor(b.avatarColor),accountId:null};}
function finishVotes(room){
 const [a,b]=room.players;const av=room.votes.get(a.id),bv=room.votes.get(b.id);
 if(av===bv){room.winner=av==='tie'?null:av;room.tieBreakReason=av==='tie'?'mutual-tie':'unanimous';}
 else if(room.mode==='football'){
  const as=ratingStats(a).average||0,bs=ratingStats(b).average||0;
  room.winner=as===bs?null:(as>bs?a.id:b.id);
  room.tieBreakReason=as===bs?'equal-rating':'rating';
 } else {room.winner=null;room.tieBreakReason='split-vote';}
 room.status='complete';
}
const server = http.createServer(async(req,res)=>{
  let u;try{u=new URL(req.url,'http://localhost');}catch{return error(res,400,'Ungültige Adresse');}
  const p=u.pathname; if(req.method==='GET' && !p.startsWith('/api/'))return serveStatic(req,res,p);
  if(req.method==='GET' && /^\/api\/photos\/f\d{3}$/.test(p)){
    const player=byId.get(p.split('/').at(-1));
    if(!player)return error(res,404,'Fußballer nicht gefunden.');
    const found=await getImage(player);return send(res,200,found||{});
  }
  if(req.method==='GET' && p==='/api/health')return send(res,200,{ok:true,version:'1.7.9',storage:storage.status(),accountsEnabled:ACCOUNTS_ENABLED});
  if(p.startsWith('/api/auth/') && !rateLimit(req,'auth',18))return rateLimited(res);
  if(p==='/api/auth/me'&&req.method==='GET'){
    const u=getAuth(req);return u?send(res,200,{user:publicUser(u)}):error(res,401,'Bitte erneut anmelden.');
  }
  if(p==='/api/auth/logout'&&req.method==='POST'){
    const u=getAuth(req);if(u){const h=hashToken(String(req.headers.authorization||'').slice(7));u.sessions=u.sessions.filter(x=>x.hash!==h);persist();}
    return send(res,200,{ok:true});
  }
  if(p==='/api/auth/register'&&req.method==='POST'){
    if(!ACCOUNTS_ENABLED)return error(res,503,'Für dauerhafte Benutzerkonten muss zuerst die Datenbank bei Render eingerichtet werden. Gäste können bereits spielen.');
    if(!rateLimit(req,'register',5,10*60000))return rateLimited(res);
    let b;try{b=await bodyOf(req);}catch(e){return error(res,400,e.message);}
    const email=String(b.email||'').trim().toLowerCase(),name=safeName(b.name),pw=String(b.password||'');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>180)return error(res,400,'Bitte gültige E-Mail-Adresse eingeben.');
    if(!name)return error(res,400,'Spielername fehlt.');
    if(pw.length<10||pw.length>128)return error(res,400,'Passwort muss 10 bis 128 Zeichen haben.');
    if(users.has(email))return error(res,409,'E-Mail-Adresse ist bereits registriert.');
    const salt=crypto.randomBytes(24).toString('hex');const user={id:crypto.randomUUID(),email,name,salt,passwordHash:hashPassword(pw,salt),avatar:safeAvatar(b.avatar),avatarColor:safeColor(b.avatarColor),sessions:[]};
    users.set(email,user);const token=newAuthSession(user);return send(res,201,{token,user:publicUser(user)});
  }
  if(p==='/api/auth/login'&&req.method==='POST'){
    const b=await bodyOf(req),email=String(b.email||'').trim().toLowerCase(),pw=String(b.password||'');
    const u=users.get(email);if(!u || !verifyPassword(u,pw))return error(res,401,'E-Mail oder Passwort falsch.');
    const token=newAuthSession(u);return send(res,200,{token,user:publicUser(u)});
  }
  if(p==='/api/auth/profile'&&req.method==='POST'){
    const u=getAuth(req);if(!u)return error(res,401,'Bitte erneut anmelden.');
    const b=await bodyOf(req),name=safeName(b.name);if(!name)return error(res,400,'Bitte einen Namen angeben.');
    u.name=name;u.avatar=safeAvatar(b.avatar);u.avatarColor=safeColor(b.avatarColor);persist();return send(res,200,{user:publicUser(u)});
  }
  if(p==='/api/auth/delete'&&req.method==='POST'){
    const u=getAuth(req);if(!u)return error(res,401,'Nicht angemeldet.');
    const b=await bodyOf(req);if(!verifyPassword(u,String(b.password||'')))return error(res,403,'Passwort falsch.');
    users.delete(u.email);for(const room of rooms.values())for(const player of room.players)if(player.accountId===u.id)player.accountId=null;
    persist();return send(res,200,{ok:true});
  }
  try{
    if(req.method==='POST' && p==='/api/rooms'){
      if(!rateLimit(req,'rooms',18,60000))return rateLimited(res);
      const b=await bodyOf(req);const identity=resolveProfile(req,b),name=identity.name;if(!name)return error(res,400,'Bitte gib einen Spielernamen ein.');
      let settings;try{settings=parseSettings(b);}catch(e){return error(res,400,e.message);}
      const c=code(),token=crypto.randomBytes(24).toString('hex');
      const host={id:crypto.randomUUID(),token,...identity,budget:settings.startBudget,items:[],lineup:{}};
      const room={code:c,...settings,hostId:host.id,players:[host],cards:[],round:0,status:'waiting',bids:new Map(),votes:new Map(),ready:new Set(),notice:null,lastResult:null,tieInfo:null,open:null,winner:null,clients:new Set(),updated:Date.now(),timerSeq:0,deadline:null};
      room.cards=newDeck(room);
      rooms.set(c,room);persist();return send(res,201,{code:c,token,state:publicState(room,token)});
    }
    const match=p.match(/^\/api\/rooms\/([A-Z2-9]{6})(?:\/(join|bid|pass|vote|lineup|events|settings|start|rematch|playagain|lobby|leave))?$/);
    if(match){
      const [,c,action]=match;
      if(action==='join' && req.method==='POST'){
        const room=rooms.get(c);if(!room)return error(res,404,'Spielraum nicht gefunden.');
        if(room.players.length>=2)return error(res,409,'Dieser Spielraum ist bereits voll.');
        if(room.status!=='waiting')return error(res,409,'Das Spiel hat schon begonnen.');
        const b=await bodyOf(req);const identity=resolveProfile(req,b),name=identity.name;if(!name)return error(res,400,'Bitte gib einen Spielernamen ein.');
        const token=crypto.randomBytes(24).toString('hex');room.players.push({id:crypto.randomUUID(),token,...identity,budget:room.startBudget,items:[],lineup:{}});touch(room);return send(res,200,{code:c,token,state:publicState(room,token)});
      }
      const token=req.method==='GET'?u.searchParams.get('token'):null;
      if(req.method==='GET' && action==='events'){
        const room=authorizedRoom(c,token,res);if(!room)return;
        res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});
        res.write(`data: ${JSON.stringify(publicState(room,token))}\n\n`);
        const player=room.players.find(x=>x.token===token);const client={res,token,playerId:player.id};room.clients.add(client);presenceSync(room);touch(room);const ping=setInterval(()=>{try{res.write(': heartbeat\n\n');}catch{}},20000);
        res.on('close',()=>{clearInterval(ping);room.clients.delete(client);const check=setTimeout(()=>presenceSync(room),TEST_FAST?30:500);check.unref();touch(room);});return;
      }
      if(req.method==='GET' && !action){const room=authorizedRoom(c,token,res);if(room)return send(res,200,publicState(room,token));return;}
      if(req.method==='POST' && ['bid','pass','vote','lineup','settings','start','rematch','playagain','lobby','leave'].includes(action)){
        const b=await bodyOf(req),room=authorizedRoom(c,b.token,res);if(!room)return;
        const own=room.players.find(a=>a.token===b.token);
        if(room.paused && ['bid','pass'].includes(action))return error(res,409,'Die Auktion ist pausiert, bis dein Mitspieler zurück ist.');
        if(action==='leave'){
          room.players=room.players.filter(x=>x.id!==own.id);
          for(const client of [...room.clients])if(client.token===own.token){room.clients.delete(client);try{client.res.end();}catch{}}
          if(room.players.length===0){cancelTimer(room);if(room.resultTimer)clearTimeout(room.resultTimer);if(room.countdownTimer)clearTimeout(room.countdownTimer);rooms.delete(c);persist();return send(res,200,{left:true});}
          if(room.hostId===own.id)room.hostId=room.players[0].id;
          resetMatch(room);room.notice=`${own.name} hat den Raum verlassen. Du kannst jemanden Neues einladen.`;
          touch(room);return send(res,200,{left:true});
        }
        if(action==='lobby'){
          // Each person may stop a match, but the room and both player seats stay.
          // The client asks for explicit confirmation before calling this endpoint.
          if(room.status==='waiting')return send(res,200,publicState(room,b.token));
          resetMatch(room);room.notice=`${own.name} hat das Spiel beendet. Ihr seid wieder zusammen in der Lobby.`;
          touch(room);return send(res,200,publicState(room,b.token));
        }
        if(action==='playagain'){
          if(room.status!=='complete')return error(res,409,'Ein direktes Rückspiel ist erst nach dem Finale möglich.');
          room.ready??=new Set();room.ready.add(own.id);
          if(room.ready.size===2){resetMatch(room);startCountdown(room);}
          touch(room);return send(res,200,publicState(room,b.token));
        }
        if(['settings','start','rematch'].includes(action)){
          if(action!=='rematch'&&own.id!==room.hostId)return error(res,403,'Nur der Host darf das Spiel verwalten.');
          if(action==='rematch'){
            if(room.status!=='complete')return error(res,409,'Erst nach dem Finale möglich.');
            resetMatch(room);touch(room);return send(res,200,publicState(room,b.token));
          }
          if(room.status!=='waiting')return error(res,409,'Einstellungen sind nur in der Lobby möglich.');
          if(action==='settings'){
            let newSettings;try{newSettings=parseSettings(b);}catch(e){return error(res,400,e.message);}
            Object.assign(room,newSettings);resetMatch(room);touch(room);return send(res,200,publicState(room,b.token));
          }
          if(room.players.length!==2)return error(res,409,'Für den Start fehlen noch Spieler.');
          resetMatch(room);startCountdown(room);touch(room);return send(res,200,publicState(room,b.token));
        }
        if(action==='lineup'){
          if(room.mode!=='football'||room.footballVariant!=='startelf'||!['bidding','tiebreak','reveal','voting'].includes(room.status))return error(res,409,'Aufstellung aktuell nicht bearbeitbar.');
          const player=own.items.find(x=>x.id===b.playerId);
          const slot=SLOTS.find(x=>x.id===b.slot);
          if(!player || !slot || !player.eligible.includes(slot.id))return error(res,400,'Dieser Fußballer darf nicht auf diese Position.');
          const newMap={...own.lineup};
          const oldSlot=Object.keys(newMap).find(k=>newMap[k]===player.id);
          const occupantId=newMap[slot.id];
          if(oldSlot)delete newMap[oldSlot];
          if(occupantId && oldSlot && occupantId!==player.id){
            const occupant=own.items.find(x=>x.id===occupantId);
            if(occupant?.eligible.includes(oldSlot))newMap[oldSlot]=occupantId;
            else delete newMap[slot.id]; // displaced player will be auto-repositioned
          }
          newMap[slot.id]=player.id;
          const arranged=arrange(own.items,newMap);
          if(!arranged || arranged[slot.id]!==player.id)return error(res,409,'Aufstellung lässt diese Position nicht zu.');
          own.lineup=arranged;touch(room);return send(res,200,publicState(room,b.token));
        }
        if(action==='bid'){
          if(room.status!=='bidding' && room.status!=='tiebreak')return error(res,409,'Diese Auktion ist nicht mehr aktiv.');
          if(!Number.isSafeInteger(b.amount) || b.amount<0 || b.amount>own.budget)return error(res,400,'Dein Gebot muss zwischen 0 und deinem Restbudget liegen.');
          if(room.mode==='football' && b.amount>0 && !canWinCard(room,own,room.cards[room.round]))return error(res,409,'Für diesen Fußballer ist in deiner Mannschaft kein zulässiger Platz mehr frei.');
          if(room.auctionType==='sealed'){
            if(room.bids.has(own.id))return error(res,409,'Du hast bereits geboten.');
            room.bids.set(own.id,b.amount);
            settleSealed(room);
          } else {
            if(room.status!=='bidding'||room.open.turnId!==own.id)return error(res,409,'Du bist gerade nicht am Zug.');
            if(b.amount<=room.open.currentBid)return error(res,400,`Du musst mindestens ${room.open.currentBid+1} € bieten.`);
            room.open.currentBid=b.amount;room.open.leaderId=own.id;room.open.emptyPasses=0;
            room.open.history.push({id:own.id,name:own.name,amount:b.amount});
            const rival=room.players.find(p=>p.id!==own.id);
            if(rival.budget<=b.amount || (room.mode==='football'&&!canWinCard(room,rival,room.cards[room.round]))){finishAuction(room,own,b.amount,'win');}
            else {room.open.turnId=rival.id;armDeadline(room);}
          }
          touch(room);return send(res,200,publicState(room,b.token));
        }
        if(action==='pass'){
          if(room.auctionType!=='open'||room.status!=='bidding')return error(res,409,'Passen ist hier nicht möglich.');
          if(room.open.turnId!==own.id)return error(res,409,'Du bist gerade nicht am Zug.');
          applyOpenPass(room,own);
          touch(room);return send(res,200,publicState(room,b.token));
        }
        if(action==='vote'){
          if(room.status!=='voting')return error(res,409,'Die Abstimmung ist noch nicht geöffnet.');
          if(room.votes.has(own.id))return error(res,409,'Du hast bereits abgestimmt.');
          if(b.winnerId!=='tie'&&!room.players.some(x=>x.id===b.winnerId))return error(res,400,'Ungültige Auswahl.');
          room.votes.set(own.id,b.winnerId);
          if(room.votes.size===2)finishVotes(room);
          touch(room);return send(res,200,publicState(room,b.token));
        }
      }
    }
    return error(res,404,'Unbekannte Anfrage.');
  } catch(e){if(!res.headersSent)error(res,400,e.message||'Fehler bei der Anfrage.');}
});
setInterval(()=>{const now=Date.now();let changed=false;for(const [k,r] of rooms)if(now-r.updated>ROOM_TTL){cancelTimer(r);if(r.resultTimer)clearTimeout(r.resultTimer);if(r.countdownTimer)clearTimeout(r.countdownTimer);for(const client of r.clients)client.res.end();rooms.delete(k);changed=true;}if(changed)persist();},60*60*1000).unref();
async function initialize(){
 const db=await storage.load();
 for(const u of db.users||[])users.set(u.email,u);
 for(const r of db.rooms||[]){if(Date.now()-(r.updated||0)>ROOM_TTL)continue;
  const room=restoreRoom(r);rooms.set(room.code,room);
  if(room.status==='countdown'){
    const remaining=Math.max(15,(room.countdownEnds||Date.now())-Date.now());room.countdownEnds=Date.now()+remaining;
    room.countdownTimer=setTimeout(()=>{room.countdownTimer=null;room.countdownEnds=null;prepareRound(room);presenceSync(room);touch(room);},remaining);room.countdownTimer.unref();
  } else if(['bidding','tiebreak'].includes(room.status)){
    if(room.paused||room.wasLive){room.paused=true;room.disconnectTimer=setTimeout(()=>{room.disconnectTimer=null;if(room.paused){resetMatch(room);room.notice='Die vorige Partie wurde wegen einer längeren Unterbrechung beendet.';touch(room);}},TEST_FAST?1500:60000);room.disconnectTimer.unref();}
    else armDeadline(room);
  }
  else if(room.status==='reveal'){room.resultTimer=setTimeout(()=>{room.resultTimer=null;advanceRound(room);},AUTO_NEXT_MS);room.resultTimer.unref();}
  else if(room.status==='autofill'){room.resultTimer=setTimeout(()=>{room.resultTimer=null;autoFillNext(room);},AUTO_FILL_MS);room.resultTimer.unref();}
 }
 server.listen(PORT,'0.0.0.0',()=>{
  console.log(`BidBattle läuft auf http://localhost:${PORT}`);
  if (process.platform === 'win32' && process.env.BIDBATTLE_OPEN_BROWSER === '1') {
    const {exec} = require('node:child_process');
    exec(`start "" "http://localhost:${PORT}"`, {windowsHide:true}, (err) => {
      if (err) console.log('Bitte öffne die Adresse oben manuell in deinem Browser.');
    });
  }
 });
}
initialize().catch(e=>{console.error('Konnte BidBattle-Speicher nicht laden:',e.message);process.exitCode=1;});
