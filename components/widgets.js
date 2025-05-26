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

  // Core widget management
  const removeWidget = useCallback((id, keepSignature = false) => {
    setWidgets(prevWidgets => prevWidgets.filter(widget => widget.id !== id));
    // Only clean up data reference if we're not replacing the widget
    if (!keepSignature) {
      delete widgetDataRef.current[id];
    }
  }, []);

  const addWidget = useCallback((id, content, dataSignature = null) => {
    if (isCooldown) return;

    const prevSignature = widgetDataRef.current[id];

    // If signature exists and hasn't changed, do nothing
    if (dataSignature && prevSignature === dataSignature) {
      console.log(`Widget ${id} signature unchanged: ${dataSignature}`);
      return;
    }

    // Update the signature BEFORE processing
    if (dataSignature) {
      widgetDataRef.current[id] = dataSignature;
      console.log(`Widget ${id} signature updated: ${prevSignature} -> ${dataSignature}`);
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

    if (existingWidget) {
      removeWidget(id, true); // Keep signature when replacing
      setTimeout(handleAddition, 1000);
    } else {
      handleAddition();
    }
  }, [isCooldown, removeWidget]);

  // Widget Registry System
  const widgetHandlers = useRef({});

  const registerWidget = useCallback((id, handler) => {
    widgetHandlers.current[id] = handler;
  }, []);

  const createWidget = useCallback((id, content, options = {}) => {
    const { dataSignature, autoRemove, removeAfter = 15000 } = options;

    addWidget(id, content, dataSignature);

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

  // Weather Widget - Fixed version
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

        // Create a more robust signature that includes the actual values we care about
        const dataSignature = `${icon}-${temp}`;

        console.log(`Weather data: icon=${icon}, temp=${temp}, signature=${dataSignature}`);

        const content = (
          <div className='flex flex-col items-center justify-center h-full'>
            <Image
              height="60"
              width="60"
              src={iconUrl}
              alt={`Weather: ${weather[0].description}`}
              className="-mt-2 -mb-1"
            />
            <div className="text-sm font-semibold text-center -mt-2">{temp}°C</div>
          </div>
        );

        createWidget('weather', content, {
          dataSignature
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

  // Music Widget - Keep your working logic
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
                  height={52}
                  width={52}
                  src={songData.artwork}
                  alt="Album artwork"
                />
                <div
                  className="absolute saturate-200 blur-lg -z-10 h-full w-full bg-cover bg-center"
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
    <div className="z-50 w-full h-20 flex justify-evenly">
      <AnimatePresence mode="popLayout">
        {widgets.map((widget, index) => (
          <motion.div
            key={widget.id}
            custom={index}
            variants={widgetVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex font-fit overflow-hidden backdrop-blur-xl bg-white/30 text-neutral-800 rounded-[1.25rem] min-w-fit w-1/4 max-w-[11vw] h-full shadow-[0px_4px_6px_-4px_rgba(0,_0,_0,_0.3)] border border-white/20 justify-center items-center"
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