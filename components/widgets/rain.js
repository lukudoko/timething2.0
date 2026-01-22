import React, { useEffect, useState } from 'react';
import { FaUmbrella } from "react-icons/fa";

const PrecipitationWidget = ({ isActive, onWidgetUpdate, widgetKey }) => {
  const [lastChecked, setLastChecked] = useState(0);

  const checkPrecipitationConditions = async () => {
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
      const hasRainAlert = data.hasRainAlert; 

      if (hasRainAlert) {
        const content = (
          <div className='flex dark:text-white  flex-col items-center justify-center h-full'>
            <FaUmbrella size={30} />
            <div className="text-xs font-semibold text-center">Bring A Coat</div>
          </div>
        );

        onWidgetUpdate('regular', widgetKey, true, content, `rain-alert-${Date.now()}`); 

      } else {

        onWidgetUpdate('regular', widgetKey, false, null); 

      }
    } catch (err) {
      console.error('Precipitation widget error:', err);
      onWidgetUpdate('regular', widgetKey, false, null); 

    }
  };

  useEffect(() => {

    if (!isActive) {
      onWidgetUpdate('regular', widgetKey, false, null); 

      return;
    }

    checkPrecipitationConditions();

    const intervalId = setInterval(checkPrecipitationConditions, 15 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isActive, widgetKey]); 

  return null;
};

export default PrecipitationWidget;