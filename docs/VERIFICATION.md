# V0.3 verification record

Verified on 2026-09-09 against the preserved V0.2 baseline `4bfc24d`.

## Passed

- `node scripts/verify.cjs`: original blocking workflow, character/prop/camera gizmo transforms, complete-drag undo/redo, camera pixel updates, guides, descriptions, clipboard text, image import/removal, IndexedDB reload, deletion and shot isolation.
- `node scripts/verify-v02.cjs`: bilingual UI and persistence, primitives, stable object IDs and renaming, visibility/locking, labels, frame percentages, Maya navigation and shortcuts, resizable/maximized panels, layout reset, duplicate/copy shot independence and older-record defaults.
- `node scripts/verify-foundations.cjs` (completed before finalization): shared Plan/3D data, preserved Y height, snapping, undo, semantic fronts, FOV frusta, anchored measurements, sketches, live descriptions, annotations, camera/plan PNGs, clipboard image, spatial JSON, independent projects, portable project/image round-trip, reload and incompatible-file rejection.
- `node scripts/verify-storage.cjs` (completed before finalization): untouched V0.2 migration backup, compatible migration, retained future-version records, recovery write protection, independent recovery project, invalid-scene rejection and autosave-failure/retry safety.
- `pnpm build`: TypeScript project check (`tsc -b`) and Vite production build passed. Vite reports a non-blocking large-chunk warning.
- Focused final browser smoke: Plan sketch/measurement tools return to selection through the transform toolbar and Q/W/E; all three views mount without browser errors.
- Exported Camera and Plan images were visually inspected during implementation, including label placement and readability.
- `git diff --check`: passed.

The already-passing foundation and storage suites were preserved rather than unnecessarily rerun during finalization. The remaining V0.2 regression required a textbox-specific Chinese Object Name selector because the new annotation checkbox shares that label; no product change was needed for that test failure.

Browser checks use a fresh local Chrome profile via Playwright with WebGL enabled. They do not modify the user's browser projects. Scripts accept `APP_URL` for the actual development-server address and `PLAYWRIGHT_MODULE` when using the bundled Playwright runtime.

## Current limits

See RELEASE_PLAN.md for the explicitly deferred secondary scope. Portable `.jyproject` files use self-contained JSON rather than ZIP. There are no known blocking runtime or project-safety failures in the tested workflows. Local Chrome verification does not independently establish reachability from a separate remote ChatGPT Work browser.
