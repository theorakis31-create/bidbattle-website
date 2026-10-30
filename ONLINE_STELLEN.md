# BidBattle 1.7 auf GitHub und Render aktualisieren

**Vor dem Update:** Laufende Partien beenden. Der bisherige Version-1.6.1-Server hält vorhandene Spielräume nur im Arbeitsspeicher; diese alten Räume lassen sich nicht nach 1.7 migrieren.

## A. Dateien über GitHub hochladen

1. `BidBattle-Website-v1.7.zip` herunterladen und vollständig entpacken.
2. GitHub-Repository `bidbattle-website` aufrufen, `Add file` → `Upload files` wählen. **Alle Dateien und Ordner aus dem entpackten Verzeichnis** hochladen, nicht die ZIP selbst. Gleiche Pfade ersetzen; unnötige alte Dateien bei Bedarf separat löschen.
3. Auf die Pfade achten: `server.js`, `football.js`, `storage.js`, `package.json`, `render.yaml` und `schema.sql` liegen im Repo-Hauptordner. Im Unterordner `public/` liegen `app.js`, `index.html`, `styles.css`, `favicon.svg`.
4. **Commit directly to main** wählen, dann `Commit changes`.
5. In Render deinen bestehenden Web Service öffnen; bei aktiviertem Auto-Deploy wird die neue Version veröffentlicht. Sonst `Manual Deploy` → `Deploy latest commit`.

## B. Dauerhafte Speicherlösung für Konten und Lobbys

Render-Web-Services besitzen ohne persistenten Datenträger standardmäßig ein flüchtiges Dateisystem. Daher reicht eine normale JSON-Datei auf Render **nicht** zur dauerhaften Speicherung. Für den kostengünstigen Start unterstützt Version 1.7 eine externe Supabase-PostgreSQL-Datenbank über deren REST API. Deren Tarif, Verbrauchsgrenzen und Verfügbarkeit vor der Registrierung prüfen.

1. Auf https://supabase.com ein eigenes Supabase-Projekt anlegen.
2. In diesem Projekt unter **SQL Editor** das mitgelieferte `schema.sql` ausführen. Es legt die Tabelle `public.bidbattle_store` an und aktiviert RLS. Es werden bewusst keine Policies für Browserzugriff erstellt.
3. Die **Project URL** (z. B. `https://beispiel.supabase.co`) und einen **Secret API Key** `sb_secret_...` unter den Projekteinstellungen holen. Alternativ funktioniert technisch ein älterer `service_role`-Schlüssel, ist aber veraltet.
4. In Render: BidBattle Web Service → **Environment**. Zwei Variablen hinzufügen:

   `SUPABASE_URL` = deine Project URL

   `SUPABASE_SECRET_KEY` = dein **geheimer** Supabase-Server-Key (`sb_secret_...`)

5. Änderungen speichern und bei Bedarf deployen. **Den Secret Key niemals ins GitHub-Repository, in die Website oder in den Chat kopieren.**
6. Über `https://DEINE-RENDER-ADRESSE/api/health` prüfen, ob `storage.kind` auf `supabase` steht, `storage.lastError` null ist und `accountsEnabled` true ist.
7. Mit zwei Browsern eine Testlobby erstellen, registrieren und einen Neustart durchführen, um den Betrieb zusätzlich auf Render zu prüfen.

Ohne externe DB bleiben lokale Tests auf deinem PC möglich. Auf Render funktioniert Gastspielen, aber Registrierungen werden ohne konfigurierten dauerhaften Speicher bewusst verhindert. Zum Fehlerfinden stehen im Render-Dashboard unter **Logs** die Meldungen `SPEICHERFEHLER` oder `Konnte BidBattle-Speicher nicht laden`. Nach Supabase-Einrichtung sollten solche Meldungen nicht auftreten.

**Datensicherheit:** Diese erste Version speichert alle Räume und Konten als ein serverseitiges Snapshot-Dokument. Supabase-Secret-Key ist nur auf dem Server erlaubt. Die Lösung eignet sich für Tests mit einem einzelnen Server, noch nicht als hochverfügbares System für viele Tausend Nutzer.

## C. Konto und Mobiltest

- Als Gast spielen: kein Konto nötig, wie bisher.
- Registrieren: Name, E-Mail und Passwort (mindestens 10 Zeichen); Anmeldung und Profil-Änderung prüfen.
- Nach Spielabschluss „Nochmal spielen“, „Zur Lobby“ und „Spiel verlassen“ einzeln testen. Dem verbleibenden Spieler wird der Austritt mitgeteilt.
- Bei aktivem Spiel kurz WLAN/Netz wechseln und prüfen, dass das Gebot pausiert und nach Wiederverbindung weiterläuft.
- Ton im Countdown kann ausgeschaltet werden; auf manchen Smartphones ist vor dem ersten Ton eine Nutzerinteraktion nötig.
- Auf der Website vor breitem öffentlichen Start Impressum, Datenschutz und Kontaktmöglichkeit ergänzen; die Konto-Funktion ist derzeit ein Prototyp ohne E-Mail-Bestätigung und Passwort-Wiederherstellung.
