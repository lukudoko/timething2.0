'use client';

import Time from '@/components/time';
import Background from '@/components/bg';
import AppTray from '@/components/widgets';

const Normal = () => {
    return (
        <div className="relative font-sans bg-white">
            <div className='flex justify-center'>
            <div className="flex flex-col justify-center w-fit min-h-screen">
                <Time />
                <AppTray />
            </div>
            </div>
            <Background />
        </div>
    );
};

export default Normal;
