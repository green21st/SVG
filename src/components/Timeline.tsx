import React, { useRef, useState } from 'react';
import type { AnimationKeyframe } from '../types';

interface TimelineProps {
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    onTimeChange: (time: number) => void;
    onTogglePlay: () => void;
    onAddKeyframe: () => void;
    onDeleteKeyframe: () => void;
    onUpdateKeyframe?: (id: string, updates: Partial<AnimationKeyframe>) => void;
    keyframes: AnimationKeyframe[];
    isAnimationMode: boolean;
    onToggleAnimationMode: () => void;
    className?: string;
}

const Timeline: React.FC<TimelineProps> = ({
    currentTime,
    duration,
    isPlaying,
    onTimeChange,
    onTogglePlay,
    onAddKeyframe,
    onDeleteKeyframe,
    onUpdateKeyframe,
    keyframes,
    isAnimationMode,
    onToggleAnimationMode,
    className
}) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(null);

    const handleTrackClick = (e: React.MouseEvent) => {
        // If clicking on a keyframe marker, don't scrub time
        if ((e.target as HTMLElement).dataset.type === 'keyframe') return;

        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const percentage = Math.max(0, Math.min(1, x / width));
        onTimeChange(percentage * duration);
        setSelectedKeyframeId(null); // Deselect when scrubbing
    };

    const handleKeyframeClick = (e: React.MouseEvent, id: string, time: number) => {
        e.stopPropagation();
        setSelectedKeyframeId(id);
        onTimeChange(time); // Jump to keyframe time
    };

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const milliseconds = Math.floor((ms % 1000) / 10);
        return `${totalSeconds}.${milliseconds.toString().padStart(2, '0')}s`;
    };

    const selectedKeyframe = keyframes.find(k => k.id === selectedKeyframeId);

    return (
        <div className={`bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-xl p-4 text-white flex flex-col gap-3 h-auto shadow-xl ${className || ''}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onToggleAnimationMode}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
                            isAnimationMode 
                            ? 'bg-primary text-background shadow-[0_0_15px_rgba(34,211,238,0.4)]' 
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                    >
                        KeyFrame {isAnimationMode ? 'ON' : 'OFF'}
                    </button>
                    
                    {isAnimationMode && (
                        <>
                            <div className="flex items-center gap-3 bg-black/30 p-1 rounded-lg border border-white/5">
                                <button
                                    onClick={onTogglePlay}
                                    className={`p-2 rounded-md hover:bg-white/10 transition-colors ${isPlaying ? 'text-green-400' : 'text-white'}`}
                                >
                                    {isPlaying ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                    )}
                                </button>
                                <span className="font-mono text-sm min-w-[60px] text-center border-l border-white/10 pl-3">{formatTime(currentTime)}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={onAddKeyframe}
                                    className="px-3 py-1.5 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95"
                                    title="Add Keyframe at current time"
                                >
                                    <div className="w-2 h-2 rotate-45 bg-current"></div>
                                    Add Keyframe
                                </button>
                                <button
                                    onClick={onDeleteKeyframe}
                                    className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-all active:scale-95"
                                    title="Delete Keyframe at current time"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Keyframe Properties Editor */}
                {selectedKeyframe && onUpdateKeyframe && (
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4">
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Easing</span>
                        <select 
                            value={selectedKeyframe.ease}
                            onChange={(e) => onUpdateKeyframe(selectedKeyframe.id, { ease: e.target.value as any })}
                            className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-primary/50"
                        >
                            <option value="linear">Linear</option>
                            <option value="ease-in">Ease In</option>
                            <option value="ease-out">Ease Out</option>
                            <option value="ease-in-out">Ease In Out</option>
                        </select>
                    </div>
                )}
            </div>

            {isAnimationMode && (
                <div className="relative h-10 w-full select-none">
                    {/* Time markers */}
                    <div className="absolute top-0 left-0 right-0 flex justify-between text-[10px] text-slate-500 font-mono pointer-events-none select-none px-0.5">
                        <span>0s</span>
                        <span>{duration / 2000}s</span>
                        <span>{duration / 1000}s</span>
                    </div>

                    <div 
                        ref={trackRef}
                        className="absolute top-4 left-0 right-0 h-6 bg-slate-950/50 rounded-lg border border-white/5 cursor-pointer overflow-hidden group"
                        onClick={handleTrackClick}
                    >
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex pointer-events-none">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <div key={i} className="flex-1 border-r border-white/5 last:border-0"></div>
                            ))}
                        </div>

                        {/* Keyframe Markers */}
                        {keyframes.map((kf) => (
                            <div
                                key={kf.id}
                                data-type="keyframe"
                                onClick={(e) => handleKeyframeClick(e, kf.id, kf.time)}
                                className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 border transition-all z-10 cursor-pointer ${
                                    selectedKeyframeId === kf.id 
                                    ? 'bg-primary border-white scale-125 shadow-[0_0_10px_rgba(34,211,238,0.8)]' 
                                    : 'bg-amber-400 border-black/50 hover:scale-125'
                                }`}
                                style={{ left: `${(kf.time / duration) * 100}%`, transform: 'translate(-50%, -50%) rotate(45deg)' }}
                                title={`Keyframe at ${formatTime(kf.time)} (${kf.ease})`}
                            />
                        ))}

                        {/* Playhead */}
                        <div
                            className="absolute top-0 bottom-0 w-px bg-red-500 z-20 pointer-events-none"
                            style={{ left: `${(currentTime / duration) * 100}%` }}
                        >
                            <div className="absolute -top-1 -translate-x-1/2 w-3 h-4 bg-red-500 rounded-sm shadow-sm"></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Timeline;
