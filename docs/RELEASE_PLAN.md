# Release and platform plan

## Current status

See [PROJECT_STATE.md](../PROJECT_STATE.md) for the stable baseline, completed systems and next task.

## V0.9 director workflow

The authorized [V0.9 specification](V09_SPEC.md) has been implemented across P0–P3. Current status, verification and limitations belong in [PROJECT_STATE.md](../PROJECT_STATE.md).

Optional recent-object shortcuts are not included. Separate sketch-only exports, automatic outliner grouping, projected overlap analysis and ZIP project containers remain future work; they are not required by this V0.9 implementation. Free-text constraints require manual review, while structured rules support automatic validation.

## Static Web / GitHub Pages

`pnpm build` (or `npm run build` where npm is installed) builds `dist/`. Vite uses relative asset paths, so the same output can be hosted below a repository subpath without a server backend. Source, tests and documentation are ready for a future repository release. Nothing is published or deployed automatically. No open-source license has been selected.

## Future desktop shell

Tauri should remain a thin shell around the existing React application. A DesktopProjectStorage adapter can provide native Open/Save/Save As and filesystem directories. Shared scene logic, Plan drawings, camera overlay configuration and export calculations remain unchanged.

Native menus, project folders, optional GLB placement, installers and future update delivery can be considered in later desktop work. No Tauri runtime, updater, asset import pipeline, accounts or cloud services are part of this release.
