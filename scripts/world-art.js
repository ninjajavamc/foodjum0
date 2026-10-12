// Original themed scenery, intentionally distinct from the green first world.
function drawTrainingBackground(){
 const W=viewWidth,H=viewHeight;
 const sky=x.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#a5dedd');sky.addColorStop(1,'#fff5d9');x.fillStyle=sky;x.fillRect(0,-viewOffsetY,W,H+viewOffsetY);
 for(let row=0;row<2;row++){x.fillStyle=row?'#91c7a9':'#c4dbb6';x.beginPath();x.moveTo(0,H);for(let px=0;px<=W+20;px+=20)x.lineTo(px,380+row*70+Math.sin((px+camera*(.1+row*.12))*.004)*25);x.lineTo(W,H);x.closePath();x.fill()}
 x.strokeStyle='#68999b';x.lineWidth=2;x.beginPath();x.moveTo(0,115);x.quadraticCurveTo(W/2,180,W,115);x.stroke();
 for(let i=0;i<17;i++){const px=i*65,py=115+Math.sin(i/16*Math.PI)*32;x.fillStyle=['#df9b8f','#e3c777','#81b8b4'][i%3];x.beginPath();x.moveTo(px,py);x.lineTo(px+26,py+4);x.lineTo(px+13,py+28);x.closePath();x.fill()}
 for(let i=-1;i<Math.ceil(W/180)+2;i++){const px=i*180-(camera*.15%180);x.fillStyle='#d1c2a1';x.fillRect(px,405,7,69);x.fillStyle='#f5ecce';x.fillRect(px-42,405,90,8);x.fillRect(px-42,438,90,8)}
}
function drawCrystalBackground(){
 const W=viewWidth,H=viewHeight;
 const sky=x.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#292c61');sky.addColorStop(.6,'#9876ae');sky.addColorStop(1,'#e6a98b');x.fillStyle=sky;x.fillRect(0,-viewOffsetY,W,H+viewOffsetY);
 x.fillStyle='#fff0cf';x.beginPath();x.arc(835,90,38,0,Math.PI*2);x.fill();
 for(let i=0;i<44;i++){x.fillStyle=i%3?'#e9dfed':'#abe1ef';x.fillRect((i*139+37)%W,25+(i*73)%195,2,2)}
 for(const [i,color] of ['#65587f','#514b72','#444765'].entries()){
  const speed=.1+i*.13;x.fillStyle=color;x.beginPath();x.moveTo(0,H);
  for(let px=-80;px<W+100;px+=70){const world=px+camera*speed;x.lineTo(px,290+i*55-Math.abs(Math.sin(world*.007))*90-cameraY*speed)}x.lineTo(W,H);x.closePath();x.fill();
 }
 for(let i=-1;i<Math.ceil(W/170)+2;i++){const px=i*170-(camera*.25%170),py=440-cameraY*.25;x.fillStyle=i%2?'#a090b1':'#737e9f';x.beginPath();x.moveTo(px-23,py);x.lineTo(px-18,py-85);x.lineTo(px,py-145);x.lineTo(px+24,py-78);x.lineTo(px+27,py);x.closePath();x.fill()}
}
function drawCrystalSpire(tree){
 const base=tree.baseY??ground,cx=tree.x;x.save();x.strokeStyle='#65708f';x.lineWidth=3;
 for(const [dx,height,width,color] of [[-25,155,28,'#85bccc'],[12,255,35,'#c4a1d2'],[45,115,23,'#98c7da']]){
  x.fillStyle=color;x.beginPath();x.moveTo(cx+dx-width/2,base);x.lineTo(cx+dx-width/2,base-height+45);x.lineTo(cx+dx,base-height);x.lineTo(cx+dx+width/2,base-height+45);x.lineTo(cx+dx+width/2,base);x.closePath();x.fill();x.stroke();x.strokeStyle='#e1d4ee';x.beginPath();x.moveTo(cx+dx,base-height);x.lineTo(cx+dx,base-6);x.stroke();x.strokeStyle='#65708f';
 }
 x.strokeStyle='#c7b2d2';x.lineWidth=9;x.beginPath();x.moveTo(cx+12,tree.hookY+25);x.lineTo(tree.hookX,tree.hookY);x.stroke();x.fillStyle='#ffdf8f';x.strokeStyle='#956b52';x.lineWidth=2;x.beginPath();x.arc(tree.hookX,tree.hookY,6,0,Math.PI*2);x.fill();x.stroke();x.restore();
}
