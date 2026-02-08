import { test, expect } from '@playwright/test';

/**
 * Dashboard Page Visual Tests
 * Tests the styling and layout of the customer dashboard
 */

test.describe('Dashboard Styling', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('customer', JSON.stringify({
        id: 'test-customer-id',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com'
      }));
    });
    
    // Mock API response
    await page.route('**/service-tickets/customer/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'ticket-1',
            description: 'Oil change needed',
            status: 'Open',
            created_at: new Date().toISOString(),
            assigned_mechanics: [],
            parts_used: []
          },
          {
            id: 'ticket-2',
            description: 'Brake inspection',
            status: 'In Progress',
            created_at: new Date().toISOString(),
            assigned_mechanics: ['mech-1'],
            parts_used: []
          }
        ])
      });
    });

    await page.goto('/dashboard');
  });

  test('should display dashboard container with max-width', async ({ page }) => {
    const dashboard = page.locator('.dashboard-container');
    await expect(dashboard).toBeVisible();

    // Check max-width constraint
    const maxWidth = await dashboard.evaluate((el) => {
      return window.getComputedStyle(el).maxWidth;
    });
    expect(maxWidth).toContain('1200px');

    // Check padding
    const padding = await dashboard.evaluate((el) => {
      return window.getComputedStyle(el).padding;
    });
    expect(padding).toBeTruthy();
  });

  test('should display welcome heading with customer name', async ({ page }) => {
    const heading = page.locator('.dashboard-container h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Welcome back, John!');

    // Check color
    const color = await heading.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    expect(color).toBeTruthy();
  });

  test('should display stats grid with 4 cards', async ({ page }) => {
    const statsGrid = page.locator('.stats-grid');
    await expect(statsGrid).toBeVisible();

    // Check grid display
    const display = await statsGrid.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    expect(display).toBe('grid');

    // Check all 4 stat cards
    const statCards = page.locator('.stat-card');
    await expect(statCards).toHaveCount(4);
  });

  test('should style stat cards with shadow and hover effect', async ({ page }) => {
    const statCard = page.locator('.stat-card').first();
    await expect(statCard).toBeVisible();

    // Check background color is white
    const bgColor = await statCard.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(bgColor).toContain('rgb(255, 255, 255)');

    // Check box shadow
    const boxShadow = await statCard.evaluate((el) => {
      return window.getComputedStyle(el).boxShadow;
    });
    expect(boxShadow).not.toBe('none');

    // Check border radius
    const borderRadius = await statCard.evaluate((el) => {
      return window.getComputedStyle(el).borderRadius;
    });
    expect(borderRadius).toContain('10px');

    // Check transition
    const transition = await statCard.evaluate((el) => {
      return window.getComputedStyle(el).transition;
    });
    expect(transition).toContain('transform');
  });

  test('should display stat values with large font', async ({ page }) => {
    const statValue = page.locator('.stat-value').first();
    await expect(statValue).toBeVisible();

    // Check font size (2.5rem = 40px)
    const fontSize = await statValue.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });
    expect(parseFloat(fontSize)).toBeGreaterThan(30);

    // Check font weight
    const fontWeight = await statValue.evaluate((el) => {
      return window.getComputedStyle(el).fontWeight;
    });
    expect(fontWeight).toBe('700'); // bold
  });

  test('should display recent tickets section', async ({ page }) => {
    const recentTickets = page.locator('.recent-tickets');
    await expect(recentTickets).toBeVisible();

    // Check white background
    const bgColor = await recentTickets.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(bgColor).toContain('rgb(255, 255, 255)');

    // Check heading
    const heading = recentTickets.locator('h2');
    await expect(heading).toContainText('Recent Tickets');
  });

  test('should display ticket cards with proper styling', async ({ page }) => {
    await page.waitForSelector('.ticket-card', { timeout: 5000 });
    
    const ticketCards = page.locator('.ticket-card');
    const count = await ticketCards.count();
    expect(count).toBeGreaterThan(0);

    const ticketCard = ticketCards.first();
    
    // Check border
    const border = await ticketCard.evaluate((el) => {
      return window.getComputedStyle(el).border;
    });
    expect(border).toBeTruthy();

    // Check hover transition
    const transition = await ticketCard.evaluate((el) => {
      return window.getComputedStyle(el).transition;
    });
    expect(transition).toContain('box-shadow');
  });

  test('should display ticket status badges with colors', async ({ page }) => {
    await page.waitForSelector('.ticket-status', { timeout: 5000 });
    
    const statusBadge = page.locator('.ticket-status').first();
    await expect(statusBadge).toBeVisible();

    // Check border radius for pill shape
    const borderRadius = await statusBadge.evaluate((el) => {
      return window.getComputedStyle(el).borderRadius;
    });
    expect(borderRadius).toContain('20px');

    // Check color is white
    const color = await statusBadge.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    expect(color).toContain('rgb(255, 255, 255)');
  });
});
