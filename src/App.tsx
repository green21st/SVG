import React, { useRef, useState } from 'react';
import { Pencil, Brush, Square, Circle as CircleIcon, Triangle, Star, Copy, Scissors, Play, Pause, Magnet, LayoutGrid, Undo2, Redo2, Trash2, Type } from 'lucide-react';
import useDraw from './hooks/useDraw';
import Canvas from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { smoothPath, applySymmetry } from './utils/geometry';
import { cn } from './utils/cn';
import { CodePanel } from './components/CodePanel';
import { LayerPanel } from './components/LayerPanel';
import { SVG_DEFS } from './utils/svgDefs';
import { X } from 'lucide-react';

const CHANGELOG = [
  { version: 'v26.0215.1125', date: '2026-02-15', items: ['修复编辑模式下逆时针旋转时角度示意弧线显示异常的问题'] },
  { version: 'v26.0215.1110', date: '2026-02-15', items: ['图层面板支持 Shift 键多选（与 Photoshop 逻辑一致）', '重构选择逻辑，支持单选、Ctrl 多选和 Shift 范围选择'] },
  { version: 'v26.0215.1040', date: '2026-02-15', items: ['修复 CodePanel 导入 SVG 时描边颜色错误（黑色描边）的问题', '修复无描边 SVG 路径添加 Glow 动画时发光效果不显示的问题', 'Glow 动画现在会自动使用填充色作为发光色的回退'] },
  { version: 'v26.0214.1705', date: '2026-02-14', items: ['修复合并图层后，子图案动画在编辑模式下无法正常播放的问题'] },
  { version: 'v26.0214.1655', date: '2026-02-14', items: ['UI调整：移除右上角的版本号显示'] },
  { version: 'v26.0214.1650', date: '2026-02-14', items: ['UI调整：移除动画面板中的标题和版本号显示'] },
  { version: 'v26.0214.1645', date: '2026-02-14', items: ['修复代码面板应用更改后，动画丢失的问题'] },
  { version: 'v26.0214.1635', date: '2026-02-14', items: ['优化代码面板：显示动画关键帧，防止误触锁定代码更新'] },
  { version: 'v26.0214.1610', date: '2026-02-14', items: ['修复导出 SVG 和代码预览时，合并图层的样式（颜色、动画）与画布显示不一致的问题'] },
  { version: 'v26.0214.1522', date: '2026-02-14', items: ['修复合并图层后材质和动画丢失的问题，支持保留子图形的独立样式和动画'] },
  {
    version: 'v26.0214.1425',
    date: '2026-02-14',
    items: ['优化合并图层内的子图形选择逻辑，支持使用Ctrl键多选子图形并进行批量变换', '支持按住Ctrl点击合并图层中的多个子图形', '可对多个选中的子图形进行整体变换(平移/旋转/缩放)', '显示所有选中子图形的整体边界框和控制手柄']
  },
  {
    version: 'v26.0214.1418',
    date: '2026-02-14',
    items: ['修复合并图层中子图形选中后控制框立即消失的问题', '变换操作(平移/旋转/缩放)完成后保持子图形选中状态', '支持对单个子图形进行连续的变换操作']
  },
  {
    version: 'v26.0214.1400',
    date: '2026-02-14',
    items: ['彻底修复合并图层中子图形的控制框显示问题', '优化基于 data-segment-index 的点击命中逻辑，确保子图形变换（平移/旋转/缩放）独立生效', '完善未选中子图形时的整体变换回退机制']
  },
  {
    version: 'v26.0214.1350',
    date: '2026-02-14',
    items: ['完善合并图层中单个图形的选择高亮逻辑', '实现基于 data-segment-index 的子图形精准点击判定', '重构 PathItem 渲染方式，支持合并图层子路径的独立交互']
  },
  {
    version: 'v26.0214.1342',
    date: '2026-02-14',
    items: ['增强编辑模式下的背景点击检测，确保点击空白区域可正确取消选择', '修复合并图层点击判定逻辑，支持子图形的精准再次选中', '优化变换控制框的显示逻辑，仅在子图形被激活时呈现']
  },
  {
    version: 'v26.0214.1258',
    date: '2026-02-14',
    items: ['支持合并图层内部图形的单独编辑（位移）', '新增图层拆分 (Split) 功能，可将合并图层恢复为独立图层', '优化编辑模式下的图形碰撞判定算法']
  },
  {
    version: 'v26.0214.1620',
    date: '2026-02-14',
    items: ['实现图层面板 Ctrl + 点击多选功能', '修改图层合并逻辑为仅合并当前选中的多个图层', '支持多图层同步旋转、缩放与平移变换', '重构选择状态管理以支持批量操作']
  },
  {
    version: 'v26.0214.1205',
    date: '2026-02-14',
    items: ['修复合并图层在旋转/缩放时的路径畸变（破坏）问题', '优化 Canvas 渲染层的路径数据实时更新逻辑', '统一变换操作时的初始状态捕获机制', '修复编辑模式下的点击判定与变量引用错误']
  },
  {
    version: 'v26.0214.1200',
    date: '2026-02-14',
    items: ['修复合并图层后的旋转、缩放与平移变换失效问题', '优化复合路径（Multi-Path）在变换时的同步逻辑', '修复单点拖拽编辑在复合路径下的响应异常']
  },
  {
    version: 'v26.0214.1152',
    date: '2026-02-14',
    items: ['彻底修复合并图层后的异常连接线条', '优化无动画状态下的复合路径渲染', '恢复合并后所有顶点的编辑手柄显示']
  },
  {
    version: 'v26.0214.1143',
    date: '2026-02-14',
    items: ['修复图层合并导致的形状变形问题', '新增复合路径 (Compound Path) 支持', '优化 SVG 导出时的路径生成逻辑']
  },
  {
    version: 'v26.0214.1141',
    date: '2026-02-14',
    items: ['图层面板新增操作栏', '新增图层向下合并与全显合并功能', '支持图层上移/下移调整', '优化图层状态同步']
  },
  {
    version: 'v26.0214.1135',
    date: '2026-02-14',
    items: ['新增缩放/平移功能', '新增缩放比例指示器', '画布增加边界线', '新增精美版本日志对话框']
  },
  {
    version: 'v26.0209.0930',
    date: '2026-02-09',
    items: ['基础绘图功能', '图层管理器', '动画系统']
  }
];

function App() {
  const {
    paths,
    currentPoints,
    cursorPos,
    canvasRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerLeave,
    handleDoubleClick,
    handleContextMenu,
    symmetry,
    toggleSymmetry,
    tension,
    setTension,
    strokeColor,
    setStrokeColor,
    fillColor,
    setFillColor,
    strokeWidth,
    setStrokeWidth,
    isClosed,
    setIsClosed,
    selectedPathIds,
    setSelectedPathIds,
    isDragging,
    handleAddShape,
    activeTool,
    setActiveTool,
    getBoundingBox,
    pointSnappingEnabled,
    setPointSnappingEnabled,
    guideSnappingEnabled,
    setGuideSnappingEnabled,
    deleteSelectedPath,
    duplicateSelectedPath,
    mergeSelected,
    splitSelected,
    moveSelectedUp,
    moveSelectedDown,
    moveSelectedToTop,
    strokeOpacity,
    setStrokeOpacity,
    animation,
    setAnimation,
    setPathsInternal,
    handleAddText,
    fontFamily,
    setFontFamily,
    bgTransform,
    zoom,
    panOffset,
    isSpacePressed,
    undo,
    redo,
    canUndo,
    canRedo,
    clearCanvas,
    setPaths,
    mode,
    setMode,
    handleSelectPath,
    focusedSegmentIndices,
    setFocusedSegmentIndices,
    transformMode,
    transformPivot,
    currentRotationDelta
  } = useDraw();

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Background Image Logic */
  const [backgroundImage, setBackgroundImage] = React.useState<string | null>(null);
  const [bgVisible, setBgVisible] = React.useState(true);
  const bgInputRef = useRef<HTMLInputElement>(null);

  /* Animation Control */
  const [animationPaused, setAnimationPaused] = React.useState(false);
  const [topTextInput, setTopTextInput] = useState('');
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const zoomTimeoutRef = useRef<any>(null);
  const [showChangelog, setShowChangelog] = useState(false);

  // Monitor zoom changes to show indicator
  React.useEffect(() => {
    if (zoom === 1) return; // Optional: skip initial render if needed, but usually zoom change is enough
    setShowZoomIndicator(true);
    if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
    zoomTimeoutRef.current = setTimeout(() => {
      setShowZoomIndicator(false);
    }, 1500);
    return () => {
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
    };
  }, [zoom]);

  const handleBgUploadClick = () => {
    bgInputRef.current?.click();
  };

  const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setBackgroundImage(event.target?.result as string);
      setBgVisible(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleClearBg = () => {
    setBackgroundImage(null);
  };

  const handleLoadClick = () => { fileInputRef.current?.click(); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const data = JSON.parse(json);
        if (Array.isArray(data)) {
          const valid = data.every((item: any) => item.points && Array.isArray(item.points));
          if (valid) setPaths(data);
          else alert('Invalid file format');
        }
      } catch (err) { alert('Failed to load file'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveJson = () => {
    const data = JSON.stringify(paths);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `drawing-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSvg = () => {
    if (!canvasRef.current) return;
    const width = 800;
    const height = 600;

    // Collect all used animation types
    const usedAnimations = new Set<string>();
    paths.filter(p => p.visible !== false).forEach(path => {
      if (path.animation?.types) {
        path.animation.types.forEach(type => {
          if (type !== 'none') usedAnimations.add(type);
        });
      }
      if (path.segmentAnimations) {
        path.segmentAnimations.forEach(anim => {
          if (anim?.types) {
            anim.types.forEach(type => {
              if (type !== 'none') usedAnimations.add(type);
            });
          }
        });
      }
    });

    // Only generate keyframes for used animations
    const keyframeMap: Record<string, string> = {
      draw: '@keyframes drawPath { to { stroke-dashoffset: 0; } }',
      pulse: '@keyframes pulsePath { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }',
      float: '@keyframes floatPath { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(var(--float-dist, -10px)); } }',
      spin: '@keyframes spinPath { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }',
      bounce: '@keyframes bouncePath { 0%, 100% { transform: scale(1); } 40% { transform: scale(1.15, 0.85); } 60% { transform: scale(0.9, 1.1); } 80% { transform: scale(1.05, 0.95); } }',
      glow: '@keyframes glowPath { 0%, 100% { filter: drop-shadow(0 0 2px var(--glow-color, #22d3ee)) brightness(1); } 50% { filter: drop-shadow(0 0 12px var(--glow-color, #22d3ee)) brightness(1.6); } }',
      shake: '@keyframes shakePath { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }',
      swing: '@keyframes swingPath { 0%, 100% { transform: rotate(-10deg); } 50% { transform: rotate(10deg); } }',
      tada: '@keyframes tadaPath { 0% { transform: scale(1); } 10%, 20% { transform: scale(0.9) rotate(-3deg); } 30%, 50%, 70%, 90% { transform: scale(1.1) rotate(3deg); } 40%, 60%, 80% { transform: scale(1.1) rotate(-3deg); } 100% { transform: scale(1) rotate(0); } }'
    };

    const keyframes = Array.from(usedAnimations)
      .map(type => keyframeMap[type])
      .filter(Boolean)
      .join('\n  ');

    const pathsCode = paths.filter(p => p.visible !== false).flatMap(path => {
      const variants = applySymmetry(path.multiPathPoints || path.points, path.symmetry, width / 2, height / 2);

      return variants.map(v => {
        const sOp = path.strokeOpacity ?? 1;
        const fOp = path.fillOpacity ?? 1;
        let finalCode = '';

        if (path.type === 'text') {
          const pt = v.points[0];
          const rotation = path.rotation || 0;
          const sx = v.type === 'H' || v.type === 'C' ? -1 : 1;
          const sy = v.type === 'V' || v.type === 'C' ? -1 : 1;
          const transform = ` transform="translate(${pt.x}, ${pt.y}) scale(${sx}, ${sy}) rotate(${rotation})"`;
          const fill = path.fill || path.color || '#22d3ee';
          const glowColor = (path.color && path.color !== 'none') ? path.color : (fill && fill !== 'none' ? fill : '#22d3ee');
          const glowStyle = path.animation?.types.includes('glow') ? ` style="--glow-color: ${glowColor};"` : '';
          finalCode = `\t<text x="0" y="0" fill="${fill}" fill-opacity="${fOp}" stroke="${path.color || 'none'}" stroke-width="${path.width || 0}" stroke-opacity="${sOp}" font-size="${path.fontSize || 40}" font-family="${path.fontFamily || 'Inter, system-ui, sans-serif'}" text-anchor="middle" dominant-baseline="middle"${transform}${glowStyle}>${path.text}</text>`;
        } else {
          if (path.multiPathPoints && v.multiPoints && v.multiPoints.length > 0) {
            const segments = v.multiPoints.map((seg, sIdx) => {
              const segColor = path.segmentColors?.[sIdx] || path.color || 'none';
              const segFill = path.segmentFills?.[sIdx] || path.fill || 'none';
              const segWidth = path.segmentWidths?.[sIdx] ?? (path.width ?? 2);
              const segAnim = path.segmentAnimations?.[sIdx];
              const segClosed = path.segmentClosed?.[sIdx] ?? path.closed;
              const segTension = path.segmentTensions?.[sIdx] ?? path.tension;

              const d = smoothPath(seg, segTension, segClosed);

              let animWrapperStart = '';
              let animWrapperEnd = '';

              if (segAnim && segAnim.types && segAnim.types.length > 0) {
                const { types, duration, delay, ease, direction = 'forward' } = segAnim;
                types.filter(t => t !== 'none').forEach(type => {
                  let finalDirection = direction === 'forward' ? 'normal' : direction === 'alternate' ? 'alternate' : 'reverse';
                  if (type === 'spin' && (v.type === 'H' || v.type === 'V')) {
                    if (finalDirection === 'normal') finalDirection = 'reverse';
                    else if (finalDirection === 'reverse') finalDirection = 'normal';
                  }

                  let animStyle = `animation: ${type}Path ${duration}s ${ease} ${delay}s infinite forwards; `;
                  if (type.includes('glow')) {
                    const glowColor = (segColor && segColor !== 'none') ? segColor : (segFill && segFill !== 'none' ? segFill : '#22d3ee');
                    animStyle += `--glow-color: ${glowColor}; `;
                  }
                  if (finalDirection !== 'normal') animStyle += `animation-direction: ${finalDirection}; `;
                  if (type === 'draw') animStyle += 'stroke-dasharray: 1000; stroke-dashoffset: 1000; ';
                  if (['spin', 'bounce', 'swing', 'tada'].includes(type)) animStyle += 'transform-origin: center; transform-box: fill-box; ';
                  if (type === 'float' && (v.type === 'V' || v.type === 'C')) animStyle += '--float-dist: 10px; ';

                  animWrapperStart += `<g style="${animStyle}">`;
                  animWrapperEnd = `</g>` + animWrapperEnd;
                });
              }

              return `${animWrapperStart}<path d="${d}" stroke="${segColor}" stroke-opacity="${sOp}" stroke-width="${segWidth}" fill="${segFill}" fill-opacity="${fOp}" stroke-linecap="round" stroke-linejoin="round" />${animWrapperEnd}`;
            }).join('\n');
            finalCode = `<g>${segments}</g>`;
          } else {
            const d = smoothPath(v.multiPoints || v.points, path.tension, path.closed);
            const glowColor = (path.color && path.color !== 'none') ? path.color : (path.fill && path.fill !== 'none' ? path.fill : '#22d3ee');
            finalCode = `\t<path d="${d}" stroke="${path.color || 'none'}" stroke-opacity="${sOp}" stroke-width="${path.width ?? 2}" fill="${path.fill || 'none'}" fill-opacity="${fOp}" stroke-linecap="round" stroke-linejoin="round"${path.animation?.types.includes('glow') ? ` style="--glow-color: ${glowColor};"` : ''} />`;
          }
        }

        if (path.animation && path.animation.types.length > 0) {
          const { types, duration, delay, ease, direction = 'forward' } = path.animation;

          types.filter(t => t !== 'none').forEach(type => {
            let finalDirection: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse' =
              direction === 'forward' ? 'normal' :
                direction === 'alternate' ? 'alternate' : 'reverse';

            let styleStr = `animation: ${type}Path ${duration}s ${ease} ${delay}s infinite forwards;`;
            if (path.animation?.types.includes('glow')) {
              const glowColor = (path.color && path.color !== 'none') ? path.color : (path.fill && path.fill !== 'none' ? path.fill : '#22d3ee');
              styleStr += ` --glow-color: ${glowColor};`;
            }

            if (type === 'spin' && (v.type === 'H' || v.type === 'V')) {
              if (finalDirection === 'normal') finalDirection = 'reverse';
              else if (finalDirection === 'reverse') finalDirection = 'normal';
            }

            if (finalDirection === 'reverse') styleStr += ' animation-direction: reverse;';
            if (finalDirection === 'alternate') styleStr += ' animation-direction: alternate;';

            if (type === 'draw') styleStr += ' stroke-dasharray: 1000; stroke-dashoffset: 1000;';
            if (type === 'spin' || type === 'bounce' || type === 'swing' || type === 'tada') styleStr += ' transform-origin: center; transform-box: fill-box;';

            if (type === 'float' && (v.type === 'V' || v.type === 'C')) {
              styleStr += ' --float-dist: 10px;';
            }

            finalCode = `<g style="${styleStr}">${finalCode}</g>`;
          });
        }

        return finalCode;
      });
    }).join('\n');

    const svgContent = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${SVG_DEFS}
  </defs>
  <style>
${keyframes}
  </style>
${pathsCode}
</svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `drawing-${Date.now()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '');
      if (isInput) return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
      else if (ctrl && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
      else if (ctrl && e.key.toLowerCase() === 'd') { if (selectedPathIds.length > 0) { e.preventDefault(); duplicateSelectedPath(); } }
      else if (e.key === 'Delete' || e.key === 'Backspace') { if (selectedPathIds.length > 0) { e.preventDefault(); deleteSelectedPath(); } }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, duplicateSelectedPath, deleteSelectedPath, selectedPathIds]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30">
      <header className="h-14 border-b border-border bg-slate-950/80 backdrop-blur-md flex items-center px-6 justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-primary to-blue-600 rounded-md flex items-center justify-center shadow-lg shadow-primary/20">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <h1 className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Fantastic <span className="text-primary/50 font-normal">SVG</span>
            <button
              onClick={() => setShowChangelog(true)}
              className="ml-2 text-[10px] font-mono text-slate-500 tracking-tighter align-top opacity-70 hover:opacity-100 hover:text-primary transition-all active:scale-95"
            >
              v26.0215.1125
            </button>
          </h1>
        </div>
        <div className="flex items-center gap-4 bg-slate-900/50 px-3 py-1 rounded-full border border-white/5">
          <span id="busuanzi_container_site_pv" className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5">
            <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
            VIEWS: <span id="busuanzi_value_site_pv" className="text-primary tracking-wider">-</span>
          </span>
          <div className="w-px h-3 bg-white/10"></div>
          <span id="busuanzi_container_site_uv" className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5">
            VISITORS: <span id="busuanzi_value_site_uv" className="text-blue-400 tracking-wider">-</span>
          </span>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-72 border-r border-border bg-slate-950 relative overflow-y-auto">
          <Toolbar
            tension={tension} setTension={setTension}
            onSave={handleExportSvg} onSaveJson={handleSaveJson} onLoad={handleLoadClick}
            strokeColor={strokeColor} setStrokeColor={setStrokeColor}
            fillColor={fillColor} setFillColor={setFillColor}
            strokeWidth={strokeWidth} setStrokeWidth={setStrokeWidth}
            isClosed={isClosed} setIsClosed={setIsClosed}
            onBgUpload={handleBgUploadClick} onBgClear={handleClearBg}
            bgVisible={bgVisible} setBgVisible={setBgVisible}
            hasBg={!!backgroundImage} mode={mode} setMode={setMode}
            strokeOpacity={strokeOpacity}
            setStrokeOpacity={setStrokeOpacity}
            fontFamily={fontFamily}
            setFontFamily={setFontFamily}
            selectedPathType={paths.find(p => selectedPathIds.includes(p.id))?.type}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
          />
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
          <input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={handleBgFileChange} />
        </aside>

        <section className="flex-1 bg-[#020617] p-8 overflow-hidden relative flex flex-col items-center justify-center gap-4">
          <div className="flex bg-slate-900/50 backdrop-blur-sm p-1.5 rounded-xl border border-white/5 shadow-xl gap-1">
            <button
              onClick={() => { setActiveTool('brush'); setMode('draw'); }}
              className={`p-2.5 rounded-lg transition-all active:scale-95 ${activeTool === 'brush' ? 'bg-primary text-background' : 'text-secondary hover:text-white hover:bg-slate-800'}`}
              title="Brush Tool (Freehand)"
            >
              <Brush size={20} />
            </button>
            <button
              onClick={() => { setActiveTool('pen'); setMode('draw'); }}
              className={`p-2.5 rounded-lg transition-all active:scale-95 ${activeTool === 'pen' ? 'bg-primary text-background' : 'text-secondary hover:text-white hover:bg-slate-800'}`}
              title="Pen Tool (Points)"
            >
              <Pencil size={20} />
            </button>
            <div className="w-px h-6 bg-white/10 mx-1 self-center" />
            <button
              onClick={() => handleAddShape('square')}
              className={`p-2.5 rounded-lg transition-all active:scale-95 ${activeTool === 'square' ? 'bg-primary text-background' : 'text-secondary hover:text-white hover:bg-slate-800'}`}
              title="Square Tool"
            >
              <Square size={20} />
            </button>
            <button
              onClick={() => handleAddShape('circle')}
              className={`p-2.5 rounded-lg transition-all active:scale-95 ${activeTool === 'circle' ? 'bg-primary text-background' : 'text-secondary hover:text-white hover:bg-slate-800'}`}
              title="Circle Tool"
            >
              <CircleIcon size={20} />
            </button>
            <button
              onClick={() => handleAddShape('triangle')}
              className={`p-2.5 rounded-lg transition-all active:scale-95 ${activeTool === 'triangle' ? 'bg-primary text-background' : 'text-secondary hover:text-white hover:bg-slate-800'}`}
              title="Triangle Tool"
            >
              <Triangle size={20} />
            </button>
            <button
              onClick={() => handleAddShape('star')}
              className={`p-2.5 rounded-lg transition-all active:scale-95 ${activeTool === 'star' ? 'bg-primary text-background' : 'text-secondary hover:text-white hover:bg-slate-800'}`}
              title="Star Tool"
            >
              <Star size={20} />
            </button>

            <div className="w-px h-6 bg-white/10 mx-1 self-center" />

            <div className="relative group flex items-center">
              <input
                type="text"
                value={topTextInput}
                onChange={(e) => setTopTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && topTextInput.trim()) {
                    handleAddText(topTextInput);
                    setTopTextInput('');
                  }
                }}
                placeholder="Add Text..."
                className="w-32 bg-black/40 border border-white/10 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:w-48 transition-all"
              />
              <Type size={14} className="absolute left-2.5 text-slate-500 group-focus-within:text-primary transition-colors" />
            </div>
          </div>

          <div className="relative">
            {/* Quick Access Sidebar (Snapping & Symmetry) */}
            <div className="absolute -left-16 top-0 flex flex-col gap-2 p-1.5 bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl z-40 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Snapping Group */}
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setPointSnappingEnabled(!pointSnappingEnabled)}
                  className={`p-2.5 rounded-xl transition-all duration-300 active:scale-90 ${pointSnappingEnabled ? 'bg-primary text-background shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                  title="Snap to Points"
                >
                  <Magnet size={20} />
                </button>
                <button
                  onClick={() => setGuideSnappingEnabled(!guideSnappingEnabled)}
                  className={`p-2.5 rounded-xl transition-all duration-300 active:scale-90 ${guideSnappingEnabled ? 'bg-primary text-background shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                  title="Snap to Guides"
                >
                  <LayoutGrid size={20} />
                </button>
              </div>

              <div className="h-px w-6 bg-white/10 mx-auto my-1" />

              {/* Symmetry Group */}
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => toggleSymmetry('horizontal')}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-black transition-all duration-300 active:scale-90 ${symmetry.horizontal ? 'bg-primary text-background shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                  title="Horizontal Symmetry (H)"
                >
                  H
                </button>
                <button
                  onClick={() => toggleSymmetry('vertical')}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-black transition-all duration-300 active:scale-90 ${symmetry.vertical ? 'bg-primary text-background shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                  title="Vertical Symmetry (V)"
                >
                  V
                </button>
                <button
                  onClick={() => toggleSymmetry('center')}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-black transition-all duration-300 active:scale-90 ${symmetry.center ? 'bg-primary text-background shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                  title="Center Symmetry (C)"
                >
                  C
                </button>
              </div>
            </div>

            <div className="w-[800px] h-[600px] shadow-2xl shadow-black/50 rounded-xl relative overflow-hidden">
              <Canvas
                paths={paths} currentPoints={currentPoints} cursorPos={cursorPos}
                onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave} onDoubleClick={handleDoubleClick}
                onContextMenu={handleContextMenu} tension={tension} symmetry={symmetry}
                canvasRef={canvasRef as React.RefObject<HTMLDivElement>}
                isClosed={isClosed} backgroundImage={backgroundImage}
                bgVisible={bgVisible} mode={mode}
                selectedPathIds={selectedPathIds} onPathSelect={(id) => {
                  if (id) setSelectedPathIds([id]);
                  else setSelectedPathIds([]);
                }}
                isDragging={isDragging}
                activeTool={activeTool}
                getBoundingBox={getBoundingBox}
                animationPaused={animationPaused}
                bgTransform={bgTransform}
                zoom={zoom}
                panOffset={panOffset}
                isSpacePressed={isSpacePressed}
                focusedSegmentIndices={focusedSegmentIndices}
                transformMode={transformMode}
                transformPivot={transformPivot}
                currentRotationDelta={currentRotationDelta}
              />

              {/* Zoom Indicator Overlay */}
              <div
                className={cn(
                  "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-500 z-[100]",
                  showZoomIndicator ? "opacity-100 scale-100" : "opacity-0 scale-90"
                )}
              >
                <div className="bg-slate-900/80 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
                  <div className="text-primary-foreground/50 text-[10px] font-black uppercase tracking-[0.2em]">Zoom</div>
                  <div className="text-3xl font-black text-white tabular-nums tracking-tighter">
                    {Math.round(zoom * 100)}%
                  </div>
                </div>
              </div>
            </div>

            {mode === 'edit' && selectedPathIds.length > 0 && (
              <div className="absolute -right-16 top-0 flex flex-col gap-2 p-2 bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl transition-all animate-in fade-in slide-in-from-left-2">
                <button
                  onClick={duplicateSelectedPath}
                  className="p-3 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:scale-110 active:scale-95 transition-all"
                  title="Duplicate (Ctrl+D)"
                >
                  <Copy size={20} />
                </button>
                <button
                  onClick={deleteSelectedPath}
                  className="p-3 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:scale-110 active:scale-95 transition-all"
                  title="Delete (Del/Backspace)"
                >
                  <Scissors size={20} />
                </button>
              </div>
            )}

            {/* Bottom-Right Controls (Undo, Redo, Clear) */}
            <div className="absolute -right-16 bottom-0 flex flex-col gap-2 p-1.5 bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl z-40 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className={`p-2.5 rounded-xl transition-all duration-300 active:scale-90 ${canUndo ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30' : 'text-slate-700 opacity-50 cursor-not-allowed'}`}
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 size={20} />
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className={`p-2.5 rounded-xl transition-all duration-300 active:scale-90 ${canRedo ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30' : 'text-slate-700 opacity-50 cursor-not-allowed'}`}
                  title="Redo (Ctrl+Y)"
                >
                  <Redo2 size={20} />
                </button>
              </div>

              <div className="h-px w-6 bg-white/10 mx-auto my-1" />

              <button
                onClick={clearCanvas}
                className="p-2.5 rounded-xl text-red-400 hover:bg-red-500/20 transition-all duration-300 active:scale-90"
                title="Clear All"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>

          {/* Animation Controls Panel - Compact Version */}
          <div className="w-[800px] mt-4 p-3 bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/10 shadow-xl overflow-hidden">
            <div className="flex items-center gap-4">
              {/* Animation Play/Pause Toggle */}
              <div className="flex items-center gap-2 border-r border-white/5 pr-4">
                <button
                  onClick={() => setAnimationPaused(!animationPaused)}
                  className={`p-1.5 rounded-md transition-all hover:scale-110 active:scale-95 ${animationPaused
                    ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                    : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
                    }`}
                  title={animationPaused ? '播放动画' : '暂停动画'}
                >
                  {animationPaused ? (
                    <Play className="w-3.5 h-3.5" fill="currentColor" />
                  ) : (
                    <Pause className="w-3.5 h-3.5" fill="currentColor" />
                  )}
                </button>
                <div className="grid grid-cols-5 bg-black/40 rounded-lg p-0.5 border border-white/5 gap-0.5">
                  {(['none', 'draw', 'pulse', 'float', 'spin', 'bounce', 'glow', 'shake', 'swing', 'tada'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        if (type === 'none') {
                          setAnimation({ ...animation, types: [] });
                        } else {
                          const newTypes = animation.types.includes(type)
                            ? animation.types.filter(t => t !== type)
                            : [...animation.types, type];
                          setAnimation({ ...animation, types: newTypes });
                        }
                      }}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${(type === 'none' && animation.types.length === 0) || (type !== 'none' && animation.types.includes(type))
                        ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      {type === 'none' ? 'OFF' : type}
                    </button>
                  ))}
                </div>
              </div>

              {animation.types.length > 0 && (
                <div className="flex-1 grid grid-cols-5 gap-3 animate-in fade-in slide-in-from-left-2 duration-300 items-center">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                      <span>Time</span>
                      <span className="text-indigo-400">{animation.duration}s</span>
                    </div>
                    <input
                      type="range" min="0.5" max="10" step="0.1" value={animation.duration}
                      onChange={(e) => setAnimation({ ...animation, duration: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                      <span>Delay</span>
                      <span className="text-indigo-400">{animation.delay}s</span>
                    </div>
                    <input
                      type="range" min="0" max="5" step="0.1" value={animation.delay}
                      onChange={(e) => setAnimation({ ...animation, delay: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                      <span>Ease</span>
                    </div>
                    <select
                      value={animation.ease}
                      onChange={(e) => setAnimation({ ...animation, ease: e.target.value })}
                      className="bg-black/40 border border-white/5 rounded-md px-2 py-0.5 text-[10px] text-white focus:outline-none"
                    >
                      <option value="linear">Linear</option>
                      <option value="ease">Ease</option>
                      <option value="ease-in-out">Smooth</option>
                      <option value="cubic-bezier(0.34, 1.56, 0.64, 1)">Elastic</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 col-span-2">
                    <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                      <span>Direction</span>
                    </div>
                    <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/5">
                      {(['forward', 'reverse', 'alternate'] as const).map((dir) => (
                        <button
                          key={dir}
                          onClick={() => setAnimation({ ...animation, direction: dir })}
                          className={`flex-1 py-1 rounded text-[10px] font-medium transition-all ${animation.direction === dir ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}
                        >
                          {dir.charAt(0).toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {animation.types.length === 0 && (
                <div className="flex-1 text-[10px] text-slate-600 font-medium italic">
                  Select an effect to unlock motion controls
                </div>
              )}
            </div>
          </div>
        </section>
        <aside className="w-80 p-4 border-l border-border bg-slate-950 flex flex-col gap-4 overflow-hidden">
          <div className="flex-[3] min-h-0 flex flex-col">
            <LayerPanel
              paths={paths}
              selectedPathIds={selectedPathIds}
              onSelect={handleSelectPath}
              onReorder={setPathsInternal}
              onReorderEnd={setPaths}
              onToggleVisibility={(id) => setPaths(prev => prev.map(p => p.id === id ? { ...p, visible: !p.visible } : p))}
              onDelete={(id) => {
                setPaths(prev => prev.filter(p => p.id !== id));
                setSelectedPathIds(prev => prev.filter(item => item !== id));
              }}
              onMerge={mergeSelected}
              onSplit={splitSelected}
              onMoveUp={moveSelectedUp}
              onMoveDown={moveSelectedDown}
              onMoveToTop={moveSelectedToTop}
            />
          </div>
          <div className="flex-[2] min-h-0 flex flex-col">
            <CodePanel paths={paths} tension={tension} isDragging={isDragging} onApplyCode={setPaths} />
          </div>
        </aside>
      </main>

      {/* Changelog Modal */}
      {showChangelog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-800/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                更新日志
              </h2>
              <button
                onClick={() => setShowChangelog(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6 custom-scrollbar">
              {CHANGELOG.map((log) => (
                <div key={log.version} className="relative pl-6 border-l-2 border-primary/20 hover:border-primary/50 transition-colors">
                  <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-sm font-black text-white font-mono">{log.version}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{log.date}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {log.items.map((item, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-white/20 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 bg-slate-800/30 border-t border-white/5 text-center">
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                感谢使用 Fantastic SVG · 祝您创作愉快
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
