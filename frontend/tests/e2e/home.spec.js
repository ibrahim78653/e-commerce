import { test, expect } from '@playwright/test';

test('homepage has title and expected content', async ({ page }) => {
  await page.goto('/');

  // Check the title
  await expect(page).toHaveTitle(/Burhani Collection/i);

  // Check for the main hero or header text
  const heading = page.locator('h1').first();
  await expect(heading).toBeVisible();
});
