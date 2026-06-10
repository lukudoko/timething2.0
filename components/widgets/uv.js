import React, { useEffect, useRef } from 'react';
import { TbSunglassesFilled } from 'react-icons/tb';

const UVWidget = ({ isActive, onWidgetUpdate, widgetKey, location }) => {
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
        const hour = new Date().getHours();
        const lat = location?.lat || 57.65;
        const lon = location?.lon || 11.916;
        const res = await fetch(
          `/api/weather?lat=${lat}&lon=${lon}&hour=${hour}`,
          { cache: 'no-store' }
        );
        if (!res.ok) throw new Error(`Weather API error: ${res.status}`);

        const data = await res.json();
        if (cancelled || !activeRef.current) return;

        const maxUv = data.maxUvIndex6h; 
        const shouldShow = maxUv >= 4;

        if (!shouldShow) {
          if (lastSignatureRef.current !== null) {
            lastSignatureRef.current = null;
            onWidgetUpdate('regular', widgetKey, false);
          }
          return;
        }

        const roundedMax = Math.round(maxUv);
        const signature = `uv-max-${roundedMax}`;

        if (signature === lastSignatureRef.current) return;
        lastSignatureRef.current = signature;

        const content = (
          <div className="flex flex-col items-center justify-center h-full">
            <TbSunglassesFilled size={30} />
            <div className="text-base font-extrabold text-center">
              Max UVI {roundedMax}
            </div>
          </div>
        );

        onWidgetUpdate('regular', widgetKey, true, content, signature);
      } catch (err) {
        console.error('UV widget error:', err);
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
  }, [isActive, onWidgetUpdate, widgetKey, location]);

  return null;
};

export default UVWidget;