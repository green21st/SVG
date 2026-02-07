export interface Point {
    x: number;
    y: number;
}

// Convert a set of points to a Catmull-Rom spline path
// k is tension: 1 is standard, 0 is sharp
export const smoothPath = (points: Point[], k: number = 1, closed: boolean = false): string => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    // If only 2 points, just draw a line
    if (points.length === 2 && !closed) {
        return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
    }

    const pts = [...points];

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
        let d = `M ${points[0].x} ${points[0].y}`;

        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i - 1] || points[i];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[i + 2] || p2;

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

export interface SymmetryVariant {
    points: Point[];
    type: 'I' | 'H' | 'V' | 'C';
}

export const applySymmetry = (
    points: Point[],
    settings: SymmetrySettings,
    centerX: number,
    centerY: number
): SymmetryVariant[] => {
    const flipH = (p: Point) => ({ x: centerX + (centerX - p.x), y: p.y });
    const flipV = (p: Point) => ({ x: p.x, y: centerY + (centerY - p.y) });
    const flipC = (p: Point) => ({ x: centerX + (centerX - p.x), y: centerY + (centerY - p.y) });

    const activeH = settings.horizontal || (settings.vertical && settings.center);
    const activeV = settings.vertical || (settings.horizontal && settings.center);
    const activeC = settings.center || (settings.horizontal && settings.vertical);

    const variants: SymmetryVariant[] = [];

    variants.push({ points: [...points], type: 'I' });
    if (activeH) variants.push({ points: points.map(flipH), type: 'H' });
    if (activeV) variants.push({ points: points.map(flipV), type: 'V' });
    if (activeC) variants.push({ points: points.map(flipC), type: 'C' });

    return variants;
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

    let viewBox = svgEl.getAttribute('viewBox')?.split(/[\s,]+/).map(parseFloat);
    const svgW = parseFloat(svgEl.getAttribute('width') || '0') || (viewBox ? viewBox[2] : 800);
    const svgH = parseFloat(svgEl.getAttribute('height') || '0') || (viewBox ? viewBox[3] : 600);

    if (!viewBox) viewBox = [0, 0, svgW, svgH];

    const targetW = 800;
    const targetH = 600;

    const isNative = viewBox[0] === 0 && viewBox[1] === 0 && viewBox[2] === 800 && viewBox[3] === 600;

    const scale = isNative ? 1 : Math.min(targetW / viewBox[2], targetH / viewBox[3]) * 0.9;
    const offsetX = isNative ? 0 : (targetW - viewBox[2] * scale) / 2 - viewBox[0] * scale;
    const offsetY = isNative ? 0 : (targetH - viewBox[3] * scale) / 2 - viewBox[1] * scale;

    const newPaths: PathLayer[] = [];

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
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 16) {
            points.push(transform(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
        }

        newPaths.push({
            id: `imported-circle-${Date.now()}-${i}`,
            points,
            color: el.getAttribute('stroke') || '#ffffff',
            fill: el.getAttribute('fill') || 'none',
            width: parseInt(el.getAttribute('stroke-width') || '2'),
            tension: 1,
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
        let lastCPX = 0, lastCPY = 0; // Previous control point for shorthand bezier
        let points: Point[] = [];

        const finishPath = () => {
            if (points.length > 0) {
                const cleanedPoints = points.filter((p, idx, self) => {
                    if (idx === 0) return true;
                    const prev = self[idx - 1];
                    return Math.abs(p.x - prev.x) > 0.01 || Math.abs(p.y - prev.y) > 0.01;
                });

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
                        tension: 0.8,
                        closed: d.toLowerCase().includes('z'),
                        symmetry: { horizontal: false, vertical: false, center: false }
                    });
                }
                points = [];
            }
        };

        const tokens = d.match(/[a-df-z]|[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/gi) || [];
        let cmd = '';
        let prevCmd = '';

        for (let j = 0; j < tokens.length; j++) {
            const t = tokens[j];
            if (/[a-z]/i.test(t)) {
                if (t.toLowerCase() === 'm' && points.length > 0) finishPath();
                prevCmd = cmd;
                cmd = t;
                if (cmd.toLowerCase() === 'z') {
                    finishPath();
                }
                continue;
            }

            const val = parseFloat(t);
            switch (cmd) {
                case 'M': curX = val; curY = parseFloat(tokens[++j]); lastCPX = curX; lastCPY = curY; break;
                case 'm': curX += val; curY += parseFloat(tokens[++j]); lastCPX = curX; lastCPY = curY; break;
                case 'L': curX = val; curY = parseFloat(tokens[++j]); lastCPX = curX; lastCPY = curY; break;
                case 'l': curX += val; curY += parseFloat(tokens[++j]); lastCPX = curX; lastCPY = curY; break;
                case 'H': curX = val; lastCPX = curX; break;
                case 'h': curX += val; lastCPX = curX; break;
                case 'V': curY = val; lastCPY = curY; break;
                case 'v': curY += val; lastCPY = curY; break;
                case 'C':
                case 'c': {
                    const isRel = cmd === 'c';
                    const x1 = isRel ? curX + parseFloat(tokens[j]) : parseFloat(tokens[j]);
                    const y1 = isRel ? curY + parseFloat(tokens[++j]) : parseFloat(tokens[++j]);
                    const x2 = isRel ? curX + parseFloat(tokens[++j]) : parseFloat(tokens[++j]);
                    const y2 = isRel ? curY + parseFloat(tokens[++j]) : parseFloat(tokens[++j]);
                    const x = isRel ? curX + parseFloat(tokens[++j]) : parseFloat(tokens[++j]);
                    const y = isRel ? curY + parseFloat(tokens[++j]) : parseFloat(tokens[++j]);

                    for (let step = 1; step < 7; step++) {
                        const t = step / 7;
                        const mt = 1 - t;
                        const bx = mt * mt * mt * curX + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x;
                        const by = mt * mt * mt * curY + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y;
                        points.push(transform(bx, by));
                    }
                    lastCPX = x2; lastCPY = y2;
                    curX = x; curY = y;
                    break;
                }
                case 'S':
                case 's': {
                    const isRel = cmd === 's';
                    const x2 = isRel ? curX + parseFloat(tokens[j]) : parseFloat(tokens[j]);
                    const y2 = isRel ? curY + parseFloat(tokens[++j]) : parseFloat(tokens[++j]);
                    const x = isRel ? curX + parseFloat(tokens[++j]) : parseFloat(tokens[++j]);
                    const y = isRel ? curY + parseFloat(tokens[++j]) : parseFloat(tokens[++j]);

                    let x1, y1;
                    if (/[cs]/i.test(prevCmd)) {
                        x1 = 2 * curX - lastCPX;
                        y1 = 2 * curY - lastCPY;
                    } else {
                        x1 = curX; y1 = curY;
                    }

                    for (let step = 1; step < 7; step++) {
                        const t = step / 7;
                        const mt = 1 - t;
                        const bx = mt * mt * mt * curX + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x;
                        const by = mt * mt * mt * curY + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y;
                        points.push(transform(bx, by));
                    }
                    lastCPX = x2; lastCPY = y2;
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

                    for (let step = 1; step < 5; step++) {
                        const t = step / 5;
                        const mt = 1 - t;
                        const bx = mt * mt * curX + 2 * mt * t * x1 + t * t * x;
                        const by = mt * mt * curY + 2 * mt * t * y1 + t * t * y;
                        points.push(transform(bx, by));
                    }
                    lastCPX = x1; lastCPY = y1;
                    curX = x; curY = y;
                    break;
                }
                case 'T':
                case 't': {
                    const isRel = cmd === 't';
                    const x = isRel ? curX + parseFloat(tokens[j]) : parseFloat(tokens[j]);
                    const y = isRel ? curY + parseFloat(tokens[++j]) : parseFloat(tokens[++j]);

                    let x1, y1;
                    if (/[qt]/i.test(prevCmd)) {
                        x1 = 2 * curX - lastCPX;
                        y1 = 2 * curY - lastCPY;
                    } else {
                        x1 = curX; y1 = curY;
                    }

                    for (let step = 1; step < 5; step++) {
                        const t = step / 5;
                        const mt = 1 - t;
                        const bx = mt * mt * curX + 2 * mt * t * x1 + t * t * x;
                        const by = mt * mt * curY + 2 * mt * t * y1 + t * t * y;
                        points.push(transform(bx, by));
                    }
                    lastCPX = x1; lastCPY = y1;
                    curX = x; curY = y;
                    break;
                }
                case 'A':
                case 'a': {
                    const isRel = cmd === 'a';
                    let rx = Math.abs(parseFloat(tokens[j]));
                    let ry = Math.abs(parseFloat(tokens[++j]));
                    const xAxisRotation = (parseFloat(tokens[++j]) * Math.PI) / 180;
                    const largeArcFlag = parseFloat(tokens[++j]);
                    const sweepFlag = parseFloat(tokens[++j]);
                    const x = isRel ? curX + parseFloat(tokens[++j]) : parseFloat(tokens[++j]);
                    const y = isRel ? curY + parseFloat(tokens[++j]) : parseFloat(tokens[++j]);

                    if (curX === x && curY === y) break;
                    if (rx === 0 || ry === 0) {
                        points.push(transform(x, y));
                        curX = x; curY = y;
                        lastCPX = curX; lastCPY = curY;
                        break;
                    }

                    const cosPhi = Math.cos(xAxisRotation);
                    const sinPhi = Math.sin(xAxisRotation);
                    const x1p = (cosPhi * (curX - x)) / 2 + (sinPhi * (curY - y)) / 2;
                    const y1p = (-sinPhi * (curX - x)) / 2 + (cosPhi * (curY - y)) / 2;

                    let lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
                    if (lambda > 1) {
                        rx *= Math.sqrt(lambda);
                        ry *= Math.sqrt(lambda);
                    }

                    const rx2 = rx * rx, ry2 = ry * ry;
                    const x1p2 = x1p * x1p, y1p2 = y1p * y1p;

                    let sign = (largeArcFlag === sweepFlag ? -1 : 1);
                    let cScale = Math.sqrt(Math.max(0, (rx2 * ry2 - rx2 * y1p2 - ry2 * x1p2) / (rx2 * y1p2 + ry2 * x1p2)));
                    let cxp = sign * cScale * (rx * y1p) / ry;
                    let cyp = sign * cScale * -(ry * x1p) / rx;

                    let cx = cosPhi * cxp - sinPhi * cyp + (curX + x) / 2;
                    let cy = sinPhi * cxp + cosPhi * cyp + (curY + y) / 2;

                    const vectorAngle = (ux: number, uy: number, vx: number, vy: number) => {
                        const sign = (ux * vy - uy * vx < 0 ? -1 : 1);
                        const dot = ux * vx + uy * vy;
                        const magU = Math.sqrt(ux * ux + uy * uy);
                        const magV = Math.sqrt(vx * vx + vy * vy);
                        return sign * Math.acos(Math.max(-1, Math.min(1, dot / (magU * magV))));
                    };

                    let theta1 = vectorAngle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
                    let dTheta = vectorAngle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);

                    if (sweepFlag === 0 && dTheta > 0) dTheta -= 2 * Math.PI;
                    if (sweepFlag === 1 && dTheta < 0) dTheta += 2 * Math.PI;

                    const samples = 12;
                    for (let s = 1; s <= samples; s++) {
                        const angle = theta1 + dTheta * (s / (samples + 1));
                        const sxp = rx * Math.cos(angle);
                        const syp = ry * Math.sin(angle);
                        const px = cosPhi * sxp - sinPhi * syp + cx;
                        const py = sinPhi * sxp + cosPhi * syp + cy;
                        points.push(transform(px, py));
                    }

                    curX = x; curY = y;
                    lastCPX = curX; lastCPY = curY;
                    break;
                }
            }
            if (!/[cqst]/i.test(cmd)) {
                lastCPX = curX; lastCPY = curY;
            }
            points.push(transform(curX, curY));
        }
        finishPath();
    });

    return newPaths;
};
// Ramer-Douglas-Peucker algorithm to simplify path
export const simplifyPath = (points: Point[], tolerance: number = 1): Point[] => {
    if (points.length <= 2) return points;

    let maxDist = 0;
    let index = 0;

    for (let i = 1; i < points.length - 1; i++) {
        const d = distToSegment(points[i], points[0], points[points.length - 1]);
        if (d > maxDist) {
            maxDist = d;
            index = i;
        }
    }

    if (maxDist > tolerance) {
        const left = simplifyPath(points.slice(0, index + 1), tolerance);
        const right = simplifyPath(points.slice(index), tolerance);
        return [...left.slice(0, left.length - 1), ...right];
    } else {
        return [points[0], points[points.length - 1]];
    }
};
