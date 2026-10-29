'use strict';
// These are ORIGINAL, approximate BidBattle game ratings, not licensed EA FC ratings.
// role = preferred position, allowed = positions in this game's flexible 4-3-3.
const SLOTS = [
  {id:'LW',label:'LA'},{id:'ST',label:'ST'},{id:'RW',label:'RA'},
  {id:'CM1',label:'ZM'},{id:'CM2',label:'ZM'},{id:'CM3',label:'ZM'},
  {id:'LB',label:'LV'},{id:'CB1',label:'IV'},{id:'CB2',label:'IV'},{id:'RB',label:'RV'},
  {id:'GK',label:'TW'}
];
const CM=['CM1','CM2','CM3'];
const DEF=['LB','CB1','CB2','RB'];
const catalog=[];
function register(section,role,rows){
  for(const line of rows.trim().split('\n')){
    const [name,ratingStr,flag,wiki]=line.split('|').map(x=>x.trim());
    const rating=Number(ratingStr);
    const allowed=role==='GK'?['GK']:
      role==='CB'?['CB1','CB2',...CM]:
      role==='RB'?['RB',...CM]:
      role==='LB'?['LB',...CM]:
      role==='CM'?CM:
      role==='DM'?[...CM,'CB1','CB2']:
      role==='AM'?[...CM,'LW','RW']:
      role==='RW'?['RW','LW','ST']:
      role==='LW'?['LW','RW','ST']:
      role==='ST'?['ST','LW','RW'] : [];
    const titles={GK:'Torwart',CB:'Innenverteidiger',RB:'Rechtsverteidiger',LB:'Linksverteidiger',CM:'Zentrales Mittelfeld',DM:'Defensives Mittelfeld',AM:'Offensives Mittelfeld',RW:'Rechtsaußen',LW:'Linksaußen',ST:'Stürmer'};
    catalog.push({id:`f${String(catalog.length+1).padStart(3,'0')}`,title:name,role,type:titles[role],group:section,rating,flag,eligible:allowed,emoji:'⚽',wiki:wiki||name,detail:`${flag} ${titles[role]} · BidBattle-Rating ${rating}`});
  }
}
register('GK','GK',`
Alisson Becker|89|🇧🇷|Alisson Becker
Thibaut Courtois|90|🇧🇪|
Gianluigi Donnarumma|90|🇮🇹|
Ederson|87|🇧🇷|Ederson (footballer, born 1993)
Marc-André ter Stegen|85|🇩🇪|
Emiliano Martínez|86|🇦🇷|Emiliano Martínez
Mike Maignan|86|🇫🇷|
Manuel Neuer|83|🇩🇪|
Yann Sommer|83|🇨🇭|
David Raya|85|🇪🇸|
Jan Oblak|86|🇸🇮|
Bernd Leno|81|🇩🇪|
Kepa Arrizabalaga|80|🇪🇸|
`);
register('DEF','CB',`
Virgil van Dijk|90|🇳🇱|
Rúben Dias|88|🇵🇹|
William Saliba|88|🇫🇷|
Antonio Rüdiger|87|🇩🇪|
Gabriel Magalhães|87|🇧🇷|Gabriel Magalhães
Alessandro Bastoni|87|🇮🇹|
Marquinhos|86|🇧🇷|Marquinhos (footballer, born 1994)
Ronald Araújo|84|🇺🇾|
Jonathan Tah|84|🇩🇪|
Kim Min-jae|84|🇰🇷|
Ibrahima Konaté|84|🇫🇷|
Matthijs de Ligt|84|🇳🇱|
Dayot Upamecano|83|🇫🇷|
Nico Schlotterbeck|85|🇩🇪|
Aymeric Laporte|82|🇪🇸|
Nathan Aké|82|🇳🇱|
Éder Militão|85|🇧🇷|
Harry Maguire|80|🇬🇧|
Milan Škriniar|81|🇸🇰|
`);
register('DEF','RB',`
Achraf Hakimi|89|🇲🇦|
Trent Alexander-Arnold|86|🇬🇧|
Dani Carvajal|83|🇪🇸|
Jeremie Frimpong|85|🇳🇱|
Jules Koundé|86|🇫🇷|
Pedro Porro|83|🇪🇸|
Noussair Mazraoui|81|🇲🇦|
`);
register('DEF','LB',`
Theo Hernández|87|🇫🇷|
Alphonso Davies|85|🇨🇦|
Nuno Mendes|87|🇵🇹|
Alejandro Balde|83|🇪🇸|
Andrew Robertson|82|🇬🇧|
Federico Dimarco|85|🇮🇹|
Piero Hincapié|83|🇪🇨|
Luke Shaw|80|🇬🇧|
`);
register('MID','CM',`
Jude Bellingham|90|🇬🇧|
Kevin De Bruyne|88|🇧🇪|
Pedri|89|🇪🇸|
Federico Valverde|89|🇺🇾|
Nicolò Barella|87|🇮🇹|
Alexis Mac Allister|85|🇦🇷|
Bruno Fernandes|87|🇵🇹|
Martin Ødegaard|87|🇳🇴|
Bernardo Silva|86|🇵🇹|
Enzo Fernández|84|🇦🇷|
Vitinha|88|🇵🇹|Vitinha (footballer, born February 2000)
Gavi|84|🇪🇸|
Eduardo Camavinga|85|🇫🇷|
João Neves|85|🇵🇹|João Neves (footballer, born 2004)
Frenkie de Jong|86|🇳🇱|
Fermín López|82|🇪🇸|
Scott McTominay|83|🇬🇧|
Conor Gallagher|81|🇬🇧|
Leon Goretzka|81|🇩🇪|
`);
register('MID','DM',`
Rodri|90|🇪🇸|Rodri (footballer, born 1996)
Declan Rice|88|🇬🇧|
Joshua Kimmich|86|🇩🇪|
Aurélien Tchouaméni|85|🇫🇷|
Martín Zubimendi|85|🇪🇸|
Granit Xhaka|83|🇨🇭|
`);
register('MID','AM',`
Florian Wirtz|89|🇩🇪|
Jamal Musiala|89|🇩🇪|
Cole Palmer|88|🇬🇧|
`);
register('ATT','RW',`
Lionel Messi|87|🇦🇷|
Mohamed Salah|90|🇪🇬|
Lamine Yamal|89|🇪🇸|
Bukayo Saka|88|🇬🇧|
Raphinha|88|🇧🇷|
Rodrygo|85|🇧🇷|
Ousmane Dembélé|89|🇫🇷|
Donyell Malen|82|🇳🇱|
Bryan Mbeumo|84|🇨🇲|
Antony|81|🇧🇷|Antony (footballer, born 2000)
`);
register('ATT','LW',`
Vinícius Júnior|90|🇧🇷|
Khvicha Kvaratskhelia|87|🇬🇪|
Rafael Leão|85|🇵🇹|
Nico Williams|85|🇪🇸|
Luis Díaz|85|🇨🇴|
Heung-min Son|85|🇰🇷|Son Heung-min
Ademola Lookman|84|🇳🇬|
Gabriel Martinelli|83|🇧🇷|
Marcus Rashford|82|🇬🇧|
Jack Grealish|81|🇬🇧|
`);
register('ATT','ST',`
Kylian Mbappé|92|🇫🇷|
Erling Haaland|91|🇳🇴|
Harry Kane|90|🇬🇧|
Cristiano Ronaldo|85|🇵🇹|
Robert Lewandowski|87|🇵🇱|
Lautaro Martínez|88|🇦🇷|
Alexander Isak|87|🇸🇪|
Victor Osimhen|86|🇳🇬|
Viktor Gyökeres|87|🇸🇪|
Antoine Griezmann|85|🇫🇷|
Julián Álvarez|86|🇦🇷|
Jonathan David|83|🇨🇦|
Loïs Openda|82|🇧🇪|
Rasmus Højlund|81|🇩🇰|
`);
const byId=new Map(catalog.map(x=>[x.id,x]));
function shuffle(input,crypto){const arr=[...input];for(let i=arr.length-1;i>0;i--){const j=crypto.randomInt(i+1);[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
function createDeck(crypto){
 // 44 offers per match, randomly chosen from a much larger pool. All positions
 // can arrive at any point in the draft, rather than GK -> DEF -> MID -> ATT.
 const chosen=[...shuffle(catalog.filter(p=>p.group==='GK'),crypto).slice(0,5),...shuffle(catalog.filter(p=>p.role==='RB'),crypto).slice(0,3),...shuffle(catalog.filter(p=>p.role==='LB'),crypto).slice(0,3),...shuffle(catalog.filter(p=>p.role==='CB'),crypto).slice(0,7),...shuffle(catalog.filter(p=>p.group==='MID'),crypto).slice(0,13),...shuffle(catalog.filter(p=>p.group==='ATT'),crypto).slice(0,13)];
 // Mix the order but avoid a match with no GK until the very end.
 const groups={GK:[],DEF:[],MID:[],ATT:[]};
 for(const x of chosen)groups[x.group].push(x);
 for(const key of Object.keys(groups))groups[key]=shuffle(groups[key],crypto);
 const deck=[];
 while(deck.length<chosen.length){
   const valid=Object.keys(groups).filter(g=>groups[g].length && !deck.slice(-3).every(x=>x?.group===g));
   const candidates=valid.length?valid:Object.keys(groups).filter(g=>groups[g].length);
   const bucket=candidates[crypto.randomInt(candidates.length)];deck.push(groups[bucket].pop());
 }
 return deck;
}
// Maximum bipartite match ensures every purchased player can ultimately occupy
// a legal 4-3-3 slot, regardless of the manual current lineup arrangement.
function arrange(items,preferred={}){
  const result={};const assigned=new Set();
  for(const [slot,id] of Object.entries(preferred)){
    const p=items.find(x=>x.id===id);
    if(SLOTS.some(s=>s.id===slot)&&p?.eligible.includes(slot)&&!assigned.has(id)){
      result[slot]=id;assigned.add(id);
    }
  }
  function assign(p,seen){
    for(const slot of p.eligible){
      if(seen.has(slot))continue;seen.add(slot);
      if(!result[slot]){result[slot]=p.id;return true;}
      const displaced=items.find(x=>x.id===result[slot]);
      if(displaced && displaced.id!==p.id && assign(displaced,seen)){result[slot]=p.id;return true;}
    }
    return false;
  }
  // Rebuild for nonpreferred players; preferred positions will be kept when possible.
  for(const p of items)if(!assigned.has(p.id) && !assign(p,new Set()))return null;
  return result;
}
function canAcquire(player,card){return player.budget>=1 && player.items.length<11 && arrange([...player.items,card],player.lineup)!==null;}
function ratingStats(player){const total=player.items.reduce((s,p)=>s+p.rating,0);return {count:player.items.length,total,average:player.items.length?Number((total/player.items.length).toFixed(1)):0};}
module.exports={SLOTS,catalog,byId,createDeck,arrange,canAcquire,ratingStats};
