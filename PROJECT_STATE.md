# JingYu / 镜域 — Project state

Updated: 2026-09-09. Current handoff; replace outdated status rather than accumulating session logs.

## Stable baseline

**V0.9 — Director Workflow & AI Spatial Communication.** Verified implementation is recorded in the commit titled `Implement JingYu V0.9 director and AI spatial workflow` (resolve its hash from Git history). Previous V0.3 baseline: `22a4d250e739b07976bc5e0b76c4cc72be5a4beb`.

The current repository and uncommitted changes are authoritative over conversation history.

## Completed work

- P0: bilingual searchable/scrollable object menu; reusable draft-safe numeric fields; shot aspect/projection and export dimensions; grouped camera size/angle/lens presets; optical/visual focus; shared lights/environment; browser-native file-handle workflow with portable fallback.
- P1: independent primary character/visual subject/secondary/background roles; distinct screen/subject/world data; crop/body visibility and depth semantics; concise semantic TXT/JSON; structured hard-rule validation, edit/continue and separate spatial negatives.
- P2: clean/director/AI frames, Plan PNG, clipboard image, TXT/JSON, six-file current-shot AI ZIP and combined reference board.
- P3: explicit orientation labels, simple label offsets/wrapping, workspace presets, simultaneous Camera/Plan AI Review, numeric tooltips and compact controls.
- Preserved shot management, shared Scene Graph, Plan/3D synchronization, bilingual UI, Maya navigation, resizable workspace, sketches/measurements, undo, portable project data and IndexedDB autosave safety.
- Project schema 4 retains `.jyproject` JSON container version 1 and Dexie schema 2; older projects migrate with defaults and retained IDs. Backups are retained per source schema version.

Five targeted V0.9 browser scripts, migration/file-handle tests, ZIP inspection and TypeScript/production build passed. See [verification](docs/VERIFICATION_V09.md) for exact evidence and limitations. Do not repeat the historical V0.3 suite without a relevant reason.

## Unfinished / deferred work

No core P0/P1 requirement remains intentionally deferred. Optional recently used object shortcuts were not added. GLB/FBX, modeling/animation/editing, AI generation APIs, accounts/cloud/collaboration, Tauri runtime and deployment remain outside V0.9. See the [authorized specification](docs/V09_SPEC.md) and [release plan](docs/RELEASE_PLAN.md).

## Known limitations

- Automatic validation covers structured rules; free-text constraints require explicit manual review.
- Proxy-based crops, body regions, depth layers and semantic front targeting are approximations, without occlusion analysis or physical DOF.
- Dense diagrams can still have overlapping labels; offsets are a lightweight heuristic.
- Browser file handles are session-only and API-dependent; download/import fallback is tested. Native OS dialogs require manual acceptance testing.
- The build retains a non-blocking bundle-size warning. Export sizes are device-limited; the reference board caps exceptionally long text with a continuation notice. Packet camera width defaults to 1920.
- Preview processes/ports are transient. Discover and verify the current address when a preview is requested; remote Work-browser reachability is not established by local Chrome checks.

## Next recommended task

Manual director acceptance testing with real JUST_BREATHE shots: camera presets/lens composition, optical versus visual focus, light direction, crop and constraint interpretation, AI packet readability, and native Save/Open dialogs. Fix concrete findings before proposing further scope. No subsequent milestone is authorized.

## Context map

- [AGENTS.md](AGENTS.md): long-term engineering rules.
- [Architecture](docs/ARCHITECTURE.md): shared graph and module boundaries.
- [Project format](docs/PROJECT_FORMAT.md): persistence and compatibility contracts.
- [AI export](docs/AI_EXPORT.md): outputs, validation boundary and approximations.
- [Release plan](docs/RELEASE_PLAN.md): Web/GitHub/Tauri strategy.
- [V0.9 verification](docs/VERIFICATION_V09.md): tests and artifacts.

Invoke `$jingyu-development` with a concrete task. Skill source: `~/.codex/skills/jingyu-development/SKILL.md` (or the configured Codex home). After meaningful work, update completed work, unfinished work, known issues and next recommended task; only label a newer implementation stable after relevant checks pass and it is committed.
