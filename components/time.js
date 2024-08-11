import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

function Time() {
  const timeZone = 'Europe/Stockholm'; // CEST timezone
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const zonedTime = toZonedTime(now, timeZone);
      setTime(zonedTime);
    };

    updateTime(); // Set initial time
    const interval = setInterval(updateTime, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  // Format the time using date-fns
  const formattedTime = time ? format(time, 'h:mm') : '';
  const amPm = time ? format(time, 'aaa') : '';

  return (
    <div id="container" className="z-50 font-fit flex justify-center items-center h-fit">
      <div
        id="clock"
        className="align-center font-bold text-[25vw] bg-gradient-to-b from-slate-50 to-zinc-50 text-transparent bg-clip-text leading-[1.1]"
      >
        {formattedTime}
      </div>
      <div
        id="ampm"
        className="align-center font-extralight text-[6vw] bg-gradient-to-b from-slate-50 to-zinc-50 text-transparent bg-clip-text"
      >
        {amPm}
      </div>
    </div>
  );
}

export default Time;
