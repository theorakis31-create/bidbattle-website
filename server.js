'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {SLOTS,catalog,byId,createDeck,arrange,canAcquire,ratingStats} = require('./football');

const PORT = Number(process.env.PORT || 3000);
const PUBLIC = __dirname;
const rooms = new Map();
const ROOM_TTL = 24 * 60 * 60 * 1000;
const AUTO_NEXT_MS = process.env.BIDBATTLE_TEST_FAST === '1' ? 35 : 1700;
const AVATARS = ['🙂','😎','🤩','🐼','🦊','🐯','🐱','🐸','🦄','🤖','👽','🐧'];
const AVATAR_COLORS = ['lilac','blue','peach','mint','pink','yellow'];
function safeAvatar(v) {return AVATARS.includes(v) ? v : '🙂';}
function safeColor(v) {return AVATAR_COLORS.includes(v) ? v : 'lilac';}
const LABELS = {food: 'Food Battle', football: 'Football Draft', hero: 'Superhero Showdown', random: 'Random Battle'};
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
    code:room.code, mode:room.mode, modeLabel:LABELS[room.mode], status:room.status,
    budget:room.startBudget, auctionType:room.auctionType, round:room.round, total:room.cards.length,
    open:room.auctionType === 'open' && room.status === 'bidding' ? {
      currentBid:room.open.currentBid,
      leaderId:room.open.leaderId,
      turnId:room.open.turnId,
      history:room.open.history
    } : null,
    tieInfo:room.status === 'tiebreak' ? room.tieInfo : null,
    card:['bidding', 'tiebreak', 'reveal'].includes(room.status) ? room.cards[room.round] : null,
    footballSlots:room.mode==='football'?SLOTS:null, playerPoolSize:room.mode==='football'?catalog.length:null,
    footballCanBuy:room.mode==='football' && room.cards[room.round] ? Object.fromEntries(room.players.map(p=>[p.id,canAcquire(p,room.cards[room.round])])) : null,
    players:room.players.map(p => ({id:p.id,name:p.name,avatar:p.avatar,avatarColor:p.avatarColor,budget:p.budget,items:p.items,lineup:p.lineup,stats:room.mode==='football'?ratingStats(p):null,hasBid:room.bids.has(p.id),hasVoted:room.votes.has(p.id)})),
    ownId:own.id, ownBid:room.auctionType === 'sealed' && room.bids.has(own.id) ? room.bids.get(own.id) : null,
    lastResult:room.status === 'reveal' ? room.lastResult : null,
    winner:room.status === 'complete' ? room.winner : null,
    votesCast:room.votes.size, updated:room.updated
  };
}
function initialOpen(room) {
  // The starter changes per auction; a player who cannot legally buy the
  // current item is not required to take an empty turn.
  const first=room.players[room.round % 2];
  const other=room.players.find(x=>x.id!==first.id);
  const eligible=p=>room.mode!=='football'||canAcquire(p,room.cards[room.round]);
  room.open={currentBid:0,leaderId:null,turnId:eligible(first)?first.id:other.id,emptyPasses:0,history:[]};
}
function prepareRound(room){
  // Skip irrelevant offers automatically when neither team can use the player.
  if(room.mode==='football'){
    while(room.round<room.cards.length && room.players.every(p=>!canAcquire(p,room.cards[room.round])))room.round++;
  }
  if(room.round>=room.cards.length || (room.mode==='football'&&room.players.every(p=>p.items.length===11))){
    room.status='voting';room.open=null;return;
  }
  room.status='bidding';
  if(room.auctionType==='open')initialOpen(room);
  else if(room.mode==='football'){
    for(const p of room.players)if(!canAcquire(p,room.cards[room.round]))room.bids.set(p.id,0);
  }
}
function advanceRound(room) {
  if (room.status !== 'reveal') return;
  room.round++;
  room.bids.clear();room.lastResult=null;room.tieInfo=null;
  prepareRound(room);
  touch(room);
}
function finishAuction(room, winner, amount, reason, bids=[]) {
  const currentCard=room.cards[room.round];
  if(winner){
    winner.budget -= amount;
    winner.items.push(currentCard);
    if(room.mode==='football')winner.lineup=arrange(winner.items,winner.lineup)||winner.lineup;
  }
  room.lastResult={winnerId:winner?.id||null,winnerName:winner?.name||null,
    winningBid:amount,bids,reason,awards:[],
    history:room.auctionType==='open' ? [...room.open.history] : [],
    tieAmount:room.tieInfo?.amount ?? null};
  room.status='reveal';room.tieInfo=null;
  // The transition is server-driven; no player has to press Next.
  const timer=setTimeout(()=>advanceRound(room), AUTO_NEXT_MS);
  timer.unref();
}
function settleSealed(room) {
  const [a,b]=room.players, aa=room.bids.get(a.id),bb=room.bids.get(b.id);
  if (room.bids.size !== 2) return;
  const bids=room.players.map(p=>({id:p.id,name:p.name,amount:room.bids.get(p.id)}));
  if (aa===bb && aa>0 && room.status==='bidding') {
    // Bei Gleichstand erhält niemand das Item per Zufall.
    // Einmaliges geheimes Stechen ohne Kosten; bei erneutem Gleichstand bleibt es unverkauft.
    room.tieInfo={amount:aa}; room.status='tiebreak'; room.bids.clear();return;
  }
  const winner=aa===bb ? null : (aa>bb?a:b);
  const reason=winner?'win':aa===0?'passed':'double-tie';
  finishAuction(room,winner,winner?room.bids.get(winner.id):0,reason,bids);
}
function touch(room) {room.updated = Date.now(); for(const client of room.clients){const payload=publicState(room,client.token);if(payload){try{client.res.write(`data: ${JSON.stringify(payload)}\n\n`);}catch{room.clients.delete(client);}}} }
function send(res,status,payload){const body=JSON.stringify(payload);res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Content-Length':Buffer.byteLength(body),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(body);}
function error(res,status,message){send(res,status,{error:message});}
function bodyOf(req){return new Promise((resolve,reject)=>{let raw='';req.on('data',ch=>{raw+=ch;if(raw.length>16000){reject(new Error('Anfrage zu groß'));req.destroy();}});req.on('end',()=>{try{resolve(JSON.parse(raw||'{}'));}catch{reject(new Error('Ungültige Daten'));}});req.on('error',reject);});}
function authorizedRoom(code,token,res){const room=rooms.get(code);if(!room){error(res,404,'Dieser Spielraum existiert nicht (mehr).');return null;}if(!room.players.some(p=>p.token===token)){error(res,403,'Du bist nicht in diesem Spielraum angemeldet.');return null;}return room;}
function serveStatic(req,res,pathname){
  const files = {'/':'index.html','/index.html':'index.html','/styles.css':'styles.css','/app.js':'app.js','/favicon.svg':'favicon.svg'};
  const file=files[pathname];if(!file){error(res,404,'Nicht gefunden');return;}
  const ext=path.extname(file);const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml'}[ext];
  fs.readFile(path.join(PUBLIC,file),(err,buf)=>{if(err){error(res,404,'Nicht gefunden');return;}res.writeHead(200,{'Content-Type':mime,'Content-Length':buf.length,'X-Content-Type-Options':'nosniff'});res.end(buf);});
}
// Cache image metadata, not image files. Public Wikimedia thumbnails are linked
// to their original file page so credits and the license remain accessible.
const photoCache = new Map();
async function wikiJSON(host,params){
  const u=new URL(`https://${host}/w/api.php`);
  for(const [k,v] of Object.entries({action:'query',format:'json',formatversion:'2',...params}))u.searchParams.set(k,v);
  const r=await fetch(u,{signal:AbortSignal.timeout(4200),headers:{'User-Agent':'BidBattle-Hobby/1.4 (local game prototype; requests Wikimedia thumbnails)','Accept':'application/json'}});
  if(!r.ok)throw Error('Wikimedia unavailable');return r.json();
}
const validPhotoUrl=url=>typeof url==='string'&&url.startsWith('https://upload.wikimedia.org/');
async function lookupImage(p){
  for(const domain of ['en.wikipedia.org','de.wikipedia.org']){
    try{
      const d=await wikiJSON(domain,{prop:'pageimages',redirects:'1',titles:p.wiki,piprop:'thumbnail|name',pithumbsize:'360',pilicense:'free'});
      const page=d.query?.pages?.[0];const url=page?.thumbnail?.source;
      if(validPhotoUrl(url)&&page.pageimage)return {src:url,source:`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(page.pageimage).replace(/%20/g,'_')}`,provider:'Wikimedia Commons'};
    }catch{}
  }
  // Commons is a second, more expansive source when Wikipedia lacks an image.
  // Use the last name (or distinctive final token) to limit false matches.
  try{
    const d=await wikiJSON('commons.wikimedia.org',{generator:'search',gsrnamespace:'6',gsrlimit:'12',gsrsearch:`intitle:"${p.title}"`,prop:'imageinfo',iiprop:'url|mime|extmetadata',iiurlwidth:'360'});
    const pages=d.query?.pages||[];
    const surname=p.title.split(' ').at(-1).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const candidates=pages.filter(page=>{
      const info=page.imageinfo?.[0];const name=page.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      return info?.mime==='image/jpeg'&&validPhotoUrl(info.thumburl||info.url)&&name.includes(surname);
    });
    const found=candidates.find(x=>/portrait|202[0-9]|head|football|soccer/i.test(x.title))||candidates[0];
    if(found){
      const i=found.imageinfo[0];
      return {src:i.thumburl||i.url,source:i.descriptionurl||`https://commons.wikimedia.org/wiki/${encodeURIComponent(found.title)}`,provider:'Wikimedia Commons'};
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
const server = http.createServer(async(req,res)=>{
  let u;try{u=new URL(req.url,'http://localhost');}catch{return error(res,400,'Ungültige Adresse');}
  const p=u.pathname; if(req.method==='GET' && !p.startsWith('/api/'))return serveStatic(req,res,p);
  if(req.method==='GET' && /^\/api\/photos\/f\d{3}$/.test(p)){
    const player=byId.get(p.split('/').at(-1));
    if(!player)return error(res,404,'Fußballer nicht gefunden.');
    const found=await getImage(player);return send(res,200,found||{});
  }
  try{
    if(req.method==='POST' && p==='/api/rooms'){
      const b=await bodyOf(req);const name=safeName(b.name);if(!name)return error(res,400,'Bitte gib einen Spielernamen ein.');
      if(!Object.hasOwn(LABELS,b.mode))return error(res,400,'Unbekannter Spielmodus.');
      const budget=Number(b.budget);if(b.mode==='football'?![50,75,100].includes(budget):![10,20,30,50].includes(budget))return error(res,400,'Ungültiges Spielbudget für diesen Modus.');
      const auctionType=b.auctionType;if(!['sealed','open'].includes(auctionType))return error(res,400,'Wähle eine Auktionsart.');
      const c=code();const token=crypto.randomBytes(24).toString('hex');const host={id:crypto.randomUUID(),token,name,avatar:safeAvatar(b.avatar),avatarColor:safeColor(b.avatarColor),budget,items:[],lineup:{}};
      const room={code:c,mode:b.mode,startBudget:budget,auctionType,players:[host],cards:b.mode==='football'?createDeck(crypto):shuffle(CATALOG[b.mode]).slice(0,12),round:0,status:'waiting',bids:new Map(),votes:new Map(),lastResult:null,tieInfo:null,open:null,winner:null,clients:new Set(),updated:Date.now()};
      rooms.set(c,room);return send(res,201,{code:c,token,state:publicState(room,token)});
    }
    const match=p.match(/^\/api\/rooms\/([A-Z2-9]{6})(?:\/(join|bid|pass|vote|lineup|events))?$/);
    if(match){
      const [,c,action]=match;
      if(action==='join' && req.method==='POST'){
        const room=rooms.get(c);if(!room)return error(res,404,'Spielraum nicht gefunden.');
        if(room.players.length>=2)return error(res,409,'Dieser Spielraum ist bereits voll.');
        if(room.status!=='waiting')return error(res,409,'Das Spiel hat schon begonnen.');
        const b=await bodyOf(req);const name=safeName(b.name);if(!name)return error(res,400,'Bitte gib einen Spielernamen ein.');
        const token=crypto.randomBytes(24).toString('hex');room.players.push({id:crypto.randomUUID(),token,name,avatar:safeAvatar(b.avatar),avatarColor:safeColor(b.avatarColor),budget:room.startBudget,items:[],lineup:{}});prepareRound(room);touch(room);return send(res,200,{code:c,token,state:publicState(room,token)});
      }
      const token=req.method==='GET'?u.searchParams.get('token'):null;
      if(req.method==='GET' && action==='events'){
        const room=authorizedRoom(c,token,res);if(!room)return;
        res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});
        res.write(`data: ${JSON.stringify(publicState(room,token))}\n\n`);
        const client={res,token};room.clients.add(client);const ping=setInterval(()=>{try{res.write(': heartbeat\n\n');}catch{}},20000);
        req.on('close',()=>{clearInterval(ping);room.clients.delete(client);});return;
      }
      if(req.method==='GET' && !action){const room=authorizedRoom(c,token,res);if(room)return send(res,200,publicState(room,token));return;}
      if(req.method==='POST' && ['bid','pass','vote','lineup'].includes(action)){
        const b=await bodyOf(req),room=authorizedRoom(c,b.token,res);if(!room)return;
        const own=room.players.find(a=>a.token===b.token);
        if(action==='lineup'){
          if(room.mode!=='football'||!['bidding','tiebreak','reveal','voting'].includes(room.status))return error(res,409,'Aufstellung aktuell nicht bearbeitbar.');
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
          if(room.mode==='football' && b.amount>0 && !canAcquire(own,room.cards[room.round]))return error(res,409,'Für diesen Fußballer ist in deiner Mannschaft kein zulässiger Platz mehr frei.');
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
            if(rival.budget<=b.amount || (room.mode==='football'&&!canAcquire(rival,room.cards[room.round]))){finishAuction(room,own,b.amount,'win');}
            else room.open.turnId=rival.id;
          }
          touch(room);return send(res,200,publicState(room,b.token));
        }
        if(action==='pass'){
          if(room.auctionType!=='open'||room.status!=='bidding')return error(res,409,'Passen ist hier nicht möglich.');
          if(room.open.turnId!==own.id)return error(res,409,'Du bist gerade nicht am Zug.');
          room.open.history.push({id:own.id,name:own.name,pass:true});
          if(room.open.leaderId){
            const winner=room.players.find(p=>p.id===room.open.leaderId);
            finishAuction(room,winner,room.open.currentBid,'win');
          } else {
            room.open.emptyPasses++;
            if(room.open.emptyPasses===2){finishAuction(room,null,0,'passed');}
            else room.open.turnId=room.players.find(p=>p.id!==own.id).id;
          }
          touch(room);return send(res,200,publicState(room,b.token));
        }
        if(action==='vote'){
          if(room.status!=='voting')return error(res,409,'Die Abstimmung ist noch nicht geöffnet.');
          if(room.votes.has(own.id))return error(res,409,'Du hast bereits abgestimmt.');
          if(!room.players.some(x=>x.id===b.winnerId))return error(res,400,'Ungültige Auswahl.');
          room.votes.set(own.id,b.winnerId);
          if(room.votes.size===2){const counts=room.players.map(x=>[x.id,[...room.votes.values()].filter(y=>y===x.id).length]);counts.sort((a,b)=>b[1]-a[1]);room.winner=counts[0][1]===counts[1][1]?null:counts[0][0];room.status='complete';}
          touch(room);return send(res,200,publicState(room,b.token));
        }
      }
    }
    return error(res,404,'Unbekannte Anfrage.');
  } catch(e){if(!res.headersSent)error(res,400,e.message||'Fehler bei der Anfrage.');}
});
setInterval(()=>{const now=Date.now();for(const [k,r] of rooms)if(now-r.updated>ROOM_TTL){for(const client of r.clients)client.res.end();rooms.delete(k);}},60*60*1000).unref();
server.listen(PORT,'0.0.0.0',()=>{
  console.log(`BidBattle läuft auf http://localhost:${PORT}`);
  if (process.platform === 'win32' && process.env.BIDBATTLE_OPEN_BROWSER === '1') {
    const {exec} = require('node:child_process');
    exec(`start "" "http://localhost:${PORT}"`, {windowsHide:true}, (err) => {
      if (err) console.log('Bitte öffne die Adresse oben manuell in deinem Browser.');
    });
  }
});
