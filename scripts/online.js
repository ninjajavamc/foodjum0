// Two-player online co-op: pinned local PeerJS, encrypted WebRTC, authoritative host.
// The guest sends controls, never positions, health, inventories or enemy damage.
const ONLINE_PROTOCOL=1,ONLINE_KEYS=['a','d','w','s','ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','touchLeft','touchRight','touchUp','touchDown','touchJump'];
const online={active:false,role:'',peer:null,conn:null,code:'',remote:null,choice:null,remoteChoice:null,modal:'',remoteModal:'',context:null,queue:[],teamScore:0,epoch:0,sentEpoch:-1,seq:0,lastSeq:-1,lastInput:0,lastReceive:0,lastSend:0,lastControls:0,generation:0,closing:false,panel:null};
let peerLibraryPromise=null;
function onlineCode(length=8){const a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',bytes=new Uint8Array(length);crypto.getRandomValues(bytes);return [...bytes].map(b=>a[b%a.length]).join('')}
function onlineStatus(text){const el=document.querySelector('#onlineStatus');if(el)el.textContent=text}
function onlineMenu(){
 screen='online';keys={};heldPointers.clear();
 if(!document.createElement)return;
 if(!online.panel){
  const box=document.createElement('section');box.id='onlinePanel';box.setAttribute('aria-label','Online Multiplayer');
  box.innerHTML='<h2>ONLINE · ZU ZWEIT</h2><p>Raum erstellen, Code an deinen Freund geben und gemeinsam spielen. PC und iPad benutzen dieselbe Steuerung.</p><label>Deine Figur <select id="onlineCharacter"></select></label><label>Dein Begleiter <select id="onlineBuddy"></select></label><label>Welt (der Gastgeber entscheidet) <select id="onlineWorld"></select></label><div class="onlineRow"><button id="onlineCreate">Raum erstellen</button><input id="onlineJoinCode" placeholder="RAUMCODE" aria-label="Raumcode" maxlength="8" autocomplete="off" autocapitalize="characters" spellcheck="false"><button id="onlineJoin">Beitreten</button></div><p id="onlineRoom" hidden>Dein Raumcode: <strong id="onlineCode"></strong> <button id="onlineCopy">Kopieren</button></p><p id="onlineStatus" role="status" aria-live="polite">Wählt eure Figuren vor dem Verbinden. Kein Konto nötig.</p><div class="onlineRow"><button id="onlineStart" disabled>Gemeinsam starten</button><button id="onlineLeave">Zurück / Raum verlassen</button></div><small>Internet nötig. Beide lassen den Spiel-Tab offen. PeerJS vermittelt die Verbindung; in manchen Netzen kann sie blockiert sein. Teilt den Code nur mit eurem Freund.</small>';
  document.body.appendChild(box);online.panel=box;
  const options=(id,list)=>{const select=document.querySelector(id);list.forEach((label,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=label;select.appendChild(option)})};
  options('#onlineCharacter',chars.map(c=>c.name));options('#onlineBuddy',BUDDIES.map(b=>b.name));
  const worlds=document.querySelector('#onlineWorld');for(let n=1;LEVEL_SETTINGS[n];n++){const option=document.createElement('option');option.value=String(n);option.textContent=n+' · '+worldName(n);worlds.appendChild(option)}
  document.querySelector('#onlineCreate').onclick=()=>onlineConnect('host');document.querySelector('#onlineJoin').onclick=()=>onlineConnect('guest');
  document.querySelector('#onlineLeave').onclick=()=>onlineLeave();document.querySelector('#onlineStart').onclick=()=>onlineStart();
  document.querySelector('#onlineCopy').onclick=async()=>{try{await navigator.clipboard.writeText(online.code);onlineStatus('Code kopiert – an deinen Freund schicken.')}catch(_){onlineStatus('Code oben ablesen und deinem Freund schicken: '+online.code)}};
  document.querySelector('#onlineJoinCode').onkeydown=e=>{if(e.key==='Enter')onlineConnect('guest')};
 }
 online.panel.hidden=false;
}
function drawOnlineMenu(){x.fillStyle='rgba(25,43,53,.88)';fillViewport();if(!online.panel){x.fillStyle='#fff';x.textAlign='center';x.font='28px system-ui';x.fillText('Online Multiplayer · Raum erstellen oder beitreten',W/2,220)}}
function onlineUiConnected(locked){
 for(const id of ['onlineCharacter','onlineBuddy','onlineWorld','onlineCreate','onlineJoin','onlineJoinCode']){const el=document.querySelector('#'+id);if(el)el.disabled=locked}
 const start=document.querySelector('#onlineStart');if(start)start.disabled=!(online.role==='host'&&online.remoteChoice&&online.conn?.open);
}
function loadPeerLibrary(){
 if(globalThis.Peer)return Promise.resolve();
 if(!peerLibraryPromise)peerLibraryPromise=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='assets/vendor/peerjs.min.js?v=coop1';s.onload=()=>globalThis.Peer?resolve():reject(Error('Bibliothek fehlt'));s.onerror=()=>{peerLibraryPromise=null;reject(Error('Netzwerkbibliothek konnte nicht geladen werden'))};document.head.appendChild(s)});
 return peerLibraryPromise;
}
async function onlineConnect(role){
 if(online.peer)return;
 const code=role==='host'?onlineCode():document.querySelector('#onlineJoinCode').value.trim().toUpperCase();
 if(!/^[A-HJ-NP-Z2-9]{8}$/.test(code)){onlineStatus('Bitte den vollständigen achtstelligen Raumcode eingeben.');return}
 online.choice={char:Number(document.querySelector('#onlineCharacter').value),buddy:Number(document.querySelector('#onlineBuddy').value),level:Number(document.querySelector('#onlineWorld').value)};
 const generation=++online.generation;online.role=role;online.code=code;onlineUiConnected(true);onlineStatus('Verbindung wird vorbereitet …');
 try{
  if(!globalThis.RTCPeerConnection)throw Error('Dieser Browser unterstützt WebRTC nicht. Bitte aktuelles Safari oder Chrome verwenden.');
  await loadPeerLibrary();if(screen!=='online'||generation!==online.generation)return;
  const peer=new Peer(role==='host'?'foodjum0-room-'+code:'foodjum0-player-'+onlineCode(12),{secure:true,debug:0});online.peer=peer;
  const timeout=setTimeout(()=>{if(!online.conn?.open&&online.peer===peer)onlineFail('Keine Verbindung. Prüft Internet und Raumcode; versucht gegebenenfalls ein anderes WLAN.')},25000);
  peer.on('open',()=>{
   if(online.peer!==peer)return;
   if(role==='host'){clearTimeout(timeout);document.querySelector('#onlineCode').textContent=code;document.querySelector('#onlineRoom').hidden=false;onlineStatus('Raum bereit. Gib deinem Freund den Code '+code+'.')}
   else onlineBindConnection(peer.connect('foodjum0-room-'+code,{reliable:true}),timeout);
  });
  peer.on('connection',conn=>{if(role!=='host'||online.conn){conn.on('open',()=>{conn.send({type:'full',v:ONLINE_PROTOCOL});setTimeout(()=>conn.close(),100)});return}onlineBindConnection(conn,timeout)});
  peer.on('error',e=>{if(online.peer!==peer)return;onlineFail(e.type==='peer-unavailable'?'Raum nicht gefunden. Der Gastgeber muss zuerst einen Raum erstellen.':e.type==='unavailable-id'?'Dieser Code ist schon belegt. Bitte einen neuen Raum erstellen.':'Verbindungsfehler. Versucht es erneut oder in einem anderen WLAN.')});
  peer.on('disconnected',()=>{if(online.peer===peer&&!online.active)onlineFail('Verbindungsdienst nicht erreichbar. Bitte neu verbinden.')});
 }catch(e){onlineFail(e.message)}
}
function onlineBindConnection(conn,timeout){
 online.conn=conn;
 conn.on('open',()=>{clearTimeout(timeout);online.lastReceive=performance.now();if(online.role==='guest'){conn.send({v:ONLINE_PROTOCOL,type:'hello',char:online.choice.char,buddy:online.choice.buddy});onlineStatus('Verbunden! Warte, bis dein Freund gemeinsam startet.')}else onlineStatus('Freund verbindet sich …')});
 conn.on('data',packet=>{online.lastReceive=performance.now();onlineReceive(packet)});
 conn.on('close',()=>{if(!online.closing&&online.conn===conn)onlineFail('Dein Freund hat die Verbindung verlassen. Ihr könnt einen neuen Raum erstellen.')});
 conn.on('error',()=>{if(!online.closing&&online.conn===conn)onlineFail('Die Spielverbindung wurde unterbrochen. Bitte neu verbinden.')});
}
function onlineCloseTransport(){
 online.generation++;online.closing=true;online.active=false;
 const conn=online.conn,peer=online.peer;online.conn=null;online.peer=null;conn?.close?.();peer?.destroy?.();
 online.remote=null;online.remoteChoice=null;online.role='';online.queue=[];online.modal='';online.remoteModal='';online.context=null;online.lastSeq=-1;online.sentEpoch=-1;online.lastReceive=0;online.closing=false;
 onlineUiConnected(false);const room=document.querySelector('#onlineRoom');if(room)room.hidden=true;
}
function onlineFail(text){onlineCloseTransport();onlineMenu();onlineStatus(text)}
function onlineLeave(){onlineCloseTransport();if(online.panel)online.panel.hidden=true;screen='start';keys={};heldPointers.clear()}
function onlineStart(){
 if(online.role!=='host'||!online.conn?.open||!online.remoteChoice)return;
 online.active=true;online.lastReceive=performance.now();online.teamScore=0;selected=online.choice.char;selectedBuddy=online.choice.buddy;selectedLevel=online.choice.level;
 online.panel.hidden=true;reset();onlineSendState(true);
}
function onlineIsGuest(){return online.active&&online.role==='guest'}
function onlineReceive(packet){
 if(!packet||typeof packet!=='object'||packet.v!==ONLINE_PROTOCOL){if(packet?.type==='hello')onlineFail('Eure Spielversionen unterscheiden sich. Beide die Webseite neu laden.');return}
 if(packet.type==='full'){onlineFail('Dieser Raum ist bereits voll. Ein Raum ist für zwei Spieler.');return}
 if(online.role==='host'){
  if(packet.type==='hello'&&!online.active&&Number.isInteger(packet.char)&&packet.char>=0&&packet.char<5&&Number.isInteger(packet.buddy)&&packet.buddy>=0&&packet.buddy<4){online.remoteChoice={char:packet.char,buddy:packet.buddy};onlineUiConnected(true);onlineStatus('Freund ist da! Der Gastgeber kann jetzt gemeinsam starten.');return}
  if(!online.active||!online.remote)return;
  if(packet.type==='input'){const input={};for(const key of ONLINE_KEYS)input[key]=packet.keys?.[key]===true;online.remote.input=input;online.lastInput=performance.now()}
  if(packet.type==='modal'&&['','inventory','crafting'].includes(packet.value)){online.remoteModal=packet.value;online.remote.input={}}
  if(packet.type==='action'&&online.queue.length<30&&typeof packet.action==='string')online.queue.push({action:packet.action,arg:packet.arg});
 }else if(packet.type==='state')onlineApplyState(packet);
}
function onlineWithActor(actor,fn){
 const saved={p:player,char:selected,buddy:companion,bonus:secretCompanion,babies:mandarinBabies,input:keys,recipe:selectedRecipe,context:online.context};
 online.context=saved;player=actor.p;selected=actor.char;companion=actor.buddy;secretCompanion=actor.bonus;mandarinBabies=actor.babies;keys=actor.input;selectedRecipe=actor.recipe||0;
 try{return fn()}finally{
  actor.p=player;actor.buddy=companion;actor.bonus=secretCompanion;actor.babies=mandarinBabies;actor.input=keys;actor.recipe=selectedRecipe;
  player=saved.p;selected=saved.char;companion=saved.buddy;secretCompanion=saved.bonus;mandarinBabies=saved.babies;keys=saved.input;selectedRecipe=saved.recipe;online.context=saved.context;
 }
}
function onlinePlain(value){
 const seen=new WeakSet();return JSON.parse(JSON.stringify(value,(key,v)=>{
  if(['hitTargets','absorbingFlow','saved','hatch','support'].includes(key))return undefined;
  if(typeof v==='number'&&!Number.isFinite(v))return v===Infinity?1e9:0;
  if(v&&typeof v==='object'){if(seen.has(v))return undefined;seen.add(v)}return v;
 }));
}
function onlineActorPacket(p,char,buddy,bonus,babies){return {p:onlinePlain(p),char,buddy:buddy?onlinePlain(buddy):null,bonus:bonus?onlinePlain(bonus):null,babies:onlinePlain(babies),input:{},recipe:0}}
function onlineAfterReset(){
 if(!online.active||online.role!=='host')return;
 online.remote=null;online.teamScore=0;online.modal='';online.remoteModal='';online.queue=[];
 const p=onlinePlain(player);p.x+=65;p.buddyIndex=online.remoteChoice.buddy;p.secretBuddyIndex=null;p.down=false;
 online.remote={p,char:online.remoteChoice.char,buddy:null,bonus:null,babies:[],input:{},recipe:0};
 onlineWithActor(online.remote,()=>{resetCompanion();enforceMoonItemRules()});online.epoch++;online.sentEpoch=-1;
}
function onlineOthers(){if(!online.active)return [];const saved=online.context?.p,other=saved&&saved!==player?saved:online.remote?.p;return other&&other!==player?[other]:[]}
function onlinePlayers(){return [player,...onlineOthers()].filter(Boolean)}
function onlineAfterSpawn(){
 if(!online.active||online.role!=='host')return;
 online.epoch++;online.sentEpoch=-1;
 if(online.remote){online.remote.p.hp=MAX_HP;online.remote.p.secretBuddyIndex=null;online.remote.p.down=false;online.remote.p.hasKey=false;online.remote.p.marshmallowTime=0;online.remote.p.fireTime=0;online.remote.p.jumpBoost=0;onlineTransition();onlineWithActor(online.remote,()=>{enforceMoonItemRules();resetCompanion()})}
}
function onlineTransition(){
 if(!online.active||online.role!=='host')return;
 online.epoch++;online.sentEpoch=-1;
 for(const other of onlineOthers()){other.x=Math.max(0,Math.min((boss?W:levelWidth)-other.w,player.x+65));other.y=player.y;other.vx=0;other.vy=0;other.inv=110;other.swing=null;other.climbing=null;other.seatedCatapult=null;other.trappedIn=null;other.launchFrames=0;other.onGround=false}
}
function onlineReadyStep(){
 if(onlineIsGuest())return false;
 if(!online.active)return true;
 if(online.role!=='host'||!online.remote)return false;
 if(performance.now()-online.lastInput>500)online.remote.input={};
 onlineProcessActions();return !online.remoteModal;
}
function onlineProcessActions(){
 const queue=online.queue.splice(0,12);
 for(const {action,arg} of queue){
  if(action==='pause'){if(['play','paused'].includes(screen))togglePause();continue}
  if(action==='victory'&&screen==='victory'&&['retry','next','menu'].includes(arg)){if(arg==='menu')onlineLeave();else victoryAction(arg);continue}
  if(action==='over'&&screen==='over'&&['retry','menu'].includes(arg)){if(arg==='menu')onlineLeave();else gameOverAction(arg);continue}
  if(!online.remote||online.remote.p.down||!['play','inventory','crafting'].includes(screen))continue;
  const oldScreen=screen;
  onlineWithActor(online.remote,()=>{
   if(action==='craft'&&Number.isInteger(arg)&&arg>=0&&arg<RECIPES.length&&online.remoteModal==='crafting'){screen='crafting';selectedRecipe=arg;craftItem()}
   else if(action==='slot'&&Number.isInteger(arg)&&arg>=1&&arg<=5)selectInventorySlot(arg);
   else if(action==='inventory'&&typeof arg==='string'&&/^(powerTab|buildTab|slot[0-2])$/.test(arg))inventoryAction(arg);
   else if(action==='drop'){screen=online.remoteModal||oldScreen;dropItem()}
   else if(!online.remoteModal&&oldScreen==='play'){
    if(action==='jump')jump();else if(action==='ability')ability();else if(action==='item')useItem();else if(action==='interact')interactWorld();else if(action==='door')openBossDoor();
   }
  });
  if(screen==='crafting'||screen==='inventory')screen=oldScreen;
 }
}
function onlineSendAction(action,arg){
 if(!onlineIsGuest())return false;
 if(online.conn?.open)online.conn.send({v:ONLINE_PROTOCOL,type:'action',action,arg});return true;
}
function onlineGuestModal(mode){
 if(!onlineIsGuest())return false;
 online.modal=mode;screen=mode||online.phase||'play';keys={};heldPointers.clear();
 online.conn?.send({v:ONLINE_PROTOCOL,type:'modal',value:mode});return true;
}
function onlineUpdatePartnerMotion(){
 if(!online.active||online.role!=='host'||!online.remote)return;
 online.oldEnemyY=new Map(enemies.map(e=>[e,e.y]));
 online.remote.previousBottom=onlineWithActor(online.remote,()=>updatePlayerMotion());
}
function onlineClosestPlayer(e){return onlinePlayers().filter(p=>!p.down).sort((a,b)=>Math.abs(a.x-e.x)-Math.abs(b.x-e.x))[0]||player}
function onlineProjectileTouches(o,p){
 if(o.type==='bossHeavyWave'&&o.flavor==='boss-fishstick')return Math.hypot(Math.max(p.x,Math.min(o.x+125,p.x+p.w))-o.x-125,Math.max(p.y,Math.min(o.y+125,p.y+p.h))-o.y-125)<=125;
 if(o.type==='popcornBlast')return Math.hypot(Math.max(p.x,Math.min(o.cx,p.x+p.w))-o.cx,Math.max(p.y,Math.min(o.cy,p.y+p.h))-o.cy)<=o.radius;
 return rect(p,o);
}
function onlineActorContacts(actor){
 onlineWithActor(actor,()=>{
  const p=player;if(p.down)return;
  for(const o of objects){
   if(o.life!==undefined&&o.life<=0)continue;
   if(o.type==='material'||o.type==='looseItem'){collectWorldLoot(o);continue}
   if(!rect(p,o)&&!['popcornBlast','bossHeavyWave'].includes(o.type))continue;
   if(o.type==='lunchbox')collectLunchbox(o);
   if(o.type==='key'&&!o.collected){o.collected=true;p.hasKey=true;door=true;playSound('pickup')}
   if(o.type==='colaFlow'){p.slow=Math.max(p.slow,20);hitPlayer(1,0)}
   if(o.type==='cheeseDrop'){hitPlayer(.2,0,30);o.life=0}
   if(o.type==='mentos'){hitPlayer(1,0);o.life=0}
   if(o.type==='explosivePopcorn'){explodePopcorn(o);continue}
   if(['bossWave','cutleryShot','bossHeavyWave','sugarPuff','popcornBlast','pickleShot','crumbShot','stormBolt','banquetShot'].includes(o.type)&&onlineProjectileTouches(o,p)){hitPlayer(o.damage||2,0,110);o.life=0}
  }
  for(const e of enemies){
   if(e.dead)continue;
   if(canStomp(e,actor.previousBottom,online.oldEnemyY?.get(e)??e.y)){e.hp--;if(e.hp<=0)killEnemy(e);bounceAfterStomp(e)}
   else if(rect(p,e)){if(e.type==='pudding')trapInPudding(e);else{if(e.type==='honey'){p.slow=Math.max(p.slow,180);p.honeyTime=180}hitPlayer(e.damage,p.x<e.x?-5:5)}}
  }
  updateMandarinBabies();updateCompanions();
 });
 const sharedKey=player.hasKey||actor.p.hasKey;player.hasKey=sharedKey;actor.p.hasKey=sharedKey;
}
function onlineBossStep(previousBottom){
 if(!online.active||online.role!=='host'||!online.remote)return false;
 const r=online.remote,aim=boss?onlineClosestPlayer(boss):player;
 if(aim===r.p)onlineWithActor(r,()=>updateBossFight(r.previousBottom));else updateBossFight(previousBottom);
 const other=aim===r.p?{p:player,char:selected,buddy:companion,bonus:secretCompanion,babies:mandarinBabies,input:keys,previousBottom}:r;
 onlineWithActor(other,()=>{if(player.down)return;for(const b of bossTargets()){if(canStomp(b,other.previousBottom,b.previousY)){b.hp--;b.flash=8;bounceAfterStomp(b,12)}else if(rect(player,b))hitPlayer(2,0,110)}});
 return true;
}
function onlinePlayerDown(){
 if(!online.active||online.role!=='host'||player.hp>0)return false;
 player.down=true;player.vx=0;player.vy=0;player.swing=null;player.climbing=null;player.seatedCatapult=null;player.trappedIn=null;
 if(onlinePlayers().every(p=>p.down)){screen='dying';playerDeathTimer=60;playSound('death')}
 return true;
}
function onlineReviveNearby(){
 if(!online.active||player.down)return false;
 const other=onlineOthers().find(p=>p.down&&Math.hypot(p.x-player.x,p.y-player.y)<100);if(!other)return false;
 other.down=false;other.hp=10;other.inv=150;other.y=player.y;other.x=Math.min((boss?W:levelWidth)-other.w,player.x+55);message='Freund wiederbelebt!';playSound('pickup');return true;
}
function onlineCanRevive(){return online.active&&!player.down&&onlineOthers().some(p=>p.down&&Math.hypot(p.x-player.x,p.y-player.y)<100)}
function addScore(amount){if(online.active&&online.role==='host'){online.teamScore+=amount;for(const p of onlinePlayers())p.score=online.teamScore}else player.score+=amount}
function onlineCatapultOccupied(o){return onlinePlayers().some(p=>p.seatedCatapult===o)}
function onlineOwnBoomerang(o){if(online.active&&online.role==='host'&&o.onlineOwner==='guest')onlineWithActor(online.remote,()=>updateBananaBoomerang(o));else updateBananaBoomerang(o)}
function onlineSendState(force=false){
 if(!online.conn?.open||online.role!=='host'||!online.active||!online.remote)return;
 if((online.conn.dataChannel?.bufferedAmount||0)>500000)return;
 const r=online.remote,phase=online.remoteModal||['inventory','crafting'].includes(screen)?'paused':screen;
 const packet={v:ONLINE_PROTOCOL,type:'state',seq:++online.seq,epoch:online.epoch,level,levelWidth,doorX,phase,door,message,tick,timer,playerDeathTimer,teamScore:online.teamScore,boss:boss?onlinePlain(boss):null,players:[onlineActorPacket(player,selected,companion,secretCompanion,mandarinBabies),onlineActorPacket(r.p,r.char,r.buddy,r.bonus,r.babies)],objects:objects.map(onlinePlain),enemies:enemies.map(onlinePlain),platforms:platforms.map(onlinePlain),lavaPits:onlinePlain(lavaPits),cliffs:onlinePlain(cliffs),secretPassages:secretPassages.map(onlinePlain),particles:particles.slice(-200).map(onlinePlain),defeated:defeated.map(onlinePlain),worldWind:onlinePlain(worldWind),kitchenWeather:onlinePlain(kitchenWeather),cloudRain:onlinePlain(cloudRain),undergroundTrip:undergroundTrip?onlinePlain({hidden:undergroundTrip.hidden,theme:undergroundTrip.theme,styleSeed:undergroundTrip.styleSeed}):null};
 if(force||online.sentEpoch!==online.epoch){packet.map={trees:trees.map(onlinePlain),hooks:hooks.map(onlinePlain),terraces:terraces.map(onlinePlain),obstacles:obstacles.map(onlinePlain)};online.sentEpoch=online.epoch}
 online.conn.send(packet);
}
function onlineApplyState(packet){
 if(!LEVEL_SETTINGS[packet.level]||!Array.isArray(packet.players)||packet.players.length!==2||packet.seq<=online.lastSeq)return;
 if(!packet.players.every(a=>Number.isInteger(a.char)&&a.char>=0&&a.char<5&&Number.isFinite(a.p?.x)&&Number.isFinite(a.p?.y)))return;
 if(!Array.isArray(packet.objects)||packet.objects.length>1500||!Array.isArray(packet.enemies)||packet.enemies.length>200)return;
 if(packet.epoch!==online.epoch&&!packet.map)return;
 online.lastSeq=packet.seq;online.epoch=packet.epoch;online.active=true;online.phase=packet.phase;online.teamScore=packet.teamScore;
 if(online.panel)online.panel.hidden=true;
 level=packet.level;selectedLevel=level;levelWidth=packet.levelWidth;doorX=packet.doorX;boss=packet.boss;door=packet.door;message=packet.message;tick=packet.tick;timer=packet.timer;playerDeathTimer=packet.playerDeathTimer;
 const own=packet.players[1];player=own.p;selected=own.char;selectedBuddy=player.buddyIndex;companion=own.buddy;secretCompanion=own.bonus;mandarinBabies=own.babies;online.remote=packet.players[0];
 enemies=packet.enemies;objects=packet.objects;particles=packet.particles;defeated=packet.defeated;secretPassages=packet.secretPassages;worldWind=packet.worldWind;kitchenWeather=packet.kitchenWeather;cloudRain=packet.cloudRain;undergroundTrip=packet.undergroundTrip;
 const lists={platforms,lavaPits,cliffs};for(const name of Object.keys(lists)){lists[name].length=0;lists[name].push(...packet[name])}
 if(packet.map){const lists={trees,hooks,terraces,obstacles};for(const name of Object.keys(lists)){lists[name].length=0;lists[name].push(...packet.map[name])}}
 if(!['play','paused'].includes(packet.phase))online.modal='';
 screen=online.modal||packet.phase;const target=cameraTargetX(player.x,boss?W:levelWidth);camera+=(target-camera)*.2;
 const targetY=boss&&level!==5?0:Math.min(floorAtX(player.x+player.w/2)-ground,player.y-170);cameraY+=(targetY-cameraY)*.2;
}
function onlineFrame(now){
 if(!online.active)return;
 if(online.lastReceive&&now-online.lastReceive>15000){onlineFail('Verbindung unterbrochen. Beide müssen den Spiel-Tab offen lassen.');return}
 if(online.role==='host'){
  onlineProcessActions();if(now-online.lastSend>=80){online.lastSend=now;onlineSendState()}
 }else if(now-online.lastControls>=33){
  online.lastControls=now;const input={};if(screen==='play')for(const key of ONLINE_KEYS)input[key]=keys[key]===true;
  online.conn?.send({v:ONLINE_PROTOCOL,type:'input',keys:input});
 }
}
function drawOnlinePartner(){
 if(!online.active||!online.remote)return;
 onlineWithActor(online.remote,()=>{
  drawCompanion();drawCompanion(secretCompanion);drawMandarinBabies();drawPlayerPowerIcons();drawMarshmallowEffect();
  if(player.swing){x.strokeStyle='#9ce0ff';x.lineWidth=3;x.beginPath();x.moveTo(player.swing.x,player.swing.y);x.lineTo(player.x+player.w/2,player.y+20);x.stroke()}
  if(player.down){x.save();x.translate(player.x+20,player.y+40);x.rotate(Math.PI/2);sprite(chars[selected].art,-30,-35,59,77);x.restore()}
  else if(isSwimming())drawSwimmingSprite(chars[selected].art,player.x-8,player.y-15,59,77);
  else drawWalkingSprite(chars[selected].art,player.x-8,player.y-15,59,77,player.walkPhase,player.onGround&&Math.abs(player.vx)>.1);
  x.fillStyle='#d6f1ff';x.strokeStyle='#365377';x.lineWidth=3;x.font='bold 13px system-ui';x.textAlign='center';const text=player.down?'FREUND · W HELFEN':'FREUND';x.strokeText(text,player.x+21,player.y-23);x.fillText(text,player.x+21,player.y-23);
 });
}
function drawOnlineHud(){
 if(!online.active||!online.remote)return;
 const p=online.remote.p;x.save();x.fillStyle='rgba(25,40,64,.85)';x.fillRect(W-238,99,220,52);x.fillStyle='#d8edff';x.textAlign='left';x.font='bold 13px system-ui';x.fillText('FREUND · '+chars[online.remote.char].name+' · '+p.hp+'/'+MAX_HP+' HP',W-229,117);x.fillStyle='#243b55';x.fillRect(W-229,125,197,13);x.fillStyle=p.down?'#be6d7e':'#80c7d9';x.fillRect(W-229,125,197*p.hp/MAX_HP,13);
 if(player.down||online.remoteModal){x.fillStyle='rgba(23,40,57,.9)';x.fillRect(W/2-190,275,380,50);x.fillStyle='#fff0cc';x.textAlign='center';x.font='18px system-ui';x.fillText(player.down?'Dein Freund kann dich mit W wiederbeleben.':'Freund hat Inventar / Werkbank offen.',W/2,305)}
 x.restore();
}
addEventListener('beforeunload',()=>{if(online.peer){online.closing=true;online.conn?.close();online.peer.destroy()}});
