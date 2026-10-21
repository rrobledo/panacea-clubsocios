## ADDED Requirements

### Requirement: Credits balance and progress display
The system SHALL display the user's current credit balance and their progress toward the next reward threshold as a numeric fraction (e.g. "125 / 200 Credits") and a proportional progress bar, with a footer stating the next reward's threshold.

#### Scenario: Progress bar reflects current balance
- **WHEN** the user's current credits are 125 and the next reward threshold is 200
- **THEN** the Credits card displays "125 / 200 Credits", a progress bar filled to 62.5% of its width, and the footer text "Next reward at 200 credits"

#### Scenario: Credit value animates on load
- **WHEN** the Credits card first renders with a resolved balance
- **THEN** the displayed number animates counting up from 0 to the current balance rather than appearing instantly

### Requirement: Reward Machine play cost and availability
The system SHALL display the Reward Machine's cost to play and SHALL disable the Play control whenever the user's current credit balance is less than that cost or the reward machine is reported as disabled by the backend.

#### Scenario: Sufficient credits
- **WHEN** the user's current credits are greater than or equal to the reward machine's cost and the reward machine is enabled
- **THEN** the PLAY button is enabled and shows the cost (e.g. "Play for only 20 Credits")

#### Scenario: Insufficient credits
- **WHEN** the user's current credits are less than the reward machine's cost
- **THEN** the PLAY button is disabled and an inline hint indicates the user needs more credits to play

#### Scenario: Reward machine disabled by backend
- **WHEN** the backend reports `rewardMachine.enabled` as false
- **THEN** the PLAY button is disabled regardless of the user's credit balance

### Requirement: Play flow resolves server-side
When a user plays the Reward Machine, the system SHALL submit the play request to the backend, display an in-progress animation for a minimum perceived duration, and then reflect the server's authoritative response for the resulting credit balance and any coupon won. The system SHALL NOT decrement the displayed credit balance before the server response is received.

#### Scenario: Successful play awards a coupon
- **WHEN** a user with sufficient credits taps PLAY and the backend returns a new balance and a won coupon
- **THEN** the in-progress animation plays for at least its minimum duration, then the won coupon is revealed, the Credits card updates to the server-returned balance, and a new entry appears in Recent Activity reflecting the play and credits spent

#### Scenario: Play request fails
- **WHEN** a user taps PLAY and the backend request fails (network or server error)
- **THEN** the credit balance remains unchanged, an error state is shown with a retry action, and no coupon or activity entry is added

#### Scenario: Play button interaction affordance
- **WHEN** a user hovers over the Reward Machine card on a desktop pointer device
- **THEN** the card shows a glow visual effect without triggering the play request

### Requirement: Reward Machine idle animation
The Reward Machine card SHALL display a subtle floating animation on an interval while idle (not mid-play), implemented with CSS only.

#### Scenario: Idle floating animation
- **WHEN** the Reward Machine card is visible and not currently processing a play request
- **THEN** it performs a subtle floating animation approximately every 3 seconds using CSS animations, without any JavaScript animation library
