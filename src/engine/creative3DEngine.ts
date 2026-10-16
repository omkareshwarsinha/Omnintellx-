/**
 * Omnintellx — Creative 3D & WebGL Engineering Directives
 * Enforces authentic, non-template 3D website design:
 * - Understands Scene, Camera, Renderer, Lighting, Materials, Shaders, Particles, and Controls
 * - Distinct visual concepts: Spatial Neural Network, Cybersecurity Grid, Luxury Product, Spatial SaaS
 * - Enforces mobile performance: clamp(devicePixelRatio, 2), throttled loops, prefers-reduced-motion, WebGL capability check
 */

export interface Creative3DConcept {
  archetype: 'AI_SPATIAL_NETWORK' | 'CYBERSECURITY_GRID' | 'LUXURY_CINEMATIC' | 'SPATIAL_SAAS' | 'CUSTOM';
  visualTheme: string;
  lightingStrategy: string;
  interactionModel: string;
  mobileFallbacks: string[];
}

export class Creative3DEngine {
  static analyzeMission3DConcept(goal: string): Creative3DConcept {
    const lower = goal.toLowerCase();

    if (lower.includes('cyber') || lower.includes('security') || lower.includes('threat') || lower.includes('terminal')) {
      return {
        archetype: 'CYBERSECURITY_GRID',
        visualTheme: 'Volumetric wireframe grid, glowing threat nodes, animated defense shields, terminal green/cyan neon accents',
        lightingStrategy: 'Directional cyan rim light + deep blue ambient, subtle point light pulse upon intrusion events',
        interactionModel: 'Mouse parallax rotates node constellation, click to isolate subnet',
        mobileFallbacks: ['Clamp particle count to 250', 'Disable post-processing bloom on touch devices', 'Fallback to static canvas gradient if WebGL context lost']
      };
    }

    if (lower.includes('luxury') || lower.includes('watch') || lower.includes('car') || lower.includes('fashion') || lower.includes('perfume')) {
      return {
        archetype: 'LUXURY_CINEMATIC',
        visualTheme: 'Minimalist metallic finishes, anisotropic reflections, smooth cinematic orbit camera, deep rich shadows',
        lightingStrategy: 'Three-point studio lighting with high-dynamic range specular highlights and soft shadow maps',
        interactionModel: 'Smooth damped scroll-driven camera rotation and focal distance adjustment',
        mobileFallbacks: ['Reduce shadow map resolution to 512px', 'Limit pixel ratio to 1.5', 'Touch pan with inertia']
      };
    }

    if (lower.includes('saas') || lower.includes('dashboard') || lower.includes('analytics') || lower.includes('platform')) {
      return {
        archetype: 'SPATIAL_SAAS',
        visualTheme: 'Isometric floating translucent glass cards, 3D bar graphs, particle data streams, depth-of-field blur',
        lightingStrategy: 'Dual gradient hemisphere lighting (indigo to violet) with soft top-down spotlight',
        interactionModel: 'Hover card elevation, interactive cursor magnetic pull',
        mobileFallbacks: ['Flat 2.5D CSS tilt on mobile', 'Static mesh rendering without continuous RAF on idle']
      };
    }

    return {
      archetype: 'AI_SPATIAL_NETWORK',
      visualTheme: 'Synaptic neural network, connected geodesic nodes, drifting pulse energy packets, deep space navy atmosphere',
      lightingStrategy: 'Multi-color point lights at cluster nodes with subtle ambient glow',
      interactionModel: 'Cursor raycasting creates gravitational distortion wave across nearby nodes',
      mobileFallbacks: ['Max 400 node vertices', 'Clamp renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))', 'Respect prefers-reduced-motion']
    };
  }

  static generate3DSystemDirective(concept: Creative3DConcept): string {
    return `[OMNINTELLX 3D/WEBGL ARCHITECTURAL DIRECTIVE]
Visual Archetype: ${concept.archetype}
Visual Concept: ${concept.visualTheme}
Lighting Architecture: ${concept.lightingStrategy}
Interaction Model: ${concept.interactionModel}
Mobile Constraints:
- Always enforce renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
- Always listen to window resize and update camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height);
- Check window.matchMedia('(prefers-reduced-motion: reduce)') and disable continuous spin if active.
- Handle WebGL contextloss cleanly via canvas.addEventListener('webglcontextlost', ...).
- Provide meaningful HTML content (headings, buttons, features) alongside the canvas for complete accessibility and SEO.`;
  }
}
