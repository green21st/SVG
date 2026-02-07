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
    getBoundingBox: (points: Point[]) => any;
}

const PathItem = React.memo<PathItemProps>(({ path, selected, mode, isDragging, getBoundingBox }) => {
    // Canvas dimensions for symmetry center
    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;

    const variants = useMemo(() => {
        return applySymmetry(path.points, path.symmetry, centerX, centerY);
    }, [path.points, path.symmetry, centerX, centerY]);

    const box = useMemo(() => {
        if (!selected) return null;
        return getBoundingBox(path.points);
    }, [selected, path.points, getBoundingBox]);

    const animationStyle = useMemo(() => {
        if (!path.animation || path.animation.type === 'none') return {};
        const { type, duration, delay, ease } = path.animation;
        let animationName = '';
        const style: React.CSSProperties = {
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
            animationTimingFunction: ease,
            animationIterationCount: 'infinite',
            animationFillMode: 'forwards'
        };

        switch (type) {
            case 'draw':
                animationName = 'drawPath';
                style.strokeDasharray = '1000';
                style.strokeDashoffset = '1000';
                break;
            case 'pulse':
                animationName = 'pulsePath';
                break;
            case 'float':
                animationName = 'floatPath';
                break;
            case 'spin':
                animationName = 'spinPath';
                style.transformOrigin = 'center';
                style.transformBox = 'fill-box';
                break;
        }

        style.animationName = animationName;
        return style;
    }, [path.animation]);

    return (
        <g>
            {/* Global Animation Keyframes */}
            <style>
                {`
                    @keyframes drawPath {
                        to { stroke-dashoffset: 0; }
                    }
                    @keyframes pulsePath {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.3; }
                    }
                    @keyframes floatPath {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-10px); }
                    }
                    @keyframes spinPath {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}
            </style>
            {variants.map((points, vIdx) => {
                const d = smoothPath(points, path.tension, path.closed);
                return (
                    <g key={`${path.id}-variant-${vIdx}`}>
                        <path
                            d={d}
                            stroke={selected ? '#f59e0b' : (path.color || '#22d3ee')}
                            strokeOpacity={path.strokeOpacity ?? 1}
                            strokeWidth={path.width || 2}
                            fill={path.fill || 'none'}
                            fillOpacity={path.fillOpacity ?? 1}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            data-path-id={path.id}
                            className={cn(
                                mode === 'edit' && !isDragging && "cursor-move hover:opacity-80"
                            )}
                            style={{
                                pointerEvents: mode === 'edit' ? 'all' : 'none',
                                ...animationStyle
                            }}
                        />

                        {/* Bounding Box & Handles - Only for the primary variant to avoid symmetry duplication conflicts */}
                        {mode === 'edit' && selected && vIdx === 0 && (
                            <g className="pointer-events-none">
                                {box && (
                                    <g>
                                        {/* Bounding Box */}
                                        <rect
                                            x={box.minX - 5}
                                            y={box.minY - 5}
                                            width={box.width + 10}
                                            height={box.height + 10}
                                            fill="none"
                                            stroke="#f59e0b"
                                            strokeWidth={1}
                                            strokeDasharray="4,4"
                                            opacity={0.6}
                                        />

                                        {/* Rotation Handle */}
                                        <line
                                            x1={box.centerX}
                                            y1={box.minY - 5}
                                            x2={box.centerX}
                                            y2={box.minY - 25}
                                            stroke="#f59e0b"
                                            strokeWidth={1}
                                            opacity={0.6}
                                        />
                                        <g className="group pointer-events-auto cursor-grab">
                                            <circle
                                                cx={box.centerX}
                                                cy={box.minY - 25}
                                                r={15}
                                                fill="transparent"
                                                data-handle="rotate"
                                            />
                                            <circle
                                                cx={box.centerX}
                                                cy={box.minY - 25}
                                                r={6}
                                                fill="#f59e0b"
                                                stroke="#fff"
                                                strokeWidth={2}
                                                className={cn(
                                                    "transition-all duration-300 ease-out",
                                                    "group-hover:scale-125 group-hover:-translate-y-2",
                                                    isDragging && "transition-none translate-y-0 scale-110"
                                                )}
                                                style={{ pointerEvents: 'none', transformOrigin: 'center', transformBox: 'fill-box' }}
                                            />
                                        </g>

                                        {/* Scale Corner Handles */}
                                        {[
                                            { x: box.minX - 5, y: box.minY - 5, h: 'nw', tx: -4, ty: -4 },
                                            { x: box.maxX + 5, y: box.minY - 5, h: 'ne', tx: 4, ty: -4 },
                                            { x: box.minX - 5, y: box.maxY + 5, h: 'sw', tx: -4, ty: 4 },
                                            { x: box.maxX + 5, y: box.maxY + 5, h: 'se', tx: 4, ty: 4 }
                                        ].map((h, i) => (
                                            <g key={i} className="group pointer-events-auto">
                                                <rect
                                                    x={h.x - 10}
                                                    y={h.y - 10}
                                                    width={20}
                                                    height={20}
                                                    fill="transparent"
                                                    className={cn(
                                                        (h.h === 'nw' || h.h === 'se') ? "cursor-nwse-resize" : "cursor-nesw-resize"
                                                    )}
                                                    data-handle={h.h}
                                                />
                                                <rect
                                                    x={h.x - 4}
                                                    y={h.y - 4}
                                                    width={8}
                                                    height={8}
                                                    fill="#fff"
                                                    stroke="#f59e0b"
                                                    strokeWidth={2}
                                                    className={cn(
                                                        "pointer-events-none transition-all duration-300 ease-out",
                                                        "group-hover:scale-125",
                                                        isDragging && "transition-none scale-110 translate-x-0 translate-y-0"
                                                    )}
                                                    style={{
                                                        transformOrigin: 'center',
                                                        transformBox: 'fill-box',
                                                        transform: `translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))`
                                                    }}
                                                />
                                                {/* Hidden CSS variable to handle the pop out movement */}
                                                <style>{`
                                                    .group:hover rect[data-pop="${h.h}"] {
                                                        transform: translate(${h.tx}px, ${h.ty}px) scale(1.25) !important;
                                                    }
                                                `}</style>
                                                <rect
                                                    x={h.x - 4}
                                                    y={h.y - 4}
                                                    width={8}
                                                    height={8}
                                                    fill="#fff"
                                                    stroke="#f59e0b"
                                                    strokeWidth={2}
                                                    data-pop={h.h}
                                                    className={cn(
                                                        "pointer-events-none transition-all duration-300 ease-out opacity-0",
                                                        "group-hover:opacity-100",
                                                        isDragging && "hidden"
                                                    )}
                                                    style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
                                                />
                                            </g>
                                        ))}
                                    </g>
                                )}

                                {/* Direct Point Edit Handles */}
                                {points.map((p, i) => (
                                    <g key={`handle-group-${i}`} className="group pointer-events-auto">
                                        <circle
                                            cx={p.x}
                                            cy={p.y}
                                            r={12}
                                            fill="transparent"
                                            className="cursor-grab"
                                        />
                                        <circle
                                            cx={p.x}
                                            cy={p.y}
                                            r={4}
                                            fill="#f59e0b"
                                            stroke="#fff"
                                            strokeWidth={2}
                                            className={cn(
                                                "transition-all duration-300 ease-out pointer-events-none",
                                                "group-hover:scale-150 group-hover:shadow-lg",
                                                isDragging && "transition-none scale-110"
                                            )}
                                            style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
                                        />
                                    </g>
                                ))}
                            </g>
                        )}
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
    getBoundingBox: (points: Point[]) => any;
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
    activeTool,
    getBoundingBox
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

            <svg className="w-full h-full pointer-events-none" viewBox={`0 0 ${width} ${height}`} style={{ isolation: 'isolate' }}>

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
                        getBoundingBox={getBoundingBox}
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
