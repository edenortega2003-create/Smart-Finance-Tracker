# CLAUDE.md — Design System & Frontend Guide
## Expense Tracker PWA

> This file is the single source of truth for all frontend decisions in this project.
> Claude must read and apply these rules before making any UI change, no matter how small.

---

## Project Identity

**Name:** Expense Tracker PWA  
**Purpose:** Personal finance awareness — fast transaction logging, smart classification, visual clarity.  
**Audience:** Individual users who want financial control without complexity.  
**Language:** Spanish (es) primary. Locale system exists for EN, PT, AR, NL, BN.

**This app is NOT:**
- A banking app (no bank connections, no ledger formalism)
- An accounting tool (no double-entry, no balance sheets)
- A budgeting spreadsheet (no complex table grids)

**This app IS:**
- A daily companion for financial awareness
- A habit-forming tool for expense consciousness
- A clean, calm, fast mobile-first PWA

---

## 1. Visual Philosophy

The visual language is **calm, precise, and empowering**. Every design decision must answer:
*"Does this help the user feel in control of their money?"*

### Core Principles

| Principle | Meaning |
|-----------|---------|
| **Clarity first** | Data is readable at a glance. No cognitive overhead. |
| **Purposeful whitespace** | Empty space is not wasted — it creates breathing room. |
| **Subtle depth** | Layers, glass effects, and shadows create hierarchy without noise. |
| **Honest color** | Color is used semantically (green = income, red = expense), not decoratively. |
| **Premium restraint** | One accent. No gradients where they aren't earned. No animations for show. |

### Visual Mood References

- **Copilot Money** — financial clarity, warm neutrals, confident typography
- **Revolut** — bold numbers, minimal chrome, dark accents
- **Linear** — density control, precise spacing, developer-grade polish
- **Arc Browser** — playful but structured, blurred layers, spatial depth
- **Notion** — calm whitespace, readable hierarchy, no visual noise
- **Stripe Dashboard** — metric-first layout, muted backgrounds, excellent data tables

---

## 2. UX / UI Rules

### Interaction Principles

1. **One primary action per screen.** Never compete for attention.
2. **Numbers must always be the biggest thing on a financial screen.**
3. **Feedback is instant** — loading states, transitions, and success states must never feel broken.
4. **Forms are short** — every field must justify its existence.
5. **Destructive actions** (delete) require a second confirmation, never inline.
6. **Empty states are informative**, not just blank. Tell the user what to do.
7. **Error messages speak human** — "No pudimos guardar" not "Error 500".
8. **Never block the UI** — optimistic updates where safe; spinners only for real async work.

### Navigation

- Mobile: bottom navigation bar (max 4 tabs)
- Desktop: collapsible sidebar
- Active state must be unambiguous — no relying on color alone
- Back navigation always available on sub-pages

### Touch Targets

- Minimum tap target: `44px × 44px` (Apple HIG standard)
- Interactive list rows: minimum `56px` height on mobile
- FAB (floating action button) for primary action on mobile: `56px`

---

## 3. Color System

### Philosophy

The palette is **semantic and intentional**. Colors communicate meaning, not decoration.

### Base Palette

```
Background (light)  : #F8F9FB  (near-white, warm-cool neutral)
Background (dark)   : #0F1117  (near-black, cold deep)
Surface (light)     : #FFFFFF
Surface (dark)      : #1A1D27

Border (light)      : rgba(0, 0, 0, 0.08)
Border (dark)       : rgba(255, 255, 255, 0.08)

Text primary (light): #0D0F14
Text primary (dark) : #F1F2F5
Text secondary      : #6B7280  (both modes, adjust luminance as needed)
Text muted          : #9CA3AF
```

### Semantic Colors

```
Income / Positive   : #22C55E  (green-500)   — never orange, never teal
Expense / Negative  : #EF4444  (red-500)     — clear, never pink
Warning             : #F59E0B  (amber-500)   — for limits, caution
Info / Neutral      : #3B82F6  (blue-500)    — for balance, info
Purple / Premium    : #8B5CF6  (violet-500)  — for top category, investment
```

### Accent

```
Primary accent      : #6366F1  (indigo-500)  — CTAs, active states, focus rings
Accent hover        : #4F46E5  (indigo-600)
Accent light bg     : rgba(99, 102, 241, 0.08)
```

### Glass Layer (glassmorphism)

Used on cards over background images or dark surfaces only.

```
Glass background    : rgba(255, 255, 255, 0.08)  (light mode over dark bg)
Glass background    : rgba(255, 255, 255, 0.04)  (dark mode)
Glass border        : rgba(255, 255, 255, 0.12)
Glass blur          : backdrop-filter: blur(16px) saturate(160%)
```

> **Rule:** Glass effect is only appropriate when there is a visually distinct layer beneath (background image, gradient, or dark surface). Never apply glass to white-on-white.

### Do Not Use

- Bright gradients on cards or text
- Random accent colors per category (use the semantic set)
- Pure black `#000000` or pure white `#FFFFFF` for backgrounds
- More than 2 accent hues on a single screen

---

## 4. Typography

### Font Stack

```
--font-sans: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
```

Use **Inter** as primary. It is purpose-built for UI at all sizes and has excellent numeric rendering.

### Scale

```
Display   : 36–48px  font-bold     — hero numbers only (e.g., total balance)
H1        : 24–30px  font-semibold — page titles
H2        : 20–22px  font-semibold — section headers
H3        : 16–18px  font-medium   — card titles, labels
Body      : 14–15px  font-normal   — general text
Caption   : 12–13px  font-normal   — metadata, timestamps, helper text
Label     : 11px     font-medium   — table column headers (uppercase + tracking)
Mono      : 14px     font-mono     — amounts, IDs, dates in tables
```

### Rules

- **Currency amounts always use monospace or tabular nums** (`font-variant-numeric: tabular-nums`)
- **Never use font-weight below 400** in the UI
- **Line height for body:** 1.5 — for headings: 1.2
- **Letter spacing:** tight for headings (`-0.02em`), default for body, wide for labels (`0.06em`)
- **Avoid text-transform: uppercase** except for column headers and small labels

---

## 5. Spacing System

Based on a **4px base grid**. All spacing values must be multiples of 4.

```
space-1  :  4px   — icon gap, micro padding
space-2  :  8px   — chip padding, small gap
space-3  : 12px   — input padding, row gap
space-4  : 16px   — standard padding, card inner gap
space-5  : 20px   — section inner padding
space-6  : 24px   — card padding, section gap
space-8  : 32px   — between sections
space-10 : 40px   — page-level vertical rhythm
space-12 : 48px   — hero spacing
space-16 : 64px   — large section separation
```

### Tailwind equivalents

`p-4` = 16px, `p-6` = 24px, `gap-4` = 16px, `mt-8` = 32px, etc.

### Rules

- Card inner padding: `p-5` or `p-6` (20–24px)
- Section gap between card groups: `gap-4` or `gap-6`
- Page horizontal padding (mobile): `px-4`
- Page horizontal padding (desktop): `px-6` or `px-8`
- Never use arbitrary values like `px-[17px]` — always round to grid

---

## 6. Shadows

Shadows communicate elevation. Use sparingly.

```
shadow-xs  : 0 1px 2px rgba(0,0,0,0.05)                          — subtle dividers
shadow-sm  : 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06) — cards (rest)
shadow-md  : 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06) — cards (hover)
shadow-lg  : 0 10px 15px rgba(0,0,0,0.10), 0 4px 6px rgba(0,0,0,0.05) — modals, drawers
shadow-xl  : 0 20px 40px rgba(0,0,0,0.14)                        — FAB, dropdowns
```

### Rules

- Cards at rest: `shadow-sm`
- Cards on hover: `shadow-md` with subtle `translateY(-1px)`
- Modals: `shadow-lg`
- No shadow on navigation bars (use border instead)
- In dark mode, replace shadow with `ring-1 ring-white/5` (border glow)

---

## 7. Border Radius

```
rounded-sm  :  4px — badges, small chips
rounded     :  6px — inputs, small cards
rounded-md  :  8px — buttons, form controls
rounded-lg  : 12px — cards, panels
rounded-xl  : 16px — modals, bottom sheets
rounded-2xl : 20px — hero cards, large panels
rounded-full: 9999px — pills, avatars, FAB
```

### Rules

- Standard card: `rounded-xl` (16px)
- Input fields: `rounded-md` (8px)
- Buttons: `rounded-md` (8px)
- Chips / badges: `rounded-full`
- Modal container: `rounded-2xl` (20px)
- Bottom sheet: `rounded-t-2xl` (top corners only)

---

## 8. Financial Cards

Cards are the primary display unit for financial data.

### Anatomy

```
┌─────────────────────────────────┐
│  Icon  Label              Badge │  ← header: label + optional badge
│                                 │
│  $12,430.00                     │  ← value: large, monospace, semantic color
│                                 │
│  ↑ 12% vs ayer                  │  ← optional trend / context line
└─────────────────────────────────┘
```

### Rules

1. **Value is the star.** It must be the largest and most visible element.
2. **Label is always above the value**, small and muted — never below.
3. **Trend / change line** (if present) is below value, small, colored semantically.
4. **One metric per card.** Never stack two unrelated numbers.
5. **Icon is decorative**, not functional. Use Lucide icons, 16–20px, muted color.
6. **Card padding:** `p-5` or `p-6` minimum.
7. **Cards in a grid:** equal height within a row, use `items-start` not `stretch` if values differ in size.
8. **Hover state:** subtle shadow lift + 1px translate. No color change on card background.
9. **Clickable cards** must have a visible focus ring for accessibility.

### Value Formatting

```typescript
// Always format amounts with the currency shorthand
// Use Intl.NumberFormat for locale-aware formatting
const formatAmount = (amount: number, currency: string) =>
  new Intl.NumberFormat('es-MX', { style: 'decimal', minimumFractionDigits: 2 }).format(amount);
```

---

## 9. Mobile-First Design

The primary target device is a smartphone (360–430px wide).

### Rules

1. **Design for 375px first**, then scale up.
2. All interactive elements meet the **44px minimum tap target**.
3. **No horizontal scrolling** on content — only on explicitly designed scroll containers.
4. **Bottom navigation** (not top tabs on mobile) — thumb-reachable.
5. **Floating Action Button (FAB)** for the primary action (add transaction): bottom-right, `56px`, clear elevation.
6. **Forms open as bottom sheets** on mobile (slide up), not full page navigation.
7. **Modals on mobile** take 90–95% of screen height as bottom sheets.
8. **Text must never be smaller than 14px** on mobile.
9. **Avoid hover-only interactions** — all hover effects must have a tap equivalent.
10. **Safe area insets:** respect `env(safe-area-inset-*)` for notched devices.

---

## 10. Responsive Design

### Breakpoints (Tailwind)

```
sm  : 640px  — large phones, small tablets
md  : 768px  — tablets
lg  : 1024px — small laptops, desktop layout begins
xl  : 1280px — standard desktop
2xl : 1536px — wide screens
```

### Layout Shifts

| Viewport | Layout |
|----------|--------|
| < 640px  | Single column. Bottom nav. Cards full-width stacked. |
| 640–1024px | 2-column card grid. Still bottom nav or top tabs. |
| > 1024px | Sidebar (collapsible). 3-column card grid. Tables with all columns. |

### Rules

- **Desktop sidebar:** 240px fixed, collapsible to 64px icon-only mode.
- **Card grids:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- **Transaction table:** on mobile it becomes an accordion list; on desktop it's a proper `<table>`.
- **Metric numbers** may increase font size on larger screens: `text-2xl md:text-3xl lg:text-4xl`.

---

## 11. Animation System

Animations are **purposeful and subtle**. They confirm state, guide attention, and smooth transitions. They are never decorative.

### Timing Tokens

```
duration-fast   : 100ms — micro-interactions (button press, checkbox toggle)
duration-normal : 200ms — most UI transitions (card appear, dropdown open)
duration-slow   : 300ms — page transitions, modal open/close
duration-crawl  : 500ms — progress bars, chart animations
```

### Easing

```
ease-ui     : cubic-bezier(0.4, 0, 0.2, 1)  — standard MUI/Material ease (default)
ease-spring : cubic-bezier(0.34, 1.56, 0.64, 1) — subtle spring for cards appearing
ease-out    : cubic-bezier(0, 0, 0.2, 1)    — elements entering
ease-in     : cubic-bezier(0.4, 0, 1, 1)    — elements leaving
```

### Framer Motion Presets

```typescript
// Standard card entrance
const cardVariants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } },
};

// Stagger for card grids
const containerVariants = {
  visible: { transition: { staggerChildren: 0.06 } },
};

// Modal / sheet entrance
const sheetVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] } },
  exit:    { opacity: 0, y: 16, transition: { duration: 0.15 } },
};

// Number counter (for balance reveals)
// Use framer-motion useMotionValue + useTransform, or a simple spring
```

### Rules

- **Never animate layout** (width, height) — only transform and opacity
- **Respect `prefers-reduced-motion`** — all animations must check this
- **Chart animations:** max 600ms, ease-out, triggered once on mount
- **Loading skeletons** use a `shimmer` keyframe animation, never a spinner for data areas
- **Page transitions:** simple `opacity 200ms` fade — nothing dramatic

---

## 12. Financial Dashboards

The dashboard is the heart of the app. It must deliver financial clarity in under 3 seconds.

### Information Hierarchy

```
1. Total balance (DOMINANT — largest text on page)
2. Income vs Expense split (secondary — two numbers or a mini chart)
3. Period selector (contextual — changes what the metrics below show)
4. Period metrics cards (supporting — digestible grid)
5. Spending limit progress (if applicable)
6. AI/Smart suggestions (contextual text — collapsed by default on mobile)
7. Charts (explorative — below the fold)
```

### Rules

1. **Balance total is always visible**, even when scrolling (sticky mini-header or hero placement).
2. **Period selector** is inline with the section title — compact, never a full-width bar.
3. **No more than 6 metric cards** in a grid. Split into sections if needed.
4. **Charts are below the fold** — not the first thing the user sees.
5. **Suggestions** are max 3 lines. Expandable, never auto-expanded on mobile.
6. **Empty states** on the dashboard should be warm and actionable: *"No hay movimientos hoy. ¡Registra tu primer gasto!"*
7. **The daily limit bar** must show percentage, current amount, and limit — not just a bar.

---

## 13. Transaction Lists and Tables

### Mobile (Accordion / List)

```
┌──────────────────────────────────────┐
│ ● Concepto              -$45.00      │  ← row: icon • concept (left) • amount (right)
│   Hormiga · Regular     Ayer         │  ← sub: classification • regularity • date
└──────────────────────────────────────┘
```

- Row height: minimum `64px`
- Amount is right-aligned, monospace, semantic color
- Classification shown as a subtle pill/badge, not a full chip
- Date shown in relative format ("Ayer", "Hace 3 días") for recent items, absolute for older
- Swipe-to-delete on mobile (with undo snackbar)

### Desktop (Table)

| Date | Concept | Classification | Regularity | Amount | Type | Actions |
|------|---------|----------------|------------|--------|------|---------|

- Column headers: `uppercase text-[11px] tracking-wider text-gray-500`
- Amount column: right-aligned, monospace
- Actions column: icon buttons (edit, delete), appear on row hover
- Zebra striping: subtle `bg-gray-50/50` on alternating rows (light mode only)
- Row hover: `bg-gray-50` (light) / `bg-white/5` (dark)
- Sticky header when table scrolls

### Rules

- **Pagination or virtual scroll** for > 50 rows — never render all at once
- **Filter bar** above the table: by type, classification, date range — compact
- **Search** is an icon button that expands — not always-visible input
- **Sort** is on column header click with arrow indicator

---

## 14. Modals

Modals are used for: transaction details, confirmations, and settings panels.

### Structure

```
Bottom Sheet (mobile)          Modal Dialog (desktop)
┌──────────────────────┐       ┌─────────────────────┐
│ ─────── (handle)     │       │  Title        [✕]   │
│ Title                │       │─────────────────────│
│─────────────────────│       │ Content             │
│ Content              │       │                     │
│                      │       │─────────────────────│
│ [ Cancel ] [ Save ]  │       │ [Cancel]    [Save]  │
└──────────────────────┘       └─────────────────────┘
```

### Rules

1. **Mobile:** always bottom sheet (`rounded-t-2xl`, slides up with spring animation)
2. **Desktop:** centered dialog, max-width `480px` for forms, `640px` for details
3. **Backdrop:** `bg-black/40 backdrop-blur-sm` — not opaque
4. **Close button (✕):** always present, top-right corner
5. **Actions:** primary action right, secondary (cancel) left — never stacked vertically on desktop
6. **Scrollable content:** modal body scrolls, header and footer are sticky
7. **No nested modals.** Confirmation dialogs use a simple in-modal footer, not another modal.
8. **Transition:** slide-up (mobile), fade + scale-95→100 (desktop)

---

## 15. Forms

Forms must be **fast to fill and impossible to misunderstand**.

### Rules

1. **One column layout always** — never two-column forms on mobile
2. **Labels above inputs** — never placeholder-as-label (accessibility violation)
3. **Input height:** `h-11` (44px) minimum — meets touch target standard
4. **Validation inline** — error appears below the field on blur, not on submit
5. **Error text:** red-500, small (`text-sm`), with icon `⚠`
6. **Autofocus** the first field when a form opens
7. **Numeric inputs** (amount): `inputmode="decimal"` — triggers numeric keyboard on mobile
8. **Date inputs:** use the native date picker on mobile, custom picker on desktop only if needed
9. **Select fields:** use native `<select>` on mobile for performance; custom on desktop
10. **Auto-suggestion for classification:** shown as dismissible pills below the concept input, not a dropdown
11. **Save button:** full-width on mobile, right-aligned on desktop — always the accent color
12. **Disabled state:** `opacity-50 cursor-not-allowed` — never just color change

### Transaction Form Field Order

```
1. Type (Gasto / Ingreso)        — ToggleButtonGroup
2. Concepto                      — text input (triggers classification suggestion)
3. Clasificación                 — select (pre-filled from suggestion)
4. Regularidad                   — select (pre-filled from suggestion)
5. Monto                         — numeric input (large, prominent)
6. Fecha                         — date input (defaults to today)
7. Notas                         — textarea (optional, collapsed by default)
```

---

## 16. Metrics and Statistics

### Stat Block

A standalone number with context. Used in cards and summaries.

```
[Label small muted]
[Value large bold colored]
[Change line: ↑ 12.3% vs periodo anterior]
```

### Progress Indicators

- **Linear progress (spending limit):** always show `current / limit` text alongside the bar
- **Bar fill color:** semantic — green < 70%, amber 70–90%, red > 90%
- **Height:** `h-2` (8px) — thin but visible
- **Round caps:** `rounded-full`

### Chart Stat Headers

Each chart section has a title + optional subtitle + period badge.

```
Vista Mensual                [2025 ▾]
Ingresos y gastos por mes
```

### Rules

- **Never show a metric without its unit** (always `$`, `%`, `# mov`)
- **Trend indicators:** `↑` green, `↓` red — only when comparison data exists
- **Zero state:** show `$0.00` not `—` for financial amounts (distinction matters)
- **Negative balance:** red text with `−` prefix — never parentheses notation

---

## 17. Dark Mode

### Strategy

Support dark mode via Tailwind `dark:` classes and CSS variables. The app background uses a custom image — dark mode adapts glass overlays and text contrast, not the background itself.

### Rules

1. **Never hardcode colors** — always use semantic tokens or Tailwind semantic classes
2. **Dark surface:** `bg-gray-900` or `bg-[#1A1D27]` — not pure black
3. **Cards in dark mode:** glass effect — `bg-white/5 border border-white/10`
4. **Text in dark mode:** primary `text-gray-100`, secondary `text-gray-400`
5. **Semantic colors remain the same** — green-500, red-500 work on both modes
6. **Shadows in dark mode:** replace with `ring-1 ring-white/10` — shadows are invisible on dark
7. **Focus rings in dark mode:** `ring-indigo-400` (lighter than indigo-500)
8. **Chart colors:** increase opacity — charts tend to look washed out in dark mode

### CSS Variable Pattern

```css
:root {
  --color-surface:  #ffffff;
  --color-bg:       #F8F9FB;
  --color-border:   rgba(0,0,0,0.08);
  --color-text:     #0D0F14;
  --color-muted:    #6B7280;
}
.dark {
  --color-surface:  #1A1D27;
  --color-bg:       #0F1117;
  --color-border:   rgba(255,255,255,0.08);
  --color-text:     #F1F2F5;
  --color-muted:    #9CA3AF;
}
```

---

## 18. Accessibility

### Required Standards

- **WCAG 2.1 AA** as minimum target
- **Color contrast:** 4.5:1 for body text, 3:1 for large text and UI components
- **Focus visible:** all interactive elements must have a visible focus indicator — `ring-2 ring-indigo-500 ring-offset-2`
- **Keyboard navigation:** all actions achievable by keyboard alone
- **Screen reader:** all icons have `aria-label` or `aria-hidden="true"` if decorative
- **Form labels:** every input has a `<label>` — never use placeholder as label
- **Error announcements:** use `role="alert"` for dynamic error messages
- **Modal trapping:** focus must be trapped inside open modals
- **`prefers-reduced-motion`:** all animations wrapped in a media query check

### Semantic HTML Rules

```
- Page titles: <h1> per page (only one)
- Card groups: <section> with aria-label
- Transaction list: <ul> with <li> items
- Table: proper <thead>, <tbody>, <th scope="col">
- Buttons vs Links: <button> for actions, <a> for navigation
```

---

## 19. Iconography

### Library

**Lucide React** — primary icon library. Consistent stroke width (1.5), clean geometric style.

### Usage Rules

1. **Size:** 16px for inline/compact, 20px for standard UI, 24px for actions, 32px+ for empty states
2. **Stroke width:** always `1.5` (Lucide default) — never bold icons in text
3. **Color:** icons inherit text color or use explicit muted color — never decorative color
4. **Semantic icons for finance:**

```typescript
TrendingUp    → income, positive trend
TrendingDown  → expense, negative trend
Wallet        → balance, total
ArrowUpRight  → income transaction
ArrowDownRight→ expense transaction
CreditCard    → fixed expense
Coffee        → "hormiga" (ant) expenses
Repeat        → recurring
Zap           → occasional/sporadic
PiggyBank     → savings
BarChart2     → statistics
CalendarDays  → date
Tag           → classification
StickyNote    → notes
Plus          → add transaction (FAB)
Pencil        → edit
Trash2        → delete
X             → close modal
ChevronRight  → expand / navigate
ChevronDown   → collapse / dropdown
```

5. **Never use emoji as icons** in the UI — only in suggestions/motivational text
6. **Icon + label:** always include visible text label for navigation items — not icon-only (except in dense lists)

---

## 20. Financial Charts

Charts are **exploratory**, placed below primary metrics. They support understanding, not primary decision-making.

### Chart Library: Recharts v3

Already installed and in use.

### Chart Types by Use Case

| Use Case | Chart Type |
|----------|-----------|
| Income vs Expense over time | Grouped BarChart |
| Monthly trend | LineChart with area fill |
| Category breakdown | Horizontal BarChart (not pie) |
| Spending limit progress | LinearProgress (not chart) |

> **No pie charts.** They are imprecise and hard to read. Use horizontal bar charts for breakdowns.

### Visual Rules

1. **Income:** `#22C55E` (green-500) — consistent always
2. **Expense:** `#EF4444` (red-500) — consistent always
3. **Neutral / Balance:** `#3B82F6` (blue-500)
4. **Grid lines:** very subtle — `stroke="#E5E7EB" strokeOpacity={0.4}`
5. **Axes:** hide vertical axis on bar charts — show value labels on bars instead
6. **Tooltip:** custom styled with glassmorphism — dark background, white text, no default MUI/Recharts style
7. **Animation:** `isAnimationActive={true}` with `animationDuration={500}` — only on mount, not on data updates
8. **Responsive:** always `<ResponsiveContainer width="100%" height={220}>`
9. **Legend:** minimal — below chart, use colored dots not squares
10. **Empty state:** when no data, show a placeholder with a message and a CTA — not an empty chart area

### Custom Tooltip Pattern

```tsx
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900/90 backdrop-blur-md border border-white/10 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {formatAmount(entry.value)}
        </p>
      ))}
    </div>
  );
};
```

---

## 21. Visual Density

### Density Levels

| Context | Density | Example |
|---------|---------|---------|
| Dashboard cards | Comfortable | `p-5`, large text |
| Transaction list (mobile) | Comfortable | `py-4 px-4`, two lines |
| Transaction table (desktop) | Compact | `py-3 px-4`, one line |
| Settings list | Comfortable | `py-4`, clear sections |
| Filter bar | Dense | `py-2`, small inputs |

### Rules

- **Never sacrifice readability for density** — if it feels cramped, add space
- **Financial amounts always have generous space around them** — they must never feel squeezed
- **Mobile screens:** prefer comfortable density — users are farther from screen
- **Desktop:** compact density acceptable in tables only
- **Avoid nesting cards inside cards** — creates visual confusion and excessive depth

---

## 22. What to Avoid

### Visual Anti-Patterns

- ❌ **Gradient text** — distracting, hard to read, feels cheap
- ❌ **Card borders in bright colors** — use left-border accent max 3px, or no border
- ❌ **Random color per category** — use the semantic color system only
- ❌ **All-caps paragraph text** — uppercase only for labels and column headers
- ❌ **Shadows on every element** — shadow signals elevation; overuse destroys the signal
- ❌ **Animations on every state change** — only on mount, route change, or explicit user action
- ❌ **Full-screen spinners** — use skeleton loaders for known layouts
- ❌ **Icon-only navigation without labels** — fails accessibility
- ❌ **Font sizes below 12px** — unreadable on mobile
- ❌ **More than 3 font weights on a single screen**
- ❌ **Pie charts** — imprecise and hard to compare
- ❌ **Alert modals for non-critical information** — use toast notifications instead
- ❌ **Overcrowded dashboards** — max 6 metric cards per section
- ❌ **Stacking MUI `Paper` inside MUI `Card` inside another `Paper`** — creates glass-in-glass noise

### UX Anti-Patterns

- ❌ **Inline delete without confirmation** — always show undo toast
- ❌ **Automatic redirect after save** — allow the user to continue or navigate
- ❌ **Required notes field** — notes are always optional
- ❌ **Blocking UI while saving** — optimistic updates + error rollback
- ❌ **Date fields defaulting to epoch (1970-01-01)** — always default to today

---

## 23. Component Architecture

### Directory Structure

```
app/
├── (website)/              ← route group with shared layout
│   ├── page.tsx            ← Dashboard
│   ├── transactions/
│   │   └── page.tsx
│   ├── categories/
│   │   └── page.tsx
│   └── settings/
│       └── page.tsx
├── components/             ← shared UI components
│   ├── ui/                 ← shadcn/ui primitives (Button, Card, Badge, etc.)
│   ├── charts/             ← chart components (BalanceChart, CategoryChart, etc.)
│   ├── financial/          ← domain components (MetricCard, TransactionRow, etc.)
│   ├── layout/             ← AppLayout, Sidebar, BottomNav, AppBar
│   └── modals/             ← TransactionModal, DetailsModal, ConfirmDialog
├── hooks/                  ← custom hooks
├── utils/                  ← pure utility functions (no React)
├── store/                  ← Zustand store
├── types/                  ← TypeScript types
└── locales/                ← translation JSON files
```

### Component Naming

- **Page-level:** `page.tsx` (Next.js convention)
- **Shared UI:** PascalCase — `MetricCard.tsx`, `TransactionRow.tsx`
- **Primitive wrappers:** PascalCase in `ui/` — `Button.tsx`, `Badge.tsx`, `Card.tsx`
- **Hooks:** camelCase, `use` prefix — `useTransactions.ts`, `useFormatCurrency.ts`
- **Utils:** camelCase — `classifySuggestion.ts`, `financialSuggestions.ts`

---

## 24. Conventions for New Components

### Required Props Pattern

```typescript
interface MetricCardProps {
  label: string;
  value: number | string;
  currency?: string;
  trend?: { value: number; direction: 'up' | 'down' };
  icon?: React.ReactNode;
  color?: 'green' | 'red' | 'blue' | 'purple' | 'amber';
  className?: string;
}
```

### Rules

1. **All components accept `className` prop** for external style overrides
2. **No hardcoded colors inside components** — use props or CSS variables
3. **All components are `'use client'` only if they need browser APIs or event handlers** — prefer RSC
4. **No `useStore()` inside UI primitives** — pass data via props; store access in page components only
5. **Financial amounts:** always receive `number`, format inside the component using the shared formatter
6. **Empty/null states:** handle inside the component — never leave it to the parent
7. **Loading state:** accept an optional `isLoading?: boolean` prop — show skeleton internally
8. **No inline styles** except where Tailwind cannot express it (e.g., dynamic transform values)

### Skeleton Pattern

```tsx
if (isLoading) {
  return <div className="h-24 rounded-xl bg-gray-200/60 dark:bg-white/5 animate-pulse" />;
}
```

---

## 25. Visual Consistency Rules

These rules apply to **every** component, every screen, every PR.

1. **Colors come from the defined palette only.** No ad-hoc hex values.
2. **Spacing follows the 4px grid.** No `px-[13px]` or `mt-[7px]`.
3. **Font sizes follow the defined scale.** No `text-[15.5px]`.
4. **Border radius follows the defined tokens.** No `rounded-[9px]`.
5. **One component = one responsibility.** A MetricCard shows a metric. It doesn't fetch data.
6. **Semantic color for finance is sacred:** green = income/positive, red = expense/negative. No exceptions.
7. **All text must pass 4.5:1 contrast** against its background.
8. **Every icon must be accompanied by a label** or have `aria-label`.
9. **`npx tsc --noEmit` must pass** after every change batch. No TypeScript errors left open.
10. **New components go in `components/`** with the appropriate subfolder. Never inline complex JSX in `page.tsx`.
11. **No MUI `sx` prop for new components.** Use Tailwind classes. MUI `sx` is only acceptable when modifying existing MUI-based components during migration.
12. **Glassmorphism only on cards with a distinct background layer.** Never glass-on-glass.
13. **No more than 6 metric cards per grid section.**
14. **Chart colors are fixed:** income = `#22C55E`, expense = `#EF4444`. Never random.
15. **Motivational phrase, suggestions, and limit bar are contextual** — they only appear when data exists.

---

## Frontend Migration Strategy

### Current State

| Technology | Status |
|-----------|--------|
| MUI v7 | Active — all components use it |
| Tailwind CSS | Installed, partially used (globals.css) |
| Recharts v3 | Active — charts working |
| shadcn/ui | Not installed |
| Framer Motion | Not installed |
| Lucide Icons | Not installed |
| MUI Icons | Active |

### Migration Philosophy

> **Never break what works.** Migrate progressively, screen by screen, component by component.
> The app must be functional at all times. No "big bang" rewrites.

The strategy is: **Add new, replace old, delete never prematurely.**

---

### Phase 1 — Foundation (No visual changes)

**Goal:** Install the new stack without touching any existing component.

**Steps:**
1. Install `shadcn/ui` — `npx shadcn@latest init` with CSS variables config
2. Install `framer-motion` — `npm install framer-motion`
3. Install `lucide-react` — `npm install lucide-react`
4. Configure Tailwind `tailwind.config.ts` with the color tokens from Section 3
5. Add CSS variables to `globals.css` for light/dark mode tokens
6. Add the `cn()` utility (`clsx` + `tailwind-merge`) to `lib/utils.ts`
7. Run `npx tsc --noEmit` — must be clean

**Files touched:** `package.json`, `tailwind.config.ts`, `globals.css`, `lib/utils.ts`  
**Files NOT touched:** Any `page.tsx`, any component

---

### Phase 2 — Primitive Components

**Goal:** Build the new component library in `components/ui/` without replacing anything yet.

**Components to create (shadcn/ui base + custom):**

```
components/ui/
  Button.tsx      ← replaces MUI Button
  Card.tsx        ← replaces MUI Paper/Card
  Badge.tsx       ← replaces MUI Chip
  Input.tsx       ← replaces MUI TextField
  Select.tsx      ← replaces MUI Select
  Dialog.tsx      ← replaces MUI Modal
  Progress.tsx    ← replaces MUI LinearProgress
  Skeleton.tsx    ← new
  Toggle.tsx      ← replaces MUI ToggleButtonGroup
```

```
components/financial/
  MetricCard.tsx  ← new component using Card from ui/
  AmountDisplay.tsx
  ClassificationBadge.tsx
  PeriodSelector.tsx
```

**Run:** `npx tsc --noEmit` after each component

---

### Phase 3 — Migrate TransactionModal

**Why first:** It's the highest-frequency interaction. Improving it has immediate user impact.

**What changes:**
- Replace MUI `Modal` → `Dialog` from `components/ui/`
- Replace `TextField` → `Input` from `components/ui/`
- Replace `Select` → `Select` from `components/ui/`
- Replace `ToggleButtonGroup` → `Toggle` from `components/ui/`
- Add Framer Motion slide-up animation (bottom sheet on mobile)
- Use Lucide icons (ArrowUpRight / ArrowDownRight for type toggle)
- Apply classification suggestion pills (not a select on mobile)

**Files touched:** `components/TransactionModal.tsx`  
**Files NOT touched:** `page.tsx`, `transactions/page.tsx`

---

### Phase 4 — Migrate Transaction List / Table

**What changes:**
- Mobile accordion → clean list rows with Framer Motion stagger entrance
- Desktop table → Tailwind-styled `<table>` with sticky header
- Replace MUI `Chip` for classification → `Badge` from `components/ui/`
- Replace `Accordion` → custom expandable row
- Add swipe-to-delete gesture (mobile)

**Files touched:** `(website)/transactions/page.tsx`, `components/TransactionDetailsModal.tsx`

---

### Phase 5 — Migrate Dashboard

**Why last among main screens:** It's the most complex — charts, metrics, suggestions, period filter.

**What changes:**
- Replace all MUI `Paper` cards → `MetricCard` from `components/financial/`
- Replace `ToggleButtonGroup` → `PeriodSelector`
- Replace `LinearProgress` → `Progress` from `components/ui/`
- Wrap metric card grid with Framer Motion `staggerChildren`
- Apply full color system and spacing system
- Remove all `sx={{...}}` props
- Suggestions section: collapsible on mobile with animation

**Files touched:** `(website)/page.tsx`

---

### Phase 6 — Migrate Layout and Navigation

**What changes:**
- Sidebar: Tailwind-styled, collapsible, with Framer Motion slide
- Bottom navigation: Tailwind-styled, respect safe-area-inset
- AppBar: Tailwind-styled, glassmorphism via CSS class (not MUI `sx`)
- Replace MUI `AppBar`, `Drawer`, `BottomNavigation`

**Files touched:** `components/AppLayout.tsx`, `components/Sidebar.tsx`

---

### Phase 7 — Migrate Settings and Categories

**Why last:** Lowest user-facing impact. Can stay MUI longer without degrading UX.

**Files touched:** `(website)/settings/page.tsx`, `(website)/categories/page.tsx`

---

### Migration Rules (always apply)

1. **Never delete MUI imports until the component is fully migrated.** Both can coexist.
2. **Each Phase ends with `npx tsc --noEmit` passing cleanly.**
3. **Test on mobile viewport first** after each Phase.
4. **Old data compatibility is never broken** — backward compat rules from the data model remain.
5. **One Phase = one PR (or one commit block).** Never mix Phase 3 and Phase 5 changes.
6. **Explain files to be touched before starting each Phase.**
7. **Do not add features during migration** — migration is cosmetic/structural only.

---

*Last updated: 2025-05-15*  
*Maintained by: Claude Code + project owner*
