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

    const W = window.innerWidth;
    const H = window.innerHeight;

    // ── Renderer ──────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x07111f, 1);

    const scene  = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 0.1, 100);
    camera.position.z = 10;

    // ── Particles ─────────────────────────────────────────────────────────
    // Each particle: [x, y, speed, size, opacity, colorVariant]
    const COUNT = 110;

    interface Particle {
      x: number; y: number;
      vy: number;           // upward drift speed
      vx: number;           // horizontal drift
      size: number;
      opacity: number;
      color: number;        // hex
    }

    const makeParticle = (randomY = false): Particle => {
      const r = Math.random();
      const color = r < 0.55 ? 0xffffff
                  : r < 0.80 ? 0x5eead4
                  :             0x8b5cf6;
      return {
        x:       (Math.random() - 0.5) * W,
        y:       randomY ? (Math.random() - 0.5) * H : -H / 2 - 10,
        vy:      0.18 + Math.random() * 0.28,
        vx:      (Math.random() - 0.5) * 0.06,
        size:    0.9 + Math.random() * 1.8,
        opacity: 0.12 + Math.random() * 0.35,
        color,
      };
    };

    const particles: Particle[] = Array.from({ length: COUNT }, () => makeParticle(true));

    // Build a single BufferGeometry for all particles
    const positions = new Float32Array(COUNT * 3);
    const geo = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(positions, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', posAttr);

    // One Points object, white — teal/violet handled via separate smaller sets
    const matWhite  = new THREE.PointsMaterial({ color: 0xffffff,  size: 2, sizeAttenuation: false, transparent: true, opacity: 0.22 });
    const matTeal   = new THREE.PointsMaterial({ color: 0x5eead4,  size: 2, sizeAttenuation: false, transparent: true, opacity: 0.28 });
    const matViolet = new THREE.PointsMaterial({ color: 0x8b5cf6,  size: 2, sizeAttenuation: false, transparent: true, opacity: 0.22 });

    // Split into three color groups for separate draw calls (each gets its own Points)
    const wIdx: number[] = [], tIdx: number[] = [], vIdx: number[] = [];
    particles.forEach((p, i) => {
      if (p.color === 0xffffff) wIdx.push(i);
      else if (p.color === 0x5eead4) tIdx.push(i);
      else vIdx.push(i);
    });

    const buildGeo = (indices: number[]) => {
      const pos = new Float32Array(indices.length * 3);
      const g = new THREE.BufferGeometry();
      const a = new THREE.BufferAttribute(pos, 3);
      a.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('position', a);
      return { geo: g, attr: a, pos, indices };
    };

    const white  = buildGeo(wIdx);
    const teal   = buildGeo(tIdx);
    const violet = buildGeo(vIdx);

    scene.add(new THREE.Points(white.geo,  matWhite));
    scene.add(new THREE.Points(teal.geo,   matTeal));
    scene.add(new THREE.Points(violet.geo, matViolet));

    // ── Subtle horizontal grid lines ──────────────────────────────────────
    // A few faint horizontal rules at varying depths give a "data grid" feeling
    const gridMat = new THREE.LineBasicMaterial({ color: 0x1e3a5f, transparent: true, opacity: 0.18 });
    const GRID_LINES = 6;
    for (let i = 0; i < GRID_LINES; i++) {
      const y = -H / 2 + (i + 1) * (H / (GRID_LINES + 1));
      const pts = [new THREE.Vector3(-W / 2, y, 0), new THREE.Vector3(W / 2, y, 0)];
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      scene.add(new THREE.Line(g, gridMat));
    }

    // ── Animation ─────────────────────────────────────────────────────────
    let animationId: number;

    const syncGroup = (group: ReturnType<typeof buildGeo>) => {
      group.indices.forEach((pi, slot) => {
        const p = particles[pi];
        group.pos[slot * 3]     = p.x;
        group.pos[slot * 3 + 1] = p.y;
        group.pos[slot * 3 + 2] = 0;
      });
      group.attr.needsUpdate = true;
    };

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      particles.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx;
        // Recycle when off top
        if (p.y > H / 2 + 10) {
          const fresh = makeParticle(false);
          p.x = fresh.x; p.y = fresh.y;
          p.vy = fresh.vy; p.vx = fresh.vx;
        }
      });

      syncGroup(white);
      syncGroup(teal);
      syncGroup(violet);

      renderer.render(scene, camera);
    };

    animate();

    // ── Resize ────────────────────────────────────────────────────────────
    const handleResize = () => {
      const nw = window.innerWidth, nh = window.innerHeight;
      renderer.setSize(nw, nh);
      camera.left = -nw / 2; camera.right  = nw / 2;
      camera.top  =  nh / 2; camera.bottom = -nh / 2;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      [white, teal, violet].forEach(g => g.geo.dispose());
      [matWhite, matTeal, matViolet].forEach(m => m.dispose());
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

        {/* Description */}
        <p
          className="mt-5 max-w-xl text-sm text-slate-500 text-center animate-fade-in"
          style={{ animationDelay: '0.3s' }}
        >
          An interactive analytics dashboard that turns raw vehicle insurance claims into
          actionable portfolio insights — spotting warranty concentration, geographic imbalance,
          and statistically unusual claims with fully explainable, data-grounded signals.
        </p>

        {/* Feature pills */}
        <div
          className="mt-5 flex flex-wrap justify-center gap-2 animate-fade-in"
          style={{ animationDelay: '0.38s' }}
        >
          {['Warranty Analysis', 'Geographic Imbalance', 'Anomaly Detection', 'Claim Drill-down', 'Narrative Insights'].map(label => (
            <span
              key={label}
              className="rounded-full px-3 py-1 text-[11px] font-medium text-slate-400"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.09)',
              }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Separator line */}
        

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
