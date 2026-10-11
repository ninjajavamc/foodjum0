// Tiny synthesized effects. Audio starts only after a user gesture; works offline.
let audioContext=null,audioMaster=null,soundEnabled=true;
const MUSIC_SOURCES={menu:'assets/audio/menu.mp3',overworld:'assets/audio/overworld.mp3',boss:'assets/audio/boss.mp3',sewer:'assets/audio/sewer.mp3'};
const MENU_MUSIC_SCREENS=new Set(['start','levelselect','choose','buddy']);
let backgroundMusic=null,musicScene=null,musicSession=null,musicUnlocked=false,musicFocused=true,musicPending=false,musicBlocked=false,musicRequest=0;
const unavailableMusic=new Set();
function syncMusic(){
 let scene=null;
 if(musicUnlocked&&musicFocused&&soundEnabled){
  if(MENU_MUSIC_SCREENS.has(screen))scene='menu';
  else if(screen==='play')scene=boss?(boss.dead?null:'boss'):undergroundTrip?'sewer':'overworld';
 }
 if(backgroundMusic)backgroundMusic.muted=!soundEnabled;
 if(!scene||unavailableMusic.has(scene)){
  if(backgroundMusic&&!backgroundMusic.paused)backgroundMusic.pause();
  if(musicPending){musicRequest++;musicPending=false}
  return;
 }
 if(musicBlocked||typeof globalThis.Audio!=='function')return;
 try{
  if(!backgroundMusic){backgroundMusic=new Audio();backgroundMusic.loop=true;backgroundMusic.preload='auto';backgroundMusic.volume=.28;backgroundMusic.addEventListener('error',()=>{if(musicScene)unavailableMusic.add(musicScene)})}
  const session=scene==='menu'?'menu':scene==='overworld'?player:scene==='boss'?boss:undergroundTrip;
  if(musicScene!==scene||musicSession!==session){
   backgroundMusic.pause();musicRequest++;musicPending=false;
   if(musicScene!==scene)backgroundMusic.src=MUSIC_SOURCES[scene];
   backgroundMusic.currentTime=0;musicScene=scene;musicSession=session;
  }
  if(!backgroundMusic.paused||musicPending)return;
  musicPending=true;const request=++musicRequest;
  const failed=error=>{if(request!==musicRequest)return;musicPending=false;if(error?.name==='NotAllowedError')musicBlocked=true;else if(error?.name!=='AbortError')unavailableMusic.add(scene)};
  const played=backgroundMusic.play();
  if(played&&typeof played.then==='function')played.then(()=>{if(request===musicRequest)musicPending=false},failed);else musicPending=false;
 }catch(error){musicPending=false;if(error?.name==='NotAllowedError')musicBlocked=true;else unavailableMusic.add(scene)}
}
function setMusicFocus(focused){musicFocused=focused;syncMusic()}
const SOUND_NOTES={
 jump:[[330,.07],[520,.1]],special:[[440,.06],[660,.07]],pickup:[[660,.08],[880,.08],[1100,.12]],
 damage:[[150,.1],[95,.12]],defeat:[[480,.05],[250,.09]],pop:[[820,.03],[230,.05]],
 fire:[[170,.05],[250,.07]],splash:[[120,.08]],menu:[[520,.05]],
 victory:[[523,.15],[659,.15],[784,.15],[1047,.3]],death:[[330,.12],[220,.12],[110,.2]],boss:[[165,.14],[220,.18]]
};
function unlockAudio(){
 musicUnlocked=true;musicBlocked=false;syncMusic();
 if(!soundEnabled)return;
 const Context=globalThis.AudioContext||globalThis.webkitAudioContext;
 if(!Context)return;
 try{
  if(!audioContext){audioContext=new Context();audioMaster=audioContext.createGain();audioMaster.gain.value=.08;audioMaster.connect(audioContext.destination)}
  if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
 }catch(_){/* Audio is optional; never stop gameplay. */}
}
function playSound(name){
 syncMusic();
 if(!soundEnabled||!audioContext||audioContext.state!=='running')return;
 const notes=SOUND_NOTES[name]||SOUND_NOTES.special;let offset=0;
 for(const [frequency,duration] of notes){
  const start=audioContext.currentTime+offset,oscillator=audioContext.createOscillator(),gain=audioContext.createGain();oscillator.type=['damage','splash','fire'].includes(name)?'triangle':'sine';oscillator.frequency.setValueAtTime(frequency,start);
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.7,start+.01);gain.gain.exponentialRampToValueAtTime(.001,start+duration);oscillator.connect(gain);gain.connect(audioMaster);oscillator.start(start);oscillator.stop(start+duration+.02);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect()};offset+=duration*.8;
 }
}
function toggleAudio(){
 soundEnabled=!soundEnabled;if(audioMaster)audioMaster.gain.value=soundEnabled?.08:0;if(soundEnabled){unlockAudio();playSound('menu')}
 syncMusic();
 const button=document.querySelector('#soundToggle');if(button){button.textContent=soundEnabled?'Ton: AN':'Ton: AUS';button.setAttribute('aria-pressed',String(soundEnabled))}
}
