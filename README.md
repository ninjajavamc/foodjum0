# Food Fighters

`index.html` in Chrome öffnen. Kein Server und kein Internet erforderlich.

## Steuerung
- **A/D oder Pfeiltasten:** laufen
- **Leertaste / ↑:** springen, beim Schwingen loslassen
- **E / ★:** Spezialfähigkeit; Spaghetti wechselt zum nächsten Haken in Laufrichtung
- **F / ITEM:** ausgewähltes Item benutzen; mit aktivem Wasabi erneut Feuer spucken
- **1 / 2 oder Inventarplatz antippen:** einen der zwei Item-Plätze auswählen
- **R:** ausgewähltes Item ablegen; später wieder einsammeln
- **I / BAG:** Inventar und Crafting-Feld öffnen (pausiert das Spiel)
- **C:** ausgewähltes Rezept an einer Werkbank herstellen
- **Q / TÜR:** Boss-Tür mit dem gefundenen Schlüssel öffnen
- **Ton-Button:** Sounds an/aus

Nach der Figur wählt ihr einen Begleiter. Beide folgen automatisch: Der Schwamm entfernt Cola-Pfützen schnell und wirft die gesammelte Cola auf Gegner; der Wursthund springt mit und greift nahe Gegner an.

Lunchboxen durch Berühren öffnen. Jede enthält genau ein zufälliges Item:
- Pilz: +1 HP (maximal 20)
- Kaugummi: zwei Sekunden nach oben schweben, dann platzt die Blase
- Wasabi: zehn Sekunden lang Feuerspucken mit F / ITEM

Der Spieler startet mit 20 HP. Der Boss verursacht 2 HP Schaden pro Treffer. Sprudel-Lava schadet ohne Wegschleudern. Auf Colaflaschen kann man stehen. Cola-Pfützen bleiben liegen, bis ein Schwamm sie aufsaugt. Die Flaschen stehen mit Abstand zu Löchern und Lava.

Hochplateaus, tiefe Wege, Klippen, Stacheln, Kisten und bewegliche Plattformen verlängern das Level. Die Kamera folgt auch nach oben und unten.

Items und Materialien liegen außerdem frei im Level. Zucker, Kräuter und Gewürze landen im Materialbeutel. An einer Werkbank I öffnen, Rezept auswählen und C oder „Herstellen“ drücken:
- Heilpilz: 2 Kräuter
- Kaugummi: 2 Zucker + 1 Kraut
- Wasabi: 1 Kraut + 2 Gewürze

Es gibt derzeit **nur Level 1**: 18.000 Einheiten lang, mit 24 Gegnern und dem Kartoffelpüree-Bär. Den goldenen Schlüssel im Level finden, am Ende Q drücken und den Boss besiegen. Danach: **Level nochmal** oder **Hauptmenü**. „Nächstes Level“ ist noch deaktiviert.

## Entwicklung
- Artwork neu erzeugen: `node scripts/build-art.cjs`
- Tests: `node tests/game.test.cjs`
- Bildquellen und Lizenzen: `credits.html`
