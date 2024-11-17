import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import chroma from "chroma-js";
import { toZonedTime } from 'date-fns-tz';
import { motion } from "framer-motion";
import WeatherCanvas from "@/components/weather"; // Import WeatherCanvas

const STARS_COUNT = 350;
const TIME_ZONE = 'Europe/Stockholm';
const ANIMATION_INTERVAL = 5000;

const Background = ({ backgroundReady, setBackgroundReady }) => {

    const [timeIndices, setTimeIndices] = useState([]);
    const [percentageWidth, setPercentageWidth] = useState(0);
    const [starsOpacity, setStarsOpacity] = useState(1);
    const [isReady, setIsReady] = useState(false);

    const backgroundCanvasRef = useRef(null);
    const starsCanvasRef = useRef(null);
    const animationFrameRef = useRef(null);
    const starsArrayRef = useRef([]);

    // Memoize time conversion function
    const convertTimeToPercentage = useCallback((timeStr) => {
        const tid = new Date(timeStr);
        const time = toZonedTime(tid, TIME_ZONE);
        const minutesSinceMidnight = time.getHours() * 60 + time.getMinutes();
        return parseFloat(((minutesSinceMidnight / 1440) * 100).toFixed(1));
    }, []);

    // Fetch sun data
    useEffect(() => {
        const fetchTimes = async () => {
            try {
                const res = await fetch('/api/bg');
                const sunData = await res.json();

                const perc = [
                    { time: 0, gradient: { color1: "#051937", color2: "#1F2240" } },
                    { time: convertTimeToPercentage(sunData.astronomical_twilight_begin), gradient: { color1: "#051937", color2: "#1F2240" } },
                    { time: convertTimeToPercentage(sunData.nautical_twilight_begin), gradient: { color1: "#051937", color2: "#8E3661" } },
                    { time: convertTimeToPercentage(sunData.civil_twilight_begin), gradient: { color1: "#ad405d", color2: "#E48239" } },
                    { time: convertTimeToPercentage(sunData.sunrise), gradient: { color1: "#71D1FA", color2: "#9c7cc9" } },
                    { time: convertTimeToPercentage(sunData.solar_noon), gradient: { color1: "#38bdf8", color2: "#52caff" } },
                    { time: convertTimeToPercentage(sunData.sunset), gradient: { color1: "#80ACF4", color2: "#CB88BD" } },
                    { time: convertTimeToPercentage(sunData.civil_twilight_end), gradient: { color1: "#6C4771", color2: "#D47E97" } },
                    { time: convertTimeToPercentage(sunData.nautical_twilight_end), gradient: { color1: "#051937", color2: "#8E3661" } },
                    { time: convertTimeToPercentage(sunData.astronomical_twilight_end), gradient: { color1: "#051937", color2: "#1F2240" } },
                ];

                setTimeIndices(perc);
            } catch (error) {
                console.error('Failed to fetch sun data:', error);
            }
        };

        fetchTimes();
    }, [convertTimeToPercentage]);

    // Memoize color lerp function
    const lerpColor = useMemo(() => (color1, color2, t) => {
        return chroma.mix(color1, color2, t).hex();
    }, []);

    // Stars generation function
    const generateStars = useCallback((canvas) => {
        const stars = [];
        for (let i = 0; i < STARS_COUNT; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 1 + 0.5,
                opacity: Math.random() * 0.5 + 0.3
            });
        }
        return stars;
    }, []);

    // Drawing functions
    const drawStars = useCallback((ctx, stars, width, height) => {
        ctx.clearRect(0, 0, width, height);
        stars.forEach(star => {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            ctx.fill();
        });
    }, []);

    const drawSky = useCallback((backgroundCtx, starsCtx, timeFraction, width, height) => {
        if (timeIndices.length === 0) return;

        let currentIndex = timeIndices.findIndex((_, i) =>
            timeIndices[i + 1]?.time > timeFraction * 100 || i === timeIndices.length - 1
        );
        if (currentIndex === -1) currentIndex = timeIndices.length - 1;
        const nextIndex = (currentIndex + 1) % timeIndices.length;

        const progress = (timeFraction * 100 - timeIndices[currentIndex].time) /
            (timeIndices[nextIndex].time - timeIndices[currentIndex].time);

        const { color1: startTop, color2: startBottom } = timeIndices[currentIndex].gradient;
        const { color1: endTop, color2: endBottom } = timeIndices[nextIndex].gradient;

        const gradient = backgroundCtx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, lerpColor(startTop, endTop, progress));
        gradient.addColorStop(1, lerpColor(startBottom, endBottom, progress));

        backgroundCtx.fillStyle = gradient;
        backgroundCtx.fillRect(0, 0, width, height);

        if (timeFraction <= timeIndices[3].time / 100 || timeFraction >= timeIndices[7].time / 100) {
            drawStars(starsCtx, starsArrayRef.current, width, height);
        }

        setIsReady(true);
        setBackgroundReady(true);
    }, [timeIndices, lerpColor, drawStars]);

    // Calculate stars opacity
    const calculateStarsOpacity = useCallback((timeFraction) => {
        if (timeIndices.length < 9) return;

        const fadeInStart = timeIndices[7].time / 100;
        const fadeInEnd = timeIndices[9].time / 100;
        const fadeOutStart = timeIndices[1].time / 100;
        const fadeOutEnd = timeIndices[3].time / 100;

        let opacity = 0;

        if (timeFraction >= fadeInStart && timeFraction <= fadeInEnd) {
            opacity = (timeFraction - fadeInStart) / (fadeInEnd - fadeInStart);
        } else if (timeFraction >= fadeOutStart && timeFraction <= fadeOutEnd) {
            opacity = 1 - (timeFraction - fadeOutStart) / (fadeOutEnd - fadeOutStart);
        } else if (timeFraction > fadeInEnd || timeFraction < fadeOutStart) {
            opacity = 1;
        }

        setStarsOpacity(Math.max(0, Math.min(1, opacity)));
    }, [timeIndices]);

    useEffect(() => {
        const backgroundCanvas = backgroundCanvasRef.current;
        const starsCanvas = starsCanvasRef.current;
        if (!backgroundCanvas || !starsCanvas) return;

        const backgroundCtx = backgroundCanvas.getContext("2d");
        const starsCtx = starsCanvas.getContext("2d");

        const updateAnimation = () => {
            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const timeFraction = (currentTime / 1440).toFixed(4);
        

            drawSky(
                backgroundCtx,
                starsCtx,
                timeFraction,
                backgroundCanvas.width,
                backgroundCanvas.height
            );
            calculateStarsOpacity(timeFraction);

            setTimeout(() => {
                setPercentageWidth(timeFraction * 100);
              }, 1000);
            
        };

        const handleResize = () => {
            const { innerWidth, innerHeight } = window;
            backgroundCanvas.width = innerWidth;
            backgroundCanvas.height = innerHeight;
            starsCanvas.width = innerWidth;
            starsCanvas.height = innerHeight;
            starsArrayRef.current = generateStars(starsCanvas);
            updateAnimation(); // Immediate update after resize
        };

        // Initial setup
        handleResize();

        // Debounced resize handler
        let resizeTimeout;
        const debouncedResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(handleResize, 100); // Small delay to prevent rapid successive updates
        };

        // Set up interval for subsequent updates
        const intervalId = setInterval(updateAnimation, ANIMATION_INTERVAL);
        window.addEventListener("resize", debouncedResize);

        return () => {
            clearInterval(intervalId);
            clearTimeout(resizeTimeout);
            window.removeEventListener("resize", debouncedResize);
        };
    }, [drawSky, calculateStarsOpacity, generateStars]);


    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isReady ? 1 : 0 }}
                transition={{ duration: 1 }}
            >
                <canvas
                    ref={backgroundCanvasRef}
                    className="absolute h-dvh w-full inset-0 z-0"
                />
                <canvas
                    ref={starsCanvasRef}
                    className="absolute h-dvh w-full inset-0 z-10"
                    style={{ opacity: starsOpacity }}
                />
            </motion.div>
            <div
                id="perc"
                style={{ width: `${percentageWidth}%` }}
                className="transition-width duration-500 ease-in-out h-2 backdrop-blur-md bg-white/30 bottom-0 fixed"
            />
        </>
    );
};

export default Background;