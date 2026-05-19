"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";
import { useTheme } from "next-themes";

export default function GlobeVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    let phi = 0;
    
    if (!canvasRef.current) return;

    const width = canvasRef.current.offsetWidth;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: (width || 400) * 2,
      height: (width || 400) * 2,
      phi: 0,
      theta: 0,
      dark: isDark ? 1 : 0,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: isDark ? [0.1, 0.1, 0.1] : [0.95, 0.95, 0.95],
      markerColor: [0.18, 0.51, 0.97],
      glowColor: isDark ? [0.1, 0.1, 0.2] : [0.8, 0.8, 1],
      markers: [
        { location: [28.6139, 77.209], size: 0.05 }, // Delhi
        { location: [19.076, 72.8777], size: 0.05 }, // Mumbai
        { location: [40.7128, -74.006], size: 0.08 }, // New York
        { location: [51.5074, -0.1278], size: 0.06 }, // London
      ],
      onRender: (state) => {
        state.phi = phi;
        phi += 0.005;
      },
    });

    return () => {
      globe.destroy();
    };
  }, [isDark]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden bg-white dark:bg-[#0d1117] rounded-xl border border-gray-200 dark:border-[#30363d] shadow-sm transition-colors duration-200">
      <div className="absolute top-5 left-5 z-10">
         <h3 className="text-sm font-semibold text-gray-900 dark:text-[#e6edf3]">Global Presence</h3>
         <p className="text-xs text-gray-500 dark:text-[#8b949e]">Live Caller Locations</p>
      </div>
      <div className="w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] opacity-90 transition-opacity">
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", contain: "layout paint size" }}
        />
      </div>
    </div>
  );
}
