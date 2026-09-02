"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { createRenderer } from "./fluid-utils/renderer";

export function FluidCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dark = resolvedTheme !== "light";
    const renderer = createRenderer({ canvas, dark });
    void renderer.ready;
    return () => renderer.dispose();
  }, [resolvedTheme]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black dark:bg-black bg-white">
      <canvas ref={canvasRef} className="block h-full w-full touch-none" />
    </div>
  );
}

export default FluidCanvas;
