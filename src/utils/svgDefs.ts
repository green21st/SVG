
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
  'metal-iridescent': `<linearGradient id="metal-iridescent" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffb7ff" />
        <stop offset="20%" stop-color="#b7ffff" />
        <stop offset="40%" stop-color="#ffffb7" />
        <stop offset="60%" stop-color="#b7ffb7" />
        <stop offset="80%" stop-color="#b7b7ff" />
        <stop offset="100%" stop-color="#ffb7b7" />
      </linearGradient>`,
  'metal-liquid': `<linearGradient id="metal-liquid" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#777" />
        <stop offset="45%" stop-color="#eee" />
        <stop offset="50%" stop-color="#fff" />
        <stop offset="55%" stop-color="#eee" />
        <stop offset="100%" stop-color="#777" />
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
  '3d-void': `<radialGradient id="3d-void" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#000" />
        <stop offset="85%" stop-color="#000" />
        <stop offset="90%" stop-color="#3300ff" />
        <stop offset="100%" stop-color="#00ffff" />
      </radialGradient>`,
  '3d-emerald': `<radialGradient id="3d-emerald" cx="35%" cy="35%" r="60%" fx="30%" fy="30%">
          <stop offset="0%" stop-color="#ccffcc" />
          <stop offset="40%" stop-color="#10b981" />
          <stop offset="100%" stop-color="#064e3b" />
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
  'gradient-aurora': `<linearGradient id="gradient-aurora" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#11998e" />
        <stop offset="50%" stop-color="#38ef7d" />
        <stop offset="100%" stop-color="#00d2ff" />
      </linearGradient>`,
  'gradient-cyber': `<linearGradient id="gradient-cyber" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#00ffff" />
        <stop offset="49.9%" stop-color="#00ffff" />
        <stop offset="50.1%" stop-color="#ff00ff" />
        <stop offset="100%" stop-color="#ff00ff" />
      </linearGradient>`,
  'gradient-deep-space': `<radialGradient id="gradient-deep-space" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#434343" />
        <stop offset="100%" stop-color="#000000" />
      </radialGradient>`,

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
      </filter>`,
  'filter-ultra-chrome': `<filter id="filter-ultra-chrome" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
        <feSpecularLighting in="blur" surfaceScale="5" specularConstant="1" specularExponent="30" lighting-color="#ffffff" result="spec">
          <fePointLight x="-5000" y="-10000" z="20000" />
        </feSpecularLighting>
        <feComposite in="spec" in2="SourceAlpha" operator="in" />
        <feComposite in="SourceGraphic" in2="spec" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
      </filter>`,
  'filter-iridescent': `<filter id="filter-iridescent" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
        <feSpecularLighting in="blur" surfaceScale="5" specularConstant="1" specularExponent="20" lighting-color="#ff00ff" result="spec1">
          <fePointLight x="5000" y="-10000" z="20000" />
        </feSpecularLighting>
        <feSpecularLighting in="blur" surfaceScale="5" specularConstant="1" specularExponent="20" lighting-color="#00ffff" result="spec2">
          <fePointLight x="-5000" y="-10000" z="20000" />
        </feSpecularLighting>
        <feComposite in="spec1" in2="spec2" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="combinedSpec" />
        <feComposite in="combinedSpec" in2="SourceAlpha" operator="in" />
        <feComposite in="SourceGraphic" in2="combinedSpec" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
      </filter>`,
  'filter-aurora-glow': `<filter id="filter-aurora-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="10" result="blur" />
        <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="greenBlur" />
        <feOffset dx="10" dy="10" in="greenBlur" result="offsetBlur" />
        <feMerge>
          <feMergeNode in="offsetBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>`,
  'filter-float': `<filter id="filter-float" x="-20%" y="-20%" width="140%" height="160%">
        <feDropShadow dx="0" dy="10" stdDeviation="8" flood-opacity="0.2" />
      </filter>`,
  'filter-hologram': `<filter id="filter-hologram" x="-10%" y="-10%" width="120%" height="120%">
        <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 6 0 0  0 0 0 0.5 0" />
        <feGaussianBlur stdDeviation="1" />
      </filter>`,

  // NEW PREMIUM MATERIALS
  'gradient-liquid-metal': `<linearGradient id="gradient-liquid-metal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#c0c0c0" />
        <stop offset="25%" stop-color="#ffffff" />
        <stop offset="50%" stop-color="#808080" />
        <stop offset="75%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#404040" />
      </linearGradient>`,
  'gradient-plasma': `<linearGradient id="gradient-plasma" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ff00ff" />
        <stop offset="33%" stop-color="#00ffff" />
        <stop offset="66%" stop-color="#ffff00" />
        <stop offset="100%" stop-color="#ff00ff" />
      </linearGradient>`,
  'gradient-lava': `<linearGradient id="gradient-lava" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ff0000" />
        <stop offset="50%" stop-color="#ff6600" />
        <stop offset="100%" stop-color="#ffcc00" />
      </linearGradient>`,
  'gradient-quantum': `<linearGradient id="gradient-quantum" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00ff00" />
        <stop offset="25%" stop-color="#00ffff" />
        <stop offset="50%" stop-color="#ff00ff" />
        <stop offset="75%" stop-color="#ffff00" />
        <stop offset="100%" stop-color="#00ff00" />
      </linearGradient>`,
  'gradient-cosmic': `<radialGradient id="gradient-cosmic" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="30%" stop-color="#9933ff" />
        <stop offset="70%" stop-color="#3300ff" />
        <stop offset="100%" stop-color="#000000" />
      </radialGradient>`,
  'gradient-silk': `<linearGradient id="gradient-silk" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#e6d5c3" />
        <stop offset="50%" stop-color="#f5e6d3" />
        <stop offset="100%" stop-color="#d4c4b0" />
      </linearGradient>`,
  'gradient-liquid-rainbow': `<linearGradient id="gradient-liquid-rainbow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ff0080" />
        <stop offset="20%" stop-color="#ff8c00" />
        <stop offset="40%" stop-color="#40e0d0" />
        <stop offset="60%" stop-color="#0080ff" />
        <stop offset="80%" stop-color="#ff00ff" />
        <stop offset="100%" stop-color="#ff0080" />
      </linearGradient>`,
  'pattern-frosted': `<pattern id="pattern-frosted" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
        <rect width="4" height="4" fill="#e8f4f8" />
        <circle cx="1" cy="1" r="0.5" fill="#b0d4e3" opacity="0.4" />
        <circle cx="3" cy="3" r="0.5" fill="#b0d4e3" opacity="0.3" />
      </pattern>`,
  'pattern-silk-weave': `<pattern id="pattern-silk-weave" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="#e6d5c3" />
        <line x1="0" y1="0" x2="8" y2="8" stroke="#d4c4b0" stroke-width="0.5" opacity="0.5" />
        <line x1="8" y1="0" x2="0" y2="8" stroke="#d4c4b0" stroke-width="0.5" opacity="0.5" />
      </pattern>`,

  // NEW PREMIUM MATERIALS
  'gradient-pearl': `<radialGradient id="gradient-pearl" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="30%" stop-color="#f0f8ff" />
        <stop offset="60%" stop-color="#e6f2ff" />
        <stop offset="100%" stop-color="#d0e8ff" />
      </radialGradient>`,
  'gradient-obsidian': `<linearGradient id="gradient-obsidian" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1a1a2e" />
        <stop offset="50%" stop-color="#0f0f1e" />
        <stop offset="100%" stop-color="#16213e" />
      </linearGradient>`,
  'gradient-aurora-borealis': `<linearGradient id="gradient-aurora-borealis" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00ff88" />
        <stop offset="25%" stop-color="#00ffff" />
        <stop offset="50%" stop-color="#0088ff" />
        <stop offset="75%" stop-color="#ff00ff" />
        <stop offset="100%" stop-color="#00ff88" />
      </linearGradient>`,
  'gradient-sunset-fire': `<linearGradient id="gradient-sunset-fire" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ff6b35" />
        <stop offset="33%" stop-color="#f7931e" />
        <stop offset="66%" stop-color="#fdb833" />
        <stop offset="100%" stop-color="#f37335" />
      </linearGradient>`,
  'gradient-deep-ocean': `<linearGradient id="gradient-deep-ocean" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#001a4d" />
        <stop offset="50%" stop-color="#003d99" />
        <stop offset="100%" stop-color="#0066cc" />
      </linearGradient>`,
  'gradient-rose-gold': `<linearGradient id="gradient-rose-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f4a460" />
        <stop offset="50%" stop-color="#daa520" />
        <stop offset="100%" stop-color="#cd853f" />
      </linearGradient>`,
  'gradient-mint-cream': `<linearGradient id="gradient-mint-cream" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#98ff98" />
        <stop offset="50%" stop-color="#b0ffb0" />
        <stop offset="100%" stop-color="#90ee90" />
      </linearGradient>`,
  'gradient-midnight-purple': `<linearGradient id="gradient-midnight-purple" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#2d1b69" />
        <stop offset="50%" stop-color="#5a3a9e" />
        <stop offset="100%" stop-color="#8b5fbf" />
      </linearGradient>`,
  'pattern-diamond': `<pattern id="pattern-diamond" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill="#f0f0f0" />
        <polygon points="10,0 20,10 10,20 0,10" fill="none" stroke="#cccccc" stroke-width="1" />
        <circle cx="10" cy="10" r="2" fill="#e0e0e0" />
      </pattern>`,
  'pattern-gradient-mesh': `<pattern id="pattern-gradient-mesh" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
        <rect width="30" height="30" fill="#f5f5f5" />
        <line x1="0" y1="15" x2="30" y2="15" stroke="#e0e0e0" stroke-width="0.5" />
        <line x1="15" y1="0" x2="15" y2="30" stroke="#e0e0e0" stroke-width="0.5" />
        <circle cx="15" cy="15" r="3" fill="#d0d0d0" opacity="0.5" />
      </pattern>`,
  'pattern-hologram-grid': `<pattern id="pattern-hologram-grid" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
        <rect width="10" height="10" fill="#e0f7ff" />
        <rect x="0" y="0" width="10" height="10" fill="none" stroke="#00d4ff" stroke-width="0.5" opacity="0.6" />
        <circle cx="5" cy="5" r="1" fill="#00d4ff" opacity="0.4" />
      </pattern>`,

  // ADVANCED FILTERS FOR NEW MATERIALS
  'filter-pearl': `<filter id="filter-pearl" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
        <feSpecularLighting in="blur" surfaceScale="3" specularConstant="1.2" specularExponent="45" lighting-color="#ffffff" result="spec">
          <fePointLight x="0.4" y="0.4" z="0.7" />
        </feSpecularLighting>
        <feComposite in="spec" in2="SourceAlpha" operator="in" result="spec" />
        <feComposite in="SourceGraphic" in2="spec" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint" />
        <feColorMatrix in="litPaint" type="saturate" values="0.7" />
      </filter>`,
  'filter-obsidian': `<filter id="filter-obsidian" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
        <feSpecularLighting in="blur" surfaceScale="2" specularConstant="0.5" specularExponent="50" lighting-color="#666666" result="spec">
          <fePointLight x="0.2" y="0.2" z="0.3" />
        </feSpecularLighting>
        <feComposite in="spec" in2="SourceAlpha" operator="in" result="spec" />
        <feComposite in="SourceGraphic" in2="spec" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint" />
        <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#000000" flood-opacity="0.6" />
      </filter>`,
  'filter-aurora-borealis': `<filter id="filter-aurora-borealis" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
        <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur2" />
        <feFlood flood-color="currentColor" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow1" />
        <feComposite in="color" in2="blur2" operator="in" result="glow2" />
        <feMerge>
          <feMergeNode in="glow2" />
          <feMergeNode in="glow1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>`,
  'filter-sunset-fire': `<filter id="filter-sunset-fire" x="-25%" y="-25%" width="150%" height="150%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
        <feSpecularLighting in="blur" surfaceScale="4" specularConstant="1.5" specularExponent="25" lighting-color="#ffaa00" result="spec">
          <fePointLight x="0.3" y="0.3" z="0.5" />
        </feSpecularLighting>
        <feComposite in="spec" in2="SourceAlpha" operator="in" result="spec" />
        <feComposite in="SourceGraphic" in2="spec" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint" />
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#ff6600" flood-opacity="0.4" />
      </filter>`,
  'filter-deep-ocean': `<filter id="filter-deep-ocean" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="blur" />
        <feSpecularLighting in="blur" surfaceScale="3" specularConstant="1" specularExponent="35" lighting-color="#0099ff" result="spec">
          <fePointLight x="0.3" y="0.3" z="0.4" />
        </feSpecularLighting>
        <feComposite in="spec" in2="SourceAlpha" operator="in" result="spec" />
        <feComposite in="SourceGraphic" in2="spec" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint" />
        <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#000066" flood-opacity="0.5" />
      </filter>`,
  'filter-rose-gold': `<filter id="filter-rose-gold" x="-25%" y="-25%" width="150%" height="150%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
        <feSpecularLighting in="blur" surfaceScale="3.5" specularConstant="1.3" specularExponent="40" lighting-color="#ffd700" result="spec">
          <fePointLight x="0.35" y="0.35" z="0.6" />
        </feSpecularLighting>
        <feComposite in="spec" in2="SourceAlpha" operator="in" result="spec" />
        <feComposite in="SourceGraphic" in2="spec" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint" />
        <feDropShadow dx="1" dy="1" stdDeviation="2" flood-color="#8b4513" flood-opacity="0.3" />
      </filter>`,
  'filter-mint-cream': `<filter id="filter-mint-cream" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
        <feSpecularLighting in="blur" surfaceScale="2.5" specularConstant="1" specularExponent="30" lighting-color="#ffffff" result="spec">
          <fePointLight x="0.4" y="0.4" z="0.5" />
        </feSpecularLighting>
        <feComposite in="spec" in2="SourceAlpha" operator="in" result="spec" />
        <feComposite in="SourceGraphic" in2="spec" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint" />
        <feColorMatrix in="litPaint" type="saturate" values="1.1" />
      </filter>`,
  'filter-midnight-purple': `<filter id="filter-midnight-purple" x="-35%" y="-35%" width="170%" height="170%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="blur" />
        <feSpecularLighting in="blur" surfaceScale="3.5" specularConstant="1.2" specularExponent="38" lighting-color="#bb86fc" result="spec">
          <fePointLight x="0.3" y="0.3" z="0.5" />
        </feSpecularLighting>
        <feComposite in="spec" in2="SourceAlpha" operator="in" result="spec" />
        <feComposite in="SourceGraphic" in2="spec" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint" />
        <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#2d1b69" flood-opacity="0.4" />
      </filter>`,
  'filter-hologram-premium': `<filter id="filter-hologram-premium" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
        <feSpecularLighting in="blur" surfaceScale="2" specularConstant="1.5" specularExponent="50" lighting-color="#00ffff" result="spec">
          <fePointLight x="0.5" y="0.5" z="0.8" />
        </feSpecularLighting>
        <feComposite in="spec" in2="SourceAlpha" operator="in" result="spec" />
        <feComposite in="SourceGraphic" in2="spec" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint" />
        <feColorMatrix in="litPaint" type="saturate" values="1.3" />
      </filter>`,

  // ADVANCED FILTERS
  'filter-liquid-metal': `<filter id="filter-liquid-metal" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
        <feSpecularLighting in="blur" surfaceScale="8" specularConstant="1.5" specularExponent="40" lighting-color="#ffffff" result="spec">
          <fePointLight x="-5000" y="-10000" z="30000" />
        </feSpecularLighting>
        <feComposite in="spec" in2="SourceAlpha" operator="in" result="spec" />
        <feComposite in="SourceGraphic" in2="spec" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint" />
        <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.4" />
      </filter>`,
  'filter-plasma': `<filter id="filter-plasma" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
        <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="blur2" />
        <feGaussianBlur in="SourceAlpha" stdDeviation="8" result="blur3" />
        <feFlood flood-color="currentColor" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow1" />
        <feComposite in="color" in2="blur2" operator="in" result="glow2" />
        <feComposite in="color" in2="blur3" operator="in" result="glow3" />
        <feMerge>
          <feMergeNode in="glow3" />
          <feMergeNode in="glow2" />
          <feMergeNode in="glow1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>`,
  'filter-lava': `<filter id="filter-lava" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
        <feSpecularLighting in="blur" surfaceScale="5" specularConstant="1" specularExponent="25" lighting-color="#ffaa00" result="spec">
          <fePointLight x="0.3" y="0.3" z="0.5" />
        </feSpecularLighting>
        <feComposite in="spec" in2="SourceAlpha" operator="in" result="spec" />
        <feComposite in="SourceGraphic" in2="spec" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint" />
        <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#ff0000" flood-opacity="0.3" />
      </filter>`,
  'filter-quantum': `<filter id="filter-quantum" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
        <feSpecularLighting in="blur" surfaceScale="3" specularConstant="2" specularExponent="50" lighting-color="#00ff00" result="spec">
          <fePointLight x="0.5" y="0.5" z="1" />
        </feSpecularLighting>
        <feComposite in="spec" in2="SourceAlpha" operator="in" result="spec" />
        <feComposite in="SourceGraphic" in2="spec" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint" />
        <feGaussianBlur in="litPaint" stdDeviation="0.5" result="glow" />
        <feComposite in="glow" in2="litPaint" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
      </filter>`,
  'filter-cosmic': `<filter id="filter-cosmic" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
        <feSpecularLighting in="blur" surfaceScale="6" specularConstant="1.2" specularExponent="35" lighting-color="#9933ff" result="spec">
          <fePointLight x="0.2" y="0.2" z="0.8" />
        </feSpecularLighting>
        <feComposite in="spec" in2="SourceAlpha" operator="in" result="spec" />
        <feComposite in="SourceGraphic" in2="spec" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint" />
        <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#3300ff" flood-opacity="0.5" />
      </filter>`,
  'filter-frosted-glass': `<filter id="filter-frosted-glass" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
        <feSpecularLighting in="blur" surfaceScale="2" specularConstant="1" specularExponent="20" lighting-color="#ffffff" result="spec">
          <fePointLight x="0.3" y="0.3" z="0.3" />
        </feSpecularLighting>
        <feComposite in="spec" in2="SourceAlpha" operator="in" result="spec" />
        <feComposite in="SourceGraphic" in2="spec" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint" />
        <feColorMatrix in="litPaint" type="saturate" values="0.8" />
      </filter>`,
  'filter-silk': `<filter id="filter-silk" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
        <feSpecularLighting in="blur" surfaceScale="2" specularConstant="0.8" specularExponent="15" lighting-color="#ffffff" result="spec">
          <fePointLight x="0.4" y="0.4" z="0.4" />
        </feSpecularLighting>
        <feComposite in="spec" in2="SourceAlpha" operator="in" result="spec" />
        <feComposite in="SourceGraphic" in2="spec" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint" />
        <feColorMatrix in="litPaint" type="saturate" values="0.9" />
      </filter>`,
  'filter-liquid-rainbow': `<filter id="filter-liquid-rainbow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="blur" />
        <feSpecularLighting in="blur" surfaceScale="4" specularConstant="1.3" specularExponent="30" lighting-color="#ffffff" result="spec">
          <fePointLight x="0.3" y="0.3" z="0.6" />
        </feSpecularLighting>
        <feComposite in="spec" in2="SourceAlpha" operator="in" result="spec" />
        <feComposite in="SourceGraphic" in2="spec" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint" />
        <feDropShadow dx="0" dy="0" stdDeviation="5" flood-opacity="0.3" />
      </filter>`
};

export const SVG_DEFS = Object.values(SVG_DEF_MAP).join('\n');
