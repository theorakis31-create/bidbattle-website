@echo off
chcp 65001 >nul
cd /d "%~dp0"
title BidBattle Website-Server
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo FEHLER: Node.js ist auf diesem Computer nicht installiert oder nicht im PATH.
  echo Bitte installiere Node.js LTS von https://nodejs.org/de
  echo Danach diese Datei erneut starten.
  echo.
  pause
  exit /b 1
)
echo.
echo -----------------------------------------------
echo  BidBattle - lokaler Website-Server
 echo -----------------------------------------------
echo.
echo Der Browser oeffnet sich AUTOMATISCH, sobald der Server bereit ist.
echo Falls das nicht klappt, oeffne nach der Startmeldung:
echo http://localhost:3000
echo.
echo WICHTIG: Dieses Fenster OFFEN LASSEN, solange du spielst.
echo.
set "BIDBATTLE_OPEN_BROWSER=1"
node server.js
if errorlevel 1 (
  echo.
  echo FEHLER: Der Website-Server konnte nicht starten.
  echo Bitte kopiere die Fehlermeldung aus diesem Fenster.
) else (
  echo.
  echo Der Website-Server wurde beendet.
)
pause
