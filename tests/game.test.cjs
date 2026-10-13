const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const script=html.split('<script>')[1].split('</script>')[0];
assert(!/[\u{1F300}-\u{1FAFF}\u{2764}]/u.test(html),'No emoji artwork');
const canvasContext=new Proxy({
 measureText:t=>({width:t.length*7}),
 createLinearGradient:()=>({addColorStop(){}}),
 createRadialGradient:()=>({addColorStop(){}}),
 ellipse:(...args)=>assert(args.length>=7&&args.every(Number.isFinite)&&args[2]>=0&&args[3]>=0,'Canvas ellipse needs seven finite arguments and non-negative radii'),
 arc:(cx,cy,r)=>assert(Number.isFinite(r)&&r>=0,'Canvas circle radius must never be negative')
},{get:(obj,key)=>key in obj?obj[key]:()=>{}});
const handlers={global:{},canvas:{}};
const canvas={width:1000,height:620,getContext:()=>canvasContext,
 addEventListener:(event,fn)=>handlers.canvas[event]=fn,
 getBoundingClientRect:()=>({left:0,top:0,width:1000,height:620}),setPointerCapture(){},setAttribute(){}
};
const context=vm.createContext({
 document:{querySelector:()=>canvas},
 Image:class {complete=true;naturalWidth=128},
 addEventListener:(event,fn)=>handlers.global[event]=fn,
 requestAnimationFrame(){},performance:{now:()=>1000},console
});
for(const path of ['scripts/viewport.js','scripts/audio.js','scripts/worlds.js','scripts/expansion.js','scripts/world-art.js','scripts/kitchen-art.js','scripts/frost-art.js','scripts/moon-art.js','scripts/underwater.js','scripts/clouds.js','scripts/pudding.js','scripts/weather.js','scripts/game-features.js','scripts/companions.js','scripts/crafting.js','scripts/scenery.js','scripts/abilities.js','scripts/structures.js','scripts/traversal.js','scripts/sewers.js','scripts/menus.js','scripts/bosses.js','scripts/boss-moves.js','scripts/dessert-bosses.js','scripts/secrets.js','scripts/tutorial.js','scripts/player-motion.js','scripts/online.js'])vm.runInContext(fs.readFileSync(path,'utf8'),context);
vm.runInContext(script,context);
const run=code=>vm.runInContext(code,context);
for(const name of run('Object.keys(art)')){
 const svg=fs.readFileSync(`assets/sprites/${name}.svg`,'utf8');
 assert(svg.includes('<svg')&&svg.includes('</svg>'),name+' sprite exists');
}
run("screen='play';reset();draw()");
assert.equal(run('player.hp'),20);
run('player.inv=0;player.x=300;player.y=ground-player.h;player.vy=0;update();draw()');
assert.equal(run('player.hp'),19,'Lava costs a life');
assert.equal(run('player.x'),300,'Sprite causes no backward teleport or knockback');
assert.equal(run('player.vx'),0,'Sprite causes no horizontal impulse');
run('reset();player.x=300;jump();update();draw()');
assert.equal(run('player.hp'),20,'Jumping over lava is safe');
assert(run('player.y+player.h<ground'));
run('reset();enemies.forEach(e=>e.dead=1);update();draw()');
assert.equal(run('door'),false,'Defeated enemies do not replace the key');
run('var mapKey=objects.find(o=>o.type===\"key\");player.x=mapKey.x;player.y=floorAtX(mapKey.x)-player.h;update();draw()');
assert(run('player.hasKey&&mapKey.collected&&door'),'Map key unlocks the boss door');
assert.equal(run('boss'),null,'Boss waits for door entry');
run('player.x=doorX+15;update();draw()');
assert.equal(run('boss'),null,'Walking into boss door does not open it automatically');
handlers.global.keydown({key:'q',repeat:false,preventDefault(){}});
assert.equal(run('door'),false);
assert(run('boss.hp>0'),'Q opens boss door');
run('boss.hp=0;update();draw()');
assert(run('boss.dead&&defeated.some(d=>d.art===\"boss\")'),'Boss plays a defeat animation');
assert.equal(run('level'),1,'Level waits for boss animation');
run('for(let i=0;i<75;i++){update();draw()}');
assert.equal(run('screen'),'victory','Defeating boss opens congratulations screen after its animation');
assert.equal(run('level'),1,'Only Level 1 exists');
for(let selected=0;selected<5;selected++){
 run(`reset();selected=${selected};ability();update();draw()`);
 assert(run('player.cooldown>0'),'Ability renders: '+selected);
}
run("reset();player.inv=0;enemies=[{type:'gummy',x:150,y:ground-42,w:42,h:42,hp:1,damage:1,shoot:100,slow:0,dead:0}];update();draw()");
assert.equal(run('player.hp'),19,'Gummy bear deals exactly 1 damage');
run("reset();enemies=[{type:'gummy',x:160,y:ground-42,w:42,h:42,hp:1,damage:1,shoot:100,slow:0,dead:0}];player.x=160;player.y=ground-42-player.h-3;player.vy=4;update();draw()");
assert.equal(run('enemies.length'),0,'One stomp defeats a 1 HP gummy bear');
assert(run('defeated.some(d=>d.art===\"gummy\")'),'Stomp creates a visible defeat animation');
run('for(let i=0;i<50;i++){update();draw()}');
assert.equal(run('defeated.length'),0,'Defeat animation finishes cleanly');
run("reset();selected=4;enemies=[{type:'gummy',x:160,y:ground-42,w:42,h:42,hp:1,damage:1,shoot:100,slow:0,dead:0}];ability();update();draw()");
assert.equal(run('enemies.length'),0,'Special ability defeats gummy bear');
run("reset();selected=0;ability();draw()");
assert(run('player.swing'),'Spaghetti attaches to a real tree');
run('jump()');
assert.equal(run('player.swing'),null,'Jump releases rope');
run("reset();objects=[{type:'cola',x:700,y:ground-70,w:28,h:70,used:false},{type:'mentos',x:700,y:ground-40,w:13,h:13,vx:0,life:100}];update();draw()");
assert.equal(run('objects[0].used'),true,'Mentos triggers cola');
assert(run('objects.some(q=>q.type===\"colaFlow\")'),'Cola creates a flowing puddle');
assert.equal(run('particles.length'),0,'Cola is no longer an instant explosion');
assert.equal(run('objects.find(o=>o.type===\"colaFlow\").w'),8,'Spill starts small');
run('player.inv=10000;for(let i=0;i<60;i++){update();draw()}');
assert(run('objects.find(o=>o.type===\"colaFlow\").w>8&&objects.find(o=>o.type===\"colaFlow\").w<60'),'Spill grows slowly');
run('for(let i=0;i<240;i++){update();draw()}');
assert(run('objects.some(o=>o.type===\"colaFlow\")'),'Flow lasts longer than five seconds');
run('for(let i=0;i<300;i++){update();draw()}');
assert(run('objects.some(o=>o.type===\"colaFlow\"&&o.life===Infinity)'),'Cola stays permanently');
run("reset();enemies=[];objects=[];var testMentos={type:'mentos',x:50,y:200,w:13,h:13,vx:MENTOS_SPEED,vy:-3.2,life:220};objects.push(testMentos);update();draw()");
assert(run('testMentos.x-50<3'),'Mentos moves more slowly than before');
assert(run('testMentos.vy>-3.2&&testMentos.y<200'),'Mentos starts upward but gravity reduces lift');
run('for(let i=0;i<59;i++){update();draw()}');
assert(run('testMentos.vy>0&&testMentos.y>200'),'Mentos follows an arc and falls down');
run('for(let i=0;i<100;i++){update();draw()}');
assert(!run('objects.includes(testMentos)'),'Mentos disappears when it reaches the ground');
for(let selected=0;selected<5;selected++){
 run(`screen='play';reset();selected=${selected};draw()`);
 handlers.global.keydown({key:'e',repeat:false,preventDefault(){}});
 assert(run('player.cooldown>0'),'E activates ability for character '+selected);
 run('reset();draw()');
 handlers.canvas.pointerdown({pointerId:10,clientX:941,clientY:560,preventDefault(){}});
 assert(run('player.cooldown>0'),'Mobile special button activates ability for character '+selected);
 handlers.canvas.pointerup({pointerId:10});
}
run("reset();selected=0");
handlers.global.keydown({key:'e',repeat:false,preventDefault(){}});
handlers.global.keydown({key:'e',repeat:true,preventDefault(){}});
assert(run('player.swing'),'Holding E does not repeatedly detach the rope');
assert(!html.includes("fillText('LIMONADEN-LAVA'"),'No name on the fizzy lava');
assert(run('trees.length>=3&&platforms.length>=2'),'Trees and climbable rocks exist');
run("screen='play';reset();selected=1;player.inv=10000;for(let i=0;i<1200;i++){update();draw()}");
assert.equal(run('screen'),'play','Twenty seconds of gameplay runs without freezing');
function movementAt(hz){
 run('reset();lastFrame=0;accumulator=0;keys={d:true}');
 for(let i=1;i<=hz/2;i++)run(`loop(${i*1000/hz})`);
 return run('player.x');
}
assert(Math.abs(movementAt(60)-movementAt(144))<4,'Same game speed at 60 and 144 Hz');
run("screen='play';keys={};reset()");
assert(run('levelWidth>=3600&&doorX>3000'),'Level extends well beyond the screen');
assert(run('lavaPits.length+cliffs.length>=8&&trees.length>=6'),'Long level contains repeated scenery and hazards');
assert(run('objects.filter(o=>o.type===\"cola\").every(o=>o.w>=64&&o.h>=145&&o.liquid===.9)'),'Cola bottles are larger and visibly filled');
run('player.x=1300;player.inv=10000;update();draw()');
assert(run('player.x>1000&&camera>0'),'Player can leave first screen and camera follows');
for(const type of ['gummy','honey','lemon'])for(const direction of [-1,1]){
 run(`reset();player.inv=10000;player.x=${direction===1?675:100};enemies=[{type:'${type}',x:${direction===1?238:385},y:ground-42,w:42,h:42,hp:2,damage:1,shoot:1000,slow:0,dead:0,vy:0}];update();draw()`);
 assert(run('enemies.length===1&&enemies[0].vy<0'),'Enemy starts a jump over lava: '+type+' '+direction);
 run('for(let i=0;i<43;i++){update();draw()}');
 assert(run('enemies.length===1&&enemies[0].y+enemies[0].h<=ground'),'Enemy safely crosses lava and can climb the next platform: '+type+' '+direction);
 assert(run(direction===1?'enemies[0].x>lavaPits[0].x+lavaPits[0].w':'enemies[0].x+enemies[0].w<lavaPits[0].x'),'Enemy crosses the entire gap');
}
run('reset();startBoss();player.inv=0;player.x=boss.x+40;update();draw()');
assert.equal(run('player.hp'),18,'Boss deals exactly two HP');
assert.equal(run('player.inv'),110,'Boss grants longer protection after a hit');
run("reset();player.inv=0;player.hp=1;hitPlayer(1,2);draw()");
assert.equal(run('screen'),'dying','Player defeat animates before game over');
run('for(let i=0;i<60;i++){update();draw()}');
assert.equal(run('screen'),'over','Game-over screen follows player animation');
run("reset();selected=4;ability();draw()");
assert(run('particles.some(q=>q.type===\"blast\")&&particles.some(q=>q.type===\"seed\")&&particles.some(q=>q.type===\"smoke\")'),'Explosion has shockwave, flying seeds and smoke');
assert(run('shake>0&&screenFlash>0'),'Explosion adds camera shake and flash');
run('for(let i=0;i<65;i++){update();draw()}');
assert.equal(run('particles.length'),0,'Explosion finishes without leaked particles');
run('reset();selected=0;ability();var firstHook=player.swing.x;player.x=firstHook-30;player.y=350;ability();draw()');
assert(run('player.swing&&player.swing.x>firstHook+80'),'Spaghetti can transfer to the next hook');
run('jump()');assert.equal(run('player.swing'),null,'Jump detaches after hook chaining');
assert(run('hooks.length>trees.length&&levelWidth>=9000'),'Long level has intermediate hooks');
assert(run('cliffs.length>0&&obstacles.length>10&&platforms.some(p=>p.moving)'),'Cliffs, obstacles and moving platforms exist');
run('reset();enemies=[];player.inv=0;player.x=cliffs[0].x+20;for(let i=0;i<45;i++){update();draw()}');
assert.equal(run('player.hp'),19,'Falling down a cliff costs one HP');
assert(run('player.x<cliffs[0].x'),'Cliff fall returns player to a safe edge');
run('reset();selected=1;ability();draw()');
assert(run('mandarinBabies.length===4&&player.shield===0&&art[\"mandarin-piece\"]'),'Mandarine summons babies instead of replacing the parent with a shield');
for(let index=0;index<4;index++){
 run(`reset();var box=objects.find(o=>o.type==='lunchbox');var oldRandom=Math.random;Math.random=()=>${(index+.1)/4};collectLunchbox(box);Math.random=oldRandom`);
 assert.equal(run('player.inventory[0]'),['mushroom','gum','wasabi','marshmallow'][index],'Every random item can be obtained');
 run('player.hp=10');
 handlers.global.keydown({key:'f',repeat:false,preventDefault(){}});
 assert.equal(run('player.inventory.length'),0,'F consumes one held item');
 if(index===0)assert.equal(run('player.hp'),11,'Mushroom gives one HP');
 if(index===1){run('var bubbleStart=player.y;for(let i=0;i<60;i++){update();draw()}');assert(run('player.bubble>0&&player.y<bubbleStart-100'),'Gum bubble lifts player');}
 if(index===2){assert(run('player.fireTime>0&&objects.some(o=>o.type===\"fire\")'),'Wasabi enables fire-spitting');run('var fireCount=objects.filter(o=>o.type===\"fire\").length;useItem()');assert(run('objects.filter(o=>o.type===\"fire\").length===fireCount'),'Fire cooldown prevents spam');}
 run('collectLunchbox(box)');assert.equal(run('player.inventory.length'),0,'A used lunchbox never gives another item');
}
run("reset();player.hp=MAX_HP;player.inventory=['mushroom'];useItem()");assert.equal(run('player.hp'),20,'Healing cannot exceed 20 HP');
run("reset();selected=0;player.inventory=['wasabi'];enemies=[{type:'gummy',x:230,y:ground-42,w:42,h:42,hp:1,damage:1,shoot:1000,slow:0,dead:0}];useItem();for(let i=0;i<15;i++){update();draw()}");
assert.equal(run('enemies.length'),0,'Wasabi flames actually defeat enemies');
run("reset();player.inventory=['gum'];draw()");
handlers.canvas.pointerdown({pointerId:12,clientX:786,clientY:560,preventDefault(){}});
assert(run('player.bubble>0&&player.inventory.length===0'),'Mobile ITEM button uses the item');
handlers.canvas.pointerup({pointerId:12});
run('reset();player.x=doorX+10;draw()');
handlers.global.keydown({key:'q',repeat:false,preventDefault(){}});
assert.equal(run('boss'),null,'Q cannot open a locked door');
run('enemies=[];player.hasKey=true;door=true;draw()');
handlers.canvas.pointerdown({pointerId:13,clientX:629,clientY:560,preventDefault(){}});
assert(run('boss&&boss.hp>0'),'Mobile Q button opens an unlocked boss door');
handlers.canvas.pointerup({pointerId:13});
run('boss.hp=0;for(let i=0;i<76;i++){update();draw()}');
assert.equal(run('screen'),'victory','Boss completion reaches congratulations screen');
assert(!run('victoryButtons.find(b=>b.id===\"next\").disabled'),'Level 2 can be selected after Level 1');
handlers.canvas.pointerdown({pointerId:14,clientX:500,clientY:452,preventDefault(){}});
assert(run('screen===\"play\"&&level===2&&levelWidth===10500'),'Next level starts the longer second map');
run('startBoss();boss.members.forEach(b=>b.hp=0);for(let i=0;i<76;i++){update();draw()}');
assert(run('screen===\"victory\"&&!victoryButtons.find(b=>b.id===\"next\").disabled'),'Kitchen World 3 is now available after World 2');
handlers.canvas.pointerdown({pointerId:15,clientX:500,clientY:300,preventDefault(){}});
assert(run('screen===\"play\"&&player.hp===20&&level===2'),'Level nochmal restarts the current level with 20 HP');
run("screen='victory';draw()");
handlers.canvas.pointerdown({pointerId:16,clientX:500,clientY:375,preventDefault(){}});
assert.equal(run('screen'),'start','Hauptmenü button returns to the new start screen');
run("selectedLevel=1;screen='choose';draw()");
handlers.global.keydown({key:'Enter',repeat:false,preventDefault(){}});
assert.equal(run('screen'),'buddy','Character choice leads to companion choice');
run('draw()');
handlers.canvas.pointerdown({pointerId:20,clientX:380,clientY:300,preventDefault(){}});
assert(run('screen===\"play\"&&companion.type===\"sausage-dog\"'),'Wursthund can be selected on mobile');
run("selectedBuddy=0;reset();enemies=[];var puddle={type:'colaFlow',sourceX:110,sourceY:380,groundY:ground,x:50,y:ground-22,w:120,h:28,spread:60,age:300,life:Infinity};objects=[puddle];player.inv=10000;for(let i=0;i<20;i++){update();draw()}");
assert(run('puddle.spread<60&&companion.cola>0'),'Sponge automatically absorbs nearby cola');
run("companion.cola=60;companion.cooldown=0;enemies=[{type:'gummy',x:190,y:ground-42,w:42,h:42,hp:1,damage:1,shoot:1000,dead:0,slow:0}];for(let i=0;i<40;i++){update();draw()}");
assert.equal(run('enemies.length'),0,'Sponge throws stored cola and defeats an enemy');
run('player.x=350;for(let i=0;i<35;i++){update();draw()}');
assert(run('Math.abs(companion.x-(player.x-65))<30'),'Sponge follows player automatically');
run("selectedBuddy=1;reset();player.inv=10000;enemies=[{type:'gummy',x:100,y:ground-42,w:42,h:42,hp:1,damage:1,shoot:1000,dead:0,slow:0}];update();draw()");
assert.equal(run('enemies[0].hp'),.5,'Wursthund only deals half a health point');
assert.equal(run('companion.cooldown'),180,'Wursthund waits three seconds between bites');
run('player.x=350;for(let i=0;i<45;i++){update();draw()}');
assert(run('Math.abs(companion.x-(player.x-65))<55'),'Wursthund follows player');
run("selectedBuddy=0;reset();enemies=[];objects=[{type:'cola',x:800,y:ground-145,w:64,h:145,liquid:.9,used:false}];player.x=810;player.y=objects[0].y-player.h-3;player.vy=4;update();draw()");
assert(run('player.y+player.h===objects[0].y&&player.onGround'),'Player lands on a cola bottle');
run('update();draw()');assert(run('player.y+player.h===objects[0].y'),'Bottle remains a stable platform');
run('reset();player.inventory=[\"mushroom\",\"gum\"];player.inventoryIndex=1;useItem()');
assert(run('player.bubble===120&&player.inventory.length===1&&player.inventory[0]===\"mushroom\"'),'Second inventory slot is usable');
run("var untouchedBox={type:'lunchbox',x:200,y:ground-48,w:60,h:48,used:false};player.inventory.push('wasabi');collectLunchbox(untouchedBox)");
assert(run('player.inventory.length===2&&!untouchedBox.used'),'Full inventory does not consume a lunchbox');
handlers.global.keydown({key:'1',repeat:false,preventDefault(){}});
assert.equal(run('player.inventoryIndex'),0,'Key 1 selects first inventory slot');
handlers.canvas.pointerdown({pointerId:21,clientX:210,clientY:122,preventDefault(){}});
assert.equal(run('player.inventoryIndex'),1,'Touch selects second inventory slot');
run('reset();enemies=[];objects=[];player.inventory=[\"gum\"];useItem();for(let i=0;i<120;i++){update();draw()}');
assert.equal(run('player.bubble'),0,'Bubble bursts after two seconds');
assert(run('particles.some(p=>p.type===\"bubblePop\")'),'Bubble bursting has a visible animation');
run('reset();enemies=[];objects=[];obstacles.length=0;platforms.length=0;lavaPits.length=0;cliffs.length=0;keys={d:true};jump();var minY=player.y;for(let i=0;i<47;i++){update();minY=Math.min(minY,player.y);draw()}');
assert(run('ground-player.h-minY>150&&player.x-150>120'),'Jump is higher and travels farther');
assert(run('player.walkPhase>0'),'Walking advances the leg animation');
run('reset();enemies=[];objects=[];obstacles.length=0;platforms.length=0;lavaPits.length=0;cliffs.length=0;player.x=1400;player.y=floorAtX(1400)-player.h;for(let i=0;i<25;i++){update();draw()}');
assert(run('player.y+player.h===ground-100&&cameraY<-80'),'Upper terrain is playable with vertical camera tracking');
run('player.x=2500;player.y=floorAtX(2500)-player.h;for(let i=0;i<35;i++){update();draw()}');
assert(run('player.y+player.h===ground+110&&cameraY>90'),'Lower terrain is playable with vertical camera tracking');
let soundCount=0;
context.AudioContext=class {state='running';currentTime=0;destination={};createGain(){return {gain:{value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}}createOscillator(){return {frequency:{setValueAtTime(){}},connect(){},disconnect(){},start(){soundCount++},stop(){}}}};
run('unlockAudio();playSound(\"jump\")');assert(soundCount>0,'Synthesized sounds work after a user gesture');
run('toggleAudio()');const mutedCount=soundCount;run('playSound(\"pickup\")');assert.equal(soundCount,mutedCount,'Ton AUS silences effects');
run('toggleAudio();playSound(\"victory\")');assert(soundCount>mutedCount,'Ton AN re-enables effects');
run('reset();selected=0;player.inv=10000;enemies=[];objects=[];ability();for(let i=0;i<30;i++){keys={d:true};update();draw()}');
assert(run('player.swing!==null&&player.x>230'),'Hook rope supports real swinging without dropping onto the floor');
run('var oldHook=player.swing.x;ability();update();draw()');
assert(run('player.swing&&player.swing.x>oldHook'),'Working swing can transfer to next hook');
run('for(let i=0;i<35;i++){keys={d:true};update();draw()}');
assert(run('player.swing!==null'),'Transferred rope stays attached during the next swing');
run('reset()');
assert.equal(run('objects.filter(o=>o.type===\"cola\").length'),4,'All four cola bottles of the shortened level spawn successfully');
assert(run('objects.filter(o=>o.type===\"cola\").every(b=>[...lavaPits,...cliffs].every(g=>b.x+b.w<=g.x-140||b.x>=g.x+g.w+140))'),'Cola bottles have a 140px safety margin from Sprite and holes');
run("enemies=[];var soak={type:'colaFlow',sourceX:110,sourceY:380,groundY:ground,x:-45,y:ground-22,w:310,h:28,spread:155,age:300,life:Infinity};objects=[soak];companion.cola=100;player.inv=10000;for(let i=0;i<30;i++){update();draw()}");
assert(run('soak.life<=0&&!objects.includes(soak)'),'Sponge quickly removes the entire puddle even when full');
run('reset();enemies=[];objects=[];player.inventory=[\"mushroom\"];dropItem()');
assert(run('player.inventory.length===0&&objects.some(o=>o.type===\"looseItem\"&&o.item===\"mushroom\")'),'R/drop creates a collectible item in the map');
run('var dropped=objects[0];for(let i=0;i<50;i++)update();player.x=dropped.x;player.y=floorAtX(dropped.x)-player.h;update();draw()');
assert.equal(run('player.inventory[0]'),'mushroom','Dropped items can be picked up again');
run("reset();enemies=[];var material={type:'material',material:'sugar',x:player.x,y:player.y,w:28,h:28,quantity:2};objects=[material];update()");
assert.equal(run('player.bag.sugar'),2,'Materials lying on the ground are collected');
run('reset();player.inventory=[];player.bag={herbs:4,sugar:4,spice:4};player.x=700;player.y=floorAtX(700)-player.h;selectedRecipe=1');
handlers.global.keydown({key:'i',repeat:false,preventDefault(){}});
assert.equal(run('screen'),'inventory','I opens inventory');
handlers.global.keydown({key:'b',repeat:false,preventDefault(){}});
assert.equal(run('screen'),'crafting','B opens the menu workbench without a table in the world');
run('draw();craftItem()');
assert(run('player.inventory[0]===\"gum\"&&player.bag.sugar===2&&player.bag.herbs===3'),'Workbench crafting consumes ingredients and creates an item');
run('player.inventory.push(\"mushroom\");var sugarBefore=player.bag.sugar;craftItem()');
assert.equal(run('player.bag.sugar'),run('sugarBefore'),'Full inventory prevents crafting without losing materials');
handlers.global.keydown({key:'r',repeat:false,preventDefault(){}});
assert.equal(run('player.inventory.length'),1,'R drops selected items from the inventory screen');
handlers.global.keydown({key:'i',repeat:false,preventDefault(){}});
assert.equal(run('screen'),'play','I closes inventory and resumes the game');
run('reset();selected=0;enemies=[];objects=[];ability();player.x=player.swing.x-30;player.y=350;ability();var secondHook=player.swing.x');
assert(run('player.swingsUsed===2&&player.swingCooldown===300&&player.cooldown===300'),'Two hook swings trigger five seconds of cooldown');
run('ability()');assert.equal(run('player.swing.x'),run('secondHook'),'A third swing is blocked');
run('jump();for(let i=0;i<299;i++)update()');assert.equal(run('player.swingCooldown'),1,'Cooldown lasts the full five seconds');
run('update()');assert(run('player.swingCooldown===0&&player.swingsUsed===0'),'Swing charges reset after five seconds');
run('reset();selected=1;player.inv=10000;enemies=[{type:\"gummy\",x:210,y:ground-42,w:42,h:42,hp:10,damage:1,shoot:1000,slow:0,dead:0}];ability();for(let i=0;i<60;i++){update();draw()}');
assert(run('enemies[0].hp<10&&mandarinBabies.length===4'),'Babies actively damage enemies while parent remains');
run('for(let i=0;i<240;i++){update();draw()}');assert.equal(run('mandarinBabies.length'),0,'Babies disappear after exactly five seconds');
run('reset();selected=2;enemies=[{type:\"honey\",x:235,y:ground-42,w:42,h:42,hp:2,damage:1,shoot:1000,slow:0,dead:0}];ability();for(let i=0;i<25;i++){update();draw()}');
assert(run('objects.some(o=>o.type===\"peel\")&&enemies.length===0'),'Banana keeps peel trap and its boomerang deals two HP');
run('for(let i=0;i<90;i++){update();draw()}');assert(!run('objects.some(o=>o.type===\"bananaBoomerang\")'),'Boomerang returns and expires');
for(const choice of [1,2,3]){
 run(`selectedBuddy=${choice};reset();player.inv=10000;enemies=[{type:'gummy',x:100,y:ground-42,w:42,h:42,hp:4,damage:1,shoot:1000,slow:0,dead:0}];for(let i=0;i<20;i++){update();draw()}`);
 assert.equal(run('enemies[0].hp'),3.5,'Non-sponge companion deals exactly 0.5 HP: '+choice);
}
run('selectedBuddy=0;reset();var layout1=JSON.stringify(lavaPits)+JSON.stringify(cliffs)+JSON.stringify(terraces);reset();var layout2=JSON.stringify(lavaPits)+JSON.stringify(cliffs)+JSON.stringify(terraces)');
assert.notEqual(run('layout1'),run('layout2'),'Replay generates a different random map');
assert(!run('objects.some(o=>o.type===\"craftStation\")'),'Workbench tables have been removed from world');
assert(run('Object.keys(MATERIALS).every(m=>art[\"material-\"+m])'),'All collected resources have distinct textures');
assert(!run('objects.some(o=>o.type===\"kitchenDevice\")'),'Kitchen appliances have been removed again');
run('reset();player.x=700;enemies=[];objects=[];player.bag={sugar:9,herbs:9,spice:9,stone:9,spoon:9,wood:9};openWorkbench();selectedRecipe=3;craftItem()');
assert.equal(run('player.buildInventory[0]'),'catapultKit','Stones, spoon and wood craft a catapult kit');
run('toggleInventory();useItem();var catapult=objects.find(o=>o.type===\"catapult\");enemies=[{type:\"honey\",x:catapult.x+130,y:ground-42,w:42,h:42,hp:2,damage:1,shoot:1000,slow:0,dead:0}];player.inv=10000;for(let i=0;i<70;i++){update();draw()}');
assert.equal(run('enemies.length'),0,'Built catapult autonomously defeats enemies with stones');
run('reset();player.x=700;objects=[];enemies=[];player.inventoryCategory=\"builds\";player.buildInventory=[\"wallKit\"];useItem();var wall=objects.find(o=>o.type===\"stonewall\");objects.push({type:\"mentos\",x:wall.x,y:wall.y+15,w:13,h:13,vx:0,vy:0,life:100});update()');
assert(run('objects.find(o=>o.type===\"mentos\").life<=0'),'Crafted wall blocks Mentos');
run('reset();startBoss();player.inv=10000;boss.hp=boss.max/2;update();for(let i=0;i<40;i++){update();draw()}');
assert(run('boss.phase===2&&objects.some(o=>o.type===\"bossWave\")'),'Bear gains new shockwave attack at half HP');
run('reset();level=2;spawnLevel();startBoss();player.inv=10000;boss.members.forEach(b=>b.hp=b.max/2);for(let i=0;i<40;i++){update();draw()}');
assert(run('boss.members.length===3&&boss.phase===2'),'Second boss is a three-member cutlery trio with a second phase');
assert(run('objects.filter(o=>o.type===\"cutleryShot\").length>=5&&objects.some(o=>o.type===\"bossWave\")'),'Trio second phase uses stronger multi-shot and ground-wave attacks');
assert(html.includes('<title>Food Jum0</title>')&&html.includes('width:100vw; height:100vh; height:100dvh'),'New name and full-window game area are applied');
run('reset();player.inventory=[\"gum\",\"mushroom\"];player.bag={sugar:9,herbs:9,spice:9,stone:9,spoon:9,wood:9};toggleInventory();draw()');
handlers.canvas.pointerdown({pointerId:81,clientX:325,clientY:180,preventDefault(){}});
assert.equal(run('player.inventoryIndex'),1,'Inventory slot is clickable');
handlers.canvas.pointerdown({pointerId:82,clientX:220,clientY:475,preventDefault(){}});
assert.equal(run('player.inventory.length'),1,'Drop button responds in inventory');
handlers.canvas.pointerdown({pointerId:83,clientX:700,clientY:290,preventDefault(){}});
assert.equal(run('screen'),'crafting','Workbench button opens its menu');
run('draw();var catapultRecipeButton=inventoryButtons.find(b=>b.id==="recipe3")');handlers.canvas.pointerdown({pointerId:84,clientX:700,clientY:run('catapultRecipeButton.y+10'),preventDefault(){}});
assert.equal(run('selectedRecipe'),3,'Recipe button changes selection');
handlers.canvas.pointerdown({pointerId:85,clientX:700,clientY:500,preventDefault(){}});
assert(run('player.buildInventory.includes(\"catapultKit\")'),'Craft button successfully creates selected recipe');
run('draw();toggleInventory();player.inventory=[];toggleInventory();var savedBounds=c.getBoundingClientRect;c.getBoundingClientRect=()=>({left:23,top:17,width:2000,height:1240})');
handlers.canvas.pointerdown({pointerId:86,clientX:1423,clientY:597,preventDefault(){}});
assert.equal(run('screen'),'crafting','Inventory buttons work with a scaled full-window canvas');
run('c.getBoundingClientRect=savedBounds;toggleInventory();keys.d=true;var pausedX=player.x;var pausedTick=tick');
handlers.global.keydown({key:'Escape',repeat:false,preventDefault(){}});
assert.equal(run('screen'),'paused','Escape pauses gameplay');
run('for(let i=0;i<120;i++){update();draw()}');
assert(run('player.x===pausedX&&tick===pausedTick'),'Physics and game timers stop while paused');
handlers.global.keydown({key:'Escape',repeat:false,preventDefault(){}});
assert.equal(run('screen'),'play','Escape resumes gameplay');
run('reset();enemies=[];var secret=secretPassages[0];secret.kind="loot";player.x=secret.x-65;player.y=secret.base-player.h;selected=4;player.cooldown=110;ability()');
assert(!run('secret.open'),'A cooling-down explosion cannot open the secret');
run('player.cooldown=0;selected=3;ability()');assert(!run('secret.open'),'Other character abilities cannot open the secret');
run('selected=4;player.cooldown=0;ability();for(let i=0;i<10;i++){update();draw()}');
assert(run('secret.open&&secret.wall.life===0'),'Pomegranate explosion destroys the secret wall');
assert(run('floorAtX(secret.x+150)===secret.base+105'),'Opened secret passage has a real lower floor');
assert(run('objects.some(o=>o.type===\"material\"&&o.quantity===3&&o.y>secret.base)'),'Secret room rewards can be collected below ground');
run('player.inv=10000;keys.d=true;for(let i=0;i<45;i++)update();keys={}');
assert(run('player.x>secret.x&&player.y+player.h>secret.base+60'),'Opened passage can actually be entered by walking and falling');
run('reset()');assert(run('secretPassages.every(s=>!s.open)'),'New level restores hidden passages correctly');
for(const asset of run('Object.values(art).map(image=>image.src)'))assert(fs.existsSync(asset.split('?')[0]),'Every loaded sprite exists: '+asset);
run('reset();var giant=objects.find(o=>o.type===\"greatWall\");var hatch=objects.find(o=>o.type===\"manhole\")');
assert(run('giant&&giant.h>=380&&giant.h<=414'),'Generated maps contain rare genuinely tall walls');
assert(run('hatch&&hatch.exitX>hatch.x+900'),'Manholes connect distinct safe world positions');
assert(run('objects.filter(o=>o.constructionSupply).reduce((sum,o)=>sum+o.quantity,0)>=9'),'Required construction materials are available before the walls');
run('enemies=[];objects=[giant];obstacles.length=0;platforms.length=0;player.x=giant.x-player.w-5;player.y=giant.y+giant.h-player.h;player.onGround=true;keys={d:true};jump();for(let i=0;i<60;i++)update();keys={}');
assert(run('player.x+player.w<=giant.x+.01'),'Normal jumping cannot pass the tall wall');
run('player.bag={wood:3,spoon:1,stone:0,sugar:0,herbs:0,spice:0};player.inventory=[];openWorkbench();selectedRecipe=6;craftItem();toggleInventory();useItem();var builtLadder=objects.find(o=>o.type===\"ladder\")');
assert(run('builtLadder&&builtLadder.h>giant.h&&player.bag.wood===0&&player.bag.spoon===0'),'Three wood and one spoon craft and build a usable ladder');
run('keys={w:true};for(let i=0;i<145;i++){update();draw()}keys={}');
assert(run('player.onGround&&player.y+player.h===giant.y&&player.x>giant.x'),'Ladder reaches the top and lets the player step onto the wall');
run('keys={s:true};for(let i=0;i<30;i++)update();keys={w:true};jump();update()');
assert(run('!player.climbing&&player.vy<0'),'Player can climb down and jump away without immediately reattaching');
run('keys={};objects=[giant];player.x=giant.x-70;player.y=giant.y+giant.h-player.h;player.facing=1;player.vx=0;player.vy=0;player.inventoryCategory=\"builds\";player.buildInventory=[\"catapultKit\"];useItem();var ride=objects.find(o=>o.type===\"catapult\");interactWorld();var seatY=player.y;enemies=[{type:\"honey\",x:ride.x-70,y:ground-42,w:42,h:42,hp:20,damage:1,shoot:1000,slow:0,dead:0}];player.inv=10000;for(let i=0;i<15;i++){update();draw()}');
assert(run('player.seatedCatapult===ride&&player.y===seatY&&ride.shots===8'),'Catapult holds its passenger and suspends automatic stone shots');
run('enemies=[];interactWorld()');
assert(run('!player.seatedCatapult&&player.launchFrames>0&&player.vy===-26&&ride.shots===8'),'G launches the character without consuming stone ammunition');
run('var peakBottom=player.y+player.h;for(let i=0;i<140;i++){update();draw();peakBottom=Math.min(peakBottom,player.y+player.h)}');
assert(run('peakBottom<giant.y&&player.x>giant.x+giant.w+50&&player.onGround'),'Catapult really carries its passenger over the wall to a safe landing');
run('reset();objects=[];enemies=[];obstacles.length=0;platforms.length=0;lavaPits.length=0;cliffs.length=0;terraces.length=0;player.x=330;player.inv=10000;var box={type:\"crate\",x:180,y:ground-72,w:65,h:72};obstacles.push(box);enemies=[{type:\"gummy\",x:120,y:ground-42,w:42,h:42,hp:10,damage:1,shoot:1000,slow:0,dead:0,vy:0}];var stoodOnBox=false;var clippedBox=false;for(let i=0;i<100;i++){update();draw();if(enemies[0]){stoodOnBox ||= enemies[0].y+42===box.y;clippedBox ||= rect(enemies[0],box)}}');
assert(run('stoodOnBox&&!clippedBox'),'Enemies jump onto boxes instead of passing through them');
run('objects=[{type:\"cola\",x:600,y:ground-145,w:64,h:145,used:false,liquid:.9}];obstacles.length=0;player.x=800;enemies=[{type:\"honey\",x:535,y:ground-42,w:42,h:42,hp:10,damage:1,shoot:1000,slow:0,dead:0,vy:0}];var stoodOnBottle=false;var clippedBottle=false;for(let i=0;i<130;i++){update();if(enemies[0]){stoodOnBottle ||= enemies[0].y+42===objects[0].y;clippedBottle ||= rect(enemies[0],objects[0])}}');
assert(run('stoodOnBottle&&!clippedBottle'),'Enemies stand on bottles and cannot walk through them');
run('objects=[{type:\"greatWall\",x:600,y:ground-400,w:140,h:400}];player.x=900;enemies=[{type:\"gummy\",x:540,y:ground-42,w:42,h:42,hp:10,damage:1,shoot:1000,slow:0,dead:0,vy:0}];for(let i=0;i<180;i++)update()');
assert(run('enemies[0].x+enemies[0].w<=600'),'Enemies stop at walls that are too tall to jump');
run('reset();var hatch=objects.find(o=>o.type===\"manhole\");var entranceX=hatch.x;var worldLength=levelWidth;var oldPits=JSON.stringify(lavaPits);player.x=hatch.x+12;player.y=floorAtX(hatch.x)-player.h;player.hp=13;player.score=234;player.hasKey=true;player.bag.wood=8;player.inventory=[\"gum\"];interactWorld()');
assert(run('undergroundTrip&&levelWidth===1800&&enemies.some(e=>e.type===\"moldCheese\")&&enemies.some(e=>e.type===\"donut\")'),'G enters a short separate sewer with cheese and donut enemies');
assert(!run('nearBossDoor()'),'Sewer does not accidentally offer the boss door');
run('player.inv=10000;var exitLadder=objects.find(o=>o.type===\"sewerLadder\");player.x=exitLadder.x;player.y=ground-player.h;keys={w:true};for(let i=0;i<85;i++){update();draw()}keys={}');
assert(run('!undergroundTrip&&levelWidth===worldLength&&player.x>entranceX+900&&JSON.stringify(lavaPits)===oldPits'),'Exit ladder restores the original map at a different manhole');
assert(run('player.hp===13&&player.hasKey&&player.score>=234&&player.bag.wood>=8&&player.inventory.includes(\"gum\")'),'Sewer roundtrip preserves health, score, key, materials and inventory');
run('enterSewer(objects.find(o=>o.type===\"manhole\"));reset()');assert(run('!undergroundTrip&&levelWidth===9000'),'Restart clears sewer state');
run('reset();enemies=[];player.x=doorX+10;player.hasKey=false');
handlers.global.keydown({key:'w',repeat:false,preventDefault(){}});assert.equal(run('boss'),null,'W cannot bypass a locked boss door');
run('player.hasKey=true');handlers.global.keydown({key:'w',repeat:false,preventDefault(){}});assert(run('boss&&boss.hp>0'),'W opens the boss door with its key');
run('reset();enemies=[];var universalHatch=objects.find(o=>o.type===\"manhole\");player.x=universalHatch.x+15;player.y=floorAtX(universalHatch.x)-player.h;draw()');
assert(run('buttons.some(b=>b.id===\"interact\"&&b.label===\"W\")'),'Mobile action button is labelled W');
handlers.global.keydown({key:'w',repeat:false,preventDefault(){}});assert(run('!!undergroundTrip'),'The same W key enters the sewer');
run('reset();enemies=[];var universalWall=objects.find(o=>o.type===\"greatWall\");player.x=universalWall.x-65;player.y=universalWall.y+universalWall.h-player.h;player.inventoryCategory=\"builds\";player.buildInventory=[\"ladderKit\"];useItem();draw()');
handlers.canvas.pointerdown({pointerId:95,clientX:625,clientY:560,preventDefault(){}});run('update()');assert(run('!!player.climbing'),'Holding the mobile W button climbs ladders');
handlers.canvas.pointerup({pointerId:95});run('keys={};player.climbing=null;player.x=universalWall.x-90;player.y=universalWall.y+universalWall.h-player.h;objects=objects.filter(o=>o.type!==\"ladder\");player.inventoryCategory=\"builds\";player.buildInventory=[\"catapultKit\"];useItem()');
handlers.global.keydown({key:'w',repeat:false,preventDefault(){}});assert(run('!!player.seatedCatapult'),'W boards the catapult');
handlers.global.keydown({key:'w',repeat:false,preventDefault(){}});assert(run('!player.seatedCatapult&&player.launchFrames>0'),'W also launches the catapult passenger');
run('selectedLevel=1;reset();player.x=700;objects=[];enemies=[];obstacles.length=0;platforms.length=0;player.inventory=[\"gum\",\"mushroom\"];player.buildInventory=[\"catapultKit\",\"wallKit\"];player.bag={wood:9,spoon:9,stone:9,sugar:9,herbs:9,spice:9};openWorkbench();selectedRecipe=6;craftItem();draw()');
assert(run('player.inventory.length===2&&player.buildInventory.length===3&&player.buildInventory.includes(\"ladderKit\")'),'A full power inventory does not block crafting a construction kit');
run('selectedRecipe=3;var remainingWood=player.bag.wood;craftItem()');assert.equal(run('player.bag.wood'),run('remainingWood'),'Full construction inventory does not spend materials');
run('inventoryAction(\"powerTab\");draw();selectedRecipe=0;var remainingHerbs=player.bag.herbs;craftItem()');assert.equal(run('player.bag.herbs'),run('remainingHerbs'),'Power inventory retains its own capacity');
run('toggleInventory();selectInventorySlot(3);useItem()');assert(run('player.inventory.length===2&&player.buildInventory.length===2&&objects.some(o=>o.type===\"catapult\")'),'Using a construction kit never consumes powers');
run('player.inventoryCategory=\"builds\";player.buildInventoryIndex=0;dropItem();var droppedBuild=objects.find(o=>o.type===\"looseItem\");droppedBuild.delay=0;player.x=droppedBuild.x;player.y=droppedBuild.y;collectWorldLoot(droppedBuild)');
assert(run('player.buildInventory.length===2&&player.inventory.length===2&&droppedBuild.collected'),'Dropped construction kits return to the separate build inventory');
run('selectInventorySlot(2);player.hp=10;useItem()');assert(run('player.hp===11&&player.inventory.length===1&&player.buildInventory.length===2'),'Power hotkeys select and consume only powers');
run('selectedBuddy=0;reset();objects=[];obstacles.length=0;platforms.length=0;lavaPits.length=0;cliffs.length=0;terraces.length=0;player.x=700;player.y=ground-105;player.vy=4;player.inv=0;enemies=[{type:\"gummy\",x:700,y:ground-42,w:42,h:42,hp:2,damage:1,shoot:1000,slow:0,dead:0,vy:-8,jumpDir:1},{type:\"honey\",x:730,y:450,w:42,h:42,hp:2,damage:1,shoot:1000,slow:0,dead:0,vy:0}];update();draw()');
assert(run('player.hp===20&&enemies[0].hp===1&&player.vy<0&&player.inv>=15'),'Stomping a jumping enemy bounces safely and protects against a nearby second enemy');
run('player.x=700;player.y=ground-player.h;player.vy=0;player.inv=0;enemies=[{type:\"gummy\",x:700,y:ground-42,w:42,h:42,hp:2,damage:1,shoot:1000,slow:0,dead:0,vy:0}];update()');assert.equal(run('player.hp'),19,'Ordinary side contact still hurts');
for(let i=0;i<4;i++){run('selectedLevel=1;reset()');assert(run('levelWidth===9000&&enemies.length===12&&objects.filter(o=>o.type===\"lunchbox\").length<=4'),'Level 1 is a further quarter shorter and item boxes are rare')}
run('screen=\"start\";draw()');assert(run('menuButtons.some(b=>b.id===\"levels\")&&!menuButtons.find(b=>b.id===\"multiplayer\").disabled'),'Start screen offers levels and online room-code multiplayer');
handlers.canvas.pointerdown({pointerId:100,clientX:500,clientY:370,preventDefault(){}});assert.equal(run('screen'),'online','Multiplayer opens the online lobby instead of pretending to be local play');run('onlineLeave();draw()');
handlers.canvas.pointerdown({pointerId:101,clientX:500,clientY:275,preventDefault(){}});assert.equal(run('screen'),'levelselect','Level selection comes before characters');
run('draw();var secondWorldCard=menuButtons.find(b=>b.id==="level2")');handlers.canvas.pointerdown({pointerId:102,clientX:run('secondWorldCard.x+secondWorldCard.w/2'),clientY:run('secondWorldCard.y+secondWorldCard.h/2'),preventDefault(){}});assert(run('screen===\"choose\"&&selectedLevel===2'),'Choosing Level 2 leads to character selection');
handlers.global.keydown({key:'Enter',repeat:false,preventDefault(){}});assert.equal(run('screen'),'buddy','Character selection is followed by companion selection');
handlers.global.keydown({key:'Enter',repeat:false,preventDefault(){}});assert(run('screen===\"play\"&&level===2&&levelWidth===10500&&enemies.length===14'),'The selected shortened Level 2 starts after choosing a companion');
run('screen=\"over\";draw()');assert(run('overButtons.some(b=>b.id===\"retry\")&&overButtons.some(b=>b.id===\"menu\")'),'Game over offers both replay and main menu');
handlers.canvas.pointerdown({pointerId:103,clientX:500,clientY:420,preventDefault(){}});assert.equal(run('screen'),'start','Game-over main menu button returns to the start screen');
run('screen=\"over\";draw()');handlers.canvas.pointerdown({pointerId:104,clientX:500,clientY:335,preventDefault(){}});assert(run('screen===\"play\"&&level===2&&player.hp===20'),'Game-over replay restarts the same chosen level');
run('selectedLevel=1;reset()');
const musicInstances=[];
context.Audio=class {
 paused=true;currentTime=0;playCount=0;listeners={};
 constructor(){musicInstances.push(this)}
 addEventListener(name,handler){this.listeners[name]=handler}
 pause(){this.paused=true}
 play(){this.playCount++;if(this.blockNext){this.blockNext=false;const e=new Error('Autoplay blocked');e.name='NotAllowedError';throw e}this.paused=false}
};
run('musicUnlocked=false;boss={dead:0};screen="play";syncMusic()');assert.equal(musicInstances.length,0,'Music waits for a user gesture');
run('unlockAudio()');const music=musicInstances[0];
assert.equal(music.src,'assets/audio/boss.mp3');assert(music.loop&&!music.paused,'Boss music loops after unlocking audio');
const firstPlays=music.playCount;run('syncMusic();syncMusic()');assert.equal(music.playCount,firstPlays,'Frame updates do not repeatedly restart music');
music.currentTime=18;
for(const state of ['paused','inventory','crafting','dying','over','victory']){
 run('screen='+JSON.stringify(state)+';syncMusic()');assert(music.paused,'Music stops on '+state);
 run('screen="play";syncMusic()');assert(!music.paused&&music.currentTime===18,'Resuming retains the playback position');
}
run('setMusicFocus(false)');assert(music.paused,'Losing focus pauses music');run('setMusicFocus(true)');assert(!music.paused,'Returning focus resumes music');
run('toggleAudio()');assert(music.paused&&music.muted,'Ton AUS mutes and pauses music');run('toggleAudio()');assert(!music.paused&&!music.muted,'Ton AN restores music');
run('boss.dead=1;syncMusic()');assert(music.paused,'Defeating the boss immediately stops its music');
run('boss={dead:0};syncMusic()');assert.equal(music.currentTime,0,'A new boss starts the track from the beginning');
run('reset();var audioHatch={x:2000,exitX:2500};enterSewer(audioHatch)');assert.equal(music.src,'assets/audio/sewer.mp3');assert(!music.paused,'Entering a real sewer starts its own music');
music.currentTime=32;run('screen="inventory";syncMusic()');assert(music.paused,'Sewer music pauses in inventory');run('screen="play";syncMusic()');assert.equal(music.currentTime,32,'Sewer music resumes at the same position');
run('exitSewer()');assert(music.src==='assets/audio/overworld.mp3'&&!music.paused,'Leaving the sewer switches back to overworld music');
run('enterSewer(audioHatch)');assert.equal(music.currentTime,0,'A new sewer trip restarts its track');
assert.equal(musicInstances.length,1,'One shared player prevents overlapping boss/sewer tracks');
music.pause();music.blockNext=true;run('syncMusic()');const blockedPlays=music.playCount;run('syncMusic();syncMusic()');assert.equal(music.playCount,blockedPlays,'Autoplay rejection does not cause frame-by-frame retries');
run('unlockAudio()');assert(!music.paused,'A new gesture retries blocked playback safely');
music.listeners.error();run('syncMusic()');assert(music.paused,'An unavailable track fails quietly');
run('exitSewer();boss={dead:0};syncMusic()');assert(!music.paused,'A missing sewer track does not prevent boss music');
for(const name of ['menu','overworld','boss','sewer'])assert(fs.statSync('assets/audio/'+name+'.mp3').size>100000,'Local '+name+' MP3 is bundled for offline use');
run('unavailableMusic.clear();boss=null;selectedLevel=1;reset();syncMusic()');
assert(music.src==='assets/audio/overworld.mp3'&&!music.paused,'Ordinary gameplay uses its own overworld music');
music.currentTime=40;run('screen="paused";syncMusic();screen="play";syncMusic()');assert.equal(music.currentTime,40,'Overworld pause retains the playback position');
run('reset();syncMusic()');assert.equal(music.currentTime,0,'A new game restarts overworld music');
run('screen="start";syncMusic()');assert(music.src==='assets/audio/menu.mp3'&&!music.paused,'The main menu has its own music');
music.currentTime=12;
for(const state of ['levelselect','choose','buddy']){
 handlers.global.keydown({key:'Enter',repeat:false,preventDefault(){}});run('syncMusic()');
 assert.equal(run('screen'),state,'Menu navigation reaches '+state);
 assert(music.src==='assets/audio/menu.mp3'&&!music.paused&&music.currentTime===12,'Selection screens continue menu music without restarting');
}
run('toggleAudio()');assert(music.muted&&music.paused,'Menu music honors mute');run('toggleAudio()');assert(!music.muted&&!music.paused&&music.currentTime===12,'Menu music resumes after unmuting');
run('setMusicFocus(false)');assert(music.paused,'Menu music stops on blur');run('setMusicFocus(true)');assert(!music.paused,'Menu music resumes on focus');
handlers.global.keydown({key:'Enter',repeat:false,preventDefault(){}});run('syncMusic()');assert(music.src==='assets/audio/overworld.mp3'&&!music.paused,'Starting gameplay switches from menu to overworld music');
run('screen="over";gameOverAction("menu");syncMusic()');assert(music.src==='assets/audio/menu.mp3'&&!music.paused,'Returning to the main menu restores its soundtrack');
assert.equal(musicInstances.length,1,'All four soundtracks share one player and never overlap');
run('reset();syncMusic()');
run('selectedLevel=1;reset();var forestRise=terraces[0].y;var forestGap=lavaPits[0].w;selectedLevel=2;reset()');
assert(run('worldSettings().theme==="crystal"&&terraces[0].y<forestRise&&lavaPits[0].w>forestGap&&obstacles.some(o=>o.type==="rock")'),'World 2 has distinct terrain and greater platforming difficulty');
assert(run('LEVEL_SETTINGS[2].enemySpeed>LEVEL_SETTINGS[1].enemySpeed&&LEVEL_SETTINGS[2].shootRate<LEVEL_SETTINGS[1].shootRate'),'Later worlds have faster enemies and more frequent projectiles');
const drawnTexts=[];const originalText=canvasContext.fillText;canvasContext.fillText=t=>drawnTexts.push(String(t));
for(const world of [1,2]){run('selectedLevel='+world+';reset();message="EXPLANATION_SENTINEL";draw()');assert(!drawnTexts.includes('EXPLANATION_SENTINEL'),'Regular worlds hide explanation messages');assert(!run('showGameplayHints()'))}
run('screen="start";draw()');handlers.global.keydown({key:'t',repeat:false,preventDefault(){}});assert(run('selectedLevel===0&&screen==="choose"'),'Totarial is separately selectable with T');
run('selected=0;selectedBuddy=0;reset();draw()');assert(run('isTutorial()&&levelWidth===11000&&enemies.length===9'),'The fixed learning world starts successfully');
assert(run('TUTORIAL_LESSONS.length>=17&&objects.some(o=>o.type==="manhole")&&objects.filter(o=>o.type==="greatWall").length===2&&secretPassages.length===3'),'Totarial contains lessons, sewers, both construction challenges and a secret');
assert(drawnTexts.some(t=>t.includes('Willkommen in Totarial')),'Tutorial explanations are rendered');canvasContext.fillText=originalText;
run('player.x=1850;interactWorld()');assert(run('player.inventory.includes("mushroom")&&player.inventory.includes("gum")'),'Power station supplies healing and floating powers');
run('interactWorld()');assert(run('player.inventory.includes("wasabi")&&player.inventory.includes("springKit")'),'Power station also supplies fire and spring powers');
for(let character=0;character<5;character++){
 run('player.x=TUTORIAL_LESSONS.find(l=>l.kind==="character"&&l.value==='+character+').x;interactWorld()');assert.equal(run('selected'),character,'Every character can be tried inside Totarial');
 if(character===4)run('player.x=4500');run('ability();draw()');
}
assert(run('secretPassages[0].open'),'The pomegranate exercise opens its real secret passage');
run('player.x=4900;var fixedTrainingBuddy=companion.type;for(let i=0;i<4;i++)interactWorld()');assert.equal(run('companion.type'),run('fixedTrainingBuddy'),'The tutorial does not switch companions during a level');
run('player.x=6100;interactWorld();openWorkbench();selectedRecipe=6;craftItem();toggleInventory();useItem()');assert(run('objects.some(o=>o.type==="ladder")'),'Tutorial materials support real ladder crafting and placement');
run('var trainingLadder=objects.find(o=>o.type==="ladder");player.x=trainingLadder.x;player.y=ground-player.h;keys={w:true};for(let i=0;i<125;i++)update();keys={}');assert(run('player.y+player.h<=trainingLadder.wall.y+1'),'Training ladder reaches the first high wall');
run('player.x=7100;player.y=ground-player.h;player.vx=0;player.vy=0;interactWorld();openWorkbench();selectedRecipe=3;craftItem();toggleInventory();useItem()');assert(run('objects.some(o=>o.type==="catapult")'),'The second construction exercise supports a player catapult');
run('player.x=8150;player.y=ground-player.h;interactWorld()');assert(run('undergroundTrip&&isTutorial()&&currentTutorialLesson().title.includes("Kanalisation")'),'The tutorial sewer retains tutorial mode and its explanations');
run('exitSewer();player.hp=1;player.inv=0;hitPlayer(2,0)');assert(run('player.hp===20&&screen==="play"'),'Tutorial defeats safely revive without losing possessions');
run('player.x=doorX+15;player.y=ground-player.h;player.hasKey=false;openBossDoor()');assert(run('screen==="play"&&!boss'),'The tutorial exit still requires the collected key');
run('player.hasKey=true;keys={d:true};heldPointers.set(901,"right")');handlers.global.keydown({key:'w',repeat:false,preventDefault(){}});
assert(run('screen==="start"&&!boss&&heldPointers.size===0&&!Object.keys(keys).length'),'Opening the training boss door returns to the main menu without starting a boss and clears inputs');
assert(music.src==='assets/audio/menu.mp3'&&!music.paused,'The tutorial exit immediately switches to main-menu music');
run('selectedLevel=0;reset();player.x=doorX+15;player.y=ground-player.h;player.hasKey=true;draw()');const trainingExit=run('buttons.find(b=>b.id==="interact")');
handlers.canvas.pointerdown({pointerId:902,clientX:trainingExit.x+20,clientY:trainingExit.y+20,preventDefault(){}});assert(run('screen==="start"&&!boss'),'The mobile W button also exits training to the main menu');
run('selectedLevel=1;reset();player.x=doorX+15;player.y=ground-player.h;player.hasKey=true;openBossDoor()');assert(run('screen==="play"&&boss'),'Real-world boss doors still start boss fights');
run('selectedLevel=1;reset()');
run('startBoss();player.inv=10000;var startingBossX=boss.x;for(let i=0;i<80;i++)update()');assert(run('boss.x!==startingBossX&&boss.y<ground-boss.h'),'The bear actively moves and jumps');
run('boss.hp=boss.max/2;update()');assert(run('boss.heavyUsed&&boss.heavyCharge>=85'),'Half HP announces the once-only heavy attack with a long warning');
run('for(let i=0;i<260;i++)update()');assert.equal(run('boss.heavyCount'),1,'The 10-HP attack is emitted only once per fight');
run('var heavyTest={type:"bossHeavyWave",x:100,y:ground-38,w:250,h:38,vx:0,life:25,damage:10};player.x=150;player.y=ground-player.h;player.hp=20;player.inv=0;updateBossProjectile(heavyTest)');assert.equal(run('player.hp'),10,'The heavy attack deals exactly 10 HP');
run('heavyTest.life=25;player.hp=20;player.inv=0;player.y=ground-player.h-100;updateBossProjectile(heavyTest)');assert.equal(run('player.hp'),20,'Jumping above the heavy attack avoids all its damage');
run('selectedLevel=2;reset();startBoss();player.inv=10000;var startingTrioX=boss.members.map(b=>b.x);for(let i=0;i<100;i++)update()');assert(run('boss.members.every((b,i)=>b.x!==startingTrioX[i])&&boss.members.some(b=>b.y<ground-b.h)'),'All trio members move, and the trio jumps');
run('boss.members.forEach(b=>b.hp=b.max/2);for(let i=0;i<260;i++)update()');assert.equal(run('boss.heavyCount'),1,'The trio shares one heavy attack, not three unavoidable 10-HP attacks');
run('selectedLevel=1;reset()');
const paintedColors=[];const savedFill=canvasContext.fill,savedRect=canvasContext.fillRect;
canvasContext.fill=()=>paintedColors.push(canvasContext.fillStyle);canvasContext.fillRect=()=>paintedColors.push(canvasContext.fillStyle);
run('selectedLevel=2;reset();camera=0;drawGrassStrip(0,200,ground);drawWorldTree(trees[0])');
assert(paintedColors.includes('#f5daa0')&&paintedColors.includes('#c4a1d2'),'The crystal desert renders sand and crystal spires');
assert(!paintedColors.includes('#437d49')&&!paintedColors.includes('#39794c'),'The crystal desert has no green grass or leafy trees');
paintedColors.length=0;run('selectedLevel=3;reset();camera=0;drawGrassStrip(0,200,ground);drawWorldTree(trees[0])');
assert(paintedColors.includes('#fff')&&paintedColors.includes('#cb976c'),'Kitchen renders white flooring and a giant whisk instead of a tree');
assert(!paintedColors.includes('#437d49')&&!paintedColors.includes('#39794c'),'Kitchen has no green grass or leafy trees');
canvasContext.fill=savedFill;canvasContext.fillRect=savedRect;
assert(run('levelWidth===11250&&enemies.length===17&&worldSettings().enemySpeed>LEVEL_SETTINGS[2].enemySpeed&&!showGameplayHints()'),'Kitchen is a harder real world without explanation text');
run('screen="levelselect";selectedLevel=2;draw()');assert(run('menuButtons.some(b=>b.id==="level3")'),'World selection includes Kitchen');
handlers.global.keydown({key:'ArrowRight',repeat:false,preventDefault(){}});assert.equal(run('selectedLevel'),3,'Arrow navigation includes World 3');
handlers.global.keydown({key:'3',repeat:false,preventDefault(){}});assert(run('screen==="choose"&&selectedLevel===3'),'Keyboard 3 selects Kitchen');
handlers.global.keydown({key:'Enter',repeat:false,preventDefault(){}});handlers.global.keydown({key:'Enter',repeat:false,preventDefault(){}});assert(run('screen==="play"&&level===3&&!boss'),'Kitchen starts after selecting a character and companion');
run('player.x=doorX+15;player.y=ground-player.h;player.hasKey=false;openBossDoor()');assert.equal(run('screen'),'play','Kitchen end still requires collecting its key');
run('player.hasKey=true;openBossDoor();draw()');assert(run('screen==="play"&&boss.art==="boss-croissant"&&boss.flying'),'Kitchen now starts its flying storm-croissant boss');
run('boss.hp=0;for(let i=0;i<76;i++)update();draw()');assert(run('screen==="victory"&&!victoryButtons.find(b=>b.id==="next").disabled'),'Kitchen victory unlocks the ice-cream world');
run('victoryAction("retry")');assert(run('screen==="play"&&level===3&&player.hp===20'),'Kitchen replay remains in World 3');
run('selectedLevel=2;reset();startBoss();boss.members.forEach(b=>b.hp=0);for(let i=0;i<76;i++)update();victoryAction("next")');assert(run('screen==="play"&&level===3&&worldSettings().theme==="kitchen"'),'Beating the trio progresses to Kitchen');
run('selectedLevel=1;reset()');
run('selectedBuddy=1;selectedLevel=1;reset();selectedBuddy=2;resetCompanion()');assert(run('player.buddyIndex===1&&companion.type==="sausage-dog"'),'The selected companion is locked on the player for the whole level');
run('selectedBuddy=3;enterSewer({x:2000,exitX:2500})');assert.equal(run('companion.type'),'sausage-dog','Sewer entry preserves the locked companion');
run('exitSewer()');assert.equal(run('companion.type'),'sausage-dog','Sewer exit preserves the locked companion');
run('startBoss()');assert.equal(run('companion.type'),'sausage-dog','Boss entry preserves the locked companion');
for(let index=0;index<4;index++){run('selectedBuddy='+index+';reset()');assert(run('player.buddyIndex==='+index+'&&companion.type===BUDDIES['+index+'].art'),'A different companion can be chosen before a new game')}
run('selectedBuddy=0;selectedLevel=1;reset()');
run('function prepareFreeLadder(){selectedLevel=1;reset();objects=[];enemies=[];obstacles.length=0;platforms.length=0;lavaPits.length=0;cliffs.length=0;terraces.length=0;player.x=500;player.y=ground-player.h;player.buildInventory=["ladderKit"];player.inventoryCategory="builds"}prepareFreeLadder();useItem();var freeLadder=objects.find(o=>o.type==="ladder")');
assert(run('freeLadder&&!freeLadder.wall&&freeLadder.h===300&&player.buildInventory.length===0'),'A ladder can be built on ordinary ground without any high wall');
run('keys={w:true};for(let i=0;i<105;i++)update()');assert(run('player.climbing===freeLadder&&Math.abs(player.y+player.h-freeLadder.y)<.01'),'A free-standing ladder can be climbed to its top and held there');
run('keys={s:true};update()');assert(run('player.y+player.h>freeLadder.y'),'S descends a free-standing ladder');run('jump()');assert(run('!player.climbing&&player.vy<0'),'Space jumps off a free-standing ladder');
run('prepareFreeLadder();var ladderPlatform={x:480,y:ground-140,baseY:ground-140,w:160,h:18,moving:true,phase:0};platforms.push(ladderPlatform);player.y=ladderPlatform.y-player.h;useItem();var movingLadder=objects.find(o=>o.type==="ladder");keys={w:true};for(let i=0;i<110;i++)update()');
assert(run('movingLadder.support===ladderPlatform&&Math.abs(movingLadder.y+movingLadder.h-ladderPlatform.y)<.01'),'Ladders can be placed on platforms and follow their movement');
run('jump();keys={};for(let i=0;i<25;i++)update();draw()');assert(run('player.y<25'),'Jumping from a high ladder is not clamped down by an invisible ceiling');
run('prepareFreeLadder();obstacles.push({type:"crate",x:480,y:ground-90,w:160,h:90});player.y=ground-90-player.h;useItem()');assert(run('objects.some(o=>o.type==="ladder"&&o.y+o.h===ground-90)'),'A ladder can also stand on a box');
run('prepareFreeLadder();obstacles.push({type:"crate",x:0,y:0,w:levelWidth,h:ground});useItem()');assert(run('player.buildInventory.includes("ladderKit")&&!objects.some(o=>o.type==="ladder")'),'Impossible overlapping placements retain the ladder kit');
assert(run('LEVEL_SETTINGS[1].width===12000*.75&&LEVEL_SETTINGS[2].width===14000*.75&&LEVEL_SETTINGS[3].width===15000*.75&&LEVEL_SETTINGS[0].width===11000'),'All three main worlds are a quarter shorter while the complete tutorial is retained');
for(const world of [1,2,3]){run('selectedLevel='+world+';reset();var safeKey=objects.find(o=>o.type==="key")');assert(run('[...lavaPits,...cliffs].every(g=>safeKey.x+safeKey.w<=g.x||safeKey.x>=g.x+g.w)'),'The shortened world '+world+' has a safely reachable key')}
run('selectedBuddy=0;selectedLevel=1;reset()');
// New worlds are directly accessible, not merely progression placeholders.
run('screen="levelselect";draw()');assert(run('menuButtons.filter(b=>/^level[1-7]$/.test(b.id)).length===7'),'All seven world cards are visible');
for(const world of [4,5]){handlers.global.keydown({key:String(world),repeat:false,preventDefault(){}});assert(run('selectedLevel==='+world+'&&screen==="choose"'),'Keyboard selects the new world '+world);run('reset();draw()');assert(run('enemies.some(e=>e.type==="pudding")'),'Pudding appears from World 4 onward');run('screen="levelselect"')}
run('selectedLevel=5;reset();enemies=[];objects=[];lavaPits.length=0;cliffs.length=0;obstacles.length=0;platforms.length=0;terraces.length=0;player.x=500;player.y=ground-player.h;player.onGround=true;jump();var moonFrames=0,moonPeak=player.y;while(!player.onGround&&moonFrames<200){update();moonPeak=Math.min(moonPeak,player.y);moonFrames++}draw()');
assert(run('Math.abs(worldGravity()-.58/6)<1e-9&&moonFrames>130&&moonFrames<180&&ground-player.h-moonPeak>260'),'Moon has one-sixth gravity, higher jumps and slow falling');
run('selectedLevel=4;reset();enemies=[];objects=[];lavaPits.length=0;cliffs.length=0;obstacles.length=0;platforms.length=0;terraces.length=0;var jelly={type:"pudding",x:500,y:ground-46,w:58,h:46,hp:3,damage:0,shoot:9999,dead:0,vy:0};enemies=[jelly];player.puddingImmunity=0;trapInPudding(jelly);keys={d:true};update();draw()');
assert(run('player.trappedIn===jelly&&player.vx===0'),'Pudding traps the player instead of letting movement escape');
for(let i=0;i<5;i++)run('jump()');assert(run('player.trappedIn&&player.escapeJumps===5'),'Five jumps are not enough to escape');
handlers.global.keydown({key:' ',repeat:true,preventDefault(){}});assert.equal(run('player.escapeJumps'),5,'Holding Space cannot fake repeated jumps');run('jump();keys={};update()');assert(run('!player.trappedIn&&player.vy<0&&player.puddingImmunity>0'),'Six deliberate jumps free the player with brief re-trap protection');
for(const world of [1,2,3]){run('selectedLevel='+world+';reset()');assert(run('enemies.every(e=>e.type!=="pudding")'),'Earlier real worlds do not contain pudding')}
// Weather is delayed, localized, low-damage and paused along with gameplay.
run('selectedLevel=3;reset();for(let i=0;i<1799;i++)updateKitchenWeather()');assert(run('!kitchenWeather.active&&!objects.some(o=>o.type==="cheeseDrop")'),'No cheese rain before 30 seconds');
run('screen="paused";var weatherTime=kitchenWeather.time;for(let i=0;i<120;i++)update()');assert.equal(run('kitchenWeather.time'),run('weatherTime'),'Pausing does not advance the rain timer');
run('screen="play";updateKitchenWeather();draw()');assert(run('kitchenWeather.active&&kitchenWeather.w===360&&objects.filter(o=>o.type==="cheeseDrop").every(o=>o.x>=kitchenWeather.x&&o.x+o.w<=kitchenWeather.x+kitchenWeather.w)'),'The first shower starts after 30 seconds, in only one small patch');
run('player.hp=20;for(let i=0;i<10;i++){player.inv=0;updateCheeseDrop({x:player.x,y:player.y,w:14,h:14,vy:0,life:150})}');assert.equal(run('player.hp'),18,'Each cheese hit is exactly 0.2 HP, without floating-point HUD artifacts');
run('for(let i=0;i<600;i++)updateKitchenWeather()');assert(run('!kitchenWeather.active&&kitchenWeather.nextAt-kitchenWeather.time>=1799&&kitchenWeather.nextAt-kitchenWeather.time<=2700'),'Short showers are followed by frequent 30–45 second dry intervals');
run('var kitchenTime=kitchenWeather.time;enterSewer({exitX:2500});for(let i=0;i<120;i++)updateKitchenWeather();exitSewer()');assert.equal(run('kitchenWeather.time'),run('kitchenTime'),'Kitchen rain does not run underground');
for(const world of [1,2,4,5]){run('selectedLevel='+world+';reset();for(let i=0;i<4000;i++)updateKitchenWeather()');assert(run('!kitchenWeather.active'),'Cheese rain is exclusive to Kitchen, apart from the training exercise')}
// Every boss has its own body/attacks and one avoidable half-HP special.
for(const world of [3,4,5,7]){
 run('selectedLevel='+world+';reset();startBoss();player.inv=100000;var bossStartY=boss.y;for(let i=0;i<180;i++){update();draw()}');
 assert(run('boss.art==='+JSON.stringify({3:'boss-croissant',4:'boss-popcorn',5:'boss-bigmac',7:'boss-cotton'}[world])),'The correct boss starts in World '+world);
 if(world===3)assert(run('boss.flying&&boss.y!==bossStartY&&boss.y+boss.h<ground&&objects.some(o=>o.type==="stormBolt")'),'Kitchen croissant flies and fires lightning');
 if(world===7)assert(run('boss.flying&&boss.max===70&&boss.y!==bossStartY&&objects.some(o=>o.type==="sugarPuff")'),'Cloud cotton candy flies and fires sugar puffs');
 if(world===4)assert(run('objects.some(o=>o.type==="explosivePopcorn")'),'Popcorn shoots explosive kernels');
 if(world===5)assert(run('objects.some(o=>o.type==="pickleShot")'),'Triple Bigmac shoots its own projectiles');
 run('boss.hp=boss.max/2;updateBossFight(player.y+player.h)');assert(run('boss.phase===2&&boss.heavyCharge===89&&boss.heavyUsed'),'Half HP starts the telegraphed special');
 run('for(let i=0;i<89;i++)updateBossSpecial();var special=objects.find(o=>o.type==="bossHeavyWave");player.x=special.x+special.w/2-player.w/2;player.y=ground-player.h;player.hp=20;player.inv=0;updateBossProjectile(special)');assert.equal(run('player.hp'),10,'The marked special deals 10 HP in World '+world);
 run('player.inv=100000;for(let i=0;i<300;i++)updateBossFight(player.y+player.h)');assert.equal(run('boss.heavyCount'),1,'The powerful special is used only once per fight');
 run('boss.hp=0;for(let i=0;i<76;i++)update();draw()');assert.equal(run('screen'),'victory','The new boss can be defeated');
 assert.equal(run('victoryButtons.find(b=>b.id==="next").disabled'),world===17,'Only the final world disables further progression');
}
run('selectedLevel=4;reset();startBoss();objects=[];fireExplosivePopcorn(boss);var kernel=objects[0];kernel.x=player.x;kernel.y=player.y;kernel.fuse=1;player.hp=20;player.inv=0;updateBossProjectile(kernel);var blast=objects.find(o=>o.type==="popcornBlast");drawBossProjectile(blast);updateBossProjectile(blast)');assert(run('kernel.exploded&&kernel.life===0&&player.hp===18'),'Explosive popcorn creates a real 2-HP blast');
run('player.hp=20;player.inv=0;player.x=blast.cx+blast.radius+20;updateBossProjectile({...blast,life:14})');assert.equal(run('player.hp'),20,'Moving beyond the blast radius avoids popcorn damage');
// Secrets can contain loot, a shortcut, or a genuine hidden sewer entrance.
for(const kind of ['loot','shortcut','gully']){
 run('selectedLevel=1;reset();selected=4;var room=secretPassages[0];room.kind='+JSON.stringify(kind)+';player.x=room.x-65;player.y=room.base-player.h;player.cooldown=0;ability()');
 assert(run('room.open'),'All secret variants can be opened');
 if(kind==='loot')assert(run('objects.some(o=>o.type==="material"&&o.y>room.base)'),'The loot variant still rewards items');
 else assert(run('!objects.some(o=>["material","looseItem"].includes(o.type)&&o.x>room.x&&o.x<room.x+room.w&&o.y>room.base)'),'Non-loot passages do not automatically contain items');
 if(kind==='shortcut'){run('var portal=objects.find(o=>o.type==="secretExit");player.x=portal.x;player.y=portal.y+portal.h-player.h;player.hasKey=true;var oldBag=JSON.stringify(player.bag);interactWorld()');assert(run('player.x===portal.exitX&&player.hasKey&&JSON.stringify(player.bag)===oldBag'),'W uses the shortcut while preserving inventory and key');assert(run('objects.every(o=>o.type!=="greatWall"||o.x<=room.x||o.x>=portal.exitX)'),'Shortcuts cannot bypass required great walls')}
 if(kind==='gully'){run('var secretHatch=objects.find(o=>o.hidden);player.x=secretHatch.x;player.y=secretHatch.y+10-player.h;interactWorld();draw()');assert(run('undergroundTrip&&undergroundTrip.hidden&&levelWidth===2220&&objects.some(o=>o.type==="sewerTreasure")'),'The hidden gully enters a real sewer with an extra secret chamber');run('exitSewer()')}
}
const sewerThemes=new Set();for(const world of [1,2,3,4,5]){run('selectedLevel='+world+';reset();enterSewer({exitX:2500});draw()');sewerThemes.add(run('undergroundTrip.theme'));assert(run('Number.isInteger(undergroundTrip.styleSeed)&&obstacles.length===2'),'Sewers have world-specific decor and varied obstacles');run('exitSewer()')}assert.equal(sewerThemes.size,5,'All real-world sewers have distinct themes');
run('selectedLevel=0;reset();draw()');assert(run('TUTORIAL_LESSONS.length>=24&&secretPassages.some(r=>r.kind==="shortcut")&&secretPassages.some(r=>r.kind==="gully")&&enemies.some(e=>e.type==="pudding")'),'Training includes the new secret variants and pudding');
run('player.x=5650;interactWorld();update();draw()');assert(run('kitchenWeather.active&&kitchenWeather.practice'),'Training offers an immediate cheese-rain practice');
run('player.x=10100;interactWorld()');assert(run('player.practiceMoon&&Math.abs(worldGravity()-.58/6)<1e-9'),'Training lets players test Moon gravity');run('interactWorld()');assert(run('!player.practiceMoon'),'Moon practice can be switched off');
for(const world of [4,5]){run('selectedLevel='+world+';reset();draw();var newKey=objects.find(o=>o.type==="key")');assert(run('[...lavaPits,...cliffs].every(g=>newKey.x+newKey.w<=g.x||newKey.x>=g.x+g.w)'),'New-world keys are safely placed')}
assert(run('LEVEL_SETTINGS[5].width===25500&&LEVEL_SETTINGS[5].enemies===46'),'Moon is twice as long, with preserved enemy density');
run('selectedLevel=5;reset();player.inventory=["springKit"];player.inventoryCategory="powers";player.inventoryIndex=0;useItem()');assert(run('player.jumpBoost===0&&player.inventory.includes("springKit")'),'Even an injected spring cannot be activated on the Moon');
run('player.inventory=[];player.bag={spoon:10,wood:10,stone:10};openWorkbench();selectedRecipe=5;var moonBag=JSON.stringify(player.bag);craftItem();draw()');assert(run('!canCraft(RECIPES[5])&&player.inventory.length===0&&JSON.stringify(player.bag)===moonBag'),'Moon spring recipe is disabled without spending ingredients');
run('toggleInventory();for(let i=0;i<150;i++){player.inventory=[];collectLunchbox({x:500,y:400,w:64,h:50});if(player.inventory.includes("springKit"))throw Error("Forbidden Moon loot")}');
run('player.inventory=["springKit","gum"];player.jumpBoost=100;enforceMoonItemRules()');assert(run('player.jumpBoost===0&&player.inventory.length===1&&player.inventory[0]==="gum"'),'Entering Moon removes carried springs and active spring effects');
const sewerObstacleKinds=[];for(const world of [1,2,3,4,5]){run('selectedLevel='+world+';reset();enterSewer({exitX:2500});draw()');sewerObstacleKinds.push(run('obstacles.map(o=>o.type).join(",")'));run('exitSewer()')}assert.equal(new Set(sewerObstacleKinds).size,5,'Every real-world sewer has different actual obstacle types');
for(const name of ['pudding','boss-cotton','boss-popcorn','boss-bigmac','boss-croissant'])run('drawDessertFallback('+JSON.stringify(name)+',100,100,90,120)');
// Aquatic world, taco enemies and permanently marked entrance hatches.
run('screen="levelselect";selectedLevel=5;draw()');handlers.global.keydown({key:'ArrowRight',repeat:false,preventDefault(){}});assert.equal(run('selectedLevel'),6,'Arrow navigation reaches Underwater');
handlers.global.keydown({key:'6',repeat:false,preventDefault(){}});assert(run('screen==="choose"&&selectedLevel===6'),'Keyboard 6 selects Underwater');
run('reset();draw()');assert(run('levelWidth===9667&&enemies.length===21&&isSwimming()'),'Underwater is one-third shorter with adjusted enemy density');
assert(run('objects.filter(o=>o.waterHealing).length>=6'),'The shortened underwater map has many extra healing mushrooms');
assert(run('objects.filter(o=>o.waterHealing).every(o=>![...lavaPits,...cliffs].some(g=>o.x+o.w>g.x&&o.x<g.x+g.w)&&!solidTerrain().some(s=>rect(o,s)))'),'Extra mushrooms are placed safely');
run('screen="levelselect";draw();var waterCard=menuButtons.find(b=>b.id==="level6")');handlers.canvas.pointerdown({pointerId:309,clientX:run('waterCard.x+waterCard.w/2'),clientY:run('waterCard.y+waterCard.h/2'),preventDefault(){}});assert(run('selectedLevel===6&&screen==="choose"'),'Touch selects the underwater card');
run('selectedLevel=6;reset();enemies=[];objects=[];obstacles.length=0;platforms.length=0;lavaPits.length=0;cliffs.length=0;terraces.length=0;player.x=500;player.y=340;player.inv=10000;keys={w:true};for(let i=0;i<50;i++)update();var upperSwimY=player.y;draw()');assert(run('player.y<240&&!player.onGround'),'W swims upward in midwater');
run('keys={s:true};for(let i=0;i<80;i++)update()');assert(run('player.y>upperSwimY+90'),'S dives down');
run('keys={};player.y=300;player.vy=0;for(let i=0;i<60;i++)update()');assert(run('player.y<320&&!player.onGround'),'Neutral swimming sinks only gently, rather than using land gravity');run('jump()');assert(run('player.vy<0&&!player.onGround'),'Space gives a swimming stroke without needing ground');
run('keys={w:true};for(let i=0;i<200;i++)update()');assert(run('player.y>=WATER_TOP'),'Swimmers cannot leave the top of the water');
run('keys={s:true};for(let i=0;i<200;i++)update();keys={};draw()');assert(run('player.y+player.h<=ground+.01&&buttons.some(b=>b.id==="climbUp")&&buttons.some(b=>b.id==="climbDown")'),'Water has a bottom boundary and permanent up/down touch controls');
for(let buddy=0;buddy<4;buddy++){run('selectedBuddy='+buddy+';selectedLevel=6;reset();objects=[];enemies=[];obstacles.length=0;platforms.length=0;lavaPits.length=0;cliffs.length=0;terraces.length=0;player.x=500;player.y=200;keys={};for(let i=0;i<80;i++)update();draw()');assert(run('Math.abs(companion.y-player.y)<35&&companion.y<300&&!companion.onGround'),'Every companion swims, including the sausage dog')}
run('selectedBuddy=0;selectedLevel=6;reset();player.y=160;player.inv=100000;var seaCount=enemies.length;for(let i=0;i<120;i++)update();draw()');assert(run('enemies.length===seaCount&&enemies.every(e=>!e.onGround&&e.y<floorAtX(e.x)-e.h-40)'),'All underwater enemies swim instead of falling into gaps');
for(const world of [1,2,3,4,5,6,7]){run('selectedLevel='+world+';reset();draw()');assert.equal(run('enemies.some(e=>e.type==="taco")'),world>=4,'Tacos start at World 4, not earlier');if(world>=4){run('enterSewer({exitX:2500});draw()');assert(run('enemies.some(e=>e.type==="taco")'),'Tacos also inhabit later-world sewers');run('exitSewer()')}}
run('selectedLevel=4;reset();objects=[];enemies=[{type:"taco",x:400,y:ground-42,w:52,h:42,hp:2,damage:1,shoot:1,dead:0,vy:0}];obstacles.length=0;platforms.length=0;lavaPits.length=0;cliffs.length=0;terraces.length=0;player.x=600;player.y=ground-player.h;keys={};update()');assert(run('objects.some(o=>o.taco)'),'Taco shoots recognizable green filling');
const hatchMoves=[],oldMoveTo=canvasContext.moveTo;canvasContext.moveTo=(...args)=>hatchMoves.push(args);run('selectedLevel=1;reset();drawManhole({type:"manhole",x:0,y:0,w:70,h:12})');assert(hatchMoves.some(a=>a[1]===-113),'Entrance arrow is painted even outside training');hatchMoves.length=0;run('drawManhole({type:"manholeOutlet",x:0,y:0,w:70,h:12})');assert(!hatchMoves.some(a=>a[1]===-113),'Outlet is not mislabeled as an entrance');canvasContext.moveTo=oldMoveTo;
run('selectedLevel=6;reset();player.hasKey=true;enterSewer({exitX:2500});var savedSeaBuddy=companion.type;for(let i=0;i<30;i++)update();draw()');assert(run('isSwimming()&&obstacles.some(o=>o.type==="reefBlock")&&obstacles.some(o=>o.type==="anchorBlock")'),'Underwater sewer has flooded swimming and its own obstacles');run('exitSewer()');assert(run('isSwimming()&&player.hasKey&&companion.type===savedSeaBuddy'),'Sewer return preserves the underwater world, key and companion');
run('selectedLevel=6;reset();startBoss();player.inv=100000;var fishStartY=boss.y;for(let i=0;i<180;i++){update();draw()}');assert(run('boss.art==="boss-fishstick"&&boss.swimming&&boss.h>=200&&boss.h>boss.w*2&&boss.y!==fishStartY&&objects.some(o=>o.type==="crumbShot")'),'Giant fish stick swims and shoots real panade projectiles');
run('boss.hp=boss.max/2;updateBossFight(player.y+player.h);var fixedSeaX=boss.heavyTarget,fixedSeaY=boss.heavyTargetY;player.x+=100;player.y-=100;drawBossWarning();for(let i=0;i<89;i++)updateBossSpecial();var seaWave=objects.find(o=>o.type==="bossHeavyWave")');assert(run('boss.heavyTarget===fixedSeaX&&boss.heavyTargetY===fixedSeaY&&seaWave.h===250&&boss.heavyCount===1'),'Half-HP bubble special has a fixed, telegraphed two-dimensional area');
run('player.x=seaWave.x+125-player.w/2;player.y=seaWave.y+125-player.h/2;player.hp=20;player.inv=0;updateBossProjectile(seaWave);drawBossHeavyWave(seaWave)');assert.equal(run('player.hp'),10,'Fish-stick special deals 10 HP');
run('player.x=seaWave.x+240;player.y=seaWave.y+230;player.hp=20;player.inv=0;updateBossProjectile({...seaWave,life:25})');assert.equal(run('player.hp'),20,'Swimming outside the circular burst avoids damage, including rectangular corners');
run('for(let i=0;i<200;i++)updateBossSpecial()');assert.equal(run('boss.heavyCount'),1,'Fish-stick special is only used once');
run('player.inv=100000;boss.hp=0;for(let i=0;i<76;i++)update();draw()');assert(run('screen==="victory"&&!victoryButtons.find(b=>b.id==="next").disabled'),'Underwater now continues to the cloud world');
run('selectedLevel=5;reset();startBoss();boss.hp=0;for(let i=0;i<76;i++)update();victoryAction("next")');assert(run('level===6&&isSwimming()'),'Moon victory continues into Underwater');
for(const name of ['taco','boss-fishstick'])assert(fs.existsSync('assets/sprites/'+name+'.svg'),'New actor has its own offline SVG');
const fishDrawing=fs.readFileSync('assets/sprites/boss-fishstick.svg','utf8');assert(fishDrawing.includes('fishstickCrustClip')&&fishDrawing.includes('M52 126')&&fishDrawing.includes('M50 58'),'The reference-style fish stick has crumb texture, black stick legs and a tooth-grid grin');
run('selectedLevel=6;reset();startBoss();player.inv=100000;for(let i=0;i<600;i++){update();if(boss.y<75||boss.y+boss.h>ground-18+.01||boss.x<240||boss.x+boss.w>W-25+.01)throw Error("Tall fish-stick body left its swim bounds")}drawAquaticFallback("boss-fishstick",100,100,210,264);draw();var fishBellyX=boss.x+boss.w/2,fishBellyY=boss.y+boss.h-20;damageNear(fishBellyX,fishBellyY,25,4)');assert(run('boss.hp===boss.max-4&&findBossTarget(fishBellyX,fishBellyY,10)===boss'),'Explosions and companions can target the long lower body, not only its head');
// Reference-style maki rolls begin at World 5, including its later-world sewers.
for(const world of [0,1,2,3,4,5,6,7]){
 run('selected=0;selectedBuddy=0;selectedLevel='+world+';reset();draw()');
 assert.equal(run('enemies.some(e=>e.type==="maki")'),world>=5,'Maki rolls appear only from World 5');
 if(world>=5)assert(run('enemies.filter(e=>e.type==="maki").every(e=>e.hp===2&&e.damage===1&&e.w===48&&e.h===58)'),'Maki rolls have two HP and a sprite-matched body');
 if(world>0){run('enterSewer({exitX:2500});draw()');assert.equal(run('enemies.some(e=>e.type==="maki")'),world>=5,'Maki rolls also appear only in later-world sewers');run('exitSewer()')}
}
assert(fs.existsSync('assets/sprites/maki.svg'),'Maki has an offline cartoon SVG');
run('drawAquaticFallback("maki",100,100,70,72);selectedLevel=5;reset();objects=[];obstacles.length=0;platforms.length=0;lavaPits.length=0;cliffs.length=0;terraces.length=0;enemies=[{type:"maki",x:160,y:ground-58,w:48,h:58,hp:2,damage:1,shoot:1000,slow:0,dead:0}];player.x=160;player.y=ground-58-player.h-3;player.vy=4;update();draw()');
assert(run('enemies.length===1&&enemies[0].hp===1&&player.vy<0'),'First stomp hurts the maki and bounces the player');
run('player.y=enemies[0].y-player.h-3;player.vy=4;update();draw()');assert(run('enemies.length===0&&defeated.some(d=>d.art==="maki")'),'Second stomp defeats the maki with its own animation');
run('selectedLevel=5;reset();objects=[];obstacles.length=0;platforms.length=0;lavaPits.length=0;cliffs.length=0;terraces.length=0;player.inv=0;enemies=[{type:"maki",x:150,y:ground-58,w:48,h:58,hp:2,damage:1,shoot:1000,slow:0,dead:0}];update()');assert.equal(run('player.hp'),19,'Maki side contact deals one HP');
run('selectedLevel=6;reset();enemies=enemies.filter(e=>e.type==="maki");var makiCount=enemies.length;player.y=160;player.inv=100000;for(let i=0;i<120;i++)update();draw()');assert(run('makiCount>0&&enemies.length===makiCount&&enemies.every(e=>!e.onGround&&e.y<floorAtX(e.x)-e.h-40)'),'Maki rolls swim safely under water');
// Marshmallow: separate Power, craft/loot, falling-only held-key/touch glide and expiry.
assert(fs.existsSync('assets/sprites/marshmallow.svg'),'Marshmallow is a local cartoon sprite');
run('selectedLevel=1;reset();enemies=[];objects=[];obstacles.length=0;platforms.length=0;terraces.length=0;lavaPits.length=0;cliffs.length=0;player.inventory=["marshmallow"];useItem();player.x=650;player.y=120;player.vy=8;player.onGround=false;keys={" ":true};var glideStart=player.y;for(let i=0;i<30;i++)update();drawMarshmallowFallback(100,100,50,65);draw()');
assert(run('player.marshmallowTime===870&&player.inventory.length===0&&player.gliding&&player.vy<=1.3&&player.y-glideStart<40'),'Consumed marshmallow lasts 15 seconds and glides slowly while Space is held');
handlers.global.keyup({key:' '});run('for(let i=0;i<10;i++)update()');assert(run('!player.gliding&&player.vy>5'),'Releasing Space resumes normal falling');
run('player.y=120;player.vy=-6;keys={" ":true};update()');assert(run('!player.gliding&&player.vy< -5'),'Marshmallow never cancels the rising part of a jump');
run('keys={};player.y=120;player.vy=8;player.onGround=false;draw()');handlers.canvas.pointerdown({pointerId:901,clientX:862,clientY:560,preventDefault(){}});run('update()');assert(run('keys.touchJump&&player.gliding'),'Holding the touch jump button also glides');handlers.canvas.pointerup({pointerId:901});run('update()');assert(run('!keys.touchJump&&!player.gliding'),'Releasing touch ends glide');
run('player.marshmallowTime=1;player.y=120;player.vy=8;keys={" ":true};update()');assert(run('player.marshmallowTime===0&&!player.gliding&&player.vy>8'),'Expiry restores normal gravity even while jump is held');
run('selectedLevel=5;reset();player.bag.sugar=3;openWorkbench();selectedRecipe=RECIPES.findIndex(r=>r.item==="marshmallow");craftItem();draw()');assert(run('player.inventory.includes("marshmallow")&&player.buildInventory.length===0&&player.bag.sugar===0&&inventoryButtons.filter(b=>b.id.startsWith("recipe")).every(b=>b.y+b.h<=305)'),'Marshmallow crafts for three sugar, is allowed on the Moon and its recipe fits the menu');
run('selectedLevel=0;reset();player.x=1850;interactWorld();interactWorld();interactWorld()');assert(run('player.inventory.includes("marshmallow")'),'Tutorial power station also supplies marshmallow');run('player.x=2200;interactWorld();draw()');assert(run('worldWind.active&&worldWind.practice&&player.inventory.includes("marshmallow")'),'Tutorial offers a marshmallow/wind exercise');
// Wind: World 3+, precisely five seconds every ninety seconds of active overworld play.
for(const world of [1,2,3,4,5,6]){
 run('selectedLevel='+world+';reset();for(let i=0;i<5399;i++)updateWorldWind()');assert(run('!worldWind.active'),'No wind before ninety seconds');run('updateWorldWind()');assert.equal(run('worldWind.active'),world>=3,'Wind starts only from World 3');
 if(world>=3){assert.equal(run('worldWind.remaining'),300,'Wind lasts five seconds');run('for(let i=0;i<299;i++)updateWorldWind()');assert(run('worldWind.active&&worldWind.remaining===1'),'Wind is still active until its final frame');run('updateWorldWind()');assert(run('!worldWind.active'),'Wind ends at five seconds');run('for(let i=0;i<5100;i++)updateWorldWind()');assert(run('worldWind.active&&worldWind.time===10800'),'Wind repeats ninety seconds after its previous start')}
}
run('selectedLevel=3;reset();startWorldWind();var normalWindMove=windMovement(3);player.inventory=["marshmallow"];useItem();var lightWindMove=windMovement(3);enemies=[];objects=[];obstacles.length=0;platforms.length=0;terraces.length=0;lavaPits.length=0;cliffs.length=0;player.x=650;player.y=120;player.vy=3;player.onGround=false;keys={d:true};var windyStartX=player.x;for(let i=0;i<20;i++)update();draw()');assert(run('normalWindMove>0&&normalWindMove<3&&lightWindMove<0&&player.x<windyStartX&&player.vy<0'),'Wind slows ordinary movement and blows a light marshmallow player backwards and upwards');
run('screen="paused";var pausedWind=worldWind.time,pausedBuff=player.marshmallowTime;for(let i=0;i<120;i++){update();updateWorldWind()}');assert(run('worldWind.time===pausedWind&&player.marshmallowTime===pausedBuff'),'Pause freezes wind and marshmallow timers');
run('screen="play";var savedWindTime=worldWind.time;enterSewer({exitX:2500});for(let i=0;i<120;i++)updateWorldWind()');assert(run('worldWind.time===savedWindTime&&windMovement(3)===3'),'Sewers neither advance wind nor blow the player');run('exitSewer();startBoss();for(let i=0;i<120;i++)updateWorldWind()');assert(run('worldWind.time===savedWindTime&&windMovement(3)===3'),'Boss rooms have no wind and freeze its clock');
// Hidden gullies have persistent, one-time secret rewards and a five-percent bonus follower.
run('selectedLevel=1;selectedBuddy=0;selected=0;reset();var chanceRandom=Math.random,buddyRolls=0;for(let i=0;i<1000;i++){Math.random=()=>i/1000;var sample=hiddenSewerReward({hidden:true});if(sample.kind==="buddy")buddyRolls++}Math.random=chanceRandom');assert.equal(run('buddyRolls'),50,'Precisely five percent of eligible rolls produce a second companion');
run('var testHatch={hidden:true,exitX:2500};var rewardRandom=Math.random;Math.random=()=>.04999;enterSewer(testHatch);Math.random=rewardRandom;var fixedReward=testHatch.secretReward;player.x=1950;player.y=ground-player.h;var originalCompanion=companion;draw();interactWorld()');assert(run('fixedReward.kind==="buddy"&&fixedReward.collected&&secretCompanion&&secretCompanion.type!==companion.type&&player.buddyIndex===0&&companion===originalCompanion'),'The rare chest recruits a different second follower without replacing the primary');
run('var bonusIdentity=secretCompanion.type;selectedBuddy=3;exitSewer();enterSewer(testHatch);draw()');assert(run('testHatch.secretReward===fixedReward&&objects.find(o=>o.type==="sewerTreasure").reward.collected&&secretCompanion.type===bonusIdentity'),'Revisiting the same hatch neither rerolls nor duplicates the reward');run('exitSewer();startBoss();draw()');assert(run('companion.type==="sponge"&&secretCompanion.type===bonusIdentity'),'Both companions survive sewer and boss transitions despite menu-selection changes');
run('selectedLevel=6;reset();recruitSecretBuddy(1);enemies=[];objects=[];obstacles.length=0;platforms.length=0;lavaPits.length=0;cliffs.length=0;terraces.length=0;player.x=500;player.y=180;for(let i=0;i<80;i++)update();draw()');assert(run('!secretCompanion.onGround&&secretCompanion.y<300&&Math.abs(secretCompanion.x-companion.x)>35'),'The bonus dog swims and follows at a visibly separate distance');
run('selectedLevel=1;selectedBuddy=0;reset();recruitSecretBuddy(1);player.x=300;secretCompanion.x=player.x-125;secretCompanion.y=ground-40;secretCompanion.onGround=true;enemies=[{type:"gummy",x:180,y:ground-42,w:42,h:42,hp:3,damage:1,shoot:1000,dead:0}];updateCompanions()');assert(run('enemies[0].hp===2.5&&secretCompanion.cooldown===180'),'The bonus companion really fights with the original half-HP damage and cooldown');assert.equal(run('recruitSecretBuddy(2)'),false,'No third companion can be recruited');run('reset()');assert(run('player.secretBuddyIndex===null&&secretCompanion===null'),'A new level removes the bonus companion');
for(const [roll,kind] of [[.05,'powers'],[.5,'materials'],[.9,'healing']]){
 run('selectedLevel=1;reset();var commonHatch={hidden:true,exitX:2500};var stashRandom=Math.random;Math.random=()=>'+roll+';enterSewer(commonHatch);Math.random=stashRandom;player.x=1950;player.y=ground-player.h;player.hp=10;interactWorld();draw()');assert.equal(run('commonHatch.secretReward.kind'),kind,'Other rolls give distinct secret stash types');
 if(kind==='powers'){
  assert(run('objects.filter(o=>o.secretRewardSlot).length===2'),'Power chest drops marshmallow and wasabi');run('var stashItem=objects.find(o=>o.secretRewardSlot);player.x=stashItem.x;player.y=stashItem.y;collectWorldLoot(stashItem);exitSewer();enterSewer(commonHatch)');assert(run('objects.filter(o=>o.secretRewardSlot).length===1'),'Uncollected power loot survives sewer revisits, collected loot is not duplicated');
 }else if(kind==='materials'){assert(run('player.bag.sugar===6&&player.bag.wood===6&&player.bag.spoon===6'),'Material chest grants a useful construction/power stash');run('exitSewer();enterSewer(commonHatch);player.x=1950;player.y=ground-player.h;interactWorld()');assert.equal(run('player.bag.sugar'),6,'Material chest cannot be farmed by reopening it')}
 else assert.equal(run('player.hp'),15,'Healing chest restores five HP');run('exitSewer()');
}
run('selectedLevel=1;reset();enterSewer({exitX:2500})');assert(run('levelWidth===1800&&!objects.some(o=>o.type==="sewerTreasure")'),'Ordinary gullies remain normal, without hidden-only treasure');
run('selectedLevel=3;reset();objects=[];startCheeseShower(500);for(let i=0;i<60;i++)updateKitchenWeather();draw()');assert(run('objects.filter(o=>o.type==="cheeseDrop").length===30&&kitchenWeather.w===360&&kitchenWeather.remaining===540'),'Heavy cheese rain pours thirty pieces per second in the same localized ten-second shower');
run('selectedLevel=1;selectedBuddy=0;selected=0;reset();objects=[];obstacles.length=0;platforms.length=0;terraces.length=0;lavaPits.length=0;cliffs.length=0;player.inv=0;keys={};enemies=[{type:"honey",x:150,y:ground-42,w:42,h:42,hp:3,damage:1,shoot:1000,dead:0,vy:0}];update();draw()');assert(run('player.hp===19&&player.slow===180&&player.honeyTime===180'),'Honey side contact damages and sticks for three seconds');
run('enemies=[];player.vx=0;keys={d:true};var stickyX=player.x;for(let i=0;i<30;i++)update();var stickyTravel=player.x-stickyX;for(let i=0;i<150;i++)update();player.vx=0;var freeX=player.x;for(let i=0;i<30;i++)update()');assert(run('player.slow===0&&player.honeyTime===0&&player.x-freeX>stickyTravel*2'),'Sticky honey really slows movement, then wears off');
run('reset();objects=[];obstacles.length=0;platforms.length=0;terraces.length=0;lavaPits.length=0;cliffs.length=0;keys={};enemies=[{type:"honey",x:160,y:ground-42,w:42,h:42,hp:2,damage:1,shoot:1000,dead:0,vy:0}];player.x=160;player.y=ground-42-player.h-3;player.vy=4;update()');assert(run('enemies[0].hp===1&&player.slow===0&&player.honeyTime===0&&player.vy<0'),'A successful honey stomp does not apply slowing');
run('selectedLevel=6;reset();objects=[];obstacles.length=0;platforms.length=0;terraces.length=0;lavaPits.length=0;cliffs.length=0;player.inv=0;player.x=150;player.y=200;keys={};enemies=[{type:"honey",x:150,y:200,w:42,h:42,hp:3,damage:1,shoot:1000,dead:0,vy:0}];update()');assert(run('player.slow===180&&player.honeyTime===180'),'Swimming honey enemies also slow the player');
// Cloud world: reachable selection/progression, themed platform physics, boss swap and power indicators.
run('screen="levelselect";selectedLevel=6;draw()');handlers.global.keydown({key:'ArrowRight',repeat:false,preventDefault(){}});assert.equal(run('selectedLevel'),7,'Arrow navigation reaches the cloud world');handlers.global.keydown({key:'7',repeat:false,preventDefault(){}});assert(run('screen==="choose"&&selectedLevel===7'),'Keyboard 7 selects the cloud world');
run('reset();draw()');assert(run('level===7&&levelWidth===12500&&enemies.length===26&&!isSwimming()&&worldGravity()===.58&&lavaPits.length===0&&cliffs.length>0&&platforms.some(p=>p.cloudCookie)&&platforms.some(p=>p.cloudBun)&&objects.filter(o=>o.cloudPower).length>=3'),'Cloud world is a real land platformer with buns, crumble cookies, sky gaps and glide powers');
assert(run('cliffs.every(g=>platforms.some(p=>p.cloudBun&&p.x>g.x&&p.x+p.w<g.x+g.w))'),'Every cloud gap has a reachable stable intermediate bun');
run('screen="levelselect";draw();var cloudCard=menuButtons.find(b=>b.id==="level7")');handlers.canvas.pointerdown({pointerId:702,clientX:run('cloudCard.x+cloudCard.w/2'),clientY:run('cloudCard.y+cloudCard.h/2'),preventDefault(){}});assert(run('screen==="choose"&&selectedLevel===7'),'Touch can select the seventh cloud-world card');
run('selectedLevel=6;reset();startBoss();boss.hp=0;for(let i=0;i<76;i++)update();victoryAction("next")');assert(run('level===7&&isCloudWorld()'),'Underwater victory really starts Cloud Bakery');
run('startBoss();boss.hp=0;for(let i=0;i<76;i++)update();draw()');assert(run('screen==="victory"&&!victoryButtons.find(b=>b.id==="next").disabled'),'Cloud world now continues into the ten new worlds');
run('selectedLevel=7;reset();enemies=[];objects=[];obstacles.length=0;platforms.length=0;cliffs.length=0;terraces.length=0;var cookie={x:500,y:405,cloudHomeY:405,w:100,h:20,cloudCookie:true,broken:0,crumbleFrames:0};platforms.push(cookie);player.x=510;player.y=405-player.h;player.onGround=true;player.vy=0;for(let i=0;i<44;i++)updateCloudPlatforms()');assert(run('cookie.broken===0&&cookie.crumbleFrames===44'),'Cookie warns before collapsing');run('updateCloudPlatforms();update();draw()');assert(run('cookie.broken>0&&cookie.y>WORLD_BOTTOM&&!player.onGround&&player.vy>0'),'Crumbling cookie actually stops supporting the player');run('for(let i=0;i<240;i++)updateCloudPlatforms()');assert(run('cookie.broken===0&&cookie.y===405'),'Cookie platforms regenerate after four seconds');
run('selectedLevel=7;reset();enterSewer({exitX:2500});draw()');assert(run('undergroundTrip.theme==="cloud"&&obstacles.some(o=>o.type==="waffleStack")&&obstacles.some(o=>o.type==="kitchenCan")'),'Cloud world has a working bakery-themed sewer');run('exitSewer();draw()');assert(run('isCloudWorld()&&platforms.some(p=>p.cloudCookie)'),'Sewer exit restores cloud-platform state');
run('selectedLevel=3;reset();startBoss();player.hp=20;player.inv=0;updateBossProjectile({type:"stormBolt",x:player.x,y:player.y,w:20,h:28,vx:0,vy:0,life:20,damage:2})');assert.equal(run('player.hp'),18,'Croissant lightning deals two HP, not ten');
run('selectedLevel=1;reset();var powerDraws=[],savedPowerSprite=sprite;sprite=(name,...args)=>powerDraws.push({name,args});player.fireTime=60;player.marshmallowTime=60;drawPlayerPowerIcons();sprite=savedPowerSprite');assert(run('powerDraws.length===2&&powerDraws[0].name==="chili"&&powerDraws[1].name==="marshmallow"&&powerDraws.every(p=>p.args[1]<player.y)&&powerDraws[0].args[0]!==powerDraws[1].args[0]'),'Both active powers hover above the player without overlapping');
run('powerDraws=[];sprite=(name,...args)=>powerDraws.push(name);player.fireTime=0;player.marshmallowTime=0;drawPlayerPowerIcons();sprite=savedPowerSprite;drawChiliFallback(100,100,24,31)');assert.equal(run('powerDraws.length'),0,'Expired powers have no floating indicators');
run('selectedLevel=7;reset();for(let i=0;i<1799;i++)updateWorldWind()');assert(run('!worldWind.active'),'Cloud wind waits thirty seconds');run('updateWorldWind()');assert(run('worldWind.active&&worldWind.remaining===300&&worldWind.nextAt===3600'),'Cloud wind comes every thirty seconds for five seconds');
run('for(let i=0;i<600;i++)updateCloudWeather();draw()');assert(run('cloudRain.active&&cloudRain.remaining===600&&cloudRain.nextAt-cloudRain.time>=1200&&cloudRain.nextAt-cloudRain.time<1800'),'Cloud world has frequent ten-second heavy rain, without cheese damage');
// The viewport changes visibility, never the physics or the original menu coordinates.
const viewportBounds=canvas.getBoundingClientRect;
let viewportPhysics;
for(const [width,height,dpr] of [[1000,620,1],[1920,1080,1],[2560,1080,1],[1024,768,2],[768,1024,2]]){
 canvas.getBoundingClientRect=()=>({left:23,top:17,width,height});context.devicePixelRatio=dpr;
 run('screen="play";selectedLevel=1;reset();enemies=[];objects=[];obstacles.length=0;platforms.length=0;lavaPits.length=0;cliffs.length=0;terraces.length=0;player.x=500;player.onGround=true;draw()');
 assert.equal(run('W'),1000);assert.equal(run('H'),620);
 assert(Math.abs(run('viewWidth/viewHeight')-width/height)<1e-10,'Viewport has the real screen ratio');
 assert(run('viewWidth>=W&&viewHeight>=H'),'View expands rather than cropping the original field');
 assert(Math.abs(run('viewWidth*viewScale')-width)<1e-8&&Math.abs(run('viewHeight*viewScale')-height)<1e-8,'View fills the window without bars');
 assert.equal(canvas.width,width*dpr);assert.equal(canvas.height,height*dpr);
 let matrix;canvasContext.setTransform=(...args)=>matrix=args;
 run('beginWorldFrame()');assert.equal(matrix[0],matrix[3],'World scale is uniform');
 assert.equal(matrix[4],0);assert.equal(matrix[5],run('viewOffsetY*viewScale*viewPixelRatio'));
 run('beginUiFrame()');assert.equal(matrix[0],matrix[3],'Menus also keep their proportions');
 run('keys={d:true};jump();for(let i=0;i<60;i++)update();keys={};draw()');
 const physics=run('JSON.stringify([player.x,player.y,player.vx,player.vy,player.hp])');
 if(viewportPhysics===undefined)viewportPhysics=physics;else assert.equal(physics,viewportPhysics,'Movement and jumping are identical on every screen');
 for(const b of run('buttons'))assert(b.x+run('viewOffsetX')>=0&&b.x+b.w+run('viewOffsetX')<=run('viewWidth')&&b.y>=0&&b.y+b.h<=run('viewHeight'),'Every touch button remains on screen');
 const tap=run('var vb=buttons.find(b=>b.id==="jump");var vr=c.getBoundingClientRect();({clientX:vr.left+(vb.x+vb.w/2+viewOffsetX)*viewScale,clientY:vr.top+(vb.y+vb.h/2)*viewScale})');
 handlers.canvas.pointerdown({pointerId:1200,...tap,preventDefault(){}});assert(run('keys.touchJump'),'Touch jump uses the inverse uniform transform');
 handlers.canvas.pointerup({pointerId:1200});assert(run('!keys.touchJump'),'Release still ends the held jump');
 run('screen="levelselect";draw()');
 const menuTap=run('var vb=menuButtons.find(b=>b.id==="level7");var vr=c.getBoundingClientRect();({clientX:vr.left+(vb.x+vb.w/2+viewOffsetX)*viewScale,clientY:vr.top+(vb.y+vb.h/2+viewOffsetY)*viewScale})');
 handlers.canvas.pointerdown({pointerId:1201,...menuTap,preventDefault(){}});assert(run('screen==="choose"&&selectedLevel===7'),'Centered menus remain clickable on every screen');
 run('reset();startBoss();draw()');assert(run('cameraTargetX(player.x,W)===(W-viewWidth)/2'),'The unchanged boss arena is centered in wide views');
 run('player.x=W+500;update()');assert(run('player.x+player.w<=W'),'Resizing never changes the boss arena bounds');
}
canvas.getBoundingClientRect=()=>({left:0,top:0,width:2560,height:1080});context.devicePixelRatio=1;
run('selectedLevel=1;reset();draw();enemies=[{type:"gummy",x:camera+W+120,y:ground-42,w:42,h:42,hp:2,damage:1,shoot:1000,dead:0}]');
let extraEnemyDrawn=false;canvasContext.drawImage=image=>{if(image.src.includes('/gummy.svg'))extraEnemyDrawn=true};
run('draw()');assert(extraEnemyDrawn,'Newly visible enemies are actually rendered beyond the old view width');
run('terraces.length=0;cliffs.length=0;lavaPits.length=0;obstacles.length=0;platforms.length=0;objects=[];enemies=[];player.x=3000;for(let i=0;i<60;i++)update()');assert(Math.abs(run('camera')-run('cameraTargetX(player.x)'))<2,'Camera follows using the expanded view width');
const beforeResize=run('JSON.stringify([player.x,player.y,player.hp,player.inventory])');
canvas.getBoundingClientRect=()=>({left:0,top:0,width:768,height:1024});run('draw()');
assert.equal(run('JSON.stringify([player.x,player.y,player.hp,player.inventory])'),beforeResize,'Rotating the screen does not teleport or reset the player');
canvas.getBoundingClientRect=viewportBounds;context.devicePixelRatio=1;run('resizeGameCanvas()');
// Ten complete new worlds, not just extra menu cards.
assert.equal(run('Object.keys(LEVEL_SETTINGS).length'),18,'Seventeen worlds plus Totarial');
assert.equal(run('Object.keys(EXTRA_ENEMIES).length'),5,'Exactly five new enemy identities');
assert.equal(run('Object.keys(art).length'),64,'All fifteen new original sprites are registered');
run('screen="levelselect";selectedLevel=1;menuAction("pageNext");draw()');assert(run('worldMenuPage()===1&&menuButtons.some(b=>b.id==="level14")'),'Page two contains worlds 8–14');
handlers.global.keydown({key:'3',repeat:false,preventDefault(){}});assert(run('screen==="choose"&&selectedLevel===10'),'Number keys select within the current page');
run('screen="levelselect";selectedLevel=15;draw()');assert(run('worldMenuPage()===2&&menuButtons.some(b=>b.id==="level17")&&menuButtons.find(b=>b.id==="pageNext").disabled'),'Last page includes the final three worlds');
const expansionBosses=new Set(),expansionPatterns=new Set();
for(let n=8;n<=17;n++){
 run(`screen='levelselect';menuAction('level${n}');reset();player.inv=100000;draw()`);
 assert.equal(run('level'),n,'Multi-digit world selection is exact');
 assert(run('levelWidth===LEVEL_SETTINGS[level].width&&objects.some(o=>o.type==="key")&&objects.some(o=>o.type==="manhole")&&secretPassages.length>0'),'New worlds have full terrain, keys, sewers and secrets');
 assert(run('Object.keys(EXTRA_ENEMIES).every(t=>enemies.some(e=>e.type===t&&e.hp===EXTRA_ENEMIES[t].hp&&e.w===EXTRA_ENEMIES[t].w))'),'All five new enemy types are real actors');
 assert.equal(run('lavaPits.length>0'),n===16,'Only the new volcano has lava');
 run('var extraMapWidth=levelWidth;enterSewer({exitX:2500});for(let i=0;i<5;i++){update();draw()}');
 assert(run('undergroundTrip.theme==="extra"&&enemies.some(e=>EXTRA_ENEMIES[e.type])'),'New-world sewers include the new enemies');
 run('exitSewer();draw()');assert.equal(run('levelWidth'),run('extraMapWidth'),'Sewer return restores the new world');
 run('startBoss();player.inv=100000;var extraBossX=boss.x;for(let i=0;i<180;i++){update();draw()}');
 expansionBosses.add(run('boss.art'));expansionPatterns.add(run('boss.pattern'));
 assert(run('boss.extra&&boss.name===extraWorld().boss&&boss.hp===boss.max&&boss.x!==extraBossX'),'Each world has its own living, moving boss');
 run('boss.attack=0;updateExtraBoss(boss)');assert(run('objects.some(o=>o.type==="banquetShot"||o.type==="bossWave")'),'Every new boss launches damaging attacks');
 run('boss.hp=boss.max/2;update();var extraHeavyTarget=boss.heavyTarget;for(let i=0;i<89;i++){update();draw()}');
 assert(run('boss.heavyCount===1&&objects.some(o=>o.type==="bossHeavyWave"&&o.damage===10)&&boss.heavyTarget===extraHeavyTarget'),'Every new boss has one 90-frame telegraphed ten-HP special');
 run('for(let i=0;i<100;i++)update()');assert.equal(run('boss.heavyCount'),1,'No repeated heavy specials');
 run('player.hp=20;player.inv=0;updateBossProjectile({type:"banquetShot",x:player.x,y:player.y,w:18,h:18,vx:0,vy:0,gravity:0,life:10,damage:2})');assert.equal(run('player.hp'),18,'Ordinary new-boss attacks deal exactly two HP');
 run('player.inv=100000;boss.hp=0;for(let i=0;i<76;i++)update();draw()');
 assert(run('screen==="victory"'),'Every new boss can be defeated');assert.equal(run('victoryButtons.find(b=>b.id==="next").disabled'),n===17,'Only world seventeen ends progression');
}
assert.equal(expansionBosses.size,10,'Ten different original boss drawings');assert.equal(expansionPatterns.size,10,'Ten different attack patterns');
for(const type of run('Object.keys(EXTRA_ENEMIES)')){
 run(`selectedLevel=8;reset();objects=[];enemies=[];obstacles.length=0;platforms.length=0;terraces.length=0;cliffs.length=0;lavaPits.length=0;player.x=500;player.inv=100000;var def=EXTRA_ENEMIES['${type}'];var foe={type:'${type}',x:250,y:ground-def.h,w:def.w,h:def.h,hp:def.hp,damage:1,vx:0,vy:0,shoot:0,hop:0,dead:0,slow:0,onGround:true};enemies=[foe];update();draw()`);
 if(type==='radish')assert(run('foe.vy<0'),'Radish really hops');
 if(type==='pretzel'||type==='pepper')assert(run('objects.some(o=>o.type==="mentos"&&o.extraEnemy===foe.type&&o.taco)&&foe.shoot>0'),'New shooters fire their own non-Cola-reactive projectiles');
 run('player.x=foe.x;player.y=foe.y;player.hp=20;player.inv=0;update()');assert.equal(run('player.hp'),19,'New enemy contact deals one HP');
 run('objects=[];foe.y=ground-foe.h;foe.vy=0;foe.hop=999;foe.shoot=999;player.x=foe.x;player.y=foe.y-player.h-3;player.vy=4;player.onGround=false;player.inv=0;var oldFoeHp=foe.hp;update()');assert(run('foe.hp===oldFoeHp-1&&player.vy<0'),'Every new enemy can be stomped with a safe bounce');
}
console.log('PASS: 17 complete worlds, 10 new moving bosses with distinct attacks and single warned ten-HP specials, 5 new damageable enemy types, paged menu/keyboard/touch navigation, expanded proportional camera and all existing mechanics.');
