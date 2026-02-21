import React from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { Eye, EyeOff, Trash2, GripVertical, Layers, ChevronUp, ChevronDown, Combine, Ungroup, ArrowUpToLine, ArrowDownToLine, Lock, Unlock, CheckSquare, Square as SquareIcon } from 'lucide-react';
import type { PathLayer } from '../types';
import { cn } from '../utils/cn';

interface LayerPanelProps {
    paths: PathLayer[];
    selectedPathIds: string[];
    onSelect: (id: string, isMulti?: boolean, isRange?: boolean) => void;
    onReorder: (newPaths: PathLayer[]) => void;
    onReorderEnd: (newPaths: PathLayer[]) => void;
    onToggleVisibility: (id: string) => void;
    onToggleLock: (id: string) => void;
    onDelete: (id: string) => void;
    onMerge: () => void;
    onSplit: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onMoveToTop: () => void;
    onMoveToBottom: () => void;
    onSelectAll?: () => void;
    onDeselectAll?: () => void;
    onReorderStart?: () => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
    paths,
    selectedPathIds,
    onSelect,
    onReorder,
    onReorderEnd,
    onToggleVisibility,
    onToggleLock,
    onDelete,
    onMerge,
    onSplit,
    onMoveUp,
    onMoveDown,
    onMoveToTop,
    onMoveToBottom,
    onSelectAll,
    onDeselectAll,
    onReorderStart
}) => {
    // We want the most recent path (top of list) to be rendered on top.
    // SVG renders from first to last, so last in array is on top.
    // For the UI, we usually want top of list = top of stack.
    const displayPaths = React.useMemo(() => [...paths].reverse(), [paths]);

    const handleReorder = (newDisplayPaths: PathLayer[]) => {
        if (onReorderStart) onReorderStart();
        // Reverse back to maintain SVG order
        onReorder([...newDisplayPaths].reverse());
    };

    const handleReorderEnd = () => {
        onReorderEnd(paths);
    };

    return (
        <div className="flex flex-col h-full bg-slate-900/40 rounded-xl border border-white/5 overflow-hidden">
            <div className="p-3 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-2">
                    <Layers size={14} className="text-secondary" />
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-secondary">Layers</h3>
                    <span className="text-[10px] text-slate-500 font-medium bg-black/40 px-1.5 py-0.5 rounded-full border border-white/5 ml-1">
                        {paths.length}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={onSelectAll}
                        className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-primary transition-colors"
                        title="Select All"
                    >
                        <CheckSquare size={14} />
                    </button>
                    <button
                        onClick={onDeselectAll}
                        className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-red-400 transition-colors"
                        title="Deselect All"
                    >
                        <SquareIcon size={14} />
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0 relative">
                {paths.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2 p-4 text-center">
                        <Layers size={24} className="opacity-20" />
                        <p className="text-[10px] leading-relaxed">No layers yet. Start drawing to create your first layer.</p>
                    </div>
                ) : (
                    <Reorder.Group
                        axis="y"
                        layoutScroll
                        values={displayPaths}
                        onReorder={handleReorder}
                        className="flex flex-col gap-1 overflow-y-auto p-2 custom-scrollbar absolute inset-0"
                    >
                        {displayPaths.map((path) => (
                            <LayerItem
                                key={path.id}
                                path={path}
                                isSelected={selectedPathIds.includes(path.id)}
                                onSelect={(e) => onSelect(path.id, e.ctrlKey || e.metaKey, e.shiftKey)}
                                onToggleVisibility={() => onToggleVisibility(path.id)}
                                onToggleLock={() => onToggleLock(path.id)}
                                onDelete={() => onDelete(path.id)}
                                onDragEnd={handleReorderEnd}
                            />
                        ))}
                    </Reorder.Group>
                )}
            </div>

            <div className="p-2 border-t border-white/5 bg-white/5 flex items-center justify-between gap-1">
                <div className="flex items-center gap-1">
                    <button
                        onClick={onMoveToTop}
                        disabled={selectedPathIds.length === 0}
                        className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:pointer-events-none"
                        title="Move to top"
                    >
                        <ArrowUpToLine size={16} />
                    </button>
                    <button
                        onClick={onMoveUp}
                        disabled={selectedPathIds.length === 0}
                        className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:pointer-events-none"
                        title="Move layer up"
                    >
                        <ChevronUp size={16} />
                    </button>
                    <button
                        onClick={onMoveDown}
                        disabled={selectedPathIds.length === 0}
                        className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:pointer-events-none"
                        title="Move layer down"
                    >
                        <ChevronDown size={16} />
                    </button>
                    <button
                        onClick={onMoveToBottom}
                        disabled={selectedPathIds.length === 0}
                        className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:pointer-events-none"
                        title="Move to bottom"
                    >
                        <ArrowDownToLine size={16} />
                    </button>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={onSplit}
                        disabled={selectedPathIds.length === 0}
                        className="p-1.5 rounded-md text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 transition-all disabled:opacity-30 disabled:pointer-events-none"
                        title="Split merged layer"
                    >
                        <Ungroup size={16} />
                    </button>
                    <button
                        onClick={onMerge}
                        disabled={selectedPathIds.length < 2}
                        className="p-1.5 rounded-md text-primary hover:text-cyan-300 hover:bg-primary/10 transition-all disabled:opacity-30 disabled:pointer-events-none"
                        title="Merge selected layers"
                    >
                        <Combine size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

interface LayerItemProps {
    path: PathLayer;
    isSelected: boolean;
    onSelect: (e: React.MouseEvent) => void;
    onToggleVisibility: () => void;
    onToggleLock: () => void;
    onDelete: () => void;
    onDragEnd: () => void;
}

const LayerItem: React.FC<LayerItemProps> = ({
    path,
    isSelected,
    onSelect,
    onToggleVisibility,
    onToggleLock,
    onDelete,
    onDragEnd
}) => {
    const controls = useDragControls();

    return (
        <Reorder.Item
            value={path}
            dragListener={false}
            dragControls={controls}
            onDragEnd={onDragEnd}
            transition={{ duration: 0 }}
            whileDrag={{ scale: 1.02 }}
            className={cn(
                "group flex items-center gap-2 p-2 rounded-lg border outline-none select-none",
                isSelected
                    ? "bg-indigo-500/20 border-indigo-500/30 text-white"
                    : "bg-black/20 border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"
            )}
            onClick={onSelect}
        >
            <div
                onPointerDown={(e) => controls.start(e)}
                className="cursor-grab active:cursor-grabbing p-1 text-slate-600 group-hover:text-slate-400 transition-colors"
                title="Drag to reorder"
            >
                <GripVertical size={14} />
            </div>

            <div className="flex-1 flex items-center gap-2 min-w-0">
                <div
                    className="w-6 h-6 rounded border border-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden bg-slate-800"
                >
                    <svg viewBox="0 0 100 100" className="w-full h-full p-1">
                        <path
                            d="M 10 50 Q 50 10 90 50 Q 50 90 10 50"
                            stroke={path.color}
                            strokeWidth="10"
                            fill={path.fill || 'none'}
                            strokeLinecap="round"
                        />
                    </svg>
                </div>
                <span className="text-[11px] font-medium truncate">
                    {path.name || `Layer ${path.id.slice(-4)}`}
                </span>
            </div>

            <div className="flex items-center gap-0.5 transition-opacity">
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
                    className={cn(
                        "p-1.5 rounded-md transition-all hover:scale-110 active:scale-95",
                        path.locked ? "text-red-400 hover:bg-red-400/10" : "text-slate-500 hover:bg-white/10"
                    )}
                    title={path.locked ? "Unlock layer" : "Lock layer"}
                >
                    {path.locked ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
                    className={cn(
                        "p-1.5 rounded-md transition-all hover:scale-110 active:scale-95",
                        path.visible === false ? "text-amber-400 hover:bg-amber-400/10" : "text-slate-500 hover:bg-white/10"
                    )}
                    title={path.visible === false ? "Show layer" : "Hide layer"}
                >
                    {path.visible === false ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-1.5 rounded-md text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-all hover:scale-110 active:scale-95"
                    title="Delete layer"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            <div className={cn(
                "w-1 absolute right-0 top-2 bottom-2 rounded-l-full transition-all",
                isSelected ? "bg-indigo-500" : "bg-transparent"
            )} />
        </Reorder.Item>
    );
};
