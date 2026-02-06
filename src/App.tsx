import React, { useRef } from 'react';
import { Square, Circle as CircleIcon, Triangle, Star, Pencil } from 'lucide-react';
import useDraw from './hooks/useDraw';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { CodePanel } from './components/CodePanel';
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
    setActiveTool
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

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

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
          if (valid) {
            setPaths(data);
          } else {
            alert('Invalid file format');
          }
        }
      } catch (err) {
        console.error('Failed to parse JSON', err);
        alert('Failed to load file');
      }
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
      return `\t<path d="${d}" stroke="${path.color}" stroke-width="${path.width}" fill="${path.fill || 'none'}" stroke-linecap="round" stroke-linejoin="round" />`;
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
          <button className="text-xs font-medium text-secondary hover:text-white transition-colors">
            Help
          </button>
          <a href="https://github.com" target="_blank" className="text-xs font-medium text-secondary hover:text-white transition-colors">
            GitHub
          </a>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-72 p-4 border-r border-border bg-slate-950 overflow-y-auto">
          <Toolbar
            tension={tension}
            setTension={setTension}
            symmetry={symmetry}
            toggleSymmetry={toggleSymmetry}
            undo={undo}
            redo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            clear={clearCanvas}
            onSave={handleExportSvg}
            onSaveJson={handleSaveJson}
            onLoad={handleLoadClick}
            strokeColor={strokeColor}
            setStrokeColor={setStrokeColor}
            fillColor={fillColor}
            setFillColor={setFillColor}
            strokeWidth={strokeWidth}
            setStrokeWidth={setStrokeWidth}
            isClosed={isClosed}
            setIsClosed={setIsClosed}
            onBgUpload={handleBgUploadClick}
            onBgClear={handleClearBg}
            bgVisible={bgVisible}
            setBgVisible={setBgVisible}
            hasBg={!!backgroundImage}
            mode={mode}
            setMode={setMode}
          />

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".json"
            onChange={handleFileChange}
          />

          <input
            type="file"
            ref={bgInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleBgFileChange}
          />
        </aside>

        <section className="flex-1 bg-[#020617] p-8 overflow-hidden relative flex flex-col items-center justify-center gap-4">
          {/* Shapes Bar */}
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

          <div className="w-[800px] h-[600px] shadow-2xl shadow-black/50 rounded-xl relative">
            <Canvas
              paths={paths}
              currentPoints={currentPoints}
              cursorPos={cursorPos}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              onDoubleClick={handleDoubleClick}
              onContextMenu={handleContextMenu}
              tension={tension}
              symmetry={symmetry}
              canvasRef={canvasRef as React.RefObject<HTMLDivElement>}
              isClosed={isClosed}
              backgroundImage={backgroundImage}
              bgVisible={bgVisible}
              mode={mode}
              selectedPathId={selectedPathId}
              onPathSelect={setSelectedPathId}
              isDragging={isDragging}
            />
          </div>
        </section>

        <aside className="w-80 p-4 border-l border-border bg-slate-950 flex flex-col overflow-hidden">
          <CodePanel paths={paths} tension={tension} isDragging={isDragging} onApplyCode={setPaths} />
        </aside>
      </main>
    </div>
  );
}

export default App;
