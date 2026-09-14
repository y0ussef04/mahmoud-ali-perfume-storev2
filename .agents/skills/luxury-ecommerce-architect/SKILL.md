---
name: luxury-ecommerce-architect
description: >-
  Builds, designs, or refactors ultra-luxury e-commerce stores and modern web applications with Arabian/Gulf luxury aesthetics, Next.js App Router, Supabase backend, responsive mobile-first UI, streamlined checkout, and matching admin dashboards.
---

# Luxury E-Commerce Architect (مهندس المتاجر الإلكترونية الفاخرة)

Use this skill whenever you need to build a new e-commerce store, transform an existing store, or create any high-end modern web application inspired by the **Mahmoud Ali Perfume Store** standard.

---

## 1. The Core Philosophy & Identity

Every project built with this skill must embody **Three Non-Negotiable Pillars**:

1. **Ultra-Luxury Arabesque & Minimalist Modern Aesthetic**:
   - Deep Obsidian Dark Mode & Warm Ivory Light Mode.
   - Brushed Metallic Gold Accents (`#C9A84C`, `#8B6914`, `#DFB757`).
   - Frosted Glassmorphism (`backdrop-blur-md`) with ultra-fine border definition.
   - Atmospheric Radial Lighting (golden ambient glows, never flat colors).
2. **Frictionless Mobile-First Experience (RTL Native)**:
   - Full Arabic RTL ergonomics (`dir="rtl"`), font pairings (Cairo / Tajawal / Outfit / IBM Plex Sans Arabic).
   - **Sephora-Style 2-Column Mobile Grid**: Never huge 1-column billboards or distorted images; use balanced 2-column mobile cards with `aspect-square` containers and `object-contain` so photos are never cropped.
   - **Anti-Zoom Mobile Viewport Lock**: Strict `viewportFit: 'cover'`, `initialScale: 1, maximumScale: 1, userScalable: false`, with `overflow-x: hidden` to prevent browsers from zooming out due to background lighting orbs.
   - **Native Mobile Bottom Navigation Dock**: Sleek thumb-friendly bar with safe-area insets (`env(safe-area-inset-bottom)`), micro dot active indicator, and icon-only cart badge.
   - **Footer Clearance**: The copyright bar and toast notifications must have bottom padding (`pb-24 md:pb-0`) to ensure they are never covered by the fixed bottom navigation bar.
   - **High-Converting 3-Step Checkout**: Instant cash-on-delivery & online payment cards with governorate rate calculator.
   - **Compact Mobile Trust Bar**: Refined 3-item horizontal micro-strip taking minimal vertical height (<55px).
3. **Harmonized Two-Faced Architecture (Storefront + Admin)**:
   - The Admin Dashboard MUST share the exact same aesthetic DNA, colors, typography, and polish as the public storefront. No generic admin themes.

---

## 2. Standard Technology Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | High-performance hybrid SSR/SSG with zero-CLS page transitions |
| **Styling** | Tailwind CSS + CSS Variables | Semantic design tokens for dual-theme support |
| **Icons** | Lucide React | Minimalist line icons (stroke width 1.5–1.75) |
| **Animations** | Framer Motion | Staggered reveals, slide-overs, shimmer shine effects |
| **Database & Auth** | Supabase (PostgreSQL + Auth + Storage) | Real-time data, secure RLS, asset buckets |
| **Notifications** | Sonner / Custom Toasts | Discreet glass notifications lifted above mobile nav |

---

## 3. Design System & Tokens Reference

Always consult the design tokens guide:
👉 [Design Tokens & Theme Guide](./references/design-tokens.md)

### Key Palette:
```css
/* Dark Mode (Obsidian & Antique Gold) */
--bg-primary: #12110C;
--bg-surface: #1A1814;
--bg-card: #221F1A;
--border-subtle: #2E2B22;
--gold-primary: #C9A84C;
--gold-accent: #DFB757;
--gold-dark: #8B6914;

/* Light Mode (Warm Cream & Rich Bronze) */
--bg-primary-light: #FAF9F5;
--bg-surface-light: #FFFFFF;
--border-subtle-light: #E8E6E1;
--text-primary-light: #1A1814;
--text-muted-light: #6B6760;
```

---

## 4. Architectural Blueprints

When building or updating pages, use the pre-tested component blueprints:
👉 [Component Blueprints](./references/component-blueprints.md)

Included blueprints:
1. **Viewport & Overflow Lock**: Next.js App Router viewport config and CSS overflow isolation.
2. **Compact Trust Bar**: Sleek 3-column micro-strip for mobile and desktop.
3. **Product Card & 2-Column Mobile Grid**: Sephora-style 2-column mobile grid with `object-contain` framing.
4. **Mobile Bottom Navigation Dock**: Sleek thumb-friendly dock with safe-area padding and active dots.
5. **Footer with Bottom Nav Clearance**: Extra bottom padding preventing bottom dock overlap.
6. **Luxury Header**: Glass sticky navbar with compact icon-only cart badge.
7. **Checkout Stepper**: 3-step modern pill wizard with payment selection & order summary.
8. **Admin Dashboard Shell & Tables**: Framed glass tables with status badges and actions.

---

## 5. Step-by-Step Implementation Workflow for New Stores

Follow this battle-tested checklist when kicking off any new store:
👉 [Project Launch Checklist](./references/project-checklist.md)

### Phase Summary:
1. **Foundation**: Setup Next.js App Router, Tailwind tokens, Supabase client, RTL metadata, and viewport lock.
2. **Store Layout**: Implement RootLayout with fonts, ThemeProvider, Header, MobileNav with safe-area, and Footer with clearance.
3. **Core Storefront**: Build Hero, Compact Trust Bar, Featured Collections, and 2-Column Product Grid.
4. **Product Details & Cart**: Gallery with object-contain, variant selector, floating AddToCart bar on mobile, drawer cart.
5. **Streamlined Checkout**: Step-by-step checkout with governorate shipping calculator and COD support.
6. **Order Tracking**: Customer `/track` page with timeline progress bar.
7. **Unified Admin**: Dashboard KPIs, Orders manager, Products catalog, Coupons, and Shipping rates.
8. **Performance & Verification**: Image optimization, dynamic routes verification, and clean build test.

---

## 6. Golden Rules for Antigravity Agents

1. **Never use giant 1-column billboard product cards on mobile**: Always default to a balanced 2-column mobile grid (`grid-cols-2 lg:grid-cols-4`) like Sephora, Noon, and Zara.
2. **Never allow product images to be cropped or distorted**: Always wrap photos in an aspect-ratio container with `object-contain p-1.5 sm:p-2` so logos and bottles fit perfectly.
3. **Lock mobile viewport to 1:1 scale**: Always export `viewportFit: 'cover'`, `initialScale: 1`, and add `overflow-x-hidden` on `html, body` and any section with wide ambient lighting orbs to prevent browser zoom-out.
4. **Ensure the bottom nav bar never covers the footer**: Always add bottom padding (`pb-24 md:pb-0`) to the footer copyright bar and lift toasts (`bottom-20 md:bottom-6`).
5. **Never use generic browser alerts or plain tables**: All data must be wrapped in rounded, bordered glass containers with clear column alignments.
6. **Header Cart Icon must remain minimal**: Use an icon-only button (`w-9 h-9`) with a floating pill badge, not a bulky labeled button.
7. **Always include empty states and loading skeletons**: Never show blank screens during fetch or search; provide shimmering skeletons matching the 2-column layout.
8. **Keep build clean**: Validate production build (`next build`) before signing off.
