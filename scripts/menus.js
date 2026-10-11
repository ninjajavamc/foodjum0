let selectedLevel=1,menuButtons=[];
function menuAction(id){
 keys={};heldPointers.clear();
 if(id==='levels'){screen='levelselect';playSound('menu')}
 else if(id==='multiplayer'){message='Multiplayer kommt noch.'}
 else if(id==='tutorial'||['level0','level1','level2','level3','level4','level5','level6'].includes(id)){selectedLevel=id==='tutorial'?0:Number(id.slice(-1));screen='choose';playSound('menu')}
 else if(id==='back'){screen=screen==='buddy'?'choose':screen==='choose'?'levelselect':'start';playSound('menu')}
}
function handleMenuKey(event){
 if(event.repeat)return;
 if(event.key.toLowerCase()==='t'||event.key==='0'){menuAction('tutorial');return}
 if(screen==='start'){if(event.key==='Enter'||event.key===' ')menuAction('levels');return}
 if(event.key==='Escape'){menuAction('back');return}
 if(event.key==='ArrowLeft'||event.key==='ArrowRight'){selectedLevel=(selectedLevel+(event.key==='ArrowRight'?1:6))%7;playSound('menu')}
 if(event.key==='Enter'||event.key===' ')menuAction('level'+selectedLevel);
 if(['1','2','3','4','5','6'].includes(event.key))menuAction('level'+event.key);
}
function drawMenuButton(b){
 x.fillStyle=b.disabled?'#53616c':'#5b9380';x.fillRect(b.x,b.y,b.w,b.h);x.strokeStyle=b.disabled?'#78868c':'#f7d894';x.lineWidth=2;x.strokeRect(b.x,b.y,b.w,b.h);x.fillStyle=b.disabled?'#c1cbc9':'#fff9e6';x.font='bold 23px system-ui';x.textAlign='center';x.fillText(b.label,b.x+b.w/2,b.y+b.h/2+8);
}
function drawMenuBack(){
 const b={id:'back',x:25,y:22,w:140,h:38,label:'ZURÜCK'};x.save();x.fillStyle='#344d55';x.fillRect(b.x,b.y,b.w,b.h);x.fillStyle='#fff8e7';x.font='bold 16px system-ui';x.textAlign='center';x.fillText(b.label,b.x+b.w/2,b.y+25);x.restore();
}
function drawStart(){
 x.save();x.fillStyle='rgba(25,43,53,.8)';x.fillRect(0,0,W,H);x.textAlign='center';x.fillStyle='#ffebad';x.font='900 61px system-ui';x.fillText('FOOD JUM0',W/2,145);x.fillStyle='#e0eee1';x.font='21px system-ui';x.fillText('Dein Food-Platformer',W/2,192);
 menuButtons=[{id:'levels',x:270,y:246,w:460,h:68,label:'WELT-AUSWAHL'},{id:'multiplayer',x:270,y:336,w:460,h:68,label:'MULTIPLAYER – kommt noch',disabled:true}];menuButtons.push({id:'tutorial',x:270,y:424,w:460,h:52,label:'TOTARIAL – zuerst üben (T)'});menuButtons.forEach(drawMenuButton);
 sprite('spaghetti',75,300,110,150);sprite('banane',812,300,110,150);x.fillStyle='#e3eede';x.font='17px system-ui';x.fillText(message==='Multiplayer kommt noch.'?message:'Level auswählen oder Enter drücken',W/2,525);x.restore();
}
function drawLevelSelect(){
 x.save();x.fillStyle='rgba(25,43,53,.84)';x.fillRect(0,0,W,H);x.textAlign='center';x.fillStyle='#ffebad';x.font='bold 40px system-ui';x.fillText('WELT-AUSWAHL',W/2,82);x.fillStyle='#e0eee1';x.font='19px system-ui';x.fillText('Welches Abenteuer möchtest du spielen?',W/2,115);
 menuButtons=[{id:'back',x:25,y:22,w:140,h:38}];
 for(let i=0;i<6;i++){
  const row=Math.floor(i/3),col=i%3;
  const b={id:'level'+(i+1),x:115+col*265,y:191+row*200,w:240,h:182};menuButtons.push(b);x.fillStyle=selectedLevel===i+1?'#fff0bf':'#e5eee0';x.fillRect(b.x,b.y,b.w,b.h);x.strokeStyle=selectedLevel===i+1?'#eaa75c':'#738e88';x.lineWidth=4;x.strokeRect(b.x,b.y,b.w,b.h);
  x.fillStyle='#2f4750';x.font='bold 22px system-ui';x.fillText(worldName(i+1),b.x+b.w/2,b.y+29);
  if(i===1)['boss-fork','boss-spoon','boss-knife'].forEach((artName,j)=>sprite(artName,b.x+32+j*61,b.y+36,56,107));
  else{const width=i===5?89:106;sprite(['boss',null,'boss-cotton','boss-popcorn','boss-bigmac','boss-fishstick'][i],b.x+(b.w-width)/2,b.y+35,width,111);}
  x.font='bold 17px system-ui';x.fillText(['Kartoffelpüree-Bär','Besteck-Trio','Zuckerwatte · fliegend','Popcorn','Triple Bigmac','Riesen-Fischstäbchen'][i],b.x+b.w/2,b.y+167);
 }
 const tutorial={id:'tutorial',x:115,y:138,w:770,h:36,label:'TOTARIAL · Lernwelt (T / 0)'};menuButtons.push(tutorial);drawMenuButton(tutorial);
 drawMenuBack();x.fillStyle='#e0eee1';x.font='17px system-ui';x.fillText('1–6: Welten · ← → und Enter · T: Totarial',W/2,599);x.restore();
}
