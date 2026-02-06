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
}

export interface SymmetrySettings {
    horizontal: boolean;
    vertical: boolean;
    center: boolean;
}
