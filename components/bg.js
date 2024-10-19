import { useEffect, useState } from 'react';
import { startOfDay, differenceInMinutes } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const Background = () => {
  const [backgroundPosition, setBackgroundPosition] = useState(0);
  const [bgTransition, setBgTransition] = useState('none'); // No transition initially
  const [percentageWidth, setPercentageWidth] = useState(0);
  const [gradientString, setGradientString] = useState('linear-gradient(to right, #000, #fff)'); // Default gradient
  const [opacity, setOpacity] = useState(0);
  const timeZone = 'Europe/Stockholm';

  const fetchGradient = async () => {
    try {
      const response = await fetch('/api/bg?type=gradient');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setGradientString(data.gradient);
    } catch (error) {
      console.error('Error fetching gradient data:', error);
      // Set a default or fallback gradient string here if necessary
    }
  };

  // Define calculateBackgroundPosition function
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

  // Define updateBackgroundPosition function
  const updateBackgroundPosition = () => {
    const position = calculateBackgroundPosition();
    setBackgroundPosition(position);
    localStorage.setItem('backgroundPosition', position.toString());
  };

  useEffect(() => {
    fetchGradient().then(() => {
      setOpacity(1);
    });

    const cachedPosition = localStorage.getItem('backgroundPosition');

    if (cachedPosition) {
      setBackgroundPosition(parseFloat(cachedPosition));
    } else {
      updateBackgroundPosition(); // Only run if no cache
    }

    if (cachedPosition) {
      setTimeout(() => {
        setBgTransition('background-position-y 1s ease-in-out');
      }, 100);
    }

    const intervalId = setInterval(updateBackgroundPosition, 1000);

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
