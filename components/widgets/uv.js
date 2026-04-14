import React, { useEffect, useRef } from 'react';
import { TbSunglassesFilled } from "react-icons/tb";

const UVWidget = ({ isActive, onWidgetUpdate, widgetKey }) => {
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

    const checkUvConditions = async () => {
      try {
        const response = await fetch('/api/weather');
        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status}`);
        }

        const data = await response.json();

        if (cancelled || !activeRef.current) return;

        const uvIndex = data.currentUvIndex;
        const isDay = data.isDay;

        const shouldShow =
          isDay && uvIndex && uvIndex > 4;

        if (!shouldShow) {

          if (lastSignatureRef.current !== null) {
            lastSignatureRef.current = null;
            onWidgetUpdate('regular', widgetKey, false);
          }
          return;
        }

        const roundedUv = Math.round(uvIndex);
        const signature = `uv-${roundedUv}-${isDay}`;

        if (signature === lastSignatureRef.current) return;

        lastSignatureRef.current = signature;

        const content = (
          <div className="flex flex-col items-center justify-center h-full">
            <TbSunglassesFilled size={30} />
            <div className="text-base font-extrabold text-center">
              UV {roundedUv}
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

      } catch (err) {
        console.error('UV widget error:', err);

        if (!cancelled) {
          onWidgetUpdate('regular', widgetKey, false);
        }
      }
    };

    checkUvConditions();

    intervalRef.current = setInterval(checkUvConditions, 15 * 60 * 1000);

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

export default UVWidget;