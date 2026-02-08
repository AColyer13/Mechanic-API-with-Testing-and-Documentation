import { test, expect } from '@playwright/test';

/**
 * Navigation Bar Visual Tests
 * Tests the styling and responsiveness of the navbar
 */

test.describe('Navbar Styling - Unauthenticated', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display navbar with correct background', async ({ page }) => {
    const navbar = page.locator('.navbar');
    await expect(navbar).toBeVisible();

    // Check background color (dark blue #2c3e50)
    const bgColor = await navbar.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(bgColor).toBeTruthy();

    // Check box shadow
    const boxShadow = await navbar.evaluate((el) => {
      return window.getComputedStyle(el).boxShadow;
    });
    expect(boxShadow).not.toBe('none');
  });

  test('should display brand logo with proper styling', async ({ page }) => {
    const brand = page.locator('.navbar-brand');
    await expect(brand).toBeVisible();
    await expect(brand).toContainText('Mechanic Shop');

    // Check color is white
    const color = await brand.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    expect(color).toContain('rgb(255, 255, 255)');

    // Check font size
    const fontSize = await brand.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });
    expect(parseFloat(fontSize)).toBeGreaterThanOrEqual(24); // 1.5rem = 24px
  });

  test('should display unauthenticated menu items', async ({ page }) => {
    const navbarMenu = page.locator('.navbar-menu');
    await expect(navbarMenu).toBeVisible();

    // Check display flex
    const display = await navbarMenu.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    expect(display).toBe('flex');

    // Check Login and Register links
    const loginLink = page.locator('.navbar-link').filter({ hasText: 'Login' });
    const registerLink = page.locator('.navbar-link').filter({ hasText: 'Register' });
    
    await expect(loginLink).toBeVisible();
    await expect(registerLink).toBeVisible();
  });

  test('should have proper navbar container constraints', async ({ page }) => {
    const navbarContainer = page.locator('.navbar-container');
    await expect(navbarContainer).toBeVisible();

    // Check max-width
    const maxWidth = await navbarContainer.evaluate((el) => {
      return window.getComputedStyle(el).maxWidth;
    });
    expect(maxWidth).toContain('1200px');

    // Check flex layout
    const display = await navbarContainer.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    expect(display).toBe('flex');

    // Check justify-content space-between
    const justifyContent = await navbarContainer.evaluate((el) => {
      return window.getComputedStyle(el).justifyContent;
    });
    expect(justifyContent).toBe('space-between');
  });

  test('should style navbar links with hover effect', async ({ page }) => {
    const navbarLinks = page.locator('.navbar-link');
    const firstLink = navbarLinks.first();

    // Check text decoration
    const textDecoration = await firstLink.evaluate((el) => {
      return window.getComputedStyle(el).textDecoration;
    });
    expect(textDecoration).toContain('none');

    // Check transition property exists
    const transition = await firstLink.evaluate((el) => {
      return window.getComputedStyle(el).transition;
    });
    expect(transition).toBeTruthy();
  });
});

test.describe('Navbar Styling - Authenticated', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('customer', JSON.stringify({
        id: 'test-id',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com'
      }));
    });
    await page.reload();
  });

  test('should display authenticated menu items', async ({ page }) => {
    // Check Dashboard, My Tickets, New Ticket links
    await expect(page.locator('.navbar-link').filter({ hasText: 'Dashboard' })).toBeVisible();
    await expect(page.locator('.navbar-link').filter({ hasText: 'My Tickets' })).toBeVisible();
    await expect(page.locator('.navbar-link').filter({ hasText: 'New Ticket' })).toBeVisible();
  });

  test('should display welcome message with customer name', async ({ page }) => {
    const userSpan = page.locator('.navbar-user');
    await expect(userSpan).toBeVisible();
    await expect(userSpan).toContainText('Welcome, John');

    // Check styling
    const color = await userSpan.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    expect(color).toBeTruthy();

    const fontStyle = await userSpan.evaluate((el) => {
      return window.getComputedStyle(el).fontStyle;
    });
    expect(fontStyle).toBe('italic');
  });

  test('should display logout button with proper styling', async ({ page }) => {
    const logoutButton = page.locator('.navbar-button');
    await expect(logoutButton).toBeVisible();
    await expect(logoutButton).toContainText('Logout');

    // Check background color (red)
    const bgColor = await logoutButton.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(bgColor).toBeTruthy();

    // Check border radius
    const borderRadius = await logoutButton.evaluate((el) => {
      return window.getComputedStyle(el).borderRadius;
    });
    expect(borderRadius).toContain('4px');

    // Check cursor
    const cursor = await logoutButton.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });
    expect(cursor).toBe('pointer');
  });
});
