// Frozen ice-cream landscape and waffle-cone trees, all drawn locally.
function drawFrostBackground(){
 const sky=x.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#95c9ec');sky.addColorStop(1,'#ecf9ff');x.fillStyle=sky;x.fillRect(0,0,W,H);
 for(let layer=0;layer<3;layer++){x.fillStyle=['#c7e0ef','#acd0e5','#8fbdd7'][layer];x.beginPath();x.moveTo(0,H);for(let px=-70;px<W+100;px+=70)x.lineTo(px,300+layer*70-Math.abs(Math.sin((px+camera*(.1+layer*.1))*.005))*110-cameraY*.15);x.lineTo(W,H);x.closePath();x.fill()}
 for(let i=0;i<48;i++){const px=((i*137-camera*.15)%(W+50)+W+50)%(W+50),py=(i*91+tick*.35)%H;x.fillStyle='rgba(255,255,255,.85)';x.beginPath();x.arc(px,py,2+i%2,0,Math.PI*2);x.fill()}
}
function drawIceCreamTree(tree){
 const cx=tree.x,base=tree.baseY??ground;x.save();x.strokeStyle='#a58564';x.lineWidth=3;x.fillStyle='#d9b783';x.beginPath();x.moveTo(cx-40,base-140);x.lineTo(cx+40,base-140);x.lineTo(cx+10,base);x.lineTo(cx-10,base);x.closePath();x.fill();x.stroke();x.strokeStyle='#b68e5e';x.lineWidth=2;
 for(let i=0;i<5;i++){x.beginPath();x.moveTo(cx-32+i*12,base-136);x.lineTo(cx+12,base-10-i*20);x.stroke();x.beginPath();x.moveTo(cx+32-i*12,base-136);x.lineTo(cx-12,base-10-i*20);x.stroke()}
 for(const [dx,dy,r,color] of [[-23,-157,42,'#f7d3df'],[25,-169,43,'#d4edfa'],[0,-215,44,'#fff2cf']]){x.fillStyle=color;x.strokeStyle='#98b6c6';x.beginPath();x.arc(cx+dx,base+dy,r,0,Math.PI*2);x.fill();x.stroke();x.fillStyle='rgba(255,255,255,.65)';x.beginPath();x.ellipse(cx+dx-12,base+dy-14,15,8,-.3,0,Math.PI*2);x.fill()}
 x.strokeStyle='#b0d7e8';x.lineWidth=8;x.beginPath();x.moveTo(cx,tree.hookY+15);x.lineTo(tree.hookX,tree.hookY);x.stroke();x.fillStyle='#ffe4a0';x.strokeStyle='#a58e69';x.lineWidth=2;x.beginPath();x.arc(tree.hookX,tree.hookY,6,0,Math.PI*2);x.fill();x.stroke();x.restore();
}
