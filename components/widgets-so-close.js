import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import mqtt from 'mqtt';

const AppTray = () => {
  const [widgets, setWidgets] = useState([]);
  const widgetsRef = useRef(widgets); // Track the current state
  const [isCooldown, setIsCooldown] = useState(false); // Cooldown state

  const MAX_WIDGETS = 4;

  useEffect(() => {
    widgetsRef.current = widgets;
  }, [widgets]);


  // Function to remove a widget by ID
  const removeWidget = useCallback((id) => {
    setWidgets(prevWidgets => prevWidgets.filter(widget => widget.id !== id));
  }, []);

  // Generalized function to create a widget
  const addWidget = useCallback((id, content) => {
    // Prevent adding a widget during cooldown
    if (isCooldown) return;

    // Activate cooldown
    setIsCooldown(true);

    const newWidget = { id: id || Date.now(), content };

    const handleAddition = () => {
      setWidgets(prevWidgets => {
        // Use widgetsRef to get the current state of widgets
        const currentWidgets = widgetsRef.current;

        let updatedWidgets = [...currentWidgets]; // Start with the latest state

        // If widget limit is reached, remove the oldest widget
        if (updatedWidgets.length >= MAX_WIDGETS) {
          updatedWidgets = updatedWidgets.slice(1); // Remove the oldest widget immediately

          // Schedule the addition of the new widget after a 1-second delay
          setTimeout(() => {
            setWidgets(currentWidgets => [...currentWidgets, newWidget]);
          }, 1000);

          return updatedWidgets; // Return updated widgets immediately after removal
        }

        // If there is space, add the new widget immediately
        return [...updatedWidgets, newWidget];
      });

      // Reset cooldown after a short delay
      setTimeout(() => setIsCooldown(false), 500); // 200ms cooldown
    };

    // Check if the widget already exists by checking widgetsRef
    const existingWidget = widgetsRef.current.find(widget => widget.id === id);
    if (existingWidget) {
      removeWidget(id); // Ensure `removeWidget` is defined and available
      setTimeout(handleAddition, 1000); // Wait for removal before adding the new widget
    } else {
      handleAddition(); // Add directly if no duplicates
    }
  }, [isCooldown, removeWidget]); // `removeWidget` included as a dependency





  // Add a generic widget
  const handleAddWidget = () => {
    const genericContent = (
      <span>Generic Widget {Date.now()}</span>
    );
    addWidget(null, genericContent); // Generic widgets don't need a specific ID
  };


  // Add a news widget
  const handleAddNewsWidget = () => {
    const newsContent = (
      <span>Latest News {Date.now()}</span>
    );
    addWidget("news", newsContent); // Add news widget with specific ID
  };






  ////

  const handleAddMusicWidget = useCallback(() => {
    const client = mqtt.connect('ws://192.168.3.41:9001');
    let debounceTimeout;
    
    // State to store the current song information
    let songData = { title: null, artist: null, artwork: null };
    
    // Store the final stable song data after debounce
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
      client.subscribe('shairport/#'); // Subscribe to relevant topics
    });
  
    client.on('message', (topic, message) => {
      if (topic === 'shairport/title') {
        songData.title = message.toString(); // Update song title
      }
      if (topic === 'shairport/artist') {
        songData.artist = message.toString(); // Update artist
      }
      if (topic === 'shairport/cover') {
        // Convert ArrayBuffer to Base64 and create a data URL
        const base64 = arrayBufferToBase64(message);
        songData.artwork = `data:image/jpeg;base64,${base64}`;
      }
  
      // After receiving all the necessary data (title, artist, artwork)
      if (songData.title && songData.artist && songData.artwork) {
        clearTimeout(debounceTimeout); // Clear any existing debounce timeout
  
        // Debounce: wait until the data has settled
        debounceTimeout = setTimeout(() => {
          stableSongData = { ...songData }; // Store stable data after debounce
  
          // Log out the new song data and current widget for debugging
          console.log('Stable song data:', stableSongData);
  
          const currentWidgets = widgetsRef.current;
          const musicWidget = currentWidgets.find(widget => widget.id === 'music');
  
          if (musicWidget) {
            // Extract the actual title and artist from the widget's React element structure
            const titleElement = musicWidget.content.props.children[1].props.children[0];
            const artistElement = musicWidget.content.props.children[1].props.children[1];
  
            // Ensure we're extracting the text content from the React elements
            const existingTitle = titleElement.props ? titleElement.props.children : titleElement;
            const existingArtist = artistElement.props ? artistElement.props.children : artistElement;
  
            // Debugging log for widget comparison
            console.log('Comparing with current widget:');
            console.log('Existing Title:', existingTitle, 'New Title:', stableSongData.title);
            console.log('Existing Artist:', existingArtist, 'New Artist:', stableSongData.artist);
  
            // If the title and artist are the same, don't update
            if (
              stableSongData.title === existingTitle &&
              stableSongData.artist === existingArtist
            ) {
              console.log('Song is the same, no update needed');
              return; // No need to update if the song hasn't changed
            }
          }
  
          // Log if the widget will be updated
          console.log('New song detected, updating widget:', stableSongData);
  
          // Create or update the music widget
          const musicContent = (
            <div className="flex flex-row w-full justify-stretch items-center">
              <img
                className="h-16 aspect-square rounded"
                src={stableSongData.artwork}
                alt={`${stableSongData.title} album artwork`}
              />
              <div className="flex flex-col px-0.5">
                <div className="font-bold">{stableSongData.title || 'Unknown Title'}</div>
                <div className="text-sm">{stableSongData.artist || 'Unknown Artist'}</div>
              </div>
            </div>
          );
  
          addWidget('music', musicContent); // Add or update the widget
        }, 2000); // Debounce time of 2 seconds
      }
    });
  
    client.on('error', (error) => {
      console.error('MQTT error:', error);
    });
  
    // Cleanup function to disconnect the client
    return () => {
      clearTimeout(debounceTimeout); // Clear timeout on cleanup
      client.end();
    };
  }, [addWidget]);
  


  useEffect(() => {
    const cleanup = handleAddMusicWidget();
    return cleanup; // Ensure cleanup is called on unmount
  }, [handleAddMusicWidget]);









  ////



  const handleAddWeatherWidget = useCallback(async () => {
    try {
      // Use the ref to get the current state of widgets
      const currentWidgets = widgetsRef.current;

      const existingWeatherWidget = currentWidgets.find(widget => widget.id === 'weather');

      // Fetch weather data
      const response = await fetch('/api/weather');
      if (!response.ok) {
        throw new Error(`Weather API responded with status: ${response.status}`);
      }

      const weatherData = await response.json();
      const { weather, main } = weatherData;
      const icon = weather[0].icon;
      const temp = Math.round(main.temp);
      const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

      // Check if we need to update the widget
      if (existingWeatherWidget) {
        const existingIcon = existingWeatherWidget.content.props.children[0].props.src;
        const existingTemp = existingWeatherWidget.content.props.children[1].props.children[0];

        // If data hasn't changed, don't update the widget
        if (iconUrl === existingIcon && temp === parseInt(existingTemp)) {
          return;
        }
      }

      // Create or update the weather widget
      const weatherContent = (
        <>
          <img className="h-12" src={iconUrl} alt={`Weather: ${weather[0].description}`} />
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
    }, 1500); // 2000 milliseconds = 2 seconds
    
  
    return () => clearTimeout(timeoutId); // Cleanup timeout if the component unmounts
  }, []); // Empty dependency array ensures this runs only once on mount
  






  useEffect(() => {
    // Set up an interval for periodic updates
    const intervalId = setInterval(() => {
      handleAddWeatherWidget();
    }, 15 * 60 * 1000  ); // 15 minutes

    // Cleanup the interval on component unmount
    return () => clearInterval(intervalId);
  }, [handleAddWeatherWidget]);


  return (
    <div className="z-50 w-full h-16 flex justify-evenly" id="appTray">
      <AnimatePresence>
        {widgets.map((widget, index) => (
          <motion.div
            key={widget.id}
            className="flex font-fit  overflow-hidden backdrop-blur-md bg-white/20 text-neutral-800 rounded-2xl min-w-fit w-1/4 max-w-[11vw] h-full shadow-[rgba(50,_50,_105,_0.15)_0px_2px_5px_0px,_rgba(0,_0,_0,_0.05)_0px_1px_1px_0px] justify-center items-center"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{
              opacity: 0,
              x: index === 0 ? -300 : 0, // Slide out only for the oldest widget (leftmost)
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
