## ADDED Requirements

### Requirement: Active coupons display
The system SHALL display the user's coupons as horizontal cards on desktop and as a swipeable carousel on mobile, each showing the coupon's title/discount, store, expiration date, remaining days until expiration, and a status badge.

#### Scenario: Desktop horizontal cards
- **WHEN** the viewport width is greater than 1024px and the user has one or more coupons
- **THEN** the Active Coupons section renders the coupons as horizontally arranged cards

#### Scenario: Mobile carousel
- **WHEN** the viewport width is less than 768px and the user has one or more coupons
- **THEN** the Active Coupons section renders the coupons in a swipeable carousel, one primarily visible at a time

#### Scenario: Remaining validity shown
- **WHEN** a coupon's expiration date is in the future
- **THEN** the coupon card shows the number of remaining days until expiration (e.g. "Remaining: 8 days")

### Requirement: Coupon status badges
The system SHALL display a status badge on each coupon card reflecting its lifecycle state: green for ACTIVE, gray for EXPIRED, and blue for USED.

#### Scenario: Active coupon badge
- **WHEN** a coupon's status is ACTIVE
- **THEN** its badge renders in green with the label "ACTIVE"

#### Scenario: Expired coupon badge
- **WHEN** a coupon's status is EXPIRED
- **THEN** its badge renders in gray with a label indicating it has expired

#### Scenario: Used coupon badge
- **WHEN** a coupon's status is USED
- **THEN** its badge renders in blue with a label indicating it has been used

### Requirement: Coupon QR redemption view
Each active coupon card SHALL provide a "View QR" action that opens a modal displaying the coupon's redemption QR code.

#### Scenario: View QR opens redemption modal
- **WHEN** a user clicks/taps "View QR" on a coupon card
- **THEN** a modal opens displaying that coupon's QR code and its key details (title, store, expiration)

#### Scenario: View QR unavailable for non-active coupons
- **WHEN** a coupon's status is EXPIRED or USED
- **THEN** the "View QR" action is not offered, or is disabled, for that coupon

### Requirement: Coupons empty state
When the user has no coupons, the Active Coupons section SHALL show an empty state prompting the user to play the Reward Machine, with a direct action to do so.

#### Scenario: Zero coupons
- **WHEN** the coupons request succeeds and returns zero coupons
- **THEN** the section displays "You don't have any coupons yet. Play the Reward Machine to win one!" and a "Play" action that opens the Reward Machine play flow
