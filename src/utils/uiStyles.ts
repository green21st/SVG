
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
    },
    {
        label: 'Ultra Chrome',
        id: 'ultra-chrome',
        previewBackground: 'linear-gradient(135deg, #777, #fff, #777)',
        properties: {
            fill: 'url(#metal-liquid)',
            stroke: 'none',
            filter: 'url(#filter-ultra-chrome)'
        }
    },
    {
        label: 'Void Core',
        id: 'void-core',
        previewBackground: 'radial-gradient(circle, #000 70%, #3300ff 100%)',
        properties: {
            fill: 'url(#3d-void)',
            stroke: '#00ffff',
            strokeWidth: 1.5,
            filter: 'url(#filter-neon)'
        }
    },
    {
        label: 'Aurora Flow',
        id: 'aurora',
        previewBackground: 'linear-gradient(135deg, #11998e, #38ef7d)',
        properties: {
            fill: 'url(#gradient-aurora)',
            stroke: 'none',
            filter: 'url(#filter-aurora-glow)'
        }
    },
    {
        label: 'Cyber Pulse',
        id: 'cyber',
        previewBackground: 'linear-gradient(90deg, #00ffff 50%, #ff00ff 50%)',
        properties: {
            fill: 'url(#gradient-cyber)',
            stroke: '#fff',
            strokeWidth: 2,
            filter: 'url(#filter-neon)'
        }
    },
    {
        label: 'Carbon Tech',
        id: 'carbon-tech',
        previewBackground: '#111',
        properties: {
            fill: 'url(#pattern-carbon)',
            stroke: '#444',
            strokeWidth: 1,
            filter: 'url(#filter-3d-bevel)'
        }
    },
    {
        label: 'Liquid Metal',
        id: 'liquid-metal',
        previewBackground: 'linear-gradient(135deg, #c0c0c0, #ffffff, #808080)',
        properties: {
            fill: 'url(#gradient-liquid-metal)',
            stroke: 'none',
            filter: 'url(#filter-liquid-metal)'
        }
    },
    {
        label: 'Plasma Energy',
        id: 'plasma',
        previewBackground: 'linear-gradient(90deg, #ff00ff, #00ffff, #ffff00)',
        properties: {
            fill: 'url(#gradient-plasma)',
            stroke: '#ff00ff',
            strokeWidth: 1.5,
            filter: 'url(#filter-plasma)'
        }
    },
    {
        label: 'Frosted Glass',
        id: 'frosted-glass',
        previewBackground: 'linear-gradient(135deg, rgba(232,244,248,0.8), rgba(176,212,227,0.6))',
        properties: {
            fill: 'url(#pattern-frosted)',
            stroke: 'rgba(176,212,227,0.8)',
            strokeWidth: 1,
            filter: 'url(#filter-frosted-glass)',
            fillOpacity: 0.7
        }
    },
    {
        label: 'Lava Flow',
        id: 'lava-flow',
        previewBackground: 'linear-gradient(135deg, #ff0000, #ff6600, #ffcc00)',
        properties: {
            fill: 'url(#gradient-lava)',
            stroke: '#ff0000',
            strokeWidth: 1,
            filter: 'url(#filter-lava)'
        }
    },
    {
        label: 'Quantum Entanglement',
        id: 'quantum',
        previewBackground: 'linear-gradient(90deg, #00ff00, #00ffff, #ff00ff, #ffff00)',
        properties: {
            fill: 'url(#gradient-quantum)',
            stroke: '#00ff00',
            strokeWidth: 1.5,
            filter: 'url(#filter-quantum)'
        }
    },
    {
        label: 'Metallic Sphere',
        id: 'metallic-sphere',
        previewBackground: 'radial-gradient(circle at 35% 35%, #ffffff, #4a90e2, #1a3a52)',
        properties: {
            fill: 'url(#3d-sphere)',
            stroke: '#1a3a52',
            strokeWidth: 1.5,
            filter: 'url(#filter-3d-bevel)'
        }
    },
    {
        label: 'Crystalline Ice',
        id: 'crystalline-ice',
        previewBackground: 'linear-gradient(135deg, rgba(176,224,230,0.9), rgba(135,206,250,0.8), rgba(100,149,237,0.7))',
        properties: {
            fill: 'url(#crystal-blue)',
            stroke: 'rgba(100,149,237,0.8)',
            strokeWidth: 1.5,
            filter: 'url(#filter-glass)',
            fillOpacity: 0.8,
            strokeOpacity: 0.9
        }
    }
];
