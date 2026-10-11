const MATERIALS={sugar:{name:'Zucker',color:'#f2dda9',short:'ZU'},herbs:{name:'Kräuter',color:'#77bc79',short:'KR'},spice:{name:'Gewürz',color:'#d99265',short:'GE'},stone:{name:'Stein',color:'#a2b4b5',short:'ST'},spoon:{name:'Löffel',color:'#d0e1df',short:'LÖ'},wood:{name:'Holz',color:'#bc956a',short:'HO'}};
const RECIPES=[
 {item:'mushroom',name:'Heilpilz',ingredients:{herbs:2}},
 {item:'gum',name:'Kaugummi',ingredients:{sugar:2,herbs:1}},
 {item:'wasabi',name:'Wasabi',ingredients:{herbs:1,spice:2}},
 {item:'catapultKit',name:'Katapult-Bausatz',ingredients:{stone:2,spoon:1,wood:2}},
 {item:'wallKit',name:'Steinmauer-Bausatz',ingredients:{stone:3,wood:1}},
 {item:'springKit',name:'Sprungfeder',ingredients:{spoon:1,wood:1,stone:1}},
 {item:'ladderKit',name:'Leiter-Bausatz',ingredients:{wood:3,spoon:1}},
 {item:'marshmallow',name:'Marshmallow',ingredients:{sugar:3}}
];
function itemAllowed(item){return !(level===5&&item==='springKit')}
function enforceMoonItemRules(){if(level!==5)return;player.jumpBoost=0;player.inventory=player.inventory.filter(itemAllowed);player.inventoryIndex=Math.min(player.inventoryIndex,Math.max(0,player.inventory.length-1))}
let selectedRecipe=0,inventoryButtons=[];
const BUILD_ITEMS=new Set(['catapultKit','wallKit','ladderKit']);
function inventoryStorage(category=player.inventoryCategory||'powers'){
 const building=category==='builds';return {category:building?'builds':'powers',list:building?player.buildInventory:player.inventory,indexKey:building?'buildInventoryIndex':'inventoryIndex',capacity:building?3:2,get index(){return player[this.indexKey]}};
}
function itemStorage(item){return inventoryStorage(BUILD_ITEMS.has(item)?'builds':'powers')}
function selectInventorySlot(number){const storage=inventoryStorage(number<=2?'powers':'builds');player.inventoryCategory=storage.category;player[storage.indexKey]=number<=2?number-1:number-3}
function nearCraftStation(){return screen==='crafting'}
function openWorkbench(){if(!['play','inventory','crafting'].includes(screen))return;screen='crafting';keys={};heldPointers.clear();playSound('menu')}
function toggleInventory(){
 if(screen==='play'){screen='inventory';keys={};heldPointers.clear();playSound('menu')}
 else if(screen==='inventory'||screen==='crafting'){screen='play';playSound('menu')}
}
function dropItem(){
 if(!['play','inventory','crafting'].includes(screen))return;
 const storage=inventoryStorage(),item=storage.list[storage.index];if(!item)return;
 storage.list.splice(storage.index,1);player[storage.indexKey]=Math.min(storage.index,Math.max(0,storage.list.length-1));
 objects.push({type:'looseItem',item,x:Math.max(0,Math.min(levelWidth-36,player.x+player.facing*65)),y:player.y+10,w:34,h:34,vx:player.facing*1.2,vy:-2,delay:45,life:Infinity});message='Item abgelegt: '+ITEM_NAMES[item];playSound('menu');
}
function collectWorldLoot(o){
 if(o.collected||screen!=='play'||!rect(player,o))return;
 if(o.type==='material'){
  player.bag[o.material]=(player.bag[o.material]||0)+(o.quantity||1);o.collected=true;o.life=0;message=MATERIALS[o.material].name+' gesammelt! I öffnet das Inventar.';playSound('pickup');
 }else if(o.type==='looseItem'&&!(o.delay>0)){
  if(!itemAllowed(o.item)){o.life=0;return}
  const storage=itemStorage(o.item);if(storage.list.length>=storage.capacity)return;
  storage.list.push(o.item);o.collected=true;if(o.secretRewardSlot)o.secretRewardSlot.collected=true;o.life=0;message=ITEM_NAMES[o.item]+' eingesammelt ('+(storage.category==='builds'?'Bausachen':'Powers')+').';playSound('pickup');
 }
}
function updateLooseItem(o){
 if(!itemAllowed(o.item)){o.life=0;return}
 if(o.life<=0)return;o.delay=Math.max(0,(o.delay||0)-1);o.vx=(o.vx||0)*.9;o.x+=o.vx;o.vy=(o.vy||0)+.3;o.y+=o.vy;
 const surface=floorAtX(o.x+o.w/2);if(o.y+o.h>=surface){o.y=surface-o.h;o.vy=0;o.vx=0}
 collectWorldLoot(o);
}
function canCraft(recipe){const storage=itemStorage(recipe.item);return itemAllowed(recipe.item)&&nearCraftStation()&&storage.list.length<storage.capacity&&Object.entries(recipe.ingredients).every(([material,count])=>player.bag[material]>=count)}
function craftItem(){
 const recipe=RECIPES[selectedRecipe];
 if(!itemAllowed(recipe.item)){message='Auf dem Mond sind Sprungfedern gesperrt.';return}
 if(!nearCraftStation()){message='Öffne erst die Werkbank mit B oder dem Button.';return}
 const storage=itemStorage(recipe.item);
 if(storage.list.length>=storage.capacity){message=(storage.category==='builds'?'Bauinventar':'Power-Inventar')+' voll. Mit R etwas daraus ablegen.';return}
 if(!canCraft(recipe)){message='Dafür fehlen noch Materialien.';return}
 for(const [material,count] of Object.entries(recipe.ingredients))player.bag[material]-=count;
 storage.list.push(recipe.item);player.inventoryCategory=storage.category;player[storage.indexKey]=storage.list.length-1;message=recipe.name+' hergestellt!';playSound('pickup');
}
function inventoryKey(event){
 if(event.repeat)return;const key=event.key.toLowerCase();
 if(key==='i'||key==='escape')toggleInventory();
 if(key==='r')dropItem();if(key==='c')craftItem();if(key==='b')openWorkbench();
 if(['1','2','3','4','5'].includes(key))selectInventorySlot(Number(key));
 if(key==='arrowleft')selectedRecipe=(selectedRecipe+RECIPES.length-1)%RECIPES.length;if(key==='arrowright')selectedRecipe=(selectedRecipe+1)%RECIPES.length;
}
function inventoryAction(id){
 if(id==='close')toggleInventory();else if(id==='openCraft')openWorkbench();else if(id==='drop')dropItem();else if(id==='craft')craftItem();else if(id==='powerTab')player.inventoryCategory='powers';else if(id==='buildTab')player.inventoryCategory='builds';else if(id.startsWith('slot'))player[inventoryStorage().indexKey]=Number(id.at(-1));else if(id.startsWith('recipe'))selectedRecipe=Number(id.at(-1));
}
function drawLoosePickup(o){
 x.save();x.fillStyle='rgba(255,244,168,.24)';x.beginPath();x.ellipse(o.x+o.w/2,o.y+o.h/2,o.w*.72,o.h*.62,0,0,Math.PI*2);x.fill();sprite(o.item,o.x-6,o.y-8,o.w+12,o.h+12);x.restore();
}
function drawMaterial(material,left,top,size){
 const m=MATERIALS[material];x.fillStyle='rgba(32,55,44,.12)';x.beginPath();x.ellipse(left+size/2,top+size*.9,size*.42,size*.1,0,0,Math.PI*2);x.fill();
 if(art['material-'+material]?.complete&&art['material-'+material].naturalWidth)sprite('material-'+material,left-size*.1,top-size*.2,size*1.2,size*1.3);
 else{x.fillStyle=m.color;x.fillRect(left+3,top+3,size-6,size-6)}
}
function drawCraftStation(o){
 x.fillStyle='#b18962';x.strokeStyle='#59483d';x.lineWidth=3;x.fillRect(o.x,o.y,o.w,20);x.strokeRect(o.x,o.y,o.w,20);x.fillRect(o.x+8,o.y+20,12,o.h-20);x.fillRect(o.x+o.w-20,o.y+20,12,o.h-20);
 x.fillStyle='#dfc8a3';x.fillRect(o.x+30,o.y-22,42,33);x.strokeRect(o.x+30,o.y-22,42,33);for(let i=1;i<3;i++){x.beginPath();x.moveTo(o.x+30+i*14,o.y-22);x.lineTo(o.x+30+i*14,o.y+11);x.moveTo(o.x+30,o.y-22+i*11);x.lineTo(o.x+72,o.y-22+i*11);x.stroke()}
 x.fillStyle='#24394a';x.textAlign='center';x.font='bold 12px system-ui';x.fillText('WERKBANK · I',o.x+o.w/2,o.y-35);
}
function drawInventory(){
 x.save();x.fillStyle='rgba(20,26,43,.96)';x.fillRect(0,0,W,H);x.fillStyle='#fff1c3';x.textAlign='center';x.font='bold 34px system-ui';x.fillText(screen==='crafting'?'WERKBANK':'INVENTAR',W/2,78);
 const workshop=screen==='crafting',recipe=RECIPES[selectedRecipe],storage=inventoryStorage();
 inventoryButtons=[{id:'close',x:899,y:28,w:65,h:38,label:'X'},{id:'drop',x:108,y:451,w:280,h:44,label:'Item ablegen (R)'},workshop?{id:'craft',x:586,y:481,w:290,h:44,label:'Herstellen (C)'}:{id:'openCraft',x:586,y:265,w:290,h:55,label:'Werkbank öffnen (B)'}];
 inventoryButtons.push({id:'powerTab',x:108,y:93,w:145,h:25,label:'POWERS / ITEMS'},{id:'buildTab',x:265,y:93,w:170,h:25,label:'BAUSACHEN'});
 for(let i=0;i<storage.capacity;i++){
  const left=108+i*150,item=storage.list[i];x.fillStyle='#35475c';x.fillRect(left,125,130,115);x.strokeStyle=i===storage.index?'#ffdb8b':'#658190';x.lineWidth=3;x.strokeRect(left,125,130,115);if(item)sprite(item,left+37,133,56,67);x.fillStyle='#fff';x.font='14px system-ui';x.fillText(item?ITEM_SHORT_NAMES[item]:'Leer',left+65,220);inventoryButtons.push({id:'slot'+i,x:left,y:125,w:130,h:115});
 }
 Object.keys(MATERIALS).forEach((material,i)=>{const left=108+(i%3)*130,top=260+Math.floor(i/3)*82;drawMaterial(material,left+24,top,42);x.fillStyle='#fff';x.font='14px system-ui';x.fillText(MATERIALS[material].name+': '+(player.bag[material]||0),left+44,top+64)});
 x.fillStyle='#bacbd3';x.font='13px system-ui';x.fillText(storage.category==='builds'?'3 Bau-Plätze · Tasten 3 / 4 / 5':'2 Power-Plätze · Tasten 1 / 2',262,521);
 if(workshop){
 RECIPES.forEach((recipe,i)=>{const b={id:'recipe'+i,x:586,y:117+i*23,w:290,h:23,label:recipe.name+(itemAllowed(recipe.item)?'':' – Mond: gesperrt')};inventoryButtons.push(b);x.fillStyle=!itemAllowed(recipe.item)?'#454457':i===selectedRecipe?'#687f65':'#35475c';x.fillRect(b.x,b.y,b.w,b.h);x.fillStyle='#fff';x.font='15px system-ui';x.fillText(b.label,b.x+b.w/2,b.y+19)});
 const cells=[];for(const [m,count] of Object.entries(recipe.ingredients))for(let i=0;i<count;i++)cells.push(m);
 for(let i=0;i<9;i++){const left=650+(i%3)*45,top=305+Math.floor(i/3)*45;x.fillStyle='#314152';x.fillRect(left,top,42,42);x.strokeStyle='#728896';x.lineWidth=1;x.strokeRect(left,top,42,42);if(cells[i])drawMaterial(cells[i],left+6,top+6,30)}
 x.fillStyle=nearCraftStation()?'#95d6a0':'#deb08b';x.font='14px system-ui';x.fillText(nearCraftStation()?'Werkbank bereit':'Werkbank öffnen',731,461);
 }else{x.fillStyle='#bdcfd4';x.font='16px system-ui';x.fillText('Items, Katapulte und Mauern herstellen',731,220)}
 for(const b of inventoryButtons.filter(b=>['close','drop','craft','openCraft','powerTab','buildTab'].includes(b.id))){const tab=b.id==='powerTab'||b.id==='buildTab';x.fillStyle=tab?((b.id==='buildTab')===(storage.category==='builds')?'#7da37f':'#35475c'):b.id==='craft'&&!canCraft(recipe)?'#424859':'#6c967f';x.fillRect(b.x,b.y,b.w,b.h);x.fillStyle='#fff';x.font='16px system-ui';x.fillText(b.label,b.x+b.w/2,b.y+(tab?18:28))}
 x.fillStyle='#ffe1a5';x.font='14px system-ui';x.fillText(message,W/2,549);x.fillStyle='#bbcbd4';x.fillText('I / Esc schließen · R ablegen · B Werkbank · C herstellen',W/2,582);x.restore();
}
