// components/DayNightTheme.js
import { useEffect, useRef } from 'react';

const DayNightTheme = () => {
    const intervalRef = useRef(null);

    const fetchDayNightStatus = async () => {
        try {
            const response = await fetch('/api/weather');
            if (!response.ok) return;

            const data = await response.json();
            const isDay = data.isDay;
            if (isDay) {
                document.documentElement.classList.remove('dark');
            } else {
                document.documentElement.classList.add('dark');
            }
        } catch (err) {
            console.error('Day/Night theme fetch error:', err);
        }
    };

    useEffect(() => {
        fetchDayNightStatus();

        intervalRef.current = setInterval(fetchDayNightStatus, 15 * 60 * 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    return null;
};

export default DayNightTheme;