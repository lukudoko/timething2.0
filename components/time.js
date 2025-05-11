import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';

const UPDATE_INTERVAL = 1000; 

function Time() {
  const [time, setTime] = useState(new Date());
  const [hasTimeLoaded, setHasTimeLoaded] = useState(false);
  const [timezone, setTimezone] = useState('UTC'); 

  useEffect(() => {
    try {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch (e) {
      console.warn("Couldn't detect timezone, falling back to UTC");
    }
  }, []);

  const fadeInConfig = useMemo(() => (delay = 0) => ({
    initial: { opacity: 0, y: 50 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        bounce: 0.5,
        duration: 2,
        delay
      }
    },
    exit: {
      opacity: 0,
      y: -50,
      transition: {
        duration: 0.3
      }
    },
  }), []);

  const timeValues = useMemo(() => {
    return {
      hours: format(time, 'h'),
      minutes: format(time, 'mm'),
      amPm: format(time, 'aaa'),
      timezone 
    };
  }, [time, timezone]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now);
      if (!hasTimeLoaded) setHasTimeLoaded(true);
    };

    updateTime();
    const interval = setInterval(updateTime, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [hasTimeLoaded]);

  const timeSegmentClass = "flex items-center justify-center font-bold text-[25vw] bg-gradient-to-b from-slate-50 to-zinc-50 text-transparent bg-clip-text leading-[1.1]";

  if (!hasTimeLoaded) return null;

  return (
    <div className="z-50 font-fit flex relative w-fit justify-center items-center h-fit">

      <AnimatePresence mode="wait">
        <motion.div
          key={`${timeValues.hours}-${timeValues.timezone}`}
          className={timeSegmentClass}
          {...fadeInConfig(0)}
        >
          {timeValues.hours}
        </motion.div>
      </AnimatePresence>

      <motion.div
        className={timeSegmentClass}
        {...fadeInConfig(0)}
      >
        :
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${timeValues.minutes}-${timeValues.timezone}`}
          className={timeSegmentClass}
          {...fadeInConfig(0)}
        >
          {timeValues.minutes}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${timeValues.amPm}-${timeValues.timezone}`}
          className="flex items-center justify-center font-extralight text-[6vw] bg-gradient-to-b from-slate-50 to-zinc-50 text-transparent bg-clip-text"
          {...fadeInConfig(0.3)}
        >
          {timeValues.amPm}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default Time;