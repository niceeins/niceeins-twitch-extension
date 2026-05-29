import { test, expect } from '@playwright/test'

/**
 * Panel Smoke Tests — nicht-destruktiv, ohne echte Twitch Auth / JWT.
 * Prüft nur, dass die App lädt und sauber auf fehlenden Twitch-Kontext reagiert.
 */

test('Panel-App rendert ohne Absturz', async ({ page }) => {
  await page.goto('/')

  // Root-Element muss im DOM existieren
  await expect(page.locator('#root')).toBeAttached()

  // Kein unkontrollierter Fehler-Stack im Body
  const bodyText = await page.locator('body').innerText()
  expect(bodyText).not.toContain('Uncaught Error')
  expect(bodyText).not.toContain('TypeError')
})

test('Panel zeigt Ladezustand oder Fallback ohne Twitch-Kontext', async ({ page }) => {
  // Twitch Extension Helper ist nicht verfügbar (kein iframe) —
  // die App soll trotzdem nicht crashen, sondern einen Lade- oder Fallback-Zustand zeigen.
  await page.goto('/')

  // Mindestens ein Element innerhalb von #root muss sichtbar sein
  const root = page.locator('#root')
  await expect(root).toBeAttached()

  // Keine JavaScript-Fehler die den Render komplett blockieren
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))

  // Kurze Wartezeit, um mögliche asynchrone Fehler abzufangen
  await page.waitForTimeout(1_500)

  // Wir erlauben Twitch-Extension-bezogene Fehler (kein iframe-Kontext),
  // aber kein kompletter Render-Absturz (leeres #root)
  const rootContent = await root.innerHTML()
  expect(rootContent.trim()).not.toBe('')
})

test('Page-Title enthält NiceEins', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/NiceEins/i)
})
