import React, { useMemo, useCallback } from 'react';
import type { PathLayer, Point, AnimationSettings, SymmetrySettings } from '../types';
import { smoothPath, getPolylinePath, applySymmetry } from '../utils/geometry';
import { cn } from '../utils/cn';
import { Defs } from './Defs';

interface PathItemProps {
    path: PathLayer;
    selectedPathIds: string[];
    mode: 'draw' | 'edit';
    onSelect: (id: string) => void;
    isDragging: boolean;
    getBoundingBox: (points: Point[]) => any;
    animationPaused: boolean;
    focusedSegmentIndices: number[];
}

const PathItem = React.memo<PathItemProps>(({ path, selectedPathIds, mode, isDragging, getBoundingBox, animationPaused, focusedSegmentIndices }) => {
    const selected = selectedPathIds.includes(path.id);
    // Canvas dimensions for symmetry center
    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;

    const variants = useMemo(() => {
        return applySymmetry(path.multiPathPoints || path.points, path.symmetry, centerX, centerY);
    }, [path.multiPathPoints, path.points, path.symmetry, centerX, centerY]);

    const box = useMemo(() => {
        if (!selected) return null;
        if (path.type === 'text') {
            const centerX = path.points[0].x;
            const centerY = path.points[0].y;
            const fs = path.fontSize || 40;
            const charWidth = fs * 0.65; // Improved estimate for common fonts
            const width = (path.text?.length || 1) * charWidth;
            const height = fs * 0.85; // Tighter estimate for visual height
            return {
                minX: centerX - width / 2,
                maxX: centerX + width / 2,
                minY: centerY - height / 2,
                maxY: centerY + height / 2,
                width,
                height,
                centerX,
                centerY
            };
        }
        if (path.multiPathPoints) {
            if (focusedSegmentIndices.length > 0) {
                // Calculate bounding box for all focused segments
                const allPoints: Point[] = [];
                focusedSegmentIndices.forEach(idx => {
                    if (path.multiPathPoints && path.multiPathPoints[idx]) {
                        allPoints.push(...path.multiPathPoints[idx]);
                    }
                });
                if (allPoints.length > 0) {
                    return getBoundingBox(allPoints);
                }
            }
            // User requested to disable overall selection box for merged layers.
            // Only show box if specific segments are focused.
            return null;
        }
        return getBoundingBox(path.points);
    }, [selected, selectedPathIds.length, focusedSegmentIndices, path.multiPathPoints, path.points, path.type, path.fontSize, path.text, getBoundingBox]);

    // Helper to generate animation styles
    const getStylesForAnimation = (
        anim: AnimationSettings | undefined,
        color: string,
        variantType: string | undefined,
        isPaused: boolean
    ) => {
        if (!anim || !anim.types || anim.types.length === 0) {
            return { pathStyles: {}, groupAnimations: [] };
        }

        const { types, duration, delay, ease, direction = 'forward' } = anim;
        let pathStyles: React.CSSProperties = {};
        const groupAnimations: React.CSSProperties[] = [];

        types.filter(t => t !== 'none').forEach(type => {
            const baseStyle: React.CSSProperties = {
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
                animationTimingFunction: ease,
                animationIterationCount: 'infinite',
                animationFillMode: 'forwards',
                animationPlayState: isPaused ? 'paused' : 'running'
            };

            let finalDirection: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse' =
                direction === 'forward' ? 'normal' :
                    direction === 'alternate' ? 'alternate' : 'reverse';

            switch (type) {
                case 'draw':
                    if (!pathStyles.animationName) {
                        pathStyles = {
                            ...baseStyle,
                            animationName: 'drawPath',
                            strokeDasharray: '1000',
                            strokeDashoffset: '1000',
                            animationDirection: finalDirection
                        };
                    }
                    break;
                case 'pulse':
                    groupAnimations.push({ ...baseStyle, animationName: 'pulsePath', animationDirection: finalDirection });
                    break;
                case 'float':
                    const floatStyle = { ...baseStyle, animationName: 'floatPath', animationDirection: finalDirection };
                    if (variantType === 'V' || variantType === 'C') {
                        // @ts-ignore
                        floatStyle['--float-dist'] = '10px';
                    }
                    groupAnimations.push(floatStyle);
                    break;
                case 'spin':
                    if (variantType === 'H' || variantType === 'V') {
                        if (finalDirection === 'normal') finalDirection = 'reverse';
                        else if (finalDirection === 'reverse') finalDirection = 'normal';
                    }
                    groupAnimations.push({ ...baseStyle, animationName: 'spinPath', transformOrigin: 'center', transformBox: 'fill-box', animationDirection: finalDirection });
                    break;
                case 'bounce':
                    groupAnimations.push({ ...baseStyle, animationName: 'bouncePath', transformOrigin: 'center', transformBox: 'fill-box', animationDirection: finalDirection });
                    break;
                case 'glow':
                    const glowStyle = { ...baseStyle, animationName: 'glowPath', animationDirection: finalDirection };
                    // @ts-ignore
                    glowStyle['--glow-color'] = color;
                    groupAnimations.push(glowStyle);
                    break;
                case 'shake':
                    groupAnimations.push({ ...baseStyle, animationName: 'shakePath', animationDirection: finalDirection });
                    break;
                case 'swing':
                    groupAnimations.push({ ...baseStyle, animationName: 'swingPath', transformOrigin: 'center', transformBox: 'fill-box', animationDirection: finalDirection });
                    break;
                case 'tada':
                    groupAnimations.push({ ...baseStyle, animationName: 'tadaPath', transformOrigin: 'center', transformBox: 'fill-box', animationDirection: finalDirection });
                    break;
            }
        });

        return { pathStyles, groupAnimations };
    };

    const variantConfigs = useMemo(() => {
        return variants.map(v => {
            const { pathStyles, groupAnimations } = getStylesForAnimation(
                path.animation,
                path.color || '#22d3ee',
                v.type,
                isDragging || animationPaused
            );

            // Need to return multiD if it exists in v
            // v structure comes from applySymmetry: { points, type, multiPoints?, multiD? }
            return {
                points: v.points,
                multiPoints: v.multiPoints,
                pathStyles,
                groupAnimations,
                variantType: v.type,
                // @ts-ignore
                multiD: v.multiD
            };
        });
    }, [path.animation, variants, path.color, isDragging, animationPaused]);

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
                        50% { transform: translateY(var(--float-dist, -10px)); }
                    }
                    @keyframes spinPath {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    @keyframes bouncePath {
                        0%, 100% { transform: scale(1); }
                        40% { transform: scale(1.15, 0.85); }
                        60% { transform: scale(0.9, 1.1); }
                        80% { transform: scale(1.05, 0.95); }
                    }
                    @keyframes glowPath {
                        0%, 100% { filter: drop-shadow(0 0 2px var(--glow-color)) brightness(1); }
                        50% { filter: drop-shadow(0 0 12px var(--glow-color)) brightness(1.5); }
                    }
                    @keyframes shakePath {
                        0%, 100% { transform: translateX(0); }
                        25% { transform: translateX(-4px); }
                        75% { transform: translateX(4px); }
                    }
                    @keyframes swingPath {
                        0%, 100% { transform: rotate(-10deg); }
                        50% { transform: rotate(10deg); }
                    }
                    @keyframes tadaPath {
                        0% { transform: scale(1); }
                        10%, 20% { transform: scale(0.9) rotate(-3deg); }
                        30%, 50%, 70%, 90% { transform: scale(1.1) rotate(3deg); }
                        40%, 60%, 80% { transform: scale(1.1) rotate(-3deg); }
                        100% { transform: scale(1) rotate(0); }
                    }
                `}
            </style>
            {variantConfigs.map((config, vIdx) => {
                // Remove the old 'const d' here as it's now declared inside the return block for text support

                // Helper to wrap content in nested animated groups
                const wrapInAnimations = (content: React.ReactNode, styles: React.CSSProperties[], prefix: string = 'anim') => {
                    let result = content;
                    styles.forEach((style, idx) => {
                        const animKey = `${prefix}-${style.animationName || 'anim'}-${idx}`;
                        result = (
                            <g key={animKey} style={style}>
                                {result}
                            </g>
                        );
                    });
                    return result;
                };

                // Create a stable key that includes animation state
                const animKey = (config.groupAnimations as React.CSSProperties[]).map(s => s.animationName).join('-') || 'no-group-anim';
                const pathStyleKey = (config.pathStyles as React.CSSProperties).animationName || 'no-path-anim';
                const fullKey = `${path.id}-v${vIdx}-${pathStyleKey}-${animKey}`;

                const renderPathElement = (dStr: string, sIdx?: number) => {
                    const isFocused = sIdx !== undefined && focusedSegmentIndices.includes(sIdx);
                    // If focusedSegmentIndices is empty, we can either highlight all or none. 
                    // To satisfy "only select clicked element", we highlight all only if no segment focus is possible (not multi-path)
                    // For multi-path, if no segments are focused, we don't highlight any segment with the selection color.
                    // If focusedSegmentIndices is empty, we assume the whole group is selected (e.g. via Layer Panel or Box Select)
                    const shouldHighlight = selected && (path.multiPathPoints ? (focusedSegmentIndices.length === 0 || isFocused) : true);

                    const segmentColor = (sIdx !== undefined && path.segmentColors?.[sIdx]) || path.color || '#22d3ee';
                    const segmentFill = (sIdx !== undefined && path.segmentFills?.[sIdx]) || path.fill || 'none';
                    const segmentWidth = (sIdx !== undefined ? path.segmentWidths?.[sIdx] : undefined) ?? (path.width || 2);
                    const segmentAnim = (sIdx !== undefined ? path.segmentAnimations?.[sIdx] : undefined) || undefined;

                    // Calculate segment-specific animations
                    // Note: variantType is inherited from the parent configuration if applicable, but for merged layers it might be less relevant unless symmetry is involved.
                    // We use config.variantType if available.
                    const { pathStyles: segPathStyles, groupAnimations: segGroupAnimations } = getStylesForAnimation(
                        segmentAnim,
                        segmentColor,
                        config.variantType,
                        isDragging || animationPaused
                    );

                    const pathElement = (
                        <path
                            key={sIdx ?? 'main'}
                            d={dStr}
                            stroke={shouldHighlight ? '#f59e0b' : segmentColor}
                            strokeOpacity={path.strokeOpacity ?? 1}
                            strokeWidth={segmentWidth}
                            fill={segmentFill}
                            fillOpacity={path.fillOpacity ?? 1}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            data-path-id={path.id}
                            data-segment-index={sIdx}
                            className={cn(
                                mode === 'edit' && !isDragging && "cursor-move hover:opacity-80"
                            )}
                            style={{
                                pointerEvents: mode === 'edit' ? 'all' : 'none',
                                ...config.pathStyles, // Apply global path styles (e.g. from global animation if any)
                                ...segPathStyles     // Apply segment specific path styles (overrides global if collision, but usually distinct)
                            }}
                        />
                    );

                    if (segGroupAnimations.length > 0) {
                        return wrapInAnimations(pathElement, segGroupAnimations, `seg-${sIdx ?? 'main'}`);
                    }
                    return pathElement;
                };

                const element = path.type === 'text' ? (
                    <text
                        x={0}
                        y={0}
                        fill={path.fill || path.color || '#22d3ee'}
                        fillOpacity={path.fillOpacity ?? 1}
                        stroke={path.color || 'none'}
                        strokeWidth={path.width || 0}
                        strokeOpacity={path.strokeOpacity ?? 1}
                        fontSize={path.fontSize || 40}
                        fontFamily={path.fontFamily || 'Inter, system-ui, sans-serif'}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`translate(${config.points[0].x}, ${config.points[0].y}) scale(${config.variantType === 'H' || config.variantType === 'C' ? -1 : 1}, ${config.variantType === 'V' || config.variantType === 'C' ? -1 : 1}) rotate(${path.rotation || 0})`}
                        data-path-id={path.id}
                        className={cn(
                            mode === 'edit' && !isDragging && "cursor-move hover:opacity-80 transition-opacity"
                        )}
                        style={{
                            pointerEvents: mode === 'edit' ? 'all' : 'none',
                            userSelect: 'none',
                            ...config.pathStyles
                        }}
                    >
                        {path.text}
                    </text>
                ) : (
                    (config.variantType === 'I' && path.d && !isDragging && !config.multiPoints) ? (
                        path.importedScale !== undefined ? (
                            <g transform={`translate(${path.importedOffsetX || 0}, ${path.importedOffsetY || 0}) scale(${path.importedScale})`}>
                                {renderPathElement(path.d)}
                            </g>
                        ) : (
                            renderPathElement(path.d)
                        )
                    ) : (
                        config.multiPoints ? (
                            <g data-path-id={path.id}>
                                {config.multiPoints.map((segPoints, sIdx) => {
                                    const segTension = path.segmentTensions?.[sIdx] ?? path.tension;
                                    const segClosed = path.segmentClosed?.[sIdx] ?? path.closed;
                                    return renderPathElement(smoothPath(segPoints, segTension, segClosed), sIdx);
                                })}
                            </g>
                        ) : (
                            renderPathElement(smoothPath(config.points, path.tension, path.closed))
                        )
                    )
                );

                return (
                    <g key={fullKey}>
                        {config.groupAnimations.length > 0
                            ? wrapInAnimations(element, config.groupAnimations, path.type === 'text' ? 'text' : 'path')
                            : element}

                        {/* Bounding Box & Handles - Only for the primary variant to avoid symmetry duplication conflicts */}
                        {mode === 'edit' && selected && config.variantType === 'I' && (
                            config.groupAnimations.length > 0
                                ? wrapInAnimations(
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

                                        {/* Direct Point Edit Handles - Show Focused Segments if MultiPath and focused, otherwise show all */}
                                        {(path.multiPathPoints
                                            ? (focusedSegmentIndices.length > 0 && config.multiPoints
                                                ? focusedSegmentIndices.flatMap(idx => config.multiPoints![idx] || [])
                                                : config.points)
                                            : config.points
                                        ).map((p, i) => (
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
                                    </g>,
                                    config.groupAnimations,
                                    'handles'
                                )
                                : <g className="pointer-events-none">
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
                                    {config.points.map((p, i) => (
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
    selectedPathIds: string[];
    onPathSelect: (id: string | null) => void;
    isDragging: boolean;
    activeTool: 'brush' | 'pen' | 'square' | 'circle' | 'triangle' | 'star' | 'image';
    getBoundingBox: (points: Point[]) => any;
    animationPaused?: boolean;
    bgTransform: { x: number, y: number, scale: number, rotation: number, opacity: number };
    zoom: number;
    panOffset: Point;
    isSpacePressed: boolean;
    focusedSegmentIndices: number[];
    transformMode: 'none' | 'rotate' | 'scale' | 'translate';
    transformPivot: Point | null;
    currentRotationDelta: number;
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
    selectedPathIds,
    onPathSelect,
    isDragging,
    activeTool,
    getBoundingBox,
    animationPaused = false,
    bgTransform,
    zoom,
    panOffset,
    isSpacePressed,
    focusedSegmentIndices,
    transformMode,
    transformPivot,
    currentRotationDelta
}) => {
    const centerX = width / 2;
    const centerY = height / 2;

    const onPathSelectSafe = useCallback((id: string) => {
        onPathSelect(id);
    }, [onPathSelect]);

    const symmetricCurrentPaths = useMemo(() => {
        if (currentPoints.length === 0) {
            return [];
        }
        const variants = applySymmetry(currentPoints, symmetry, centerX, centerY);
        return variants.slice(1).map(v => v.points);
    }, [currentPoints, symmetry, centerX, centerY]);

    // Optimize: cache filtered and sorted paths
    const sortedPaths = useMemo(() => {
        return paths
            .filter(p => p.visible !== false)
            .sort((a, b) => {
                // Selected paths render last (on top), but only in edit mode
                if (mode === 'edit') {
                    const aSelected = selectedPathIds.includes(a.id);
                    const bSelected = selectedPathIds.includes(b.id);
                    if (aSelected && !bSelected) return 1;
                    if (!aSelected && bSelected) return -1;
                }
                return 0;
            });
    }, [paths, mode, selectedPathIds]);

    // Manual DOM Update for maximum performance (skips React re-render cycle)
    React.useEffect(() => {
        const xEl = document.getElementById('coord-x');
        const yEl = document.getElementById('coord-y');
        const tracker = document.getElementById('coord-tracker');

        if (cursorPos) {
            const x = Math.round(cursorPos.x - width / 2);
            const y = Math.round(-(cursorPos.y - height / 2));
            if (xEl) xEl.textContent = String(x);
            if (yEl) yEl.textContent = String(y);
            if (tracker) tracker.style.opacity = '1';
        } else {
            if (tracker) tracker.style.opacity = '0';
        }
    }, [cursorPos, width, height]);

    return (
        <div
            className={cn(
                "relative w-full h-full bg-[#050b14] overflow-hidden select-none border border-border shadow-2xl rounded-xl",
                isSpacePressed ? "cursor-grab" : "cursor-crosshair"
            )}
            onMouseDown={onPointerDown}
            onMouseMove={onPointerMove}
            onMouseLeave={onPointerLeave}
            onDoubleClick={onDoubleClick}
            onContextMenu={onContextMenu}
            ref={canvasRef}
        >
            <div
                className="w-full h-full will-change-transform"
                style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                    transformOrigin: '0 0'
                }}
            >
                {/* Grid Background */}
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(#22d3ee 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}
                />

                {/* Background Image Logic */}
                {backgroundImage && bgVisible && (
                    <div
                        className={cn(
                            "absolute inset-0 flex items-center justify-center transition-opacity duration-500",
                            activeTool === 'image' ? "pointer-events-auto cursor-move z-10" : "pointer-events-none"
                        )}
                    >
                        <div
                            style={{
                                opacity: bgTransform.opacity,
                                transform: `translate(${bgTransform.x}px, ${bgTransform.y}px) scale(${bgTransform.scale}) rotate(${bgTransform.rotation}deg)`
                            }}
                            className="w-full h-full flex items-center justify-center"
                        >
                            <img src={backgroundImage} alt="Reference" className="max-w-full max-h-full object-contain select-none outline-none" draggable={false} />
                        </div>
                        {activeTool === 'image' && (
                            <div className="absolute top-4 left-4 bg-primary/90 text-background px-3 py-1.5 rounded-full text-[10px] font-bold shadow-xl animate-bounce pointer-events-none z-20">
                                TRANSFORM MODE: DRAG TO MOVE | ALT+DRAG TO SCALE | SHIFT+DRAG TO ROTATE
                            </div>
                        )}
                    </div>
                )}

                {/* Main Path SVG - This stays mostly static during simple mouse moves */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none border border-white/5 bg-white/[0.02]" viewBox={`0 0 ${width} ${height}`} style={{ isolation: 'isolate' }}>
                    <Defs />

                    {/* Symmetry Guides (Always Visible) */}
                    <line x1={centerX} y1={0} x2={centerX} y2={height} stroke="#64748b" strokeWidth={1} strokeDasharray="6,4" opacity={symmetry.horizontal ? 0.5 : 0.1} />
                    <line x1={0} y1={centerY} x2={width} y2={centerY} stroke="#64748b" strokeWidth={1} strokeDasharray="6,4" opacity={symmetry.vertical ? 0.5 : 0.1} />
                    {symmetry.center && (
                        <g opacity={0.5}>
                            <line x1={centerX - 20} y1={centerY} x2={centerX + 20} y2={centerY} stroke="#64748b" strokeWidth={1} />
                            <line x1={centerX} y1={centerY - 20} x2={centerX} y2={centerY + 20} stroke="#64748b" strokeWidth={1} />
                            <circle cx={centerX} cy={centerY} r={3} fill="#64748b" />
                        </g>
                    )}

                    {/* Render Completed Paths */}
                    {sortedPaths.map((path) => (
                        <PathItem
                            key={path.id}
                            path={path}
                            selectedPathIds={selectedPathIds}
                            mode={mode}
                            onSelect={onPathSelectSafe}
                            isDragging={isDragging}
                            getBoundingBox={getBoundingBox}
                            animationPaused={animationPaused}
                            focusedSegmentIndices={focusedSegmentIndices}
                        />
                    ))}
                </svg>

                {/* High-Frequency Interaction Layer SVG - Handles real-time previews and cursor lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox={`0 0 ${width} ${height}`}>
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
                    {currentPoints.length > 1 && activeTool !== 'brush' && (
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
                    {activeTool !== 'brush' && symmetricCurrentPaths.map((points, idx) => points.length > 1 && (
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
                    {activeTool !== 'brush' && currentPoints.map((p, i) => (
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
                    {activeTool !== 'brush' && currentPoints.length > 0 && cursorPos && (
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
                    )}

                    {/* Rotation Center and Angle Visualization */}
                    {transformMode === 'rotate' && transformPivot && (
                        <g className="pointer-events-none">
                            {/* Rotation Center */}
                            <circle
                                cx={transformPivot.x}
                                cy={transformPivot.y}
                                r={12}
                                fill="rgba(245, 158, 11, 0.1)"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                opacity={0.6}
                            />
                            <circle
                                cx={transformPivot.x}
                                cy={transformPivot.y}
                                r={4}
                                fill="#f59e0b"
                                stroke="#fff"
                                strokeWidth={2}
                            />
                            <line
                                x1={transformPivot.x - 8}
                                y1={transformPivot.y}
                                x2={transformPivot.x + 8}
                                y2={transformPivot.y}
                                stroke="#f59e0b"
                                strokeWidth={1}
                                opacity={0.6}
                            />
                            <line
                                x1={transformPivot.x}
                                y1={transformPivot.y - 8}
                                x2={transformPivot.x}
                                y2={transformPivot.y + 8}
                                stroke="#f59e0b"
                                strokeWidth={1}
                                opacity={0.6}
                            />

                            {/* Angle Arc */}
                            {(() => {
                                const radius = 50;
                                const normalizedAngle = ((currentRotationDelta % 360) + 360) % 360;
                                const angleRadians = (currentRotationDelta * Math.PI) / 180;
                                const startX = transformPivot.x + radius;
                                const startY = transformPivot.y;
                                const endX = transformPivot.x + radius * Math.cos(angleRadians);
                                const endY = transformPivot.y + radius * Math.sin(angleRadians);
                                const largeArcFlag = Math.abs(normalizedAngle) > 180 ? 1 : 0;
                                const sweepFlag = currentRotationDelta > 0 ? 1 : 0;

                                return (
                                    <g>
                                        {/* Arc */}
                                        <path
                                            d={`M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`}
                                            fill="none"
                                            stroke="#f59e0b"
                                            strokeWidth={2}
                                            opacity={0.6}
                                        />
                                        {/* Angle Display */}
                                        <text
                                            x={transformPivot.x}
                                            y={transformPivot.y - radius - 15}
                                            textAnchor="middle"
                                            fill="#f59e0b"
                                            fontSize={14}
                                            fontWeight="bold"
                                            fontFamily="Inter, system-ui, sans-serif"
                                        >
                                            {currentRotationDelta.toFixed(1)}°
                                        </text>
                                    </g>
                                );
                            })()}
                        </g>
                    )}
                </svg>
            </div>

            {/* Optimized Coordinate Display using direct DOM access to avoid React re-renders */}
            <div
                id="coord-tracker"
                className={cn(
                    "absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-[10px] font-mono text-slate-400 pointer-events-none border border-white/5 tabular-nums select-none flex items-center gap-2 z-30 transition-opacity duration-200",
                    !cursorPos && "opacity-0"
                )}
            >
                <span className="text-white/50">X:</span>
                <span id="coord-x" className="text-indigo-400 w-8 text-right">0</span>
                <span className="text-white/50 border-l border-white/10 pl-2">Y:</span>
                <span id="coord-y" className="text-indigo-400 w-8 text-right">0</span>
            </div>
        </div>
    );
};

export default Canvas;
