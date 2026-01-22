import React, { useEffect, useState } from 'react';
import { TbSunglassesFilled  } from "react-icons/tb";

const UVWidget = ({ isActive, onWidgetUpdate, widgetKey }) => {
  const [lastChecked, setLastChecked] = useState(0);

  const checkUvConditions = async () => {
    try {

      if (!isActive) {
        onWidgetUpdate('regular', widgetKey, false, null); 

        return;
      }

      const response = await fetch('/api/weather');

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      const uvIndex = data.currentUvIndex;

      const shouldShow = isActive && uvIndex && uvIndex > 4;

      if (shouldShow) {
        const content = (
          <div className='flex dark:text-white flex-col items-center justify-center h-full'>
            <TbSunglassesFilled  size={30} />
            <div className="text-base font-extrabold text-center">UV {Math.round(uvIndex)}</div>
          </div>
        );

        onWidgetUpdate('regular', widgetKey, true, content, `uv-${uvIndex}`); 

      } else {

        onWidgetUpdate('regular', widgetKey, false, null); 

      }
    } catch (err) {
      console.error('UV widget error:', err);
      onWidgetUpdate('regular', widgetKey, false, null); 

    }
  };

  useEffect(() => {

    if (!isActive) {
      onWidgetUpdate('regular', widgetKey, false, null); 

      return;
    }

    checkUvConditions();

    const intervalId = setInterval(checkUvConditions, 15 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isActive, widgetKey]); 

  return null;
};

export default UVWidget;