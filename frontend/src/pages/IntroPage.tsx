import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import sajjadImg from '../SAJJAD.jpg';
import yosefImg from '../YOSEF.jpg';
import aliImg from '../ALI.jpg';

const team = [
  { name: 'Yosef Fayaz', img: yosefImg, major: 'MSc. Data Science' },
  { name: 'Sajjad Shahali', img: sajjadImg, major: 'MSc. Data Science' },
  { name: 'Ali Vaezi', img: aliImg, major: 'MSc. Digital skills' },
];

export function IntroPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Renderer ─────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x03080f, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.set(0, 300, 540);
    camera.lookAt(0, 0, 0);

    // ── Deep-space starfield (static) ────────────────────────────────────
    const STAR_COUNT = 2200;
    const starPos = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 900 + Math.random() * 500;
      starPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = r * Math.cos(phi);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xb8cce0, size: 0.85, sizeAttenuation: true });
    scene.add(new THREE.Points(starGeo, starMat));

    // ── Galaxy group (rotates as one unit) ───────────────────────────────
    const galaxyGroup = new THREE.Group();
    scene.add(galaxyGroup);

    // Galaxy particles — 2 spiral arms, teal → white → violet gradient
    const GALAXY_N = 750;
    const gPos   = new Float32Array(GALAXY_N * 3);
    const gColor = new Float32Array(GALAXY_N * 3);

    for (let i = 0; i < GALAXY_N; i++) {
      const arm = i % 2;
      const t   = Math.pow(Math.random(), 0.55); // bias density toward center
      const r   = 25 + t * 350;
      const baseAngle    = (arm / 2) * Math.PI * 2;
      const spiralAngle  = t * Math.PI * 5.8;
      const jitter       = (Math.random() - 0.5) * (0.25 + t * 0.45);
      const angle        = baseAngle + spiralAngle + jitter;
      const radialScatter = (Math.random() - 0.5) * (10 + t * 28);

      gPos[i * 3]     = Math.cos(angle) * r + radialScatter;
      gPos[i * 3 + 1] = (Math.random() - 0.5) * (6 + t * 18); // disc thickness
      gPos[i * 3 + 2] = Math.sin(angle) * r + radialScatter;

      // Color — teal inner, silver mid, violet outer
      if (t < 0.28) {
        // teal  #5eead4
        gColor[i * 3] = 0.369; gColor[i * 3 + 1] = 0.918; gColor[i * 3 + 2] = 0.831;
      } else if (t < 0.58) {
        // silver-white
        gColor[i * 3] = 0.86; gColor[i * 3 + 1] = 0.89; gColor[i * 3 + 2] = 0.94;
      } else {
        // violet  #8b5cf6
        gColor[i * 3] = 0.545; gColor[i * 3 + 1] = 0.361; gColor[i * 3 + 2] = 0.965;
      }
    }

    const galaxyGeo = new THREE.BufferGeometry();
    galaxyGeo.setAttribute('position', new THREE.BufferAttribute(gPos, 3));
    galaxyGeo.setAttribute('color',    new THREE.BufferAttribute(gColor, 3));
    const galaxyMat = new THREE.PointsMaterial({
      size: 2.4,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
    });
    galaxyGroup.add(new THREE.Points(galaxyGeo, galaxyMat));

    // Connection lines — computed in galaxy local space (cheapest approach)
    const LINE_N   = 220;           // only check first N particles
    const MAX_LINES = 500;
    const linePos  = new Float32Array(MAX_LINES * 6);
    const lineGeo  = new THREE.BufferGeometry();
    const lineAttr = new THREE.BufferAttribute(linePos, 3);
    lineAttr.setUsage(THREE.DynamicDrawUsage);
    lineGeo.setAttribute('position', lineAttr);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x5eead4,
      transparent: true,
      opacity: 0.10,
    });
    const lineSegs = new THREE.LineSegments(lineGeo, lineMat);
    galaxyGroup.add(lineSegs); // rotates with galaxy — no transform needed

    // Central glowing core
    const coreGeo  = new THREE.SphereGeometry(7, 20, 20);
    const coreMat  = new THREE.MeshBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.95 });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    galaxyGroup.add(coreMesh);

    // Soft outer halo around core
    const haloGeo = new THREE.SphereGeometry(22, 20, 20);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.07 });
    galaxyGroup.add(new THREE.Mesh(haloGeo, haloMat));

    // ── Mouse → smooth camera tilt ───────────────────────────────────────
    const mouse  = { nx: 0, ny: 0 };
    const camTarget = { x: 0, y: 300 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.nx = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouse.ny = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // ── Animation loop ───────────────────────────────────────────────────
    let animationId: number;
    const startTime = performance.now();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) * 0.001; // seconds

      // Rotate whole galaxy (arms, lines, core all move together)
      galaxyGroup.rotation.y += 0.00042;

      // Core breathing pulse
      const pulse = 1 + Math.sin(elapsed * 1.7) * 0.14;
      coreMesh.scale.setScalar(pulse);

      // Update connection lines in local (pre-rotation) space
      let li = 0;
      for (let i = 0; i < LINE_N && li < MAX_LINES; i++) {
        const ix = gPos[i * 3], iy = gPos[i * 3 + 1], iz = gPos[i * 3 + 2];
        for (let j = i + 1; j < LINE_N && li < MAX_LINES; j++) {
          const dx = ix - gPos[j * 3];
          const dy = iy - gPos[j * 3 + 1];
          const dz = iz - gPos[j * 3 + 2];
          if (dx * dx + dy * dy + dz * dz < 72 * 72) {
            linePos[li * 6]     = ix;  linePos[li * 6 + 1] = iy;  linePos[li * 6 + 2] = iz;
            linePos[li * 6 + 3] = gPos[j * 3]; linePos[li * 6 + 4] = gPos[j * 3 + 1]; linePos[li * 6 + 5] = gPos[j * 3 + 2];
            li++;
          }
        }
      }
      lineGeo.setDrawRange(0, li * 2);
      lineAttr.needsUpdate = true;

      // Smooth camera shift toward mouse
      camTarget.x += (mouse.nx * 65 - camTarget.x) * 0.022;
      camTarget.y += (300 + mouse.ny * 30 - camTarget.y) * 0.022;
      camera.position.x = camTarget.x;
      camera.position.y = camTarget.y;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      renderer.dispose();
      starGeo.dispose();   starMat.dispose();
      galaxyGeo.dispose(); galaxyMat.dispose();
      lineGeo.dispose();   lineMat.dispose();
      coreGeo.dispose();   coreMat.dispose();
      haloGeo.dispose();   haloMat.dispose();
    };
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Three.js canvas behind everything */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, zIndex: 0, width: '100%', height: '100%' }}
      />

      {/* Page content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6">
        {/* Top badge */}
        <div className="badge-accent animate-fade-in" style={{ animationDelay: '0s' }}>
          Claims Portfolio Intelligence · Hackathon Project
        </div>

        {/* Hero title */}
        <h1
          className="mt-6 leading-none font-bold tracking-tighter bg-gradient-to-r from-white via-teal-200 to-violet-300 bg-clip-text text-transparent animate-fade-in text-center"
          style={{
            fontSize: 'clamp(3.5rem, 8vw, 7rem)',
            animationDelay: '0.1s',
          }}
        >
          ClaimScope
        </h1>

        {/* Tagline */}
        <p
          className="mt-4 text-lg md:text-xl text-slate-300 max-w-2xl text-center font-light animate-fade-in"
          style={{ animationDelay: '0.2s' }}
        >
          Vehicle Claims Intelligence for Smarter Insurance Decisions
        </p>

        {/* Separator line */}
        <div className="mt-8 w-px h-12 bg-gradient-to-b from-transparent via-teal-400/40 to-transparent" />

        {/* Team section */}
        <div className="mt-8 flex flex-col items-center w-full max-w-2xl">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500 mb-6">Built by</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            {team.map((member, i) => (
              <div
                key={member.name}
                className="group panel-glass p-5 flex flex-col items-center gap-3 text-center cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-glow animate-fade-in"
                style={{ animationDelay: `${0.3 + i * 0.1}s` }}
              >
                <div className="relative">
                  <div
                    className="w-16 h-16 rounded-2xl overflow-hidden"
                    style={{
                      border: '2px solid rgba(94,234,212,0.25)',
                      boxShadow: '0 0 20px rgba(94,234,212,0.12)',
                    }}
                  >
                    <img
                      src={member.img}
                      alt={member.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-teal-400 to-violet-500"  />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{member.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{member.major} at <a href='https://www.polito.it/' className="text-teal-400 hover:underline">Politecnico di Torino</a></p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col items-center gap-3 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <button
              onClick={() => navigate('/app')}
              className="button-primary h-12 px-8 text-base font-semibold rounded-full"
              style={{ boxShadow: '0 0 0 1px rgba(94,234,212,0.3), 0 4px 24px rgba(94,234,212,0.2)' }}
            >
              Enter Dashboard
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>

            <a
              href="https://github.com/Sajjad-Shahali/ClaimScope_hackathon"
              target="_blank"
              rel="noopener noreferrer"
              className="button h-12 px-6 text-base font-semibold rounded-full flex items-center gap-2.5"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.14)',
                color: '#f1f5f9',
              }}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub
            </a>
          </div>
          <p className="text-xs text-slate-600">ClaimScope Analytics Platform</p>
        </div>
      </div>

      {/* Bottom fade gradient */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-ink to-transparent pointer-events-none z-0" />
    </div>
  );
}
