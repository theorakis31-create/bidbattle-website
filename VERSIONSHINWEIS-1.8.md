**Aktueller Stand:** Food Creator 1.8.1 erweitert den letzten 1.8-Entwicklungsstand. Informationen unten zum Vergleich mit 1.7.9.2 sind historische Vorsichtshinweise; neue Food-Logik und Katalogdaten stehen in `FOOD-CREATOR-README.md`.

# BidBattle 1.8 – lokaler Entwicklungsstand

**WICHTIG: Dies ist ein Vorschau-/Integrationsstand, kein finaler 1.8-Release.**

Da die vollständigen Originaldateien von **1.7.9.2** nicht bereitgestellt werden konnten, beruht dieser Stand technisch auf dem letzten lokal verfügbaren ZIP **1.7.9.1**. Deshalb lassen sich unbekannte Änderungen aus 1.7.9.2 noch nicht garantiert übernehmen.

## Umgesetzte Punkte
- Die hochwertige, bereits im Projekt vorhandene Originalgrafik `public/assets/hero-trophy-integrated.webp` (aus der vorhandenen Originalgrafik, mit transparenten Randverläufen) wieder für die Startseite aktiviert: Pokal, Controller, Würfel und BidBattle-Schriftzug. Kein billiger, nachgezeichneter SVG-Pokal, kein zugeschnittener Screenshot.
- Auf dem Desktop und Handy dasselbe originale Motiv; die Kanten werden per CSS weich mit dem Stadionhintergrund verbunden.
- Lobby-Modus-Emojis exakt horizontal/vertikal in den bestehenden Auswahlkacheln zentriert.
- Siegerpodium strukturell auf zwei symmetrische Spalten angepasst (links Platz 2, rechts Platz 1); beide Sammlungen unterhalb der jeweiligen Plätze. Platz 2 niedriger.
- Responsive Feinschliff und gezielte Regressionstests. Spielregeln und Server-Auktionslogik nicht umgeschrieben.

## Vor Veröffentlichung notwendig
- Vergleich/Integration mit den echten **1.7.9.2**-Quellen, insbesondere dem darin überarbeiteten Lobby-Layout.
- Echte Zwei-Geräte-Multiplayer-Tests mit aktivem Render-Deployment.
- Veröffentlichung ausschließlich nach Freigabe; **keine automatische Änderung an GitHub oder Render**.

## Zusätzlich in der GitHub-Vorbereitung
- Großes Emoji-Symbol im linken Vorschau-Kasten des Lobby-Erstellfensters pixelgenau zentriert, auch auf Handy.
- GitHub Actions mit automatisierten Tests; vollständige Checkliste in `CHECKLISTE-1.8.md`.
