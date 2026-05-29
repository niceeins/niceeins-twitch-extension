# Sprint 008 — GitHub/Bugtracker-Workflow

Status: done
Erstellt: 2026-05-29
Abgeschlossen: 2026-05-29
Repo: niceeins-twitch-extension

## Ziel

GitHub-/Bugtracker-Workflow dokumentieren: Issue-Typen, Prioritäten, Labels, Status-Flow, Triage-Regeln, Definition of Done und kopierbare Issue-Templates.

## Scope

- `.ai/ISSUE-WORKFLOW.md` — Vollständiger Workflow-Prozess inkl. Discord-Forum-Feedbackfluss
- `.ai/ISSUE-TEMPLATES.md` — Kopierbare Vorlagen (Bug, Beta-Feedback, Feature, Tech-Debt, Sprint-from-Issue) inkl. Discord-Quellfelder
- `.ai/PLAN.md` — Schritt 8 als done markiert
- `.ai/HANDOFF.md` — Verweis auf ISSUE-WORKFLOW.md und ISSUE-TEMPLATES.md ergänzt, Discord-Triage-Pflichtregeln
- `.ai/current-sprint.md` — Sprint 008 als done eingetragen
- Discord als primärer Beta-Feedback-Eingang dokumentiert

## Out of scope

- GitHub MCP installieren oder konfigurieren
- GitHub API nutzen (lesen oder schreiben)
- Echte Issues auf GitHub erstellen
- Automatische GitHub-Issue-Erstellung aktivieren
- Produktivcode ändern (PHP, JS/TSX, CSS, etc.)
- Commits
- Pushes

## Akzeptanzkriterien

- [x] `.ai/ISSUE-WORKFLOW.md` existiert und beschreibt vollständigen Workflow
- [x] `.ai/ISSUE-TEMPLATES.md` existiert mit Vorlagen für alle Issue-Typen
- [x] `.ai/PLAN.md` markiert Schritt 8 als done
- [x] `.ai/HANDOFF.md` verweist auf Bugtracker-Workflow-Dokumente
- [x] `.ai/current-sprint.md` zeigt Sprint 008 als done
- [x] Discord als primärer Beta-Eingang ist in Workflow, Templates und HANDOFF berücksichtigt

## Validierung

```bash
cd /var/www/wordpress/wp-content/plugins/niceeins-twitch-extension

find .ai -maxdepth 3 -type f | sort
git status --short
git diff -- .ai/ISSUE-WORKFLOW.md .ai/ISSUE-TEMPLATES.md .ai/PLAN.md .ai/HANDOFF.md .ai/current-sprint.md .ai/sprints/008-github-bugtracker-workflow.md
```

## Risiko-Hinweise

- Kein Code verändert — rein dokumentarischer Sprint.
- Kein Commit ohne Freigabe von Stephan.
