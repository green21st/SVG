export interface Point {
    x: number;
    y: number;
}

// Convert a set of points to a Catmull-Rom spline path
// k is tension: 1 is standard, 0 is sharp
// Convert a set of points to a Catmull-Rom spline path
// k is tension: 1 is standard, 0 is sharp
export const smoothPath = (points: Point[], k: number = 1, closed: boolean = false): string => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    // If only 2 points, just draw a line (unless closed, then line back? no, 2 pts closed is flat)
    if (points.length === 2 && !closed) {
        return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
    }

    // Prepare points array for loop
    const pts = [...points];
    if (closed) {
        // If closed, we wrap around.
        // We effectively simulate p[-1] as p[last], and we go up to p[last] connecting to p[0]
        // But the loop below logic assumes p0, p1, p2, p3 where p1->p2 is drawn.
        // For a closed loop of N points (0..N-1):
        // Segments: 0->1, 1->2, ..., (N-2)->(N-1), (N-1)->0.
        // Total N segments.
        // We can just append the first few points to the end to let the generic loop handle it, 
        // or rewrite logic. The generic loop is simple.
        // Loop runs for points.length - 1 times normally.

        // Let's use a robust approach for closed loop Catmull-Rom.
        // We need D for start M..
        // Then loop through each point as a start point of a segment.
    }

    if (closed) {
        let d = `M ${pts[0].x} ${pts[0].y}`;
        const n = pts.length;
        for (let i = 0; i < n; i++) {
            const p0 = pts[(i - 1 + n) % n];
            const p1 = pts[i];
            const p2 = pts[(i + 1) % n];
            const p3 = pts[(i + 2) % n];

            const cp1x = p1.x + (p2.x - p0.x) / 6 * k;
            const cp1y = p1.y + (p2.y - p0.y) / 6 * k;

            const cp2x = p2.x - (p3.x - p1.x) / 6 * k;
            const cp2y = p2.y - (p3.y - p1.y) / 6 * k;

            d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
        }
        d += ' Z';
        return d;
    } else {
        // Open logic
        let d = `M ${points[0].x} ${points[0].y}`;

        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i - 1] || points[i];
            const p1 = points[i];
            const p2 = points[i + 1] || points[i + 1]; // Handle end: duplicate last
            const p3 = points[i + 2] || p2; // Handle end

            // Note: classic Catmull-Rom for open curve ends usually involves duplicating end points or reflection.
            // Using clamp here.

            const cp1x = p1.x + (p2.x - p0.x) / 6 * k;
            const cp1y = p1.y + (p2.y - p0.y) / 6 * k;

            const cp2x = p2.x - (p3.x - p1.x) / 6 * k;
            const cp2y = p2.y - (p3.y - p1.y) / 6 * k;

            d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
        }
        return d;
    }
};

// Generate SVG path data for a polyline (raw input)
export const getPolylinePath = (points: Point[]): string => {
    if (points.length === 0) return '';
    return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
};

import type { SymmetrySettings } from '../types';

export const applySymmetry = (
    points: Point[],
    settings: SymmetrySettings,
    centerX: number,
    centerY: number
): Point[][] => {
    // Transformations
    const flipH = (p: Point) => ({ x: centerX + (centerX - p.x), y: p.y });
    const flipV = (p: Point) => ({ x: p.x, y: centerY + (centerY - p.y) });
    const flipC = (p: Point) => ({ x: centerX + (centerX - p.x), y: centerY + (centerY - p.y) });

    // Generate set of transformation functions to apply
    // We compute the closure of the group actions.
    // For D2 (Klein four-group subset), we have I, H, V, C.
    // H*V = C. H*C = V. V*C = H.

    // We can just check which fundamental symmetries are reachable.
    const hasH = settings.horizontal;
    const hasV = settings.vertical;
    const hasC = settings.center;

    // Determine implied symmetries
    // If H and V, then C is implied.
    // If H and C, then V is implied.
    // If V and C, then H is implied.
    const activeH = hasH || (hasV && hasC);
    const activeV = hasV || (hasH && hasC);
    const activeC = hasC || (hasH && hasV);

    const variants: { [key: string]: Point[] } = {};

    // Helper to add variant
    const add = (pts: Point[], key: string) => {
        if (!variants[key]) variants[key] = pts;
    };

    // 0. Identity
    add(points, 'I');

    // 1. Horizontal
    if (activeH) add(points.map(flipH), 'H');

    // 2. Vertical
    if (activeV) add(points.map(flipV), 'V');

    // 3. Center
    if (activeC) add(points.map(flipC), 'C');

    return Object.values(variants);
};

// Calculate distance from point p to segment p1-p2
export const distToSegment = (p: Point, p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const l2 = dx * dx + dy * dy;

    if (l2 === 0) return Math.sqrt((p.x - p1.x) ** 2 + (p.y - p1.y) ** 2);

    let t = ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / l2;
    t = Math.max(0, Math.min(1, t));

    return Math.sqrt((p.x - (p1.x + t * dx)) ** 2 + (p.y - (p1.y + t * dy)) ** 2);
};

// Enhanced SVG Parser
import type { PathLayer } from '../types';

export const parseSVGToPaths = (svgString: string): PathLayer[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');
    if (!svgEl) return [];

    // 1. Calculate Scaling
    let viewBox = svgEl.getAttribute('viewBox')?.split(/[\s,]+/).map(parseFloat);
    const svgW = parseFloat(svgEl.getAttribute('width') || '0') || (viewBox ? viewBox[2] : 800);
    const svgH = parseFloat(svgEl.getAttribute('height') || '0') || (viewBox ? viewBox[3] : 600);

    if (!viewBox) viewBox = [0, 0, svgW, svgH];

    const targetW = 800;
    const targetH = 600;

    // IMPORTANT: If this is our own SVG, do NOT re-scale or it will shrink every time
    const isNative = viewBox[0] === 0 && viewBox[1] === 0 && viewBox[2] === 800 && viewBox[3] === 600;

    const scale = isNative ? 1 : Math.min(targetW / viewBox[2], targetH / viewBox[3]) * 0.9;
    const offsetX = isNative ? 0 : (targetW - viewBox[2] * scale) / 2 - viewBox[0] * scale;
    const offsetY = isNative ? 0 : (targetH - viewBox[3] * scale) / 2 - viewBox[1] * scale;

    const newPaths: PathLayer[] = [];

    // Helper to process points
    const transform = (x: number, y: number) => ({
        x: x * scale + offsetX,
        y: y * scale + offsetY
    });

    // 2. Process Circles
    doc.querySelectorAll('circle').forEach((el, i) => {
        const cx = parseFloat(el.getAttribute('cx') || '0');
        const cy = parseFloat(el.getAttribute('cy') || '0');
        const r = parseFloat(el.getAttribute('r') || '0');

        const points = [];
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            points.push(transform(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
        }

        newPaths.push({
            id: `imported-circle-${Date.now()}-${i}`,
            points,
            color: el.getAttribute('stroke') || '#ffffff',
            fill: el.getAttribute('fill') || 'none',
            width: parseInt(el.getAttribute('stroke-width') || '2'),
            tension: 0,
            closed: true,
            symmetry: { horizontal: false, vertical: false, center: false }
        });
    });

    // 3. Robust Path Parser
    doc.querySelectorAll('path').forEach((el, i) => {
        const d = el.getAttribute('d') || '';
        const color = el.getAttribute('stroke') || '#ffffff';
        const fill = el.getAttribute('fill') || 'none';
        const width = parseInt(el.getAttribute('stroke-width') || '2');

        let curX = 0, curY = 0;
        let points: Point[] = [];

        const finishPath = () => {
            if (points.length > 0) {
                newPaths.push({
                    id: `imported-path-${Date.now()}-${i}-${newPaths.length}`,
                    points: [...points],
                    color,
                    fill,
                    width,
                    tension: 0,
                    closed: d.toLowerCase().includes('z'),
                    symmetry: { horizontal: false, vertical: false, center: false }
                });
                points = [];
            }
        };

        const tokens = d.match(/[a-df-z]|[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/gi) || [];
        let cmd = '';

        for (let j = 0; j < tokens.length; j++) {
            const t = tokens[j];
            if (/[a-z]/i.test(t)) {
                if (t.toLowerCase() === 'm' && points.length > 0) finishPath();
                cmd = t;
                if (cmd.toLowerCase() === 'z') {
                    if (points.length > 0) points.push({ ...points[0] });
                    finishPath();
                }
                continue;
            }

            const val = parseFloat(t);
            switch (cmd) {
                case 'M': case 'L': curX = val; curY = parseFloat(tokens[++j]); break;
                case 'm': case 'l': curX += val; curY += parseFloat(tokens[++j]); break;
                case 'H': curX = val; break;
                case 'h': curX += val; break;
                case 'V': curY = val; break;
                case 'v': curY += val; break;
                case 'C':
                    // CRITICAL: Stop sampling mid-points for C commands to prevent point bloat and freezing.
                    // The end-point of a C command in our app is exactly the original vertex.
                    j += 4;
                    curX = parseFloat(tokens[j]); curY = parseFloat(tokens[++j]);
                    break;
                case 'c':
                    j += 4;
                    curX += parseFloat(tokens[j]); curY += parseFloat(tokens[++j]);
                    break;
                case 'A':
                case 'a': {
                    const rx = val;
                    j += 3;
                    const sweep = parseFloat(tokens[j]);
                    const endX = cmd === 'A' ? parseFloat(tokens[++j]) : curX + parseFloat(tokens[++j]);
                    const endY = cmd === 'A' ? parseFloat(tokens[++j]) : curY + parseFloat(tokens[++j]);

                    // Add mid-point only for arcs to maintain shape without excessive points
                    const midX = (curX + endX) / 2;
                    const midY = (curY + endY) / 2;
                    const bulge = (sweep ? 1 : -1) * rx * 0.4;
                    const dx = endX - curX; const dy = endY - curY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 0) {
                        points.push(transform(midX - (dy / dist) * bulge, midY + (dx / dist) * bulge));
                    }
                    curX = endX; curY = endY;
                    break;
                }
                case 'S': case 'Q': case 's': case 'q': {
                    const isRel = cmd.toLowerCase() === cmd;
                    const nx = parseFloat(tokens[j + 2]);
                    const ny = parseFloat(tokens[j + 3]);
                    curX = isRel ? curX + nx : nx;
                    curY = isRel ? curY + ny : ny;
                    j += 3;
                    break;
                }
            }
            points.push(transform(curX, curY));
        }
        finishPath();
    });

    return newPaths;
};
