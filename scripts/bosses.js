function bossTargets(){return !boss||boss.dead?[]:boss.members?boss.members.filter(b=>!b.dead):[boss]}
function bossBodyDistance(px,py,b){return Math.hypot(Math.max(b.x-px,0,px-b.x-b.w),Math.max(b.y-py,0,py-b.y-b.h))}
function findBossTarget(px,py,range){return bossTargets().filter(b=>b.hp>0&&bossBodyDistance(px,py,b)<range).sort((a,b)=>bossBodyDistance(px,py,a)-bossBodyDistance(px,py,b))[0]}
function beginBossFight(){
 if(level>=3){
  const artName={3:'boss-croissant',4:'boss-popcorn',5:'boss-bigmac',6:'boss-fishstick',7:'boss-cotton'}[level],hp={3:40,4:46,5:54,6:62,7:70}[level],height=level===6?220:level===5?160:level===4?122:110;
  boss={art:artName,x:650,y:ground-height-([3,6,7].includes(level)?140:0),w:level===6?90:[3,7].includes(level)?150:level===5?138:116,h:height,hp,max:hp,vx:-1.2,vy:0,jumpTimer:75,attack:130,flash:0,damage:2,dead:false,phase:1,isBoss:true,flying:[3,7].includes(level),swimming:level===6,flightTime:0,swoop:0};
 }else if(level===2||(isTutorial()&&tutorialBossRound===2)){
  const members=[{art:'boss-fork',x:480,hp:10,max:10},{art:'boss-spoon',x:650,hp:14,max:14},{art:'boss-knife',x:820,hp:10,max:10}].map((b,i)=>({...b,y:ground-108,w:65,h:108,attack:100+i*35,vx:i===2?-1:.9,vy:0,jumpTimer:60+i*18,flash:0,damage:2,dead:false,dash:0,isBoss:true}));
  boss={art:'trio',x:650,y:ground-108,w:65,h:108,hp:34,max:34,members,phase:1,dead:false};
 }else boss={art:'boss',x:720,y:ground-116,w:130,h:116,hp:19,max:19,vx:-1.15,vy:0,jumpTimer:60,attack:180,flash:0,damage:2,dead:false,phase:1,isBoss:true};
 enemies=[];objects=[];
 if(isSwimming())for(const px of [270,875])objects.push({type:'looseItem',item:'mushroom',x:px,y:ground-34,w:34,h:34,life:Infinity,delay:0});
 defeated=[];mandarinBabies=[];door=false;camera=0;cameraY=0;player.x=150;player.y=ground-player.h-(isSwimming()?90:0);player.onGround=false;player.vx=0;player.vy=0;player.swing=null;player.climbing=null;player.seatedCatapult=null;player.launchFrames=0;player.inv=110;resetCompanion(true);playSound('boss');message='BOSS: '+({2:'Das Besteck-Trio',3:'Gewitter-Croissant',4:'Popcorn',5:'Triple Bigmac',6:'Riesen-Fischstäbchen',7:'Fliegende Zuckerwatte'}[level]||'Kartoffelpüree-Bär')+'!';
}
function makeBossWave(px,direction){objects.push({type:'bossWave',x:px,y:ground-25,w:26,h:25,vx:direction*4.2,life:160})}
function updateBossProjectile(o){
 o.x+=o.vx;if(o.type==='crumbShot'||o.type==='stormBolt')o.y+=o.vy;
 if(['cutleryShot','sugarPuff','pickleShot'].includes(o.type)){o.vy+=o.type==='sugarPuff'?.065:o.type==='pickleShot'?.1*worldGravity()/.58:.08;o.y+=o.vy}
 if(o.type==='explosivePopcorn'){o.vy+=.18;o.y+=o.vy;o.fuse--;if(rect(player,o)||o.y+o.h>=ground||o.fuse<=0){explodePopcorn(o);return}}
 o.life--;
 const touches=o.type==='bossHeavyWave'&&o.flavor==='boss-fishstick'?Math.hypot(Math.max(player.x,Math.min(o.x+125,player.x+player.w))-o.x-125,Math.max(player.y,Math.min(o.y+125,player.y+player.h))-o.y-125)<=125:o.type==='popcornBlast'?Math.hypot(Math.max(player.x,Math.min(o.cx,player.x+player.w))-o.cx,Math.max(player.y,Math.min(o.cy,player.y+player.h))-o.cy)<=o.radius:rect(player,o);
 if(touches&&o.type!=='explosivePopcorn'){hitPlayer(o.damage||2,0,110);o.life=0}
 if(o.x+o.w<0||o.x>W||(['cutleryShot','sugarPuff','pickleShot','crumbShot','stormBolt'].includes(o.type)&&o.y+o.h>=ground))o.life=0;
}
function updateBossFight(previousBottom){
 if(!boss)return;
 if(boss.dead){boss.deathTimer--;if(boss.deathTimer<=0){screen='victory';keys={};player.swing=null;playSound('victory');message='Gratulation! Level '+level+' geschafft!'}return}
 if(boss.members){
  for(const b of boss.members)if(b.hp<=0&&!b.dead){b.dead=true;defeated.push({art:b.art,x:b.x+b.w/2,y:b.y+45,vx:0,vy:-3,angle:0,life:55,maxLife:55,size:120})}
  boss.hp=boss.members.reduce((sum,b)=>sum+Math.max(0,b.hp),0);
 }
 if(boss.hp<=0){
  boss.dead=true;boss.deathTimer=75;player.score+=1000;
  if(!boss.members)defeated.push({art:boss.art,x:boss.x+boss.w/2,y:boss.y+boss.h/2,vx:0,vy:-3,angle:0,life:75,maxLife:75,size:boss.art==='boss-fishstick'?250:145});message='Boss besiegt!';return;
 }
 if(boss.phase===1&&boss.hp<=boss.max/2){boss.phase=2;playSound('boss');shake=12;message='HALBE HP! Neue Boss-Attacke!';for(const b of bossTargets())b.attack=35}
 updateBossSpecial();
 for(const b of bossTargets()){
  if(b.hp<=0){b.dead=true;defeated.push({art:b.art,x:b.x+b.w/2,y:b.y+45,vx:0,vy:-3,angle:0,life:55,maxLife:55,size:120});continue}
  if(b.swimming)updateFishstickBoss(b);else if(b.flying)updateCottonFlight(b);else updateBossJump(b);b.attack-=level>=3?1.25:level===2?1.15:isTutorial()?.85:1;b.flash=Math.max(0,b.flash-1);
  if(b.swimming){/* Movement and crumb volleys are updated together above. */}
  else if(b.art==='boss-croissant'){if(b.attack<=0)fireCroissantBolts(b)}
  else if(b.art==='boss-cotton'){if(b.attack<=0)fireSugarPuffs(b)}
  else if(b.art==='boss-popcorn'||b.art==='boss-bigmac'){
   b.x+=b.vx;if(b.x<320||b.x>W-b.w-35)b.vx*=-1;
   if(b.attack<=0){if(b.art==='boss-popcorn')fireExplosivePopcorn(b);else fireBigmacPickles(b)}
  }else if(b.art==='boss'){
   b.x+=b.vx;if(b.x<390||b.x>850){b.x=Math.max(390,Math.min(850,b.x));b.vx*=-1}
   if(b.attack<=0){b.attack=boss.phase===2?120:180;b.vx=player.x<b.x?-(boss.phase===2?3.8:2.8):(boss.phase===2?3.8:2.8);if(boss.phase===2){makeBossWave(b.x,-1);makeBossWave(b.x+b.w,1);message='Püree-Schockwellen!'}}
  }else if(b.art==='boss-fork'){
   b.x+=b.vx;if(b.x<440||b.x>580)b.vx*=-1;
   if(b.attack<=0){b.attack=boss.phase===2?100:160;const count=boss.phase===2?5:3,direction=player.x<b.x?-1:1;for(let i=0;i<count;i++)objects.push({type:'cutleryShot',x:b.x+b.w/2,y:b.y+20,w:15,h:23,vx:direction*(2.1+i*.35),vy:-1.2-i*.5,life:200});message=boss.phase===2?'Gabel: Zinken-Sturm!':'Die Gabel wirft Zinken!'}
  }else if(b.art==='boss-spoon'){
   b.x=Math.max(590,Math.min(790,b.x+(player.x<b.x?-.65:.65)));
   if(b.attack<=0){b.attack=boss.phase===2?110:185;makeBossWave(b.x,-1);if(boss.phase===2){makeBossWave(b.x+b.w,1);objects.push({type:'cutleryShot',x:b.x+20,y:b.y,w:26,h:22,vx:player.x<b.x?-2.3:2.3,vy:-4,life:160})}message=boss.phase===2?'Löffel: Doppel-Schlag!':'Löffel-Schlag!'}
  }else{
   if(!b.dash)b.x=Math.max(620,Math.min(875,b.x+(player.x<b.x?-.8:.8)));
   if(b.dash>0){b.dash--;b.x+=b.vx;b.x=Math.max(390,Math.min(875,b.x))}
   if(b.attack<=0){b.attack=boss.phase===2?95:160;b.dash=boss.phase===2?45:30;b.vx=(player.x<b.x?-1:1)*(boss.phase===2?5.6:3.5);message=boss.phase===2?'Messer: Turbo-Schnitt!':'Das Messer stürmt!'}
  }
  if(canStomp(b,previousBottom,b.previousY)){b.hp--;b.flash=8;bounceAfterStomp(b,12)}else if(rect(player,b))hitPlayer(2,player.x<b.x?-4:4,110)
 }
 if(boss.members)boss.hp=boss.members.reduce((sum,b)=>sum+Math.max(0,b.hp),0);
}
function drawBossBodies(){
 for(const b of bossTargets()){const size=b.art==='boss-fishstick'?[210,264,18,60]:['boss-cotton','boss-croissant'].includes(b.art)?[166,148,12]:b.art==='boss-popcorn'?[134,148,13]:b.art==='boss-bigmac'?[154,180,15]:b.art==='boss'?[146,154,34]:[82,132,15];sprite(b.art,b.x-(size[3]||8),b.y-size[2],size[0],size[1]);if(b.flash>0){x.strokeStyle='#fff4ce';x.lineWidth=3;x.strokeRect(b.x,b.y,b.w,b.h)}}
}
function drawBossHud(){
 if(!boss)return;
 const left=330,width=370,hp=boss.members?boss.members.reduce((sum,b)=>sum+Math.max(0,b.hp),0):Math.max(0,boss.hp);
 x.save();x.fillStyle='#293346';x.fillRect(left,56,width,16);x.fillStyle=boss.phase===2?'#eb755b':'#d6576b';x.fillRect(left,56,width*Math.min(1,hp/boss.max),16);x.strokeStyle='#ffe4ac';x.lineWidth=2;x.strokeRect(left,56,width,16);x.fillStyle=['crystal','moon','water'].includes(worldSettings().theme)?'#fff0d6':'#23334c';x.font='bold 13px system-ui';x.textAlign='center';x.fillText((boss.members?'Besteck-Trio':({'boss-croissant':'Gewitter-Croissant','boss-cotton':'Zuckerwatte','boss-popcorn':'Popcorn','boss-bigmac':'Triple Bigmac','boss-fishstick':'Riesen-Fischstäbchen'}[boss.art]||'Püree-Bär'))+' · '+hp+'/'+boss.max+' HP'+(boss.phase===2?' · PHASE 2':''),left+width/2,91);x.restore();
}
function drawBossProjectile(o){
 if(o.type==='stormBolt'){drawCroissantBolt(o);return}
 if(o.type==='crumbShot'){x.fillStyle='#f8cf77';x.strokeStyle='#ac753c';x.lineWidth=2;x.beginPath();x.ellipse(o.x+9,o.y+7,9,7,0,0,Math.PI*2);x.fill();x.stroke();return}
 if(o.type==='sugarPuff'){drawSugarPuff(o);return}
 if(o.type==='explosivePopcorn'){drawPopcornKernel(o);return}
 if(o.type==='popcornBlast'){drawPopcornBlast(o);return}
 if(o.type==='pickleShot'){x.fillStyle='#86bf65';x.strokeStyle='#507b47';x.lineWidth=2;x.beginPath();x.ellipse(o.x+o.w/2,o.y+o.h/2,o.w/2,o.h/2,.2,0,Math.PI*2);x.fill();x.stroke();return}
 if(o.type==='bossHeavyWave'){drawBossHeavyWave(o);return}
 if(o.type==='bossWave'){x.fillStyle='#e8c58d';x.strokeStyle='#7e5a38';x.lineWidth=2;x.beginPath();x.moveTo(o.x,o.y+o.h);x.quadraticCurveTo(o.x+o.w/2,o.y-15,o.x+o.w,o.y+o.h);x.closePath();x.fill();x.stroke()}
 else{x.fillStyle='#dce9e6';x.strokeStyle='#597b87';x.lineWidth=2;x.beginPath();x.moveTo(o.x,o.y);x.lineTo(o.x+o.w/2,o.y+o.h);x.lineTo(o.x+o.w,o.y);x.closePath();x.fill();x.stroke()}
}
