import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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

const MAX_SPACE = 8;
const HERO_SPACE = 4;

const AppTray = () => {
  const [widgets, setWidgets] = useState([]);
  const [config, setConfig] = useState(null);
  const [visible, setVisible] = useState(false);
  const [tick, setTick] = useState(0);

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      setConfig(data);
    } catch (err) {
      console.error('Config fetch failed:', err);
    }
  }, []);

  useEffect(() => {
    loadConfig();
    const interval = setInterval(loadConfig, 30_000);
    const handler = () => loadConfig();
    window.addEventListener('refresh-tray-config', handler);
    return () => {
      clearInterval(interval);
      window.removeEventListener('refresh-tray-config', handler);
    };
  }, [loadConfig]);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const currentTimeSlot = getCurrentTimeSlot();

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const isWidgetActive = useCallback((widgetKey) => {
    if (!config?.widgets?.[widgetKey]) return false;
    const widgetConfig = config.widgets[widgetKey];
    if (!widgetConfig.enabled) return false;
    if (!widgetConfig.timeSlots?.length) return true;
    return widgetConfig.timeSlots.includes(currentTimeSlot);
  }, [config, currentTimeSlot]);

  useEffect(() => {
    if (!config) return;
    setWidgets(prev => prev.filter(w => isWidgetActive(w.subtype)));
  }, [config, currentTimeSlot, isWidgetActive]);

  const removeWidgetByType = useCallback((type, subtype) => {
    setWidgets(prev =>
      prev.filter(w => !(w.type === type && w.subtype === subtype))
    );
  }, []);

  const addWidget = useCallback((type, subtype, content, signature = null) => {
    setWidgets(prev => {
      const existing = prev.find(w => w.type === type && w.subtype === subtype);
      if (existing && signature !== null && existing.signature === signature) {
        return prev;
      }

      let next = prev.filter(w => !(w.type === type && w.subtype === subtype));

      const newWidget = {
        id: `${type}-${subtype}-${Date.now()}`,
        type,
        subtype,
        content,
        signature,
        timestamp: Date.now(),
        spaceValue: type === 'hero' ? HERO_SPACE : 1,
      };

      if (type === 'hero') {
        const regulars = next.filter(w => w.type === 'regular');
        const newestRegulars = regulars
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, MAX_SPACE - HERO_SPACE);
        return [newWidget, ...newestRegulars];
      }

      next.push(newWidget);

      const heroes = next.filter(w => w.type === 'hero');
      let regulars = next
        .filter(w => w.type === 'regular')
        .sort((a, b) => a.timestamp - b.timestamp);

      let totalSpace =
        heroes.reduce((s, w) => s + w.spaceValue, 0) +
        regulars.reduce((s, w) => s + w.spaceValue, 0);

      while (totalSpace > MAX_SPACE && regulars.length > 0) {
        regulars.shift();
        totalSpace =
          heroes.reduce((s, w) => s + w.spaceValue, 0) +
          regulars.reduce((s, w) => s + w.spaceValue, 0);
      }

      return [...heroes, ...regulars];
    });
  }, []);

  const handleWidgetUpdate = useCallback(
    (type, subtype, isActive, content, signature = null) => {
      if (isActive && content) {
        addWidget(type, subtype, content, signature);
      } else {
        removeWidgetByType(type, subtype);
      }
    },
    [addWidget, removeWidgetByType]
  );

  const stableLocation = useMemo(() => config?.location ?? {}, [
    config?.location?.latitude,
    config?.location?.longitude,
  ]);

  if (!config) return null;

  const heroWidget = widgets.find(w => w.type === 'hero');
  const allWidgets = [
    ...widgets.filter(w => w.type === 'hero'),
    ...widgets.filter(w => w.type === 'regular').sort((a, b) => a.timestamp - b.timestamp)
  ];

  return (
    <LayoutGroup>
      <div className="z-50 w-full max-w-lg flex flex-col items-center">
        <motion.div
          animate={{ height: heroWidget ? '8.5rem' : '4rem' }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className={
            heroWidget
              ? "grid grid-cols-4 auto-rows-[4rem] gap-2 w-full"
              : "flex flex-wrap justify-center gap-2 w-full"
          }
        >
          <AnimatePresence mode="popLayout">
            {allWidgets.map((widget, index) => (
              <motion.div
                key={widget.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={visible ? {
                  opacity: 1, scale: 1, y: 0,
                  transition: { delay: index * 0.35, duration: 0.35 }
                } : { opacity: 0, scale: 0.9, y: 10 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                className={
                  widget.type === 'hero'
                    ? "flex w-full backdrop-blur-xl overflow-hidden text-black dark:text-white bg-white/40 dark:bg-white/20 rounded-[1.25rem] justify-center items-center col-span-2 row-span-2"
                    : heroWidget
                      ? "flex w-full backdrop-blur-xl overflow-hidden text-black dark:text-white bg-white/40 dark:bg-white/20 rounded-[1.25rem] justify-center items-center"
                      : "flex w-[calc(25%-0.375rem)] overflow-hidden text-black dark:text-white h-14 backdrop-blur-xl bg-white/40 dark:bg-white/20 rounded-[1.25rem] justify-center items-center"
                }
              >
                {widget.content}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        {Object.entries(config.widgets).map(([widgetKey, widgetConfig]) => {
          if (!widgetConfig.enabled) return null;
          const WidgetComponent = WIDGET_COMPONENTS[widgetKey];
          if (!WidgetComponent) return null;
          return (
            <WidgetComponent
              key={widgetKey}
              widgetKey={widgetKey}
              isActive={isWidgetActive(widgetKey)}
              onWidgetUpdate={handleWidgetUpdate}
              location={stableLocation}
            />
          );
        })}
      </div>
    </LayoutGroup>
  );
};

export default AppTray;