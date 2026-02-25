# Fantastic SVG 项目开发模块地图

为了提高开发效率，本项目的功能模块与代码文件的对应关系如下。在进行功能修改或 Bug 修复时，请优先定位至对应区域。

---

## 1. 核心应用与版本管理 (Project Meta)
- **版本号 & Changelog**: `src/App.tsx` (行 14 - 150)
  - *修改规则*: 每次变更功能后需在此数组首位添加对应版本记录，并同步更新 Header 显示。
- **Header 标题栏**: `src/App.tsx` (行 1189 - 1216)
  - 包含版本号显示及浏览量统计逻辑。

## 2. 动画面板 (Animation Panels)
- **参数控制面板 (Slots & Props)**: `src/App.tsx` (行 1540 - 1840)
  - 包含动画槽位选择、Duration/Delay 调节、动画类型选择 (Picker) 及禁用遮罩逻辑。
- **关键帧时间轴 (Timeline UI)**: `src/components/Timeline.tsx`
  - 负责底部的关键帧刻度渲染、拖拽位置计算及播放控制按钮。
- **动画禁用保护逻辑**: `src/App.tsx` (搜索 `isNoSelection`)
  - 控制当未选中图形时，动画面板与 Timeline 的半透明遮罩叠加。

## 3. 画布渲染与样式 (Canvas & Styles)
- **主渲染循环**: `src/components/Canvas.tsx`
  - 处理所有 Path、Text 及合并图层的 SVG 渲染。
- **全局预设动画 CSS**: `src/components/Canvas.tsx` (搜索 `@keyframes`)
  - 定义了 Spin, Pulse, Float 等各种预设动画的 Keyframes。
- **样式/材质库底层 (Defs)**: `src/components/Defs.tsx`
  - 包含所有 3D 效果、发光、渐变等滤镜的具体 SVG 实现。

## 4. 逻辑控制核心 (Interaction Logic)
- **状态引擎**: `src/hooks/useDraw.ts`
  - 核心 Hook。控制 Mode (Draw/Edit)、选中状态、变换 (Transform)、顶点编辑等。
- **坐标变换 (Mouse to Space)**: `src/hooks/useDraw.ts` -> `inverseTransformPoint`
  - 解决旋转/缩放后的鼠标点击偏移问题。
- **历史记录 (Undo/Redo)**: `src/hooks/useHistory.ts`

## 5. UI 面板功能 (Sidebar & Popups)
- **属性与工具栏**: `src/components/Toolbar.tsx`
  - 颜色选择器、模式切换、滤镜选择、材质库开关。
- **图层管理**: `src/components/LayerPanel.tsx`
  - 图层排序、改名、可见性切换、合并与拆分逻辑。
- **代码与导出导入**: `src/components/CodePanel.tsx`
  - SVG 代码实时生成、Export/Import 逻辑。

## 6. 工具与数据解析 (Utils & Parsing)
- **SVG 解析器**: `src/utils/geometry.ts` -> `parseSVGToPaths`
  - 负责读取外部或导出的 SVG，并完整还原图层、动画、旋转中心等元数据。
- **动画插值**: `src/utils/animation.ts`
  - 处理关键帧之间的数值插值计算。
- **类型定义**: `src/types.ts`
  - 所有核心数据结构的 TypeScript 规范。

---
*注：由于代码处于迭代中，具体行号可能会有 +10/-10 以内的偏差。*
