// Mobile bosses and one clearly telegraphed 10-HP special per fight.
function updateBossJump(b){
 b.previousY=b.y;b.vy=b.vy||0;b.jumpTimer=(b.jumpTimer??60)-1;
 if(b.jumpTimer<=0&&b.y+b.h>=ground-1){b.vy=level===5?-5.5:b.art==='boss'?-10.8:-9.8;b.jumpTimer=level>=2?115:150}
 b.y+=b.vy;b.vy+=.42*worldGravity()/.58;
 if(b.y+b.h>=ground){b.y=ground-b.h;b.vy=0}
}
function updateBossSpecial(){
 if(!boss.heavyUsed&&boss.phase===2){boss.heavyUsed=true;boss.heavyCharge=90;boss.heavyTarget=Math.max(125,Math.min(W-125,player.x+player.w/2));if(boss.swimming)boss.heavyTargetY=Math.max(140,Math.min(ground-125,player.y+player.h/2));playSound('boss')}
 if(!(boss.heavyCharge>0))return;
 boss.heavyCharge--;
 if(boss.heavyCharge===30)for(const b of bossTargets())if(!b.swimming)b.vy=level===5?-5.5:-13;
 if(boss.heavyCharge===0){
  objects.push({type:'bossHeavyWave',x:boss.heavyTarget-125,y:boss.swimming?boss.heavyTargetY-125:ground-38,w:250,h:boss.swimming?250:38,vx:0,life:25,damage:10,flavor:boss.art});
  boss.heavyCount=(boss.heavyCount||0)+1;shake=22;screenFlash=3;playSound('splash');
 }
}
function drawBossWarning(){
 if(!boss||boss.dead||!(boss.heavyCharge>0))return;
 if(boss.swimming){x.save();x.fillStyle='rgba(250,98,77,.28)';x.strokeStyle='#fff1ac';x.lineWidth=4;x.beginPath();x.arc(boss.heavyTarget,boss.heavyTargetY,125,0,Math.PI*2);x.fill();x.stroke();x.fillStyle='#fff1ac';x.font='bold 24px system-ui';x.textAlign='center';x.fillText('! 10 HP',boss.heavyTarget,boss.heavyTargetY-135);x.restore();return}
 x.save();const px=boss.heavyTarget,pulse=.35+.25*Math.sin(tick*.3);x.fillStyle='rgba(249,90,55,'+pulse+')';x.strokeStyle='#fff1a0';x.lineWidth=4;x.beginPath();x.ellipse(px,ground-5,125,19,0,0,Math.PI*2);x.fill();x.stroke();x.fillStyle='#ffe5aa';x.font='bold 24px system-ui';x.textAlign='center';x.fillText('! 10 HP',px,ground-67);x.strokeStyle='#fb7756';x.lineWidth=5;x.beginPath();x.moveTo(px,ground-55);x.lineTo(px,ground-29);x.stroke();x.restore();
}
function drawBossHeavyWave(o){
 if(o.flavor==='boss-fishstick'){x.save();x.fillStyle='rgba(142,227,248,.5)';x.strokeStyle='#f2fcff';x.lineWidth=4;x.beginPath();x.arc(o.x+125,o.y+125,125,0,Math.PI*2);x.fill();x.stroke();for(let i=0;i<8;i++){x.beginPath();x.arc(o.x+125+Math.cos(i)*84,o.y+125+Math.sin(i)*84,12,0,Math.PI*2);x.stroke()}x.restore();return}
 if(['boss-cotton','boss-popcorn','boss-bigmac'].includes(o.flavor)){
  const color=o.flavor==='boss-cotton'?'#f2a0ce':o.flavor==='boss-popcorn'?'#ffe29a':'#85c56e';x.save();x.fillStyle=color;x.globalAlpha=.75;x.fillRect(o.x,o.y,o.w,o.h);x.strokeStyle='#fff9e7';x.lineWidth=3;
  for(let i=0;i<9;i++){x.beginPath();x.arc(o.x+14+i*28,ground-25-Math.sin(tick+i)*8,18,0,Math.PI*2);x.fill();x.stroke()}x.restore();return;
 }
 x.save();x.fillStyle='rgba(255,101,49,.55)';x.fillRect(o.x,o.y,o.w,o.h);x.strokeStyle='#fff0a2';x.lineWidth=4;x.beginPath();x.ellipse(o.x+o.w/2,ground-8,o.w/2,18,0,0,Math.PI*2);x.stroke();
 for(let i=0;i<11;i++){const px=o.x+12+i*22;x.fillStyle=i%2?'#ffdf7c':'#f77746';x.beginPath();x.moveTo(px-10,ground);x.lineTo(px,ground-38-Math.sin(tick+i)*13);x.lineTo(px+10,ground);x.closePath();x.fill()}x.restore();
}
