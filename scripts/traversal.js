// Tall construction challenges, rideable catapults, ladders and enemy terrain physics.
function solidTerrain(includePlatforms=false){
 return [...obstacles.filter(o=>o.type!=='spikes'),...(includePlatforms?platforms:[]),...objects.filter(o=>['cola','stonewall','greatWall','secretWall'].includes(o.type)&&(o.life===undefined||o.life>0))];
}
function generateGreatWalls(){
 let count=0;
 for(let preferred=4800;preferred<levelWidth-2800;preferred+=5800){
  if(count>0&&Math.random()>.7)continue;
  let left;
  for(let shift=0;shift<3000;shift+=40){
   const px=preferred+shift,base=baseFloorAtX(px);
   if(px+500>=levelWidth-1600||base<ground||baseFloorAtX(px-300)!==base||baseFloorAtX(px+430)!==base)continue;
   if(secretPassages.some(r=>px+400>r.x&&px-320<r.x+r.w))continue;
   left=px;break;
  }
  if(left===undefined)continue;
  const w=140,h=380+Math.floor(Math.random()*35),base=baseFloorAtX(left),start=left-300,end=left+w+230;
  for(const list of [lavaPits,cliffs,obstacles,platforms])for(let i=list.length-1;i>=0;i--)if(list[i].x+list[i].w>start&&list[i].x<end)list.splice(i,1);
  for(let i=hooks.length-1;i>=0;i--)if(hooks[i].x>left-400&&hooks[i].x<left+w+400)hooks.splice(i,1);
  for(const o of objects)if(o.x+o.w>left-55&&o.x<left+w+55&&o.type!=='cola'){o.x=left-250;o.y=base-o.h}
  for(const e of enemies)if(e.x+e.w>left-50&&e.x<left+w+70){e.x=left+w+170;e.y=base-e.h}
  objects.push({type:'greatWall',x:left,y:base-h,w,h});
  for(const bottle of objects.filter(o=>o.type==='cola'&&o.x+o.w>start&&o.x<end)){const old=bottle.x;bottle.x=-1000;const safe=safeColaX(end+140,bottle.w);bottle.x=safe??old;bottle.y=floorAtX(bottle.x+bottle.w/2)-bottle.h}
  for(const [i,[material,quantity]] of [['wood',5],['spoon',2],['stone',2]].entries())objects.push({type:'material',material,quantity,x:left-260+i*52,y:base-40,w:36,h:36,constructionSupply:true});
  count++;
 }
}
function nearbyGreatWall(range=260){
 return objects.filter(o=>o.type==='greatWall'&&Math.abs(player.x+player.w/2-(o.x+o.w/2))<range+o.w/2).sort((a,b)=>Math.abs(a.x-player.x)-Math.abs(b.x-player.x))[0];
}
function placeLadder(){
 const wall=nearbyGreatWall(),w=42,onLeft=wall&&player.x+player.w/2<wall.x+wall.w/2;
 const positions=[...(wall?[onLeft?wall.x-44:wall.x+wall.w+2]:[]),player.x+player.facing*60,player.x-player.facing*77,player.x];
 for(const pos of positions){
  if(pos<0||pos+w>levelWidth)continue;
  const supports=solidTerrain(true).filter(o=>pos>=o.x&&pos+w<=o.x+o.w&&o.y>=player.y+player.h-12).sort((a,b)=>a.y-b.y);
  const support=supports[0];let base=support?.y;
  if(base===undefined){if(floorAtX(pos+1)!==floorAtX(pos+w-1)||[...lavaPits,...cliffs].some(g=>pos+w>g.x&&pos<g.x+g.w))continue;base=floorAtX(pos+w/2)}
  const attached=wall&&pos===(onLeft?wall.x-44:wall.x+wall.w+2)&&base===wall.y+wall.h;
  const h=attached?wall.h+28:300,body={x:pos,y:base-h,w,h};
  if(solidTerrain().some(o=>o!==support&&rect(body,o))||objects.some(o=>['ladder','catapult'].includes(o.type)&&rect(body,o))||obstacles.some(o=>o.type==='spikes'&&rect(body,o)))continue;
  objects.push({type:'ladder',...body,wall:attached?wall:null,onLeft:!!onLeft,support:support?.moving?support:null,supportOffset:pos-(support?.x||0)});
  message='Leiter gebaut! W / ↑ hoch · S / ↓ herunter · Space abspringen.';return true;
 }
 message='Hier ist kein freier, tragfähiger Platz für die Leiter.';return false;
}
function updatePlacedLadders(){
 for(const ladder of objects.filter(o=>o.type==='ladder'&&o.support&&platforms.includes(o.support))){
  const change=ladder.support.y-ladder.y-ladder.h;ladder.x=ladder.support.x+ladder.supportOffset;ladder.y+=change;
  for(const p of onlinePlayers())if(p.climbing===ladder)p.y+=change;
 }
}
function nearbyLadder(){
 return objects.find(o=>['ladder','sewerLadder'].includes(o.type)&&Math.abs(player.x+player.w/2-o.x-o.w/2)<65&&player.y+player.h>=o.y-5&&player.y<=o.y+o.h+10);
}
function nearbyCatapult(){
 if(player.seatedCatapult)return player.seatedCatapult;
 return objects.filter(o=>o.type==='catapult'&&Math.abs(player.x+player.w/2-o.x-o.w/2)<110&&Math.abs(player.y+player.h-(o.y+o.h))<105).sort((a,b)=>Math.abs(a.x-player.x)-Math.abs(b.x-player.x))[0];
}
function interactCatapult(){
 if(screen!=='play')return;
 if(player.seatedCatapult){
  const o=player.seatedCatapult,direction=player.facing,gravity=worldGravity(),speed=26*Math.sqrt(gravity/.58),base=o.y+o.h;
  const wall=objects.filter(w=>w.type==='greatWall'&&(w.x+w.w/2-(o.x+o.w/2))*direction>0&&Math.abs(w.x-(o.x+o.w/2))<500).sort((a,b)=>Math.abs(a.x-o.x)-Math.abs(b.x-o.x))[0];
  const target=wall?(direction>0?wall.x+wall.w+110:wall.x-110-player.w):player.x+direction*630;
  const time=(speed+Math.sqrt(speed*speed+2*gravity*(base-player.y-player.h)))/gravity;
  player.launchVX=direction*Math.max(2.8,Math.min(7,Math.abs(target-player.x)/time));player.vx=player.launchVX;player.vy=-speed;player.launchFrames=Math.max(150,Math.ceil(time)+15);player.onGround=false;player.seatedCatapult=null;player.inv=Math.max(player.inv,100);o.animation=25;o.cooldown=Math.max(o.cooldown,60);playSound('special');message='Abgeschossen! Du fliegst über die Mauer.';return;
 }
 const o=nearbyCatapult();if(!o){message='Gehe näher an dein Katapult und drücke W.';return}
 player.seatedCatapult=o;player.climbing=null;player.swing=null;player.bubble=0;player.launchFrames=0;player.vx=0;player.vy=0;anchorCatapultPlayer(o);playSound('menu');message='Im Katapult: A/D zielen · W abschießen · Space aussteigen.';
}
function anchorCatapultPlayer(o){player.x=o.x+44-player.w/2;player.y=o.y+10-player.h;player.onGround=false}
function updateTraversal(move){
 const p=player;p.ladderDetach=Math.max(0,(p.ladderDetach||0)-1);
 if(p.seatedCatapult){if(!objects.includes(p.seatedCatapult)){p.seatedCatapult=null;return false}anchorCatapultPlayer(p.seatedCatapult);p.vx=0;p.vy=0;return true}
 const up=keys.w||keys.ArrowUp||keys.touchUp,down=keys.s||keys.ArrowDown||keys.touchDown;
 if(p.climbing&&move){p.climbing=null;return false}
 if(!p.climbing&&!move&&!p.ladderDetach&&(up||down)){const ladder=nearbyLadder();if(ladder&&(down||ladder.type==='sewerLadder'||!ladder.wall||p.y+p.h>ladder.wall.y+8)){p.climbing=ladder;p.swing=null;p.bubble=0;p.launchFrames=0}}
 if(p.climbing){
  const ladder=p.climbing;if(!objects.includes(ladder)){p.climbing=null;return false}
  p.x=ladder.x+(ladder.w-p.w)/2;p.vx=0;p.vy=0;p.onGround=false;const movement=(down?1:0)-(up?1:0);p.y+=movement*3.2;if(movement)p.walkPhase+=.18;
  if(ladder.type==='sewerLadder'&&up&&p.y+p.h<=ladder.y+8){exitSewer();return true}
  if(ladder.type==='ladder'&&!ladder.wall)p.y=Math.max(ladder.y-p.h,p.y);
  if(ladder.wall&&up&&p.y+p.h<=ladder.wall.y+4){p.y=ladder.wall.y-p.h;p.x=ladder.onLeft?ladder.wall.x+8:ladder.wall.x+ladder.wall.w-p.w-8;p.onGround=true;p.climbing=null}
  else if(p.y+p.h>=ladder.y+ladder.h){p.y=ladder.y+ladder.h-p.h;p.onGround=true;p.climbing=null}
  return true;
 }
 if(p.launchFrames>0){p.launchFrames--;p.vx=p.launchVX}
 return false;
}
function enemyObstacleAhead(e,direction){
 const front=direction>0?e.x+e.w:e.x;
 return [...solidTerrain(true),...obstacles.filter(o=>o.type==='spikes')].find(o=>o.y<e.y+e.h-5&&o.y+o.h>e.y&& (direction>0?front<=o.x+2&&o.x-front<28:front>=o.x+o.w-2&&front-o.x-o.w<28));
}
function collideEnemyTerrain(e,previousX,previousY){
 e.onGround=Math.abs(e.y+e.h-floorAtX(e.x+e.w/2))<2&&e.vy===0;
 const previousBottom=previousY+e.h;
 for(const o of solidTerrain(true)){
  if(!rect(e,o))continue;
  if(e.vy>=0&&previousBottom<=o.y+4){e.y=o.y-e.h;e.vy=0;e.onGround=true;e.jumpDir=0}
  else if(e.vy<0&&previousY>=o.y+o.h-3){e.y=o.y+o.h;e.vy=0}
  else if(previousX+e.w<=o.x+4)e.x=o.x-e.w;
  else if(previousX>=o.x+o.w-4)e.x=o.x+o.w;
  else e.x=previousX+e.w/2<o.x+o.w/2?o.x-e.w:o.x+o.w;
 }
}
function canStomp(target,previousBottom,previousTargetY=target.y){
 const foot=player.y+player.h,relativeDown=foot-previousBottom-(target.y-previousTargetY);
 return player.x+player.w>target.x&&player.x<target.x+target.w&&previousBottom<=previousTargetY+12&&relativeDown>0&&foot>=target.y&&player.y<target.y+target.h;
}
function bounceAfterStomp(target,speed=11){
 player.y=target.y-player.h;player.vy=-speed;player.onGround=false;player.swing=null;player.climbing=null;player.ladderDetach=20;player.launchFrames=0;player.inv=Math.max(player.inv,15);playSound('jump');
}
