import React, { useEffect, useRef } from 'react';
import { format } from 'date-fns';

const DateWidget = ({ isActive, onWidgetUpdate, widgetKey }) => {
  const intervalRef = useRef(null);
  const lastDateRef = useRef('');

  const buildContent = (date) => (
    <div className='flex flex-col dark:text-white items-center justify-center h-full'>
      <div className="text-sm text-black/50 font-semibold text-center">
        {format(date, 'EEE')}
      </div>
      <div className="text-2xl font-bold text-center">
        {format(date, 'd')}
      </div>
    </div>
  );

  const getSignature = (date) =>
    `date-${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;

  const updateIfChanged = (date) => {
    const signature = getSignature(date);
    if (signature !== lastDateRef.current) {
      lastDateRef.current = signature;
      onWidgetUpdate('regular', widgetKey, true, buildContent(date), signature);
    }
  };

  useEffect(() => {
    if (!isActive) {
      onWidgetUpdate('regular', widgetKey, false, null);
      lastDateRef.current = '';
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    updateIfChanged(new Date());

    intervalRef.current = setInterval(() => {
      updateIfChanged(new Date());
    }, 60000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  return null;
};

export default DateWidget;