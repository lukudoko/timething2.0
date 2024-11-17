'use client';
import React, { useState, useEffect } from "react";
import Time from '@/components/time';
import Background from "@/components/skytest";
import AppTray from '@/components/widgets';
import WeatherCanvas from "@/components/weather"; // Import WeatherCanvas

const Normal = () => {
    const [backgroundReady, setBackgroundReady] = useState(false);

    useEffect(() => {
      console.log("Background Ready Status:", backgroundReady);
    }, [backgroundReady]);
    return (
        <div className="relative font-sans bg-white">
            <div className='flex justify-center'>
            <div className="flex flex-col justify-center w-fit min-h-screen">
            {backgroundReady && <Time /> }
            {backgroundReady &&  <AppTray/> }
            </div>
            </div>
                    <Background backgroundReady={backgroundReady} setBackgroundReady={setBackgroundReady} /> 
                    <WeatherCanvas />      
        </div>
    );
};

export default Normal;
