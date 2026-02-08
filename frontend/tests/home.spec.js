import { test, expect } from '@playwright/test';

/**
 * Home Page Visual Tests
 * Tests the styling and layout of the landing page
 */

test.describe('Home Page Styling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display hero section with correct styling', async ({ page }) => {
    // Check hero section exists and is visible
    const heroSection = page.locator('.hero-section');
    await expect(heroSection).toBeVisible();

    // Check hero has gradient background
    const bgColor = await heroSection.evaluate((el) => {
      return window.getComputedStyle(el).background;
    });
    expect(bgColor).toContain('gradient');

    // Check hero title
    const title = page.locator('.hero-section h1');
    await expect(title).toBeVisible();
    await expect(title).toContainText('Mechanic Shop');
    
    // Verify title font size is large (3rem = 48px)
    const fontSize = await title.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });
    expect(parseFloat(fontSize)).toBeGreaterThan(40); // Should be ~48px
  });

  test('should display CTA buttons with proper styling', async ({ page }) => {
    const ctaButtons = page.locator('.cta-buttons');
    await expect(ctaButtons).toBeVisible();

    // Check both buttons exist
    const buttons = page.locator('.btn-hero');
    await expect(buttons).toHaveCount(2);

    // Check primary button styling
    const primaryBtn = page.locator('.btn-hero.primary').first();
    await expect(primaryBtn).toBeVisible();
    
    const primaryBg = await primaryBtn.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(primaryBg).toBeTruthy();

    // Check button has border radius
    const borderRadius = await primaryBtn.evaluate((el) => {
      return window.getComputedStyle(el).borderRadius;
    });
    expect(borderRadius).toContain('50px');
  });

  test('should display features grid with 4 cards', async ({ page }) => {
    const featuresSection = page.locator('.features-section');
    await expect(featuresSection).toBeVisible();

    // Check features title
    const featuresTitle = featuresSection.locator('h2');
    await expect(featuresTitle).toContainText('Our Services');

    // Check all 4 feature cards are visible
    const featureCards = page.locator('.feature-card');
    await expect(featureCards).toHaveCount(4);

    // Verify each card has an icon, title, and description
    for (let i = 0; i < 4; i++) {
      const card = featureCards.nth(i);
      await expect(card.locator('.feature-icon')).toBeVisible();
      await expect(card.locator('h3')).toBeVisible();
      await expect(card.locator('p')).toBeVisible();
    }
  });

  test('should have proper spacing and layout', async ({ page }) => {
    // Check hero section padding
    const heroSection = page.locator('.hero-section');
    const heroPadding = await heroSection.evaluate((el) => {
      return window.getComputedStyle(el).padding;
    });
    expect(heroPadding).toBeTruthy();

    // Check features section max-width
    const featuresSection = page.locator('.features-section');
    const maxWidth = await featuresSection.evaluate((el) => {
      return window.getComputedStyle(el).maxWidth;
    });
    expect(maxWidth).toContain('1200px');
  });

  test('should have responsive grid layout for features', async ({ page }) => {
    const featuresGrid = page.locator('.features-grid');
    
    // Check display is grid
    const display = await featuresGrid.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    expect(display).toBe('grid');

    // Check gap between items
    const gap = await featuresGrid.evaluate((el) => {
      return window.getComputedStyle(el).gap;
    });
    expect(parseFloat(gap)).toBeGreaterThan(0);
  });

  test('should animate hero elements', async ({ page }) => {
    const title = page.locator('.hero-section h1');
    
    // Check if animation is applied
    const animation = await title.evaluate((el) => {
      return window.getComputedStyle(el).animation;
    });
    expect(animation).toContain('fadeInDown');
  });
});
