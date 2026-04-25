import React, { useEffect, useRef } from 'react';
import Image from 'next/image';

const WeatherWidget = ({ isActive, onWidgetUpdate, widgetKey }) => {
  const intervalRef = useRef(null);
  const lastSignatureRef = useRef(null);
  const activeRef = useRef(isActive);

  useEffect(() => {
    activeRef.current = isActive;
  }, [isActive]);

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

    let cancelled = false;

    const fetchWeather = async () => {
      try {
        const response = await fetch('/api/weather', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status}`);
        }

        const data = await response.json();
        if (cancelled || !activeRef.current) return;

        const { current } = data;
        const temp = Math.round(current.temp);
        const icon = current.weather.icon;
        const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

        const signature = `${icon}-${temp}`;

        if (signature !== lastSignatureRef.current) {
          lastSignatureRef.current = signature;

          const content = (
            <div className="flex gap-2 items-center justify-center h-full">
              <Image
                height={56}
                width={56}
                src={iconUrl}
                alt={`Weather: ${current.weather.description}`}
                className="-mx-2"
              />
              <div className="text-xl font-bold text-center">
                {temp}°C
              </div>
            </div>
          );

          onWidgetUpdate(
            'regular',
            widgetKey,
            true,
            content,
            signature
          );
        }
      } catch (err) {
        console.error('Weather widget error:', err);

        if (!cancelled) {
          onWidgetUpdate('regular', widgetKey, false);
        }
      }
    };

    fetchWeather();

    intervalRef.current = setInterval(fetchWeather, 15 * 60 * 1000);

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

export default WeatherWidget;