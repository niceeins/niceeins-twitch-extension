# Current Sprint

**Aktueller Sprint**: [010-twitch-extension-ci-tooling](sprints/010-twitch-extension-ci-tooling.md)
**Status**: done
**Erstellt**: 2026-05-29
**Abgeschlossen**: 2026-05-29

---

## Ziel

CI- und Tooling-Grundlage für die Twitch Extension einrichten: vorhandene npm/PHP-Checks prüfen, GitHub Actions CI erstellen, lokale Checks ausführen, Dokumentation aktualisieren.

## Ergebnis

- `.github/workflows/ci.yml` erstellt (Frontend-Job: Node 22, npm ci, lint, build)
- Root-`.gitignore` bereinigt (dist/ bewusst NICHT ignoriert — versioniert)
- Lokale Checks grün: npm ci ✓, npm run lint ✓ (0 Errors), npm run build ✓
- PHP-Tooling (kein composer.json) → separate Sprints 005/006
- PLAN.md, HANDOFF.md, current-sprint.md aktualisiert
- Kein Produktivcode geändert, kein Commit, kein Push

## Nächster Sprint

- **Sprint 005** — PHPStan Setup für niceeins-twitch-extension.php
- **Sprint 006** — PHPUnit-Grundlage
- **Sprint 001-panel-home-tab** — Produktsprint (open, wartet auf Freigabe)
- Nach Stephans Priorität

## Vorherige Sprints

- [008-github-bugtracker-workflow](sprints/008-github-bugtracker-workflow.md) — done (2026-05-29)
- [004-context7-mcp-setup](sprints/004-context7-mcp-setup.md) — done (2026-05-29)
- [003-codegraph-setup](sprints/003-codegraph-setup.md) — done (2026-05-29)
- [002-serena-mcp-setup](sprints/002-serena-mcp-setup.md) — done (2026-05-29)
- [001-ai-tooling-guardrails](sprints/001-ai-tooling-guardrails.md) — done (2026-05-29)
- [001-panel-home-tab](sprints/001-panel-home-tab.md) — open (geplant, nicht implementiert)

**Wichtig**: Keine Implementierung ohne explizite Freigabe von Stephan.
