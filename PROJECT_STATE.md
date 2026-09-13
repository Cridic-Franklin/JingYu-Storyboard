# JingYu / 镜域 — Project state

Updated: 2026-09-13. Current repository and uncommitted changes take precedence over conversation history.

## Stable baseline

**V0.96 — UI Professionalization Update.** The V0.96 release freezes the existing professional desktop UI pass without changing the shared Scene Graph, project data structure, persistence logic or core business logic. Previous V0.95 baseline: `091d736` (`Implement JingYu V0.95 workflow and blocking update`).

## Completed work

- Articulated Character proxy: seven blocking presets, ten editable joints, direct Pose Mode rotation, numeric angles/hip height, shared undo and locking. Posed geometry drives bounds, camera framing and Plan segments; TXT/JSON include pose information.
- Inspector swatches/custom display color for primitives, Character and imported OBJ. Camera/PNG output uses editor colors only with explicit per-shot opt-in; colors do not become AI material instructions.
- Embedded OBJ vertices/faces import, normal object editing and duplication, shared Plan/3D/Camera data, portable save/open and semantic exports.
- Per-workspace validated layouts with internal maximize/restore, float/dock, header dragging, grip resizing and hide. Reset restores the active workspace; layouts persist locally. Hidden Camera panels retain export capability.
- Mathematical golden spiral with four orientations, mirror, normalized offsets, scale/reset and shot persistence. Preview and Director overlays share the same aspect-aware curve.
- Focused text/placeholder/disabled contrast tokens and bilingual controls; visible/package version updated to 0.96.
- Project schema 5, portable container 1 and Dexie schema 2. V0.9 projects migrate with safe defaults and retained IDs. Existing project/storage safety remains in place.
- Preserved V0.9 shot, focus/lens/light, shared Scene Graph, annotations, semantic rules and export workflows.
- Public GitHub documentation now has a Chinese-first bilingual README and changelog; the persistent release-language policy is recorded in `AGENTS.md`.
- Public-release preparation adds an all-rights-reserved source notice, focused ignore rules, a bilingual Windows setup guide, the verified production demo link and a bilingual security policy. Repository visibility remains unchanged.
- Professional desktop UI pass: centralized dark editor tokens, clearer chrome/panel/canvas hierarchy, consistent compact controls and states, accessible SVG panel controls, improved modal/loading/error/empty treatments, reduced-motion support, and wrapped export actions at narrow desktop widths. Business logic and the shared Scene Graph are unchanged; see [UI design system](docs/UI_DESIGN_SYSTEM.md). This work is released as V0.96.

V0.96 release verification passed: TypeScript and production build, the V0.95 main targeted browser workflow, and a live V0.96 desktop-shell check covering version display, bilingual switching and primary workspace surfaces without runtime errors. The V0.95 edge script retains its documented timing-sensitive undo / redo assertion; two release runs reached opposite expected values at that assertion, so it remains inconclusive rather than a reproduced product regression. The historical V0.9 suite was not rerun. See [verification](docs/VERIFICATION_V095.md).

## Unfinished / deferred scope

No required V0.95 feature is intentionally omitted. Optional MTL is not implemented. FBX, advanced/imported rigs, animation, skinning, IK, detached OS windows, Tauri packaging, cloud and AI APIs remain outside scope.

## Known limitations

- OBJ is geometry-only, up to 20 MB source / 100,000 triangles. Polygon faces use fan triangulation: triangulate concave faces before importing. Normals are recomputed; materials/textures/smoothing groups are not retained. Duplicates embed independent data and can enlarge project files.
- Poses are blocking proxies without collision/contact or anatomical joint-limit solving. Plan segments/OBJ projected bounds and camera visibility remain approximations without occlusion analysis.
- Workspace layouts are local browser preferences, intentionally not portable scene data. The desktop workspace minimum width is 960 px; it is not designed as a phone interface.
- Structured rules are automatically checked; free-text constraints still need manual review. Dense labels may overlap. Native file dialogs remain browser/OS-dependent.
- Production build retains the existing non-blocking bundle-size warning. Export dimensions remain device-limited.
- Development servers/ports are transient; verify the address when opening a preview. Local browser verification does not establish remote Work-browser reachability.
- The V0.95 edge browser script has timing-sensitive undo/redo and exact PNG-byte assertions that can fail at different points across repeated runs. The main V0.95 workflow, affected manual browser checks and production build pass; treat an isolated edge-script failure as inconclusive until the interaction or rendered output is independently reproduced.

## Next recommended task

Director review of the refreshed desktop workspace with real bilingual projects, followed by fixes for concrete density or readability findings. Public visibility and GitHub security settings remain owner-controlled.

## Context map

- [AGENTS.md](AGENTS.md): long-term engineering rules.
- [Architecture](docs/ARCHITECTURE.md): shared graph and module boundaries.
- [Project format](docs/PROJECT_FORMAT.md): persistence and compatibility contracts.
- [AI export](docs/AI_EXPORT.md): outputs, validation boundary and approximations.
- [Release plan](docs/RELEASE_PLAN.md): Web/GitHub/Tauri strategy.
- [UI design system](docs/UI_DESIGN_SYSTEM.md): visual tokens, component states and desktop layout rules.
- [V0.95 verification](docs/VERIFICATION_V095.md): current targeted tests and limitations.
- [V0.9 verification](docs/VERIFICATION_V09.md): tests and artifacts.

Invoke `$jingyu-development` with a concrete task. Skill source: `~/.codex/skills/jingyu-development/SKILL.md` (or the configured Codex home). After meaningful work, update completed work, unfinished work, known issues and next recommended task; only label a newer implementation stable after relevant checks pass and it is committed.
