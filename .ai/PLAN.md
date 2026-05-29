# NiceEins Twitch Extension — AI Plan

Letztes Update: 2026-05-29 (Sprint 013 done — react-hooks/exhaustive-deps Warning behoben, 0 Lint-Warnungen)

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

## Tooling-Roadmap

Die folgende Roadmap gilt als Reihenfolge für AI-Tooling-Einrichtung (vor/parallel zu Produktsprints):

| # | Schritt | Status |
|---|---------|--------|
| 1 | **Guardrails** — Repo-Grenzen, Sicherheitsregeln, Schreibregeln | done (Sprint 001-ai-tooling-guardrails, 2026-05-29) |
| 2 | **Serena** — Code-Navigations-Tool einrichten, repo-begrenzt | done (Sprint 002-serena-mcp-setup, 2026-05-29) |
| 3 | **CodeGraph** — Abhängigkeitsgraph, repo-begrenzt | done (Sprint 003-codegraph-setup, 2026-05-29) |
| 4 | **Context7** — API-/Framework-Doku-Lookups (Twitch API, React, Vite) | done (Sprint 004-context7-mcp-setup, 2026-05-29) |
| 5 | **PHPStan** — Statische Analyse konfigurieren | done (Sprint 011-phpstan-backend, 2026-05-29) |
| 6 | **PHPUnit** — Unit-Test-Grundlage legen | done (Sprint 012-backend-panel-smoke-tests, 2026-05-29) |
| 7 | **Playwright** — End-to-End-Tests für kritische Panel-Flows | done (Sprint 012-backend-panel-smoke-tests, 2026-05-29) |
| 8 | **GitHub/Bugtracker-Workflow** — Issue-Tracking, PR-Prozess | done (Sprint 008-github-bugtracker-workflow, 2026-05-29) |
| 10 | **CI/Tooling-Grundlage** — GitHub Actions CI, npm-Checks, .gitignore | done (Sprint 010-twitch-extension-ci-tooling, 2026-05-29) |

**Tooling-Roadmap vollständig.** Nächster Schritt: Panel Home Tab (Sprint 001-panel-home-tab) nach Freigabe.

## Feature-Roadmap

### Sprint 001 — Panel Home Tab

Status: open
Ziel: Neuer Start-Tab als erste Ansicht im Twitch Panel.

### Später

- Commands-Tab UX verbessern
- Plan-Tab kompakter machen
- Game-Suggestions aus StreamSync im Panel nur lesend anzeigen
- Clip-Highlights aus StreamSync anzeigen
