let mandarinBabies=[];
function spawnMandarinBabies(){
 mandarinBabies=[];
 for(let i=0;i<4;i++)mandarinBabies.push({x:player.x-15+i*18,y:player.y+25,w:22,h:28,life:300,cooldown:i*15,phase:i});
 player.cooldown=300;player.shield=0;message='Vier Mandarinen-Babys greifen 5 Sekunden lang an!';
}
function updateMandarinBabies(){
 for(const b of mandarinBabies){
  b.life--;b.cooldown=Math.max(0,b.cooldown-1);
  const candidates=enemies.filter(e=>!e.dead&&Math.abs(e.x-player.x)<360);
  for(const target of bossTargets())if(target.hp>0&&Math.abs(target.x-player.x)<360)candidates.push(target);
  candidates.sort((a,c)=>Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(c.x-b.x,c.y-b.y));
  const target=candidates[0],tx=target?target.x+target.w/2-b.w/2:player.x+(b.phase-1.5)*28,ty=target?target.y+target.h/2-b.h/2:player.y+player.h-b.h;
  if(Math.abs(b.x-player.x)>600){b.x=player.x;b.y=player.y+20}
  const move=Math.max(-4,Math.min(4,(tx-b.x)*.16));b.x+=move;b.y+=Math.max(-3.5,Math.min(3.5,(ty-b.y)*.18));b.walking=Math.abs(move)>.1;
  if(b.life>0&&target&&b.cooldown===0&&rect(b,target)){
   target.hp-=.5;b.cooldown=90;playSound('defeat');
   if(target.isBoss)target.flash=8;else if(target.hp<=0)killEnemy(target);
  }
 }
 mandarinBabies=mandarinBabies.filter(b=>b.life>0);
}
function drawMandarinBabies(){
 for(const b of mandarinBabies){x.save();x.globalAlpha=Math.min(1,b.life/30);if(isSwimming())drawSwimmingSprite('mandarin-piece',b.x-3,b.y-6,28,37,tick*.13+b.phase);else drawWalkingSprite('mandarin-piece',b.x-3,b.y-6+Math.sin(tick*.15+b.phase)*2,28,37,tick*.13+b.phase,b.walking);x.restore()}
}
function throwBananaBoomerang(){
 objects.push({type:'bananaBoomerang',onlineOwner:online.context?'guest':'host',x:player.x+(player.facing>0?player.w:-36),y:player.y+12,w:36,h:24,vx:player.facing*6.2,originY:player.y+12,age:0,life:110,hitTargets:new Set()});
 message='Bananenschale + Bananen-Bumerang!';
}
function updateBananaBoomerang(o){
 o.age++;o.life--;
 if(o.age<=30){o.x+=o.vx;o.y=o.originY+Math.sin(o.age*.15)*12}
 else{
  const dx=player.x+player.w/2-o.x-o.w/2,dy=player.y+22-o.y-o.h/2,length=Math.hypot(dx,dy);
  if(length<24){o.life=0;return}
  o.x+=dx/length*8.8;o.y+=dy/length*8.8;
 }
 for(const e of enemies)if(!e.dead&&!o.hitTargets.has(e)&&rect(o,e)){o.hitTargets.add(e);e.hp-=2;if(e.hp<=0)killEnemy(e)}
 for(const b of bossTargets())if(!o.hitTargets.has(b)&&rect(o,b)){o.hitTargets.add(b);b.hp-=2;b.flash=8}
}
function drawBananaBoomerang(o){
 x.save();x.translate(o.x+o.w/2,o.y+o.h/2);x.rotate(o.age*.25);
 x.strokeStyle='rgba(255,231,130,.5)';x.lineWidth=3;x.beginPath();x.arc(0,0,21,.2,Math.PI*1.5);x.stroke();
 x.fillStyle='#ffdc57';x.strokeStyle='#98722e';x.lineWidth=2;x.beginPath();x.moveTo(-18,-8);x.quadraticCurveTo(-5,21,20,-5);x.quadraticCurveTo(2,8,-18,-8);x.closePath();x.fill();x.stroke();
 x.strokeStyle='#fff4b3';x.lineWidth=2;x.beginPath();x.moveTo(-12,-3);x.quadraticCurveTo(0,9,13,-1);x.stroke();x.restore();
}
