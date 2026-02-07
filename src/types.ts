export interface Point {
    x: number;
    y: number;
}

export interface PathLayer {
    id: string;
    points: Point[];
    color: string;
    fill: string; // Added fill color
    width: number;
    tension: number; // Store tension per path
    closed: boolean;
    symmetry: SymmetrySettings; // Embedded symmetry for dynamic editing
    strokeOpacity?: number;
    fillOpacity?: number;
    animation?: AnimationSettings;
}

export interface AnimationSettings {
    type: 'none' | 'draw' | 'pulse' | 'float' | 'spin' | 'bounce' | 'glow' | 'shake' | 'swing' | 'tada';
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
