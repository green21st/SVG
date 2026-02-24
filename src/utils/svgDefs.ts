
export const SVG_DEF_MAP: Record<string, string> = {
  // METAL
  'metal-silver': `<linearGradient id="metal-silver" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#e0e0e0" />
        <stop offset="20%" stop-color="#ffffff" />
        <stop offset="40%" stop-color="#9e9e9e" />
        <stop offset="60%" stop-color="#e0e0e0" />
        <stop offset="80%" stop-color="#757575" />
        <stop offset="100%" stop-color="#e0e0e0" />
      </linearGradient>`,
  'metal-gold': `<linearGradient id="metal-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#bf953f" />
        <stop offset="25%" stop-color="#fcf6ba" />
        <stop offset="50%" stop-color="#b38728" />
        <stop offset="75%" stop-color="#fbf5b7" />
        <stop offset="100%" stop-color="#aa771c" />
      </linearGradient>`,
  'metal-copper': `<linearGradient id="metal-copper" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#b87333" />
        <stop offset="50%" stop-color="#ff9d5c" />
        <stop offset="100%" stop-color="#8b4513" />
      </linearGradient>`,
  'metal-chrome': `<linearGradient id="metal-chrome" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="40%" stop-color="#dddddd" />
        <stop offset="50%" stop-color="#aaaaaa" />
        <stop offset="51%" stop-color="#666666" />
        <stop offset="100%" stop-color="#888888" />
      </linearGradient>`,

  // CRYSTAL & GLASS
  'crystal-blue': `<linearGradient id="crystal-blue" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#a1c4fd" stop-opacity="0.8" />
        <stop offset="50%" stop-color="#c2e9fb" stop-opacity="0.4" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.9" />
      </linearGradient>`,
  'crystal-shine': `<radialGradient id="crystal-shine" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="white" stop-opacity="0.9"/>
        <stop offset="20%" stop-color="#e0ffff" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="#00bfff" stop-opacity="0.2"/>
      </radialGradient>`,
  'glass-frosted': `<linearGradient id="glass-frosted" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.4)" />
        <stop offset="100%" stop-color="rgba(255,255,255,0.1)" />
      </linearGradient>`,

  // 3D EFFECTS
  '3d-sphere': `<radialGradient id="3d-sphere" cx="35%" cy="35%" r="60%" fx="30%" fy="30%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="20%" stop-color="#00bfff" />
        <stop offset="100%" stop-color="#00008b" />
      </radialGradient>`,
  '3d-ruby': `<radialGradient id="3d-ruby" cx="35%" cy="35%" r="60%" fx="30%" fy="30%">
          <stop offset="0%" stop-color="#ff9999" />
          <stop offset="20%" stop-color="#ff0000" />
          <stop offset="100%" stop-color="#660000" />
      </radialGradient>`,

  // GRADIENTS
  'gradient-sunset': `<linearGradient id="gradient-sunset" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ff512f" />
        <stop offset="100%" stop-color="#dd2476" />
      </linearGradient>`,
  'gradient-ocean': `<linearGradient id="gradient-ocean" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#2193b0" />
        <stop offset="100%" stop-color="#6dd5ed" />
      </linearGradient>`,
  'gradient-fire': `<linearGradient id="gradient-fire" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f12711" />
        <stop offset="100%" stop-color="#f5af19" />
      </linearGradient>`,
  'gradient-neon': `<linearGradient id="gradient-neon" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ff00cc" />
          <stop offset="33%" stop-color="#3333ff" />
          <stop offset="66%" stop-color="#00ffcc" />
          <stop offset="100%" stop-color="#ffff00" />
      </linearGradient>`,
  'gradient-holographic': `<linearGradient id="gradient-holographic" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fdfcfb" />
          <stop offset="10%" stop-color="#e2d1c3" />
          <stop offset="25%" stop-color="#f5f7fa" />
          <stop offset="40%" stop-color="#c3cfe2" />
          <stop offset="60%" stop-color="#a8edea" />
          <stop offset="80%" stop-color="#fedfe1" />
          <stop offset="100%" stop-color="#c3cfe2" />
      </linearGradient>`,
  'gradient-rainbow': `<linearGradient id="gradient-rainbow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="red" />
          <stop offset="17%" stop-color="orange" />
          <stop offset="33%" stop-color="yellow" />
          <stop offset="50%" stop-color="green" />
          <stop offset="67%" stop-color="blue" />
          <stop offset="83%" stop-color="indigo" />
          <stop offset="100%" stop-color="violet" />
      </linearGradient>`,

  // PATTERNS
  'pattern-grid': `<pattern id="pattern-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill="#1e293b" />
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#334155" stroke-width="1"/>
      </pattern>`,
  'pattern-dots': `<pattern id="pattern-dots" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="#f8fafc" />
          <circle cx="5" cy="5" r="2" fill="#cbd5e1" />
      </pattern>`,
  'pattern-marble': `<pattern id="pattern-marble" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
         <rect x="0" y="0" width="100" height="100" fill="#f5f5f5" />
         <path d="M0,50 Q25,25 50,50 T100,50" fill="none" stroke="#d4d4d4" stroke-width="2" opacity="0.5" />
         <path d="M0,20 Q40,60 80,20" fill="none" stroke="#a3a3a3" stroke-width="1" opacity="0.3" />
         <path d="M20,0 Q60,40 20,80" fill="none" stroke="#e5e5e5" stroke-width="3" opacity="0.6" />
      </pattern>`,
  'pattern-carbon': `<pattern id="pattern-carbon" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#111" />
          <path d="M0,0 L4,0 L4,4 L0,4 Z M4,4 L8,4 L8,8 L4,8 Z" fill="#222" />
          <path d="M0,0 L8,8 M0,8 L8,0" stroke="#000" stroke-opacity="0.2" stroke-width="0.5" />
      </pattern>`,
  'pattern-wood': `<pattern id="pattern-wood" x="0" y="0" width="100" height="40" patternUnits="userSpaceOnUse">
          <rect width="100" height="40" fill="#8B4513" />
          <path d="M0,10 Q50,15 100,10" fill="none" stroke="#5D2906" stroke-width="2" opacity="0.6" />
          <path d="M0,25 Q50,20 100,25" fill="none" stroke="#5D2906" stroke-width="1" opacity="0.4" />
          <path d="M0,35 Q30,40 60,35 T100,40" fill="none" stroke="#3E1C04" stroke-width="1.5" opacity="0.5" />
      </pattern>`,
  'pattern-brushed': `<pattern id="pattern-brushed" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill="#999" />
          <line x1="0" y1="0" x2="100" y2="0" stroke="#fff" stroke-opacity="0.1" stroke-width="1" />
          <line x1="0" y1="2" x2="100" y2="2" stroke="#000" stroke-opacity="0.1" stroke-width="1" />
          <line x1="0" y1="4" x2="100" y2="4" stroke="#fff" stroke-opacity="0.1" stroke-width="1" />
      </pattern>`,
  'pattern-honeycomb': `<pattern id="pattern-honeycomb" x="0" y="0" width="14" height="24" patternUnits="userSpaceOnUse">
          <rect width="14" height="24" fill="#ffcc00" />
          <path d="M7,0 L14,4 L14,12 L7,16 L0,12 L0,4 Z" fill="none" stroke="#cc9900" stroke-width="1" />
          <path d="M7,16 L14,20 L14,28 L7,32 L0,28 L0,20 Z" fill="none" stroke="#cc9900" stroke-width="1" />
      </pattern>`,

  // UI STYLE FILTERS
  'filter-glass': `<filter id="filter-glass" x="-30%" y="-30%" width="160%" height="160%" primitiveUnits="objectBoundingBox">
        <feGaussianBlur in="SourceAlpha" stdDeviation="0.02" result="blur" />
        <feSpecularLighting in="blur" surfaceScale="0.05" specularConstant="2" specularExponent="35" lighting-color="#ffffff" result="specOut">
          <fePointLight x="0.2" y="0.2" z="0.5" />
        </feSpecularLighting>
        <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut" />
        <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint" />
        <feColorMatrix in="litPaint" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.9 0.1" />
      </filter>`,
  'filter-3d-bevel': `<filter id="filter-3d-bevel" x="-40%" y="-40%" width="180%" height="180%" primitiveUnits="objectBoundingBox">
        <feGaussianBlur in="SourceAlpha" stdDeviation="0.03" result="blur" />
        <feSpecularLighting in="blur" surfaceScale="0.1" specularConstant="2" specularExponent="15" lighting-color="#ffffff" result="specOut">
          <fePointLight x="0.1" y="0.1" z="0.2" />
        </feSpecularLighting>
        <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut" />
        <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint" />
        <feDropShadow dx="0.03" dy="0.03" stdDeviation="0.02" flood-opacity="0.5" />
      </filter>`,
  'filter-soft-3d': `<filter id="filter-soft-3d" x="-50%" y="-50%" width="200%" height="200%" primitiveUnits="objectBoundingBox">
        <feGaussianBlur in="SourceAlpha" stdDeviation="0.05" result="blur" />
        <feDiffuseLighting in="blur" lighting-color="#ffffff" surfaceScale="0.15" diffuseConstant="1.5" result="diffuseOut">
          <fePointLight x="0.3" y="0.3" z="0.5" />
        </feDiffuseLighting>
        <feComposite in="diffuseOut" in2="SourceAlpha" operator="in" result="diffuseOut" />
        <feSpecularLighting in="blur" surfaceScale="0.1" specularConstant="1.2" specularExponent="30" lighting-color="#ffffff" result="specularOut">
          <fePointLight x="0.3" y="0.3" z="0.5" />
        </feSpecularLighting>
        <feComposite in="specularOut" in2="SourceAlpha" operator="in" result="specularOut" />
        <feComposite in="SourceGraphic" in2="diffuseOut" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="diffused" />
        <feComposite in="diffused" in2="specularOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="final" />
        <feDropShadow dx="0.02" dy="0.05" stdDeviation="0.05" flood-color="#000" flood-opacity="0.3" />
      </filter>`,
  'filter-neumorphic': `<filter id="filter-neumorphic" x="-50%" y="-50%" width="200%" height="200%" primitiveUnits="objectBoundingBox">
        <feDropShadow dx="-0.03" dy="-0.03" stdDeviation="0.03" flood-color="#ffffff" flood-opacity="0.9" />
        <feDropShadow dx="0.03" dy="0.03" stdDeviation="0.03" flood-color="#000000" flood-opacity="0.4" />
      </filter>`,
  'filter-claymorphic': `<filter id="filter-claymorphic" x="-50%" y="-50%" width="200%" height="200%" primitiveUnits="objectBoundingBox">
        <feGaussianBlur in="SourceAlpha" stdDeviation="0.08" result="blur" />
        <feOffset dx="0" dy="0.08" result="offsetblur" />
        <feFlood flood-color="rgba(0,0,0,0.3)" result="color" />
        <feComposite in2="offsetblur" operator="in" result="shadow" />
        <feSpecularLighting in="blur" surfaceScale="0.15" specularConstant="1" specularExponent="20" lighting-color="#ffffff" result="highlight">
          <fePointLight x="0.3" y="0.3" z="0.8" />
        </feSpecularLighting>
        <feComposite in="highlight" in2="SourceAlpha" operator="in" result="highlight" />
        <feMerge>
          <feMergeNode in="shadow" />
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="highlight" />
        </feMerge>
      </filter>`,
  'filter-neon': `<filter id="filter-neon" x="-100%" y="-100%" width="300%" height="300%" primitiveUnits="objectBoundingBox">
        <feGaussianBlur in="SourceAlpha" stdDeviation="0.02" result="blur2" />
        <feGaussianBlur in="SourceAlpha" stdDeviation="0.05" result="blur5" />
        <feGaussianBlur in="SourceAlpha" stdDeviation="0.1" result="blur10" />
        <feFlood flood-color="currentColor" result="color" />
        <feComposite in="color" in2="blur2" operator="in" result="glow2" />
        <feComposite in="color" in2="blur5" operator="in" result="glow5" />
        <feComposite in="color" in2="blur10" operator="in" result="glow10" />
        <feMerge>
          <feMergeNode in="glow10" />
          <feMergeNode in="glow5" />
          <feMergeNode in="glow2" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>`,
  'filter-retro': `<filter id="filter-retro" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="4" dy="4" stdDeviation="0" flood-color="#000000" />
      </filter>`,
  'filter-pixel': `<filter id="filter-pixel" x="0%" y="0%" width="100%" height="100%">
        <feMorphology operator="dilate" radius="1" />
      </filter>`
};

export const SVG_DEFS = Object.values(SVG_DEF_MAP).join('\n');
