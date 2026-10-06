---
name: kidmeal-uiux-promax
description: >
  KidMeal UI/UX ProMax Design System — The definitive reference for creating premium,
  production-grade React + Tailwind CSS components. Covers design tokens, color palette,
  typography, spacing, layout shells, component patterns (modals, cards, tables, forms,
  badges, toasts), micro-animations, responsive design, accessibility, and Vietnamese
  localization conventions used throughout the KidMeal preschool nutrition system.
---

# 🎨 KidMeal UI/UX ProMax Design System

> **This skill is the single source of truth for ALL frontend design decisions in KidMeal.**
> Every component, layout, page, and animation MUST follow these standards to maintain
> visual consistency and premium quality across the entire application.

---

## 1. Design Philosophy

### 1.1 Core Principles
1. **Premium & Professional**: Every screen must feel like a polished SaaS product. No generic, bare-bones MVPs.
2. **Warm & Approachable**: Preschool context → soft rounded corners, friendly colors, natural imagery.
3. **Information Dense but Clean**: Dashboard-heavy app → maximize data display without clutter.
4. **Motion with Purpose**: Every animation serves UX (feedback, hierarchy, delight) — never gratuitous.
5. **Vietnamese-First**: All labels, placeholders, and copy in Vietnamese. Use standard educational terminology.

### 1.2 Visual Identity Keywords
`Clean` · `Warm` · `Trustworthy` · `Professional` · `Modern` · `Friendly` · `Data-rich`

---

## 2. Design Tokens

### 2.1 Color Palette

#### Brand Colors (Tailwind Custom)
```javascript
// tailwind.config.js → theme.extend.colors
brand: {
  50:  '#f0fdf4',    // Lightest green (backgrounds)
  100: '#dcfce7',    // Light green (hover states)
  500: '#22c55e',    // Primary green (CTA buttons, active states)
  600: '#16a34a',    // Pressed state
  700: '#15803d',    // Dark variant
},
warm: {
  50:  '#fffbeb',    // Lightest amber (secondary backgrounds)
  100: '#fef3c7',    // Light amber
  500: '#f59e0b',    // Energy yellow (highlights, warnings)
}
```

#### Semantic Color Map
| Purpose                | Light Mode                              | Usage                                       |
|------------------------|-----------------------------------------|---------------------------------------------|
| **Page Background**    | `bg-[#f8fafc]`                         | All page shells                             |
| **Card Background**    | `bg-white`                              | All card/panel surfaces                     |
| **Card Border**        | `border-slate-200` or `border-slate-200/80` | Subtle card borders                     |
| **Primary Text**       | `text-slate-800` or `text-slate-900`   | Headings, body text                         |
| **Secondary Text**     | `text-slate-500` or `text-slate-400`   | Descriptions, timestamps, placeholders      |
| **Muted Text**         | `text-slate-300`                        | Disabled states, separators                 |
| **Primary Action**     | `bg-emerald-600 hover:bg-emerald-700`  | Main CTA buttons                            |
| **Secondary Action**   | `bg-slate-100 hover:bg-slate-200`      | Secondary/cancel buttons                    |
| **Danger**             | `bg-red-500 text-white`                 | Delete, error states                        |
| **Success**            | `bg-emerald-100 text-emerald-800`      | Success badges, confirmations               |
| **Warning**            | `bg-amber-100 text-amber-800`          | Warning badges, alerts                      |
| **Info**               | `bg-blue-100 text-blue-800`            | Informational badges                        |
| **Sidebar BG**         | `bg-white`                              | Admin sidebar                               |
| **Topbar BG**          | `bg-white border-b border-slate-200/90` | Nutritionist topbar                        |
| **Active Nav**         | `bg-teal-50 text-teal-800 border-teal-500` | Active sidebar/tab item               |
| **Floating Bar**       | `bg-slate-900/95 backdrop-blur-md`     | Quick nav floating bar                      |

#### Domain-Specific Colors
| Domain                 | Primary Color                          | Usage Context                               |
|------------------------|---------------------------------------|---------------------------------------------|
| Nutritionist Portal    | Emerald (`#22c55e`, `#16a34a`)        | NutriKid brand, food/nutrition              |
| Admin/Principal Portal | Teal (`#0d9488`, `#14b8a6`)           | KidMeal BGH, management                    |
| Teacher Tablet         | Blue (`#3b82f6`, `#2563eb`)           | Attendance, classroom                       |
| Kitchen Display (KDS)  | Amber/Orange (`#f59e0b`, `#f97316`)   | Kitchen alerts, portions                    |
| Parent Portal          | Violet (`#8b5cf6`, `#7c3aed`)         | Payments, child tracking                    |

### 2.2 Typography

#### Font Stack
```css
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
               "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

#### Type Scale
| Element              | Classes                                              | Usage                     |
|----------------------|------------------------------------------------------|---------------------------|
| Page Title           | `text-xl font-extrabold text-slate-900`             | Main page heading         |
| Section Title        | `text-lg font-bold text-slate-900`                  | Card/section heading      |
| Subtitle             | `text-sm font-bold text-slate-800`                  | Sub-section heading       |
| Body                 | `text-sm text-slate-700`                             | Regular text              |
| Caption              | `text-xs text-slate-500`                             | Timestamps, hints         |
| Tiny Label           | `text-[11px] font-bold text-slate-400 uppercase tracking-wider` | Section labels |
| Badge Text           | `text-[10px] font-black uppercase tracking-wider`   | Status badges             |
| Number Display       | `text-2xl font-extrabold text-slate-900`            | Dashboard KPI numbers     |
| Breadcrumb           | `text-xs font-medium text-slate-500`                | Navigation breadcrumbs    |

### 2.3 Spacing & Layout

#### Spacing Scale
```
Gap between cards:        gap-4 (16px) or gap-6 (24px)
Card padding:             p-4 (16px) to p-8 (32px)
Section spacing:          space-y-6 (24px) or space-y-8 (32px)
Inline element gap:       gap-1.5 (6px) to gap-3 (12px)
Button internal padding:  px-3.5 py-1.5 (small) / px-4 py-2 (medium) / px-6 py-3 (large)
```

#### Border Radius Scale
```
Buttons (small):    rounded-xl (12px)
Buttons (large):    rounded-2xl (16px)
Cards:              rounded-2xl (16px) or rounded-3xl (24px)
Badges:             rounded-full
Input fields:       rounded-xl (12px)
Modal:              rounded-3xl (24px)
Avatar:             rounded-full
Logo containers:    rounded-2xl (16px)
```

### 2.4 Shadows
```
Card default:        shadow-xs  (very subtle)
Card hover:          shadow-md  (medium on interaction)
Modal:               shadow-2xl (dramatic)
Floating bar:        shadow-2xl
Primary button:      shadow-md shadow-emerald-600/25 (colored shadow)
Dropdown:            shadow-xl
```

---

## 3. Layout Shells

### 3.1 Admin Dashboard Layout (Sidebar + Main)
```
┌─────────────────────────────────────────────────────┐
│ Sidebar (w-64)              │ Main Content Area      │
│ ┌─────────────────────────┐ │ ┌─────────────────────┐│
│ │ Logo + School Name      │ │ │ Topbar: Breadcrumb  ││
│ │ Portal Badge            │ │ │ + Actions + Profile ││
│ │ ───────────────────     │ │ ├─────────────────────┤│
│ │ Nav Item (active)  ▌    │ │ │                     ││
│ │ Nav Item               │ │ │   Page Content      ││
│ │ Nav Item               │ │ │   (Outlet)          ││
│ │ ...                    │ │ │                     ││
│ │                        │ │ │                     ││
│ │ ───────────────────     │ │ │                     ││
│ │ Support Footer          │ │ └─────────────────────┘│
│ └─────────────────────────┘ │                        │
└─────────────────────────────────────────────────────┘
```

**Key classes:**
```tsx
// Root container
<div className="flex h-screen bg-[#f8fafc] font-sans antialiased text-slate-800">

// Sidebar
<aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shadow-xs z-30">

// Main content area
<main className="flex-1 overflow-y-auto">
  <div className="max-w-7xl mx-auto px-6 py-6">
    {/* Page content */}
  </div>
</main>
```

### 3.2 Nutritionist Layout (Topbar + Tabs)
```
┌───────────────────────────────────────────────────────────┐
│ Topbar Row 1: Logo | Search Bar | Notifications | Profile │
│ Topbar Row 2: Tab1 | Tab2 | Tab3 | ... | Tab10           │
├───────────────────────────────────────────────────────────┤
│                                                           │
│                    Page Content (Outlet)                   │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

**Key classes:**
```tsx
// Root container
<div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">

// Header (sticky)
<header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Row 1: h-16, Row 2: tabs */}
  </div>
</header>

// Content
<main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
```

### 3.3 Kitchen Display System (KDS) — Full-Screen
```tsx
<div className="h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
  {/* Dark theme, no sidebar, full-screen grid of portion cards */}
```

### 3.4 Teacher Tablet — Touch-Optimized
```tsx
<div className="min-h-screen bg-blue-50">
  {/* Large touch targets (min 48px), simplified navigation */}
```

---

## 4. Component Patterns

### 4.1 Modal (Portal-Based)

**ALWAYS use `createPortal` for modals.** This is a project-wide convention.

```tsx
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;  // 'max-w-md' | 'max-w-lg' | 'max-w-2xl' | 'max-w-5xl'
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className={`relative bg-white rounded-3xl shadow-2xl ${maxWidth} w-full p-4 sm:p-8 overflow-hidden z-10 max-h-[92vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <span className="font-bold text-slate-800 text-sm">{title}</span>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto pt-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
```

**Modal Design Rules:**
- `z-[10000]` for modal layer
- Backdrop: `bg-slate-950/70 backdrop-blur-md` (blur 12px)
- Panel: `rounded-3xl shadow-2xl`, max-height `92vh`
- Always include close button (X icon in `rounded-full bg-slate-100`)
- Animate entry: `animate-in zoom-in-95 duration-200`

### 4.2 Card

```tsx
// Standard card
<div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
  <h3 className="text-sm font-bold text-slate-800 mb-3">Card Title</h3>
  {/* Content */}
</div>

// Interactive card (hover effect)
<div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 p-6 cursor-pointer">
  {/* Content */}
</div>

// Highlighted card (colored left border)
<div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 border-l-4 border-l-emerald-500">
  {/* Content */}
</div>

// KPI/Stat card
<div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
      <Users className="w-5 h-5 text-emerald-600" />
    </div>
    <div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Học Sinh</p>
      <p className="text-2xl font-extrabold text-slate-900">248</p>
    </div>
  </div>
</div>
```

### 4.3 Status Badge

```tsx
// Badge color map (consistent across the entire app)
const badgeStyles = {
  // Status badges
  active:    'bg-emerald-100 text-emerald-800 border border-emerald-200/60',
  inactive:  'bg-slate-100 text-slate-600 border border-slate-200',
  pending:   'bg-amber-100 text-amber-800 border border-amber-200/60',
  error:     'bg-red-100 text-red-800 border border-red-200/60',
  info:      'bg-blue-100 text-blue-800 border border-blue-200/60',

  // Domain-specific
  approved:  'bg-emerald-100 text-emerald-800',
  rejected:  'bg-red-100 text-red-800',
  draft:     'bg-slate-100 text-slate-600',
  published: 'bg-teal-100 text-teal-800',
  paid:      'bg-green-100 text-green-800',
  overdue:   'bg-rose-100 text-rose-800',
};

// Badge component
<span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${badgeStyles.active}`}>
  Hoạt động
</span>
```

### 4.4 Button Variants

```tsx
// Primary CTA
<button className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 flex items-center gap-1.5 transition">
  <Plus className="w-4 h-4" /> Thêm mới
</button>

// Secondary
<button className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 transition">
  <Filter className="w-4 h-4" /> Lọc
</button>

// Danger
<button className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-md shadow-red-500/25 flex items-center gap-1.5 transition">
  <Trash2 className="w-4 h-4" /> Xóa
</button>

// Ghost/Subtle
<button className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-xs font-medium transition">
  Hủy
</button>

// AI/Special
<button className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-violet-600/25 flex items-center gap-1.5 transition">
  <Sparkles className="w-4 h-4" /> Tạo AI
</button>
```

### 4.5 Form Inputs

```tsx
// Text input
<div>
  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tên học sinh</label>
  <input
    type="text"
    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
    placeholder="Nhập tên đầy đủ..."
  />
</div>

// Select
<select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition">
  <option value="">Chọn lớp...</option>
</select>

// Search input
<div className="relative">
  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
  <input
    type="text"
    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
    placeholder="Tìm kiếm..."
  />
</div>
```

### 4.6 Table

```tsx
<div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
  <table className="w-full">
    <thead>
      <tr className="bg-slate-50/80">
        <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Tên món ăn
        </th>
        {/* ... more headers */}
      </tr>
    </thead>
    <tbody>
      <tr className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
        <td className="px-4 py-3 text-sm text-slate-700 font-medium">
          Cháo gà hầm rau củ
        </td>
        {/* ... more cells */}
      </tr>
    </tbody>
  </table>
</div>
```

### 4.7 Empty State

```tsx
<div className="text-center py-16">
  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
    <Inbox className="w-8 h-8 text-slate-300" />
  </div>
  <h3 className="text-sm font-bold text-slate-500 mb-1">Chưa có dữ liệu</h3>
  <p className="text-xs text-slate-400 mb-4">Bắt đầu bằng cách thêm mới bên dưới.</p>
  <button className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">
    + Thêm mới
  </button>
</div>
```

### 4.8 Loading Skeleton

```tsx
// Skeleton pulse animation
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-slate-200 rounded-lg w-3/4"></div>
  <div className="h-4 bg-slate-200 rounded-lg w-1/2"></div>
  <div className="h-32 bg-slate-200 rounded-2xl"></div>
</div>
```

### 4.9 Toast / Notification Message

```tsx
// Success message (inline)
{message?.type === 'success' && (
  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-emerald-800">
    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
    <span className="font-medium">{message.text}</span>
  </div>
)}

// Error message (inline)
{message?.type === 'error' && (
  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-red-800">
    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
    <span className="font-medium">{message.text}</span>
  </div>
)}
```

### 4.10 Tab Navigation (Horizontal)

```tsx
// Nutritionist-style horizontal tabs
<div className="flex items-center gap-1 overflow-x-auto py-2">
  {tabs.map((tab) => (
    <Link
      key={tab.path}
      to={tab.path}
      className={`whitespace-nowrap px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
        isActive(tab.path)
          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
      }`}
    >
      {tab.label}
    </Link>
  ))}
</div>
```

### 4.11 Sidebar Navigation Item

```tsx
// Admin sidebar nav item
<Link
  to={item.path}
  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
    isActive
      ? 'bg-teal-50 text-teal-800 border-l-[3px] border-teal-600'
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
  }`}
>
  <item.icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
  {item.label}
</Link>
```

---

## 5. Micro-Animations & Transitions

### 5.1 Standard Transitions
```css
/* Applied to ALL interactive elements */
transition                     /* Tailwind: applies all properties, 150ms ease */
transition-all duration-200    /* Smoother, 200ms */
transition-colors              /* Only color changes */
transition-transform           /* Only transforms (hover:scale) */
```

### 5.2 Custom Animations (in index.css)

```css
/* Floating emoji (Login page) */
@keyframes login-float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-12px) rotate(3deg); }
}

/* Error shake */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  50% { transform: translateX(6px); }
  75% { transform: translateX(-4px); }
}
.animate-shake { animation: shake 0.4s ease-in-out; }

/* Fade in (for dynamic elements) */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn { animation: fadeIn 0.3s ease-out; }

/* Pulse dot (active status indicator) */
.animate-pulse  /* Built-in Tailwind — use for online/active dots */

/* Skeleton loading */
.animate-pulse  /* Built-in Tailwind — use for skeleton placeholders */
```

### 5.3 Interaction Patterns
```tsx
// Button hover scale
className="hover:scale-105 transition-transform"

// Card hover lift
className="hover:shadow-md hover:border-slate-300 transition-all duration-200"

// Nav item hover
className="hover:bg-slate-50 hover:text-slate-900 transition-all duration-150"

// Modal entry
className="animate-in zoom-in-95 duration-200"
```

---

## 6. Icon System

### 6.1 Icon Library
**Lucide React** (`lucide-react`) — the ONLY icon library used in KidMeal.

### 6.2 Icon Sizing Convention
```
Navigation icons:     w-4 h-4 (16px) or w-5 h-5 (20px)
Button icons:         w-4 h-4 (16px)
KPI card icons:       w-5 h-5 (20px)
Empty state icons:    w-8 h-8 (32px)
Page header icons:    w-5 h-5 to w-6 h-6
```

### 6.3 Icon Color Convention
```
Active nav icon:      text-teal-600 or text-emerald-600
Inactive nav icon:    text-slate-400
Button icon:          Same color as button text (inherits)
Decorative icon:      text-slate-300
Status icon (success): text-emerald-600
Status icon (error):   text-red-600
Status icon (warning): text-amber-600
```

---

## 7. Responsive Design

### 7.1 Breakpoint Strategy
```
Mobile-first approach with Tailwind breakpoints:
sm:  640px   – Small tablets
md:  768px   – Tablets / landscape
lg:  1024px  – Desktop
xl:  1280px  – Wide desktop
2xl: 1536px  – Ultra-wide
```

### 7.2 Layout Rules
- **Sidebar**: Hidden on mobile, visible `md:` and above
- **Floating nav bar**: Visible on all sizes, scrollable horizontally on mobile
- **Cards**: Stack vertically on mobile (`grid-cols-1`), grid on desktop (`md:grid-cols-2 lg:grid-cols-3`)
- **Tables**: Horizontally scrollable on mobile (`overflow-x-auto`)
- **Modals**: Full-width on mobile (`p-2`), centered with padding on desktop (`sm:p-4`)
- **Login page emoji**: Hidden on mobile (`login-emoji { display: none }` at `max-width: 640px`)

### 7.3 Touch Target Minimums
- **Teacher Tablet**: All interactive elements min **48×48px**
- **Kitchen Display**: Button size min **56×56px**
- **Desktop portals**: Standard web sizes (32×32px minimum)

---

## 8. Data Visualization (Recharts)

### 8.1 Chart Color Palette
```typescript
const CHART_COLORS = [
  '#22c55e',  // Emerald (primary)
  '#3b82f6',  // Blue
  '#f59e0b',  // Amber
  '#ef4444',  // Red
  '#8b5cf6',  // Violet
  '#06b6d4',  // Cyan
  '#f97316',  // Orange
  '#ec4899',  // Pink
];
```

### 8.2 Chart Styling
```tsx
// Standard chart container
<div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
  <h3 className="text-sm font-bold text-slate-800 mb-4">Biểu đồ phân bố P:L:G</h3>
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
      <Tooltip
        contentStyle={{
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        }}
      />
      <Bar dataKey="value" fill="#22c55e" radius={[6, 6, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
</div>
```

---

## 9. Vietnamese Localization Conventions

### 9.1 UI Labels (Standard Terms)
```
Dashboard     → Tổng quan / Dashboard
Create        → Thêm mới / Tạo mới
Edit          → Chỉnh sửa
Delete        → Xóa
Save          → Lưu
Cancel        → Hủy
Search        → Tìm kiếm
Filter        → Lọc
Export        → Xuất / Tải về
Import        → Nhập
Approve       → Phê duyệt
Reject        → Từ chối
Submit        → Gửi
Confirm       → Xác nhận
Loading       → Đang tải...
No Data       → Chưa có dữ liệu
Error         → Lỗi
Success       → Thành công
```

### 9.2 Domain-Specific Terms
```
Nutritionist  → Chuyên gia Dinh dưỡng
Principal     → Hiệu trưởng / Ban Giám Hiệu (BGH)
Teacher       → Giáo viên
Kitchen Staff → Nhân viên Bếp
Parent        → Phụ huynh
Child/Student → Học sinh / Trẻ
Class         → Lớp học
Menu          → Thực đơn
Meal          → Bữa ăn
Breakfast     → Bữa sáng
Lunch         → Bữa trưa
Snack         → Bữa xế / Ăn xế
Ingredient    → Nguyên liệu
Dish/Recipe   → Món ăn / Công thức
Allergen      → Dị ứng nguyên
Inspection    → Kiểm thực
Sample        → Lưu mẫu
Growth        → Tăng trưởng / Phát triển thể chất
```

### 9.3 Date & Number Formatting
```typescript
// Date: DD/MM/YYYY format
new Date().toLocaleDateString('vi-VN')  // "04/10/2026"

// Currency: VND
new Intl.NumberFormat('vi-VN').format(150000) + ' đ'  // "150.000 đ"

// Percentage
`${value.toFixed(1)}%`  // "14.5%"
```

---

## 10. File Organization Convention

### 10.1 Frontend Feature Structure
```
features/{feature-name}/
├── components/          # React components (PascalCase)
│   ├── FeatureCard.tsx
│   ├── FeatureModal.tsx
│   └── FeatureTable.tsx
├── pages/               # Page-level components (route targets)
│   └── FeaturePage.tsx
├── hooks/               # Custom hooks (optional)
│   └── useFeatureData.ts
└── api/                 # API layer (optional, or use core/api)
    └── feature.api.ts
```

### 10.2 Naming Conventions
```
Components:    PascalCase     → UserProfileModal.tsx
Pages:         PascalCase     → ChildrenManagementPage.tsx
API files:     kebab-case     → user-profile.api.ts
Store files:   kebab-case     → auth.store.ts
CSS files:     kebab-case     → index.css
Config files:  kebab-case     → tailwind.config.js
```

---

## 11. Accessibility (A11y) Essentials

1. **All images**: Include `alt` text (Vietnamese description).
2. **Interactive elements**: Include `aria-label` when visual label is insufficient.
3. **Focus visible**: Use `focus:outline-none focus:ring-2 focus:ring-emerald-500/30` on inputs/buttons.
4. **Color contrast**: Maintain WCAG AA (4.5:1 for text, 3:1 for large text).
5. **Keyboard nav**: All modals closable with `Escape` key.
6. **Semantic HTML**: Use `<header>`, `<main>`, `<aside>`, `<nav>`, `<section>`, `<article>`.

---

## 12. Anti-Patterns (DO NOT DO)

❌ **Never** use inline styles except for `backdropFilter` (Safari fix).
❌ **Never** use generic colors (`bg-red-500` for CTA — use emerald).
❌ **Never** use `<div>` for buttons — use `<button>` or `<a>`.
❌ **Never** use `alert()` or `confirm()` — use custom modals.
❌ **Never** use default browser fonts — always load Inter.
❌ **Never** mix rounded-md and rounded-3xl — follow the radius scale.
❌ **Never** use bare-bones HTML tables — always wrap in styled card container.
❌ **Never** leave empty states without a message and CTA.
❌ **Never** use raw hex colors in JSX — use Tailwind classes or design tokens.
❌ **Never** create modals without backdrop blur.
