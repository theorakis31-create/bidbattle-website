# BidBattle 1.8.2 – Food Creator: Grundlagen zuerst

**Ausgangsversion:** Food Creator 1.8.1. Die bestehenden anderen Spielmodi und das freigegebene Website-Layout wurden nicht neugestaltet.

## Änderungen

- Food Creator erhält das neutrale Symbol **🍽️** statt 🍔 auf der Hauptmoduskarte, im Einstiegsmenü und in der generischen Modusauswahl. Ein speziell gewählter Burger bleibt 🍔.
- **Erste 2 Auktionen:** Zwei unterschiedliche Grundlagen desselben Gerichts. Die zweite kann nur die Person gewinnen, die noch keine besitzt.
- Passen beide oder gibt es einen erneuten Gleichstand, wird die Grundlage kostenlos der nächsten unversorgten Person zugeteilt. Dadurch sind beide vor den weiteren Zutaten ausgestattet.
- Danach feste kulinarische Kategorie-Reihenfolge; Zutaten innerhalb der jeweiligen Kategorie variieren bei jedem neuen Spiel.
- Kleine Phasenanzeige im Spiel erklärt „Grundlage sichern“ und „Gericht zusammenstellen“.
- Beim zweiten Grundlagenangebot muss der schon versorgte Spieler nicht erneut bieten. Das gilt für verdeckte wie offene Auktionen.

## Reihenfolge der 12 Angebote

| Gericht | 1–2 | 3–4 | 5–6 | 7–9 | 10–12 |
|---|---|---|---|---|---|
| Pizza | Teig | Soße | Käse | Belag | Belag 10, Finish 11–12 |
| Pasta | Nudeln | Soße | Protein (5–7) | Gemüse (8–10) | Finish 11–12 |
| Burger | Basis | Patty | Käse | Gemüse | Soße (10–11), Extras 12 |
| Hotdog | Brötchen | Wurst | Soße | Gemüse | Topping 10–12 |

Die Tabelle erläutert die Kategorien; im Code legt `FOOD_STEPS` die exakten Schritte fest.

## Tests / Veröffentlichung

`npm test` prüft alle bestehenden Spieltests plus neue Tests für offene und verdeckte Auktionen, alle vier Gerichte und die garantierten Grundlagen. **GitHub und Render wurden nicht verändert.**
