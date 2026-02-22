
import React, { useState } from 'react';
import { Download, Upload, Save, Eye, EyeOff, Undo2, Trash2, Move } from 'lucide-react';

interface ToolbarProps {
    tension: number;
    setTension: (val: number, commit?: boolean) => void;
    onSave: () => void; // SVG
    onSaveJson: () => void; // JSON
    onLoad: () => void;
    onImportSvg: () => void;
    strokeColor: string;
    setStrokeColor: (val: string, commit?: boolean) => void;
    fillColor: string;
    setFillColor: (val: string, commit?: boolean) => void;
    strokeWidth: number;
    setStrokeWidth: (val: number, commit?: boolean) => void;
    isClosed: boolean;
    setIsClosed: (val: boolean, commit?: boolean) => void;
    onBgUpload: () => void;
    onBgClear: () => void;
    bgVisible: boolean;
    setBgVisible: (val: boolean) => void;
    hasBg: boolean;
    mode: 'draw' | 'edit';
    setMode: (mode: 'draw' | 'edit') => void;
    strokeOpacity: number;
    setStrokeOpacity: (val: number, commit?: boolean) => void;
    fontFamily: string;
    setFontFamily: (val: string, commit?: boolean) => void;
    selectedPathType?: string;
    activeTool: string;
    setActiveTool: (tool: any) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
    tension,
    setTension,
    onSave,
    onSaveJson,
    onLoad,
    onImportSvg,
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
    strokeOpacity,
    setStrokeOpacity,
    fontFamily,
    setFontFamily,
    selectedPathType,
    activeTool,
    setActiveTool
}) => {
    const [showMaterialPicker, setShowMaterialPicker] = useState(false);

    return (
        <div className="relative flex flex-col h-full bg-slate-950 overflow-hidden">
            {/* Scrollable Tool Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
                {/* Mode Switcher */}
                <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                    <button
                        onClick={() => {
                            setMode('draw');
                            if (activeTool === 'image') setActiveTool('brush');
                        }}
                        className={`flex-1 flex items-center justify-center py-1.5 px-2 rounded-md text-xs font-medium transition-all ${mode === 'draw'
                            ? 'bg-primary text-background shadow-sm'
                            : 'text-secondary hover:text-white hover:bg-slate-800'
                            }`}
                    >
                        Draw
                    </button>
                    <button
                        onClick={() => {
                            setMode('edit');
                            if (activeTool === 'image') setActiveTool('brush');
                            // Ensure vertex edit is disabled when switching to edit mode
                            (window as any).setIsVertexEditEnabled?.(false);
                        }}
                        className={`flex-1 flex items-center justify-center py-1.5 px-2 rounded-md text-xs font-medium transition-all ${mode === 'edit'
                            ? 'bg-primary text-background shadow-sm'
                            : 'text-secondary hover:text-white hover:bg-slate-800'
                            }`}
                    >
                        Edit
                    </button>
                </div>

                <div className="h-px bg-border/50" />

                {/* Appearance Controls */}
                <div className="flex flex-col gap-4">
                    {/* Stroke Color */}
                    <div>
                        <h3 className="text-secondary text-xs uppercase tracking-wider mb-2 font-semibold flex items-center justify-between">
                            Stroke
                            <span className="text-[10px] opacity-50 font-normal">{strokeColor === 'none' ? 'Transparent' : strokeColor}</span>
                        </h3>
                        <div className="flex gap-2">
                            <div className="flex flex-col gap-1 w-10">
                                <button
                                    onClick={() => setStrokeColor('none')}
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 border-dashed ${strokeColor === 'none' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-700 text-slate-700 hover:border-slate-500 hover:text-slate-500'}`}
                                    title="No Stroke"
                                >
                                    <EyeOff size={16} />
                                </button>
                            </div>
                            <div className="flex-1">
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={/^#[0-9A-F]{6}$/i.test(strokeColor) ? strokeColor : '#ffffff'}
                                        onChange={(e) => setStrokeColor(e.target.value, false)}
                                        onBlur={(e) => setStrokeColor(e.target.value, true)}
                                        className="w-10 h-10 rounded-lg cursor-pointer bg-slate-800 border-none outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={strokeColor === 'none'}
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
                            </div>
                        </div>
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
                                onChange={(e) => setStrokeOpacity(parseFloat(e.target.value), false)}
                                onMouseUp={(e) => setStrokeOpacity(parseFloat(e.currentTarget.value), true)}
                                onTouchEnd={(e) => setStrokeOpacity(parseFloat(e.currentTarget.value), true)}
                                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={strokeColor === 'none'}
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
                                        value={/^#[0-9A-F]{6}$/i.test(fillColor) ? fillColor : '#ffffff'}
                                        onChange={(e) => setFillColor(e.target.value, false)}
                                        onBlur={(e) => setFillColor(e.target.value, true)}
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
                                <button
                                    onClick={() => setShowMaterialPicker(true)}
                                    className="w-full h-10 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-secondary hover:text-white transition-all flex items-center justify-center gap-2 group"
                                >
                                    <div
                                        className="w-4 h-4 rounded-full border border-white/20"
                                        style={{ background: fillColor.startsWith('url') ? 'conic-gradient(#6366f1, #a855f7, #ec4899, #6366f1)' : (fillColor === 'none' ? 'transparent' : fillColor) }}
                                    />
                                    <span className="text-xs font-bold uppercase tracking-wider">Materials Library</span>
                                </button>
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
                                onChange={(e) => setStrokeWidth(parseInt(e.target.value), false)}
                                onMouseUp={(e) => setStrokeWidth(parseInt(e.currentTarget.value), true)}
                                onTouchEnd={(e) => setStrokeWidth(parseInt(e.currentTarget.value), true)}
                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={strokeColor === 'none'}
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
                                onChange={(e) => setTension(parseFloat(e.target.value), false)}
                                onMouseUp={(e) => setTension(parseFloat(e.currentTarget.value), true)}
                                onTouchEnd={(e) => setTension(parseFloat(e.currentTarget.value), true)}
                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>
                    </div>

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

                    {/* Font Family (Only for Text) */}
                    {selectedPathType === 'text' && (
                        <div className="animate-in fade-in slide-in-from-top-1 duration-300 mt-2">
                            <h3 className="text-secondary text-xs uppercase tracking-wider mb-2 font-semibold flex items-center justify-between">
                                Font Family
                            </h3>
                            <select
                                value={fontFamily}
                                onChange={(e) => setFontFamily(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 text-white rounded-md p-2 text-xs focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer hover:bg-slate-800"
                            >
                                <option value="'Inter', system-ui, sans-serif">Inter (Sans)</option>
                                <option value="'Roboto', sans-serif">Roboto</option>
                                <option value="'Playfair Display', serif">Playfair (Serif)</option>
                                <option value="'Quicksand', sans-serif">Quicksand (Rounded)</option>
                                <option value="'Caveat', cursive">Handwriting</option>
                            </select>
                        </div>
                    )}
                </div>

                <div className="h-px bg-border/50" />

                {/* Output Controls */}
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <button
                            onClick={onSave}
                            className="flex-1 flex items-center justify-center gap-2 p-2 rounded bg-primary text-background font-bold hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all hover:-translate-y-0.5 text-[10px]"
                        >
                            <Save size={14} />
                            Save SVG
                        </button>
                        <button
                            onClick={onImportSvg}
                            className="flex-1 flex items-center justify-center gap-2 p-2 rounded bg-slate-900 border border-slate-700 text-secondary hover:text-white hover:bg-slate-800 text-[10px] transition-all hover:-translate-y-0.5"
                        >
                            <Upload size={14} />
                            Load SVG
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onSaveJson} className="flex-1 flex items-center justify-center gap-2 p-1.5 rounded bg-slate-800/50 border border-transparent hover:border-slate-700 text-slate-500 hover:text-slate-300 text-[9px] transition-all">
                            <Download size={12} /> Save JSON
                        </button>
                        <button onClick={onLoad} className="flex-1 flex items-center justify-center gap-2 p-1.5 rounded bg-slate-800/50 border border-transparent hover:border-slate-700 text-slate-500 hover:text-slate-300 text-[9px] transition-all">
                            <Upload size={12} /> Load JSON
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
                                    onClick={() => {
                                        const nextVisible = !bgVisible;
                                        setBgVisible(nextVisible);
                                        if (!nextVisible && activeTool === 'image') {
                                            setActiveTool('brush');
                                        }
                                    }}
                                    className={`flex items-center justify-center p-2 rounded border transition-colors ${bgVisible
                                        ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                                        : 'bg-slate-800 text-secondary border-slate-700 hover:bg-slate-700'
                                        }`}
                                    title={bgVisible ? "Hide Reference" : "Show Reference"}
                                >
                                    {bgVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>
                                <button
                                    onClick={() => setActiveTool(activeTool === 'image' ? 'brush' : 'image')}
                                    className={`flex items-center justify-center p-2 rounded border transition-colors ${activeTool === 'image'
                                        ? 'bg-primary text-background border-primary shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                                        : 'bg-slate-800 text-secondary border-slate-700 hover:bg-slate-700'
                                        }`}
                                    title="Transform Reference (Drag: Move, Alt+Drag: Scale, Shift+Drag: Rotate)"
                                >
                                    <Move size={16} />
                                </button>
                                <button
                                    onClick={() => {
                                        onBgClear();
                                        if (activeTool === 'image') setActiveTool('brush');
                                    }}
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

            {/* Material Picker Overlay */}
            {
                showMaterialPicker && (
                    <div className="absolute inset-0 bg-slate-950 z-[100] flex flex-col p-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6 pb-2 border-b border-white/10">
                            <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-400">Materials Library</h4>
                            <button
                                onClick={() => setShowMaterialPicker(false)}
                                className="px-3 py-1 bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-full text-[10px] font-bold transition-all text-slate-400 flex items-center gap-2"
                            >
                                <Undo2 size={12} className="rotate-90" />
                                CLOSE
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mx-1">
                            {[
                                {
                                    category: 'Metals',
                                    items: [
                                        { label: 'Silver', value: 'url(#metal-silver)', background: 'linear-gradient(135deg, #e0e0e0, #fff, #9e9e9e)' },
                                        { label: 'Gold', value: 'url(#metal-gold)', background: 'linear-gradient(135deg, #bf953f, #fcf6ba, #aa771c)' },
                                        { label: 'Copper', value: 'url(#metal-copper)', background: 'linear-gradient(135deg, #b87333, #ff9d5c, #8b4513)' },
                                        { label: 'Chrome', value: 'url(#metal-chrome)', background: 'linear-gradient(to bottom, #fff, #888, #444, #888)' },
                                    ]
                                },
                                {
                                    category: 'Effects',
                                    items: [
                                        { label: 'Crystal', value: 'url(#crystal-blue)', background: 'linear-gradient(135deg, #a1c4fd, #fff)' },
                                        { label: 'Shine', value: 'url(#crystal-shine)', background: 'radial-gradient(circle at 30% 30%, white, #00bfff)' },
                                        { label: 'Frosted', value: 'url(#glass-frosted)', background: 'rgba(255,255,255,0.2)' },
                                        { label: 'Sphere', value: 'url(#3d-sphere)', background: 'radial-gradient(circle at 30% 30%, #fff, #00bfff, #00008b)' },
                                        { label: 'Ruby', value: 'url(#3d-ruby)', background: 'radial-gradient(circle at 30% 30%, #ff9999, #f00, #600)' },
                                    ]
                                },
                                {
                                    category: 'Gradients',
                                    items: [
                                        { label: 'Sunset', value: 'url(#gradient-sunset)', background: 'linear-gradient(to right, #ff512f, #dd2476)' },
                                        { label: 'Ocean', value: 'url(#gradient-ocean)', background: 'linear-gradient(to bottom, #2193b0, #6dd5ed)' },
                                        { label: 'Fire', value: 'url(#gradient-fire)', background: 'linear-gradient(135deg, #f12711, #f5af19)' },
                                        { label: 'Neon', value: 'url(#gradient-neon)', background: 'linear-gradient(to right, #ff00cc, #3333ff, #00ffcc)' },
                                        { label: 'Holo', value: 'url(#gradient-holographic)', background: 'linear-gradient(135deg, #fdfcfb, #e2d1c3, #c3cfe2, #fedfe1)' },
                                        { label: 'Rainbow', value: 'url(#gradient-rainbow)', background: 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)' },
                                    ]
                                },
                                {
                                    category: 'Patterns',
                                    items: [
                                        { label: 'Carbon', value: 'url(#pattern-carbon)', background: '#111' },
                                        { label: 'Grid', value: 'url(#pattern-grid)', background: 'repeating-linear-gradient(0deg, transparent, transparent 19px, #334155 20px), repeating-linear-gradient(90deg, #1e293b, #1e293b 19px, #334155 20px)' },
                                        { label: 'Dots', value: 'url(#pattern-dots)', background: 'radial-gradient(#cbd5e1 1px, transparent 1px), #f8fafc', backgroundSize: '4px 4px' },
                                        { label: 'Marble', value: 'url(#pattern-marble)', background: '#f5f5f5' },
                                        { label: 'Wood', value: 'url(#pattern-wood)', background: '#8B4513' },
                                        { label: 'Brushed', value: 'url(#pattern-brushed)', background: '#999' },
                                        { label: 'Honey', value: 'url(#pattern-honeycomb)', background: '#ffcc00' },
                                    ]
                                }
                            ].map((cat) => (
                                <div key={cat.category} className="mb-6 last:mb-0">
                                    <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-3 ml-1 tracking-widest">{cat.category}</h5>
                                    <div className="grid grid-cols-2 gap-3">
                                        {cat.items.map((item) => (
                                            <button
                                                key={item.label}
                                                onClick={() => { setFillColor(item.value); setShowMaterialPicker(false); }}
                                                className={`group relative flex flex-col items-center gap-2 p-1.5 rounded-xl border transition-all ${fillColor === item.value ? 'bg-indigo-500/20 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : 'bg-black/40 border-white/5 hover:border-white/20 hover:bg-white/5'}`}
                                            >
                                                <div className="w-full h-14 rounded-lg shadow-inner transition-transform group-hover:scale-[1.03]" style={{ background: item.background }} />
                                                <span className="text-[10px] font-bold text-slate-400 group-hover:text-white truncate w-full text-center">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }
        </div >
    );
};
