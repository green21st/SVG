import React from 'react';
import { Undo2, Redo2, Trash2, Download, Upload, Save, Eye, EyeOff } from 'lucide-react';

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
    setMode
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

            <div className="h-px bg-border/50" />

            <div>
                <h3 className="text-secondary text-xs uppercase tracking-wider mb-2 font-semibold">Line Style</h3>

                <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-secondary mb-1">
                        <span>Tension</span>
                        <span>{tension.toFixed(2)}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={tension}
                        onChange={(e) => setTension(parseFloat(e.target.value))}
                        className="w-full accent-primary h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-secondary mb-1">
                        <span>Stroke Width</span>
                        <span>{strokeWidth}px</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="20"
                        step="1"
                        value={strokeWidth}
                        onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                        className="w-full accent-primary h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <label className="flex items-center gap-2 text-xs text-secondary cursor-pointer hover:text-white">
                    <input
                        type="checkbox"
                        checked={isClosed}
                        onChange={(e) => setIsClosed(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-800 accent-primary"
                    />
                    Auto Close Path
                </label>
            </div>

            <div className="h-px bg-border/50" />

            {/* Colors */}
            <div className="space-y-3">
                <div>
                    <h3 className="text-secondary text-xs uppercase tracking-wider mb-2 font-semibold">Stroke Color</h3>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={strokeColor}
                            onChange={(e) => setStrokeColor(e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer bg-transparent border border-gray-600"
                        />
                        <span className="text-xs text-secondary font-mono">{strokeColor}</span>
                    </div>
                </div>

                <div>
                    <h3 className="text-secondary text-xs uppercase tracking-wider mb-2 font-semibold">Fill Color</h3>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <input
                                type="color"
                                value={fillColor === 'none' ? '#000000' : fillColor} // Default to black for picker if none
                                onChange={(e) => setFillColor(e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer bg-transparent border border-gray-600"
                                disabled={fillColor === 'none'}
                            />
                            {fillColor === 'none' && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-full h-px bg-red-500 rotate-45 transform" />
                                </div>
                            )}
                        </div>

                        <label className="flex items-center gap-2 text-xs text-secondary cursor-pointer hover:text-white">
                            <input
                                type="checkbox"
                                checked={fillColor !== 'none'}
                                onChange={(e) => setFillColor(e.target.checked ? '#22d3ee' : 'none')}
                                className="rounded border-slate-700 bg-slate-800 accent-primary"
                            />
                            Enable Fill
                        </label>
                    </div>
                </div>
            </div>

            <div className="h-px bg-border/50" />

            <div>
                <h3 className="text-secondary text-xs uppercase tracking-wider mb-2 font-semibold">Symmetry</h3>
                <div className="grid grid-cols-3 gap-2">
                    <button
                        onClick={() => toggleSymmetry('horizontal')}
                        title="Horizontal Symmetry"
                        className={`text-xs py-1.5 px-2 rounded-md transition-colors border font-bold ${symmetry.horizontal
                            ? 'bg-primary/20 border-primary text-primary'
                            : 'bg-slate-800 border-transparent text-secondary hover:bg-slate-700'
                            }`}
                    >
                        H
                    </button>
                    <button
                        onClick={() => toggleSymmetry('vertical')}
                        title="Vertical Symmetry"
                        className={`text-xs py-1.5 px-2 rounded-md transition-colors border font-bold ${symmetry.vertical
                            ? 'bg-primary/20 border-primary text-primary'
                            : 'bg-slate-800 border-transparent text-secondary hover:bg-slate-700'
                            }`}
                    >
                        V
                    </button>
                    <button
                        onClick={() => toggleSymmetry('center')}
                        title="Center Symmetry"
                        className={`text-xs py-1.5 px-2 rounded-md transition-colors border font-bold ${symmetry.center
                            ? 'bg-primary/20 border-primary text-primary'
                            : 'bg-slate-800 border-transparent text-secondary hover:bg-slate-700'
                            }`}
                    >
                        C
                    </button>
                </div>
            </div>

            <div className="h-px bg-border/50" />

            <div>
                <h3 className="text-secondary text-xs uppercase tracking-wider mb-2 font-semibold">Actions</h3>
                <div className="flex gap-2 mb-2">
                    <button
                        onClick={undo} disabled={!canUndo}
                        className="flex-1 flex items-center justify-center p-2 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
                        title="Undo"
                    >
                        <Undo2 size={16} />
                    </button>
                    <button
                        onClick={redo} disabled={!canRedo}
                        className="flex-1 flex items-center justify-center p-2 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
                        title="Redo"
                    >
                        <Redo2 size={16} />
                    </button>
                </div>

                <button
                    onClick={clear}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors mb-2"
                >
                    <Trash2 size={16} />
                    <span className="text-xs font-semibold">Clear Canvas</span>
                </button>

                <button
                    onClick={onSave}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded bg-primary text-background hover:bg-primary/90 font-semibold transition-colors shadow-[0_0_15px_rgba(34,211,238,0.3)] mb-2"
                >
                    <Download size={16} />
                    <span className="text-xs">Export SVG</span>
                </button>

                <button
                    onClick={onSaveJson}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded bg-slate-800 text-secondary hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors mb-2"
                >
                    <Save size={16} />
                    <span className="text-xs">Save JSON</span>
                </button>

                <button
                    onClick={onLoad}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded bg-slate-800 text-secondary hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors mb-2"
                >
                    <Upload size={16} />
                    <span className="text-xs">Load JSON</span>
                </button>
            </div>

            <div className="h-px bg-border/50" />

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
