# Cogana Chip / Badge

Figma Chip component set: 58:47

Figma Badge component set: 59:63

## Purpose

Compact mobile elements for filtering catalog content, suggesting contextual
actions, and communicating product or order status. The family follows
Cogana's functional-minimal, semi-flat visual language without inheriting a
generic Material appearance.

## Chip variants

- Kind: Filter, Assist
- Tone: Neutral, Brand, Accent
- State: Default, Selected, Disabled
- Total: 18 variants

## Chip dimensions and properties

- Height: 48 px
- Label: editable text
- Show leading icon: toggles the initial icon
- Leading icon: instance swap restricted to Cogana icons
- Show close: toggles the optional close action

Filter chips are appropriate for categories, brands, price ranges, and
availability. Assist chips are appropriate for short contextual actions such
as saving or repeating an order. They do not replace the primary button.

## Badge variants

- Tone: Neutral, Brand, Accent, Danger
- Size: Small, Medium
- Total: 8 variants

## Badge dimensions and properties

- Small: 24 px high
- Medium: 28 px high
- Label: editable text

Badges are informational and non-interactive. Use Brand for new or preferred
content, Accent for commercial emphasis, and Danger only for critical states
such as unavailable products. Keep labels short and on one line.

## Accessibility

- Chip uses a 48 px mobile touch target.
- Selected state is communicated by fill and border, not color alone.
- Disabled state uses the shared disabled-opacity token.
- Badge colors preserve readable text contrast across all tones.
