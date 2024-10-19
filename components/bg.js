import { useEffect, useState } from 'react';
import { startOfDay, differenceInMinutes } from 'date-fns';
import { toZonedTime  } from 'date-fns-tz';

const Background = () => {
  const [backgroundPosition, setBackgroundPosition] = useState(0);
  const [bgTransition, setBgTransition] = useState('background-position-y 1s ease-in-out');
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

  fetchGradient();


  useEffect(() => {
    const calculateBackgroundPosition = () => {
      const now = toZonedTime (new Date(), timeZone);
      const startOfToday = startOfDay(now);
      const totalMinutes = differenceInMinutes(now, startOfToday);
      const totalMinutesInDay = 1440;
      const percentage = totalMinutes / totalMinutesInDay;

      const viewportHeight = window.innerHeight;
      const backgroundHeight = 10 * viewportHeight;
      const newPosition = -((backgroundHeight * percentage).toFixed(2));
console.log(backgroundHeight);
      setPercentageWidth(percentage * 100);

      return newPosition;

    };


    const updateBackgroundPosition = () => {
      const position = calculateBackgroundPosition();
      setBackgroundPosition(position);
      localStorage.setItem('backgroundPosition', position.toString());
    };

const cachedPosition = localStorage.getItem('backgroundPosition');

if (cachedPosition) {
  setBackgroundPosition(parseFloat(cachedPosition));
  setBgTransition('background-position-y 0s ease-in-out, opacity .5s ease-in-out');
  setOpacity(1);
  setTimeout(() => {
   setBgTransition('background-position-y 1s ease-in-out');
  }, 600); 
} else {
  setOpacity(1);
  updateBackgroundPosition();
}

const now = toZonedTime (new Date(), timeZone);

const percentage = differenceInMinutes(now, startOfDay(now)) / (24 * 60);
if (percentage >= 0.9986 || percentage <= 0.0014) {
  setBgTransition('background-position-y 0s none');
}

const intervalId = setInterval(updateBackgroundPosition,  1000);

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
