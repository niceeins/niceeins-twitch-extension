# Sprint 004 — Context7 MCP Setup

**Status**: done
**Erstellt**: 2026-05-29
**Abgeschlossen**: 2026-05-29
**Repo**: niceeins-twitch-extension

---

## Ziel

Context7 MCP als aktuelle Dokumentationsquelle für externe APIs, Frameworks und Libraries nutzbar machen.

## Scope

- Node/npm/npx prüfen
- Context7 MCP registrieren (`claude mcp add context7`)
- MCP-Verbindung prüfen
- Nutzungsregel dokumentieren

## Out of Scope

- PHPStan
- PHPUnit
- Playwright
- GitHub/Bugtracker-Workflow
- Produktivcode-Änderungen
- Indexierung eigener Projektdateien

## Ergebnis

- Node v22.22.3, npm 10.9.8, npx 10.9.8 — alle vorhanden.
- Context7 registriert mit: `claude mcp add context7 -- npx -y @upstash/context7-mcp@latest`
- `claude mcp list` zeigt: `context7: npx -y @upstash/context7-mcp@latest - ✓ Connected`
- Nutzungsregel in HANDOFF.md und PLAN.md ergänzt.

## Validierungsnachweis

```
node -v     → v22.22.3
npm -v      → 10.9.8
npx -v      → 10.9.8
claude mcp list → context7: npx -y @upstash/context7-mcp@latest - ✓ Connected
git status --short → keine neuen Implementierungsdateien verändert
```

## Nutzungsregel (Context7)

- Bei Fragen zu externer API-, Framework- oder Library-Dokumentation Context7 nutzen.
- Besonders relevant für: React 19, Vite, Twitch Helix API, Twitch EventSub, WordPress REST API, Twitch JWT/EBS, PHPUnit, Playwright, PHPStan.
- Wenn eine konkrete Version relevant ist, Version im Prompt angeben.
- Context7 **nicht** für eigene Projektcode-Suche verwenden → dafür Serena und CodeGraph.
- Context7 **nicht** unnötig bei reinen Projektdatei-Fragen verwenden.

## Tooling-Reihenfolge (aktuell vollständig)

1. **Serena** — zuerst für Symbol-/Code-Navigation im Repo
2. **CodeGraph** — zusätzlich für Architektur-, Call-Flow- und Impact-Fragen
3. **Context7** — für aktuelle externe Doku (APIs, Frameworks, Libraries)
4. Danach nur gezielt relevante Dateien lesen

## Akzeptanzkriterien — alle erfüllt

- [x] `claude mcp list` zeigt `context7 - ✓ Connected`
- [x] Sprint-Datei `.ai/sprints/004-context7-mcp-setup.md` angelegt
- [x] `PLAN.md` markiert Context7 als eingerichtet, PHPStan als nächsten Schritt
- [x] `HANDOFF.md` enthält Context7-Nutzungsregel
- [x] `current-sprint.md` zeigt Sprint 004 als done und PHPStan als nächsten Schritt

## Risiko-Hinweise

- Context7 holt externe Doku — keine Twitch Client Secrets, JWT-Keys oder OAuth-Tokens in Doku-Prompts schreiben.
- Context7 ist nicht für Projektcode-Suche gedacht.
- Nicht unnötig verwenden — Doku-Abfragen kosten Kontext/Tokens.
- Keine Produktivdateien geändert.

## Test-Prompts (manuell ausführbar)

```
"Nutze Context7. Suche aktuelle Dokumentation zu React 19 useActionState
und gib nur eine kurze Zusammenfassung der relevanten API. Keine Codeänderungen."

"Nutze Context7. Suche aktuelle Dokumentation zur Twitch Helix API
Get Streams Endpoint. Keine Codeänderungen."
```
