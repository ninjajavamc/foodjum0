const BUDDIES=[
 {art:'sponge',name:'Schwamm',text:'Saugt Cola auf und schleudert sie automatisch auf Gegner.'},
 {art:'sausage-dog',name:'Wursthund',text:'Folgt dir, springt mit und beißt für 0,5 HP.'},
 {art:'toothpaste',name:'Zahnpasta',text:'Folgt dir und schießt Zahnpasta für 0,5 HP.'},
 {art:'toothbrush',name:'Zahnbürste',text:'Folgt dir und schrubbt nahe Gegner für 0,5 HP.'}
];
const COMPANION_DAMAGE=.5,DOG_BITE_COOLDOWN=180;
let selectedBuddy=0,companion=null,buddyCards=[];
function resetCompanion(preserve=false){
 const saved=preserve&&companion?companion.cola:0;
 const index=player.buddyIndex??selectedBuddy;player.buddyIndex=index;
 companion={type:BUDDIES[index].art,x:player.x-65,y:ground-40,w:52,h:40,vx:0,vy:0,onGround:true,cola:saved,cooldown:0,walk:0,action:0};
}
function drawBuddyChoose(){
 x.fillStyle='rgba(20,20,45,.9)';x.fillRect(0,0,W,H);x.textAlign='center';x.fillStyle='#fff';x.font='bold 38px system-ui';x.fillText('Wähle deinen Begleiter',W/2,105);x.font='19px system-ui';x.fillText(worldName(selectedLevel)+' · Deine Figur: '+chars[selected].name,W/2,145);drawMenuBack();
 buddyCards=BUDDIES.map((buddy,i)=>({x:40+i*240,y:185,w:200,h:290,id:i}));
 for(const card of buddyCards){const buddy=BUDDIES[card.id];x.fillStyle=card.id===selectedBuddy?'#fff0bb':'#fff';x.fillRect(card.x,card.y,card.w,card.h);x.strokeStyle=card.id===selectedBuddy?'#ec985d':'#798baa';x.lineWidth=4;x.strokeRect(card.x,card.y,card.w,card.h);sprite(buddy.art,card.x+43,card.y+15,114,132);if(buddy.art==='toothpaste')drawGooglyEyes(card.x+85,card.y+23,30,10);if(buddy.art==='toothbrush')drawGooglyEyes(card.x+88,card.y+21,22,9);x.fillStyle='#2c3548';x.font='bold 21px system-ui';x.fillText(buddy.name,card.x+card.w/2,card.y+175);wrap(buddy.text,card.x+22,card.y+206,card.w-44,20,'#2c3548')}
 x.fillStyle='#fff';x.font='18px system-ui';x.fillText('Antippen oder ← → und Enter zum Starten',W/2,520);x.font='14px system-ui';x.fillText('Esc: zurück zur Charakterwahl',W/2,554);
}
function buddyKey(event){
 if(event.key==='ArrowLeft')selectedBuddy=(selectedBuddy+BUDDIES.length-1)%BUDDIES.length;
 if(event.key==='ArrowRight')selectedBuddy=(selectedBuddy+1)%BUDDIES.length;
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
  const target=enemies.find(e=>!e.dead&&Math.abs(e.x-b.x)<230)||findBossTarget(b.x,b.y,230);
  if(target&&b.cola>=20&&b.cooldown===0){
   const direction=target.x>b.x?1:-1;
   objects.push({type:'buddyCola',x:b.x+b.w/2,y:b.y+10,w:18,h:18,vx:direction*3.5,vy:-2.3,life:80});b.cola-=20;b.cooldown=75;b.action=20;
  }
 }else if(b.type==='sausage-dog'){
  b.vx=Math.max(-4.8,Math.min(4.8,(targetX-b.x)*.14));
  if(isSwimming()){b.x+=b.vx;b.vy=(player.y+8-b.y)*.12;b.y+=b.vy;constrainSwimmer(b);b.walk+=.15}
  else{
  const direction=b.vx>=0?1:-1,front=direction>0?b.x+b.w:b.x;
  const gap=[...lavaPits,...cliffs].some(l=>direction>0?front<=l.x&&l.x-front<30:front>=l.x+l.w&&front-l.x-l.w<30);
  if(b.onGround&&(gap||(!player.onGround&&Math.abs(b.x-targetX)>25))){b.vy=-13.5;b.onGround=false}
  b.x+=b.vx;b.vy+=.58;b.y+=b.vy;
  const surface=floorAtX(b.x+b.w/2);
  if(b.y+b.h>=surface){b.y=surface-b.h;b.vy=0;b.onGround=true}
  if(Math.abs(b.vx)>.1&&b.onGround)b.walk+=Math.abs(b.vx)*.13;
  }
  const target=enemies.find(e=>!e.dead&&Math.hypot(e.x-b.x,e.y-b.y)<55)||bossTargets().find(target=>rect(b,target));
  if(target&&b.cooldown===0){target.hp-=COMPANION_DAMAGE;if(!target.isBoss&&target.hp<=0)killEnemy(target);if(target.isBoss)target.flash=8;b.cooldown=DOG_BITE_COOLDOWN;b.action=20}
 }else{
  b.x+=(targetX-b.x)*.13;b.y+=(player.y+10+Math.sin(tick*.06)*3-b.y)*.13;
  const range=b.type==='toothpaste'?210:52,target=enemies.find(e=>!e.dead&&Math.hypot(e.x-b.x,e.y-b.y)<range)||findBossTarget(b.x,b.y,range);
  if(target&&b.cooldown===0){
   if(b.type==='toothpaste'){objects.push({type:'buddyFoam',x:b.x+22,y:b.y+13,w:18,h:18,vx:(target.x>b.x?1:-1)*3.4,vy:-2.1,life:85});b.cooldown=150}
   else{target.hp-=COMPANION_DAMAGE;if(target.isBoss)target.flash=8;else if(target.hp<=0)killEnemy(target);b.cooldown=180}
   b.action=20;
  }
 }
 b.x=Math.max(0,Math.min((boss?W:levelWidth)-b.w,b.x));
 if(isSwimming())constrainSwimmer(b);
}
function updateBuddyCola(o){
 o.x+=o.vx;o.vy+=.16;o.y+=o.vy;o.life--;
 for(const e of enemies)if(o.life>0&&!e.dead&&rect(o,e)){e.hp--;if(e.hp<=0)killEnemy(e);o.life=0}
 for(const target of bossTargets())if(o.life>0&&rect(o,target)){target.hp--;target.flash=8;o.life=0}
 const surface=floorAtX(o.x+o.w/2);
 if(o.y+o.h>=surface)o.life=0;
 if(o.life<=0)particles.push({type:'splash',x:o.x,y:Math.min(surface-5,o.y),age:0,r:4,life:18,maxLife:18});
}
function updateBuddyFoam(o){
 o.x+=o.vx;o.vy+=.14;o.y+=o.vy;o.life--;
 for(const e of enemies)if(o.life>0&&!e.dead&&rect(o,e)){e.hp-=COMPANION_DAMAGE;if(e.hp<=0)killEnemy(e);o.life=0}
 for(const target of bossTargets())if(o.life>0&&rect(o,target)){target.hp-=COMPANION_DAMAGE;target.flash=8;o.life=0}
 if(o.y+o.h>=floorAtX(o.x+o.w/2))o.life=0;
}
function drawBuddyFoam(o){x.fillStyle='#f5ffed';x.strokeStyle='#72beb5';x.lineWidth=2;x.beginPath();x.ellipse(o.x+9,o.y+9,9,6,0,0,Math.PI*2);x.fill();x.stroke()}
function drawBuddyCola(o){x.fillStyle='#754530';x.strokeStyle='#d6b579';x.lineWidth=2;x.beginPath();x.ellipse(o.x+9,o.y+9,8,6,0,0,Math.PI*2);x.fill();x.stroke()}
function drawCompanion(){
 if(!companion)return;
 const b=companion;x.save();if(isSwimming()){x.translate(b.x+26,b.y+22);x.rotate(Math.sin(tick*.09)*.09);x.translate(-b.x-26,-b.y-22)}
 if(b.type==='sponge'){
  sprite('sponge',b.x-3,b.y-13,58,64);x.fillStyle='#412d27';x.fillRect(b.x+7,b.y-16,38,5);x.fillStyle='#b88045';x.fillRect(b.x+7,b.y-16,38*b.cola/100,5);
  if(b.action>0){x.strokeStyle='#e5ca9b';x.lineWidth=2;x.beginPath();x.arc(b.x+26,b.y+19,30,0,Math.PI*2);x.stroke()}
 }else if(b.type==='sausage-dog'){
  const stride=b.onGround&&Math.abs(b.vx)>.15?Math.sin(b.walk)*5:0;
  sprite('sausage-dog',b.x-3,b.y-19,60,68);
  x.strokeStyle='#734634';x.lineWidth=3;x.lineCap='round';
  for(let i=0;i<4;i++){const px=b.x+9+i*10;x.beginPath();x.moveTo(px,b.y+26);x.lineTo(px+(i%2?stride:-stride),b.y+39);x.stroke()}
  if(b.action>0){x.fillStyle='#ffe099';x.font='bold 12px system-ui';x.textAlign='center';x.fillText('WUFF!',b.x+26,b.y-18)}
 }else{
  const brush=b.type==='toothbrush';x.save();x.translate(b.x+26,b.y+4);if(brush&&b.action>0)x.rotate(Math.sin(tick*.7)*.25);sprite(b.type,-28,brush?-38:-25,56,brush?78:66);drawGooglyEyes(brush?-9:-11,brush?-39:-20,brush?17:22,brush?7.5:8.5);x.restore();
 }
 x.restore();
}
function drawGooglyEyes(left,top,spacing=24,radius=9){
 x.save();x.lineWidth=2;x.strokeStyle='#344544';
 for(let i=0;i<2;i++){const cx=left+i*spacing,cy=top+Math.sin(tick*.13+i)*1.2;x.fillStyle='#fffdf1';x.beginPath();x.arc(cx,cy,radius,0,Math.PI*2);x.fill();x.stroke();x.fillStyle='#273542';x.beginPath();x.arc(cx+Math.sin(tick*.11+i)*2.5,cy+Math.cos(tick*.09+i)*2,4,0,Math.PI*2);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(cx,cy-2,1.5,0,Math.PI*2);x.fill()}
 x.restore();
}
function drawWalkingSprite(name,left,top,width,height,phase,walking){
 if(!walking){sprite(name,left,top,width,height);return}
 const cut=height*(name==='banane'?.83:.68),hipX=left+width*(name==='banane'?.58:.5),hipY=top+cut,stride=Math.sin(phase)*width*.14;
 x.save();x.beginPath();x.rect(left-4,top-4,width+8,cut+4);x.clip();sprite(name,left,top,width,height);x.restore();
 x.save();x.strokeStyle=name==='maki'?'#263138':name==='spaghetti'?'#d5a340':'#342b32';x.lineWidth=name==='spaghetti'?3:2;x.lineCap='round';
 for(const direction of [-1,1]){const start=hipX+direction*width*.11,footX=start+direction*stride,footY=top+height*(name==='maki'?.93:['banane','spaghetti'].includes(name)?.94:.87)-Math.max(0,direction*stride)*.25;x.beginPath();x.moveTo(start,hipY-3);x.lineTo(start-direction*stride*.4,hipY+height*.1);x.lineTo(footX,footY);x.lineTo(footX+direction*4,footY);x.stroke()}
 x.restore();
}
