import React, { useEffect, useRef } from 'react';
import { FaUmbrella } from "react-icons/fa";

const PrecipitationWidget = ({ isActive, onWidgetUpdate, widgetKey }) => {
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
        const response = await fetch('/api/weather');
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

        onWidgetUpdate(
          'regular',
          widgetKey,
          true,
          content,
          signature
        );

      } catch (err) {
        console.error('Precipitation widget error:', err);

        if (!cancelled) {
          onWidgetUpdate('regular', widgetKey, false);
        }
      }
    };

    checkPrecipitationConditions();

    intervalRef.current = setInterval(
      checkPrecipitationConditions,
      15 * 60 * 1000
    );

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

export default PrecipitationWidget;