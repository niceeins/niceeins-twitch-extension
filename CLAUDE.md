# Agent Instructions

## Scope
You are working only in this repository.

## Mandatory checks before changes
Run and show:
- whoami
- pwd
- git status
- git branch --show-current
- git remote -v

## Hard rules
- Linux user must be `claude`.
- Work only inside the current repository.
- Do not modify WordPress core.
- Do not modify themes.
- Do not modify other plugins.
- Do not commit unless explicitly requested by Stephan.
- Do not push unless explicitly requested by Stephan.
- If a change outside this repository seems necessary, stop and explain why.

## Workflow
- Read `.ai/HANDOFF.md` before planning.
- Work on feature branches, not directly on `main`.
- Prefer small, reviewable changes.
- After changes, summarize:
  - changed files
  - what changed
  - tests run
  - risks
  - next steps

## Validation
When possible, run relevant checks:
- PHP syntax checks for changed PHP files
- Composer/PHPStan/PHPCS checks if configured
- npm lint/build if frontend files changed
- `git diff --check`
