const MATERIALS={sugar:{name:'Zucker',color:'#f2dda9',short:'ZU'},herbs:{name:'Kräuter',color:'#77bc79',short:'KR'},spice:{name:'Gewürz',color:'#d99265',short:'GE'}};
const RECIPES=[
 {item:'mushroom',name:'Heilpilz',ingredients:{herbs:2}},
 {item:'gum',name:'Kaugummi',ingredients:{sugar:2,herbs:1}},
 {item:'wasabi',name:'Wasabi',ingredients:{herbs:1,spice:2}}
];
let selectedRecipe=0,inventoryButtons=[];
function nearCraftStation(){return objects.some(o=>o.type==='craftStation'&&Math.abs(player.x+player.w/2-o.x-o.w/2)<155&&Math.abs(player.y+player.h-floorAtX(o.x))<140)}
function toggleInventory(){
 if(screen==='play'){screen='inventory';keys={};heldPointers.clear();playSound('menu')}
 else if(screen==='inventory'){screen='play';playSound('menu')}
}
function dropItem(){
 if(screen!=='play'&&screen!=='inventory')return;
 const item=player.inventory[player.inventoryIndex];if(!item)return;
 player.inventory.splice(player.inventoryIndex,1);player.inventoryIndex=Math.min(player.inventoryIndex,Math.max(0,player.inventory.length-1));
 objects.push({type:'looseItem',item,x:Math.max(0,Math.min(levelWidth-36,player.x+player.facing*65)),y:player.y+10,w:34,h:34,vx:player.facing*1.2,vy:-2,delay:45,life:Infinity});message='Item abgelegt: '+ITEM_NAMES[item];playSound('menu');
}
function collectWorldLoot(o){
 if(o.collected||screen!=='play'||!rect(player,o))return;
 if(o.type==='material'){
  player.bag[o.material]+=o.quantity||1;o.collected=true;o.life=0;message=MATERIALS[o.material].name+' gesammelt! I öffnet das Inventar.';playSound('pickup');
 }else if(o.type==='looseItem'&&!(o.delay>0)&&player.inventory.length<2){
  player.inventory.push(o.item);o.collected=true;o.life=0;message=ITEM_NAMES[o.item]+' eingesammelt.';playSound('pickup');
 }
}
function updateLooseItem(o){
 if(o.life<=0)return;o.delay=Math.max(0,(o.delay||0)-1);o.vx=(o.vx||0)*.9;o.x+=o.vx;o.vy=(o.vy||0)+.3;o.y+=o.vy;
 const surface=floorAtX(o.x+o.w/2);if(o.y+o.h>=surface){o.y=surface-o.h;o.vy=0;o.vx=0}
 collectWorldLoot(o);
}
function canCraft(recipe){return nearCraftStation()&&player.inventory.length<2&&Object.entries(recipe.ingredients).every(([material,count])=>player.bag[material]>=count)}
function craftItem(){
 const recipe=RECIPES[selectedRecipe];
 if(!nearCraftStation()){message='Zum Craften musst du an einer Werkbank stehen.';return}
 if(player.inventory.length>=2){message='Inventar voll. Mit R ein Item ablegen.';return}
 if(!canCraft(recipe)){message='Dafür fehlen noch Materialien.';return}
 for(const [material,count] of Object.entries(recipe.ingredients))player.bag[material]-=count;
 player.inventory.push(recipe.item);message=recipe.name+' hergestellt!';playSound('pickup');
}
function inventoryKey(event){
 if(event.repeat)return;const key=event.key.toLowerCase();
 if(key==='i'||key==='escape')toggleInventory();
 if(key==='r')dropItem();if(key==='c')craftItem();
 if(key==='1'||key==='2')player.inventoryIndex=Number(key)-1;
 if(key==='arrowleft')selectedRecipe=(selectedRecipe+2)%3;if(key==='arrowright')selectedRecipe=(selectedRecipe+1)%3;
}
function inventoryAction(id){
 if(id==='close')toggleInventory();else if(id==='drop')dropItem();else if(id==='craft')craftItem();else if(id.startsWith('slot'))player.inventoryIndex=Number(id.at(-1));else if(id.startsWith('recipe'))selectedRecipe=Number(id.at(-1));
}
function drawMaterial(material,left,top,size){
 const m=MATERIALS[material];x.fillStyle=m.color;x.strokeStyle='#3d514a';x.lineWidth=2;x.fillRect(left,top,size,size);x.strokeRect(left,top,size,size);x.fillStyle='#28372f';x.font='bold '+Math.round(size*.35)+'px system-ui';x.textAlign='center';x.fillText(m.short,left+size/2,top+size*.64);
}
function drawCraftStation(o){
 x.fillStyle='#b18962';x.strokeStyle='#59483d';x.lineWidth=3;x.fillRect(o.x,o.y,o.w,20);x.strokeRect(o.x,o.y,o.w,20);x.fillRect(o.x+8,o.y+20,12,o.h-20);x.fillRect(o.x+o.w-20,o.y+20,12,o.h-20);
 x.fillStyle='#dfc8a3';x.fillRect(o.x+30,o.y-22,42,33);x.strokeRect(o.x+30,o.y-22,42,33);for(let i=1;i<3;i++){x.beginPath();x.moveTo(o.x+30+i*14,o.y-22);x.lineTo(o.x+30+i*14,o.y+11);x.moveTo(o.x+30,o.y-22+i*11);x.lineTo(o.x+72,o.y-22+i*11);x.stroke()}
 x.fillStyle='#24394a';x.textAlign='center';x.font='bold 12px system-ui';x.fillText('WERKBANK · I',o.x+o.w/2,o.y-35);
}
function drawInventory(){
 x.save();x.fillStyle='rgba(20,26,43,.96)';x.fillRect(0,0,W,H);x.fillStyle='#fff1c3';x.textAlign='center';x.font='bold 34px system-ui';x.fillText('INVENTAR & CRAFTING',W/2,78);
 inventoryButtons=[{id:'close',x:899,y:28,w:65,h:38,label:'X'},{id:'drop',x:108,y:383,w:280,h:44,label:'Item ablegen (R)'},{id:'craft',x:586,y:457,w:290,h:44,label:'Herstellen (C)'}];
 for(let i=0;i<2;i++){
  const left=108+i*150,item=player.inventory[i];x.fillStyle='#35475c';x.fillRect(left,125,130,115);x.strokeStyle=i===player.inventoryIndex?'#ffdb8b':'#658190';x.lineWidth=3;x.strokeRect(left,125,130,115);if(item)sprite(item,left+37,133,56,67);x.fillStyle='#fff';x.font='14px system-ui';x.fillText(item?{mushroom:'Pilz',gum:'Kaugummi',wasabi:'Wasabi'}[item]:'Leer',left+65,220);inventoryButtons.push({id:'slot'+i,x:left,y:125,w:130,h:115});
 }
 Object.keys(MATERIALS).forEach((material,i)=>{const left=108+i*130;drawMaterial(material,left+24,277,40);x.fillStyle='#fff';x.font='14px system-ui';x.fillText(MATERIALS[material].name+': '+player.bag[material],left+44,343)});
 x.fillStyle='#bacbd3';x.font='14px system-ui';x.fillText('Materialien im Level sammeln.',262,464);x.fillText('2 Item-Plätze · 1 / 2 zum Auswählen',262,495);
 RECIPES.forEach((recipe,i)=>{const b={id:'recipe'+i,x:586,y:120+i*43,w:290,h:35,label:recipe.name};inventoryButtons.push(b);x.fillStyle=i===selectedRecipe?'#687f65':'#35475c';x.fillRect(b.x,b.y,b.w,b.h);x.fillStyle='#fff';x.font='17px system-ui';x.fillText(b.label,b.x+b.w/2,b.y+24)});
 const recipe=RECIPES[selectedRecipe],cells=[];for(const [m,count] of Object.entries(recipe.ingredients))for(let i=0;i<count;i++)cells.push(m);
 for(let i=0;i<9;i++){const left=650+(i%3)*47,top=270+Math.floor(i/3)*47;x.fillStyle='#314152';x.fillRect(left,top,42,42);x.strokeStyle='#728896';x.lineWidth=1;x.strokeRect(left,top,42,42);if(cells[i])drawMaterial(cells[i],left+6,top+6,30)}
 x.fillStyle=nearCraftStation()?'#95d6a0':'#deb08b';x.font='14px system-ui';x.fillText(nearCraftStation()?'Werkbank bereit':'Zum Craften eine Werkbank finden',731,437);
 for(const b of inventoryButtons.filter(b=>['close','drop','craft'].includes(b.id))){x.fillStyle=b.id==='craft'&&!canCraft(recipe)?'#424859':'#6c967f';x.fillRect(b.x,b.y,b.w,b.h);x.fillStyle='#fff';x.font='16px system-ui';x.fillText(b.label,b.x+b.w/2,b.y+28)}
 x.fillStyle='#ffe1a5';x.font='14px system-ui';x.fillText(message,W/2,549);x.fillStyle='#bbcbd4';x.fillText('I / Esc schließen · R ablegen · Rezept auswählen und C drücken',W/2,582);x.restore();
}
