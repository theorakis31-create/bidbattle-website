# BidBattle – Version 1.8 (GitHub-Review, noch nicht veröffentlicht)

> **Integrationsstand:** Umgesetzt sind der originale Premium-Pokal, die zentrierten Modus-Emojis inklusive des großen Vorschau-Symbols, das symmetrische Zweierpodium und Layout-Regressionsprüfungen. Der Quellstand **1.7.9.2 fehlt**; Basis ist 1.7.9.1. **Vor Merge nach `main` unbedingt `CHECKLISTE-1.8.md` und `GITHUB-UPLOAD-ANLEITUNG.md` beachten.**

# BidBattle – Entwicklungsstand 1.7.9.1

## Neu in 1.7.9.1 – Einstieg und Avatare

- Freigegebenes **helles violett-blaues BidBattle-Design** konsequent auf das Fenster zur Raumerstellung übertragen.
- **Zwei übersichtliche Schritte**: (1) Spielername und Avatar, (2) echte vorhandene Spielregeln; danach wie bisher in der Lobby den Freund einladen.
- **12 eigens gestaltete, lokal mitgelieferte SVG-Avatare**; die bisherigen Emoji-Avatare in bestehenden Räumen und Konten bleiben kompatibel.
- Der Avatar wird auch in der Lobby, bei Auktionen und auf dem Siegerpodium angezeigt. Gastprofile werden lokal vorgemerkt; angemeldete Benutzer können ihre Auswahl als Profil speichern.
- Wer eine bestimmte Moduskarte oder Football-Variante anklickt, sieht **keine doppelte Spielmodus-Auswahl** mehr. Beim allgemeinen „Jetzt spielen“ bleibt die freie Moduswahl erhalten.
- Geöffnete Einstiegsaktionen werden bei der Wahl „Als Gast spielen“ oder nach Registrierung bzw. Anmeldung wieder aufgenommen.
- Erhalten: Budget, Varianten, Blind/Offen, Timer, Raumcodes, Gastzugang, Registrierung, Rückspiele und sämtliche bisherigen Spielfunktionen.
- Optisch geprüft auf Desktop und Smartphone. Automatisierte Tests inkl. Avatar-Auslieferung und Multiplayer-Sitzplätzen erfolgreich.
- **Nicht mit GitHub oder Render veröffentlichen**: Bis zum gemeinsamen Paket 1.8 nur gesicherter Entwicklungsstand.

## Historisch: 1.7.8.3 – Pokalmotiv wiederhergestellt

- Originales Pokal-/Controller-/Würfelmotiv als Ganzes eingesetzt, statt einen schmalen Bildstreifen zu verwenden.
- Goldener Pokal und Sockel sichtbar; Bildbegrenzungen werden nur am äußersten Rand überblendet.
- Der im Originalbild eingebettete Button wird unten sanft ausgeblendet. Die echten Startseiten-Buttons bleiben klickbar.
- Startseite und Mobilansicht visuell geprüft, Spiellogik unverändert.

- Das freigegebene Pokalmotiv nutzt einen korrekt gezeichneten Controller mit zwei Analogsticks, Steuerkreuz, vier Aktionstasten, Start/Select/Home sowie Schultertasten.
- Der violette Würfel zeigt geometrisch definierte und unterschiedliche 1, 2 und 3 Augen auf den drei sichtbaren Seiten. Die gegenüberliegenden Seiten wären 6, 5 und 4.
- Die vier Moduskarten nutzen statt generierter Fotos wieder Fußball-, Burger-, Superhelden- und Würfel-Symbole, mit jeweils abgestimmten Grün-, Apricot-, Blau- und Lavendelhintergründen.
- Die Modus-Buttons, das Startseitenlayout, die Lobby und alle Spielregeln bleiben unverändert.
- Dies ist ein lokaler Entwicklungsstand; GitHub/Render werden erst beim Gesamtupdate aktualisiert.

## Korrektur-Zwischenstand 1.7.8.1 – bildhafte Startseiten-Motive wiederhergestellt

Der vorherige 1.7.8-Versuch hat die vier großen Modusbilder in zu simple Vektorgrafiken verwandelt. Diese Änderung ist hier ausdrücklich zurückgenommen: Stattdessen verwendet die **Startseite** wieder die bildhaften Assets aus 1.7.7 (auch das große Pokalmotiv). Die Lobby und alle Spielansichten bleiben unverändert.

Die ursprünglichen Bilder sind gerenderte Illustrationen, keine echten Stockfotografien. Dieser Korrekturstand stellt nur die bisherigen bildhaften Motive wieder her; für echte Fotografien müssen noch passende Bilddateien und deren Nutzungsrechte geprüft werden. Nur Bilder wurden ausgetauscht. Die Startseitenstruktur und die gesamte Spiellogik bleiben identisch.

Dies ist **kein 1.8-Release** und erfordert **keinen GitHub- oder Render-Upload**.

## Zwischenstand 1.7.8 – nur Startseitenmotive

Dieses Update verändert **ausschließlich fünf Bilder auf der Startseite**: das Pokal-/Controller-/Würfelmotiv und die vier Bannerbilder. Aufbau, Farben der Seite, Kartenpositionen, sämtliche Buttons, Spielmodi, Lobby, Auktionen, Countdown, Multiplayer und Serverlogik bleiben unverändert. Die neuen Bilder heißen `home-hero-trophy.webp` und `home-mode-*.webp`; die bisherigen Modusbilder bleiben für die Lobby bestehen.

Wichtig: Die vier neuen Motive sind präzise konstruierte, weboptimierte **Vektorgrafiken** und keine echten Fotografien. Damit vermeiden wir pseudo-fotografische KI-Artefakte; die Fotosuche kann vor Veröffentlichung bei Bedarf noch fortgeführt werden. Der Würfel zeigt oben 1, links 2, rechts 3. Die gegenüberliegenden Standard-Würfelseiten ergeben jeweils 7.

Nur als Zwischenstand. Nicht bei Render/GitHub hochladen, bevor das Designpaket 1.8 abgeschlossen ist.

## Neu in Version 1.7.7 – Siegerpodium und Wikipedia-Fotolinks

- **Finale im freigegebenen Design:** Der bestätigte Gewinner steht auf dem goldenen Podium, der zweite Spieler auf Silber. Beide Sammlungen sind einsehbar, Fußballkarten enthalten Namen und Ratings.
- **Faire Unentschieden-Ansicht:** Wenn es keinen Gewinner gibt, erscheint ausdrücklich kein Platz-1-Sieger, sondern eine neutrale Remis-Darstellung.
- **Drei Abschlussaktionen:** Nochmal spielen (beide müssen zustimmen), Zur Lobby (Raum bleibt bestehen) und Spiel verlassen (andere Person wird informiert).
- **Wikipedia-Fotos:** Zusätzlich zum Commons-Dateilink erscheint bei einem geladenen Fußballerfoto ein Link zum zugeordneten englischen Wikipedia-Spielerartikel. Explizit durch Wikipedia bestätigte Weiterleitungen können nun aufgelöst werden; keine unzuverlässige Bildsuche nach Namen.
- **Bildrechte:** Die Wikipedia-Links sind keine automatische Nutzungslizenz. Fotograf, Lizenz und eventuelle Bedingungen müssen pro Datei geprüft werden; bei fehlendem eindeutig zugeordneten frei nutzbarem Foto bleibt der Flaggen-/Initialen-Fallback.
- **Stabilität:** Die komplette bisherige Spiellogik und alle bisherigen Designbereiche bleiben bestehen. Nur das Finale und die Bildquellen-Hinweise werden angepasst.

# BidBattle – Entwicklungsstand 1.7.7

## Neu in Version 1.7.5 – Countdown und die Food-/Hero-/Random-Auktion

- Verbindlicher ruhiger Arena-Look aus Version 1.7.4: dieselbe Hintergrunddatei bleibt für Lobby, Countdown und Auktion geladen, mit minimalen Lichtbewegungen und dezenter Überblendung beim Phasenwechsel.
- Neue Countdown-Darstellung (3–2–1–BID), beide Avatarkarten sichtbar, optionaler vorhandener Sound bleibt erhalten.
- Neu gestaltete laufende Auktion für Food Battle, Superhero und Random: dunkle Profilkarten mit Budget/Sammlung links und rechts, zentrale große Karte des **aktuellen** Items und getrenntes Gebotsfeld.
- Bedienbarer **Gebots-Schieberegler** plus exaktes Zahlenfeld und +1/+3/+5-Tasten; auch das Mindestgebot beim offenen Bieten wird respektiert. Bieten und Passen unverändert servervalidiert.
- Links auf der Itemkarte erscheint ausschließlich für eine **bereits tatsächlich angezeigte, abgeschlossene** Auktion ein Rückblickspfeil. Nie kommende Karten anzeigen.
- Die Vorlage zeigt fertige Gerichte und Millionenbeträge; wir behalten die **echten einzelnen Zutaten**, Food-Items und **virtuelle Euro-Beträge** des aktuellen Spiels.
- **Football-Auktionen und Siegerehrung bleiben unverändert** für spätere Designphasen. Kein GitHub-/Render-Upload bis zum gemeinsamen 1.8-Release.
- Bei den Auktionsmotiven handelt es sich zunächst um lokal gerenderte Symbol-Illustrationen, nicht um vorgetäuschte Fotos von fertigen Gerichten. Die Bildästhetik kann später separat verfeinert werden.


## Neu in Version 1.7.4: startseitennahes Lobby-Design

- **Startseite näher an der ausgewählten Vorlage**: ruhiger Stadionhintergrund, größerer Pokalbereich, gleiche Typografie, Farbwelt und vier Spielmodi. Kein neuer Modus.
- **Neue Lobby nach freigegebener Bildvorlage**: ein auffälliger Raumcode oben, die beiden echten Teilnehmer links und rechts, eine zentrale helle Einstellungskarte und die Aktionen darunter. Avatar, Onlinestatus und Host-Rolle sind echte Daten, keine erfundenen Statistiken.
- **Vier bedienbare Moduskarten**: Der Host kann seinen Modus direkt auswählen und die vorhandenen Regeln darunter konfigurieren. Wichtig: Änderungen werden erst durch „Einstellungen speichern“ für beide übernommen.
- **Alle vorhandenen Optionen bleiben erhalten**: Budget, Auktionstyp, Zeitlimit, Football-Variante und Spielerlimit bei Bid Your Player. Die Anzahl der Auktionsrunden ist weiterhin von der gewählten Spielvariante abhängig, nicht ein neuer frei wählbarer Regler.
- **Einladen und Starten weiterhin funktionsfähig**: Code kopieren, Link kopieren, Host startet bei zwei Teilnehmern; Gäste können zuschauen und erhalten die aktuellen Einstellungen.
- **Handy-Layout**: Spielerplätze passen sich an die verfügbare Breite an und die Einstellungen stehen darunter.
- **Kein Gameplay-Umbau**: Auktion, Lobby-IDs, Budgets, Serverzustand, Rückspiele und Abstimmungsregeln sind unverändert. Supabase bleibt für den dauerhaften Kontobetrieb optional und ist noch nicht vom Nutzer eingerichtet.
- Optimiertes lokal gehostetes Bild `public/assets/arena-soft.webp`. Die Bilddateien sind Teil des ZIP und müssen mit hochgeladen werden.

### Veröffentlichung: erst mit dem vollständigen Designupdate 1.8

Laufende Spiele vor einem Render-Deployment beenden. ZIP entpacken und die **gesamte neue Ordnerstruktur** nach GitHub übernehmen; `public/assets/arena-soft.webp` darf nicht fehlen. Commit & Push auf `main`, Render-Deployment abwarten. Mit zwei Geräten Raum erstellen, beitreten, Einstellungen speichern, Start und Rückspiel prüfen. `npm test` startet die automatischen Regressionstests.

## Neu in 1.7.3: freigegebenes Startseiten-Design

- Neuer Slogan: **„Wer bietet besser, wer gewinnt?“** und unveränderte kleine Zeile „BIETEN · KREIEREN · GEWINNEN“.
- Neue Startseiten-Illustration mit goldenem BidBattle-Pokal und neutralen Spielobjekten, nicht ausschließlich Fußball.
- Vier optisch neu gestaltete, weiterhin anklickbare Spielmodus-Karten. Das Bild bei Food Battle zeigt Burger, Pizza und Pasta; **spielbar ist hier weiterhin der bisherige Burger-Modus**, bis Kitchen Battle in einem späteren Update kommt.
- Ruhiges, helles Violett-Blau-Design mit gezielten Goldakzenten, responsiven Karten und einer neuen Kopfzeile.
- Alle Bilder sind lokal optimierte `.webp`-Assets und werden vom bisherigen Node-Server bereitgestellt. Die Assets stammen aus dem vom Nutzer freigegebenen Designentwurf.
- Headernavigation beschränkt auf funktionsfähige Bereiche (Startseite und Spielmodi). Unfertige Freunde- und Statistikbereiche werden nicht vorgetäuscht.
- **Spiellogik, Spielmodi, Budgets, Multiplayer, Lobby und Auktionsablauf sind unverändert**. Die anderen Ansichten werden in den geplanten Folgeupdates gestaltet.

### Dateien hochladen

Alle Dateien des ZIP-Ordners nach GitHub übernehmen – insbesondere `public/assets/` mit allen fünf `.webp`-Bildern, die neue `public/index.html`, `public/styles.css`, `public/app.js` und `server.js`. Webserver-Routen für diese Bilder sind zusätzlich in `server.js` freigeschaltet. Keine Bilder oder komplette ZIP-Dateien in GitHub-Hauptordner ablegen.

### Prüfen

`npm test` prüft die bestehenden Funktionen. Zusätzlich `npm run test:homepage` für die neue Startseite (ohne Browser-Abhängigkeiten). Nach dem Deploy auch auf Handy und Desktop ansehen und beide Mitspieler-Modi ausprobieren.


Mobiles, kostenloses 1-gegen-1-Auktionsspiel. Alle Spielmodi aus Version 1.6.1 bleiben erhalten: Football Draft (Startelf und Bid Your Player), Food Battle, Superhero und Random.

## Bereits in 1.7.2 enthalten – Layout & Lobby Refresh

1. **Komplett überarbeitete Spieloberfläche:** Die Match-Ansicht ist weiterhin hell, wirkt aber deutlich hochwertiger. Weniger dominantes Weiß, dafür stimmige Lila-/Blau-/Türkis-/Gold-Akzente, weichere Verläufe, stärkere Kartenoptik und mehr visuelle Tiefe.
2. **Neue Spiel-Kopfzeile:** Oben im Match steht jetzt ein klarer Hero-Bereich mit Raumcode, Spielmodus, Auktionstyp, Zeitlimit und kompakten Info-Chips. Dadurch wirkt das Spielfeld strukturierter und professioneller.
3. **Lobby sichtbar aufgewertet:** Die Lobby wurde umfassend neu aufgebaut – mit stärker hervorgehobenem Raumcode, wertigerem Kartenlayout für beide Spieler, besser lesbaren Statusanzeigen sowie einem klareren Bereich für Einstellungen und Match-Start.
4. **Bessere Platzhalter für Fußballer ohne Foto:** Wenn kein eindeutig zuordenbares Wikimedia-Bild vorhanden ist, erscheint jetzt ein hochwertigerer Fallback mit Länderkürzel und Monogramm statt einer sehr schlichten Platzhalterfläche.
5. **Foto-Logik bewusst sicher gehalten:** Es werden weiterhin nur eindeutig zuordenbare, frei lizenzierte Wikimedia-Bilder angezeigt. So bleibt das System vorsichtig gegenüber falschen Personenfotos. Fehlende Bilder werden deshalb optisch sauber abgefangen statt unsauber ersetzt.
6. **Responsives Feintuning:** Die neuen Lobby- und Match-Bereiche bleiben auch auf kleineren Displays klar lesbar und brechen sauber um.

### Technischer Hinweis zu Fußballerfotos

- Bilder werden nur geladen, wenn sie über die exakt zugeordnete Wikimedia-Seite des jeweiligen Spielers sicher gefunden werden.
- Gibt es dort kein passendes frei nutzbares Bild oder ist die Zuordnung nicht eindeutig genug, bleibt bewusst der neue Fallback aktiv.
- Dadurch erscheinen bei manchen Spielern weiterhin keine echten Fotos – das ist eine Schutzmaßnahme gegen falsche Bilder, kein zufälliger Fehler.

## Bereits in 1.7 enthaltene Funktionen

1. **Gast oder Konto**: Beim Einstieg wählen Spieler „Als Gast spielen“, „Registrieren“ oder „Anmelden“. Gäste brauchen keine E-Mail-Adresse. Konten speichern Benutzername, Avatar und Farbe. E-Mails werden im Spiel nicht angezeigt. Passwörter werden serverseitig mit individuell gesalzenem `scrypt` gespeichert; Sessions erhalten zufällige Tokens, gespeicherte Session-Tokens sind gehasht. Abmelden und Kontolöschung sind möglich.
2. **Spiel verlassen**: Im Finale zusätzlich zu „Nochmal spielen“ und „Zur Lobby“. Der Spieler wird zur Startseite zurückgeführt, sein Platz wird frei. Der verbleibende Spieler wird benachrichtigt und erhält bei Bedarf die Host-Rolle. Das Verlassen über die obere Navigation wird gleich behandelt.
3. **Spielraum-Speicherung**: Für lokale Tests werden Raum- und Kontodaten atomar in `data/bidbattle.json` gespeichert (`data/` gehört nicht in GitHub). Für Render **externe dauerhafte Speicherung über Supabase konfigurieren**, siehe `ONLINE_STELLEN.md`. Ohne Datenbank sind Render-Dateien flüchtig.
4. **Verbindungswiederherstellung**: EventSource verbindet sich automatisch neu. Raum-Sitzungen lassen sich nach Neuladen des Browser-Tabs wiederherstellen. Bei einer aktiv verbundenen Partie wird eine laufende Auktion beim Abbruch einer Verbindung pausiert und nach erfolgreicher Rückkehr beider Teilnehmer fortgesetzt. Nach 60 Sekunden Unterbrechung geht der Raum mit einer Nachricht zurück in die Lobby.
5. **Countdown**: Der Host startet synchron einen kurzen 3-2-1-Countdown vor der ersten Auktion. Ein selbst erzeugter kurzer Sound kann ein- und ausgeschaltet werden. Einige mobile Browser verhindern Ton ohne vorherige Nutzerinteraktion.
6. **Item-Details**: In Food Battle und Superhero kannst du die gesammelten Symbole in beiden Spielerprofilen antippen, um Name, Kategorie und Beschreibung zu sehen. Die Uhr wird dabei nicht angehalten.
7. **Abstimmung**: Zusätzlich zum Sieger kann jetzt „Unentschieden“ gewählt werden. Beide für dieselbe Person → eindeutiger Sieger. Beide Unentschieden → Unentschieden. Unterschiedliche Stimmen → im Fußball wird das durchschnittliche Rating als Stichentscheid genutzt; identische Ratings bleiben unentschieden. In Food/Hero/Random bleiben widersprüchliche Stimmen unentschieden. Durchschnittsratings sind eigene BidBattle-Werte.
8. **Mobil**: Neue Auswahlfenster und Spieleraktionen sind auch für schmale Bildschirme angepasst.

## Lokal testen

Node.js >= 18. Im Ordner `npm start` oder unter Windows `BidBattle-starten.bat` ausführen. Dann `http://localhost:3000` öffnen. Node.js und npm werden nur zum Start und Test benötigt; Laufzeit-Abhängigkeiten gibt es nicht.

```bash
npm test
```

Die Tests prüfen die bisherigen Spielregeln sowie Konten, Zugriffsrechte, Abstimmung, 3-2-1-Start, Serverneustart, Verlassen, Host-Übernahme und SSE-Wiederverbindung. Hinzu kommt `tests/features171.cjs` für den 234-Spieler-Pool und die kostenlose, positionsgerechte 11er-Auffüllung nach Budgetende.

## Für eine öffentliche Version noch nötig

- Die Datenbank nach `ONLINE_STELLEN.md` einrichten, **bevor** du Registrierungen für öffentliche Spieler öffnest. Auf Render werden Registrierungen ohne konfigurierten dauerhaften Datenspeicher vorsorglich blockiert; Gastduelle funktionieren dennoch.
- Impressum, Datenschutzerklärung und ggf. Nutzungsbedingungen ergänzen. Vor öffentlicher Sammlung von E-Mail-Adressen Datenschutzprüfung durchführen.
- Für einen breiten Live-Launch E-Mail-Verifizierung, Passwort-Zurücksetzen, Schutz vor automatisierten Anmeldungen, Datenexport und externe Sicherheitsprüfung einplanen. Die jetzige Kontofunktion ist ein getesteter **Prototyp**, noch kein vollständig gehärteter Auth-Dienst.
- Die Supabase-Integration verwendet einen einzelnen JSON-Datensatz und ist für einen kleinen Server/geringe Last vorgesehen, nicht für mehrere parallel schreibende Serverinstanzen. Bei großem Wachstum auf transaktionale Tabellen umstellen.
- Fußballerbilder stammen, wenn vorhanden, aus eindeutig zugeordneten Wikimedia-Seiten; die Prüfung ihrer Lizenzen/Aktualität bleibt für den Launch nötig.

Weitere geplante Funktionen (Kitchen Battle mit Burger/Pizza/Pasta, limits für Superkräfte/Zutaten) kommen **nicht** in 1.7, sondern sind für 1.8 vorgesehen. Alle Modi bleiben kostenlos.


## Version 1.7.7 – Football Draft & Countdown

- Beide Fußballvarianten übernehmen den ruhigen Stadionhintergrund und die neue Auktion mit Euro-Regler sowie exakter Gebotseingabe.
- Bei **Bid Your Player** zeigen die Spielerflächen die ersteigerten Karten mit Namen, Nationalität, Position und Rating.
- Bei **Startelf** sieht man die zwei 4-3-3-Felder und kann über den weiterhin vorhandenen Aufstellungseditor zulässige Positionswechsel vornehmen.
- Seltene Spieler ab 88 OVR behalten einen goldenen Elite-Hinweis, Porträts bleiben auf sichere Wikimedia-Zuordnung beschränkt.
- **BID!** skaliert korrekt innerhalb des Startkreises, neuer leiser kurzer Sound; Ton lässt sich abschalten.
- Spielregeln und zukünftige Angebotsreihenfolge unverändert, kommende Karten bleiben verdeckt.
- Noch nicht auf GitHub/Render veröffentlichen; in Version 1.8 mit dem Gesamtdesign bündeln.

## Korrektur 1.7.9.1 – Startseiten-Anzeige

- Der zu schmale, hart abgeschnittene Hero-Bildstreifen wurde entfernt.
- Das freigegebene Pokal-/Controller-/Würfelmotiv wird mit weichen Bildübergängen in der rechten Hero-Fläche dargestellt.
- Desktop und mobile Ansicht wurden als Browser-Vorschau auf Bildladefehler und seitlichen Überlauf geprüft.
- Keine Änderung an Spiellogik, Lobby, Profilen oder Modus-Bedienung.



## Version 1.7.9.1 – Startseiten-Hero (Zwischenstand)
- Nur die Startseite ist neu gestaltet: kein eingebundenes Hero-Foto mehr, keine Controller-/Würfel-Emojis.
- Eigenständige responsive HTML/CSS/SVG-Auktionsszene mit goldener Pokalgrafik und virtuellen Geboten.
- Die vier Moduskarten, Lobby, Auktionen und gesamte serverseitige Spiellogik bleiben unverändert.
- Noch nicht auf GitHub/Render veröffentlichen: Dies ist ein gesicherter Zwischenstand vor 1.8.


### 1.7.9.1 UI-Korrektur
- Lobby-Modusbilder durch Emojis auf differenzierten Farbflächen ersetzt.
- Avatar-Auswahl zurück auf Emojis; Legacy-IDs werden weiterhin angezeigt.
- Startseite: vollständiges Pokal-Motiv mit BidBattle-Schriftzug, Controller links und geometrisch korrektem lila Würfel rechts, responsive.
- Spielablauf und Multiplayer unverändert.
