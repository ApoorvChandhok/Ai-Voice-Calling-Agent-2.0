"use client";

import dynamic from "next/dynamic";

const GlobeVisualization = dynamic(() => import("./GlobeVisualization"), { ssr: false });

export default function GlobeWrapper() {
  return <GlobeVisualization />;
}
