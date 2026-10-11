// Dessert bosses: aerial cotton candy and bouncing explosive popcorn.
// Keep new actors visible even while their local SVG is loading or unavailable.
function drawDessertFallback(name,left,top,width,height){
 x.save();x.translate(left,top);x.scale(width/128,height/160);x.strokeStyle='#493a4a';x.lineWidth=3;
 if(name==='pudding'){x.fillStyle='#ba87d4';x.beginPath();x.moveTo(28,48);x.lineTo(100,48);x.lineTo(115,132);x.quadraticCurveTo(64,152,13,132);x.closePath();x.fill();x.stroke();x.fillStyle='#e7c6f2';x.beginPath();x.ellipse(64,48,36,13,0,0,Math.PI*2);x.fill();x.stroke()}
 if(name==='boss-cotton'){x.fillStyle='#f2b5d9';for(const [cx,cy,r] of [[34,59,28],[72,40,31],[97,73,27],[64,102,34]]){x.beginPath();x.arc(cx,cy,r,0,Math.PI*2);x.fill();x.stroke()}x.fillStyle='#fff1d4';x.beginPath();x.moveTo(53,128);x.lineTo(77,128);x.lineTo(65,156);x.fill()}
 if(name==='boss-popcorn'){x.fillStyle='#ed7971';x.fillRect(27,60,74,88);x.strokeRect(27,60,74,88);x.fillStyle='#fff3d5';for(let px=35;px<100;px+=23)x.fillRect(px,64,10,79);x.fillStyle='#fff3bb';for(let i=0;i<5;i++){x.beginPath();x.arc(24+i*20,40+(i%2)*10,20,0,Math.PI*2);x.fill();x.stroke()}}
 if(name==='boss-bigmac'){for(let i=0;i<3;i++){x.fillStyle='#dfb36f';x.fillRect(12,30+i*40,106,16);x.fillStyle='#78ab65';x.fillRect(12,46+i*40,106,8);x.fillStyle='#77523d';x.fillRect(12,54+i*40,106,15);x.strokeRect(12,30+i*40,106,39)}}
 const cy=name==='boss-bigmac'?39:name==='boss-popcorn'?94:82;x.fillStyle='#fff';for(const px of [49,77]){x.beginPath();x.ellipse(px,cy,7,10,0,0,Math.PI*2);x.fill();x.stroke();x.fillStyle='#493a4a';x.beginPath();x.arc(px+1,cy+2,3,0,Math.PI*2);x.fill();x.fillStyle='#fff'}x.strokeStyle='#493a4a';x.beginPath();x.moveTo(48,cy+22);x.quadraticCurveTo(64,cy+34,81,cy+22);x.stroke();x.restore();
}
function updateCottonFlight(b){
 b.previousY=b.y;b.flightTime++;
 if(boss.heavyCharge>0&&boss.heavyCharge<=30){b.x+=(boss.heavyTarget-b.w/2-b.x)*.045;b.y+=(140-b.y)*.09;return}
 if(b.swoop>0){b.swoop--;const dx=b.swoopTarget-b.x;b.x+=Math.sign(dx)*Math.min(Math.abs(dx),boss.phase===2?7:5);b.y+=(ground-b.h-20-b.y)*.13}
 else{b.x+=(540+Math.sin(b.flightTime*.019)*245-b.x)*.045;b.y+=(ground-b.h-65-(Math.sin(b.flightTime*.029)+1)*80-b.y)*.065}
 b.x=Math.max(180,Math.min(W-b.w-20,b.x));
}
function fireSugarPuffs(b){
 const count=boss.phase===2?3:1;
 for(let i=0;i<count;i++){
  const px=b.x+b.w/2,py=b.y+b.h/2,dx=player.x+player.w/2-px,dy=player.y+28-py,t=Math.max(30,Math.abs(dx)/3.5);
  objects.push({type:'sugarPuff',x:px,y:py,w:22,h:22,vx:dx/t,vy:(dy-.5*.065*t*t)/t+(i-(count-1)/2)*.7,life:220});
 }
 b.swoop=55;b.swoopTarget=Math.max(180,Math.min(W-b.w-20,player.x+player.w/2-b.w/2));
 b.attack=boss.phase===2?95:160;playSound('fire');
}
function fireBigmacPickles(b){
 const count=boss.phase===2?5:3,gravity=.1*worldGravity()/.58;
 for(let i=0;i<count;i++){const px=b.x+b.w/2,py=b.y+25+i*24,dx=player.x+player.w/2-px,dy=player.y+25-py,t=Math.max(35,Math.abs(dx)/4);objects.push({type:'pickleShot',x:px,y:py,w:24,h:14,vx:dx/t,vy:(dy-.5*gravity*t*t)/t,life:230})}
 b.attack=boss.phase===2?105:175;playSound('fire');
}
function fireExplosivePopcorn(b){
 const count=boss.phase===2?4:2;
 for(let i=0;i<count;i++){
  const px=b.x+b.w/2,py=b.y+12,dx=player.x+player.w/2-px,dy=player.y+28-py,t=Math.max(28,Math.min(100,Math.abs(dx)/4));
  objects.push({type:'explosivePopcorn',x:px,y:py,w:20,h:20,vx:dx/t+(i-(count-1)/2)*.45,vy:(dy-.5*.18*t*t)/t-(i%2)*.8,life:200,fuse:120,radius:boss.phase===2?72:58});
 }
 b.attack=boss.phase===2?115:185;playSound('fire');
}
function explodePopcorn(o){
 if(o.exploded)return;o.exploded=true;o.life=0;
 const radius=o.radius||58,cx=o.x+10,cy=Math.min(ground-10,o.y+10);
 objects.push({type:'popcornBlast',x:cx-radius,y:cy-radius,w:radius*2,h:radius*2,vx:0,life:14,damage:2,cx,cy,radius});
 for(let i=0;i<7;i++)particles.push({type:'spark',x:cx,y:cy,vx:Math.cos(i)*2.5,vy:Math.sin(i)*2.5-1,r:3,life:22,maxLife:22,age:0});playSound('pop');
}
function drawSugarPuff(o){
 x.save();x.fillStyle='#f4a9cf';x.strokeStyle='#b774ab';x.lineWidth=2;
 for(const [dx,dy,r] of [[5,12,9],[14,8,10],[18,15,8]]){x.beginPath();x.arc(o.x+dx,o.y+dy,r,0,Math.PI*2);x.fill();x.stroke()}x.restore();
}
function drawPopcornKernel(o){
 x.save();x.fillStyle='#fff2bf';x.strokeStyle='#b89a66';x.lineWidth=2;
 for(const [dx,dy,r] of [[5,8,7],[13,5,7],[16,13,7],[7,15,7]]){x.beginPath();x.arc(o.x+dx,o.y+dy,r,0,Math.PI*2);x.fill();x.stroke()}
 x.fillStyle=o.fuse<30&&tick%10<5?'#ef6655':'#bc8659';x.beginPath();x.arc(o.x+10,o.y+11,3,0,Math.PI*2);x.fill();x.restore();
}
function drawPopcornBlast(o){
 x.save();x.globalAlpha=Math.max(0,o.life/14);x.fillStyle='#ffe7a6';x.strokeStyle='#ea975f';x.lineWidth=4;x.beginPath();x.arc(o.cx,o.cy,o.radius,0,Math.PI*2);x.fill();x.stroke();
 x.fillStyle='#fff8de';for(let i=0;i<7;i++){x.beginPath();x.arc(o.cx+Math.cos(i)*o.radius*.6,o.cy+Math.sin(i)*o.radius*.6,10,0,Math.PI*2);x.fill()}x.restore();
}
