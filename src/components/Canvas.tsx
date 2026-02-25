import React, { useMemo, useCallback } from 'react';
import type { PathLayer, Point, AnimationSettings, SymmetrySettings } from '../types';
import { smoothPath, getPolylinePath, applySymmetry } from '../utils/geometry';
import { interpolateTransform } from '../utils/animation';
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
    isAnimationMode?: boolean;
    currentTime?: number;
    animationResetKey?: number;
    isVertexEditEnabled: boolean;
    isPivotEditEnabled: boolean;
}

const PathItem = React.memo<PathItemProps>(({ path, selectedPathIds, mode, isDragging, getBoundingBox, animationPaused, focusedSegmentIndices, currentTime, animationResetKey, isVertexEditEnabled, isPivotEditEnabled }) => {
    const selected = selectedPathIds.includes(path.id);
    // Canvas dimensions for symmetry center
    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;

    const variants = useMemo(() => {
        return applySymmetry(path.multiPathPoints || path.points, path.symmetry, centerX, centerY);
    }, [path.multiPathPoints, path.points, path.symmetry, centerX, centerY]);

    const layerBox = useMemo(() => {
        if (path.type === 'text') {
            const centerX = path.points[0].x;
            const centerY = path.points[0].y;
            const fs = path.fontSize || 40;
            const charWidth = fs * 0.65;
            const width = (path.text?.length || 1) * charWidth;
            const height = fs * 0.85;
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
        return getBoundingBox(path.points);
    }, [path.points, getBoundingBox, path.type, path.text, path.fontSize]);

    const segmentBoxes = useMemo(() => {
        if (!path.multiPathPoints) return [];
        return path.multiPathPoints.map(pts => getBoundingBox(pts));
    }, [path.multiPathPoints, getBoundingBox]);

    const box = useMemo(() => {
        if (path.type === 'text') return layerBox;
        if (path.multiPathPoints && selected && focusedSegmentIndices.length > 0) {
            const allPoints: Point[] = [];
            focusedSegmentIndices.forEach(idx => {
                const pts = path.multiPathPoints![idx];
                if (pts) allPoints.push(...pts);
            });
            if (allPoints.length > 0) return getBoundingBox(allPoints);
        }
        return layerBox;
    }, [selected, focusedSegmentIndices, path.multiPathPoints, layerBox, getBoundingBox, path.type]);


    const currentTransform = useMemo(() => {
        if (path.keyframes && path.keyframes.length > 0 && currentTime !== undefined) {
            return interpolateTransform(path.keyframes, currentTime);
        }
        return path.transform;
    }, [path.keyframes, path.transform, currentTime]);

    const rootTransformStyle = useMemo(() => {
        if (!currentTransform) return {};
        const { x, y, rotation, scale, scaleX, scaleY, px = 0, py = 0 } = currentTransform;
        const sx = scaleX ?? scale ?? 1;
        const sy = scaleY ?? scale ?? 1;

        // Use absolute SVG viewBox coordinates for transform-origin.
        // box.centerX is in viewBox space (same as path.points), so this precisely
        // matches where we draw the crosshair (box.centerX + pivotX).
        // We do NOT use fill-box here because the root <g> also contains the
        // handles elements, which would distort fill-box's 50% reference.
        const originX = layerBox.centerX + px;
        const originY = layerBox.centerY + py;
        return {
            transform: `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${sx}, ${sy})`,
            transformOrigin: `${originX}px ${originY}px`,
        };
    }, [currentTransform, layerBox]);

    // Helper to generate animation styles
    const getStylesForAnimation = (
        anim: AnimationSettings | undefined,
        color: string,
        variantType: string | undefined,
        isPaused: boolean,
        originX?: number,
        originY?: number
    ) => {
        if (!anim || !anim.entries || anim.entries.length === 0) {
            return { pathStyles: {}, groupAnimations: [] };
        }
        // Respect the OFF toggle (paused flag on AnimationSettings)
        if (anim.paused) {
            return { pathStyles: {}, groupAnimations: [] };
        }

        let pathStyles: React.CSSProperties = {};
        const groupAnimations: React.CSSProperties[] = [];

        anim.entries.forEach(entry => {
            if (entry.paused) return;

            const { type, duration, delay, ease, direction = 'forward', repeat = false, repeatCount = 1 } = entry;
            const baseStyle: React.CSSProperties = {
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
                animationTimingFunction: ease,
                animationIterationCount: repeat ? repeatCount : 'infinite',
                animationFillMode: 'forwards',
                animationPlayState: isPaused ? 'paused' : 'running'
            };

            let finalDirection: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse' =
                direction === 'forward' ? 'normal' :
                    direction === 'alternate' ? 'alternate' : 'reverse';

            const tOrigin = (originX !== undefined && originY !== undefined)
                ? `${originX}px ${originY}px`
                : 'center';

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
                case 'float': {
                    const floatStyle = { ...baseStyle, animationName: 'floatPath', animationDirection: finalDirection };
                    let dist = entry.amplitude ?? (variantType === 'V' || variantType === 'C' ? 10 : -10);
                    // @ts-ignore
                    floatStyle['--float-dist'] = `${dist}px`;
                    groupAnimations.push(floatStyle);
                    break;
                }
                case 'spin': {
                    if (variantType === 'H' || variantType === 'V') {
                        if (finalDirection === 'normal') finalDirection = 'reverse';
                        else if (finalDirection === 'reverse') finalDirection = 'normal';
                    }
                    const spinStyle = { ...baseStyle, animationName: 'spinPath', transformOrigin: tOrigin, animationDirection: finalDirection };
                    if (entry.degree !== undefined) {
                        // @ts-ignore
                        spinStyle['--spin-degree'] = `${entry.degree}deg`;
                    }
                    groupAnimations.push(spinStyle);
                    break;
                }
                case 'bounce': {
                    const bounceStyle = { ...baseStyle, animationName: 'bouncePath', transformOrigin: tOrigin, animationDirection: finalDirection };
                    if (entry.amplitude !== undefined) {
                        // @ts-ignore
                        bounceStyle['--bounce-amp'] = entry.amplitude / 100; // Expected entry.amplitude is like 15 for 0.15 offset
                    }
                    groupAnimations.push(bounceStyle);
                    break;
                }
                case 'glow': {
                    const glowStyle = { ...baseStyle, animationName: 'glowPath', animationDirection: finalDirection };
                    // @ts-ignore
                    glowStyle['--glow-color'] = color;
                    groupAnimations.push(glowStyle);
                    break;
                }
                case 'shake': {
                    const shakeStyle = { ...baseStyle, animationName: 'shakePath', animationDirection: finalDirection };
                    if (entry.amplitude !== undefined) {
                        // @ts-ignore
                        shakeStyle['--shake-dist'] = `${entry.amplitude}px`;
                    }
                    groupAnimations.push(shakeStyle);
                    break;
                }
                case 'swing': {
                    const swingStyle = { ...baseStyle, animationName: 'swingPath', transformOrigin: tOrigin, animationDirection: finalDirection };
                    if (entry.degree !== undefined) {
                        // @ts-ignore
                        swingStyle['--swing-degree'] = `${entry.degree}deg`;
                    }
                    groupAnimations.push(swingStyle);
                    break;
                }
                case 'tada':
                    groupAnimations.push({ ...baseStyle, animationName: 'tadaPath', transformOrigin: tOrigin, animationDirection: finalDirection });
                    break;
                case 'jump': {
                    const jumpStyle: React.CSSProperties = {
                        ...baseStyle,
                        animationName: 'jumpPath',
                        animationTimingFunction: 'linear',
                        animationDirection: finalDirection,
                        transformOrigin: 'bottom center',
                        transformBox: 'fill-box'
                    };
                    if (entry.amplitude !== undefined) {
                        // @ts-ignore
                        jumpStyle['--jump-h'] = `${entry.amplitude}px`;
                    }
                    groupAnimations.push(jumpStyle);
                    break;
                }
            }
        });

        return { pathStyles, groupAnimations };
    };

    const variantConfigs = useMemo(() => {
        return variants.map(v => {
            const { px = 0, py = 0 } = currentTransform ?? path.transform ?? { px: 0, py: 0 };
            const glowColor = (path.color && path.color !== 'none') ? path.color : (path.fill && path.fill !== 'none' ? path.fill : '#22d3ee');
            const { pathStyles, groupAnimations } = getStylesForAnimation(
                path.animation,
                glowColor,
                v.type,
                isDragging || animationPaused,
                layerBox.centerX + px,
                layerBox.centerY + py
            );

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
    }, [
        path.animation,
        variants,
        path.color,
        isDragging,
        animationPaused,
        currentTransform,
        layerBox,
        path.segmentAnimations,
        path.segmentColors,
        path.segmentFills,
        path.segmentWidths,
        path.segmentTransforms,
        path.segmentKeyframes
    ]);


    return (
        <g style={rootTransformStyle}>
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
                        to { transform: rotate(var(--spin-degree, 360deg)); }
                    }
                    @keyframes bouncePath {
                        0%, 100% { transform: scale(1); }
                        40% { transform: scale(calc(1 + var(--bounce-amp, 0.15)), calc(1 - var(--bounce-amp, 0.15))); }
                        60% { transform: scale(calc(1 - var(--bounce-amp, 0.15) * 0.6), calc(1 + var(--bounce-amp, 0.15) * 0.6)); }
                        80% { transform: scale(calc(1 + var(--bounce-amp, 0.15) * 0.3), calc(1 - var(--bounce-amp, 0.15) * 0.3)); }
                    }
                    @keyframes glowPath {
                        0%, 100% { filter: drop-shadow(0 0 2px var(--glow-color)) brightness(1); }
                        50% { filter: drop-shadow(0 0 12px var(--glow-color)) brightness(1.5); }
                    }
                    @keyframes shakePath {
                        0%, 100% { transform: translateX(0); }
                        25% { transform: translateX(calc(-1 * var(--shake-dist, 4px))); }
                        75% { transform: translateX(var(--shake-dist, 4px)); }
                    }
                    @keyframes swingPath {
                        0%, 100% { transform: rotate(calc(-1 * var(--swing-degree, 10deg))); }
                        50% { transform: rotate(var(--swing-degree, 10deg)); }
                    }
                    @keyframes tadaPath {
                        0% { transform: scale(1); }
                        10%, 20% { transform: scale(0.9) rotate(-3deg); }
                        30%, 50%, 70%, 90% { transform: scale(1.1) rotate(3deg); }
                        40%, 60%, 80% { transform: scale(1.1) rotate(-3deg); }
                        100% { transform: scale(1) rotate(0); }
                    }
                    @keyframes jumpPath {
                        0%   { transform: translateY(0); }
                        5%   { transform: translateY(calc(-1 * var(--jump-h, 80px) * 0.19)); }
                        10%  { transform: translateY(calc(-1 * var(--jump-h, 80px) * 0.36)); }
                        15%  { transform: translateY(calc(-1 * var(--jump-h, 80px) * 0.51)); }
                        20%  { transform: translateY(calc(-1 * var(--jump-h, 80px) * 0.64)); }
                        25%  { transform: translateY(calc(-1 * var(--jump-h, 80px) * 0.75)); }
                        30%  { transform: translateY(calc(-1 * var(--jump-h, 80px) * 0.84)); }
                        35%  { transform: translateY(calc(-1 * var(--jump-h, 80px) * 0.91)); }
                        40%  { transform: translateY(calc(-1 * var(--jump-h, 80px) * 0.96)); }
                        45%  { transform: translateY(calc(-1 * var(--jump-h, 80px) * 0.99)); }
                        50%  { transform: translateY(calc(-1 * var(--jump-h, 80px))); }
                        55%  { transform: translateY(calc(-1 * var(--jump-h, 80px) * 0.99)); }
                        60%  { transform: translateY(calc(-1 * var(--jump-h, 80px) * 0.96)); }
                        65%  { transform: translateY(calc(-1 * var(--jump-h, 80px) * 0.91)); }
                        70%  { transform: translateY(calc(-1 * var(--jump-h, 80px) * 0.84)); }
                        75%  { transform: translateY(calc(-1 * var(--jump-h, 80px) * 0.75)); }
                        80%  { transform: translateY(calc(-1 * var(--jump-h, 80px) * 0.64)); }
                        85%  { transform: translateY(calc(-1 * var(--jump-h, 80px) * 0.51)); }
                        90%  { transform: translateY(calc(-1 * var(--jump-h, 80px) * 0.36)); }
                        95%  { transform: translateY(calc(-1 * var(--jump-h, 80px) * 0.19)); }
                        100% { transform: translateY(0); }
                    }
                    .interactive-ui {
                        transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                        cursor: pointer !important;
                        pointer-events: all !important;
                        transform-box: fill-box;
                        transform-origin: center;
                    }
                    .interactive-ui:hover {
                        transform: scale(1.03);
                        filter: brightness(1.1);
                    }
                    .interactive-ui:active {
                        transform: scale(0.97);
                        filter: brightness(0.9);
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
                const fullKey = `${path.id}-v${vIdx}-${pathStyleKey}-${animKey}-${animationResetKey}`;

                const renderPathElement = (dStr: string, sIdx?: number | number[]) => {
                    const sIndices = Array.isArray(sIdx) ? sIdx : (sIdx !== undefined ? [sIdx] : []);
                    const isFocused = sIndices.some(idx => focusedSegmentIndices.includes(idx));
                    const firstSIdx = sIndices.length > 0 ? sIndices[0] : undefined;

                    // If focusedSegmentIndices is empty, we can either highlight all or none. 
                    // To satisfy "only select clicked element", we highlight all only if no segment focus is possible (not multi-path)
                    // For multi-path, if no segments are focused, we don't highlight any segment with the selection color.
                    // If focusedSegmentIndices is empty, we assume the whole group is selected (e.g. via Layer Panel or Box Select)
                    const shouldHighlight = selected && !path.locked && (path.multiPathPoints ? (focusedSegmentIndices.length === 0 || isFocused) : true);

                    const segmentColor = (firstSIdx !== undefined && path.segmentColors?.[firstSIdx]) || path.color || '#22d3ee';
                    const segmentFill = (firstSIdx !== undefined && path.segmentFills?.[firstSIdx]) || path.fill || 'none';
                    const segmentWidth = (firstSIdx !== undefined ? path.segmentWidths?.[firstSIdx] : undefined) ?? (path.width || 2);
                    const segmentAnim = (firstSIdx !== undefined ? path.segmentAnimations?.[firstSIdx] : undefined) || undefined;
                    const segmentFilter = (firstSIdx !== undefined && path.segmentFilters?.[firstSIdx]) || path.filter || 'none';

                    // Calculate stable anchor for this segment
                    const naturalCenter = (firstSIdx !== undefined && segmentBoxes[firstSIdx])
                        ? { x: segmentBoxes[firstSIdx].centerX, y: segmentBoxes[firstSIdx].centerY }
                        : { x: layerBox.centerX, y: layerBox.centerY };

                    // Calculate segment-specific transform (interpolated if animating)
                    const segTransform = (() => {
                        const idx = firstSIdx;
                        if (idx !== undefined && path.segmentKeyframes?.[idx] && path.segmentKeyframes[idx]!.length > 0 && currentTime !== undefined) {
                            return interpolateTransform(path.segmentKeyframes[idx]!, currentTime);
                        }
                        return idx !== undefined ? path.segmentTransforms?.[idx] : undefined;
                    })();

                    const segTransformStyle: React.CSSProperties = segTransform ? {
                        transform: `translate(${segTransform.x}px, ${segTransform.y}px) rotate(${segTransform.rotation}deg) scale(${segTransform.scaleX ?? segTransform.scale ?? 1}, ${segTransform.scaleY ?? segTransform.scale ?? 1})`,
                        transformOrigin: `${naturalCenter.x + (segTransform.px || 0)}px ${naturalCenter.y + (segTransform.py || 0)}px`
                    } : {};

                    // Calculate segment-specific animations
                    const segmentGlowColor = (segmentColor && segmentColor !== 'none') ? segmentColor : (segmentFill && segmentFill !== 'none' ? segmentFill : '#22d3ee');
                    const { pathStyles: segPathStyles, groupAnimations: segGroupAnimations } = getStylesForAnimation(
                        segmentAnim,
                        segmentGlowColor,
                        config.variantType,
                        isDragging || animationPaused,
                        naturalCenter.x + (segTransform?.px || 0),
                        naturalCenter.y + (segTransform?.py || 0)
                    );

                    let pathElement = (
                        <path
                            key={firstSIdx ?? 'main'}
                            d={dStr}
                            stroke={shouldHighlight ? '#f59e0b' : segmentColor}
                            strokeOpacity={path.strokeOpacity ?? 1}
                            strokeWidth={segmentWidth}
                            fill={segmentFill}
                            fillOpacity={path.fillOpacity ?? 1}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            data-path-id={path.id}
                            data-segment-index={firstSIdx}
                            className={cn(
                                mode === 'edit' && !isDragging && !path.locked && "cursor-move hover:opacity-80"
                            )}
                            style={{
                                pointerEvents: (mode === 'edit' && !path.locked) ? 'all' : 'none',
                                ...config.pathStyles, // Apply global path styles (e.g. from global animation if any)
                                ...segPathStyles,     // Apply segment specific path styles
                                ...segTransformStyle, // Apply segment-specific transform (keyframes)
                                filter: segmentFilter !== 'none' ? segmentFilter : undefined
                            }}
                        />
                    );

                    if (path.interactive || (firstSIdx !== undefined && path.segmentInteractive?.[firstSIdx])) {
                        pathElement = (
                            <g className="interactive-ui" key={`${firstSIdx ?? 'main'}-int`} style={{
                                transformOrigin: box ? `${box.centerX + (segTransform?.px || 0)}px ${box.centerY + (segTransform?.py || 0)}px` : 'center'
                            }}>
                                {pathElement}
                            </g>
                        );
                    }

                    if (segGroupAnimations.length > 0) {
                        return wrapInAnimations(pathElement, segGroupAnimations, `seg-${firstSIdx ?? 'main'}`);
                    }
                    return pathElement;
                };

                const textElement = (
                    <text
                        x={0}
                        y={0}
                        fill={(path.fill && path.fill !== 'none') ? path.fill : (path.color && path.color !== 'none' ? path.color : '#22d3ee')}
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
                            mode === 'edit' && !isDragging && !path.locked && "cursor-move hover:opacity-80 transition-opacity"
                        )}
                        style={{
                            pointerEvents: (mode === 'edit' && !path.locked) ? 'all' : 'none',
                            userSelect: 'none',
                            ...config.pathStyles,
                            filter: path.filter !== 'none' ? path.filter : undefined
                        }}
                    >
                        {path.text}
                    </text>
                );

                const element = path.type === 'text' ? (
                    path.interactive ? (
                        <g className="interactive-ui">
                            {textElement}
                        </g>
                    ) : textElement
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
                            <g
                                data-path-id={path.id}
                                style={{
                                    ...config.pathStyles,
                                    transformOrigin: `${layerBox.centerX + (currentTransform?.px || 0)}px ${layerBox.centerY + (currentTransform?.py || 0)}px`,
                                    transformBox: 'fill-box'
                                }}
                            >
                                {(() => {
                                    const groups: {
                                        color: string, fill: string, width: number, animKey: string,
                                        segments: { sIdx: number, points: Point[], tension: number, closed: boolean }[]
                                    }[] = [];

                                    config.multiPoints.forEach((segPoints, sIdx) => {
                                        const segColor = path.segmentColors?.[sIdx] ?? path.color ?? 'none';
                                        const segFill = path.segmentFills?.[sIdx] ?? path.fill ?? 'none';
                                        const segWidth = path.segmentWidths?.[sIdx] ?? path.width ?? 0;
                                        const segTension = path.segmentTensions?.[sIdx] ?? path.tension;
                                        const segClosed = path.segmentClosed?.[sIdx] ?? path.closed;
                                        const segAnim = path.segmentAnimations?.[sIdx];
                                        const animKey = segAnim ? JSON.stringify(segAnim) : '';

                                        const lastGroup = groups[groups.length - 1];

                                        if (lastGroup &&
                                            lastGroup.color === segColor &&
                                            lastGroup.fill === segFill &&
                                            lastGroup.width === segWidth &&
                                            lastGroup.animKey === animKey
                                        ) {
                                            lastGroup.segments.push({ sIdx, points: segPoints, tension: segTension, closed: segClosed });
                                        } else {
                                            groups.push({
                                                color: segColor as string, fill: segFill as string, width: segWidth, animKey,
                                                segments: [{ sIdx, points: segPoints, tension: segTension, closed: segClosed }]
                                            });
                                        }
                                    });

                                    return groups.map((g, gIdx) => {
                                        if (mode === 'edit' && !path.locked && path.id.startsWith('merged-')) {
                                            // In Edit Mode, we render each sub-path individually for Merged Layers
                                            // to accurately hit-test and provide the exact data-segment-index.
                                            // We group segments based on segmentGroupings to preserve composite paths (e.g. holes).
                                            const getChunkId = (sIdx: number) => {
                                                if (!path.segmentGroupings) return sIdx;
                                                let currentSIdx = 0;
                                                let chunkId = 0;
                                                for (const count of path.segmentGroupings) {
                                                    if (sIdx >= currentSIdx && sIdx < currentSIdx + count) return chunkId;
                                                    currentSIdx += count;
                                                    chunkId++;
                                                }
                                                return sIdx; // fallback
                                            };

                                            const chunkMap = new Map<number, typeof g.segments>();
                                            g.segments.forEach(seg => {
                                                const cId = getChunkId(seg.sIdx);
                                                if (!chunkMap.has(cId)) chunkMap.set(cId, []);
                                                chunkMap.get(cId)!.push(seg);
                                            });

                                            return (
                                                <React.Fragment key={`group-${gIdx}`}>
                                                    {Array.from(chunkMap.entries()).map(([chunkId, chunkSegs]) => {
                                                        const combinedD = chunkSegs.map(seg => smoothPath(seg.points, seg.tension, seg.closed)).join(' ');
                                                        const sIndices = chunkSegs.map(seg => seg.sIdx);
                                                        return (
                                                            <React.Fragment key={`chunk-${chunkId}`}>
                                                                {renderPathElement(combinedD, sIndices)}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            );
                                        }

                                        // In standard viewing/drawing mode, combine for performance
                                        const combinedD = g.segments.map(seg => smoothPath(seg.points, seg.tension, seg.closed)).join(' ');
                                        const sIndices = g.segments.map(seg => seg.sIdx);
                                        return (
                                            <React.Fragment key={`group-${gIdx}`}>
                                                {renderPathElement(combinedD, sIndices)}
                                            </React.Fragment>
                                        );
                                    });
                                })()}
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

                        {/* Bounding Box & Handles - Only for the primary variant and if not locked */}
                        {mode === 'edit' && selected && !path.locked && config.variantType === 'I' && (
                            (() => {
                                // Calculate handles transform/animation style (for following sub-items in merged layers)
                                const focusedIdx = focusedSegmentIndices.length > 0 ? focusedSegmentIndices[0] : undefined;
                                const stableCenter = (focusedIdx !== undefined && segmentBoxes[focusedIdx])
                                    ? { x: segmentBoxes[focusedIdx].centerX, y: segmentBoxes[focusedIdx].centerY }
                                    : { x: layerBox.centerX, y: layerBox.centerY };

                                const handlesTransformStyle = (() => {
                                    if (focusedIdx !== undefined) {
                                        const segTransform = (() => {
                                            if (path.segmentKeyframes?.[focusedIdx] && path.segmentKeyframes[focusedIdx]!.length > 0 && currentTime !== undefined) {
                                                return interpolateTransform(path.segmentKeyframes[focusedIdx]!, currentTime);
                                            }
                                            return path.segmentTransforms?.[focusedIdx];
                                        })();
                                        if (!segTransform) return { pivotX: currentTransform?.px || 0, pivotY: currentTransform?.py || 0 };
                                        const sx = segTransform.scaleX ?? segTransform.scale ?? 1;
                                        const sy = segTransform.scaleY ?? segTransform.scale ?? 1;
                                        return {
                                            transform: `translate(${segTransform.x}px, ${segTransform.y}px) rotate(${segTransform.rotation}deg) scale(${sx}, ${sy})`,
                                            transformOrigin: `${stableCenter.x + (segTransform.px || 0)}px ${stableCenter.y + (segTransform.py || 0)}px`,
                                            pivotX: segTransform.px || 0,
                                            pivotY: segTransform.py || 0
                                        } as any;
                                    }
                                    return {
                                        pivotX: currentTransform?.px || 0,
                                        pivotY: currentTransform?.py || 0
                                    };
                                })();

                                const handlesGroupAnims: React.CSSProperties[] = [];

                                const pivotX = (handlesTransformStyle as any).pivotX || 0;
                                const pivotY = (handlesTransformStyle as any).pivotY || 0;

                                const handles = (
                                    <g className="pointer-events-none" style={{
                                        ...handlesTransformStyle,
                                        transformOrigin: `${stableCenter.x + pivotX}px ${stableCenter.y + pivotY}px`
                                    }}>
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
                                                        r={25}
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
                                                            "transition-all duration-300 ease-out pointer-events-none",
                                                            "group-hover:scale-125 group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]",
                                                            isDragging && "transition-none scale-110"
                                                        )}
                                                        style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
                                                    />
                                                </g>

                                                {/* Scale Corner Handles */}
                                                {[
                                                    { x: box.minX - 5, y: box.minY - 5, h: 'nw' },
                                                    { x: box.maxX + 5, y: box.minY - 5, h: 'ne' },
                                                    { x: box.minX - 5, y: box.maxY + 5, h: 'sw' },
                                                    { x: box.maxX + 5, y: box.maxY + 5, h: 'se' }
                                                ].map((corner) => (
                                                    <g key={corner.h} className="group pointer-events-auto">
                                                        <rect
                                                            x={corner.x - 15}
                                                            y={corner.y - 15}
                                                            width={30}
                                                            height={30}
                                                            fill="transparent"
                                                            data-handle={corner.h}
                                                            className={cn(
                                                                (corner.h === 'nw' || corner.h === 'se') ? 'cursor-nwse-resize' : 'cursor-nesw-resize'
                                                            )}
                                                        />
                                                        <rect
                                                            x={corner.x - 4}
                                                            y={corner.y - 4}
                                                            width={8}
                                                            height={8}
                                                            fill="#f59e0b"
                                                            stroke="#fff"
                                                            strokeWidth={1.5}
                                                            className={cn(
                                                                "transition-all duration-300 ease-out pointer-events-none",
                                                                "group-hover:scale-150 group-hover:drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]",
                                                                isDragging && "transition-none scale-125"
                                                            )}
                                                            style={{
                                                                transformOrigin: 'center',
                                                                transformBox: 'fill-box'
                                                            }}
                                                        />
                                                    </g>
                                                ))}

                                                {/* Pivot Point Handle - Only show and allow dragging if pivot edit is enabled */}
                                                {isPivotEditEnabled && (
                                                    <g className="group pointer-events-auto cursor-move">
                                                        <circle
                                                            cx={box.centerX + pivotX}
                                                            cy={box.centerY + pivotY}
                                                            r={30}
                                                            fill="transparent"
                                                            data-handle="pivot"
                                                        />
                                                        {/* Crosshair/Target Icon for Pivot */}
                                                        <g className={cn(
                                                            "pointer-events-none",
                                                            "transition-all duration-300 ease-out",
                                                            "group-hover:scale-150 group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]",
                                                            isDragging && "transition-none scale-125"
                                                        )} style={{
                                                            transformOrigin: 'center',
                                                            transformBox: 'fill-box',
                                                            transform: `translate(${box.centerX + pivotX}px, ${box.centerY + pivotY}px)`
                                                        }}>
                                                            <circle cx={0} cy={0} r={5} fill="none" stroke="#f59e0b" strokeWidth={1} />
                                                            <circle cx={0} cy={0} r={2} fill="#f59e0b" className={cn(isDragging && "animate-pulse")} />
                                                            <line x1={-8} y1={0} x2={8} y2={0} stroke="#f59e0b" strokeWidth={1} />
                                                            <line x1={0} y1={-8} x2={0} y2={8} stroke="#f59e0b" strokeWidth={1} />
                                                        </g>
                                                    </g>
                                                )}
                                            </g>
                                        )}

                                        {/* Direct Point Edit Handles */}
                                        {isVertexEditEnabled && (
                                            (path.multiPathPoints
                                                ? (focusedSegmentIndices.length > 0 && config.multiPoints
                                                    ? config.multiPoints[focusedSegmentIndices[0]] || []
                                                    : [])
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
                                            ))
                                        )}
                                    </g>
                                );

                                return handlesGroupAnims.length > 0
                                    ? wrapInAnimations(handles, handlesGroupAnims, 'handles')
                                    : handles;
                            })()
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
    transformMode: 'none' | 'rotate' | 'scale' | 'translate' | 'pivot';
    transformPivot: Point | null;
    currentRotationDelta: number;
    currentScaleFactor: number;
    currentTranslationDelta: Point;
    isAnimationMode?: boolean;
    currentTime?: number;
    shapeStartPoint: Point | null;
    isShiftPressed: boolean;
    marqueeStart: Point | null;
    marqueeEnd: Point | null;
    isVertexEditEnabled: boolean;
    isPivotEditEnabled: boolean;
    onPointerUp: () => void;
    canvasBgColor?: string;
    animationResetKey?: number;
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
    currentRotationDelta,
    currentScaleFactor,
    currentTranslationDelta,
    isAnimationMode,
    currentTime,
    animationResetKey = 0,
    shapeStartPoint,
    isShiftPressed,
    marqueeStart,
    marqueeEnd,
    isVertexEditEnabled,
    isPivotEditEnabled,
    onPointerUp,
    canvasBgColor = 'transparent'
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
        return paths.filter(p => p.visible !== false);
    }, [paths]);

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
            onMouseUp={onPointerUp}
            onMouseLeave={onPointerLeave}
            onDoubleClick={onDoubleClick}
            onContextMenu={onContextMenu}
            ref={canvasRef}
        >
            <div
                className="w-full h-full will-change-transform"
                style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                    transformOrigin: '0 0',
                    backgroundColor: canvasBgColor === 'transparent' ? 'transparent' : canvasBgColor,
                    backgroundImage: canvasBgColor === 'transparent'
                        ? 'conic-gradient(#1e293b 90deg, #0f172a 90deg 180deg, #1e293b 180deg 270deg, #0f172a 270deg)'
                        : 'none',
                    backgroundSize: canvasBgColor === 'transparent' ? `${20 / zoom}px ${20 / zoom}px` : 'auto'
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
                    {(() => {
                        const axisColor = canvasBgColor === '#ffffff' ? '#94a3b8' : '#64748b';
                        const axisOpacity = (active: boolean) => active ? 0.6 : 0.15;
                        return (
                            <>
                                <line x1={centerX} y1={0} x2={centerX} y2={height} stroke={axisColor} strokeWidth={1} strokeDasharray="6,4" opacity={axisOpacity(symmetry.horizontal)} />
                                <line x1={0} y1={centerY} x2={width} y2={centerY} stroke={axisColor} strokeWidth={1} strokeDasharray="6,4" opacity={axisOpacity(symmetry.vertical)} />
                                {symmetry.center && (
                                    <g opacity={0.6}>
                                        <line x1={centerX - 20} y1={centerY} x2={centerX + 20} y2={centerY} stroke={axisColor} strokeWidth={1} />
                                        <line x1={centerX} y1={centerY - 20} x2={centerX} y2={centerY + 20} stroke={axisColor} strokeWidth={1} />
                                        <circle cx={centerX} cy={centerY} r={3} fill={axisColor} />
                                    </g>
                                )}
                            </>
                        );
                    })()}

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
                            isAnimationMode={isAnimationMode}
                            currentTime={currentTime}
                            animationResetKey={animationResetKey}
                            isVertexEditEnabled={isVertexEditEnabled}
                            isPivotEditEnabled={isPivotEditEnabled}
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

                    {/* Shape Dimensions Tooltip */}
                    {mode === 'draw' && shapeStartPoint && cursorPos && (activeTool === 'square' || activeTool === 'circle' || activeTool === 'triangle' || activeTool === 'star') && (
                        <g className="pointer-events-none">
                            {(() => {
                                let dx = cursorPos.x - shapeStartPoint.x;
                                let dy = cursorPos.y - shapeStartPoint.y;
                                if (isShiftPressed) {
                                    const size = Math.max(Math.abs(dx), Math.abs(dy));
                                    dx = Math.sign(dx) * size;
                                    dy = Math.sign(dy) * size;
                                }
                                const displayW = Math.round(Math.abs(dx));
                                const displayH = Math.round(Math.abs(dy));
                                const tooltipX = shapeStartPoint.x + dx + 15;
                                const tooltipY = shapeStartPoint.y + dy + 15;

                                return (
                                    <foreignObject
                                        x={tooltipX}
                                        y={tooltipY}
                                        width={100}
                                        height={40}
                                    >
                                        <div className="bg-slate-900/90 backdrop-blur-md border border-primary/30 rounded px-2 py-1 flex flex-col gap-0.5 shadow-xl">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">W</span>
                                                <span className="text-[10px] font-mono font-black text-primary tabular-nums">
                                                    {displayW}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">H</span>
                                                <span className="text-[10px] font-mono font-black text-primary tabular-nums">
                                                    {displayH}
                                                </span>
                                            </div>
                                        </div>
                                    </foreignObject>
                                );
                            })()}
                        </g>
                    )}

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
                                const absDelta = Math.abs(currentRotationDelta % 360);
                                const angleRadians = (currentRotationDelta * Math.PI) / 180;
                                const startX = transformPivot.x + radius;
                                const startY = transformPivot.y;
                                const endX = transformPivot.x + radius * Math.cos(angleRadians);
                                const endY = transformPivot.y + radius * Math.sin(angleRadians);
                                const largeArcFlag = absDelta > 180 ? 1 : 0;
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

                                        {/* Transformation Tooltip */}
                                        {cursorPos && (
                                            <foreignObject
                                                x={cursorPos.x + 15}
                                                y={cursorPos.y + 15}
                                                width={100}
                                                height={40}
                                            >
                                                <div className="bg-slate-900/90 backdrop-blur-md border border-amber-500/30 rounded px-2 py-1 flex flex-col gap-0.5 shadow-xl">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Angle</span>
                                                        <span className="text-[10px] font-mono font-black text-amber-500 tabular-nums">
                                                            {Math.round(currentRotationDelta)}°
                                                        </span>
                                                    </div>
                                                    {isShiftPressed && (
                                                        <div className="text-[7px] text-amber-500/50 font-bold uppercase tracking-tighter">
                                                            Snapped 15°
                                                        </div>
                                                    )}
                                                </div>
                                            </foreignObject>
                                        )}
                                    </g>
                                );
                            })()}
                        </g>
                    )}

                    {/* Translation Tooltip */}
                    {transformMode === 'translate' && cursorPos && (
                        <g className="pointer-events-none">
                            <foreignObject
                                x={cursorPos.x + 15}
                                y={cursorPos.y + 15}
                                width={100}
                                height={40}
                            >
                                <div className="bg-slate-900/90 backdrop-blur-md border border-blue-500/30 rounded px-2 py-1 flex flex-col gap-0.5 shadow-xl">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">ΔX</span>
                                        <span className="text-[10px] font-mono font-black text-blue-400 tabular-nums">
                                            {Math.round(currentTranslationDelta.x)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">ΔY</span>
                                        <span className="text-[10px] font-mono font-black text-blue-400 tabular-nums">
                                            {Math.round(currentTranslationDelta.y)}
                                        </span>
                                    </div>
                                </div>
                            </foreignObject>
                        </g>
                    )}

                    {/* Scale Tooltip */}
                    {transformMode === 'scale' && cursorPos && (
                        <g className="pointer-events-none">
                            <foreignObject
                                x={cursorPos.x + 15}
                                y={cursorPos.y + 15}
                                width={100}
                                height={40}
                            >
                                <div className="bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 rounded px-2 py-1 flex flex-col gap-0.5 shadow-xl">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Scale</span>
                                        <span className="text-[10px] font-mono font-black text-emerald-400 tabular-nums">
                                            {currentScaleFactor.toFixed(2)}x
                                        </span>
                                    </div>
                                    <div className="text-[7px] text-emerald-500/50 font-bold uppercase tracking-tighter">
                                        {Math.round(currentScaleFactor * 100)}%
                                    </div>
                                </div>
                            </foreignObject>
                        </g>
                    )}
                    {/* Marquee Selection Box */}
                    {marqueeStart && marqueeEnd && (
                        <rect
                            x={Math.min(marqueeStart.x, marqueeEnd.x)}
                            y={Math.min(marqueeStart.y, marqueeEnd.y)}
                            width={Math.abs(marqueeEnd.x - marqueeStart.x)}
                            height={Math.abs(marqueeEnd.y - marqueeStart.y)}
                            fill="rgba(59, 130, 246, 0.1)"
                            stroke="rgba(59, 130, 246, 0.5)"
                            strokeWidth={1 / zoom}
                            strokeDasharray={`${4 / zoom},${4 / zoom}`}
                            className="pointer-events-none"
                        />
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
