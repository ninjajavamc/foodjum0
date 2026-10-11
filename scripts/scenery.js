// Original canvas scenery: layered forest, textured trunks and living grass.
async function toggleFullscreen(){
 try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();const button=document.querySelector('#fullscreenToggle');if(button)button.textContent=document.fullscreenElement?'Vollbild beenden':'Vollbild'}catch(_){/* Fullscreen is optional. */}
}
function drawBackground(){
 if(undergroundTrip&&!['start','levelselect','choose','buddy'].includes(screen)){drawSewerBackground();return}
 if(isTutorial()&&!MENU_MUSIC_SCREENS.has(screen)){drawTrainingBackground();return}
 if(worldSettings().theme==='water'&&!MENU_MUSIC_SCREENS.has(screen)){drawWaterBackground();return}
 if(worldSettings().theme==='moon'&&!MENU_MUSIC_SCREENS.has(screen)){drawMoonBackground();return}
 if(worldSettings().theme==='frost'&&!MENU_MUSIC_SCREENS.has(screen)){drawFrostBackground();return}
 if(worldSettings().theme==='kitchen'&&!MENU_MUSIC_SCREENS.has(screen)){drawKitchenBackground();return}
 if(worldSettings().theme==='crystal'&&!MENU_MUSIC_SCREENS.has(screen)){drawCrystalBackground();return}
 const sky=x.createLinearGradient(0,0,0,H);sky.addColorStop(0,isTutorial()?'#98ddda':'#74c9ec');sky.addColorStop(.62,'#c8ecdd');sky.addColorStop(1,'#fff1cf');x.fillStyle=sky;x.fillRect(0,0,W,H);
 const sunlight=x.createRadialGradient(850,94,10,850,94,100);sunlight.addColorStop(0,'#fff9c7');sunlight.addColorStop(1,'rgba(255,244,183,0)');x.fillStyle=sunlight;x.fillRect(740,0,220,210);x.fillStyle='#fff5b4';x.beginPath();x.arc(850,94,39,0,Math.PI*2);x.fill();
 for(let i=0;i<7;i++){
  const cx=((i*227-camera*.09+performance.now()/1000*3)%(W+350)+(W+350))%(W+350)-160,cy=58+(i%3)*44-cameraY*.06;
  x.fillStyle='rgba(255,255,246,.7)';x.beginPath();x.ellipse(cx,cy,62,16,0,0,Math.PI*2);x.ellipse(cx-22,cy-11,27,22,0,0,Math.PI*2);x.ellipse(cx+16,cy-16,33,25,0,0,Math.PI*2);x.fill();
 }
 for(const layer of [{color:'#a5c9b4',base:285,amp:65,speed:.12},{color:'#80b4a1',base:350,amp:58,speed:.22},{color:'#609887',base:422,amp:40,speed:.35}]){
  x.fillStyle=layer.color;x.beginPath();x.moveTo(0,H);
  for(let px=0;px<=W+20;px+=20){const world=px+camera*layer.speed;const py=layer.base+Math.sin(world*.004)*layer.amp+Math.sin(world*.009)*layer.amp*.24-cameraY*layer.speed;x.lineTo(px,py)}
  x.lineTo(W,H);x.closePath();x.fill();
 }
 x.fillStyle='rgba(46,104,89,.25)';
 for(let i=-2;i<12;i++){
  const px=i*125-(camera*.3%125),py=425+Math.sin((i+Math.floor(camera*.3/125))*2)*16-cameraY*.25;
  x.fillRect(px-4,py-55,8,75);x.beginPath();x.ellipse(px,py-67,30,38,0,0,Math.PI*2);x.ellipse(px+20,py-44,28,24,0,0,Math.PI*2);x.ellipse(px-20,py-48,26,25,0,0,Math.PI*2);x.fill();
 }
}
function drawWorldTree(tree){
 if(worldSettings().theme==='crystal'){drawCrystalSpire(tree);return}
 if(worldSettings().theme==='kitchen'){drawKitchenProp(tree);return}
 if(worldSettings().theme==='frost'){drawIceCreamTree(tree);return}
 if(worldSettings().theme==='moon'){drawMoonRock(tree);return}
 if(worldSettings().theme==='water'){drawKelp(tree);return}
 const base=tree.baseY??ground,cx=tree.x,variant=Math.floor(cx/600)%3;
 x.save();x.fillStyle='rgba(32,62,39,.17)';x.beginPath();x.ellipse(cx+5,base+7,48,10,0,0,Math.PI*2);x.fill();
 const bark=x.createLinearGradient(cx-18,0,cx+24,0);bark.addColorStop(0,'#78503b');bark.addColorStop(.45,'#b98558');bark.addColorStop(1,'#795b42');x.fillStyle=bark;x.strokeStyle='#594631';x.lineWidth=3;
 x.beginPath();x.moveTo(cx-30,base+3);x.lineTo(cx-15,base-31);x.quadraticCurveTo(cx-7,base-120,cx-13,base-220);x.lineTo(cx+14,base-220);x.quadraticCurveTo(cx+10,base-100,cx+23,base-24);x.lineTo(cx+38,base+4);x.lineTo(cx+11,base-5);x.lineTo(cx-2,base+3);x.closePath();x.fill();x.stroke();
 x.strokeStyle='#9d714a';x.lineWidth=14;x.lineCap='round';x.beginPath();x.moveTo(cx+2,tree.hookY+38);x.quadraticCurveTo(cx+35,tree.hookY+17,tree.hookX,tree.hookY);x.stroke();
 x.strokeStyle='#d5a774';x.lineWidth=3;x.beginPath();x.moveTo(cx+5,tree.hookY+35);x.quadraticCurveTo(cx+34,tree.hookY+18,tree.hookX-5,tree.hookY-2);x.stroke();
 const lobes=[[-45,-215,47,40],[42,-220,49,42],[-5,-255,55,45],[-22,-208,43,33],[24,-250,36,34]];
 for(let i=0;i<lobes.length;i++){
  const [dx,dy,rx,ry]=lobes[i],wind=Math.sin(tick*.02+cx*.01+i)*1.5;
  x.fillStyle=['#39794c','#458d51','#65a94e','#52974d','#79b65a'][i];x.strokeStyle='#346848';x.lineWidth=2;x.beginPath();x.ellipse(cx+dx+wind,base+dy,rx,ry,0,0,Math.PI*2);x.fill();x.stroke();
  x.fillStyle='rgba(177,215,115,.24)';x.beginPath();x.ellipse(cx+dx-8+wind,base+dy-12,rx*.63,ry*.3,-.2,0,Math.PI*2);x.fill();
 }
 for(let i=0;i<12;i++){
  const px=cx+Math.sin(i*2.3+variant)*65,py=base-235+Math.cos(i*1.7)*31;x.fillStyle=i%3?'#89be62':'#b3d579';x.beginPath();x.ellipse(px,py,4,2.5,i,0,Math.PI*2);x.fill();
 }
 for(let i=0;i<3;i++){const px=cx-42+i*38,py=base-207-Math.sin(i+variant)*15;x.fillStyle=variant===1?'#e78761':'#dfb356';x.beginPath();x.arc(px,py,5,0,Math.PI*2);x.fill();x.fillStyle='#fff0bc';x.beginPath();x.arc(px-1,py-1,1.3,0,Math.PI*2);x.fill()}
 x.strokeStyle='#6e4c37';x.lineWidth=2;for(let i=0;i<4;i++){x.beginPath();x.moveTo(cx-7+i*6,base-15);x.quadraticCurveTo(cx-10+i*5,base-75,cx-8+i*5,base-145-i*12);x.stroke()}
 x.fillStyle='#674c35';x.beginPath();x.ellipse(cx+3,base-76,4,8,.1,0,Math.PI*2);x.fill();
 x.fillStyle='#ffe3a1';x.strokeStyle='#9a7141';x.lineWidth=3;x.beginPath();x.arc(tree.hookX,tree.hookY,6,0,Math.PI*2);x.fill();x.stroke();x.restore();
}
function drawGrassStrip(left,right,surface){
 const from=Math.max(left,camera-90),to=Math.min(right,camera+W+90);
 if(worldSettings().theme==='crystal'){
  x.fillStyle='#f5daa0';x.fillRect(from,surface,to-from,13);x.strokeStyle='#d7b77a';x.lineWidth=1.5;
  for(let px=Math.ceil(from/31)*31;px<to;px+=31){x.beginPath();x.moveTo(px-8,surface+5);x.quadraticCurveTo(px,surface+Math.sin(px)*2+2,px+9,surface+5);x.stroke();x.fillStyle='#bda06a';x.fillRect(px+5,surface+9,2,1)}return;
 }
 if(worldSettings().theme==='water'){x.fillStyle='#eadcba';x.fillRect(from,surface,to-from,10);x.fillStyle='#becab9';for(let px=from+10;px<to;px+=27){x.beginPath();x.ellipse(px,surface+11,4,2,0,0,Math.PI*2);x.fill()}return}
 if(worldSettings().theme==='moon'){x.fillStyle='#d5dfe7';x.fillRect(from,surface,to-from,8);x.fillStyle='#9cabb9';for(let px=from+12;px<to;px+=36){x.beginPath();x.ellipse(px,surface+12,7,3,0,0,Math.PI*2);x.fill()}return}
 if(worldSettings().theme==='frost'){x.fillStyle='#f6fcff';x.fillRect(from,surface,to-from,13);x.strokeStyle='#a9d8ec';x.lineWidth=2;for(let px=from;px<to;px+=32){x.beginPath();x.moveTo(px,surface+5);x.lineTo(px+12,surface+20);x.lineTo(px+19,surface+5);x.stroke()}return}
 if(worldSettings().theme==='kitchen'){x.fillStyle='#fff';x.fillRect(from,surface,to-from,12);x.strokeStyle='#cfd7dc';x.lineWidth=2;x.beginPath();x.moveTo(from,surface);x.lineTo(to,surface);x.stroke();return}
 x.fillStyle='#437d49';x.fillRect(from,surface,to-from,19);x.fillStyle='#76b758';x.beginPath();x.moveTo(from,surface+1);for(let px=from;px<=to;px+=5)x.lineTo(px,surface+1+Math.sin(px*.16)*1.5);x.lineTo(to,surface+10);x.lineTo(from,surface+10);x.closePath();x.fill();
 x.lineWidth=1.5;x.lineCap='round';
 for(let px=Math.ceil(from/9)*9;px<to;px+=9){
  const seed=Math.sin(px*1.71),height=4+(seed+1)*3,wind=Math.sin(tick*.04+px*.03)*2;
  x.strokeStyle=seed>0?'#aed47a':'#5d9e48';x.beginPath();x.moveTo(px,surface+5);x.quadraticCurveTo(px+wind,surface-height*.3,px-2+wind,surface-height);x.moveTo(px,surface+5);x.lineTo(px+4+wind,surface-height*.65);x.stroke();
  if(Math.round(px/9)%31===0){x.fillStyle='#f5d880';x.beginPath();x.arc(px-2,surface-height-1,2.2,0,Math.PI*2);x.fill();x.fillStyle='#fff0b5';x.beginPath();x.arc(px-2,surface-height-1,1,0,Math.PI*2);x.fill()}
 }
}
