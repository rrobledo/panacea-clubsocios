## Why

The current "/" route (`DashboardPage`) shows socios a generic admin-style KPI card and two charts (compras semanales, compras por categoría) inside an enterprise dashboard shell. This doesn't communicate the club's actual value loop to members, doesn't prompt return visits, and reads like a back-office analytics screen rather than a consumer rewards experience. We're replacing it with a gamified rewards Home (credits balance, a "Reward Machine" to spend credits on coupons, active coupons, promotions, and recent activity) modeled on consumer loyalty apps (Starbucks Rewards, Nike Membership, Apple Wallet, Duolingo), so socios have an immediate, engaging reason to open the app.

## What Changes

- **BREAKING**: Replace `DashboardPage` at `/` with a new rewards Home page. The KPI/charts view is removed from `/`; `ChartsPage` and its underlying `getComprasSemanales`/`getComprasPorCategoria` calls are unaffected elsewhere but no longer surfaced on the landing route.
- **BREAKING**: Mobile navigation changes from the hamburger-triggered sidebar drawer to a fixed bottom tab bar (Home / Coupons / Play / Promotions / Profile) for the rewards Home experience. Desktop replaces the persistent sidebar with a top navigation bar (Home, Coupons, Promotions, History, Profile) matching the spec's header design.
- Add a new `rewards` service module (`src/services/rewardsApi.js`) exposing calls for credits, reward machine, coupons, promotions, and activity, matching the spec's API contract shape. Real backend endpoints are assumed to exist or be delivered in parallel; if actual response shapes differ, only this service module needs updating.
- Add new domain components: `Hero`, `CreditsCard`, `ProgressBar`, `RewardMachineCard`, `CouponCard`, `PromotionCard`, `Timeline`, `BottomNavigation`, plus supporting `Carousel`, `Avatar`, and `NotificationBell` primitives.
- Add a scoped design-token layer (new secondary/accent colors, 20px radius, gradients, animation durations) used only by the rewards Home page tree, so the rest of the app (Ventas, Cuenta, forms, tables, existing Modal/Badge/Tabs) keeps its current enterprise token values unchanged.
- Add loading (skeleton), empty, and error states for each section (coupons, promotions, activity), reusing existing `EmptyState`/`ErrorState`/`ToastContext` where the visual language matches, and introducing skeleton placeholders where it doesn't.
- Add a "Play Reward Machine" interaction (modal or dedicated view) that deducts credits and yields a coupon; exact play flow (immediate resolution vs. animated sequence) is decided in design.md.

## Capabilities

### New Capabilities
- `rewards-home`: The gamified Home page for socios — hero/welcome, credits balance with progress-to-next-reward, reward machine CTA, active coupons list, featured promotions, and recent activity timeline, fully responsive (desktop dashboard grid / tablet 2-col / mobile single column with bottom tab bar).
- `reward-machine`: The credit-spending mechanic — cost to play, win/coupon outcome, and its effect on the user's credit balance and activity feed.
- `coupons-wallet`: Viewing active/expired/used coupons earned via the reward machine, including QR redemption view and remaining-validity display.

### Modified Capabilities
(none — no existing `openspec/specs/` capabilities exist in this repo yet; this is a greenfield spec set)

## Impact

- **Routes**: `App.jsx` — `/` now renders the new rewards Home instead of `DashboardPage`. `DashboardPage.jsx` becomes unused by routing (left in place or removed — decided in tasks.md).
- **Layout shell**: `components/layout/AppLayout.jsx` and `layout.css` — needs a rewards-Home-specific header/nav and bottom-tab-bar mode; existing sidebar-drawer shell continues to serve Ventas/Cuenta/other admin-style pages unchanged.
- **Services**: New `src/services/rewardsApi.js`; no changes to existing `sociosApi.js` endpoints.
- **Styling**: New scoped token/CSS file for the rewards Home tree; `src/index.css` root tokens untouched.
- **Components**: New files under `src/components/rewards/` (or similar); existing `components/ui/index.jsx` primitives (`Modal`, `StatusBadge`, `EmptyState`, `ErrorState`, `PageLoader`, `Tabs`) are reused where applicable, extended (e.g. `StatusBadge` gains ACTIVE/EXPIRED/USED coupon variants) rather than duplicated.
- **Dependencies**: No new animation libraries (spec requires CSS-only transitions); Lucide icons already available (`lucide-react` is an existing dependency).
