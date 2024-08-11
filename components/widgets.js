import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AppTray = () => {
  const [widgets, setWidgets] = useState([]);
  const intervalRef = useRef(null);

  const createWidget = (content, id) => {
    const newWidget = {
      id: id || Date.now(), // Use provided ID or generate a new one
      content: content,
    };

    setWidgets(prevWidgets => {
      if (prevWidgets.length < 4) {
        return [...prevWidgets, newWidget];
      } else {
        // Remove the oldest widget and add the new one
        return [...prevWidgets.slice(1), newWidget];
      }
    });
  };

  const fetchWeatherData = async () => {
    try {
      const cacheKey = 'weatherData';
      const cacheExpiry = 15 * 60 * 1000; // 15 minutes in milliseconds
      const currentTime = Date.now();

      const cachedData = JSON.parse(localStorage.getItem(cacheKey));
      if (cachedData && currentTime - cachedData.timestamp < cacheExpiry) {
        console.log("Using cached weather data");
        createWeatherWidget(cachedData.data);
        return;
      }

      const response = await fetch('https://api.openweathermap.org/data/2.5/weather?lat=57.65&lon=11.916&appid=7be8a9d34955926d889f6ce6d3ea87fb&units=metric');
      const data = await response.json();

      const newData = {
        data: data,
        timestamp: currentTime,
      };
      localStorage.setItem(cacheKey, JSON.stringify(newData));

      createWeatherWidget(data);
    } catch (error) {
      console.error('Error fetching or caching weather data:', error);
    }
  };

  const createWeatherWidget = (weatherData) => {
    try {
      const icon = weatherData.weather[0].icon;
      const temp = Math.trunc(weatherData.main.temp);
      const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

      const existingWeatherWidget = widgets.find(widget => widget.id === 'weather');

      if (existingWeatherWidget) {
        const existingIcon = existingWeatherWidget.content.props.children[0].props.src;
        const existingTemp = existingWeatherWidget.content.props.children[1].props.children[0];

        if (iconUrl !== existingIcon || temp !== parseInt(existingTemp)) {
          removeWidget("weather");
          createWidgetWeatherContent(iconUrl, temp);
        }
      } else {
        createWidgetWeatherContent(iconUrl, temp);
      }
    } catch (error) {
      console.error('Error creating weather widget:', error);
    }
  };

  const createWidgetWeatherContent = (iconUrl, temp) => {
    const weatherContent = (
      <div className="flex px-2 justify-center items-center max-h-full w-full" id="weather">
        <img className="h-16" src={iconUrl} alt="Weather Icon" />
        <div className="text-xl font-semibold text-center text-zinc-800">{temp}°C</div>
      </div>
    );
    createWidget(weatherContent, 'weather');
  };

  const removeWidget = (id) => {
    setWidgets(prevWidgets => prevWidgets.filter(widget => widget.id !== id));
  };

  useEffect(() => {
    fetchWeatherData();

    intervalRef.current = setInterval(fetchWeatherData, 15 * 60 * 1000);

    return () => clearInterval(intervalRef.current);
  }, []);

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
              layout={true}
            >
              {widget.content}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
  );
};

export default AppTray;
