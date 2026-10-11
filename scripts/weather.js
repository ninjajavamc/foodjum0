// Heavy localized cheese downpour: 30 pieces/second; first at 30 s, dry gaps 30–45 s.
let kitchenWeather={};
let worldWind={};
function resetKitchenWeather(){kitchenWeather={time:0,nextAt:1800,active:false,x:0,w:360,remaining:0,spawnIn:0,practice:false};worldWind={time:0,nextAt:5400,active:false,remaining:0,practice:false}}
function startWorldWind(practice=false){worldWind.active=true;worldWind.remaining=300;worldWind.practice=practice;worldWind.nextAt=worldWind.time+5400}
function updateWorldWind(){
 if(screen!=='play'||boss||undergroundTrip||(level<3&&!(isTutorial()&&worldWind.practice)))return;
 worldWind.time++;
 if(worldWind.active){worldWind.remaining--;if(worldWind.remaining<=0){worldWind.active=false;worldWind.practice=false}}
 if(!worldWind.active&&worldWind.time>=worldWind.nextAt)startWorldWind();
}
function windAffectsPlayer(){return worldWind.active&&!boss&&!undergroundTrip&&!player.swing&&!player.climbing&&!player.seatedCatapult&&!player.trappedIn}
function windMovement(vx){return windAffectsPlayer()?vx*.55-(player.marshmallowTime>0?3.2:.4):vx}
function applyMarshmallowWindLift(){
 if(windAffectsPlayer()&&player.marshmallowTime>0&&!isSwimming()&&player.bubble<=0){player.vy=Math.min(player.vy,-.4);player.onGround=false;player.gliding=false}
}
function drawWorldWind(){
 if(!worldWind.active||boss||undergroundTrip)return;
 x.save();x.strokeStyle=worldSettings().theme==='kitchen'?'#7297ab':'#dbeef1';x.lineWidth=2;x.globalAlpha=.45;
 for(let i=0;i<10;i++){const px=((i*157-tick*8)%W+W)%W,py=130+(i*73)%330;x.beginPath();x.moveTo(px,py);x.lineTo(px+48,py);x.quadraticCurveTo(px+65,py,px+59,py-7);x.stroke()}
 x.globalAlpha=1;x.fillStyle='rgba(16,45,62,.78)';x.fillRect(W/2-75,103,150,30);x.fillStyle='#f1f5ed';x.font='bold 16px system-ui';x.textAlign='center';x.fillText('WIND · '+Math.ceil(worldWind.remaining/60)+' s',W/2,125);x.restore();
}
function startCheeseShower(left,practice=false){
 kitchenWeather.active=true;kitchenWeather.x=Math.max(100,Math.min(levelWidth-500,left));kitchenWeather.remaining=600;kitchenWeather.spawnIn=0;kitchenWeather.practice=practice;
 kitchenWeather.nextAt=kitchenWeather.time+600+1800+Math.floor(Math.random()*900);
}
function updateKitchenWeather(){
 if(screen!=='play'||boss||undergroundTrip||(level!==3&&!(isTutorial()&&kitchenWeather.practice)))return;
 kitchenWeather.time++;
 if(!kitchenWeather.active&&kitchenWeather.time>=kitchenWeather.nextAt)startCheeseShower(player.x-120+Math.random()*180);
 if(!kitchenWeather.active)return;
 kitchenWeather.remaining--;kitchenWeather.spawnIn--;
 if(kitchenWeather.spawnIn<=0){const px=kitchenWeather.x+Math.random()*(kitchenWeather.w-14);objects.push({type:'cheeseDrop',x:px,y:floorAtX(px)-285,w:14,h:14,vx:0,vy:2.4,life:150});kitchenWeather.spawnIn=2}
 if(kitchenWeather.remaining<=0){kitchenWeather.active=false;kitchenWeather.practice=false}
}
function updateCheeseDrop(o){
 o.vy+=.18;o.y+=o.vy;o.life--;
 if(rect(player,o)){hitPlayer(.2,0,30);o.life=0}
 if(o.y+o.h>=floorAtX(o.x+o.w/2))o.life=0;
}
function drawCheeseDrop(o){
 x.save();x.fillStyle='#f5d569';x.strokeStyle='#b68c41';x.lineWidth=1.5;x.beginPath();x.moveTo(o.x,o.y+o.h);x.lineTo(o.x+3,o.y);x.lineTo(o.x+o.w,o.y+4);x.lineTo(o.x+o.w,o.y+o.h);x.closePath();x.fill();x.stroke();x.fillStyle='#ccaa4d';for(const [dx,dy] of [[5,5],[10,10]]){x.beginPath();x.arc(o.x+dx,o.y+dy,2,0,Math.PI*2);x.fill()}x.restore();
}
function drawKitchenWeather(){
 if(!kitchenWeather.active||boss||undergroundTrip)return;
 const cx=kitchenWeather.x+kitchenWeather.w/2,cy=floorAtX(cx)-320;x.save();x.fillStyle='rgba(230,225,176,.8)';
 for(let i=0;i<5;i++){x.beginPath();x.ellipse(cx-125+i*62,cy+Math.sin(i)*8,65,24,0,0,Math.PI*2);x.fill()}x.restore();
}
