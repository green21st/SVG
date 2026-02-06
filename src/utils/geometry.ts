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
        // High density sampling for perfect circles
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 16) {
            points.push(transform(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
        }

        newPaths.push({
            id: `imported-circle-${Date.now()}-${i}`,
            points,
            color: el.getAttribute('stroke') || '#ffffff',
            fill: el.getAttribute('fill') || 'none',
            width: parseInt(el.getAttribute('stroke-width') || '2'),
            tension: 1, // Full smoothness for circles
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
                // Remove consecutive duplicates which break Catmull-Rom tangents
                const cleanedPoints = points.filter((p, idx, self) => {
                    if (idx === 0) return true;
                    const prev = self[idx - 1];
                    return Math.abs(p.x - prev.x) > 0.01 || Math.abs(p.y - prev.y) > 0.01;
                });

                // If closed, remove the last point if it matches the first
                if (cleanedPoints.length > 2 && d.toLowerCase().includes('z')) {
                    const first = cleanedPoints[0];
                    const last = cleanedPoints[cleanedPoints.length - 1];
                    if (Math.abs(first.x - last.x) < 0.1 && Math.abs(first.y - last.y) < 0.1) {
                        cleanedPoints.pop();
                    }
                }

                if (cleanedPoints.length > 0) {
                    newPaths.push({
                        id: `imported-path-${Date.now()}-${i}-${newPaths.length}`,
                        points: cleanedPoints,
                        color,
                        fill,
                        width,
                        tension: 0.8, // Smooth enough for imported assets
                        closed: d.toLowerCase().includes('z'),
                        symmetry: { horizontal: false, vertical: false, center: false }
                    });
                }
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
                    // Don't duplicate start point as closed:true handles it
                    finishPath();
                }
                continue;
            }

            const val = parseFloat(t);
            switch (cmd) {
                case 'M': curX = val; curY = parseFloat(tokens[++j]); break;
                case 'm': curX += val; curY += parseFloat(tokens[++j]); break;
                case 'L': curX = val; curY = parseFloat(tokens[++j]); break;
                case 'l': curX += val; curY += parseFloat(tokens[++j]); break;
                case 'H': curX = val; break;
                case 'h': curX += val; break;
                case 'V': curY = val; break;
                case 'v': curY += val; break;
                case 'C':
                case 'c': {
                    const isRel = cmd === 'c';
                    const x1 = isRel ? curX + parseFloat(tokens[j]) : parseFloat(tokens[j]);
                    const y1 = isRel ? curY + parseFloat(tokens[++j]) : parseFloat(tokens[++j]);
                    const x2 = isRel ? curX + parseFloat(tokens[++j]) : parseFloat(tokens[++j]);
                    const y2 = isRel ? curY + parseFloat(tokens[++j]) : parseFloat(tokens[++j]);
                    const x = isRel ? curX + parseFloat(tokens[++j]) : parseFloat(tokens[++j]);
                    const y = isRel ? curY + parseFloat(tokens[++j]) : parseFloat(tokens[++j]);

                    // Sample 4 points along the bezier curve for high fidelity
                    for (let step = 1; step < 5; step++) {
                        const t = step / 5;
                        const mt = 1 - t;
                        const bx = mt * mt * mt * curX + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x;
                        const by = mt * mt * mt * curY + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y;
                        points.push(transform(bx, by));
                    }

                    curX = x; curY = y;
                    break;
                }
                case 'Q':
                case 'q': {
                    const isRel = cmd === 'q';
                    const x1 = isRel ? curX + parseFloat(tokens[j]) : parseFloat(tokens[j]);
                    const y1 = isRel ? curY + parseFloat(tokens[++j]) : parseFloat(tokens[++j]);
                    const x = isRel ? curX + parseFloat(tokens[++j]) : parseFloat(tokens[++j]);
                    const y = isRel ? curY + parseFloat(tokens[++j]) : parseFloat(tokens[++j]);

                    // Sample 3 intermediate points for quadratic bezier
                    for (let step = 1; step < 4; step++) {
                        const t = step / 4;
                        const mt = 1 - t;
                        const bx = mt * mt * curX + 2 * mt * t * x1 + t * t * x;
                        const by = mt * mt * curY + 2 * mt * t * y1 + t * t * y;
                        points.push(transform(bx, by));
                    }

                    curX = x; curY = y;
                    break;
                }
                case 'A':
                case 'a': {
                    const isRel = cmd === 'a';
                    const rx = val;
                    const ry = parseFloat(tokens[++j]); // Used for skipping
                    const rot = parseFloat(tokens[++j]); // Used for skipping
                    const large = parseFloat(tokens[++j]);
                    const sweep = parseFloat(tokens[++j]);
                    const x = isRel ? curX + parseFloat(tokens[++j]) : parseFloat(tokens[++j]);
                    const y = isRel ? curY + parseFloat(tokens[++j]) : parseFloat(tokens[++j]);

                    const dx = x - curX;
                    const dy = y - curY;
                    const L = Math.sqrt(dx * dx + dy * dy);

                    if (L > 0 && rx > 0) {
                        // Precise math for circular segment height (bulge)
                        // L_scaled ensures we don't have imaginary roots if chord > 2R due to float errors
                        const L_scaled = Math.min(L, 2 * rx * 0.999);
                        const h_base = rx - Math.sqrt(rx * rx - (L_scaled / 2) * (L_scaled / 2));
                        const h_max = (large ? (2 * rx - h_base) : h_base);

                        // Sample 5 points to define the arc smoothly
                        const factor = (sweep ? 1 : -1);
                        for (let s = 1; s < 6; s++) {
                            const t = s / 6;
                            const tx = curX + dx * t;
                            const ty = curY + dy * t;
                            // Sine-bulge approximation is excellent for small vertex counts
                            const h_current = h_max * Math.sin(t * Math.PI);

                            points.push(transform(
                                tx - (dy / L) * h_current * factor,
                                ty + (dx / L) * h_current * factor
                            ));
                        }
                    }

                    // Keep ry/rot in scope to avoid lint if necessary, though skipping is their main use here
                    if (ry < 0 || rot < 0) { /* dummy */ }

                    curX = x; curY = y;
                    break;
                }
                case 'S':
                case 's': {
                    // Shorthand cubic, just take endpoint as approximation
                    const isRel = cmd === 's';
                    j += 1;
                    const x = isRel ? curX + parseFloat(tokens[++j]) : parseFloat(tokens[++j]);
                    const y = isRel ? curY + parseFloat(tokens[++j]) : parseFloat(tokens[++j]);
                    curX = x; curY = y;
                    break;
                }
            }
            points.push(transform(curX, curY));
        }
        finishPath();
    });

    return newPaths;
};
