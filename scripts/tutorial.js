// A fixed, forgiving learning world: every mechanic has a hands-on station.
let tutorialCheckpoint=150,tutorialBossRound=1,tutorialPowerSet=0;
const TUTORIAL_LESSONS=[
 {x:150,title:'Willkommen in Totarial',lines:['A/D oder Pfeile: laufen. Space: springen.','Handy: die großen Tasten unten benutzen.','Esc / II pausiert. Weiter rechts lernst du alles.']},
 {x:650,title:'Springen, Lava und Klippen',lines:['Spring über Lava, Löcher und Stacheln.','Kisten und bewegliche Plattformen tragen dich.','Hier darfst du üben: verlorene Leben kommen zurück.']},
 {x:1400,title:'Gegner und Leben',lines:['Von oben auf Gegner springen: sicherer Stampfer.','Seitlicher Kontakt kostet Leben; Bosse kosten 2.','20 HP, Punkte und Abklingzeit stehen oben.','Honig-Gegner: seitlicher Kontakt bremst 3 s.']},
 {x:1850,title:'Powers ausprobieren',kind:'powers',lines:['W: Pilz + Kaugummi, Wasabi + Feder, Marshmallow.','1/2 wählt, F benutzt: Pilz heilt, Kaugummi trägt.','Wasabi: 10 s Feuer mit F. Feder: 5 s hohe Sprünge.']},
 {x:2200,title:'Marshmallow und Wind',kind:'wind',lines:['W gibt Marshmallow und startet Übungswind.','F aktiviert 15 s. Beim Fallen Space halten: gleiten.','Wind ab Welt 3: alle 90 s für 5 s, bremst dich.','Mit Marshmallow weht er dich nach hinten!']},
 {x:2400,title:'Spaghetti',kind:'character',value:0,lines:['W wechselt zu Spaghetti. E hängt dich an Haken.','Zweimal schwingen, dann 5 s Abklingzeit.','Space lässt los. A/D gibt Schwung.']},
 {x:3050,title:'Mandarine',kind:'character',value:1,lines:['W wechselt zur Mandarine. E ruft vier Babys.','Die Babys kämpfen 5 s für dich: je 0,5 HP.','Du bleibst dabei die große Mandarine.']},
 {x:3500,title:'Captain Banana',kind:'character',value:2,lines:['W wechselt zur Banane. E legt eine Schale.','Der Bumerang fliegt zurück und macht 2 HP.','Die Schale bremst Gegner.']},
 {x:3950,title:'Kartoffel',kind:'character',value:3,lines:['W wechselt zur Kartoffel. E schießt den Hut.','Ziele mit A/D nach links oder rechts.','Teste die Fähigkeit an den Übungsgegnern.']},
 {x:4400,title:'Granatapfel und Geheimgang',kind:'character',value:4,lines:['W wechselt zum Granatapfel. E: Explosion.','Nur die Explosion öffnet die rissige Wand.','Im Geheimgang liegen zusätzliche Materialien.']},
 {x:4900,title:'Ein Begleiter pro Level',lines:['Deine Wahl bleibt im ganzen Level dieselbe.','Schwamm: Cola aufsaugen und auf Gegner werfen.','Hund: ein Biss alle 3 s, 0,5 HP Schaden.','Tube schießt, Bürste schrubbt: je 0,5 HP.']},
 {x:5350,title:'Cola und Mentos',lines:['Mentos treffen Flaschen: Cola läuft dauerhaft aus.','Flaschen sind fest, Pfützen kosten Leben.','Nutze den Schwamm, um ganze Pfützen aufzusaugen.']},
 {x:5800,title:'Inventar und Werkbank',kind:'supplies',lines:['W füllt alle sechs Baumaterialien zum Üben auf.','I: Inventar. B: Werkbank. Rezept wählen, C bauen.','2 Power-Plätze, 3 Bau-Plätze. R legt etwas ab.']},
 {x:6100,title:'Leiter und Steinmauer',kind:'supplies',lines:['Leiter: freier Boden, Plattform oder hohe Mauer.','3/4/5 wählt Bausätze. F stellt sie auf.','An Leitern W hoch, S runter, Space abspringen.']},
 {x:7100,title:'Katapult und hohe Mauern',kind:'supplies',lines:['Katapult: 2 Stein + Löffel + 2 Holz, dann F.','W einsteigen, A/D zielen, W schießt dich ab.','Ohne Passagier wirft es 8 Steine à 2 HP.']},
 {x:7950,title:'Gully und Kanalisation',lines:['W am Gully: in den Kanal gehen.','Dort schießen Schimmelkäse Sporen; Donuts laufen.','Am Ende die Leiter mit W hoch: zurück ins Level.']},
 {x:9700,title:'Schlüssel und Bosskampf',lines:['Sammle den Schlüssel und öffne die Tür mit W.','Bosse bekommen ab halben HP neue Attacken.','Bosskämpfe gibt es in den echten Welten.']},
 {x:10450,title:'Bereit für die echten Welten?',lines:['Mit Schlüssel: W an der Boss-Tür drücken.','Die Tür beendet Totarial zum Hauptmenü.','Echte Welten werden schwerer, ohne Erklärtexte.']},
 {x:4650,title:'Drei Arten von Geheimgang',lines:['Granatapfel öffnet die rissige Wand mit E.','Nicht immer Beute: auch Abkürzung oder Gully.','Probiere die weiteren Wände vor dem Schlüssel.']},
 {x:5650,title:'Käseregen üben',kind:'weather',lines:['W startet hier einen kurzen Übungsschauer.','Welt 3: nach 30 s, dann 30–45 s Pause.','Nur ein kleines Gebiet. Treffer: 0,2 HP.']},
 {x:9180,title:'Abkürzung üben',lines:['Öffne die nächste rissige Wand mit E.','Unten W an der Pfeiltür: weiter vorne raus.','Die Abkürzung enthält nicht automatisch Items.']},
 {x:9470,title:'Geheimer Gully',lines:['Öffne diese rissige Wand mit E, dann W am Gully.','Im Kanal rechts vom Ausgang wartet eine Truhe.','W öffnet sie: Powers, Material oder Heilung.','5 % Chance: zweiter Begleiter bis Levelende!']},
 {x:9790,title:'Wackelpudding',lines:['Ab Welt 4 kann Pudding dich festhalten.','Drücke 6-mal Space / die Sprungtaste.','Gedrückt halten zählt nicht als mehrere Sprünge.']},
 {x:10100,title:'Mond-Schwerkraft üben',kind:'moon',lines:['W schaltet die Mond-Schwerkraft an oder aus.','Auf dem Mond: nur ein Sechstel Schwerkraft.','Sprünge und Fallen dauern deutlich länger.']},
 {x:10250,title:'Die neuen Bosse',lines:['Küche: Gewitter-Croissant mit Blitzgeschossen.','Wolken-Bäckerei: fliegende Zuckerwatte.','Popcorn, Triple Bigmac, Fischstäbchen: weitere Bosse.','Rote Zielzone: einmal 10 HP, rechtzeitig weg!']}
].sort((a,b)=>a.x-b.x);
function spawnTutorial(){
 tutorialCheckpoint=150;tutorialBossRound=1;tutorialPowerSet=0;
 lavaPits.push({x:930,w:85,y:ground});cliffs.push({x:1160,w:80,y:ground});
 obstacles.push({type:'crate',x:810,y:ground-60,w:65,h:60},{type:'spikes',x:1280,y:ground-18,w:36,h:18});
 platforms.push({x:1030,y:ground-80,w:85,h:18},{x:1250,y:ground-140,baseY:ground-140,w:90,h:18,moving:true,phase:0});
 for(const px of [2500,2760]){trees.push({x:px-60,baseY:ground,hookX:px,hookY:ground-210});hooks.push({x:px,y:ground-210,tree:true})}
 for(const lesson of TUTORIAL_LESSONS)objects.push({type:'lesson',x:lesson.x,y:ground-95,w:50,h:95,lesson});
 objects.push({type:'lunchbox',x:500,y:ground-48,w:60,h:48,used:false});
 const wall={type:'secretWall',x:4550,y:ground-85,w:62,h:85,life:Infinity};secretPassages.push({x:4550,w:260,base:ground,open:false,wall,kind:'loot'});objects.push(wall);
 objects.push({type:'cola',x:5510,y:ground-145,w:64,h:145,liquid:.9,used:false});
 for(const px of [6280,7480])objects.push({type:'greatWall',x:px,y:ground-390,w:140,h:390});
 for(const [i,material] of Object.keys(MATERIALS).entries())objects.push({type:'material',material,quantity:12,x:5800+i*45,y:ground-38,w:36,h:36,constructionSupply:true});
 objects.push({type:'manhole',x:8150,y:ground-10,w:70,h:12,exitX:9050},{type:'manholeOutlet',x:9050,y:ground-10,w:70,h:12},{type:'key',x:9920,y:ground-60,w:34,h:46,collected:false});
 enemies=[1500,3220,3720,4150,5600,6840,9410,10100].map((px,i)=>({type:i===4?'lemon':['gummy','honey','donut'][i%3],x:px,y:ground-42,w:42,h:42,hp:i===0?1:3,damage:1,vx:0,vy:0,shoot:260,dead:0,slow:0}));
 for(const [px,width,kind] of [[9200,220,'shortcut'],[9550,200,'gully']]){const hiddenWall={type:'secretWall',x:px,y:ground-85,w:62,h:85,life:Infinity};secretPassages.push({x:px,w:width,base:ground,open:false,wall:hiddenWall,kind});objects.push(hiddenWall)}
 enemies.push({type:'pudding',x:9880,y:ground-46,w:58,h:46,hp:3,damage:0,vx:0,vy:0,shoot:1000,dead:0,slow:0});
 resetCompanion();message='Willkommen in Totarial!';
}
function currentTutorialLesson(){
 if(undergroundTrip)return {title:'Kanalisation üben',lines:['Schimmelkäse schießt Sporen, Donuts laufen.','Besitztümer und Leben bleiben beim Ausstieg erhalten.','Am Ende W an der Leiter hoch: Ausgang.']};
 if(boss)return {title:tutorialBossRound===1?'Übungsboss: Püree-Bär':'Übungsboss: Besteck-Trio',lines:['Spring von oben oder nutze E, Wasabi und Begleiter.','Rote Zone: einmal 10 HP! Beim Ausbruch wegspringen.','Bei 0 Leben wirst du hier sicher wiederbelebt.']};
 return TUTORIAL_LESSONS.filter(l=>l.x<=player.x+45).at(-1)||TUTORIAL_LESSONS[0];
}
function nearbyTutorialStation(){return isTutorial()&&!boss&&!undergroundTrip?objects.find(o=>o.type==='lesson'&&o.lesson.kind&&Math.abs(player.x+player.w/2-o.x)<115):null}
function interactTutorial(){
 const station=nearbyTutorialStation();if(!station)return false;
 const lesson=station.lesson;
 if(lesson.kind==='character'){selected=lesson.value;player.cooldown=0;player.swingsUsed=0;player.swingCooldown=0;player.swing=null}
 if(lesson.kind==='powers'){player.inventory=[['mushroom','gum'],['wasabi','springKit'],['marshmallow']][tutorialPowerSet++%3].slice();player.inventoryIndex=0;player.inventoryCategory='powers';player.hp=Math.min(player.hp,18)}
 if(lesson.kind==='wind'){player.inventory=['marshmallow'];player.inventoryIndex=0;player.inventoryCategory='powers';startWorldWind(true)}
 if(lesson.kind==='weather')startCheeseShower(player.x-120,true);
 if(lesson.kind==='moon')player.practiceMoon=!player.practiceMoon;
 if(lesson.kind==='supplies')for(const material of Object.keys(MATERIALS))player.bag[material]=Math.max(player.bag[material]||0,30);
 playSound('pickup');message=lesson.title;return true;
}
function updateTutorial(){
 if(!isTutorial()||boss||undergroundTrip)return;
 const lesson=currentTutorialLesson();tutorialCheckpoint=lesson.x;
}
function reviveTutorial(){
 player.hp=MAX_HP;player.inv=180;player.slow=0;player.honeyTime=0;
 resetTraversalPosition(boss?150:undergroundTrip?150:tutorialCheckpoint,ground);resetCompanion();message='Noch einmal üben – deine Leben sind wieder voll.';
}
function drawTutorialMarkers(){
 if(!isTutorial()||boss||undergroundTrip)return;
 for(const o of objects.filter(o=>o.type==='lesson'&&o.x>camera-70&&o.x<camera+viewWidth+70)){
  x.fillStyle='#568878';x.fillRect(o.x+20,ground-75,7,75);x.fillStyle='#fff0b8';x.strokeStyle='#587e78';x.lineWidth=3;x.fillRect(o.x-15,ground-125,76,52);x.strokeRect(o.x-15,ground-125,76,52);x.fillStyle='#315a65';x.font='bold 18px system-ui';x.textAlign='center';x.fillText(String(TUTORIAL_LESSONS.indexOf(o.lesson)+1),o.x+23,ground-93);
 }
}
function drawTutorialPanel(){
 if(!isTutorial())return;
 const lesson=currentTutorialLesson();x.save();x.fillStyle='rgba(30,58,65,.95)';x.fillRect(552,110,428,149);x.strokeStyle='#f4d78d';x.lineWidth=2;x.strokeRect(552,110,428,149);x.textAlign='left';x.fillStyle='#ffedb5';x.font='bold 19px system-ui';x.fillText(lesson.title,567,137);x.fillStyle='#fff';x.font='14px system-ui';lesson.lines.forEach((line,i)=>x.fillText(line,567,163+i*24));if(nearbyTutorialStation()){x.fillStyle='#aee5bc';x.fillText('W / NUTZEN: hier ausprobieren',567,247)}x.restore();
}
