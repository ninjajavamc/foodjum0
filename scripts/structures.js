function placeStructure(item){
 if(item==='ladderKit')return placeLadder();
 const type=item==='catapultKit'?'catapult':'stonewall',w=88,h=type==='catapult'?65:72;
 const positions=[player.x+player.facing*85,player.x-player.facing*(w+28)];
 const pos=positions.find(px=>px>=0&&px+w<levelWidth&&floorAtX(px)===floorAtX(px+w)&&[...lavaPits,...cliffs].every(g=>px+w<=g.x||px>=g.x+g.w)&&!objects.some(o=>['cola','stonewall','catapult','greatWall','secretWall'].includes(o.type)&&px<o.x+o.w&&px+w>o.x)&&!obstacles.some(o=>px<o.x+o.w&&px+w>o.x));
 if(pos===undefined){message='Hier ist kein Platz zum Bauen. Such einen freien Boden.';return false}
 objects.push({type,x:pos,y:floorAtX(pos)-h,w,h,cooldown:0,shots:8,animation:0});message=type==='catapult'?'Katapult gebaut! Es wirft automatisch 8 Steine.':'Steinmauer gebaut! Sie blockiert Mentos.';return true;
}
function updateCatapult(o){
 o.cooldown=Math.max(0,o.cooldown-1);o.animation=Math.max(0,o.animation-1);
 if(player.seatedCatapult===o||o.shots<=0||o.cooldown>0)return;
 const originX=o.x+44,originY=o.y+8,target=enemies.find(e=>!e.dead&&Math.abs(e.x-originX)<330)||findBossTarget(originX,originY,330);
 if(!target)return;
 const dx=target.x+target.w/2-originX,dy=target.y+target.h/2-originY,t=Math.max(12,Math.abs(dx)/5.5),gravity=.22;
 objects.push({type:'catapultRock',x:originX,y:originY,w:16,h:16,vx:dx/t,vy:(dy-.5*gravity*t*t)/t,life:130});o.shots--;o.cooldown=120;o.animation=25;playSound('special');
}
function updateCatapultRock(o){
 o.vy+=.22;o.x+=o.vx;o.y+=o.vy;o.life--;
 for(const e of enemies)if(o.life>0&&!e.dead&&rect(o,e)){e.hp-=2;if(e.hp<=0)killEnemy(e);o.life=0}
 for(const target of bossTargets())if(o.life>0&&rect(o,target)){target.hp-=2;target.flash=8;o.life=0}
 if(o.y+o.h>=floorAtX(o.x+o.w/2))o.life=0;
}
function drawStructure(o){
 if(o.type==='catapultRock'){x.fillStyle='#899394';x.strokeStyle='#485b5b';x.lineWidth=2;x.beginPath();x.arc(o.x+8,o.y+8,8,0,Math.PI*2);x.fill();x.stroke();return}
 x.save();x.translate(o.x,o.y);
 if(o.type==='ladder'||o.type==='sewerLadder'){
  x.strokeStyle='#58432e';x.lineWidth=8;x.lineCap='round';x.beginPath();x.moveTo(5,0);x.lineTo(5,o.h);x.moveTo(o.w-5,0);x.lineTo(o.w-5,o.h);x.stroke();
  x.strokeStyle='#d9b781';x.lineWidth=5;x.beginPath();for(let py=14;py<o.h;py+=24){x.moveTo(5,py);x.lineTo(o.w-5,py)}x.stroke();
  x.fillStyle='#ffe7ad';x.textAlign='center';x.font='bold 12px system-ui';if(showGameplayHints())x.fillText('W / ↑',o.w/2,-12);
 }else if(o.type==='stonewall'||o.type==='greatWall'){
  x.fillStyle='#738483';x.fillRect(0,0,o.w,o.h);x.strokeStyle='#3e5555';x.lineWidth=2;
  for(let row=0;row<Math.ceil(o.h/24);row++)for(let col=0;col<Math.ceil(o.w/24)+1;col++){const left=col*24-(row%2)*12,right=Math.min(o.w-1,left+23),start=Math.max(1,left+1),height=Math.min(21,o.h-row*24-2);if(right<=start||height<=0)continue;x.fillStyle=(col+row)%2?'#adbab4':'#92a39d';x.fillRect(start,row*24+1,right-start,height);x.strokeRect(start,row*24+1,right-start,height)}
  if(o.type==='greatWall'){x.fillStyle='#d3c7a5';x.fillRect(-4,-10,o.w+8,12);x.textAlign='center';x.font='bold 14px system-ui';x.fillStyle='#263d42';if(showGameplayHints())x.fillText('HOHE MAUER',o.w/2,-22);}
 }else{
  x.strokeStyle='#64452e';x.lineWidth=8;x.lineCap='round';x.beginPath();x.moveTo(8,58);x.lineTo(80,58);x.moveTo(24,53);x.lineTo(42,19);x.lineTo(61,54);x.stroke();
  x.strokeStyle='#c19b60';x.lineWidth=5;x.beginPath();x.moveTo(26,52);x.lineTo(42,22);x.lineTo(59,52);x.stroke();
  const rotation=o.animation>0?-.65+Math.sin(o.animation/25*Math.PI)*1.2:-.65;x.save();x.translate(42,29);x.rotate(rotation);x.fillStyle='#b8c6ca';x.fillRect(-5,-5,54,8);x.beginPath();x.ellipse(49,-1,13,9,0,0,Math.PI*2);x.fill();x.strokeStyle='#6c858a';x.lineWidth=2;x.stroke();x.restore();
  x.fillStyle='#5c6968';for(const px of [20,70]){x.beginPath();x.arc(px,61,9,0,Math.PI*2);x.fill();x.fillStyle='#b5c4bb';x.beginPath();x.arc(px,61,3,0,Math.PI*2);x.fill();x.fillStyle='#5c6968'}
  x.fillStyle='#234442';x.font='bold 11px system-ui';x.textAlign='center';if(showGameplayHints())x.fillText('SPIELER-KATAPULT',44,-8);if(showGameplayHints()&&nearbyCatapult()===o){x.font='bold 12px system-ui';x.fillText(player.seatedCatapult===o?'W: Dich abschießen':'W: Reinsetzen',44,-27);}
 }
 x.restore();
}
