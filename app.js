'use strict';
(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  const names = {food:'Food Battle',football:'Football Draft',hero:'Superhero Showdown',random:'Random Battle'};
  const modeIcons = {food:'🍔',football:'⚽',hero:'🦸',random:'🎲'};
  let session = null;
  let current = null;
  let events = null;
  let toastTimer = null;
  let requestPending = false;
  let lastWinnerCelebrated = null;
  let editorOpen = false;
  const AVATARS = ['🙂','😎','🤩','🐼','🦊','🐯','🐱','🐸','🦄','🤖','👽','🐧'];
  const COLORS = ['lilac','blue','peach','mint','pink','yellow'];
  const photoCache = new Map();
  const savedAvatar = () => AVATARS.includes(localStorage.getItem('bidbattle-avatar')) ? localStorage.getItem('bidbattle-avatar') : '🙂';
  const savedColor = () => COLORS.includes(localStorage.getItem('bidbattle-avatar-color')) ? localStorage.getItem('bidbattle-avatar-color') : 'lilac';
  let chosenAvatar = savedAvatar();
  let chosenColor = savedColor();

  const escape = value => String(value??'').replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const savedName = () => localStorage.getItem('bidbattle-name') || '';
  function notify(message) {const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3500);}
  function openDialog(id){renderPickers();const dialog=$(`#${id}`);if(!dialog.open)dialog.showModal();}
  function closeDialogs(){$$('dialog').forEach(d=>{if(d.open)d.close();});}
  function persistName(value) {
    localStorage.setItem('bidbattle-name',value.trim());
    localStorage.setItem('bidbattle-avatar',chosenAvatar);
    localStorage.setItem('bidbattle-avatar-color',chosenColor);
    $('#profileLabel').textContent=value.trim() || 'Mein Name';
    $('#headerAvatar').textContent=chosenAvatar;
    $('#headerAvatar').className=`profile-icon avatar-${chosenColor}`;
  }
  function renderPickers(){
    $$('.avatar-picker').forEach(picker=>{
      picker.querySelectorAll('[data-avatar-choice]').forEach(btn=>{const on=btn.dataset.avatarChoice===chosenAvatar;btn.classList.toggle('selected',on);btn.setAttribute('aria-pressed',String(on));});
      picker.querySelectorAll('[data-color-choice]').forEach(btn=>{const on=btn.dataset.colorChoice===chosenColor;btn.classList.toggle('selected',on);btn.setAttribute('aria-pressed',String(on));});
    });
  }
  function setupAvatarPickers(){
    const html=`<div class="avatar-picker"><label>Wähle deinen Avatar</label><div class="avatar-options">${AVATARS.map(a=>`<button type="button" data-avatar-choice="${a}" title="Avatar ${a}" aria-label="Avatar ${a}">${a}</button>`).join('')}</div><label>Avatar-Farbe</label><div class="avatar-colors">${COLORS.map(c=>`<button type="button" data-color-choice="${c}" class="avatar-color avatar-${c}" aria-label="Farbe ${c}"></button>`).join('')}</div></div>`;
    ['#createName','#joinName','#profileName'].forEach(id=>$(id).insertAdjacentHTML('afterend',html));
    $$('[data-avatar-choice]').forEach(btn=>btn.addEventListener('click',()=>{chosenAvatar=btn.dataset.avatarChoice;renderPickers();}));
    $$('[data-color-choice]').forEach(btn=>btn.addEventListener('click',()=>{chosenColor=btn.dataset.colorChoice;renderPickers();}));
    renderPickers();
  }
  function updateHeader(){
    const isGame=!$('#gameView').classList.contains('hidden');
    const cta=$('.header-cta');
    cta.innerHTML=isGame?'⌂ Startseite':session && current?'↩ Zurück zum Duell':'Jetzt spielen ↗';
    cta.dataset.headerAction=isGame?'home':session && current?'game':'create';
  }
  function createModal(mode){$('#createName').value=savedName();if(mode && names[mode])$('#createMode').value=mode;updateBudgetOptions();openDialog('createDialog');}
  function joinModal(code){$('#joinName').value=savedName();$('#joinCode').value=code||'';openDialog('joinDialog');}
  async function request(url, method='GET', payload){
    let res;
    try{res=await fetch(url,{method,headers:{'Content-Type':'application/json'},body:payload?JSON.stringify(payload):undefined,cache:'no-store'});}
    catch {throw Error('Keine Verbindung zum Spielserver. Läuft die Website über „node server.js“?');}
    let body;try{body=await res.json();}catch{throw Error('Der Server hat unerwartet geantwortet.');}
    if(!res.ok)throw Error(body.error||'Da ist etwas schiefgegangen.');
    return body;
  }
  function saveSession(obj){session={code:obj.code,token:obj.token};sessionStorage.setItem('bidbattle-session',JSON.stringify(session));}
  function showHome(){ $('#homeView').classList.remove('hidden');$('#gameView').classList.add('hidden');window.scrollTo({top:0,behavior:'smooth'});history.replaceState({},'',location.pathname);updateHeader();}
  function showGame(){ $('#homeView').classList.add('hidden');$('#gameView').classList.remove('hidden');window.scrollTo(0,0);if(session)history.replaceState({},'',`?room=${session.code}`);updateHeader();}
  function stopEvents(){if(events){events.close();events=null;}}
  function connect(){
    stopEvents();if(!session)return;
    events=new EventSource(`/api/rooms/${session.code}/events?token=${encodeURIComponent(session.token)}`);
    events.onmessage=e=>{try{current=JSON.parse(e.data);render();}catch(err){console.warn(err);}};
    events.onerror=()=>{ /* EventSource retries automatically */ };
  }
  async function refresh(){if(!session)return;current=await request(`/api/rooms/${session.code}?token=${encodeURIComponent(session.token)}`);render();}
  async function enter(info){saveSession(info);current=info.state;closeDialogs();showGame();render();connect();}
   function auctionName(){return current.auctionType==='open'?'👀 Offen überbieten':'🙈 Blind bieten';}
   function header(){return `<h1 class="game-title">${modeIcons[current.mode]} ${escape(current.modeLabel)}</h1><p class="game-subtitle">Spielraum <strong>${current.code}</strong> · ${current.budget} € virtuelles Startbudget · 1 gegen 1</p><div class="game-settings-tag">${auctionName()}</div>`;}
  function players(){return current.players;}
  function me(){return players().find(p=>p.id===current.ownId);}
  function other(){return players().find(p=>p.id!==current.ownId);}
  function shareLink(){return `${location.origin}${location.pathname}?room=${current.code}`;}
   // Player portraits are loaded through our server with Wikimedia fallback.
   function portrait(player, variant='tiny') {
     if(!player)return `<span class="empty-pitch-player">＋</span>`;
     return `<span class="wiki-portrait portrait-${variant}" data-photo-id="${escape(player.id)}" title="${escape(player.title)} (${player.rating})"><span class="portrait-placeholder">${escape(player.flag||'⚽')}</span><b class="portrait-rating">${player.rating}</b></span>`;
   }
   const LINES=[['LW','ST','RW'],['CM1','CM2','CM3'],['LB','CB1','CB2','RB'],['GK']];
   const SHORT={LW:'LA',ST:'ST',RW:'RA',CM1:'ZM',CM2:'ZM',CM3:'ZM',LB:'LV',CB1:'IV',CB2:'IV',RB:'RV',GK:'TW'};
   function pitch(items, compact=false, lineup={}) {
     const playersById=Object.fromEntries(items.map(p=>[p.id,p]));
     const content=LINES.map(slots=>`<div class="pitch-line">${slots.map(slot=>{
       const player=playersById[lineup[slot]];
       return `<div class="pitch-person">${portrait(player,compact?'mini':'pitch')}<span>${player?escape(player.title.split(' ').slice(-1)[0]):SHORT[slot]}</span><small>${player?`${player.rating} · ${SHORT[slot]}`:'frei'}</small></div>`;
     }).join('')}</div>`).join('');
     return `<div class="soccer-pitch ${compact?'pitch-small':''}" aria-label="4-3-3, ${items.length} von 11 Positionen besetzt"><span class="pitch-center-line"></span><span class="pitch-circle"></span>${content}</div>`;
   }
   function inventory(items,lineup={}){
     if(current.mode==='football') {
       const average=items.length?`${(items.reduce((t,p)=>t+p.rating,0)/items.length).toFixed(1)} Ø`: 'Noch kein Rating';
       return `<div class="football-roster-title">⚽ ${items.length}/11 Spieler · ${average}</div>${pitch(items,true,lineup)}`;
     }
     let entries=items.slice(-12).map(x=>`<span class="inventory-item" title="${escape(x.title)}" aria-label="${escape(x.title)}">${escape(x.emoji)}</span>`).join('');
     const spaces=Math.max(0,4-Math.min(4,items.length));entries+=Array.from({length:spaces},()=>'<span class="inventory-item inventory-empty" aria-hidden="true">＋</span>').join('');
     return `<div class="inventory-grid">${entries}</div>`;
   }
   function lineupEditor(p){
     if(current.mode!=='football'||!p.items.length||current.status==='complete')return '';
     const slots=current.footballSlots||[];
     const controls=p.items.map(player=>{
       const currentSlot=Object.keys(p.lineup||{}).find(k=>p.lineup[k]===player.id);
       return `<label class="squad-edit-row">${portrait(player,'tiny')}<span class="squad-edit-name"><b>${escape(player.title)}</b><small>${escape(player.type)} · ${player.rating} OVR</small></span><select data-assign-player="${escape(player.id)}" aria-label="Position von ${escape(player.title)} ändern">${slots.filter(slot=>player.eligible.includes(slot.id)).map(slot=>`<option value="${slot.id}" ${currentSlot===slot.id?'selected':''}>${slot.label}${['CM1','CM2','CM3','CB1','CB2'].includes(slot.id)?` ${slot.id.slice(-1)}`:''}</option>`).join('')}</select></label>`;
     }).join('');
     return `<details class="squad-editor" ${editorOpen||current.status==='voting'?'open':''}><summary>🧩 Meine Aufstellung bearbeiten <span>${p.items.length}/11 · 4-3-3</span></summary><p>Wähle für jeden gekauften Fußballer seine Position. Ein IV darf auch ins ZM, aber kein Feldspieler ins Tor. Besetzte Plätze werden, sofern möglich, automatisch getauscht.</p><div class="squad-edit-grid">${controls}</div></details>`;
   }
   function playerPanel(player,index){
     let status='';
     if(current.status==='bidding' || current.status==='tiebreak') {
       if(current.auctionType==='open')status=current.open?.turnId===player.id?'👀 Ist am Zug':'Wartet auf den nächsten Zug';
       else status=player.hasBid?'✅ Gebot abgegeben':'⏳ Überlegt noch …';
     }
     return `<section class="player-panel ${index===1?'second':''}"><div class="player-avatar avatar-${escape(player.avatarColor)}" aria-hidden="true">${escape(player.avatar)}</div><div class="player-name">${escape(player.name)} ${player.id===current.ownId?'<span class="you-tag">DU</span>':''}</div><div class="player-budget"><b>${player.budget} €</b><small>Restbudget</small></div><div class="inventory-title">${current.mode==='football'?'Aufstellung':'Gesammelte Items'} (${player.items.length}${current.mode==='football'?'/11':''})</div>${inventory(player.items,player.lineup)}<div class="waiting-status">${status}</div></section>`;
   }
   function waitingScreen(){return `<div class="game-shell">${header()}<section class="waiting-card"><div class="waiting-icon">🎉</div><h2>Dein Spielraum ist bereit!</h2><p class="muted">Jetzt fehlt nur noch dein Mitspieler. Teile den Code oder den Einladungslink.</p><div class="waiting-rules"><strong>Spielregeln:</strong> ${current.auctionType==='open'?'Offenes Überbieten in abwechselnden Zügen. Nur der Sieger zahlt.':'Verdeckte Gebote. Bei gleichem positiven Gebot gibt es einmal ein geheimes Stechen.'}${current.mode==='football'?` Im Football Draft gibt es 44 zufällig zusammengestellte Auktionen aus ${current.playerPoolSize} Fußballern. Nur Auktionsgewinner erhalten Spieler; Passen ist jederzeit möglich. Beide können maximal elf Spieler ersteigern.`:''}</div><div class="invite-code">${current.code}</div><div class="invite-actions"><button class="btn btn-primary" type="button" data-copy="code">📋 Code kopieren</button><button class="btn btn-white" type="button" data-copy="link">🔗 Link kopieren</button></div><p class="muted">Warten auf Spieler 2 <span class="waiting-dots"><i></i><i></i><i></i></span></p><div class="waiting-tip">💡 Teste das Duell mit einem anderen Browser oder privaten Fenster. Jede Browser-Sitzung ist ein Spieler.</div></section></div>`;}
   function bidControls(){
     if(current.auctionType==='open')return openBidControls();
     const player=me();
     const extra=current.status==='tiebreak'?`<div class="tie-alert"><span>🤝</span><div><strong>Gleichstand bei ${current.tieInfo.amount} €!</strong><p>Jetzt folgt ein einmaliges geheimes Stechen. Ihr könnt frei neu bieten (0 bis Restbudget). Bei erneutem Gleichstand erhält niemand das Item – ohne Kosten.</p></div></div>`:'';
     if(player.hasBid)return `${extra}<div class="bid-locked"><span>🔒</span>Dein ${current.status==='tiebreak'?'Stechgebot':'Gebot'} ist gespeichert!<p class="muted" style="margin:5px 0 0;font-weight:500">Warte auf das Gebot des anderen Spielers.</p></div>`;
     return `${extra}<form id="bidForm" class="bid-box"><label for="bidAmount">${current.status==='tiebreak'?'Dein neues Stechgebot':'Wie viel ist dir dieses Item wert?'}</label><div class="bid-input-line"><input id="bidAmount" name="bidAmount" type="number" min="0" max="${player.budget}" step="1" inputmode="numeric" value="${Math.min(2,player.budget)}" required aria-label="Dein verdecktes Gebot in Euro"><span class="currency">€</span></div><div class="bid-presets"><button type="button" data-plus="1">+1 €</button><button type="button" data-plus="3">+3 €</button><button type="button" data-plus="5">+5 €</button></div><div class="bid-actions"><button type="button" class="btn btn-white" data-pass>Passen</button><button type="submit" class="btn btn-primary" id="bidSubmit">${current.status==='tiebreak'?'Stechgebot abgeben':'Gebot abgeben'} →</button></div><div class="bid-hint">🔒 Dein Gebot bleibt geheim, bis beide fertig sind. Nur der Gewinner zahlt.</div></form>`;
   }
   function openBidControls(){
     const bid=current.open, mine=me(), active=bid.turnId===mine.id;
     const canBuy=current.mode!=='football'||current.footballCanBuy?.[mine.id];
     const leader=players().find(p=>p.id===bid.leaderId);
     const turn=players().find(p=>p.id===bid.turnId);
     const min=bid.currentBid+1;
     const previous=bid.history.slice(-5).reverse().map(h=>`<div class="auction-history-row"><span>${escape(h.name)}</span><b>${h.pass?'Passt':`${h.amount} €`}</b></div>`).join('');
     const headline=`<div class="open-current"><span>AKTUELLES GEBOT</span><strong>${bid.currentBid?`${bid.currentBid} €`:'Noch kein Gebot'}</strong><small>${leader?`${escape(leader.name)} führt`:'Starte die Auktion!'}</small></div>`;
     let controls='';
     if(!active){controls=`<div class="bid-locked"><span>⏳</span>${escape(turn?.name||'Der andere Spieler')} ist gerade am Zug.<p class="muted" style="margin-top:6px">Wenn das aktuelle Gebot überboten wird, kannst du reagieren.</p></div>`;}
     else if(min>mine.budget || !canBuy){controls=`<div class="open-turn-note">Du kannst diesen Spieler derzeit nicht mehr kaufen (Budget oder zulässige Aufstellungsplätze).</div><button class="btn btn-primary btn-full" type="button" data-open-pass>Jetzt passen →</button>`;}
     else {controls=`<form id="bidForm" class="bid-box"><label for="bidAmount">Du bist am Zug! Biete mindestens ${min} €.</label><div class="bid-input-line"><input id="bidAmount" name="bidAmount" type="number" min="${min}" max="${mine.budget}" step="1" value="${min}" inputmode="numeric" required><span class="currency">€</span></div><div class="bid-presets"><button type="button" data-plus="1">+1 €</button><button type="button" data-plus="3">+3 €</button><button type="button" data-plus="5">+5 €</button></div><div class="bid-actions"><button type="button" class="btn btn-white" data-open-pass>Passen</button><button type="submit" class="btn btn-primary">Jetzt überbieten →</button></div><div class="bid-hint">👀 Alle sehen das aktuelle Gebot sofort. Nur der Auktionsgewinner zahlt.</div></form>`;}
     return `${headline}${controls}${previous?`<div class="auction-history"><b>Letzte Aktionen</b>${previous}</div>`:''}`;
   }
   function reveal(){
     const r=current.lastResult;
     let title,desc,icon;
     if(r.reason==='double-tie') {icon='🤝';title='Auch das Stechen ist unentschieden!';desc='Niemand zahlt.';}
     else if(r.reason==='passed') {icon='⏭️';title='Niemand wollte das Item';desc='Niemand zahlt.';}
     else {icon='🏆';title=`${escape(r.winnerName)} gewinnt die Auktion!`;desc=`Gewonnen für ${r.winningBid} € Spielgeld.`;}
     const details=current.auctionType==='sealed'
       ?`<div class="reveal-bids">${r.bids.map(x=>`<div>${escape(x.name)}<b>${x.amount} €</b></div>`).join('')}</div>`
       :`<div class="auction-history"><b>Gebotsverlauf</b>${r.history.map(x=>`<div class="auction-history-row"><span>${escape(x.name)}</span><strong>${x.pass?'Passt':`${x.amount} €`}</strong></div>`).join('')}</div>`;
     const football='';
     return `<div class="reveal-banner"><span style="font-size:31px">${icon}</span><strong>${title}</strong><small>${desc}</small></div>${football}${details}<div class="auto-next">⏩ Nächste ${current.round===current.total-1?'Phase':'Auktion'} startet automatisch …</div>`;
   }
   function auctionScreen(){
     const isFootball=current.mode==='football';
     const photo=isFootball?portrait(current.card,'main'):`<div class="auction-item" aria-hidden="true">${escape(current.card.emoji)}</div>`;
     const alternates=isFootball?`<div class="football-options"><div class="football-option-info">🎯 <b>Freie Wahl:</b> Biete nur auf Spieler, die du wirklich möchtest. Ohne Zuschlag kein Spieler und keine Kosten.</div><div class="football-rating-tip">${current.card.flag} <b>${current.card.rating} OVR</b> · ${escape(current.card.type)} <small>Eigene BidBattle-Spielwerte – keine EA-FC-Ratings</small></div></div>`:'';
     return `<div class="game-shell">${header()}<div class="round-progress"><strong>🔨 ${isFootball?'Fußballer':'Auktion'} ${current.round+1} von ${current.total}</strong><div class="progress-track"><div class="progress-fill" style="width:${((current.round+1)/current.total)*100}%"></div></div><span class="muted" style="font-size:12px">${current.total-current.round-1} danach</span></div><div class="duel-layout">${playerPanel(players()[0],0)}<section class="auction-panel"><span class="auction-label">${escape(current.card.type)} · ${current.status==='reveal'?'ERGEBNIS':current.status==='tiebreak'?'STECHEN':'JETZT BIETEN'}</span>${photo}<h2>${escape(current.card.title)}</h2><p class="item-detail">${escape(current.card.detail)}</p>${current.status==='reveal'?reveal():alternates+bidControls()}</section>${playerPanel(players()[1],1)}</div>${isFootball?`<div class="photo-credit-note">Porträts, falls verfügbar: Wikimedia Commons. Über ⓘ gelangst du zu Urheber und Lizenz. Die Ratings sind eigene Spielwerte.</div>${lineupEditor(me())}`:''}</div>`;
   }
   function summaryPlayer(p){
     const face=`<div class="summary-emoji avatar-${escape(p.avatarColor)}">${escape(p.avatar)}</div>`;
     const content=current.mode==='football'?`<div class="full-pitch-wrap">${pitch(p.items,false,p.lineup)}</div><div class="roster-list">${p.items.map(x=>`<div>${portrait(x,'tiny')}<span>${escape(x.title)}</span><small>${x.rating} OVR · ${escape(x.type)}</small></div>`).join('')}</div>`
       :`<div class="summary-items">${p.items.length?p.items.map(x=>`<span title="${escape(x.title)}">${escape(x.emoji)}</span>`).join(''):'<small>Keine Items ersteigert</small>'}</div>`;
     return `<div class="summary-player">${face}<h3>${escape(p.name)}</h3><div class="summary-total">${p.items.length}${current.mode==='football'?`/11 Fußballer · ${p.stats.average} Ø`:' Items gesammelt'} · ${p.budget} € übrig</div>${content}</div>`;
   }
   function confetti(){return `<div class="victory-confetti" aria-hidden="true">${Array.from({length:45},(_,i)=>`<i style="--x:${(i*61)%100}%;--d:${(i*7)%19/10}s;--dur:${2.2+(i%7)*.21}s;--rot:${(i*71)%720}deg;--color:${['#ffd34c','#8652f5','#6fd3fc','#ff89ac','#67dca2'][i%5]}"></i>`).join('')}</div>`;}
   function votingScreen(){let actions;if(current.status==='complete'){
       const winner=current.winner?players().find(p=>p.id===current.winner):null;
       actions=winner?`<div class="victory-stage">${confetti()}<div class="victory-trophy">🏆</div><h2>GEWONNEN!</h2><p>${escape(winner.name)} gewinnt das Duell! 🎉</p></div>`:`<div class="winner-banner"><span>🤝</span>Unentschieden! Ihr habt unterschiedlich abgestimmt.</div>`;
       actions+=`<button class="btn btn-primary" type="button" data-new>Neues Duell starten →</button>`;
     } else if(me().hasVoted){actions=`<div class="vote-pending">✅ Deine Stimme wurde gespeichert. Warte auf die zweite Abstimmung (${current.votesCast} von 2).</div>`;}
     else{actions=`<h3>Wer hat das bessere Ergebnis gebaut?</h3><p class="muted">Jeder hat eine Stimme. Bei Gleichstand endet das Spiel unentschieden.</p><div class="vote-actions">${players().map(p=>`<button class="btn btn-primary" type="button" data-vote="${p.id}">🏅 ${escape(p.name)} wählen</button>`).join('')}</div>`;}
     return `<div class="game-shell">${header()}<section class="vote-card"><div class="waiting-icon">${current.status==='complete'?'🎊':'🎨'}</div><h2 class="game-title">${current.status==='complete'?'Das Ergebnis steht fest!':'Zeit für das große Finale!'}</h2><p class="muted">${current.mode==='football'?'Vergleicht eure selbst ersteigerten Fußballer und 4-3-3-Aufstellungen. Freie Plätze bleiben frei.':'Vergleicht eure Kreationen und kürt den Sieger.'}</p><div class="summary-grid">${players().map(summaryPlayer).join('')}</div>${current.mode==='football'?lineupEditor(me()):''}${actions}</section></div>`;
   }
   async function getPhoto(id){
     if(photoCache.has(id))return photoCache.get(id);
     const job=(async()=>{
       try{
         const r=await fetch(`/api/photos/${encodeURIComponent(id)}`);
         if(!r.ok)return null;
         const j=await r.json();
         if(!j.src?.startsWith('https://upload.wikimedia.org/') || !j.source?.startsWith('https://commons.wikimedia.org/'))return null;
         return j;
       }catch{return null;}
     })();
     photoCache.set(id,job);return job;
   }
   function hydratePortraits(){
     $$('.wiki-portrait[data-photo-id]', $('#gameContent')).forEach(async(el)=>{
       const info=await getPhoto(el.dataset.photoId);if(!info||!el.isConnected)return;
       const img=document.createElement('img');img.src=info.src;img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';
       img.onerror=()=>img.remove();el.append(img);
       const credit=document.createElement('a');credit.className='portrait-source';credit.href=info.source;credit.target='_blank';credit.rel='noopener noreferrer';credit.textContent='ⓘ';credit.title='Bildnachweis und Lizenz auf Wikimedia Commons';credit.setAttribute('aria-label','Bildquelle und Lizenz öffnen');el.append(credit);
     });
   }
   function render(){if(!current)return;$('#gameContent').innerHTML=current.status==='waiting'?waitingScreen():['bidding','tiebreak','reveal'].includes(current.status)?auctionScreen():votingScreen();if(current.mode==='football')hydratePortraits();updateHeader();}
  async function postAction(action, data={}){if(requestPending||!session)return;requestPending=true;try{const state=await request(`/api/rooms/${session.code}/${action}`,'POST',{token:session.token,...data});current=state;render();}catch(err){notify(err.message);}finally{requestPending=false;}}
  async function copyText(value){try{await navigator.clipboard.writeText(value);notify('Kopiert! 🎉');}catch{const temp=document.createElement('textarea');temp.value=value;temp.style.position='fixed';temp.style.opacity='0';document.body.append(temp);temp.select();try{document.execCommand('copy');notify('Kopiert! 🎉');}catch{notify(`Zum Kopieren: ${value}`);}temp.remove();}}

  // Homepage and navigation: fewer buttons and real Home actions.
  setupAvatarPickers();
  $$('[data-create]').forEach(el=>el.addEventListener('click',()=>{
    if(el.classList.contains('header-cta')){
      if(el.dataset.headerAction==='home'){showHome();return;}
      if(el.dataset.headerAction==='game'){showGame();return;}
    }
    createModal();
  }));
  $$('[data-join]').forEach(el=>el.addEventListener('click',()=>joinModal()));
  $$('[data-playmode]').forEach(el=>el.addEventListener('click',()=>createModal(el.dataset.playmode)));
  $$('[data-close]').forEach(el=>el.addEventListener('click',()=>el.closest('dialog').close()));
  $$('dialog').forEach(el=>el.addEventListener('click',event=>{if(event.target===el)el.close();}));
  $('#profileBtn').addEventListener('click',()=>{$('#profileName').value=savedName();openDialog('profileDialog');});
  $('#profileForm').addEventListener('submit',e=>{e.preventDefault();persistName($('#profileName').value);closeDialogs();notify('Spielname und Avatar gespeichert – für neue Duelle.');});
  $('#exitGame').addEventListener('click',showHome);
  $('#homeLogo').addEventListener('click',()=>{showHome();});
  function updateBudgetOptions(){
    const select=$('#createBudget');
    const football=$('#createMode').value==='football';
    const newOptions=football?[[50,'50 € Spielgeld (Football-Klassiker)'],[75,'75 € Spielgeld'],[100,'100 € Spielgeld']]:[[20,'20 € Spielgeld (Klassiker)'],[10,'10 € Spielgeld'],[30,'30 € Spielgeld'],[50,'50 € Spielgeld']];
    const before=Number(select.value);
    select.innerHTML=newOptions.map(([val,label])=>`<option value="${val}">${label}</option>`).join('');
    select.value=String(newOptions.some(([val])=>val===before)?before:(football?50:20));
    $('#footballModeHint').classList.toggle('hidden',!football);
  }
  $('#createMode').addEventListener('change',updateBudgetOptions);
  updateBudgetOptions();
  $('#createForm').addEventListener('submit',async e=>{
    e.preventDefault();const name=$('#createName').value.trim();if(!name)return;const button=$('#createSubmit');button.disabled=true;button.textContent='Wird erstellt …';
    try{const response=await request('/api/rooms','POST',{name,mode:$('#createMode').value,budget:Number($('#createBudget').value),auctionType:$('#createForm input[name=auctionType]:checked').value,avatar:chosenAvatar,avatarColor:chosenColor});persistName(name);await enter(response);}catch(err){notify(err.message);}finally{button.disabled=false;button.textContent='Spiel erstellen →';}
  });
  $('#joinCode').addEventListener('input',e=>{e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);});
  $('#joinForm').addEventListener('submit',async e=>{
    e.preventDefault();const name=$('#joinName').value.trim();const code=$('#joinCode').value.trim().toUpperCase();if(!/^[A-Z2-9]{6}$/.test(code)){notify('Bitte gib einen gültigen 6-stelligen Code ein.');return;}
    const button=$('#joinSubmit');button.disabled=true;button.textContent='Verbinde …';
    try{const response=await request(`/api/rooms/${code}/join`,'POST',{name,avatar:chosenAvatar,avatarColor:chosenColor});persistName(name);await enter(response);}catch(err){notify(err.message);}finally{button.disabled=false;button.textContent='Spiel beitreten →';}
  });
  $('#gameContent').addEventListener('click',async e=>{
    if(e.target.closest('.squad-editor > summary')){editorOpen=!editorOpen;return;}
    const quick=e.target.closest('[data-plus]');if(quick){const input=$('#bidAmount');if(input){input.value=String(Math.min(Number(input.max),Math.max(0,Number(input.value||0))+Number(quick.dataset.plus)));}return;}
    if(e.target.closest('[data-pass]'))return postAction('bid',{amount:0});
     if(e.target.closest('[data-open-pass]'))return postAction('pass');
    const voter=e.target.closest('[data-vote]');if(voter)return postAction('vote',{winnerId:voter.dataset.vote});
    const copier=e.target.closest('[data-copy]');if(copier)return copyText(copier.dataset.copy==='code'?current.code:shareLink());
    if(e.target.closest('[data-new]')){stopEvents();sessionStorage.removeItem('bidbattle-session');session=null;current=null;showHome();createModal();return;}
  });
  $('#gameContent').addEventListener('change',e=>{
    const el=e.target.closest('[data-assign-player]');if(!el)return;
    postAction('lineup',{playerId:el.dataset.assignPlayer,slot:el.value});
  });
  $('#gameContent').addEventListener('submit',e=>{if(e.target.id!=='bidForm')return;e.preventDefault();const n=Number($('#bidAmount').value);const min=current.auctionType==='open'?current.open.currentBid+1:0;if(!Number.isSafeInteger(n)||n<min||n>me().budget){notify(`Bitte einen ganzen Betrag von ${min} bis ${me().budget} € eingeben.`);return;}postAction('bid',{amount:n});});

  // Restore a session on reload. Each browser tab can hold its own player seat.
  persistName(savedName());
  const incoming=new URLSearchParams(location.search).get('room');
  try{session=JSON.parse(sessionStorage.getItem('bidbattle-session')||'null');}catch{session=null;}
  if(session?.code && session?.token && (!incoming || incoming===session.code)){
    showGame();refresh().then(connect).catch(()=>{sessionStorage.removeItem('bidbattle-session');session=null;showHome();if(incoming)joinModal(incoming);});
  }else if(incoming && /^[A-Z2-9]{6}$/.test(incoming)){joinModal(incoming);}
})();
