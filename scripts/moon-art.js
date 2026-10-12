function drawMoonBackground(){
 const W=viewWidth,H=viewHeight;
 x.fillStyle='#151f36';x.fillRect(0,-viewOffsetY,W,H+viewOffsetY);x.fillStyle='#dbe7f4';for(let i=0;i<70;i++)x.fillRect((i*139+17)%W,15+(i*73)%300,i%4?2:3,2);
 x.fillStyle='#7fb4d1';x.beginPath();x.arc(825,103,47,0,Math.PI*2);x.fill();x.fillStyle='#8fb99b';for(let i=0;i<4;i++){x.beginPath();x.ellipse(811+i*9,79+i*13,14,9,i*.6,0,Math.PI*2);x.fill()}
 for(let row=0;row<3;row++){x.fillStyle=['#48566d','#64748a','#8995a5'][row];x.beginPath();x.moveTo(0,H);for(let px=0;px<=W+30;px+=30)x.lineTo(px,350+row*55+Math.sin((px+camera*(.1+row*.13))*.006)*35);x.lineTo(W,H);x.closePath();x.fill()}
}
function drawMoonRock(tree){
 const cx=tree.x,base=tree.baseY??ground;x.save();x.fillStyle='#aeb9c5';x.strokeStyle='#66798b';x.lineWidth=3;x.beginPath();x.moveTo(cx-35,base);x.lineTo(cx-29,base-157);x.lineTo(cx-5,base-223);x.lineTo(cx+26,base-180);x.lineTo(cx+36,base);x.closePath();x.fill();x.stroke();x.fillStyle='#7d8fa1';for(let i=0;i<4;i++){x.beginPath();x.ellipse(cx+(i%2?9:-10),base-35-i*39,7,11,.2,0,Math.PI*2);x.fill()}
 x.strokeStyle='#bfd0dc';x.lineWidth=7;x.beginPath();x.moveTo(cx,tree.hookY+35);x.lineTo(tree.hookX,tree.hookY);x.stroke();x.fillStyle='#ffe7a0';x.strokeStyle='#9a855c';x.lineWidth=2;x.beginPath();x.arc(tree.hookX,tree.hookY,6,0,Math.PI*2);x.fill();x.stroke();x.restore();
}
