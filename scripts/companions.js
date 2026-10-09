const BUDDIES=[
 {art:'sponge',name:'Schwamm',text:'Saugt Cola auf und schleudert sie automatisch auf Gegner.'},
 {art:'sausage-dog',name:'Wursthund',text:'Folgt dir, springt über Lücken und beißt nahe Gegner.'}
];
let selectedBuddy=0,companion=null,buddyCards=[];
function resetCompanion(preserve=false){
 const saved=preserve&&companion?companion.cola:0;
 companion={type:BUDDIES[selectedBuddy].art,x:player.x-65,y:ground-40,w:52,h:40,vx:0,vy:0,onGround:true,cola:saved,cooldown:0,walk:0,action:0};
}
function drawBuddyChoose(){
 x.fillStyle='rgba(20,20,45,.9)';x.fillRect(0,0,W,H);x.textAlign='center';x.fillStyle='#fff';x.font='bold 38px system-ui';x.fillText('Wähle deinen Begleiter',W/2,105);x.font='19px system-ui';x.fillText('Deine Figur: '+chars[selected].name,W/2,145);
 buddyCards=BUDDIES.map((buddy,i)=>({x:235+i*300,y:185,w:230,h:270,id:i}));
 for(const card of buddyCards){const buddy=BUDDIES[card.id];x.fillStyle=card.id===selectedBuddy?'#fff0bb':'#fff';x.fillRect(card.x,card.y,card.w,card.h);x.strokeStyle=card.id===selectedBuddy?'#ec985d':'#798baa';x.lineWidth=4;x.strokeRect(card.x,card.y,card.w,card.h);sprite(buddy.art,card.x+58,card.y+15,114,132);x.fillStyle='#2c3548';x.font='bold 24px system-ui';x.fillText(buddy.name,card.x+card.w/2,card.y+175);wrap(buddy.text,card.x+22,card.y+206,card.w-44,20,'#2c3548')}
 x.fillStyle='#fff';x.font='18px system-ui';x.fillText('Antippen oder ← → und Enter zum Starten',W/2,520);x.font='14px system-ui';x.fillText('Esc: zurück zur Charakterwahl',W/2,554);
}
function buddyKey(event){
 if(event.key==='ArrowLeft'||event.key==='ArrowRight')selectedBuddy=1-selectedBuddy;
 if(event.key==='Escape')screen='choose';
 if(event.key==='Enter'||event.key===' ')reset();
}
function updateCompanion(){
 if(!companion||screen!=='play')return;
 const b=companion;b.cooldown=Math.max(0,b.cooldown-1);b.action=Math.max(0,b.action-1);
 const targetX=player.x-player.facing*65;
 if(Math.abs(b.x-player.x)>420){b.x=targetX;b.y=player.y;b.vy=0}
 if(b.type==='sponge'){
  b.x+=(targetX-b.x)*.12;b.y+=(player.y+8+Math.sin(tick*.07)*4-b.y)*.12;
  for(const flow of objects)if(flow.type==='colaFlow'&&flow.life>0&&(rect(b,flow)||(b.absorbingFlow===flow&&Math.abs(b.x-flow.sourceX)<220))){
   b.absorbingFlow=flow;
   flow.spread=Math.max(0,flow.spread-10);flow.x=flow.sourceX-flow.spread;flow.w=flow.spread*2;b.cola=Math.min(100,b.cola+10);b.action=10;
   if(flow.spread<3){flow.life=0;flow.w=0;b.absorbingFlow=null;for(const bottle of objects)if(bottle.type==='cola'&&bottle.used&&Math.abs(bottle.x+bottle.w/2-flow.sourceX)<5)bottle.liquid=0}
  }
  const target=enemies.find(e=>!e.dead&&Math.abs(e.x-b.x)<230)||(boss&&!boss.dead&&Math.abs(boss.x-b.x)<230?boss:null);
  if(target&&b.cola>=20&&b.cooldown===0){
   const direction=target.x>b.x?1:-1;
   objects.push({type:'buddyCola',x:b.x+b.w/2,y:b.y+10,w:18,h:18,vx:direction*3.5,vy:-2.3,life:80});b.cola-=20;b.cooldown=75;b.action=20;
  }
 }else{
  b.vx=Math.max(-4.8,Math.min(4.8,(targetX-b.x)*.14));
  const direction=b.vx>=0?1:-1,front=direction>0?b.x+b.w:b.x;
  const gap=[...lavaPits,...cliffs].some(l=>direction>0?front<=l.x&&l.x-front<30:front>=l.x+l.w&&front-l.x-l.w<30);
  if(b.onGround&&(gap||(!player.onGround&&Math.abs(b.x-targetX)>25))){b.vy=-13.5;b.onGround=false}
  b.x+=b.vx;b.vy+=.58;b.y+=b.vy;
  const surface=floorAtX(b.x+b.w/2);
  if(b.y+b.h>=surface){b.y=surface-b.h;b.vy=0;b.onGround=true}
  if(Math.abs(b.vx)>.1&&b.onGround)b.walk+=Math.abs(b.vx)*.13;
  const target=enemies.find(e=>!e.dead&&Math.hypot(e.x-b.x,e.y-b.y)<55)||(boss&&!boss.dead&&rect(b,boss)?boss:null);
  if(target&&b.cooldown===0){target.hp--;if(target!==boss&&target.hp<=0)killEnemy(target);if(target===boss)boss.flash=8;b.cooldown=90;b.action=20}
 }
 b.x=Math.max(0,Math.min((boss?W:levelWidth)-b.w,b.x));
}
function updateBuddyCola(o){
 o.x+=o.vx;o.vy+=.16;o.y+=o.vy;o.life--;
 for(const e of enemies)if(o.life>0&&!e.dead&&rect(o,e)){e.hp--;if(e.hp<=0)killEnemy(e);o.life=0}
 if(o.life>0&&boss&&!boss.dead&&rect(o,boss)){boss.hp--;boss.flash=8;o.life=0}
 const surface=floorAtX(o.x+o.w/2);
 if(o.y+o.h>=surface)o.life=0;
 if(o.life<=0)particles.push({type:'splash',x:o.x,y:Math.min(surface-5,o.y),age:0,r:4,life:18,maxLife:18});
}
function drawBuddyCola(o){x.fillStyle='#754530';x.strokeStyle='#d6b579';x.lineWidth=2;x.beginPath();x.ellipse(o.x+9,o.y+9,8,6,0,0,Math.PI*2);x.fill();x.stroke()}
function drawCompanion(){
 if(!companion)return;
 const b=companion;
 if(b.type==='sponge'){
  sprite('sponge',b.x-3,b.y-13,58,64);x.fillStyle='#412d27';x.fillRect(b.x+7,b.y-16,38,5);x.fillStyle='#b88045';x.fillRect(b.x+7,b.y-16,38*b.cola/100,5);
  if(b.action>0){x.strokeStyle='#e5ca9b';x.lineWidth=2;x.beginPath();x.arc(b.x+26,b.y+19,30,0,Math.PI*2);x.stroke()}
 }else{
  const stride=b.onGround&&Math.abs(b.vx)>.15?Math.sin(b.walk)*5:0;
  sprite('sausage-dog',b.x-3,b.y-19,60,68);
  x.strokeStyle='#734634';x.lineWidth=3;x.lineCap='round';
  for(let i=0;i<4;i++){const px=b.x+9+i*10;x.beginPath();x.moveTo(px,b.y+26);x.lineTo(px+(i%2?stride:-stride),b.y+39);x.stroke()}
  if(b.action>0){x.fillStyle='#ffe099';x.font='bold 12px system-ui';x.textAlign='center';x.fillText('WUFF!',b.x+26,b.y-18)}
 }
}
function drawWalkingSprite(name,left,top,width,height,phase,walking){
 if(!walking){sprite(name,left,top,width,height);return}
 const cut=height*.68,hipX=left+width*.5,hipY=top+cut,stride=Math.sin(phase)*width*.14;
 x.save();x.beginPath();x.rect(left-4,top-4,width+8,cut+4);x.clip();sprite(name,left,top,width,height);x.restore();
 x.save();x.strokeStyle=name==='spaghetti'?'#d5a340':'#342b32';x.lineWidth=name==='spaghetti'?3:2;x.lineCap='round';
 for(const direction of [-1,1]){const start=hipX+direction*width*.11,footX=start+direction*stride,footY=top+height*.87-Math.max(0,direction*stride)*.25;x.beginPath();x.moveTo(start,hipY-3);x.lineTo(start-direction*stride*.4,hipY+height*.1);x.lineTo(footX,footY);x.lineTo(footX+direction*4,footY);x.stroke()}
 x.restore();
}
