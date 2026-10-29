# BidBattle – Website Version 1.6

Zweispieler-Auktionswebsite (virtuelle Beträge; keine Echtgeld-Einsätze), mobil und auf Desktop.

## Lokal starten

- Node.js 18+ installieren.
- Unter Windows `BidBattle-starten.bat` doppelklicken, alternativ `npm start` ausführen.
- Im Browser `http://localhost:3000` öffnen.
- Für öffentliche Updates via GitHub / Render: `ONLINE_STELLEN.md`.

## Spielablauf

1. Host erstellt einen Raum und lädt einen zweiten Spieler per Code oder Link ein.
2. **Vorlobby:** Beide sehen Spieler und Regeln. Der Host darf Modus, Fußballvariante, Spielerlimit, Budget, Auktionsart und Zeitlimit anpassen. Nur der Host startet das Spiel.
3. **Auktionen:** Wahlweise geheim oder offen (abwechselndes Überbieten). Zeitlimit: 10, 15 (Standard), 30, 60 Sekunden oder unbegrenzt. Bei Ablauf zählt ein noch offener Zug als Passen. Bei verdecktem Gleichstand folgt ein Stechen; bei zweitem Gleichstand keine Vergabe.
4. **Football Startelf:** 11 Spieler im frei anpassbaren 4-3-3, 44 gemischte Angebote, 50/75/100 € Budget. Keine zufälligen Ersatzspieler.
5. **Football Bid Your Player:** 3, 4 oder 5 Spieler pro Person, 12/16/20 gemischte Angebote, 20/30/40/50 € Budget. Nur selbst ersteigerte Fußballer sammeln. Wenn einer vollständig ist, erhält der andere die nächsten Karten aus dem verbliebenen Angebotspool **einzeln aufgedeckt und kostenlos**, bis auch er vollständig ist. In dieser Auffüllphase finden keine Gebote statt. Im offenen Modus eröffnet der letzte Auktionsgewinner die nächste Auktion, sofern er noch bieten darf.
6. **Finale:** Beide stimmen selbst über den Sieger ab. Ratings sind nur Orientierung. Bei geteilten Stimmen unentschieden.
7. **Noch eine Runde:** Nach dem Finale kehren beide in dieselbe Lobby mit demselben Raumcode zurück; der Host kann Regeln ändern und wieder starten.

Die Modi Food Battle, Superhero Showdown und Random Battle bleiben erhalten.

## Technische Einschränkungen

- Zwei Spieler pro Raum. Der Host und der Gast behalten ihre Sitzung über `sessionStorage` des jeweiligen Browser-Tabs.
- Räume, Punkte und Partien liegen im Server-Arbeitsspeicher und gehen bei Server-Neustart, Render-Schlafmodus oder Redeploy verloren.
- Das vorzeitige Verlassen und erneute Verbinden mit anderem Gerät ist noch kein ausgereiftes Spieler-Reconnect-System.
- Spielerfotos werden nur, soweit verfügbar, von Wikimedia geladen; andernfalls erscheinen Flaggen. Vor einer größeren öffentlichen Veröffentlichung müssen Foto-Lizenzen und Datenschutzhinweise geprüft werden.
- Fußball-Ratings sind eigene BidBattle-Spielwerte, keine offiziellen EA-FC-Ratings.

## Tests

```bash
npm test
```

Prüft Grundmodi, Fußballmodi, Start-Lobby, Rollenrechte, Zeitlimits, freie Auffüllphase, Rematch und Abstimmung.
