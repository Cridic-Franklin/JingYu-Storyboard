# JingYu UI design system

This document records the stable visual rules for JingYu's desktop workspace. It describes presentation and interaction only; scene data and application behavior remain owned by the existing shared Scene Graph and feature modules.

## Direction

JingYu uses the visual language of a restrained screening room and editing desk: cool neutral chrome, a near-black canvas, and one warm amber signal for selection, focus and primary actions. Interfaces should remain compact enough for continuous storyboard work without becoming cramped or low-contrast.

Avoid gradients used as decoration, broad glass effects, glow, large marketing typography, oversized cards and motion that does not explain an interaction.

## Tokens

The authoritative tokens live in `src/styles.css` under **Professional workspace system**.

- Surfaces progress from `--bg-canvas` through `--bg-workspace`, `--bg-chrome`, `--bg-panel` and `--bg-panel-raised`.
- Borders use `--border-subtle`, `--border-default` and `--border-strong` according to hierarchy.
- Text uses `--text-primary`, `--text-secondary`, `--text-muted`, `--text-placeholder` and `--text-disabled`.
- `--accent` and `--accent-strong` identify the active tool, selected shot, focus and primary action. They are not decorative fill colors.
- `--green` indicates healthy live or saved state; `--danger` is reserved for destructive actions and errors.
- Controls use 3 px corners, raised dialogs and floating panels use 5 px corners, and shadows appear only when elevation changes.

## Component rules

- Application chrome, panel headers and canvas areas remain visually distinct. The Spatial Editor receives the strongest area emphasis.
- Selected states use at least two cues: amber text or border plus a background or edge marker. Hover never substitutes for selection.
- Primary buttons use amber fill. Secondary actions use neutral controls; destructive actions use the danger token.
- Inputs share the control surface, border and focus ring. Labels stay visible and placeholders remain supplementary.
- Panel controls use the shared outline icon set and preserve accessible names. Drag and resize affordances retain keyboard alternatives.
- Empty, loading and error states explain the current condition without decorative animation. Reduced-motion preferences suppress nonessential transitions.
- Dense toolbars may wrap at narrower desktop widths. No command may become inaccessible because a toolbar clips.

## Layout

The workspace is desktop-first with a 960 px minimum. At narrower desktop widths, optional header labels collapse and export actions wrap to a second toolbar row. Major panels remain resizable, floatable, hideable and maximizable through the existing layout system.

Review changes at 1440 × 900 and 1024 × 768, in both English and Simplified Chinese. Also inspect focus, hover, active, selected, disabled, modal, empty, loading and error treatments when those states are affected.
