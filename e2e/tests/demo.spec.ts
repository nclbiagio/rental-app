import { test, expect } from "@playwright/test";

test("Il mio primo test funziona", async ({ page }) => {
  // Un test semplicissimo che non carica nemmeno Angular,
  // serve solo a vedere se Playwright lo trova!
  expect(1 + 1).toBe(2);
});
