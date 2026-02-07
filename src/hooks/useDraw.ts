import { useState, useRef, useCallback, useEffect } from 'react';
import type { Point, PathLayer, SymmetrySettings, AnimationSettings } from '../types';
import { applySymmetry, distToSegment } from '../utils/geometry';
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
    const [animation, setAnimation] = useState<AnimationSettings>({
        types: [],
        duration: 2,
        delay: 0,
        ease: 'ease-in-out',
        direction: 'forward'
    });

    // Edit Mode State
    const [mode, setMode] = useState<'draw' | 'edit'>('draw');
    const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
    const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);
    const isDraggingRef = useRef(false);

    const [activeTool, setActiveTool] = useState<'pen' | 'square' | 'circle' | 'triangle' | 'star'>('pen');
    const [shapeStartPoint, setShapeStartPoint] = useState<Point | null>(null);

    // Transformation State
    const [transformMode, setTransformMode] = useState<'none' | 'rotate' | 'scale' | 'translate'>('none');
    const [transformHandle, setTransformHandle] = useState<string | null>(null);
    const [transformPivot, setTransformPivot] = useState<Point | null>(null);
    const [initialPoints, setInitialPoints] = useState<Point[] | null>(null);
    const [initialAngle, setInitialAngle] = useState<number>(0);
    const [initialDist, setInitialDist] = useState<number>(1);
    const [initialMousePos, setInitialMousePos] = useState<Point | null>(null);

    // Snapping Settings
    const [pointSnappingEnabled, setPointSnappingEnabled] = useState<boolean>(true);
    const [guideSnappingEnabled, setGuideSnappingEnabled] = useState<boolean>(true);

    const canvasRef = useRef<HTMLDivElement>(null);

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

    // 1. Sync settings when selectedPathId changes, with guards to prevent infinite loops
    // 1. Sync settings when selectedPathId changes
    useEffect(() => {
        if (mode === 'edit' && selectedPathId) {
            const path = paths.find(p => p.id === selectedPathId);
            if (path) {
                setStrokeColor(prev => prev !== (path.color || '#22d3ee') ? (path.color || '#22d3ee') : prev);
                setFillColor(prev => prev !== (path.fill || 'none') ? (path.fill || 'none') : prev);
                setStrokeWidth(prev => prev !== (path.width || 2) ? (path.width || 2) : prev);
                setTension(prev => prev !== (path.tension ?? 0.5) ? (path.tension ?? 0.5) : prev);
                setIsClosed(prev => prev !== (path.closed ?? false) ? (path.closed ?? false) : prev);
                setStrokeOpacity(prev => prev !== (path.strokeOpacity ?? 1) ? (path.strokeOpacity ?? 1) : prev);
                setFillOpacity(prev => prev !== (path.fillOpacity ?? 1) ? (path.fillOpacity ?? 1) : prev);

                const newAnimation = path.animation ?? { types: [], duration: 2, delay: 0, ease: 'ease-in-out' };
                setAnimation(prev => JSON.stringify(prev) !== JSON.stringify(newAnimation) ? newAnimation : prev);
            }
        }
    }, [selectedPathId, mode, paths]);

    // 2. Helper to update selected path property
    const updateSelectedPathProperty = useCallback((updater: (path: PathLayer) => PathLayer, commit: boolean = true) => {
        if (mode === 'edit' && selectedPathId) {
            const updateType = commit ? setPaths : setInternalState;
            updateType(prev => prev.map(p => p.id === selectedPathId ? updater(p) : p));
        }
    }, [mode, selectedPathId, setPaths, setInternalState]);

    const deleteSelectedPath = useCallback(() => {
        if (selectedPathId) {
            setPaths(prev => prev.filter(p => p.id !== selectedPathId));
            setSelectedPathId(null);
        }
    }, [selectedPathId, setPaths]);

    const duplicateSelectedPath = useCallback(() => {
        if (selectedPathId) {
            const path = paths.find(p => p.id === selectedPathId);
            if (path) {
                const newPath: PathLayer = {
                    ...path,
                    id: `path-${Date.now()}`,
                    points: path.points.map(pt => ({ x: pt.x + 20, y: pt.y + 20 }))
                };
                setPaths(prev => [...prev, newPath]);
                setSelectedPathId(newPath.id);
            }
        }
    }, [selectedPathId, paths, setPaths]);

    const setStrokeColorEnhanced = useCallback((color: string, commit: boolean = true) => {
        setIsInteracting(!commit);
        setStrokeColor(color);
        updateSelectedPathProperty(p => ({ ...p, color }), commit);
    }, [updateSelectedPathProperty]);

    const setFillColorEnhanced = useCallback((fill: string, commit: boolean = true) => {
        setIsInteracting(!commit);
        setFillColor(fill);
        updateSelectedPathProperty(p => ({ ...p, fill }), commit);
    }, [updateSelectedPathProperty]);

    const setStrokeWidthEnhanced = useCallback((width: number, commit: boolean = true) => {
        setIsInteracting(!commit);
        setStrokeWidth(width);
        updateSelectedPathProperty(p => ({ ...p, width }), commit);
    }, [updateSelectedPathProperty]);

    const setTensionEnhanced = useCallback((t: number, commit: boolean = true) => {
        setIsInteracting(!commit);
        setTension(t);
        updateSelectedPathProperty(p => ({ ...p, tension: t }), commit);
    }, [updateSelectedPathProperty]);

    const setIsClosedEnhanced = useCallback((closed: boolean, commit: boolean = true) => {
        setIsInteracting(!commit);
        setIsClosed(closed);
        updateSelectedPathProperty(p => ({ ...p, closed }), commit);
    }, [updateSelectedPathProperty]);

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

    const setAnimationEnhanced = useCallback((anim: AnimationSettings, commit: boolean = true) => {
        setIsInteracting(!commit);
        setAnimation(anim);
        updateSelectedPathProperty(p => ({ ...p, animation: anim }), commit);
    }, [updateSelectedPathProperty]);

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

        // Only snap if not transforming
        if (transformMode === 'none' && draggingPointIndex === null) {
            const SNAP_THRESHOLD = 10;
            const SNAP_THRESHOLD_SQ = SNAP_THRESHOLD * SNAP_THRESHOLD;

            let closestDistSq = SNAP_THRESHOLD_SQ;
            let snapX = x;
            let snapY = y;
            let hasSnappedToPoint = false;

            if (pointSnappingEnabled) {
                if (paths.length < 100) {
                    for (const path of paths) {
                        for (const p of path.points) {
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

                if (mode === 'draw') {
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
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                if (symmetry.horizontal && Math.abs(x - centerX) < SNAP_THRESHOLD) x = centerX;
                if (symmetry.vertical && Math.abs(y - centerY) < SNAP_THRESHOLD) y = centerY;
                if (symmetry.center) {
                    if (Math.abs(x - centerX) < SNAP_THRESHOLD) x = centerX;
                    if (Math.abs(y - centerY) < SNAP_THRESHOLD) y = centerY;
                }
            }
        }

        return { x, y };
    }, [symmetry, paths, currentPoints, mode, transformMode, draggingPointIndex, pointSnappingEnabled, guideSnappingEnabled]);

    const handlePointerDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return;

        // Check for transform handles first (this information is passed via dataset/target)
        const target = e.target as HTMLElement;
        const handleType = target.dataset.handle;

        if (handleType && selectedPathId) {
            const path = paths.find(p => p.id === selectedPathId);
            if (path) {
                const box = getBoundingBox(path.points);
                const pivot = { x: box.centerX, y: box.centerY };
                const rect = canvasRef.current!.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                setInitialPoints([...path.points]);
                setTransformPivot(pivot);
                setTransformHandle(handleType);

                if (handleType === 'rotate') {
                    setTransformMode('rotate');
                    setInitialAngle(Math.atan2(mouseY - pivot.y, mouseX - pivot.x));
                } else {
                    setTransformMode('scale');
                    setInitialDist(Math.sqrt(Math.pow(mouseX - pivot.x, 2) + Math.pow(mouseY - pivot.y, 2)));
                }
                isDraggingRef.current = false;
                return;
            }
        }

        const point = getPointFromEvent(e);
        if (!point) return;

        if (mode === 'draw') {
            if (activeTool === 'pen') {
                setCurrentPoints(prev => [...prev, point]);
            } else {
                setShapeStartPoint(point);
                setCurrentPoints([point, point]);
            }
        } else if (mode === 'edit') {
            const rect = canvasRef.current!.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // 1. Check if we clicked an existing point handle of the selected path
            if (selectedPathId) {
                const path = paths.find(p => p.id === selectedPathId);
                if (path) {
                    const HIT_RADIUS = 12;
                    const { width, height } = rect;
                    const centerX = width / 2;
                    const centerY = height / 2;
                    const variants = applySymmetry(path.points, path.symmetry, centerX, centerY);

                    let clickedPointIndex = -1;
                    for (const v of variants) {
                        const idx = v.points.findIndex(pt => {
                            return Math.sqrt(Math.pow(pt.x - mouseX, 2) + Math.pow(pt.y - mouseY, 2)) <= HIT_RADIUS;
                        });
                        if (idx !== -1) { clickedPointIndex = idx; break; }
                    }

                    if (clickedPointIndex !== -1) {
                        setDraggingPointIndex(clickedPointIndex);
                        isDraggingRef.current = false;
                        return;
                    }
                }
            }

            // 2. Check if we clicked on a path for translation or selection
            const pathId = target.dataset.pathId || (target.tagName === 'path' ? (target as any).dataset.pathId : null);
            if (pathId) {
                const path = paths.find(p => p.id === pathId);
                if (path) {
                    setSelectedPathId(pathId);
                    setTransformMode('translate');
                    setInitialPoints([...path.points]);
                    setInitialMousePos({ x: mouseX, y: mouseY });
                    isDraggingRef.current = false;
                    return;
                }
            }

            // 3. Deselect if clicking on empty space
            if (target === canvasRef.current || target.tagName === 'svg') {
                setSelectedPathId(null);
            }
        }
    }, [getPointFromEvent, mode, paths, selectedPathId, getBoundingBox, activeTool, initialAngle, initialDist]);

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
            symmetry: { ...symmetry },
            visible: true,
            name: `Path ${paths.length + 1}`
        };

        setPaths([...paths, newPath]);
        setCurrentPoints([]);
    }, [currentPoints, paths, setPaths, symmetry, strokeColor, fillColor, strokeWidth, tension, isClosed, mode, strokeOpacity, fillOpacity]);

    const [cursorPos, setCursorPos] = useState<Point | null>(null);
    const [isInteracting, setIsInteracting] = useState(false); // For sliders/color pickers

    const handlePointerMove = useCallback((e: React.MouseEvent) => {
        const point = getPointFromEvent(e);
        if (point) {
            setCursorPos(point);

            if (mode === 'draw' && shapeStartPoint) {
                const dx = point.x - shapeStartPoint.x;
                const dy = point.y - shapeStartPoint.y;
                let newPoints: Point[] = [];
                switch (activeTool) {
                    case 'square':
                        newPoints = [{ x: shapeStartPoint.x, y: shapeStartPoint.y }, { x: point.x, y: shapeStartPoint.y }, { x: point.x, y: point.y }, { x: shapeStartPoint.x, y: point.y }];
                        break;
                    case 'circle': {
                        const r = Math.sqrt(dx * dx + dy * dy);
                        for (let i = 0; i < 32; i++) {
                            const angle = (i / 32) * Math.PI * 2;
                            newPoints.push({ x: shapeStartPoint.x + Math.cos(angle) * r, y: shapeStartPoint.y + Math.sin(angle) * r });
                        }
                        break;
                    }
                    case 'triangle':
                        newPoints = [{ x: shapeStartPoint.x + dx / 2, y: shapeStartPoint.y }, { x: point.x, y: point.y }, { x: shapeStartPoint.x, y: point.y }];
                        break;
                    case 'star': {
                        const r = Math.sqrt(dx * dx + dy * dy);
                        for (let i = 0; i < 10; i++) {
                            const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
                            const currentR = i % 2 === 0 ? r : r * 0.4;
                            newPoints.push({ x: shapeStartPoint.x + Math.cos(angle) * currentR, y: shapeStartPoint.y + Math.sin(angle) * currentR });
                        }
                        break;
                    }
                }
                setCurrentPoints(newPoints);
            } else if (mode === 'edit' && selectedPathId) {
                if (transformMode !== 'none' && initialPoints) {
                    const updateFn = (prev: PathLayer[]) => prev.map(p => {
                        if (p.id === selectedPathId) {
                            let newPoints = [...initialPoints];
                            const rect = canvasRef.current!.getBoundingClientRect();
                            const mouseX = e.clientX - rect.left;
                            const mouseY = e.clientY - rect.top;

                            if (transformMode === 'rotate' && transformPivot) {
                                const currentAngle = Math.atan2(mouseY - transformPivot.y, mouseX - transformPivot.x);
                                const deltaAngle = currentAngle - initialAngle;

                                newPoints = initialPoints.map(pt => {
                                    const dx = pt.x - transformPivot.x;
                                    const dy = pt.y - transformPivot.y;
                                    const cos = Math.cos(deltaAngle);
                                    const sin = Math.sin(deltaAngle);
                                    return {
                                        x: transformPivot.x + dx * cos - dy * sin,
                                        y: transformPivot.y + dx * sin + dy * cos
                                    };
                                });
                            } else if (transformMode === 'scale' && transformPivot) {
                                const currentDist = Math.sqrt(Math.pow(mouseX - transformPivot.x, 2) + Math.pow(mouseY - transformPivot.y, 2));
                                const scaleFactor = currentDist / initialDist;
                                newPoints = initialPoints.map(pt => ({
                                    x: transformPivot.x + (pt.x - transformPivot.x) * scaleFactor,
                                    y: transformPivot.y + (pt.y - transformPivot.y) * scaleFactor
                                }));
                            } else if (transformMode === 'translate' && initialMousePos) {
                                const dx = mouseX - initialMousePos.x;
                                const dy = mouseY - initialMousePos.y;
                                newPoints = initialPoints.map(pt => ({
                                    x: pt.x + dx,
                                    y: pt.y + dy
                                }));
                            }
                            return { ...p, points: newPoints };
                        }
                        return p;
                    });

                    if (!isDraggingRef.current) {
                        setPaths(updateFn);
                        isDraggingRef.current = true;
                    } else {
                        setInternalState(updateFn);
                    }
                } else if (draggingPointIndex !== null) {
                    const updateFn = (prev: PathLayer[]) => prev.map(p => {
                        if (p.id === selectedPathId) {
                            const newPoints = [...p.points];
                            newPoints[draggingPointIndex] = point;
                            return { ...p, points: newPoints };
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
    }, [getPointFromEvent, mode, draggingPointIndex, selectedPathId, setPaths, setInternalState, transformMode, initialPoints, transformPivot, initialAngle, initialDist, initialMousePos, shapeStartPoint, activeTool]);

    const handlePointerUp = useCallback(() => {
        if (mode === 'draw' && shapeStartPoint && currentPoints.length > 2) {
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
                symmetry: { ...symmetry },
                visible: true,
                name: `${activeTool.charAt(0).toUpperCase() + activeTool.slice(1)} ${paths.length + 1}`
            };
            setPaths(prev => [...prev, newPath]);
            setCurrentPoints([]);
            setShapeStartPoint(null);
        }

        setCursorPos(null);
        setDraggingPointIndex(null);
        setTransformMode('none');
        setTransformHandle(null);
        setInitialPoints(null);
        isDraggingRef.current = false;
        setShapeStartPoint(null);
    }, [mode, shapeStartPoint, currentPoints, strokeColor, fillColor, strokeWidth, symmetry, tension, setPaths]);

    const handlePointerLeave = useCallback(() => {
        setCursorPos(null);
        setDraggingPointIndex(null);
        setTransformMode('none');
        setTransformHandle(null);
        setInitialPoints(null);
        isDraggingRef.current = false;
        setShapeStartPoint(null);
    }, []);

    useEffect(() => {
        const handleUp = () => {
            handlePointerUp();
        };
        window.addEventListener('mouseup', handleUp);
        return () => window.removeEventListener('mouseup', handleUp);
    }, [handlePointerUp]);

    const handleDoubleClick = useCallback((e: React.MouseEvent) => {
        if (mode !== 'edit' || !selectedPathId) return;

        const point = getPointFromEvent(e);
        if (!point) return;

        setPaths(prev => prev.map(path => {
            if (path.id === selectedPathId) {
                const newPoints = [...path.points];
                let bestIdx = -1;
                let minDist = 20;

                for (let i = 0; i < newPoints.length - 1; i++) {
                    const d = distToSegment(point, newPoints[i], newPoints[i + 1]);
                    if (d < minDist) { minDist = d; bestIdx = i + 1; }
                }
                if (path.closed && newPoints.length > 2) {
                    const d = distToSegment(point, newPoints[newPoints.length - 1], newPoints[0]);
                    if (d < minDist) { minDist = d; bestIdx = newPoints.length; }
                }
                if (bestIdx !== -1) {
                    newPoints.splice(bestIdx, 0, point);
                    return { ...path, points: newPoints };
                }
            }
            return path;
        }));
    }, [mode, selectedPathId, getPointFromEvent, setPaths]);

    const clearCanvas = useCallback(() => {
        setPaths([]);
        setCurrentPoints([]);
    }, [setPaths]);

    const handleAddShape = useCallback((type: 'square' | 'circle' | 'triangle' | 'star') => {
        setActiveTool(type);
        setMode('draw');
        setCurrentPoints([]);
    }, []);

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
        mode,
        setMode,
        selectedPathId,
        setSelectedPathId,
        undo,
        redo,
        canUndo,
        canRedo,
        clearCanvas,
        handleAddShape,
        activeTool,
        setActiveTool,
        handlePointerUp,
        setPaths,
        setPathsInternal: setInternalState,
        isDragging: draggingPointIndex !== null || transformMode !== 'none' || isInteracting,
        getBoundingBox,
        transformMode,
        transformHandle,
        pointSnappingEnabled,
        setPointSnappingEnabled,
        guideSnappingEnabled,
        setGuideSnappingEnabled,
        deleteSelectedPath,
        duplicateSelectedPath,
        strokeOpacity,
        setStrokeOpacity: setStrokeOpacityEnhanced,
        fillOpacity,
        setFillOpacity: setFillOpacityEnhanced,
        animation,
        setAnimation: setAnimationEnhanced
    };
}

export default useDraw;
