import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { smoothPath } from '../utils/geometry';
import type { PathLayer } from '../types';

interface CodePanelProps {
    paths: PathLayer[];
    tension: number;
    isDragging?: boolean;
}

export const CodePanel: React.FC<CodePanelProps> = ({ paths, tension, isDragging }) => {
    const [copied, setCopied] = useState(false);
    const lastCodeRef = useRef('');

    const code = useMemo(() => {
        // If dragging, return the last generated code to avoid expensive smoothPath calls for all paths
        if (isDragging && lastCodeRef.current) {
            return lastCodeRef.current;
        }

        const width = 800;
        const height = 600;

        const pathsCode = paths.map(path => {
            const d = smoothPath(path.points, path.tension ?? tension, path.closed);
            return `  <path d="${d}" stroke="${path.color}" stroke-width="${path.width}" fill="${path.fill || 'none'}" stroke-linecap="round" stroke-linejoin="round" />`;
        }).join('\n');

        const result = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
${pathsCode}
</svg>`;

        lastCodeRef.current = result;
        return result;
    }, [paths, tension, isDragging]);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-surface rounded-xl border border-border shadow-lg flex flex-col h-80 overflow-hidden mb-6">
            <div className="flex items-center justify-between p-3 border-b border-border bg-slate-950/50">
                <h3 className="text-secondary text-xs uppercase tracking-wider font-semibold">SVG Code</h3>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded transition-colors"
                >
                    {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-[#020617] custom-scrollbar">
                <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap break-all leading-relaxed">
                    {code}
                </pre>
            </div>
        </div>
    );
};
