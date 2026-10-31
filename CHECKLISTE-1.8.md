# BidBattle 1.8 – gemeinsame Korrektur- und Freigabeliste

## Umgesetzt im lokalen 1.8-Entwicklungsstand

- [x] **Premium-Pokal statt einfacher SVG-Nachzeichnung:** vorhandene originalgetreue 3D-Grafik mit Controller (links), goldfarbenem Pokal inklusive „BidBattle“ (Mitte), Würfel (rechts), auf Desktop und Handy identisches Motiv.
- [x] **Modus-Symbole in der Lobby:** ⚽ 🍔 🦸 🎲 mittig innerhalb der Modus-Kacheln; keine alten Foto-Kacheln.
- [x] **Großes Vorschau-Symbol beim Lobby-Erstellen:** das große Fußball-Emoji oder das entsprechende Emoji des gewählten Modus ist **horizontal UND vertikal in der gesamten hellblauen Vorschaufläche** zentriert. Dieser Punkt bezieht sich ausdrücklich auf den Screenshot vom 31.10.2026 (linke Spalte „Dein Spielmodus“), nicht nur auf die kleinen Lobby-Kacheln.
- [x] **Siegerpodium:** zwei gleich breite Spalten, Trennabstand mittig im Viewport; 2. Platz links niedriger, 1. Platz rechts höher; gesammelte Spieler/Items jeweils *unter* dem zugehörigen Spieler/Podest. Kein dritter Platz in dieser Version.
- [x] **Avatare:** zwölf einfache auswählbare Emoji-Avatare; ältere Avatar-IDs werden zu Emojis umgewandelt.
- [x] **Mobil:** startseitiger Hero, Lobby-Moduskacheln und Podium mit Responsive-Regeln.
- [x] **Regressionstests:** Spielmodi, Gebote, Lobby-Rollen, Countdown, Reconnect, Wertung, erneutes Spielen; neue Tests für Layout-Elemente.
- [x] **Browserprüfung der Symbolzentrierung:** bei 1280px, 390px und 320px Bildschirmbreite gemessen; sichtbare Avatarauswahl bei 1280px/390px geprüft.

## Noch vor offizieller 1.8-Veröffentlichung offen

- [ ] **Originalquelle von 1.7.9.2 integrieren:** diesem ZIP liegt der letzte verfügbare Quellstand 1.7.9.1 zugrunde. Änderungen aus der späteren, neu gestalteten 1.7.9.2-Lobby sind ohne deren originalen HTML/CSS/JS-Code NICHT garantiert übernommen. Nicht einfach den Stand 1.7.9.2 überschreiben.
- [ ] **Echte Zwei-Geräte-Prüfung:** getrennte Sitzplätze, Angebote, Passen, Spielerwechsel, Siegerwertung, Reconnect, Gast-/Konto-Einstieg.
- [ ] **Render-Deployment prüfen:** erst nach Quellabgleich/Abnahme per GitHub-Update veröffentlichen.
- [ ] **Sicherheits-/Betriebsprüfung:** Persistenz/Umgebungsvariablen, Nutzerkonten, Datenschutz, Bildlizenzen vor öffentlicher Vollfreigabe beurteilen.

## Bewusst nicht verändert

- Keine neuen Spielmodi oder dritte Position auf dem Podium.
- Keine Änderung an Gebotsregeln, Budgets, Spielerzahlen oder Football-Formation.
- Keine Komplettneugestaltung des bisherigen hell-violetten Grundlayouts.
