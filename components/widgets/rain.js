import React, { useEffect, useRef } from 'react';
import { FaUmbrella } from 'react-icons/fa';

const PrecipitationWidget = ({ isActive, onWidgetUpdate, widgetKey, location }) => {
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

    const checkPrecipitationConditions = async () => {
      try {
        const hour = new Date().getHours();
        const lat = location?.latitude || 57.65;
        const lon = location?.longitude || 11.916;

        const response = await fetch(
          `/api/weather?lat=${lat}&lon=${lon}&hour=${hour}`,
          { cache: 'no-store' }
        );

        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status}`);
        }

        const data = await response.json();
        if (cancelled || !activeRef.current) return;

        const hasRainAlert = data.hasRainAlert;

        if (!hasRainAlert) {
          if (lastSignatureRef.current !== null) {
            lastSignatureRef.current = null;
            onWidgetUpdate('regular', widgetKey, false);
          }
          return;
        }

        const signature = 'rain-alert';
        if (signature === lastSignatureRef.current) return;

        lastSignatureRef.current = signature;

        const content = (
          <div className="flex flex-col items-center justify-center h-full">
            <FaUmbrella size={30} />
            <div className="text-xs font-semibold text-center">
              Bring A Coat!
            </div>
          </div>
        );

        onWidgetUpdate('regular', widgetKey, true, content, signature);
      } catch (err) {
        console.error('Precipitation widget error:', err);
      }
    };

    checkPrecipitationConditions();
    intervalRef.current = setInterval(checkPrecipitationConditions, 15 * 60 * 1000);

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

export default PrecipitationWidget;