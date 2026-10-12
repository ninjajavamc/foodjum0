// Local underwater scenery, swimming physics and breaded fish-stick boss.
const WATER_TOP=30;
function isSwimming(){return level===6}
function addWaterHealingMushrooms(){
 for(let preferred=550;preferred<levelWidth-550;preferred+=900){const px=manholeSpot(preferred);if(px===null||objects.some(o=>o.type==='looseItem'&&o.item==='mushroom'&&Math.abs(o.x-px)<300))continue;objects.push({type:'looseItem',item:'mushroom',x:px,y:floorAtX(px)-34,w:34,h:34,life:Infinity,delay:0,waterHealing:true})}
}
function updateSwimmingVelocity(){
 const p=player,up=keys.w||keys.ArrowUp||keys.touchUp,down=keys.s||keys.ArrowDown||keys.touchDown;
 p.vy=p.vy*.94+(down?.35:0)-(up?.35:0)+.02;
 if(p.bubble>0)p.vy-=.12;
 p.vy=Math.max(-4.2,Math.min(4.2,p.vy));
}
function constrainSwimmer(actor){
 const bottom=floorAtX(actor.x+actor.w/2)-actor.h;
 if(actor.y<WATER_TOP){actor.y=WATER_TOP;actor.vy=Math.max(0,actor.vy||0)}
 if(actor.y>bottom){actor.y=bottom;actor.vy=Math.min(0,actor.vy||0)}
 actor.onGround=false;
}
function swimmingStroke(){
 if(!isSwimming()||screen!=='play'||player.seatedCatapult||player.climbing)return false;
 player.swing=null;player.vy=-5.2;player.onGround=false;playSound('jump');return true;
}
function updateSwimmingEnemy(e,direction,speed,previousX,previousY){
 e.x+=direction*speed;
 const target=Math.max(WATER_TOP,Math.min(floorAtX(e.x+e.w/2)-e.h-15,player.y-25+Math.sin(tick*.025+e.x*.003)*65));
 e.vy=Math.max(-1.7,Math.min(1.7,(target-e.y)*.035));e.y+=e.vy;
 collideEnemyTerrain(e,previousX,previousY);constrainSwimmer(e);
}
function drawSwimmingSprite(name,left,top,width,height,phase=tick*.09){
 x.save();x.translate(left+width/2,top+height/2);x.rotate(Math.sin(phase)*.09);sprite(name,-width/2,-height/2,width,height);x.restore();
}
function updateFishstickBoss(b){
 b.previousY=b.y;b.swimTime=(b.swimTime||0)+1;
 const bottom=ground-b.h-18,mid=(75+bottom)/2,amplitude=Math.min(90,(bottom-75)/2-10);
 const tx=540+Math.sin(b.swimTime*.017)*240,ty=boss.heavyCharge>0&&boss.heavyCharge<30?110:mid+Math.sin(b.swimTime*.025)*amplitude;
 b.x+=(tx-b.x)*.035;b.y+=(ty-b.y)*.045;
 b.x=Math.max(240,Math.min(W-b.w-25,b.x));b.y=Math.max(75,Math.min(ground-b.h-18,b.y));
 if(b.attack<=0){
  const count=boss.phase===2?5:3,angle=Math.atan2(player.y+player.h/2-b.y-b.h/2,player.x+player.w/2-b.x-b.w/2);
  for(let i=0;i<count;i++){const a=angle+(i-(count-1)/2)*.13;objects.push({type:'crumbShot',x:b.x+b.w/2,y:b.y+b.h/2,w:18,h:14,vx:Math.cos(a)*3.1,vy:Math.sin(a)*3.1,life:240,damage:2})}
  b.attack=boss.phase===2?100:165;playSound('fire');
 }
}
function drawWaterBackground(){
 const W=viewWidth,H=viewHeight;
 const sea=x.createLinearGradient(0,0,0,H);sea.addColorStop(0,'#479fc0');sea.addColorStop(.5,'#247695');sea.addColorStop(1,'#164d70');x.fillStyle=sea;x.fillRect(0,-viewOffsetY,W,H+viewOffsetY);
 x.fillStyle='rgba(182,242,255,.1)';for(let i=0;i<6;i++){const px=i*190+Math.sin(tick*.009+i)*20;x.beginPath();x.moveTo(px,0);x.lineTo(px+38,0);x.lineTo(px+150,H);x.lineTo(px-80,H);x.fill()}
 for(let row=0;row<3;row++){x.fillStyle=['#368b9c','#2b7889','#23697a'][row];x.beginPath();x.moveTo(0,H);for(let px=0;px<=W+20;px+=20)x.lineTo(px,350+row*65+Math.sin((px+camera*(.1+row*.1))*.006)*35);x.lineTo(W,H);x.closePath();x.fill()}
 x.strokeStyle='rgba(190,242,255,.5)';x.lineWidth=1.5;for(let i=0;i<35;i++){const px=((i*113-camera*.17)%(W+30)+W+30)%(W+30),py=H-(i*47+tick*.7)%(H+25);x.beginPath();x.arc(px,py,2+i%4,0,Math.PI*2);x.stroke()}
}
function drawKelp(tree){
 const cx=tree.x,base=tree.baseY??ground;x.save();x.lineCap='round';
 for(let i=0;i<5;i++){const px=cx-30+i*14,sway=Math.sin(tick*.025+i+cx)*15;x.strokeStyle=i%2?'#86c795':'#56ad88';x.lineWidth=9;x.beginPath();x.moveTo(px,base);x.bezierCurveTo(px-25,base-70,px+30+sway,base-155,px+sway,base-240-i%2*25);x.stroke()}
 x.strokeStyle='#d49092';x.lineWidth=9;x.beginPath();x.moveTo(cx+5,base);x.lineTo(cx+40,base-85);x.lineTo(cx+23,base-112);x.moveTo(cx+40,base-85);x.lineTo(cx+67,base-115);x.stroke();x.strokeStyle='#9cc5c5';x.lineWidth=4;x.beginPath();x.moveTo(cx,tree.hookY+45);x.lineTo(tree.hookX,tree.hookY);x.stroke();x.fillStyle='#ffdc89';x.beginPath();x.arc(tree.hookX,tree.hookY,6,0,Math.PI*2);x.fill();x.restore();
}
function drawWaterObstacle(o){
 x.save();x.fillStyle=o.type==='reefBlock'?'#b19fbc':'#7b9aab';x.strokeStyle='#405d76';x.lineWidth=3;x.fillRect(o.x,o.y,o.w,o.h);x.strokeRect(o.x,o.y,o.w,o.h);
 if(o.type==='reefBlock'){x.strokeStyle='#e9a9ae';x.lineWidth=5;for(let i=0;i<3;i++){const px=o.x+15+i*23;x.beginPath();x.moveTo(px,o.y+o.h-5);x.lineTo(px,o.y+12);x.moveTo(px,o.y+35);x.lineTo(px+10,o.y+23);x.stroke()}}
 else{x.strokeStyle='#d1e5e8';x.lineWidth=6;x.beginPath();x.moveTo(o.x+o.w/2,o.y+15);x.lineTo(o.x+o.w/2,o.y+o.h-15);x.moveTo(o.x+12,o.y+o.h-30);x.quadraticCurveTo(o.x+o.w/2,o.y+o.h,o.x+o.w-12,o.y+o.h-30);x.moveTo(o.x+15,o.y+30);x.lineTo(o.x+o.w-15,o.y+30);x.stroke()}
 x.restore();
}
function drawMakiEnemy(e){
 if(isSwimming())drawSwimmingSprite('maki',e.x-12,e.y-9,70,72,tick*.09+e.x*.003);
 else drawWalkingSprite('maki',e.x-12,e.y-9,70,72,tick*.13,!!e.onGround);
}
function drawAquaticFallback(name,left,top,width,height){
 x.save();x.translate(left,top);x.scale(width/128,height/160);x.strokeStyle='#624d35';x.lineWidth=3;
 if(name==='maki'){
  x.fillStyle='#344448';x.strokeStyle='#233138';x.lineWidth=2;x.beginPath();x.moveTo(24,39);x.lineTo(104,39);x.lineTo(104,101);x.quadraticCurveTo(64,122,24,101);x.closePath();x.fill();x.stroke();
  x.fillStyle='#fff3e8';x.beginPath();x.ellipse(64,39,38,17,0,0,Math.PI*2);x.fill();x.stroke();x.fillStyle='#a9d666';x.beginPath();x.ellipse(64,40,26,9,0,0,Math.PI*2);x.fill();x.fillStyle='#e36d50';x.fillRect(57,32,15,15);
  x.strokeStyle='#263138';x.lineWidth=3;x.beginPath();x.moveTo(25,70);x.lineTo(11,70);x.moveTo(104,70);x.lineTo(119,70);x.moveTo(48,108);x.lineTo(44,142);x.lineTo(34,149);x.moveTo(79,108);x.lineTo(84,142);x.lineTo(94,149);x.stroke();
  x.fillStyle='#f7f0e5';for(const px of [11,119]){x.beginPath();x.arc(px,72,7,0,Math.PI*2);x.fill();x.stroke()}
  x.strokeStyle='#172125';x.beginPath();x.moveTo(36,61);x.lineTo(53,68);x.moveTo(76,68);x.lineTo(92,60);x.stroke();x.fillStyle='#fff';for(const px of [48,82]){x.beginPath();x.ellipse(px,74,8,4,0,0,Math.PI*2);x.fill();x.stroke();x.fillStyle='#172125';x.beginPath();x.arc(px,74,2.5,0,Math.PI*2);x.fill();x.fillStyle='#fff'}
  x.fillRect(47,88,34,13);x.strokeRect(47,88,34,13);x.beginPath();x.moveTo(58,88);x.lineTo(58,101);x.moveTo(70,88);x.lineTo(70,101);x.stroke();x.restore();return;
 }
 if(name==='taco'){x.fillStyle='#7fc750';x.beginPath();x.ellipse(51,53,30,38,.6,0,Math.PI*2);x.fill();x.fillStyle='#f8d945';x.beginPath();x.moveTo(25,42);x.lineTo(114,22);x.lineTo(42,120);x.closePath();x.fill();x.stroke();x.beginPath();x.moveTo(45,115);x.lineTo(26,154);x.moveTo(59,114);x.lineTo(88,154);x.stroke()}
 else{
  x.fillStyle='#dca653';x.strokeStyle='#a4773c';x.lineWidth=1.3;x.fillRect(37,11,54,132);x.strokeRect(37,11,54,132);
  for(let i=0;i<55;i++){x.fillStyle=i%2?'#f0ca80':'#be863f';x.fillRect(40+(i%7)*7,15+Math.floor(i/7)*16,3,3)}
  x.strokeStyle='#171713';x.lineWidth=1.9;x.beginPath();x.moveTo(38,53);x.quadraticCurveTo(13,58,15,40);x.moveTo(90,53);x.quadraticCurveTo(110,57,124,35);x.moveTo(52,126);x.lineTo(51,146);x.lineTo(23,145);x.moveTo(78,124);x.lineTo(75,147);x.lineTo(123,153);x.stroke();
  for(const px of [49,78]){x.beginPath();x.ellipse(px,29,9,8,0,0,Math.PI*2);x.stroke();x.fillStyle='#171713';x.beginPath();x.ellipse(px+3,32,4.5,4,0,0,Math.PI*2);x.fill()}
  x.beginPath();x.moveTo(43,12);x.lineTo(57,19);x.moveTo(70,18);x.lineTo(87,12);x.stroke();x.strokeRect(48,49,34,20);x.beginPath();x.moveTo(49,59);x.lineTo(81,59);for(const px of [55,63,72]){x.moveTo(px,50);x.lineTo(px,68)}x.stroke();x.restore();return;
 }
 x.fillStyle='#fff';for(const px of [48,78]){x.beginPath();x.ellipse(px,67,7,9,0,0,Math.PI*2);x.fill();x.fillStyle='#463a30';x.beginPath();x.arc(px+1,68,3,0,Math.PI*2);x.fill();x.fillStyle='#fff'}x.strokeStyle='#624d35';x.beginPath();x.moveTo(48,91);x.quadraticCurveTo(64,82,80,91);x.stroke();x.restore();
}
