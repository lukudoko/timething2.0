'use client';
import React, { useState, useEffect } from "react";
import Time from '@/components/time';
import Background from '@/components/bg';
import AppTray from '@/components/widgets';

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
            <AppTray/> 
            </div>
            </div>
                    <Background backgroundReady={backgroundReady} setBackgroundReady={setBackgroundReady} /> 
        </div>
    );
};

export default Normal;
