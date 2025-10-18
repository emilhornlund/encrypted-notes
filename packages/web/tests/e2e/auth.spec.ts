import { expect, test } from '@playwright/test';

test.describe('Authentication', () => {
  test('should register a new user', async ({ page }) => {
    await page.goto('/');

    // Click register link or button
    await page.getByRole('link', { name: /register/i }).click();

    // Fill registration form
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');

    // Submit form
    await page.getByRole('button', { name: /register/i }).click();

    // Should redirect to notes page
    await expect(page).toHaveURL('/');

    // Should show user email in header
    await expect(page.getByText('test@example.com')).toBeVisible();
  });

  test('should login existing user', async ({ page }) => {
    await page.goto('/');

    // Click login link
    await page.getByRole('link', { name: /login/i }).click();

    // Fill login form
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');

    // Submit form
    await page.getByRole('button', { name: /login/i }).click();

    // Should redirect to notes page
    await expect(page).toHaveURL('/');

    // Should show user email in header
    await expect(page.getByText('test@example.com')).toBeVisible();
  });

  test('should logout user', async ({ page }) => {
    // Assume user is logged in
    await page.goto('/');
    await page.getByRole('link', { name: /login/i }).click();
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /login/i }).click();

    // Click logout
    await page.getByRole('button', { name: /logout/i }).click();

    // Should redirect to login
    await expect(page).toHaveURL('/login');

    // Should not show user email
    await expect(page.getByText('test@example.com')).toBeVisible({
      visible: false,
    });
  });
});
