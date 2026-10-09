// Tiny synthesized effects. Audio starts only after a user gesture; works offline.
let audioContext=null,audioMaster=null,soundEnabled=true;
const SOUND_NOTES={
 jump:[[330,.07],[520,.1]],special:[[440,.06],[660,.07]],pickup:[[660,.08],[880,.08],[1100,.12]],
 damage:[[150,.1],[95,.12]],defeat:[[480,.05],[250,.09]],pop:[[820,.03],[230,.05]],
 fire:[[170,.05],[250,.07]],splash:[[120,.08]],menu:[[520,.05]],
 victory:[[523,.15],[659,.15],[784,.15],[1047,.3]],death:[[330,.12],[220,.12],[110,.2]],boss:[[165,.14],[220,.18]]
};
function unlockAudio(){
 if(!soundEnabled)return;
 const Context=globalThis.AudioContext||globalThis.webkitAudioContext;
 if(!Context)return;
 try{
  if(!audioContext){audioContext=new Context();audioMaster=audioContext.createGain();audioMaster.gain.value=.08;audioMaster.connect(audioContext.destination)}
  if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
 }catch(_){/* Audio is optional; never stop gameplay. */}
}
function playSound(name){
 if(!soundEnabled||!audioContext||audioContext.state!=='running')return;
 const notes=SOUND_NOTES[name]||SOUND_NOTES.special;let offset=0;
 for(const [frequency,duration] of notes){
  const start=audioContext.currentTime+offset,oscillator=audioContext.createOscillator(),gain=audioContext.createGain();oscillator.type=['damage','splash','fire'].includes(name)?'triangle':'sine';oscillator.frequency.setValueAtTime(frequency,start);
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.7,start+.01);gain.gain.exponentialRampToValueAtTime(.001,start+duration);oscillator.connect(gain);gain.connect(audioMaster);oscillator.start(start);oscillator.stop(start+duration+.02);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect()};offset+=duration*.8;
 }
}
function toggleAudio(){
 soundEnabled=!soundEnabled;if(audioMaster)audioMaster.gain.value=soundEnabled?.08:0;if(soundEnabled){unlockAudio();playSound('menu')}
 const button=document.querySelector('#soundToggle');if(button){button.textContent=soundEnabled?'Ton: AN':'Ton: AUS';button.setAttribute('aria-pressed',String(soundEnabled))}
}
