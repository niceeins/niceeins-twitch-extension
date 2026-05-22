# AI Handoff — niceeins-twitch-extension

## Projekt

niceeins-twitch-extension

## Regeln

- Nur in diesem Repository arbeiten:
  /var/www/wordpress/wp-content/plugins/niceeins-twitch-extension
- Keine Änderungen an WordPress-Core, Themes oder anderen Plugins.
- Keine Änderungen am Hauptplugin niceeins-streamsync in diesem Sprint.
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

## Validierung

Typische Checks:

```bash
npm run lint
npm run build
git diff --check
```

Falls PHP geändert wird:

```bash
php -l niceeins-twitch-extension.php
```

## No Commit

Nicht committen. Ergebnis zusammenfassen und auf Freigabe warten.
