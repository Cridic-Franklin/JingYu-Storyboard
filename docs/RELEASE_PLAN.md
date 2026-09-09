# Release and platform plan

## Current: 0.3 foundations

The shared scene graph supports synchronized Plan/3D/camera representations, semantic fronts, basic Plan sketches/measurements, camera annotations and individual exports, independent projects and portable files. Existing dark UI, bilingual labels and resizable/maximizable panels are retained.

## Deferred secondary scope

- Secondary subject, detailed camera-target offsets and focus-priority editor.
- Relative-scale prose and approximate projected-overlap reports (world dimensions are already exported).
- Blocking/Plan/Composition/Review workspace presets and automatic outliner grouping.
- ZIP project packaging and a single combined AI Shot Packet action.
- Recovery-backup browsing UI and native file-handle Save behavior.

These are deferred under the request to prioritize foundations over advanced metadata and UI polish.

## Static Web / GitHub Pages

`pnpm build` (or `npm run build` where npm is installed) builds `dist/`. Vite uses relative asset paths, so the same output can be hosted below a repository subpath without a server backend. Source, tests and documentation are ready for a future repository release. Nothing is published or deployed automatically. No open-source license has been selected.

## Future desktop shell

Tauri should remain a thin shell around the existing React application. A DesktopProjectStorage adapter can provide native Open/Save/Save As and filesystem directories. Shared scene logic, Plan drawings, camera overlay configuration and export calculations remain unchanged.

Native menus, project folders, optional GLB placement, installers and future update delivery can be considered in later desktop work. No Tauri runtime, updater, asset import pipeline, accounts or cloud services are part of this release.
