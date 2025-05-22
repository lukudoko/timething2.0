import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import mqtt from 'mqtt';
import Image from 'next/image';

const AppTray = () => {
  const [widgets, setWidgets] = useState([]);
  const widgetsRef = useRef(widgets);
  const [isCooldown, setIsCooldown] = useState(false);

  const MAX_WIDGETS = 4;

  useEffect(() => {
    widgetsRef.current = widgets;
  }, [widgets]);

  // Function to remove a widget by ID
  const removeWidget = useCallback((id) => {
    setWidgets(prevWidgets => prevWidgets.filter(widget => widget.id !== id));
  }, []);

  // Simplified addWidget function - keeping your working logic but cleaner
  const addWidget = useCallback((id, content) => {
    if (isCooldown) return;

    setIsCooldown(true);
    const newWidget = { id: id || Date.now(), content };

    const handleAddition = () => {
      setWidgets(prevWidgets => {
        const currentWidgets = widgetsRef.current;
        let updatedWidgets = [...currentWidgets];

        if (updatedWidgets.length >= MAX_WIDGETS) {
          updatedWidgets = updatedWidgets.slice(1);
          setTimeout(() => {
            setWidgets(currentWidgets => [...currentWidgets, newWidget]);
          }, 1000);
          return updatedWidgets;
        }

        return [...updatedWidgets, newWidget];
      });

      setTimeout(() => setIsCooldown(false), 500);
    };

    // Check if widget exists
    const existingWidget = widgetsRef.current.find(widget => widget.id === id);
    if (existingWidget) {
      removeWidget(id);
      setTimeout(handleAddition, 1000);
    } else {
      handleAddition();
    }
  }, [isCooldown, removeWidget]);

  // Generic widget
  const handleAddWidget = () => {
    const genericContent = <span>Generic Widget {Date.now()}</span>;
    addWidget(null, genericContent);
  };

  // News widget
  const handleAddNewsWidget = () => {
    const newsContent = <span>Latest News {Date.now()}</span>;
    addWidget("news", newsContent);
  };

  // Music Widget - keeping your working logic
  const handleAddMusicWidget = useCallback(() => {
    const client = mqtt.connect('ws://192.168.3.41:9001');
    let debounceTimeout;
    let inactivityTimeout;
    
    let songData = { title: null, artist: null, artwork: null };
    let stableSongData = { title: null, artist: null, artwork: null };

    const arrayBufferToBase64 = (buffer) => {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return window.btoa(binary);
    };

    client.on('connect', () => {
      console.log('Connected to MQTT broker');
      client.subscribe('shairport/#');
    });

    client.on('message', (topic, message) => {
      if (topic === 'shairport/title') {
        songData.title = message.toString();
      }
      if (topic === 'shairport/artist') {
        songData.artist = message.toString();
      }
      if (topic === 'shairport/cover') {
        const base64 = arrayBufferToBase64(message);
        
        if (base64 === 'LS0=') {
          songData.artwork = '/np.webp';
        } else {
          songData.artwork = `data:image/jpeg;base64,${base64}`;
        }
        
        console.log(base64);
      }
      
      clearTimeout(inactivityTimeout);

      if (songData.artwork) {
        clearTimeout(debounceTimeout);
        
        debounceTimeout = setTimeout(() => {
          stableSongData = { ...songData };
          const currentWidgets = widgetsRef.current;
          const musicWidget = currentWidgets.find(widget => widget.id === 'music');

          const existingArtwork = musicWidget?.content?.props?.children?.props?.src;

          if (stableSongData.artwork === existingArtwork) {
            return;
          }

          const musicContent = (
            <div className="flex relative h-full flex-row w-full justify-center items-center">
              <Image
                className="aspect-square rounded"
                height={48}
                width={48}
                src={stableSongData.artwork}
                alt="Album artwork"
              />
              <div className="absolute saturate-200 blur-md -z-10 h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${stableSongData.artwork})` }}></div>
            </div>
          );

          addWidget('music', musicContent);
        }, 2000); 
      }

      inactivityTimeout = setTimeout(() => {
        removeWidget('music'); 
      }, 15000);
    });

    client.on('error', (error) => {
      console.error('MQTT error:', error);
    });

    return () => {
      clearTimeout(debounceTimeout);
      clearTimeout(inactivityTimeout);
      client.end();
    };
  }, [addWidget, removeWidget]);

  useEffect(() => {
    const cleanup = handleAddMusicWidget();
    return cleanup;
  }, [handleAddMusicWidget]);

  // Weather Widget - fixed to prevent constant updates
  const weatherDataRef = useRef(null); // Track last weather data
  
  const handleAddWeatherWidget = useCallback(async () => {
    try {
      const response = await fetch('/api/weather');
      if (!response.ok) {
        throw new Error(`Weather API responded with status: ${response.status}`);
      }

      const weatherData = await response.json();
      const { weather, main } = weatherData;
      const icon = weather[0].icon;
      const temp = Math.round(main.temp);
      const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

      // Create a data signature to compare
      const currentDataSignature = `${icon}-${temp}`;
      console.log(currentDataSignature);

      // If data hasn't changed, don't update
      if (weatherDataRef.current === currentDataSignature) {
        return;
      }
      
      // Update the stored data signature
      weatherDataRef.current = currentDataSignature;

      const weatherContent = (
        <>
          <Image height="48" width="48" src={iconUrl} alt={`Weather: ${weather[0].description}`} />
          <div className="text-lg font-semibold text-center">{temp}°C</div>
        </>
      );

      addWidget('weather', weatherContent);
    } catch (error) {
      console.error('Error creating or updating weather widget:', error);
    }
  }, [addWidget]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleAddWeatherWidget();
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      handleAddWeatherWidget();
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(intervalId);
  }, [handleAddWeatherWidget]);

  return (
    <div className="z-50 w-full h-16 flex justify-evenly">
      <AnimatePresence>
        {widgets.map((widget, index) => (
          <motion.div
            key={widget.id}
            className="flex font-fit overflow-hidden backdrop-blur-xl bg-white/40 text-neutral-800 rounded-[1.25rem] min-w-fit w-1/4 max-w-[11vw] h-full shadow-[0px_4px_6px_-4px_rgba(0,_0,_0,_0.3)] justify-center items-center"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{
              opacity: 0,
              x: index === 0 ? -300 : 0,
              transition: { duration: 0.3 },
            }}
            transition={{ duration: 0.3, type: "spring", stiffness: 250, damping: 20 }}
            layout
          >
            {widget.content}
          </motion.div>
        ))}
      </AnimatePresence>

    </div>
  );
};

export default AppTray;