---
name: ux-governance
description: Design rules for rendering high-fidelity compliance dashboards, utilizing glassmorphic tokens, clear risk indicators, and clean layout hierarchies.
---

# Premium Governance UX Design Guidelines

This skill enforces high visual standards for compliance tracking interfaces.

## Visual Design System Rules

1. **Aesthetics & Theme**:
   - Maintain a dark, premium slate/zinc background (e.g. `bg-slate-950`).
   - Use custom glassmorphism components (`glass-panel`, `glass-card`, `glass-card-hover`) with thin, semi-transparent borders.
   - Utilize bright accent gradients for active actions (e.g. Blue/Indigo for highlights, Emerald for Passed controls, Amber for Exceptions, Rose for Failures).

2. **Dashboard Layout**:
   - Position high-level metrics clearly at the top: Overall Maturity, Active Exception counts, Remediation status, and Evidence Coverage percentage.
   - Embed readable responsive visualizations (e.g. comparison charts showing Current vs Target Maturity level).

3. **User Flow & Clarity**:
   - Provide guided progressive wizards for complex workflows (like Scoping or control evaluations).
   - Show loading indicators and clean fallback states for empty lists.

4. **Lightweight & Secure UI Packages**:
   - Avoid installing large external UI/widget libraries (e.g. Radix, HeadlessUI, or Component Libraries) unless absolutely required. 
   - Favor pure HTML/Tailwind CSS styling to minimize bundle weight and ensure zero vulnerability exposures from third-party code.
