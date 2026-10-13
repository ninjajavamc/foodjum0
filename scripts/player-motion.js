// Shared 60 Hz character physics. Online host runs this once for each teammate.
function updatePlayerMotion(){
 const p=player,previousX=p.x,previousBottom=p.y+p.h;
 if(p.down)return previousBottom;
 if(p.swingCooldown>0){p.swingCooldown--;if(p.swingCooldown===0)p.swingsUsed=0}
 p.cooldown=Math.max(0,p.cooldown-1);p.inv=Math.max(0,p.inv-1);p.shield=Math.max(0,p.shield-1);p.slow=Math.max(0,p.slow-1);p.honeyTime=Math.max(0,(p.honeyTime||0)-1);if(p.bubble===1)popBubble();p.bubble=Math.max(0,p.bubble-1);p.fireTime=Math.max(0,p.fireTime-1);p.fireCooldown=Math.max(0,p.fireCooldown-1);p.jumpBoost=Math.max(0,p.jumpBoost-1);p.marshmallowTime=Math.max(0,(p.marshmallowTime||0)-1);p.gliding=false;
 const move=(keys.ArrowLeft||keys.a||keys.touchLeft?-1:0)+(keys.ArrowRight||keys.d||keys.touchRight?1:0);if(move)p.facing=move;
 if(!updatePuddingTrap()&&!updateTraversal(move)){
  if(isSwimming()){p.vx+=move*(p.slow?.15:.36);p.vx*=.88;updateSwimmingVelocity()}
  else{p.vx+=move*(p.launchFrames>0?.02:p.swing?.18:(p.slow?.32:.65));p.vx*=p.launchFrames>0?1:p.swing?.985:(p.slow?.7:.82);p.vy=p.bubble>0?Math.max(-2.8,p.vy-.12):p.vy+worldGravity()}
  updateMarshmallowGlide();applyMarshmallowWindLift();p.x+=windMovement(p.vx);p.y+=p.vy;
  if(p.swing){
   const rope=p.swing;rope.life--;
   const dx=p.x+p.w/2-rope.x,dy=p.y+20-rope.y,length=Math.hypot(dx,dy);
   if(length>rope.length){
    const nx=dx/length,ny=dy/length;
    p.x=rope.x+nx*rope.length-p.w/2;p.y=rope.y+ny*rope.length-20;
    const outward=p.vx*nx+p.vy*ny;
    if(outward>0){p.vx-=outward*nx;p.vy-=outward*ny}
   }
   if(rope.life<=0)p.swing=null;
  }
  if(!boss)stopAtTerrainStep(previousX,previousBottom);
  const surface=floorAtX(p.x+p.w/2);
  const pit=!boss&&lavaPits.find(l=>p.x+p.w/2>l.x&&p.x+p.w/2<l.x+l.w);
  const cliff=!boss&&cliffs.find(l=>p.x+p.w/2>l.x&&p.x+p.w/2<l.x+l.w);
  if(cliff&&p.y+p.h>=surface){p.onGround=false;if(p.y>cliff.y+190)restoreFromFall(cliff)}
  else if(p.y+p.h>=surface&&pit){hitPlayer(1,0);p.y=surface-p.h;p.vy=0;p.onGround=true;p.swing=null;message='Sprudel-Lava macht Schaden – spring darüber!'}
  else if(p.y+p.h>=surface){p.y=surface-p.h;p.vy=0;p.onGround=true;p.swing=null}else p.onGround=false;
  if(!boss&&p.vy>=0)for(const platform of platforms){
   if(previousBottom<=platform.y&&p.y+p.h>=platform.y&&p.x+p.w>platform.x&&p.x<platform.x+platform.w){p.y=platform.y-p.h;p.vy=0;p.onGround=true;p.swing=null}
  }
  collideObstacles(previousX,previousBottom);
  if(p.onGround&&Math.abs(p.vx)>.1)p.walkPhase+=Math.abs(p.vx)*.14;
  if(p.onGround){p.launchFrames=0;p.gliding=false}
 }
 p.x=Math.max(0,Math.min((boss?W:levelWidth)-p.w,p.x));
 if(isSwimming()&&!p.climbing&&!p.seatedCatapult&&!p.trappedIn)constrainSwimmer(p);
 return previousBottom;
}
