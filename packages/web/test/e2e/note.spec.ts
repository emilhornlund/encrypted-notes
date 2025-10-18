import { expect, test } from '@playwright/test';

test.describe('Notes Management', () => {
  let testEmail: string;

  test.beforeEach(async ({ page }) => {
    testEmail = `notes${Date.now()}@example.com`;

    // Register and login first
    await page.goto('/register');
    await page.getByLabel('Email Address').fill(testEmail);
    await page.locator('#password').fill('password123');
    await page.locator('#confirmPassword').fill('password123');
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('should create a new note', async ({ page }) => {
    // Click new note button
    await page.getByRole('button', { name: /new note/i }).click();

    // Should navigate to new note page
    await expect(page).toHaveURL('/notes/new');

    // Fill note form
    await page.getByPlaceholder('Note title...').fill('Test Note Title');
    await page.getByPlaceholder('Start writing your note...').fill('This is a test note content.');

    // Save note
    await page.getByRole('button', { name: /save/i }).click();

    // Should redirect to notes list
    await expect(page).toHaveURL('/');

    // Should show the note in the list
    await expect(page.getByText('Test Note Title')).toBeVisible();
  });

  test('should edit an existing note', async ({ page }) => {
    // First create a note
    await page.getByRole('button', { name: /new note/i }).click();
    await page.getByPlaceholder('Note title...').fill('Original Title');
    await page.getByPlaceholder('Start writing your note...').fill('Original content.');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page).toHaveURL('/');

    // Click on the created note
    await page.getByText('Original Title').click();

    // Should navigate to edit page
    await expect(page).toHaveURL(/\/notes\/[^/]+$/);

    // Edit content
    await page.getByPlaceholder('Note title...').fill('Updated Title');
    await page.getByPlaceholder('Start writing your note...').fill('Updated content.');

    // Save
    await page.getByRole('button', { name: /save/i }).click();

    // Should show updated note
    await expect(page.getByText('Updated Title')).toBeVisible();
  });


});
