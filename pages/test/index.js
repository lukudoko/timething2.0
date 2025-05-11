'use client';
import React, { useState, useEffect } from "react";
import Background from "@/components/bg";
import Time from "@/components/time";

export default function Home() {
  const [backgroundReady, setBackgroundReady] = useState(false);

  useEffect(() => {
    console.log("Background Ready Status:", backgroundReady);
  }, [backgroundReady]);

  return (
    <div className="relative font-sans bg-white">
      <div className="flex justify-center items-center min-h-screen">
        {backgroundReady && <Time />}
      </div>
      <Background backgroundReady={backgroundReady} setBackgroundReady={setBackgroundReady} />     
    </div>
  );
}
