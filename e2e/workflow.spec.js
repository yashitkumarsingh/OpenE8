import { test, expect } from '@playwright/test';

test.describe('OpenE8 Governance OS Full Audit Lifecycles', () => {
  test('should execute complete assessment lifecycle with dual sign-offs and lockouts', async ({ page }) => {
    // Enable dialog interceptor to automatically accept all browser alert dialogs
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    // 1. Authenticate as Lead Security Assessor
    await page.goto('/');
    await page.fill('[data-testid="login-email"]', 'assessor@opene8.gov.au');
    await page.fill('[data-testid="login-password"]', 'Password123');
    await page.click('[data-testid="login-submit"]');

    // Confirm transition into assessor dashboard view
    await expect(page.locator('span:has-text("ASSESSOR")').first()).toBeVisible();

    // 2. Create a new System Profile
    const systemName = `FLS-Audit-${Date.now()}`;

    // 2. Create a new System Profile
    await page.click('[data-testid="add-system-button"]');
    await page.fill('[data-testid="add-system-name"]', systemName);
    await page.fill('[data-testid="add-system-businessOwner"]', 'Finance Branch');
    await page.fill('[data-testid="add-system-technicalOwner"]', 'ICT Cloud Platform');
    await page.fill('[data-testid="add-system-environment"]', 'Staging');
    await page.selectOption('[data-testid="add-system-targetMaturity"]', 'ML3');
    await page.click('[data-testid="add-system-submit"]');

    // Wait for the Selected Boundary header to reflect the newly selected system
    await expect(page.locator('header').locator('span:has-text("Selected Boundary:") + span')).toContainText(systemName);

    // 3. Edit Scoping details under Scope Builder
    await page.click('[data-testid="nav-tab-systems"]');
    await expect(page.locator('h2')).toContainText('Scope Builder');

    await page.fill('[data-testid="scope-input-outOfScopeItems"]', 'Pre-2015 archive vault segment');
    await page.fill('[data-testid="scope-input-scopeJustification"]', 'VAULT is isolated with strict egress rules.');
    await page.click('[data-testid="save-scope-button"]');

    // 4. Navigate to Assessment Desk and select Stage 4: Review Controls
    await page.click('[data-testid="nav-tab-assessment"]');
    await page.click('[data-testid="stage-step-4"]');

    // Wait for Stage 4 headers to be visible in assessment desk
    await expect(page.locator('h4:has-text("Stage 4: Compliance Review Desk")')).toBeVisible();

    // Switch view to Table and back to Graph by selecting a row
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Table', exact: true }).click();
    const tableRow = page.locator('td:has-text("E8-AC-ML2-01")').first();
    await expect(tableRow).toBeVisible();
    await tableRow.click(); // transitions back to Graph inspect view

    // Verify Graph fields are open and set a control to PASSED
    await expect(page.locator('label:has-text("Expected Evidence Type")')).toBeVisible();
    await page.click('button:has-text("PASSED")');
    await page.fill('textarea[placeholder*="Describe current findings"]', 'All verification checks completed by Assessor.');

    // 5. Navigate to Stage 5: Exceptions
    await page.click('[data-testid="stage-step-5"]');
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Log Exception Request', exact: true }).click();

    // Populate Exception Request details
    await page.fill('[data-testid="exception-input-riskStatement"]', 'Exposure on secondary backup system.');
    await page.fill('[data-testid="exception-input-compensatingControl"]', 'Air-gapped offline storage vaults.');
    await page.selectOption('[data-testid="exception-input-residualRisk"]', 'LOW');
    await page.fill('[data-testid="exception-input-approvedBy"]', 'Chief Risk Officer');
    await page.fill('[data-testid="exception-input-reviewDate"]', '2027-06-30');
    await page.fill('[data-testid="exception-input-expiryDate"]', '2027-12-31');
    await page.click('[data-testid="exception-submit"]');

    // Confirm exception request is shown in register list
    await expect(page.locator('span:has-text("Chief Risk Officer")')).toBeVisible();

    // 6. Navigate to Stage 6: Report and Sign off as Assessor
    await page.click('[data-testid="stage-step-6"]');
    await page.waitForTimeout(500);
    await page.fill('[data-testid="sign-input-assessor"]', 'Lead Security Assessor Signature');
    await page.click('[data-testid="sign-button-assessor"]');

    // Verify Assessor sign status changed to PENDING to SIGNED
    await expect(page.locator('span:has-text("✓ SIGNED")').first()).toBeVisible();

    // Logout Assessor session
    await page.click('[data-testid="logout-button"]');

    // 7. Authenticate as System Owner to perform dual signature sign-off
    await page.fill('[data-testid="login-email"]', 'owner@opene8.gov.au');
    await page.fill('[data-testid="login-password"]', 'Password123');
    await page.click('[data-testid="login-submit"]');

    // Wait for dropdown select options to load
    await page.waitForTimeout(500);

    // Switch to our new system profile
    const selector = page.locator('[data-testid="system-selector"]');
    await selector.selectOption({ label: systemName });

    // Navigate to Assessment Desk and select Stage 6: Report
    await page.click('[data-testid="nav-tab-assessment"]');
    await page.click('[data-testid="stage-step-6"]');
    await page.waitForTimeout(500);

    // Perform Owner Sign-off
    await page.fill('[data-testid="sign-input-owner"]', 'RMS System Owner Signature');
    await page.click('[data-testid="sign-button-owner"]');

    // Verify assessment status transitioned to COMPLETED & LOCKED
    await expect(page.locator('span:has-text("COMPLETED & LOCKED")')).toBeVisible();

    // Clean up Assessor Sign Out
    await page.click('[data-testid="logout-button"]');
  });
});
