// Original kitchen decoration: no foliage, just giant utensils and a tiled room.
function drawKitchenBackground(){
 const W=viewWidth,H=viewHeight;
 const wall=x.createLinearGradient(0,0,0,H);wall.addColorStop(0,'#f1f6f5');wall.addColorStop(1,'#d5e3e7');x.fillStyle=wall;x.fillRect(0,-viewOffsetY,W,H+viewOffsetY);
 x.strokeStyle='#cbd7d9';x.lineWidth=1;
 for(let px=-90;px<W+90;px+=90){const tx=px-(camera*.12%90);x.beginPath();x.moveTo(tx,0);x.lineTo(tx,H);x.stroke()}
 for(let py=45;py<H;py+=65){x.beginPath();x.moveTo(0,py);x.lineTo(W,py);x.stroke()}
 x.fillStyle='#b6dce9';x.fillRect(715,50,230,180);x.strokeStyle='#fff';x.lineWidth=12;x.strokeRect(715,50,230,180);x.beginPath();x.moveTo(830,50);x.lineTo(830,230);x.moveTo(715,140);x.lineTo(945,140);x.stroke();
 for(let i=-1;i<7;i++){
  const px=i*185-(camera*.2%185);x.fillStyle=i%2?'#84a9b5':'#99bbc4';x.fillRect(px,350,174,110);x.strokeStyle='#5f838d';x.lineWidth=3;x.strokeRect(px,350,174,110);x.fillStyle='#dbe4df';x.fillRect(px+72,383,29,7);
 }
 x.fillStyle='#f9faf8';x.fillRect(0,333,W,20);x.fillStyle='#bacbce';x.fillRect(0,351,W,4);
 x.strokeStyle='#8ea4aa';x.lineWidth=5;x.beginPath();x.moveTo(0,115);x.lineTo(570,115);x.stroke();
 for(let i=0;i<6;i++){const px=45+i*95;x.strokeStyle='#b6c9cd';x.lineWidth=6;x.beginPath();x.moveTo(px,115);x.lineTo(px,210);x.stroke();x.fillStyle=i%2?'#cedbe0':'#e6b987';x.beginPath();x.ellipse(px,221,15,22,0,0,Math.PI*2);x.fill();x.stroke()}
}
function drawKitchenProp(tree){
 const cx=tree.x,base=tree.baseY??ground,kind=Math.floor(Math.abs(cx)/600)%3;
 x.save();x.strokeStyle='#637a83';x.lineWidth=3;
 if(kind===0){
  x.fillStyle='#cb976c';x.fillRect(cx-7,base-151,14,151);x.strokeRect(cx-7,base-151,14,151);x.fillStyle='#b7c7cd';x.fillRect(cx-10,base-164,20,18);
  x.strokeStyle='#879ba5';x.lineWidth=3;for(let i=0;i<5;i++){x.beginPath();x.ellipse(cx,base-208,9+i*5,51,0,0,Math.PI*2);x.stroke()}
 }else if(kind===1){
  const wood=x.createLinearGradient(cx-26,0,cx+26,0);wood.addColorStop(0,'#b8794b');wood.addColorStop(.5,'#eac08b');wood.addColorStop(1,'#c28b59');x.fillStyle=wood;x.fillRect(cx-25,base-216,50,155);x.strokeStyle='#96633f';x.strokeRect(cx-25,base-216,50,155);x.fillRect(cx-7,base-61,14,61);x.fillRect(cx-7,base-257,14,41);x.strokeStyle='#d7a571';x.lineWidth=2;for(let i=0;i<4;i++){x.beginPath();x.moveTo(cx-15+i*9,base-208);x.lineTo(cx-15+i*9,base-70);x.stroke()}
 }else{
  const metal=x.createLinearGradient(cx-42,0,cx+42,0);metal.addColorStop(0,'#a6b7bf');metal.addColorStop(.4,'#eef4f5');metal.addColorStop(1,'#bacbd1');x.fillStyle=metal;x.fillRect(cx-42,base-120,84,112);x.strokeRect(cx-42,base-120,84,112);x.fillStyle='#637b83';x.fillRect(cx+41,base-98,54,13);x.fillRect(cx-13,base-142,26,17);x.fillStyle='#d5e1e5';x.fillRect(cx-48,base-124,96,8);x.strokeRect(cx-48,base-124,96,8);
 }
 x.strokeStyle='#a7bbc0';x.lineWidth=8;x.beginPath();x.moveTo(cx,tree.hookY+35);x.lineTo(tree.hookX,tree.hookY);x.stroke();x.fillStyle='#ffe2a0';x.strokeStyle='#927853';x.lineWidth=2;x.beginPath();x.arc(tree.hookX,tree.hookY,6,0,Math.PI*2);x.fill();x.stroke();x.restore();
}
