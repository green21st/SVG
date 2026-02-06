import { useState, useRef, useCallback, useEffect } from 'react';
import type { Point, PathLayer, SymmetrySettings } from '../types';
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
    const [isClosed, setIsClosed] = useState<boolean>(false); // New State

    // Edit Mode State
    const [mode, setMode] = useState<'draw' | 'edit'>('draw');
    const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
    const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);
    const isDraggingRef = useRef(false);

    const [activeTool, setActiveTool] = useState<'pen' | 'square' | 'circle' | 'triangle' | 'star'>('pen');
    const [shapeStartPoint, setShapeStartPoint] = useState<Point | null>(null);

    const canvasRef = useRef<HTMLDivElement>(null);

    // 1. Sync settings when selectedPathId changes, with guards to prevent infinite loops
    useEffect(() => {
        if (mode === 'edit' && selectedPathId) {
            const path = paths.find(p => p.id === selectedPathId);
            if (path) {
                const newColor = path.color || '#22d3ee';
                const newFill = path.fill || 'none';
                const newWidth = path.width || 2;
                const newTension = path.tension ?? 0.5;
                const newClosed = path.closed ?? false;

                // ONLY update if actually different to avoid "Maximum update depth exceeded"
                if (strokeColor !== newColor) setStrokeColor(newColor);
                if (fillColor !== newFill) setFillColor(newFill);
                if (strokeWidth !== newWidth) setStrokeWidth(newWidth);
                if (tension !== newTension) setTension(newTension);
                if (isClosed !== newClosed) setIsClosed(newClosed);
            }
        }
    }, [selectedPathId, mode, paths, strokeColor, fillColor, strokeWidth, tension, isClosed]);

    // 2. Helper to update selected path property
    const updateSelectedPathProperty = useCallback((updater: (path: PathLayer) => PathLayer) => {
        if (mode === 'edit' && selectedPathId) {
            setPaths(prev => prev.map(p => p.id === selectedPathId ? updater(p) : p));
        }
    }, [mode, selectedPathId, setPaths]);

    // Wrap setters to support edit mode
    const setStrokeColorEnhanced = useCallback((color: string) => {
        setStrokeColor(color);
        updateSelectedPathProperty(p => ({ ...p, color }));
    }, [updateSelectedPathProperty]);

    const setFillColorEnhanced = useCallback((fill: string) => {
        setFillColor(fill);
        updateSelectedPathProperty(p => ({ ...p, fill }));
    }, [updateSelectedPathProperty]);

    const setStrokeWidthEnhanced = useCallback((width: number) => {
        setStrokeWidth(width);
        updateSelectedPathProperty(p => ({ ...p, width }));
    }, [updateSelectedPathProperty]);

    const setTensionEnhanced = useCallback((t: number) => {
        setTension(t);
        updateSelectedPathProperty(p => ({ ...p, tension: t }));
    }, [updateSelectedPathProperty]);

    const setIsClosedEnhanced = useCallback((closed: boolean) => {
        setIsClosed(closed);
        updateSelectedPathProperty(p => ({ ...p, closed }));
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

        const SNAP_THRESHOLD = 10;
        const SNAP_THRESHOLD_SQ = SNAP_THRESHOLD * SNAP_THRESHOLD;

        // 1. Point Snapping (Highest Priority)
        let closestDistSq = SNAP_THRESHOLD_SQ;
        let snapX = x;
        let snapY = y;
        let hasSnappedToPoint = false;

        // Optimized Snapping Loop: Using squared distance and skipping if there are too many paths
        if (paths.length < 100) { // Safety gate for extreme cases
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

        // Check Previous Points in Current Path (ONLY in DRAW mode)
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

        if (hasSnappedToPoint) {
            return { x: snapX, y: snapY };
        }

        // 2. Axis Snapping (Lower Priority)
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        if (symmetry.horizontal && Math.abs(x - centerX) < SNAP_THRESHOLD) {
            x = centerX;
        }
        if (symmetry.vertical && Math.abs(y - centerY) < SNAP_THRESHOLD) {
            y = centerY;
        }
        if (symmetry.center) {
            if (Math.abs(x - centerX) < SNAP_THRESHOLD) x = centerX;
            if (Math.abs(y - centerY) < SNAP_THRESHOLD) y = centerY;
        }

        return { x, y };
    }, [symmetry, paths, currentPoints, mode]);

    const handlePointerDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return;
        const point = getPointFromEvent(e);
        if (!point) return;

        if (mode === 'draw') {
            if (activeTool === 'pen') {
                setCurrentPoints(prev => [...prev, point]);
            } else {
                setShapeStartPoint(point);
                setCurrentPoints([point, point]); // Initial two points for shape
            }
        } else if (mode === 'edit') {
            if (selectedPathId) {
                const path = paths.find(p => p.id === selectedPathId);
                if (path) {
                    const HIT_RADIUS = 10;
                    const rect = canvasRef.current!.getBoundingClientRect();
                    const rx = e.clientX - rect.left;
                    const ry = e.clientY - rect.top;

                    // Support clicking on any symmetric variant
                    const { width, height } = rect;
                    const centerX = width / 2;
                    const centerY = height / 2;
                    const variants = applySymmetry(path.points, path.symmetry, centerX, centerY);

                    let clickedPointIndex = -1;

                    for (const points of variants) {
                        const idx = points.findIndex(p => {
                            return Math.sqrt(Math.pow(p.x - rx, 2) + Math.pow(p.y - ry, 2)) <= HIT_RADIUS;
                        });
                        if (idx !== -1) {
                            clickedPointIndex = idx;
                            break;
                        }
                    }

                    if (clickedPointIndex !== -1) {
                        setDraggingPointIndex(clickedPointIndex);
                        isDraggingRef.current = false; // Reset for a new drag session
                        return;
                    }
                }
            }
            setSelectedPathId(null);
        }
    }, [getPointFromEvent, mode, paths, selectedPathId]);

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
            symmetry: { ...symmetry } // Store the current symmetry settings
        };

        setPaths([...paths, newPath]);
        setCurrentPoints([]);
    }, [currentPoints, paths, setPaths, symmetry, strokeColor, fillColor, strokeWidth, tension, isClosed]);

    const [cursorPos, setCursorPos] = useState<Point | null>(null);

    const handlePointerMove = useCallback((e: React.MouseEvent) => {
        const point = getPointFromEvent(e);
        if (point) {
            setCursorPos(point);

            if (mode === 'draw' && shapeStartPoint) {
                // Generate shape points based on drag
                const dx = point.x - shapeStartPoint.x;
                const dy = point.y - shapeStartPoint.y;
                let newPoints: Point[] = [];

                switch (activeTool) {
                    case 'square':
                        newPoints = [
                            { x: shapeStartPoint.x, y: shapeStartPoint.y },
                            { x: point.x, y: shapeStartPoint.y },
                            { x: point.x, y: point.y },
                            { x: shapeStartPoint.x, y: point.y }
                        ];
                        break;
                    case 'circle': {
                        const r = Math.sqrt(dx * dx + dy * dy);
                        for (let i = 0; i < 16; i++) {
                            const angle = (i / 16) * Math.PI * 2;
                            newPoints.push({
                                x: shapeStartPoint.x + Math.cos(angle) * r,
                                y: shapeStartPoint.y + Math.sin(angle) * r
                            });
                        }
                        break;
                    }
                    case 'triangle':
                        newPoints = [
                            { x: shapeStartPoint.x + dx / 2, y: shapeStartPoint.y },
                            { x: point.x, y: point.y },
                            { x: shapeStartPoint.x, y: point.y }
                        ];
                        break;
                    case 'star': {
                        const r = Math.sqrt(dx * dx + dy * dy);
                        for (let i = 0; i < 10; i++) {
                            const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
                            const currentR = i % 2 === 0 ? r : r * 0.4;
                            newPoints.push({
                                x: shapeStartPoint.x + Math.cos(angle) * currentR,
                                y: shapeStartPoint.y + Math.sin(angle) * currentR
                            });
                        }
                        break;
                    }
                }
                setCurrentPoints(newPoints);
            } else if (mode === 'edit' && draggingPointIndex !== null && selectedPathId) {
                const updateFn = (prev: PathLayer[]) => prev.map(p => {
                    if (p.id === selectedPathId) {
                        const newPoints = [...p.points];
                        newPoints[draggingPointIndex] = point;
                        return { ...p, points: newPoints };
                    }
                    return p;
                });

                if (!isDraggingRef.current) {
                    // First move in a drag session: use setState to create a history entry
                    setPaths(updateFn);
                    isDraggingRef.current = true;
                } else {
                    // Subsequent moves: use setInternalState to update in-place
                    setInternalState(updateFn);
                }
            }
        }
    }, [getPointFromEvent, mode, draggingPointIndex, selectedPathId, setPaths, setInternalState]);

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
                symmetry: { ...symmetry }
            };
            setPaths(prev => [...prev, newPath]);
            setCurrentPoints([]);
            setShapeStartPoint(null);
            // Optionally switch back to pen or keep tool
        }

        setCursorPos(null);
        setDraggingPointIndex(null);
        isDraggingRef.current = false;
        setShapeStartPoint(null);
    }, [mode, shapeStartPoint, currentPoints, activeTool, strokeColor, fillColor, strokeWidth, symmetry, tension, setPaths]);

    const handlePointerLeave = useCallback(() => {
        setCursorPos(null);
        setDraggingPointIndex(null);
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
                let minDist = 20; // Threshold to be "near" the curve to add a point

                // 1. Check all regular segments
                for (let i = 0; i < newPoints.length - 1; i++) {
                    const d = distToSegment(point, newPoints[i], newPoints[i + 1]);
                    if (d < minDist) {
                        minDist = d;
                        bestIdx = i + 1;
                    }
                }

                // 2. Check closing segment if path is closed
                if (path.closed && newPoints.length > 2) {
                    const d = distToSegment(point, newPoints[newPoints.length - 1], newPoints[0]);
                    if (d < minDist) {
                        minDist = d;
                        bestIdx = newPoints.length; // Append at the end (before closing)
                    }
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
        isDragging: draggingPointIndex !== null
    };
}

export default useDraw;
