# Release and platform plan

## Current status

See [PROJECT_STATE.md](../PROJECT_STATE.md) for the stable baseline, completed systems and next task.

## V0.9 director workflow

已授权的 [V0.9 规格](V09_SPEC.md)已完成 P0–P3，加入导演工作流、摄影机焦点、空间语义、灯光、约束检查与 AI 镜头资料导出。当前状态、验证范围与限制记录在 [PROJECT_STATE.md](../PROJECT_STATE.md)。

The authorized [V0.9 specification](V09_SPEC.md) has been implemented across P0–P3, adding the director workflow, camera focus, spatial semantics, lights, constraint validation and AI shot-material exports. Current status, verification and limitations belong in [PROJECT_STATE.md](../PROJECT_STATE.md).

可选的最近对象快捷方式、独立草图导出、自动大纲分组、投影重叠分析与 ZIP 项目容器未包含在 V0.9 中。自由文本约束需要人工复核，结构化规则支持自动验证。

Optional recent-object shortcuts, separate sketch-only exports, automatic outliner grouping, projected overlap analysis and ZIP project containers are not included in V0.9. Free-text constraints require manual review, while structured rules support automatic validation.

## V0.95 workflow and blocking

新增轻量角色姿势、内嵌 OBJ 调度、编辑显示颜色、按工作区保存的内部面板，以及可调整的黄金螺旋构图辅助线。本版本不包含动画、进阶绑定、FBX 或桌面打包。当前验证与限制见 [PROJECT_STATE.md](../PROJECT_STATE.md)。

Adds lightweight proxy poses, embedded OBJ placement, editor colors, per-workspace internal panels and adjustable Golden Spiral composition guides. This release does not introduce animation, advanced rigging, FBX or desktop packaging. Current verification and remaining limits are in [PROJECT_STATE.md](../PROJECT_STATE.md).

## Static Web / GitHub Pages

`pnpm build` (or `npm run build` where npm is installed) builds `dist/`. Vite uses relative asset paths, so the same output can be hosted below a repository subpath without a server backend. Source, tests and documentation are ready for a future repository release. Nothing is published or deployed automatically. No open-source license has been selected.

## Future desktop shell

Tauri should remain a thin shell around the existing React application. A DesktopProjectStorage adapter can provide native Open/Save/Save As and filesystem directories. Shared scene logic, Plan drawings, camera overlay configuration and export calculations remain unchanged.

Native menus, project folders, optional GLB placement, installers and future update delivery can be considered in later desktop work. No Tauri runtime, updater, advanced asset pipeline, accounts or cloud services are part of this release.
