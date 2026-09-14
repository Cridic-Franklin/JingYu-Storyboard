# SceneAxis V0.98 发布说明 / Release notes

V0.98 是最后一个完整公开免费的 Community / Beta 候选版本。所有视图继续共享同一 Scene Graph。正式 Tag 与 GitHub Release 尚未创建。

V0.98 is the final fully public, free Community / Beta candidate. Every view continues to derive from one Scene Graph. The formal tag and GitHub Release have not been created.

## 简体中文

### New

- 七域全局导航：Shots、Objects、Scene、Characters、References、Create、Settings。
- Script、Shot Planning、AI Storyboard 是明确标记的 Coming Soon 预览，不含伪功能。
- 镜头卡片 PNG/JPEG 参考图导入、拖放、预览、Fit / Fill、替换、移除与持久化。
- 命令面板、上下文菜单、文字缩放与项目 schema 6。

### Improved

- 旧 `.jyproject` 在替换状态前完成验证与安全迁移，并保留可恢复数据。
- Shot 工作流、Inspector、Plan 工具列、窄桌面布局、Loading / Error / Empty 状态与键盘操作得到收口。

### AI

- 正式定义：AI interprets intent and language. SceneAxis owns spatial truth.
- Faithful / Director 导演表达，以及带 Category / Suggestion / Reason 的 Current Shot Suggestions。
- 输出语言跟随 UI，用户对象名保持原样，结构化建议经过 schema 校验。
- DeepSeek 与 OpenAI-compatible 共用 Provider Adapter；失败或超时不影响本地确定性描述。API Key 仅存在当前标签页内存。

### Spatial

- Character 2.0 改善躯干、骨盆、颈、四肢、手脚与 Body / Head Facing。
- 家具、建筑与车辆低模轮廓增强；Car、Van、Motorcycle 可在 Spatial、Plan、Camera 中识别。
- Spatial Description v3 提供摄影机、对象、运动与关系事实及结构化 JSON。

### Motion

- Camera、Character 与一般对象共用运动路径。
- Spatial 3D / Plan 2D 可选择路径和节点、拖动节点；Inspector 支持 XYZ、Add / Delete、Show / Hide。
- Linear 与真实 Auto Smooth 读取同一数据；Camera Path 为 Gold，其他路径为 Cyan。

### UI / Brand

- 统一 SceneAxis Logo、Glyph、Favicon 与应用图标。
- Dark / Light 使用增强同色阶表面；Chromatic Divider 分为 Key / Soft，保持 Neutral / Cyan / Gold 低饱和细线语言。
- Theme Sun / Moon、Lighting、Settings Gear 与 Search Magnifier 使用不同语义。

### Compatibility

- 便携容器版本保持 1，项目 `schemaVersion` 升级为 6；旧项目继续可读。
- Web 仍是主应用核心；无需后端、账号或云端项目服务。

### Known Issues

- 生产包仍有非阻断体积警告。
- 低模与角色仅服务场面调度，不含 IK、碰撞、建模或完整动画时间线。
- 空间判断是规划近似；AI 浏览器直连受 Provider 与 CORS 影响。
- 旧 V0.95 hidden-camera 字节比较仍有已知失败；当前 Camera 与 Export 专项通过。

## English

### New

- Seven global domains: Shots, Objects, Scene, Characters, References, Create and Settings.
- Script, Shot Planning and AI Storyboard are clearly labeled Coming Soon previews with no fake operations.
- Shot-card PNG/JPEG reference import, drop, preview, fit/fill, replace, remove and persistence.
- Command palette, context menus, text scaling and project schema 6.

### Improved

- Legacy `.jyproject` files are validated and safely migrated before state replacement while recoverable data is retained.
- Shot workflows, Inspector, Plan tool rail, narrow-desktop layout, loading/error/empty states and keyboard access are finalized.

### AI

- Defines: AI interprets intent and language. SceneAxis owns spatial truth.
- Faithful / Director interpretation and Current Shot Suggestions with Category / Suggestion / Reason.
- Output follows the UI language, preserves object names and validates structured schemas.
- DeepSeek and OpenAI-compatible endpoints share one adapter; failures and timeouts retain deterministic output. Keys remain in current-tab memory only.

### Spatial

- Character 2.0 improves torso, pelvis, neck, limbs, hands/feet and Body / Head Facing.
- Furniture, architecture and vehicle silhouettes are clearer; Car, Van and Motorcycle are recognizable in Spatial, Plan and Camera views.
- Spatial Description v3 exposes camera, object, motion and relationship facts plus structured JSON.

### Motion

- Camera, Character and generic objects share motion paths.
- Spatial 3D / Plan 2D support path/point selection and point dragging; Inspector provides XYZ, add/delete and show/hide controls.
- Linear and real Auto Smooth derive from the same data. Camera paths use gold; other paths use cyan.

### UI / Brand

- Unified SceneAxis logo, glyph, favicon and app icon.
- Dark/light themes use stronger tonal surfaces. Key / Soft Chromatic Dividers retain restrained Neutral / Cyan / Gold hairlines.
- Theme Sun / Moon, Lighting, Settings Gear and Search Magnifier use distinct semantics.

### Compatibility

- Portable container version remains 1 while project `schemaVersion` advances to 6; legacy projects remain readable.
- Web remains the application core with no backend, account or cloud project service required.

### Known Issues

- The production bundle retains a non-blocking size warning.
- Low-poly assets and Characters remain blocking proxies without IK, collision, modeling or a full animation timeline.
- Spatial analysis is approximate; direct browser AI calls depend on provider availability and CORS.
- The legacy V0.95 hidden-camera byte-comparison case remains a known failure; current Camera and Export suites pass.
