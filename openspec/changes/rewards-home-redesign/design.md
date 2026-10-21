## Context

`panacea-clubsocios` is a React 19 + Vite SPA built from an enterprise-dashboard scaffold (`react-enterprise-kit`). Every authenticated route currently renders inside a single shell, `AppLayout` (`src/components/layout/AppLayout.jsx`): a persistent sidebar (desktop) / hamburger-triggered drawer (mobile), plus a top header with search, notification bell, and user menu. `DashboardPage` (today's `/`) renders inside that shell and shows a KPI card plus two Recharts charts sourced from `/ventas/estadisticas/*`.

There is no existing concept of credits, coupons, a reward machine, or promotions anywhere in the codebase — `src/services/sociosApi.js` only exposes `/socios/*` and `/ventas/*`. This change introduces that domain on the frontend, assuming a backend contract shaped like the functional spec's example payload (confirmed with the requester: build against that shape now, adapt the service layer later if the real API differs).

No existing `openspec/specs/` capabilities exist yet — this is the first spec set for the repo.

## Goals / Non-Goals

**Goals:**
- Replace `/` with a fully responsive, gamified rewards Home (hero, credits, reward machine CTA, active coupons, promotions, recent activity) per the functional spec.
- Keep the new visual language (colors, 20px radius, gradients) contained to the rewards Home page tree — the rest of the app (Ventas, Cuenta, forms, tables, existing `Modal`/`StatusBadge`/`Tabs`) is visually unaffected.
- Reuse existing primitives (`Modal`, `EmptyState`, `ErrorState`, `PageLoader`, `ToastContext`, `StatusBadge`) wherever their behavior already matches the spec, rather than duplicating them.
- Ship a working reward-machine play flow: spend credits, receive a coupon, see it reflected in credits balance and activity feed.

**Non-Goals:**
- Building full standalone pages/routes for "Coupons", "Promotions", and "History" as separate navigable views. The spec's header nav items for these map to *sections within the Home page* (all three already exist as sections on the single Home page per the layout spec) — see Decisions.
- Migrating `AppLayout`'s sidebar shell or its use on other routes (Ventas, Cuenta, Charts, Products, etc.). Those routes are untouched.
- Building a real backend, dark mode, or QR-code generation library selection (QR rendering is stubbed to whatever string/image the API returns; no scanning logic).
- Preserving `/` as the KPI/charts view — that capability is not migrated to a new route in this change (see Risks).

## Decisions

**1. Two sibling app shells, split at the route level.**
`App.jsx` currently wraps every private route in one `<AppLayout>`. This change introduces a second shell, `RewardsShell` (top nav on desktop, fixed bottom tab bar on mobile, no sidebar), used only for `/`. All other existing routes (`/ventas`, `/configuracion/cuenta`, `/charts`, etc.) keep rendering inside `AppLayout` exactly as today.
- *Alternative considered*: retrofit `AppLayout` itself with a "rewards mode" toggle. Rejected — it would couple two unrelated visual systems into one component and complicate the sidebar logic for no benefit, since only one route needs the new shell.
- *Consequence*: navigating from Home to Ventas/Cuenta crosses a shell boundary (bottom tabs → hamburger drawer). This is called out explicitly in Risks rather than papered over.

**2. Nav items resolve to in-page anchors, not new routes.**
The spec's desktop header nav (Home / Coupons / Promotions / History / Profile) and mobile bottom tabs (Home / Coupons / Play / Promotions / Profile) target sections that already exist on the one-page Home layout (Active Coupons, Featured Promotions, Recent Activity), except:
- "Profile" → routes to the existing `/configuracion/cuenta` (real route, real page).
- "Play" (bottom tab only) → opens the Reward Machine play modal directly, same action as the Reward Machine card's `[PLAY]` button.
- "Home" / "Coupons" / "Promotions" / "History" → smooth-scroll to the corresponding `<section id="...">` on the same page.
This keeps the change scoped to one page instead of silently expanding into three new routes/pages, while still satisfying the spec's nav requirements literally (each item is reachable and lands the user at the right content).

**3. Design tokens scoped via a wrapper class, not global `:root` edits.**
A new stylesheet (e.g. `src/components/rewards/rewards-theme.css`) defines a `.rewards-theme { --rw-primary: #2563EB; --rw-secondary: #22C55E; --rw-accent: #F59E0B; --rw-danger: #EF4444; --rw-bg: #F8FAFC; --rw-card: #FFFFFF; --rw-radius: 20px; --rw-duration: 250ms; ... }` block. `RewardsShell` applies the `rewards-theme` class at its root; every new component under `src/components/rewards/` references `--rw-*` variables, never the app's existing `--primary`/`--radius`/etc. This guarantees zero visual bleed into Ventas/Cuenta/forms/tables, per the requester's explicit choice to scope rather than migrate globally.

**4. Reward machine play flow: server-resolved outcome, minimum-duration CSS animation.**
Clicking `[PLAY]` opens a modal (reusing the existing `Modal` primitive) that immediately calls `rewardsApi.playRewardMachine()`. While the request is in flight, a CSS-only "spinning/shuffling" animation plays; the result reveal is held for a minimum of ~600ms even if the response returns faster, so the animation never looks like it was skipped, and extended (capped) if the response is slower, so it never looks broken on a slow network. On success: show the won coupon, update credits balance and activity feed from the response (not optimistically — the server is the source of truth for both new balance and the coupon). On insufficient credits (`credits.current < rewardMachine.cost`), the `[PLAY]` button is disabled with an inline hint rather than allowed to fail server-side.
- *Alternative considered*: optimistic credit deduction before the response. Rejected — a failed play (network error, race condition) would need to roll back a number the user already saw decrease, which reads as broken/untrustworthy for a rewards balance; the spec explicitly wants the experience to "feel...trustworthy."

**5. Data fetching follows the existing page pattern.**
No data-fetching library exists in `package.json` (no React Query, no SWR). Consistent with `DashboardPage`/`CuentaPage`, the new Home page uses local `useState` + `useEffect` calling `src/services/rewardsApi.js`, with per-section loading/error state so one failed section (e.g. promotions) doesn't block the rest of the page from rendering.

**6. `StatusBadge` is extended, not duplicated.**
`components/ui/index.jsx`'s `STATUS_MAP` gains `active`/`expired`/`used` (already partially covered by `active`→success, but `expired`/`used` need adding to match the spec's Green/Gray/Blue coupon states) instead of a new coupon-specific badge component.

**7. `DashboardPage` (KPI/charts) is left in place but unrouted.**
The file stays in the repo (not deleted) since it's out of scope to decide its future home in this change; it's simply no longer reachable from `/`. If it needs a new route later, that's a follow-up change.

## Risks / Trade-offs

- **[Risk] Two shells means two different mobile navigation idioms in one app** (bottom tabs on Home, hamburger drawer everywhere else) → **Mitigation**: acceptable for this change since Home is the primary/most-visited screen; flagged as a known inconsistency, not hidden. A follow-up change could unify navigation app-wide if desired.
- **[Risk] Assumed backend contract may not match the real API** → **Mitigation**: isolated entirely inside `rewardsApi.js`; no component talks to `axios`/fetch directly, so a contract mismatch is a one-file fix.
- **[Risk] Anchor-link nav (Decision 2) may feel like a shortcut vs. real Coupons/Promotions/History pages** → **Mitigation**: it satisfies the spec's literal nav requirements today; if product direction later wants dedicated pages (e.g., a full coupon wallet with filtering), that's naturally a new change since it's new capability, not a redesign of this one.
- **[Risk] Minimum-duration animation (Decision 4) adds artificial delay** → **Mitigation**: capped at ~600ms, well within the spec's "clean rather than casino-like" and general snappy-consumer-app feel; avoids a jarring instant-flash result.
- **[Risk] Scoped tokens (Decision 3) can drift from global tokens over time** (e.g. someone hardcodes `--primary` inside a rewards component by mistake) → **Mitigation**: lint/review discipline; all new components live under one directory (`src/components/rewards/`), making it easy to grep for accidental use of global `--primary`/`--radius`/etc. during review.

## Migration Plan

1. Build `rewardsApi.js`, scoped theme CSS, and all new components under `src/components/rewards/` without touching routing yet (safe to land incrementally).
2. Build `RewardsShell` and the new Home page composed from those components.
3. Swap `App.jsx`'s `/` route from `DashboardPage` to the new Home page inside `RewardsShell`.
4. No feature flag / gradual rollout infrastructure exists in this repo (small internal app, direct-to-main workflow) — this ships as a normal PR/merge. Rollback is a plain revert of the `App.jsx` route change plus the new files.

## Open Questions

- Should `DashboardPage`'s KPI/charts capability move to a new route (e.g. `/analytics`) in a follow-up change, or be retired entirely?
- What does the real backend's coupon `qrCode` field actually contain (raw string to render client-side vs. a pre-rendered image URL)? Affects whether a QR-generation library is needed later.
- Should "Coupons"/"Promotions"/"History" eventually become real routes with their own filtering/pagination once the coupon/promotion volume grows beyond what fits in a Home-page section?
