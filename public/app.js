'use strict';
(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  const names = {food:'Food Creator',football:'Football Draft',hero:'Superhero Showdown',random:'Random Battle'};
  const variantNames={startelf:'Startelf',byp:'Bid Your Player'};
  const isShort=()=>current?.mode==='football'&&current.footballVariant==='byp';
  const elite=card=>card?.rating>=88;
  const limit=()=>current?.playerLimit||11;
  const modeIcons = {food:'🍽️',football:'⚽',hero:'🦸',random:'🎲'};
  const foodDishes={burger:['Burger','🍔'],pizza:['Pizza','🍕'],pasta:['Pasta','🍝'],hotdog:['Hotdog','🌭']};
  const foodOptions=[['random','🎲 Zufall – ein Gericht wird ausgelost'],...Object.entries(foodDishes).map(([id,[label,emoji]])=>[id,`${emoji} ${label}`])];
  const chosenFoodLabel=()=>current?.mode==='food'?`${foodDishes[current.foodDish]?.[1]||'🍔'} ${foodDishes[current.foodDish]?.[0]||'Burger'}`:'';
  let session = null;
  let current = null;
  let events = null;
  let toastTimer = null;
  let requestPending = false;
  let lastWinnerCelebrated = null;
  let lastEliteCueKey = '';
  let lastWinCueKey = '';
  let editorOpen = false;
  let countdownTicker=null;
  let account=null;
  let authToken=localStorage.getItem('bidbattle-auth-token')||'';
  let identityMode=localStorage.getItem('bidbattle-identity')||'';
  let loginMode='register';
  let lastCountdownSecond=null;
  let soundEnabled=localStorage.getItem('bidbattle-sound')!=='off';
  let audioCtx=null;
  // Emoji-only avatar picker. Legacy avatar IDs remain readable for existing users.
  const AVATAR_IDS = ['🙂','😎','🤩','🐼','🦊','🐯','🐱','🐸','🦄','🤖','👽','🐧'];
  const LEGACY_AVATARS = {nova:'🙂',luna:'🙂',kai:'😎',roxy:'🤩',ace:'😎',milo:'🦊',juno:'🐱',zara:'🦄',rex:'🐯',ember:'🐸',shadow:'🤖',pixel:'👽'};
  const AVATARS = [...AVATAR_IDS,...Object.keys(LEGACY_AVATARS)];
  const emojiAvatar = v => LEGACY_AVATARS[v] || (AVATAR_IDS.includes(v) ? v : '🙂');
  const COLORS = ['lilac','blue','peach','mint','pink','yellow'];
  const photoCache = new Map();
  const finishedAuctions = new Map();
  let lastScene = '';
  let activePrevious = null;
  const savedAvatar = () => emojiAvatar(localStorage.getItem('bidbattle-avatar'));
  const savedColor = () => COLORS.includes(localStorage.getItem('bidbattle-avatar-color')) ? localStorage.getItem('bidbattle-avatar-color') : 'lilac';
  let pendingEntry=null;
  let directModeSelected=false;
  let chosenAvatar = savedAvatar();
  let chosenColor = savedColor();

  const escape = value => String(value??'').replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const avatarContent = avatar => escape(emojiAvatar(avatar));
  const avatarOptions = Object.fromEntries(AVATAR_IDS.map((v,i)=>[v,['Lächeln','Cool','Begeistert','Panda','Fuchs','Tiger','Katze','Frosch','Einhorn','Roboter','Alien','Pinguin'][i]]));
  const initials = value => String(value||'').split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]?.toUpperCase()||'').join('') || '⚽';
  const savedName = () => account?.name||localStorage.getItem('bidbattle-name') || '';
  function notify(message) {const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3500);}
  function openDialog(id){renderPickers();const dialog=$(`#${id}`);if(!dialog.open)dialog.showModal();}
  function closeDialogs(){$$('dialog').forEach(d=>{if(d.open)d.close();});}
  function persistName(value) {
    localStorage.setItem('bidbattle-name',value.trim());
    localStorage.setItem('bidbattle-avatar',chosenAvatar);
    localStorage.setItem('bidbattle-avatar-color',chosenColor);
    $('#profileLabel').textContent=value.trim() || 'Mein Name';
    $('#headerAvatar').innerHTML=avatarContent(chosenAvatar);
    $('#headerAvatar').className=`profile-icon avatar-${chosenColor}`;
  }
  function renderPickers(){
    $$('.avatar-picker').forEach(picker=>{
      picker.querySelectorAll('[data-avatar-choice]').forEach(btn=>{const on=btn.dataset.avatarChoice===chosenAvatar;btn.classList.toggle('selected',on);btn.setAttribute('aria-pressed',String(on));});
      picker.querySelectorAll('[data-color-choice]').forEach(btn=>{const on=btn.dataset.colorChoice===chosenColor;btn.classList.toggle('selected',on);btn.setAttribute('aria-pressed',String(on));});
    });
    renderOnboardingPreview();
  }
  function renderOnboardingPreview(){
    const p=$('#bbObSelectedPreview');if(!p)return;
    const name=$('#createName')?.value.trim()||'Dein Spielername';
    p.innerHTML=`<span class="bb-ob-preview-avatar avatar-${chosenColor}">${avatarContent(chosenAvatar)}</span><span><strong>${escape(name)}</strong><small>Dein ausgewählter BidBattle-Avatar</small></span><span class="bb-ob-preview-check">✓</span>`;
  }
  function setupAvatarPickers(){
    const html=`<div class="avatar-picker bb-avatar-picker"><label>Wähle deinen Avatar</label><div class="avatar-options">${AVATAR_IDS.map(a=>`<button type="button" data-avatar-choice="${a}" title="${avatarOptions[a]}" aria-label="Avatar ${avatarOptions[a]}">${avatarContent(a)}</button>`).join('')}</div><label>Deine Profilfarbe</label><div class="avatar-colors">${COLORS.map(c=>`<button type="button" data-color-choice="${c}" class="avatar-color avatar-${c}" aria-label="Farbe ${c}"></button>`).join('')}</div></div>`;
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
  function setCreateStep(step){
    $('#bbCreateProfileStep').classList.toggle('hidden',step!==1);
    $('#bbCreateSettingsStep').classList.toggle('hidden',step!==2);
    $$('#createDialog .bb-ob-step[data-ob-step]').forEach(el=>el.classList.toggle('is-active',Number(el.dataset.obStep)===step));
    if(step===2)updateBudgetOptions();
    $('#createDialog').scrollTop=0;
  }
  function updateOnboardMode(){
    const mode=$('#createMode').value;
    const selectedFood=$('#createFoodChoice')?.value||'random';
    const subDish=selectedFood==='random'?null:foodDishes[selectedFood];
    $('#bbOnboardModeTitle').textContent=mode==='food'&&subDish?`Food Creator · ${subDish[0]}`:names[mode];
    const art=$('#bbOnboardModeArt'); if(art){art.textContent=mode==='food'&&subDish?subDish[1]:modeIcons[mode];art.setAttribute('aria-label',names[mode]);}
    const descriptions={football:'Ersteigere echte Fußballer und stelle dein Team zusammen.',food:'Ersteigere Zutaten und kreiere dein Lieblingsgericht.',hero:'Ersteigere Superkräfte für deinen eigenen Helden.',random:'Unvorhersehbare Challenges und jede Menge Spielspaß.'};
    $('#bbOnboardModeCaption').textContent=descriptions[mode];
  }
  function createModal(mode, variant){
    if(!identityMode&&!session){pendingEntry={type:'create',mode,variant};openDialog('entryDialog');return;}
    directModeSelected=Boolean(mode&&names[mode]);
    $('#createName').value=savedName();
    $('#createMode').value=directModeSelected?mode:'football';
    $('#createFootballVariant').value=variant||'startelf';
    $('#createFoodChoice').value='random';
    $('#bbCreateModeChooser').classList.toggle('hidden',directModeSelected);
    $('#createBudget').value='';updateOnboardMode();updateBudgetOptions();setCreateStep(1);openDialog('createDialog');renderOnboardingPreview();
  }
  function chooseFootballVariant(){openDialog('footballChoiceDialog');}
  function joinModal(code){if(!identityMode&&!session){pendingEntry={type:'join',code};openDialog('entryDialog');return;}$('#joinName').value=savedName();$('#joinCode').value=code||'';openDialog('joinDialog');}
  async function request(url, method='GET', payload){
    let res;
    try{res=await fetch(url,{method,headers:{'Content-Type':'application/json',...(authToken?{'Authorization':`Bearer ${authToken}`}:{})},body:payload?JSON.stringify(payload):undefined,cache:'no-store'});}
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
    events.onerror=()=>{const banner=$('#connectionBanner');banner.classList.remove('hidden');};
    events.onopen=()=>{const banner=$('#connectionBanner');banner.classList.add('hidden');};
  }
  async function refresh(){if(!session)return;current=await request(`/api/rooms/${session.code}?token=${encodeURIComponent(session.token)}`);render();}
  async function enter(info){saveSession(info);current=info.state;closeDialogs();showGame();render();connect();}
   function auctionName(){return current.auctionType==='open'?'👀 Offen überbieten':'🙈 Blind bieten';}
   function header(){return `<div class="game-hero"><div class="game-hero-copy"><h1 class="game-title">${current.mode==='food'?foodDishes[current.foodDish]?.[1]||'🍔':modeIcons[current.mode]} ${escape(current.modeLabel)}${current.mode==='food'?` · ${escape(chosenFoodLabel())}`:''}</h1><p class="game-subtitle">Spielraum <strong>${current.code}</strong> · ${current.budget} € virtuelles Startbudget · 1 gegen 1</p></div><div class="game-hero-chips"><span class="game-hero-chip game-hero-chip-primary">${auctionName()}</span><span class="game-hero-chip">${current.timeLimit?`${current.timeLimit} Sekunden`:'Ohne Zeitlimit'}</span><span class="game-hero-chip">${current.mode==='food'?escape(chosenFoodLabel()):current.mode==='football' ? (isShort()?`${limit()} Spieler`:'Startelf') : 'Fun-Modus'}</span></div></div>`;}
  function players(){return current.players;}
  function me(){return players().find(p=>p.id===current.ownId);}
  function other(){return players().find(p=>p.id!==current.ownId);}
  function shareLink(){return `${location.origin}${location.pathname}?room=${current.code}`;}
   // Player portraits are loaded through our server with Wikimedia fallback.
   function portrait(player, variant='tiny') {
     if(!player)return `<span class="empty-pitch-player">＋</span>`;
     return `<span class="wiki-portrait portrait-${variant}" data-photo-id="${escape(player.id)}" title="${escape(player.title)} (${player.rating})"><span class="portrait-placeholder"><span class="portrait-fallback-code">${escape(player.flag||'⚽')}</span><span class="portrait-fallback-name">${escape(initials(player.title))}</span></span><b class="portrait-rating">${player.rating}</b></span>`;
   }
   const LINES=[['LW','ST','RW'],['CM1','CM2','CM3'],['LB','CB1','CB2','RB'],['GK']];
   const SHORT={LW:'LA',ST:'ST',RW:'RA',CM1:'ZM',CM2:'ZM',CM3:'ZM',LB:'LV',CB1:'IV',CB2:'IV',RB:'RV',GK:'TW'};
   function pitch(items, compact=false, lineup={}) {
     const playersById=Object.fromEntries(items.map(p=>[p.id,p]));
     const content=LINES.map(slots=>`<div class="pitch-line">${slots.map(slot=>{
       const player=playersById[lineup[slot]];
       return `<div class="pitch-person">${portrait(player,compact?'mini':'pitch')}<span>${player?escape(player.title):SHORT[slot]}</span><small>${player?`${player.rating} · ${SHORT[slot]}`:'frei'}</small></div>`;
     }).join('')}</div>`).join('');
     return `<div class="soccer-pitch ${compact?'pitch-small':''}" aria-label="4-3-3, ${items.length} von 11 Positionen besetzt"><span class="pitch-center-line"></span><span class="pitch-circle"></span>${content}</div>`;
   }
   function inventory(items,lineup={},ownerId=''){
     if(current.mode==='football') {
       const average=items.length?`${(items.reduce((t,p)=>t+p.rating,0)/items.length).toFixed(1)} Ø`: 'Noch kein Rating';
       if(isShort())return `<div class="football-roster-title">🃏 ${items.length}/${limit()} Spieler · ${average}</div><div class="byp-roster">${items.length?items.map(x=>`<div class="byp-roster-item">${portrait(x,'tiny')}<span>${escape(x.title)}</span><b>${x.rating}</b></div>`).join(''):'<span class="byp-empty">Noch keine Spieler</span>'}</div>`;
       return `<div class="football-roster-title">⚽ ${items.length}/11 Spieler · ${average}</div>${pitch(items,true,lineup)}`;
     }
     let entries=items.slice(-12).map((x,i)=>`<button type="button" class="inventory-item" data-item-index="${i+Math.max(0,items.length-12)}" data-owner-id="${escape(ownerId)}" title="${escape(x.title)}" aria-label="${escape(x.title)} ansehen">${escape(x.emoji)}</button>`).join('');
     const spaces=Math.max(0,4-Math.min(4,items.length));entries+=Array.from({length:spaces},()=>'<span class="inventory-item inventory-empty" aria-hidden="true">＋</span>').join('');
     return `<div class="inventory-grid">${entries}</div>`;
   }
   function lineupEditor(p){
     if(current.mode!=='football'||isShort()||!p.items.length||current.status==='complete')return '';
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
     return `<section class="player-panel ${index===1?'second':''}"><div class="player-avatar avatar-${escape(player.avatarColor)}" aria-hidden="true">${avatarContent(player.avatar)}</div><div class="player-name">${escape(player.name)} ${player.id===current.ownId?'<span class="you-tag">DU</span>':''}</div><div class="player-budget"><b>${player.budget} €</b><small>Restbudget</small></div><div class="inventory-title">${current.mode==='football'?(isShort()?'Meine Spieler':'Aufstellung'):'Gesammelte Items'} (${player.items.length}${current.mode==='football'?`/${limit()}`:''})</div>${inventory(player.items,player.lineup,player.id)}<div class="waiting-status">${status}</div></section>`;
   }
   function flowPlayerPanel(player,index){
     let status='';
     if(current.status==='bidding'||current.status==='tiebreak'){
       if(current.auctionType==='open')status=current.open?.turnId===player.id?'● Jetzt am Zug':'Wartet auf den nächsten Zug';
       else status=player.hasBid?'✓ Gebot abgegeben':'⏳ Überlegt noch …';
     }
     const showCount=current.mode==='food'||current.mode==='hero'||current.mode==='random';
     return `<section class="bb-flow-player ${index===1?'opponent':''}" aria-label="Spieler ${index+1}: ${escape(player.name)}">
       <span class="bb-flow-watermark" aria-hidden="true">♛</span>
       <div class="bb-flow-face avatar-${escape(player.avatarColor)}" aria-hidden="true">${avatarContent(player.avatar)}</div>
       <div class="bb-flow-player-name">${escape(player.name)} ${player.id===current.hostId?'<span class="bb-flow-role">Host</span>':''}${player.id===current.ownId?'<span class="bb-flow-self">Du</span>':''}</div>
       <div class="bb-flow-presence ${player.online?'online':''}">${player.online?'● Online':'○ Verbindung offen'}</div>
       <div class="bb-flow-money"><small>RESTBUDGET</small><strong>${player.budget} <span>€</span></strong></div>
       <div class="bb-flow-inventory-title">${showCount?'Gesammelte Items':'Sammlung'} <span>(${player.items.length})</span></div>
       ${inventory(player.items,player.lineup,player.id)}
       <div class="bb-flow-thinking" role="status">${status}</div>
     </section>`;
   }
   function dropdownOptions(options,selected){return options.map(([v,t])=>`<option value="${v}" ${String(v)===String(selected)?'selected':''}>${t}</option>`).join('');}
   const budgetList=(mode,variant)=>mode==='football'?(variant==='byp'?[[20,'20 € · Klassiker'],[30,'30 €'],[40,'40 €'],[50,'50 € · Extrem']]:[[50,'50 €'],[75,'75 €'],[100,'100 €']]):[[10,'10 €'],[20,'20 €'],[30,'30 €'],[50,'50 €']];
   const timeList=[[15,'15 Sekunden · Standard'],[10,'10 Sekunden · Extrem'],[30,'30 Sekunden'],[60,'60 Sekunden · Entspannt'],[0,'Ohne Zeitlimit']];
   const lobbyModes=[['football','Football Draft','⚽'],['food','Food Creator','🍽️'],['hero','Superhero','🦸'],['random','Random Battle','🎲']];
   function lobbyEditor(){
     const tiles=lobbyModes.map(([id,title,icon])=>`<button type="button" class="lobby-mode-choice lobby-mode-${id} ${current.mode===id?'selected':''}" data-lobby-mode="${id}" aria-pressed="${current.mode===id}"><span class="lobby-mode-art"><span class="lobby-mode-emoji" aria-hidden="true">${icon}</span></span><b>${escape(title)}</b><span class="lobby-mode-check" aria-hidden="true">✓</span></button>`).join('');
     return `<form id="lobbySettings" class="lobby-config lobby-editor-174">
       <div class="lobby-editor-head"><span class="lobby-overline">⚙️ SPIELEINSTELLUNGEN</span><p>Nur der Host ändert die Regeln. Dein Mitspieler sieht sie nach dem Speichern.</p></div>
       <label class="lobby-mode-label" for="lobbyMode">🎮 Spielmodus auswählen</label>
       <div class="lobby-mode-grid">${tiles}</div>
       <label class="lobby-native-mode-label" for="lobbyMode">Spielmodus <select name="lobbyMode" id="lobbyMode">${dropdownOptions([['football','⚽ Football Draft'],['food','🍽️ Food Creator'],['hero','🦸 Superhero'],['random','🎲 Random Battle']],current.mode)}</select></label>
       <div class="lobby-food-choice ${current.mode==='food'?'':'hidden'}" id="lobbyFoodFields"><label for="lobbyFoodChoice">🍽️ Was wollt ihr zubereiten?</label><select id="lobbyFoodChoice" name="lobbyFoodChoice">${dropdownOptions(foodOptions,current.mode==='food'?(current.foodChoice||'burger'):'random')}</select><p>🎲 Zufall lost für beide Spieler ein gemeinsames Gericht aus. ${current.mode==='food'?`Aktuell: <strong>${escape(chosenFoodLabel())}</strong> · ${current.foodPoolSize||0} mögliche Zutaten.`:'Das Gericht wird beim Speichern ausgewählt.'}</p></div><div class="lobby-settings-grid"><label id="lobbyVariantWrap" class="${current.mode==='football'?'':'hidden'}">Fußball-Variante<select name="lobbyVariant" id="lobbyVariant">${dropdownOptions([['startelf','🏟️ Startelf'],['byp','🃏 Bid Your Player']],current.footballVariant)}</select></label><label id="lobbyLimitWrap" class="${isShort()?'':'hidden'}">Spieler pro Person<select name="lobbyLimit" id="lobbyLimit">${dropdownOptions([[3,'3 Spieler'],[4,'4 Spieler'],[5,'5 Spieler']],current.playerLimit)}</select></label><label>🪙 Startbudget<select id="lobbyBudget" name="lobbyBudget">${dropdownOptions(budgetList(current.mode,current.footballVariant),current.budget)}</select></label><label>⚒️ Auktionsart<select id="lobbyAuction" name="lobbyAuction">${dropdownOptions([['sealed','🙈 Blind bieten'],['open','👀 Offen überbieten']],current.auctionType)}</select></label><label>⏱️ Zeit pro Gebot<select id="lobbyTime" name="lobbyTime">${dropdownOptions(timeList,current.timeLimit)}</select></label></div>
       <button type="submit" class="btn btn-white btn-full lobby-save-btn">✓ Einstellungen speichern</button>
     </form>`;
   }
   function waitingScreen(){
     const full=players().length===2;
     const seats=players().map((p,i)=>`<section class="lobby-stage-player ${p.id===current.hostId?'host':''}"><div class="lobby-player-top"><span class="player-crown">${p.id===current.hostId?'👑':''}</span><span class="lobby-person-status ${p.online?'is-online':''}">${p.online?'● Online':'○ Verbindung offen'}</span></div><div class="lobby-stage-face avatar-${escape(p.avatarColor)}">${avatarContent(p.avatar)}</div><div class="lobby-stage-name">${escape(p.name)}</div><div class="lobby-stage-role">${p.id===current.hostId?'Host':'Mitspieler'}${p.id===current.ownId?' · Du':''}</div><div class="lobby-stage-meta"><span>${p.id===current.hostId?'👑 Leitet das Duell':'🤝 Mitspieler'}</span><span>${i+1} / 2</span></div></section>`);
     if(!full)seats.push(`<section class="lobby-stage-player lobby-empty-seat"><div class="lobby-player-top"><span></span><span class="lobby-person-status">○ Platz frei</span></div><div class="lobby-stage-face lobby-empty-face">👋</div><div class="lobby-stage-name">Spieler 2</div><div class="lobby-stage-role">Warte auf deinen Mitspieler …</div><div class="lobby-stage-meta"><span>🔗 Lade einen Freund ein</span></div></section>`);
     const cfg=current.isHost?lobbyEditor():`<section class="lobby-config lobby-readonly"><span class="lobby-overline">⚙️ AKTUELLE SPIELEINSTELLUNGEN</span><div class="lobby-mode-readonly"><span>${modeIcons[current.mode]}</span><strong>${escape(current.modeLabel)}</strong></div><div class="lobby-readonly-list">${current.mode==='food'?`<span>🍽️ Gericht <b>${escape(chosenFoodLabel())}</b></span>`:''}<span>🪙 Budget pro Spieler <b>${current.budget} €</b></span><span>⚒️ Auktionsart <b>${auctionName()}</b></span><span>⏱️ Zeitlimit <b>${current.timeLimit?`${current.timeLimit} Sekunden`:'Ohne Zeitlimit'}</b></span>${current.mode==='football'?`<span>⚽ Variante <b>${isShort()?`Bid Your Player · ${limit()} Spieler`:'Startelf · 4-3-3'}</b></span>`:''}</div><p class="muted">Der Host kann die Einstellungen vor dem Start verändern.</p></section>`;
     const start=current.isHost?`<button class="btn btn-primary lobby-stage-start" type="button" data-start ${full?'':'disabled'}>${full?'▷ &nbsp; Spiel starten　→':'⏳ Warte auf Mitspieler …'}</button>`:`<div class="lobby-stage-start lobby-start-waiting">⏳ Der Host startet das Spiel, sobald ihr bereit seid.</div>`;
     return `<div class="lobby-stage game-shell">
       <div class="lobby-stage-heading"><div class="lobby-stage-intro"><span class="lobby-overline">♟ SPIELRAUM</span><h1>Bereit für das Duell?</h1><p>Lade deinen Freund ein, wähle eure Einstellungen und startet gemeinsam euer BidBattle!</p></div><div class="lobby-code-area"><div class="lobby-stage-code"><span>DEIN RAUMCODE</span><strong>${escape(current.code)}</strong><button type="button" data-copy="code" aria-label="Raumcode kopieren" title="Raumcode kopieren">▢</button></div><p>Teile den Code mit deinem Freund, damit er beitreten kann.</p></div></div>
       ${current.lobbyNotice?`<div class="lobby-notice lobby-stage-notice" role="status">${escape(current.lobbyNotice)}</div>`:''}
       <div class="lobby-stage-grid">${seats[0]}<div class="lobby-stage-center">${cfg}</div>${seats[1]}</div>
       <div class="lobby-stage-actions"><button class="btn lobby-side-action" type="button" data-copy="code">🔗 Code kopieren</button>${start}<button class="btn lobby-side-action" type="button" data-copy="link">♧ Freund einladen</button></div>
       <div class="lobby-stage-footer">${players().length}/2 Spieler im Raum · ${current.budget} € virtuelles Startbudget · ${auctionName()} · ${current.timeLimit?`${current.timeLimit} Sek. pro Gebot`:'ohne Zeitlimit'}</div>
     </div>`;
   }
   function syncLobbyControls(){
     const mode=$('#lobbyMode'),variant=$('#lobbyVariant'),budget=$('#lobbyBudget');if(!mode||!variant||!budget)return;
     const football=mode.value==='football',short=football&&variant.value==='byp';
     $('#lobbyVariantWrap').classList.toggle('hidden',!football);$('#lobbyLimitWrap').classList.toggle('hidden',!short);
     $('#lobbyFoodFields')?.classList.toggle('hidden',mode.value!=='food');
     const options=budgetList(mode.value,variant.value),old=Number(budget.value);
     budget.innerHTML=dropdownOptions(options,options.some(([n])=>n===old)?old:(football&&!short?50:20));
   }
   function bidControls(){
     if(current.paused)return `<div class="bid-locked">📡 Auktion pausiert. Dein Mitspieler ist kurz offline. Wir versuchen, die Verbindung wiederherzustellen.</div>`;
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
     const latest=bid.history.at(-1);
     const wasOutbid=latest?.amount>0&&latest.id!==mine.id&&bid.history.some(h=>h.id===mine.id&&h.amount>0);
     const outbid=wasOutbid?`<div class="outbid-flash">↗ ${escape(latest.name)} hat dich mit ${latest.amount} € überboten!</div>`:'';
     const headline=`<div class="open-current"><span>AKTUELLES GEBOT</span><strong>${bid.currentBid?`${bid.currentBid} €`:'Noch kein Gebot'}</strong><small>${leader?`${escape(leader.name)} führt`:'Starte die Auktion!'}</small></div>${outbid}`;
     let controls='';
     if(!active){controls=`<div class="bid-locked"><span>⏳</span>${escape(turn?.name||'Der andere Spieler')} ist gerade am Zug.<p class="muted" style="margin-top:6px">Wenn das aktuelle Gebot überboten wird, kannst du reagieren.</p></div>`;}
     else if(min>mine.budget || !canBuy){controls=`<div class="open-turn-note">Du kannst diesen Spieler derzeit nicht mehr kaufen (Budget oder zulässige Aufstellungsplätze).</div><button class="btn btn-primary btn-full" type="button" data-open-pass>Jetzt passen →</button>`;}
     else {controls=`<form id="bidForm" class="bid-box"><label for="bidAmount">Du bist am Zug! Biete mindestens ${min} €.</label><div class="bid-input-line"><input id="bidAmount" name="bidAmount" type="number" min="${min}" max="${mine.budget}" step="1" value="${min}" inputmode="numeric" required><span class="currency">€</span></div><div class="bid-presets"><button type="button" data-plus="1">+1 €</button><button type="button" data-plus="3">+3 €</button><button type="button" data-plus="5">+5 €</button></div><div class="bid-actions"><button type="button" class="btn btn-white" data-open-pass>Passen</button><button type="submit" class="btn btn-primary">Jetzt überbieten →</button></div><div class="bid-hint">👀 Alle sehen das aktuelle Gebot sofort. Nur der Auktionsgewinner zahlt.</div></form>`;}
     return `${headline}${controls}${previous?`<div class="auction-history"><b>Letzte Aktionen</b>${previous}</div>`:''}`;
   }
   function reveal(){
     const r=current.lastResult;
     let title,desc,icon;
     if(r.reason==='food-foundation-free') {icon='🍽️';title=`${escape(r.winnerName)} erhält eine Grundlage!`;desc='Die Basis wurde kostenlos ergänzt, damit beide ihr Gericht beginnen können.';}
     else if(r.reason==='double-tie') {icon='🤝';title='Auch das Stechen ist unentschieden!';desc='Niemand zahlt.';}
     else if(r.reason==='passed') {icon='⏭️';title='Niemand wollte das Item';desc='Niemand zahlt.';}
     else {icon='🏆';title=`${escape(r.winnerName)} gewinnt die Auktion!`;desc=`Gewonnen für ${r.winningBid} € Spielgeld.`;}
     const details=current.auctionType==='sealed'
       ?`<div class="reveal-bids">${r.bids.map(x=>`<div>${escape(x.name)}<b>${x.amount} €</b></div>`).join('')}</div>`
       :`<div class="auction-history"><b>Gebotsverlauf</b>${r.history.map(x=>`<div class="auction-history-row"><span>${escape(x.name)}</span><strong>${x.pass?'Passt':`${x.amount} €`}</strong></div>`).join('')}</div>`;
     const football=elite(current.card)&&r.winnerId?`<div class="elite-reveal-note">✨ ELITE-SPIELER GESICHERT · ${current.card.rating} OVR ✨</div>`:'';
     return `<div class="reveal-banner ${r.winnerId?'reveal-win':'reveal-pass'}"><span class="reveal-symbol">${icon}</span><strong>${title}</strong><small>${desc}</small></div>${football}${details}<div class="auto-next">⏩ Nächste ${current.round===current.total-1?'Phase':'Auktion'} startet automatisch …</div>`;
   }
   function sliderBidControls(){
     const player=me();
     if(current.paused)return `<div class="bid-locked">📡 Auktion pausiert – wir warten auf die Verbindung deines Mitspielers.</div>`;
     if(current.foodFoundationPhase && !current.foodCanBid)return `<div class="bid-locked">✅ Du hast bereits eine Grundlage!<p class="muted" style="margin:6px 0 0">Diese Grundlage gehört deinem Mitspieler. Sobald beide versorgt sind, kommen die weiteren Zutaten.</p></div>`;
     if(current.auctionType==='sealed' && player.hasBid)return `<div class="bid-locked">🔒 Gebot gespeichert. Warte auf deinen Mitspieler …</div>`;
     if(current.auctionType==='open'){
       const bid=current.open;
       if(bid?.turnId!==player.id)return openBidControls();
       const min=(bid?.currentBid||0)+1;
       if(current.foodFoundationPhase && !current.foodCanBid)return `<div class="bid-locked">✅ Deine Grundlage ist gesichert. Jetzt ist dein Mitspieler dran.</div>`;
       if(min>player.budget)return openBidControls();
       if(current.mode==='football'&&!current.footballCanBuy?.[player.id])return openBidControls();
       return `<div class="bb-open-bid-leader">Aktuelles Gebot: <b>${bid.currentBid} €</b> · Mindestens ${min} €</div>${bidFormWithSlider(min,player.budget,'Jetzt überbieten','open')}`;
     }
     const extra=current.status==='tiebreak'?`<div class="tie-alert"><span>🤝</span><div><strong>Gleichstand bei ${current.tieInfo.amount} €!</strong><p>Ein letztes verdecktes Stechen entscheidet. Bei einem erneuten Gleichstand bekommt niemand das Item.</p></div></div>`:'';
     return `${extra}${bidFormWithSlider(0,player.budget,current.status==='tiebreak'?'Stechgebot abgeben':'Gebot abgeben','sealed')}`;
   }
   function bidFormWithSlider(min,max,buttonLabel,kind){
     const value=Math.max(min,Math.min(max,kind==='sealed'?2:min));
     const label=kind==='open'?`Wie viel möchtest du überbieten?`:`Dein geheimes Gebot`;
     return `<form id="bidForm" class="bb-bid-form"><div class="bb-bid-form-header"><label for="bidAmount">${label}</label><span>Nur virtuelles Spielgeld</span></div>
       <div class="bb-bid-value"><span>🪙</span><input id="bidAmount" name="bidAmount" type="number" min="${min}" max="${max}" step="1" inputmode="numeric" required value="${value}" aria-label="Gebot in Euro"><span>€</span></div>
       <input id="bidRange" type="range" min="${min}" max="${max}" step="1" value="${value}" aria-label="Gebotsbetrag mit Schieberegler einstellen" style="--bid-percent:${max>min?(value-min)/(max-min)*100:0}%" ${max===min?'disabled':''}>
       <div class="bb-slider-labels"><span>${min} €</span><span>${max} €</span></div>
       <div class="bid-presets"><button type="button" data-plus="1">+1 €</button><button type="button" data-plus="3">+3 €</button><button type="button" data-plus="5">+5 €</button></div>
       <div class="bid-actions"><button type="button" class="btn btn-white" ${kind==='open'?'data-open-pass':'data-pass'}>Passen</button><button type="submit" class="btn btn-primary">⚒ ${buttonLabel} →</button></div>
       <div class="bid-hint">${kind==='open'?'👀 Offene Auktion. Nur der Gewinner zahlt.':'🔒 Gebot bleibt geheim. Nur der Gewinner zahlt.'}</div>
     </form>`;
   }
   function flowSceneHeader(){
     const suffix=current.status==='countdown'?'Startet gleich':`Auktion ${current.round+1} / ${current.total}`;
     return `<div class="bb-flow-top"><div class="bb-flow-mode">${current.mode==='food'?foodDishes[current.foodDish]?.[1]||'🍔':modeIcons[current.mode]} <strong>${escape(current.modeLabel)}${current.mode==='food'?` · ${escape(chosenFoodLabel())}`:''}</strong><span class="bb-flow-separator" aria-hidden="true"></span><span>${suffix}</span></div><div class="bb-flow-meta"><span>${auctionName()}</span><span>${current.timeLimit?`${current.timeLimit} Sek. pro Gebot`:'Ohne Zeitlimit'}</span><span>Raum ${escape(current.code)}</span></div></div>`;
   }
   function flowPreviousButton(){
     const previous=finishedAuctions.get(`${current.code}:${current.round-1}`);
     return previous?`<button type="button" class="bb-flow-prev" data-previous-card aria-label="Vorherige abgeschlossene Auktion ansehen" title="Letzte Auktion ansehen">‹</button>`:'';
   }
   function flowAuctionScreen(){
     const color=current.mode==='food'?'food':current.mode==='hero'?'hero':'random';
     const card=current.card;
     const results=current.status==='reveal'?reveal():sliderBidControls();
     const phase=current.mode==='food'?(current.foodFoundationPhase?`<div class="bb-food-stage" role="status">🍽️ <strong>Schritt 1: Grundlage sichern</strong><span>${current.round+1} von 2 · Jeder Spieler bekommt zuerst eine Basis. Danach kommen die weiteren Zutaten.</span></div>`:`<div class="bb-food-stage bb-food-stage-next">🧑‍🍳 <strong>Schritt 2: Gericht zusammenstellen</strong><span>${escape(card.type)} · Die Grundlagen sind bei beiden Spielern gesichert.</span></div>`):'';
     const timer=current.deadline?`<div class="bb-flow-timer aria-live="off">⏱ <span id="countdown">…</span></div>`:'';
     return `<div class="game-shell bb-flow-shell bb-mode-${color}">${flowSceneHeader()}${phase}<div class="bb-flow-roundline"><div class="bb-flow-track"><div style="width:${((current.round+1)/current.total)*100}%"></div></div><span>${current.round+1} von ${current.total} Angeboten</span>${timer}</div>
      <div class="bb-flow-grid">${flowPlayerPanel(players()[0],0)}<div class="bb-flow-center"><section class="bb-item-card"><div class="bb-item-art ${color}">${flowPreviousButton()}<span class="bb-item-category">${escape(card.type)} · ${current.status==='reveal'?'ERGEBNIS':current.status==='tiebreak'?'STECHEN':'JETZT BIETEN'}</span><span class="bb-item-emoji" aria-hidden="true">${escape(card.emoji)}</span><span class="bb-item-art-label" aria-hidden="true">BIDBATTLE</span></div><div class="bb-item-copy"><h2>${escape(card.title)}</h2><p>${escape(card.detail)}</p></div></section><section class="bb-bid-card">${results}</section></div>${flowPlayerPanel(players()[1],1)}</div></div>`;
   }
   function footballPlayerPanel(player,index){
     const short=isShort();
     let status='';
     if(current.status==='bidding'||current.status==='tiebreak'){
       if(current.auctionType==='open')status=current.open?.turnId===player.id?'● Du bist am Zug':'Wartet auf seinen Zug';
       else status=player.hasBid?'✓ Gebot abgegeben':'⏳ Überlegt noch …';
     }
     const avg=player.items.length?(player.items.reduce((sum,item)=>sum+item.rating,0)/player.items.length).toFixed(1):'–';
     const max=short?limit():11;
     const roster=short?`<div class="bb-football-mini-roster">${player.items.map(item=>`<div class="bb-football-mini-item">${portrait(item,'tiny')}<span title="${escape(item.title)}">${escape(item.title)}</span><strong>${item.rating}</strong></div>`).join('')}${Array.from({length:Math.max(0,max-player.items.length)},()=>'<span class="bb-football-roster-empty">＋ Freier Platz</span>').join('')}</div>`
       :`<div class="bb-football-pitch-frame">${pitch(player.items,true,player.lineup||{})}</div>`;
     return `<section class="bb-flow-player bb-football-player ${short?'bb-football-short':'bb-football-eleven'} ${index===1?'opponent':''}" aria-label="${escape(player.name)} – ${player.items.length} von ${max} Spielern">
       <span class="bb-flow-watermark" aria-hidden="true">♛</span><div class="bb-football-player-header"><div class="bb-flow-face avatar-${escape(player.avatarColor)}" aria-hidden="true">${avatarContent(player.avatar)}</div>
       <div class="bb-football-identity"><div class="bb-flow-player-name">${escape(player.name)} ${player.id===current.hostId?'<span class="bb-flow-role">Host</span>':''}${player.id===current.ownId?'<span class="bb-flow-self">Du</span>':''}</div><div class="bb-flow-presence ${player.online?'online':''}">${player.online?'● Online':'○ Verbindung offen'}</div></div></div>
       <div class="bb-flow-money"><small>RESTBUDGET</small><strong>${player.budget} <span>€</span></strong></div>
       <div class="bb-football-squad-title"><span>${short?'Meine Spieler':'4-3-3 Aufstellung'} <strong>${player.items.length}/${max}</strong></span><small>Ø ${avg} OVR</small></div>
       ${roster}<div class="bb-flow-thinking" role="status">${status}</div>
     </section>`;
   }
   function footballAuctionScreen(){
     const card=current.card,short=isShort();
     const special=elite(card);
     const title=short?'Bid Your Player':'Startelf · 4-3-3';
     const result=current.status==='reveal'?reveal():sliderBidControls();
     const timer=current.deadline?`<span class="bb-flow-timer">⏱ <span id="countdown">…</span></span>`:'';
     const currentLabel=current.status==='reveal'?'ERGEBNIS':current.status==='tiebreak'?'STECHEN':'JETZT BIETEN';
     const eliteFlag=special?`<div class="bb-football-elite-label">✦ ELITE DROP · ${card.rating} OVR ✦</div>`:'';
     return `<div class="game-shell bb-flow-shell bb-football-shell ${short?'bb-football-byp':'bb-football-startelf'}">
       ${flowSceneHeader()}
       <div class="bb-flow-roundline"><div class="bb-flow-track"><div style="width:${((current.round+1)/current.total)*100}%"></div></div><span>${current.round+1} von ${current.total} Angeboten</span>${timer}</div>
       <div class="bb-flow-grid bb-football-grid">${footballPlayerPanel(players()[0],0)}
         <div class="bb-flow-center"><section class="bb-item-card bb-football-card ${special?'bb-football-elite':''}">
           <div class="bb-football-card-head">${flowPreviousButton()}<span class="bb-football-mode-pill">⚽ ${title}</span><span class="bb-football-round-pill">${currentLabel}</span></div>
           <div class="bb-football-card-art">${eliteFlag}<div class="bb-football-portrait">${portrait(card,'main')}</div>
             <span class="bb-football-rank">${card.rating} <small>OVR</small></span>
           </div><div class="bb-item-copy bb-football-card-copy"><div class="bb-football-card-tags"><span>${escape(card.flag||'⚽')} ${escape(card.type)}</span><span>${card.rating} OVR</span></div>
           <h2>${escape(card.title)}</h2><p>${escape(card.detail||'')}</p></div></section>
           <section class="bb-bid-card">${result}</section></div>
         ${footballPlayerPanel(players()[1],1)}</div>
         <div class="bb-football-details-note">ⓘ Spielerporträts werden nur bei sicherer Zuordnung von Wikimedia geladen; sonst erscheint die Flagge. Alle Ratings sind eigene BidBattle-Werte. ${short?'Jeder sammelt '+limit()+' Spieler.':'Fehlende Plätze werden am Ende kostenlos und mit abgestuften Chancen aufgefüllt.'}</div>
         ${short?'':lineupEditor(me())}
     </div>`;
   }
   function auctionScreen(){
     if(current.mode==='football')return footballAuctionScreen();
     return flowAuctionScreen();
   }
   function autoFillScreen(){
     const a=current.autoFillLast, receiver=players().find(p=>p.id===a?.playerId);
     const startelf=current.autoFillReason==='startelf';
     const explanation=startelf?'Die Auktionen sind beendet. Jetzt werden alle freien Plätze im 4-3-3 automatisch besetzt. Wer mehr Spieler verpasst hat, hat eine deutlich geringere Chance auf Elite-Karten. Alle Auffüllspieler sind kostenlos.':'Der erste Spieler ist fertig. Die nächsten Spieler aus dem Angebotspool gehen kostenlos an den anderen Spieler.';
     return `<div class="game-shell">${header()}<section class="autofill-card ${startelf?'startelf-fill':''}"><div class="autofill-eyebrow">✨ ${startelf?'STARTELF-BONUSRUNDE':'AUTOMATISCHE AUFFÜLLPHASE'}</div><h2>${startelf?'Die Startelf wird vervollständigt!':'Ein Spieler ist fertig!'}</h2><p>${explanation}</p>${a?`<div class="autofill-reveal ${elite(a.card)?'autofill-elite':''}"><span class="autofill-rarity">${elite(a.card)?'✦ ELITE ✦':'🎴 NEUER SPIELER'}</span><div class="autofill-portrait">${portrait(a.card,'main')}</div><strong>${escape(a.card.title)}</strong><span>${a.card.rating} OVR · ${escape(a.card.type)}</span><div class="autofill-granted">✓ An ${escape(a.playerName)} vergeben · ${a.received}/${a.limit}</div>${startelf?`<small>Vorher fehlten ${a.missingAtStart} Spieler</small>`:''}</div>`:'<div class="autofill-wait">🎲 Karten werden gemischt …</div>'}<div class="lobby-players">${players().map(p=>`<div class="lobby-seat"><b>${escape(p.name)}</b><small>${p.items.length}/${limit()} Spieler</small></div>`).join('')}</div><p class="muted">${current.autoFillRemaining} Karte(n) noch offen – nächste Karte automatisch …</p></section></div>`;
   }
   function playTick(frequency=530){
    if(!soundEnabled)return;
    try{const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;
      audioCtx||=new Ctx();if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});
      const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.type='sine';osc.frequency.value=frequency;
      gain.gain.setValueAtTime(0.0001,audioCtx.currentTime);gain.gain.exponentialRampToValueAtTime(0.09,audioCtx.currentTime+0.018);gain.gain.exponentialRampToValueAtTime(0.0001,audioCtx.currentTime+0.14);
      osc.connect(gain);gain.connect(audioCtx.destination);osc.start();osc.stop(audioCtx.currentTime+0.15);
    }catch{}
  }
  function playCountdownCue(second){
    if(!soundEnabled)return;
    try{
      const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;
      audioCtx||=new Ctx();if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});
      const t=audioCtx.currentTime;
      // A soft synthetic 'pop' for 3,2,1 and a brief two-tone welcome cue at BID.
      const tones=second===0?[[523,.0,.14],[659,.085,.19]]:[[second===3?392:second===2?440:494,0,.105]];
      for(const [freq,offset,duration] of tones){
        const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();
        osc.type='sine';osc.frequency.setValueAtTime(freq,t+offset);osc.frequency.exponentialRampToValueAtTime(freq*.94,t+offset+duration);
        gain.gain.setValueAtTime(.0001,t+offset);gain.gain.exponentialRampToValueAtTime(.038,t+offset+.012);gain.gain.exponentialRampToValueAtTime(.0001,t+offset+duration);
        osc.connect(gain);gain.connect(audioCtx.destination);osc.start(t+offset);osc.stop(t+offset+duration+.01);
      }
    }catch{}
  }
  function countdownScreen(){
    // All modes share the same arena while the synchronized countdown is visible.
    const left=current.mode==='football'?footballPlayerPanel(players()[0],0):flowPlayerPanel(players()[0],0);
    const right=current.mode==='football'?footballPlayerPanel(players()[1],1):flowPlayerPanel(players()[1],1);
    return `<div class="game-shell bb-flow-shell bb-countdown-shell ${current.mode==='football'?'bb-football-countdown':''}">${flowSceneHeader()}<div class="bb-flow-grid bb-countdown-grid">${left}<section class="bb-countdown-stage"><span class="bb-countdown-eyebrow">✦ BIDBATTLE ✦</span><h2>Das Duell beginnt!</h2><p>Bereit zum Bieten?</p><div class="bb-countdown-ring"><div class="countdown-number" id="start-countdown" aria-live="polite">3</div></div><div class="bb-countdown-stepbars"><i></i><i></i><i></i></div><button type="button" class="bb-countdown-sound" data-sound-toggle>${soundEnabled?'🔊 Sound an':'🔇 Sound aus'}</button><p class="bb-countdown-tip">Die erste Auktion erscheint automatisch.</p></section>${right}</div></div>`;
  }
  function updateCountdown(){
    const el=$('#countdown');if(el&&current?.deadline){const left=Math.max(0,Math.ceil((current.deadline-Date.now())/1000));el.textContent=left+' s';el.classList.toggle('timer-low',left<=5);}
    const start=$('#start-countdown');if(start&&current?.countdownEnds){const ms=current.countdownEnds-Date.now();const second=ms<=700?0:Math.min(3,Math.max(1,Math.ceil((ms-700)/1000)));
      start.textContent=second===0?'BID!':String(second);
      start.classList.toggle('is-bid',second===0);
      if(lastCountdownSecond!==second){lastCountdownSecond=second;playCountdownCue(second);}
    }
  }
   function summaryPlayer(p){
     const face=`<div class="summary-emoji avatar-${escape(p.avatarColor)}">${avatarContent(p.avatar)}</div>`;
     const content=current.mode==='football'?`${isShort()?'':`<div class="full-pitch-wrap">${pitch(p.items,false,p.lineup)}</div>`}<div class="roster-list ${isShort()?'byp-summary-list':''}">${p.items.length?p.items.map(x=>`<div>${portrait(x,'tiny')}<span>${escape(x.title)}</span><small>${x.rating} OVR · ${escape(x.type)}</small></div>`).join(''):'<p class="muted">Keine Fußballer ersteigert</p>'}</div>`
       :`<div class="summary-items">${p.items.length?p.items.map(x=>`<span title="${escape(x.title)}">${escape(x.emoji)}</span>`).join(''):'<small>Keine Items ersteigert</small>'}</div>`;
     return `<div class="summary-player">${face}<h3>${escape(p.name)}</h3><div class="summary-total">${p.items.length}${current.mode==='football'?`/${limit()} Fußballer · ${p.stats.average} Ø`:' Items gesammelt'} · ${p.budget} € übrig</div>${content}</div>`;
   }
   function confetti(){return `<div class="victory-confetti" aria-hidden="true">${Array.from({length:45},(_,i)=>`<i style="--x:${(i*61)%100}%;--d:${(i*7)%19/10}s;--dur:${2.2+(i%7)*.21}s;--rot:${(i*71)%720}deg;--color:${['#ffd34c','#8652f5','#6fd3fc','#ff89ac','#67dca2'][i%5]}"></i>`).join('')}</div>`;}
   function podiumCollection(p){
     const items=p.items||[];
     const count=current.mode==='football'?`${items.length}/${limit()} Fußballer`:`${items.length} ${items.length===1?'Item':'Items'}`;
     return `<div class="bb-podium-collection"><div class="bb-podium-collection-head"><strong>Gesammelte ${current.mode==='football'?'Spieler':'Items'}</strong><span>${count}</span></div><div class="bb-podium-item-list ${current.mode==='football'?'bb-podium-football':''}">${items.length?items.map(item=>current.mode==='football'?`<div class="bb-podium-football-item">${portrait(item,'tiny')}<span><b>${escape(item.title)}</b><small>${item.rating} OVR · ${escape(item.type)}</small></span></div>`:`<div class="bb-podium-food-item" title="${escape(item.title)}"><span>${escape(item.emoji)}</span><small>${escape(item.title)}</small></div>`).join(''):'<p class="bb-podium-empty">Keine Items gesammelt</p>'}</div></div>`;
   }
   function podiumParticipant(p,rank,champion=false){
     const average=current.mode==='football'&&p.stats?` · ${p.stats.average} Ø Rating`:'';
     return `<article class="bb-podium-player ${champion?'bb-podium-champion':'bb-podium-runner'}"><div class="bb-podium-player-heading"><span class="bb-podium-rank">${rank==='1'?'🥇 Platz 1':rank==='2'?'🥈 Platz 2':'🤝 Unentschieden'}</span><div class="bb-podium-face avatar-${escape(p.avatarColor)}">${avatarContent(p.avatar)}</div><h3>${escape(p.name)}</h3><p>${p.id===current.ownId?'Du · ':''}${p.id===current.hostId?'Host':'Mitspieler'}</p><div class="bb-podium-metrics">${p.budget} € übrig${average}</div></div></article>`;
   }
   function podiumColumn(p,rank,champion=false){
     const step=rank==='1'?'bb-podium-gold-step':rank==='2'?'bb-podium-silver-step':'bb-podium-draw-step';
     return `<div class="bb-v18-podium-column ${champion?'bb-v18-champion':'bb-v18-runner'}" aria-label="${rank==='tie'?'Gleichstand':`Platz ${rank}`}: ${escape(p.name)}">${podiumParticipant(p,rank,champion)}<div class="${step}"><span>${rank==='tie'?'=':rank}</span><small>${rank==='tie'?'REMIS':'PLATZ'}</small></div>${podiumCollection(p)}</div>`;
   }
   function podiumTrophy(){return `<svg class="bb-podium-trophy" viewBox="0 0 160 170" role="img" aria-label="Goldener Siegerpokal"><defs><linearGradient id="bbtrophyG" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#fff1ad"/><stop offset=".45" stop-color="#ffcb4d"/><stop offset="1" stop-color="#d78d1b"/></linearGradient></defs><path d="M48 30H24v25c0 23 17 37 39 35M112 30h24v25c0 23-17 37-39 35" fill="none" stroke="#e6a32d" stroke-width="11" stroke-linecap="round"/><path d="M47 18h66v49c0 30-19 49-33 49S47 97 47 67Z" fill="url(#bbtrophyG)" stroke="#d89b30" stroke-width="3"/><path d="m80 40 6 11 12 2-9 9 2 12-11-6-11 6 2-12-9-9 12-2Z" fill="#fff4c7"/><path d="M74 115h12v21H74Z" fill="#eab440"/><rect x="57" y="134" width="46" height="10" rx="4" fill="#ffdc77"/><rect x="45" y="144" width="70" height="18" rx="5" fill="#aa62db"/><path d="M49 148h62" stroke="#dfb3ff" stroke-width="2"/></svg>`;}
   function victoryScreen(){
     const winner=current.winner?players().find(p=>p.id===current.winner):null;
     const runner=winner?players().find(p=>p.id!==winner.id):null;
     const draw=!winner;
     const ready=(current.rematchReady||[]).includes(current.ownId),readyCount=(current.rematchReady||[]).length;
     const result=draw?`<div class="bb-podium-title bb-podium-draw-title"><span class="bb-podium-crown" aria-hidden="true">🤝</span><div class="bb-podium-heading">UNENTSCHIEDEN</div><p>${current.tieBreakReason==='mutual-tie'?'Ihr habt beide Unentschieden gewählt.':'Kein eindeutiger Sieger – starkes Duell!'}</p></div>`:
       `<div class="bb-podium-title"><span class="bb-podium-crown" aria-hidden="true">♛</span><div class="bb-podium-heading">GEWINNER</div><p>${escape(winner.name)} gewinnt das Duell!</p></div>`;
     // Version 1.8: beide Spieler in gleich breiten Spalten; keine seitliche dritte Sammlung.
     const cards=winner?
       `${podiumColumn(runner,'2',false)}${podiumColumn(winner,'1',true)}`:
       `${podiumColumn(players()[0],'tie',false)}${podiumColumn(players()[1],'tie',false)}`;
     const verdict=current.tieBreakReason==='rating'?'<p class="bb-podium-verdict">⚖️ Rating-Stichentscheid: höherer Mannschaftsdurchschnitt gewinnt.</p>':'';
     return `<div class="game-shell bb-flow-shell bb-podium-shell">${confetti()}<div class="bb-podium-mode">${modeIcons[current.mode]} ${escape(current.modeLabel)} <span>· Finale</span></div>${result}<section class="bb-podium-main" aria-label="Spielergebnis">${cards}</section>${verdict}<div class="bb-podium-actions"><button class="btn btn-primary" type="button" data-playagain ${ready?'disabled':''}>${ready?'✅ Bereit – auf Mitspieler warten':'🔁 Nochmal spielen'}</button><button class="btn btn-white" type="button" data-rematch>👥 Zur Lobby</button><button class="btn btn-outline-danger" type="button" data-leave>🚪 Spiel verlassen</button></div><p class="bb-podium-ready" aria-live="polite">${readyCount}/2 Spieler bereit für ein Rückspiel. Eine neue Runde beginnt erst, wenn beide zustimmen.</p></div>`;
   }
   function votingScreen(){
     if(current.status==='complete')return victoryScreen();
     let actions;
     if(me().hasVoted){actions=`<div class="vote-pending">✅ Deine Stimme wurde gespeichert. Warte auf die zweite Abstimmung (${current.votesCast} von 2).</div>`;}
     else{actions=`<h3>Wer hat das bessere Ergebnis gebaut?</h3><p class="muted">Wenn beide denselben Sieger wählen, gewinnt dieser. Bei unterschiedlichen Stimmen entscheidet im Fußball das durchschnittliche Rating, sonst bleibt es unentschieden.</p><div class="vote-actions">${players().map(p=>`<button class="btn btn-primary" type="button" data-vote="${p.id}">🏅 ${escape(p.name)} wählen</button>`).join('')}<button class="btn btn-white" type="button" data-vote="tie">🤝 Unentschieden</button></div>`;}
     return `<div class="game-shell">${header()}<section class="vote-card"><div class="waiting-icon">🎨</div><h2 class="game-title">Zeit für das große Finale!</h2><p class="muted">${current.mode==='football'?(isShort()?'Vergleicht eure selbst ersteigerten Spieler. Die Ratings sind nur eine Orientierung – eure Stimmen entscheiden.':'Vergleicht eure 4-3-3-Teams. Fehlende Spieler wurden nach den Auktionen automatisch aufgefüllt; bei vielen fehlenden Plätzen sinkt die Chance auf Stars.'):'Vergleicht eure Kreationen und kürt den Sieger.'}</p><div class="summary-grid">${players().map(summaryPlayer).join('')}</div>${current.mode==='football'&&!isShort()?lineupEditor(me()):''}${actions}</section></div>`;
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
       img.onerror=()=>img.remove();el.classList.add('has-photo');el.append(img);
       const credit=document.createElement('a');credit.className='portrait-source';credit.href=info.source;credit.target='_blank';credit.rel='noopener noreferrer';credit.textContent='ⓘ';credit.title='Fotograf, Quelle und Lizenz bei Wikimedia Commons prüfen';credit.setAttribute('aria-label','Bildquelle und Lizenz öffnen');img.addEventListener('load',()=>{if(!el.isConnected)return;el.append(credit);if(info.article?.startsWith('https://en.wikipedia.org/wiki/')){const wiki=document.createElement('a');wiki.className='portrait-wiki-link';wiki.href=info.article;wiki.target='_blank';wiki.rel='noopener noreferrer';wiki.title='Wikipedia-Profil des Spielers';wiki.textContent='W';wiki.setAttribute('aria-label','Wikipedia-Spielerprofil öffnen');el.append(wiki);}},{once:true});
     });
   }
   function render(){if(!current)return;
    if(current.status==='reveal'&&current.card&&current.lastResult)finishedAuctions.set(`${current.code}:${current.round}`,{title:current.card.title,emoji:current.card.emoji,detail:current.card.detail,result:current.lastResult.winnerName||'Niemand'});
    const scene=current.status==='waiting'?'lobby':current.status==='countdown'?'countdown':current.mode==='football'?'football':(['bidding','tiebreak','reveal'].includes(current.status)?'auction':current.status);
    const changed=scene!==lastScene;lastScene=scene;
    // Optional, very short cue: play once per new elite offer / won auction.
    const eliteKey=current.mode==='football'&&elite(current.card)?`${current.code}:${current.round}`:'';
    if(current.status==='bidding' && eliteKey && eliteKey!==lastEliteCueKey){
      lastEliteCueKey=eliteKey;playTick(780);
    }
    const winKey=current.status==='reveal'&&current.lastResult?.winnerId===current.ownId?`${current.code}:${current.round}`:'';
    if(winKey && winKey!==lastWinCueKey){lastWinCueKey=winKey;playTick(600);}
    $('#exitGame').textContent=current.status==='waiting'?'← Spiel verlassen':'← Zur Lobby';$('#gameContent').innerHTML=current.status==='waiting'?waitingScreen():current.status==='countdown'?countdownScreen():current.status==='autofill'?autoFillScreen():['bidding','tiebreak','reveal'].includes(current.status)?auctionScreen():votingScreen();if(current.mode==='football')hydratePortraits();if(changed){const content=$('#gameContent');content.classList.remove('bb-scene-enter');void content.offsetWidth;content.classList.add('bb-scene-enter');}if(current.status!=='countdown')lastCountdownSecond=null;updateCountdown();updateHeader();}
  async function postAction(action, data={}){if(requestPending||!session)return;requestPending=true;try{const state=await request(`/api/rooms/${session.code}/${action}`,'POST',{token:session.token,...data});current=state;render();}catch(err){notify(err.message);}finally{requestPending=false;}}
  function navigateHome(){if(session&&current){leaveRoom();}else showHome();}
  async function leaveRoom(){
    if(!session)return showHome();
    if(current?.status!=='complete'&&current?.status!=='waiting'&&!confirm('Möchtest du den Raum wirklich verlassen? Dein Mitspieler bekommt eine Nachricht.'))return;
    try{await request(`/api/rooms/${session.code}/leave`,'POST',{token:session.token});}
    catch(err){notify(err.message);return;}
    stopEvents();sessionStorage.removeItem('bidbattle-session');session=null;current=null;showHome();notify('Du hast den Spielraum verlassen.');
  }
  function showCollection(ownerId,index){
    if(!current||current.mode==='football')return;
    const owner=players().find(x=>x.id===ownerId),item=owner?.items[index];if(!item)return;
    $('#collectionTitle').textContent=`${item.emoji} ${item.title}`;
    $('#collectionOwner').textContent=`${owner.name} · ${item.type}`;
    $('#collectionDescription').textContent=item.detail;
    openDialog('collectionDialog');
  }
  function resumeEntryIntent(){
    const action=pendingEntry;pendingEntry=null;
    if(action?.type==='create')createModal(action.mode,action.variant);
    else if(action?.type==='join')joinModal(action.code);
    else {const incoming=new URLSearchParams(location.search).get('room');if(incoming&&!session)joinModal(incoming);}
  }
  function setIdentity(mode){identityMode=mode;localStorage.setItem('bidbattle-identity',mode);closeDialogs();resumeEntryIntent();}
  function showAuth(mode){loginMode=mode;$('#accountNameWrap').classList.toggle('hidden',mode==='login');$('#accountHeading').textContent=mode==='login'?'Bei BidBattle anmelden':'Kostenloses Konto erstellen';$('#authSubmit').textContent=mode==='login'?'Anmelden':'Registrieren';$('#accountName').required=mode!=='login';$('#accountName').value=savedName();openDialog('accountDialog');}
  async function authRestore(){if(!authToken)return;try{const v=await request('/api/auth/me');account=v.user;identityMode='account';localStorage.setItem('bidbattle-identity','account');chosenAvatar=emojiAvatar(account.avatar);chosenColor=COLORS.includes(account.avatarColor)?account.avatarColor:'lilac';persistName(account.name);}catch{authToken='';localStorage.removeItem('bidbattle-auth-token');identityMode='';}}
  async function syncRegisteredProfile(name){
    if(!account)return;
    if(account.name===name && account.avatar===chosenAvatar && account.avatarColor===chosenColor)return;
    const r=await request('/api/auth/profile','POST',{name,avatar:chosenAvatar,avatarColor:chosenColor});
    account=r.user;
  }
  async function copyText(value){try{await navigator.clipboard.writeText(value);notify('Kopiert! 🎉');}catch{const temp=document.createElement('textarea');temp.value=value;temp.style.position='fixed';temp.style.opacity='0';document.body.append(temp);temp.select();try{document.execCommand('copy');notify('Kopiert! 🎉');}catch{notify(`Zum Kopieren: ${value}`);}temp.remove();}}

  // Homepage and navigation: fewer buttons and real Home actions.
  setupAvatarPickers();
  countdownTicker=setInterval(updateCountdown,220);
  $$('[data-create]').forEach(el=>el.addEventListener('click',()=>{
    if(el.classList.contains('header-cta')){
      if(el.dataset.headerAction==='home'){navigateHome();return;}
      if(el.dataset.headerAction==='game'){showGame();return;}
    }
    createModal();
  }));
  $$('[data-join]').forEach(el=>el.addEventListener('click',()=>joinModal()));
  $$('[data-playmode]').forEach(el=>el.addEventListener('click',()=>el.dataset.playmode==='football'?chooseFootballVariant():createModal(el.dataset.playmode)));
  $$('[data-football-choice]').forEach(el=>el.addEventListener('click',()=>{closeDialogs();createModal('football',el.dataset.footballChoice);}));
  $$('[data-close]').forEach(el=>el.addEventListener('click',()=>el.closest('dialog').close()));
  $$('dialog').forEach(el=>el.addEventListener('click',event=>{if(event.target===el)el.close();}));
  $('#profileBtn').addEventListener('click',()=>{$('#profileName').value=savedName();$('#accountActions').classList.toggle('hidden',!account);$('#guestAccountActions').classList.toggle('hidden',!!account);openDialog('profileDialog');});
  $('#profileForm').addEventListener('submit',async e=>{e.preventDefault();const name=$('#profileName').value;
    if(account){try{const r=await request('/api/auth/profile','POST',{name,avatar:chosenAvatar,avatarColor:chosenColor});account=r.user;}catch(err){notify(err.message);return;}}
    persistName(name);closeDialogs();notify('Profil gespeichert – für neue Duelle.');});
  $('#guestRegister').addEventListener('click',()=>{closeDialogs();showAuth('register');});
  $('#guestLogin').addEventListener('click',()=>{closeDialogs();showAuth('login');});
  $('#chooseGuest').addEventListener('click',()=>setIdentity('guest'));
  $('#chooseRegister').addEventListener('click',()=>{closeDialogs();showAuth('register');});
  $('#chooseLogin').addEventListener('click',()=>{closeDialogs();showAuth('login');});
  $('#authSwitch').addEventListener('click',()=>showAuth(loginMode==='login'?'register':'login'));
  $('#accountForm').addEventListener('submit',async e=>{e.preventDefault();const button=$('#authSubmit');button.disabled=true;
    try{const r=await request(`/api/auth/${loginMode}`,'POST',{email:$('#accountEmail').value,password:$('#accountPassword').value,name:$('#accountName').value,avatar:chosenAvatar,avatarColor:chosenColor});
      authToken=r.token;account=r.user;localStorage.setItem('bidbattle-auth-token',authToken);identityMode='account';localStorage.setItem('bidbattle-identity','account');chosenAvatar=emojiAvatar(account.avatar);chosenColor=COLORS.includes(account.avatarColor)?account.avatarColor:'lilac';persistName(account.name);closeDialogs();notify('Du bist angemeldet!');
      resumeEntryIntent();
    }catch(err){notify(err.message);}finally{button.disabled=false;}
  });
  $('#logoutAccount').addEventListener('click',async()=>{if(!account)return;await request('/api/auth/logout','POST',{}).catch(()=>{});account=null;authToken='';identityMode='';localStorage.removeItem('bidbattle-auth-token');localStorage.removeItem('bidbattle-identity');closeDialogs();openDialog('entryDialog');});
  $('#deleteAccount').addEventListener('click',async()=>{if(!account)return;const pw=prompt('Zur Kontolöschung bitte dein Passwort eingeben:');if(!pw)return;
    try{await request('/api/auth/delete','POST',{password:pw});account=null;authToken='';identityMode='';localStorage.removeItem('bidbattle-auth-token');localStorage.removeItem('bidbattle-identity');closeDialogs();openDialog('entryDialog');notify('Konto gelöscht.');}catch(err){notify(err.message);}
  });
  $('#exitGame').addEventListener('click',()=>{
    if(!session){showHome();return;}if(current?.status==='waiting'){leaveRoom();return;}
    if(current?.status==='complete'){postAction('lobby');return;}
    if(confirm('Die aktuelle Partie für beide Spieler beenden und in die gemeinsame Lobby zurückkehren?'))postAction('lobby');
  });
  $('#homeLogo').addEventListener('click',e=>{e.preventDefault();navigateHome();});
  $('#navHome').addEventListener('click',event=>{event.preventDefault();if(session&&current){navigateHome();return;}showHome();});
  $('#navModes').addEventListener('click',event=>{event.preventDefault();if(session&&current){notify('Verlasse zuerst den aktuellen Spielraum, um die Modi zu wechseln.');return;}showHome();requestAnimationFrame(()=>$('#modes').scrollIntoView({behavior:'smooth',block:'start'}));});
  function updateBudgetOptions(){
    const select=$('#createBudget');
    const football=$('#createMode').value==='football';
    const short=football && $('#createFootballVariant').value==='byp';
    const newOptions=short?[[20,'20 € Spielgeld (Klassiker)'],[30,'30 € Spielgeld'],[40,'40 € Spielgeld'],[50,'50 € Spielgeld (Extrem)']]:football?[[50,'50 € Spielgeld (Startelf)'],[75,'75 € Spielgeld'],[100,'100 € Spielgeld']]:[[20,'20 € Spielgeld (Klassiker)'],[10,'10 € Spielgeld'],[30,'30 € Spielgeld'],[50,'50 € Spielgeld']];
    const before=Number(select.value);
    select.innerHTML=newOptions.map(([val,label])=>`<option value="${val}">${label}</option>`).join('');
    select.value=String(newOptions.some(([val])=>val===before)?before:(football&&!short?50:20));
    $('#footballVariantFields').classList.toggle('hidden',!football);
    $('#playerLimitFields').classList.toggle('hidden',!short);
    $('#footballModeHint').classList.toggle('hidden',!football);
    $('#foodDishFields').classList.toggle('hidden',$('#createMode').value!=='food');
  }
  $('#createMode').addEventListener('change',()=>{updateBudgetOptions();updateOnboardMode();});
  $('#bbCreateContinue').addEventListener('click',()=>{const field=$('#createName');if(!field.reportValidity())return;setCreateStep(2);});
  $('#bbCreateBack').addEventListener('click',()=>setCreateStep(1));
  $('#createName').addEventListener('input',renderOnboardingPreview);
  $('#createFootballVariant').addEventListener('change',updateBudgetOptions);
  $('#createFoodChoice').addEventListener('change',updateOnboardMode);
  updateBudgetOptions();
  $('#createForm').addEventListener('submit',async e=>{
    e.preventDefault();const name=$('#createName').value.trim();if(!name)return;const button=$('#createSubmit');button.disabled=true;button.textContent='Wird erstellt …';
    try{await syncRegisteredProfile(name);const response=await request('/api/rooms','POST',{name,mode:$('#createMode').value,footballVariant:$('#createMode').value==='football'?$('#createFootballVariant').value:null,playerLimit:Number($('#createPlayerLimit').value),budget:Number($('#createBudget').value),timeLimit:Number($('#createTimeLimit').value),auctionType:$('#createForm input[name=auctionType]:checked').value,foodChoice:$('#createMode').value==='food'?$('#createFoodChoice').value:null,avatar:chosenAvatar,avatarColor:chosenColor});persistName(name);await enter(response);}catch(err){notify(err.message);}finally{button.disabled=false;button.textContent='Spiel erstellen →';}
  });
  $('#joinCode').addEventListener('input',e=>{e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);});
  $('#joinForm').addEventListener('submit',async e=>{
    e.preventDefault();const name=$('#joinName').value.trim();const code=$('#joinCode').value.trim().toUpperCase();if(!/^[A-Z2-9]{6}$/.test(code)){notify('Bitte gib einen gültigen 6-stelligen Code ein.');return;}
    const button=$('#joinSubmit');button.disabled=true;button.textContent='Verbinde …';
    try{await syncRegisteredProfile(name);const response=await request(`/api/rooms/${code}/join`,'POST',{name,avatar:chosenAvatar,avatarColor:chosenColor});persistName(name);await enter(response);}catch(err){notify(err.message);}finally{button.disabled=false;button.textContent='Spiel beitreten →';}
  });
  $('#gameContent').addEventListener('click',async e=>{
    if(e.target.closest('.squad-editor > summary')){editorOpen=!editorOpen;return;}
    const quick=e.target.closest('[data-plus]');if(quick){const input=$('#bidAmount');if(input){input.value=String(Math.min(Number(input.max),Math.max(Number(input.min||0),Number(input.value||0))+Number(quick.dataset.plus)));syncBidRange();}return;}
    if(e.target.closest('[data-pass]'))return postAction('bid',{amount:0});
     if(e.target.closest('[data-open-pass]'))return postAction('pass');
    const voter=e.target.closest('[data-vote]');if(voter)return postAction('vote',{winnerId:voter.dataset.vote});
    const modeButton=e.target.closest('[data-lobby-mode]');if(modeButton){const select=$('#lobbyMode');if(select){select.value=modeButton.dataset.lobbyMode;syncLobbyControls();$$('[data-lobby-mode]', $('#gameContent')).forEach(btn=>{const active=btn===modeButton;btn.classList.toggle('selected',active);btn.setAttribute('aria-pressed',String(active));});}return;}
    const copier=e.target.closest('[data-copy]');if(copier)return copyText(copier.dataset.copy==='code'?current.code:shareLink());
    if(e.target.closest('[data-rematch]'))return postAction('lobby');
    if(e.target.closest('[data-leave]'))return leaveRoom();
    if(e.target.closest('[data-sound-toggle]')){soundEnabled=!soundEnabled;localStorage.setItem('bidbattle-sound',soundEnabled?'on':'off');render();return;}
    if(e.target.closest('[data-previous-card]')){const prev=finishedAuctions.get(`${current.code}:${current.round-1}`);if(prev){$('#collectionTitle').textContent=`${prev.emoji} ${prev.title}`;$('#collectionOwner').textContent='Vorherige abgeschlossene Auktion';$('#collectionDescription').textContent=`${prev.detail} · Ergebnis: ${prev.result}`;openDialog('collectionDialog');}return;}
    const ingredient=e.target.closest('[data-item-index]');if(ingredient)return showCollection(ingredient.dataset.ownerId,Number(ingredient.dataset.itemIndex));
    if(e.target.closest('[data-playagain]'))return postAction('playagain');
    if(e.target.closest('[data-start]'))return postAction('start');
  });
  function syncBidRange(fromRange=false){
    const input=$('#bidAmount'),range=$('#bidRange');if(!input||!range)return;
    if(fromRange)input.value=range.value;
    else if(input.value!==''){const n=Number(input.value);if(Number.isFinite(n))range.value=String(Math.max(Number(range.min),Math.min(Number(range.max),n)));}
    const min=Number(range.min),max=Number(range.max);
    range.style.setProperty('--bid-percent',`${max>min?((Number(range.value)-min)/(max-min))*100:0}%`);
  }
  $('#gameContent').addEventListener('input',e=>{
    if(e.target.id==='bidRange')syncBidRange(true);
    else if(e.target.id==='bidAmount')syncBidRange();
  });
  $('#gameContent').addEventListener('change',e=>{if(e.target.id==='bidAmount'){syncBidRange();return;}

    if(e.target.matches('#lobbyMode,#lobbyVariant')){syncLobbyControls();if(e.target.id==='lobbyMode')$$('[data-lobby-mode]', $('#gameContent')).forEach(btn=>{const active=btn.dataset.lobbyMode===e.target.value;btn.classList.toggle('selected',active);btn.setAttribute('aria-pressed',String(active));});return;}
    const el=e.target.closest('[data-assign-player]');if(!el)return;
    postAction('lineup',{playerId:el.dataset.assignPlayer,slot:el.value});
  });
  $('#gameContent').addEventListener('submit',e=>{
    if(e.target.id==='lobbySettings'){
      e.preventDefault();return postAction('settings',{mode:$('#lobbyMode').value,footballVariant:$('#lobbyVariant').value,playerLimit:Number($('#lobbyLimit').value),budget:Number($('#lobbyBudget').value),auctionType:$('#lobbyAuction').value,timeLimit:Number($('#lobbyTime').value),foodChoice:$('#lobbyMode').value==='food'?$('#lobbyFoodChoice').value:null});
    }
    if(e.target.id!=='bidForm')return;e.preventDefault();const n=Number($('#bidAmount').value);const min=current.auctionType==='open'?current.open.currentBid+1:0;if(!Number.isSafeInteger(n)||n<min||n>me().budget){notify(`Bitte einen ganzen Betrag von ${min} bis ${me().budget} € eingeben.`);return;}postAction('bid',{amount:n});});

  // Restore a session on reload. Each browser tab can hold its own player seat.
  persistName(savedName());
  authRestore().then(()=>{if(!identityMode&&!session)openDialog('entryDialog');});
  const incoming=new URLSearchParams(location.search).get('room');
  try{session=JSON.parse(sessionStorage.getItem('bidbattle-session')||'null');}catch{session=null;}
  if(session?.code && session?.token && (!incoming || incoming===session.code)){
    showGame();refresh().then(connect).catch(()=>{sessionStorage.removeItem('bidbattle-session');session=null;showHome();if(incoming)joinModal(incoming);});
  }else if(incoming && /^[A-Z2-9]{6}$/.test(incoming)&&identityMode){joinModal(incoming);}
})();
