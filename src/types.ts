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
    px?: number; // Pivot X offset from center
    py?: number; // Pivot Y offset from center
}

export interface AnimationKeyframe {
    id: string;
    time: number; // 0-100 percentage
    value: Transform;
    ease: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export type AnimationType = 'draw' | 'pulse' | 'float' | 'spin' | 'bounce' | 'glow' | 'shake' | 'swing' | 'tada';

/** 单条动画记录，每条动画独立拥有完整参数 */
export interface AnimationEntry {
    id: string;
    type: AnimationType;
    duration: number;  // in seconds
    delay: number;     // in seconds
    ease: string;
    direction: 'forward' | 'reverse' | 'alternate';
}

/** 动画设置：以 entries 数组承载多条独立动画 */
export interface AnimationSettings {
    entries: AnimationEntry[];
    /** 是否暂停（仅用于 OFF 按钮状态） */
    paused?: boolean;
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
    filter?: string;
    segmentFilters?: string[];
    interactive?: boolean;
    segmentInteractive?: boolean[];
}

export interface SymmetrySettings {
    horizontal: boolean;
    vertical: boolean;
    center: boolean;
}
