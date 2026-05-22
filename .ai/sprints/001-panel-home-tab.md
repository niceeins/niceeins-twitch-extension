# Sprint 001 — Twitch Panel Home Tab

Status: open
Repository: niceeins-twitch-extension
Recommended AI: Codex
Risk: low-medium
Expected session size: one focused coding session

## Goal

Add a new Home/Start tab to the Twitch Panel Extension. It should become the default first view and show the most relevant viewer information immediately.

## Product intent

The panel should no longer open as a passive schedule/link list only. It should feel like a compact viewer hub:

- current status
- next stream
- current/recent game
- active announcement
- quick commands
- navigation to other tabs

## Scope

Implement a new Home or Start tab in the React panel frontend.

The Home tab should show, when available:

1. Live status
2. Current or most recent game
3. Next scheduled stream
4. Most relevant active announcement
5. 2–3 quick commands
6. Compact CTAs or links to Plan, Games, Cmds and Links tabs

## Default behavior

- Home/Start must be the default selected tab.
- Existing tabs must stay available:
  - Plan
  - Links
  - Games
  - Cmds
- Swipe/tab navigation must continue to work.

## Backend rules

First inspect existing panel payload.

Use existing fields if possible.

Backend changes are allowed only if strictly needed and must be additive:

- no renamed fields
- no removed fields
- no changed response shape for existing consumers
- no DB changes
- no changes to niceeins-streamsync

If backend fields are missing, add small optional fields to the panel response, with safe fallbacks.

## UX requirements

- Must work in the constrained Twitch iframe panel size.
- Must support light/dark mode as currently implemented.
- Must degrade gracefully when data is missing.
- Empty states must be short and useful.
- Avoid large visual redesign of all tabs.
- Do not introduce complex dependencies.

## Suggested UI structure

Home tab cards:

1. Next stream card
   - title
   - date/time
   - category/game if available

2. Current or recent game card
   - show the current/recent game when available
   - if the current game is Just Chatting, show the previously played non-Just-Chatting game

3. Announcement card
   - only if active announcement exists
   - show the highest priority/current one only

4. Quick commands card
   - show up to 3 visible commands
   - copy-to-clipboard behavior should match Cmds tab if already implemented

5. Explore row
   - small buttons/chips to Plan, Games, Cmds, Links

## Product decisions

- Do not use a separate Home status card.
- Show the Live/Offline state compactly in the top profile row, right-aligned next to the streamer name.
- Do not show explanatory offline copy; the Offline badge is enough.
- Show current/recent game context in the Home game card instead of duplicating it in a status card.
- Do not add a secondary Explore row at the bottom of Home; the primary tab navigation already covers Plan, Games, Cmds and Links.
- Show announcements on Home/Start using the existing announcement presentation. Do not duplicate announcements in the Plan tab.

## Out of scope

- No new database table.
- No write actions.
- No game suggestions.
- No clip highlight feature.
- No large CSS redesign of all tabs.
- No TypeScript migration.
- No changes to StreamSync repository.

## Acceptance criteria

- A new Home/Start tab exists.
- Home/Start is the first/default tab.
- Existing tabs still work.
- Panel renders without errors if any of these arrays are empty:
  - schedule
  - announcements
  - games
  - commands
  - socials
- Copy-to-clipboard for quick commands works if command copy support already exists.
- No backend breaking changes.
- Twitch iframe layout remains compact and readable.

## Validation commands

Run from:

```bash
cd /var/www/wordpress/wp-content/plugins/niceeins-twitch-extension
```

Required:

```bash
whoami
pwd
git status
git branch --show-current
git remote -v
npm run lint
npm run build
git diff --check
```

If PHP changed:

```bash
php -l niceeins-twitch-extension.php
```

## Result summary required

At the end, report:

- changed files
- whether backend was changed
- which payload fields the Home tab uses
- validation commands and results
- risks or follow-up items

## Commit policy

Do not commit. Wait for Stephan's approval.
