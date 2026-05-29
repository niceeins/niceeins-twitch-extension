# Sprint 010 — Twitch Extension CI/Tooling-Grundlage

**Status**: done
**Erstellt**: 2026-05-29
**Abgeschlossen**: 2026-05-29
**Repository**: niceeins-twitch-extension

---

## Ziel

CI- und Tooling-Grundlage für die Twitch Extension einrichten: vorhandene npm/PHP-Checks prüfen, GitHub Actions CI erstellen, lokale Checks ausführen, Dokumentation aktualisieren.

---

## Scope

- Vorhandene npm/PHP-Checks prüfen
- GitHub Actions CI (`.github/workflows/ci.yml`) erstellen
- `.gitignore` auf Root-Ebene bereinigen
- Lokale Checks ausführen (npm ci, lint, build)
- PLAN.md, HANDOFF.md, current-sprint.md aktualisieren

## Out of Scope

- Deployment oder Twitch Extension Veröffentlichung
- Secrets oder externe API-Calls
- Produktivcodeänderungen (PHP, React, CSS)
- StreamSync-Änderungen
- PHPStan/PHPUnit (separate Sprints 005/006)
- Playwright E2E-Tests (separater Sprint 007)
- Große Refactorings

---

## Ist-Zustand (ermittelt)

### Toolstack

| Tool | Version |
|------|---------|
| Node.js | 22.22.3 |
| npm | 10.9.8 |
| PHP | 8.3.6 |
| Composer | 2.9.8 |

### Frontend (./frontend/)

- `package.json` vorhanden mit Scripts: `dev`, `build`, `build:review`, `lint`, `preview`
- `package-lock.json` vorhanden → `npm ci` nutzbar
- Vite 8 + React 19 + ESLint 10
- `eslint.config.js` vorhanden
- `node_modules/` vorhanden und installiert

### PHP/Backend

- **Keine `composer.json`** im Repo-Root vorhanden
- `niceeins-twitch-extension.php` ist die einzige PHP-Datei
- PHP-Tooling (PHPStan, PHPUnit) noch nicht eingerichtet → separate Sprints

### dist/ — Bewusst versioniert

`frontend/dist/` ist **bewusst versioniert**. Das Plugin (PHP) liefert die kompilierten React-Assets direkt aus dem Repo aus. Daher wird `dist/` **nicht** in der Root-`.gitignore` ignoriert.

Die `frontend/.gitignore` enthält `dist` — diese gilt nur im `frontend/`-Kontext beim Vite-Dev-Server, nicht für das Repo als Ganzes. Das ist ein bekannter Widerspruch, der bewusst so beibehalten wird.

---

## Durchgeführte lokale Checks

```bash
cd frontend
npm ci          # ✓ 0 Vulnerabilities
npm run lint    # ✓ 1 Warning (exhaustive-deps), 0 Errors
npm run build   # ✓ Built in 142ms
```

### Lint-Warning (nicht blockierend)

```
frontend/src/App.jsx:863
  warning  React Hook useEffect has a missing dependency: 'data?.meta?.badges_enabled'
  react-hooks/exhaustive-deps
```

→ 0 Errors. Warning ist bekannt und nicht blockierend für CI.

---

## Erstellte/geänderte Dateien

| Datei | Aktion |
|-------|--------|
| `.github/workflows/ci.yml` | Erstellt |
| `.gitignore` (Root) | Aktualisiert (dist/-Erklärung, .serena/, Test-Artefakte) |
| `.ai/sprints/010-twitch-extension-ci-tooling.md` | Erstellt |
| `.ai/current-sprint.md` | Aktualisiert |
| `.ai/PLAN.md` | Aktualisiert |
| `.ai/HANDOFF.md` | Aktualisiert |

---

## Akzeptanzkriterien

- [x] `.github/workflows/ci.yml` existiert
- [x] CI nutzt keine Secrets
- [x] CI deployt nichts
- [x] `npm ci` lokal grün
- [x] `npm run lint` lokal grün (0 Errors)
- [x] `npm run build` lokal grün
- [x] HANDOFF.md enthält Twitch-Extension-CI-Regel
- [x] PLAN.md markiert Sprint 010 als done
- [x] dist/-Verhalten dokumentiert

---

## Validierungsbefehle

```bash
cd /var/www/wordpress/wp-content/plugins/niceeins-twitch-extension/frontend
npm ci
npm run lint
npm run build
cd ..
git diff --check
git status --short
git diff -- .github/workflows/ci.yml .gitignore .ai/PLAN.md .ai/HANDOFF.md .ai/current-sprint.md .ai/sprints/010-twitch-extension-ci-tooling.md
```

---

## Risiko-Hinweise

- `frontend/dist/` ist versioniert und darf nicht in der Root-`.gitignore` ignoriert werden.
- Keine Secrets in CI.
- Keine Deployments.
- Keine externen API-Calls.
- Keine StreamSync-Änderungen.
- PHP-Tooling (PHPStan Sprint 005, PHPUnit Sprint 006) steht noch aus.

---

## Nächste Schritte

- **Sprint 005** — PHPStan für niceeins-twitch-extension.php einrichten
- **Sprint 006** — PHPUnit-Grundlage legen
- **Sprint 007** — Playwright E2E-Tests
- **Sprint 001-panel-home-tab** — Produktsprint (open, wartet auf Freigabe)
