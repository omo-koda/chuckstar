## Scope

Port the uploaded **Clicker Verse Collectibles** landing page into this TanStack Start project, layer on a curated set of 2026 motion/UI enhancements, **enable Lovable Cloud**, and replace every mocked array with real data backed by Postgres + RLS. End state: a functional collectibles marketplace front, not just a landing page.

---

## 1. Port the page

- Copy `public/*` assets (images, `hero-video.mp4`, `logo.png`) from the zip into this project.
- Replace `src/routes/index.tsx` placeholder with the landing page.
- Split the 900-line `Home.tsx` into focused components under `src/components/landing/` (Nav, PromoBanner, Hero, Categories, Featured, HowItWorks, Testimonials, Services, Events, Contact, Footer).
- Move custom CSS (`glow-*`, `glass-card`, `nav-blur`, keyframes `float/pulse-glow/shimmer/orbit/stars`) into `src/styles.css` using Tailwind v4 `@theme` / `@utility`. Color tokens in `oklch`.
- Add Orbitron / Rajdhani / Inter fonts via `<link>` in `__root.tsx`.
- SEO: per-route `head()` with title, description, og:image (uses hero image).

## 2. Enable Lovable Cloud + schema

Enable Lovable Cloud, then create these tables via migration (all with RLS):

| Table | Purpose | Public read? |
| --- | --- | --- |
| `profiles` | `id` (= auth.uid), `display_name`, `avatar_url`, `role_label` | yes |
| `user_roles` | `user_id`, `role` enum (`admin`,`user`) — for admin gating | owner-only |
| `categories` | slug, title, subtitle, image_url, icon_key, item_count, gradient | yes |
| `collectibles` | id, name, slug, category_id, price_cents, image_url, badge, badge_color, views, likes, remaining, total, end_time, is_featured, created_by | yes |
| `testimonials` | id, name, role, avatar_url, quote, rating, result, approved | yes (approved only) |
| `events` | id, title, date, location, attendees, status | yes |
| `cart_items` | id, user_id, collectible_id, qty, created_at | owner-only |
| `likes` | user_id, collectible_id (PK pair) | owner-only |
| `contact_messages` | id, name, email, subject, message, created_at | insert-anyone, read admin-only |
| `newsletter_subscribers` | email (unique), created_at | insert-anyone, read admin-only |
| `presence` | session_id, last_seen | insert/upsert anyone, public count read via view |

Seed `categories`, `collectibles`, `testimonials`, `events` from the existing arrays in `Home.tsx` so the page looks identical on first load — but the data is now real and editable.

Helper SQL function `public.has_role(uuid, app_role)` (SECURITY DEFINER) per project rules; admin-only RLS uses it.

## 3. Server functions (`createServerFn`)

All data access goes through server fns; no direct table queries from components.

Public reads (admin client, scoped WHERE, safe-column projection):
- `getCategories`, `getFeaturedCollectibles`, `getCollectible(slug)`, `getApprovedTestimonials`, `getUpcomingEvents`, `getLiveStats` (returns `{ online, auctions }` from `presence` + open auctions).

Authenticated (`requireSupabaseAuth`):
- `addToCart`, `removeFromCart`, `getCart`, `toggleLike`, `getMyLikes`.

Anonymous writes (rate-limited via simple IP+UA hash in a `rate_limits` table):
- `submitContactMessage`, `subscribeNewsletter`, `heartbeatPresence`.

Admin-only (`has_role` check inside handler):
- `createCollectible`, `updateCollectible`, `approveTestimonial`.

## 4. Replace mocked behavior with real behavior

- **Live counters** ("X online", "Y auctions"): replaced by `getLiveStats` polled every 10s; presence is fed by a `heartbeatPresence` call from every visitor every 30s (BroadcastChannel dedupes across tabs).
- **Countdown timers**: read `end_time` from `collectibles` row, not in-memory dates.
- **Cart badge**: real count from `getCart`, synced across tabs via Broadcast Channel.
- **Like button**: writes to `likes`; updates `collectibles.likes` via DB trigger.
- **Views**: increments via `incrementView` server fn on item-dialog open (1/session, sessionStorage gate).
- **Contact form**: real submit with Zod validation → `contact_messages` row + toast confirmation.
- **Newsletter form (footer)**: real submit with Zod email validation → `newsletter_subscribers`.
- **Auth**: lightweight email/password login + signup at `/login` and `/signup` so users can like / cart / submit. Cart and likes gracefully prompt to sign in when anonymous.

## 5. Curated 2026 enhancements (kept from previous plan, lean & feature-detected)

Motion & feel
- **Lenis** smooth scroll.
- **GSAP ScrollTrigger** scrollytelling: hero video parallax, staggered section reveals, pinned How-It-Works timeline.
- **Framer Motion** springs: card hover, modal entry, staggered grid reveals.
- **Kinetic typography** on hero headline (per-letter spring, hover RGB-split on "VERSE").
- **View Transitions API** for featured-card → dialog (graceful fallback).

Surfaces & texture
- **Glassmorphism 2.0** nav + featured cards (layered blur + saturation + animated borders).
- **Hybrid glass + neumorphic + claymorphic** category cards (squish on press).
- **Holographic prism sheen** on Ultra-Rare badges and primary CTA.
- **Bento grid** rebuild of Services section.

Micro-interactions
- Ripple + `navigator.vibrate` on primary CTAs.
- Magnetic cursor pull on buttons (desktop, reduced-motion aware).
- Glow pulse + count-up on live pills.

Sensor & device (all `if ('X' in ...)` guarded, no-op when unsupported)
- DeviceOrientation tilt on mobile featured cards.
- AmbientLightSensor → neon intensity CSS var.
- Wake Lock while hero video visible.
- Battery API + `saveData` → drop heavy effects.
- `prefers-reduced-motion` respected everywhere.

Extras
- Web Share API on featured items.
- Broadcast Channel for cart sync.
- ResizeObserver for fluid hero typography.
- Perf guard: if rAF FPS < 40 for 2s → drop particles + blur.

## 6. Verify

Build, open preview, walk through each section, sign up a test user, like/cart an item, submit contact + newsletter forms, confirm rows land in DB, confirm reduced-motion path.

---

## Technical notes

- Stack stays TanStack Start; no React Router DOM, no `src/pages/`.
- Server fns live in `src/lib/*.functions.ts` (thin: declarations + imports only); shared DB helpers in `*.server.ts`.
- Public routes (just `/`) use `supabaseAdmin` server fns with explicit column projection — never `requireSupabaseAuth` in a public loader (SSR has no token).
- Email/password auth only; no Google OAuth unless you ask (broker requires extra setup).
- Single page route at `/`; in-page section nav stays as hash anchors. Auth routes at `/login`, `/signup`. Optional admin page at `/_authenticated/admin` gated by `has_role`.

## What I'm NOT doing (ask to add)

- Stripe checkout / real payments (cart is functional, but no payment yet).
- Google/Apple OAuth.
- WebGPU shaders, Three.js portals, WebXR.
- WebUSB / WebHID / NFC / Bluetooth / Barcode / WebAuthn.
- Email sending for contact form / welcome emails (can layer on Lovable Email later).
