# Sprint 012 — Backend- und Panel-Smoke-Tests

Status: done
Abgeschlossen: 2026-05-29

## Ziel

PHPUnit-Backend-Smoke-Tests und Playwright-Panel-Smoke-Tests etablieren, um den Qualitätsstand der Twitch Extension näher an StreamSync heranzubringen. Kein Full-Coverage — schnelle, nicht-destruktive Smoke Tests.

## Scope

- PHPUnit 12 installiert (`require-dev`)
- `phpunit.xml.dist` angelegt
- `tests/bootstrap.php` — minimale WP-Stubs, kein DB-Kontext
- `tests/Unit/HelperFunctionsTest.php` — 22 Tests, 25 Assertions für pure Hilfsfunktionen
- `composer.json` Script `"test": "phpunit"` ergänzt
- `@playwright/test` 1.60 installiert (`frontend/devDependencies`)
- `frontend/playwright.config.ts` — testDir: `tests/e2e`, nur chromium, webServer via Vite Preview
- `frontend/tests/e2e/panel-smoke.spec.ts` — 3 Panel-Smoke-Tests
- `frontend/package.json` Scripts `"test:e2e"` und `"test:e2e:headed"` ergänzt
- `.github/workflows/ci.yml` erweitert: PHP-Job um `composer test`, Frontend-Job um Playwright-Install und `npm run test:e2e`
- `.gitignore` um `.phpunit.result.cache` ergänzt

## Out of scope

- Produktivcode-Refactoring
- Echte Twitch Auth / JWT-Secrets
- Externe API-Calls
- Deployment
- Hook-Warning-Fix
- StreamSync-Änderungen

## Getestete Funktionen (PHPUnit)

Reine Hilfsfunktionen in `niceeins-twitch-extension.php`, isolierbar ohne WP-DB:

- `niceeins_extension_base64url_encode` / `_decode` — Roundtrip + Fehlerfall
- `niceeins_extension_datetime_to_utc_iso` — DateTimeInterface, String, null, leer, ungültig
- `niceeins_extension_label_for_network` — alle bekannten Networks + Fallback
- `niceeins_extension_has_link` — Match, Trailing-Slash-Toleranz, leere Liste, kein Match

## Panel-Smoke-Tests (Playwright)

Ohne echten Twitch-iframe-Kontext:

1. `Panel-App rendert ohne Absturz` — #root im DOM, kein unkontrollierter JS-Fehler-Text
2. `Panel zeigt Ladezustand oder Fallback ohne Twitch-Kontext` — #root nicht leer nach 1.5s
3. `Page-Title enthält NiceEins` — `<title>` check

## Akzeptanzkriterien

- [x] `composer analyse` — OK, keine Errors
- [x] `composer test` — 22 Tests, 25 Assertions, OK
- [x] `npm run lint` — 0 Errors (1 bekannte Warning, nicht blockierend)
- [x] `npm run build` — OK
- [x] `npm run test:e2e` — 3 Tests passed (4.2s)
- [x] CI enthält PHPStan + PHPUnit + Frontend lint/build + Playwright
- [x] HANDOFF enthält neue Pflichtchecks

## Validierungsergebnisse (lokal, 2026-05-29)

```
composer analyse
→ [OK] No errors

composer test
→ OK (22 tests, 25 assertions) [0.003s]

npm run lint
→ 1 warning (bekannte react-hooks/exhaustive-deps in App.jsx:863), 0 errors

npm run build
→ ✓ built in 138ms

npm run test:e2e
→ 3 passed (4.2s), chromium
```

## Risiko-Hinweise

- Keine echten Twitch-JWT-Secrets — Bootstrap nutzt `getenv()` Stub-Fallback (leerer String)
- Panel kann ohne Twitch-iframe/Auth nur begrenzt getestet werden — Tests prüfen Fallback-Verhalten
- `frontend/dist/` bleibt bewusst versioniert — nicht ignorieren
- PHP-Konstanten (`NICEEINS_TWITCH_EXTENSION_*`) werden vom Plugin selbst gesetzt — Bootstrap definiert nur ABSPATH vorab

## Geänderte Dateien

```
niceeins-twitch-extension: (neu)
  composer.json               — PHPUnit require-dev + test-Script
  composer.lock               — aktualisiert
  phpunit.xml.dist            — PHPUnit-Konfiguration
  tests/bootstrap.php         — WP-Stubs für Tests
  tests/Unit/HelperFunctionsTest.php — 22 PHPUnit-Tests
  frontend/package.json       — Playwright devDep + test:e2e Scripts
  frontend/package-lock.json  — aktualisiert
  frontend/playwright.config.ts — Playwright-Konfiguration
  frontend/tests/e2e/panel-smoke.spec.ts — 3 Playwright-Tests
  .github/workflows/ci.yml    — PHPUnit + Playwright in CI
  .gitignore                  — .phpunit.result.cache ergänzt
```

Kein Commit, kein Push — wartet auf Freigabe.
