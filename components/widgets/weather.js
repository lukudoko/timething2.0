import React, { useEffect, useRef } from 'react';

const WeatherWidget = ({ isActive, onWidgetUpdate, widgetKey }) => {
  const intervalRef = useRef(null);
  const lastSignatureRef = useRef('');

  const fetchWeather = async () => {
    try {
      const response = await fetch('/api/weather');
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      const data = await response.json();
      const { current } = data;
      const temp = Math.round(current.temp);
      const icon = current.weather.icon;
      const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
      const dataSignature = `${icon}-${temp}`;

      if (dataSignature !== lastSignatureRef.current) {
        lastSignatureRef.current = dataSignature;
        const content = (
          <div className='flex dark:text-white flex-col items-center justify-center h-full'>
            <img
              height="56"
              width="56"
              src={iconUrl}
              //alt={`Weather: ${current.weather.description}`}
              className="-my-2 "
            />
            <div className="text-lg font-bold text-center -mt-2">{temp}°C</div>
          </div>
        );

        if (isActive) {
          onWidgetUpdate('regular', widgetKey, true, content, dataSignature);
        }
      }
    } catch (err) {
      console.error('Weather widget error:', err);
      onWidgetUpdate('regular', widgetKey, false, null);
    }
  };

  useEffect(() => {
    if (!isActive) {

      onWidgetUpdate('regular', 'weather', false, null);
      lastSignatureRef.current = '';

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const initialTimeout = setTimeout(fetchWeather, 1500);
    intervalRef.current = setInterval(fetchWeather, 15 * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, onWidgetUpdate]);

  return null;
};

export default WeatherWidget;