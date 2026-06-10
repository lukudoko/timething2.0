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

  const buildContent = (value) => {
    const year = getYear(new Date());
    return (
      <div className="relative w-full h-full overflow-hidden rounded-[1.25rem]">
        <div
          className="absolute top-0 left-0 h-full bg-black/15 dark:bg-white/15 transition-all duration-1000 ease-out"
          style={{ width: `${value}%` }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <span className="text-lg font-extrabold tabular-nums leading-none">
            {value}%
          </span>
          <span className="text-[0.5rem] font-semibold tracking-widest mt-0.5 opacity-80">
            {year}
          </span>
        </div>
      </div>
    );
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

    const emitProgress = () => {
      const value = getProgress();
      const signature = `year-${value}-${getYear(new Date())}`;
      if (!cancelled) {
        onWidgetUpdate('regular', widgetKey, true, buildContent(value), signature);
      }
      lastRef.current = value;
    };

    emitProgress();
    intervalRef.current = setInterval(emitProgress, 15 * 60 * 1000);

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