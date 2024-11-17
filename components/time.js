import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { AnimatePresence, motion } from 'framer-motion';

const TIME_ZONE = 'Europe/Stockholm';
const UPDATE_INTERVAL = 1000; // 1 second

function Time() {
  const [time, setTime] = useState(new Date());
  const [hasTimeLoaded, setHasTimeLoaded] = useState(false);

  // Memoize the animation config to prevent recreating on every render
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

  // Memoize the formatted time values
  const timeValues = useMemo(() => {
    const zonedTime = toZonedTime(time, TIME_ZONE);
    return {
      hours: format(zonedTime, 'h'),
      minutes: format(zonedTime, 'mm'),
      amPm: format(zonedTime, 'aaa'),
      //seconds: format(zonedTime, 'ss') // Added seconds for internal use
    };
  }, [time]);

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date());
      if (!hasTimeLoaded) setHasTimeLoaded(true);
    };

    updateTime();
    const interval = setInterval(updateTime, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [hasTimeLoaded]);

  // Common class for time segments
  const timeSegmentClass = "flex items-center justify-center font-bold text-[25vw] bg-gradient-to-b from-slate-50 to-zinc-50 text-transparent bg-clip-text leading-[1.1]";

  if (!hasTimeLoaded) return null; // Prevent flash of unstyled content

  return (
    <div className="z-50 font-fit flex relative w-fit justify-center items-center h-fit">
      <AnimatePresence mode="wait">
        <motion.div
          key={timeValues.hours}
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
          key={timeValues.minutes}
          className={timeSegmentClass}
          {...fadeInConfig(0)}
        >
          {timeValues.minutes}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={timeValues.amPm}
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