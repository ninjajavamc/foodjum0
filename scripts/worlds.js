// World identities and a gentle, explicit difficulty progression.
const LEVEL_SETTINGS={
 0:{name:'Totarial',width:11000,enemies:9,theme:'training',enemySpeed:.65,shootRate:1.3,gap:85,moving:.2},
 1:{name:'Wiesenwald',width:9000,enemies:12,theme:'forest',enemySpeed:1,shootRate:1,gap:85,moving:.35},
 2:{name:'Kristallwüste',width:10500,enemies:14,theme:'crystal',enemySpeed:1.2,shootRate:.82,gap:105,moving:.6},
 3:{name:'Küche',width:11250,enemies:17,theme:'kitchen',enemySpeed:1.35,shootRate:.72,gap:115,moving:.65},
 4:{name:'Frostige Eiscreme',width:12000,enemies:20,theme:'frost',enemySpeed:1.5,shootRate:.64,gap:120,moving:.7},
 5:{name:'Mond',width:25500,enemies:46,theme:'moon',enemySpeed:1.65,shootRate:.6,gap:135,moving:.72},
 6:{name:'Unterwasser',width:9667,enemies:21,theme:'water',enemySpeed:1.8,shootRate:.55,gap:145,moving:.75}
};
function worldGravity(){if(level===6)return .08;return (level===5||(isTutorial()&&player?.practiceMoon)) ? .58/6 : .58;}
function worldJumpSpeed(){return (level===5||(isTutorial()&&player?.practiceMoon)) ? 7.5 : JUMP_SPEED;}
function worldSettings(){return LEVEL_SETTINGS[level]||LEVEL_SETTINGS[1]}
function worldFloorColors(){
 if(undergroundTrip)return ['#8b9690','#455b59'];
 return worldSettings().theme==='water'?['#e2d5af','#b0bcae']:worldSettings().theme==='moon'?['#c7d0da','#8595a8']:worldSettings().theme==='frost'?['#edf9ff','#8ebbd8']:worldSettings().theme==='crystal'?['#efd195','#c8a369']:worldSettings().theme==='kitchen'?['#fffefd','#edf0f3']:['#bd956a','#795840'];
}
function worldName(id=level){return (LEVEL_SETTINGS[id]||LEVEL_SETTINGS[1]).name}
function isTutorial(){return level===0}
function showGameplayHints(){return isTutorial()}
function updateHintVisibility(){const hint=document.querySelector('#hint');if(hint?.style)hint.style.display=MENU_MUSIC_SCREENS.has(screen)||isTutorial()?'':'none'}
