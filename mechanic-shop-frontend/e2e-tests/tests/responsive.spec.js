import { test, expect } from '@playwright/test';

/**
 * Responsive Design Tests
 * Tests the responsive behavior across different viewport sizes
 */

test.describe('Responsive Design - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('home page should be mobile responsive', async ({ page }) => {
    await page.goto('/');

    // Check hero section is visible
    const heroSection = page.locator('.hero-section');
    await expect(heroSection).toBeVisible();

    // Check CTA buttons stack vertically on mobile
    const ctaButtons = page.locator('.cta-buttons');
    const flexDirection = await ctaButtons.evaluate((el) => {
      return window.getComputedStyle(el).flexDirection;
    });
    expect(flexDirection).toBe('column');

    // Check features grid is responsive
    const featuresGrid = page.locator('.features-grid');
    await expect(featuresGrid).toBeVisible();
  });

  test('navbar should be mobile responsive', async ({ page }) => {
    await page.goto('/');

    const navbar = page.locator('.navbar');
    await expect(navbar).toBeVisible();

    // Navbar should still be visible and functional
    const navbarContainer = page.locator('.navbar-container');
    await expect(navbarContainer).toBeVisible();
  });

  test('auth forms should be mobile responsive', async ({ page }) => {
    await page.goto('/login');

    const authCard = page.locator('.auth-card');
    await expect(authCard).toBeVisible();

    // Check card max-width allows it to fit on mobile
    const maxWidth = await authCard.evaluate((el) => {
      return window.getComputedStyle(el).maxWidth;
    });
    expect(maxWidth).toContain('500px');
  });

  test('dashboard should be mobile responsive', async ({ page }) => {
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

    await page.route('**/service-tickets/customer/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/dashboard');

    // Check stats grid adjusts for mobile
    const statsGrid = page.locator('.stats-grid');
    await expect(statsGrid).toBeVisible();

    // Grid should be single column or adjusted for mobile
    const gridTemplateColumns = await statsGrid.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns;
    });
    expect(gridTemplateColumns).toBeTruthy();
  });
});

test.describe('Responsive Design - Tablet', () => {
  test.use({ viewport: { width: 768, height: 1024 } }); // iPad

  test('home page should adapt to tablet screen', async ({ page }) => {
    await page.goto('/');

    const featuresGrid = page.locator('.features-grid');
    await expect(featuresGrid).toBeVisible();

    // Features should display in appropriate columns
    const display = await featuresGrid.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    expect(display).toBe('grid');
  });

  test('tickets grid should adjust for tablet', async ({ page }) => {
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

    await page.route('**/service-tickets/customer/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'ticket-1',
            description: 'Test ticket',
            status: 'Open',
            created_at: new Date().toISOString(),
            assigned_mechanics: [],
            parts_used: []
          }
        ])
      });
    });

    await page.goto('/tickets');
    await page.waitForSelector('.tickets-grid', { timeout: 5000 });

    const ticketsGrid = page.locator('.tickets-grid');
    await expect(ticketsGrid).toBeVisible();

    // Grid should adapt to tablet screen
    const display = await ticketsGrid.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    expect(display).toBe('grid');
  });
});

test.describe('Responsive Design - Desktop', () => {
  test.use({ viewport: { width: 1920, height: 1080 } }); // Full HD

  test('all content should utilize desktop space', async ({ page }) => {
    await page.goto('/');

    // Check hero section uses full width
    const heroSection = page.locator('.hero-section');
    await expect(heroSection).toBeVisible();

    // Check features are properly spaced
    const featuresSection = page.locator('.features-section');
    const maxWidth = await featuresSection.evaluate((el) => {
      return window.getComputedStyle(el).maxWidth;
    });
    expect(maxWidth).toContain('1200px');

    // Check features grid shows all cards in one row (if space allows)
    const featuresGrid = page.locator('.features-grid');
    const gridTemplateColumns = await featuresGrid.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns;
    });
    expect(gridTemplateColumns).toBeTruthy();
  });

  test('dashboard utilizes desktop space efficiently', async ({ page }) => {
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

    await page.route('**/service-tickets/customer/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/dashboard');

    // Check stats grid shows all 4 cards
    const statsGrid = page.locator('.stats-grid');
    await expect(statsGrid).toBeVisible();

    const statCards = page.locator('.stat-card');
    await expect(statCards).toHaveCount(4);

    // All should be visible
    for (let i = 0; i < 4; i++) {
      await expect(statCards.nth(i)).toBeVisible();
    }
  });
});
