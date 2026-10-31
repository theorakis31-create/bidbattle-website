# BidBattle 1.8 – GitHub-Upload vorbereiten

**Status:** Entwicklungs-/Integrationsstand, Version `1.8.0-preview.2`. Dies ist **noch kein freigegebener finaler Release**.

## Vor jedem Push beachten

1. Im Originalprojekt liegt eine neuere, **hier nicht verfügbare Version 1.7.9.2**, die ein überarbeitetes Lobby-Layout enthält. Die Dateien in diesem Paket stammen vom letzten verfügbaren Quellstand 1.7.9.1 mit darauf aufgesetzten Korrekturen für 1.8. **Ein unmittelbarer Upload nach `main` kann die Lobby-Änderungen von 1.7.9.2 überschreiben**.
2. Wenn Render mit GitHub `main` verbunden ist, kann bereits ein GitHub-Push eine automatische Render-Veröffentlichung auslösen. Bis zur Abnahme in einem eigenen Branch arbeiten; **nicht einfach die vorhandenen Dateien in `main` ersetzen**.
3. Repository: https://github.com/theorakis31-create/bidbattle-website

## Empfohlener Ablauf (ohne bestehende Version zu überschreiben)

1. Auf GitHub das Repository öffnen und den Branch-Auswahlknopf `main` anklicken.
2. **Neuen Branch anlegen**: `bidbattle-1.8-review` (aus dem aktuellen `main`).
3. Dieses ZIP auf dem eigenen Computer **entpacken**. GitHub kann eine hochgeladene ZIP-Datei **nicht automatisch in den Website-Code entpacken**.
4. Innerhalb des Review-Branches `Add file` → `Upload files` öffnen, **die Dateien und Ordner aus dem entpackten Paket** hochladen (nicht den ZIP-Container und nicht dessen übergeordneten Ordner). Ordnerstruktur muss so aussehen:
   ```
   public/
     index.html
     styles.css
     app.js
     assets/
   tests/
   .github/workflows/test.yml
   server.js
   package.json
   football.js
   storage.js
   render.yaml
   README.md
   ...
   ```
   Bestehende Dateikonflikte überprüfen. Wenn GitHub über das Webinterface nicht alle Unterordner zuverlässig hochlädt, einen lokalen Git-Client oder GitHub Desktop verwenden.
5. Commit-Vorschlag: `Prepare BidBattle 1.8 preview: mode art centering, premium hero, podium`.
6. Unter `Actions` prüfen, ob der Workflow `BidBattle Tests` grün durchläuft.
7. Die 1.7.9.2-Lobby mit dem Review-Branch vergleichen und fehlende Änderungen übernehmen. Danach manuell mit **zwei Geräten** testen.
8. **Erst nach Freigabe** den Branch in `main` übernehmen. Dadurch kann Render automatisch deployen.

## Lokal ausprobieren

Node.js 18+ installieren; im Projektordner:

```bash
npm test
npm start
```

Website danach unter `http://localhost:3000` öffnen. Auf Windows alternativ `BidBattle-starten.bat` doppelklicken.

## Was im Paket enthalten ist

- Der vollständig lokal verfügbare Quellstand mit den 1.8-CSS- und Podiumskorrekturen
- Original-3D-Heromotiv im Assets-Ordner
- Testfälle für die vorhandene Spiellogik und die neue Zentrierung
- GitHub Actions-Workflow für `npm test`
- Dokumentierte Einschränkung wegen der nicht verfügbaren 1.7.9.2-Dateien

**Keine GitHub- oder Render-Änderung wurde durch die Erstellung dieses Pakets ausgeführt.**
