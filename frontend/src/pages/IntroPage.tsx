import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import sajjadImg from '../SAJJAD.jpg';

export function IntroPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let W = window.innerWidth;
    let H = window.innerHeight;

    // ── Renderer ──────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x07111f, 1);

    const scene  = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 0.1, 100);
    camera.position.z = 10;

    // ── Network nodes ─────────────────────────────────────────────────────
    const COUNT = 65;
    const CONNECT_DIST = 175; // px — max distance to draw an edge

    interface Node {
      x: number; y: number;
      vx: number; vy: number;
      color: number;
    }

    const COLORS = [0x5eead4, 0x5eead4, 0x8b5cf6, 0xffffff];
    const makeNode = (): Node => ({
      x:  (Math.random() - 0.5) * W,
      y:  (Math.random() - 0.5) * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });

    const nodes: Node[] = Array.from({ length: COUNT }, makeNode);

    // ── Node dots (teal / violet / white buckets) ─────────────────────────
    const tealNodes   = nodes.filter(n => n.color === 0x5eead4);
    const violetNodes = nodes.filter(n => n.color === 0x8b5cf6);
    const whiteNodes  = nodes.filter(n => n.color === 0xffffff);

    const makePtGeo = (list: Node[]) => {
      const pos = new Float32Array(list.length * 3);
      const g = new THREE.BufferGeometry();
      const a = new THREE.BufferAttribute(pos, 3);
      a.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('position', a);
      return { g, a, pos, list };
    };

    const ptTeal   = makePtGeo(tealNodes);
    const ptViolet = makePtGeo(violetNodes);
    const ptWhite  = makePtGeo(whiteNodes);

    scene.add(new THREE.Points(ptTeal.g,   new THREE.PointsMaterial({ color: 0x5eead4, size: 3.5, sizeAttenuation: false, transparent: true, opacity: 0.85 })));
    scene.add(new THREE.Points(ptViolet.g, new THREE.PointsMaterial({ color: 0x8b5cf6, size: 3,   sizeAttenuation: false, transparent: true, opacity: 0.75 })));
    scene.add(new THREE.Points(ptWhite.g,  new THREE.PointsMaterial({ color: 0xffffff, size: 2.5, sizeAttenuation: false, transparent: true, opacity: 0.55 })));

    // ── Edge lines ────────────────────────────────────────────────────────
    // Pre-allocate max possible segments: COUNT*(COUNT-1)/2 pairs × 2 verts × 3 floats
    const MAX_SEGS = (COUNT * (COUNT - 1)) / 2;
    const edgePos  = new Float32Array(MAX_SEGS * 6);
    const edgeGeo  = new THREE.BufferGeometry();
    const edgeAttr = new THREE.BufferAttribute(edgePos, 3);
    edgeAttr.setUsage(THREE.DynamicDrawUsage);
    edgeGeo.setAttribute('position', edgeAttr);
    edgeGeo.setDrawRange(0, 0);
    const edgeMat  = new THREE.LineBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.13 });
    scene.add(new THREE.LineSegments(edgeGeo, edgeMat));

    // ── Animation ─────────────────────────────────────────────────────────
    let animationId: number;

    const syncPts = ({ list, pos, a }: typeof ptTeal) => {
      list.forEach((n, i) => {
        pos[i * 3]     = n.x;
        pos[i * 3 + 1] = n.y;
        pos[i * 3 + 2] = 0;
      });
      a.needsUpdate = true;
    };

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Move nodes — bounce off viewport edges
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < -W / 2 || n.x > W / 2) n.vx *= -1;
        if (n.y < -H / 2 || n.y > H / 2) n.vy *= -1;
      });

      // Rebuild edges for close pairs
      let seg = 0;
      for (let i = 0; i < COUNT - 1; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          if (dx * dx + dy * dy < CONNECT_DIST * CONNECT_DIST) {
            const b = seg * 6;
            edgePos[b]     = nodes[i].x; edgePos[b + 1] = nodes[i].y; edgePos[b + 2] = 0;
            edgePos[b + 3] = nodes[j].x; edgePos[b + 4] = nodes[j].y; edgePos[b + 5] = 0;
            seg++;
          }
        }
      }
      edgeAttr.needsUpdate = true;
      edgeGeo.setDrawRange(0, seg * 2);

      syncPts(ptTeal);
      syncPts(ptViolet);
      syncPts(ptWhite);

      renderer.render(scene, camera);
    };

    animate();

    // ── Resize ────────────────────────────────────────────────────────────
    const handleResize = () => {
      W = window.innerWidth; H = window.innerHeight;
      renderer.setSize(W, H);
      camera.left = -W / 2; camera.right  = W / 2;
      camera.top  =  H / 2; camera.bottom = -H / 2;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      [ptTeal.g, ptViolet.g, ptWhite.g, edgeGeo].forEach(g => g.dispose());
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
        

        {/* Author section */}
        <div className="mt-8 flex flex-col items-center w-full max-w-2xl animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500 mb-6">Built by</p>
          <div
            className="group panel-glass w-full p-6 flex items-center gap-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow"
          >
            {/* Photo */}
            <div className="relative shrink-0">
              <div
                className="w-20 h-20 rounded-2xl overflow-hidden"
                style={{
                  border: '2px solid rgba(94,234,212,0.3)',
                  boxShadow: '0 0 28px rgba(94,234,212,0.15)',
                }}
              >
                <img
                  src={sajjadImg}
                  alt="Sajjad Shahali"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-teal-400 to-violet-500" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-semibold text-white text-lg leading-tight">Sajjad Shahali</p>
                <a
                  href="https://github.com/Sajjad-Shahali/ClaimScope_hackathon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-slate-300 transition-colors hover:text-white"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.14)',
                  }}
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="currentColor" aria-hidden="true">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  GitHub
                </a>
              </div>
              <p className="mt-1.5 text-sm text-slate-500">
                MSc. Data Science at{' '}
                <a href="https://www.polito.it/" className="text-teal-400 hover:underline">
                  Politecnico di Torino
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col items-center gap-3 animate-fade-in" style={{ animationDelay: '0.6s' }}>
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
          <p className="text-xs text-slate-600">ClaimScope Analytics Platform</p>
        </div>
      </div>

      {/* Bottom fade gradient */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-ink to-transparent pointer-events-none z-0" />
    </div>
  );
}
