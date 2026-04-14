import React, { useEffect, useRef } from 'react';
import { format, parseISO, isValid } from 'date-fns';

const CommuterWidget = ({ isActive, onWidgetUpdate, widgetKey }) => {
  const intervalRef = useRef(null);
  const lastSignatureRef = useRef(null);

  const WALKING_TIME = 7;

  const DEST_MAP = {
    'Göteborg Östra sjukhuset': 'Östra sjukhuset',
    'Bergsjön Komettorget': 'Bergsjön',
    "Göteborg Centralst Drottningt": "Centralen",
    "Göteborg Brunnsparken": "Brunnsparken"
  };

  const getArrivalDisplay = (arrivalTimeStr) => {
    if (!arrivalTimeStr) return "ETA N/A";

    const date = parseISO(arrivalTimeStr);
    if (!isValid(date)) return "ETA Error";

    return `${format(date, 'h:mm aaa')} @ Brunns`;
  };

  const getDisplayDest = (dest) => {
    const clean = dest.split('(')[0].trim();
    return DEST_MAP[clean] || clean;
  };

  useEffect(() => {
    if (!isActive) {
      onWidgetUpdate('hero', widgetKey, false);
      lastSignatureRef.current = null;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      return;
    }

    let cancelled = false;

    const fetchDepartures = async () => {
      try {
        const response = await fetch('/api/vasttrafik');
        if (!response.ok) throw new Error('API Error');

        const data = await response.json();
        if (cancelled) return;

        const now = new Date();

        const catchable = data.departures
          .filter(d => d.line === "1" || d.line === "7")
          .filter(d => {
            const diffMins = Math.floor((new Date(d.time) - now) / 60000);
            return diffMins >= WALKING_TIME;
          })
          .slice(0, 2);

        const signature = catchable
          .map(dep => {
            const mins = Math.floor((new Date(dep.time) - now) / 60000);
            const leaveIn = mins - WALKING_TIME;
            return `${dep.line}-${dep.dest}-${leaveIn}`;
          })
          .join('|');

        if (signature === lastSignatureRef.current) return;

        lastSignatureRef.current = signature;

        const content = (
          <div className="flex flex-col w-full h-full p-3 justify-between">
            <div className="flex h-full justify-evenly flex-col gap-2">
              {catchable.map((dep, idx) => {
                const now = new Date();
                const mins = Math.floor((new Date(dep.time) - now) / 60000);
                const leaveIn = mins - WALKING_TIME;
                const isWalkNow = leaveIn <= 1;

                return (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 aspect-square rounded-lg flex items-center justify-center text-xl font-black shadow-sm 
                        ${dep.line === '1'
                          ? 'bg-white text-black border border-neutral-200'
                          : 'bg-[#924a31] text-white'}`}>
                        {dep.line}
                      </div>

                      <div className="flex flex-col">
                        <div className="text-sm font-bold truncate leading-tight">
                          {getDisplayDest(dep.dest)}
                        </div>
                        <div className="text-[0.6rem] opacity-50 font-bold mt-0.5">
                          {getArrivalDisplay(dep.arrivalTimeAtTarget)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {!isWalkNow && (
                        <div className="text-[0.6rem] opacity-40 font-bold uppercase">
                          Leave In
                        </div>
                      )}
                      {isWalkNow && (
                        <div className="text-[0.6rem] text-green-600 dark:text-green-400 font-bold uppercase">
                          Leave
                        </div>
                      )}
                      <div className={`text-2xl font-extrabold tabular-nums leading-none 
                        ${isWalkNow ? 'text-green-600 dark:text-green-400 animate-pulse' : ''}`}>
                        {isWalkNow ? 'Now' : `${leaveIn} m`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

        onWidgetUpdate('hero', widgetKey, true, content, signature);

      } catch (err) {
        console.error('Commuter fetch error:', err);
        onWidgetUpdate('hero', widgetKey, false);
      }
    };

    fetchDepartures();

    intervalRef.current = setInterval(fetchDepartures, 30000);

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

export default CommuterWidget;