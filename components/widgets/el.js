import { useEffect, useRef } from 'react';
import { FaBolt } from 'react-icons/fa'; 

const EnergyPriceWidget = ({ isActive, onWidgetUpdate, widgetKey }) => {
  const intervalRef = useRef(null);
  const lastSignatureRef = useRef(null);
  const activeRef = useRef(isActive);

  useEffect(() => {
    activeRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    if (!isActive) {
      onWidgetUpdate('regular', widgetKey, false, null);
      lastSignatureRef.current = null;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    let cancelled = false;

    const fetchPrices = async () => {
      try {
        const res = await fetch('/api/el', { cache: 'no-store' });
        if (!res.ok) throw new Error(`Energy API error: ${res.status}`);

        const data = await res.json();
        if (cancelled || !activeRef.current) return;

        const { current } = data;

        const signature = `energy-${current.priceSek}-${current.level}`;

        if (signature !== lastSignatureRef.current) {
          lastSignatureRef.current = signature;

          const levelColors = {
            negative: 'text-green-500 animate-pulse',
            low: 'text-green-700',
            normal: '', 
            high: 'text-rose-500 '
          };

          const colorClass = levelColors[current.level];

          const content = (
            <div className="flex gap-2 items-center text-sm font-bold text-center justify-center h-full">
              <FaBolt 
                size={20} 
                className={colorClass} 
              />
              <span className={colorClass}>
                {current.display}
              </span>
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
        console.error('Energy widget error:', err);

        if (!cancelled) {
          onWidgetUpdate('regular', widgetKey, false, null);
        }
      }
    };

    fetchPrices();
    intervalRef.current = setInterval(fetchPrices, 15 * 60 * 1000);

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

export default EnergyPriceWidget;