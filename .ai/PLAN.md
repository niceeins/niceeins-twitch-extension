# NiceEins Twitch Extension — AI Plan

## Produktziel

Die Twitch Extension soll vom reinen Infopanel zu einer kompakten Zuschauer-Zentrale werden. Zuschauer sollen beim Öffnen sofort sehen:

- ist der Streamer live?
- was läuft oder lief zuletzt?
- wann ist der nächste Stream?
- gibt es aktuelle Hinweise?
- welche Commands sind sofort nützlich?
- wo finde ich Plan, Games, Links und Commands?

## Priorität

1. Home-/Start-Tab im Twitch Panel
2. Bestehende Tabs erhalten und besser verknüpfen
3. Keine Datenbankänderungen in diesem Repository
4. Backend nur additiv ändern, falls für Home-Daten nötig
5. Keine Breaking Changes am Panel-Endpoint

## Aktueller Projektkontext

- Repository: niceeins-twitch-extension
- Pfad: /var/www/wordpress/wp-content/plugins/niceeins-twitch-extension
- Frontend: React 19 + Vite
- Backend: WordPress-Plugin mit REST-Endpunkt
- Panel-Endpoint: wp-json/niceeins-extension/v1/panel
- Aktuelle Tabs: Plan, Links, Games, Cmds
- Daten kommen aus niceeins-streamsync: Streamer, Schedule, Announcements, Commands, Games, Socials
- Twitch JWT-Auth und CORS für Twitch iframe sind vorhanden
- Caching über WordPress Transients

## Roadmap

### Sprint 001 — Panel Home Tab

Status: open
Ziel: Neuer Start-Tab als erste Ansicht im Twitch Panel.

### Später

- Commands-Tab UX verbessern
- Plan-Tab kompakter machen
- Game-Suggestions aus StreamSync im Panel nur lesend anzeigen
- Clip-Highlights aus StreamSync anzeigen
