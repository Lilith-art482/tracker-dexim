'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NeonFlowProps {
  children?: React.ReactNode;
  className?: string;
}

let TubesCursorCached: any = null;

function makeApp(canvas: HTMLCanvasElement) {
  const app = TubesCursorCached(canvas, {
    tubes: {
      colors: ['#f967fb', '#53bc28', '#6958d5'],
      lights: {
        intensity: 200,
        colors: ['#83f36e', '#fe8a2e', '#ff008a', '#60aed5'],
      },
    },
  });
  setTimeout(() => {
    try {
      const scene = app.scene || app._scene;
      if (scene) scene.traverse((o: any) => { if (o.isMesh && !o.isLine) o.visible = false; });
    } catch (_) {}
  }, 1500);
  return app;
}

export function NeonFlow({ children, className }: NeonFlowProps) {
  const c1 = useRef<HTMLCanvasElement>(null);
  const c2 = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const apps = useRef<[any, any]>([null, null]);
  const raf = useRef(0);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        if (!TubesCursorCached) {
          // @ts-ignore
          const mod = await import(
            /* webpackIgnore: true */
            'https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js' as string
          );
          TubesCursorCached = mod.default;
        }
        if (!ok || !c1.current || !c2.current) return;

        apps.current[0] = makeApp(c1.current);
        await new Promise(r => setTimeout(r, 500));
        if (!ok || !c2.current) return;
        apps.current[1] = makeApp(c2.current);

        if (ok) setReady(true);
      } catch (err) {
        console.error('NeonFlow:', err);
      }
    })();
    return () => { ok = false; };
  }, []);

  // Block all real pointer events at window level
  useEffect(() => {
    if (!ready) return;
    let myEvent = false;
    const handler = (e: PointerEvent) => {
      if (myEvent) return;
      e.stopImmediatePropagation();
      e.preventDefault();
    };
    window.addEventListener('pointermove', handler, { capture: true, passive: false });
    window.addEventListener('pointerdown', handler, { capture: true, passive: false });
    (window as any).__neonflowAllow = () => { myEvent = true; setTimeout(() => { myEvent = false; }, 0); };
    return () => {
      window.removeEventListener('pointermove', handler, true);
      window.removeEventListener('pointerdown', handler, true);
      delete (window as any).__neonflowAllow;
    };
  }, [ready]);

  // Fast, wide movement across full page
  useEffect(() => {
    if (!ready) return;
    let t = 0;
    const p = [{ x: 0.15, y: 0.3 }, { x: 0.85, y: 0.7 }];
    const cvs = [c1.current, c2.current];
    const allow = (window as any).__neonflowAllow;

    const go = () => {
      t += 0.025;
      const W = window.innerWidth, H = window.innerHeight;

      // Line 1 — fast, covers full screen
      const x1 = 0.50
        + 0.42 * Math.sin(t * 0.3)
        + 0.25 * Math.cos(t * 0.7)
        + 0.12 * Math.sin(t * 1.5);
      const y1 = 0.50
        + 0.40 * Math.cos(t * 0.25)
        + 0.22 * Math.sin(t * 0.6)
        + 0.10 * Math.cos(t * 1.3);

      // Line 2
      const x2 = 0.50
        + 0.42 * Math.sin(t * 0.3 + Math.PI)
        + 0.25 * Math.cos(t * 0.7 + 2.0)
        + 0.12 * Math.sin(t * 1.5 + 3.5);
      const y2 = 0.50
        + 0.40 * Math.cos(t * 0.25 + 1.5)
        + 0.22 * Math.sin(t * 0.6 + Math.PI)
        + 0.10 * Math.cos(t * 1.3 + 2.5);

      p[0].x += (x1 - p[0].x) * 0.02;
      p[0].y += (y1 - p[0].y) * 0.02;
      p[1].x += (x2 - p[1].x) * 0.02;
      p[1].y += (y2 - p[1].y) * 0.02;

      allow?.();
      cvs[0]?.dispatchEvent(new PointerEvent('pointermove', {
        clientX: p[0].x * W, clientY: p[0].y * H, bubbles: true,
      }));
      cvs[1]?.dispatchEvent(new PointerEvent('pointermove', {
        clientX: p[1].x * W, clientY: p[1].y * H, bubbles: true,
      }));

      raf.current = requestAnimationFrame(go);
    };
    raf.current = requestAnimationFrame(go);
    return () => cancelAnimationFrame(raf.current);
  }, [ready]);

  return (
    <div className={cn('relative w-full h-full min-h-[400px] max-w-[2000px] mx-auto overflow-hidden bg-background', className)}>
      <canvas ref={c1} className="absolute inset-0 w-full h-full block" style={{ touchAction: 'none' }} />
      <canvas ref={c2} className="absolute inset-0 w-full h-full block mix-blend-screen" style={{ touchAction: 'none' }} />

      <AnimatePresence>
        {ready && (
          <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }} className="absolute inset-0 pointer-events-none" />
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full h-full pointer-events-none">{children}</div>
    </div>
  );
}

export default NeonFlow;
