import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Copy, Check, Import, Save } from 'lucide-react';
import { smoothPath, parseSVGToPaths, applySymmetry } from '../utils/geometry';
import { SVG_DEF_MAP } from '../utils/svgDefs';
import type { PathLayer } from '../types';

interface CodePanelProps {
    paths: PathLayer[];
    tension: number;
    isDragging?: boolean;
    onApplyCode?: (newPaths: PathLayer[]) => void;
    duration?: number;
}

export const CodePanel: React.FC<CodePanelProps> = ({ paths, tension, isDragging, onApplyCode, duration = 3 }) => {
    const [copied, setCopied] = useState(false);
    const [localCode, setLocalCode] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const lastCodeRef = useRef('');

    // Update localCode when paths change, but only if not currently editing
    const generatedCode = useMemo(() => {
        // Skip generation while dragging to improve performance
        if (isDragging) {
            return lastCodeRef.current;
        }

        const width = 800;
        const height = 600;

        // Collect all used animation types
        const usedAnimations = new Set<string>();
        // Collect used defs (gradients, patterns)
        const usedDefs = new Set<string>();

        const checkAndAddDef = (color: string | undefined) => {
            if (!color) return;
            const match = color.match(/url\(#([^)]+)\)/);
            if (match && match[1]) {
                usedDefs.add(match[1]);
            }
        };

        paths.filter(p => p.visible !== false).forEach(path => {
            checkAndAddDef(path.fill);
            checkAndAddDef(path.color); // stroke color
            path.segmentColors?.forEach(c => checkAndAddDef(c));
            path.segmentFills?.forEach(f => checkAndAddDef(f));

            if (path.animation?.entries) {
                path.animation.entries.forEach(entry => {
                    if (!entry.paused) usedAnimations.add(entry.type);
                });
            }
            if (path.segmentAnimations) {
                path.segmentAnimations.forEach(anim => {
                    if (anim?.entries) {
                        anim.entries.forEach(entry => {
                            if (!entry.paused) usedAnimations.add(entry.type);
                        });
                    }
                });
            }
        });

        const defsContent = Array.from(usedDefs)
            .map(id => SVG_DEF_MAP[id])
            .filter(Boolean)
            .join('\n    ');

        // Only generate keyframes for used animations
        const keyframeMap: Record<string, string> = {
            draw: '@keyframes drawPath { to { stroke-dashoffset: 0; } }',
            pulse: '@keyframes pulsePath { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }',
            float: '@keyframes floatPath { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(var(--float-dist, -10px)); } }',
            spin: '@keyframes spinPath { from { transform: rotate(0deg); } to { transform: rotate(var(--spin-degree, 360deg)); } }',
            bounce: '@keyframes bouncePath { 0%, 100% { transform: scale(1); } 40% { transform: scale(calc(1 + var(--bounce-amp, 0.15)), calc(1 - var(--bounce-amp, 0.15))); } 60% { transform: scale(calc(1 - var(--bounce-amp, 0.15) * 0.6), calc(1 + var(--bounce-amp, 0.15) * 0.6)); } 80% { transform: scale(calc(1 + var(--bounce-amp, 0.15) * 0.3), calc(1 - var(--bounce-amp, 0.15) * 0.3)); } }',
            glow: '@keyframes glowPath { 0%, 100% { filter: drop-shadow(0 0 2px var(--glow-color)) brightness(1); } 50% { filter: drop-shadow(0 0 12px var(--glow-color)) brightness(1.5); } }',
            shake: '@keyframes shakePath { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(calc(-1 * var(--shake-dist, 4px))); } 75% { transform: translateX(var(--shake-dist, 4px)); } }',
            swing: '@keyframes swingPath { 0%, 100% { transform: rotate(calc(-1 * var(--swing-degree, 10deg))); } 50% { transform: rotate(var(--swing-degree, 10deg)); } }',
            tada: '@keyframes tadaPath { 0% { transform: scale(1); } 10%, 20% { transform: scale(0.9) rotate(-3deg); } 30%, 50%, 70%, 90% { transform: scale(1.1) rotate(3deg); } 40%, 60%, 80% { transform: scale(1.1) rotate(-3deg); } 100% { transform: scale(1) rotate(0); } }',
            jump: '@keyframes jumpPath { 0% { transform: translateY(0); } 5% { transform: translateY(calc(-1 * var(--jump-h,80px) * 0.19)); } 10% { transform: translateY(calc(-1 * var(--jump-h,80px) * 0.36)); } 15% { transform: translateY(calc(-1 * var(--jump-h,80px) * 0.51)); } 20% { transform: translateY(calc(-1 * var(--jump-h,80px) * 0.64)); } 25% { transform: translateY(calc(-1 * var(--jump-h,80px) * 0.75)); } 30% { transform: translateY(calc(-1 * var(--jump-h,80px) * 0.84)); } 35% { transform: translateY(calc(-1 * var(--jump-h,80px) * 0.91)); } 40% { transform: translateY(calc(-1 * var(--jump-h,80px) * 0.96)); } 45% { transform: translateY(calc(-1 * var(--jump-h,80px) * 0.99)); } 50% { transform: translateY(calc(-1 * var(--jump-h,80px))); } 55% { transform: translateY(calc(-1 * var(--jump-h,80px) * 0.99)); } 60% { transform: translateY(calc(-1 * var(--jump-h,80px) * 0.96)); } 65% { transform: translateY(calc(-1 * var(--jump-h,80px) * 0.91)); } 70% { transform: translateY(calc(-1 * var(--jump-h,80px) * 0.84)); } 75% { transform: translateY(calc(-1 * var(--jump-h,80px) * 0.75)); } 80% { transform: translateY(calc(-1 * var(--jump-h,80px) * 0.64)); } 85% { transform: translateY(calc(-1 * var(--jump-h,80px) * 0.51)); } 90% { transform: translateY(calc(-1 * var(--jump-h,80px) * 0.36)); } 95% { transform: translateY(calc(-1 * var(--jump-h,80px) * 0.19)); } 100% { transform: translateY(0); } }'
        };

        let keyframes = Array.from(usedAnimations)
            .map(type => keyframeMap[type])
            .filter(Boolean)
            .join('\n  ');

        // Generate Custom Keyframes for Path Layers
        paths.forEach(path => {
            // 1. Whole-layer keyframes
            if (path.keyframes && path.keyframes.length > 0) {
                const sortedFrames = [...path.keyframes].sort((a, b) => a.time - b.time);
                const steps = sortedFrames.map(kf => {
                    const { x, y, rotation, scale, scaleX, scaleY } = kf.value;
                    const sx = scaleX ?? scale ?? 1;
                    const sy = scaleY ?? scale ?? 1;
                    const percentage = (kf.time / duration) * 100;
                    return `${percentage.toFixed(2)}% { transform: translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${sx}, ${sy}); animation-timing-function: ${kf.ease}; }`;
                }).join('\n    ');

                keyframes += `\n  @keyframes anim-${path.id} {\n    ${steps}\n  }`;
            }

            // 2. Per-segment keyframes for merged layers
            if (path.segmentKeyframes && path.segmentKeyframes.length > 0) {
                path.segmentKeyframes.forEach((segKfs, idx) => {
                    if (segKfs && segKfs.length > 0) {
                        const sortedFrames = [...segKfs].sort((a, b) => a.time - b.time);
                        const steps = sortedFrames.map(kf => {
                            const { x, y, rotation, scale, scaleX, scaleY } = kf.value;
                            const sx = scaleX ?? scale ?? 1;
                            const sy = scaleY ?? scale ?? 1;
                            const percentage = (kf.time / duration) * 100;
                            return `${percentage.toFixed(2)}% { transform: translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${sx}, ${sy}); animation-timing-function: ${kf.ease}; }`;
                        }).join('\n    ');

                        keyframes += `\n  @keyframes anim-${path.id}-seg${idx} {\n    ${steps}\n  }`;
                    }
                });
            }
        });

        const pathsCode = paths.filter(p => p.visible !== false).flatMap(path => {
            const variants = applySymmetry(path.multiPathPoints || path.points, path.symmetry, width / 2, height / 2);

            const variantCode = variants.map(v => {
                let finalCode = '';

                if (path.id.startsWith('merged-') && path.multiPathPoints && v.multiPoints && v.multiPoints.length > 0) {
                    const groupings = path.segmentGroupings || v.multiPoints!.map(() => 1);
                    let currentSIdx = 0;
                    const groups = groupings.map((count) => {
                        const groupPoints = v.multiPoints!.slice(currentSIdx, currentSIdx + count);
                        const firstSIdx = currentSIdx;
                        currentSIdx += count;

                        const segColor = path.segmentColors?.[firstSIdx] || path.color || 'none';
                        const segFill = path.segmentFills?.[firstSIdx] || path.fill || 'none';
                        const segWidth = path.segmentWidths?.[firstSIdx] ?? (path.width ?? 2);
                        const segAnim = path.segmentAnimations?.[firstSIdx];
                        const segClosed = path.segmentClosed?.[firstSIdx] ?? path.closed;
                        const segTension = path.segmentTensions?.[firstSIdx] ?? (path.tension ?? tension);

                        const d = smoothPath(groupPoints, segTension, segClosed);

                        let animWrapperStart = '';
                        let animWrapperEnd = '';

                        if (segAnim && segAnim.entries && segAnim.entries.length > 0) {
                            segAnim.entries.forEach(entry => {
                                if (entry.paused) return;
                                const { type, duration, delay, ease, direction = 'forward', repeat = false, repeatCount = 1 } = entry;
                                let finalDirection: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse' =
                                    direction === 'forward' ? 'normal' : direction === 'alternate' ? 'alternate' : 'reverse';

                                if (type === 'spin' && (v.type === 'H' || v.type === 'V')) {
                                    if (finalDirection === 'normal') finalDirection = 'reverse';
                                    else if (finalDirection === 'reverse') finalDirection = 'normal';
                                }

                                const iterCount = repeat ? repeatCount : 'infinite';
                                let animStyle = `animation: ${type}Path ${duration}s ${ease} ${delay}s ${iterCount} forwards; `;

                                // Handle Symmetry Direction Flip
                                if ((type === 'spin' || type === 'swing' || type === 'shake') && (v.type === 'H' || v.type === 'V' || v.type === 'C')) {
                                    const flipH = v.type === 'H' || v.type === 'C';
                                    const flipV = v.type === 'V' || v.type === 'C';

                                    if (type === 'spin' || type === 'swing') {
                                        // Rotation flips on any single axis flip
                                        if (flipH !== flipV) {
                                            if (finalDirection === 'normal') finalDirection = 'reverse';
                                            else if (finalDirection === 'reverse') finalDirection = 'normal';
                                            else if (finalDirection === 'alternate') finalDirection = 'alternate-reverse';
                                            else if (finalDirection === 'alternate-reverse') finalDirection = 'alternate';
                                        }
                                    } else if (type === 'shake') {
                                        // Shake (X-axis) flips on Horizontal flip
                                        if (flipH) {
                                            if (finalDirection === 'normal') finalDirection = 'reverse';
                                            else if (finalDirection === 'reverse') finalDirection = 'normal';
                                        }
                                    }
                                }

                                // Custom Variables
                                if ((type === 'spin' || type === 'swing') && entry.degree !== undefined) {
                                    const varName = type === 'spin' ? '--spin-degree' : '--swing-degree';
                                    animStyle += `${varName}: ${entry.degree}deg; `;
                                }
                                if (type === 'float') {
                                    const baseAmp = entry.amplitude ?? 10;
                                    const isFlipped = v.type === 'V' || v.type === 'C';
                                    const dist = isFlipped ? baseAmp : -baseAmp;
                                    animStyle += `--float-dist: ${dist}px; `;
                                }
                                if (type === 'bounce' && entry.amplitude !== undefined) {
                                    animStyle += `--bounce-amp: ${entry.amplitude / 100}; `;
                                }
                                if (type === 'shake' && entry.amplitude !== undefined) {
                                    animStyle += `--shake-dist: ${entry.amplitude}px; `;
                                }
                                if (type === 'jump' && entry.amplitude !== undefined) {
                                    animStyle += `--jump-h: ${entry.amplitude}px; `;
                                }

                                if (type === 'glow') {
                                    const glowColor = (segColor && segColor !== 'none') ? segColor : (segFill && segFill !== 'none' ? segFill : '#22d3ee');
                                    animStyle += `--glow-color: ${glowColor}; `;
                                }
                                if (finalDirection !== 'normal') animStyle += `animation-direction: ${finalDirection}; `;
                                if (type === 'draw') animStyle += 'stroke-dasharray: 1000; stroke-dashoffset: 1000; ';
                                if (['spin', 'bounce', 'swing', 'tada', 'jump'].includes(type)) animStyle += 'transform-origin: bottom center; transform-box: fill-box; ';

                                animWrapperStart += `<g style="${animStyle}">`;
                                animWrapperEnd = `</g>` + animWrapperEnd;
                            });
                        }

                        let segmentNode = `<path d="${d}" stroke="${segColor}" stroke-opacity="${path.strokeOpacity ?? 1}" stroke-width="${segWidth}" fill="${segFill}" fill-opacity="${path.fillOpacity ?? 1}" stroke-linecap="round" stroke-linejoin="round" />`;

                        // Apply Segment-specific Keyframes or Static Transform
                        const segKfs = path.segmentKeyframes?.[firstSIdx];
                        const segTrans = path.segmentTransforms?.[firstSIdx];

                        if (segKfs && segKfs.length > 0) {
                            const durationSec = duration / 1000;
                            const animStyle = `animation: anim-${path.id}-seg${firstSIdx} ${durationSec}s linear infinite; transform-box: fill-box; transform-origin: center;`;
                            segmentNode = `<g style="${animStyle}">${segmentNode}</g>`;
                        } else if (segTrans) {
                            const { x, y, rotation, scale, scaleX, scaleY } = segTrans;
                            if (x !== 0 || y !== 0 || rotation !== 0 || scale !== 1 || (scaleX && scaleX !== 1) || (scaleY && scaleY !== 1)) {
                                const sx = scaleX ?? scale ?? 1;
                                const sy = scaleY ?? scale ?? 1;
                                const transformStyle = `transform: translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${sx}, ${sy}); transform-box: fill-box; transform-origin: center;`;
                                segmentNode = `<g style="${transformStyle}">${segmentNode}</g>`;
                            }
                        }

                        return `${animWrapperStart}${segmentNode}${animWrapperEnd}`;
                    }).join('\n');

                    finalCode = `<g>${groups}</g>`;
                } else {
                    const d = smoothPath(v.multiPoints || v.points, path.tension ?? tension, path.closed);
                    const glowColor = (path.color && path.color !== 'none') ? path.color : (path.fill && path.fill !== 'none' ? path.fill : '#22d3ee');
                    const hasGlow = path.animation?.entries?.some(e => e.type === 'glow') || false;
                    finalCode = `<path d="${d}" stroke="${path.color || 'none'}" stroke-width="${path.width ?? 2}" fill="${path.fill || 'none'}" stroke-opacity="${path.strokeOpacity ?? 1}" fill-opacity="${path.fillOpacity ?? 1}" stroke-linecap="round" stroke-linejoin="round"${hasGlow ? ` style="--glow-color: ${glowColor};"` : ''} />`;
                }

                if (path.animation && path.animation.entries && path.animation.entries.length > 0) {
                    const entries = path.animation.entries;

                    entries.forEach(entry => {
                        if (entry.paused) return;
                        const { type, duration, delay, ease, direction = 'forward', repeat = false, repeatCount = 1 } = entry;
                        let finalDirection: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse' =
                            direction === 'forward' ? 'normal' :
                                direction === 'alternate' ? 'alternate' : 'reverse';

                        const iterCount = repeat ? repeatCount : 'infinite';
                        let styleStr = `animation: ${type}Path ${duration}s ${ease} ${delay}s ${iterCount} forwards; `;

                        if (type === 'glow') {
                            const glowColor = (path.color && path.color !== 'none') ? path.color : (path.fill && path.fill !== 'none' ? path.fill : '#22d3ee');
                            styleStr += ` --glow-color: ${glowColor};`;
                        }

                        // Handle Symmetry Direction Flip
                        if ((type === 'spin' || type === 'swing' || type === 'shake') && (v.type === 'H' || v.type === 'V' || v.type === 'C')) {
                            const flipH = v.type === 'H' || v.type === 'C';
                            const flipV = v.type === 'V' || v.type === 'C';

                            if (type === 'spin' || type === 'swing') {
                                if (flipH !== flipV) {
                                    if (finalDirection === 'normal') finalDirection = 'reverse';
                                    else if (finalDirection === 'reverse') finalDirection = 'normal';
                                    else if (finalDirection === 'alternate') finalDirection = 'alternate-reverse';
                                    else if (finalDirection === 'alternate-reverse') finalDirection = 'alternate';
                                }
                            } else if (type === 'shake') {
                                if (flipH) {
                                    if (finalDirection === 'normal') finalDirection = 'reverse';
                                    else if (finalDirection === 'reverse') finalDirection = 'normal';
                                }
                            }
                        }

                        // Custom Variables
                        if ((type === 'spin' || type === 'swing') && entry.degree !== undefined) {
                            const varName = type === 'spin' ? '--spin-degree' : '--swing-degree';
                            styleStr += `${varName}: ${entry.degree}deg; `;
                        }
                        if (type === 'float') {
                            const baseAmp = entry.amplitude ?? 10;
                            const isFlipped = v.type === 'V' || v.type === 'C';
                            const dist = isFlipped ? baseAmp : -baseAmp;
                            styleStr += `--float-dist: ${dist}px; `;
                        }
                        if (type === 'bounce' && entry.amplitude !== undefined) {
                            styleStr += `--bounce-amp: ${entry.amplitude / 100}; `;
                        }
                        if (type === 'shake' && entry.amplitude !== undefined) {
                            styleStr += `--shake-dist: ${entry.amplitude}px; `;
                        }
                        if (type === 'jump' && entry.amplitude !== undefined) {
                            styleStr += `--jump-h: ${entry.amplitude}px; `;
                        }

                        if (finalDirection !== 'normal') styleStr += `animation-direction: ${finalDirection}; `;

                        if (type === 'draw') styleStr += ' stroke-dasharray: 1000; stroke-dashoffset: 1000;';
                        if (type === 'spin' || type === 'bounce' || type === 'swing' || type === 'tada') styleStr += ' transform-origin: center; transform-box: fill-box;';
                        if (type === 'jump') styleStr += ' transform-origin: bottom center; transform-box: fill-box;';

                        finalCode = `<g style="${styleStr}">${finalCode}</g>`;
                    });
                }

                // Add Custom Keyframe Animation Wrapper
                if (path.keyframes && path.keyframes.length > 0) {
                    const durationSec = duration / 1000;
                    const animStyle = `animation: anim-${path.id} ${durationSec}s linear infinite; transform-box: fill-box; transform-origin: center;`;
                    finalCode = `<g style="${animStyle}">${finalCode}</g>`;
                } else if (path.transform) {
                    const { x, y, rotation, scale, scaleX, scaleY } = path.transform;
                    const sx = scaleX ?? scale ?? 1;
                    const sy = scaleY ?? scale ?? 1;
                    const transformStyle = `transform: translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${sx}, ${sy}); transform-box: fill-box; transform-origin: center;`;
                    finalCode = `<g style="${transformStyle}">${finalCode}</g>`;
                }

                return finalCode;
            });
            return variantCode;
        }).join('\n');

        const code = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
    ${defsContent}
    </defs>
    <style>
        /* Animation Keyframes */
        ${keyframes}
    </style>
    ${pathsCode}
</svg>`;

        lastCodeRef.current = code;
        return code;
    }, [paths, tension, isDragging, duration]);

    // Sync generated code to local code when not editing
    useEffect(() => {
        if (!isEditing) {
            setLocalCode(generatedCode);
        }
    }, [generatedCode, isEditing]);

    const handleCopy = () => {
        navigator.clipboard.writeText(localCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleApply = () => {
        if (onApplyCode) {
            const importedPaths = parseSVGToPaths(localCode);
            if (importedPaths.length > 0) {
                onApplyCode(importedPaths);
                setIsEditing(false);
            } else {
                alert('No valid paths found in the SVG code.');
            }
        }
    };

    return (
        <div className="bg-surface rounded-xl border border-border shadow-lg flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border bg-slate-950/50">
                <div className="flex items-center gap-2">
                    <h3 className="text-secondary text-xs uppercase tracking-wider font-semibold">SVG Code</h3>
                    {isEditing && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase animate-pulse">
                            Editing
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <button
                            onClick={handleApply}
                            className="flex items-center gap-1.5 text-xs bg-primary text-background hover:bg-primary/90 px-2 py-1 rounded transition-colors font-bold"
                            title="Apply manual edits to canvas"
                        >
                            <Save size={12} />
                            <span>Apply</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded transition-colors"
                            title="Edit code manually"
                        >
                            <Import size={12} />
                            <span>Edit</span>
                        </button>
                    )}
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded transition-colors"
                    >
                        {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        <span>{copied ? 'Copy' : 'Copy'}</span>
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-hidden bg-[#020617] relative">
                <textarea
                    value={localCode}
                    onChange={(e) => {
                        setLocalCode(e.target.value);
                        setIsEditing(true);
                    }}
                    className="w-full h-full p-3 bg-transparent text-xs font-mono text-slate-300 resize-none outline-none focus:ring-1 focus:ring-primary/30 transition-all border-none"
                    spellCheck={false}
                    placeholder="Paste SVG code here..."
                />
            </div>
        </div>
    );
};
