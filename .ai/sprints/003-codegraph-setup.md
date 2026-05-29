# Sprint 003 — CodeGraph Setup

**Projekt**: niceeins-twitch-extension
**Status**: done
**Erstellt**: 2026-05-29
**Abgeschlossen**: 2026-05-29

---

## Ziel

CodeGraph repo-begrenzt als Ergänzung zu Serena für Projektgraph, Call-Flows und Impact-Analyse nutzbar machen.

## Scope

- Node/npm prüfen
- CodeGraph installieren
- CodeGraph MCP registrieren
- Twitch Extension repo-begrenzt indexieren
- .codegraph/ aus Git ausschließen
- Nutzungsregeln dokumentieren

## Out of scope

- Context7
- PHPStan
- PHPUnit
- Playwright
- Produktivcode-Änderungen

---

## Ergebnis

### Versionen

- Node: v22.22.3
- npm: 10.9.8
- CodeGraph: 0.9.7

### Installation

```bash
npm install -g @colbymchenry/codegraph
# → added 2 packages in 3s
```

### MCP-Registrierung

```bash
codegraph install --target claude --location global --yes
```

CodeGraph wurde **global** registriert (in `~/.claude.json` und `~/.claude/settings.json`).

**Sichtbarkeit:**
- Aus allen Verzeichnissen sichtbar (global)
- `claude mcp list` zeigt: `codegraph: ✓ Connected`

### Indexierung Twitch Extension

```bash
cd /var/www/wordpress/wp-content/plugins/niceeins-twitch-extension
codegraph init -i
```

Ergebnis:
- 6 Dateien gescannt
- 5 Dateien indexiert
- 121 Nodes, 228 Edges
- Dauer: 210 ms

Hinweis: Die geringe Dateianzahl liegt daran, dass `frontend/dist/` im Repo nicht vorhanden war (`main-BGXovz0B.js` und `main-C6Vz3k9T.css` als gelöscht markiert). Nur PHP- und Kern-JS-Dateien wurden indexiert.

### .gitignore

Neue `.gitignore` erstellt (war nicht vorhanden):
```
.codegraph/
```

---

## Nutzungsregel (CodeGraph)

- Bei Code-Navigation zuerst **Serena** verwenden.
- Bei Architektur-, Call-Flow- und Impact-Fragen zusätzlich **CodeGraph** verwenden.
- Danach nur gezielt relevante Dateien lesen.
- CodeGraph darf **nicht** verwendet werden, um Secrets (Twitch Client Secrets, JWT-Keys) oder externe WordPress-Bereiche zu durchsuchen.
- Indexierungsbereich: ausschließlich `/var/www/wordpress/wp-content/plugins/niceeins-twitch-extension`.

---

## Analyse-Testprompts (für manuelle Ausführung)

**Testprompt 1 — Discord-Kette (über StreamSync):**
```
Nutze zuerst Serena und CodeGraph. Analysiere die Kette vom Dashboard-Stream-Termin bis zur Discord-Benachrichtigung. Keine Änderungen, nur betroffene Dateien/Klassen nennen.
```

**Testprompt 2 — Impact-Analyse Twitch-Banner:**
```
Nutze zuerst Serena und CodeGraph. Welche Bereiche wären betroffen, wenn Streamer optional ihr Twitch-Profilbanner als Profilbanner-Fallback übernehmen können? Keine Änderungen, nur Impact-Analyse.
```

---

## Validierung

```bash
codegraph --version
# → 0.9.7

codegraph status
# → CodeGraph Status, Project: ..., Indexed X files

claude mcp list
# → codegraph: ✓ Connected

git status --short

find .ai -maxdepth 3 -type f | sort

ls -la .codegraph
```

---

## Risiko-Hinweise

- CodeGraph darf niemals `/` oder `/var/www/wordpress` als Ganzes indexieren.
- Keine Secrets lesen oder ausgeben (Twitch Client Secret, JWT-Keys etc.).
- Keine Produktivdateien ändern.
- `.codegraph/` darf nicht committet werden.
- MCP ist global registriert — kein repo-lokaler Scope.
- Bei neuem `npm run build` sollte `codegraph init -i` erneut ausgeführt werden, damit dist/-Dateien in den Index fließen.

---

## Akzeptanzkriterien

- [x] `codegraph --version` funktioniert (0.9.7)
- [x] `claude mcp list` zeigt CodeGraph als Connected
- [x] Twitch Extension hat lokale `.codegraph/`-Daten (5 Dateien, 121 Nodes)
- [x] `.codegraph/` ist aus Git ausgeschlossen (neue .gitignore erstellt)
- [x] `003-codegraph-setup.md` angelegt
- [x] PLAN.md markiert CodeGraph als done, Context7 als nächsten Schritt
- [x] HANDOFF.md enthält CodeGraph-Nutzungsregel
