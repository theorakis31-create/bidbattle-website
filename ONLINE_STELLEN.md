# BidBattle öffentlich online stellen – Version 1.4

Diese Dateien sind für GitHub + Render vorbereitet. Die eigentliche Spiellogik von Version 1.4 ist unverändert.

## 1) GitHub

1. Auf https://github.com anmelden.
2. Ein neues Repository anlegen, z. B. `bidbattle-website` (am besten **Private**).
3. Im Repository `Add file` > `Upload files` anklicken.
4. **Den INHALT** dieses entpackten Ordners hochladen, **nicht die ZIP-Datei** und **nicht einen übergeordneten Ordner**: `package.json`, `server.js`, `football.js`, `render.yaml` sowie die Ordner `public/` und `tests/`. `BidBattle-starten.bat` ist nur für Windows und optional.
5. Änderungen mit `Commit changes` speichern. Danach muss `package.json` direkt im Hauptverzeichnis des Repositories sichtbar sein.

## 2) Render

1. https://dashboard.render.com aufrufen und GitHub verbinden.
2. `New` > `Web Service` wählen und das BidBattle-Repository verbinden.
3. Einstellungen: `Language/Runtime: Node`, `Region: Frankfurt` (falls auswählbar), `Build Command: npm install`, `Start Command: npm start`, `Instance Type: Free`.
4. `Create Web Service` anklicken und den erfolgreichen Start abwarten.
5. Die von Render angezeigte **https://...onrender.com**-Adresse auf Handy und PC öffnen.

Alternativ kann das mitgelieferte `render.yaml` unter `New` > `Blueprint` verwendet werden, falls Render den Import anbietet. Für Einsteiger ist `New` > `Web Service` ausreichend.

## 3) Testen

- Auf Gerät A ein Spiel erstellen und den angezeigten Raumcode teilen.
- Auf Gerät B unter derselben **öffentlichen Render-Adresse** beitreten.
- Falls die Seite zuerst lange lädt: Free-Dienste schlafen nach Inaktivität ein.
- Bei Änderungen am GitHub-Repository wird die App in der Regel neu bereitgestellt.

## Wichtig

- Die Spielräume liegen derzeit ausschließlich im Arbeitsspeicher des Servers. Bei Neustart, automatischem Einschlafen oder Redeploy werden sie gelöscht. Damit ist Version 1.4 gut zum Testen, aber noch kein ausfallsicherer Dauerbetrieb.
- Die Fußballfotos werden von externen Wikimedia-Diensten nachgeladen. Vor einer breiten öffentlichen Nutzung bitte Lizenzen/Urheberkennzeichnungen und Datenschutz prüfen.
- Es wird nur mit **virtuellen Euro** geboten; kein echtes Geld.
- `http://localhost:3000` ist nur die lokale Adresse auf deinem PC. Für andere Spieler zählt die von Render zugewiesene öffentliche HTTPS-Adresse.
- Der Server nutzt `process.env.PORT` und lauscht auf `0.0.0.0`; es sind für Render daher keine Änderungen an `server.js` nötig.
- Falls `bidbattle-web` als Render-Dienstname bereits vergeben ist, einfach einen anderen eindeutigen Namen auswählen.
