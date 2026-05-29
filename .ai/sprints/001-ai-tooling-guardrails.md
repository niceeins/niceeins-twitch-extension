# Sprint: 001-ai-tooling-guardrails

Status: open
Erstellt: 2026-05-29
Projekt: niceeins-twitch-extension

---

## Ziel

Sichere Grundlage für den Einsatz von Serena, CodeGraph, Context7, PHPStan, PHPUnit und Playwright schaffen. Kein Produktivcode wird in diesem Sprint geändert — nur Guardrails, Regeln und Planungsdokumente.

---

## Scope

- AI-Tooling darf nur repo-begrenzt genutzt werden.
- Serena/CodeGraph dürfen nur im Plugin-Verzeichnis `/var/www/wordpress/wp-content/plugins/niceeins-twitch-extension` arbeiten.
- Keine Indexierung von:
  - WordPress-Core (`/var/www/wordpress/wp-includes`, `/var/www/wordpress/wp-admin`)
  - Uploads (`/var/www/wordpress/wp-content/uploads`)
  - Themes (`/var/www/wordpress/wp-content/themes`)
  - Andere Plugins (`/var/www/wordpress/wp-content/plugins` außer diesem Repo)
  - Home-Verzeichnisse (`/home`, `/root`)
  - Root (`/`)
- Keine Secrets indexieren.
- Keine automatisch erzeugten Index-/Cache-Ordner committen (`.serena/`, `.codegraph/`, `node_modules/`, `vendor/`, `dist/`).

---

## Out of Scope

- Installation von Serena
- Installation von CodeGraph
- Installation von Context7
- PHPStan-Konfiguration
- PHPUnit-Konfiguration
- Playwright-Konfiguration
- Produktivcode-Änderungen (PHP, JS, JSX, TS, TSX, CSS, Composer, package.json)

---

## Pflicht-Checks vor jeder Coding-Aufgabe

```bash
whoami
pwd
git status
git branch --show-current
git remote -v
```

---

## Tooling-Regeln

- Bei Code-Navigation zuerst Serena/CodeGraph nutzen, danach nur gezielt relevante Dateien lesen.
- Bei Fragen zu externer API-/Framework-Dokumentation (Twitch API, React, Vite) Context7 oder aktuelle offizielle Doku verwenden.
- Kein blindes Durchsuchen des gesamten WordPress-Verzeichnisses.

---

## Schreibregeln

- Ohne explizite Freigabe von Stephan keine Implementierungsdateien ändern.
- Keine Commits ohne Freigabe.
- Keine Pushes ohne Freigabe.
- Erlaubte Schreibpfade: nur `.ai/` innerhalb dieses Repos.

---

## Sicherheitsregeln

Die folgenden Dateien und Inhalte dürfen nicht indexiert, gelesen oder ausgegeben werden:

- `wp-config.php`
- `.env`, `*.env.*`
- `*.key`, `*.pem`
- Private Tokens, Webhooks, OAuth-Secrets, Twitch Client Secrets
- Passwörter und Datenbankzugangsdaten

Verbotene Indexierungsbereiche:
- `/var/www/wordpress` als Ganzes
- `/` niemals

---

## Akzeptanzkriterien

- [ ] Sprint-Datei `001-ai-tooling-guardrails.md` existiert in `.ai/sprints/`.
- [ ] `current-sprint.md` zeigt auf diesen Sprint.
- [ ] `PLAN.md` enthält die Tooling-Roadmap (Guardrails → Serena → CodeGraph → Context7 → PHPStan → PHPUnit → Playwright → GitHub/Bugtracker-Workflow).
- [ ] `HANDOFF.md` enthält die aktualisierten Guardrails.
- [ ] Keine Produktivdateien wurden geändert.

---

## Validierung

```bash
find .ai -maxdepth 3 -type f | sort
git status --short
git diff -- .ai/PLAN.md .ai/HANDOFF.md .ai/current-sprint.md .ai/sprints/001-ai-tooling-guardrails.md
```

---

## Risiko-Hinweise

- Guardrails nicht zu breit formulieren — sie sollen AI-Arbeit ermöglichen, nicht blockieren.
- Keine Toolinstallation in diesem Sprint.
- Keine Indexierung in diesem Sprint.
- Dieses Dokument ist Planungsdatei, kein Implementierungsauftrag.
