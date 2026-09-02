"use client";

import { GrainGradient } from "@paper-design/shaders-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface GrainGradientHeroProps {
  children?: React.ReactNode;
}

const darkColors = ["#0d1117", "#1a3a2a", "#0a2518", "#162b1f"];
const darkBg = "#080c0a";

const lightColors = ["#e8f0e8", "#c8d8c8", "#d8e8d8", "#b8d0b8"];
const lightBg = "#f0f5f0";

export function GrainGradientHero({ children }: GrainGradientHeroProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === "dark" : true;
  const colors = isDark ? darkColors : lightColors;
  const colorBack = isDark ? darkBg : lightBg;

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Grain Gradient Background — dark only */}
      <div className="absolute inset-0 z-0">
        {mounted && isDark && (
          <GrainGradient
            width="100%"
            height="100%"
            colors={darkColors}
            colorBack={darkBg}
            softness={0.5}
            intensity={0.4}
            noise={0.3}
            shape="corners"
            speed={0}
            scale={0.5}
            style={{ position: "absolute", top: 0, left: 0 }}
          />
        )}
        {!isDark && <div className="absolute inset-0 bg-white" />}
        {mounted && isDark && (
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 h-full w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export default GrainGradientHero;
