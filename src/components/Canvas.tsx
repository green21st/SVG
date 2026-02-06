import React, { useMemo, useCallback } from 'react';
import type { Point, PathLayer, SymmetrySettings } from '../types';
import { smoothPath, getPolylinePath, applySymmetry } from '../utils/geometry';
import { cn } from '../utils/cn';

interface PathItemProps {
    path: PathLayer;
    selected: boolean;
    mode: 'draw' | 'edit';
    onSelect: (id: string) => void;
    isDragging: boolean;
}

const PathItem = React.memo<PathItemProps>(({ path, selected, mode, onSelect, isDragging }) => {
    // Canvas dimensions for symmetry center
    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;

    const variants = useMemo(() => {
        return applySymmetry(path.points, path.symmetry, centerX, centerY);
    }, [path.points, path.symmetry, centerX, centerY]);

    return (
        <g>
            {variants.map((points, vIdx) => {
                const d = smoothPath(points, path.tension, path.closed);
                return (
                    <g key={`${path.id}-variant-${vIdx}`}>
                        <path
                            d={d}
                            stroke={selected ? '#f59e0b' : (path.color || '#22d3ee')}
                            strokeWidth={path.width || 2}
                            fill={path.fill || 'none'}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={cn(
                                mode === 'edit' && !isDragging && "cursor-pointer hover:opacity-80"
                            )}
                            onClick={(e) => {
                                if (mode === 'edit') {
                                    e.stopPropagation();
                                    onSelect(path.id);
                                }
                            }}
                            style={{ pointerEvents: mode === 'edit' ? 'all' : 'none' }}
                        />
                        {/* Edit Handles if Selected - Show only in edit mode and if path is selected */}
                        {mode === 'edit' && selected && points.map((p, i) => (
                            <g key={`handle-group-${vIdx}-${i}`} className="group">
                                <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r={8}
                                    fill="transparent"
                                    stroke="none"
                                    className="cursor-grab"
                                    style={{ pointerEvents: 'all' }}
                                />
                                <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r={4}
                                    fill="#f59e0b"
                                    stroke="#fff"
                                    strokeWidth={2}
                                    className="transition-transform group-hover:scale-125 pointer-events-none"
                                    style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                                />
                            </g>
                        ))}
                    </g>
                );
            })}
        </g>
    );
});

interface CanvasProps {
    paths: PathLayer[];
    currentPoints: Point[];
    cursorPos: Point | null;
    onPointerDown: (e: React.MouseEvent) => void;
    onPointerMove: (e: React.MouseEvent) => void;
    onPointerLeave: () => void;
    onDoubleClick: (e: React.MouseEvent) => void;
    onContextMenu: (e: React.MouseEvent) => void;
    width?: number;
    height?: number;
    tension: number;
    symmetry: SymmetrySettings;
    canvasRef: React.RefObject<HTMLDivElement>;
    fillColor?: string;
    isClosed?: boolean;
    backgroundImage?: string | null;
    bgVisible?: boolean;
    mode: 'draw' | 'edit';
    selectedPathId: string | null;
    onPathSelect: (id: string | null) => void;
    isDragging: boolean;
    activeTool: 'pen' | 'square' | 'circle' | 'triangle' | 'star';
}

const Canvas: React.FC<CanvasProps> = ({
    paths,
    currentPoints,
    cursorPos,
    onPointerDown,
    onPointerMove,
    onPointerLeave,
    onDoubleClick,
    onContextMenu,
    tension,
    symmetry,
    width = 800,
    height = 600,
    canvasRef,
    isClosed = false,
    backgroundImage,
    bgVisible = true,
    mode,
    selectedPathId,
    onPathSelect,
    isDragging,
    activeTool
}) => {
    const centerX = width / 2;
    const centerY = height / 2;

    const onPathSelectSafe = useCallback((id: string) => {
        onPathSelect(id);
    }, [onPathSelect]);

    // Calculate real-time symmetric points for the current path
    const symmetricCurrentPaths = useMemo(() => {
        if (currentPoints.length === 0) {
            return [];
        }
        const pointsSets = applySymmetry(currentPoints, symmetry, centerX, centerY);
        return pointsSets.slice(1);
    }, [currentPoints, symmetry, centerX, centerY]);

    return (
        <div
            className={cn(
                "relative w-full h-full bg-[#050b14] overflow-hidden select-none cursor-crosshair border border-border shadow-2xl rounded-xl"
            )}
            onMouseDown={onPointerDown}
            onMouseMove={onPointerMove}
            onMouseLeave={onPointerLeave}
            onDoubleClick={onDoubleClick}
            onContextMenu={onContextMenu}
            ref={canvasRef}
        >
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#22d3ee 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}
            />

            {/* Reference Background Image */}
            {backgroundImage && bgVisible && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                    <img src={backgroundImage} alt="Reference" className="max-w-full max-h-full object-contain" />
                </div>
            )}

            <svg className="w-full h-full pointer-events-none" viewBox={`0 0 ${width} ${height}`}>

                {/* Symmetry Guides */}
                {symmetry.horizontal && (
                    <line x1={centerX} y1={0} x2={centerX} y2={height} stroke="#64748b" strokeWidth={1} strokeDasharray="6,4" opacity={0.5} />
                )}
                {symmetry.vertical && (
                    <line x1={0} y1={centerY} x2={width} y2={centerY} stroke="#64748b" strokeWidth={1} strokeDasharray="6,4" opacity={0.5} />
                )}
                {symmetry.center && (
                    <g opacity={0.5}>
                        <line x1={centerX - 20} y1={centerY} x2={centerX + 20} y2={centerY} stroke="#64748b" strokeWidth={1} />
                        <line x1={centerX} y1={centerY - 20} x2={centerX} y2={centerY + 20} stroke="#64748b" strokeWidth={1} />
                        <circle cx={centerX} cy={centerY} r={3} fill="#64748b" />
                    </g>
                )}

                {/* Render Completed Paths */}
                {paths.map((path) => (
                    <PathItem
                        key={path.id}
                        path={path}
                        selected={path.id === selectedPathId}
                        mode={mode}
                        onSelect={onPathSelectSafe}
                        isDragging={isDragging}
                    />
                ))}

                {/* Render Current Drawing Path (Polyline Preview) */}
                {currentPoints.length > 0 && (
                    <path
                        d={getPolylinePath(currentPoints)}
                        stroke="#38bdf8"
                        strokeWidth={2}
                        strokeDasharray="5,5"
                        fill="none"
                        strokeLinecap="round"
                        opacity={0.4}
                    />
                )}

                {/* Render Real-time Symmetric Paths (Polyline Preview) */}
                {symmetricCurrentPaths.map((points, idx) => (
                    <path
                        key={`sym-poly-${idx}`}
                        d={getPolylinePath(points)}
                        stroke="#38bdf8"
                        strokeWidth={2}
                        strokeDasharray="5,5"
                        fill="none"
                        strokeLinecap="round"
                        opacity={0.4}
                    />
                ))}

                {/* Render Smoothed Preview */}
                {currentPoints.length > 1 && (
                    <path
                        d={smoothPath(currentPoints, tension, activeTool !== 'pen' ? true : isClosed)}
                        stroke="#22d3ee"
                        strokeWidth={2}
                        fill="none"
                        strokeLinecap="round"
                        opacity={0.6}
                    />
                )}

                {/* Render Real-time Symmetric Smoothed Preview */}
                {symmetricCurrentPaths.map((points, idx) => points.length > 1 && (
                    <path
                        key={`sym-smooth-${idx}`}
                        d={smoothPath(points, tension, activeTool !== 'pen' ? true : isClosed)}
                        stroke="#22d3ee"
                        strokeWidth={2}
                        fill="none"
                        strokeLinecap="round"
                        opacity={0.6}
                    />
                ))}

                {/* Render Points for feedback */}
                {currentPoints.map((p, i) => (
                    <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={3}
                        fill="#fff"
                        stroke="#22d3ee"
                        strokeWidth={1}
                    />
                ))}

                {/* Render Rubber Band Line to Cursor */}
                {currentPoints.length > 0 && cursorPos && (
                    <>
                        <line
                            x1={currentPoints[currentPoints.length - 1].x}
                            y1={currentPoints[currentPoints.length - 1].y}
                            x2={cursorPos.x}
                            y2={cursorPos.y}
                            stroke="#94a3b8"
                            strokeWidth={1}
                            strokeDasharray="4,4"
                            opacity={0.5}
                        />
                    </>
                )}
            </svg>
        </div>
    );
};

export default Canvas;
