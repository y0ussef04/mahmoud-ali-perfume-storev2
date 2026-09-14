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
   - Full Arabic RTL ergonomics (`dir="rtl"`), font pairings (Cairo / Tajawal / Outfit).
   - Bottom navigation dock for mobile thumbs, sticky luxury headers with icon-only badges.
   - High-converting 3-step checkout with instant cash-on-delivery & online payment cards.
   - Symmetrical, perfectly aligned trust badges stacked neatly on mobile.
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
| **Notifications** | Sonner / Custom Toasts | Discreet glass notifications |

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
1. **Hero Section**: Atmospheric perfume/luxury background with shimmer CTA.
2. **Trust Bar**: Stacked symmetric mobile cards & 3-column desktop layout.
3. **Product Card**: Hover-zoom imagery, status badges, and quick-add feedback.
4. **Luxury Header**: Glass sticky navbar with compact icon-only cart badge.
5. **Checkout Stepper**: 3-step modern pill wizard with payment selection & order summary.
6. **Admin Dashboard Shell & Tables**: Framed glass tables with status badges and actions.

---

## 5. Step-by-Step Implementation Workflow for New Stores

Follow this battle-tested checklist when kicking off any new store:
👉 [Project Launch Checklist](./references/project-checklist.md)

### Phase Summary:
1. **Foundation**: Setup Next.js App Router, Tailwind tokens, Supabase client, and RTL metadata.
2. **Store Layout**: Implement RootLayout with fonts, ThemeProvider, Header, MobileNav, and Footer.
3. **Core Storefront**: Build Hero, Trust Bar, Featured Collections, and Product Grid.
4. **Product Details & Cart**: Gallery, variant selector, floating AddToCart bar on mobile, drawer cart.
5. **Streamlined Checkout**: Step-by-step checkout with governorate shipping calculator and COD support.
6. **Order Tracking**: Customer `/track` page with timeline progress bar.
7. **Unified Admin**: Dashboard KPIs, Orders manager, Products catalog, Coupons, and Shipping rates.
8. **Performance & Verification**: Image optimization, dynamic routes verification, and clean build test.

---

## 6. Golden Rules for Antigravity Agents

1. **Never use generic browser alerts or plain tables**: All data must be wrapped in rounded, bordered glass containers with clear column alignments.
2. **Never leave trust badges unaligned on mobile**: Always wrap in equal-width container (`max-w-sm mx-auto`) with unified icon boxes and RTL alignment.
3. **Header Cart Icon must remain minimal**: Use an icon-only button (`w-9 h-9`) with a floating pill badge, not a bulky labeled button.
4. **Always include empty states and loading skeletons**: Never show blank screens during fetch or search; provide elegant shimmering skeletons.
5. **Keep build clean**: Validate production build (`next build`) before signing off.
