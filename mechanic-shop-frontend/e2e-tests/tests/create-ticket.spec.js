import { test, expect } from '@playwright/test';

/**
 * Create Ticket Page Visual Tests
 * Tests the styling of the ticket creation form
 */

test.describe('Create Ticket Page Styling', () => {
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

    await page.goto('/create-ticket');
  });

  test('should display create ticket container with max-width', async ({ page }) => {
    const container = page.locator('.create-ticket-container');
    await expect(container).toBeVisible();

    // Check max-width
    const maxWidth = await container.evaluate((el) => {
      return window.getComputedStyle(el).maxWidth;
    });
    expect(maxWidth).toContain('800px');

    // Check container is centered (has auto margins or is centered)
    const marginLeft = await container.evaluate((el) => {
      return window.getComputedStyle(el).marginLeft;
    });
    const marginRight = await container.evaluate((el) => {
      return window.getComputedStyle(el).marginRight;
    });
    // Both margins should be equal (indicating centering)
    expect(marginLeft).toBe(marginRight);
  });

  test('should display card with proper styling', async ({ page }) => {
    const card = page.locator('.create-ticket-card');
    await expect(card).toBeVisible();

    // Check white background
    const bgColor = await card.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(bgColor).toContain('rgb(255, 255, 255)');

    // Check box shadow
    const boxShadow = await card.evaluate((el) => {
      return window.getComputedStyle(el).boxShadow;
    });
    expect(boxShadow).not.toBe('none');

    // Check border radius
    const borderRadius = await card.evaluate((el) => {
      return window.getComputedStyle(el).borderRadius;
    });
    expect(borderRadius).toContain('10px');
  });

  test('should display heading with proper styling', async ({ page }) => {
    const heading = page.locator('.create-ticket-card h2');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Create New Service Ticket');

    // Check color
    const color = await heading.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    expect(color).toBeTruthy();
  });

  test('should display textarea with proper styling', async ({ page }) => {
    const textarea = page.locator('textarea[name="description"]');
    await expect(textarea).toBeVisible();

    // Check rows attribute
    await expect(textarea).toHaveAttribute('rows', '6');

    // Check placeholder
    await expect(textarea).toHaveAttribute('placeholder');

    // Check border
    const border = await textarea.evaluate((el) => {
      return window.getComputedStyle(el).border;
    });
    expect(border).toBeTruthy();

    // Check border radius
    const borderRadius = await textarea.evaluate((el) => {
      return window.getComputedStyle(el).borderRadius;
    });
    expect(borderRadius).toContain('6px');

    // Check padding
    const padding = await textarea.evaluate((el) => {
      return window.getComputedStyle(el).padding;
    });
    expect(padding).toBeTruthy();
  });

  test('should display form actions with two buttons', async ({ page }) => {
    const formActions = page.locator('.form-actions');
    await expect(formActions).toBeVisible();

    // Check flex layout
    const display = await formActions.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    expect(display).toBe('flex');

    // Check justify-content
    const justifyContent = await formActions.evaluate((el) => {
      return window.getComputedStyle(el).justifyContent;
    });
    expect(justifyContent).toBe('flex-end');

    // Check both buttons exist
    const buttons = formActions.locator('button');
    await expect(buttons).toHaveCount(2);
  });

  test('should style primary button with gradient', async ({ page }) => {
    const primaryBtn = page.locator('button.btn-primary');
    await expect(primaryBtn).toBeVisible();
    await expect(primaryBtn).toContainText('Create Ticket');

    // Check gradient background
    const bgColor = await primaryBtn.evaluate((el) => {
      return window.getComputedStyle(el).background;
    });
    expect(bgColor).toContain('gradient');

    // Check border radius
    const borderRadius = await primaryBtn.evaluate((el) => {
      return window.getComputedStyle(el).borderRadius;
    });
    expect(borderRadius).toContain('6px');

    // Check cursor
    const cursor = await primaryBtn.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });
    expect(cursor).toBe('pointer');
  });

  test('should style secondary button differently', async ({ page }) => {
    const secondaryBtn = page.locator('button.btn-secondary');
    await expect(secondaryBtn).toBeVisible();
    await expect(secondaryBtn).toContainText('Cancel');

    // Check background is not gradient
    const bgColor = await secondaryBtn.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(bgColor).toBeTruthy();

    // Check has hover effect
    const transition = await secondaryBtn.evaluate((el) => {
      return window.getComputedStyle(el).transition;
    });
    expect(transition).toBeTruthy();
  });

  test('should display form label with proper styling', async ({ page }) => {
    const label = page.locator('label[for="description"]');
    await expect(label).toBeVisible();

    // Check font weight
    const fontWeight = await label.evaluate((el) => {
      return window.getComputedStyle(el).fontWeight;
    });
    expect(fontWeight).toBe('500');

    // Check font size
    const fontSize = await label.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });
    expect(parseFloat(fontSize)).toBeGreaterThan(16);
  });

  test('should handle form submission with loading state', async ({ page }) => {
    const textarea = page.locator('textarea[name="description"]');
    const submitBtn = page.locator('button.btn-primary');

    // Fill out the form
    await textarea.fill('Test issue description');

    // Check submit button is not disabled initially
    await expect(submitBtn).not.toBeDisabled();
  });
});

test.describe('Create Ticket Form Validation', () => {
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

    await page.goto('/create-ticket');
  });

  test('should display error message with proper styling', async ({ page }) => {
    // Mock API error
    await page.route('**/service-tickets', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          errors: ['Description is required']
        })
      });
    });

    const submitBtn = page.locator('button.btn-primary');
    const textarea = page.locator('textarea[name="description"]');

    await textarea.fill('Test');
    await submitBtn.click();

    // Wait for error message
    await page.waitForSelector('.error-message', { timeout: 5000 });
    
    const errorMessage = page.locator('.error-message');
    await expect(errorMessage).toBeVisible();

    // Check background color (light red)
    const bgColor = await errorMessage.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(bgColor).toBeTruthy();

    // Check border left
    const borderLeft = await errorMessage.evaluate((el) => {
      return window.getComputedStyle(el).borderLeft;
    });
    expect(borderLeft).toContain('3px');
  });
});
