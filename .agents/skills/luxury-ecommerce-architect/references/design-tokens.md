# Luxury Design Tokens & Theme Specification

This reference contains the exact color variables, typography, glassmorphic styles, and Tailwind utilities that define the ultra-luxury aesthetic.

---

## 1. Palette & Colors

### Dark Mode (The Obsidian & Gold Theme)
- **Background Deep Canvas**: `#12110C` (Warm Obsidian / charcoal-black, never pure `#000000`)
- **Card / Surface Background**: `#1A1814` (Deep mocha obsidian with warmth)
- **Elevated Surface**: `#221F1A`
- **Subtle Borders**: `#2E2B22` (Warm metallic charcoal)
- **Primary Gold**: `#C9A84C` (Antique brushed gold)
- **Light Gold / Hover**: `#DFB757`
- **Soft Gold Highlight**: `#E8D9B3`
- **Deep Bronze / Gold Dark**: `#8B6914`
- **Primary Text**: `#F5F5F0` (Soft warm ivory, never blinding `#FFFFFF`)
- **Muted Text**: `#A09C94` (Warm gray-stone)

### Light Mode (The Warm Cream & Amber Theme)
- **Background Canvas**: `#FAF9F5` (Refined warm cream / parchment)
- **Card / Surface Background**: `#FFFFFF` (Clean porcelain)
- **Subtle Borders**: `#E8E6E1` (Warm soft stone)
- **Primary Dark Text**: `#1A1814` (Deep rich espresso)
- **Secondary Dark Text**: `#3D3A34`
- **Muted Text**: `#6B6760`
- **Gold Accents**: `#C9A84C` / `#B38F3B`

---

## 2. Typography

Always enforce modern Arabic-first typography:
- **Font Stack**: `Tajawal`, `Cairo`, or `Outfit`
- **RTL Setting**: `dir="rtl"` in `<html>` and `lang="ar"`
- **Heading Styles**:
  - `font-bold tracking-tight text-[#1A1814] dark:text-[#F5F5F0]`
- **Subheadings**:
  - `text-sm text-[#6B6760] dark:text-[#A09C94] leading-relaxed`

---

## 3. Signature Visual Effects

### Frosted Glassmorphism
```css
/* Card & Header Backdrop */
bg-white/80 dark:bg-[#1A1814]/80 backdrop-blur-md border border-[#E8E6E1] dark:border-[#2E2B22]
```

### Ambient Atmospheric Radial Glows
```jsx
{/* Top Golden Light Glow */}
<div className="pointer-events-none absolute -inset-x-20 -top-20 h-64 bg-radial from-[#C9A84C]/12 via-transparent to-transparent opacity-80 blur-2xl" />
```

### Golden Shimmer Button
```jsx
<button className="group/btn relative overflow-hidden bg-gradient-to-r from-[#1A1814] to-[#2D2921] dark:from-[#C9A84C] dark:to-[#8B6914] text-white rounded-full px-8 py-3.5 font-semibold text-sm transition-all duration-300 active:scale-[0.97] shadow-lg shadow-[#1A1814]/10 dark:shadow-[#C9A84C]/20">
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
  <span className="relative">استكشف المجموعة</span>
</button>
```

### Tailwind Keyframe for Shimmer
```js
// tailwind.config.js
keyframes: {
  shimmer: {
    '100%': { transform: 'translateX(100%)' },
  },
}
```

---

## 4. Standard Status Badge Colors

Used across admin tables, order statuses, and tracking steps:

| Status | Badge Background & Text (Dark / Light) | Dot Color |
| :--- | :--- | :--- |
| **New / قيد الانتظار** | `bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20` | `bg-amber-500` |
| **Confirmed / مؤكد** | `bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20` | `bg-blue-500` |
| **Shipped / في الطريق** | `bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20` | `bg-purple-500` |
| **Delivered / مكتمل** | `bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20` | `bg-emerald-500` |
| **Cancelled / ملغي** | `bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20` | `bg-rose-500` |
