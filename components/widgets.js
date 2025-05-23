import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import mqtt from 'mqtt';
import Image from 'next/image';

const AppTray = () => {
  const [widgets, setWidgets] = useState([]);
  const widgetsRef = useRef(widgets);
  const [isCooldown, setIsCooldown] = useState(false);
  const widgetDataRef = useRef({}); // Store data signatures for all widgets

  const MAX_WIDGETS = 4;

  useEffect(() => {
    widgetsRef.current = widgets;
  }, [widgets]);

  // Core widget management - keeping your working logic
  const removeWidget = useCallback((id) => {
    setWidgets(prevWidgets => prevWidgets.filter(widget => widget.id !== id));
    // Clean up data reference when widget is removed
    delete widgetDataRef.current[id];
  }, []);

  const addWidget = useCallback((id, content, dataSignature = null) => {
  if (isCooldown) return;

  const prevSignature = widgetDataRef.current[id];

  // 1. If signature hasn't changed, do nothing
  if (dataSignature && prevSignature === dataSignature) {
    return;
  }

  // 2. Save the new signature
  if (dataSignature) {
    widgetDataRef.current[id] = dataSignature;
  }

  setIsCooldown(true);
  const newWidget = { id, content };

  const handleAddition = () => {
    setWidgets(prevWidgets => {
      const currentWidgets = widgetsRef.current;
      let updatedWidgets = [...currentWidgets];

      if (updatedWidgets.length >= MAX_WIDGETS) {
        updatedWidgets = updatedWidgets.slice(1);
        setTimeout(() => {
          setWidgets(current => [...current, newWidget]);
        }, 1000);
        return updatedWidgets;
      }

      return [...updatedWidgets, newWidget];
    });

    setTimeout(() => setIsCooldown(false), 500);
  };

  const existingWidget = widgetsRef.current.find(widget => widget.id === id);

  // 3. If widget exists AND data has changed → remove and re-add
  if (existingWidget) {
    removeWidget(id);
    setTimeout(handleAddition, 1000); // wait for exit animation
  } else {
    handleAddition();
  }
}, [isCooldown, removeWidget]);


  // Widget Registry System - makes adding new widgets super easy
  const widgetHandlers = useRef({});

  // Register a widget type
  const registerWidget = useCallback((id, handler) => {
    widgetHandlers.current[id] = handler;
  }, []);

  // Generic widget creation helper
  const createWidget = useCallback((id, content, options = {}) => {
    const { dataSignature, autoRemove, removeAfter = 15000 } = options;

    addWidget(id, content, dataSignature);

    // Auto-remove functionality
    if (autoRemove) {
      setTimeout(() => removeWidget(id), removeAfter);
    }
  }, [addWidget, removeWidget]);

  // Enhanced animation variants
  const widgetVariants = {
    initial: {
      opacity: 0,
      scale: 0.7,
      x: 300,
    },
    animate: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 250,
        damping: 22,
        opacity: { duration: 0.3 },
        filter: { duration: 0.4 }
      }
    },
    exit: (index) => ({
      opacity: 0,
      scale: 0.7,
      x: index === 0 ? -300 : 0,
      rotateY: index === 0 ? -20 : 20,
      filter: "blur(4px)",
      transition: {
        duration: 0.35,
        ease: [0.4, 0, 0.2, 1]
      }
    })
  };

  // WIDGET DEFINITIONS - Easy to add new ones!

  // Weather Widget
  useEffect(() => {
    registerWidget('weather', async () => {
      try {
        const response = await fetch('/api/weather');
        if (!response.ok) throw new Error(`Weather API error: ${response.status}`);

        const weatherData = await response.json();
        const { weather, main } = weatherData;
        const icon = weather[0].icon;
        const temp = Math.round(main.temp);
        const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

        const content = (
          <>
            <Image height="48" width="48" src={iconUrl} alt={`Weather: ${weather[0].description}`} />
            <div className="text-lg font-semibold text-center">{temp}°C</div>
          </>
        );

        createWidget('weather', content, {
          dataSignature: `${icon}-${temp}`
        });
      } catch (error) {
        console.error('Weather widget error:', error);
      }
    });

    // Initialize weather widget
    const initWeather = () => widgetHandlers.current.weather?.();
    const timeoutId = setTimeout(initWeather, 1500);
    const intervalId = setInterval(initWeather, 15 * 60 * 1000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [registerWidget, createWidget]);

  // Music Widget
  useEffect(() => {
    registerWidget('music', () => {
      const client = mqtt.connect('ws://192.168.3.41:9001');
      let debounceTimeout;
      let inactivityTimeout;

      let songData = { title: null, artist: null, artwork: null };

      const arrayBufferToBase64 = (buffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
      };

      const resetInactivityTimer = () => {
        clearTimeout(inactivityTimeout);
        inactivityTimeout = setTimeout(() => removeWidget('music'), 15000);
      };

      client.on('connect', () => {
        console.log('Connected to MQTT broker');
        client.subscribe('shairport/#');
      });

      client.on('message', (topic, message) => {
        if (topic === 'shairport/title') {
          songData.title = message.toString();
        } else if (topic === 'shairport/artist') {
          songData.artist = message.toString();
        } else if (topic === 'shairport/cover') {
          const base64 = arrayBufferToBase64(message);
          songData.artwork = base64 === 'LS0=' ? '/np.webp' : `data:image/jpeg;base64,${base64}`;
        }

        resetInactivityTimer();

        if (songData.artwork) {
          clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(() => {
            const content = (
              <div className="flex relative h-full flex-row w-full justify-center items-center">
                <Image
                  className=" rounded"
                  height={48}
                  width={48}
                  src={songData.artwork}
                  alt="Album artwork"
                />
                <div
                  className="absolute saturate-200 blur-md -z-10 h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${songData.artwork})` }}
                />
              </div>
            );

            createWidget('music', content, {
              dataSignature: songData.artwork
            });
          }, 2000);
        }
      });

      client.on('error', (error) => {
        console.error('MQTT error:', error);
      });

      return () => {
        clearTimeout(debounceTimeout);
        clearTimeout(inactivityTimeout);
        client.end();
      };
    });

    const cleanup = widgetHandlers.current.music?.();
    return cleanup;
  }, [registerWidget, createWidget, removeWidget]);



  // Easy widget trigger functions
  const triggerWidget = useCallback((widgetId) => {
    widgetHandlers.current[widgetId]?.();
  }, []);

  const handleAddGeneric = () => {
    const content = <span className="text-sm">Generic {Date.now()}</span>;
    createWidget(`generic-${Date.now()}`, content);
  };

  return (
    <div className="z-50 w-full h-16 flex justify-evenly">
      <AnimatePresence mode="popLayout">
        {widgets.map((widget, index) => (
          <motion.div
            key={widget.id}
            custom={index}
            variants={widgetVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex font-fit overflow-hidden backdrop-blur-xl bg-white/40 text-neutral-800 rounded-[1.25rem] min-w-fit w-1/4 max-w-[11vw] h-full shadow-[0px_4px_6px_-4px_rgba(0,_0,_0,_0.3)] border border-white/20 justify-center items-center"
            layout
            layoutId={widget.id}
          >
            {widget.content}
          </motion.div>
        ))}
      </AnimatePresence>


    </div>
  );
};

export default AppTray;