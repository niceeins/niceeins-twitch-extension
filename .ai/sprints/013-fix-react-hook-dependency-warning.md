# Sprint 013 — Fix: react-hooks/exhaustive-deps Warning in App.jsx

Status: done
Datum: 2026-05-29
Repo: niceeins-twitch-extension

## Ziel

Die bekannte ESLint-Warnung `react-hooks/exhaustive-deps` in `frontend/src/App.jsx:863` sauber beheben, ohne Verhalten zu ändern.

## Problem

Der `useEffect`-Hook bei Zeile 841 ff. nutzte `data?.meta?.badges_enabled` im Body als Guard-Condition, hatte diese Variable aber nicht im Dependency-Array. Das Dependency-Array enthielt nur `data?.streamer?.twitch_login`.

Wenn `badges_enabled` sich geändert hätte (z. B. Feature-Flag-Änderung via API), hätte der Effect nicht neu ausgeführt — die Guard würde veralteten State auswerten.

## Lösung

`data?.meta?.badges_enabled` ins Dependency-Array ergänzt:

```jsx
// vorher
}, [data?.streamer?.twitch_login])

// nachher
}, [data?.meta?.badges_enabled, data?.streamer?.twitch_login])
```

**Kein useCallback/useMemo nötig** — `badges_enabled` ist ein primitiver boolescher Wert aus dem API-Response-Objekt. Kein Endlos-Render-Risiko, da kein State verändert wird, der `badges_enabled` beeinflusst.

## Scope

- Geändert: `frontend/src/App.jsx` (1 Zeile)
- Keine anderen Dateien außerhalb von `.ai/` und `frontend/dist/` (Build-Artefakt)
- Kein Refactoring, keine Feature-Änderungen

## Acceptance Criteria

- [x] `npm run lint` → 0 Errors, 0 Warnings
- [x] `npm run build` → grün
- [x] `npm run test:e2e` → 3/3 passed
- [x] `composer analyse` → No errors
- [x] `composer test` → 22/22 passed

## Validierung

```bash
cd /var/www/wordpress/wp-content/plugins/niceeins-twitch-extension/frontend
npm run lint
npm run build
npm run test:e2e

cd ..
composer analyse
composer test
```

## Ergebnis

Twitch Extension hat keine bekannte Lint-Warnung mehr. Tooling vollständig grün.
