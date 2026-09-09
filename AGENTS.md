# JingYu / 镜域

- A lightweight spatial storyboard planning and AI spatial communication tool, not Blender, Maya, Photoshop, Premiere or a full DCC.
- Assets are positioned, not modeled. 3D serves blocking, spatial reasoning and composition.
- Plan 2D and Spatial 3D use ONE shared Scene Graph. Camera View is the final projected composition. Derived views must not own competing scene data.
- Sketches are annotations, never scene geometry or a digital painting system.
- Prefer semantic spatial relationships over raw coordinates for human/AI communication.
- Preserve stable systems unless there is a concrete reason to change them. Keep TypeScript modular and implementations simple; avoid unrelated refactors and scope creep.
- Preserve `.jyproject` compatibility wherever practical. Validate before replacing project state; retain recoverable data during migration and storage failures.
- Web remains the main application core, with IndexedDB for persisted local projects. Future Tauri support is a thin platform layer around the same React application.
- Do not introduce backend infrastructure, cloud accounts, collaboration, AI generation APIs, mesh modeling, rigging, animation or media editing systems unless explicitly requested.
- All user-facing release notes, changelogs and public GitHub version summaries must be bilingual, with Simplified Chinese first and English second.

Read `PROJECT_STATE.md` at the start of a development session, then only the relevant linked documentation. Current repository state takes precedence over old conversation history. After implementation changes, run relevant checks, `pnpm build` and the affected browser workflow; documentation-only work does not require application regressions. Update the project state after meaningful work, keeping completed work, unfinished work, known issues and the next task current. Commit implementation work only after relevant verification passes.
