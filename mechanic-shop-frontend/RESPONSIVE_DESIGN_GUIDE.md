# Responsive Design Guide

## Mobile-First Approach

All components are built using Tailwind's mobile-first responsive design. This means:
- Default styles apply to mobile (< 640px)
- Use `sm:` prefix for tablets (≥ 640px)
- Use `md:` prefix for small laptops (≥ 768px)
- Use `lg:` prefix for desktops (≥ 1024px)
- Use `xl:` prefix for large screens (≥ 1280px)
- Use `2xl:` prefix for extra large screens (≥ 1536px)

## Breakpoints
```
sm:  640px  - Portrait tablets
md:  768px  - Landscape tablets / Small laptops
lg:  1024px - Desktops
xl:  1280px - Large desktops
2xl: 1536px - Extra large screens
```

## Design Patterns

### Container Widths
```jsx
// Full width on mobile, constrained on desktop
<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
```

### Responsive Grid
```jsx
// 1 column mobile, 2 on tablet, 3 on desktop, 4 on large screens
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
```

### Responsive Text
```jsx
// Smaller on mobile, larger on desktop
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
```

### Responsive Padding/Spacing
```jsx
// Less padding on mobile, more on desktop
<div className="py-8 md:py-12 lg:py-16">
```

### Responsive Flex Direction
```jsx
// Stack on mobile, row on desktop
<div className="flex flex-col md:flex-row gap-4">
```

## Component Guidelines

### Buttons
```jsx
<button className="px-4 py-2 md:px-6 md:py-3 text-sm md:text-base rounded-lg">
```

### Cards
```jsx
<div className="p-4 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
```

### Navigation
- Mobile: Hamburger menu
- Desktop: Full horizontal menu
- Always sticky on scroll

### Forms
- Full width on mobile
- Max width with centering on desktop
- Stack labels/inputs on mobile, optionally side-by-side on desktop

## Color System
Primary: #667eea (Purple)
Secondary: #764ba2 (Deep Purple)
Success: #27ae60 (Green)
Warning: #f39c12 (Orange)
Danger: #e74c3c (Red)
Info: #3498db (Blue)

## Spacing Scale
Use Tailwind's default spacing scale (4px base):
- 1 = 4px
- 2 = 8px
- 4 = 16px
- 6 = 24px
- 8 = 32px
- 12 = 48px
- 16 = 64px

## Best Practices
1. Always test on mobile first
2. Use `flex` and `grid` for layouts
3. Use `max-w-*` to prevent content from getting too wide on large screens
4. Add `transition-*` for smooth hover/focus effects
5. Use `hover:` and `focus:` states for interactivity
6. Maintain touch-friendly tap targets (min 44px)
