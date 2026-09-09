# JingYu / 镜域 — Project state

Updated: 2026-09-10. Current repository and uncommitted changes take precedence over conversation history.

## Stable baseline

**V0.95 — Workflow & Blocking Update.** Resolve the release commit from the title `Implement JingYu V0.95 workflow and blocking update`. Previous V0.9 baseline: `4e80019cb256fbb3681a1ac7e838e160c2b176b4`.

## Completed work

- Articulated Character proxy: seven blocking presets, ten editable joints, direct Pose Mode rotation, numeric angles/hip height, shared undo and locking. Posed geometry drives bounds, camera framing and Plan segments; TXT/JSON include pose information.
- Inspector swatches/custom display color for primitives, Character and imported OBJ. Camera/PNG output uses editor colors only with explicit per-shot opt-in; colors do not become AI material instructions.
- Embedded OBJ vertices/faces import, normal object editing and duplication, shared Plan/3D/Camera data, portable save/open and semantic exports.
- Per-workspace validated layouts with internal maximize/restore, float/dock, header dragging, grip resizing and hide. Reset restores the active workspace; layouts persist locally. Hidden Camera panels retain export capability.
- Mathematical golden spiral with four orientations, mirror, normalized offsets, scale/reset and shot persistence. Preview and Director overlays share the same aspect-aware curve.
- Focused text/placeholder/disabled contrast tokens and bilingual controls; visible/package version updated to 0.95.
- Project schema 5, portable container 1 and Dexie schema 2. V0.9 projects migrate with safe defaults and retained IDs. Existing project/storage safety remains in place.
- Preserved V0.9 shot, focus/lens/light, shared Scene Graph, annotations, semantic rules and export workflows.
- Public GitHub documentation now has a Chinese-first bilingual README and changelog; the persistent release-language policy is recorded in `AGENTS.md`.

TypeScript and production build passed. Two targeted V0.95 browser scripts passed, including direct gizmo dragging, all five panels, sixteen guide combinations, OBJ editing/synchronization, portable round-trip, autosave reload, legacy defaults, invalid/newer input rejection, export color isolation and rendered PNG inspection. See [verification](docs/VERIFICATION_V095.md). The historical V0.9 suite was not rerun.

## Unfinished / deferred scope

No required V0.95 feature is intentionally omitted. Optional MTL is not implemented. FBX, advanced/imported rigs, animation, skinning, IK, detached OS windows, Tauri packaging, cloud and AI APIs remain outside scope.

## Known limitations

- OBJ is geometry-only, up to 20 MB source / 100,000 triangles. Polygon faces use fan triangulation: triangulate concave faces before importing. Normals are recomputed; materials/textures/smoothing groups are not retained. Duplicates embed independent data and can enlarge project files.
- Poses are blocking proxies without collision/contact or anatomical joint-limit solving. Plan segments/OBJ projected bounds and camera visibility remain approximations without occlusion analysis.
- Workspace layouts are local browser preferences, intentionally not portable scene data. Existing desktop minimum width remains 1100 px.
- Structured rules are automatically checked; free-text constraints still need manual review. Dense labels may overlap. Native file dialogs remain browser/OS-dependent.
- Production build retains the existing non-blocking bundle-size warning. Export dimensions remain device-limited.
- Development servers/ports are transient; verify the address when opening a preview. Local browser verification does not establish remote Work-browser reachability.

## Next recommended task

Manual director acceptance with real shots and modest triangulated OBJ props: pose/placement convenience, floating workspace comfort, composition guides and export readability. Fix concrete findings; no later milestone is authorized.

## Context map

- [AGENTS.md](AGENTS.md): long-term engineering rules.
- [Architecture](docs/ARCHITECTURE.md): shared graph and module boundaries.
- [Project format](docs/PROJECT_FORMAT.md): persistence and compatibility contracts.
- [AI export](docs/AI_EXPORT.md): outputs, validation boundary and approximations.
- [Release plan](docs/RELEASE_PLAN.md): Web/GitHub/Tauri strategy.
- [V0.95 verification](docs/VERIFICATION_V095.md): current targeted tests and limitations.
- [V0.9 verification](docs/VERIFICATION_V09.md): tests and artifacts.

Invoke `$jingyu-development` with a concrete task. Skill source: `~/.codex/skills/jingyu-development/SKILL.md` (or the configured Codex home). After meaningful work, update completed work, unfinished work, known issues and next recommended task; only label a newer implementation stable after relevant checks pass and it is committed.
