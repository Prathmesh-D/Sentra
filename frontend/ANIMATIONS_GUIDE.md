# Sentra UI - Animation Guide

## Overview
This document outlines all the interactive animations added to make the Sentra UI feel polished and beautiful.

## Animation Classes Added

### 1. **Button Animations**
- **Class**: `.btn-click-animation`
- **Effect**: Scale down on click (0.96x), scale up on hover (1.02x) with soft shadow
- **Usage**: All buttons throughout the app
- **Timing**: 0.2s with smooth easing

### 2. **Card Hover Animation**
- **Class**: `.card-hover-animation`
- **Effect**: Lift up 4px with glowing shadow on hover
- **Usage**: All Card components, notification items
- **Timing**: 0.3s with smooth easing

### 3. **Input Focus Animation**
- **Class**: `.input-focus-animation`
- **Effect**: Subtle scale (1.01x) with ring shadow on focus
- **Usage**: All Input components
- **Timing**: 0.3s with smooth easing

### 4. **Icon Animations**

#### Icon Spin on Hover
- **Class**: `.icon-spin-hover`
- **Effect**: 360° rotation on hover
- **Usage**: App logo icon in sidebar
- **Timing**: 0.4s with bounce easing

#### Icon Bounce on Hover
- **Class**: `.icon-bounce-hover`
- **Effect**: Bounce up 3px and scale 1.1x on hover
- **Usage**: Navigation icons, activity icons, action button icons
- **Timing**: 0.3s with spring easing

### 5. **Scale Hover**
- **Class**: `.scale-hover`
- **Effect**: Scale to 1.05x on hover
- **Usage**: Logo container, interactive cards
- **Timing**: 0.2s with smooth easing

### 6. **Pulse Animation**
- **Class**: `.pulse-soft`
- **Effect**: Continuous soft pulsing (opacity + scale)
- **Usage**: "New" notification badge
- **Timing**: 2s infinite loop

### 7. **Glow on Hover**
- **Class**: `.glow-hover`
- **Effect**: Glowing box-shadow in brand colors
- **Usage**: Quick action buttons on Dashboard
- **Timing**: 0.3s with smooth easing

### 8. **Stagger Animation**
- **Class**: `.stagger-item`
- **Effect**: Fade and scale in with sequential delays
- **Usage**: Activity list items, notification items
- **Delays**: 50-100ms between items (nth-child support up to 6)

### 9. **Progress Bar Fill**
- **Class**: `.progress-fill-animate`
- **Effect**: Smooth width animation from 0% to target
- **Usage**: Storage usage bar, file upload progress
- **Timing**: 1s with smooth easing

### 10. **Slide In from Bottom**
- **Class**: `.slide-in-bottom`
- **Effect**: Fade in while sliding up 20px
- **Usage**: Modal dialogs, tooltips
- **Timing**: 0.4s with smooth easing

### 11. **Fade & Scale In**
- **Class**: `.fade-scale-in`
- **Effect**: Fade in with scale from 0.95x to 1x
- **Usage**: Page content, dropdowns
- **Timing**: 0.3s with smooth easing

### 12. **Shimmer Effect**
- **Class**: `.shimmer`
- **Effect**: Animated gradient sweep (loading state)
- **Usage**: Loading placeholders (ready for implementation)
- **Timing**: 2s infinite loop

### 13. **Wiggle Animation**
- **Class**: `.wiggle`
- **Effect**: Quick rotation wiggle (-5° to +5°)
- **Usage**: Badge notifications (can be triggered on new items)
- **Timing**: 0.5s single play

### 14. **Tab Transition Animation** ⚡ NEW
- **Class**: `.tab-transition`
- **Effect**: Smooth fade-in with subtle horizontal slide (12px)
- **Usage**: Settings page tab content switching
- **Timing**: 0.25s with smooth easing
- **Details**: 
  - Content slides in from right (12px) while fading in
  - Fast enough to feel responsive (250ms)
  - Smooth enough to be visually pleasing
  - Doesn't block user interaction

### 15. **Tab Button Active State** ⚡ NEW
- **Class**: `.tab-button-active`
- **Effect**: Animated accent bar slides in from left
- **Usage**: Settings page tab buttons
- **Timing**: 0.3s with spring easing
- **Details**:
  - 4px wide gradient accent bar
  - Slides in with bounce effect
  - Positioned at left edge of active tab

## Custom Timing Functions

Added to CSS variables for consistent, high-quality animations:

```css
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);  /* Bouncy effect */
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);      /* Smooth material design */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Playful bounce */
```

## Components Enhanced

### Navigation & Sidebar
- ✅ Logo icon - spin on hover
- ✅ Logo container - scale on hover
- ✅ Navigation items - icon bounce on hover
- ✅ User avatar - float animation
- ✅ Logout button - click animation + icon bounce

### Settings Page ⚡ NEW
- ✅ Tab buttons - click animation + icon bounce + active state indicator
- ✅ Tab content - smooth fade & slide transition (250ms)
- ✅ Active tab - animated accent bar with spring effect
- ✅ All form elements - inherited button/input animations

### Dashboard
- ✅ Stats cards - card hover animation
- ✅ Quick stats cards - card hover animation
- ✅ Activity list - stagger animation + icon bounce
- ✅ Quick action buttons - click animation + glow + icon bounce
- ✅ Progress bar - fill animation

### Notifications
- ✅ "New" badge - pulse animation
- ✅ Filter buttons - click animation
- ✅ Action buttons - click animation + icon bounce
- ✅ Notification cards - hover animation + stagger entry
- ✅ Notification icons - bounce on hover
- ✅ Action buttons within notifications - click animation

### Forms & Inputs
- ✅ All buttons - click animation (scale on press)
- ✅ All inputs - focus animation (scale + ring)
- ✅ All cards - hover lift animation

### Encrypt Page
- ✅ Upload button - click animation
- ✅ File selection buttons - click animation

## Performance Considerations

1. **GPU Acceleration**: All animations use `transform` and `opacity` properties for smooth 60fps performance
2. **Animation State**: Page-level animations controlled by `sessionStorage` to prevent replay on navigation
3. **Will-Change**: Applied to frequently animated elements
4. **Reduced Motion**: Animations respect user preferences (can be enhanced with `prefers-reduced-motion` media query)

## Future Enhancements

- Add ripple effect to buttons (CSS class ready)
- Implement shimmer for loading states
- Add wiggle to new notification badges
- Consider micro-interactions for file uploads
- Add success/error state animations

## Testing Checklist

- [x] Button clicks feel responsive
- [x] Card hovers are smooth
- [x] Input focus is noticeable but not jarring
- [x] Icon animations are playful but not distracting
- [x] Stagger animations create visual hierarchy
- [x] No animation lag or jank
- [x] Animations don't interfere with functionality

## Browser Support

All animations use standard CSS properties supported in:
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ All modern mobile browsers

---

**Note**: All animations are subtle and purposeful, enhancing the user experience without being distracting or overwhelming. The timing and easing functions create a cohesive, polished feel throughout the application.
