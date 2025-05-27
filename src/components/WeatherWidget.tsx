// src/components/WeatherWidget.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';

// --- Interfaces & Types ---
export interface WeatherWidgetSettings {
  location?: string;
  units?: 'metric' | 'imperial';
  useCurrentLocation?: boolean;
}

interface WeatherWidgetProps {
  settings?: WeatherWidgetSettings;
  id: string; 
}

interface ApiHourlyForecastValue {
  temperature?: number;
  weatherCode?: number;
}
interface ApiHourlyForecastEntry {
  time: string; 
  values: ApiHourlyForecastValue;
}

interface HourlyForecastItem {
  time: string; 
  dt: number; 
  temperature?: number;
  weatherCode?: number;
}

interface TomorrowWeatherData {
  current: {
    time?: string;
    temperature?: number;
    temperatureApparent?: number;
    weatherCode?: number;
    humidity?: number;
    windSpeed?: number;
    windDirection?: number;
  };
  hourly: HourlyForecastItem[];
  locationDisplay: {
    name?: string;
  };
}

// --- Weather Settings Panel (Remains the same as provided) ---
interface WeatherSettingsPanelProps {
  widgetId: string;
  currentSettings: WeatherWidgetSettings | undefined;
  onSave: (newSettings: WeatherWidgetSettings) => void;
}

export const WeatherSettingsPanel: React.FC<WeatherSettingsPanelProps> = ({ widgetId, currentSettings, onSave }) => {
  const [location, setLocation] = useState(currentSettings?.location || '97504 US');
  const [units, setUnits] = useState<'metric' | 'imperial'>(currentSettings?.units || 'imperial');
  const [useCurrentLocation, setUseCurrentLocation] = useState(currentSettings?.useCurrentLocation || false);

  const handleSaveClick = () => {
    onSave({
      location: useCurrentLocation ? undefined : location.trim(),
      units,
      useCurrentLocation
    });
  };

  const locationInputId = `weather-location-${widgetId}`;
  const unitsInputId = `weather-units-${widgetId}`;
  const useCurrentLocationId = `weather-use-current-location-${widgetId}`;

  return (
    <div className="space-y-4 text-primary">
      <div>
        <label htmlFor={useCurrentLocationId} className="flex items-center text-sm font-medium text-secondary mb-2 cursor-pointer">
          <input
            type="checkbox"
            id={useCurrentLocationId}
            checked={useCurrentLocation}
            onChange={(e) => setUseCurrentLocation(e.target.checked)}
            className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-border-interactive rounded mr-2 bg-widget"
          />
          Use My Current Location
        </label>
      </div>
      <div className={useCurrentLocation ? 'opacity-50' : ''}>
        <label htmlFor={locationInputId} className="block text-sm font-medium text-secondary mb-1">
          Manual Location (e.g., 97504 US, Medford OR):
        </label>
        <input
          type="text"
          id={locationInputId}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g., 97504 US or Medford, OR"
          disabled={useCurrentLocation}
          className="mt-1 block w-full px-3 py-2 bg-widget border border-border-interactive rounded-md shadow-sm focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm text-primary disabled:bg-slate-700 disabled:cursor-not-allowed"
        />
         {useCurrentLocation && <p className="text-xs text-secondary mt-1">Manual location disabled.</p>}
      </div>
      <div>
        <label htmlFor={unitsInputId} className="block text-sm font-medium text-secondary mb-1">
          Units:
        </label>
        <select
          id={unitsInputId}
          value={units}
          onChange={(e) => setUnits(e.target.value as 'metric' | 'imperial')}
          className="mt-1 block w-full px-3 py-2 bg-widget border border-border-interactive rounded-md shadow-sm focus:outline-none focus:ring-accent-primary focus:border-accent-primary sm:text-sm text-primary"
        >
          <option value="imperial">Imperial (°F, mph)</option>
          <option value="metric">Metric (°C, kph)</option>
        </select>
      </div>
      <button
        onClick={handleSaveClick}
        className="mt-6 w-full px-4 py-2 bg-accent-primary text-on-accent rounded-md hover:bg-accent-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary focus:ring-offset-dark-surface"
      >
        Save Weather Settings
      </button>
    </div>
  );
};


// --- Main WeatherWidget Component (Enhanced Styling) ---
const WeatherWidget: React.FC<WeatherWidgetProps> = ({ settings }) => {
  const [weatherData, setWeatherData] = useState<TomorrowWeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geoCoordinates, setGeoCoordinates] = useState<string | null>(null);
  const [isRequestingGeo, setIsRequestingGeo] = useState(false);
  const [contentVisible, setContentVisible] = useState(false); // For entry animation

  const API_KEY = process.env.NEXT_PUBLIC_TOMORROW_API_KEY;

  // Helper function to map weather codes to emojis (unchanged)
  const mapTomorrowWeatherCodeToEmoji = (weatherCode?: number): string => {
    if (weatherCode === undefined) return '❓';
    // Using a more compact representation for brevity
    const codeMap: { [key: number]: string } = {
        1000: '☀️', 1100: '☀️', 1101: '🌤️', 1102: '🌥️', 1001: '☁️',
        2000: '🌫️', 2100: '🌫️', 4000: '💧', 4001: '🌧️', 4200: '🌦️',
        4201: '🌧️', 5000: '❄️', 5001: '🌨️', 5100: '🌨️', 5101: '❄️',
        6000: '🧊', 6001: '🧊', 6200: '🧊', 6201: '🧊',
        7000: '🧊', 7101: '🧊', 7102: '🧊', 8000: '⛈️',
    };
    return codeMap[weatherCode] || '🌡️';
  };

  // Helper function to format hour (unchanged)
  const formatHour = (isoTime: string): string => {
    const date = new Date(isoTime);
    return date.toLocaleTimeString(undefined, { hour: 'numeric', hour12: true }).replace(' ', '');
  };

  // Data fetching logic (unchanged)
  const fetchWeatherData = useCallback(async () => {
    if (!API_KEY) {
      setError("API key is missing. Configure NEXT_PUBLIC_TOMORROW_API_KEY.");
      setLoading(false); setContentVisible(false); return;
    }

    let locationToQuery: string | undefined | null = settings?.location;
    if (settings?.useCurrentLocation) {
      if (geoCoordinates) {
        locationToQuery = geoCoordinates;
      } else {
        if (!isRequestingGeo) {
            setError("Could not get current location. Check permissions or enter manually.");
        }
        setLoading(false); setContentVisible(false); return;
      }
    }

    if (!locationToQuery || typeof locationToQuery !== 'string' || locationToQuery.trim() === "") {
      setError("Location not set. Configure it or enable 'Use Current Location'.");
      setLoading(false); setWeatherData(null); setContentVisible(false); return;
    }

    setLoading(true); setError(null); setContentVisible(false); // Hide content for loading animation
    const trimmedLocation = locationToQuery.trim();
    const locationQueryParam = encodeURIComponent(trimmedLocation);
    const unitsQuery = settings?.units || 'imperial';
    const realtimeFields = "temperature,temperatureApparent,weatherCode,humidity,windSpeed,windDirection";
    const hourlyFields = "temperature,weatherCode";

    const realtimeApiUrl = `https://api.tomorrow.io/v4/weather/realtime?location=${locationQueryParam}&units=${unitsQuery}&apikey=${API_KEY}&fields=${realtimeFields}`;
    const hourlyApiUrl = `https://api.tomorrow.io/v4/weather/forecast?location=${locationQueryParam}&timesteps=1h&units=${unitsQuery}&apikey=${API_KEY}&fields=${hourlyFields}`;

    try {
      const [realtimeResponse, hourlyResponse] = await Promise.all([
        fetch(realtimeApiUrl),
        fetch(hourlyApiUrl)
      ]);

      if (!realtimeResponse.ok || !hourlyResponse.ok) {
        let errorMsg = "Failed to fetch weather data.";
        if (!realtimeResponse.ok) {
          const errorData = await realtimeResponse.json();
          errorMsg = `Realtime Error: ${errorData.message || realtimeResponse.statusText}`;
          if (String(errorData.code).startsWith('400')) errorMsg += " - Check location format.";
        } else if (!hourlyResponse.ok) {
          const errorData = await hourlyResponse.json();
          errorMsg = `Hourly Forecast Error: ${errorData.message || hourlyResponse.statusText}`;
           if (String(errorData.code).startsWith('400')) errorMsg += " - Check location format.";
        }
        throw new Error(errorMsg);
      }

      const realtimeData = await realtimeResponse.json();
      const hourlyData = await hourlyResponse.json();

      const processedHourly: HourlyForecastItem[] = hourlyData.timelines?.hourly?.slice(0, 24).map((item: ApiHourlyForecastEntry) => ({
        time: formatHour(item.time),
        dt: new Date(item.time).getTime(),
        temperature: item.values.temperature,
        weatherCode: item.values.weatherCode,
      })) || [];

      let displayName;
      if (realtimeData.location?.name) {
        displayName = realtimeData.location.name;
      } else if (settings?.useCurrentLocation) {
        displayName = "Current Location";
      } else {
        displayName = trimmedLocation; 
      }

      setWeatherData({
        current: realtimeData.data.values,
        hourly: processedHourly,
        locationDisplay: { name: displayName }
      });
      setContentVisible(true); // Show content after data is loaded

    } catch (err: unknown) {
      console.error("Tomorrow.io fetch error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred while fetching weather data.");
      }
      setWeatherData(null);
      setContentVisible(false);
    } finally {
      setLoading(false);
    }
  }, [settings?.location, settings?.units, settings?.useCurrentLocation, API_KEY, geoCoordinates, isRequestingGeo]);

  // Geolocation effect (unchanged)
  useEffect(() => {
    if (settings?.useCurrentLocation) {
      setIsRequestingGeo(true); setError(null); setContentVisible(false);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setGeoCoordinates(`${position.coords.latitude},${position.coords.longitude}`);
            setIsRequestingGeo(false);
          },
          (geoError) => {
            let msg = "Could not get current location.";
            if (geoError.code === geoError.PERMISSION_DENIED) msg = "Location permission denied.";
            else if (geoError.code === geoError.POSITION_UNAVAILABLE) msg = "Location information unavailable.";
            else if (geoError.code === geoError.TIMEOUT) msg = "Getting location timed out.";
            setError(msg + " Enter location manually.");
            setGeoCoordinates(null); setIsRequestingGeo(false); setLoading(false); setContentVisible(false);
          }, { timeout: 10000 }
        );
      } else {
        setError("Geolocation not supported. Enter location manually.");
        setIsRequestingGeo(false); setLoading(false); setContentVisible(false);
      }
    } else {
      setGeoCoordinates(null); setIsRequestingGeo(false);
    }
  }, [settings?.useCurrentLocation]);

  // Data fetching trigger effect (unchanged, but added setContentVisible)
  useEffect(() => {
    if (settings?.useCurrentLocation && (isRequestingGeo || !geoCoordinates)) {
        if (!isRequestingGeo && !geoCoordinates && !error) {
             setError("Waiting for location data or permission...");
        }
        setLoading(false); 
        setContentVisible(false);
        return;
    }
    fetchWeatherData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.location, settings?.units, settings?.useCurrentLocation, geoCoordinates, fetchWeatherData]);


  const unitSymbol = settings?.units === 'metric' ? '°C' : '°F';
  const speedUnit = settings?.units === 'metric' ? 'kph' : 'mph';

  // Enhanced styles for messages and loading states
  const messageCardBaseStyles = "p-6 h-full flex flex-col items-center justify-center text-center rounded-xl transition-all duration-300 ease-in-out";
  const messageCardThemeStyles = "bg-slate-700/60 dark:bg-slate-800/70 backdrop-blur-lg shadow-xl text-slate-200 dark:text-slate-300";
  
  // Loading Spinner
  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center space-y-3">
        <svg className="animate-spin h-8 w-8 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-sm">Loading weather data...</p>
    </div>
  );


  if (isRequestingGeo && settings?.useCurrentLocation && !error) {
    return <div className={`${messageCardBaseStyles} ${messageCardThemeStyles}`}>
        <LoadingSpinner />
        <p className="mt-3 text-sm">Getting current location...</p>
    </div>;
  }
  if (loading && !error) {
    return <div className={`${messageCardBaseStyles} ${messageCardThemeStyles}`}><LoadingSpinner /></div>;
  }
  if (error) {
    return (
      <div className={`${messageCardBaseStyles} ${messageCardThemeStyles} bg-red-500/30 dark:bg-red-700/40 text-red-100 dark:text-red-200`}>
        <div className="mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-300 dark:text-red-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        </div>
        <p className="font-semibold text-base">Weather Update Error</p>
        <p className="text-xs mt-1 mb-4 opacity-90">{error}</p>
        <button
          onClick={() => {
            setError(null); 
            if (settings?.useCurrentLocation && !geoCoordinates) { 
                setIsRequestingGeo(true); 
            } else {
                fetchWeatherData(); 
            }
          }}
          className="mt-2 px-5 py-2 text-xs font-medium bg-slate-50 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-opacity-50"
        >
          Try Again
        </button>
      </div>
    );
  }
  if (!weatherData || !weatherData.current) {
    return <div className={`${messageCardBaseStyles} ${messageCardThemeStyles}`}>No weather data available. Please configure a location or check API key.</div>;
  }

  const { current, hourly, locationDisplay } = weatherData;
  const locationName = locationDisplay?.name || 
                       (settings?.useCurrentLocation && geoCoordinates ? "Current Location" : settings?.location) || 
                       "Selected Location";

  // Animation classes for content
  const contentEntryClass = contentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3";
  const baseTransition = "transition-all duration-500 ease-out";

  return (
    // Main widget container with enhanced styling
    <div
      className={`p-4 sm:p-5 bg-gradient-to-br from-slate-800 via-slate-800/90 to-slate-900 dark:from-slate-800 dark:via-slate-800/95 dark:to-slate-900 backdrop-blur-lg text-slate-100 dark:text-slate-50 rounded-xl h-full flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-300 ease-in-out`}
    >
      {/* Current Weather Section */}
      <div className={`flex-grow flex flex-col mb-4 ${baseTransition} ${contentEntryClass}`} style={{ transitionDelay: contentVisible ? '100ms' : '0ms' }}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <h3
              className="text-base sm:text-lg font-bold leading-tight text-slate-100 dark:text-white whitespace-normal break-words"
              title={locationName}
            >
              {locationName}
            </h3>
          </div>
          <div className="text-5xl sm:text-6xl ml-3 flex-shrink-0 transform transition-transform duration-300 hover:scale-110">
            {mapTomorrowWeatherCodeToEmoji(current.weatherCode)}
          </div>
        </div>

        <div className="text-6xl sm:text-7xl font-light text-sky-300 dark:text-sky-400 mb-1">
          {current.temperature !== undefined ? `${Math.round(current.temperature)}${unitSymbol}` : 'N/A'}
        </div>
        <div className="text-sm text-slate-300 dark:text-slate-400 mb-4">
          {current.temperatureApparent !== undefined && `Feels like ${Math.round(current.temperatureApparent)}${unitSymbol}`}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:text-sm text-slate-300 dark:text-slate-400 mt-auto">
          <p>Humidity: <span className="font-medium text-slate-100 dark:text-white">{current.humidity !== undefined ? `${Math.round(current.humidity)}%` : 'N/A'}</span></p>
          <p>Wind: <span className="font-medium text-slate-100 dark:text-white">{current.windSpeed !== undefined ? `${Math.round(current.windSpeed)} ${speedUnit}` : 'N/A'}</span></p>
        </div>
      </div>

      {/* Hourly Forecast Section */}
      {hourly && hourly.length > 0 && (
        <div className={`mt-auto pt-4 border-t border-slate-700/70 dark:border-slate-600/50 ${baseTransition} ${contentEntryClass}`} style={{ transitionDelay: contentVisible ? '300ms' : '0ms' }}>
          <p className="text-xs font-semibold mb-2.5 px-1 text-slate-300 dark:text-slate-400">Hourly Forecast</p>
          <div className="flex overflow-x-auto space-x-3 pb-2 scrollbar-thin scrollbar-thumb-slate-600 hover:scrollbar-thumb-slate-500 scrollbar-track-transparent scrollbar-thumb-rounded-full">
            {hourly.map((hour, index) => (
              <div
                key={hour.dt}
                className={`flex-shrink-0 w-[70px] text-center p-2.5 bg-slate-700/50 dark:bg-slate-700/60 rounded-lg shadow-lg hover:bg-slate-600/70 dark:hover:bg-slate-600/80 transition-all duration-200 ease-in-out transform hover:scale-105 ${baseTransition} ${contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
                style={{ transitionDelay: contentVisible ? `${400 + index * 50}ms` : '0ms' }}
              >
                <div className="text-xs font-medium text-slate-300 dark:text-slate-400">{hour.time}</div>
                <div className="text-2xl sm:text-3xl my-1.5">{mapTomorrowWeatherCodeToEmoji(hour.weatherCode)}</div>
                <div className="text-sm text-slate-100 dark:text-white">
                  {hour.temperature !== undefined ? `${Math.round(hour.temperature)}${unitSymbol}` : 'N/A'}
                </div>
              </div>
            ))}
            <div className="flex-shrink-0 w-0.5"></div> {/* Spacer */}
          </div>
        </div>
      )}
       {!hourly || hourly.length === 0 && !loading && !error && (
         <div className={`mt-auto pt-3 border-t border-slate-700/50 text-center text-xs text-slate-400 dark:text-slate-500 ${baseTransition} ${contentEntryClass}`} style={{ transitionDelay: contentVisible ? '300ms' : '0ms' }}>
            Hourly forecast data not available.
         </div>
       )}
    </div>
  );
};

export default WeatherWidget;

// Add this to your global CSS (e.g., globals.css or a <style jsx global> tag)
// if you need more complex animations than Tailwind's default.
// However, for this version, I've used Tailwind's transition utilities and opacity/transform.
/*
@keyframes fadeInEntry {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fadeInEntry {
  animation: fadeInEntry 0.5s ease-out forwards;
}
*/
