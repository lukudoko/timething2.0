'use client';
import { useState, useEffect } from 'react';
import Background from '@/components/bg';

export default function Settings() {
  const [backgroundReady, setBackgroundReady] = useState(false);
  const [coordinates, setCoordinates] = useState({
    latitude: '',
    longitude: ''
  });
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0); // New refresh trigger state

  // Safe JSON parse function
  const safeParse = (jsonString) => {
    try {
      return jsonString ? JSON.parse(jsonString) : {};
    } catch (e) {
      console.error('Failed to parse settings:', e);
      return {};
    }
  };

  // Load saved settings on mount
  useEffect(() => {
    const savedSettings = safeParse(localStorage.getItem('appSettings'));
    setCoordinates({
      latitude: savedSettings.latitude || '',
      longitude: savedSettings.longitude || ''
    });
  }, [refreshTrigger]); // Add refreshTrigger as dependency

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const currentSettings = safeParse(localStorage.getItem('appSettings'));

      const updatedSettings = {
        ...currentSettings,
        latitude: coordinates.latitude.trim() || undefined,
        longitude: coordinates.longitude.trim() || undefined
      };

      localStorage.setItem('appSettings', JSON.stringify(updatedSettings));
      setIsSaved(true);

      // Trigger background refresh
      setRefreshTrigger(prev => prev + 1);

      setTimeout(() => setIsSaved(false), 2000);
    } catch (e) {
      setError('Failed to save settings');
      console.error('Save error:', e);
    }
  };

  const handleReset = () => {
    try {
      const currentSettings = safeParse(localStorage.getItem('appSettings'));
      const { latitude, longitude, ...rest } = currentSettings;
      localStorage.setItem('appSettings', JSON.stringify(rest));
      setCoordinates({ latitude: '', longitude: '' });
      setIsSaved(true);

      // Trigger background refresh
      setRefreshTrigger(prev => prev + 1);

      setTimeout(() => setIsSaved(false), 2000);
    } catch (e) {
      setError('Failed to reset settings');
      console.error('Reset error:', e);
    }
  };

  return (
    <>
      <Background key={refreshTrigger} backgroundReady={backgroundReady} setBackgroundReady={setBackgroundReady} />


      <div className="min-h-screen flex items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="z-50 font-sans text-black bg-white/40 backdrop-blur-2xl rounded-3xl p-6 max-w-md w-full shadow-xl ">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>

          {error && (
            <div className="mb-4 p-2 bg-red-500/20 text-red-100 rounded text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium  mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="0.05"
                value={coordinates.latitude}
                onChange={(e) => setCoordinates({ ...coordinates, latitude: e.target.value })}
                className="w-full bg-white  placeholder-gray-600 rounded-xl px-3 py-2  focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="57.6529"
                min="-90"
                max="90"
              />
            </div>

            <div>
              <label className="block text-sm font-medium  mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="0.05"
                value={coordinates.longitude}
                onChange={(e) => setCoordinates({ ...coordinates, longitude: e.target.value })}
                className="w-full placeholder-gray-600 bg-white rounded-xl px-3 py-2  focus:outline-none focus:ring-2 focus:ring-blue-400"              
                placeholder="11.9106"
                min="-180"
                max="180"
              />
            </div>
          </div>

          <div className="flex justify-evenly  gap-3 mt-6">
            <button
              type="submit"
              className="py-2 px-4 bg-blue-400 hover:bg-blue-500  rounded-xl font-medium transition-colors"
            >
              {isSaved ? 'Saved!' : 'Save'}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="py-2 px-4 bg-white/60 hover:bg-white/90 rounded-xl font-medium transition-colors"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </>
  );
}