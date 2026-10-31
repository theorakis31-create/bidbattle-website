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
// Additional verified real-world names. Ratings below are invented BidBattle balance values,
// never official EA FC values. New names are appended to preserve existing IDs.
register('GK','GK',`
Gregor Kobel|86|🇨🇭|
Diogo Costa|85|🇵🇹|
Unai Simón|85|🇪🇸|
Giorgi Mamardashvili|84|🇬🇪|
Lucas Chevalier|83|🇫🇷|
Bart Verbruggen|82|🇳🇱|
Nick Pope|82|🇬🇧|
Matz Sels|82|🇧🇪|
André Onana|81|🇨🇲|
Péter Gulácsi|81|🇭🇺|
Joan García|84|🇪🇸|
Dean Henderson|81|🇬🇧|
Lukáš Hrádecký|81|🇫🇮|
Álex Remiro|82|🇪🇸|
`);
register('DEF','CB',`
Pau Cubarsí|85|🇪🇸|
Dean Huijsen|84|🇪🇸|
Marc Guéhi|83|🇬🇧|
Murillo|83|🇧🇷|Murillo (footballer, born 2002)
Cristian Romero|85|🇦🇷|
Micky van de Ven|85|🇳🇱|
Jarrad Branthwaite|82|🇬🇧|
Wesley Fofana|82|🇫🇷|
Bremer|85|🇧🇷|Bremer (footballer)
Federico Gatti|81|🇮🇹|
Lucas Hernández|82|🇫🇷|
Leny Yoro|82|🇫🇷|
Jorrel Hato|82|🇳🇱|
Willian Pacho|85|🇪🇨|
Robin Le Normand|83|🇪🇸|
Edmond Tapsoba|84|🇧🇫|
Castello Lukeba|82|🇫🇷|
Matthias Ginter|82|🇩🇪|
Luka Vušković|80|🇭🇷|
Dan Burn|80|🇬🇧|
`);
register('DEF','RB',`
Tino Livramento|83|🇬🇧|
Reece James|84|🇬🇧|
Malo Gusto|82|🇫🇷|
Ben White|83|🇬🇧|
Denzel Dumfries|84|🇳🇱|
Giovanni Di Lorenzo|82|🇮🇹|
Kyle Walker|80|🇬🇧|
Kieran Trippier|80|🇬🇧|
Marcos Llorente|83|🇪🇸|
Yan Couto|80|🇧🇷|
`);
register('DEF','LB',`
Miloš Kerkez|83|🇭🇺|
Patrick Dorgu|80|🇩🇰|
Riccardo Calafiori|83|🇮🇹|
Destiny Udogie|83|🇮🇹|
Marc Cucurella|84|🇪🇸|
Alejandro Grimaldo|85|🇪🇸|
Antonee Robinson|82|🇺🇸|
Rayan Aït-Nouri|83|🇩🇿|
Miguel Gutiérrez|81|🇪🇸|
Maxim De Cuyper|80|🇧🇪|
`);
register('MID','CM',`
Angelo Stiller|84|🇩🇪|
Aleksandar Pavlović|83|🇩🇪|
Tijjani Reijnders|86|🇳🇱|
Exequiel Palacios|82|🇦🇷|
Sandro Tonali|85|🇮🇹|
Adam Wharton|82|🇬🇧|
Kobbie Mainoo|81|🇬🇧|
Manuel Locatelli|82|🇮🇹|
Ryan Gravenberch|85|🇳🇱|
Rodrigo De Paul|83|🇦🇷|
Yunus Musah|80|🇺🇸|
Morten Hjulmand|83|🇩🇰|
John McGinn|82|🏴|
Pascal Groß|81|🇩🇪|
Dominik Szoboszlai|85|🇭🇺|
Morgan Gibbs-White|83|🇬🇧|
Khephren Thuram|82|🇫🇷|
Hakan Çalhanoğlu|85|🇹🇷|
Rico Lewis|80|🇬🇧|
`);
register('MID','DM',`
Moisés Caicedo|87|🇪🇨|
Amadou Onana|83|🇧🇪|
João Palhinha|82|🇵🇹|
Youssouf Fofana|82|🇫🇷|
Mats Wieffer|81|🇳🇱|
`);
register('MID','AM',`
Arda Güler|85|🇹🇷|
Michael Olise|89|🇫🇷|
Xavi Simons|85|🇳🇱|
Rayan Cherki|86|🇫🇷|
Morgan Rogers|85|🇬🇧|
Isco|83|🇪🇸|
Dani Olmo|85|🇪🇸|
Eberechi Eze|85|🇬🇧|
Phil Foden|86|🇬🇧|
James Maddison|82|🇬🇧|
`);
register('ATT','RW',`
Christian Pulisic|85|🇺🇸|
Leroy Sané|84|🇩🇪|
Takefusa Kubo|83|🇯🇵|
Savinho|82|🇧🇷|
Francisco Conceição|82|🇵🇹|
Pedro Neto|83|🇵🇹|
Noni Madueke|82|🇬🇧|
Antoine Semenyo|83|🇬🇭|
Riyad Mahrez|81|🇩🇿|
`);
register('ATT','LW',`
Alejandro Garnacho|82|🇦🇷|
Kaoru Mitoma|82|🇯🇵|
Jérémy Doku|84|🇧🇪|
Jamie Gittens|81|🇬🇧|
Kenan Yıldız|85|🇹🇷|
Sadio Mané|82|🇸🇳|
Bradley Barcola|85|🇫🇷|
Cody Gakpo|83|🇳🇱|
Désiré Doué|86|🇫🇷|
Ansu Fati|80|🇪🇸|
`);
register('ATT','ST',`
Alexander Sørloth|83|🇳🇴|
Benjamin Šeško|83|🇸🇮|
Ollie Watkins|84|🇬🇧|
Liam Delap|80|🇬🇧|
Hugo Ekitiké|84|🇫🇷|
Omar Marmoush|84|🇪🇬|
Nicolas Jackson|81|🇸🇳|
Dominic Solanke|82|🇬🇧|
Serhou Guirassy|85|🇬🇳|
Dušan Vlahović|83|🇷🇸|
Matheus Cunha|84|🇧🇷|
Mateo Retegui|83|🇮🇹|
João Pedro|84|🇧🇷|João Pedro (footballer, born 2001)
Patrik Schick|83|🇨🇿|
Nick Woltemade|83|🇩🇪|
Santiago Giménez|81|🇲🇽|
Viktor Boniface|81|🇳🇬|
Romelu Lukaku|82|🇧🇪|
`);
const byId=new Map(catalog.map(x=>[x.id,x]));
function shuffle(input,crypto){const arr=[...input];for(let i=arr.length-1;i>0;i--){const j=crypto.randomInt(i+1);[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
function createDeck(crypto, avoidIds=new Set()) {
  // Keep every role well represented, while avoiding names seen in recent matches.
  // If a position is short of fresh candidates, fall back to the complete pool.
  const pick=(pool,n)=>{
    const fresh=shuffle(pool.filter(p=>!avoidIds.has(p.id)),crypto);
    const stale=shuffle(pool.filter(p=>avoidIds.has(p.id)),crypto);
    return [...fresh,...stale].slice(0,n);
  };
  const chosen=[...pick(catalog.filter(p=>p.group==='GK'),5),
    ...pick(catalog.filter(p=>p.role==='RB'),3),
    ...pick(catalog.filter(p=>p.role==='LB'),3),
    ...pick(catalog.filter(p=>p.role==='CB'),7),
    ...pick(catalog.filter(p=>p.group==='MID'),13),
    ...pick(catalog.filter(p=>p.group==='ATT'),13)];
  // Shuffle all 44 offers. A GK can appear early, middle or late.
  return shuffle(chosen,crypto);
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
