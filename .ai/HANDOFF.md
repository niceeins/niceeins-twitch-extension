# AI Handoff — niceeins-twitch-extension

Letztes Update: 2026-05-29 (Sprint 012 done — PHPUnit + Playwright etabliert)

## Projekt

niceeins-twitch-extension

## AI-Tooling-Guardrails (ab 2026-05-29)

### Scope-Regeln

- AI-Tooling (Serena, CodeGraph) darf nur repo-begrenzt genutzt werden.
- Indexierungsbereich: ausschließlich `/var/www/wordpress/wp-content/plugins/niceeins-twitch-extension`.
- Verbotene Indexierungsbereiche:
  - WordPress-Core, Uploads, Themes, andere Plugins
  - Home-Verzeichnisse (`/home`, `/root`)
  - Root (`/`) — niemals
  - `/var/www/wordpress` als Ganzes — niemals

### Sicherheitsregeln

Folgende Inhalte dürfen nicht indexiert, gelesen oder ausgegeben werden:
- `wp-config.php`, `.env`, `*.key`, `*.pem`
- Private Tokens, Webhooks, OAuth-Secrets, Twitch Client Secrets, Datenbankpasswörter

### Schreibregeln

- Ohne explizite Freigabe von Stephan keine Implementierungsdateien ändern.
- Keine Commits ohne Freigabe.
- Keine Pushes ohne Freigabe.
- Keine automatisch erzeugten Index-/Cache-Ordner committen (`node_modules/`, `dist/`, `.serena/`).

### Serena-Nutzungsregel (ab 2026-05-29 aktiv)

Serena MCP ist eingerichtet als `serena-twitch-extension`. MCP-Server: projektlokal registriert.

**Aktivierung**: Serena ist sichtbar wenn `claude mcp list` aus dem Repo-Verzeichnis aufgerufen wird.

```bash
cd /var/www/wordpress/wp-content/plugins/niceeins-twitch-extension
claude mcp list
# → serena-twitch-extension: ✓ Connected
```

**Verwendung**:
- Bei Code-Navigation **zuerst Serena nutzen**, dann gezielt einzelne Dateien lesen.
- Serena darf **nicht** für Secrets, Twitch Client Secrets, JWT-Keys oder externe WordPress-Bereiche genutzt werden.
- Indexierungsbereich: ausschließlich `/var/www/wordpress/wp-content/plugins/niceeins-twitch-extension`.

### CodeGraph-Nutzungsregel (ab 2026-05-29 aktiv)

CodeGraph MCP ist **global** registriert. Sichtbar aus allen Verzeichnissen.

```bash
claude mcp list
# → codegraph: ✓ Connected
```

Twitch Extension ist indexiert: 5 Dateien, 121 Nodes, 228 Edges.
(Nach `npm run build` erneut `codegraph init -i` ausführen, um dist/-Dateien einzuschließen.)

**Verwendung**:
- Bei Code-Navigation **zuerst Serena** nutzen.
- Bei Architektur-, Call-Flow- und Impact-Fragen **zusätzlich CodeGraph** nutzen.
- Danach nur gezielt relevante Dateien lesen.
- CodeGraph darf **nicht** für Secrets, Twitch Client Secrets, JWT-Keys oder externe WordPress-Bereiche genutzt werden.
- Indexierungsbereich: ausschließlich `/var/www/wordpress/wp-content/plugins/niceeins-twitch-extension`.

**Re-Indexierung** nach größeren Codeänderungen:
```bash
cd /var/www/wordpress/wp-content/plugins/niceeins-twitch-extension
codegraph init -i
```

### Context7-Nutzungsregel (ab 2026-05-29 aktiv)

Context7 MCP ist **global** registriert. Sichtbar aus allen Verzeichnissen.

```bash
claude mcp list
# → context7: npx -y @upstash/context7-mcp@latest - ✓ Connected
```

**Verwendung**:
- Bei Fragen zu externer API-, Framework- oder Library-Dokumentation Context7 nutzen.
- Besonders relevant für: React 19, Vite, Twitch Helix API, Twitch EventSub, WordPress REST API, Twitch JWT/EBS, PHPUnit, Playwright, PHPStan.
- Wenn eine konkrete Version relevant ist, Version im Prompt angeben.
- Context7 **nicht** für eigene Projektcode-Suche verwenden → dafür Serena und CodeGraph.
- Context7 **nicht** unnötig bei reinen Projektdatei-Fragen verwenden.

### CI/Tooling-Regel (ab 2026-05-29 aktiv)

GitHub Actions CI ist eingerichtet unter `.github/workflows/ci.yml`.

**CI-Job: Frontend**
- Runner: ubuntu-latest
- Node: 22
- Schritte: `npm ci` → `npm run lint` → `npm run build` → Playwright-Install → `npm run test:e2e`
- Arbeitsverzeichnis: `frontend/`

**CI-Job: PHP**
- Runner: ubuntu-latest
- PHP: 8.3
- Schritte: `composer install` → `composer analyse` → `composer test`

**dist/-Regel:**
`frontend/dist/` ist **bewusst versioniert**. Das Plugin liefert die kompilierten React-Assets direkt aus dem Repo aus. `dist/` darf **nicht** zur Root-`.gitignore` hinzugefügt werden. Nach jeder Produktivänderung am Frontend muss `npm run build` lokal ausgeführt und der neue dist-Stand committet werden.

**PHPStan-Pflichtvalidierung:**
Nach jeder PHP-Änderung muss `composer analyse` ausgeführt werden:
```bash
cd /var/www/wordpress/wp-content/plugins/niceeins-twitch-extension
composer analyse
```

**PHPUnit-Pflichtvalidierung (ab Sprint 012, 2026-05-29):**
Nach Änderungen an PHP-Hilfsfunktionen `composer test` ausführen:
```bash
cd /var/www/wordpress/wp-content/plugins/niceeins-twitch-extension
composer test
```

**Playwright-Pflichtvalidierung (ab Sprint 012, 2026-05-29):**
Nach Frontend-Änderungen `npm run test:e2e` ausführen (setzt `npm run build` voraus):
```bash
cd /var/www/wordpress/wp-content/plugins/niceeins-twitch-extension/frontend
npm run build
npm run test:e2e
```

**PHPStan-Baseline:** `phpstan-baseline.neon` enthält 19 geparkte Altlasten (defensive method_exists()/instanceof-Guards). Diese bei späteren PHP-Refactoring-Sprints bereinigen.

**Lint-Warning (bekannt):**
`App.jsx:863` — `react-hooks/exhaustive-deps` Warning (nicht blockierend, 0 Errors).

---

### GitHub/Bugtracker-Workflow-Regel (ab 2026-05-29 aktiv)

Bugs, Beta-Feedback und Feature-Anfragen werden zuerst als GitHub Issue triagiert, bevor ein Sprint erstellt wird.

**Dokumentation:**
- `.ai/ISSUE-WORKFLOW.md` — Issue-Typen, Prioritäten, Labels, Status-Flow, Triage-Regeln, Definition of Done
- `.ai/ISSUE-TEMPLATES.md` — Kopierbare Vorlagen (Bug, Beta-Feedback, Feature, Tech-Debt, Sprint-from-Issue)

**Pflichtregeln:**
- Beta-Feedback aus Discord Forum zuerst triagieren.
- Relevante technische Themen in ein GitHub Issue überführen — Discord-Thread-Link immer mitführen.
- Sprint erst anlegen, wenn Umsetzung beschlossen.
- GitHub MCP mit Schreibrechten ist noch nicht aktiv — keine automatische Issue-Erstellung.
- P0-Issues sofort Stephan melden — nicht nur als Issue erfassen.
- Nach Umsetzung oder bewusster Entscheidung kurze Rückmeldung im Discord-Thread geben.
- Panel-Endpunkt `/niceeins-extension/v1/panel` darf nie ohne Rückwärtskompatibilitätscheck geändert werden.

---

### Tooling-Reihenfolge

Bei Code-Navigation: zuerst Serena, dann gezielt einzelne Dateien lesen.
Bei Architektur-/Impact-Fragen: zusätzlich CodeGraph.
Bei externer Doku (Twitch API, React, Vite, WordPress REST API): Context7 nutzen.

## Basis-Regeln

- Nur in diesem Repository arbeiten:
  `/var/www/wordpress/wp-content/plugins/niceeins-twitch-extension`
- Keine Änderungen an WordPress-Core, Themes oder anderen Plugins.
- Keine Änderungen am Hauptplugin niceeins-streamsync ohne explizite Freigabe.
- Keine Commits ohne Freigabe.
- Bestehende Twitch Extension Auth, CORS und Caching nicht beschädigen.
- Keine Breaking Changes am REST-Endpoint.

## Pflichtprüfung vor Änderungen

```bash
whoami
pwd
git status
git branch --show-current
git remote -v
```

## Aktueller Funktionsstand

Die Extension zeigt bisher Daten in Tabs:

- Plan
- Links
- Games
- Cmds

Der REST-Endpunkt liefert Panel-Daten aus niceeins-streamsync. Ziel ist jetzt eine neue Home-/Startansicht mit kompaktem Zuschauer-Mehrwert.

## Nächster Sprint

Siehe:

```bash
cat .ai/current-sprint.md
```

## Vollständige Validierung (alle Checks)

```bash
cd /var/www/wordpress/wp-content/plugins/niceeins-twitch-extension
composer analyse
composer test

cd frontend
npm ci
npm run lint
npm run build
npm run test:e2e

git diff --check
git status --short
```

## No Commit

Nicht committen. Ergebnis zusammenfassen und auf Freigabe warten.
