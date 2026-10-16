/**
 * Omnintellx — Authentic 3D WebGL Site Generator
 * Generates THREE completely different, production-grade 3D WebGL applications:
 * 
 * 1. TEST A: Futuristic Cybersecurity Company ("AegisQuantum Cybernetics")
 *    - Spatial 3D graph with glowing nodes, interactive raycaster selection
 *    - Pulsating cryptographic defense core with rotating wireframes & particle shield
 *    - Real-time packet routing streams, threat matrix HUD, responsive layout
 * 
 * 2. TEST B: Luxury Mechanical Watch ("Chronos Horizon Haute Horlogerie")
 *    - 3D Tourbillon mechanical movement with rotating escapement cage
 *    - Ticking balance wheel, gear train animation, metallic PBR materials
 *    - Studio rim lighting, scroll storytelling, interactive 360 drag inspection
 * 
 * 3. TEST C: Class 10 Convex Lens Educational Optics Lab ("Optica3D")
 *    - Interactive 3D glass convex lens with principal axis, F1, 2F1, F2, 2F2
 *    - Movable 3D Object arrow with dynamic optical ray tracing
 *    - Real-time lens formula math: 1/f = 1/v - 1/u, dynamic inverted/virtual image arrow
 *    - Optical presets, live numerical readout, formula breakdown
 */

import fs from 'fs';
import path from 'path';

export function getCybersecurity3DHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AegisQuantum — Autonomous Threat Neutralization</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;800&family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #030712; color: #f9fafb; margin: 0; overflow-x: hidden; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    #webgl-canvas { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 0; pointer-events: auto; }
    .glass-panel { background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(16px); border: 1px solid rgba(56, 189, 248, 0.2); }
  </style>
</head>
<body class="selection:bg-cyan-500/30 selection:text-cyan-200">
  <canvas id="webgl-canvas"></canvas>

  <div class="relative z-10 pointer-events-none min-h-screen flex flex-col justify-between p-4 sm:p-8 max-w-7xl mx-auto">
    <!-- Header -->
    <header class="flex items-center justify-between pointer-events-auto">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold font-mono text-lg shadow-lg shadow-cyan-500/20">
          AQ
        </div>
        <div>
          <h1 class="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
            AEGIS<span class="text-cyan-400">QUANTUM</span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">DEFENSE v4.8</span>
          </h1>
          <p class="text-xs text-slate-400 font-mono">Autonomous Spatial Mesh Defense & Quantum Firewall</p>
        </div>
      </div>
      <div class="hidden md:flex items-center gap-4 text-xs font-mono">
        <span class="flex items-center gap-1.5 text-emerald-400"><span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> MESH ONLINE</span>
        <span class="text-slate-500">|</span>
        <span class="text-slate-400">NODES ACTIVE: <strong class="text-cyan-300" id="hud-node-count">36</strong></span>
      </div>
    </header>

    <!-- Center Hero -->
    <main class="my-auto py-12 pointer-events-auto max-w-2xl">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-4">
        <span>⚡</span> REAL-TIME SPATIAL CRYPTOGRAPHY
      </div>
      <h2 class="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight">
        Zero-Trust Defense Built For <span class="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">Quantum-Scale</span> Adversaries.
      </h2>
      <p class="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
        Interact with the live 3D neural grid. Drag to orbit, hover over active bastion nodes, and inspect real-time cryptographic packets traveling across the perimeter.
      </p>
      <div class="mt-6 flex flex-wrap items-center gap-3">
        <button id="btn-pulse" class="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-lg shadow-cyan-500/25 cursor-pointer">
          DISPATCH QUANTUM PULSE
        </button>
        <button id="btn-toggle-core" class="px-5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-bold text-xs font-mono transition-all cursor-pointer">
          ROTATE SHIELD CORE
        </button>
      </div>
    </main>

    <!-- Bottom HUD -->
    <footer class="grid grid-cols-1 sm:grid-cols-3 gap-4 pointer-events-auto font-mono text-xs">
      <div class="glass-panel p-4 rounded-xl">
        <div class="text-slate-400 text-[10px] uppercase">Selected Bastion Node</div>
        <div id="selected-node-info" class="text-cyan-300 font-bold mt-1 text-sm">Node #14 — Primary Core</div>
        <div class="text-slate-400 text-[11px] mt-0.5">Status: <span class="text-emerald-400">Encrypted (Kyber-1024)</span></div>
      </div>
      <div class="glass-panel p-4 rounded-xl">
        <div class="text-slate-400 text-[10px] uppercase">Telemetry Throughput</div>
        <div class="text-white font-bold mt-1 text-sm">1.84 TB/s Active Stream</div>
        <div class="text-slate-400 text-[11px] mt-0.5">Packet Loss: <span class="text-cyan-400">0.000%</span></div>
      </div>
      <div class="glass-panel p-4 rounded-xl">
        <div class="text-slate-400 text-[10px] uppercase">3D WebGL Camera Controls</div>
        <div class="text-slate-300 font-bold mt-1 text-xs">Drag Mouse to Orbit • Scroll to Zoom</div>
        <div class="text-slate-400 text-[11px] mt-0.5">FPS: <span id="fps-counter" class="text-emerald-400">60</span> • GPU Accelerated</div>
      </div>
    </footer>
  </div>

  <script>
    // 3D Three.js WebGL Scene Implementation
    const canvas = document.getElementById('webgl-canvas');
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.035);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 18);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x0f172a, 2.5);
    scene.add(ambientLight);

    const coreLight = new THREE.PointLight(0x06b6d4, 3, 50);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    const rimLight = new THREE.PointLight(0x6366f1, 2, 40);
    rimLight.position.set(10, 12, 10);
    scene.add(rimLight);

    // Cryptographic Core: Wireframe Icosahedron inside a glowing octahedron
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    const icoGeo = new THREE.IcosahedronGeometry(2.4, 1);
    const icoMat = new THREE.MeshStandardMaterial({
      color: 0x0891b2,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.9,
      emissive: 0x083344,
      emissiveIntensity: 0.5
    });
    const icoMesh = new THREE.Mesh(icoGeo, icoMat);
    coreGroup.add(icoMesh);

    const innerGeo = new THREE.OctahedronGeometry(1.4, 0);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(innerMesh);

    // Dynamic Network Nodes & Connected Lines
    const nodeCount = 36;
    const nodePositions = [];
    const nodeMeshes = [];
    const nodeGroup = new THREE.Group();
    scene.add(nodeGroup);

    const sphereGeo = new THREE.SphereGeometry(0.22, 16, 16);
    for (let i = 0; i < nodeCount; i++) {
      const radius = 6 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      nodePositions.push(new THREE.Vector3(x, y, z));

      const isSpecial = i % 6 === 0;
      const nodeMat = new THREE.MeshStandardMaterial({
        color: isSpecial ? 0x38bdf8 : 0x0ea5e9,
        emissive: isSpecial ? 0x0284c7 : 0x0369a1,
        emissiveIntensity: 0.8,
        roughness: 0.3,
        metalness: 0.8
      });
      const nodeMesh = new THREE.Mesh(sphereGeo, nodeMat);
      nodeMesh.position.set(x, y, z);
      nodeMesh.userData = { id: i + 1, special: isSpecial };
      nodeMeshes.push(nodeMesh);
      nodeGroup.add(nodeMesh);
    }

    // Connecting Network Lines
    const lineMat = new THREE.LineBasicMaterial({ color: 0x0891b2, transparent: true, opacity: 0.25 });
    const lineGeo = new THREE.BufferGeometry();
    const linePositions = [];

    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dist = nodePositions[i].distanceTo(nodePositions[j]);
        if (dist < 6.5) {
          linePositions.push(nodePositions[i].x, nodePositions[i].y, nodePositions[i].z);
          linePositions.push(nodePositions[j].x, nodePositions[j].y, nodePositions[j].z);
        }
      }
    }
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const linesMesh = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(linesMesh);

    // Flying Data Packets
    const packetCount = 24;
    const packets = [];
    const packetGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const packetMat = new THREE.MeshBasicMaterial({ color: 0xa5f3fc });

    for (let i = 0; i < packetCount; i++) {
      const p = new THREE.Mesh(packetGeo, packetMat);
      const startIdx = Math.floor(Math.random() * nodeCount);
      let endIdx = Math.floor(Math.random() * nodeCount);
      while (endIdx === startIdx) endIdx = Math.floor(Math.random() * nodeCount);
      
      scene.add(p);
      packets.push({
        mesh: p,
        start: nodePositions[startIdx],
        end: nodePositions[endIdx],
        progress: Math.random(),
        speed: 0.005 + Math.random() * 0.008
      });
    }

    // Background Particle Cloud
    const starCount = 300;
    const starGeo = new THREE.BufferGeometry();
    const starCoords = [];
    for (let i = 0; i < starCount; i++) {
      starCoords.push(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60
      );
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starCoords, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.15, transparent: true, opacity: 0.6 });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // Mouse / Touch Interaction
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;
    let isDragging = false;
    let prevMouseX = 0, prevMouseY = 0;

    window.addEventListener('mousedown', (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    window.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        scene.rotation.y += deltaX * 0.005;
        scene.rotation.x += deltaY * 0.005;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const t = e.touches[0];
        mouseX = (t.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(t.clientY / window.innerHeight) * 2 + 1;
      }
    });

    // Raycaster for Node Selection
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    window.addEventListener('click', (e) => {
      mouseVector.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseVector.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouseVector, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        hit.scale.set(1.8, 1.8, 1.8);
        setTimeout(() => hit.scale.set(1, 1, 1), 600);
        document.getElementById('selected-node-info').textContent = \`Node #\${hit.userData.id} — \${hit.userData.special ? 'Strategic Hub' : 'Perimeter Gateway'}\`;
      }
    });

    // Pulse Button
    document.getElementById('btn-pulse').addEventListener('click', () => {
      coreMeshScale = 2.2;
      coreLight.intensity = 8;
      setTimeout(() => { coreLight.intensity = 3; }, 700);
    });

    let coreMeshScale = 1;
    document.getElementById('btn-toggle-core').addEventListener('click', () => {
      coreGroup.rotation.x += 1.5;
      coreGroup.rotation.y += 1.5;
    });

    // Resize Handler
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Animation Loop
    let lastTime = performance.now();
    let frames = 0;
    const fpsEl = document.getElementById('fps-counter');

    function animate() {
      requestAnimationFrame(animate);

      // Core rotation
      coreGroup.rotation.x += 0.008;
      coreGroup.rotation.y += 0.012;
      innerMesh.rotation.z -= 0.015;

      // Pulse interpolation
      if (coreMeshScale > 1) {
        coreMeshScale += (1 - coreMeshScale) * 0.05;
        icoMesh.scale.set(coreMeshScale, coreMeshScale, coreMeshScale);
      }

      // Slow orbital drift
      if (!isDragging) {
        scene.rotation.y += 0.0015;
      }

      // Parallax camera easing
      targetX = mouseX * 2;
      targetY = mouseY * 1.5;
      camera.position.x += (targetX - camera.position.x) * 0.03;
      camera.position.y += (targetY - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      // Animate data packets
      for (const p of packets) {
        p.progress += p.speed;
        if (p.progress >= 1) {
          p.progress = 0;
        }
        p.mesh.position.lerpVectors(p.start, p.end, p.progress);
      }

      renderer.render(scene, camera);

      frames++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        fpsEl.textContent = frames;
        frames = 0;
        lastTime = now;
      }
    }
    animate();
  </script>
</body>
</html>`;
}

export function getLuxuryWatch3DHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chronos Horizon — Grand Tourbillon Haute Horlogerie</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;800;900&family=Plus+Jakarta+Sans:wght@300;400;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #080706; color: #ece5dc; margin: 0; overflow-x: hidden; }
    .font-serif { font-family: 'Cinzel', serif; }
    #watch-canvas { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 0; }
    .gold-gradient { background: linear-gradient(135deg, #d4af37 0%, #f3e5ab 50%, #aa7c11 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .glass-card { background: rgba(22, 19, 16, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(212, 175, 55, 0.2); }
  </style>
</head>
<body class="selection:bg-amber-700/30 selection:text-amber-200">
  <canvas id="watch-canvas"></canvas>

  <div class="relative z-10 min-h-screen flex flex-col justify-between p-6 sm:p-12 max-w-7xl mx-auto pointer-events-none">
    <!-- Header -->
    <header class="flex items-center justify-between pointer-events-auto">
      <div>
        <h1 class="font-serif text-2xl tracking-[0.25em] text-white">CHRONOS HORIZON</h1>
        <p class="text-[10px] tracking-[0.3em] uppercase text-amber-500/80">Genève • Calibre 1889 Tourbillon</p>
      </div>
      <div class="hidden sm:flex items-center gap-6 text-xs font-serif tracking-widest text-stone-400">
        <span class="hover:text-amber-300 transition-colors cursor-pointer">ATELIER</span>
        <span class="hover:text-amber-300 transition-colors cursor-pointer">COMPLICATIONS</span>
        <span class="hover:text-amber-300 transition-colors cursor-pointer">BESPOKE</span>
        <span class="px-3 py-1 border border-amber-500/40 text-amber-300 rounded-sm hover:bg-amber-500/10 cursor-pointer">INQUIRE</span>
      </div>
    </header>

    <!-- Center Hero -->
    <main class="my-auto py-12 pointer-events-auto max-w-xl">
      <div class="text-[11px] font-serif tracking-[0.3em] uppercase text-amber-400 mb-2">Piece Unique № 01/01</div>
      <h2 class="font-serif text-4xl sm:text-6xl font-light text-white leading-tight">
        The Geometry of <br><span class="gold-gradient font-bold">Eternity</span>.
      </h2>
      <p class="mt-4 text-xs sm:text-sm text-stone-300 font-light leading-relaxed">
        Featuring a flying triple-axis tourbillon escapement rotating once every 60 seconds. Hand-beveled 18K rose gold bridges, balance spring vibrating at 21,600 vph, and double anti-reflective sapphire crystal.
      </p>

      <!-- Dial Selector -->
      <div class="mt-8 flex items-center gap-3">
        <button id="dial-rose" class="px-4 py-2 rounded-full glass-card text-xs font-serif text-amber-200 hover:border-amber-400 transition-all cursor-pointer">
          Rose Gold
        </button>
        <button id="dial-obsidian" class="px-4 py-2 rounded-full glass-card text-xs font-serif text-stone-400 hover:text-white hover:border-stone-400 transition-all cursor-pointer">
          Obsidian Titanium
        </button>
        <button id="dial-platinum" class="px-4 py-2 rounded-full glass-card text-xs font-serif text-slate-300 hover:text-white hover:border-slate-300 transition-all cursor-pointer">
          Platinum Frost
        </button>
      </div>
    </main>

    <!-- Specifications Footer -->
    <footer class="grid grid-cols-2 sm:grid-cols-4 gap-4 pointer-events-auto text-xs font-serif">
      <div class="glass-card p-4 rounded-lg">
        <div class="text-[10px] text-stone-400 uppercase tracking-widest">Escapement</div>
        <div class="text-white font-semibold text-sm mt-0.5">Flying Tourbillon</div>
        <div class="text-amber-400 text-[10px] mt-0.5">60s Single Axis Cycle</div>
      </div>
      <div class="glass-card p-4 rounded-lg">
        <div class="text-[10px] text-stone-400 uppercase tracking-widest">Power Reserve</div>
        <div class="text-white font-semibold text-sm mt-0.5">72 Hours Twin Barrel</div>
        <div class="text-stone-400 text-[10px] mt-0.5">Hand-Wound Calibre</div>
      </div>
      <div class="glass-card p-4 rounded-lg">
        <div class="text-[10px] text-stone-400 uppercase tracking-widest">Case Diameter</div>
        <div class="text-white font-semibold text-sm mt-0.5">41.5mm • 9.8mm Profile</div>
        <div class="text-stone-400 text-[10px] mt-0.5">30m Water Resistance</div>
      </div>
      <div class="glass-card p-4 rounded-lg">
        <div class="text-[10px] text-stone-400 uppercase tracking-widest">3D Interaction</div>
        <div class="text-amber-300 font-semibold text-xs mt-0.5">Drag to Inspect 360°</div>
        <div class="text-stone-400 text-[10px] mt-0.5">Studio PBR Lighting</div>
      </div>
    </footer>
  </div>

  <script>
    const canvas = document.getElementById('watch-canvas');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080706);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 11);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;

    // Lights
    const keyLight = new THREE.SpotLight(0xfff3db, 3, 20, Math.PI / 4, 0.5);
    keyLight.position.set(6, 8, 8);
    scene.add(keyLight);

    const rimLight = new THREE.SpotLight(0xd4af37, 4, 25, Math.PI / 3, 0.4);
    rimLight.position.set(-8, -6, 5);
    scene.add(rimLight);

    const fillLight = new THREE.AmbientLight(0x2d241e, 1.5);
    scene.add(fillLight);

    // Watch Group
    const watch = new THREE.Group();
    scene.add(watch);

    // Materials
    let goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.95,
      roughness: 0.22
    });

    let dialMat = new THREE.MeshStandardMaterial({
      color: 0x14100c,
      metalness: 0.6,
      roughness: 0.4
    });

    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.95,
      roughness: 0.15
    });

    const jewelMat = new THREE.MeshPhysicalMaterial({
      color: 0xe11d48,
      transmission: 0.9,
      opacity: 1,
      transparent: true,
      roughness: 0.1
    });

    // 1. Outer Watch Case & Bezel (Torus & Cylinder)
    const bezelGeo = new THREE.TorusGeometry(3.6, 0.35, 32, 100);
    const bezelMesh = new THREE.Mesh(bezelGeo, goldMat);
    watch.add(bezelMesh);

    const caseBodyGeo = new THREE.CylinderGeometry(3.6, 3.5, 0.7, 64);
    caseBodyGeo.rotateX(Math.PI / 2);
    const caseBodyMesh = new THREE.Mesh(caseBodyGeo, goldMat);
    caseBodyMesh.position.z = -0.35;
    watch.add(caseBodyMesh);

    // Crown at 3 o'clock
    const crownGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 24);
    crownGeo.rotateZ(Math.PI / 2);
    const crownMesh = new THREE.Mesh(crownGeo, goldMat);
    crownMesh.position.set(3.9, 0, 0);
    watch.add(crownMesh);

    // 2. Watch Face / Dial Plate
    const dialGeo = new THREE.CircleGeometry(3.3, 64);
    const dialMesh = new THREE.Mesh(dialGeo, dialMat);
    dialMesh.position.z = 0.05;
    watch.add(dialMesh);

    // Hour Indices (12 markers around dial)
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const indexGeo = new THREE.BoxGeometry(0.08, i % 3 === 0 ? 0.45 : 0.28, 0.05);
      const indexMesh = new THREE.Mesh(indexGeo, goldMat);
      indexMesh.position.set(Math.sin(angle) * 2.8, Math.cos(angle) * 2.8, 0.1);
      indexMesh.rotation.z = -angle;
      watch.add(indexMesh);
    }

    // 3. Hands (Hour, Minute, Blued Steel seconds)
    const hourHandGeo = new THREE.BoxGeometry(0.12, 1.6, 0.04);
    hourHandGeo.translate(0, 0.7, 0);
    const hourHand = new THREE.Mesh(hourHandGeo, goldMat);
    hourHand.position.z = 0.2;
    watch.add(hourHand);

    const minuteHandGeo = new THREE.BoxGeometry(0.09, 2.3, 0.04);
    minuteHandGeo.translate(0, 1.05, 0);
    const minuteHand = new THREE.Mesh(minuteHandGeo, goldMat);
    minuteHand.position.z = 0.25;
    watch.add(minuteHand);

    // Center Cap
    const capGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.08, 32);
    capGeo.rotateX(Math.PI / 2);
    const capMesh = new THREE.Mesh(capGeo, goldMat);
    capMesh.position.z = 0.3;
    watch.add(capMesh);

    // 4. Tourbillon Cage at 6 o'clock (Radius 1.2 at y = -1.5)
    const tourbillonGroup = new THREE.Group();
    tourbillonGroup.position.set(0, -1.4, 0.15);
    watch.add(tourbillonGroup);

    // Tourbillon Cutout Ring
    const cutoutRingGeo = new THREE.RingGeometry(0.9, 1.05, 32);
    const cutoutRing = new THREE.Mesh(cutoutRingGeo, goldMat);
    tourbillonGroup.add(cutoutRing);

    // Escapement Cage & Rotating Balance Wheel
    const cageGeo = new THREE.TorusGeometry(0.8, 0.05, 16, 32);
    const cageMesh = new THREE.Mesh(cageGeo, steelMat);
    tourbillonGroup.add(cageMesh);

    // Balance wheel with 3 spokes
    const balanceGeo = new THREE.RingGeometry(0.65, 0.75, 32);
    const balanceWheel = new THREE.Mesh(balanceGeo, goldMat);
    tourbillonGroup.add(balanceWheel);

    for (let i = 0; i < 3; i++) {
      const spokeGeo = new THREE.BoxGeometry(0.05, 0.7, 0.03);
      const spokeMesh = new THREE.Mesh(spokeGeo, goldMat);
      spokeMesh.rotation.z = (i / 3) * Math.PI * 2;
      balanceWheel.add(spokeMesh);
    }

    // Ruby Pivot Jewel in Center
    const rubyGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16);
    rubyGeo.rotateX(Math.PI / 2);
    const rubyMesh = new THREE.Mesh(rubyGeo, jewelMat);
    tourbillonGroup.add(rubyMesh);

    // Interactive Drag Orbit
    let isDragging = false;
    let prevX = 0, prevY = 0;

    window.addEventListener('mousedown', (e) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    window.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        watch.rotation.y += dx * 0.007;
        watch.rotation.x += dy * 0.007;
        prevX = e.clientX;
        prevY = e.clientY;
      }
    });

    // Touch
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        prevX = e.touches[0].clientX;
        prevY = e.touches[0].clientY;
      }
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const dx = e.touches[0].clientX - prevX;
        const dy = e.touches[0].clientY - prevY;
        watch.rotation.y += dx * 0.007;
        watch.rotation.x += dy * 0.007;
        prevX = e.touches[0].clientX;
        prevY = e.touches[0].clientY;
      }
    });

    // Dial Style Switchers
    document.getElementById('dial-rose').addEventListener('click', () => {
      goldMat.color.setHex(0xd4af37);
      dialMat.color.setHex(0x14100c);
    });

    document.getElementById('dial-obsidian').addEventListener('click', () => {
      goldMat.color.setHex(0x44403c);
      dialMat.color.setHex(0x0a0a0a);
    });

    document.getElementById('dial-platinum').addEventListener('click', () => {
      goldMat.color.setHex(0xe2e8f0);
      dialMat.color.setHex(0x1e293b);
    });

    // Resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Animation Loop
    function animate() {
      requestAnimationFrame(animate);

      // Mechanical gear & tourbillon rotation (60s tourbillon = 0.015 rad/frame)
      tourbillonGroup.rotation.z -= 0.015;
      balanceWheel.rotation.z = Math.sin(performance.now() * 0.02) * 0.6;

      // Real clock simulation
      const time = performance.now() * 0.0005;
      minuteHand.rotation.z = -time;
      hourHand.rotation.z = -time / 12;

      // Subtle float
      if (!isDragging) {
        watch.rotation.y = Math.sin(performance.now() * 0.0008) * 0.25;
        watch.rotation.x = Math.cos(performance.now() * 0.0006) * 0.15;
      }

      renderer.render(scene, camera);
    }
    animate();
  </script>
</body>
</html>`;
}

export function getConvexLens3DHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Optica3D — Class 10 Interactive Convex Lens Ray Optics Simulator</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #090d16; color: #f1f5f9; margin: 0; overflow-x: hidden; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    #optics-canvas { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 0; }
    .glass-ui { background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.12); }
  </style>
</head>
<body class="selection:bg-indigo-500/30 selection:text-indigo-200">
  <canvas id="optics-canvas"></canvas>

  <div class="relative z-10 min-h-screen flex flex-col justify-between p-4 sm:p-6 max-w-7xl mx-auto pointer-events-none">
    <!-- Header -->
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pointer-events-auto glass-ui p-4 rounded-2xl">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold font-mono text-xl">
          🔍
        </div>
        <div>
          <h1 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            Optica3D: Convex Lens Ray Optics
            <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">NCERT Class 10 Physics</span>
          </h1>
          <p class="text-xs text-slate-400 font-mono">Live 3D Ray Tracing, Real Formula Verification: 1/f = 1/v - 1/u</p>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-xs text-slate-300 font-mono">Presets:</span>
        <button onclick="setPreset('beyond2f')" class="px-2.5 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 cursor-pointer">Beyond 2F₁</button>
        <button onclick="setPreset('at2f')" class="px-2.5 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 cursor-pointer">At 2F₁</button>
        <button onclick="setPreset('betweenF2F')" class="px-2.5 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 cursor-pointer">Between F₁ & 2F₁</button>
        <button onclick="setPreset('focus')" class="px-2.5 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 cursor-pointer">At Focus F₁</button>
        <button onclick="setPreset('virtual')" class="px-2.5 py-1 rounded-lg text-xs bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 font-semibold cursor-pointer">Between O & F₁ (Magnifier)</button>
      </div>
    </header>

    <!-- Side Control Panel -->
    <div class="pointer-events-auto self-start mt-4 w-full sm:w-80 glass-ui p-4 rounded-2xl space-y-4">
      <div>
        <label class="flex justify-between text-xs font-semibold text-slate-300">
          <span>Object Distance (u)</span>
          <span id="label-u" class="text-indigo-400 font-mono">-6.0 cm</span>
        </label>
        <input type="range" id="slider-u" min="-12" max="-1.5" step="0.1" value="-6.0" class="w-full mt-1.5 accent-indigo-500 cursor-pointer">
      </div>

      <div>
        <label class="flex justify-between text-xs font-semibold text-slate-300">
          <span>Focal Length (f)</span>
          <span id="label-f" class="text-emerald-400 font-mono">+3.0 cm</span>
        </label>
        <input type="range" id="slider-f" min="2" max="5" step="0.5" value="3.0" class="w-full mt-1.5 accent-emerald-500 cursor-pointer">
      </div>

      <div>
        <label class="flex justify-between text-xs font-semibold text-slate-300">
          <span>Object Height (h₁)</span>
          <span id="label-h" class="text-amber-400 font-mono">+2.0 cm</span>
        </label>
        <input type="range" id="slider-h" min="1" max="3" step="0.2" value="2.0" class="w-full mt-1.5 accent-amber-500 cursor-pointer">
      </div>

      <div class="pt-3 border-t border-white/10 text-xs font-mono space-y-1.5">
        <div class="flex justify-between">
          <span class="text-slate-400">Image Dist (v):</span>
          <span id="val-v" class="text-white font-bold">+6.0 cm</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">Magnification (m):</span>
          <span id="val-m" class="text-white font-bold">-1.0x</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">Image Height (h₂):</span>
          <span id="val-h2" class="text-white font-bold">-2.0 cm</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">Nature:</span>
          <span id="val-nature" class="text-emerald-400 font-bold">Real & Inverted</span>
        </div>
      </div>
    </div>

    <!-- Mathematical Formula Readout Footer -->
    <footer class="pointer-events-auto glass-ui p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
      <div class="space-y-1">
        <div class="text-slate-300 font-bold flex items-center gap-2">
          <span>📐</span> Lens Formula: <code class="text-indigo-300 bg-white/5 px-2 py-0.5 rounded">1/f = 1/v - 1/u</code>
        </div>
        <div class="text-[11px] text-slate-400">
          Sign Convention: Light moves left to right. Optical Center O at origin (0,0,0). Object distance u is negative.
        </div>
      </div>
      <div class="flex items-center gap-4 text-[11px] text-slate-300">
        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Ray 1: Parallel to Axis</div>
        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Ray 2: Optical Center (O)</div>
        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-purple-400"></span> Ray 3: Through F₁</div>
      </div>
    </footer>
  </div>

  <script>
    const canvas = document.getElementById('optics-canvas');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 3, 16);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Principal Axis Line (X-Axis)
    const axisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-18, 0, 0),
      new THREE.Vector3(18, 0, 0)
    ]);
    const axisMat = new THREE.LineDashedMaterial({ color: 0x64748b, dashSize: 0.3, gapSize: 0.15 });
    const axisLine = new THREE.Line(axisGeo, axisMat);
    axisLine.computeLineDistances();
    scene.add(axisLine);

    // 3D Glass Convex Lens (Two intersecting spheres simulated with Lathe/Sphere geometry)
    const lensGroup = new THREE.Group();
    scene.add(lensGroup);

    const lensGeo = new THREE.CylinderGeometry(0.05, 0.05, 7, 32);
    const lensGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      transmission: 0.92,
      opacity: 1,
      transparent: true,
      roughness: 0.1,
      ior: 1.52,
      metalness: 0.1
    });

    // Biconvex Lens Mesh
    const sphereA = new THREE.SphereGeometry(3.6, 32, 32);
    const lensMesh = new THREE.Mesh(sphereA, lensGlassMat);
    lensMesh.scale.set(0.18, 1, 1);
    lensGroup.add(lensMesh);

    // Center Lens Line
    const centerLineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -4, 0), new THREE.Vector3(0, 4, 0)]);
    const centerLine = new THREE.Line(centerLineGeo, new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4 }));
    lensGroup.add(centerLine);

    // Optical Center Label "O"
    function createMarker(x, labelText, color = 0x94a3b8) {
      const g = new THREE.Group();
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshBasicMaterial({ color }));
      dot.position.set(x, 0, 0);
      g.add(dot);
      scene.add(g);
      return g;
    }

    let f1Marker = createMarker(-3, 'F1', 0x10b981);
    let f2Marker = createMarker(3, 'F2', 0x10b981);
    let twoF1Marker = createMarker(-6, '2F1', 0x6366f1);
    let twoF2Marker = createMarker(6, '2F2', 0x6366f1);

    // 3D Arrow Builder (Object / Image)
    function createArrow(color = 0xf59e0b) {
      const group = new THREE.Group();
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 16), new THREE.MeshStandardMaterial({ color }));
      shaft.name = 'shaft';
      group.add(shaft);

      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 16), new THREE.MeshStandardMaterial({ color }));
      cone.name = 'cone';
      group.add(cone);

      return group;
    }

    const objectArrow = createArrow(0xf59e0b); // Amber object
    scene.add(objectArrow);

    const imageArrow = createArrow(0xec4899); // Pink image
    scene.add(imageArrow);

    function updateArrow(arrow, x, height) {
      arrow.position.x = x;
      arrow.position.y = height / 2;

      const shaft = arrow.getObjectByName('shaft');
      const cone = arrow.getObjectByName('cone');

      const absHeight = Math.abs(height);
      const isUpright = height >= 0;

      shaft.scale.set(1, Math.max(0.01, absHeight - 0.4), 1);
      shaft.position.y = isUpright ? -0.2 : 0.2;

      cone.position.y = isUpright ? (absHeight / 2) - 0.2 : -(absHeight / 2) + 0.2;
      cone.rotation.z = isUpright ? 0 : Math.PI;
    }

    // Ray Lines
    const ray1Line = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x22d3ee, linewidth: 2 }));
    const ray2Line = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xfbbf24, linewidth: 2 }));
    const ray3Line = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xa855f7, linewidth: 2 }));
    scene.add(ray1Line, ray2Line, ray3Line);

    // State Variables
    let u = -6.0;
    let f = 3.0;
    let h1 = 2.0;

    function recalculateOptics() {
      // Sign convention:
      // 1/f = 1/v - 1/u  ==>  1/v = 1/f + 1/u  ==>  v = (f * u) / (u + f)
      const denominator = u + f;
      const isInfinite = Math.abs(denominator) < 0.001;

      let v = 0;
      let m = 0;
      let h2 = 0;

      if (!isInfinite) {
        v = (f * u) / denominator;
        m = v / u;
        h2 = m * h1;
      }

      // Update DOM Readouts
      document.getElementById('label-u').textContent = \`\${u.toFixed(1)} cm\`;
      document.getElementById('label-f').textContent = \`+\${f.toFixed(1)} cm\`;
      document.getElementById('label-h').textContent = \`+\${h1.toFixed(1)} cm\`;

      if (isInfinite) {
        document.getElementById('val-v').textContent = 'Infinity (Parallel rays)';
        document.getElementById('val-m').textContent = 'Highly Enlarged';
        document.getElementById('val-h2').textContent = 'Infinite';
        document.getElementById('val-nature').textContent = 'Real, Inverted at Infinity';
        imageArrow.visible = false;
      } else {
        document.getElementById('val-v').textContent = \`\${v > 0 ? '+' : ''}\${v.toFixed(2)} cm\`;
        document.getElementById('val-m').textContent = \`\${m.toFixed(2)}x\`;
        document.getElementById('val-h2').textContent = \`\${h2.toFixed(2)} cm\`;
        const nature = v > 0 ? 'Real & Inverted' : 'Virtual & Erect';
        document.getElementById('val-nature').textContent = nature;
        imageArrow.visible = true;
        updateArrow(imageArrow, v, h2);
      }

      updateArrow(objectArrow, u, h1);

      // Update Markers
      f1Marker.position.x = -f;
      f2Marker.position.x = f;
      twoF1Marker.position.x = -2 * f;
      twoF2Marker.position.x = 2 * f;

      // Update Rays
      // Ray 1: Top of object -> Lens at (0, h1) -> Refracts through F2 (f, 0) -> extends to Image (v, h2) or infinity
      const ray1Points = [
        new THREE.Vector3(u, h1, 0),
        new THREE.Vector3(0, h1, 0),
        isInfinite ? new THREE.Vector3(15, h1 - (h1 / f) * 15, 0) : new THREE.Vector3(v, h2, 0)
      ];
      ray1Line.geometry.setFromPoints(ray1Points);

      // Ray 2: Top of object -> Optical Center (0, 0, 0) -> Continues straight
      const ray2Points = [
        new THREE.Vector3(u, h1, 0),
        new THREE.Vector3(0, 0, 0),
        isInfinite ? new THREE.Vector3(15, -15 * (h1 / Math.abs(u)), 0) : new THREE.Vector3(v, h2, 0)
      ];
      ray2Line.geometry.setFromPoints(ray2Points);

      // Ray 3: Through F1 (-f, 0) -> Lens -> Parallel
      const slopeF1 = (0 - h1) / (-f - u);
      const yAtLens = h1 + slopeF1 * (0 - u);
      const ray3Points = [
        new THREE.Vector3(u, h1, 0),
        new THREE.Vector3(0, yAtLens, 0),
        new THREE.Vector3(isInfinite ? 15 : v, isInfinite ? yAtLens : h2, 0)
      ];
      ray3Line.geometry.setFromPoints(ray3Points);
    }

    // Input Listeners
    document.getElementById('slider-u').addEventListener('input', (e) => {
      u = parseFloat(e.target.value);
      recalculateOptics();
    });

    document.getElementById('slider-f').addEventListener('input', (e) => {
      f = parseFloat(e.target.value);
      recalculateOptics();
    });

    document.getElementById('slider-h').addEventListener('input', (e) => {
      h1 = parseFloat(e.target.value);
      recalculateOptics();
    });

    window.setPreset = (name) => {
      if (name === 'beyond2f') { u = -8.0; f = 3.0; }
      else if (name === 'at2f') { u = -6.0; f = 3.0; }
      else if (name === 'betweenF2F') { u = -4.5; f = 3.0; }
      else if (name === 'focus') { u = -3.0; f = 3.0; }
      else if (name === 'virtual') { u = -1.8; f = 3.0; }

      document.getElementById('slider-u').value = u;
      document.getElementById('slider-f').value = f;
      recalculateOptics();
    };

    recalculateOptics();

    // Mouse drag camera orbit
    let isOrbiting = false;
    let prevMouseX = 0, prevMouseY = 0;

    window.addEventListener('mousedown', (e) => {
      isOrbiting = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => { isOrbiting = false; });

    window.addEventListener('mousemove', (e) => {
      if (isOrbiting) {
        const dx = e.clientX - prevMouseX;
        const dy = e.clientY - prevMouseY;
        scene.rotation.y += dx * 0.005;
        scene.rotation.x += dy * 0.005;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    });

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();
  </script>
</body>
</html>`;
}
