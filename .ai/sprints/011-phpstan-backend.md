# Sprint 011 — PHPStan Backend

**Status:** done
**Ziel:** PHPStan als statische Analyse für Twitch Extension PHP-Backend etablieren.
**Erstellt:** 2026-05-29

## Scope

- Composer + PHPStan einrichten
- phpstan.neon anlegen (Level 6)
- phpstan-bootstrap.php für StreamSync-Autoloader und Plugin-Konstanten
- Baseline erzeugen (19 Altlasten geparkt)
- `composer analyse` Script ergänzen
- CI um PHP-Analyse-Job erweitert
- vendor/ in .gitignore ergänzt
- PLAN/HANDOFF/current-sprint aktualisiert

## Out of Scope

- Produktivcode-Fixes
- PHPUnit
- Playwright
- Deployment
- StreamSync
- Frontend-Refactoring

## Ergebnis

| Prüfpunkt | Ergebnis |
|-----------|----------|
| PHP-Version | 8.3.6 |
| Composer-Version | 2.9.8 |
| PHPStan-Version | 2.2.1 |
| PHPStan-Level | 6 |
| Baseline nötig | ja (19 Fehler geparkt) |
| `composer analyse` | grün (0 errors) |
| Frontend lint | grün (1 Warning, 0 Errors) |
| Frontend build | grün |
| CI erweitert | ja (php-Job ergänzt) |

## Baseline-Beschreibung

19 Fehler aus dem Produktivcode geparkt:
- `method_exists()` / `instanceof` die PHPStan als "always true" erkennt (da StreamSync-Typen jetzt bekannt sind)
- Defensive Guards aus Altcode — kein Sicherheitsrisiko, aber kein Produktivfix in diesem Sprint

## PHPStan-Konfiguration

```
Level: 6
Paths: niceeins-twitch-extension.php
Bootstrap: phpstan-bootstrap.php (lädt StreamSync-Autoloader + Plugin-Konstanten)
Extensions: szepeviktor/phpstan-wordpress
Baseline: phpstan-baseline.neon (19 Fehler)
```

## Veränderte Dateien

- `composer.json` — neu (Tooling-only, require-dev: phpstan + phpstan-wordpress)
- `composer.lock` — neu (generiert)
- `phpstan.neon` — neu
- `phpstan-baseline.neon` — neu (19 geparkte Fehler)
- `phpstan-bootstrap.php` — neu
- `.gitignore` — vendor/ ergänzt
- `.github/workflows/ci.yml` — php-Job ergänzt

## Akzeptanzkriterien

- [x] `composer analyse` läuft grün
- [x] PHPStan-Level 6 dokumentiert
- [x] CI enthält PHP-Analyse-Job
- [x] Frontend lint/build bleiben grün
- [x] HANDOFF enthält Pflichtvalidierung nach PHP-Änderungen

## Validierung

```bash
composer analyse
cd frontend && npm ci && npm run lint && npm run build
git diff --check
git status --short
```

## Risiko-Hinweise

- Baseline parkt Altlasten — späteren Sprint für sauberen Fix einplanen.
- StreamSync-Autoloader wird zur Analyse benötigt (Bootstrap). Falls StreamSync nicht installiert ist, werden StreamSync-Klassen nicht aufgelöst.
- WordPress-Funktionen sind über phpstan-wordpress-Extension abgedeckt.
