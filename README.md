# BidBattle – Version 1.7

Mobiles, kostenloses 1-gegen-1-Auktionsspiel. Alle Spielmodi aus Version 1.6.1 bleiben erhalten: Football Draft (Startelf und Bid Your Player), Food Battle, Superhero und Random.

## Neue Funktionen

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

Die Tests prüfen die bisherigen Spielregeln sowie Konten, Zugriffsrechte, Abstimmung, 3-2-1-Start, Serverneustart, Verlassen, Host-Übernahme und SSE-Wiederverbindung.

## Für eine öffentliche Version noch nötig

- Die Datenbank nach `ONLINE_STELLEN.md` einrichten, **bevor** du Registrierungen für öffentliche Spieler öffnest. Auf Render werden Registrierungen ohne konfigurierten dauerhaften Datenspeicher vorsorglich blockiert; Gastduelle funktionieren dennoch.
- Impressum, Datenschutzerklärung und ggf. Nutzungsbedingungen ergänzen. Vor öffentlicher Sammlung von E-Mail-Adressen Datenschutzprüfung durchführen.
- Für einen breiten Live-Launch E-Mail-Verifizierung, Passwort-Zurücksetzen, Schutz vor automatisierten Anmeldungen, Datenexport und externe Sicherheitsprüfung einplanen. Die jetzige Kontofunktion ist ein getesteter **Prototyp**, noch kein vollständig gehärteter Auth-Dienst.
- Die Supabase-Integration verwendet einen einzelnen JSON-Datensatz und ist für einen kleinen Server/geringe Last vorgesehen, nicht für mehrere parallel schreibende Serverinstanzen. Bei großem Wachstum auf transaktionale Tabellen umstellen.
- Fußballerbilder stammen, wenn vorhanden, aus eindeutig zugeordneten Wikimedia-Seiten; die Prüfung ihrer Lizenzen/Aktualität bleibt für den Launch nötig.

Weitere geplante Funktionen (Kitchen Battle mit Burger/Pizza/Pasta, limits für Superkräfte/Zutaten) kommen **nicht** in 1.7, sondern sind für 1.8 vorgesehen. Alle Modi bleiben kostenlos.
