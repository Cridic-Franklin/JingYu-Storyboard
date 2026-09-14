# SceneAxis / 镜域 — Project state

Updated: 2026-09-14. Current repository and uncommitted changes take precedence over conversation history.

## Release candidate

**V0.98 — SceneAxis Productization Update.** V0.96 remains the last committed stable tag until the V0.98 release verification and commit complete.

## V0.98 completed implementation

- Official SceneAxis brand SVGs are used for the header, navigation glyph, favicon and application icon. The unchanged source package is retained under `docs/design/sceneaxis-v1`.
- The desktop shell now provides seven global navigation sections (Shots, Objects, Scene, Characters, References, Create and Settings), grouped shot cards, compact contextual actions, a command palette, dark/light themes and text scaling. Create is an honest preview surface: Script, Shot Planning and AI Storyboard are labeled Coming Soon and expose no fake operations.
- Shot schema 6 adds duration, sequence, shot type, Notes, structured PNG/JPEG references, motion paths and optional AI-enhanced prose.
- The blocking library includes furniture, architecture, vehicles and props. Character 2.0 adds a clearer body hierarchy, independent head facing and semantic type while keeping the existing pose/undo workflow.
- Motion paths use stable owner IDs and ordered world-space points. Linear or Auto Smooth paths render from the same data in Spatial 3D and Plan 2D; both views now select and drag path points directly, while Inspector provides precise point selection, XYZ editing and add/delete alternatives.
- Spatial Description v3 exposes deterministic camera, object, motion and relationship facts plus JSON inspection. The optional AI Semantic & Creative Assistance Layer follows “AI interprets intent and language. SceneAxis owns spatial truth,” with Faithful / Director interpretation modes, UI-language constraints, low-difference detection and validated Current Shot Suggestions.
- AI keys exist in runtime memory only. They are excluded from preferences, projects, IndexedDB, exports, logs and repository files.
- Legacy `.jyproject` containers remain readable. Schema migrations validate before replacement, retain recoverable data and back up pre-schema-6 IndexedDB records.
- V0.98 specification, architecture, format, AI boundary, spatial description and Chinese-first bilingual release documents are present under `docs/`.

## Verification status

The V0.98 foundation check passes (schema/migration, Character + motion path, Spatial Description v3, reference persistence, shot undo/redo, command palette, theme and session-only AI key). The correction pass also passes TypeScript and `pnpm build`, with real Chrome verification for all reference states, PNG/JPEG, preview, fit/fill, replace/remove, card drop, persistence, tool shortcuts, actual Plan move/rotate/scale/pan, measurement, all annotation tools, View options, tooltip delay, three views and Inspector navigation. Eight screenshots cover both themes at 1920×1080, 1440×900, 1366×768 and 1024×768; a ninth covers Chinese 1024px with the annotation flyout. No page overflow or console errors occurred in the correction suite.

Camera projection/PNG/focus/light checks and AI shot packet/reference board/clean-director-AI PNG/clipboard/portable project round-trip checks passed after the toolbar adapter update. Prior passing migration/storage/semantics evidence remains applicable; unrelated older harnesses are not newly certified by this correction pass. V0.98 is still a release candidate, not a newly published stable tag.

The Final Product Polish & AI Definition workflow passes `scripts/verify-v098-final-polish.cjs`: seven-domain IA, preview-only future modules, Key/Soft divider tokens in both themes, low-poly Character/vehicle implementation, shared motion-path point drag/delete, bilingual Faithful/Director prompts, object-name preservation, suggestion schema validation, timeout handling, OpenAI-compatible provider isolation, session-only keys and 1366×768 overflow/console checks. The full correction, V0.98 foundation, targeted camera and V0.9 export suites were rerun afterward and pass. `pnpm build` passes; the known bundle-size warning remains.

The RC regression also passes the updated foundation, storage, V0.9 storage/semantics and V0.95 workflows: project create/open/save and invalid-file safety, shot and scene undo/redo, native/fallback file handling, pose/OBJ/guide coverage, portable round-trip and workspace panel behavior. Compact/default/large text sizes are checked without page overflow at 1920×1080, 1440×900, 1366×768 and 1024×768. Browser runs report no application console errors.

## GitHub release readiness audit

- `origin/main` was fetched on 2026-09-14; local HEAD and origin were 0 ahead / 0 behind before the RC commit. Only `main` exists locally/remotely; no stale branches were found.
- Working-tree and release-file scans found no `.env`, API keys, access tokens, private keys, credentials, local databases or unignored build/test/cache output. `node_modules`, `dist`, browser output, local stores, logs, environment files, runtime/cache/temp directories and common databases are ignored.
- README now presents V0.98 accurately, includes real dark/light UI previews, clone/install/run/build instructions, BYOK boundaries, limitations, roadmap, license and feedback guidance. Release notes use New / Improved / AI / Spatial / Motion / UI & Brand / Compatibility / Known Issues. Basic bug and feature request templates are included.
- Package metadata is `sceneaxis` 0.98.0, private, with Node >=20.19 and pnpm 12.3.4 declared. Brand/favicons are present. The largest intended release asset is the 2.68 MB North Star PNG; no accidental tracked build artifact or binary was found.
- Current `LICENSE` is an all-rights-reserved source-available notice and still names the JingYu project authors. It is not an open-source license. It was audited but not changed; the owner must explicitly accept or revise that policy before a public V0.98 release.
- No automation-accessible real provider credential or attachable configured browser tab was available. Mock/intercepted provider, unavailable, timeout, schema, retry and no-mutation behavior pass, but one successful real DeepSeek/OpenAI-compatible Chinese + English RC request remains required.

## UI / UX Correction Pass

- Reference import, drop, replacement, preview and fit/fill now live in Shot Cards; the standalone bottom reference panel is removed. Empty/loading/valid/failed states preserve existing recoverable data. The known green PNG was isolated verification data; its exact fixture was removed only from the agent's test browser and replaced with neutral generated test data in the verification script. Default scenes never create it.
- The viewport uses a shared SVG icon-first left rail with a 400ms tooltip, explicit Pan and a secondary Annotate flyout. View options owns snap and visibility controls. Plan scale is a thin adapter to the same object transform mutation.
- The default Plan bottom area is more generous on large screens; at 1024px both Camera Preview and Spatial Description remain visible. Inspector has working object/scene/environment navigation.
- Cold-gray Light and restrained Dark surfaces use tonal gradients; Cyan remains interaction, Gold remains camera/spatial intent. The **SceneAxis Chromatic Divider** uses theme-specific 1px neutral/cyan/neutral/gold/neutral lines only on selected high-level boundaries and active tabs.
- Final polish increases tonal-gradient perceptibility by roughly 20–35% over the correction baseline without increasing accent saturation. Chromatic Divider now has explicit Key and Soft levels with separate whitelists. Character gains tapered torso, pelvis, neck, hands, ankles/feet and independent Plan head-facing indication; Car, Van and Motorcycle receive recognizable low-poly silhouettes in Plan and Spatial/Camera rendering.
- Design rules: `docs/UI_DESIGN_SYSTEM.md`. Regression entry points: `scripts/verify-ui-correction.cjs`, `scripts/verify-v098.cjs`, `scripts/verify-v09-camera.cjs`, `scripts/verify-v09-export.cjs`. Screenshots: `output/playwright/correction-*` (local ignored verification artifacts).
- Remaining North Star differences: the scene is live low-poly blocking, not concept-art ruins or cinematic character imagery; shot cards retain a vertical thumbnail/details layout rather than the concept's compact horizontal rows; the workspace retains separate shot-title and camera-preset strips; Inspector exposes more technical fields than the concept's condensed camera sheet. No fake timeline/boards or image-generation controls were added to simulate concept-only capabilities.

## Known limitations

- Low-poly assets and Characters are blocking proxies without IK, collision/contact, mesh modeling or an animation timeline.
- Projection, crop/body visibility, depth and spatial relationships are planning approximations without occlusion analysis.
- Optional AI direct calls depend on provider availability and browser CORS. No image generation or autonomous blocking solver is exposed.
- OBJ remains geometry-only. The production bundle retains its existing non-blocking size warning.
- The older V0.95 edge harness has a known byte-for-byte hidden-camera PNG comparison failure from the preceding verification; the dedicated camera and export workflows pass. Full pixel determinism is not claimed.
- No real external AI provider request was executed because no user API key was supplied. Provider behavior, failure states and structured suggestions were verified through an intercepted OpenAI-compatible endpoint; actual provider availability and browser CORS remain environmental.

## Deferred scope

Backend infrastructure, accounts, cloud persistence, collaboration, image generation, autonomous scene mutation, advanced rigs, media editing, full DCC features and Tauri packaging remain outside V0.98.

## Next recommended task

The V0.98 worktree is suitable for human release-candidate review. Public release remains blocked on a successful real-provider bilingual AI check and explicit owner acceptance or revision of the current all-rights-reserved/JingYu-named license. Before publishing, also explicitly accept the production bundle-size warning and the legacy V0.95 hidden-camera byte-comparison limitation. After release, move V0.99 commercial plans, accounts, licensing/DRM, payment, hosted APIs and private product strategy to a private repository before implementation.
