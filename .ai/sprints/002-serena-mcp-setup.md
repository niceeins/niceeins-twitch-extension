# Sprint 002 — Serena MCP Setup

**Status**: done
**Erstellt**: 2026-05-29
**Abgeschlossen**: 2026-05-29
**Repo**: niceeins-twitch-extension

---

## Ziel

Serena MCP repo-begrenzt für semantische Code-Navigation nutzbar machen. Kein Produktivcode wird geändert.

## Scope

- Serena-Verfügbarkeit prüfen
- uv/uvx installieren (falls nicht vorhanden)
- Serena für niceeins-twitch-extension registrieren
- MCP-Verbindung prüfen
- Nutzungsregeln dokumentieren

## Out of scope

- CodeGraph
- Context7
- PHPStan
- PHPUnit
- Playwright
- Produktivcode-Änderungen

---

## Ergebnis

### Verfügbarkeit beim Sprint-Start

| Tool | Status |
|------|--------|
| `uv` | nicht vorhanden — wurde installiert |
| `uvx` | nicht vorhanden — wurde installiert |
| `serena` (direkt) | nicht vorhanden |
| `claude mcp list` (global) | nur playwright, google drive, github |

### Durchgeführte Schritte

1. `uv` via `curl -LsSf https://astral.sh/uv/install.sh | sh` installiert → Version 0.11.17
2. Serena für Twitch Extension registriert:
   ```bash
   cd /var/www/wordpress/wp-content/plugins/niceeins-twitch-extension
   claude mcp add serena-twitch-extension -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context claude-code --project "$(pwd)"
   ```
3. MCP-Verbindung geprüft (im Repo-Verzeichnis):
   ```bash
   cd /var/www/wordpress/wp-content/plugins/niceeins-twitch-extension
   claude mcp list
   # → serena-twitch-extension: ... - ✓ Connected
   ```

### MCP-Verbindungsstatus (2026-05-29)

```
serena-twitch-extension: uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context claude-code --project /var/www/wordpress/wp-content/plugins/niceeins-twitch-extension - ✓ Connected
```

**Hinweis**: Der MCP-Server ist projektlokal registriert. Er erscheint nur, wenn `claude mcp list` aus dem Repo-Verzeichnis heraus aufgerufen wird. Global (z. B. aus `/home/claude`) ist er nicht sichtbar — das ist korrekt und gewollt, um den Scope auf das Repo zu begrenzen.

---

## Nutzungsregel

- Bei Code-Navigation **zuerst Serena nutzen**, dann gezielt einzelne Dateien lesen.
- Serena darf **nicht** verwendet werden, um Secrets, Twitch Client Secrets oder externe WordPress-Bereiche zu durchsuchen.
- Indexierungsbereich: ausschließlich `/var/www/wordpress/wp-content/plugins/niceeins-twitch-extension`.
- Verbotene Bereiche: WordPress-Core, Uploads, Themes, andere Plugins, `/home`, `/root`, `/`.

---

## Akzeptanzkriterien — Abnahme

- [x] `claude mcp list` (im Repo-Verzeichnis) zeigt `serena-twitch-extension` mit Status `✓ Connected`
- [x] `.ai/sprints/002-serena-mcp-setup.md` existiert
- [x] `current-sprint.md` zeigt auf diesen Sprint (erledigt, PLAN.md aktualisiert)
- [x] `PLAN.md` markiert Serena als eingerichtet, nächster Schritt CodeGraph
- [x] `HANDOFF.md` enthält Serena-Nutzungsregel

---

## Validierung

```bash
# MCP-Status prüfen
cd /var/www/wordpress/wp-content/plugins/niceeins-twitch-extension
claude mcp list

# Datei-Status
git status --short

# AI-Dateien prüfen
find .ai -maxdepth 3 -type f | sort

# Diff
git diff -- .ai/PLAN.md .ai/HANDOFF.md .ai/current-sprint.md .ai/sprints/002-serena-mcp-setup.md
```

---

## Manuelle Nutzung nach Einrichtung

Serena steht in neuen Sessions zur Verfügung, sobald Claude Code im Repo-Verzeichnis gestartet wird. Beispiel-Nutzung (nach manueller Session):

```
Nutze Serena zuerst. Gib mir nur eine Übersicht über wichtige Symbole/Klassen im Frontend (React-Komponenten, Tab-Struktur). Keine Änderungen.
```

---

## Risiko-Hinweise

- Serena darf nicht global über `/var/www/wordpress` laufen.
- Keine Secrets lesen (insbesondere Twitch Client Secrets, JWT-Keys).
- Keine Produktivdateien ändern.
- Falls MCP verbunden ist, aber Tools nicht sichtbar sind: Befund dokumentieren, nicht weiter herumprobieren.
