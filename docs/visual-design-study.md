# Visual Design Study

This document collects reference material and early decisions that will drive the final look & feel of the OnTrack interface. Slides with collages will be exported later; for now, notes and palettes capture the current direction.

## Typography Inspiration

- **Primary type**: Inter (Google Fonts) — clean, neutral, pairs well with data-heavy dashboards.
- **Accent type**: DM Serif Display — headings for hero moments (eg, landing/marketing) if needed.
- **Body text goals**: legibility at small sizes, friendly tone, subtle rounded terminals.
- **Examples to capture**:
  - Linear.app dashboard UI for hierarchy spacing.
  - Strava mobile analytics for bold stat cards.
  - Peloton training summaries for motivational tone.

## Color Palette Exploration

| Role | Hex | Notes |
| --- | --- | --- |
| Core background | `#F7F8FC` | Soft eggshell inspired by Notion dashboards to reduce glare. |
| Surface | `#FFFFFF` | Card surfaces and modals. |
| Primary | `#1F74FF` | Energetic blue for actions; derived from physiotherapy brand palettes. |
| Ink / Text | `#1F2933` | Dark slate for high contrast with soft background. |
| Accent success | `#2F8F4E` | Reinforces habit completion. |
| Accent warning | `#D49733` | For reminders and caution states. |
| Accent danger | `#D14343` | Error states / deprecated exercises. |

Supporting neutrals will live on a blue-gray ramp (`#51627A`, `#5B708F`, `#94A3B8`).

Reference imagery to assemble on slides:

- Olympic physical therapy branding (bold blues with white negative space).
- Calm analytics dashboards (eg, Headspace Progress page) for card styling.
- Minimalist health app UI (Flow, Whoop) for typography pairings.

## Layout + Interaction Notes

- Use card-based layout with generous rounding (16–20px) to convey softness and safety.
- Key actions (submit check-in, add exercise) as pill-shaped buttons with subtle elevation.
- Progress view should surface stats in a 3-column grid on desktop, stacking on mobile.
- Sidebar navigation collapses to overlay under 900px breakpoint.

## Next Steps

- Assemble two slides (Typography & Color) with the inspiration references listed above. Screenshots to include: Linear project table, Peloton weekly summary, Flow habit tracker.
- Capture hex codes and font names on the slides’ margins per assignment requirements.
- Align component-specific tokens (shadows, radii) with the palette and document in `src/styles/design-tokens.css` (to be created).

