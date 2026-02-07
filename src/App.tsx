import React, { useRef } from 'react';
import { Pencil, Square, Circle as CircleIcon, Triangle, Star, Copy, Scissors } from 'lucide-react';
import useDraw from './hooks/useDraw';
import Canvas from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { smoothPath } from './utils/geometry';

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
    undo,
    redo,
    canUndo,
    canRedo,
    clearCanvas,
    setPaths,
    mode,
    setMode,
    selectedPathId,
    setSelectedPathId,
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
    strokeOpacity,
    setStrokeOpacity,
    fillOpacity,
    setFillOpacity,
    animation,
    setAnimation
  } = useDraw();

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Background Image Logic */
  const [backgroundImage, setBackgroundImage] = React.useState<string | null>(null);
  const [bgVisible, setBgVisible] = React.useState(true);
  const bgInputRef = useRef<HTMLInputElement>(null);

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
    const pathsCode = paths.map(path => {
      const d = smoothPath(path.points, path.tension, path.closed);
      const sOp = path.strokeOpacity ?? 1;
      const fOp = path.fillOpacity ?? 1;
      return `\t<path d="${d}" stroke="${path.color}" stroke-opacity="${sOp}" stroke-width="${path.width}" fill="${path.fill || 'none'}" fill-opacity="${fOp}" stroke-linecap="round" stroke-linejoin="round" />`;
    }).join('\n');
    const svgContent = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">\n${pathsCode}\n</svg>`;
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
      else if (ctrl && e.key.toLowerCase() === 'd') { if (selectedPathId) { e.preventDefault(); duplicateSelectedPath(); } }
      else if (e.key === 'Delete' || e.key === 'Backspace') { if (selectedPathId) { e.preventDefault(); deleteSelectedPath(); } }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, duplicateSelectedPath, deleteSelectedPath, selectedPathId]);

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
            PolyCurve <span className="text-primary/50 font-normal">Studio</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-xs font-medium text-secondary hover:text-white transition-colors">Help</button>
          <a href="https://github.com" target="_blank" className="text-xs font-medium text-secondary hover:text-white transition-colors">GitHub</a>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-72 p-4 border-r border-border bg-slate-950 overflow-y-auto">
          <Toolbar
            tension={tension} setTension={setTension}
            symmetry={symmetry} toggleSymmetry={toggleSymmetry}
            undo={undo} redo={redo} canUndo={canUndo} canRedo={canRedo} clear={clearCanvas}
            onSave={handleExportSvg} onSaveJson={handleSaveJson} onLoad={handleLoadClick}
            strokeColor={strokeColor} setStrokeColor={setStrokeColor}
            fillColor={fillColor} setFillColor={setFillColor}
            strokeWidth={strokeWidth} setStrokeWidth={setStrokeWidth}
            isClosed={isClosed} setIsClosed={setIsClosed}
            onBgUpload={handleBgUploadClick} onBgClear={handleClearBg}
            bgVisible={bgVisible} setBgVisible={setBgVisible}
            hasBg={!!backgroundImage} mode={mode} setMode={setMode}
            pointSnappingEnabled={pointSnappingEnabled} setPointSnappingEnabled={setPointSnappingEnabled}
            guideSnappingEnabled={guideSnappingEnabled} setGuideSnappingEnabled={setGuideSnappingEnabled}
            deleteSelectedPath={deleteSelectedPath} duplicateSelectedPath={duplicateSelectedPath}
            selectedPathId={selectedPathId}
            strokeOpacity={strokeOpacity}
            setStrokeOpacity={setStrokeOpacity}
            fillOpacity={fillOpacity}
            setFillOpacity={setFillOpacity}
          />
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
          <input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={handleBgFileChange} />
        </aside>

        <section className="flex-1 bg-[#020617] p-8 overflow-hidden relative flex flex-col items-center justify-center gap-4">
          <div className="flex bg-slate-900/50 backdrop-blur-sm p-1.5 rounded-xl border border-white/5 shadow-xl gap-1">
            <button
              onClick={() => setActiveTool('pen')}
              className={`p-2.5 rounded-lg transition-all active:scale-95 ${activeTool === 'pen' ? 'bg-primary text-background' : 'text-secondary hover:text-white hover:bg-slate-800'}`}
              title="Pen Tool"
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
          </div>

          <div className="relative">
            <div className="w-[800px] h-[600px] shadow-2xl shadow-black/50 rounded-xl relative overflow-hidden">
              <Canvas
                paths={paths} currentPoints={currentPoints} cursorPos={cursorPos}
                onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave} onDoubleClick={handleDoubleClick}
                onContextMenu={handleContextMenu} tension={tension} symmetry={symmetry}
                canvasRef={canvasRef as React.RefObject<HTMLDivElement>}
                isClosed={isClosed} backgroundImage={backgroundImage}
                bgVisible={bgVisible} mode={mode}
                selectedPathId={selectedPathId} onPathSelect={setSelectedPathId}
                isDragging={isDragging} activeTool={activeTool}
                getBoundingBox={getBoundingBox}
              />
            </div>

            {mode === 'edit' && selectedPathId && (
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
          </div>

          {/* Animation Controls Panel */}
          <div className="w-[800px] mt-4 p-4 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/20 rounded-md text-indigo-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Motion Effects</h3>
              </div>
              <div className="flex gap-1.5 p-1 bg-black/40 rounded-lg border border-white/5">
                {(['none', 'draw', 'pulse', 'float', 'spin'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setAnimation({ ...animation, type })}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${animation.type === type ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {animation.type !== 'none' && (
              <div className="grid grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>Duration</span>
                    <span className="text-indigo-400">{animation.duration}s</span>
                  </div>
                  <input
                    type="range" min="0.5" max="10" step="0.1" value={animation.duration}
                    onChange={(e) => setAnimation({ ...animation, duration: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>Delay</span>
                    <span className="text-indigo-400">{animation.delay}s</span>
                  </div>
                  <input
                    type="range" min="0" max="5" step="0.1" value={animation.delay}
                    onChange={(e) => setAnimation({ ...animation, delay: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>Easing</span>
                  </div>
                  <select
                    value={animation.ease}
                    onChange={(e) => setAnimation({ ...animation, ease: e.target.value })}
                    className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1 text-[11px] text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="linear">Linear</option>
                    <option value="ease">Ease</option>
                    <option value="ease-in">Ease In</option>
                    <option value="ease-out">Ease Out</option>
                    <option value="ease-in-out">Ease In-Out</option>
                    <option value="cubic-bezier(0.34, 1.56, 0.64, 1)">Elastic</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
