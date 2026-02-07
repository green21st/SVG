import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Copy, Check, Import, Save } from 'lucide-react';
import { smoothPath, parseSVGToPaths } from '../utils/geometry';
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
        if (isDragging && lastCodeRef.current) {
            return lastCodeRef.current;
        }

        const width = 800;
        const height = 600;

        // Generate CSS Keyframes for the output SVG
        const keyframes = `
  @keyframes drawPath { to { stroke-dashoffset: 0; } }
  @keyframes pulsePath { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  @keyframes floatPath { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(var(--float-dist, -10px)); } }
  @keyframes spinPath { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `.trim();

        const pathsCode = paths.map(path => {
            const d = smoothPath(path.points, path.tension ?? tension, path.closed);
            let animationAttrs = '';

            if (path.animation && path.animation.type !== 'none') {
                const { type, duration, delay, ease, direction = 'forward' } = path.animation;

                let styleStr = `animation: ${type}Path ${duration}s ${ease} ${delay}s infinite forwards;`;

                if (direction === 'reverse') styleStr += ' animation-direction: reverse;';
                if (direction === 'alternate') styleStr += ' animation-direction: alternate;';

                if (type === 'draw') {
                    styleStr += ' stroke-dasharray: 1000; stroke-dashoffset: 1000;';
                }
                if (type === 'spin') {
                    styleStr += ' transform-origin: center; transform-box: fill-box;';
                }

                animationAttrs = ` style="${styleStr}"`;
            }

            return `  <path d="${d}" stroke="${path.color}" stroke-width="${path.width}" fill="${path.fill || 'none'}" stroke-opacity="${path.strokeOpacity ?? 1}" fill-opacity="${path.fillOpacity ?? 1}" stroke-linecap="round" stroke-linejoin="round"${animationAttrs} />`;
        }).join('\n');

        const result = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
${keyframes}
  </style>
${pathsCode}
</svg>`;

        lastCodeRef.current = result;
        return result;
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
                    onFocus={() => setIsEditing(true)}
                    className="w-full h-full p-3 bg-transparent text-xs font-mono text-slate-300 resize-none outline-none focus:ring-1 focus:ring-primary/30 transition-all border-none"
                    spellCheck={false}
                    placeholder="Paste SVG code here..."
                />
            </div>
        </div>
    );
};
