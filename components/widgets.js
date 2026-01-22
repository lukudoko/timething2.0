import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { WIDGET_REGISTRY } from '@/utils/widgetRegistry';

const WIDGET_COMPONENTS = WIDGET_REGISTRY;

const getCurrentTimeSlot = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 24) return 'evening';
  return 'night';
};

const AppTray = () => {
  const [widgets, setWidgets] = useState([]);
  const [config, setConfig] = useState(null);
  const [currentTimeSlot, setCurrentTimeSlot] = useState(getCurrentTimeSlot());

  useEffect(() => {
    const loadConfig = async () => {
      const res = await fetch('/api/config');
      const data = await res.json();
      setConfig(data);
    };
    loadConfig();
  }, []);


  useEffect(() => {
    const checkTimeSlot = () => {
      const newSlot = getCurrentTimeSlot();
      if (newSlot !== currentTimeSlot) {
        setCurrentTimeSlot(newSlot);
      }
    };

    const interval = setInterval(checkTimeSlot, 60000);
    return () => clearInterval(interval);
  }, [currentTimeSlot]);

  const isWidgetActive = useCallback((widgetKey) => {
    if (!config) return false;

    const widgetConfig = config.widgets[widgetKey];
    if (!widgetConfig?.enabled) {
      return false;
    }

    if (!widgetConfig.timeSlots || widgetConfig.timeSlots.length === 0) {
      return true;
    }

    const isActive = widgetConfig.timeSlots.includes(currentTimeSlot);
    return isActive;
  }, [config, currentTimeSlot]);

  const handleWidgetUpdate = useCallback((type, subtype, isActive, content, signature = null) => {

    if (isActive && content) {
      addWidget(type, subtype, content, signature);
    } else {
      removeWidgetByType(type, subtype);
    }
  }, []);

  const addWidget = useCallback((type, subtype, content, signature = null) => {
    setWidgets(prev => {

      const filtered = prev.filter(w => !(w.type === type && w.subtype === subtype));

      const newWidget = {
        id: `${type}-${subtype}-${Date.now()}`,
        type,
        subtype,
        spaceValue: type === 'hero' ? 4 : 1,
        content,
        timestamp: Date.now(),
        signature
      };

      if (type === 'hero') {
        const regularWidgets = filtered.filter(w => w.type === 'regular');
        const availableSpace = 4;
        const sortedRegulars = regularWidgets
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, availableSpace);
        return [newWidget, ...sortedRegulars];
      }

      const candidateList = [...filtered, newWidget];
      const totalSpace = candidateList.reduce((sum, w) => sum + w.spaceValue, 0);

      if (totalSpace <= 8) {
        return candidateList;
      }

      const regularWidgets = candidateList.filter(w => w.type === 'regular');
      const heroWidgets = candidateList.filter(w => w.type === 'hero');
      const sortedRegulars = regularWidgets.sort((a, b) => a.timestamp - b.timestamp);

      while (sortedRegulars.length > 0 &&
        (sortedRegulars.reduce((sum, w) => sum + w.spaceValue, 0) +
          heroWidgets.reduce((sum, w) => sum + w.spaceValue, 0)) > 8) {
        sortedRegulars.shift();
      }

      return [...heroWidgets, ...sortedRegulars];
    });
  }, []);

  const removeWidgetByType = useCallback((type, subtype) => {
    setWidgets(prev => prev.filter(w => !(w.type === type && w.subtype === subtype)));
  }, []);

  if (!config) {
    return;
  }

  const heroWidget = widgets.find(w => w.type === 'hero');
  const regularWidgets = widgets
    .filter(w => w.type === 'regular')
    .sort((a, b) => a.timestamp - b.timestamp);

  const totalSpaceUsed = widgets.reduce((sum, w) => sum + w.spaceValue, 0);
  const activeCount = Object.keys(config.widgets).filter(isWidgetActive).length;

  return (
    <LayoutGroup>
      <div className="z-50 w-full max-w-lg flex flex-col items-center">
        <div className={heroWidget
          ? "grid  grid-cols-4 auto-rows-[4rem] gap-2 w-full"
          : "flex flex-wrap justify-center gap-2 w-full"
        }>
          <AnimatePresence mode="popLayout">
            {heroWidget && (
              <motion.div
                key={heroWidget.id}
                layout
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{
                  layout: { duration: 0.3, ease: "easeInOut" },
                  duration: 0.3
                }}
                className="flex w-full font-fit overflow-hidden backdrop-blur-xl   dark:bg-white/20  bg-white/40 text-neutral-800 rounded-[1.25rem] justify-center items-center col-span-2 row-span-2"
              >
                {heroWidget.content}
              </motion.div>
            )}

            {regularWidgets.map((widget, index) => {
              const adjustedIndex = heroWidget ? index + 1 : index;
              return (
                <motion.div
                  key={widget.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    transition: {
                      delay: adjustedIndex * 0.1,
                      duration: 0.3,
                      ease: "easeOut"
                    }
                  }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
                  className={heroWidget
                    ? "flex w-full font-fit overflow-hidden backdrop-blur-xl  dark:bg-white/20  bg-white/40 text-neutral-800 rounded-[1.25rem] justify-center items-center"
                    : "flex w-[calc(25%-0.375rem)] h-14 font-fit overflow-hidden backdrop-blur-xl  dark:bg-white/20  bg-white/40 text-neutral-800 rounded-[1.25rem] justify-center items-center"
                  }
                >
                  {widget.content}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>


        {Object.entries(config.widgets).map(([widgetKey, widgetConfig]) => {

          if (!widgetConfig.enabled) return null;

          const WidgetComponent = WIDGET_COMPONENTS[widgetKey];
          if (!WidgetComponent) {
            console.warn(`Widget "${widgetKey}" enabled in config but not found in WIDGET_COMPONENTS`);
            return null;
          }

          return (
            <WidgetComponent
              key={widgetKey}
              widgetKey={widgetKey}
              isActive={isWidgetActive(widgetKey)}
              onWidgetUpdate={handleWidgetUpdate}
              location={config.location}
            />
          );
        })}
      </div>
    </LayoutGroup>
  );
};

export default AppTray;