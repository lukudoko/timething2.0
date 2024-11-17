'use client';
import React, { useState, useEffect } from "react";
import Time from '@/components/time'; 
import Background from '@/components/bg'; 

const Normal = () => {
    const [backgroundReady, setBackgroundReady] = useState(false);

    useEffect(() => {
     // console.log("Background Ready Status:", backgroundReady);
    }, [backgroundReady]);
  
    return (
      <div className="relative font-sans bg-white">
        <div className="flex justify-center items-center min-h-screen">
          {backgroundReady && <Time />}
        </div>
        <Background backgroundReady={backgroundReady} setBackgroundReady={setBackgroundReady} />     
      </div>
    );
};

export default Normal;
