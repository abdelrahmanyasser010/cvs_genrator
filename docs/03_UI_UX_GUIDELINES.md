# CV Studio UI/UX Guidelines

Version: 2.0  
Last Updated: 2026-07-04

---

# Philosophy

The application should feel like **talking to a career coach**.  
Not like filling a government form.

---

# Tone

- Friendly
- Simple
- Encouraging
- Professional

**Never robotic.**

---

# Wizard

## Rules

- **Only one question** visible at a time
- Large input fields
- Large primary button
- No sidebars
- No distractions

## Flow

```
Hi 👋
↓
What's your name?
↓
Nice to meet you [Name] ❤️
↓
What do you do?
↓
How many years of experience?
```

## Navigation

- Back button always available
- Progress bar at top
- Skip option when appropriate
- Never block completion

---

# Preview

- Always visible
- Updates instantly
- Never requires Refresh
- Shows real-time changes

---

# Forms

## General

- Minimal labels
- Examples inside placeholders
- Auto Focus on first field
- Keyboard Friendly (Enter to continue)

## Validation

- Never block typing
- Explain errors clearly
- Offer fixes
- Show validation after blur

---

# Empty States

Never show blank pages. Always guide the user.

**Examples:**
- "You haven't added any experience yet. Add your work history or internships."
- "No skills yet. Add your technical and soft skills."
- "No projects yet. Add your personal or academic projects."

---

# Buttons

## Primary
- One only per screen
- Clear action
- High contrast

## Secondary
- Outline style
- Less prominent

## Danger
- Rare use
- Red accent
- Confirmation required

---

# AI Buttons

- Small
- Inline
- Contextual
- Never dominate the interface
- Use emoji icons (✨, ✂️, 🌐, •)

---

# Mobile Rules

- Touch Friendly (44px minimum)
- Scrollable content
- Sticky Continue Button
- Large Inputs
- No hover states

---

# Accessibility

- High contrast (WCAG AA)
- Keyboard navigation
- Readable fonts (16px minimum)
- RTL support
- LTR support
- Screen reader friendly

---

# Loading States

- Show spinner for >500ms operations
- Explain what's happening
- Never block entire UI
- Allow cancellation

---

# Error Handling

- Clear error messages
- Suggested fixes
- Retry option
- Never show technical errors to end users

---

# Typography

## Font Family
- Primary: Inter (Google Fonts)
- Arabic: Cairo (Google Fonts)

## Sizes
- Headings: 24-32px
- Body: 16px
- Small: 14px
- Tiny: 12px

## Weights
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

---

# Colors

## Primary
- Blue: #2563EB
- Dark Blue: #1E40AF

## Neutral
- Black: #111827
- Gray: #6B7280
- Light Gray: #F3F4F6

 Semantic
- Success: #10B981
- Warning: #F59E0B
- Error: #EF4444

---

# Spacing

- XS: 4px
- SM: 8px
- MD: 16px
- LG: 24px
- XL: 32px
- 2XL: 48px

---

# Components

## Chat Bubble
- Rounded corners (12px)
- Light background
- Padding: 24px
- Max width: 600px

## Section Card
- White background
- Subtle shadow
- Padding: 16px
- Border radius: 8px

## Modal
- Center overlay
- Backdrop blur
- Close button
- Escape to close

---

# Animations

- Fade in: 200ms
- Slide up: 300ms
- Button hover: 150ms
- Page transition: 300ms

**Never use animations that slow down the user.**

---

# RTL Support

- Automatic direction based on locale
- Flip layouts
- Adjust padding/margins
- Test with Arabic content

---

# Print Styles

- Hide UI elements
- Show only CV content
- Remove backgrounds
- Ensure text contrast
- Page breaks at sections

---

# Related Documents

- [01_PRODUCT_BIBLE.md](./01_PRODUCT_BIBLE.md) - Product philosophy
- [02_ARCHITECTURE.md](./02_ARCHITECTURE.md) - System architecture
