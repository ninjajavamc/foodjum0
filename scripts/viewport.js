// Keep world physics and menu layouts at their original size; expand only the view.
let viewWidth=1000,viewHeight=620,viewScale=1,viewPixelRatio=1,viewOffsetX=0,viewOffsetY=0;
function cameraTargetX(px,width=levelWidth){
 if(width<viewWidth)return (width-viewWidth)/2;
 return Math.max(0,Math.min(width-viewWidth,px-viewWidth*.35));
}
function resizeGameCanvas(){
 const r=c.getBoundingClientRect(),width=r.width||W,height=r.height||H;
 const oldWidth=viewWidth;
 viewScale=Math.min(width/W,height/H);
 viewWidth=width/viewScale;viewHeight=height/viewScale;
 viewOffsetX=(viewWidth-W)/2;viewOffsetY=(viewHeight-H)/2;
 viewPixelRatio=Math.min(2,Math.max(1,globalThis.devicePixelRatio||1));
 const pixelsW=Math.round(width*viewPixelRatio),pixelsH=Math.round(height*viewPixelRatio);
 if(c.width!==pixelsW)c.width=pixelsW;
 if(c.height!==pixelsH)c.height=pixelsH;
 if(oldWidth!==viewWidth&&player)camera=boss?cameraTargetX(player.x,W):cameraTargetX(player.x);
}
function beginWorldFrame(){
 const s=viewScale*viewPixelRatio;x.setTransform(s,0,0,s,0,viewOffsetY*s);
}
function beginUiFrame(game=false){
 const s=viewScale*viewPixelRatio;x.setTransform(s,0,0,s,viewOffsetX*s,(game?0:viewOffsetY)*s);
}
function fillViewport(){x.fillRect(-viewOffsetX,-viewOffsetY,viewWidth,viewHeight)}
function canvasUiPoint(e){
 const r=c.getBoundingClientRect();
 return {px:(e.clientX-r.left)/viewScale-viewOffsetX,py:(e.clientY-r.top)/viewScale-(screen==='play'?0:viewOffsetY)};
}
addEventListener('resize',()=>{resizeGameCanvas();heldPointers.clear();syncTouch();draw()});
