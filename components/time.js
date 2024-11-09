import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { AnimatePresence, motion } from 'framer-motion';

function Time() {
  const timeZone = 'Europe/Stockholm'; // CEST timezone
  const [time, setTime] = useState('');
  const [hasTimeLoaded, setHasTimeLoaded] = useState(false); // Track if time has been loaded

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const zonedTime = toZonedTime(now, timeZone);
      setTime(zonedTime);
      setHasTimeLoaded(true); // Set to true after first time update
    };

    updateTime(); // Set initial time
    const interval = setInterval(updateTime, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  const hours = time ? format(time, 'h') : '';
  const minutes = time ? format(time, 'mm') : '';
  const amPm = time ? format(time, 'aaa') : '';

  const fadeInConfig = (delay = 0) => ({
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0.5, duration: 2, delay } },
    exit: { opacity: 0, y: -50, transition: { duration: 0.3 } },
  });

  return (
    <div id="container" className="z-50 font-fit flex justify-center items-center h-fit relative">
      <AnimatePresence className="flex" mode="wait">
        <motion.div
          key={hours}
          className="flex items-center justify-center font-bold text-[25vw] bg-gradient-to-b from-slate-50 to-zinc-50 text-transparent bg-clip-text leading-[1.1]"
          {...fadeInConfig(0)} 
        >
          {hours}
        </motion.div>
      </AnimatePresence>

      {/* Centered Colon */}
      <motion.div
        className="flex items-center justify-center font-bold text-[25vw] bg-gradient-to-b from-slate-50 to-zinc-50 text-transparent bg-clip-text leading-[1.1]"
        {...fadeInConfig(0.3)} 
      >
        :
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={minutes}
          className="flex items-center justify-center font-bold text-[25vw] bg-gradient-to-b from-slate-50 to-zinc-50 text-transparent bg-clip-text leading-[1.1]"
          {...fadeInConfig(0)} 
        >
          {minutes}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={amPm}
          className="flex items-center justify-center font-extralight text-[6vw] bg-gradient-to-b from-slate-50 to-zinc-50 text-transparent bg-clip-text"
          {...fadeInConfig(0.3)} 
        >
          {amPm}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default Time;
