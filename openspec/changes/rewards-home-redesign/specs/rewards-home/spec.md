## ADDED Requirements

### Requirement: Responsive Home layout
The system SHALL render the rewards Home page as a single vertical section flow (Header, Hero, Credits, Reward Machine, Active Coupons, Featured Promotions, Recent Activity) whose arrangement adapts to viewport width: a dashboard grid on desktop (>1024px) with Credits and Reward Machine side by side, a 2-column stack on tablet (768–1024px), and a single vertical column on mobile (<768px).

#### Scenario: Desktop dashboard grid
- **WHEN** the viewport width is greater than 1024px
- **THEN** the page renders Header, then Hero, then a two-column row containing the Credits card and the Reward Machine card, then Active Coupons, then Featured Promotions, then Recent Activity, in that order

#### Scenario: Mobile single column
- **WHEN** the viewport width is less than 768px
- **THEN** all sections (Header, Hero, Credits, Reward Machine, Active Coupons, Featured Promotions, Recent Activity) stack in a single vertical column in the order listed in the layout spec, and a fixed bottom tab bar is visible

#### Scenario: Equal card heights within a row
- **WHEN** two or more cards share the same row (e.g. Credits and Reward Machine on desktop)
- **THEN** the cards render with equal height regardless of their content length

### Requirement: Scoped design tokens
The system SHALL centralize the rewards Home's visual values (colors, spacing, typography, border radius, shadows, animation durations) as CSS custom properties scoped to the rewards Home component tree, and SHALL NOT modify the application's existing global `:root` design tokens used by other pages.

#### Scenario: Rewards Home renders with its own palette
- **WHEN** the rewards Home page is displayed
- **THEN** its cards use a 20px border radius, the spec's primary/secondary/accent/danger colors, and 250ms transition durations, sourced from tokens scoped to the rewards Home tree

#### Scenario: Other pages are unaffected
- **WHEN** a user navigates to an existing page outside the rewards Home (e.g. Ventas, Cuenta)
- **THEN** that page's border radius, colors, and transition durations remain exactly as they were before this change

### Requirement: Desktop and mobile navigation
The system SHALL provide a top navigation bar with Home, Coupons, Promotions, History, and Profile entries, a notification bell, and a user avatar on desktop, and a fixed bottom tab bar with Home, Coupons, Play, Promotions, and Profile icons on mobile, replacing the sidebar-drawer navigation on this page only.

#### Scenario: Desktop top nav navigates within the page
- **WHEN** a user on desktop clicks "Coupons", "Promotions", or "History" in the top nav
- **THEN** the page scrolls smoothly to the corresponding section on the same Home page

#### Scenario: Mobile bottom tab opens the reward machine
- **WHEN** a user on mobile taps the "Play" bottom tab icon
- **THEN** the Reward Machine play flow opens, identical to tapping the Reward Machine card's PLAY button

#### Scenario: Profile navigates to the account page
- **WHEN** a user clicks/taps "Profile" in either the desktop nav or the mobile bottom tab bar
- **THEN** the application navigates to the existing account route (`/configuracion/cuenta`)

### Requirement: Welcome hero
The system SHALL display a welcome hero section showing the user's name, their current credit balance, a prompt to earn more credits by shopping, and a "Play Now" call-to-action, at a height of 280px on desktop and 180px on mobile, over a gradient background.

#### Scenario: Hero shows current balance
- **WHEN** the rewards Home page loads successfully
- **THEN** the hero section displays "Welcome back {name}!" and "You currently have {credits} Credits"

#### Scenario: Play Now opens the reward machine
- **WHEN** a user clicks the hero's "Play Now" button
- **THEN** the Reward Machine play flow opens

### Requirement: Section-level loading states
Every data-driven section of the rewards Home (Credits, Reward Machine, Active Coupons, Featured Promotions, Recent Activity) SHALL display a skeleton placeholder while its data is loading, independent of the loading state of other sections.

#### Scenario: One section still loading while others are ready
- **WHEN** the promotions request has not yet resolved but the credits and coupons requests have
- **THEN** the Featured Promotions section shows a skeleton placeholder while Credits and Active Coupons show their loaded content

### Requirement: Section-level empty and error states
Each of Active Coupons, Featured Promotions, and Recent Activity SHALL show a section-specific empty state when the data request succeeds with zero items, and a section-specific error state with a retry action when the data request fails.

#### Scenario: No coupons yet
- **WHEN** the coupons request succeeds and returns an empty list
- **THEN** the Active Coupons section shows "You don't have any coupons yet. Play the Reward Machine to win one!" with a Play action

#### Scenario: No activity yet
- **WHEN** the activity request succeeds and returns an empty list
- **THEN** the Recent Activity section shows "No activity yet."

#### Scenario: No promotions available
- **WHEN** the promotions request succeeds and returns an empty list
- **THEN** the Featured Promotions section shows "No promotions available."

#### Scenario: Section fetch fails
- **WHEN** any section's data request fails (network or server error)
- **THEN** that section shows an error message and a Retry button, and retrying re-issues only that section's request without reloading the rest of the page

### Requirement: Accessibility
The rewards Home page SHALL meet WCAG AA contrast on all text and interactive elements, support full keyboard navigation and visible focus indicators, provide screen-reader labels for icon-only controls, size all interactive touch targets at a minimum of 44x44px, and provide alt text for all images.

#### Scenario: Keyboard-only navigation
- **WHEN** a user navigates the page using only the keyboard (Tab/Shift+Tab/Enter)
- **THEN** every interactive element (nav links, Play buttons, View QR, Learn More, bottom tabs) is reachable and operable, with a visible focus indicator at each step

#### Scenario: Icon-only controls are labeled
- **WHEN** a screen reader encounters the notification bell, avatar/profile control, or bottom tab bar icons
- **THEN** each announces a descriptive accessible name (e.g. "Notifications", "Profile", "Play Reward Machine")
