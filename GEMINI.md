# GEMINI.md - Fantastic SVG 项目指令上下文

## 项目概览 (Project Overview)
Fantastic SVG 是一个功能强大的基于 Web 的 SVG 路径绘制与动画设计工具。它支持交互式绘图、实时路径平滑、多重对称模式以及丰富的 CSS 动画系统。

- **核心功能**：
  - **交互绘制**：支持顶点编辑、Catmull-Rom 曲线平滑。
  - **动画系统**：包含 draw, pulse, float, spin, bounce, glow, shake, swing, tada, jump 等预设动画，并支持关键帧编辑。
  - **图层管理**：支持图层合并、排序及可见性控制。
  - **导入导出**：支持 JSON 项目保存及带动画的优化 SVG 导出。
- **技术栈**：React 19, TypeScript, Vite 7, Tailwind CSS 3, Lucide React。

## 关键文件与模块 (Key Files & Modules)
- **`src/App.tsx`**：项目的核心控制器，处理版本记录（Changelog）、UI 状态分发及 SVG 导出逻辑。
- **`src/hooks/useDraw.ts`**：核心逻辑 Hook，负责绘图模式、顶点选择、坐标变换（处理旋转/缩放偏移）及交互状态。
- **`src/components/Canvas.tsx`**：画布渲染组件，定义了所有预设动画的 `@keyframes`。
- **`src/utils/geometry.ts`**：包含核心算法，如路径平滑、对称计算及复杂的 SVG 解析器（用于导入外部 SVG）。
- **`src/components/CodePanel.tsx`**：实时代码生成面板，处理 SVG 的实时预览与编辑应用。
- **`DEVELOPMENT_MAP.md`**：维护项目功能模块与代码行号的对应地图，开发前应先查阅此文件。

## 运行与构建指令 (Scripts)
- **依赖安装**：优先使用 `cnpm install`。
- **本地开发**：`npm run dev`（启动 Vite 开发服务器）。
- **项目构建**：`npm run build`（产物输出至 `dist/` 目录）。
- **代码校验**：`npm run lint`。

## 开发约定 (Development Conventions)
- **简洁至上**：代码逻辑应保持简单直观，优先使用 Vanilla CSS/Tailwind，避免过度设计。
- **版本维护**：新增功能后，需在 `src/App.tsx` 的版本记录数组首位添加更新日志。
- **SVG 解析**：对 SVG 导入的修改应同步更新 `src/utils/geometry.ts` 中的 `parseSVGToPaths` 及其支持的动画类型。
- **动画一致性**：新增动画类型时，需确保在 `Canvas.tsx`（渲染）、`CodePanel.tsx`（实时预览/导出）及 `geometry.ts`（导入解析）三处同步更新。
- **工具使用**：终端命令中使用 `;` 替代 `&&`；优先使用 `Select-String` 替代 `grep`。

## 重点关注 (Priority)
- **坐标系一致性**：修改画布交互时，务必考虑 `zoom` 缩放及路径 `transform` 带来的坐标偏移。
- **SVG 兼容性**：导出的 SVG 必须包含完整的 `@keyframes` 样式，以确保在外部浏览器（如 Chrome）中独立运行。
