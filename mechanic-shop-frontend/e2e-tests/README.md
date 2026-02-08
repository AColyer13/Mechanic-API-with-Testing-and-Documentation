# Mechanic Shop Frontend - Playwright Tests

Comprehensive visual and styling tests for the Mechanic Shop frontend application.

## Test Suite Overview

### Test Files

1. **home.spec.js** - Home page visual tests
   - Hero section styling
   - CTA buttons
   - Features grid layout
   - Animations

2. **auth.spec.js** - Authentication pages tests
   - Login page styling
   - Register page styling
   - Form layouts
   - Input field styling

3. **navbar.spec.js** - Navigation bar tests
   - Unauthenticated state
   - Authenticated state
   - Responsive behavior

4. **dashboard.spec.js** - Dashboard page tests
   - Stats cards layout
   - Recent tickets section
   - Grid layouts

5. **tickets.spec.js** - Tickets list page tests
   - Tickets grid
   - Filter buttons
   - Ticket cards
   - Empty state

6. **create-ticket.spec.js** - Create ticket form tests
   - Form styling
   - Button states
   - Error messages

7. **responsive.spec.js** - Responsive design tests
   - Mobile viewport (375x667)
   - Tablet viewport (768x1024)
   - Desktop viewport (1920x1080)

## Prerequisites

- Node.js 18+
- Playwright installed
- Frontend dev server accessible at http://localhost:5173

## Installation

```bash
cd frontend
npm install
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Run tests in UI mode (interactive)
```bash
npm run test:ui
```

### Run only Chromium tests
```bash
npm run test:chromium
```

### Debug tests
```bash
npm run test:debug
```

### View test report
```bash
npm run report
```

## Test Configuration

The tests are configured to:
- Run on Chromium browser (Desktop Chrome)
- Default viewport: 1280x720
- Automatically start the dev server
- Take screenshots on failure
- Record video on failure
- Capture traces on retry

## What Gets Tested

### Visual Styling
- ✅ Colors and gradients
- ✅ Font sizes and weights
- ✅ Padding and margins
- ✅ Border radius
- ✅ Box shadows
- ✅ Transitions and animations

### Layout
- ✅ Flexbox layouts
- ✅ Grid layouts
- ✅ Max-widths and constraints
- ✅ Spacing and gaps
- ✅ Responsive breakpoints

### Components
- ✅ Buttons (primary, secondary)
- ✅ Forms and inputs
- ✅ Cards
- ✅ Navigation
- ✅ Status badges
- ✅ Empty states

### Responsive Design
- ✅ Mobile (375px width)
- ✅ Tablet (768px width)
- ✅ Desktop (1920px width)

## Test Results

After running tests, results are available in:
- Terminal output (list format)
- HTML report: `playwright-report/index.html`
- Screenshots: `test-results/` (on failure)
- Videos: `test-results/` (on failure)

## CI/CD Integration

The tests are configured for CI environments:
- Retries: 2 attempts in CI
- Fail on `test.only` in CI
- Optimized for headless execution

## Troubleshooting

### Dev server not starting
Ensure the frontend is available:
```bash
cd ../mechanic-shop-frontend
npm run dev
```

### Tests failing on authentication
Check that mock data matches expected structure in test files.

### Visual differences
Run tests in headed mode to see actual rendering:
```bash
npm run test:headed
```

## Best Practices

1. **Always run tests before committing** to catch styling regressions
2. **Use UI mode** for writing new tests interactively
3. **Check screenshots** when tests fail to understand visual issues
4. **Update tests** when intentionally changing styles
5. **Test responsive breakpoints** when adding new pages

## Writing New Tests

Example test structure:

```javascript
import { test, expect } from '@playwright/test';

test.describe('Component Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/route');
  });

  test('should have proper styling', async ({ page }) => {
    const element = page.locator('.selector');
    await expect(element).toBeVisible();
    
    const bgColor = await element.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(bgColor).toBe('rgb(255, 255, 255)');
  });
});
```

## Contributing

When adding new components or pages:
1. Create corresponding test file
2. Test visual styling
3. Test responsive behavior
4. Run full test suite
5. Update this README if needed

## Support

For issues or questions about tests:
- Check Playwright documentation: https://playwright.dev
- Review test output and screenshots
- Run tests in debug mode for step-by-step execution
