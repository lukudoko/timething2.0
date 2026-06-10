import React, { useEffect, useRef } from 'react';
import { format } from 'date-fns';

const DateWidget = ({ isActive, onWidgetUpdate, widgetKey }) => {
  const intervalRef = useRef(null);
  const lastSignatureRef = useRef(null);

  const buildContent = (date) => (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-sm text-red-600/80 font-semibold text-center">
        {format(date, 'EEE')}
      </div>
      <div className="text-2xl font-bold text-center">
        {format(date, 'd')}
      </div>
    </div>
  );

  const emitCurrentDate = () => {
    const now = new Date();
    const signature = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    if (signature !== lastSignatureRef.current) {
      lastSignatureRef.current = signature;
      onWidgetUpdate('regular', widgetKey, true, buildContent(now), signature);
    } else {
      onWidgetUpdate('regular', widgetKey, true, buildContent(now), signature);
    }
  };

  useEffect(() => {
    if (!isActive) {
      onWidgetUpdate('regular', widgetKey, false);
      lastSignatureRef.current = null;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    emitCurrentDate();

    intervalRef.current = setInterval(emitCurrentDate, 15 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, onWidgetUpdate, widgetKey]);

  return null;
};

export default DateWidget;