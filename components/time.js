import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

function Time() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const tim = format(time, 'h:mm');
  const amPm = format(time, 'aaa');

  return (
    <div id="container" className="z-50 font-fit flex justify-center items-center h-fit">
      <div id="clock" className="align-center font-bold text-[25vw] bg-gradient-to-b from-slate-50 to-zinc-50 text-transparent bg-clip-text leading-[1.1]">{tim}</div>
      <div id="ampm" className="align-center font-extralight text-[6vw] bg-gradient-to-b from-slate-50 to-zinc-50 text-transparent bg-clip-text">{amPm}</div>
    </div>
  );
}

export default Time;
