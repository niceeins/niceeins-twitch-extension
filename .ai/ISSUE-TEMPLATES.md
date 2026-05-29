# Issue Templates — niceeins-twitch-extension

Letztes Update: 2026-05-29 (Sprint 008 Nachtrag — Discord-Forum-Feedbackfluss)

Kopierbare Markdown-Vorlagen für GitHub Issues. Jede Vorlage ist direkt in ein GitHub Issue einfügbar.

---

## Template 1: Bug Report

```markdown
## Bug Report

**Kurzbeschreibung:**
<!-- Einzeiler: Was ist kaputt? -->

**Betroffener Bereich:**
<!-- Panel / Home-Tab / Games-Tab / Schedule-Tab / Commands-Tab / Auth / API / StreamSync-Connect -->

**Schritte zum Reproduzieren:**
1. 
2. 
3. 

**Erwartetes Verhalten:**
<!-- Was sollte passieren? -->

**Tatsächliches Verhalten:**
<!-- Was passiert stattdessen? -->

**Screenshots / Logs:**
<!-- Falls vorhanden, hier einfügen (Twitch Panel Screenshot, Browser Console, etc.) -->

**Priorität:**
<!-- P0 Kritisch / P1 Hoch / P2 Normal / P3 Niedrig -->

**Betroffenes Repo:**
<!-- niceeins-twitch-extension / niceeins-streamsync / beide -->

**Vermutete Ursache:**
<!-- Optional: Frontend (React/Vite), Backend (PHP), StreamSync-Endpunkt, Twitch JWT? -->

**Quelle:**
<!-- Discord Forum / Direkt gemeldet / Eigener Test / Monitoring / Sonstiges -->

**Discord-Thread-Link:**
<!-- Falls aus Discord: Link zum Thread einfügen -->

**Discord-Melder (optional):**
<!-- Nutzername im Discord, falls bekannt -->

**Öffentlich zurückmelden:**
<!-- ja / nein — soll nach Fix im Discord-Thread Rückmeldung gegeben werden? -->

**Akzeptanzkriterien:**
- [ ] 
- [ ] 

**Validierung:**
```bash
# npm run lint
# npm run build
# Panel manuell im Twitch Developer Rig oder Playwright prüfen
```
```

---

## Template 2: Beta Feedback

```markdown
## Beta Feedback

**Wer meldet es?**
<!-- Nutzername / Rolle (z.B. "Streamer auf nice1.id", "Zuschauer im Twitch Chat") -->

**Kontext:**
<!-- Wo, wann, in welcher Situation aufgefallen? (z.B. beim Öffnen des Panels) -->

**Feedback:**
<!-- Beschreibung des Feedbacks in eigenen Worten -->

**Schmerzpunkt:**
<!-- Was nervt, verwirrt oder blockiert den Nutzer im Panel? -->

**Gewünschtes Ergebnis:**
<!-- Was würde der Nutzer erwarten oder bevorzugen? -->

**Wichtigkeit für den Nutzer:**
<!-- Hoch / Mittel / Niedrig -->

**Betroffener Bereich:**
<!-- Panel / Home-Tab / Games / Schedule / Commands / Links / Allgemein -->

**Umsetzungsnotiz:**
<!-- Optional: erste Einschätzung, ob und wie das umgesetzt werden könnte -->

**Quelle:**
<!-- Discord Forum / Direkt gemeldet / Sonstiges -->

**Discord-Thread-Link:**
<!-- Falls aus Discord: Link zum Thread einfügen -->

**Discord-Melder (optional):**
<!-- Nutzername im Discord, falls bekannt -->

**Öffentlich zurückmelden:**
<!-- ja / nein -->
```

---

## Template 3: Feature Request

```markdown
## Feature Request

**Ziel:**
<!-- Was soll erreicht werden? -->

**Nutzerproblem:**
<!-- Welches konkrete Problem löst dieses Feature im Twitch Panel? -->

**Vorgeschlagene Lösung:**
<!-- Wie könnte das Feature im Panel aussehen oder funktionieren? -->

**Alternativen überlegt:**
<!-- Welche anderen Ansätze wurden erwogen? Warum dieser Vorschlag? -->

**Out of scope:**
<!-- Was gehört explizit nicht zu diesem Feature? Keine Datenbankänderungen in diesem Repo! -->

**Akzeptanzkriterien:**
- [ ] 
- [ ] 

**Risiken:**
<!-- Breaking Changes am Panel-Endpunkt? Twitch JWT betroffen? StreamSync-Abhängigkeit? -->

**Quelle:**
<!-- Discord Forum / Direkt gemeldet / Eigener Test / Sonstiges -->

**Discord-Thread-Link:**
<!-- Falls aus Discord: Link zum Thread einfügen -->

**Discord-Melder (optional):**
<!-- Nutzername im Discord, falls bekannt -->

**Öffentlich zurückmelden:**
<!-- ja / nein -->

**Validierung:**
```bash
# npm run lint
# npm run build
# Panel manuell prüfen
```
```

---

## Template 4: Tech Debt

```markdown
## Tech Debt

**Problem:**
<!-- Was ist die technische Schuld? (z.B. veraltete React-Patterns, fehlende Typen, zu großer Bundle) -->

**Warum ist das relevant?**
<!-- Welche Auswirkungen hat die Schuld auf Wartbarkeit, Performance oder Sicherheit? -->

**Betroffene Dateien / Bereiche:**
<!-- Pfade, Komponenten, PHP-Klassen, etc. -->

**Risiko, wenn wir es nicht tun:**
<!-- Was passiert, wenn wir es ignorieren? -->

**Vorschlag:**
<!-- Wie sollte die Schuld abgebaut werden? -->

**Akzeptanzkriterien:**
- [ ] 
- [ ] 

**Validierung:**
```bash
# npm run lint
# npm run build
```
```

---

## Template 5: Sprint-from-Issue (für .ai/sprints/)

Vorlage für einen neuen Sprint, der aus einem GitHub Issue entsteht.  
Dateiname: `.ai/sprints/NNN-kurzbeschreibung.md`

```markdown
# Sprint NNN — [Titel]

Status: open
Erstellt: YYYY-MM-DD
GitHub Issue: #NNN

## Ziel

<!-- Einzeiler: Was wird in diesem Sprint erreicht? -->

## Scope

<!-- Was wird konkret umgesetzt? -->
- 
- 

## Out of scope

<!-- Was wird explizit NICHT gemacht? -->
- Keine Datenbankänderungen in niceeins-twitch-extension
- Keine Breaking Changes am REST-Endpoint `/niceeins-extension/v1/panel`
- 

## Betroffenes Repo

niceeins-twitch-extension

## Akzeptanzkriterien

- [ ] 
- [ ] 

## Validierung

```bash
cd /var/www/wordpress/wp-content/plugins/niceeins-twitch-extension

# Lint
npm run lint

# Build
npm run build

# PHP-Syntax (falls PHP geändert)
php -l niceeins-twitch-extension.php
```

## Risiko-Hinweise

<!-- Twitch JWT-Auth betroffen? CORS für Twitch iframes betroffen? StreamSync-Endpunkt abhängig? -->

## Kein Commit ohne Freigabe

Ergebnis zusammenfassen und auf Freigabe von Stephan warten.
```
```

---

## Hinweise zur Nutzung

- Templates sind Ausgangspunkt — nicht alle Felder müssen befüllt werden.
- Bei P0-Issues sofort Stephan direkt informieren (nicht nur GitHub Issue).
- Sprint-from-Issue Vorlage immer in `.ai/sprints/NNN-...md` speichern — nicht direkt als GitHub Comment.
- Labels aus `.ai/ISSUE-WORKFLOW.md` verwenden.
- Twitch Panel-spezifisch: Screenshots im Twitch Developer Rig oder direkt vom Stream machen.
