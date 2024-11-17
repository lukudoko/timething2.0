import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Maximum number of widgets allowed
const MAX_WIDGETS = 4;

const AppTray = () => {
  const [widgets, setWidgets] = useState([]);

  const createWidget = useCallback((content, id) => {
    const newWidget = {
      id: id || Date.now(),
      content,
    };

    setWidgets(prevWidgets => {
      if (prevWidgets.length < MAX_WIDGETS) {
        return [...prevWidgets, newWidget];
      }

      // Remove oldest widget and add new one
      return [...prevWidgets.slice(1), newWidget];
    });
  }, []);

  const removeWidget = useCallback((id) => {
    setWidgets(prevWidgets => prevWidgets.filter(widget => widget.id !== id));
  }, []);

  const createWeatherWidget = useCallback((weatherData) => {
    try {
      const { weather, main } = weatherData;
      const icon = weather[0].icon;
      const temp = Math.round(main.temp);
      const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

      // Check if the widget is already created to prevent unnecessary updates
      const existingWeatherWidget = widgets.find(widget => widget.id === 'weather');
      
      if (existingWeatherWidget) {
        const existingIcon = existingWeatherWidget.content.props.children[0].props.src;
        const existingTemp = existingWeatherWidget.content.props.children[1].props.children[0];
        
        // Only update if icon or temperature has changed
        if (iconUrl !== existingIcon || temp !== parseInt(existingTemp)) {
          removeWidget('weather');
        }
        return;
      }

      const weatherContent = (
        <div className="flex px-2 justify-center items-center max-h-full w-full" id="weather">
          <img 
            className="h-16" 
            src={iconUrl} 
            alt={`Weather: ${weather[0].description}`} 
          />
          <div className="text-xl font-semibold text-center text-zinc-800">
            {temp}°C
          </div>
        </div>
      );

      createWidget(weatherContent, 'weather');
    } catch (error) {
      console.error('Error creating weather widget:', error);
    }
  }, [widgets, createWidget, removeWidget]);

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        const response = await fetch('/api/weather'); // New weather API endpoint
        
        if (!response.ok) {
          throw new Error(`Weather API responded with status: ${response.status}`);
        }

        const data = await response.json();

        // Use the fetched data to create the weather widget
        createWeatherWidget(data);
      } catch (error) {
        console.error('Error fetching weather data:', error);
      }
    };

    fetchWeatherData();
    const intervalId = setInterval(fetchWeatherData, 15 * 60 * 1000); // Refresh every 15 minutes
    return () => clearInterval(intervalId);
  }, [createWeatherWidget]);

  return (
    <div className="z-50 w-full h-16 flex justify-evenly" id="appTray">
      <AnimatePresence>
        {widgets.map(widget => (
          <motion.div
            key={widget.id}
            className="flex font-fit backdrop-blur-md bg-white/20 rounded-md min-w-fit w-1/4 max-w-[11vw] h-full shadow-[rgba(50,_50,_105,_0.15)_0px_2px_5px_0px,_rgba(0,_0,_0,_0.05)_0px_1px_1px_0px] justify-center items-center"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
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
