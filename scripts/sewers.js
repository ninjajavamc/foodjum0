let undergroundTrip=null;
function manholeSpot(preferred){
 for(let offset=0;offset<850;offset+=25){const px=preferred+offset,base=baseFloorAtX(px);
  if(px+100>levelWidth-300||baseFloorAtX(px+70)!==base||[...lavaPits,...cliffs].some(g=>px+85>g.x&&px-15<g.x+g.w)||solidTerrain().some(o=>px+100>o.x&&px-65<o.x+o.w)||secretPassages.some(r=>px+75>r.x&&px<r.x+r.w))continue;
  return px;
 }
 return null;
}
function generateManholes(){
 for(let preferred=2000;preferred<levelWidth-2400;preferred+=6200){
  const entrance=manholeSpot(preferred);if(entrance===null)continue;
  const exit=manholeSpot(entrance+1150+Math.floor(Math.random()*250));if(exit===null)continue;
  if(objects.some(o=>o.type==='greatWall'&&o.x>entrance&&o.x<exit))continue;
  objects.push({type:'manhole',x:entrance,y:baseFloorAtX(entrance)-10,w:70,h:12,exitX:exit,visited:false});
  objects.push({type:'manholeOutlet',x:exit,y:baseFloorAtX(exit)-10,w:70,h:12});
 }
}
function nearbyManhole(){
 if(screen!=='play')return null;
 return objects.find(o=>o.type===(undergroundTrip?'sewerExit':'manhole')&&Math.abs(player.x+player.w/2-o.x-o.w/2)<80&&Math.abs(player.y+player.h-o.y)<(undergroundTrip?35:95));
}
function interactWorld(){
 if(screen!=='play'||player.trappedIn)return;
 if(player.seatedCatapult){interactCatapult();return}
 if(nearBossDoor()){openBossDoor();return}
 if(player.climbing||nearbyLadder())return;
 if(useSecretExit())return;
 if(interactTutorial())return;
 const hatch=nearbyManhole();if(hatch){if(undergroundTrip)exitSewer();else enterSewer(hatch);return}
 if(nearbyCatapult())interactCatapult();
}
function enterSewer(hatch){
 if(screen!=='play'||boss||undergroundTrip)return;
 undergroundTrip={exitX:hatch.exitX,theme:worldSettings().theme,styleSeed:Math.floor(Math.random()*10000),saved:{levelWidth,doorX,camera,cameraY,objects,enemies,particles,defeated,secretPassages,lavaPits:[...lavaPits],cliffs:[...cliffs],obstacles:[...obstacles],platforms:[...platforms],trees:[...trees],hooks:[...hooks],terraces:[...terraces]}};
 hatch.visited=true;for(const list of [lavaPits,cliffs,obstacles,platforms,trees,hooks,terraces])list.length=0;
 levelWidth=1800;doorX=levelWidth-120;camera=0;cameraY=0;secretPassages=[];particles=[];defeated=[];mandarinBabies=[];objects=[];
 const shift=(level%3)*45,jitter=Math.floor(Math.random()*35),rise=level===5?110:level===4?95:62;
 const obstacleTypes={training:['crate','rock'],forest:['crate','rock'],crystal:['crystalObstacle','crystalObstacle'],kitchen:['pipeBlock','kitchenCan'],frost:['iceBlock','waffleStack'],moon:['satelliteCrate','moonBoulder'],water:['reefBlock','anchorBlock']}[undergroundTrip.theme];
 obstacles.push({type:obstacleTypes[0],x:475+shift+jitter,y:ground-rise,w:70,h:rise},{type:obstacleTypes[1],x:1010-shift,y:ground-90,w:85,h:90});
 platforms.push({x:1180+shift,y:ground-(level===2?145:level===5?180:115),w:95,h:20});
 enemies=[{type:'moldCheese',x:370,hp:3},{type:'donut',x:710,hp:2},{type:'donut',x:1090,hp:2},{type:'moldCheese',x:1360,hp:3}].map(e=>({...e,y:ground-42,w:42,h:42,damage:1,vx:0,vy:0,shoot:100,dead:0,slow:0,onGround:true}));
 objects.push({type:'material',material:'wood',quantity:2,x:820,y:ground-40,w:36,h:36},{type:'material',material:'stone',quantity:2,x:880,y:ground-40,w:36,h:36},{type:'looseItem',item:'mushroom',x:1410,y:ground-34,w:34,h:34,delay:0,life:Infinity},{type:'sewerLadder',x:1600,y:ground-260,w:42,h:260},{type:'sewerExit',x:1586,y:ground-270,w:70,h:12});
 if(level>=4)enemies.push({type:'pudding',x:1280,y:ground-46,w:58,h:46,hp:3,damage:0,vx:0,vy:0,shoot:1000,dead:0,slow:0});
 if(level>=4)enemies.push({type:'taco',x:935,y:ground-42,w:52,h:42,hp:2,damage:1,vx:0,vy:0,shoot:130,dead:0,slow:0});
 if(level>=5)enemies.push({type:'maki',x:1470,y:ground-58,w:48,h:58,hp:2,damage:1,vx:0,vy:0,shoot:1000,dead:0,slow:0});
 if(isSwimming())for(const e of enemies){e.y-=100;e.onGround=false}
 resetTraversalPosition(150,ground);if(isSwimming()){player.y-=90;player.onGround=false}resetCompanion();keys={};heldPointers.clear();playSound('menu');message='KANAL · Schimmelkäse & Donuts · Leiter am Ende';
}
function resetTraversalPosition(px,surface){
 player.trappedIn=null;player.escapeJumps=0;player.puddingImmunity=45;player.x=px;player.y=surface-player.h;player.vx=0;player.vy=0;player.onGround=true;player.swing=null;player.climbing=null;player.seatedCatapult=null;player.launchFrames=0;player.ladderDetach=0;player.bubble=0;player.inv=Math.max(player.inv,90);
}
function exitSewer(){
 if(!undergroundTrip)return;
 const trip=undergroundTrip,saved=trip.saved;undergroundTrip=null;
 for(const name of ['lavaPits','cliffs','obstacles','platforms','trees','hooks','terraces']){const list={lavaPits,cliffs,obstacles,platforms,trees,hooks,terraces}[name];list.splice(0,list.length,...saved[name])}
 levelWidth=saved.levelWidth;doorX=saved.doorX;objects=saved.objects;enemies=saved.enemies;particles=saved.particles;defeated=saved.defeated;secretPassages=saved.secretPassages;mandarinBabies=[];
 resetTraversalPosition(trip.exitX+14,floorAtX(trip.exitX+35));camera=Math.max(0,Math.min(levelWidth-W,player.x-W*.35));cameraY=floorAtX(player.x+player.w/2)-ground;resetCompanion();keys={};heldPointers.clear();playSound('menu');message='Wieder draußen! Dieser Gully liegt weiter vorne im Level.';
}
function drawManhole(o){
 x.save();x.translate(o.x,o.y);x.fillStyle='#3d5158';x.strokeStyle='#a0b7b7';x.lineWidth=3;x.beginPath();x.ellipse(o.w/2,6,o.w/2,9,0,0,Math.PI*2);x.fill();x.stroke();x.strokeStyle='#718c93';x.lineWidth=2;
 for(let px=14;px<o.w-5;px+=10){x.beginPath();x.moveTo(px,1);x.lineTo(px,11);x.stroke()}
 x.fillStyle='#c5d3be';for(const px of [8,o.w-8]){x.beginPath();x.arc(px,6,2,0,Math.PI*2);x.fill()}
 if(o.type==='manhole'){const cx=o.w/2;x.fillStyle='#ffe29a';x.strokeStyle='#3b515e';x.lineWidth=2.5;x.beginPath();x.moveTo(cx-5,-113);x.lineTo(cx+5,-113);x.lineTo(cx+5,-88);x.lineTo(cx+15,-88);x.lineTo(cx,-70);x.lineTo(cx-15,-88);x.lineTo(cx-5,-88);x.closePath();x.fill();x.stroke()}
 x.textAlign='center';x.font='bold 13px system-ui';x.fillStyle=undergroundTrip?'#e5efb0':'#24464c';
 if(showGameplayHints()&&o.type==='sewerExit')x.fillText('AUSGANG · Leiter hoch!',o.w/2,-20);
 else if(showGameplayHints()&&o.type==='manhole'&&Math.abs(player.x-o.x)<200)x.fillText('W: In den Kanal',o.w/2,-126);
 x.restore();
}
function drawSewerObstacle(o){
 if(['reefBlock','anchorBlock'].includes(o.type)){drawWaterObstacle(o);return true}
 if(!['crystalObstacle','pipeBlock','kitchenCan','iceBlock','waffleStack','satelliteCrate','moonBoulder'].includes(o.type))return false;
 x.save();x.translate(o.x,o.y);x.lineWidth=3;x.strokeStyle='#536c84';
 if(o.type==='moonBoulder'){x.fillStyle='#a7b3c2';x.beginPath();x.ellipse(o.w/2,o.h/2,o.w/2,o.h/2,0,0,Math.PI*2);x.fill();x.stroke();x.fillStyle='#75889c';for(let i=0;i<4;i++){x.beginPath();x.ellipse(15+(i%2)*40,20+Math.floor(i/2)*40,9,7,.2,0,Math.PI*2);x.fill()}}
 else if(o.type==='crystalObstacle'){x.fillStyle='#ab8dde';for(let i=0;i<3;i++){const px=i*o.w/3;x.beginPath();x.moveTo(px,o.h);x.lineTo(px,18);x.lineTo(px+o.w/6,i===1?0:8);x.lineTo(px+o.w/3,18);x.lineTo(px+o.w/3,o.h);x.closePath();x.fill();x.stroke();x.strokeStyle='#e5cdf9';x.beginPath();x.moveTo(px+o.w/6,10);x.lineTo(px+o.w/6,o.h-5);x.stroke();x.strokeStyle='#536c84'}}
 else{
  x.fillStyle=o.type==='iceBlock'?'#b6e7f4':o.type==='waffleStack'?'#d9b786':o.type==='kitchenCan'?'#f0e2c7':'#a3b9c8';x.fillRect(0,0,o.w,o.h);x.strokeRect(0,0,o.w,o.h);
  if(o.type==='iceBlock'){x.strokeStyle='#f4fdff';x.beginPath();x.moveTo(12,6);x.lineTo(o.w-14,o.h-9);x.moveTo(o.w-8,15);x.lineTo(12,o.h-18);x.stroke();x.fillStyle='#fff';x.fillRect(0,0,o.w,8)}
  if(o.type==='waffleStack'){x.strokeStyle='#a48657';for(let n=15;n<o.h;n+=18){x.beginPath();x.moveTo(0,n);x.lineTo(o.w,n);x.stroke()}for(let n=12;n<o.w;n+=18){x.beginPath();x.moveTo(n,0);x.lineTo(n,o.h);x.stroke()}x.fillStyle='#f5d7e3';x.fillRect(0,0,o.w,12)}
  if(o.type==='pipeBlock'){x.strokeStyle='#e4f0f4';x.lineWidth=9;x.beginPath();x.moveTo(12,o.h-10);x.lineTo(12,15);x.lineTo(o.w-12,15);x.lineTo(o.w-12,o.h-10);x.stroke()}
  if(o.type==='kitchenCan'){x.fillStyle='#87b4b7';x.fillRect(10,25,o.w-20,35);x.strokeStyle='#eee';x.beginPath();x.moveTo(5,9);x.lineTo(o.w-5,9);x.stroke()}
  if(o.type==='satelliteCrate'){x.fillStyle='#294b68';x.fillRect(10,14,o.w-20,o.h-28);x.strokeStyle='#92c7df';for(let n=20;n<o.h-10;n+=20){x.beginPath();x.moveTo(10,n);x.lineTo(o.w-10,n);x.stroke()}x.beginPath();x.moveTo(o.w/2,14);x.lineTo(o.w/2,o.h-14);x.stroke()}
 }
 x.restore();return true;
}
function drawSewerBackground(){
 const theme=undergroundTrip.theme,seed=undergroundTrip.styleSeed,colors={training:['#172936','#526b69','#425b60','#344b54'],forest:['#172936','#526b69','#425b60','#344b54'],crystal:['#251c43','#75618c','#695887','#483e63'],kitchen:['#293340','#727c83','#69757c','#505e68'],frost:['#142e4c','#698fa9','#749ab0','#486b8e'],moon:['#142538','#536b7e','#586e7d','#324956'],water:['#12344c','#337b91','#3d7d8c','#235265']}[theme];
 if(theme==='water'){drawWaterBackground();x.fillStyle='rgba(8,37,64,.22)';x.fillRect(0,0,W,H);return}
 const shade=x.createLinearGradient(0,0,0,H);shade.addColorStop(0,colors[0]);shade.addColorStop(1,colors[1]);x.fillStyle=shade;x.fillRect(0,0,W,H);
 for(let row=0;row<12;row++)for(let col=-1;col<22;col++){const px=col*58-(camera*.15)%58-(row%2)*29,py=60+row*38;x.fillStyle=(col+row+seed)%3===0?colors[2]:colors[3];x.fillRect(px,py,55,34)}
 x.strokeStyle='#294047';x.lineWidth=24;x.beginPath();x.moveTo(0,115);x.lineTo(W,115);x.stroke();x.strokeStyle=theme==='kitchen'?'#b7c8cf':theme==='frost'?'#b9e5f4':theme==='crystal'?'#a38abd':'#728f87';x.lineWidth=14;x.stroke();
 if(theme==='crystal'||theme==='frost')for(let i=0;i<14;i++){const px=i*85-(camera*.2)%85;x.fillStyle=theme==='crystal'?'#aa8bda':'#d6f4ff';x.beginPath();x.moveTo(px,0);x.lineTo(px+12,45+(i%3)*12);x.lineTo(px+25,0);x.fill()}
 if(theme==='kitchen')for(let i=0;i<8;i++){x.strokeStyle='#b1bec4';x.lineWidth=7;x.beginPath();x.moveTo(i*145-(camera*.2)%145,115);x.lineTo(i*145-(camera*.2)%145,290);x.stroke()}
 if(theme==='moon')for(let i=0;i<9;i++){x.fillStyle='#8294a2';x.beginPath();x.ellipse(i*130-(camera*.2)%130,350+(i%2)*45,30,15,0,0,Math.PI*2);x.fill()}
 for(let i=0;i<6;i++){const px=i*225-(camera*.3)%225;x.fillStyle='#c6c68a';x.fillRect(px,83,5,63);x.fillStyle='rgba(211,237,176,.07)';x.beginPath();x.arc(px,172,58,0,Math.PI*2);x.fill();x.fillStyle='#cfdd9b';x.fillRect(px-9,150,24,10)}
}
