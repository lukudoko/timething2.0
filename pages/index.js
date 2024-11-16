'use client';

import Time from '@/components/time'; 
import Background from '@/components/bg'; 

const Normal = () => {
    return (
        <div className="relative font-sans bg-white">
            <div className="flex justify-center items-center min-h-screen">
                <Time />
            </div>
            <Background />
        </div>
    );
};

export default Normal;
