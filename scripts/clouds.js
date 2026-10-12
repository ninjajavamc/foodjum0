// Original cloud bakery scenery, floating buns and regenerating crumble-cookie platforms.
let cloudRain={};
function resetCloudWeather(){cloudRain={time:0,nextAt:600,active:false,remaining:0}}
function updateCloudWeather(){
 if(screen!=='play'||!isCloudWorld())return;
 cloudRain.time++;
 if(cloudRain.active){cloudRain.remaining--;if(cloudRain.remaining<=0)cloudRain.active=false}
 if(!cloudRain.active&&cloudRain.time>=cloudRain.nextAt){cloudRain.active=true;cloudRain.remaining=600;cloudRain.nextAt=cloudRain.time+1200+Math.floor(Math.random()*600)}
}
function drawCloudRain(){
 if(!isCloudWorld()||!cloudRain.active)return;
 const W=viewWidth,H=viewHeight;
 x.save();x.translate(-viewOffsetX,0);x.strokeStyle='#5089b0';x.lineWidth=1.8;x.globalAlpha=.65;
 for(let i=0;i<Math.ceil(65*W*H/(1000*620));i++){const px=((i*71-tick*(worldWind.active?5:1))%W+W)%W,py=(i*91+tick*12)%H;x.beginPath();x.moveTo(px,py);x.lineTo(px-(worldWind.active?12:3),py+17);x.stroke()}
 x.restore();
}
function isCloudWorld(){return level===7&&!undergroundTrip&&!boss}
function decorateCloudWorld(){
 if(!isCloudWorld())return;
 cliffs.push(...lavaPits);lavaPits.length=0;
 platforms.forEach((p,i)=>{p.cloudCookie=i%3===1;p.cloudHomeY=p.y;p.crumbleFrames=0;p.broken=0});
 for(const gap of cliffs)platforms.push({x:gap.x+gap.w/2-32,y:gap.y-65,w:64,h:18,cloudBun:true});
 for(let preferred=550;preferred<levelWidth-700;preferred+=2200){const px=manholeSpot(preferred);if(px!==null)objects.push({type:'looseItem',item:'marshmallow',x:px,y:floorAtX(px)-34,w:34,h:34,delay:0,life:Infinity,cloudPower:true})}
}
function updateCloudPlatforms(){
 if(!isCloudWorld())return;
 for(const p of platforms){
  if(!p.cloudCookie)continue;
  if(p.broken>0){p.broken--;p.y=p.broken>0?WORLD_BOTTOM+300:p.moving?p.baseY+Math.sin(tick*.02+p.phase)*22:p.cloudHomeY;continue}
  const standing=player.onGround&&Math.abs(player.y+player.h-p.y)<6&&player.x+player.w>p.x&&player.x<p.x+p.w;
  p.crumbleFrames=standing?(p.crumbleFrames||0)+1:0;
  if(p.crumbleFrames>=45){
   for(let i=0;i<8;i++)particles.push({type:'rockDebris',x:p.x+i*p.w/8,y:p.y,vx:(Math.random()-.5)*3,vy:-2,r:3,life:30,maxLife:30,color:'#c8995f'});
   p.broken=240;p.crumbleFrames=0;p.y=WORLD_BOTTOM+300;
  }
 }
}
function drawCloudBackground(){
 const W=viewWidth,H=viewHeight;
 const sky=x.createLinearGradient(0,0,0,H);sky.addColorStop(0,cloudRain.active?'#87a6bd':'#67b7ef');sky.addColorStop(1,'#ddefff');x.fillStyle=sky;x.fillRect(0,-viewOffsetY,W,H+viewOffsetY);
 x.fillStyle='#fff1b9';x.beginPath();x.arc(855,92,38,0,Math.PI*2);x.fill();
 for(let layer=0;layer<3;layer++)for(let i=-1;i<Math.ceil(W/220)+2;i++){
  const px=i*220-(camera*(.08+layer*.07))%220,py=185+layer*145+Math.sin(i*2+layer)*28-cameraY*.1;
  x.fillStyle=['rgba(255,255,255,.45)','rgba(245,251,255,.65)','#edf7ff'][layer];
  x.beginPath();x.ellipse(px,py,110,28,0,0,Math.PI*2);x.ellipse(px-35,py-22,47,39,0,0,Math.PI*2);x.ellipse(px+32,py-28,55,43,0,0,Math.PI*2);x.fill();
 }
 // Tiny distant bakery houses on clouds, never physical obstacles.
 for(let i=0;i<Math.ceil(W/340)+1;i++){
  const px=i*340-(camera*.12)%340+70,py=315+(i%2)*45-cameraY*.08;
  x.fillStyle='#cfa877';x.strokeStyle='#957349';x.lineWidth=2;x.fillRect(px,py-60,68,60);x.strokeRect(px,py-60,68,60);
  x.fillStyle='#f5d7ad';x.beginPath();x.moveTo(px-8,py-59);x.quadraticCurveTo(px+34,py-116,px+76,py-59);x.closePath();x.fill();x.stroke();
  x.fillStyle='#8ac5dc';x.fillRect(px+12,py-44,15,19);x.fillRect(px+42,py-44,15,19);x.fillStyle='#8d674c';x.fillRect(px+28,py-21,15,21);
 }
}
function drawCloudProp(tree){
 const px=tree.hookX,py=tree.hookY;
 x.save();x.fillStyle='#f4fbff';x.strokeStyle='#9cbddc';x.lineWidth=2;
 x.beginPath();x.ellipse(px,py+16,48,16,0,0,Math.PI*2);x.ellipse(px-16,py+5,23,20,0,0,Math.PI*2);x.ellipse(px+15,py+2,26,22,0,0,Math.PI*2);x.fill();x.stroke();
 x.strokeStyle='#b48251';x.lineWidth=5;x.beginPath();x.moveTo(px-20,py-7);x.lineTo(px+20,py-7);x.stroke();
 x.strokeStyle='#f5cf73';x.lineWidth=3;x.beginPath();x.arc(px,py,6,0,Math.PI*2);x.stroke();x.restore();
}
function drawCloudSurface(left,right,surface){
 x.fillStyle='#f7fcff';x.fillRect(left,surface,right-left,12);x.fillStyle='#e2eefb';
 for(let px=Math.ceil(left/32)*32;px<right;px+=32){x.beginPath();x.ellipse(px,surface+11,22,12,0,0,Math.PI*2);x.fill()}
}
function drawCloudGap(gap){
 x.fillStyle='#add8f3';x.fillRect(gap.x,gap.y,gap.w,WORLD_BOTTOM-gap.y);
 x.fillStyle='#f1f8ff';for(const edge of [gap.x,gap.x+gap.w])for(let i=0;i<3;i++){x.beginPath();x.ellipse(edge,gap.y+9+i*15,12-i*2,11,0,0,Math.PI*2);x.fill()}
}
function drawCloudPlatform(p){
 if(!isCloudWorld())return false;
 if(p.broken>0)return true;
 x.save();x.strokeStyle='#9c764b';x.lineWidth=2;
 if(p.cloudCookie){
  x.fillStyle=p.crumbleFrames>25?'#c89659':'#ddb57b';x.fillRect(p.x,p.y,p.w,p.h);x.strokeRect(p.x,p.y,p.w,p.h);
  x.fillStyle='#725543';for(let i=0;i<5;i++){x.beginPath();x.arc(p.x+9+i*(p.w-18)/4,p.y+Math.min(p.h-3,7+(i%2)*5),2.5,0,Math.PI*2);x.fill()}
  if(p.crumbleFrames>15){x.beginPath();x.moveTo(p.x+p.w*.45,p.y);x.lineTo(p.x+p.w*.55,p.y+p.h*.4);x.lineTo(p.x+p.w*.4,p.y+p.h);x.stroke()}
 }else{
  x.fillStyle='#e7bd82';x.fillRect(p.x,p.y,p.w,p.h);x.strokeRect(p.x,p.y,p.w,p.h);
  x.fillStyle='#f9dca8';x.beginPath();x.ellipse(p.x+p.w/2,p.y+4,p.w/2,10,0,0,Math.PI*2);x.fill();x.stroke();
  x.strokeStyle='#c89556';for(let i=1;i<4;i++){x.beginPath();x.moveTo(p.x+i*p.w/4-4,p.y-1);x.lineTo(p.x+i*p.w/4+3,p.y+6);x.stroke()}
 }
 x.restore();return true;
}
function drawCloudObstacle(o){
 if(!isCloudWorld()||o.type==='spikes')return false;
 x.save();x.fillStyle='#d9ad74';x.strokeStyle='#8c6849';x.lineWidth=3;x.fillRect(o.x,o.y,o.w,o.h);x.strokeRect(o.x,o.y,o.w,o.h);
 for(let py=o.y+12;py<o.y+o.h;py+=20){x.beginPath();x.moveTo(o.x,py);x.lineTo(o.x+o.w,py);x.stroke()}
 x.fillStyle='#665042';for(let i=0;i<6;i++){x.beginPath();x.arc(o.x+12+(i%3)*(o.w-24)/2,o.y+8+Math.floor(i/3)*22,3,0,Math.PI*2);x.fill()}x.restore();return true;
}
function fireCroissantBolts(b){
 const count=boss.phase===2?3:1,px=b.x+b.w/2,py=b.y+b.h/2,angle=Math.atan2(player.y+28-py,player.x+player.w/2-px);
 for(let i=0;i<count;i++){const a=angle+(i-(count-1)/2)*.18;objects.push({type:'stormBolt',x:px,y:py,w:20,h:28,vx:Math.cos(a)*4.2,vy:Math.sin(a)*4.2,life:200,damage:2})}
 b.swoop=45;b.swoopTarget=Math.max(180,Math.min(W-b.w-20,player.x-b.w/2));b.attack=boss.phase===2?105:165;playSound('fire');
}
function drawCroissantBolt(o){
 x.save();x.fillStyle='#fff0a2';x.strokeStyle='#9771b1';x.lineWidth=2;x.beginPath();x.moveTo(o.x+12,o.y);x.lineTo(o.x+2,o.y+16);x.lineTo(o.x+10,o.y+16);x.lineTo(o.x+7,o.y+28);x.lineTo(o.x+19,o.y+10);x.lineTo(o.x+12,o.y+10);x.closePath();x.fill();x.stroke();x.restore();
}
