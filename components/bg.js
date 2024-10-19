import { useEffect, useState } from 'react';
import { startOfDay, differenceInMinutes } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const Background = () => {
  const [backgroundPosition, setBackgroundPosition] = useState(0);
  const [bgTransition, setBgTransition] = useState('none'); // No transition initially
  const [percentageWidth, setPercentageWidth] = useState(0);
  const [gradientString, setGradientString] = useState('');
  const [opacity, setOpacity] = useState(0); // Initial opacity for fade-in effect
  const timeZone = 'Europe/Stockholm'; // CEST timezone

  const fetchGradient = async () => {
    try {
      const response = await fetch('/api/bg?type=gradient');
      const data = await response.json();
      setGradientString(data.gradient);
    } catch (error) {
      console.error('Error fetching gradient data:', error);
    }
  };

  useEffect(() => {
    // Fetch gradient and set initial opacity
    fetchGradient().then(() => {
      setOpacity(1); // Fade in after fetching gradient
    });

    const cachedPosition = localStorage.getItem('backgroundPosition');

    // If there's a cached position, set it without transition
    if (cachedPosition) {
      setBackgroundPosition(parseFloat(cachedPosition));
    } else {
      updateBackgroundPosition(); // Calculate initial position if no cache
    }

    const updateBackgroundPosition = () => {
      const position = calculateBackgroundPosition();
      setBackgroundPosition(position);
      localStorage.setItem('backgroundPosition', position.toString());
    };

    const calculateBackgroundPosition = () => {
      const now = toZonedTime(new Date(), timeZone);
      const startOfToday = startOfDay(now);
      const totalMinutes = differenceInMinutes(now, startOfToday);
      const totalMinutesInDay = 1440;
      const percentage = totalMinutes / totalMinutesInDay;

      const viewportHeight = window.innerHeight;
      const backgroundHeight = 10 * viewportHeight;
      const newPosition = -((backgroundHeight * percentage).toFixed(2));
      setPercentageWidth(percentage * 100);

      return newPosition;
    };

    // After the first render, apply a transition for future updates
    const handleTransition = () => {
      setBgTransition('background-position-y 1s ease-in-out');
    };

    // Trigger transition after initial load
    if (cachedPosition) {
      setTimeout(handleTransition, 100); // Small timeout to allow initial load
    }

    const intervalId = setInterval(updateBackgroundPosition, 1000); // Update every second

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <>
      <div
        className="background-container fixed h-[1000dvh] top-0 left-0 w-screen"
        style={{
          backgroundImage: gradientString,
          backgroundPosition: `center ${backgroundPosition}px`,
          transition: bgTransition,
          opacity: opacity,
        }}
      />
      <div
        id="perc"
        style={{
          width: `${percentageWidth}%`,
        }}
        className="transition-width duration-500 ease-in-out h-2 backdrop-blur-md bg-white/30 bottom-0 fixed"
      />
    </>
  );
};

export default Background;
