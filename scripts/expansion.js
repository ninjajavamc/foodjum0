// Ten original food worlds. Physics and the shared, avoidable half-health special stay unchanged.
const EXTRA_WORLDS={
 8:{name:'Tomaten-Gewächshaus',boss:'König Ketchup',art:'boss-tomato',pattern:'fan',sky:['#9ed9d1','#edf2af'],floor:['#92b85e','#577c42'],accent:'#dc665a',prop:'plant'},
 9:{name:'Käse-Festung',boss:'Käse-Ritter',art:'boss-cheese',pattern:'dash',sky:['#83a4c5','#eee0a8'],floor:['#eed276','#bd934e'],accent:'#d2ae60',prop:'castle'},
 10:{name:'Pilz-Höhlen',boss:'Champignon-Kaiser',art:'boss-mushroom',pattern:'spore',sky:['#383a64','#8a789e'],floor:['#9d87b4','#65547e'],accent:'#d483b3',prop:'mushroom'},
 11:{name:'Zucker-Jahrmarkt',boss:'Lolli-Magier',art:'boss-lollipop',pattern:'orbit',sky:['#a5bbe8','#f7d5db'],floor:['#eeb6d5','#b88ac7'],accent:'#ed8da8',prop:'carnival',flying:true},
 12:{name:'Nudelhafen',boss:'Ravioli-Kapitän',art:'boss-ravioli',pattern:'cannon',sky:['#79bddd','#d3e8d2'],floor:['#d4b17d','#97724f'],accent:'#ecbd67',prop:'harbor'},
 13:{name:'Obst-Dschungel',boss:'Ananas-König',art:'boss-pineapple',pattern:'needle',sky:['#72b9a4','#d6e99b'],floor:['#79ac67','#447650'],accent:'#edc45d',prop:'jungle'},
 14:{name:'Schoko-Fabrik',boss:'Schoko-Golem',art:'boss-chocolate',pattern:'bomb',sky:['#ab929d','#e4bea4'],floor:['#ac7b58','#684738'],accent:'#b18469',prop:'factory'},
 15:{name:'Frühstücksberge',boss:'Pfannkuchen-Turm',art:'boss-pancake',pattern:'bounce',sky:['#a8cfe1','#fff0b9'],floor:['#ecc58f','#b88f58'],accent:'#e2b066',prop:'mountain'},
 16:{name:'Gewürz-Vulkan',boss:'Chili-Drache',art:'boss-chili-dragon',pattern:'fire',sky:['#653f63','#e79565'],floor:['#ba7660','#684449'],accent:'#eb7155',prop:'volcano',flying:true},
 17:{name:'Mitternachts-Buffet',boss:'Donut-Herrscher',art:'boss-donut',pattern:'ring',sky:['#252d57','#766696'],floor:['#9b8aad','#5a5278'],accent:'#bb87ca',prop:'buffet',flying:true}
};
const EXTRA_ENEMIES={
 radish:{name:'Radieschen-Hüpfer',w:44,h:48,hp:2,speed:.6},
 olive:{name:'Oliven-Flitzer',w:40,h:46,hp:2,speed:1.15},
 pretzel:{name:'Brezel-Werfer',w:54,h:46,hp:3,speed:.3,shoot:true},
 pepper:{name:'Paprika-Spucker',w:46,h:50,hp:2,speed:.45,shoot:true},
 cookie:{name:'Keks-Wächter',w:52,h:50,hp:3,speed:.25}
};
for(const [id,d] of Object.entries(EXTRA_WORLDS)){
 const n=Number(id);LEVEL_SETTINGS[n]={name:d.name,width:12500+(n-8)*250,enemies:27+(n-8),theme:'extra',enemySpeed:Math.min(2.3,1.95+(n-8)*.04),shootRate:Math.max(.42,.49-(n-8)*.008),gap:140+Math.min(15,n-8),moving:.78};
}
function extraWorld(){return EXTRA_WORLDS[level]}
function worldBossArt(id){return EXTRA_WORLDS[id]?.art||({1:'boss',3:'boss-croissant',4:'boss-popcorn',5:'boss-bigmac',6:'boss-fishstick',7:'boss-cotton'}[id])}
function worldBossName(id){return EXTRA_WORLDS[id]?.boss||({1:'Kartoffelpüree-Bär',2:'Besteck-Trio',3:'Gewitter-Croissant',4:'Popcorn',5:'Triple Bigmac',6:'Riesen-Fischstäbchen',7:'Zuckerwatte'}[id]||'Kartoffelpüree-Bär')}
function worldEnemyTypes(){return level>=8?['gummy','honey','lemon','pudding','taco','maki',...Object.keys(EXTRA_ENEMIES)]:level>=5?['gummy','pudding','honey','lemon','taco','maki']:level>=4?['gummy','pudding','honey','lemon','taco']:['gummy','honey','lemon']}
function decorateExtraWorld(){
 if(!extraWorld()||boss||undergroundTrip)return;
 if(level!==16){cliffs.push(...lavaPits);lavaPits.length=0}
 for(const gap of [...cliffs,...lavaPits])platforms.push({x:gap.x+gap.w/2-32,y:gap.y-62,w:64,h:18});
 for(const e of enemies)if(EXTRA_ENEMIES[e.type])Object.assign(e,{w:EXTRA_ENEMIES[e.type].w,h:EXTRA_ENEMIES[e.type].h,hp:EXTRA_ENEMIES[e.type].hp,y:floorAtX(e.x)-EXTRA_ENEMIES[e.type].h,damage:1,hop:90});
}
function updateExtraEnemy(e,d){
 const def=EXTRA_ENEMIES[e.type];if(!def)return;
 if(e.type==='radish'&&!e.jumpDir&&!isSwimming()&&Math.abs(d)<500){e.hop=(e.hop??90)-1;if(e.hop<=0&&e.onGround){e.vy=-8;e.hop=110}}
 if(def.shoot&&e.shoot<=0&&Math.abs(d)<480){
  e.shoot=Math.round(230*worldSettings().shootRate);
  objects.push({type:'mentos',taco:true,extraEnemy:e.type,x:e.x+e.w/2,y:e.y+8,w:14,h:14,vx:(d>0?1:-1)*(e.type==='pepper'?3:2.5),vy:-2.4,life:180});
 }
}
function drawExtraEnemy(e){sprite(e.type,e.x-9,e.y-15,e.w+18,e.h+24)}
function createExtraBoss(){
 const d=extraWorld(),hp=74+(level-8)*4;
 return {art:d.art,name:d.boss,extra:true,pattern:d.pattern,x:660,y:ground-132-(d.flying?125:0),w:128,h:132,hp,max:hp,vx:-1.2,vy:0,jumpTimer:90,attack:100,flash:0,damage:2,dead:false,phase:1,isBoss:true,flying:!!d.flying,flightTime:0,swoop:0};
}
function extraBossShot(b,angle,speed,gravity=0,shape='seed'){
 const d=extraWorld();objects.push({type:'banquetShot',x:b.x+b.w/2,y:b.y+b.h/2,w:18,h:18,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,gravity,life:220,damage:2,color:d.accent,shape,bounces:shape==='berry'?2:0});
}
function updateExtraBoss(b){
 if(!b.flying){b.x+=b.vx;if(b.x<260||b.x>W-b.w-30){b.x=Math.max(260,Math.min(W-b.w-30,b.x));b.vx*=-1}}
 if(b.dashFrames>0){b.dashFrames--;b.x=Math.max(170,Math.min(W-b.w-20,b.x+b.dashVx))}
 if(b.attack>0)return;
 const aim=Math.atan2(player.y+player.h/2-b.y-b.h/2,player.x+player.w/2-b.x-b.w/2),phase=boss.phase===2;
 b.attack=phase?105:155;
 if(b.pattern==='dash'){b.dashFrames=phase?42:30;b.dashVx=(player.x<b.x?-1:1)*4.2;makeBossWave(b.x,-1);if(phase)makeBossWave(b.x+b.w,1)}
 else if(b.pattern==='orbit'||b.pattern==='ring'){const count=phase?10:7;for(let i=0;i<count;i++)extraBossShot(b,aim+i*Math.PI*2/count,2.8,0,'ring')}
 else if(b.pattern==='bomb'){for(let i=0;i<(phase?4:2);i++)extraBossShot(b,aim-.3+i*.2,3.8,.06,'chunk')}
 else if(b.pattern==='bounce'){for(let i=0;i<(phase?3:2);i++)extraBossShot(b,aim-.35+i*.35,3.4,.09,'berry')}
 else if(b.pattern==='cannon'){for(let i=0;i<(phase?3:1);i++)extraBossShot(b,aim+(i-(phase?1:0))*.18,4.4,.025,'chunk')}
 else{const count=phase?5:3;for(let i=0;i<count;i++)extraBossShot(b,aim+(i-(count-1)/2)*.18,b.pattern==='needle'?4.5:b.pattern==='fire'?3.9:3.1,b.pattern==='spore'?.018:0,b.pattern==='fire'?'fire':b.pattern==='spore'?'spore':'seed')}
 if(b.flying){b.swoop=55;b.swoopTarget=Math.max(180,Math.min(W-b.w-20,player.x-b.w/2))}
 playSound('fire');
}
function updateBanquetShot(o){
 o.vy+=o.gravity;o.x+=o.vx;o.y+=o.vy;o.life--;
 if(o.y+o.h>=ground){if(o.bounces>0){o.y=ground-o.h;o.vy=-4.8;o.bounces--}else o.life=0}
 if(rect(player,o)){hitPlayer(2,0,110);o.life=0}
 if(o.x+o.w<0||o.x>W||o.y+o.h<0)o.life=0;
}
function drawBanquetShot(o){
 x.save();x.fillStyle=o.color;x.strokeStyle='#473443';x.lineWidth=2;
 if(o.shape==='chunk'){x.fillRect(o.x,o.y,o.w,o.h);x.strokeRect(o.x,o.y,o.w,o.h)}
 else{x.beginPath();x.ellipse(o.x+9,o.y+9,9,o.shape==='seed'?5:9,0,0,Math.PI*2);x.fill();x.stroke();if(o.shape==='ring'){x.fillStyle='#ffedbf';x.beginPath();x.arc(o.x+9,o.y+9,4,0,Math.PI*2);x.fill()}}
 x.restore();
}
function drawExtraBackground(){
 const d=extraWorld(),W=viewWidth,H=viewHeight;
 const sky=x.createLinearGradient(0,0,0,H);sky.addColorStop(0,d.sky[0]);sky.addColorStop(1,d.sky[1]);x.fillStyle=sky;x.fillRect(0,-viewOffsetY,W,H+viewOffsetY);
 x.fillStyle=level===17?'#fff1c9':'#fff1af';x.beginPath();x.arc(W-145,92,34,0,Math.PI*2);x.fill();
 for(let row=0;row<3;row++){x.fillStyle=d.floor[row%2];x.globalAlpha=.22+row*.12;x.beginPath();x.moveTo(0,H);for(let px=-70;px<W+80;px+=70)x.lineTo(px,300+row*65-Math.abs(Math.sin((px+camera*(.08+row*.1))*.005))*90-cameraY*.12);x.lineTo(W,H);x.closePath();x.fill()}x.globalAlpha=1;
 for(let i=-1;i<Math.ceil(W/210)+2;i++)drawExtraLandmark(i*210-(camera*.16%210),435-cameraY*.16,d,true);
 if(level===17){x.fillStyle='#f6efc9';for(let i=0;i<50;i++)x.fillRect((i*137)%W,15+(i*73)%220,2,2)}
}
function drawExtraLandmark(px,base,d,distant=false){
 x.save();x.translate(px,base);if(distant)x.scale(.65,.65);x.strokeStyle='#4a4c54';x.lineWidth=3;x.fillStyle=d.accent;
 if(d.prop==='plant'||d.prop==='jungle'){
  x.strokeStyle='#477b4e';x.lineWidth=7;x.beginPath();x.moveTo(0,0);x.quadraticCurveTo(-12,-90,0,-175);x.stroke();
  for(let j=0;j<4;j++){x.fillStyle='#6ea656';x.beginPath();x.ellipse((j%2?1:-1)*23,-40-j*30,28,10,j%2?.4:-.4,0,Math.PI*2);x.fill()}
  if(d.prop==='plant'){x.fillStyle='#df6558';x.beginPath();x.arc(15,-115,24,0,Math.PI*2);x.fill()}else{x.fillStyle='#e1c15f';x.beginPath();x.ellipse(0,-165,31,46,0,0,Math.PI*2);x.fill()}
 }else if(d.prop==='mushroom'){
  x.fillStyle='#dfceb5';x.fillRect(-16,-100,32,100);x.fillStyle=d.accent;x.beginPath();x.ellipse(0,-105,67,37,0,Math.PI,Math.PI*2);x.closePath();x.fill();x.stroke();x.fillStyle='#f9e5d1';for(let j=0;j<3;j++){x.beginPath();x.arc(-30+j*30,-120,7,0,Math.PI*2);x.fill()}
 }else if(d.prop==='volcano'||d.prop==='mountain'){
  x.fillStyle=d.floor[1];x.beginPath();x.moveTo(-80,0);x.lineTo(-20,-165);x.lineTo(25,-155);x.lineTo(85,0);x.closePath();x.fill();x.stroke();x.fillStyle=d.prop==='volcano'?'#f38956':'#fff0ce';x.beginPath();x.moveTo(-20,-165);x.lineTo(25,-155);x.lineTo(35,-105);x.lineTo(2,-124);x.lineTo(-40,-104);x.closePath();x.fill();
 }else if(d.prop==='harbor'){
  x.fillStyle='#ad865d';x.fillRect(-5,-185,10,185);x.fillStyle='#fff1ce';x.beginPath();x.moveTo(8,-178);x.lineTo(85,-52);x.lineTo(8,-52);x.closePath();x.fill();x.stroke();x.fillStyle=d.accent;x.fillRect(-62,-27,125,27);
 }else if(d.prop==='buffet'){
  x.fillStyle='#b798bb';x.fillRect(-65,-75,130,15);x.fillRect(-55,-60,10,60);x.fillRect(45,-60,10,60);x.fillStyle=d.accent;x.beginPath();x.ellipse(0,-90,48,20,0,Math.PI,Math.PI*2);x.closePath();x.fill();x.stroke();
 }else{
  x.fillRect(-50,-135,100,135);x.strokeRect(-50,-135,100,135);x.fillStyle=d.sky[1];for(let j=0;j<3;j++)x.fillRect(-34+j*27,-105,16,25);
  if(d.prop==='castle'){for(let j=0;j<4;j++){x.fillStyle=d.accent;x.fillRect(-50+j*28,-155,18,24)}}
  else if(d.prop==='carnival'){x.fillStyle='#f8e8b8';x.beginPath();x.moveTo(-66,-134);x.lineTo(0,-202);x.lineTo(66,-134);x.closePath();x.fill();x.stroke()}
  else{x.fillStyle=d.floor[1];x.fillRect(23,-202,24,67);x.strokeRect(23,-202,24,67)}
 }
 x.restore();
}
function drawExtraWorldProp(tree){
 const d=extraWorld();drawExtraLandmark(tree.x,tree.baseY??ground,d);
 x.strokeStyle='#dbc189';x.lineWidth=4;x.beginPath();x.moveTo(tree.x,(tree.baseY??ground)-180);x.lineTo(tree.hookX,tree.hookY);x.stroke();x.fillStyle='#ffe1a0';x.beginPath();x.arc(tree.hookX,tree.hookY,6,0,Math.PI*2);x.fill();
}
