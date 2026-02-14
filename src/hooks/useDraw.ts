import { useState, useRef, useCallback, useEffect } from 'react';
import type { Point, PathLayer, SymmetrySettings, AnimationSettings } from '../types';
import { applySymmetry, distToSegment, simplifyPath, smoothPath } from '../utils/geometry';
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

    const [activeTool, setActiveTool] = useState<'brush' | 'pen' | 'square' | 'circle' | 'triangle' | 'star' | 'image'>('brush');
    const [bgTransform, setBgTransform] = useState({ x: 0, y: 0, scale: 1, rotation: 0, opacity: 0.3 });
    const [shapeStartPoint, setShapeStartPoint] = useState<Point | null>(null);
    const isDrawingBrushRef = useRef(false);

    // Transformation State
    const [transformMode, setTransformMode] = useState<'none' | 'rotate' | 'scale' | 'translate'>('none');
    const [transformHandle, setTransformHandle] = useState<string | null>(null);
    const [transformPivot, setTransformPivot] = useState<Point | null>(null);
    const [initialPoints, setInitialPoints] = useState<Point[] | null>(null);
    const [initialAngle, setInitialAngle] = useState<number>(0);
    const [initialDist, setInitialDist] = useState<number>(1);
    const [initialMousePos, setInitialMousePos] = useState<Point | null>(null);
    const [initialFontSize, setInitialFontSize] = useState<number>(40);
    const [initialRotation, setInitialRotation] = useState<number>(0);

    // Snapping Settings
    const [pointSnappingEnabled, setPointSnappingEnabled] = useState<boolean>(true);
    const [guideSnappingEnabled, setGuideSnappingEnabled] = useState<boolean>(true);

    // Zoom and Pan State
    const [zoom, setZoom] = useState<number>(1);
    const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });
    const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);

    const [cursorPos, setCursorPos] = useState<Point | null>(null);
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

    // 1. Sync settings when selectedPathId changes
    useEffect(() => {
        if (mode === 'edit' && selectedPathId && !isDraggingRef.current) {
            const path = paths.find(p => p.id === selectedPathId);
            if (path) {
                const targetStrokeColor = path.color || '#22d3ee';
                const targetFillColor = path.fill || 'none';
                const targetStrokeWidth = path.width || 2;
                const targetTension = path.tension ?? 0.5;
                const targetIsClosed = path.closed ?? false;
                const targetStrokeOpacity = path.strokeOpacity ?? 1;
                const targetFillOpacity = path.fillOpacity ?? 1;
                const targetFontFamily = path.fontFamily || 'Inter, system-ui, sans-serif';

                setStrokeColor(prev => prev !== targetStrokeColor ? targetStrokeColor : prev);
                setFillColor(prev => prev !== targetFillColor ? targetFillColor : prev);
                setStrokeWidth(prev => prev !== targetStrokeWidth ? targetStrokeWidth : prev);
                setTension(prev => prev !== targetTension ? targetTension : prev);
                setIsClosed(prev => prev !== targetIsClosed ? targetIsClosed : prev);
                setStrokeOpacity(prev => prev !== targetStrokeOpacity ? targetStrokeOpacity : prev);
                setFillOpacity(prev => prev !== targetFillOpacity ? targetFillOpacity : prev);
                setFontFamily(prev => prev !== targetFontFamily ? targetFontFamily : prev);

                const newAnimation = path.animation ?? {
                    types: [],
                    duration: 2,
                    delay: 0,
                    ease: 'ease-in-out',
                    direction: 'forward'
                };

                setAnimation(prev => {
                    const s1 = JSON.stringify(prev);
                    const s2 = JSON.stringify(newAnimation);
                    return s1 !== s2 ? newAnimation : prev;
                });
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
        updateSelectedPathProperty(p => ({ ...p, tension: t, d: undefined }), commit);
    }, [updateSelectedPathProperty]);

    const setIsClosedEnhanced = useCallback((closed: boolean, commit: boolean = true) => {
        setIsInteracting(!commit);
        setIsClosed(closed);
        updateSelectedPathProperty(p => ({ ...p, closed, d: undefined }), commit);
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

    const setFontFamilyEnhanced = useCallback((font: string, commit: boolean = true) => {
        setIsInteracting(!commit);
        setFontFamily(font);
        updateSelectedPathProperty(p => ({ ...p, fontFamily: font }), commit);
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
                if (path.type === 'text') {
                    setInitialFontSize(path.fontSize || 40);
                    setInitialRotation(path.rotation || 0);
                }

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

            if (selectedPathId) {
                const path = paths.find(p => p.id === selectedPathId);
                if (path) {
                    const HIT_RADIUS = 12;
                    const { width, height } = rect;
                    const centerX = width / (2 * zoom);
                    const centerY = height / (2 * zoom);
                    const variants = applySymmetry(path.points, path.symmetry, centerX, centerY);

                    let clickedPointIndex = -1;
                    for (const v of variants) {
                        const idx = v.points.findIndex(pt => {
                            // PT is in SVG space, mouse is in screen space. Need to map mouse to SVG space.
                            const mouseSVG = { x: (mouseX - panOffset.x) / zoom, y: (mouseY - panOffset.y) / zoom };
                            return Math.sqrt(Math.pow(pt.x - mouseSVG.x, 2) + Math.pow(pt.y - mouseSVG.y, 2)) <= (HIT_RADIUS / zoom);
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

            const pathId = target.dataset.pathId || (['path', 'text'].includes(target.tagName.toLowerCase()) ? (target as any).dataset.pathId : null);
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

            if (target === canvasRef.current || target.tagName === 'svg') {
                setSelectedPathId(null);
            }
        }
    }, [getPointFromEvent, mode, paths, selectedPathId, getBoundingBox, activeTool, bgTransform, isSpacePressed, zoom, panOffset]);

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
                    const dx_s = point.x - shapeStartPoint.x;
                    const dy_s = point.y - shapeStartPoint.y;
                    let newPoints: Point[] = [];
                    switch (activeTool) {
                        case 'square':
                            newPoints = [{ x: shapeStartPoint.x, y: shapeStartPoint.y }, { x: point.x, y: shapeStartPoint.y }, { x: point.x, y: point.y }, { x: shapeStartPoint.x, y: point.y }];
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
                            newPoints = [{ x: shapeStartPoint.x + dx_s / 2, y: shapeStartPoint.y }, { x: point.x, y: point.y }, { x: shapeStartPoint.x, y: point.y }];
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
            } else if (mode === 'edit' && selectedPathId) {
                if (transformMode !== 'none' && initialPoints) {
                    const updateFn = (prev: PathLayer[]): PathLayer[] => prev.map(p => {
                        if (p.id === selectedPathId) {
                            let newPoints = [...initialPoints];

                            if (transformMode === 'rotate' && transformPivot) {
                                const currentAngle = Math.atan2(mouseY - transformPivot.y, mouseX - transformPivot.x);
                                const deltaAngle = currentAngle - initialAngle;

                                newPoints = initialPoints.map(pt => {
                                    const dx_p = pt.x - transformPivot.x;
                                    const dy_p = pt.y - transformPivot.y;
                                    const cos = Math.cos(deltaAngle);
                                    const sin = Math.sin(deltaAngle);
                                    return {
                                        x: transformPivot.x + dx_p * cos - dy_p * sin,
                                        y: transformPivot.y + dx_p * sin + dy_p * cos
                                    };
                                });

                                if (p.type === 'text') {
                                    const deltaDegrees = (deltaAngle * 180) / Math.PI;
                                    return {
                                        ...p,
                                        points: newPoints,
                                        rotation: (initialRotation || 0) + deltaDegrees,
                                        d: undefined
                                    } as PathLayer;
                                }
                            } else if (transformMode === 'scale' && transformPivot) {
                                const currentDist = Math.sqrt(Math.pow(mouseX - transformPivot.x, 2) + Math.pow(mouseY - transformPivot.y, 2));
                                const scaleFactor = currentDist / initialDist;
                                newPoints = initialPoints.map(pt => ({
                                    x: transformPivot.x + (pt.x - transformPivot.x) * scaleFactor,
                                    y: transformPivot.y + (pt.y - transformPivot.y) * scaleFactor
                                }));

                                if (p.type === 'text') {
                                    return {
                                        ...p,
                                        points: newPoints,
                                        fontSize: (initialFontSize || 40) * scaleFactor,
                                        d: undefined
                                    } as PathLayer;
                                }
                            } else if (transformMode === 'translate' && initialMousePos) {
                                const dx_m = mouseX - initialMousePos.x;
                                const dy_m = mouseY - initialMousePos.y;
                                const dx_s = dx_m / zoom;
                                const dy_s = dy_m / zoom;

                                newPoints = initialPoints.map(pt => ({
                                    x: pt.x + dx_s,
                                    y: pt.y + dy_s
                                }));
                            }
                            return { ...p, points: newPoints, d: undefined } as PathLayer;
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
                    const updateFn = (prev: PathLayer[]): PathLayer[] => prev.map(p => {
                        if (p.id === selectedPathId) {
                            const newPoints = [...p.points];
                            newPoints[draggingPointIndex] = point;
                            return { ...p, points: newPoints, d: undefined } as PathLayer;
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
    }, [getPointFromEvent, mode, draggingPointIndex, selectedPathId, setPaths, setInternalState, transformMode, transformHandle, initialPoints, transformPivot, initialAngle, initialDist, initialMousePos, shapeStartPoint, activeTool, initialFontSize, initialRotation, zoom]);

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
                symmetry: { ...symmetry },
                visible: true,
                name: `Brush ${paths.length + 1}`,
                d: smoothPath(optimizedPoints, tension, false)
            };
            setPaths(prev => [...prev, newPath]);
            setCurrentPoints([]);
            isDrawingBrushRef.current = false;
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
                symmetry: { ...symmetry },
                visible: true,
                name: `${activeTool.charAt(0).toUpperCase() + activeTool.slice(1)} ${paths.length + 1}`,
                d: smoothPath(currentPoints, tension, true)
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
    }, [mode, shapeStartPoint, currentPoints, strokeColor, fillColor, strokeWidth, symmetry, tension, setPaths, activeTool, animation, fillOpacity, paths.length, strokeOpacity]);

    const handlePointerLeave = useCallback(() => {
        setCursorPos(null);
        setDraggingPointIndex(null);
        setTransformMode('none');
        setTransformHandle(null);
        setInitialPoints(null);
        isDraggingRef.current = false;
        setShapeStartPoint(null);
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
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setIsSpacePressed(false);
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
        if (mode !== 'edit' || !selectedPathId) return;

        const path = paths.find(p => p.id === selectedPathId);
        if (!path) return;

        if (path.type === 'text') {
            const newText = prompt('Edit text:', path.text);
            if (newText !== null && newText !== path.text) {
                setPaths(prev => prev.map(p => p.id === selectedPathId ? { ...p, text: newText, name: `Text: ${newText.substring(0, 10)}...` } : p));
            }
            return;
        }

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
    }, [mode, selectedPathId, paths, getPointFromEvent, setPaths]);

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
    }, [currentPoints, paths, setPaths, symmetry, strokeColor, fillColor, strokeWidth, tension, isClosed, mode, strokeOpacity, fillOpacity, animation]);

    const clearCanvas = useCallback(() => {
        setPaths([]);
        setCurrentPoints([]);
    }, [setPaths]);

    const handleAddShape = useCallback((type: 'square' | 'circle' | 'triangle' | 'star') => {
        setActiveTool(type);
        setMode('draw');
        setCurrentPoints([]);
    }, []);

    const [isInteracting, setIsInteracting] = useState(false);

    const handleAddText = useCallback((content: string) => {
        if (!content) return;

        const timestamp = Date.now();
        const centerX = canvasRef.current?.clientWidth ? canvasRef.current.clientWidth / 2 : 400;
        const centerY = canvasRef.current?.clientHeight ? canvasRef.current.clientHeight / 2 : 300;
        const initialX = centerX / 2;
        const initialY = centerY / 2;

        const newPath: PathLayer = {
            id: `text-${timestamp}`,
            type: 'text',
            text: content,
            points: [{ x: initialX, y: initialY }],
            color: strokeColor,
            fill: strokeColor,
            width: 1,
            tension: 0,
            closed: false,
            fontSize: 40,
            fontFamily: 'Inter, system-ui, sans-serif',
            visible: true,
            symmetry: { ...symmetry },
            name: `Text: ${content.substring(0, 10)}...`
        };

        setPaths(prev => [...prev, newPath]);
        setSelectedPathId(newPath.id);
        setMode('edit');
    }, [strokeColor, symmetry, setPaths]);

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
        selectedPathId,
        setSelectedPathId,
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
        isSpacePressed
    };
}

export default useDraw;
