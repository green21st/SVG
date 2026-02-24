import type { AnimationKeyframe, Transform } from '../types';

export const interpolateTransform = (keyframes: AnimationKeyframe[], time: number): Transform | null => {
    if (!keyframes || keyframes.length === 0) return null;

    // Sort keyframes by time just in case
    const sorted = [...keyframes].sort((a, b) => a.time - b.time);

    // Before first keyframe
    if (time <= sorted[0].time) return sorted[0].value;

    // After last keyframe
    if (time >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].value;

    // Find interpolation interval
    for (let i = 0; i < sorted.length - 1; i++) {
        const k1 = sorted[i];
        const k2 = sorted[i + 1];

        if (time >= k1.time && time < k2.time) {
            const t = (time - k1.time) / (k2.time - k1.time);

            // Apply easing if needed (simple implementation)
            const easedT = k1.ease === 'ease-in-out' ?
                t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t :
                k1.ease === 'ease-in' ? t * t :
                    k1.ease === 'ease-out' ? t * (2 - t) :
                        t; // linear

            const k1sx = k1.value.scaleX ?? k1.value.scale ?? 1;
            const k1sy = k1.value.scaleY ?? k1.value.scale ?? 1;
            const k2sx = k2.value.scaleX ?? k2.value.scale ?? 1;
            const k2sy = k2.value.scaleY ?? k2.value.scale ?? 1;
            const k1px = k1.value.px || 0;
            const k1py = k1.value.py || 0;
            const k2px = k2.value.px || 0;
            const k2py = k2.value.py || 0;

            return {
                x: k1.value.x + (k2.value.x - k1.value.x) * easedT,
                y: k1.value.y + (k2.value.y - k1.value.y) * easedT,
                rotation: k1.value.rotation + (k2.value.rotation - k1.value.rotation) * easedT,
                scale: k1.value.scale + (k2.value.scale - k1.value.scale) * easedT,
                scaleX: k1sx + (k2sx - k1sx) * easedT,
                scaleY: k1sy + (k2sy - k1sy) * easedT,
                px: k1px + (k2px - k1px) * easedT,
                py: k1py + (k2py - k1py) * easedT,
            };
        }
    }

    // Handle end case normalization
    const finalVal = sorted[0].value;
    return {
        ...finalVal,
        scaleX: finalVal.scaleX ?? finalVal.scale ?? 1,
        scaleY: finalVal.scaleY ?? finalVal.scale ?? 1
    };
};
