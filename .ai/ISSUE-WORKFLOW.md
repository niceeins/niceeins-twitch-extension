# GitHub Issue Workflow — niceeins-twitch-extension

Letztes Update: 2026-05-29 (Sprint 008 Nachtrag — Discord-Forum-Feedbackfluss)

## 1. Zweck

- **Discord Forum** ist der primäre Eingang für Beta-Bugs, Feedback und Feature-Wünsche aus der Community.
- **GitHub Issues** sind die zentrale technische Tracking-Quelle für getrackte Bugs und Features.
- **`.ai/sprints/`** bleibt die Arbeitsanweisung für Claude/Codex — Sprints beschreiben die konkrete Umsetzung.
- Issues beschreiben das Problem oder die Anforderung. Sprints beschreiben die Implementierung.
- Discord-Threads werden nicht als alleinige technische Quelle genutzt — relevante Meldungen werden triagiert und bei Bedarf in ein GitHub Issue oder einen `.ai`-Sprint überführt.
- Ein Issue allein startet keine Umsetzung. Erst ein Sprint löst Änderungen aus.

---

## 2. Issue-Typen

| Typ | Beschreibung |
|-----|--------------|
| `bug` | Fehler im Verhalten — etwas funktioniert nicht wie erwartet |
| `beta-feedback` | Rückmeldung von Beta-Testern — qualitativ, UX oder funktional |
| `feature` | Neue Funktionalität oder Erweiterung eines bestehenden Features |
| `tech-debt` | Technische Schulden — Code, Struktur oder Konfiguration die verbessert werden sollte |
| `security-privacy` | Sicherheits- oder Datenschutzrelevante Probleme — immer P0 oder P1 |
| `ux` | UX-Probleme, Verständlichkeit, Barrierefreiheit |
| `docs` | Fehlende, falsche oder veraltete Dokumentation |
| `release` | Release-Checks, Deployment-Aufgaben, Changelogs |

---

## 3. Prioritäten

| Priorität | Bezeichnung | Bedeutung |
|-----------|-------------|-----------|
| **P0** | Kritisch | Security-Lücke, Datenverlust, Auth/JWT kaputt, Panel lädt nicht |
| **P1** | Hoch | Panel-Tab defekt, fehlerhafte Datendarstellung, StreamSync-Verbindung kaputt |
| **P2** | Normal | UX-Bug, kleinere Anzeigeprobleme, Performance-Auffälligkeiten |
| **P3** | Niedrig | Kosmetisches, Textkorrekturen, kleine Verbesserungen ohne Nutzungsblockade |

**P0 erfordert sofortige Reaktion** — noch vor dem nächsten Sprint.  
**P1 muss in den nächsten Sprint** oder als Hotfix behandelt werden.

---

## 4. Issue-Status / Flow

```
inbox → triaged → planned → in-progress → needs-review → done
                                                         ↓
                                                  wontfix / duplicate
```

| Status | Bedeutung |
|--------|-----------|
| `inbox` | Neu gemeldet, noch nicht bewertet |
| `triaged` | Bewertet, Priorität gesetzt, Typ zugewiesen |
| `planned` | Sprint geplant oder in Backlog aufgenommen |
| `in-progress` | Sprint aktiv in Arbeit |
| `needs-review` | Implementierung fertig, wartet auf Freigabe |
| `done` | Abgeschlossen, verifiziert |
| `wontfix` | Bewusste Entscheidung, nicht umzusetzen |
| `duplicate` | Bereits als anderes Issue erfasst |

---

## 5. Label-Vorschläge

### Typ-Labels
- `type:bug`
- `type:feature`
- `type:beta-feedback`
- `type:tech-debt`
- `type:security-privacy`
- `type:ux`
- `type:docs`
- `type:release`

### Bereichs-Labels
- `area:panel`
- `area:extension`
- `area:ui`
- `area:home-tab`
- `area:games`
- `area:schedule`
- `area:commands`
- `area:twitch`
- `area:eventsub`
- `area:api`
- `area:auth`
- `area:streamsync-connect`

### Prioritäts-Labels
- `priority:p0`
- `priority:p1`
- `priority:p2`
- `priority:p3`

### Status-Labels
- `status:inbox`
- `status:triaged`
- `status:planned`
- `status:in-progress`
- `status:needs-review`
- `status:done`

---

## 6. Triage-Regeln

Bei jedem neuen Issue folgende Punkte prüfen:

1. **Reproduzierbarkeit** — Lässt sich das Problem im Twitch Panel nachvollziehen? Schritte dokumentieren.
2. **Betroffenes Repo** — Ist die Twitch Extension selbst oder der StreamSync-Backend-Endpunkt betroffen?
3. **Sicherheits-/Datenschutzrelevanz** — Wenn ja: sofort P0 setzen. Twitch JWT und EBS besonders beachten.
4. **Externe API betroffen?** — Twitch Helix, EventSub, StreamSync REST? → Context7 für aktuelle API-Doku nutzen.
5. **Code-Impact prüfen** — Serena und CodeGraph nutzen, um Auswirkungen auf Panel-Tabs zu verstehen.
6. **Priorität setzen** — P0–P3 nach obiger Tabelle.
7. **Sprint erstellen** — Wenn Umsetzung beschlossen: kleinen Sprint in `.ai/sprints/` anlegen.

---

## 7. Definition of Done

Für **niceeins-twitch-extension** gilt ein Issue als erledigt, wenn:

- [ ] `npm run lint` läuft grün (falls vorhanden)
- [ ] `npm run build` läuft grün
- [ ] Panel-Ansicht manuell oder via Playwright geprüft (soweit möglich)
- [ ] Keine Breaking Changes am REST-Endpoint `/niceeins-extension/v1/panel`
- [ ] Twitch JWT-Auth und CORS nicht beschädigt
- [ ] Kein Commit ohne Freigabe von Stephan
- [ ] GitHub Issue auf `done` gesetzt

---

## 8. Zusammenspiel Issues ↔ Sprints

| Schritt | Wer | Was |
|---------|-----|-----|
| 1 | Stephan / Beta-Tester | Meldet Issue auf GitHub |
| 2 | Stephan | Triage: Priorität, Typ, Labels |
| 3 | Chef-AI (Orchestration) | Analysiert Issue, erstellt Sprint-Datei in `.ai/sprints/` |
| 4 | Claude Code / Codex | Führt Sprint aus |
| 5 | Stephan | Reviewt, gibt Commit frei |
| 6 | Stephan | Schließt GitHub Issue |

---

## 9. Discord-Forum-Feedbackfluss

### Drei-Ebenen-Modell

```
Discord Forum (primärer Beta-Eingang)
        ↓ Triage durch Stephan
GitHub Issues (technische Tracking-Quelle)
        ↓ Sprint-Erstellung durch Chef-AI
.ai/sprints/ (Arbeitsanweisung für Claude/Codex)
```

### Ablauf

| Schritt | Wer | Was |
|---------|-----|-----|
| 1 | Beta-Tester / Community | Meldet im Discord Forum |
| 2 | Stephan | Liest Thread, bewertet Relevanz |
| 3 | Stephan | Triagiert: Priorität, Typ — relevante Meldungen werden GitHub Issue |
| 4 | Stephan | Fügt Discord-Thread-Link ins GitHub Issue ein |
| 5 | Chef-AI | Erstellt Sprint aus Issue, falls Umsetzung beschlossen |
| 6 | Claude Code / Codex | Führt Sprint aus |
| 7 | Stephan | Gibt Commit frei, schließt Issue |
| 8 | Stephan | Kurze Rückmeldung im Discord-Thread (Erledigt / Geplant / Nicht umsetzbar) |

### Regeln

- Jedes aus Discord übernommene GitHub Issue enthält den Discord-Thread-Link im Issue-Body.
- Discord-Threads werden nicht als alleinige technische Quelle genutzt.
- Nicht jede Discord-Meldung braucht ein GitHub Issue — Stephan entscheidet bei der Triage.
- Nach Fix oder bewusster Entscheidung kurze Rückmeldung im Discord-Thread.
- P0-Meldungen aus Discord sofort eskalieren — nicht auf nächste Triage-Runde warten.

### Empfohlene Discord-Forum-Tags

**Typ-Tags:**
- `Bug`
- `Feedback`
- `Feature-Wunsch`
- `Frage`

**Status-Tags:**
- `Geplant`
- `In Arbeit`
- `Erledigt`
- `Kann nicht reproduziert werden`

**Bereichs-Tags:**
- `Dashboard`
- `Profilseite`
- `Discord-Sync`
- `Twitch-Sync`
- `Games`
- `Panel`
- `Mobile`
- `Login`

---

## 10. Besonderheiten Twitch Extension

- Änderungen am Panel-Endpunkt müssen rückwärtskompatibel sein.
- Frontend (React 19 + Vite) und Backend (WordPress Plugin) werden getrennt behandelt.
- JWT-Validierung und CORS für Twitch iframes dürfen nicht beschädigt werden.
- Daten kommen aus **niceeins-streamsync** — bei Backend-Bugs prüfen, ob StreamSync betroffen ist.

---

## 11. Tooling-Hinweise

- **Serena** → Code-Navigation, betroffene Dateien finden
- **CodeGraph** → Impact-Analyse, Call-Flow durch React-Komponenten verstehen
- **Context7** → Externe API-Doku (Twitch Helix, EventSub, EBS JWT, React, Vite)
- **npm run lint** → Lint-Check nach JS/TS/React-Änderungen
- **npm run build** → Build-Check vor jedem Commit
