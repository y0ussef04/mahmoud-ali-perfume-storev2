# Master Project Checklist: Zero-to-Launch

Follow this checklist whenever building a new store or migrating an existing one.

---

## Phase 1: Foundation & Design System Setup
- [ ] Initialize Next.js project with App Router and Tailwind CSS.
- [ ] Configure `tailwind.config.js` with luxury color palette (`#12110C`, `#1A1814`, `#C9A84C`, `#FAF9F5`).
- [ ] Configure Arabic font (`next/font/google`: `Cairo`, `Tajawal`, or `IBM Plex Sans Arabic`).
- [ ] Set `<html lang="ar" dir="rtl">` in `src/app/layout.jsx`.
- [ ] Lock mobile viewport in `layout.jsx`: `viewportFit: 'cover'`, `initialScale: 1, maximumScale: 1, userScalable: false`.
- [ ] Prevent horizontal zoom-out in `globals.css`: `html, body { overflow-x: hidden; max-width: 100vw; width: 100%; position: relative; }`.
- [ ] Implement `ThemeProvider` with dark mode default or system-synced.
- [ ] Create `AnimateIn` motion wrapper (`framer-motion`) with staggered directions.

---

## Phase 2: Navigation & Shell
- [ ] **Sticky Glass Header**:
  - Store logo / luxury monogram.
  - Quick search drawer trigger.
  - Theme toggle button.
  - Icon-only cart badge button (`w-9 h-9`) with floating pill badge.
- [ ] **Mobile Bottom Navigation Dock**:
  - Fixed bottom dock on mobile (`md:hidden`).
  - Equal items (`flex-1`), 10px text labels, active micro gold dot.
  - Safe-area support: `paddingBottom: max(env(safe-area-inset-bottom, 0px), 6px)`.
- [ ] **Luxury Footer with Bottom Dock Clearance**:
  - Brand statement, customer links, tax/contact info, copyright.
  - **CRITICAL**: Bottom copyright bar must have `pb-24 md:pb-0` to avoid being covered by mobile bottom navigation dock.
  - Lift toasts/notifications with `bottom-20 md:bottom-6`.

---

## Phase 3: High-Converting Homepage
- [ ] **Hero Banner**:
  - Atmospheric high-res background with blur gradient overlay and `overflow-hidden`.
  - Clear luxury value proposition in Arabic typography.
  - Shimmer call-to-action button linking to `/products`.
- [ ] **Compact Trust Bar**:
  - Sleek 3-column micro-strip (`grid-cols-3 gap-1.5 sm:gap-4`) taking <55px vertical height on mobile.
  - Micro-icons, bold title, clean 1-line subtitle.
- [ ] **Featured Collections / Discovery Sets**:
  - Image card banners highlighting top categories or bundles.
- [ ] **Sephora-Style 2-Column Mobile Product Grid**:
  - 2 columns on mobile, 4 on desktop (`grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6`).
  - Image containers: `aspect-square sm:aspect-[4/5]` with `object-contain p-1.5` so no image is ever cropped.
  - Clean cards with pricing, badge tags, and optimistic Add-to-Cart.

---

## Phase 4: Product Catalog & Product Details
- [ ] **Catalog Page (`/products`)**:
  - Category pill filter tabs (الكل, عطور رجالية, عطور نسائية, باقات التجربة).
  - Search input with clear button.
  - Sort dropdown (الأحدث, السعر من الأقل للأعلى, السعر من الأعلى للأقل).
- [ ] **Product Details (`/products/[slug]`)**:
  - High-res image gallery with thumbnail preview.
  - Olfactory / feature breakdown (القمة العطرية, قلب العطر, قاعدة العطر).
  - Size / volume selector pill tabs (50ml, 100ml).
  - Sticky mobile Add-to-Cart bottom bar when scrolling.

---

## Phase 5: Streamlined 3-Step Checkout
- [ ] **Stepper Bar**: سلة المشتريات -> الشحن والدفع -> تم التأكيد.
- [ ] **Customer Form**:
  - Full Name, Phone number (validated for local format), Governorate selector.
  - Instant dynamic shipping cost update on governorate change.
  - Address details with street/building instructions.
- [ ] **Payment Method Cards**:
  - الدفع عند الاستلام (COD) with icon & badge.
  - المحافظ الإلكترونية / بطاقات الدفع (InstaPay, Vodafone Cash, Visa).
- [ ] **Coupon Code Input**:
  - Instant discount application with clear discount breakdown.
- [ ] **Order Confirmation Screen**:
  - Order number copy button, summary, and direct link to WhatsApp & `/track`.

---

## Phase 6: Order Tracking (`/track`)
- [ ] Phone number or order ID search.
- [ ] Visual timeline: تم استلام الطلب -> جاري التجهيز -> تم الشحن مع المندوب -> تم التوصيل.
- [ ] Live status badge and direct WhatsApp inquiry button.

---

## Phase 7: Unified Admin Dashboard
- [ ] Match identical dark/light luxury theme as storefront.
- [ ] **Overview KPIs**: Total Sales, New Orders, Average Order Value, Total Customers.
- [ ] **Orders Manager (`/admin/orders`)**:
  - Framed glass table with search, status filter tabs, and bulk export.
  - Order details drawer with customer info, line items, and invoice print view.
- [ ] **Products Manager (`/admin/products`)**:
  - Add / edit modal with image upload to Supabase bucket.
- [ ] **Shipping Rates Manager (`/admin/shipping`)**:
  - Governorate fees configuration.
- [ ] **Coupons Manager (`/admin/coupons`)**:
  - Percentage or fixed discount rules.

---

## Phase 8: Verification & Performance Signoff
- [ ] Run `next build` to verify all dynamic and static routes compile with 0 errors.
- [ ] Test on real mobile screen dimensions (375px - 430px) for layout integrity.
- [ ] Verify image optimizations with `next/image` and `sizes` attributes.
