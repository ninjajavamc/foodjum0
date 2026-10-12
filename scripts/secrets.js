let secretPassages=[];
function generateSecretPassages(){
 secretPassages=[];const rotation=Math.floor(Math.random()*3);
 for(let section=5;section*600+750<levelWidth-350;section+=3){
  const width=260,start=section*600+400+Math.floor(Math.random()*10);let left;
  for(let shift=0;shift<=230;shift+=10){const candidate=start+shift;if(floorAtX(candidate+width)===floorAtX(candidate)&&![...lavaPits,...cliffs].some(g=>candidate<g.x+g.w&&candidate+width>g.x)&&!objects.some(o=>['cola','key'].includes(o.type)&&candidate<o.x+o.w+5&&candidate+width>o.x-5)){left=candidate;break}}
  if(left===undefined)continue;
  const base=floorAtX(left),wall={type:'secretWall',x:left,y:base-85,w:62,h:85,life:Infinity};
  secretPassages.push({x:left,w:width,base,open:false,wall,kind:['loot','shortcut','gully'][(secretPassages.length+rotation)%3]});objects.push(wall);
  for(const list of [obstacles,platforms])for(let i=list.length-1;i>=0;i--)if(list[i].x+list[i].w>left-100&&list[i].x<left+80)list.splice(i,1);
  for(const bottle of objects.filter(o=>o.type==='cola'&&o.x+o.w>left-100&&o.x<left+80)){const old=bottle.x;bottle.x=-1000;const safe=safeColaX(left+width+180,bottle.w);bottle.x=safe??old;bottle.y=floorAtX(bottle.x+bottle.w/2)-bottle.h}
 }
}
function secretDestination(room){
 const wall=objects.filter(o=>o.type==='greatWall'&&o.x>room.x).sort((a,b)=>a.x-b.x)[0],key=objects.find(o=>o.type==='key'&&!o.collected&&o.x>room.x+room.w);
 const limit=Math.min(levelWidth-400,wall?wall.x-160:Infinity,key?key.x-80:Infinity);
 for(const preferred of [room.exitX??room.x+room.w+260,room.x+room.w+45]){const px=manholeSpot(preferred);if(px!==null&&px<=limit)return px}
 return room.x+90;
}
function openSecretPassages(px,py,radius){
 if(selected!==4||boss)return;
 for(const room of secretPassages){
  if(room.open||Math.hypot(room.wall.x+room.wall.w/2-px,room.wall.y+room.wall.h/2-py)>radius+20)continue;
  room.open=true;room.wall.life=0;
  for(let i=0;i<14;i++)particles.push({type:'rockDebris',x:room.x+Math.random()*60,y:room.base-70+Math.random()*60,vx:(Math.random()-.5)*7,vy:-2-Math.random()*5,r:3+Math.random()*4,life:45,maxLife:45,color:'#b7ad8e'});
  let kind=room.kind||'loot';const destination=kind==='loot'?null:secretDestination(room);
  if(kind==='shortcut'&&destination<=room.x+room.w){kind='gully';room.kind=kind}
  if(kind==='loot'){
   for(const [i,material] of ['stone','wood','spoon'].entries())objects.push({type:'material',material,quantity:3,x:room.x+85+i*50,y:room.base+63,w:36,h:36,life:Infinity});
   objects.push({type:'looseItem',item:'mushroom',x:room.x+room.w-40,y:room.base+62,w:34,h:34,vx:0,vy:0,delay:0,life:Infinity});
  }else if(kind==='shortcut')objects.push({type:'secretExit',x:room.x+room.w-70,y:room.base+45,w:45,h:60,exitX:destination});
  else objects.push({type:'manhole',x:room.x+95,y:room.base+95,w:70,h:12,exitX:destination,hidden:true,visited:false});
  message=kind==='loot'?'Geheimgang mit Bonus-Materialien!':kind==='shortcut'?'Versteckte Abkürzung!':'Ein geheimer Gully!';playSound('explosion');
 }
}
function nearbySecretExit(){return screen==='play'&&!boss&&!undergroundTrip?objects.find(o=>o.type==='secretExit'&&Math.abs(player.x+player.w/2-o.x-o.w/2)<65&&Math.abs(player.y+player.h-(o.y+o.h))<65):null}
function useSecretExit(){
 const exit=nearbySecretExit();if(!exit)return false;
 resetTraversalPosition(exit.exitX,floorAtX(exit.exitX));resetCompanion(true);camera=cameraTargetX(player.x);cameraY=floorAtX(player.x)-ground;keys={};heldPointers.clear();playSound('menu');return true;
}
function drawSecretExit(o){x.save();x.fillStyle='#8fb4b6';x.strokeStyle='#3b6676';x.lineWidth=3;x.fillRect(o.x,o.y,o.w,o.h);x.strokeRect(o.x,o.y,o.w,o.h);x.fillStyle='#fff0b8';x.font='bold 26px system-ui';x.textAlign='center';x.fillText('→',o.x+o.w/2,o.y+38);if(showGameplayHints()){x.font='14px system-ui';x.fillText('W: Abkürzung',o.x+o.w/2,o.y-12)}x.restore()}
function drawSecretPassages(){
 if(boss)return;
 for(const room of secretPassages){
  if(room.x+room.w<camera-100||room.x>camera+viewWidth+100)continue;
  if(!room.open){sprite('secret-wall',room.wall.x-6,room.wall.y-8,room.wall.w+12,room.wall.h+12);continue}
  x.save();const shade=x.createLinearGradient(0,room.base-10,0,room.base+105);shade.addColorStop(0,'#4c4845');shade.addColorStop(1,'#776657');x.fillStyle=shade;x.fillRect(room.x,room.base-12,room.w,117);
  x.strokeStyle='#b29d7d';x.lineWidth=5;x.beginPath();x.moveTo(room.x,room.base);x.lineTo(room.x,room.base+105);x.lineTo(room.x+room.w,room.base+105);x.lineTo(room.x+room.w,room.base);x.stroke();
  x.fillStyle='#baa47e';for(let px=room.x+12;px<room.x+room.w;px+=25)x.fillRect(px,room.base+107,13,4);
  x.fillStyle=worldSettings().theme==='crystal'?'#f5daa0':worldSettings().theme==='kitchen'||worldSettings().theme==='frost'?'#fff':worldSettings().theme==='moon'?'#aab8c6':'#6da353';x.fillRect(room.x+75,room.base-12,room.w-75,9);x.fillStyle='#c1a272';x.fillRect(room.x+75,room.base-3,room.w-75,6);
  if(showGameplayHints()){x.fillStyle='#ffe6aa';x.textAlign='center';x.font='bold 13px system-ui';x.fillText('GEHEIMGANG',room.x+room.w/2,room.base+25)}x.restore();
 }
}
