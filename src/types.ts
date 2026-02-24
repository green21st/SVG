export interface Point {
    x: number;
    y: number;
}

export interface Transform {
    x: number;
    y: number;
    rotation: number;
    scale: number;
    scaleX?: number;
    scaleY?: number;
}

export interface AnimationKeyframe {
    id: string;
    time: number; // 0-100 percentage
    value: Transform;
    ease: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface PathLayer {
    id: string;
    points: Point[];
    color: string;
    fill: string;
    width: number;
    tension: number;
    closed: boolean;
    symmetry: SymmetrySettings;
    transform?: Transform; // Added transform property
    keyframes?: AnimationKeyframe[]; // Added keyframes property
    strokeOpacity?: number;
    fillOpacity?: number;
    animation?: AnimationSettings;
    visible?: boolean;
    locked?: boolean;
    name?: string;
    d?: string;
    type?: 'path' | 'text';
    multiPathPoints?: Point[][];
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    rotation?: number; // Keep for text legacy or migrate? Let's keep for now but prefer transform.rotation
    importedScale?: number;
    importedOffsetX?: number;
    importedOffsetY?: number;
    segmentColors?: string[];
    segmentFills?: string[];
    segmentWidths?: number[];
    segmentAnimations?: AnimationSettings[];
    segmentClosed?: boolean[];
    segmentTensions?: number[];
    segmentGroupings?: number[];
    segmentTransforms?: (Transform | undefined)[];
    segmentKeyframes?: (AnimationKeyframe[] | undefined)[];
}

export type AnimationType = 'none' | 'draw' | 'pulse' | 'float' | 'spin' | 'bounce' | 'glow' | 'shake' | 'swing' | 'tada';

export interface AnimationSettings {
    types: AnimationType[];
    duration: number; // in seconds
    delay: number; // in seconds
    ease: string;
    direction?: 'forward' | 'reverse' | 'alternate';
}

export interface SymmetrySettings {
    horizontal: boolean;
    vertical: boolean;
    center: boolean;
}
