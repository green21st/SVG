import { useState, useRef, useCallback, useEffect } from 'react';
import type { Point, PathLayer, SymmetrySettings, AnimationSettings, Transform, AnimationKeyframe } from '../types';
import { distToSegment, simplifyPath, smoothPath } from '../utils/geometry';
import { interpolateTransform } from '../utils/animation';
import useHistory from './useHistory';

function useDraw() {
    const {
        state: paths,
        setState: setPaths,
        setInternalState,
        undo,
        redo,
        canUndo,
        canRedo
    } = useHistory<PathLayer[]>([]);

    const [currentPoints, setCurrentPoints] = useState<Point[]>([]);

    // Updated state for SymmetrySettings
    const [symmetry, setSymmetry] = useState<SymmetrySettings>({
        horizontal: false,
        vertical: false,
        center: false
    });

    const [tension, setTension] = useState<number>(0.5);
    const [strokeColor, setStrokeColor] = useState<string>('#22d3ee');
    const [fillColor, setFillColor] = useState<string>('none'); // Default no fill
    const [strokeWidth, setStrokeWidth] = useState<number>(2);
    const [isClosed, setIsClosed] = useState<boolean>(false);
    const [strokeOpacity, setStrokeOpacity] = useState<number>(1);
    const [fillOpacity, setFillOpacity] = useState<number>(1);
    const [fontFamily, setFontFamily] = useState<string>('Inter, system-ui, sans-serif');
    const [animation, setAnimation] = useState<AnimationSettings>({
        entries: []
    });
    const [filter, setFilter] = useState<string>('none');
    const [interactive, setInteractive] = useState<boolean>(false);
    const [isInteracting, setIsInteracting] = useState(false);

    // Edit Mode State
    const [mode, setMode] = useState<'draw' | 'edit'>('draw');
    const [selectedPathIds, setSelectedPathIds] = useState<string[]>([]);
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
    const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);
    const [focusedSegmentIndices, setFocusedSegmentIndices] = useState<number[]>([]);
    const isDraggingRef = useRef(false);

    const [activeTool, setActiveTool] = useState<'brush' | 'pen' | 'square' | 'circle' | 'triangle' | 'star' | 'image'>('brush');
    const [bgTransform, setBgTransform] = useState({ x: 0, y: 0, scale: 1, rotation: 0, opacity: 0.3 });
    const [shapeStartPoint, setShapeStartPoint] = useState<Point | null>(null);
    const isDrawingBrushRef = useRef(false);

    // Transformation State
    const [transformMode, setTransformMode] = useState<'none' | 'rotate' | 'scale' | 'translate' | 'pivot'>('none');
    const [transformHandle, setTransformHandle] = useState<string | null>(null);
    const [transformPivot, setTransformPivot] = useState<Point | null>(null);
    const [initialPoints, setInitialPoints] = useState<Point[] | null>(null);
    const [initialAngle, setInitialAngle] = useState<number>(0);
    const [initialDist, setInitialDist] = useState<number>(1);
    const [initialMousePos, setInitialMousePos] = useState<Point | null>(null);
    const [initialFontSize, setInitialFontSize] = useState<number>(40);
    const [initialRotation, setInitialRotation] = useState<number>(0);
    const [currentRotationDelta, setCurrentRotationDelta] = useState<number>(0);
    const [currentScaleFactor, setCurrentScaleFactor] = useState<number>(1);
    const [currentTranslationDelta, setCurrentTranslationDelta] = useState<Point>({ x: 0, y: 0 });
    const [rotationStartAngle, setRotationStartAngle] = useState<number>(0);
    const initialTransformsRef = useRef<Map<string, Transform>>(new Map());
    const initialSegmentTransformsRef = useRef<Map<number, Transform>>(new Map());

    // Animation State
    const [isAnimationMode, setIsAnimationMode] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(5000);
    const [isPlaying, setIsPlaying] = useState(false);

    // Calculate the maximum keyframe time across all layers
    const maxKeyframeTime = useCallback(() => {
        let max = 0;
        paths.forEach(p => {
            // Check whole-layer keyframes
            p.keyframes?.forEach(kf => {
                if (kf.time > max) max = kf.time;
            });
            // Check individual segment keyframes in merged layers
            p.segmentKeyframes?.forEach(segKfs => {
                segKfs?.forEach(kf => {
                    if (kf.time > max) max = kf.time;
                });
            });
        });
        return max;
    }, [paths]);

    const lastKfTime = maxKeyframeTime();
    const effectiveDuration = lastKfTime > 0 ? lastKfTime : duration;
    const timelineDuration = Math.max(duration, lastKfTime);

    // Animation Playback Loop
    useEffect(() => {
        let animationFrameId: number;
        let lastTimestamp: number;

        const animate = (timestamp: number) => {
            if (!lastTimestamp) lastTimestamp = timestamp;
            const delta = timestamp - lastTimestamp;
            lastTimestamp = timestamp;

            setCurrentTime(prev => {
                const next = prev + delta;
                // Loop point is explicitly the last keyframe if it exists
                if (next >= effectiveDuration) {
                    return 0; // Loop back to start
                }
                return next;
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        if (isPlaying) {
            animationFrameId = requestAnimationFrame(animate);
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [isPlaying, effectiveDuration]);

    const handleAddKeyframe = useCallback(() => {
        if (selectedPathIds.length === 0) return;

        setPaths(prev => prev.map(p => {
            if (selectedPathIds.includes(p.id)) {
                // Check if we're in focus mode for a merged layer
                if (focusedSegmentIndices.length > 0 && p.multiPathPoints) {
                    // Add keyframe to focused segments
                    const newSegmentKeyframes = [...(p.segmentKeyframes || p.multiPathPoints.map(() => undefined))];
                    while (newSegmentKeyframes.length < p.multiPathPoints.length) {
                        newSegmentKeyframes.push(undefined);
                    }

                    focusedSegmentIndices.forEach(idx => {
                        const segKfs = newSegmentKeyframes[idx] || [];
                        const segTransform = p.segmentTransforms?.[idx] || { x: 0, y: 0, rotation: 0, scale: 1 };
                        const interpolated = interpolateTransform(segKfs, currentTime);
                        const value = interpolated || segTransform;

                        let newKfs = [...segKfs];
                        newKfs = newKfs.filter(k => Math.abs(k.time - currentTime) > 0.1);
                        newKfs.push({
                            id: `kf-${p.id}-seg${idx}-${Math.round(currentTime)}`,
                            time: currentTime,
                            value: value,
                            ease: 'linear'
                        });
                        newKfs.sort((a, b) => a.time - b.time);
                        newSegmentKeyframes[idx] = newKfs;
                    });

                    return { ...p, segmentKeyframes: newSegmentKeyframes };
                }

                // Whole-layer keyframe
                const interpolated = interpolateTransform(p.keyframes || [], currentTime);
                const value = interpolated || p.transform || { x: 0, y: 0, rotation: 0, scale: 1 };

                let newKeyframes = [...(p.keyframes || [])];
                newKeyframes = newKeyframes.filter(k => Math.abs(k.time - currentTime) > 0.1);
                newKeyframes.push({
                    id: `kf-${p.id}-${Math.round(currentTime)}`,
                    time: currentTime,
                    value: value,
                    ease: 'linear'
                });
                newKeyframes.sort((a, b) => a.time - b.time);

                return { ...p, keyframes: newKeyframes };
            }
            return p;
        }));
    }, [selectedPathIds, currentTime, setPaths, focusedSegmentIndices]);

    const handleDeleteKeyframe = useCallback(() => {
        if (selectedPathIds.length === 0) return;

        setPaths(prev => prev.map(p => {
            if (selectedPathIds.includes(p.id)) {
                // Check if we're in focus mode for a merged layer
                if (focusedSegmentIndices.length > 0 && p.multiPathPoints && p.segmentKeyframes) {
                    const newSegmentKeyframes = [...p.segmentKeyframes];
                    focusedSegmentIndices.forEach(idx => {
                        if (newSegmentKeyframes[idx]) {
                            newSegmentKeyframes[idx] = newSegmentKeyframes[idx]!.filter(k => Math.abs(k.time - currentTime) > 100);
                        }
                    });
                    return { ...p, segmentKeyframes: newSegmentKeyframes };
                }

                // Whole-layer keyframe deletion
                const newKeyframes = (p.keyframes || []).filter(k => Math.abs(k.time - currentTime) > 100);
                return { ...p, keyframes: newKeyframes };
            }
            return p;
        }));
    }, [selectedPathIds, currentTime, setPaths, focusedSegmentIndices]);

    const [isReorderingLayers, setIsReorderingLayers] = useState(false);

    // Snapping Settings
    const [pointSnappingEnabled, setPointSnappingEnabled] = useState<boolean>(true);
    const [guideSnappingEnabled, setGuideSnappingEnabled] = useState<boolean>(true);
    const [marqueeStart, setMarqueeStart] = useState<Point | null>(null);
    const [marqueeEnd, setMarqueeEnd] = useState<Point | null>(null);

    const [isVertexEditEnabled, setIsVertexEditEnabled] = useState(false);
    const [isPivotEditEnabled, setIsPivotEditEnabled] = useState(false);

    // Zoom and Pan State
    const [zoom, setZoom] = useState<number>(1);
    const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });
    const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
    const [isShiftPressed, setIsShiftPressed] = useState<boolean>(false);

    const [cursorPos, setCursorPos] = useState<Point | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const dragStartPathsRef = useRef<PathLayer[] | null>(null);
    const dragStartMousePosRef = useRef<Point | null>(null);

    // Bounding Box Helper
    const getBoundingBox = useCallback((points: Point[]) => {
        if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
        const xs = points.map(p => p.x);
        const ys = points.map(p => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        return {
            minX, minY, maxX, maxY,
            width: maxX - minX,
            height: maxY - minY,
            centerX: (minX + maxX) / 2,
            centerY: (minY + maxY) / 2
        };
    }, []);

    useEffect(() => {
        if (mode === 'draw' || selectedPathIds.length === 0) {
            setAnimation({ entries: [] });
        }
    }, [mode, selectedPathIds.length]);

    // 1. Sync settings when selectedPathIds changes
    useEffect(() => {
        if (mode === 'edit' && selectedPathIds.length > 0 && !isDraggingRef.current) {
            const firstId = selectedPathIds[0];
            const path = paths.find(p => p.id === firstId);
            if (path) {
                // Determine source of truth: focused segment or path
                const hasFocusedSegment = focusedSegmentIndices.length > 0 && path.multiPathPoints;
                const segmentIndex = hasFocusedSegment ? focusedSegmentIndices[0] : -1;

                const targetStrokeColor = (hasFocusedSegment ? path.segmentColors?.[segmentIndex] : undefined) || path.color || '#22d3ee';
                const targetFillColor = (hasFocusedSegment ? path.segmentFills?.[segmentIndex] : undefined) || path.fill || 'none';
                const targetStrokeWidth = (hasFocusedSegment ? path.segmentWidths?.[segmentIndex] : undefined) ?? path.width ?? 2;
                const targetTension = (hasFocusedSegment ? path.segmentTensions?.[segmentIndex] : undefined) ?? path.tension ?? 0.5;
                const targetIsClosed = (hasFocusedSegment ? path.segmentClosed?.[segmentIndex] : undefined) ?? path.closed ?? false;
                const targetStrokeOpacity = path.strokeOpacity ?? 1;
                const targetFillOpacity = path.fillOpacity ?? 1;
                const targetFontFamily = path.fontFamily || 'Inter, system-ui, sans-serif';
                const targetFilter = (hasFocusedSegment ? path.segmentFilters?.[segmentIndex] : undefined) || path.filter || 'none';

                setStrokeColor(prev => prev !== targetStrokeColor ? targetStrokeColor : prev);
                setFillColor(prev => prev !== targetFillColor ? targetFillColor : prev);
                setStrokeWidth(prev => prev !== targetStrokeWidth ? targetStrokeWidth : prev);
                setTension(prev => prev !== targetTension ? targetTension : prev);
                setIsClosed(prev => prev !== targetIsClosed ? targetIsClosed : prev);
                setStrokeOpacity(prev => prev !== targetStrokeOpacity ? targetStrokeOpacity : prev);
                setFillOpacity(prev => prev !== targetFillOpacity ? targetFillOpacity : prev);
                setFontFamily(prev => prev !== targetFontFamily ? targetFontFamily : prev);
                setFilter(prev => prev !== targetFilter ? targetFilter : prev);

                // Handle animation: for multi-select, check if all selected paths have the same animation
                let targetAnimation: AnimationSettings;
                if (selectedPathIds.length > 1) {
                    // Multi-select: check if all animations are identical
                    const allAnimations = selectedPathIds.map(id => {
                        const p = paths.find(x => x.id === id);
                        return (hasFocusedSegment && p?.multiPathPoints ? p.segmentAnimations?.[segmentIndex] : undefined) || p?.animation || { entries: [] };
                    });
                    
                    const firstAnim = JSON.stringify(allAnimations[0]);
                    const allSame = allAnimations.every(anim => JSON.stringify(anim) === firstAnim);
                    
                    // If animations differ, use empty state to prevent accidental overwrite
                    targetAnimation = allSame ? allAnimations[0] : { entries: [] };
                } else {
                    // Single select: use the path's animation
                    targetAnimation = (hasFocusedSegment ? path.segmentAnimations?.[segmentIndex] : undefined) || path.animation || {
                        entries: []
                    };
                }

                setAnimation(prev => {
                    const s1 = JSON.stringify(prev);
                    const s2 = JSON.stringify(targetAnimation);
                    return s1 !== s2 ? targetAnimation : prev;
                });
            }
        }
    }, [selectedPathIds, mode, paths, focusedSegmentIndices]);

    // 2. Helper to update selected path property
    const updateSelectedPathProperty = useCallback((updater: (path: PathLayer) => PathLayer, commit: boolean = true) => {
        if (mode === 'edit' && selectedPathIds.length > 0) {
            const updateType = commit ? setPaths : setInternalState;
            updateType(prev => prev.map(p => selectedPathIds.includes(p.id) ? updater(p) : p));
        }
    }, [mode, selectedPathIds, setPaths, setInternalState]);

    const deleteSelectedPath = useCallback(() => {
        if (selectedPathIds.length > 0) {
            setPaths(prev => prev.filter(p => !selectedPathIds.includes(p.id)));
            setSelectedPathIds([]);
        }
    }, [selectedPathIds, setPaths]);

    const duplicateSelectedPath = useCallback(() => {
        if (selectedPathIds.length > 0) {
            const newPaths: PathLayer[] = [];
            const newIds: string[] = [];

            selectedPathIds.forEach(id => {
                const path = paths.find(p => p.id === id);
                if (path) {
                    const newPath: PathLayer = {
                        ...path,
                        id: `path-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                        points: path.points.map(pt => ({ x: pt.x + 20, y: pt.y + 20 })),
                        // Sync offset for multiPathPoints (merged layers)
                        multiPathPoints: path.multiPathPoints
                            ? path.multiPathPoints.map(seg => seg.map(pt => ({ x: pt.x + 20, y: pt.y + 20 })))
                            : undefined,
                        // Sync offset for imported SVGs that use d + importedOffset for rendering
                        importedOffsetX: path.importedOffsetX !== undefined
                            ? path.importedOffsetX + 20
                            : undefined,
                        importedOffsetY: path.importedOffsetY !== undefined
                            ? path.importedOffsetY + 20
                            : undefined,
                    };
                    newPaths.push(newPath);
                    newIds.push(newPath.id);
                }
            });

            if (newPaths.length > 0) {
                setPaths(prev => [...prev, ...newPaths]);
                setSelectedPathIds(newIds);
            }
        }
    }, [selectedPathIds, paths, setPaths]);

    const moveSelectedUp = useCallback(() => {
        if (selectedPathIds.length === 0) return;
        setPaths(prev => {
            const newPaths = [...prev];
            // Sort selected indices descending to avoid shifting issues
            const indices = selectedPathIds
                .map(id => newPaths.findIndex(p => p.id === id))
                .filter(idx => idx !== -1)
                .sort((a, b) => b - a);

            indices.forEach(idx => {
                if (idx < newPaths.length - 1) {
                    [newPaths[idx], newPaths[idx + 1]] = [newPaths[idx + 1], newPaths[idx]];
                }
            });
            return newPaths;
        });
    }, [selectedPathIds, setPaths]);

    const moveSelectedDown = useCallback(() => {
        if (selectedPathIds.length === 0) return;
        setPaths(prev => {
            const newPaths = [...prev];
            // Sort selected indices ascending
            const indices = selectedPathIds
                .map(id => newPaths.findIndex(p => p.id === id))
                .filter(idx => idx !== -1)
                .sort((a, b) => a - b);

            indices.forEach(idx => {
                if (idx > 0) {
                    [newPaths[idx], newPaths[idx - 1]] = [newPaths[idx - 1], newPaths[idx]];
                }
            });
            return newPaths;
        });
    }, [selectedPathIds, setPaths]);

    const moveSelectedToTop = useCallback(() => {
        if (selectedPathIds.length === 0) return;
        setPaths(prev => {
            const selectedPaths = prev.filter(p => selectedPathIds.includes(p.id));
            const otherPaths = prev.filter(p => !selectedPathIds.includes(p.id));
            return [...otherPaths, ...selectedPaths];
        });
    }, [selectedPathIds, setPaths]);

    const moveSelectedToBottom = useCallback(() => {
        if (selectedPathIds.length === 0) return;
        setPaths(prev => {
            const selectedPaths = prev.filter(p => selectedPathIds.includes(p.id));
            const otherPaths = prev.filter(p => !selectedPathIds.includes(p.id));
            return [...selectedPaths, ...otherPaths];
        });
    }, [selectedPathIds, setPaths]);

    const mergeSelected = useCallback(() => {
        const selectedPaths = paths.filter(p => selectedPathIds.includes(p.id) && p.type !== 'text');
        if (selectedPaths.length <= 1) return;

        // Keep the order as they appear in the paths array
        const sortedSelected = paths.filter(p => selectedPathIds.includes(p.id) && p.type !== 'text');
        const first = sortedSelected[0];
        const mergedSegments = sortedSelected.flatMap(p => p.multiPathPoints || [p.points]);

        // Aggregate segment styles
        const segmentColors = sortedSelected.flatMap(p =>
            p.segmentColors || (p.multiPathPoints ? Array(p.multiPathPoints.length).fill(p.color) : [p.color])
        );
        const segmentFills = sortedSelected.flatMap(p =>
            p.segmentFills || (p.multiPathPoints ? Array(p.multiPathPoints.length).fill(p.fill) : [p.fill])
        );
        const segmentWidths = sortedSelected.flatMap(p =>
            p.segmentWidths || (p.multiPathPoints ? Array(p.multiPathPoints.length).fill(p.width) : [p.width])
        );
        // Each sub-path retains its own animation; the whole-layer animation is reset on merge.
        const emptyAnim: AnimationSettings = { entries: [] };
        const segmentAnimations = sortedSelected.flatMap(p =>
            p.segmentAnimations || (p.multiPathPoints
                ? Array(p.multiPathPoints.length).fill(p.animation || emptyAnim)
                : [p.animation || emptyAnim])
        );

        const segmentClosed = sortedSelected.flatMap(p =>
            p.segmentClosed || (p.multiPathPoints ? Array(p.multiPathPoints.length).fill(p.closed) : [p.closed])
        );
        const segmentTensions = sortedSelected.flatMap(p =>
            p.segmentTensions || (p.multiPathPoints ? Array(p.multiPathPoints.length).fill(p.tension) : [p.tension])
        );
        const segmentGroupings = sortedSelected.flatMap(p =>
            p.segmentGroupings || (p.multiPathPoints ? [p.multiPathPoints.length] : [1])
        );

        // Carry over per-segment keyframe animations from individual layers
        const segmentKeyframes = sortedSelected.flatMap(p => {
            if (p.multiPathPoints) {
                return p.segmentKeyframes || p.multiPathPoints.map(() => undefined);
            }
            return [p.keyframes && p.keyframes.length > 0 ? p.keyframes : undefined];
        });

        // Carry over per-segment transforms from individual layers
        const segmentTransforms = sortedSelected.flatMap(p => {
            if (p.multiPathPoints) {
                return p.segmentTransforms || p.multiPathPoints.map(() => undefined);
            }
            // Always return the transform to preserve px/py (pivot point) and other states
            return [p.transform || { x: 0, y: 0, rotation: 0, scale: 1 }];
        });

        const segmentFilters = sortedSelected.flatMap(p =>
            p.segmentFilters || (p.multiPathPoints ? Array(p.multiPathPoints.length).fill(p.filter || 'none') : [p.filter || 'none'])
        );
        const segmentInteractive = sortedSelected.flatMap(p =>
            p.segmentInteractive || (p.multiPathPoints ? Array(p.multiPathPoints.length).fill(p.interactive || false) : [p.interactive || false])
        );

        const mergedPath: PathLayer = {
            ...first,
            id: `merged-${Date.now()}`,
            name: 'Merged Layers',
            points: mergedSegments.flat(),
            multiPathPoints: mergedSegments,
            d: undefined,
            segmentColors,
            segmentFills,
            segmentWidths,
            segmentAnimations,
            segmentClosed,
            segmentTensions,
            segmentGroupings,
            segmentKeyframes,
            segmentTransforms,
            segmentFilters,
            segmentInteractive,
            // Reset whole-layer animation on merge — sub-paths keep their own via segmentAnimations
            animation: { entries: [] } as AnimationSettings,
            keyframes: [],
            transform: { x: 0, y: 0, rotation: 0, scale: 1 },
        };

        // Remove old paths and insert the merged one at the position of the first selected path
        const firstIdx = paths.findIndex(p => p.id === first.id);
        const filteredPaths = paths.filter(p => !selectedPathIds.includes(p.id) || p.type === 'text');

        const newPaths = [...filteredPaths];
        newPaths.splice(firstIdx, 0, mergedPath);

        setPaths(newPaths);
        setSelectedPathIds([mergedPath.id]);
    }, [selectedPathIds, paths, setPaths]);

    const splitSelected = useCallback(() => {
        if (selectedPathIds.length === 0) return;

        setPaths(prev => {
            const newPaths: PathLayer[] = [];
            let splitOccurred = false;

            prev.forEach(p => {
                if (selectedPathIds.includes(p.id) && p.multiPathPoints && p.multiPathPoints.length > 1) {
                    splitOccurred = true;
                    const groupings = p.segmentGroupings || p.multiPathPoints.map(() => 1);
                    let sIdx = 0;

                    groupings.forEach((count, gIdx) => {
                        const segs = p.multiPathPoints!.slice(sIdx, sIdx + count);
                        const cArr = p.segmentColors?.slice(sIdx, sIdx + count);
                        const fArr = p.segmentFills?.slice(sIdx, sIdx + count);
                        const wArr = p.segmentWidths?.slice(sIdx, sIdx + count);
                        const aArr = p.segmentAnimations?.slice(sIdx, sIdx + count);
                        const clArr = p.segmentClosed?.slice(sIdx, sIdx + count);
                        const tArr = p.segmentTensions?.slice(sIdx, sIdx + count);
                        const stArr = p.segmentTransforms?.slice(sIdx, sIdx + count);
                        const skArr = p.segmentKeyframes?.slice(sIdx, sIdx + count);
                        const flArr = p.segmentFilters?.slice(sIdx, sIdx + count);
                        const iArr = p.segmentInteractive?.slice(sIdx, sIdx + count);

                        newPaths.push({
                            ...p,
                            id: `split-${p.id}-${gIdx}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                            name: `${p.name} (Part ${gIdx + 1})`,
                            points: segs[0],
                            multiPathPoints: count > 1 ? segs : undefined,
                            segmentColors: count > 1 ? cArr : undefined,
                            segmentFills: count > 1 ? fArr : undefined,
                            segmentWidths: count > 1 ? wArr : undefined,
                            segmentAnimations: count > 1 ? aArr : undefined,
                            segmentClosed: count > 1 ? clArr : undefined,
                            segmentTensions: count > 1 ? tArr : undefined,
                            segmentGroupings: undefined,
                            d: undefined,
                            color: cArr?.[0] ?? p.color,
                            fill: fArr?.[0] ?? p.fill,
                            width: wArr?.[0] ?? p.width,
                            animation: aArr?.[0] ?? p.animation,
                            closed: clArr?.[0] ?? p.closed,
                            tension: tArr?.[0] ?? p.tension,
                            transform: (count === 1 && stArr?.[0]) ? stArr[0] : p.transform,
                            keyframes: (count === 1 && skArr?.[0]) ? skArr[0] : p.keyframes,
                            segmentTransforms: count > 1 ? stArr : undefined,
                            segmentKeyframes: count > 1 ? skArr : undefined,
                            segmentFilters: count > 1 ? flArr : undefined,
                            segmentInteractive: count > 1 ? iArr : undefined,
                            filter: flArr?.[0] ?? p.filter,
                            interactive: iArr?.[0] ?? p.interactive
                        });

                        sIdx += count;
                    });
                } else {
                    newPaths.push(p);
                }
            });

            return splitOccurred ? newPaths : prev;
        });
    }, [selectedPathIds, setPaths]);

    const setStrokeColorEnhanced = useCallback((color: string, commit: boolean = true) => {
        setIsInteracting(!commit);
        setStrokeColor(color);
        updateSelectedPathProperty(p => {
            if (p.multiPathPoints) {
                const newSegmentColors = (p.segmentColors || []).map((c, i) =>
                    (focusedSegmentIndices.length === 0 || focusedSegmentIndices.includes(i)) ? color : c
                );
                // Ensure array is full length
                while (newSegmentColors.length < p.multiPathPoints.length) {
                    newSegmentColors.push(focusedSegmentIndices.length === 0 ? color : p.color);
                }
                return { ...p, color, segmentColors: newSegmentColors };
            }
            return { ...p, color };
        }, commit);
    }, [updateSelectedPathProperty, focusedSegmentIndices]);

    const setFillColorEnhanced = useCallback((fill: string, commit: boolean = true) => {
        setIsInteracting(!commit);
        setFillColor(fill);
        updateSelectedPathProperty(p => {
            if (p.multiPathPoints) {
                const newSegmentFills = (p.segmentFills || []).map((f, i) =>
                    (focusedSegmentIndices.length === 0 || focusedSegmentIndices.includes(i)) ? fill : f
                );
                while (newSegmentFills.length < p.multiPathPoints.length) {
                    newSegmentFills.push(focusedSegmentIndices.length === 0 ? fill : p.fill);
                }
                return { ...p, fill, segmentFills: newSegmentFills };
            }
            return { ...p, fill };
        }, commit);
    }, [updateSelectedPathProperty, focusedSegmentIndices]);

    const setStrokeWidthEnhanced = useCallback((width: number, commit: boolean = true) => {
        setIsInteracting(!commit);
        setStrokeWidth(width);
        updateSelectedPathProperty(p => {
            if (p.multiPathPoints) {
                const newSegmentWidths = (p.segmentWidths || []).map((w, i) =>
                    (focusedSegmentIndices.length === 0 || focusedSegmentIndices.includes(i)) ? width : w
                );
                while (newSegmentWidths.length < p.multiPathPoints.length) {
                    newSegmentWidths.push(focusedSegmentIndices.length === 0 ? width : p.width);
                }
                return { ...p, width, segmentWidths: newSegmentWidths };
            }
            return { ...p, width };
        }, commit);
    }, [updateSelectedPathProperty, focusedSegmentIndices]);

    const setTensionEnhanced = useCallback((t: number, commit: boolean = true) => {
        setIsInteracting(!commit);
        setTension(t);
        updateSelectedPathProperty(p => {
            if (p.multiPathPoints) {
                const newSegmentTensions = (p.segmentTensions || []).map((v, i) =>
                    (focusedSegmentIndices.length === 0 || focusedSegmentIndices.includes(i)) ? t : v
                );
                while (newSegmentTensions.length < p.multiPathPoints.length) {
                    newSegmentTensions.push(focusedSegmentIndices.length === 0 ? t : (p.tension ?? 0.5));
                }
                return { ...p, tension: t, segmentTensions: newSegmentTensions, d: undefined };
            }
            return { ...p, tension: t, d: undefined };
        }, commit);
    }, [updateSelectedPathProperty, focusedSegmentIndices]);

    const setIsClosedEnhanced = useCallback((closed: boolean, commit: boolean = true) => {
        setIsInteracting(!commit);
        setIsClosed(closed);
        updateSelectedPathProperty(p => {
            if (p.multiPathPoints) {
                const newSegmentClosed = (p.segmentClosed || []).map((v, i) =>
                    (focusedSegmentIndices.length === 0 || focusedSegmentIndices.includes(i)) ? closed : v
                );
                while (newSegmentClosed.length < p.multiPathPoints.length) {
                    newSegmentClosed.push(focusedSegmentIndices.length === 0 ? closed : (p.closed ?? false));
                }
                return { ...p, closed, segmentClosed: newSegmentClosed, d: undefined };
            }
            return { ...p, closed, d: undefined };
        }, commit);
    }, [updateSelectedPathProperty, focusedSegmentIndices]);

    const setStrokeOpacityEnhanced = useCallback((opacity: number, commit: boolean = true) => {
        setIsInteracting(!commit);
        setStrokeOpacity(opacity);
        updateSelectedPathProperty(p => ({ ...p, strokeOpacity: opacity }), commit);
    }, [updateSelectedPathProperty]);

    const setFillOpacityEnhanced = useCallback((opacity: number, commit: boolean = true) => {
        setIsInteracting(!commit);
        setFillOpacity(opacity);
        updateSelectedPathProperty(p => ({ ...p, fillOpacity: opacity }), commit);
    }, [updateSelectedPathProperty]);

    const setFilterEnhanced = useCallback((f: string, commit: boolean = true) => {
        setIsInteracting(!commit);
        setFilter(f);
        updateSelectedPathProperty(p => {
            if (p.multiPathPoints) {
                const newSegmentFilters = (p.segmentFilters || []).map((v, i) =>
                    (focusedSegmentIndices.length === 0 || focusedSegmentIndices.includes(i)) ? f : v
                );
                while (newSegmentFilters.length < p.multiPathPoints.length) {
                    newSegmentFilters.push(focusedSegmentIndices.length === 0 ? f : (p.filter || 'none'));
                }
                return { ...p, filter: f, segmentFilters: newSegmentFilters };
            }
            return { ...p, filter: f };
        }, commit);
    }, [updateSelectedPathProperty, focusedSegmentIndices]);

    const setInteractiveEnhanced = useCallback((val: boolean, commit: boolean = true) => {
        setIsInteracting(!commit);
        setInteractive(val);
        updateSelectedPathProperty(p => {
            if (p.multiPathPoints) {
                const newSegmentInteractive = (p.segmentInteractive || []).map((v, i) =>
                    (focusedSegmentIndices.length === 0 || focusedSegmentIndices.includes(i)) ? val : v
                );
                while (newSegmentInteractive.length < p.multiPathPoints.length) {
                    newSegmentInteractive.push(focusedSegmentIndices.length === 0 ? val : (p.interactive || false));
                }
                return { ...p, interactive: val, segmentInteractive: newSegmentInteractive };
            }
            return { ...p, interactive: val };
        }, commit);
    }, [updateSelectedPathProperty, focusedSegmentIndices]);

    const setFontFamilyEnhanced = useCallback((font: string, commit: boolean = true) => {
        setIsInteracting(!commit);
        setFontFamily(font);
        updateSelectedPathProperty(p => ({ ...p, fontFamily: font }), commit);
    }, [updateSelectedPathProperty]);

    const setAnimationEnhanced = useCallback((anim: AnimationSettings, commit: boolean = true) => {
        setIsInteracting(!commit);
        setAnimation(anim);
        
        // For multi-select with different animations, merge new entries instead of replacing
        if (selectedPathIds.length > 1 && commit) {
            // Check if all selected paths have the same animation
            const allAnimations = selectedPathIds.map(id => {
                const path = paths.find(x => x.id === id);
                return path?.animation || { entries: [] };
            });
            
            const firstAnim = JSON.stringify(allAnimations[0]);
            const allSame = allAnimations.every(a => JSON.stringify(a) === firstAnim);
            
            // If animations differ, merge new entries with existing ones for each path
            if (!allSame) {
                setPaths(prev => prev.map(p => {
                    if (!selectedPathIds.includes(p.id)) return p;
                    
                    const defaultAnim: AnimationSettings = { entries: [] };
                    const currentAnim = p.animation || { entries: [] };
                    const mergedAnim = {
                        ...anim,
                        entries: [...(currentAnim.entries || []), ...(anim.entries || [])]
                    };
                    
                    if (p.multiPathPoints) {
                        if (focusedSegmentIndices.length > 0) {
                            const newSegmentAnimations = [...(p.segmentAnimations || p.multiPathPoints.map(() => defaultAnim))];
                            while (newSegmentAnimations.length < p.multiPathPoints.length) {
                                newSegmentAnimations.push(defaultAnim);
                            }
                            focusedSegmentIndices.forEach(idx => {
                                if (idx < newSegmentAnimations.length) {
                                    newSegmentAnimations[idx] = mergedAnim;
                                }
                            });
                            return { ...p, segmentAnimations: newSegmentAnimations };
                        } else {
                            return { ...p, animation: mergedAnim };
                        }
                    }
                    return { ...p, animation: mergedAnim };
                }));
                return;
            }
        }
        
        // Normal case: all animations are the same or single select
        updateSelectedPathProperty(p => {
            const defaultAnim: AnimationSettings = { entries: [] };
            
            if (p.multiPathPoints) {
                if (focusedSegmentIndices.length > 0) {
                    // Focus mode: only update the focused segments' animations
                    const newSegmentAnimations = [...(p.segmentAnimations || p.multiPathPoints.map(() => defaultAnim))];
                    while (newSegmentAnimations.length < p.multiPathPoints.length) {
                        newSegmentAnimations.push(defaultAnim);
                    }
                    focusedSegmentIndices.forEach(idx => {
                        if (idx < newSegmentAnimations.length) {
                            newSegmentAnimations[idx] = anim;
                        }
                    });
                    return { ...p, segmentAnimations: newSegmentAnimations };
                } else {
                    // Whole-layer mode: only set global animation, preserve segment animations
                    return { ...p, animation: anim };
                }
            }
            return { ...p, animation: anim };
        }, commit);
    }, [updateSelectedPathProperty, focusedSegmentIndices, selectedPathIds, paths, setPaths]);




    const toggleSymmetry = useCallback((key: keyof SymmetrySettings) => {
        setSymmetry(prev => ({ ...prev, [key]: !prev[key] }));
    }, []);

    const getPointFromEvent = useCallback((e: React.MouseEvent | React.TouchEvent): Point | null => {
        if (!canvasRef.current) return null;
        const rect = canvasRef.current.getBoundingClientRect();

        let clientX, clientY;
        if ('touches' in e) {
            if (e.touches.length === 0) return null;
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        let x = clientX - rect.left;
        let y = clientY - rect.top;

        // Apply inverse transform to map screen coordinates to "SVG space"
        x = (x - panOffset.x) / zoom;
        y = (y - panOffset.y) / zoom;

        // Only snap if not transforming
        if (transformMode === 'none' && draggingPointIndex === null) {
            const SNAP_THRESHOLD = 10;
            const SNAP_THRESHOLD_SQ = SNAP_THRESHOLD * SNAP_THRESHOLD;

            let closestDistSq = SNAP_THRESHOLD_SQ;
            let snapX = x;
            let snapY = y;
            let hasSnappedToPoint = false;

            if (pointSnappingEnabled) {
                // Iterate over all paths
                for (const path of paths) {
                    const pointsToCheck = path.id.startsWith('brush-')
                        ? [path.points[0], path.points[path.points.length - 1]]
                        : path.points;

                    for (const p of pointsToCheck) {
                        if (!p) continue;
                        const dx = x - p.x;
                        const dy = y - p.y;
                        const distSq = dx * dx + dy * dy;
                        if (distSq < closestDistSq) {
                            closestDistSq = distSq;
                            snapX = p.x;
                            snapY = p.y;
                            hasSnappedToPoint = true;
                        }
                    }
                }

                if (mode === 'draw' && activeTool === 'pen') {
                    for (const p of currentPoints) {
                        const dx = x - p.x;
                        const dy = y - p.y;
                        const distSq = dx * dx + dy * dy;
                        if (distSq < closestDistSq) {
                            closestDistSq = distSq;
                            snapX = p.x;
                            snapY = p.y;
                            hasSnappedToPoint = true;
                        }
                    }
                }
            }

            if (hasSnappedToPoint) {
                return { x: snapX, y: snapY };
            }

            if (guideSnappingEnabled) {
                const centerX = rect.width / (2 * zoom);
                const centerY = rect.height / (2 * zoom);
                if (symmetry.horizontal && Math.abs(x - centerX) < SNAP_THRESHOLD) x = centerX;
                if (symmetry.vertical && Math.abs(y - centerY) < SNAP_THRESHOLD) y = centerY;
                if (symmetry.center) {
                    if (Math.abs(x - centerX) < SNAP_THRESHOLD) x = centerX;
                    if (Math.abs(y - centerY) < SNAP_THRESHOLD) y = centerY;
                }
            }
        }

        return { x, y };
    }, [symmetry, paths, currentPoints, mode, transformMode, draggingPointIndex, pointSnappingEnabled, guideSnappingEnabled, panOffset, zoom]);

    const handlePointerDown = useCallback((e: React.MouseEvent) => {
        // Pan with space bar or middle mouse button
        if (isSpacePressed || e.button === 1) {
            setTransformMode('translate');
            setInitialMousePos({ x: e.clientX, y: e.clientY });
            setTransformHandle('pan');
            return;
        }

        if (e.button !== 0) return;

        const target = e.target as HTMLElement;
        const handleType = target.dataset.handle;

        if (handleType && selectedPathIds.length > 0) {
            const selectedPaths = paths.filter(p => selectedPathIds.includes(p.id));
            if (selectedPaths.length > 0) {
                // For multiple paths, calculate collective bounding box of TRANSFORMED points
                const allPoints = selectedPaths.flatMap(p => {
                    let effectiveTransform = p.transform || { x: 0, y: 0, rotation: 0, scale: 1 };
                    if (isAnimationMode && p.keyframes && p.keyframes.length > 0) {
                        const interpolated = interpolateTransform(p.keyframes, currentTime);
                        if (interpolated) effectiveTransform = interpolated;
                    }

                    // If focused on segment(s), apply segment-level transform too
                    let segTransform: Transform | undefined = undefined;
                    if (selectedPaths.length === 1 && focusedSegmentIndices.length > 0 && p.multiPathPoints) {
                        const idx = focusedSegmentIndices[0];
                        segTransform = p.segmentTransforms?.[idx] || { x: 0, y: 0, rotation: 0, scale: 1 };
                        if (isAnimationMode && p.segmentKeyframes?.[idx] && p.segmentKeyframes[idx]!.length > 0) {
                            const interpolated = interpolateTransform(p.segmentKeyframes[idx]!, currentTime);
                            if (interpolated) segTransform = interpolated;
                        }
                    }

                    let points = p.points;
                    if (selectedPaths.length === 1 && focusedSegmentIndices.length > 0 && p.multiPathPoints) {
                        points = focusedSegmentIndices.flatMap(idx => p.multiPathPoints![idx] || []);
                    }

                    return points.map(pt => {
                        let x = pt.x + effectiveTransform.x;
                        let y = pt.y + effectiveTransform.y;
                        if (segTransform) {
                            x += segTransform.x;
                            y += segTransform.y;
                        }
                        return { x, y };
                    });
                });
                const box = getBoundingBox(allPoints);

                // Calculate visual pivot accounting for px/py
                let px = 0;
                let py = 0;
                if (selectedPaths.length === 1) {
                    const p = selectedPaths[0];
                    let effectiveTransform = p.transform || { x: 0, y: 0, rotation: 0, scale: 1 };
                    if (isAnimationMode && p.keyframes && p.keyframes.length > 0) {
                        const interpolated = interpolateTransform(p.keyframes, currentTime);
                        if (interpolated) effectiveTransform = interpolated;
                    }
                    px = effectiveTransform.px || 0;
                    py = effectiveTransform.py || 0;

                    if (focusedSegmentIndices.length > 0 && p.multiPathPoints) {
                        const idx = focusedSegmentIndices[0];
                        let segT = p.segmentTransforms?.[idx] || { x: 0, y: 0, rotation: 0, scale: 1 };
                        if (isAnimationMode && p.segmentKeyframes?.[idx] && p.segmentKeyframes[idx]!.length > 0) {
                            const interpolated = interpolateTransform(p.segmentKeyframes[idx]!, currentTime);
                            if (interpolated) segT = interpolated;
                        }
                        px = segT.px || 0;
                        py = segT.py || 0;
                    }
                }

                const pivot = { x: box.centerX + px, y: box.centerY + py };
                const rect = canvasRef.current!.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                const svgPt = getPointFromEvent(e) || { x: mouseX, y: mouseY };
                const svgX = svgPt.x;
                const svgY = svgPt.y;

                setTransformPivot(pivot);
                setTransformHandle(handleType);

                // Capture initial transforms for animation
                const initialMap = new Map<string, Transform>();
                const initialSegMap = new Map<number, Transform>();

                selectedPaths.forEach(p => {
                    let startTransform = p.transform || { x: 0, y: 0, rotation: 0, scale: 1 };
                    if (isAnimationMode && p.keyframes && p.keyframes.length > 0) {
                        const interpolated = interpolateTransform(p.keyframes, currentTime);
                        if (interpolated) startTransform = interpolated;
                    }
                    initialMap.set(p.id, { ...startTransform });

                    // If we're in focus mode for a single merged layer, capture its segment transforms
                    if (focusedSegmentIndices.length > 0 && p.multiPathPoints && selectedPaths.length === 1) {
                        focusedSegmentIndices.forEach(idx => {
                            let segTransform = p.segmentTransforms?.[idx] || { x: 0, y: 0, rotation: 0, scale: 1 };
                            if (isAnimationMode && p.segmentKeyframes?.[idx] && p.segmentKeyframes[idx]!.length > 0) {
                                const interpolated = interpolateTransform(p.segmentKeyframes[idx]!, currentTime);
                                if (interpolated) segTransform = interpolated;
                            }
                            initialSegMap.set(idx, { ...segTransform });
                        });
                    }
                });
                initialTransformsRef.current = initialMap;
                initialSegmentTransformsRef.current = initialSegMap;

                // Text specific initial states (use first selected if multiple?)
                const firstText = selectedPaths.find(p => p.type === 'text');
                if (firstText) {
                    setInitialFontSize(firstText.fontSize || 40);
                    setInitialRotation(firstText.rotation || 0);
                }

                if (handleType === 'rotate') {
                    setTransformMode('rotate');
                    const startAngle = Math.atan2(svgY - pivot.y, svgX - pivot.x);
                    setInitialAngle(startAngle);
                    setRotationStartAngle(startAngle);
                    setCurrentRotationDelta(0);
                } else if (handleType === 'pivot') {
                    setTransformMode('pivot');
                } else {
                    setTransformMode('scale');
                    setInitialDist(Math.sqrt(Math.pow(svgX - pivot.x, 2) + Math.pow(svgY - pivot.y, 2)));
                }

                dragStartPathsRef.current = JSON.parse(JSON.stringify(paths));
                dragStartMousePosRef.current = { x: mouseX, y: mouseY };
                setInitialMousePos({ x: mouseX, y: mouseY });

                // IMPORTANT: Synchronize all selected points for transformation
                setInitialPoints(null); // We don't use a single initialPoints for multi-transform anymore
                // We'll need a way to store ALL initial points. Let's use a temporary state or just capture them in the update logic.
                // For simplicity, let's keep initialPoints for the "primary" or first path, but for multi, we'll map them all.
                // Actually, let's keep it simple: we'll use the current paths state as the base during dragging.

                isDraggingRef.current = false;
                setDraggingPointIndex(null);
                return;
            }
        }

        const point = getPointFromEvent(e);
        if (!point) return;

        if (activeTool === 'image') {
            const rect = canvasRef.current!.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const pivot = { x: 400 + bgTransform.x, y: 300 + bgTransform.y };

            setTransformPivot(pivot);
            setInitialMousePos({ x, y });
            setInitialRotation(bgTransform.rotation);
            setInitialDist(Math.sqrt(Math.pow(x - pivot.x, 2) + Math.pow(y - pivot.y, 2)));
            setInitialAngle(Math.atan2(y - pivot.y, x - pivot.x));

            if (e.shiftKey) setTransformMode('rotate');
            else if (e.altKey) setTransformMode('scale');
            else setTransformMode('translate');

            isDraggingRef.current = true;
            return;
        }

        if (mode === 'draw') {
            if (activeTool === 'brush') {
                isDrawingBrushRef.current = true;
                setCurrentPoints([point]);
            } else if (activeTool === 'pen') {
                setCurrentPoints(prev => [...prev, point]);
            } else {
                setShapeStartPoint(point);
                setCurrentPoints([point, point]);
            }
        } else if (mode === 'edit') {
            const rect = canvasRef.current!.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const pathId = target.dataset.pathId || (['path', 'text'].includes(target.tagName.toLowerCase()) ? (target as any).dataset.pathId : null);


            // 1. Handle individual point dragging (Vertex Edit Mode)
            if (isVertexEditEnabled && selectedPathIds.length === 1) {
                const path = paths.find(p => p.id === selectedPathIds[0]);
                if (path && !path.locked) {
                    const HIT_RADIUS = 12;

                    // Calculate effective transform for inverse mapping
                    let effectiveTransform = path.transform || { x: 0, y: 0, rotation: 0, scale: 1 };
                    if (isAnimationMode && path.keyframes && path.keyframes.length > 0) {
                        const interpolated = interpolateTransform(path.keyframes, currentTime);
                        if (interpolated) effectiveTransform = interpolated;
                    }

                    const inverseTransformPoint = (pt: { x: number, y: number }, segIdx?: number) => {
                        const box = getBoundingBox(path.points);

                        // Layer-level center
                        let cx = box.centerX + (effectiveTransform.px || 0);
                        let cy = box.centerY + (effectiveTransform.py || 0);

                        // Undo Translate (Layer)
                        let lx = pt.x - effectiveTransform.x;
                        let ly = pt.y - effectiveTransform.y;

                        // Undo Rotate (Layer)
                        if (effectiveTransform.rotation) {
                            const rad = -effectiveTransform.rotation * Math.PI / 180;
                            const dx = lx - cx;
                            const dy = ly - cy;
                            lx = cx + dx * Math.cos(rad) - dy * Math.sin(rad);
                            ly = cy + dx * Math.sin(rad) + dy * Math.cos(rad);
                        }

                        // Undo Scale (Layer)
                        if (effectiveTransform.scale !== 1 || effectiveTransform.scaleX !== undefined || effectiveTransform.scaleY !== undefined) {
                            const sx = effectiveTransform.scaleX ?? effectiveTransform.scale ?? 1;
                            const sy = effectiveTransform.scaleY ?? effectiveTransform.scale ?? 1;
                            const dx = lx - cx;
                            const dy = ly - cy;
                            lx = cx + dx / sx;
                            ly = cy + dy / sy;
                        }

                        // If we have a segment index, also undo segment transform
                        if (segIdx !== undefined && path.multiPathPoints && path.segmentTransforms?.[segIdx]) {
                            // Note: Segment transforms are applied inside the group that has layer transform.
                            // So lx, ly is now in "pre-layer-transform" space but "post-segment-transform" space.

                            // For simplicity, we assume segment transforms are just translation for now in hit detection
                            // Or we could implement full inverse. Let's do a basic one.
                            let segT = path.segmentTransforms[segIdx]!;
                            if (isAnimationMode && path.segmentKeyframes?.[segIdx] && path.segmentKeyframes[segIdx]!.length > 0) {
                                const interpolated = interpolateTransform(path.segmentKeyframes[segIdx]!, currentTime);
                                if (interpolated) segT = interpolated;
                            }

                            // Segment-level pivot
                            const segBox = getBoundingBox(path.multiPathPoints[segIdx]!);
                            const scx = segBox.centerX + (segT.px || 0);
                            const scy = segBox.centerY + (segT.py || 0);

                            // Undo Translate (Seg)
                            lx -= segT.x;
                            ly -= segT.y;

                            // Undo Rotate (Seg)
                            if (segT.rotation) {
                                const rad = -segT.rotation * Math.PI / 180;
                                const dx = lx - scx;
                                const dy = ly - scy;
                                lx = scx + dx * Math.cos(rad) - dy * Math.sin(rad);
                                ly = scy + dx * Math.sin(rad) + dy * Math.cos(rad);
                            }

                            // Undo Scale (Seg)
                            const ssx = segT.scaleX ?? segT.scale ?? 1;
                            const ssy = segT.scaleY ?? segT.scale ?? 1;
                            if (ssx !== 1 || ssy !== 1) {
                                const dx = lx - scx;
                                const dy = ly - scy;
                                lx = scx + dx / ssx;
                                ly = scy + dy / ssy;
                            }
                        }

                        return { x: lx, y: ly };
                    };

                    let clickedPointIndex = -1;

                    if (path.multiPathPoints) {
                        // Check each segment with its specific transform
                        let pointOffset = 0;
                        for (let sIdx = 0; sIdx < path.multiPathPoints.length; sIdx++) {
                            const seg = path.multiPathPoints[sIdx];
                            const localMouse = inverseTransformPoint(point, sIdx);
                            const idx = seg.findIndex(pt => {
                                return Math.sqrt(Math.pow(pt.x - localMouse.x, 2) + Math.pow(pt.y - localMouse.y, 2)) <= (HIT_RADIUS / zoom);
                            });
                            if (idx !== -1) {
                                clickedPointIndex = pointOffset + idx;
                                break;
                            }
                            pointOffset += seg.length;
                        }
                    } else {
                        const localMouse = inverseTransformPoint(point);
                        clickedPointIndex = path.points.findIndex(pt => {
                            return Math.sqrt(Math.pow(pt.x - localMouse.x, 2) + Math.pow(pt.y - localMouse.y, 2)) <= (HIT_RADIUS / zoom);
                        });
                    }

                    if (clickedPointIndex !== -1) {
                        setDraggingPointIndex(clickedPointIndex);
                        isDraggingRef.current = false;
                        return;
                    }
                }
            }

            // 2. Lockdown single-select mode for merged layers
            if (focusedSegmentIndices.length > 0 && selectedPathIds.length === 1) {
                const currentId = selectedPathIds[0];
                if (handleType) {
                    // Allow handles (rotate, scale, etc.)
                } else if (pathId === currentId) {
                    // Allow interaction with same path
                } else {
                    // Block clicking away to other paths or background to prevent accidental exit
                    if (isSpacePressed) return; // Allow space-panning
                    return;
                }
            }

            const path = paths.find(p => p.id === pathId);
            if (path && !path.locked) {
                // Calculate effective transform for inverse mapping
                let effectiveTransform = path.transform || { x: 0, y: 0, rotation: 0, scale: 1 };
                if (isAnimationMode && path.keyframes && path.keyframes.length > 0) {
                    const interpolated = interpolateTransform(path.keyframes, currentTime);
                    if (interpolated) effectiveTransform = interpolated;
                }

                // Inverse Transform Logic to map Mouse -> Local Shape Space
                const inverseTransformPoint = (pt: { x: number, y: number }) => {
                    // 1. Get Bounding Box Center (Pivot) of ORIGINAL points
                    const box = getBoundingBox(path.points);
                    const cx = box.centerX + (effectiveTransform.px || 0);
                    const cy = box.centerY + (effectiveTransform.py || 0);

                    // 2. Undo Translate
                    let x = pt.x - effectiveTransform.x;
                    let y = pt.y - effectiveTransform.y;

                    // 3. Undo Rotate (rotate by -angle around center)
                    if (effectiveTransform.rotation) {
                        const rad = -effectiveTransform.rotation * Math.PI / 180;
                        const dx = x - cx;
                        const dy = y - cy;
                        x = cx + dx * Math.cos(rad) - dy * Math.sin(rad);
                        y = cy + dx * Math.sin(rad) + dy * Math.cos(rad);
                    }

                    // 4. Undo Scale (scale by 1/s around center)
                    // Note: Canvas.tsx uses scale(sx, sy) centered on bounding box
                    if (effectiveTransform.scale !== 1 || (effectiveTransform.scaleX !== undefined && effectiveTransform.scaleX !== undefined)) {
                        const sx = effectiveTransform.scaleX ?? effectiveTransform.scale ?? 1;
                        const sy = effectiveTransform.scaleY ?? effectiveTransform.scale ?? 1;
                        const dx = x - cx;
                        const dy = y - cy;
                        x = cx + dx / sx;
                        y = cy + dy / sy;
                    }
                    return { x, y };
                };

                const mouseSVG = { x: (mouseX - panOffset.x) / zoom, y: (mouseY - panOffset.y) / zoom };
                const localMouseSVG = inverseTransformPoint(mouseSVG);

                // 1. Detect clicked segment index first
                let bestSegIdx = -1;
                if (path.multiPathPoints) {
                    const target = e.target as HTMLElement;
                    // Support segment detection if vertex edit is on OR if we are already focused on this merged layer
                    const shouldDetectSegment = isVertexEditEnabled || (selectedPathIds.includes(pathId) && path.id.startsWith('merged-'));

                    if (shouldDetectSegment) {
                        const segmentIndexAttr = target.closest('[data-segment-index]')?.getAttribute('data-segment-index');
                        bestSegIdx = (segmentIndexAttr !== null && segmentIndexAttr !== undefined) ? parseInt(segmentIndexAttr) : -1;

                        if (bestSegIdx === -1) {
                            // Use localMouseSVG for hit detection against original points
                            let minSegDist = 15 / zoom;

                            path.multiPathPoints.forEach((seg, sIdx) => {
                                for (let i = 0; i < seg.length - 1; i++) {
                                    const d = distToSegment(localMouseSVG, seg[i], seg[i + 1]);
                                    if (d < minSegDist) { minSegDist = d; bestSegIdx = sIdx; }
                                }
                                if (path.closed && seg.length > 2) {
                                    const d = distToSegment(localMouseSVG, seg[seg.length - 1], seg[0]);
                                    if (d < minSegDist) { minSegDist = d; bestSegIdx = sIdx; }
                                }
                            });
                        }
                    }
                }

                const isCtrl = e.ctrlKey || e.metaKey;
                let nextFocusedIndices: number[] = [];
                let nextSelectedPathIds = [...selectedPathIds];

                if (bestSegIdx !== -1) {
                    let chunkIndices = [bestSegIdx];
                    if (path.segmentGroupings) {
                        let currentSIdx = 0;
                        for (const count of path.segmentGroupings) {
                            if (bestSegIdx >= currentSIdx && bestSegIdx < currentSIdx + count) {
                                chunkIndices = [];
                                for (let i = 0; i < count; i++) chunkIndices.push(currentSIdx + i);
                                break;
                            }
                            currentSIdx += count;
                        }
                    }

                    // Clicked on a sub-shape
                    if (isCtrl) {
                        if (!selectedPathIds.includes(pathId)) {
                            // If path not selected yet, select path and this segment
                            nextSelectedPathIds = [...selectedPathIds, pathId];
                            setSelectedPathIds(nextSelectedPathIds);
                            nextFocusedIndices = chunkIndices;
                            setFocusedSegmentIndices(nextFocusedIndices);
                        } else {
                            // Path already selected, toggle segment
                            if (focusedSegmentIndices.includes(bestSegIdx)) {
                                nextFocusedIndices = focusedSegmentIndices.filter(i => !chunkIndices.includes(i));
                            } else {
                                nextFocusedIndices = Array.from(new Set([...focusedSegmentIndices, ...chunkIndices]));
                            }
                            setFocusedSegmentIndices(nextFocusedIndices);
                        }
                    } else {
                        // Single select (or keep multi-select if clicking existing to allow drag)
                        if (!selectedPathIds.includes(pathId)) {
                            nextSelectedPathIds = [pathId];
                            setSelectedPathIds(nextSelectedPathIds);
                            // On first click of a merged layer, select the whole thing (clear segment focus)
                            nextFocusedIndices = [];
                        } else {
                            // Path is already in selection map. 
                            // If already in local mode (focusedSegmentIndices > 0), allow switching.
                            // Otherwise, keep it in whole-layer mode (empty indices).
                            if (focusedSegmentIndices.length > 0) {
                                nextFocusedIndices = chunkIndices;
                            } else {
                                nextFocusedIndices = [];
                            }
                        }
                        setFocusedSegmentIndices(nextFocusedIndices);
                    }
                } else {
                    // Clicked on path background (no sub-shape hit)
                    nextFocusedIndices = focusedSegmentIndices.length > 0 ? [...focusedSegmentIndices] : [];
                    if (isCtrl) {
                        nextSelectedPathIds = selectedPathIds.includes(pathId)
                            ? selectedPathIds.filter(id => id !== pathId)
                            : [...selectedPathIds, pathId];
                        setSelectedPathIds(nextSelectedPathIds);
                        // Only clear if not already focused or explicitly resetting
                        if (focusedSegmentIndices.length === 0) {
                            setFocusedSegmentIndices([]);
                        }
                    } else {
                        // Single select (or keep multi-select if clicking existing to allow drag)
                        if (!selectedPathIds.includes(pathId)) {
                            nextSelectedPathIds = [pathId];
                            setSelectedPathIds(nextSelectedPathIds);
                            if (focusedSegmentIndices.length === 0) {
                                setFocusedSegmentIndices([]);
                            }
                        } else {
                            // Already selected. Don't clear multi-selection!
                            // Only clear focused segment if it's clicking the background of the path cluster
                            if (focusedSegmentIndices.length === 0) {
                                setFocusedSegmentIndices([]);
                            }
                        }
                    }
                }

                // 2. Calculate Bounding Box (Pivot) using the NEXT state
                let pointsForBox: Point[] = [];
                if (path.multiPathPoints && nextFocusedIndices.length > 0) {
                    nextFocusedIndices.forEach(idx => {
                        if (path.multiPathPoints![idx]) pointsForBox.push(...path.multiPathPoints![idx]);
                    });
                } else {
                    pointsForBox = path.points;
                }

                const box = getBoundingBox(pointsForBox);

                // Calculate visual pivot accounting for px/py
                let px = effectiveTransform.px || 0;
                let py = effectiveTransform.py || 0;

                if (path.multiPathPoints && nextFocusedIndices.length > 0) {
                    const idx = nextFocusedIndices[0];
                    let segT = path.segmentTransforms?.[idx] || { x: 0, y: 0, rotation: 0, scale: 1 };
                    if (isAnimationMode && path.segmentKeyframes?.[idx] && path.segmentKeyframes[idx]!.length > 0) {
                        const interpolated = interpolateTransform(path.segmentKeyframes[idx]!, currentTime);
                        if (interpolated) segT = interpolated;
                    }
                    px = segT.px || 0;
                    py = segT.py || 0;
                }

                // Apply translation to pivot so rotation/scale happens around the visual center
                setTransformPivot({
                    x: box.centerX + effectiveTransform.x + px,
                    y: box.centerY + effectiveTransform.y + py
                });

                setTransformMode('translate');
                setInitialMousePos({ x: mouseX, y: mouseY });
                dragStartMousePosRef.current = { x: mouseX, y: mouseY };
                dragStartPathsRef.current = JSON.parse(JSON.stringify(paths));

                const initialMap = new Map<string, Transform>();
                const initialSegMap = new Map<number, Transform>();
                const pathsToMove = nextSelectedPathIds.length > 0 ? paths.filter(p => nextSelectedPathIds.includes(p.id)) : [path];
                pathsToMove.forEach(p => {
                    let startTransform = p.transform || { x: 0, y: 0, rotation: 0, scale: 1 };
                    if (isAnimationMode && p.keyframes && p.keyframes.length > 0) {
                        const interpolated = interpolateTransform(p.keyframes, currentTime);
                        if (interpolated) startTransform = interpolated;
                    }
                    initialMap.set(p.id, { ...startTransform });

                    // Capture segment transforms if in focus mode
                    if (nextFocusedIndices.length > 0 && p.multiPathPoints && pathsToMove.length === 1) {
                        nextFocusedIndices.forEach(idx => {
                            let segTransform = p.segmentTransforms?.[idx] || { x: 0, y: 0, rotation: 0, scale: 1 };
                            if (isAnimationMode && p.segmentKeyframes?.[idx] && p.segmentKeyframes[idx]!.length > 0) {
                                const interpolated = interpolateTransform(p.segmentKeyframes[idx]!, currentTime);
                                if (interpolated) segTransform = interpolated;
                            }
                            initialSegMap.set(idx, { ...segTransform });
                        });
                    }
                });
                initialTransformsRef.current = initialMap;
                initialSegmentTransformsRef.current = initialSegMap;


            } else {
                // If we didn't click a path, check if we clicked the background to deselect
                if (!pathId && !handleType) {
                    if (isSpacePressed) {
                        setSelectedPathIds([]);
                        setFocusedSegmentIndices([]);
                    } else {
                        setMarqueeStart(point);
                        setMarqueeEnd(point);
                        setIsInteracting(true);
                    }
                }
            }
            isDraggingRef.current = false;
        }
    }, [getPointFromEvent, mode, paths, selectedPathIds, getBoundingBox, activeTool, bgTransform, isSpacePressed, zoom, panOffset, focusedSegmentIndices, currentTime, isAnimationMode, isVertexEditEnabled]);

    const handlePointerMove = useCallback((e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // 1. Handle Canvas Panning
        if (transformMode === 'translate' && transformHandle === 'pan' && initialMousePos) {
            const dx_canvas = e.clientX - initialMousePos.x;
            const dy_canvas = e.clientY - initialMousePos.y;
            setPanOffset(prev => ({
                x: prev.x + dx_canvas,
                y: prev.y + dy_canvas
            }));
            setInitialMousePos({ x: e.clientX, y: e.clientY });
            return;
        }

        const point = getPointFromEvent(e);
        if (point) {
            setCursorPos(point);

            if (marqueeStart) {
                setMarqueeEnd(point);
                return;
            }

            // 2. Handle Image Background Transform
            if (activeTool === 'image' && isDraggingRef.current) {
                const pivot = transformPivot || { x: 400, y: 300 };

                if (transformMode === 'translate' && initialMousePos) {
                    const dx_i = mouseX - initialMousePos.x;
                    const dy_i = mouseY - initialMousePos.y;
                    setBgTransform(prev => ({ ...prev, x: prev.x + dx_i, y: prev.y + dy_i }));
                    setInitialMousePos({ x: mouseX, y: mouseY });
                } else if (transformMode === 'rotate') {
                    const currentAngle = Math.atan2(mouseY - pivot.y, mouseX - pivot.x);
                    const deltaAngle = (currentAngle - initialAngle) * (180 / Math.PI);
                    setBgTransform(prev => ({ ...prev, rotation: prev.rotation + deltaAngle }));
                    setInitialAngle(currentAngle);
                } else if (transformMode === 'scale') {
                    const currentDist = Math.sqrt(Math.pow(mouseX - pivot.x, 2) + Math.pow(mouseY - pivot.y, 2));
                    const factor = currentDist / initialDist;
                    setBgTransform(prev => ({ ...prev, scale: prev.scale * factor }));
                    setInitialDist(currentDist);
                }
                return;
            }

            // 3. Handle Drawing or Editing
            if (mode === 'draw') {
                if (isDrawingBrushRef.current) {
                    setCurrentPoints(prev => [...prev, point]);
                } else if (shapeStartPoint) {
                    let dx_s = point.x - shapeStartPoint.x;
                    let dy_s = point.y - shapeStartPoint.y;

                    if (isShiftPressed) {
                        const size = Math.max(Math.abs(dx_s), Math.abs(dy_s));
                        dx_s = Math.sign(dx_s) * size;
                        dy_s = Math.sign(dy_s) * size;
                    }

                    const constrainedPoint = {
                        x: shapeStartPoint.x + dx_s,
                        y: shapeStartPoint.y + dy_s
                    };

                    let newPoints: Point[] = [];
                    switch (activeTool) {
                        case 'square':
                            newPoints = [
                                { x: shapeStartPoint.x, y: shapeStartPoint.y },
                                { x: constrainedPoint.x, y: shapeStartPoint.y },
                                { x: constrainedPoint.x, y: constrainedPoint.y },
                                { x: shapeStartPoint.x, y: constrainedPoint.y }
                            ];
                            break;
                        case 'circle': {
                            const r = Math.sqrt(dx_s * dx_s + dy_s * dy_s);
                            for (let i = 0; i < 32; i++) {
                                const angle = (i / 32) * Math.PI * 2;
                                newPoints.push({ x: shapeStartPoint.x + Math.cos(angle) * r, y: shapeStartPoint.y + Math.sin(angle) * r });
                            }
                            break;
                        }
                        case 'triangle':
                            newPoints = [
                                { x: shapeStartPoint.x + dx_s / 2, y: shapeStartPoint.y },
                                { x: constrainedPoint.x, y: constrainedPoint.y },
                                { x: shapeStartPoint.x, y: constrainedPoint.y }
                            ];
                            break;
                        case 'star': {
                            const r = Math.sqrt(dx_s * dx_s + dy_s * dy_s);
                            for (let i = 0; i < 10; i++) {
                                const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
                                const currentR = i % 2 === 0 ? r : r * 0.4;
                                newPoints.push({ x: shapeStartPoint.x + Math.cos(angle) * currentR, y: shapeStartPoint.y + Math.sin(angle) * currentR });
                            }
                            break;
                        }
                    }
                    setCurrentPoints(newPoints);
                }
            } else if (mode === 'edit' && (selectedPathIds.length > 0 || initialTransformsRef.current.size > 0)) {
                if (transformMode !== 'none') {
                    const updateFn = (prevList: PathLayer[]): PathLayer[] => prevList.map(p => {
                        if (initialTransformsRef.current.has(p.id)) {
                            if (isAnimationMode) {
                                // 1. Determine if we operate on segments or whole layer
                                const isFocusMode = focusedSegmentIndices.length > 0 && p.multiPathPoints && initialTransformsRef.current.size === 1;

                                if (isFocusMode) {
                                    const newSegmentTransforms = [...(p.segmentTransforms || p.multiPathPoints!.map(() => undefined))];
                                    const newSegmentKeyframes = [...(p.segmentKeyframes || p.multiPathPoints!.map(() => undefined))];

                                    focusedSegmentIndices.forEach(idx => {
                                        const initialSegTransform = initialSegmentTransformsRef.current.get(idx) || { x: 0, y: 0, rotation: 0, scale: 1 };
                                        let newSegTransform = { ...initialSegTransform };

                                        if (transformMode === 'translate' && initialMousePos) {
                                            let dx = (mouseX - initialMousePos.x) / zoom;
                                            let dy = (mouseY - initialMousePos.y) / zoom;
                                            if (isShiftPressed) {
                                                const angle = Math.atan2(dy, dx);
                                                const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
                                                const dist = Math.sqrt(dx * dx + dy * dy);
                                                dx = dist * Math.cos(snappedAngle);
                                                dy = dist * Math.sin(snappedAngle);
                                            }
                                            newSegTransform.x = initialSegTransform.x + dx;
                                            newSegTransform.y = initialSegTransform.y + dy;
                                            setCurrentTranslationDelta({ x: dx, y: dy });
                                        } else if (transformMode === 'rotate' && transformPivot) {
                                            const currentAngle = Math.atan2(point.y - transformPivot.y, point.x - transformPivot.x);
                                            let deltaDegrees = ((currentAngle - initialAngle) * 180) / Math.PI;
                                            if (isShiftPressed) deltaDegrees = Math.round(deltaDegrees / 15) * 15;
                                            newSegTransform.rotation = initialSegTransform.rotation + deltaDegrees;
                                            setCurrentRotationDelta(deltaDegrees);
                                        } else if (transformMode === 'scale' && transformPivot) {
                                            const currentDist = Math.sqrt(Math.pow(point.x - transformPivot.x, 2) + Math.pow(point.y - transformPivot.y, 2));
                                            const scaleFactor = currentDist / initialDist;
                                            newSegTransform.scale = initialSegTransform.scale * scaleFactor;
                                            setCurrentScaleFactor(scaleFactor);
                                        } else if (transformMode === 'pivot' && initialMousePos) {
                                            const rawDx = (mouseX - initialMousePos.x) / zoom;
                                            const rawDy = (mouseY - initialMousePos.y) / zoom;

                                            // Rotate delta by -rotation to map screen movement to local px/py
                                            const layerRotation = initialTransformsRef.current.get(p.id)?.rotation || 0;
                                            const segRotation = initialSegTransform.rotation || 0;
                                            const totalRad = -(layerRotation + segRotation) * Math.PI / 180;

                                            const ldx = rawDx * Math.cos(totalRad) - rawDy * Math.sin(totalRad);
                                            const ldy = rawDx * Math.sin(totalRad) + rawDy * Math.cos(totalRad);

                                            // Also compensate for scale
                                            const lScaleX = initialTransformsRef.current.get(p.id)?.scaleX ?? initialTransformsRef.current.get(p.id)?.scale ?? 1;
                                            const lScaleY = initialTransformsRef.current.get(p.id)?.scaleY ?? initialTransformsRef.current.get(p.id)?.scale ?? 1;
                                            const sScaleX = initialSegTransform.scaleX ?? initialSegTransform.scale ?? 1;
                                            const sScaleY = initialSegTransform.scaleY ?? initialSegTransform.scale ?? 1;
                                            const totalScaleX = lScaleX * sScaleX;
                                            const totalScaleY = lScaleY * sScaleY;

                                            newSegTransform.px = (initialSegTransform.px || 0) + (ldx / (totalScaleX || 1));
                                            newSegTransform.py = (initialSegTransform.py || 0) + (ldy / (totalScaleY || 1));
                                        }

                                        newSegmentTransforms[idx] = newSegTransform;

                                        // Update Keyframes for this segment
                                        let segKfs = [...(newSegmentKeyframes[idx] || [])];
                                        segKfs = segKfs.filter(k => Math.abs(k.time - currentTime) > 0.1);
                                        segKfs.push({
                                            id: `kf-${p.id}-seg${idx}-${Math.round(currentTime)}`,
                                            time: currentTime,
                                            value: newSegTransform,
                                            ease: 'linear'
                                        });
                                        segKfs.sort((a, b) => a.time - b.time);
                                        newSegmentKeyframes[idx] = segKfs;
                                    });

                                    return { ...p, segmentTransforms: newSegmentTransforms, segmentKeyframes: newSegmentKeyframes };
                                }

                                // 2. Whole-layer animation logic (original)
                                const initialTransform = initialTransformsRef.current.get(p.id) || { x: 0, y: 0, rotation: 0, scale: 1 };
                                let newTransform = { ...initialTransform };

                                if (transformMode === 'translate' && initialMousePos) {
                                    let dx = (mouseX - initialMousePos.x) / zoom;
                                    let dy = (mouseY - initialMousePos.y) / zoom;
                                    if (isShiftPressed) {
                                        const angle = Math.atan2(dy, dx);
                                        const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
                                        const dist = Math.sqrt(dx * dx + dy * dy);
                                        dx = dist * Math.cos(snappedAngle);
                                        dy = dist * Math.sin(snappedAngle);
                                    }
                                    newTransform.x = initialTransform.x + dx;
                                    newTransform.y = initialTransform.y + dy;
                                    setCurrentTranslationDelta({ x: dx, y: dy });
                                } else if (transformMode === 'rotate' && transformPivot) {
                                    const currentAngle = Math.atan2(point.y - transformPivot.y, point.x - transformPivot.x);
                                    let deltaDegrees = ((currentAngle - initialAngle) * 180) / Math.PI;
                                    if (isShiftPressed) {
                                        deltaDegrees = Math.round(deltaDegrees / 15) * 15;
                                    }
                                    newTransform.rotation = initialTransform.rotation + deltaDegrees;
                                    setCurrentRotationDelta(deltaDegrees);
                                } else if (transformMode === 'scale' && transformPivot) {
                                    const currentDist = Math.sqrt(Math.pow(point.x - transformPivot.x, 2) + Math.pow(point.y - transformPivot.y, 2));
                                    const scaleFactor = currentDist / initialDist;
                                    newTransform.scale = initialTransform.scale * scaleFactor;
                                    setCurrentScaleFactor(scaleFactor);
                                } else if (transformMode === 'pivot' && initialMousePos) {
                                    const rawDx = (mouseX - initialMousePos.x) / zoom;
                                    const rawDy = (mouseY - initialMousePos.y) / zoom;

                                    const rotation = initialTransform.rotation || 0;
                                    const rad = -rotation * Math.PI / 180;
                                    const ldx = rawDx * Math.cos(rad) - rawDy * Math.sin(rad);
                                    const ldy = rawDx * Math.sin(rad) + rawDy * Math.cos(rad);

                                    // Compensate for scale
                                    const sx = initialTransform.scaleX ?? initialTransform.scale ?? 1;
                                    const sy = initialTransform.scaleY ?? initialTransform.scale ?? 1;

                                    newTransform.px = (initialTransform.px || 0) + (ldx / (sx || 1));
                                    newTransform.py = (initialTransform.py || 0) + (ldy / (sy || 1));
                                }

                                let newKeyframes = [...(p.keyframes || [])];
                                newKeyframes = newKeyframes.filter(k => Math.abs(k.time - currentTime) > 0.1);
                                newKeyframes.push({
                                    id: `kf-${p.id}-${Math.round(currentTime)}`,
                                    time: currentTime,
                                    value: newTransform,
                                    ease: 'linear'
                                });
                                newKeyframes.sort((a, b) => a.time - b.time);

                                return { ...p, transform: newTransform, keyframes: newKeyframes };
                            }

                            // Use the path's starting points from the beginning of the drag for precision and snapping
                            const startPath = dragStartPathsRef.current?.find(dp => dp.id === p.id) || p;
                            let newPoints = [...startPath.points];
                            let newMultiPoints = startPath.multiPathPoints ? startPath.multiPathPoints.map(seg => [...seg]) : undefined;

                            if (transformPivot) {
                                if (transformMode === 'rotate') {
                                    const currentAngle = Math.atan2(mouseY - transformPivot.y, mouseX - transformPivot.x);
                                    let totalDeltaAngle = currentAngle - rotationStartAngle;
                                    let deltaDegrees = (totalDeltaAngle * 180) / Math.PI;

                                    if (isShiftPressed) {
                                        deltaDegrees = Math.round(deltaDegrees / 15) * 15;
                                        totalDeltaAngle = (deltaDegrees * Math.PI) / 180;
                                    }

                                    setCurrentRotationDelta(deltaDegrees);
                                    const cos = Math.cos(totalDeltaAngle);
                                    const sin = Math.sin(totalDeltaAngle);

                                    if (focusedSegmentIndices.length > 0 && startPath.multiPathPoints) {
                                        newMultiPoints = startPath.multiPathPoints.map((seg, sIdx) =>
                                            focusedSegmentIndices.includes(sIdx)
                                                ? seg.map(pt => {
                                                    const dx = pt.x - transformPivot.x;
                                                    const dy = pt.y - transformPivot.y;
                                                    return {
                                                        x: transformPivot.x + dx * cos - dy * sin,
                                                        y: transformPivot.y + dx * sin + dy * cos
                                                    };
                                                })
                                                : seg
                                        );
                                        newPoints = newMultiPoints.flat();
                                    } else {
                                        newPoints = startPath.points.map(pt => {
                                            const dx = pt.x - transformPivot.x;
                                            const dy = pt.y - transformPivot.y;
                                            return {
                                                x: transformPivot.x + dx * cos - dy * sin,
                                                y: transformPivot.y + dx * sin + dy * cos
                                            };
                                        });
                                        if (newMultiPoints) {
                                            newMultiPoints = newMultiPoints.map(seg => seg.map(pt => {
                                                const dx = pt.x - transformPivot.x;
                                                const dy = pt.y - transformPivot.y;
                                                return {
                                                    x: transformPivot.x + dx * cos - dy * sin,
                                                    y: transformPivot.y + dx * sin + dy * cos
                                                };
                                            }));
                                        }
                                        if (p.type === 'text') {
                                            return {
                                                ...p,
                                                points: newPoints,
                                                rotation: (startPath.rotation || 0) + deltaDegrees,
                                                d: undefined
                                            } as PathLayer;
                                        }
                                    }
                                } else if (transformMode === 'scale') {
                                    const currentDist = Math.sqrt(Math.pow(mouseX - transformPivot.x, 2) + Math.pow(mouseY - transformPivot.y, 2));
                                    const scaleFactor = currentDist / initialDist;
                                    setCurrentScaleFactor(scaleFactor);

                                    if (focusedSegmentIndices.length > 0 && startPath.multiPathPoints) {
                                        newMultiPoints = startPath.multiPathPoints.map((seg, sIdx) =>
                                            focusedSegmentIndices.includes(sIdx)
                                                ? seg.map(pt => ({
                                                    x: transformPivot.x + (pt.x - transformPivot.x) * scaleFactor,
                                                    y: transformPivot.y + (pt.y - transformPivot.y) * scaleFactor
                                                }))
                                                : seg
                                        );
                                        newPoints = newMultiPoints.flat();
                                    } else {
                                        newPoints = startPath.points.map(pt => ({
                                            x: transformPivot.x + (pt.x - transformPivot.x) * scaleFactor,
                                            y: transformPivot.y + (pt.y - transformPivot.y) * scaleFactor
                                        }));
                                        if (newMultiPoints) {
                                            newMultiPoints = newMultiPoints.map(seg => seg.map(pt => ({
                                                x: transformPivot.x + (pt.x - transformPivot.x) * scaleFactor,
                                                y: transformPivot.y + (pt.y - transformPivot.y) * scaleFactor
                                            })));
                                        }
                                        if (p.type === 'text') {
                                            return {
                                                ...p,
                                                points: newPoints,
                                                fontSize: (startPath.fontSize || 40) * scaleFactor,
                                                d: undefined
                                            } as PathLayer;
                                        }
                                    }
                                } else if (transformMode === 'translate' && dragStartMousePosRef.current) {
                                    let dx_s = (mouseX - dragStartMousePosRef.current.x) / zoom;
                                    let dy_s = (mouseY - dragStartMousePosRef.current.y) / zoom;

                                    if (isShiftPressed) {
                                        const angle = Math.atan2(dy_s, dx_s);
                                        const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
                                        const dist = Math.sqrt(dx_s * dx_s + dy_s * dy_s);
                                        dx_s = dist * Math.cos(snappedAngle);
                                        dy_s = dist * Math.sin(snappedAngle);
                                    }
                                    setCurrentTranslationDelta({ x: dx_s, y: dy_s });

                                    if (focusedSegmentIndices.length > 0 && startPath.multiPathPoints) {
                                        newMultiPoints = startPath.multiPathPoints.map((seg, sIdx) =>
                                            focusedSegmentIndices.includes(sIdx)
                                                ? seg.map(pt => ({ x: pt.x + dx_s, y: pt.y + dy_s }))
                                                : seg
                                        );
                                        newPoints = newMultiPoints.flat();
                                    } else {
                                        newPoints = startPath.points.map(pt => ({ x: pt.x + dx_s, y: pt.y + dy_s }));
                                        if (newMultiPoints) {
                                            newMultiPoints = newMultiPoints.map(seg => seg.map(pt => ({
                                                x: pt.x + dx_s, y: pt.y + dy_s
                                            })));
                                        }
                                    }
                                } else if (transformMode === 'pivot' && initialMousePos) {
                                    const rawDx = (mouseX - initialMousePos.x) / zoom;
                                    const rawDy = (mouseY - initialMousePos.y) / zoom;

                                    if (focusedSegmentIndices.length > 0 && startPath.multiPathPoints) {
                                        const newSegmentTransforms = [...(startPath.segmentTransforms || startPath.multiPathPoints.map(() => undefined))];
                                        focusedSegmentIndices.forEach(idx => {
                                            const initialT = startPath.segmentTransforms?.[idx] || { x: 0, y: 0, rotation: 0, scale: 1 };
                                            const layerRot = startPath.transform?.rotation || 0;
                                            const segRot = initialT.rotation || 0;
                                            const totalRad = -(layerRot + segRot) * Math.PI / 180;

                                            const ldx = rawDx * Math.cos(totalRad) - rawDy * Math.sin(totalRad);
                                            const ldy = rawDx * Math.sin(totalRad) + rawDy * Math.cos(totalRad);

                                            newSegmentTransforms[idx] = {
                                                ...initialT,
                                                px: (initialT.px || 0) + ldx,
                                                py: (initialT.py || 0) + ldy
                                            };
                                        });
                                        return { ...p, segmentTransforms: newSegmentTransforms };
                                    } else {
                                        const initialT = startPath.transform || { x: 0, y: 0, rotation: 0, scale: 1 };
                                        const rad = -(initialT.rotation || 0) * Math.PI / 180;
                                        const ldx = rawDx * Math.cos(rad) - rawDy * Math.sin(rad);
                                        const ldy = rawDx * Math.sin(rad) + rawDy * Math.cos(rad);

                                        return {
                                            ...p,
                                            transform: {
                                                ...initialT,
                                                px: (initialT.px || 0) + ldx,
                                                py: (initialT.py || 0) + ldy
                                            }
                                        };
                                    }
                                }
                            }

                            return { ...p, points: newPoints, multiPathPoints: newMultiPoints, d: undefined } as PathLayer;
                        }
                        return p;
                    });

                    if (isAnimationMode) {
                        if (!isDraggingRef.current) {
                            setPaths(updateFn);
                            isDraggingRef.current = true;
                        } else {
                            setInternalState(updateFn);
                        }
                    } else {
                        if (!isDraggingRef.current) {
                            setPaths(updateFn);
                            isDraggingRef.current = true;
                        } else {
                            setInternalState(updateFn);
                        }
                    }
                } else if (draggingPointIndex !== null && selectedPathIds.length === 1) {
                    const updateFn = (prev: PathLayer[]): PathLayer[] => prev.map(p => {
                        if (p.id === selectedPathIds[0]) {
                            const newPoints = [...p.points];
                            newPoints[draggingPointIndex] = point;

                            let newMultiPoints = undefined;
                            if (p.multiPathPoints) {
                                let remainingIdx = draggingPointIndex;
                                newMultiPoints = p.multiPathPoints.map(seg => {
                                    if (remainingIdx >= 0 && remainingIdx < seg.length) {
                                        const newSeg = [...seg];
                                        newSeg[remainingIdx] = point;
                                        remainingIdx = -1; // Found it
                                        return newSeg;
                                    }
                                    remainingIdx -= seg.length;
                                    return seg;
                                });
                            }

                            return { ...p, points: newPoints, multiPathPoints: newMultiPoints, d: undefined } as PathLayer;
                        }
                        return p;
                    });
                    if (!isDraggingRef.current) {
                        setPaths(updateFn);
                        isDraggingRef.current = true;
                    } else {
                        setInternalState(updateFn);
                    }
                }
            }
        }
    }, [getPointFromEvent, mode, draggingPointIndex, focusedSegmentIndices, selectedPathIds, setPaths, setInternalState, transformMode, transformHandle, initialPoints, transformPivot, initialAngle, initialDist, initialMousePos, shapeStartPoint, activeTool, initialFontSize, initialRotation, zoom, isShiftPressed, marqueeStart, marqueeEnd, isAnimationMode, currentTime, interactive]);

    const handlePointerUp = useCallback(() => {
        if (mode === 'draw' && isDrawingBrushRef.current && currentPoints.length > 2) {
            const timestamp = Date.now();
            const tolerance = Math.max(0.5, tension * 5);
            const optimizedPoints = simplifyPath(currentPoints, tolerance);

            const newPath: PathLayer = {
                id: `brush-${timestamp}`,
                points: optimizedPoints,
                color: strokeColor,
                fill: fillColor,
                width: strokeWidth,
                tension: tension,
                closed: false,
                strokeOpacity,
                fillOpacity,
                animation: { ...animation },
                filter: filter,
                interactive: interactive,
                symmetry: { ...symmetry },
                visible: true,
                name: `Brush ${paths.length + 1}`,
                d: smoothPath(optimizedPoints, tension, false),
                transform: { x: 0, y: 0, rotation: 0, scale: 1 },
                keyframes: []
            };
            setPaths(prev => [...prev, newPath]);
            setCurrentPoints([]);
            isDrawingBrushRef.current = false;
            setFocusedSegmentIndices([]);
        } else if (mode === 'draw' && shapeStartPoint && currentPoints.length > 2) {
            const timestamp = Date.now();
            const newPath: PathLayer = {
                id: `shape-${timestamp}`,
                points: [...currentPoints],
                color: strokeColor,
                fill: fillColor,
                width: strokeWidth,
                tension: tension,
                closed: true,
                strokeOpacity,
                fillOpacity,
                animation: { ...animation },
                filter: filter,
                interactive: interactive,
                symmetry: { ...symmetry },
                visible: true,
                name: `${activeTool.charAt(0).toUpperCase() + activeTool.slice(1)} ${paths.length + 1}`,
                d: smoothPath(currentPoints, tension, true),
                transform: { x: 0, y: 0, rotation: 0, scale: 1 },
                keyframes: []
            };
            setPaths(prev => [...prev, newPath]);
            setCurrentPoints([]);
            setShapeStartPoint(null);
            setFocusedSegmentIndices([]);
        }

        setCursorPos(null);

        // Keep focusedSegmentIndices intact even after dragging individual points
        // to stay in sub-shape selection mode.

        setDraggingPointIndex(null);
        setTransformMode('none');
        setTransformHandle(null);
        setInitialPoints(null);
        setCurrentRotationDelta(0);
        setCurrentScaleFactor(1);

        if (marqueeStart && marqueeEnd) {
            const minX = Math.min(marqueeStart.x, marqueeEnd.x);
            const maxX = Math.max(marqueeStart.x, marqueeEnd.x);
            const minY = Math.min(marqueeStart.y, marqueeEnd.y);
            const maxY = Math.max(marqueeStart.y, marqueeEnd.y);

            const selectedIds = paths.filter(p => {
                if (p.locked || p.visible === false) return false;
                return p.points.some(pt => {
                    const tx = p.transform?.x || 0;
                    const ty = p.transform?.y || 0;
                    const px = pt.x + tx;
                    const py = pt.y + ty;
                    return px >= minX && px <= maxX && py >= minY && py <= maxY;
                });
            }).map(p => p.id);

            if (isShiftPressed) {
                setSelectedPathIds(prev => Array.from(new Set([...prev, ...selectedIds])));
            } else {
                setSelectedPathIds(selectedIds);
            }

            setMarqueeStart(null);
            setMarqueeEnd(null);
            setIsInteracting(false);
        }

        setCurrentTranslationDelta({ x: 0, y: 0 });
        isDraggingRef.current = false;
        setIsInteracting(false); // Ensure it's reset regardless
        initialTransformsRef.current.clear();
        setShapeStartPoint(null);
        dragStartPathsRef.current = null;
        dragStartMousePosRef.current = null;
    }, [mode, shapeStartPoint, currentPoints, strokeColor, fillColor, strokeWidth, symmetry, tension, setPaths, activeTool, animation, fillOpacity, paths, strokeOpacity, draggingPointIndex, marqueeStart, marqueeEnd, isShiftPressed, isVertexEditEnabled, selectedPathIds]);

    const handlePointerLeave = useCallback(() => {
        setCursorPos(null);
        setDraggingPointIndex(null);
        setTransformMode('none');
        setTransformHandle(null);
        setInitialPoints(null);
        setCurrentRotationDelta(0);
        setCurrentScaleFactor(1);
        setCurrentTranslationDelta({ x: 0, y: 0 });
        isDraggingRef.current = false;
        initialTransformsRef.current.clear();
        setShapeStartPoint(null);
        dragStartPathsRef.current = null;
        dragStartMousePosRef.current = null;
        setMarqueeStart(null);
        setMarqueeEnd(null);
    }, []);

    const handleWheel = useCallback((e: WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = -e.deltaY;
            const factor = delta > 0 ? 1.1 : 0.9;
            const newZoom = Math.min(Math.max(zoom * factor, 0.1), 20);

            if (newZoom !== zoom && canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                setPanOffset(prev => ({
                    x: mouseX - (mouseX - prev.x) * (newZoom / zoom),
                    y: mouseY - (mouseY - prev.y) * (newZoom / zoom)
                }));
                setZoom(newZoom);
            }
        } else if (e.shiftKey) {
            setPanOffset(prev => ({ ...prev, x: prev.x - e.deltaY }));
        } else {
            setPanOffset(prev => ({ ...prev, y: prev.y - e.deltaY }));
        }
    }, [zoom]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            // @ts-ignore
            canvas.addEventListener('wheel', handleWheel, { passive: false });
            return () => {
                // @ts-ignore
                canvas.removeEventListener('wheel', handleWheel);
            };
        }
    }, [handleWheel]);

    useEffect(() => {
        const handleUp = () => {
            handlePointerUp();
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
                setIsSpacePressed(true);
                if (e.target === document.body) e.preventDefault();
            }
            if (e.key === 'Shift') {
                setIsShiftPressed(true);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setIsSpacePressed(false);
            }
            if (e.key === 'Shift') {
                setIsShiftPressed(false);
            }
            if (e.key.toLowerCase() === 'v' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
                setIsVertexEditEnabled(prev => !prev);
            }
            if (e.key.toLowerCase() === 'c' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
                setIsPivotEditEnabled(prev => !prev);
            }
        };

        window.addEventListener('mouseup', handleUp);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handlePointerUp]);

    const handleDoubleClick = useCallback((e: React.MouseEvent) => {
        if (mode !== 'edit') return;
        const target = e.target as HTMLElement;
        const pathId = target.dataset.pathId || target.closest('[data-path-id]')?.getAttribute('data-path-id');

        if (!pathId) return;
        const path = paths.find(p => p.id === pathId);
        if (!path) return;

        // If it's a merged layer or has segments, double-click selects/focuses the specific segment
        if (path.multiPathPoints) {
            const segmentIndexAttr = target.closest('[data-segment-index]')?.getAttribute('data-segment-index');
            const bestSegIdx = (segmentIndexAttr !== null && segmentIndexAttr !== undefined) ? parseInt(segmentIndexAttr) : -1;

            if (bestSegIdx !== -1) {
                let chunkIndices = [bestSegIdx];
                if (path.segmentGroupings) {
                    let currentSIdx = 0;
                    for (const count of path.segmentGroupings) {
                        if (bestSegIdx >= currentSIdx && bestSegIdx < currentSIdx + count) {
                            chunkIndices = [];
                            for (let i = 0; i < count; i++) chunkIndices.push(currentSIdx + i);
                            break;
                        }
                        currentSIdx += count;
                    }
                }
                setSelectedPathIds([pathId]);
                setFocusedSegmentIndices(chunkIndices);
                return;
            }
        }

        if (path.type === 'text') {
            const newText = prompt('Edit text:', path.text);
            if (newText !== null && newText !== path.text) {
                setPaths(prev => prev.map(p => p.id === pathId ? { ...p, text: newText, name: `Text: ${newText.substring(0, 10)}...` } : p));
            }
            return;
        }

        if (!isVertexEditEnabled) return;

        const point = getPointFromEvent(e);
        if (!point) return;

        setPaths(prev => prev.map(p => {
            if (p.id === pathId) {
                const newPoints = [...p.points];
                let bestIdx = -1;
                let minDist = 20;

                for (let i = 0; i < newPoints.length - 1; i++) {
                    const d = distToSegment(point, newPoints[i], newPoints[i + 1]);
                    if (d < minDist) { minDist = d; bestIdx = i + 1; }
                }
                if (p.closed && newPoints.length > 2) {
                    const d = distToSegment(point, newPoints[newPoints.length - 1], newPoints[0]);
                    if (d < minDist) { minDist = d; bestIdx = newPoints.length; }
                }
                if (bestIdx !== -1) {
                    newPoints.splice(bestIdx, 0, point);
                    // Update multiPathPoints if it exists (for internal point tracking)
                    let newMultiPoints = undefined;
                    if (p.multiPathPoints) {
                        let remainingIdx = bestIdx;
                        newMultiPoints = p.multiPathPoints.map(seg => {
                            if (remainingIdx >= 0 && remainingIdx <= seg.length) {
                                const newSeg = [...seg];
                                newSeg.splice(remainingIdx, 0, point);
                                remainingIdx = -1; // Done
                                return newSeg;
                            }
                            remainingIdx -= seg.length;
                            return seg;
                        });
                    }
                    return { ...p, points: newPoints, multiPathPoints: newMultiPoints, d: undefined } as PathLayer;
                }
            }
            return p;
        }));
    }, [mode, paths, getPointFromEvent, setPaths, setIsVertexEditEnabled, isVertexEditEnabled]);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        if (mode === 'edit') return;
        if (currentPoints.length < 2) {
            setCurrentPoints([]);
            return;
        }
        const timestamp = Date.now();
        const newPath: PathLayer = {
            id: `path-${timestamp}`,
            points: [...currentPoints],
            color: strokeColor,
            fill: fillColor,
            width: strokeWidth,
            tension: tension,
            closed: isClosed,
            strokeOpacity,
            fillOpacity,
            animation: { ...animation },
            filter: filter,
            interactive: interactive,
            symmetry: { ...symmetry },
            visible: true,
            name: `Path ${paths.length + 1}`,
            transform: { x: 0, y: 0, rotation: 0, scale: 1 },
            keyframes: []
        };
        setPaths([...paths, newPath]);
        setCurrentPoints([]);
    }, [currentPoints, paths, setPaths, symmetry, strokeColor, fillColor, strokeWidth, tension, isClosed, mode, strokeOpacity, fillOpacity, animation, filter, interactive]);

    const clearCanvas = useCallback(() => {
        setPaths([]);
        setCurrentPoints([]);
    }, [setPaths]);

    const handleAddShape = useCallback((type: 'square' | 'circle' | 'triangle' | 'star') => {
        setActiveTool(type);
        setMode('draw');
        setCurrentPoints([]);
    }, []);

    const handleSelectPath = useCallback((id: string, isMulti?: boolean, isRange?: boolean) => {
        setFocusedSegmentIndices([]);

        if (isRange && lastSelectedId && paths.length > 0) {
            const lastIndex = paths.findIndex(p => p.id === lastSelectedId);
            const currentIndex = paths.findIndex(p => p.id === id);

            if (lastIndex !== -1 && currentIndex !== -1) {
                const start = Math.min(lastIndex, currentIndex);
                const end = Math.max(lastIndex, currentIndex);
                const rangeIds = paths.slice(start, end + 1).map(p => p.id);

                setSelectedPathIds(prev => {
                    const newIds = new Set(isMulti ? prev : []);
                    rangeIds.forEach(rid => newIds.add(rid));
                    return Array.from(newIds);
                });
                setLastSelectedId(id);
                return;
            }
        }

        if (isMulti) {
            setSelectedPathIds(prev =>
                prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
            );
        } else {
            setSelectedPathIds([id]);
        }
        // Always exit vertex edit mode when interacting via Layer Panel
        setIsVertexEditEnabled(false);
        setLastSelectedId(id);
    }, [paths, lastSelectedId]);

    const handleAddText = useCallback((content: string) => {
        if (!content) return;

        const timestamp = Date.now();
        const centerX = canvasRef.current?.clientWidth ? canvasRef.current.clientWidth / 2 : 400;
        const centerY = canvasRef.current?.clientHeight ? canvasRef.current.clientHeight / 2 : 300;
        const initialX = centerX / 2;
        const initialY = centerY / 2;

        const textFillColor = strokeColor === 'none' ? '#22d3ee' : strokeColor;
        const newPath: PathLayer = {
            id: `text-${timestamp}`,
            type: 'text',
            text: content,
            points: [{ x: initialX, y: initialY }],
            color: textFillColor,
            fill: textFillColor,
            width: 1,
            tension: 0,
            closed: false,
            fontSize: 40,
            fontFamily: 'Inter, system-ui, sans-serif',
            filter: filter,
            interactive: interactive,
            visible: true,
            symmetry: { ...symmetry },
            name: `Text: ${content.substring(0, 10)}...`,
            transform: { x: 0, y: 0, rotation: 0, scale: 1 },
            keyframes: []
        };

        setPaths(prev => [...prev, newPath]);
        setSelectedPathIds([newPath.id]);
    }, [strokeColor, symmetry, setPaths, filter, interactive]);

    const handleUpdateKeyframe = useCallback((id: string, updates: Partial<AnimationKeyframe>) => {
        if (selectedPathIds.length !== 1) return;
        const pathId = selectedPathIds[0];

        setPaths(prev => prev.map(p => {
            if (p.id !== pathId) return p;

            // Check if the keyframe belongs to a segment
            if (p.segmentKeyframes) {
                for (let sIdx = 0; sIdx < p.segmentKeyframes.length; sIdx++) {
                    const segKfs = p.segmentKeyframes[sIdx];
                    if (segKfs && segKfs.some(k => k.id === id)) {
                        const newSegmentKeyframes = [...p.segmentKeyframes];
                        let newKfs = segKfs.map(k => k.id === id ? { ...k, ...updates } : k);
                        if (updates.time !== undefined) {
                            newKfs.sort((a, b) => a.time - b.time);
                        }
                        newSegmentKeyframes[sIdx] = newKfs;
                        return { ...p, segmentKeyframes: newSegmentKeyframes };
                    }
                }
            }

            // Whole-layer keyframe update
            const newKeyframes = p.keyframes?.map(k =>
                k.id === id ? { ...k, ...updates } : k
            ) || [];
            if (updates.time !== undefined) {
                newKeyframes.sort((a, b) => a.time - b.time);
            }
            return { ...p, keyframes: newKeyframes };
        }));
    }, [selectedPathIds, setPaths]);

    const togglePlayback = useCallback(() => {
        setIsPlaying(prev => {
            const next = !prev;
            if (next) {
                setCurrentTime(0); // Start from 0 when playing
            }
            return next;
        });
    }, [setIsPlaying, setCurrentTime]);

    return {
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
        setSymmetry,
        toggleSymmetry,
        tension,
        setTension: setTensionEnhanced,
        strokeColor,
        setStrokeColor: setStrokeColorEnhanced,
        fillColor,
        setFillColor: setFillColorEnhanced,
        strokeWidth,
        setStrokeWidth: setStrokeWidthEnhanced,
        isClosed,
        setIsClosed: setIsClosedEnhanced,
        fontFamily,
        setFontFamily: setFontFamilyEnhanced,
        mode,
        setMode,
        handleSelectPath,
        selectedPathIds,
        setSelectedPathIds,
        focusedSegmentIndices,
        setFocusedSegmentIndices,
        undo,
        redo,
        canUndo,
        canRedo,
        clearCanvas,
        handleAddShape,
        handleAddText,
        activeTool,
        setActiveTool,
        handlePointerUp,
        setPaths,
        setPathsInternal: setInternalState,
        isDragging: draggingPointIndex !== null || transformMode !== 'none' || isInteracting,
        getBoundingBox,
        transformMode,
        transformHandle,
        transformPivot,
        currentRotationDelta,
        currentScaleFactor,
        currentTranslationDelta,
        pointSnappingEnabled,
        setPointSnappingEnabled,
        guideSnappingEnabled,
        setGuideSnappingEnabled,
        deleteSelectedPath,
        duplicateSelectedPath,
        bgTransform,
        setBgTransform,
        strokeOpacity,
        setStrokeOpacity: setStrokeOpacityEnhanced,
        fillOpacity,
        setFillOpacity: setFillOpacityEnhanced,
        animation,
        setAnimation: setAnimationEnhanced,
        zoom,
        setZoom,
        panOffset,
        setPanOffset,
        isSpacePressed,
        mergeSelected,
        splitSelected,
        moveSelectedUp,
        moveSelectedDown,
        moveSelectedToTop,
        moveSelectedToBottom,
        isAnimationMode,
        setIsAnimationMode,
        currentTime,
        setCurrentTime,
        duration,
        effectiveDuration,
        timelineDuration,
        setDuration,
        isPlaying,
        setIsPlaying,
        togglePlayback,
        handleAddKeyframe,
        handleDeleteKeyframe,
        handleUpdateKeyframe,
        shapeStartPoint,
        isShiftPressed,
        isReorderingLayers,
        setIsReorderingLayers,
        marqueeStart,
        marqueeEnd,
        isVertexEditEnabled,
        setIsVertexEditEnabled,
        filter,
        setFilter: setFilterEnhanced,
        interactive,
        setInteractive: setInteractiveEnhanced,
        isPivotEditEnabled,
        setIsPivotEditEnabled
    };
}

export default useDraw;
