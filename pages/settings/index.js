// pages/settings.js
'use client';
import { useState, useEffect } from 'react';
import { WIDGET_METADATA } from '@/utils/widgetRegistry';
import Background from '@/components/bg';

export default function Settings() {
  const [backgroundReady, setBackgroundReady] = useState(false);
  const [config, setConfig] = useState({
    location: { latitude: '', longitude: '' },
    widgets: {}
  });
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Time slots for widget scheduling
  const timeSlots = [
    { id: 'morning', label: 'Morning (6am-12pm)', start: 6, end: 12 },
    { id: 'afternoon', label: 'Afternoon (12pm-6pm)', start: 12, end: 18 },
    { id: 'evening', label: 'Evening (6pm-12am)', start: 18, end: 24 },
    { id: 'night', label: 'Night (12am-6am)', start: 0, end: 6 }
  ];

  // Load settings from your JSON file
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
        }
      } catch (e) {
        console.error('Failed to load config:', e);
      }
    };
    
    loadConfig();
  }, [refreshTrigger]);

  // Get available widgets from metadata
  const availableWidgets = Object.entries(WIDGET_METADATA).map(([id, meta]) => ({
    id,
    name: meta.name,
    description: meta.description
  }));

  const handleInputChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }));
  };

  const toggleWidget = (widgetId, enabled) => {
    setConfig(prev => ({
      ...prev,
      widgets: {
        ...prev.widgets,
        [widgetId]: {
          ...prev.widgets[widgetId],
          enabled: enabled
        }
      }
    }));
  };

  const updateWidgetTimeSlots = (widgetId, selectedSlots) => {
    setConfig(prev => ({
      ...prev,
      widgets: {
        ...prev.widgets,
        [widgetId]: {
          ...prev.widgets[widgetId],
          timeSlots: selectedSlots
        }
      }
    }));
  };

  const handleTimeSlotChange = (widgetId, timeSlot, isChecked) => {
    const currentSlots = config.widgets[widgetId]?.timeSlots || [];
    let newSlots;
    
    if (isChecked) {
      newSlots = [...new Set([...currentSlots, timeSlot])]; // Add and deduplicate
    } else {
      newSlots = currentSlots.filter(slot => slot !== timeSlot);
    }
    
    updateWidgetTimeSlots(widgetId, newSlots);
  };

  const toggleAllTimeSlots = (widgetId, selectAll) => {
    const newSlots = selectAll ? timeSlots.map(slot => slot.id) : [];
    updateWidgetTimeSlots(widgetId, newSlots);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Save to your JSON file via API
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (e) {
      setError('Failed to save settings');
      console.error('Save error:', e);
    }
  };

  const handleReset = async () => {
    try {
      // Reset to defaults via API
      const response = await fetch('/api/config/reset', { method: 'POST' });
      
      if (response.ok) {
        setConfig({
          location: { latitude: '', longitude: '' },
          widgets: {}
        });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      }
    } catch (e) {
      setError('Failed to reset settings');
      console.error('Reset error:', e);
    }
  };

  return (
    <>
      <Background key={refreshTrigger} backgroundReady={backgroundReady} setBackgroundReady={setBackgroundReady} />

      <div className="min-h-screen flex items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="z-50 font-sans text-black bg-white/40 backdrop-blur-2xl rounded-3xl p-6 max-w-4xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
          <h1 className="text-2xl font-bold mb-6">Widget Configuration</h1>

          {error && (
            <div className="mb-4 p-2 bg-red-500/20 text-red-100 rounded text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Location Settings */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Location</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={config.location.latitude}
                    onChange={(e) => handleInputChange('latitude', e.target.value)}
                    className="w-full bg-white placeholder-gray-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="57.6529"
                    min="-90"
                    max="90"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={config.location.longitude}
                    onChange={(e) => handleInputChange('longitude', e.target.value)}
                    className="w-full placeholder-gray-600 bg-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="11.9106"
                    min="-180"
                    max="180"
                  />
                </div>
              </div>
            </div>

            {/* Widget Management */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Widgets</h2>
              <div className="space-y-4">
                {availableWidgets.map(widget => {
                  const widgetConfig = config.widgets[widget.id] || {};
                  const selectedTimeSlots = widgetConfig.timeSlots || [];
                  const isAllSelected = selectedTimeSlots.length === timeSlots.length;
                  
                  return (
                    <div key={widget.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-medium">{widget.name}</div>
                          <div className="text-sm text-gray-600">{widget.description}</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={widgetConfig.enabled ?? true}
                            onChange={(e) => toggleWidget(widget.id, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      {/* Time Slots Selection */}
                      <div className="ml-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Display Times:</span>
                          <button
                            type="button"
                            onClick={() => toggleAllTimeSlots(widget.id, !isAllSelected)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            {isAllSelected ? 'Clear All' : 'Select All'}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {timeSlots.map(slot => (
                            <label key={slot.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={selectedTimeSlots.includes(slot.id)}
                                onChange={(e) => handleTimeSlotChange(widget.id, slot.id, e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm">{slot.label}</span>
                            </label>
                          ))}
                        </div>
                        {selectedTimeSlots.length === 0 && (
                          <div className="text-xs text-gray-500 italic mt-1">Will show all day</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-3 mt-6">
            <button
              type="submit"
              className="py-2 px-6 bg-blue-400 hover:bg-blue-500 rounded-xl font-medium transition-colors"
            >
              {isSaved ? 'Saved!' : 'Save Configuration'}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="py-2 px-6 bg-white/60 hover:bg-white/90 rounded-xl font-medium transition-colors"
            >
              Reset Defaults
            </button>
          </div>
        </form>
      </div>
    </>
  );
}