
export interface UIStyle {
    label: string;
    id: string;
    previewBackground: string;
    properties: {
        fill?: string;
        stroke?: string;
        strokeWidth?: number;
        filter?: string;
        fillOpacity?: number;
        strokeOpacity?: number;
    };
}

export const UI_STYLES: UIStyle[] = [
    {
        label: 'Glossy 3D',
        id: 'glossy-3d',
        previewBackground: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
        properties: {
            fill: '#3b82f6',
            stroke: 'none',
            filter: 'url(#filter-3d-bevel)'
        }
    },
    {
        label: 'Soft Plastic',
        id: 'soft-3d',
        previewBackground: 'linear-gradient(135deg, #10b981, #047857)',
        properties: {
            fill: '#10b981',
            stroke: 'none',
            filter: 'url(#filter-soft-3d)'
        }
    },
    {
        label: 'Glassmorphism',
        id: 'glass',
        previewBackground: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))',
        properties: {
            fill: 'rgba(255, 255, 255, 0.15)',
            stroke: 'rgba(255, 255, 255, 0.4)',
            strokeWidth: 1.5,
            filter: 'url(#filter-glass)',
            fillOpacity: 0.3,
            strokeOpacity: 0.6
        }
    },
    {
        label: 'Neumorphism',
        id: 'neumorphic',
        previewBackground: '#e0e0e0',
        properties: {
            fill: '#e0e0e0',
            stroke: 'none',
            filter: 'url(#filter-neumorphic)'
        }
    },
    {
        label: 'Claymorphism',
        id: 'clay',
        previewBackground: '#818cf8',
        properties: {
            fill: '#818cf8',
            stroke: 'none',
            filter: 'url(#filter-claymorphic)'
        }
    },
    {
        label: 'Neon Glow',
        id: 'neon',
        previewBackground: 'radial-gradient(circle, #22d3ee 0%, #000 100%)',
        properties: {
            stroke: '#22d3ee',
            fill: 'none',
            strokeWidth: 2.5,
            filter: 'url(#filter-neon)'
        }
    },
    {
        label: 'Retro Shadow',
        id: 'retro',
        previewBackground: '#facc15',
        properties: {
            fill: '#facc15',
            stroke: '#000000',
            strokeWidth: 2,
            filter: 'url(#filter-retro)'
        }
    },
    {
        label: 'Pixel Bold',
        id: 'pixel',
        previewBackground: '#f87171',
        properties: {
            fill: '#f87171',
            stroke: '#000000',
            strokeWidth: 3,
            filter: 'url(#filter-pixel)'
        }
    }
];
