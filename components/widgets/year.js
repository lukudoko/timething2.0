import React, { useEffect, useRef, useState } from 'react';
import {
  startOfYear,
  endOfYear,
  differenceInMilliseconds,
  getYear,
} from 'date-fns';

const YearProgressWidget = ({ isActive, onWidgetUpdate, widgetKey }) => {
  const [progress, setProgress] = useState(0);
  const lastRef = useRef(null);

  const getProgress = () => {
    const now = new Date();
    const start = startOfYear(now);
    const end = endOfYear(now);
    const total = differenceInMilliseconds(end, start);
    const elapsed = differenceInMilliseconds(now, start);
    return Math.floor((elapsed / total) * 100);
  };

  useEffect(() => {
    if (!isActive) {
      onWidgetUpdate('regular', widgetKey, false, null);
      return;
    }

    const update = () => {
      const value = getProgress();
      if (value === lastRef.current) return;

      lastRef.current = value;
      setProgress(value);

      const content = (
        <div className="flex items-center  dark:text-white justify-center w-full h-full">
          <div className="relative w-14 h-14">
            <svg viewBox="0 0 100 100" className="w-full h-full">

              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="white"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * value) / 100}
                transform="rotate(-90 50 50)"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
              <span className="text-sm font-bold tabular-nums">
                {value}%
              </span>
              <span className="text-[0.5rem] opacity-40 tracking-widest mt-0.5">
                {getYear(new Date())}
              </span>
            </div>
          </div>
        </div>
      );

      onWidgetUpdate('regular', widgetKey, true, content, `year-${value}`);
    };

    update();
    const interval = setInterval(update, 60 * 60 * 1000); // hourly
    return () => clearInterval(interval);
  }, [isActive, onWidgetUpdate, widgetKey]);

  return null;
};

export default YearProgressWidget;
