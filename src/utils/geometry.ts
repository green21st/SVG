export interface Point {
    x: number;
    y: number;
}

// Convert a set of points to a Catmull-Rom spline path
// k is tension: 1 is standard, 0 is sharp
export const smoothPath = (points: Point[] | Point[][], k: number = 1, closed: boolean = false): string => {
    if (Array.isArray(points[0]) || (points.length > 0 && Array.isArray(points[0]))) {
        const segments = points as Point[][];
        return segments.map(seg => smoothPath(seg, k, closed)).join(' ');
    }

    const pts = points as Point[];
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    // If tension is 0, return a simple polyline (straight lines)
    if (k <= 0) {
        let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
        for (let i = 1; i < pts.length; i++) {
            d += ` L ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}`;
        }
        if (closed) d += ' Z';
        return d;
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
        let d = `M ${pts[0].x} ${pts[0].y}`;

        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[i - 1] || pts[i];
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const p3 = pts[i + 2] || p2;

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
export const getPolylinePath = (points: Point[] | Point[][]): string => {
    if (points.length === 0) return '';
    if (Array.isArray(points[0])) {
        return (points as Point[][]).map(seg => getPolylinePath(seg)).join(' ');
    }
    const pts = points as Point[];
    return `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
};

import type { SymmetrySettings } from '../types';

export interface SymmetryVariant {
    points: Point[];
    multiPoints?: Point[][];
    type: 'I' | 'H' | 'V' | 'C';
}

export const applySymmetry = (
    points: Point[] | Point[][],
    settings: SymmetrySettings,
    centerX: number,
    centerY: number
): SymmetryVariant[] => {
    if (points.length > 0 && Array.isArray(points[0])) {
        const segments = points as Point[][];
        const variants: { type: 'I' | 'H' | 'V' | 'C', multiPoints: Point[][] }[] = [
            { type: 'I', multiPoints: [] },
            { type: 'H', multiPoints: [] },
            { type: 'V', multiPoints: [] },
            { type: 'C', multiPoints: [] }
        ];

        segments.forEach(seg => {
            const segVariants = applySymmetry(seg, settings, centerX, centerY);
            segVariants.forEach(sv => {
                const target = variants.find(v => v.type === sv.type);
                if (target) {
                    target.multiPoints.push(sv.points);
                }
            });
        });

        return variants.filter(v => v.multiPoints.length > 0).map(v => ({
            points: v.multiPoints.flat(),
            multiPoints: v.multiPoints,
            type: v.type
        }));
    }

    const pts = points as Point[];
    const flipH = (p: Point) => ({ x: centerX + (centerX - p.x), y: p.y });
    const flipV = (p: Point) => ({ x: p.x, y: centerY + (centerY - p.y) });
    const flipC = (p: Point) => ({ x: centerX + (centerX - p.x), y: centerY + (centerY - p.y) });

    const activeH = settings.horizontal || (settings.vertical && settings.center);
    const activeV = settings.vertical || (settings.horizontal && settings.center);
    const activeC = settings.center || (settings.horizontal && settings.vertical);

    const variants: SymmetryVariant[] = [];

    variants.push({ points: [...pts], type: 'I' });
    if (activeH) variants.push({ points: pts.map(flipH), type: 'H' });
    if (activeV) variants.push({ points: pts.map(flipV), type: 'V' });
    if (activeC) variants.push({ points: pts.map(flipC), type: 'C' });

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

    // Helper to parse transform string into matrix
    const parseTransformAttribute = (transformStr: string | null): { a: number, b: number, c: number, d: number, e: number, f: number } => {
        let matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
        if (!transformStr) return matrix;

        const transforms = transformStr.match(/[a-z]+\([^)]+\)/gi) || [];
        // Apply transforms in order
        for (const t of transforms) {
            const name = t.match(/[a-z]+/i)?.[0].toLowerCase();
            const values = t.match(/-?\d*\.?\d+(?:[eE][-+]?\d+)?/g)?.map(parseFloat) || [];

            if (name === 'translate') {
                const tx = values[0] || 0;
                const ty = values[1] || 0;
                // Multiply matrix:
                // [1 0 tx]   [a c e]   [a  c  e+tx]
                // [0 1 ty] * [b d f] = [b  d  f+ty]
                // [0 0 1 ]   [0 0 1]   [0  0  1   ]
                // Wait, SVG transform order is right-to-left for matrix multiplication column vector
                // But in attribute string "translate(...) scale(...)", translate applies first (left-to-right visual order? No).
                // "The value of the transform attribute is a <transform-list>, which is defined as a list of transform definitions that are applied in the order provided."
                // So if we have P_new = T2 * T1 * P_old
                // The current matrix represents the accumulated transform.
                // Let M be current matrix. New transform T. New M' = M * T.

                const ne = matrix.a * tx + matrix.c * ty + matrix.e;
                const nf = matrix.b * tx + matrix.d * ty + matrix.f;
                matrix.e = ne;
                matrix.f = nf;
            } else if (name === 'scale') {
                const sx = values[0] || 1;
                const sy = values[1] !== undefined ? values[1] : sx;

                matrix.a *= sx;
                matrix.b *= sx;
                matrix.c *= sy;
                matrix.d *= sy;
            } else if (name === 'rotate') {
                const angle = (values[0] || 0) * Math.PI / 180;
                const cx = values[1] || 0;
                const cy = values[2] || 0;

                // Rotate around cx, cy is: Translate(cx, cy) * Rotate(angle) * Translate(-cx, -cy)
                // We simplify to just rotate around 0,0 for now as it's complex to implement full matrix mult here correctly without a library
                // Implementing basic rotation around origin
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);

                const na = matrix.a * cos + matrix.c * sin;
                const nb = matrix.b * cos + matrix.d * sin;
                const nc = matrix.a * -sin + matrix.c * cos;
                const nd = matrix.b * -sin + matrix.d * cos;

                matrix.a = na;
                matrix.b = nb;
                matrix.c = nc;
                matrix.d = nd;

                if (cx !== 0 || cy !== 0) {
                    // TODO: Handle rotation center if needed
                }
            } else if (name === 'matrix') {
                if (values.length === 6) {
                    const [a, b, c, d, e, f] = values;
                    const na = matrix.a * a + matrix.c * b;
                    const nb = matrix.b * a + matrix.d * b;
                    const nc = matrix.a * c + matrix.c * d;
                    const nd = matrix.b * c + matrix.d * d;
                    const ne = matrix.a * e + matrix.c * f + matrix.e;
                    const nf = matrix.b * e + matrix.d * f + matrix.f;

                    matrix = { a: na, b: nb, c: nc, d: nd, e: ne, f: nf };
                }
            }
        }
        return matrix;
    };

    const isIdentity = (m: { a: number, b: number, c: number, d: number, e: number, f: number }) =>
        Math.abs(m.a - 1) < 0.001 && Math.abs(m.b) < 0.001 && Math.abs(m.c) < 0.001 &&
        Math.abs(m.d - 1) < 0.001 && Math.abs(m.e) < 0.001 && Math.abs(m.f) < 0.001;

    const getStyleAttr = (el: Element, attr: string): string | null => {
        let current: Element | null = el;
        while (current && current.tagName) {
            const inlineAttr = current.getAttribute(attr);
            if (inlineAttr) return inlineAttr;

            const style = current.getAttribute('style');
            if (style) {
                const match = style.match(new RegExp(`${attr}\\s*:\\s*([^;]+)`));
                if (match) return match[1].trim();
            }
            if (current.tagName.toLowerCase() === 'svg') break;
            current = current.parentElement;
        }
        return null;
    };

    const getAnimationSettings = (el: Element) => {
        let current: Element | null = el;
        let styleStr = '';

        // Check element and parent <g>
        while (current && current.tagName !== 'svg') {
            const s = current.getAttribute('style');
            if (s && (s.includes('animation:') || s.includes('animation-name:'))) {
                styleStr = s;
                break;
            }
            current = current.parentElement;
        }
        if (!styleStr) return undefined;

        // Extract shorthand or specific properties
        const getStyleProp = (name: string) => {
            const regex = new RegExp(`[;\\s\\{]${name}\\s*:\\s*([^;\\}]+)`, 'i');
            // Prepend a semicolon to handle the first property if it doesn't have one
            const match = (';' + styleStr).match(regex);
            return match ? match[1].trim() : undefined;
        };

        const animationShorthand = getStyleProp('animation') || getStyleProp('animation-name');

        if (!animationShorthand) return undefined;

        // Default values
        let name = '';
        let duration = 2;
        let ease = 'linear';
        let delay = 0;
        let repeatCount: number | 'infinite' = 'infinite';
        let direction: 'forward' | 'reverse' | 'alternate' = 'forward';

        let timeCount = 0;

        if (animationShorthand) {
            // Regex to split by spaces but ignore spaces inside parentheses (for cubic-bezier)
            const parts = animationShorthand.match(/(?:[^\s(]+|\([^)]*\))+/g) || [];

            parts.forEach(part => {
                const partLower = part.toLowerCase();
                if (partLower.endsWith('ms')) {
                    const val = parseFloat(partLower) / 1000;
                    if (timeCount === 0) duration = val; else if (timeCount === 1) delay = val;
                    timeCount++;
                } else if (partLower.endsWith('s')) {
                    const val = parseFloat(partLower);
                    if (timeCount === 0) duration = val; else if (timeCount === 1) delay = val;
                    timeCount++;
                } else if (['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'].includes(partLower) || partLower.startsWith('cubic-bezier')) {
                    ease = partLower;
                } else if (partLower === 'infinite') {
                    repeatCount = 'infinite';
                } else if (['normal', 'reverse', 'alternate', 'alternate-reverse'].includes(partLower)) {
                    if (partLower === 'reverse') direction = 'reverse';
                    else if (partLower === 'alternate') direction = 'alternate';
                    else direction = 'forward';
                } else if (!isNaN(parseInt(part)) && !part.includes('(') && !part.includes(')')) {
                    repeatCount = parseInt(part);
                } else if (part.endsWith('Path')) {
                    name = part.replace('Path', '');
                } else if (name === '' && !part.startsWith('--')) {
                    name = part;
                }
            });
        }

        // Overwrite with specific properties if they exist
        const durProp = getStyleProp('animation-duration');
        if (durProp) duration = parseFloat(durProp);
        const easeProp = getStyleProp('animation-timing-function');
        if (easeProp) ease = easeProp;
        const delayProp = getStyleProp('animation-delay');
        if (delayProp) delay = parseFloat(delayProp);
        const iterProp = getStyleProp('animation-iteration-count');
        if (iterProp) repeatCount = iterProp === 'infinite' ? 'infinite' : parseInt(iterProp);
        const dirProp = getStyleProp('animation-direction');
        if (dirProp) {
            if (dirProp === 'reverse') direction = 'reverse';
            else if (dirProp === 'alternate') direction = 'alternate';
        }

        const validTypes = ['draw', 'pulse', 'float', 'spin', 'bounce', 'glow', 'shake', 'swing', 'tada'];
        if (!validTypes.includes(name)) return undefined;

        // Extract custom variables for amplitude and degree
        let degree: number | undefined = undefined;
        let amplitude: number | undefined = undefined;

        const spinDeg = getStyleProp('--spin-degree');
        const swingDeg = getStyleProp('--swing-degree');
        if (spinDeg) degree = parseFloat(spinDeg);
        if (swingDeg) degree = parseFloat(swingDeg);

        const bounceAmp = getStyleProp('--bounce-amp');
        if (bounceAmp) amplitude = parseFloat(bounceAmp) * 100;
        const shakeDist = getStyleProp('--shake-dist');
        if (shakeDist) amplitude = parseFloat(shakeDist);
        const floatDist = getStyleProp('--float-dist');
        if (floatDist) amplitude = Math.abs(parseFloat(floatDist));

        const isInfinite = repeatCount === 'infinite' || repeatCount === -1;

        return {
            entries: [{
                id: `anim-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                type: name as any,
                duration,
                delay,
                ease,
                direction,
                repeat: !isInfinite,
                repeatCount: isInfinite ? -1 : (typeof repeatCount === 'number' ? repeatCount : 1),
                degree,
                amplitude
            }]
        };
    };

    const getElementTransform = (el: Element): { a: number, b: number, c: number, d: number, e: number, f: number } => {
        let matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
        let current: Element | null = el;
        const transforms = [];

        // Collect transforms from leaf to root (but apply root to leaf order for point transformation? 
        // No, parent transform applies to result of child transform.
        // P_final = M_parent * M_child * P
        // So we need to multiply matrices from parent to child.

        while (current && current.tagName !== 'svg') {
            const t = current.getAttribute('transform');
            if (t) transforms.unshift(t); // Add to beginning

            // Also check for style-based transform
            const s = current.getAttribute('style');
            if (s) {
                const styleTransform = s.match(/transform:\s*([^;]+)/i);
                if (styleTransform) {
                    transforms.unshift(styleTransform[1].trim());
                }
            }

            current = current.parentElement;
        }

        for (const t of transforms) {
            const m = parseTransformAttribute(t);
            // Multiply current accumulated matrix by this new matrix
            // M_acc = M_acc * M_new
            // [A C E]   [a c e]
            // [B D F] * [b d f]
            // [0 0 1]   [0 0 1]

            const na = matrix.a * m.a + matrix.c * m.b;
            const nb = matrix.b * m.a + matrix.d * m.b;
            const nc = matrix.a * m.c + matrix.c * m.d;
            const nd = matrix.b * m.c + matrix.d * m.d;
            const ne = matrix.a * m.e + matrix.c * m.f + matrix.e;
            const nf = matrix.b * m.e + matrix.d * m.f + matrix.f;

            matrix = { a: na, b: nb, c: nc, d: nd, e: ne, f: nf };
        }

        return matrix;
    };

    const transform = (x: number, y: number, elementMatrix?: { a: number, b: number, c: number, d: number, e: number, f: number }) => {
        let tx = x;
        let ty = y;

        if (elementMatrix) {
            tx = elementMatrix.a * x + elementMatrix.c * y + elementMatrix.e;
            ty = elementMatrix.b * x + elementMatrix.d * y + elementMatrix.f;
        }

        return {
            x: tx * scale + offsetX,
            y: ty * scale + offsetY
        };
    };

    const getPivotData = (el: Element): { x: number, y: number, rotation: number, scale: number, px: number, py: number } | undefined => {
        let current: Element | null = el;
        while (current && current.tagName !== 'svg') {
            const s = current.getAttribute('style');
            if (s) {
                const match = s.match(/transform-origin:\s*calc\(50%\s*\+\s*(-?\d*\.?\d+)px\)\s*calc\(50%\s*\+\s*(-?\d*\.?\d+)px\)/i);
                if (match) {
                    return {
                        x: 0, y: 0, rotation: 0, scale: 1,
                        px: parseFloat(match[1]) * scale,
                        py: parseFloat(match[2]) * scale
                    };
                }
                if (s.toLowerCase().includes('transform-origin: center')) {
                    return { x: 0, y: 0, rotation: 0, scale: 1, px: 0, py: 0 };
                }
            }
            current = current.parentElement;
        }
        return undefined;
    };

    // 2. Process Circles
    doc.querySelectorAll('circle').forEach((el, i) => {
        const cx = parseFloat(el.getAttribute('cx') || '0');
        const cy = parseFloat(el.getAttribute('cy') || '0');
        const r = parseFloat(el.getAttribute('r') || '0');

        const elementMatrix = getElementTransform(el);

        const points = [];
        // Increased sampling for circles to 64 points for smoothness with tension 0
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 32) {
            points.push(transform(cx + Math.cos(a) * r, cy + Math.sin(a) * r, elementMatrix));
        }

        const strokeAttr = getStyleAttr(el, 'stroke');
        const fillAttr = getStyleAttr(el, 'fill');
        const widthAttr = getStyleAttr(el, 'stroke-width');

        const hasFill = fillAttr && fillAttr !== 'none';
        const hasStroke = strokeAttr && strokeAttr !== 'none';

        let color = strokeAttr || 'none';
        let fill = fillAttr || '#000000';
        let width = widthAttr ? parseFloat(widthAttr) : (hasStroke ? 2 : 0);

        if (!hasFill && !hasStroke) {
            fill = '#000000';
            color = 'none';
            width = 0;
        }

        newPaths.push({
            id: `imported-circle-${Date.now()}-${i}`,
            points,
            color,
            fill,
            width,
            tension: 0,
            closed: true,
            symmetry: { horizontal: false, vertical: false, center: false },
            animation: getAnimationSettings(el),
            filter: getStyleAttr(el, 'filter') || el.getAttribute('filter') || undefined,
            transform: getPivotData(el),
            keyframes: []
        });
    });

    // 3. Robust Path Parser
    doc.querySelectorAll('path').forEach((el, i) => {
        const d = el.getAttribute('d') || '';
        const elementMatrix = getElementTransform(el);
        const hasTransform = !isIdentity(elementMatrix);
        const strokeAttr = getStyleAttr(el, 'stroke');
        const fillAttr = getStyleAttr(el, 'fill');
        const widthAttr = getStyleAttr(el, 'stroke-width');

        const hasFill = fillAttr && fillAttr !== 'none';
        const hasStroke = strokeAttr && strokeAttr !== 'none';

        let color = strokeAttr || 'none';
        let fill = fillAttr || '#000000';
        let width = widthAttr ? parseFloat(widthAttr) : (hasStroke ? 2 : 0);

        if (!hasFill && !hasStroke) {
            fill = '#000000';
            color = 'none';
            width = 0;
        }

        let curX = 0, curY = 0;
        let lastCPX = 0, lastCPY = 0; // Previous control point for shorthand bezier
        let points: Point[] = [];
        let subpaths: Point[][] = [];

        const finishSubpath = () => {
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
                    subpaths.push(cleanedPoints);
                }
                points = [];
            }
        };

        const finishPath = () => {
            finishSubpath();
            if (subpaths.length > 0) {
                const mainPoints = subpaths[0];
                newPaths.push({
                    id: `imported-path-${Date.now()}-${i}-${newPaths.length}`,
                    points: mainPoints,
                    multiPathPoints: subpaths.length > 1 ? subpaths : undefined,
                    color,
                    fill,
                    width,
                    tension: 0,
                    closed: d.toLowerCase().includes('z'),
                    symmetry: { horizontal: false, vertical: false, center: false },
                    animation: getAnimationSettings(el),
                    filter: getStyleAttr(el, 'filter') || el.getAttribute('filter') || undefined,
                    transform: getPivotData(el),
                    keyframes: [],
                    d: hasTransform ? undefined : d,
                    importedScale: scale,
                    importedOffsetX: offsetX,
                    importedOffsetY: offsetY
                });
            }
        };

        const tokens = d.match(/[a-df-z]|[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/gi) || [];
        let cmd = '';
        let prevCmd = '';

        for (let j = 0; j < tokens.length; j++) {
            const t = tokens[j];
            if (/[a-z]/i.test(t)) {
                if (t.toLowerCase() === 'm' && points.length > 0) finishSubpath();
                prevCmd = cmd;
                cmd = t;

                if (cmd.toLowerCase() === 'z') {
                    finishSubpath();
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

                    // High density sampling (16 steps)
                    for (let step = 1; step < 16; step++) {
                        const t = step / 16;
                        const mt = 1 - t;
                        const bx = mt * mt * mt * curX + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x;
                        const by = mt * mt * mt * curY + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y;
                        points.push(transform(bx, by, elementMatrix));
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

                    for (let step = 1; step < 16; step++) {
                        const t = step / 16;
                        const mt = 1 - t;
                        const bx = mt * mt * mt * curX + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x;
                        const by = mt * mt * mt * curY + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y;
                        points.push(transform(bx, by, elementMatrix));
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

                    for (let step = 1; step < 10; step++) {
                        const t = step / 10;
                        const mt = 1 - t;
                        const bx = mt * mt * curX + 2 * mt * t * x1 + t * t * x;
                        const by = mt * mt * curY + 2 * mt * t * y1 + t * t * y;
                        points.push(transform(bx, by, elementMatrix));
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

                    for (let step = 1; step < 10; step++) {
                        const t = step / 10;
                        const mt = 1 - t;
                        const bx = mt * mt * curX + 2 * mt * t * x1 + t * t * x;
                        const by = mt * mt * curY + 2 * mt * t * y1 + t * t * y;
                        points.push(transform(bx, by, elementMatrix));
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
                        points.push(transform(x, y, elementMatrix));
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

                    const samples = 24;
                    for (let s = 1; s <= samples; s++) {
                        const angle = theta1 + dTheta * (s / (samples + 1));
                        const sxp = rx * Math.cos(angle);
                        const syp = ry * Math.sin(angle);
                        const px = cosPhi * sxp - sinPhi * syp + cx;
                        const py = sinPhi * sxp + cosPhi * syp + cy;
                        points.push(transform(px, py, elementMatrix));
                    }

                    curX = x; curY = y;
                    lastCPX = curX; lastCPY = curY;
                    break;
                }
            }
            if (!/[cqst]/i.test(cmd)) {
                lastCPX = curX; lastCPY = curY;
            }
            points.push(transform(curX, curY, elementMatrix));
        }
        finishPath();
    });

    // 4. Process Text
    doc.querySelectorAll('text').forEach((el, i) => {
        const xAttr = parseFloat(el.getAttribute('x') || '0');
        const yAttr = parseFloat(el.getAttribute('y') || '0');
        const textStr = el.textContent || '';
        if (!textStr.trim()) return;

        const elementMatrix = getElementTransform(el);
        const pt = transform(xAttr, yAttr, elementMatrix);

        const strokeAttr = getStyleAttr(el, 'stroke');
        const fillAttr = getStyleAttr(el, 'fill');
        const widthAttr = getStyleAttr(el, 'stroke-width');

        const hasFill = fillAttr && fillAttr !== 'none';
        const hasStroke = strokeAttr && strokeAttr !== 'none';

        let color = strokeAttr || 'none';
        let fill = fillAttr || '#000000';
        let width = widthAttr ? parseFloat(widthAttr) : (hasStroke ? 2 : 0);

        if (!hasFill && !hasStroke) {
            fill = '#000000';
            color = 'none';
            width = 0;
        }

        const fontSizeAttr = getStyleAttr(el, 'font-size') || el.getAttribute('font-size');
        const fontSize = fontSizeAttr ? parseFloat(fontSizeAttr) : 40;

        const filterAttr = getStyleAttr(el, 'filter') || el.getAttribute('filter');
        const fontFamily = getStyleAttr(el, 'font-family') || el.getAttribute('font-family') || 'Inter, system-ui, sans-serif';

        newPaths.push({
            id: `imported-text-${Date.now()}-${i}`,
            points: [pt], // Provide a base point
            type: 'text',
            text: textStr,
            fontFamily,
            fontSize: fontSize * scale,
            color,
            fill,
            width,
            tension: 0,
            closed: false,
            filter: filterAttr || undefined,
            name: `Text: ${textStr.substring(0, 10)}...`,
            symmetry: { horizontal: false, vertical: false, center: false },
            animation: getAnimationSettings(el),
            transform: getPivotData(el),
            keyframes: []
        });
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
