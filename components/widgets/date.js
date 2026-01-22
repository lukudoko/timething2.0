import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';

const DateWidget = ({ isActive, onWidgetUpdate, widgetKey }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (!isActive) {

      onWidgetUpdate('regular', widgetKey, false, null);
      return;
    }

    const now = new Date();
    setCurrentDate(now);

    onWidgetUpdate('regular', widgetKey, true, 
      <div className='flex flex-col dark:text-white  items-center justify-center h-full'>
        <div className="text-sm opacity-50 font-semibold text-center">
          {format(now, 'EEE')} {}
        </div>
        <div className="text-2xl font-bold text-center">
          {format(now, 'd')} {}
        </div>
      </div>,
      `date-${now.getDate()}-${now.getMonth()}-${now.getFullYear()}` 

    );

    const intervalId = setInterval(() => {
      const now = new Date();

      if (now.getDate() !== currentDate.getDate() || 
          now.getMonth() !== currentDate.getMonth() || 
          now.getFullYear() !== currentDate.getFullYear()) {

        setCurrentDate(now);

        if (isActive) {
          onWidgetUpdate('regular', widgetKey, true, 
            <div className='flex flex-col items-center justify-center h-full'>
              <div className="text-sm font-bold text-center">
                {format(now, 'EEE')} {}
              </div>
              <div className="text-xs font-semibold text-center">
                {format(now, 'MMM do')} {}
              </div>
            </div>,
            `date-${now.getDate()}-${now.getMonth()}-${now.getFullYear()}`
          );
        }
      }
    }, 60000); 

    return () => clearInterval(intervalId);
  }, [isActive]); 

  return null;
};

export default DateWidget;