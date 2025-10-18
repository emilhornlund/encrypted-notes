import { expect, test } from '@playwright/test';

test.describe('Authentication', () => {
  test('should load app', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Debug: check page content
    const content = await page.textContent('body');
    console.log('Page content:', content?.substring(0, 500));

    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should login existing user', async ({ page }) => {
    const uniqueEmail = `login${Date.now()}@example.com`;

    // First register a user
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await page.locator('#email').fill(uniqueEmail);
    await page.locator('#password').fill('password123');
    await page.locator('#confirmPassword').fill('password123');
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page).toHaveURL('/');

    // Now logout
    await page.getByRole('button', { name: /logout/i }).click();
    await expect(page).toHaveURL('/login');

    // Now login
    await page.locator('#email').fill(uniqueEmail);
    await page.locator('input[name="password"]').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to notes page
    await expect(page).toHaveURL('/');

    // Should show user email in header
    await expect(page.getByText(uniqueEmail)).toBeVisible();
  });

  test('should logout user', async ({ page }) => {
    const uniqueEmail = `logout${Date.now()}@example.com`;

    // Register and login first
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await page.locator('#email').fill(uniqueEmail);
    await page.locator('#password').fill('password123');
    await page.locator('#confirmPassword').fill('password123');
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page).toHaveURL('/');

    // Click logout
    await page.getByRole('button', { name: /logout/i }).click();

    // Should redirect to login
    await expect(page).toHaveURL('/login');

    // Should not show user email
    await expect(page.getByText(uniqueEmail)).toBeVisible({
      visible: false,
    });
  });
});
