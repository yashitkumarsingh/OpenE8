import { test, expect } from '@playwright/test';

test.describe('OpenE8 Governance OS E2E Workflows', () => {
  test('should display login page and successfully authenticate assessor', async ({ page }) => {
    // 1. Visit the app
    await page.goto('/');

    // Verify Title & header text
    await expect(page).toHaveTitle(/OpenE8/i);
    await expect(page.locator('h2')).toContainText('OpenE8 Governance OS');

    // 2. Perform Login using testids
    await page.fill('[data-testid="login-email"]', 'assessor@opene8.gov.au');
    await page.fill('[data-testid="login-password"]', 'Password123');
    await page.click('[data-testid="login-submit"]');

    // 3. Confirm transition into dashboard
    // Verify scope selector dropdown is present and has options
    const systemSelect = page.locator('[data-testid="system-selector"]');
    await expect(systemSelect).toBeVisible();

    // Verify User Role label shows up
    await expect(page.locator('span:has-text("ASSESSOR")').first()).toBeVisible();

    // 4. Tab Navigation checks
    const assessmentTab = page.locator('[data-testid="nav-tab-assessment"]');
    await expect(assessmentTab).toBeVisible();
    await assessmentTab.click();

    // Verify stage stepper details are loaded
    const stageStep1 = page.locator('[data-testid="stage-step-1"]');
    await expect(stageStep1).toBeVisible();
  });
});
