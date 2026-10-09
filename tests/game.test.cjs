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
for(const path of ['scripts/audio.js','scripts/game-features.js','scripts/companions.js','scripts/crafting.js'])vm.runInContext(fs.readFileSync(path,'utf8'),context);
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
assert(run('lavaPits.length>=5&&trees.length>=6'),'Long level contains repeated scenery and hazards');
assert(run('objects.filter(o=>o.type===\"cola\").every(o=>o.w>=64&&o.h>=145&&o.liquid===.9)'),'Cola bottles are larger and visibly filled');
run('player.x=1300;player.inv=10000;update();draw()');
assert(run('player.x>1000&&camera>0'),'Player can leave first screen and camera follows');
for(const type of ['gummy','honey','lemon'])for(const direction of [-1,1]){
 run(`reset();player.inv=10000;player.x=${direction===1?675:100};enemies=[{type:'${type}',x:${direction===1?238:385},y:ground-42,w:42,h:42,hp:2,damage:1,shoot:1000,slow:0,dead:0,vy:0}];update();draw()`);
 assert(run('enemies.length===1&&enemies[0].vy<0'),'Enemy starts a jump over lava: '+type+' '+direction);
 run('for(let i=0;i<43;i++){update();draw()}');
 assert(run('enemies.length===1&&enemies[0].y===ground-42'),'Enemy safely lands beyond lava: '+type+' '+direction);
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
assert(run('hooks.length>trees.length&&levelWidth>=18000'),'Long level has intermediate hooks');
assert(run('cliffs.length>0&&obstacles.length>10&&platforms.some(p=>p.moving)'),'Cliffs, obstacles and moving platforms exist');
run('reset();enemies=[];player.inv=0;player.x=cliffs[0].x+20;for(let i=0;i<45;i++){update();draw()}');
assert.equal(run('player.hp'),19,'Falling down a cliff costs one HP');
assert(run('player.x<cliffs[0].x'),'Cliff fall returns player to a safe edge');
run('reset();selected=1;ability();draw()');
assert(run('player.shield>0&&art[\"mandarin-piece\"]'),'Mandarine uses separate little-segment artwork');
for(let index=0;index<3;index++){
 run(`reset();var box=objects.find(o=>o.type==='lunchbox');var oldRandom=Math.random;Math.random=()=>${(index+.1)/3};collectLunchbox(box);Math.random=oldRandom`);
 assert.equal(run('player.inventory[0]'),['mushroom','gum','wasabi'][index],'Every random item can be obtained');
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
assert(run('victoryButtons.find(b=>b.id===\"next\").disabled'),'Next level is visibly disabled');
handlers.canvas.pointerdown({pointerId:14,clientX:500,clientY:452,preventDefault(){}});
assert.equal(run('screen'),'victory','Unavailable next level does nothing');
handlers.canvas.pointerdown({pointerId:15,clientX:500,clientY:300,preventDefault(){}});
assert(run('screen===\"play\"&&player.hp===20&&level===1'),'Level nochmal button restarts Level 1 with 20 HP');
run("screen='victory';draw()");
handlers.canvas.pointerdown({pointerId:16,clientX:500,clientY:375,preventDefault(){}});
assert.equal(run('screen'),'choose','Hauptmenü button returns to character selection');
run("screen='choose';draw()");
handlers.global.keydown({key:'Enter',repeat:false,preventDefault(){}});
assert.equal(run('screen'),'buddy','Character choice leads to companion choice');
run('draw()');
handlers.canvas.pointerdown({pointerId:20,clientX:650,clientY:300,preventDefault(){}});
assert(run('screen===\"play\"&&companion.type===\"sausage-dog\"'),'Wursthund can be selected on mobile');
run("selectedBuddy=0;reset();enemies=[];var puddle={type:'colaFlow',sourceX:110,sourceY:380,groundY:ground,x:50,y:ground-22,w:120,h:28,spread:60,age:300,life:Infinity};objects=[puddle];player.inv=10000;for(let i=0;i<20;i++){update();draw()}");
assert(run('puddle.spread<60&&companion.cola>0'),'Sponge automatically absorbs nearby cola');
run("companion.cola=60;companion.cooldown=0;enemies=[{type:'gummy',x:190,y:ground-42,w:42,h:42,hp:1,damage:1,shoot:1000,dead:0,slow:0}];for(let i=0;i<40;i++){update();draw()}");
assert.equal(run('enemies.length'),0,'Sponge throws stored cola and defeats an enemy');
run('player.x=350;for(let i=0;i<35;i++){update();draw()}');
assert(run('Math.abs(companion.x-(player.x-65))<30'),'Sponge follows player automatically');
run("selectedBuddy=1;reset();player.inv=10000;enemies=[{type:'gummy',x:100,y:ground-42,w:42,h:42,hp:1,damage:1,shoot:1000,dead:0,slow:0}];update();draw()");
assert.equal(run('enemies.length'),0,'Wursthund attacks nearby enemies automatically');
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
assert.equal(run('objects.filter(o=>o.type===\"cola\").length'),8,'All eight cola bottles spawn successfully');
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
assert.equal(run('screen'),'inventory','I opens the inventory and crafting field');
run('draw();craftItem()');
assert(run('player.inventory[0]===\"gum\"&&player.bag.sugar===2&&player.bag.herbs===3'),'Workbench crafting consumes ingredients and creates an item');
run('player.inventory.push(\"mushroom\");var sugarBefore=player.bag.sugar;craftItem()');
assert.equal(run('player.bag.sugar'),run('sugarBefore'),'Full inventory prevents crafting without losing materials');
handlers.global.keydown({key:'r',repeat:false,preventDefault(){}});
assert.equal(run('player.inventory.length'),1,'R drops selected items from the inventory screen');
handlers.global.keydown({key:'i',repeat:false,preventDefault(){}});
assert.equal(run('screen'),'play','I closes inventory and resumes the game');
console.log('PASS: working hook swing/transfer, textured automatic companions, fast complete sponge cleanup, safe bottle spawning, two inventory slots, R dropping/picking up, material collecting, workbench crafting, vertical terrain, sounds, boss/key/bubble regression checks.');
