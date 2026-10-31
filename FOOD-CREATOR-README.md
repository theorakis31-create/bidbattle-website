# Food Creator – Funktionsstand 1.8.2

## Spielfluss

1. Auf der Startseite **Food Creator** auswählen (interne Mode-ID bleibt `food`, damit ältere Räume und Client-Code kompatibel sind).
2. In Schritt 2 zwischen **🎲 Zufall**, **🍔 Burger**, **🍕 Pizza**, **🍝 Pasta**, **🌭 Hotdog** wählen.
3. In der Lobby kann der Host die Wahl vor dem Spielstart ändern und speichern.
4. Bei Zufall wählt der Server ein Gericht für **beide** Teilnehmer. Bei einer neuen Partie / einem Rückspiel darf es erneut ausgelost werden.
5. Der Server zieht 12 unterschiedliche Angebote aus dem **separaten** Zutatenkatalog des Gerichts – **in kulinarischer Reihenfolge**.
6. **Runden 1 und 2:** Zuerst Pizzateig, Nudeln, Burgerbrötchen oder Hotdog-Brötchen. Jeder Spieler erhält genau eine Grundlage; wer bereits eine besitzt, kann die zweite nicht gewinnen. Bei Pass oder erneutem Unentschieden bekommt ein Spieler ohne Grundlage diese kostenlos. Erst danach folgen die weiteren Schritte.
7. **Danach:** Pizza: Soße, Käse, Belag, Finish; Pasta: Soße, Protein, Gemüse, Finish; Burger: Patty, Käse, Gemüse, Soße, Extras; Hotdog: Wurst, Soße, Gemüse, Toppings.
8. Das Startmenü benutzt 🍽️ als neutrales Food-Creator-Symbol, die gewählten Gerichte behalten ihre individuellen Emojis.
9. Gebote, Timer, Raumcodes, Rückspiele und Abstimmungen funktionieren unverändert; für die erste Grundlage gilt die beschriebene Versorgungsgarantie.

## Zutatenkataloge – versionierte Daten

| Gericht | Datei | Zutaten |
| --- | --- | ---: |
| Burger | `data/food/burger.json` | 56 |
| Pizza | `data/food/pizza.json` | 53 |
| Pasta | `data/food/pasta.json` | 56 |
| Hotdog | `data/food/hotdog.json` | 50 |
| **Gesamt** | | **215** |

Jede Zutat hat eine stabile `id`, einen `title`, ein `emoji`, eine `type`-Kategorie und einen `detail`-Text. **Die Datensätze sind feste Projektkataloge in JSON** (keine externe SQL-Datenbank notwendig). Diese Einträge sind unabhängig von der persistenten Spielraum-/Kontodatenbank (optional Supabase). Beim späteren Ausbau können zusätzliche Gerichte eigene JSON-Dateien erhalten.

**Beispiel:** Hotdog enthält Ketchup und Senf, aber keine Pizza-Tomatensauce. Pizza und Pasta haben jeweils ihre eigenen passenden Soßen und andere Basiselemente.

## API

- `GET /api/food/catalog` – verfügbare Gerichte, Zutatenanzahlen und Kategorien.
- `GET /api/food/catalog?dish=pizza` – Zutaten des gewählten Gerichts (auch `burger`, `pasta`, `hotdog`).
- `POST /api/rooms` – bei `mode: "food"` optional `foodChoice: "random" | "burger" | "pizza" | "pasta" | "hotdog"`.
- `POST /api/rooms/{room}/settings` – dieselbe Auswahl durch den Host in der Lobby.
- Öffentliches Raum-State liefert `foodChoice`, `foodDish`, `foodDishLabel`, `foodPoolSize`.

Alte Clients ohne `foodChoice` erhalten weiterhin Burger. Die ursprüngliche `food`-Mode-ID bleibt für URLs und Kompatibilität erhalten.

## Bewusst **noch nicht** enthalten

- Keine KI-Bilder der fertigen Gerichte.
- Kein automatisches Zusammenbauen eines fertigen Burgers aus gewonnenen Zutaten.
- Kein neues Bewertungssystem nach Rezeptqualität – bisherige Abstimmung bleibt aktiv.

Diese Funktionen können auf der neuen Zutatenstruktur aufbauen.

## Prüfen

`npm test` enthält den neuen Test `tests/foodcreator.cjs` und `tests/foodchronology.cjs`. Er prüft Katalogtrennung, Auswahl, Zufall, Invalid-Input, Lobby-Berechtigungen und tatsächliche Gebotsrunden für alle vier Gerichte. Die gesamten bisherigen Tests werden ebenfalls ausgeführt.

**GitHub/Render:** Dieses Paket ist ein Entwicklungs-Zwischenstand, keine bereits veröffentlichte Version. Beim Hochladen unbedingt `data/food/*.json` mitnehmen. `.gitignore` erlaubt diese vier JSON-Kataloge ausdrücklich; private Spielstandsdateien unter `data/` bleiben ausgeschlossen.
