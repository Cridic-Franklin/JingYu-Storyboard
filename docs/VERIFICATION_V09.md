# V0.9 verification — 2026-09-09

Implementation was built on `22a4d25` without redundant V0.3 baseline backups, tags or full regression runs.

## Passed checks

- `verify-v09-p0.cjs`: Chinese/English object search, incomplete numeric drafts, negative/decimal commit, cancellation, modifier increments, undo, ratio projection/export, grouped presets, focus target/rectangle, spot-light settings, shared Plan objects, portable save/open and reload.
- `verify-v09-camera.cjs`: real portrait camera projection and PNG dimensions, Camera View focus-point picking, ellipse overlay, and visible pixel changes from directional lighting.
- `verify-v09-semantics.cjs`: distinct subject roles, subject/screen relations, crop metadata, outside-frame raw bounds, depth layers/order, semantic TXT, optional technical coordinates, intentional constraint conflict, edit/save and export ignore/continue.
- `verify-v09-storage.cjs`: unchanged old input, schema 2/3 migration backups, stable IDs/transforms, sensible defaults, explicit null subjects, invalid/newer format rejection, file-handle Save reuse/Open and canceled Save As leaving the current project unchanged.
- `verify-v09-export.cjs`: simultaneous AI Review, clean/director/AI presets, frame PNG dimensions, focus overlays, clipboard image, six-file packet, reference board, measurement/sketch/image persistence, duplication remapping and undo, portable round-trip with subjects/focus/lights/constraints, bilingual UI. Also verifies Q leaves the Plan drawing tool in AI Review.
- Python `zipfile` inspection: all six packet entries decompress with valid CRCs; current-shot JSON parses; camera images are 1920×803 at 2.39:1 and Plan is 1920×1152.
- Export images and AI Review workspace were visually inspected. Label wrapping/readability was adjusted based on that inspection.
- `pnpm build`: TypeScript and Vite production build pass. The existing large-bundle warning remains.
- `git diff --check` and document-link checks pass.

## Verification limits

Browser tests use fresh local Chrome profiles with software WebGL. File System Access contracts and cancellation are exercised with test handles, not automated native OS dialogs; the real portable-download/file-input paths are exercised end to end. GPU/browser limits and very dense scenes can affect export capacity and label placement. No separate remote ChatGPT Work browser has been used to establish localhost reachability.

This is targeted V0.9 verification, not a claim that every historic script or every browser/GPU configuration was rerun. Screenshots, PNGs, ZIP and portable fixtures are local ignored artifacts under `.verification/`.
