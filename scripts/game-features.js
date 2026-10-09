// Extra platforming, hook chaining, lunchbox items and cartoon effects. No dependencies.
const ITEM_TYPES=['mushroom','gum','wasabi'];
const ITEM_NAMES={mushroom:'Pilz (+1 Leben)',gum:'Kaugummi-Blase',wasabi:'Wasabi-Feuer'};
function floorAtX(pos){if(boss)return ground;return terraces.find(t=>pos>=t.x&&pos<t.x+t.w)?.y??ground}
function buildTerraces(){
 terraces.length=0;
 for(let pos=1200;pos<levelWidth-2400;pos+=3000){
  terraces.push({x:pos,w:650,y:ground-100},{x:pos+1100,w:650,y:ground+110});
  obstacles.push({type:'crate',x:pos-75,y:ground-45,w:65,h:45},{type:'crate',x:pos+1675,y:ground+65,w:65,h:45});
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
  const left=cuts[i],right=cuts[i+1],surface=floorAtX((left+right)/2);
  x.fillStyle='#a17c5b';x.fillRect(left,surface,right-left,WORLD_BOTTOM-surface);x.fillStyle='#6abb54';x.fillRect(left,surface,right-left,18);
  x.fillStyle='#7f644e';for(let py=surface+40;py<WORLD_BOTTOM;py+=42)for(let px=left+12;px<right;px+=66)x.fillRect(px,py,26,4);
 }
}
function safeColaX(preferred,width=64){
 const valid=pos=>pos>=130&&pos+width<levelWidth-250&&floorAtX(pos)===floorAtX(pos+width)&&[...lavaPits,...cliffs].every(g=>pos+width<=g.x-140||pos>=g.x+g.w+140)&&obstacles.every(o=>pos+width<=o.x-10||pos>=o.x+o.w+10)&&objects.filter(o=>o.type==='cola').every(o=>pos+width<=o.x-25||pos>=o.x+o.w+25);
 for(let step=0;step<200;step++)for(const direction of [1,-1]){const pos=preferred+step*20*direction;if(valid(pos))return pos}
 for(let pos=130;pos<levelWidth-250;pos+=20)if(valid(pos))return pos;
 return null;
}
function nearBossDoor(){return screen==='play'&&!boss&&Math.abs(player.x+player.w/2-(doorX+50))<100&&player.y+player.h>ground-145}
function openBossDoor(){
 if(!nearBossDoor())return;
 if(!player.hasKey){message='Finde zuerst den Schlüssel im Level!';return}
 startBoss();
}
function grapple(){
 const direction=keys.ArrowLeft||keys.a||keys.touchLeft?-1:player.facing,old=player.swing;
 const candidates=hooks.filter(h=>Math.hypot(h.x-player.x-player.w/2,h.y-player.y-20)<520&&(!old||(h.x-old.x)*direction>80));
 candidates.sort((a,b)=>old?(a.x-b.x)*direction:Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));
 const hook=candidates[0];if(!hook){message=old?'Weiter schwingen, dann E für den nächsten Haken!':'Geh näher an einen Haken.';return}
 playSound('special');
 const distance=Math.hypot(player.x+player.w/2-hook.x,player.y+20-hook.y);
 const underHook=[...platforms,...obstacles.filter(o=>o.type!=='spikes'),...objects.filter(o=>o.type==='cola')].filter(o=>hook.x>=o.x-15&&hook.x<=o.x+o.w+15).map(o=>o.y);
 const support=Math.min(floorAtX(hook.x),...underHook),safeLength=Math.max(75,support-hook.y-(player.h-20)-18);
 player.swing={x:hook.x,y:hook.y,length:Math.max(75,Math.min(safeLength,distance*.92)),life:300};
 player.vx=direction*Math.max(9,Math.abs(player.vx));player.vy=Math.min(player.vy,old?-4:-7);player.onGround=false;player.cooldown=12;
 message='A/D: Schwung · E: nächster Haken · Springen: loslassen';
}
function collectLunchbox(box){
 if(box.used||player.inventory.length>=2||screen!=='play')return;
 box.used=true;box.item=ITEM_TYPES[Math.floor(Math.random()*ITEM_TYPES.length)];player.inventory.push(box.item);playSound('pickup');
 particles.push({type:'pickup',art:box.item,x:box.x+box.w/2,y:box.y-12,vx:0,vy:-.6,age:0,life:60,maxLife:60});
 message=ITEM_NAMES[box.item]+' gefunden! F oder ITEM drücken.';
}
function useItem(){
 if(screen!=='play')return;
 const item=player.inventory[player.inventoryIndex];
 if(item){
  playSound('pickup');player.inventory.splice(player.inventoryIndex,1);player.inventoryIndex=Math.min(player.inventoryIndex,Math.max(0,player.inventory.length-1));
  if(item==='mushroom'){player.hp=Math.min(MAX_HP,player.hp+1);message='Pilz: +1 Leben!'}
  if(item==='gum'){player.bubble=120;player.swing=null;player.vy=-3;player.onGround=false;message='Die Kaugummi-Blase trägt dich nach oben!'}
  if(item==='wasabi'){player.fireTime=600;player.fireCooldown=0;spitFire();message='Wasabi! F oder ITEM zum Feuerspucken (10 Sekunden).'}
  return;
 }
 if(player.fireTime>0)spitFire();
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
 for(const q of particles){q.life--;q.age=(q.age||0)+1;if(q.vx!==undefined){q.x+=q.vx;q.y+=q.vy;if(q.type==='seed'||q.type==='spark')q.vy+=.13}}
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
  x.globalAlpha=fade;x.translate(q.x,q.y);x.rotate(age*.13);x.fillStyle=q.type==='seed'?'#d93656':'#ffe9a3';x.strokeStyle=q.type==='seed'?'#852544':'#fa733a';x.lineWidth=2;x.beginPath();x.ellipse(0,0,q.r,q.type==='seed'?q.r*1.6:q.r,0,0,Math.PI*2);x.fill();x.stroke();
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
 for(const o of [...obstacles,...objects.filter(o=>o.type==='cola')]){
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
  x.fillStyle='#263b52';x.fillRect(cliff.x,cliff.y,cliff.w,WORLD_BOTTOM-cliff.y);x.strokeStyle='#826f67';x.lineWidth=5;
  for(const edge of [cliff.x,cliff.x+cliff.w]){x.beginPath();x.moveTo(edge,cliff.y);x.lineTo(edge,cliff.y+28);x.lineTo(edge+(edge===cliff.x?-8:8),cliff.y+45);x.lineTo(edge,cliff.y+68);x.stroke()}
  x.fillStyle='#7192a0';x.beginPath();x.moveTo(cliff.x+15,cliff.y+180);x.lineTo(cliff.x+cliff.w/2,cliff.y+150);x.lineTo(cliff.x+cliff.w-10,cliff.y+180);x.fill();
 }
 for(const p of platforms)if(p.moving&&p.x+p.w>camera-50&&p.x<camera+W+50){x.fillStyle='#cdab7b';x.strokeStyle='#684c3f';x.lineWidth=3;x.fillRect(p.x,p.y,p.w,p.h);x.strokeRect(p.x,p.y,p.w,p.h)}
 for(const o of obstacles){
  if(o.x+o.w<camera-50||o.x>camera+W+50)continue;
  if(o.type==='spikes'){
   for(let i=0;i<o.w;i+=12){x.fillStyle='#d2dde2';x.strokeStyle='#4c6776';x.lineWidth=2;x.beginPath();x.moveTo(o.x+i,o.y+o.h);x.lineTo(o.x+i+6,o.y);x.lineTo(o.x+i+12,o.y+o.h);x.closePath();x.fill();x.stroke()}
  }else{
   x.fillStyle=o.type==='crate'?'#d0a56b':'#62a888';x.strokeStyle='#4b5348';x.lineWidth=3;x.fillRect(o.x,o.y,o.w,o.h);x.strokeRect(o.x,o.y,o.w,o.h);
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
 if(action==='next'){message='Level 2 gibt es noch nicht.';return}
 playSound('menu');keys={};heldPointers.clear();
 if(action==='retry'){reset();return}
 if(action==='menu'){screen='choose';victoryButtons=[]}
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
 x.textAlign='center';x.fillStyle='#ffe5a0';x.font='900 48px system-ui';x.fillText('GRATULATION!',W/2,142);x.fillStyle='#fff';x.font='24px system-ui';x.fillText('Level 1 geschafft – der Püree-Bär ist besiegt!',W/2,190);x.font='18px system-ui';x.fillText('Punkte: '+player.score,W/2,229);
 victoryButtons=[{id:'retry',x:275,y:275,w:450,h:58,label:'Level nochmal  (R / Enter)'},{id:'menu',x:275,y:349,w:450,h:58,label:'Hauptmenü  (M)'},{id:'next',x:275,y:423,w:450,h:58,label:'Nächstes Level – kommt später',disabled:true}];
 for(const b of victoryButtons){x.fillStyle=b.disabled?'#373f54':b.id==='retry'?'#77b49a':'#748fbb';x.fillRect(b.x,b.y,b.w,b.h);x.fillStyle=b.disabled?'#9ca7ba':'#fff';x.font='bold 20px system-ui';x.fillText(b.label,b.x+b.w/2,b.y+37)}
 x.fillStyle='#b8c4cd';x.font='15px system-ui';x.fillText('Aktuell gibt es nur Level 1.',W/2,527);x.restore();
}
function drawItemHud(){
 x.save();x.textAlign='left';
 for(let i=0;i<2;i++){
  const left=15+i*137,item=player.inventory[i];x.fillStyle='rgba(31,42,57,.85)';x.fillRect(left,100,130,51);x.strokeStyle=i===player.inventoryIndex?'#ffe6a0':'#547082';x.lineWidth=2;x.strokeRect(left,100,130,51);
  if(item)sprite(item,left+2,104,38,40);x.fillStyle='#fff';x.font='12px system-ui';x.fillText(item?{mushroom:'Pilz',gum:'Kaugummi',wasabi:'Wasabi'}[item]:'Leer',left+43,121);x.fillText('Platz '+(i+1)+' · F',left+43,140);
 }
 x.fillStyle='#203b52';x.font='12px system-ui';x.fillText('1/2 oder antippen: Platz wählen',17,170);
 if(player.hasKey){sprite('key',288,101,30,40);x.fillText('Schlüssel',320,125)}
 if(player.fireTime>0)x.fillText('Wasabi: F zum Feuerspucken',17,190);else if(player.bubble>0)x.fillText('Blase platzt gleich!',17,190);
 x.restore();
}
