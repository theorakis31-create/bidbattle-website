# BidBattle öffentlich online stellen – Version 1.6

Diese Dateien sind für GitHub + Render vorbereitet. Sie enthalten den neuen Fußball-Kurzmodus, den vorhandenen Startelf-Modus und die bisherigen anderen Spiele.

## 1) GitHub

1. Auf https://github.com anmelden.
2. Dein bereits bestehendes Repository `bidbattle-website` öffnen. Du brauchst kein neues anzulegen.
3. Im Repository `Add file` > `Upload files` anklicken.
4. **Den INHALT** dieses entpackten Ordners hochladen, **nicht die ZIP-Datei** und **nicht einen übergeordneten Ordner**: `package.json`, `server.js`, `football.js`, `render.yaml` sowie die Ordner `public/` und `tests/`. `BidBattle-starten.bat` ist nur für Windows und optional.
5. Beim Update die gleichnamigen Dateien und Unterordner **ersetzen** (nicht doppelt ablegen) und mit `Commit changes` speichern. Danach müssen `package.json`, `server.js` und `football.js` direkt im Hauptverzeichnis liegen; `index.html`, `app.js` und `styles.css` gehören in den Unterordner `public/`. **Achtung:** Wenn dein altes Repository diese Dateien nur im Hauptverzeichnis hat, lösche die alten doppelten Dateien und halte dich an die neue Ordnerstruktur. `server.js` erwartet den Ordner `public/`.

## 2) Render

1. https://dashboard.render.com aufrufen und GitHub verbinden.
2. `New` > `Web Service` wählen und das BidBattle-Repository verbinden.
3. Wenn dein Render-Web-Service bereits existiert, brauchst du **keinen neuen Web-Service**. Unter `Settings` prüfen, dass das GitHub-Repository verbunden und Auto-Deploy aktiviert ist.
4. Nach `Commit changes` veröffentlicht Render das Update automatisch, sofern Auto-Deploy aktiv ist. Andernfalls `Manual Deploy` > `Deploy latest commit` wählen.
5. Nach Status `Live` dieselbe bisherige HTTPS-Adresse nutzen, z. B. `https://bidbattle-8kkc.onrender.com`. Falls die alte Version angezeigt wird, Browser neu laden (`Strg + F5`).

Alternativ kann das mitgelieferte `render.yaml` unter `New` > `Blueprint` verwendet werden, falls Render den Import anbietet. Für Einsteiger ist `New` > `Web Service` ausreichend.

## 3) Testen

- Auf Gerät A ein Spiel erstellen und den angezeigten Raumcode teilen.
- Auf Gerät B unter derselben **öffentlichen Render-Adresse** beitreten.
- Falls die Seite zuerst lange lädt: Free-Dienste schlafen nach Inaktivität ein.
- Bei Änderungen am GitHub-Repository wird die App bei aktiviertem Auto-Deploy neu bereitgestellt.

## Wichtig

- Die Spielräume liegen derzeit ausschließlich im Arbeitsspeicher des Servers. Bei Neustart, automatischem Einschlafen oder Redeploy werden sie gelöscht. Damit ist Version 1.6 gut zum Testen, aber noch kein ausfallsicherer Dauerbetrieb.
- Die Fußballfotos werden von externen Wikimedia-Diensten nachgeladen. Vor einer breiten öffentlichen Nutzung bitte Lizenzen/Urheberkennzeichnungen und Datenschutz prüfen.
- Es wird nur mit **virtuellen Euro** geboten; kein echtes Geld.
- `http://localhost:3000` ist nur die lokale Adresse auf deinem PC. Für andere Spieler zählt die von Render zugewiesene öffentliche HTTPS-Adresse.
- Der Server nutzt `process.env.PORT` und lauscht auf `0.0.0.0`; es sind für Render daher keine Änderungen an `server.js` nötig.
- Falls `bidbattle-web` als Render-Dienstname bereits vergeben ist, einfach einen anderen eindeutigen Namen auswählen.

## Neu in Version 1.6

- **Vorlobby:** Beitreten startet nicht automatisch. Nur der Host startet manuell. Beide sehen die Teilnehmer und Regeln.
- Vor dem Start darf der Host Modus, Fußballvariante, Spielerlimit, Budget, Auktionsart und Zeitlimit ändern. Bitte nach Änderungen „Einstellungen speichern“ klicken.
- **Bid Your Player:** Wahl zwischen 20, 30, 40 und 50 € virtuellen Budget.
- Sobald eine Person ihre Zielanzahl erreicht, werden die nächsten Karten aus den noch verbleibenden gemischten Angeboten dem anderen Spieler **nacheinander und kostenlos** zugeteilt. Eine kleine Aufdeckanimation zeigt jede Vergabe; es werden keine weiteren Gebote abgegeben.
- Bei offenem Überbieten beginnt der **letzte Auktionsgewinner** die nächste Runde, sofern er noch bieten darf. Bei verdeckten Geboten bieten beide weiterhin unabhängig.
- Zeitlimits 10, 15 (Standard), 30, 60 Sekunden oder unbegrenzt. Bei Zeitablauf gilt das Gebot als Passen; der Server steuert die Uhr.
- Kleine rote Meldung, wenn man überboten wird.
- **Noch eine Runde:** Nach dem Finale bleiben beide im selben Raum und kehren in dieselbe Lobby zurück. Host kann Regeln ändern und wieder starten.

## Testen

`npm test` testet Grundmodi, Fußballmodi, Vorlobby, Zeitlimits, automatische Vergabe, Rematch und Abstimmung.
