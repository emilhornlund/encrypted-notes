import { expect, test } from '@playwright/test';

test.describe('Notes Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.getByRole('link', { name: /login/i }).click();
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('should create a new note', async ({ page }) => {
    // Click new note button
    await page.getByRole('button', { name: /new note/i }).click();

    // Should navigate to new note page
    await expect(page).toHaveURL('/notes/new');

    // Fill note form
    await page.getByLabel('Title').fill('Test Note Title');
    await page.getByLabel('Body').fill('This is a test note content.');

    // Save note
    await page.getByRole('button', { name: /save/i }).click();

    // Should redirect to notes list
    await expect(page).toHaveURL('/');

    // Should show the note in the list
    await expect(page.getByText('Test Note Title')).toBeVisible();
  });

  test('should edit an existing note', async ({ page }) => {
    // Click on existing note
    await page.getByText('Test Note Title').click();

    // Should navigate to edit page
    await expect(page).toHaveURL(/\/notes\/.+/);

    // Edit content
    await page.getByLabel('Title').fill('Updated Test Note Title');
    await page.getByLabel('Body').fill('Updated test note content.');

    // Save
    await page.getByRole('button', { name: /save/i }).click();

    // Should show updated note
    await expect(page.getByText('Updated Test Note Title')).toBeVisible();
  });

  test('should search notes', async ({ page }) => {
    // Go to search page
    await page.getByRole('link', { name: /search/i }).click();

    // Enter search query
    await page.getByLabel('Search').fill('test');

    // Should show search results
    await expect(page.getByText('Test Note Title')).toBeVisible();
  });

  test('should delete a note', async ({ page }) => {
    // Click on note
    await page.getByText('Test Note Title').click();

    // Click delete button
    await page.getByRole('button', { name: /delete/i }).click();

    // Confirm deletion
    await page.getByRole('button', { name: /confirm/i }).click();

    // Should redirect to notes list
    await expect(page).toHaveURL('/');

    // Note should not be visible
    await expect(page.getByText('Test Note Title')).toBeVisible({
      visible: false,
    });
  });
});
