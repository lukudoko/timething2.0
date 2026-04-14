import React, { useEffect, useRef } from 'react';
import {
  startOfYear,
  endOfYear,
  differenceInMilliseconds,
  getYear,
} from 'date-fns';

const YearProgressWidget = ({ isActive, onWidgetUpdate, widgetKey }) => {
  const intervalRef = useRef(null);
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
      onWidgetUpdate('regular', widgetKey, false);
      lastRef.current = null;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      return;
    }

    let cancelled = false;

    const update = () => {
      const value = getProgress();

      if (value === lastRef.current) return;
      lastRef.current = value;

      const content = (
        <div className="flex items-center justify-center w-full h-full">
          <div className="relative h-full aspect-square">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                strokeWidth="10"
                className="stroke-black/10 dark:stroke-white/10"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * value) / 100}
                transform="rotate(-90 50 50)"
                className="stroke-black dark:stroke-white transition-all duration-1000 ease-out"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
              <span className="text-base font-bold tabular-nums">
                {value}%
              </span>
              <span className="text-[0.5rem] font-semibold tracking-widest mt-0.5 opacity-60">
                {getYear(new Date())}
              </span>
            </div>
          </div>
        </div>
      );

      if (!cancelled) {
        onWidgetUpdate(
          'regular',
          widgetKey,
          true,
          content,
          `year-${value}-${getYear(new Date())}`

        );
      }
    };

    update();

    intervalRef.current = setInterval(update, 60 * 60 * 1000);

    return () => {
      cancelled = true;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, onWidgetUpdate, widgetKey]);

  return null;
};

export default YearProgressWidget;