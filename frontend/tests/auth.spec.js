import { test, expect } from '@playwright/test';

/**
 * Authentication Pages Visual Tests
 * Tests the styling of login and registration pages
 */

test.describe('Login Page Styling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display auth container with gradient background', async ({ page }) => {
    const authContainer = page.locator('.auth-container');
    await expect(authContainer).toBeVisible();

    // Check gradient background
    const bgColor = await authContainer.evaluate((el) => {
      return window.getComputedStyle(el).background;
    });
    expect(bgColor).toContain('gradient');

    // Check minimum height
    const minHeight = await authContainer.evaluate((el) => {
      return window.getComputedStyle(el).minHeight;
    });
    expect(minHeight).toBeTruthy();
  });

  test('should display centered auth card with shadow', async ({ page }) => {
    const authCard = page.locator('.auth-card');
    await expect(authCard).toBeVisible();

    // Check box shadow
    const boxShadow = await authCard.evaluate((el) => {
      return window.getComputedStyle(el).boxShadow;
    });
    expect(boxShadow).not.toBe('none');

    // Check border radius
    const borderRadius = await authCard.evaluate((el) => {
      return window.getComputedStyle(el).borderRadius;
    });
    expect(borderRadius).toContain('10px');

    // Check white background
    const bgColor = await authCard.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(bgColor).toContain('rgb(255, 255, 255)');
  });

  test('should display form with proper input styling', async ({ page }) => {
    // Check email input
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    const inputBorder = await emailInput.evaluate((el) => {
      return window.getComputedStyle(el).border;
    });
    expect(inputBorder).toBeTruthy();

    // Check password input
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();

    // Check input padding
    const padding = await emailInput.evaluate((el) => {
      return window.getComputedStyle(el).padding;
    });
    expect(padding).toBeTruthy();
  });

  test('should display primary button with gradient', async ({ page }) => {
    const submitButton = page.locator('button.btn-primary');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toContainText('Login');

    // Check gradient background
    const bgColor = await submitButton.evaluate((el) => {
      return window.getComputedStyle(el).background;
    });
    expect(bgColor).toContain('gradient');

    // Check button is full width
    const width = await submitButton.evaluate((el) => {
      return window.getComputedStyle(el).width;
    });
    expect(parseFloat(width)).toBeGreaterThan(200);
  });

  test('should display link to registration', async ({ page }) => {
    const authLink = page.locator('.auth-link');
    await expect(authLink).toBeVisible();
    await expect(authLink).toContainText('Register here');

    const link = authLink.locator('a');
    await expect(link).toHaveAttribute('href', '/register');
  });

  test('should have proper form group spacing', async ({ page }) => {
    const formGroups = page.locator('.form-group');
    await expect(formGroups).toHaveCount(2); // email and password

    // Check margin bottom on form groups
    const marginBottom = await formGroups.first().evaluate((el) => {
      return window.getComputedStyle(el).marginBottom;
    });
    expect(parseFloat(marginBottom)).toBeGreaterThan(10);
  });
});

test.describe('Register Page Styling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display registration form with all fields', async ({ page }) => {
    const authCard = page.locator('.auth-card');
    await expect(authCard).toBeVisible();

    // Check all input fields exist
    await expect(page.locator('input[name="first_name"]')).toBeVisible();
    await expect(page.locator('input[name="last_name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.locator('textarea[name="address"]')).toBeVisible();
  });

  test('should display form row for name fields', async ({ page }) => {
    const formRow = page.locator('.form-row');
    await expect(formRow).toBeVisible();

    // Check grid layout
    const display = await formRow.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    expect(display).toBe('grid');

    // Check has 2 columns (computed values will be in pixels)
    const gridTemplateColumns = await formRow.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns;
    });
    // Should have 2 column values separated by space
    const columns = gridTemplateColumns.split(' ');
    expect(columns).toHaveLength(2);
    // Both columns should have similar widths (within 10px)
    const col1 = parseFloat(columns[0]);
    const col2 = parseFloat(columns[1]);
    expect(Math.abs(col1 - col2)).toBeLessThan(10);
  });

  test('should display textarea with proper styling', async ({ page }) => {
    const textarea = page.locator('textarea[name="address"]');
    await expect(textarea).toBeVisible();

    // Check rows attribute
    await expect(textarea).toHaveAttribute('rows', '3');

    // Check border
    const border = await textarea.evaluate((el) => {
      return window.getComputedStyle(el).border;
    });
    expect(border).toBeTruthy();
  });

  test('should display link to login page', async ({ page }) => {
    const authLink = page.locator('.auth-link');
    await expect(authLink).toBeVisible();
    await expect(authLink).toContainText('Login here');

    const link = authLink.locator('a');
    await expect(link).toHaveAttribute('href', '/login');
  });
});
