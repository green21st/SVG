import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Copy, Check, Import, Save } from 'lucide-react';
import { smoothPath, parseSVGToPaths, applySymmetry } from '../utils/geometry';
import type { PathLayer } from '../types';

interface CodePanelProps {
    paths: PathLayer[];
    tension: number;
    isDragging?: boolean;
    onApplyCode?: (newPaths: PathLayer[]) => void;
}

export const CodePanel: React.FC<CodePanelProps> = ({ paths, tension, isDragging, onApplyCode }) => {
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
        paths.filter(p => p.visible !== false).forEach(path => {
            if (path.animation?.types) {
                path.animation.types.forEach(type => {
                    if (type !== 'none') usedAnimations.add(type);
                });
            }
            if (path.segmentAnimations) {
                path.segmentAnimations.forEach(anim => {
                    if (anim?.types) {
                        anim.types.forEach(type => {
                            if (type !== 'none') usedAnimations.add(type);
                        });
                    }
                });
            }
        });

        // Only generate keyframes for used animations
        const keyframeMap: Record<string, string> = {
            draw: '@keyframes drawPath { to { stroke-dashoffset: 0; } }',
            pulse: '@keyframes pulsePath { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }',
            float: '@keyframes floatPath { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(var(--float-dist, -10px)); } }',
            spin: '@keyframes spinPath { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }',
            bounce: '@keyframes bouncePath { 0%, 100% { transform: scale(1); } 40% { transform: scale(1.15, 0.85); } 60% { transform: scale(0.9, 1.1); } 80% { transform: scale(1.05, 0.95); } }',
            glow: '@keyframes glowPath { 0%, 100% { filter: drop-shadow(0 0 2px var(--glow-color)) brightness(1); } 50% { filter: drop-shadow(0 0 12px var(--glow-color)) brightness(1.5); } }',
            shake: '@keyframes shakePath { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }',
            swing: '@keyframes swingPath { 0%, 100% { transform: rotate(-10deg); } 50% { transform: rotate(10deg); } }',
            tada: '@keyframes tadaPath { 0% { transform: scale(1); } 10%, 20% { transform: scale(0.9) rotate(-3deg); } 30%, 50%, 70%, 90% { transform: scale(1.1) rotate(3deg); } 40%, 60%, 80% { transform: scale(1.1) rotate(-3deg); } 100% { transform: scale(1) rotate(0); } }'
        };

        const keyframes = Array.from(usedAnimations)
            .map(type => keyframeMap[type])
            .filter(Boolean)
            .join('\n  ');

        const pathsCode = paths.filter(p => p.visible !== false).flatMap(path => {
            const variants = applySymmetry(path.multiPathPoints || path.points, path.symmetry, width / 2, height / 2);

            return variants.map(v => {
                let finalCode = '';

                if (path.multiPathPoints && v.multiPoints && v.multiPoints.length > 0) {
                    const segments = v.multiPoints.map((seg, sIdx) => {
                        const segColor = path.segmentColors?.[sIdx] || path.color || 'none';
                        const segFill = path.segmentFills?.[sIdx] || path.fill || 'none';
                        const segWidth = path.segmentWidths?.[sIdx] ?? (path.width ?? 2);
                        const segAnim = path.segmentAnimations?.[sIdx];
                        const segClosed = path.segmentClosed?.[sIdx] ?? path.closed;
                        const segTension = path.segmentTensions?.[sIdx] ?? (path.tension ?? tension);

                        const d = smoothPath(seg, segTension, segClosed);

                        let animWrapperStart = '';
                        let animWrapperEnd = '';

                        if (segAnim && segAnim.types && segAnim.types.length > 0) {
                            const { types, duration, delay, ease, direction = 'forward' } = segAnim;
                            types.filter(t => t !== 'none').forEach(type => {
                                let finalDirection: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse' =
                                    direction === 'forward' ? 'normal' : direction === 'alternate' ? 'alternate' : 'reverse';

                                if (type === 'spin' && (v.type === 'H' || v.type === 'V')) {
                                    if (finalDirection === 'normal') finalDirection = 'reverse';
                                    else if (finalDirection === 'reverse') finalDirection = 'normal';
                                }

                                let animStyle = `animation: ${type}Path ${duration}s ${ease} ${delay}s infinite forwards; `;
                                if (type.includes('glow')) animStyle += `--glow-color: ${segColor}; `;
                                if (finalDirection !== 'normal') animStyle += `animation-direction: ${finalDirection}; `;
                                if (type === 'draw') animStyle += 'stroke-dasharray: 1000; stroke-dashoffset: 1000; ';
                                if (['spin', 'bounce', 'swing', 'tada'].includes(type)) animStyle += 'transform-origin: center; transform-box: fill-box; ';
                                if (type === 'float' && (v.type === 'V' || v.type === 'C')) animStyle += '--float-dist: 10px; ';

                                animWrapperStart += `<g style="${animStyle}">`;
                                animWrapperEnd = `</g>` + animWrapperEnd;
                            });
                        }

                        return `${animWrapperStart}<path d="${d}" stroke="${segColor}" stroke-opacity="${path.strokeOpacity ?? 1}" stroke-width="${segWidth}" fill="${segFill}" fill-opacity="${path.fillOpacity ?? 1}" stroke-linecap="round" stroke-linejoin="round" />${animWrapperEnd}`;
                    }).join('\n');

                    finalCode = `<g>${segments}</g>`;
                } else {
                    const d = smoothPath(v.multiPoints || v.points, path.tension ?? tension, path.closed);
                    finalCode = `<path d="${d}" stroke="${path.color || 'none'}" stroke-width="${path.width ?? 2}" fill="${path.fill || 'none'}" stroke-opacity="${path.strokeOpacity ?? 1}" fill-opacity="${path.fillOpacity ?? 1}" stroke-linecap="round" stroke-linejoin="round"${path.animation?.types.includes('glow') ? ` style="--glow-color: ${path.color || '#22d3ee'};"` : ''} />`;
                }

                if (path.animation && path.animation.types.length > 0) {
                    const { types, duration, delay, ease, direction = 'forward' } = path.animation;

                    types.filter(t => t !== 'none').forEach(type => {
                        let finalDirection: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse' =
                            direction === 'forward' ? 'normal' :
                                direction === 'alternate' ? 'alternate' : 'reverse';

                        let styleStr = `animation: ${type}Path ${duration}s ${ease} ${delay}s infinite forwards;`;
                        if (path.animation?.types.includes('glow')) styleStr += ` --glow-color: ${path.color || '#22d3ee'};`;

                        // Replicate Canvas.tsx logic for variants
                        if (type === 'spin' && (v.type === 'H' || v.type === 'V')) {
                            if (finalDirection === 'normal') finalDirection = 'reverse';
                            else if (finalDirection === 'reverse') finalDirection = 'normal';
                        }

                        if (finalDirection === 'reverse') styleStr += ' animation-direction: reverse;';
                        if (finalDirection === 'alternate') styleStr += ' animation-direction: alternate;';

                        if (type === 'draw') styleStr += ' stroke-dasharray: 1000; stroke-dashoffset: 1000;';
                        if (type === 'spin' || type === 'bounce' || type === 'swing' || type === 'tada') styleStr += ' transform-origin: center; transform-box: fill-box;';

                        if (type === 'float' && (v.type === 'V' || v.type === 'C')) {
                            styleStr += ' --float-dist: 10px;';
                        }

                        finalCode = `<g style="${styleStr}">${finalCode}</g>`;
                    });
                }

                return finalCode;
            });
        }).join('\n');

        const code = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    /* Animation Keyframes */
${keyframes}
  </style>
${pathsCode}
</svg>`;

        lastCodeRef.current = code;
        return code;
    }, [paths, tension, isDragging]);

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
