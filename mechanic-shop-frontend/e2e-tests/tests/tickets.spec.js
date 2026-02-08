import { test, expect } from '@playwright/test';

/**
 * Tickets Page Visual Tests
 * Tests the styling and layout of the tickets list page
 */

test.describe('Tickets Page Styling', () => {
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
    
    // Mock API response with multiple tickets
    await page.route('**/service-tickets/customer/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'ticket-1',
            description: 'Oil change and filter replacement needed',
            status: 'Open',
            created_at: new Date().toISOString(),
            assigned_mechanics: [],
            parts_used: []
          },
          {
            id: 'ticket-2',
            description: 'Brake inspection and pad replacement',
            status: 'In Progress',
            created_at: new Date().toISOString(),
            assigned_mechanics: ['mech-1'],
            parts_used: ['part-1']
          },
          {
            id: 'ticket-3',
            description: 'Engine diagnostics',
            status: 'Completed',
            created_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            assigned_mechanics: ['mech-1'],
            parts_used: []
          }
        ])
      });
    });

    await page.goto('/tickets');
  });

  test('should display tickets header with create button', async ({ page }) => {
    const header = page.locator('.tickets-header');
    await expect(header).toBeVisible();

    // Check flex layout
    const display = await header.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    expect(display).toBe('flex');

    // Check create button
    const createBtn = page.locator('.btn-create');
    await expect(createBtn).toBeVisible();
    await expect(createBtn).toContainText('New Ticket');

    // Check gradient background
    const bgColor = await createBtn.evaluate((el) => {
      return window.getComputedStyle(el).background;
    });
    expect(bgColor).toContain('gradient');
  });

  test('should display filter buttons with active state', async ({ page }) => {
    const filterButtons = page.locator('.filter-buttons');
    await expect(filterButtons).toBeVisible();

    // Check flex layout
    const display = await filterButtons.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    expect(display).toBe('flex');

    // Check all filter buttons exist
    const buttons = filterButtons.locator('button');
    await expect(buttons).toHaveCount(4); // All, Open, In Progress, Completed

    // Check active button styling
    const activeButton = buttons.filter({ hasClass: 'active' }).first();
    const activeBg = await activeButton.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(activeBg).toBeTruthy();
  });

  test('should display tickets in a responsive grid', async ({ page }) => {
    await page.waitForSelector('.tickets-grid', { timeout: 5000 });
    
    const ticketsGrid = page.locator('.tickets-grid');
    await expect(ticketsGrid).toBeVisible();

    // Check grid display
    const display = await ticketsGrid.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    expect(display).toBe('grid');

    // Check gap between cards
    const gap = await ticketsGrid.evaluate((el) => {
      return window.getComputedStyle(el).gap;
    });
    expect(parseFloat(gap)).toBeGreaterThan(0);
  });

  test('should style ticket detail cards properly', async ({ page }) => {
    await page.waitForSelector('.ticket-detail-card', { timeout: 5000 });
    
    const ticketCard = page.locator('.ticket-detail-card').first();
    await expect(ticketCard).toBeVisible();

    // Check white background
    const bgColor = await ticketCard.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(bgColor).toContain('rgb(255, 255, 255)');

    // Check border radius
    const borderRadius = await ticketCard.evaluate((el) => {
      return window.getComputedStyle(el).borderRadius;
    });
    expect(borderRadius).toContain('10px');

    // Check box shadow
    const boxShadow = await ticketCard.evaluate((el) => {
      return window.getComputedStyle(el).boxShadow;
    });
    expect(boxShadow).not.toBe('none');

    // Check hover effect
    const transition = await ticketCard.evaluate((el) => {
      return window.getComputedStyle(el).transition;
    });
    expect(transition).toContain('transform');
  });

  test('should display ticket header with ID and status', async ({ page }) => {
    await page.waitForSelector('.ticket-header', { timeout: 5000 });
    
    const ticketHeader = page.locator('.ticket-detail-card .ticket-header').first();
    await expect(ticketHeader).toBeVisible();

    // Check background color
    const bgColor = await ticketHeader.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(bgColor).toBeTruthy();

    // Check ticket ID
    const ticketId = ticketHeader.locator('.ticket-id');
    await expect(ticketId).toBeVisible();
    
    const idFontFamily = await ticketId.evaluate((el) => {
      return window.getComputedStyle(el).fontFamily;
    });
    expect(idFontFamily).toContain('monospace');

    // Check status badge
    const statusBadge = ticketHeader.locator('.ticket-status');
    await expect(statusBadge).toBeVisible();
  });

  test('should display ticket body with sections', async ({ page }) => {
    await page.waitForSelector('.ticket-body', { timeout: 5000 });
    
    const ticketBody = page.locator('.ticket-body').first();
    await expect(ticketBody).toBeVisible();

    // Check padding
    const padding = await ticketBody.evaluate((el) => {
      return window.getComputedStyle(el).padding;
    });
    expect(padding).toBeTruthy();

    // Check description
    const description = ticketBody.locator('p');
    await expect(description).toBeVisible();
  });

  test('should display ticket sections for mechanics and parts', async ({ page }) => {
    await page.waitForSelector('.ticket-section', { timeout: 5000 });
    
    const ticketSections = page.locator('.ticket-section');
    const count = await ticketSections.count();
    
    if (count > 0) {
      const section = ticketSections.first();
      
      // Check heading
      const heading = section.locator('h4');
      await expect(heading).toBeVisible();

      // Check list items
      const listItems = section.locator('li');
      const listItemCount = await listItems.count();
      
      if (listItemCount > 0) {
        const li = listItems.first();
        
        // Check background color
        const bgColor = await li.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });
        expect(bgColor).toBeTruthy();

        // Check monospace font
        const fontFamily = await li.evaluate((el) => {
          return window.getComputedStyle(el).fontFamily;
        });
        expect(fontFamily).toContain('monospace');
      }
    }
  });

  test('should display ticket footer with dates', async ({ page }) => {
    await page.waitForSelector('.ticket-footer', { timeout: 5000 });
    
    const ticketFooter = page.locator('.ticket-detail-card .ticket-footer').first();
    await expect(ticketFooter).toBeVisible();

    // Check background color
    const bgColor = await ticketFooter.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(bgColor).toBeTruthy();

    // Check flex layout
    const display = await ticketFooter.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    expect(display).toBe('flex');
  });

  test('should filter tickets by status', async ({ page }) => {
    await page.waitForSelector('.filter-buttons button', { timeout: 5000 });
    
    // Click on "In Progress" filter
    const inProgressBtn = page.locator('.filter-buttons button').filter({ hasText: 'In Progress' });
    await inProgressBtn.click();

    // Check if button becomes active
    await expect(inProgressBtn).toHaveClass(/active/);
  });
});

test.describe('Empty Tickets State', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('customer', JSON.stringify({
        id: 'test-customer-id',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com'
      }));
    });
    
    // Mock empty response
    await page.route('**/service-tickets/customer/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/tickets');
  });

  test('should display empty state with styling', async ({ page }) => {
    await page.waitForSelector('.no-tickets', { timeout: 5000 });
    
    const noTickets = page.locator('.no-tickets');
    await expect(noTickets).toBeVisible();

    // Check text alignment
    const textAlign = await noTickets.evaluate((el) => {
      return window.getComputedStyle(el).textAlign;
    });
    expect(textAlign).toBe('center');

    // Check padding
    const padding = await noTickets.evaluate((el) => {
      return window.getComputedStyle(el).padding;
    });
    expect(padding).toBeTruthy();

    // Check create button exists
    const createBtn = noTickets.locator('.btn-create');
    await expect(createBtn).toBeVisible();
  });
});
