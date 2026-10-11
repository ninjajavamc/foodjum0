function trapInPudding(enemy){
 if(player.trappedIn||player.puddingImmunity>0)return;
 player.trappedIn=enemy;player.escapeJumps=0;player.swing=null;player.climbing=null;player.seatedCatapult=null;player.vx=0;player.vy=0;
}
function updatePuddingTrap(){
 player.puddingImmunity=Math.max(0,(player.puddingImmunity||0)-1);
 const enemy=player.trappedIn;if(!enemy)return false;
 if(enemy.dead||!enemies.includes(enemy)){player.trappedIn=null;player.puddingImmunity=45;return false}
 player.x=enemy.x+(enemy.w-player.w)/2;player.y=enemy.y+enemy.h-player.h;player.vx=0;player.vy=0;player.onGround=false;return true;
}
function escapePudding(){
 const enemy=player.trappedIn;if(!enemy)return false;
 player.escapeJumps++;playSound('jump');enemy.wobble=12;
 if(player.escapeJumps>=6){player.trappedIn=null;player.x=enemy.x+(player.facing>0?enemy.w+12:-player.w-12);player.vy=-worldJumpSpeed();player.onGround=false;player.puddingImmunity=90;player.inv=Math.max(player.inv,20);player.escapeJumps=0}
 return true;
}
function drawPuddingStatus(){
 if(!player.trappedIn)return;
 x.save();x.fillStyle='rgba(96,61,114,.92)';x.fillRect(W/2-90,isTutorial()?275:105,180,35);x.fillStyle='#fff';x.textAlign='center';x.font='bold 20px system-ui';x.fillText('↑ '+player.escapeJumps+' / 6',W/2,isTutorial()?300:130);x.restore();
}
