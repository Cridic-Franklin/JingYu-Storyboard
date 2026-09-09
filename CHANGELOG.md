# 更新日志 / Changelog

所有面向用户的版本记录均按简体中文在前、英文在后的顺序编写。<br>
All user-facing release notes are written in Simplified Chinese first, followed by English.

## V0.95 — 工作流与场面调度更新

### 简体中文

- 新增轻量角色姿势系统：七种常用姿势预设、十个主要关节、视口直接旋转、数值调整、撤销 / 重做与锁定保护。
- 姿势会改变实际角色几何与边界，并同步用于空间三维视图、摄影机画面、二维平面图和空间 TXT / JSON。
- 新增对象显示颜色，适用于角色、基础几何体和导入 OBJ；只有显式启用后才用于摄影机与 PNG 导出，不会自动成为 AI 材质语义。
- 新增自包含 OBJ 几何导入。导入对象使用普通场景图变换、显示 / 锁定、复制 / 删除和语义导出，并可随 `.jyproject` 保存和重新打开。
- 五个主要面板新增最大化 / 还原、浮动 / 停靠、移动、调整尺寸和隐藏；各工作区分别保存有效布局，重置布局只恢复当前工作区。
- 黄金螺旋改为随画幅动态计算，支持四个方向、镜像、偏移、缩放和重置，并在预览、AI 复核与相关导出中保持一致。
- 改善深色界面中次要文字、占位符与禁用状态的对比度。
- 项目格式升级为 schema 5；V0.9 项目获得安全默认值，保留原有 ID、场景与存储保护。

### English

- Added a lightweight Character pose system with seven practical presets, ten major joints, direct viewport rotation, numeric adjustment, undo / redo and lock protection.
- Poses alter actual Character geometry and bounds used by Spatial 3D, Camera View, Plan 2D and spatial TXT / JSON.
- Added display colors for Characters, primitives and imported OBJ objects. Colors affect Camera and PNG output only after explicit opt-in and never become AI material semantics automatically.
- Added self-contained OBJ geometry import. Imported objects use normal Scene Graph transforms, visibility / locking, duplication / deletion and semantic exports, and survive `.jyproject` save and reopen.
- Added maximize / restore, float / dock, move, resize and hide controls to the five major panels. Each workspace retains its own valid layout, and Reset Layout restores only the active workspace.
- Rebuilt Golden Spiral generation around the current frame, with four orientations, mirror, offset, scale and reset controls shared across preview, AI Review and relevant exports.
- Improved contrast for secondary text, placeholders and disabled controls while retaining the dark JingYu interface.
- Advanced the project format to schema 5. V0.9 projects receive safe defaults while retaining existing IDs, scene data and storage protection.

## V0.9 — 导演工作流与 AI 空间沟通

### 简体中文

- 新增可搜索、可滚动的双语对象菜单，以及允许安全输入负数和小数的通用数值字段。
- 新增镜头画幅比例、对应导出尺寸，以及分组的景别、机位角度和焦距预设。
- 新增对象 / 世界点光学焦点、摄影机画面取点和矩形 / 椭圆视觉重点区域。
- 新增共享场景图中的平行光、点光源、聚光灯与环境光控制，以及平面图灯光方向提示。
- 新增浏览器文件句柄 Open / Save / Save As、便携下载回退与取消操作保护。
- 将主要角色、主要视觉主体、次要主体和背景参照物拆分为独立角色，并扩展画面、主体、裁切、身体可见区域和景深层次语义。
- 新增结构化空间约束检查、编辑 / 继续流程，以及独立的自由文本约束和空间否定说明。
- 新增 Clean / Director / AI 摄影机画面、平面图、语义 TXT / JSON、当前镜头 AI 镜头包 ZIP 与 AI 参考板。
- 新增工作区预设、AI 复核布局、明确的朝向文字与标签偏移，同时保留共享场景图和已有可调整界面。
- 项目格式升级为 schema 4，并加入旧项目默认值、按来源版本备份和稳定 ID 保留。

### English

- Added a searchable, scrollable bilingual object menu and reusable numeric fields that safely accept draft negative and decimal input.
- Added shot-level aspect ratio, matching export dimensions and grouped shot-size, camera-angle and lens presets.
- Added object / world-point optical focus, camera-view point picking and rectangle / ellipse visual focus regions.
- Added directional, point and spot lights in the shared Scene Graph, environment controls and Plan light-direction indicators.
- Added browser file-handle Open / Save / Save As, portable-download fallback and cancellation protection.
- Separated Primary Character, Primary Visual Subject, Secondary Subject and Background Anchor roles, with richer screen, subject, crop, body-visibility and depth-layer semantics.
- Added structured spatial-constraint validation with edit / continue flow, plus separate free-text constraints and spatial negatives.
- Added Clean / Director / AI Camera frames, Plan output, semantic TXT / JSON, current-shot AI Shot Packet ZIP and AI Reference Board.
- Added workspace presets, AI Review, explicit orientation text and label offsets while preserving the shared Scene Graph and existing resizable interface.
- Advanced the project format to schema 4 with legacy defaults, source-version backups and stable ID preservation.

## V0.3 — 平面图与空间导出基础

### 简体中文

- 在空间三维视图、摄影机预览与描述所使用的同一镜头对象数组上新增俯视平面图。
- 支持在平面图中编辑 X / Z 并保留 Y，旋转、重命名、复制非摄影机对象，以及吸附、撤销与重做。
- 新增语义正面箭头、高度标签、摄影机视锥、对象锚定测量和独立草图标注。
- 新增摄影机标注、摄影机 / 平面图 PNG、语义 TXT / JSON、剪贴板图像回退和便携项目 Open / Save / Save As。
- 保留深色界面、双语 UI、对象变换、可调整面板与构图辅助线，并让静态构建路径可用于子目录托管。

### English

- Added a top-down Plan View over the same shot object array used by Spatial 3D, Camera Preview and descriptions.
- Added X / Z editing while preserving Y, rotation, rename, non-camera duplication, snapping, undo and redo.
- Added semantic-front arrows, height labels, camera frusta, object-anchored measurements and independent sketch annotations.
- Added Camera annotations, Camera / Plan PNG, semantic TXT / JSON, image-clipboard fallback and portable project Open / Save / Save As.
- Preserved the dark interface, bilingual UI, object transforms, resizable panels and composition guides, and made static build paths suitable for subdirectory hosting.
