import { Undo2, Redo2, Trash2, Download, Upload, Save, Eye, EyeOff, Magnet, LayoutGrid } from 'lucide-react';

import type { SymmetrySettings } from '../types';

interface ToolbarProps {
    tension: number;
    setTension: (val: number) => void;
    symmetry: SymmetrySettings;
    toggleSymmetry: (key: keyof SymmetrySettings) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    clear: () => void;
    onSave: () => void; // SVG
    onSaveJson: () => void; // JSON
    onLoad: () => void;
    strokeColor: string;
    setStrokeColor: (val: string) => void;
    fillColor: string;
    setFillColor: (val: string) => void;
    strokeWidth: number;
    setStrokeWidth: (val: number) => void;
    isClosed: boolean;
    setIsClosed: (val: boolean) => void;
    onBgUpload: () => void;
    onBgClear: () => void;
    bgVisible: boolean;
    setBgVisible: (val: boolean) => void;
    hasBg: boolean;
    mode: 'draw' | 'edit';
    setMode: (mode: 'draw' | 'edit') => void;
    pointSnappingEnabled: boolean;
    setPointSnappingEnabled: (val: boolean) => void;
    guideSnappingEnabled: boolean;
    setGuideSnappingEnabled: (val: boolean) => void;
    selectedPathId: string | null;
    deleteSelectedPath: () => void;
    duplicateSelectedPath: () => void;
    strokeOpacity: number;
    setStrokeOpacity: (val: number) => void;
    fillOpacity: number;
    setFillOpacity: (val: number) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
    tension,
    setTension,
    symmetry,
    toggleSymmetry,
    undo,
    redo,
    canUndo,
    canRedo,
    clear,
    onSave,
    onSaveJson,
    onLoad,
    strokeColor,
    setStrokeColor,
    fillColor,
    setFillColor,
    strokeWidth,
    setStrokeWidth,
    isClosed,
    setIsClosed,
    onBgUpload,
    onBgClear,
    bgVisible,
    setBgVisible,
    hasBg,
    mode,
    setMode,
    pointSnappingEnabled,
    setPointSnappingEnabled,
    guideSnappingEnabled,
    setGuideSnappingEnabled,
    selectedPathId,
    deleteSelectedPath,
    duplicateSelectedPath,
    strokeOpacity,
    setStrokeOpacity,
    fillOpacity,
    setFillOpacity
}) => {
    return (
        <div className="flex flex-col gap-4 bg-surface p-4 rounded-xl border border-border shadow-lg w-full">
            {/* Mode Switcher */}
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                <button
                    onClick={() => setMode('draw')}
                    className={`flex-1 flex items-center justify-center py-1.5 px-2 rounded-md text-xs font-medium transition-all ${mode === 'draw'
                        ? 'bg-primary text-background shadow-sm'
                        : 'text-secondary hover:text-white hover:bg-slate-800'
                        }`}
                >
                    Draw
                </button>
                <button
                    onClick={() => setMode('edit')}
                    className={`flex-1 flex items-center justify-center py-1.5 px-2 rounded-md text-xs font-medium transition-all ${mode === 'edit'
                        ? 'bg-primary text-background shadow-sm'
                        : 'text-secondary hover:text-white hover:bg-slate-800'
                        }`}
                >
                    Edit
                </button>
            </div>

            {/* History Controls */}
            <div className="flex items-center justify-between gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex gap-1">
                    <button
                        onClick={undo}
                        disabled={!canUndo}
                        className="p-2 rounded bg-slate-800 text-secondary disabled:opacity-30 disabled:cursor-not-allowed hover:text-white hover:bg-slate-700 transition-colors"
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo2 size={16} />
                    </button>
                    <button
                        onClick={redo}
                        disabled={!canRedo}
                        className="p-2 rounded bg-slate-800 text-secondary disabled:opacity-30 disabled:cursor-not-allowed hover:text-white hover:bg-slate-700 transition-colors"
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo2 size={16} />
                    </button>
                </div>
                <button
                    onClick={clear}
                    className="p-2 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors border border-red-500/20"
                    title="Clear Canvas"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="h-px bg-border/50" />

            {/* Appearance Controls */}
            <div className="flex flex-col gap-4">
                {/* Stroke Color */}
                <div>
                    <h3 className="text-secondary text-xs uppercase tracking-wider mb-2 font-semibold flex items-center justify-between">
                        Stroke
                        <span className="text-[10px] opacity-50 font-normal">{strokeColor}</span>
                    </h3>
                    <div className="flex gap-2">
                        <input
                            type="color"
                            value={strokeColor}
                            onChange={(e) => setStrokeColor(e.target.value)}
                            className="w-10 h-10 rounded-lg cursor-pointer bg-slate-800 border-none outline-none"
                        />
                        <div className="flex-1 grid grid-cols-4 gap-1">
                            {['#22d3ee', '#818cf8', '#f472b6', '#fbbf24', '#34d399', '#f87171', '#ffffff', '#000000'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => setStrokeColor(c)}
                                    className={`w-full h-4 rounded-sm border ${strokeColor === c ? 'border-primary ring-1 ring-primary' : 'border-transparent hover:scale-110'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                    {/* Stroke Opacity Slider */}
                    <div className="px-1 mt-2">
                        <div className="flex justify-between text-[10px] text-secondary mb-1">
                            <span>Opacity</span>
                            <span>{Math.round(strokeOpacity * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={strokeOpacity}
                            onChange={(e) => setStrokeOpacity(parseFloat(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>
                </div>

                {/* Fill Color */}
                <div>
                    <h3 className="text-secondary text-xs uppercase tracking-wider mb-2 font-semibold flex items-center justify-between">
                        Fill
                        <span className="text-[10px] opacity-50 font-normal">{fillColor === 'none' ? 'Transparent' : fillColor}</span>
                    </h3>
                    <div className="flex gap-2">
                        <div className="flex flex-col gap-1 w-10">
                            <button
                                onClick={() => setFillColor('none')}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 border-dashed ${fillColor === 'none' ? 'border-primary bg-primary/10' : 'border-slate-700 text-slate-700 hover:border-slate-500 hover:text-slate-500'}`}
                                title="No Fill"
                            >
                                <EyeOff size={16} />
                            </button>
                        </div>
                        <div className="flex-1">
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="color"
                                    value={fillColor === 'none' ? '#ffffff' : fillColor}
                                    onChange={(e) => setFillColor(e.target.value)}
                                    className="w-10 h-10 rounded-lg cursor-pointer bg-slate-800 border-none outline-none"
                                />
                                <div className="flex-1 grid grid-cols-4 gap-1">
                                    {['#22d3ee', '#818cf8', '#f472b6', '#fbbf24', '#34d399', '#f87171', '#ffffff', '#000000'].map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setFillColor(c)}
                                            className={`w-full h-4 rounded-sm border ${fillColor === c ? 'border-primary ring-1 ring-primary' : 'border-transparent hover:scale-110'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                            {/* Fill Opacity Slider */}
                            {fillColor !== 'none' && (
                                <div className="px-1">
                                    <div className="flex justify-between text-[10px] text-secondary mb-1">
                                        <span>Opacity</span>
                                        <span>{Math.round(fillOpacity * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={fillOpacity}
                                        onChange={(e) => setFillOpacity(parseFloat(e.target.value))}
                                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Width & Tension */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h3 className="text-secondary text-xs uppercase tracking-wider mb-2 font-semibold flex items-center justify-between">
                            Width
                            <span className="text-[10px] font-normal">{strokeWidth}px</span>
                        </h3>
                        <input
                            type="range"
                            min="1"
                            max="20"
                            value={strokeWidth}
                            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>
                    <div>
                        <h3 className="text-secondary text-xs uppercase tracking-wider mb-2 font-semibold flex items-center justify-between">
                            Curve
                            <span className="text-[10px] font-normal">{tension.toFixed(1)}</span>
                        </h3>
                        <input
                            type="range"
                            min="0"
                            max="1.5"
                            step="0.1"
                            value={tension}
                            onChange={(e) => setTension(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>
                </div>

                {/* Closed Loop Toggle */}
                <div className="flex items-center gap-2 mt-2">
                    <button
                        onClick={() => setIsClosed(!isClosed)}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md border text-xs font-semibold transition-all ${isClosed
                            ? 'bg-primary/20 text-primary border-primary/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                            : 'bg-slate-800/50 text-secondary border-slate-700 hover:text-white hover:border-slate-500'
                            }`}
                    >
                        {isClosed ? 'Closed Loop' : 'Open Path'}
                    </button>
                </div>
            </div>

            <div className="h-px bg-border/50" />

            {/* Snapping Controls */}
            <div>
                <h3 className="text-secondary text-xs uppercase tracking-wider mb-2 font-semibold flex items-center justify-between">
                    Snapping
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPointSnappingEnabled(!pointSnappingEnabled)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-1 rounded-lg border transition-all text-[10px] font-bold ${pointSnappingEnabled ? 'bg-primary/20 text-primary border-primary/40 shadow-[0_0_10px_rgba(34,211,238,0.1)]' : 'bg-slate-900 text-secondary border-slate-800 hover:text-white'}`}
                        title="Snap to Points"
                    >
                        <Magnet size={14} />
                        Points
                    </button>
                    <button
                        onClick={() => setGuideSnappingEnabled(!guideSnappingEnabled)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-1 rounded-lg border transition-all text-[10px] font-bold ${guideSnappingEnabled ? 'bg-primary/20 text-primary border-primary/40 shadow-[0_0_10px_rgba(34,211,238,0.1)]' : 'bg-slate-900 text-secondary border-slate-800 hover:text-white'}`}
                        title="Snap to Guides"
                    >
                        <LayoutGrid size={14} />
                        Guides
                    </button>
                </div>
            </div>

            <div className="h-px bg-border/50" />

            {/* Symmetry Controls */}
            <div>
                <h3 className="text-secondary text-xs uppercase tracking-wider mb-2 font-semibold">Symmetry</h3>
                <div className="flex gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
                    <button
                        onClick={() => toggleSymmetry('horizontal')}
                        className={`flex-1 flex items-center justify-center py-2 px-1 rounded transition-all font-bold text-base ${symmetry.horizontal ? 'bg-primary text-background' : 'text-secondary hover:bg-slate-800 hover:text-white'}`}
                        title="Horizontal Symmetry"
                    >
                        H
                    </button>
                    <button
                        onClick={() => toggleSymmetry('vertical')}
                        className={`flex-1 flex items-center justify-center py-2 px-1 rounded transition-all font-bold text-base ${symmetry.vertical ? 'bg-primary text-background' : 'text-secondary hover:bg-slate-800 hover:text-white'}`}
                        title="Vertical Symmetry"
                    >
                        V
                    </button>
                    <button
                        onClick={() => toggleSymmetry('center')}
                        className={`flex-1 flex items-center justify-center py-2 px-1 rounded transition-all font-bold text-base ${symmetry.center ? 'bg-primary text-background' : 'text-secondary hover:bg-slate-800 hover:text-white'}`}
                        title="Center Symmetry"
                    >
                        C
                    </button>
                </div>
            </div>

            <div className="h-px bg-border/50" />

            {/* Output Controls */}
            <div className="flex flex-col gap-2">
                <button
                    onClick={onSave}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded bg-primary text-background font-bold hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all hover:-translate-y-0.5"
                >
                    <Save size={16} />
                    <span className="text-xs">Download SVG</span>
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={onSaveJson}
                        className="flex-1 flex items-center justify-center gap-2 p-1.5 rounded bg-slate-800 text-secondary hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <Download size={14} />
                        <span className="text-[10px]">Save JSON</span>
                    </button>
                    <button
                        onClick={onLoad}
                        className="flex-1 flex items-center justify-center gap-2 p-1.5 rounded bg-slate-800 text-secondary hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <Upload size={14} />
                        <span className="text-[10px]">Load JSON</span>
                    </button>
                </div>
            </div>

            <div className="h-px bg-border/50" />

            {/* Reference Image Controls */}
            <div>
                <h3 className="text-secondary text-xs uppercase tracking-wider mb-2 font-semibold">Reference Image</h3>
                <div className="flex gap-2">
                    <button
                        onClick={onBgUpload}
                        className="flex-1 flex items-center justify-center gap-2 p-2 rounded bg-slate-800 text-secondary hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors"
                    >
                        <span className="text-xs">{hasBg ? 'Change Img' : 'Upload Img'}</span>
                    </button>
                    {hasBg && (
                        <>
                            <button
                                onClick={() => setBgVisible(!bgVisible)}
                                className={`flex items-center justify-center p-2 rounded border transition-colors ${bgVisible
                                    ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                                    : 'bg-slate-800 text-secondary border-slate-700 hover:bg-slate-700'
                                    }`}
                                title={bgVisible ? "Hide Reference" : "Show Reference"}
                            >
                                {bgVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                            <button
                                onClick={onBgClear}
                                className="flex items-center justify-center p-2 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                                title="Remove Image"
                            >
                                <Trash2 size={16} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
