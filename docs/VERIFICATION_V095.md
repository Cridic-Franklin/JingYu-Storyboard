# V0.95 targeted verification

Verified 2026-09-10 on Windows, Chrome / Playwright with a fresh browser profile and software WebGL. Vite reported and served `http://127.0.0.1:5173/` during these checks. No historical V0.9 regression suite was rerun.

## Commands

```sh
pnpm exec tsc -b
pnpm build
node scripts/verify-v095.cjs
node scripts/verify-v095-edges.cjs
```

Set `PLAYWRIGHT_MODULE` to an available Playwright installation and `APP_URL` to the actual development URL when needed. Scripts use fresh isolated profiles and do not touch the user's projects. Create `.verification/` for local output if absent.

## Passing coverage

- All seven pose presets have finite posed bounds; single-knee pose has a lower silhouette. Manual angles and actual pointer dragging on joint rotation rings update shared pose data. Undo/redo and object locks cover pose edits.
- Character/custom colors and primitive swatches update rendered materials. Default Camera PNG pixels are unchanged by editor color edits; explicit opt-in changes the output. AI JSON contains pose/asset information without editor color semantics.
- Real OBJ file input, face triangulation/negative indices, transforms, display color, visibility, lock enforcement, duplication and deletion. Plan dragging changes the same transform rendered in 3D; OBJ projected footprints follow pitch/roll. Camera and Plan exports contain the placed objects.
- All four guide orientations at 16:9, 2.39:1, 4:3 and 9:16; preview paths agree. Mirror, offsets, scale/reset and portable round-trip pass. Portrait Camera PNG is 640×1138; Plan PNG is 800×480.
- Portable Save download → Open validation/store activation preserves poses, colors, assets and guides. IndexedDB reload retains them. Schema-4 migration is immutable and defaults to Standing/default guide/default export palette. Malformed pose/color/OBJ/guide and future schema data are rejected.
- Independent workspace defaults, saved split sizes, active-workspace Reset Layout and floating-layout reload. Each of five panels passes maximize/restore, float/header move/grip resize/dock/hide/reset. Floating header double-click and browser resizing retain expected maximize state. Hidden Camera panels retain identical export projection. Chinese controls were exercised at 1280×800.
- No browser runtime exceptions in either script. TypeScript and production build pass; existing chunk-size warning remains.

## Visual inspection and limits

Inspected generated Camera/Plan PNGs, a landscape OBJ/posed-character export, AI Review layout and Chinese panel screenshot. Local artifacts are under ignored `.verification/v095-*.png` and are not committed.

OBJ has deliberate size limits and no MTL/textures; concave faces should be triangulated first. Pose/Plan geometry is approximate, without collision or contact solving. Native OS dialogs and remote ChatGPT Work-browser reachability are not asserted by these local checks. No new runtime/testing dependency was added.
