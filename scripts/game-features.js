// Extra platforming, hook chaining, lunchbox items and cartoon effects. No dependencies.
const ITEM_TYPES=['mushroom','gum','wasabi','marshmallow'];
const ITEM_NAMES={marshmallow:'Marshmallow-Gleiten',mushroom:'Pilz (+1 Leben)',gum:'Kaugummi-Blase',wasabi:'Wasabi-Feuer',catapultKit:'Katapult-Bausatz',wallKit:'Steinmauer-Bausatz',springKit:'Sprungfeder',ladderKit:'Leiter-Bausatz'};
const ITEM_SHORT_NAMES={marshmallow:'Marshmallow',mushroom:'Pilz',gum:'Kaugummi',wasabi:'Wasabi',catapultKit:'Katapult',wallKit:'Steinmauer',springKit:'Sprungfeder',ladderKit:'Leiter'};
function baseFloorAtX(pos){return terraces.find(t=>pos>=t.x&&pos<t.x+t.w)?.y??ground}
function floorAtX(pos){if(boss)return ground;const room=secretPassages.find(r=>r.open&&pos>=r.x&&pos<r.x+r.w);return room?room.base+105:baseFloorAtX(pos)}
function buildTerraces(){
 terraces.length=0;
 for(let pos=1200;pos<levelWidth-2400;pos+=3000){
  const rise=(pos===1200?100:85+Math.floor(Math.random()*36))+(level>=2?20+(level-2)*10:0),drop=(pos===1200?110:85+Math.floor(Math.random()*41))+(level>=2?15+(level-2)*5:0);
  terraces.push({x:pos,w:650,y:ground-rise},{x:pos+1100,w:650,y:ground+drop});
  obstacles.push({type:'crate',x:pos-75,y:ground-45,w:65,h:45},{type:'crate',x:pos+1675,y:ground+drop-45,w:65,h:45});
 }
}
function stopAtTerrainStep(previousX,previousBottom){
 const oldFloor=floorAtX(previousX+player.w/2),newFloor=floorAtX(player.x+player.w/2);
 if(newFloor<oldFloor&&previousBottom>newFloor+4){player.x=previousX;player.vx=0}
}
function drawTerrainFloors(){
 const start=Math.max(0,camera-80),end=Math.min(boss?W:levelWidth,camera+W+80),cuts=[start,end];
 if(!boss)for(const t of terraces)for(const edge of [t.x,t.x+t.w])if(edge>start&&edge<end)cuts.push(edge);
 cuts.sort((a,b)=>a-b);
 for(let i=0;i<cuts.length-1;i++){
  const left=cuts[i],right=cuts[i+1],surface=boss?ground:baseFloorAtX((left+right)/2);
  const soil=x.createLinearGradient(0,surface,0,surface+260),colors=worldFloorColors();soil.addColorStop(0,colors[0]);soil.addColorStop(1,colors[1]);x.fillStyle=soil;x.fillRect(left,surface,right-left,WORLD_BOTTOM-surface);
  if(undergroundTrip){x.fillStyle='#a2b2a2';x.fillRect(left,surface,right-left,10)}else drawGrassStrip(left,right,surface);
  if(!undergroundTrip&&worldSettings().theme==='kitchen'){
   x.strokeStyle='#d8dfe3';x.lineWidth=1;for(let px=Math.ceil(left/90)*90;px<right;px+=90){x.beginPath();x.moveTo(px,surface+12);x.lineTo(px,WORLD_BOTTOM);x.stroke()}for(let py=surface+70;py<WORLD_BOTTOM;py+=70){x.beginPath();x.moveTo(left,py);x.lineTo(right,py);x.stroke()}
  }else{x.fillStyle='rgba(74,48,31,.25)';for(let py=surface+38;py<WORLD_BOTTOM;py+=43)for(let px=left+14;px<right;px+=67){x.beginPath();x.ellipse(px,py,4+Math.abs(Math.sin(px))*5,2,0,0,Math.PI*2);x.fill()}}
 }
}
function safeColaX(preferred,width=64){
 const valid=pos=>pos>=130&&pos+width<levelWidth-250&&floorAtX(pos)===floorAtX(pos+width)&&[...lavaPits,...cliffs].every(g=>pos+width<=g.x-140||pos>=g.x+g.w+140)&&obstacles.every(o=>pos+width<=o.x-10||pos>=o.x+o.w+10)&&objects.filter(o=>['cola','greatWall','secretWall'].includes(o.type)).every(o=>pos+width<=o.x-25||pos>=o.x+o.w+25);
 for(let step=0;step<200;step++)for(const direction of [1,-1]){const pos=preferred+step*20*direction;if(valid(pos))return pos}
 for(let pos=130;pos<levelWidth-250;pos+=20)if(valid(pos))return pos;
 return null;
}
function nearBossDoor(){return screen==='play'&&!boss&&!undergroundTrip&&Math.abs(player.x+player.w/2-(doorX+50))<100&&player.y+player.h>ground-145}
function openBossDoor(){
 if(!nearBossDoor())return;
 if(!player.hasKey){message='Finde zuerst den Schlüssel im Level!';return}
 if(isTutorial()){screen='start';keys={};heldPointers.clear();message='Totarial abgeschlossen!';playSound('menu');return}
 startBoss();
}
function grapple(){
 if(player.swingCooldown>0){message='Schwingen lädt: '+Math.ceil(player.swingCooldown/60)+' Sekunden';return}
 const direction=keys.ArrowLeft||keys.a||keys.touchLeft?-1:player.facing,old=player.swing;
 const candidates=hooks.filter(h=>Math.hypot(h.x-player.x-player.w/2,h.y-player.y-20)<520&&(!old||(h.x-old.x)*direction>80));
 candidates.sort((a,b)=>old?(a.x-b.x)*direction:Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));
 const hook=candidates[0];if(!hook){message=old?'Weiter schwingen, dann E für den nächsten Haken!':'Geh näher an einen Haken.';return}
 playSound('special');
 const distance=Math.hypot(player.x+player.w/2-hook.x,player.y+20-hook.y);
 const underHook=[...platforms,...obstacles.filter(o=>o.type!=='spikes'),...objects.filter(o=>o.type==='cola')].filter(o=>hook.x>=o.x-15&&hook.x<=o.x+o.w+15).map(o=>o.y);
 const support=Math.min(floorAtX(hook.x),...underHook),safeLength=Math.max(75,support-hook.y-(player.h-20)-18);
 player.swing={x:hook.x,y:hook.y,length:Math.max(75,Math.min(safeLength,distance*.92)),life:120};
 player.swingsUsed++;player.vx=direction*Math.max(9,Math.abs(player.vx));player.vy=Math.min(player.vy,old?-4:-7);player.onGround=false;
 if(player.swingsUsed>=2){player.swingCooldown=300;player.cooldown=300;message='Zweiter Schwung! Danach 5 Sekunden Pause.'}
 else{player.cooldown=12;message='Schwung 1/2 · E: nächster Haken · Springen: loslassen'}
}
function collectLunchbox(box){
 if(box.used||player.inventory.length>=2||screen!=='play')return;
 const available=ITEM_TYPES.filter(itemAllowed);box.used=true;box.item=available[Math.floor(Math.random()*available.length)];player.inventory.push(box.item);playSound('pickup');
 particles.push({type:'pickup',art:box.item,x:box.x+box.w/2,y:box.y-12,vx:0,vy:-.6,age:0,life:60,maxLife:60});
 message=ITEM_NAMES[box.item]+' gefunden! F oder ITEM drücken.';
}
function useItem(){
 if(screen!=='play')return;
 if(player.seatedCatapult){message='W zum Abschießen oder Space zum Aussteigen.';return}
 const storage=inventoryStorage(),item=storage.list[storage.index];
 if(item){
  if(!itemAllowed(item)){message='Auf dem Mond sind Sprungfedern gesperrt.';return}
  if((item==='catapultKit'||item==='wallKit'||item==='ladderKit')&&!placeStructure(item))return;
  playSound('pickup');storage.list.splice(storage.index,1);player[storage.indexKey]=Math.min(storage.index,Math.max(0,storage.list.length-1));if(storage.category==='builds'&&!storage.list.length)player.inventoryCategory='powers';
  if(item==='mushroom'){player.hp=Math.min(MAX_HP,player.hp+1);message='Pilz: +1 Leben!'}
  if(item==='gum'){player.bubble=120;player.swing=null;player.vy=-3;player.onGround=false;message='Die Kaugummi-Blase trägt dich nach oben!'}
  if(item==='springKit'){player.jumpBoost=300;player.vy=-18;player.onGround=false;message='Sprungfeder! 5 Sekunden besonders hohe Sprünge.'}
  if(item==='marshmallow'){player.marshmallowTime=900;message=showGameplayHints()?'Marshmallow: 15 Sekunden! Beim Fallen Space / Sprungtaste halten zum Gleiten.':'Marshmallow · 15 Sekunden';}
  if(item==='wasabi'){player.fireTime=600;player.fireCooldown=0;spitFire();message='Wasabi! F oder ITEM zum Feuerspucken (10 Sekunden).'}
  return;
 }
 if(storage.category==='powers'&&player.fireTime>0)spitFire();
}
function updateMarshmallowGlide(){
 const p=player;
 p.gliding=p.marshmallowTime>0&&!isSwimming()&&!p.swing&&!p.climbing&&!p.seatedCatapult&&!p.trappedIn&&p.bubble<=0&&p.vy>0&&!!(keys[' ']||keys.touchJump);
 if(p.gliding)p.vy=Math.min(p.vy,Math.max(.35,worldGravity()*2.2));
}
function drawPlayerPowerIcons(){
 if(screen!=='play')return;
 const icons=[];if(player.fireTime>0)icons.push('chili');if(player.marshmallowTime>0)icons.push('marshmallow');
 for(let i=0;i<icons.length;i++)sprite(icons[i],player.x+player.w/2-12+(i-(icons.length-1)/2)*29,player.y-42+Math.sin(tick*.09+i)*3,24,31);
}
function drawChiliFallback(left,top,width,height){
 x.save();x.translate(left,top);x.scale(width/128,height/160);x.fillStyle='#df5e47';x.strokeStyle='#8e3f32';x.lineWidth=3;x.beginPath();x.moveTo(82,38);x.quadraticCurveTo(119,110,21,144);x.quadraticCurveTo(61,93,54,46);x.closePath();x.fill();x.stroke();x.strokeStyle='#609250';x.lineWidth=8;x.beginPath();x.moveTo(66,42);x.quadraticCurveTo(65,16,86,15);x.stroke();x.restore();
}
function drawMarshmallowEffect(){
 if(player.honeyTime>0&&screen==='play'){x.save();x.fillStyle='rgba(239,183,62,.65)';x.strokeStyle='#b98934';x.lineWidth=1.5;for(const dx of [8,29]){x.beginPath();x.ellipse(player.x+dx,player.y+player.h-3,9,4,0,0,Math.PI*2);x.fill();x.stroke()}x.restore()}
 if(!player.gliding||screen!=='play')return;
 x.save();x.strokeStyle='#fff3ed';x.lineWidth=2;x.globalAlpha=.8;
 for(const side of [-1,1]){const px=player.x+player.w/2+side*32,py=player.y+10+Math.sin(tick*.1)*3;x.beginPath();x.moveTo(px,py+30);x.quadraticCurveTo(px+side*8,py+12,px,py);x.stroke()}
 x.restore();
}
function drawMarshmallowFallback(left,top,width,height){
 x.save();x.translate(left,top);x.scale(width/128,height/160);x.fillStyle='#fff3e9';x.strokeStyle='#9e8c9b';x.lineWidth=3;x.beginPath();x.moveTo(23,44);x.lineTo(23,111);x.quadraticCurveTo(64,146,105,111);x.lineTo(105,44);x.closePath();x.fill();x.stroke();x.fillStyle='#fffaf3';x.beginPath();x.ellipse(64,44,41,18,0,0,Math.PI*2);x.fill();x.stroke();x.fillStyle='#66546e';for(const px of [48,80]){x.beginPath();x.arc(px,82,5,0,Math.PI*2);x.fill()}x.beginPath();x.moveTo(53,98);x.quadraticCurveTo(64,108,75,98);x.stroke();x.restore();
}
function spitFire(){
 if(player.fireCooldown>0)return;
 playSound('fire');const direction=player.facing;
 objects.push({type:'fire',x:player.x+(direction>0?player.w:-28),y:player.y+15,w:28,h:24,vx:direction*5.2,life:45,age:0});player.fireCooldown=20;
}
function popBubble(){playSound('pop');particles.push({type:'bubblePop',x:player.x+22,y:player.y+26,age:0,life:20,maxLife:20});message='Plopp! Die Kaugummi-Blase ist geplatzt.'}
function makeExplosion(px,py){
 playSound('splash');particles.push({type:'blast',x:px,y:py,age:0,life:48,maxLife:48});
 for(let i=0;i<36;i++){
  const angle=i/36*Math.PI*2,speed=2+Math.random()*6;
  particles.push({type:i%3===0?'seed':'spark',x:px,y:py,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-1,age:0,life:35+i%12,maxLife:35+i%12,r:2+Math.random()*4});
 }
 for(let i=0;i<9;i++)particles.push({type:'smoke',x:px+Math.cos(i)*20,y:py+Math.sin(i)*20,vx:Math.cos(i)*.5,vy:-.8,age:0,r:14+i,life:62,maxLife:62});
 screenFlash=6;shake=16;
}
function updateParticles(){
 shake=Math.max(0,shake-1);screenFlash=Math.max(0,screenFlash-1);
 for(const q of particles){q.life--;q.age=(q.age||0)+1;if(q.vx!==undefined){q.x+=q.vx;q.y+=q.vy;if(q.type==='seed'||q.type==='spark'||q.type==='rockDebris')q.vy+=.13}}
 particles=particles.filter(q=>q.life>0);
}
function drawParticle(q){
 const fade=Math.max(0,q.life/q.maxLife),age=q.age||0;
 x.save();
 if(q.type==='blast'){
  const radius=12+Math.min(1,age/23)*145;
  x.globalAlpha=fade;x.strokeStyle='#ffe28b';x.lineWidth=Math.max(1,10*fade);x.beginPath();x.arc(q.x,q.y,radius,0,Math.PI*2);x.stroke();
  if(age<28){
   const glow=x.createRadialGradient(q.x,q.y,0,q.x,q.y,radius);glow.addColorStop(0,'#fff9d5');glow.addColorStop(.35,'#ffc642');glow.addColorStop(.72,'#f45d30');glow.addColorStop(1,'rgba(224,38,58,0)');x.fillStyle=glow;
   x.beginPath();for(let i=0;i<24;i++){const a=i/24*Math.PI*2,r=radius*(i%2?.65:1);const px=q.x+Math.cos(a)*r,py=q.y+Math.sin(a)*r;if(i)x.lineTo(px,py);else x.moveTo(px,py)}x.closePath();x.fill();
   x.font='900 34px system-ui';x.textAlign='center';x.lineWidth=5;x.strokeStyle='#8b243d';x.strokeText('BOOM!',q.x,q.y+10);x.fillStyle='#fff1b0';x.fillText('BOOM!',q.x,q.y+10);
  }
 }else if(q.type==='bubblePop'||q.type==='splash'){
  x.globalAlpha=fade;x.strokeStyle=q.type==='bubblePop'?'#ffd3ef':'#a36f41';x.lineWidth=3;x.beginPath();x.arc(q.x,q.y,(q.type==='bubblePop'?38:5)+age*1.2,0,Math.PI*2);x.stroke();
  x.fillStyle=x.strokeStyle;for(let i=0;i<8;i++){const a=i/8*Math.PI*2,r=15+age*2;x.beginPath();x.arc(q.x+Math.cos(a)*r,q.y+Math.sin(a)*r,2,0,Math.PI*2);x.fill()}
 }else if(q.type==='pickup'){
  x.globalAlpha=Math.min(1,q.life/20);sprite(q.art,q.x-22,q.y-22,44,44);
 }else if(q.type==='smoke'){
  x.globalAlpha=fade*.45;x.fillStyle='#85596c';x.beginPath();x.arc(q.x,q.y,q.r+age*.5,0,Math.PI*2);x.fill();
 }else{
  x.globalAlpha=fade;x.translate(q.x,q.y);x.rotate(age*.13);x.fillStyle=q.type==='rockDebris'?q.color:q.type==='seed'?'#d93656':'#ffe9a3';x.strokeStyle=q.type==='seed'?'#852544':'#fa733a';x.lineWidth=2;x.beginPath();x.ellipse(0,0,q.r,q.type==='seed'?q.r*1.6:q.r,0,0,Math.PI*2);x.fill();x.stroke();
 }
 x.restore();
}
function drawFlame(o){
 x.save();x.translate(o.x+o.w/2,o.y+o.h/2);x.scale(o.vx<0?-1:1,1);
 x.fillStyle='#e9512f';x.beginPath();x.moveTo(-17,0);x.lineTo(-11,-11);x.lineTo(1,-7);x.lineTo(18,-3);x.lineTo(11,0);x.lineTo(21,7);x.lineTo(0,10);x.lineTo(-13,8);x.closePath();x.fill();
 x.fillStyle='#ffdf66';x.beginPath();x.ellipse(-4,0,12,6,0,0,Math.PI*2);x.fill();x.restore();
}
function restoreFromFall(gap){
 hitPlayer(1,0);player.x=gap.x-player.w-24;player.y=(gap.y??floorAtX(gap.x-1))-player.h-10;player.vx=0;player.vy=-3;player.swing=null;player.bubble=0;player.onGround=false;message='Vorsicht an der Klippe!';
}
function collideObstacles(previousX,previousBottom){
 if(boss)return;
 for(const o of [...obstacles.filter(o=>o.type==='spikes'),...solidTerrain()]){
  if(o.type==='spikes'){if(rect(player,o))hitPlayer(1,player.x<o.x?-4:4);continue}
  if(!rect(player,o))continue;
  if(player.vy>=0&&previousBottom<=o.y+3){player.y=o.y-player.h;player.vy=0;player.onGround=true;player.swing=null}
  else if(previousX+player.w<=o.x+4){player.x=o.x-player.w;player.vx=0}
  else if(previousX>=o.x+o.w-4){player.x=o.x+o.w;player.vx=0}
  else if(player.vy<0&&player.y+player.h>o.y+o.h){player.y=o.y+o.h;player.vy=0}
 }
}
function drawExtraTerrain(){
 if(boss)return;
 x.save();
 for(const cliff of cliffs){
  if(cliff.x+cliff.w<camera-50||cliff.x>camera+W+50)continue;
  if(isCloudWorld()){drawCloudGap(cliff);continue}
  x.fillStyle='#263b52';x.fillRect(cliff.x,cliff.y,cliff.w,WORLD_BOTTOM-cliff.y);x.strokeStyle='#826f67';x.lineWidth=5;
  for(const edge of [cliff.x,cliff.x+cliff.w]){x.beginPath();x.moveTo(edge,cliff.y);x.lineTo(edge,cliff.y+28);x.lineTo(edge+(edge===cliff.x?-8:8),cliff.y+45);x.lineTo(edge,cliff.y+68);x.stroke()}
  x.fillStyle='#7192a0';x.beginPath();x.moveTo(cliff.x+15,cliff.y+180);x.lineTo(cliff.x+cliff.w/2,cliff.y+150);x.lineTo(cliff.x+cliff.w-10,cliff.y+180);x.fill();
 }
 for(const p of platforms)if(p.moving&&p.x+p.w>camera-50&&p.x<camera+W+50){if(drawCloudPlatform(p))continue;x.fillStyle='#cdab7b';x.strokeStyle='#684c3f';x.lineWidth=3;x.fillRect(p.x,p.y,p.w,p.h);x.strokeRect(p.x,p.y,p.w,p.h)}
 for(const o of obstacles){
  if(o.x+o.w<camera-50||o.x>camera+W+50)continue;
  if(undergroundTrip&&drawSewerObstacle(o))continue;
  if(drawCloudObstacle(o))continue;
  if(o.type==='spikes'){
   for(let i=0;i<o.w;i+=12){x.fillStyle='#d2dde2';x.strokeStyle='#4c6776';x.lineWidth=2;x.beginPath();x.moveTo(o.x+i,o.y+o.h);x.lineTo(o.x+i+6,o.y);x.lineTo(o.x+i+12,o.y+o.h);x.closePath();x.fill();x.stroke()}
  }else{
   x.fillStyle=worldSettings().theme==='frost'?(o.type==='crate'?'#d9bc8b':'#bddfec'):worldSettings().theme==='moon'?'#9caabd':o.type==='crate'?'#d0a56b':o.type==='rock'?'#9796aa':'#62a888';x.strokeStyle='#4b5348';x.lineWidth=3;x.fillRect(o.x,o.y,o.w,o.h);x.strokeRect(o.x,o.y,o.w,o.h);
   if(worldSettings().theme==='frost'){x.fillStyle='#fff4e4';x.fillRect(o.x,o.y,o.w,9)}
   x.beginPath();if(o.type==='crate'){x.moveTo(o.x+5,o.y+5);x.lineTo(o.x+o.w-5,o.y+o.h-5);x.moveTo(o.x+o.w-5,o.y+5);x.lineTo(o.x+5,o.y+o.h-5)}else{x.moveTo(o.x-4,o.y+10);x.lineTo(o.x+o.w+4,o.y+10)}x.stroke();
  }
 }
 for(const h of hooks)if(!h.tree&&h.x>camera-50&&h.x<camera+W+50){
  x.strokeStyle='#7b7872';x.lineWidth=2;x.beginPath();x.moveTo(h.x,h.y-170);x.lineTo(h.x,h.y-10);x.stroke();x.fillStyle='#9c7959';x.fillRect(h.x-24,h.y-180,48,12);
  x.strokeStyle='#f5cd69';x.lineWidth=5;x.beginPath();x.arc(h.x,h.y,8,-Math.PI*.7,Math.PI*.8);x.stroke();
 }
 x.restore();
}
function victoryAction(action){
 if(action==='next'){
  if(isTutorial()){
   if(tutorialBossRound===1){tutorialBossRound=2;screen='play';player.hp=MAX_HP;beginBossFight();return}
   selectedLevel=1;reset();return;
  }
  if(!LEVEL_SETTINGS[level+1]){message='Weitere Welten kommen später.';return}
  level++;selectedLevel=level;screen='play';keys={};heldPointers.clear();player.hp=MAX_HP;player.cooldown=0;spawnLevel();return;
 }
 playSound('menu');keys={};heldPointers.clear();
 if(action==='retry'){selectedLevel=level;reset();return}
 if(action==='menu'){screen='start';victoryButtons=[]}
}
function handleVictoryKey(event){
 if(event.repeat)return;
 const key=event.key.toLowerCase();
 if(key==='r'||key==='enter')victoryAction('retry');
 if(key==='m'||key==='escape')victoryAction('menu');
 if(key==='n')victoryAction('next');
}
function drawVictory(){
 x.save();x.fillStyle='rgba(21,25,46,.94)';x.fillRect(0,0,W,H);
 const time=performance.now()/1000;
 for(let i=0;i<32;i++){x.fillStyle=['#efad68','#e586a0','#8dd2aa'][i%3];x.save();x.translate((i*157)%W,(i*83+Math.sin(time+i)*8)%H);x.rotate(i+time*.1);x.fillRect(-3,-5,6,10);x.restore()}
 x.textAlign='center';x.fillStyle='#ffe5a0';x.font='900 48px system-ui';x.fillText('GRATULATION!',W/2,142);x.fillStyle='#fff';x.font='24px system-ui';x.fillText(isTutorial()?'Totarial: Übungsboss besiegt!':worldName()+' geschafft!',W/2,190);x.font='18px system-ui';x.fillText('Punkte: '+player.score,W/2,229);
 victoryButtons=[{id:'retry',x:275,y:275,w:450,h:58,label:'Level nochmal  (R / Enter)'},{id:'menu',x:275,y:349,w:450,h:58,label:'Hauptmenü  (M)'},{id:'next',x:275,y:423,w:450,h:58,label:isTutorial()?(tutorialBossRound===1?'Besteck-Trio üben (N)':'Weiter zum Wiesenwald (N)'):LEVEL_SETTINGS[level+1]?'Weiter zu '+worldName(level+1)+' (N)':'Weitere Welten – kommen später',disabled:!LEVEL_SETTINGS[level+1]}];
 for(const b of victoryButtons){x.fillStyle=b.disabled?'#373f54':b.id==='retry'?'#77b49a':'#748fbb';x.fillRect(b.x,b.y,b.w,b.h);x.fillStyle=b.disabled?'#9ca7ba':'#fff';x.font='bold 20px system-ui';x.fillText(b.label,b.x+b.w/2,b.y+37)}
 x.fillStyle='#b8c4cd';x.font='15px system-ui';x.fillText('Totarial · Wiesenwald · Kristallwüste · Küche',W/2,527);x.restore();
}
function drawItemHud(){
 x.save();x.textAlign='left';
 for(let i=0;i<2;i++){
  const left=15+i*137,item=player.inventory[i];x.fillStyle='rgba(31,42,57,.85)';x.fillRect(left,100,130,51);x.strokeStyle=player.inventoryCategory==='powers'&&i===player.inventoryIndex?'#ffe6a0':'#547082';x.lineWidth=2;x.strokeRect(left,100,130,51);
  if(item)sprite(item,left+2,104,38,40);x.fillStyle='#fff';x.font='12px system-ui';x.fillText(item?ITEM_SHORT_NAMES[item]:'Leer',left+43,121);x.fillText('Power '+(i+1)+' · F',left+43,140);
 }
 for(let i=0;i<3;i++){
  const left=15+i*99,item=player.buildInventory[i];x.fillStyle='rgba(31,42,57,.85)';x.fillRect(left,166,93,43);x.strokeStyle=player.inventoryCategory==='builds'&&i===player.buildInventoryIndex?'#ffe6a0':'#547082';x.lineWidth=2;x.strokeRect(left,166,93,43);if(item)sprite(item,left+1,169,29,33);x.fillStyle='#fff';x.font='10px system-ui';x.fillText(item?ITEM_SHORT_NAMES[item]:'Leer',left+32,183);x.fillText('Bau '+(i+3)+' · F',left+32,200);
 }
 x.fillStyle=undergroundTrip||worldSettings().theme==='crystal'?'#e7eccc':'#203b52';x.font='11px system-ui';if(showGameplayHints())x.fillText('1/2: Powers · 3/4/5: Bausachen',17,224);
 if(player.hasKey){sprite('key',288,101,30,40);x.fillText('Schlüssel',320,125)}
 if(player.fireTime>0)x.fillText(showGameplayHints()?'Wasabi: F zum Feuerspucken':'Wasabi',17,241);else if(player.bubble>0)x.fillText('Blase platzt gleich!',17,241);else if(player.jumpBoost>0)x.fillText('Sprungfeder aktiv!',17,241);else if(player.marshmallowTime>0)x.fillText((player.gliding?'Gleiten':'Marshmallow')+' · '+Math.ceil(player.marshmallowTime/60)+' s',17,241);
 if(player.honeyTime>0){x.fillStyle='rgba(50,37,22,.78)';x.fillRect(13,244,95,18);x.fillStyle='#ffdf86';x.fillText('Honig · '+Math.ceil(player.honeyTime/60)+' s',17,257);}
 x.restore();
}
